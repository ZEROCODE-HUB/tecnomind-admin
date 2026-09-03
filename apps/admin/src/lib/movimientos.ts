import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Movimientos del backoffice, sobre la vista backoffice_transactions
 * (migración 00027).
 *
 * La vista ya resuelve el tipo, las cuentas y ambas contrapartes; acá
 * solo se filtra, se pagina y se traduce al vocabulario de la UI.
 */

export type EstadoMovimiento = "APROBADO" | "EN PROGRESO" | "RECHAZADO" | "PENDIENTE";

const ESTADO_A_UI: Record<string, EstadoMovimiento> = {
  completed: "APROBADO",
  processing: "EN PROGRESO",
  pending: "PENDIENTE",
  failed: "RECHAZADO",
  cancelled: "RECHAZADO",
  reversed: "RECHAZADO",
};

export function toneMovimiento(estado: EstadoMovimiento): "success" | "warn" | "danger" {
  if (estado === "APROBADO") return "success";
  if (estado === "RECHAZADO") return "danger";
  return "warn";
}

/**
 * Agrupaciones de la UI -> códigos de transaction_types.
 *
 * `transferencia` junta las dos patas porque process_transfer crea una
 * transacción por lado: el operador quiere ver la operación, no la
 * partida contable.
 */
export const GRUPOS = {
  todos: null,
  depositos: ["deposit", "recharge"],
  retiros: ["transfer_out", "payment"],
  transferencias: ["transfer_in", "transfer_out"],
  comisiones: ["commission"],
  reembolsos: ["refund"],
} as const;

export type Grupo = keyof typeof GRUPOS;

export type Movimiento = {
  id: string;
  referencia: string;
  tipo: string;
  tipoCode: string | null;
  categoria: string | null;
  monto: number;
  comision: number;
  neto: number;
  moneda: string;
  concepto: string | null;
  metodo: string | null;
  estado: EstadoMovimiento;
  motivoFallo: string | null;
  fecha: string;
  fechaCompletado: string | null;
  origenNombre: string | null;
  origenEmail: string | null;
  origenDocumento: string | null;
  origenCuit: string | null;
  origenCvu: string | null;
  origenAlias: string | null;
  destinoNombre: string | null;
  destinoEmail: string | null;
  destinoDocumento: string | null;
  destinoCuit: string | null;
  destinoCvu: string | null;
  destinoAlias: string | null;
};

const CAMPOS =
  "id, reference_number, created_at, completed_at, amount, commission_amount, net_amount, " +
  "currency, concept, payment_method, status, failure_reason, type_code, type_name, " +
  "type_category, from_cvu, from_alias, from_user_name, from_user_email, from_user_document, " +
  "from_user_tax_id, to_cvu, to_alias, to_user_name, to_user_email, to_user_document, to_user_tax_id";

type Fila = Record<string, unknown>;

function aMovimiento(f: Fila): Movimiento {
  const s = (k: string) => (f[k] as string | null) ?? null;
  const n = (k: string) => Number((f[k] as number | null) ?? 0);
  return {
    id: f.id as string,
    referencia: s("reference_number") ?? "—",
    tipo: s("type_name") ?? "Otro",
    tipoCode: s("type_code"),
    categoria: s("type_category"),
    monto: n("amount"),
    comision: n("commission_amount"),
    neto: n("net_amount"),
    moneda: s("currency") ?? "ARS",
    concepto: s("concept"),
    metodo: s("payment_method"),
    estado: ESTADO_A_UI[s("status") ?? ""] ?? "PENDIENTE",
    motivoFallo: s("failure_reason"),
    fecha: s("created_at") ?? "",
    fechaCompletado: s("completed_at"),
    origenNombre: s("from_user_name"),
    origenEmail: s("from_user_email"),
    origenDocumento: s("from_user_document"),
    origenCuit: s("from_user_tax_id"),
    origenCvu: s("from_cvu"),
    origenAlias: s("from_alias"),
    destinoNombre: s("to_user_name"),
    destinoEmail: s("to_user_email"),
    destinoDocumento: s("to_user_document"),
    destinoCuit: s("to_user_tax_id"),
    destinoCvu: s("to_cvu"),
    destinoAlias: s("to_alias"),
  };
}

export function useMovimientos(grupo: Grupo = "todos", limite = 200) {
  return useQuery({
    queryKey: ["backoffice", "movimientos", grupo, limite],
    queryFn: async (): Promise<Movimiento[]> => {
      let q = supabase
        .from("backoffice_transactions")
        .select(CAMPOS)
        .order("created_at", { ascending: false })
        .limit(limite);

      const codigos = GRUPOS[grupo];
      if (codigos) q = q.in("type_code", codigos as unknown as string[]);

      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as unknown as Fila[]).map(aMovimiento);
    },
  });
}

