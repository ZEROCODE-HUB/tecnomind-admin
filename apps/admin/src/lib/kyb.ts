import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Verificaciones KYB (vinculación persona jurídica).
 *
 * El usuario carga el formulario desde la app (public.kyb_submissions.answers +
 * documentos en el bucket privado kyb-docs). Acá el operador las revisa y las
 * resuelve con la RPC backoffice_approve_kyb (aprueba → verifica + activa cuenta
 * + notifica; rechaza → deja el motivo y el usuario puede reenviar).
 *
 * Los tipos generados del proyecto aún no incluyen estas tablas nuevas; se
 * accede con el cliente sin tipar (mismo criterio que otras piezas nuevas).
 */
const db = supabase as any;

export type KybEstado = "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";

const ESTADO_A_UI: Record<string, KybEstado> = {
  draft: "Pendiente",
  submitted: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export type KybRow = {
  userId: string;
  estado: KybEstado;
  statusRaw: string;
  razonSocial: string;
  nit: string;
  tipoServicio: string;
  volumen: string;
  enviado: string | null;
  notasAdmin: string | null;
};

export type KybDoc = { docType: string; fileName: string | null; signedUrl: string | null };

export type KybDetalle = {
  userId: string;
  estado: KybEstado;
  answers: Record<string, any>;
  enviado: string | null;
  notasAdmin: string | null;
  usuario: { nombre: string; email: string } | null;
  documentos: KybDoc[];
};

// Etiquetas legibles del cuestionario (espejo de la app).
export const KYB_LABELS: Record<string, string> = {
  tipo_solicitud: "Tipo de solicitud",
  tipo_servicio: "Tipo de servicio",
  volumen: "Volumen mensual (COP)",
  razon_social: "Nombre / Razón social",
  nit: "NIT",
  telefono: "Teléfono",
  correo: "Correo electrónico",
  direccion: "Dirección",
  ciudad_pais: "Ciudad / País",
  rl_nombre: "Representante legal — Nombre",
  rl_tipo_doc: "RL — Tipo de documento",
  rl_num_doc: "RL — Número de documento",
  rl_fecha_expedicion: "RL — Fecha de expedición",
  rl_fecha_nacimiento: "RL — Fecha de nacimiento",
  rl_pais_ciudad_nac: "RL — País y ciudad de nacimiento",
  pep_recursos_publicos: "PEP — Maneja recursos públicos",
  pep_poder_publico: "PEP — Ejerce poder público",
  pep_reconocimiento: "PEP — Reconocimiento público",
  pep_vinculo_pep: "PEP — Vínculo con persona expuesta",
  pep_obligaciones_tributarias: "PEP — Obligaciones tributarias en otro país",
  beneficiarios_finales: "Beneficiarios finales (>5%)",
  actividad_economica: "Actividad económica / comercial",
  codigos_ciiu: "Códigos CIIU",
  ingresos_mensuales: "Ingresos mensuales",
  activos_totales: "Activos totales",
  pasivos_totales: "Pasivos totales",
  patrimonio: "Patrimonio",
  origen_fondos: "Origen de fondos",
  decl_antilavado: "Declaración antilavado",
  decl_habeas_data: "Autorización tratamiento de datos",
};

export const KYB_DOC_LABELS: Record<string, string> = {
  doc_id_rl: "Documento de identidad del Representante Legal",
  doc_id_socios: "Documento de identidad de los Socios",
  cert_existencia: "Certificado de Existencia y Representación Legal",
  estados_financieros: "Estados Financieros",
  renta_sociedad: "Declaraciones de Renta de la sociedad",
  renta_socios: "Declaraciones de Renta de los socios",
  composicion_accionaria: "Certificación de composición accionaria",
  contador: "Cédula y tarjeta profesional del contador",
  cert_bancaria: "Certificación Bancaria",
  rut: "Copia RUT",
  rub: "Copia RUB (beneficiarios finales)",
  decl_origen_fondos: "Declaración Juramentada de Origen de Fondos",
  extractos_sociedad: "Extractos Bancarios (6 meses)",
};

const KYB_BUCKET = "kyb-docs";

export function useKybSubmissions() {
  return useQuery({
    queryKey: ["backoffice", "kyb"],
    queryFn: async (): Promise<KybRow[]> => {
      const { data, error } = await db
        .from("kyb_submissions")
        .select("user_id,status,razon_social,nit,tipo_servicio,volumen,submitted_at,admin_notes")
        .order("submitted_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((f) => ({
        userId: f.user_id,
        estado: ESTADO_A_UI[f.status] ?? "Pendiente",
        statusRaw: f.status,
        razonSocial: f.razon_social ?? "—",
        nit: f.nit ?? "—",
        tipoServicio: f.tipo_servicio ?? "—",
        volumen: f.volumen ?? "—",
        enviado: f.submitted_at,
        notasAdmin: f.admin_notes,
      }));
    },
  });
}

export function useKybDetalle(userId: string | undefined) {
  return useQuery({
    queryKey: ["backoffice", "kyb", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<KybDetalle | null> => {
      const { data: sub, error } = await db
        .from("kyb_submissions")
        .select("user_id,status,answers,submitted_at,admin_notes")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!sub) return null;

      // Datos del usuario (nombre/email) desde la vista del backoffice.
      const { data: cli } = await db
        .from("backoffice_clients")
        .select("full_name,email")
        .eq("id", userId!)
        .maybeSingle();

      // Documentos + URL firmada (bucket privado).
      const { data: docs } = await db
        .from("kyb_documents")
        .select("doc_type,file_name,storage_path")
        .eq("user_id", userId!);

      const documentos: KybDoc[] = await Promise.all(
        ((docs ?? []) as any[]).map(async (d) => {
          const { data: signed } = await db.storage.from(KYB_BUCKET).createSignedUrl(d.storage_path, 3600);
          return { docType: d.doc_type, fileName: d.file_name, signedUrl: signed?.signedUrl ?? null };
        }),
      );

      return {
        userId: sub.user_id,
        estado: ESTADO_A_UI[sub.status] ?? "Pendiente",
        answers: sub.answers ?? {},
        enviado: sub.submitted_at,
        notasAdmin: sub.admin_notes,
        usuario: cli ? { nombre: cli.full_name ?? "—", email: cli.email } : null,
        documentos,
      };
    },
  });
}

export function useResolverKyb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { userId: string; aprobar: boolean; notas?: string }) => {
      const { error } = await db.rpc("backoffice_approve_kyb", {
        p_user_id: v.userId,
        p_approve: v.aprobar,
        p_notes: v.notas ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["backoffice", "kyb"] });
      void qc.invalidateQueries({ queryKey: ["backoffice", "clientes"] });
    },
  });
}
