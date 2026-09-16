import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Operadores del backoffice (gente del equipo con un rol). Todo pasa por los
 * RPCs de la migración 00046 (admin-only + auditoría). Reemplaza al mock
 * "Administración de personal".
 */
export type Operador = {
  userId: string;
  email: string;
  fullName: string;
  roleNames: string[];
  roleCodes: string[];
};

export function useOperadores() {
  return useQuery({
    queryKey: ["backoffice", "operadores"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("backoffice_list_operators");
      if (error) throw error;
      return ((data ?? []) as any[]).map((r) => ({
        userId: r.user_id,
        email: r.email,
        fullName: (r.full_name ?? "").trim() || r.email,
        roleNames: r.role_names ?? [],
        roleCodes: r.role_codes ?? [],
      })) as Operador[];
    },
  });
}

export function useRolesDisponibles() {
  return useQuery({
    queryKey: ["backoffice", "roles-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backoffice_roles")
        .select("code, name")
        .order("name");
      if (error) throw error;
      return (data ?? []) as { code: string; name: string }[];
    },
  });
}

/**
 * Da de alta un operador desde el panel (no necesita registrarse en la app).
 * Si el correo ya existe, solo le asigna el rol. Si es nuevo, lo crea con una
 * contraseña temporal que se devuelve una sola vez para compartírsela.
 */
export function useCrearOperador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { email: string; roleCode: string; nombre?: string }) => {
      const { data, error } = await (supabase as any).rpc("backoffice_create_operator", {
        p_email: v.email,
        p_role_code: v.roleCode,
        p_nombre: v.nombre?.trim() || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        creado: !!row?.creado,
        tempPassword: (row?.temp_password ?? null) as string | null,
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backoffice", "operadores"] }),
  });
}

export function useAsignarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { email: string; roleCode: string }) => {
      const { error } = await (supabase as any).rpc("backoffice_assign_role", {
        p_email: v.email,
        p_role_code: v.roleCode,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backoffice", "operadores"] }),
  });
}

export function useQuitarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { userId: string; roleCode: string }) => {
      const { error } = await (supabase as any).rpc("backoffice_remove_role", {
        p_user_id: v.userId,
        p_role_code: v.roleCode,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backoffice", "operadores"] }),
  });
}