/** Movimientos de un cliente concreto, esté en el origen o en el destino. */
export function useMovimientosDeCliente(userId: string | undefined, limite = 50) {
  return useQuery({
    queryKey: ["backoffice", "movimientos", "cliente", userId, limite],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Movimiento[]> => {
      const { data, error } = await supabase
        .from("backoffice_transactions")
        .select(CAMPOS + ", from_user_id, to_user_id")
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return ((data ?? []) as unknown as Fila[]).map(aMovimiento);
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Tablero
// ─────────────────────────────────────────────────────────────

/**
 * Contadores de la portada.
 *
 * `null` NO es cero: significa que el rol no tiene permiso sobre ese
 * bloque y la funcion de la base lo devuelve vacio a proposito (ver
 * migracion 00031). Mostrar 0 seria afirmar algo falso.
 */
export type Resumen = {
  clientesTotal: number | null;
  clientesPendientes: number | null;
  clientesEnRevision: number | null;
  cumplimientoPendiente: number | null;
  cuentasBloqueadas: number | null;
  saldoTotal: number | null;
  movimientosHoy: number | null;
  movimientosPendientes: number | null;
  volumenHoy: number | null;
};

/** null se conserva; el resto se normaliza a numero. */
const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export function useResumen() {
  return useQuery({
    queryKey: ["backoffice", "resumen"],
    queryFn: async (): Promise<Resumen> => {
      const { data, error } = await supabase.rpc("backoffice_dashboard");
      if (error) throw error;
      const f = (data ?? [])[0];
      return {
        clientesTotal: num(f?.clientes_total),
        clientesPendientes: num(f?.clientes_pendientes),
        clientesEnRevision: num(f?.clientes_en_revision),
        cumplimientoPendiente: num(f?.cumplimiento_pendiente),
        cuentasBloqueadas: num(f?.cuentas_bloqueadas),
        saldoTotal: num(f?.saldo_total),
        movimientosHoy: num(f?.movimientos_hoy),
        movimientosPendientes: num(f?.movimientos_pendientes),
        volumenHoy: num(f?.volumen_hoy),
      };
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Estadísticas
// ─────────────────────────────────────────────────────────────

export type PuntoSerie = {
  dia: string;
  etiqueta: string;
  ingresos: number;
  egresos: number;
  /** Transferencias entre cuentas de la plataforma: ni entran ni salen. */
  internas: number;
  cantidad: number;
};

/** Serie diaria de ingresos y egresos de los últimos `dias`. */
export function useSerieDiaria(dias: number) {
  return useQuery({
    queryKey: ["backoffice", "serie", dias],
    queryFn: async (): Promise<PuntoSerie[]> => {
      const { data, error } = await supabase.rpc("backoffice_daily_flow", { p_days: dias });
      if (error) throw error;
      return (data ?? []).map((f) => ({
        dia: f.dia,
        // Etiqueta corta para el eje: el día completo no entra.
        etiqueta: new Date(`${f.dia}T00:00:00`).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
        }),
        ingresos: Number(f.ingresos ?? 0),
        internas: Number(f.internas ?? 0),
        egresos: Number(f.egresos ?? 0),
        cantidad: Number(f.cantidad ?? 0),
      }));
    },
  });
}

export type Indicadores = {
  operaciones: number;
  volumen: number;
  ticketPromedio: number;
  comisiones: number;
  clientesOperando: number;
  /** null si el rol no puede ver el padrón de clientes. */
  altas: number | null;
  operacionesFallidas: number;
};

export function useIndicadores(dias: number) {
  return useQuery({
    queryKey: ["backoffice", "indicadores", dias],
    queryFn: async (): Promise<Indicadores> => {
      const { data, error } = await supabase.rpc("backoffice_indicators", { p_days: dias });
      if (error) throw error;
      const f = (data ?? [])[0];
      return {
        operaciones: Number(f?.operaciones ?? 0),
        volumen: Number(f?.volumen ?? 0),
        ticketPromedio: Number(f?.ticket_promedio ?? 0),
        comisiones: Number(f?.comisiones ?? 0),
        clientesOperando: Number(f?.clientes_operando ?? 0),
        altas: f?.altas == null ? null : Number(f.altas),
        operacionesFallidas: Number(f?.operaciones_fallidas ?? 0),
      };
    },
  });
}
