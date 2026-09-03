import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Datos de clientes para el backoffice.
 *
 * La base guarda los estados en inglés y en minúscula (`pending`,
 * `verified`, ...) porque así los escriben los CHECK y las funciones. La
 * UI del prototipo trabaja con etiquetas en castellano. La traducción
 * vive acá y en un solo sentido cada una, para que ninguna pantalla
 * invente su propio vocabulario.
 *
 * Todas las escrituras pasan por RPC: la migración 00026 revocó el
 * UPDATE directo sobre users y accounts (ver 00018) y expuso funciones
 * SECURITY DEFINER que verifican el permiso y auditan.
 */

// ─────────────────────────────────────────────────────────────
// Estados
// ─────────────────────────────────────────────────────────────

export type EstadoVerificacion = "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";
export type EstadoCumplimiento = "Pendiente" | "En revisión" | "Pasa" | "No pasa";
export type EstadoCuenta = "Pendiente de habilitación" | "Activa" | "Bloqueada" | "Suspendida" | "Cerrada";
export type ResultadoLista = "Pendiente" | "Sin coincidencia" | "Coincidencia" | "En revisión";

export const ESTADOS_VERIFICACION: EstadoVerificacion[] = [
  "Pendiente",
  "En revisión",
  "Aprobada",
  "Rechazada",
];
export const ESTADOS_CUMPLIMIENTO: EstadoCumplimiento[] = [
  "Pendiente",
  "En revisión",
  "Pasa",
  "No pasa",
];
export const RESULTADOS_LISTA: ResultadoLista[] = [
  "Pendiente",
  "Sin coincidencia",
  "Coincidencia",
  "En revisión",
];

const VERIFICACION_A_UI: Record<string, EstadoVerificacion> = {
  pending: "Pendiente",
  in_review: "En revisión",
  verified: "Aprobada",
  rejected: "Rechazada",
  // Heredado de Magnate; se muestra como pendiente hasta que se revise.
  suspended: "Pendiente",
};
const VERIFICACION_A_DB: Record<EstadoVerificacion, string> = {
  Pendiente: "pending",
  "En revisión": "in_review",
  Aprobada: "verified",
  Rechazada: "rejected",
};

const CUMPLIMIENTO_A_UI: Record<string, EstadoCumplimiento> = {
  pending: "Pendiente",
  in_review: "En revisión",
  pass: "Pasa",
  fail: "No pasa",
};
const CUMPLIMIENTO_A_DB: Record<EstadoCumplimiento, string> = {
  Pendiente: "pending",
  "En revisión": "in_review",
  Pasa: "pass",
  "No pasa": "fail",
};

const CUENTA_A_UI: Record<string, EstadoCuenta> = {
  active: "Activa",
  blocked: "Bloqueada",
  suspended: "Suspendida",
  closed: "Cerrada",
};
const CUENTA_A_DB: Record<EstadoCuenta, string> = {
  Activa: "active",
  Bloqueada: "blocked",
  Suspendida: "suspended",
  Cerrada: "closed",
  // Un cliente sin cuenta todavía no tiene estado que escribir; se manda
  // 'active' solo si alguien lo habilita explícitamente.
  "Pendiente de habilitación": "active",
};

const LISTA_A_UI: Record<string, ResultadoLista> = {
  pending: "Pendiente",
  clear: "Sin coincidencia",
  match: "Coincidencia",
  in_review: "En revisión",
};
const LISTA_A_DB: Record<ResultadoLista, string> = {
  Pendiente: "pending",
  "Sin coincidencia": "clear",
  Coincidencia: "match",
  "En revisión": "in_review",
};

/** Color del badge según el texto del estado, sea cual sea la dimensión. */
export function tonePorEstado(estado: string): "neutral" | "success" | "warn" | "danger" {
  if (/aprobad|pasa|activa|validado|sin coincidencia|activo/i.test(estado)) return "success";
  if (/rechaz|no pasa|bloque|coincidencia|fallid|inconsist/i.test(estado)) return "danger";
  if (/pendiente|revisión|revision|suspend/i.test(estado)) return "warn";
  return "neutral";
}

// ─────────────────────────────────────────────────────────────
// Formato
// ─────────────────────────────────────────────────────────────

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

export const formatARS = (v: number | null | undefined) => pesos.format(v ?? 0);

export const formatFecha = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("es-AR") : "—";

