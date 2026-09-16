import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Mesa OTC (migración 00039). El operador configura la cotización/comisión/
 * wallet (tabla otc_config, permiso 'otc','update') y resuelve las órdenes con
 * los RPC complete_otc_order / reject_otc_order (server-side; mueven el saldo
 * fiat por el ledger). El cliente solo ve/crea lo suyo (RLS).
 */

export type OtcConfig = {
  asset_code: string;
  label: string;
  unit_rate: number;
  commission_percent: number;
  company_wallet: string | null;
  network: string | null;
  min_amount: number;
  max_amount: number | null;
  is_active: boolean;
};

export type OtcSide = "buy" | "sell";
export type OtcStatus = "pending" | "completed" | "rejected";

export type OtcOrder = {
  id: string;
  reference: string | null;
  txHash: string | null;
  assetCode: string;
  side: OtcSide;
  amountCrypto: number;
  unitRate: number;
  commissionPercent: number;
  commissionAmount: number;
  fiatAmount: number;
  wallet: string | null;
  status: OtcStatus;
  comprobante: string | null;
  clienteNombre: string;
  clienteEmail: string | null;
  clienteNit: string | null;
  comentarioCliente: string | null;
  comentarioOperador: string | null;
  creadaEn: string;
  resueltaEn: string | null;
};

const mapRow = (r: any): OtcOrder => {
  const u = r.users ?? {};
  return {
    id: r.id,
    reference: r.reference ?? null,
    txHash: r.tx_hash ?? null,
    assetCode: r.asset_code ?? "USDT",
    side: r.side,
    amountCrypto: Number(r.amount_crypto),
    unitRate: Number(r.unit_rate),
    commissionPercent: Number(r.commission_percent),
    commissionAmount: Number(r.commission_amount),
    fiatAmount: Number(r.fiat_amount),
    wallet: r.counterparty_wallet ?? null,
    status: r.status,
    comprobante: r.proof_path ?? null,
    clienteNombre: [u.first_name, u.last_name].filter(Boolean).join(" ") || "Cliente",
    clienteEmail: u.email ?? null,
    clienteNit: u.tax_id ?? u.document_number ?? null,
    comentarioCliente: r.user_comment ?? null,
    comentarioOperador: r.admin_comment ?? null,
    creadaEn: r.created_at,
    resueltaEn: r.resolved_at ?? null,
  };
};

/** Catálogo completo de criptos (activas e inactivas) para el admin. */
export function useOtcAssets() {
  return useQuery({
    queryKey: ["otc-assets"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("otc_config")
        .select("*")
        .order("asset_code", { ascending: true });
      if (error) throw error;
      return (data ?? []) as OtcConfig[];
    },
  });
}

/** Alta/edición de una cripto. `isNew` inserta; si no, actualiza por asset_code. */
export function useGuardarOtcAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { isNew: boolean; values: OtcConfig }) => {
      const { isNew, values } = args;
      const row = {
        asset_code: values.asset_code.trim().toUpperCase(),
        label: values.label?.trim() || values.asset_code.trim().toUpperCase(),
        unit_rate: Number(values.unit_rate),
        commission_percent: Number(values.commission_percent ?? 0),
        company_wallet: values.company_wallet?.trim() || null,
        network: values.network?.trim() || null,
        min_amount: Number(values.min_amount ?? 0),
        max_amount: values.max_amount != null && String(values.max_amount) !== "" ? Number(values.max_amount) : null,
        is_active: values.is_active ?? true,
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error } = await (supabase as any).from("otc_config").insert(row);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("otc_config").update(row).eq("asset_code", row.asset_code);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["otc-assets"] }),
  });
}

export function useEliminarOtcAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assetCode: string) => {
      const { error } = await (supabase as any).from("otc_config").delete().eq("asset_code", assetCode);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["otc-assets"] }),
  });
}

export function useOtcOrders(soloPendientes: boolean) {
  return useQuery({
    queryKey: ["otc-orders", soloPendientes ? "pendientes" : "todas"],
    queryFn: async () => {
      let q = (supabase as any)
        .from("otc_orders")
        .select(
          "id, reference, tx_hash, asset_code, side, amount_crypto, unit_rate, commission_percent, commission_amount, fiat_amount, counterparty_wallet, status, proof_path, user_comment, admin_comment, created_at, resolved_at, users:user_id(first_name,last_name,email,tax_id,document_number)"
        )
        .order("created_at", { ascending: false });
      if (soloPendientes) q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapRow) as OtcOrder[];
    },
  });
}

/** Cantidad de operaciones OTC pendientes de resolver (para el panel). */
export function useOtcPendientesCount(enabled: boolean) {
  return useQuery({
    queryKey: ["otc-pendientes-count"],
    enabled,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("otc_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useResolverOtcOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; accion: "completar" | "rechazar"; comentario: string; txHash?: string }) => {
      const fn = args.accion === "completar" ? "complete_otc_order" : "reject_otc_order";
      const payload: any = { p_order_id: args.id, p_admin_comment: args.comentario || null };
      // Al completar, el hash on-chain del envío de cripto (opcional).
      if (args.accion === "completar") payload.p_tx_hash = args.txHash?.trim() || null;
      const { error } = await (supabase.rpc as any)(fn, payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["otc-orders"] });
      qc.invalidateQueries({ queryKey: ["movimientos"] });
    },
  });
}
