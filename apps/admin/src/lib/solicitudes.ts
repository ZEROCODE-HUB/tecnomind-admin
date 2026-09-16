import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Solicitudes de fondeo (depósitos/retiros) — tabla funding_requests
 * (migración 00036). El operador las aprueba/rechaza con los RPC
 * approve_/reject_*_request (server-side; mueven el saldo por el ledger).
 */

export type FundingKind = "deposit" | "withdrawal";
export type FundingStatus = "pending" | "approved" | "rejected";

export type Solicitud = {
  id: string;
  kind: FundingKind;
  amount: number;
  status: FundingStatus;
  clienteNombre: string;
  clienteEmail: string | null;
  metodo: string | null;
  destino: Record<string, any> | null;
  comprobante: string | null;
  comentarioCliente: string | null;
  comentarioOperador: string | null;
  creadaEn: string;
};

const mapRow = (r: any): Solicitud => {
  const u = r.users ?? {};
  return {
    id: r.id,
    kind: r.kind,
    amount: Number(r.amount),
    status: r.status,
    clienteNombre: [u.first_name, u.last_name].filter(Boolean).join(" ") || "Cliente",
    clienteEmail: u.email ?? null,
    metodo: r.payment_methods?.label ?? null,
    destino: r.destination ?? null,
    comprobante: r.proof_path ?? null,
    comentarioCliente: r.user_comment ?? null,
    comentarioOperador: r.admin_comment ?? null,
    creadaEn: r.created_at,
  };
};

export function useSolicitudes(soloPendientes: boolean) {
  return useQuery({
    queryKey: ["solicitudes", soloPendientes ? "pendientes" : "todas"],
    queryFn: async () => {
      let q = (supabase as any)
        .from("funding_requests")
        .select(
          "id, kind, amount, status, destination, proof_path, user_comment, admin_comment, created_at, users:user_id(first_name,last_name,email), payment_methods:payment_method_id(label)"
        )
        .order("created_at", { ascending: false });
      if (soloPendientes) q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapRow) as Solicitud[];
    },
  });
}

/** Cantidad de depósitos/retiros pendientes de aprobación (para el panel). */
export function useFundingPendientesCount(enabled: boolean) {
  return useQuery({
    queryKey: ["funding-pendientes-count"],
    enabled,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("funding_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useResolverSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      kind: FundingKind;
      accion: "aprobar" | "rechazar";
      comentario: string;
    }) => {
      const { id, kind, accion, comentario } = args;
      const fn =
        accion === "aprobar"
          ? kind === "deposit"
            ? "approve_deposit_request"
            : "approve_withdrawal_request"
          : kind === "deposit"
            ? "reject_deposit_request"
            : "reject_withdrawal_request";
      const { error } = await (supabase.rpc as any)(fn, {
        p_request_id: id,
        p_admin_comment: comentario || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitudes"] });
      qc.invalidateQueries({ queryKey: ["movimientos"] });
    },
  });
}
