import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Límites de transacción (mensual / diario / por operación).
 *
 * Global: valor por defecto para todos (app_config). Al guardarlo se aplica a
 * todos los usuarios salvo los que tengan un límite personalizado.
 * Por usuario: override marcado con account_limits.is_custom.
 *
 * Todo pasa por RPCs SECURITY DEFINER (migración 00060) que verifican permiso
 * (configuracion/usuarios) y auditan.
 */

export interface Limites {
  mensual: number;
  diario: number;
  por_operacion: number;
}

export interface LimitesUsuario extends Limites {
  is_custom: boolean;
}

// ── Global ────────────────────────────────────────────────────

export function useLimitsGlobal() {
  return useQuery({
    queryKey: ["limites", "global"],
    queryFn: async (): Promise<Limites> => {
      const { data, error } = await (supabase as any).rpc("backoffice_get_limits_global");
      if (error) throw error;
      return {
        mensual: Number(data?.mensual ?? 0),
        diario: Number(data?.diario ?? 0),
        por_operacion: Number(data?.por_operacion ?? 0),
      };
    },
  });
}

export function useSetLimitsGlobal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (l: Limites) => {
      const { error } = await (supabase as any).rpc("backoffice_set_limits_global", {
        p_mensual: l.mensual,
        p_diario: l.diario,
        p_por_operacion: l.por_operacion,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["limites"] });
    },
  });
}

// ── Por usuario ───────────────────────────────────────────────

export function useLimitsUser(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["limites", "user", userId],
    enabled: !!userId,
    queryFn: async (): Promise<LimitesUsuario | null> => {
      const { data, error } = await (supabase as any).rpc("backoffice_get_limits_user", {
        p_user_id: userId,
      });
      if (error) throw error;
      if (!data) return null;
      return {
        mensual: Number(data.mensual ?? 0),
        diario: Number(data.diario ?? 0),
        por_operacion: Number(data.por_operacion ?? 0),
        is_custom: Boolean(data.is_custom),
      };
    },
  });
}

export function useSetLimitsUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { userId: string; limites: Limites }) => {
      const { error } = await (supabase as any).rpc("backoffice_set_limits_user", {
        p_user_id: args.userId,
        p_mensual: args.limites.mensual,
        p_diario: args.limites.diario,
        p_por_operacion: args.limites.por_operacion,
      });
      if (error) throw error;
    },
    onSuccess: (_d, args) => {
      qc.invalidateQueries({ queryKey: ["limites", "user", args.userId] });
    },
  });
}

export function useResetLimitsUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await (supabase as any).rpc("backoffice_reset_limits_user", {
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ["limites", "user", userId] });
    },
  });
}