export const formatFechaHora = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** 20-12345678-9 a partir de los 11 dígitos guardados. */
export function formatCuit(valor: string | null | undefined) {
  if (!valor) return "—";
  const d = valor.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}` : valor;
}

export const formatDocumento = (valor: string | null | undefined) =>
  valor ? valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "—";

// ─────────────────────────────────────────────────────────────
// Clientes
// ─────────────────────────────────────────────────────────────

export type Cliente = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  tipoDocumento: string;
  documento: string;
  cuit: string;
  pais: string;
  fechaRegistro: string;
  estadoVerificacion: EstadoVerificacion;
  estadoCumplimiento: EstadoCumplimiento;
  estadoCuenta: EstadoCuenta;
  observaciones: string;
  scoreKyc: number | null;
  proveedorKyc: string | null;
  cvu: string | null;
  cbu: string | null;
  alias: string | null;
  saldo: number;
  motivoEstadoCuenta: string | null;
  esOperador: boolean;
};

type FilaCliente = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string;
  document_type: string | null;
  document_number: string;
  tax_id: string;
  country_code: string | null;
  verification_status: string | null;
  role: string;
  created_at: string | null;
  cvu: string | null;
  cbu: string | null;
  alias: string | null;
  balance: number | null;
  account_status: string | null;
  account_status_reason: string | null;
  compliance_status: string | null;
  compliance_notes: string | null;
  kyc_score: number | null;
  kyc_provider: string | null;
  is_operator: boolean | null;
};

const CAMPOS_CLIENTE =
  "id, full_name, email, phone, document_type, document_number, tax_id, country_code, " +
  "verification_status, role, created_at, cvu, cbu, alias, balance, account_status, " +
  "account_status_reason, compliance_status, compliance_notes, kyc_score, kyc_provider, is_operator";

function aCliente(f: FilaCliente): Cliente {
  return {
    id: f.id,
    nombre: f.full_name ?? "—",
    email: f.email,
    telefono: f.phone,
    tipoDocumento: f.document_type ?? "DNI",
    documento: f.document_number,
    cuit: f.tax_id,
    pais: f.country_code ?? "AR",
    fechaRegistro: f.created_at ?? "",
    estadoVerificacion: VERIFICACION_A_UI[f.verification_status ?? "pending"] ?? "Pendiente",
    estadoCumplimiento: CUMPLIMIENTO_A_UI[f.compliance_status ?? "pending"] ?? "Pendiente",
    // Sin cuenta creada el cliente todavía no está habilitado a operar.
    estadoCuenta: f.account_status
      ? (CUENTA_A_UI[f.account_status] ?? "Activa")
      : "Pendiente de habilitación",
    observaciones: f.compliance_notes ?? "",
    scoreKyc: f.kyc_score,
    proveedorKyc: f.kyc_provider,
    cvu: f.cvu,
    cbu: f.cbu,
    alias: f.alias,
    saldo: Number(f.balance ?? 0),
    motivoEstadoCuenta: f.account_status_reason,
    // El rol del backoffice no vive en users.role sino en
    // backoffice_user_roles; la vista ya resuelve la marca (ver 00030).
    esOperador: Boolean(f.is_operator),
  };
}

/**
 * Padrón de clientes.
 *
 * `habilitada` permite no pedirlo cuando el rol no tiene acceso: sin
 * permiso el RLS devuelve una lista vacía, y una lista vacía se lee como
 * "no hay clientes" en vez de "no podés verlos".
 */
export function useClientes(habilitada = true) {
  return useQuery({
    queryKey: ["backoffice", "clientes"],
    enabled: habilitada,
    queryFn: async (): Promise<Cliente[]> => {
      const { data, error } = await supabase
        .from("backoffice_clients")
        .select(CAMPOS_CLIENTE)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as FilaCliente[]).map(aCliente);
    },
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ["backoffice", "clientes", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Cliente | null> => {
      const { data, error } = await supabase
        .from("backoffice_clients")
        .select(CAMPOS_CLIENTE)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data ? aCliente(data as unknown as FilaCliente) : null;
    },
  });
}

/** Invalida todo lo que depende del padrón tras una escritura. */
function useInvalidarClientes() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["backoffice", "clientes"] });
    void qc.invalidateQueries({ queryKey: ["backoffice", "resumen"] });
  };
}

export function useSetVerificacion() {
  const invalidar = useInvalidarClientes();
  return useMutation({
    mutationFn: async (v: { userId: string; estado: EstadoVerificacion; notas?: string }) => {
      const { error } = await supabase.rpc("backoffice_set_verification", {
        p_user_id: v.userId,
        p_status: VERIFICACION_A_DB[v.estado],
        p_notes: v.notas ?? "",
      });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export function useSetEstadoCuenta() {
  const invalidar = useInvalidarClientes();
  return useMutation({
    mutationFn: async (v: { userId: string; estado: EstadoCuenta; motivo?: string }) => {
      const { error } = await supabase.rpc("backoffice_set_account_status", {
        p_user_id: v.userId,
        p_status: CUENTA_A_DB[v.estado],
        p_reason: v.motivo ?? "",
      });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

export function useSetCumplimiento() {
  const invalidar = useInvalidarClientes();
  return useMutation({
    mutationFn: async (v: { userId: string; estado: EstadoCumplimiento; notas?: string }) => {
      const { error } = await supabase.rpc("backoffice_set_compliance", {
        p_user_id: v.userId,
        p_status: CUMPLIMIENTO_A_DB[v.estado],
        p_notes: v.notas ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

/** Guarda solo las observaciones, sin mover el estado de cumplimiento. */
export function useSetObservaciones() {
  const invalidar = useInvalidarClientes();
  return useMutation({
    mutationFn: async (v: { userId: string; estadoActual: EstadoCumplimiento; notas: string }) => {
      const { error } = await supabase.rpc("backoffice_set_compliance", {
        p_user_id: v.userId,
        p_status: CUMPLIMIENTO_A_DB[v.estadoActual],
        p_notes: v.notas,
      });
      if (error) throw error;
    },
    onSuccess: invalidar,
  });
}

// ─────────────────────────────────────────────────────────────
// Listas restrictivas
// ─────────────────────────────────────────────────────────────

export type Lista = { code: string; name: string };

export type Chequeo = {
  listaCode: string;
  listaNombre: string;
  resultado: ResultadoLista;
  detalle: string;
  fecha: string | null;
};

export function useListas() {
  return useQuery({
    queryKey: ["backoffice", "listas"],
    // El catálogo no cambia durante una sesión.
    staleTime: Infinity,
    queryFn: async (): Promise<Lista[]> => {
      const { data, error } = await supabase
        .from("compliance_lists")
        .select("code, name")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Chequeos de un cliente, completados con las listas que todavía no se
 * corrieron: la pantalla siempre muestra las cinco.
 */
export function useChequeos(userId: string | undefined) {
  const listasQuery = useListas();
  const listas = listasQuery.data;

  return useQuery({
    queryKey: ["backoffice", "chequeos", userId],
    enabled: Boolean(userId) && Boolean(listas),
    queryFn: async (): Promise<Chequeo[]> => {
      const { data, error } = await supabase
        .from("compliance_list_checks")
        .select("list_code, result, detail, checked_at")
        .eq("user_id", userId!);
      if (error) throw error;

      const porCodigo = new Map((data ?? []).map((c) => [c.list_code, c]));
      return (listas ?? []).map((l) => {
        const hecho = porCodigo.get(l.code);
        return {
          listaCode: l.code,
          listaNombre: l.name,
          resultado: hecho ? (LISTA_A_UI[hecho.result] ?? "Pendiente") : "Pendiente",
          detalle: hecho?.detail ?? "",
          fecha: hecho?.checked_at ?? null,
        };
      });
    },
  });
}

/**
 * Todos los chequeos de todos los clientes, agrupados por cliente.
 *
 * El listado necesita, por fila, cuántas coincidencias tiene y cómo
 * salió PEP. Traerlos por cliente serían N consultas; son pocos datos y
 * entran en una sola.
 */
export function useChequeosPorCliente() {
  return useQuery({
    queryKey: ["backoffice", "chequeos"],
    queryFn: async (): Promise<Map<string, Chequeo[]>> => {
      const [checks, listas] = await Promise.all([
        supabase.from("compliance_list_checks").select("user_id, list_code, result, detail, checked_at"),
        supabase.from("compliance_lists").select("code, name"),
      ]);
      if (checks.error) throw checks.error;
      if (listas.error) throw listas.error;

      const nombre = new Map((listas.data ?? []).map((l) => [l.code, l.name]));
      const porCliente = new Map<string, Chequeo[]>();
      for (const c of checks.data ?? []) {
        const lista = porCliente.get(c.user_id) ?? [];
        lista.push({
          listaCode: c.list_code,
          listaNombre: nombre.get(c.list_code) ?? c.list_code,
          resultado: LISTA_A_UI[c.result] ?? "Pendiente",
          detalle: c.detail,
          fecha: c.checked_at,
        });
        porCliente.set(c.user_id, lista);
      }
      return porCliente;
    },
  });
}

export function useSetChequeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      userId: string;
      listaCode: string;
      resultado: ResultadoLista;
      detalle?: string;
    }) => {
      const { error } = await supabase.rpc("backoffice_set_list_check", {
        p_user_id: v.userId,
        p_list_code: v.listaCode,
        p_result: LISTA_A_DB[v.resultado],
        p_detail: v.detalle ?? "",
      });
      if (error) throw error;
    },
    // Se invalida el prefijo, no la clave del cliente: así también se
    // refresca el agregado que consume el listado.
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["backoffice", "chequeos"] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Errores
// ─────────────────────────────────────────────────────────────

/**
 * Traduce lo que devuelve PostgREST a algo accionable. 42501 lo levantan
 * a propósito las funciones del backoffice cuando falta el permiso.
 */
export function mensajeError(error: unknown): string {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return "Ocurrió un error inesperado.";
  if (e.code === "42501" || e.message?.includes("Sin permiso")) {
    return "Tu rol no tiene permiso para esta acción.";
  }
  if (e.code === "P0002") return "No se encontró el registro.";
  return e.message ?? "Ocurrió un error inesperado.";
}
