import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Configuración de seguridad de acceso de la app cliente.
 *
 * Verificación de dispositivo: al entrar desde un dispositivo nuevo, la app
 * pide un OTP por correo. Hoy el canal de correo no entrega (ver migración
 * 00035), así que se puede prender/apagar desde acá — global o por cliente —
 * mientras se termina de configurar el envío. Todo pasa por RPCs SECURITY
 * DEFINER (migración 00043) que verifican permiso y auditan.
 */

// ── Global ────────────────────────────────────────────────────

export function useDeviceVerificationGlobal() {
  return useQuery({
    queryKey: ["seguridad", "device-verification", "global"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("backoffice_get_device_verification_global");
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useSetDeviceVerificationGlobal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await (supabase as any).rpc("backoffice_set_device_verification_global", {
        p_enabled: enabled,
      });
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["seguridad", "device-verification", "global"] }),
  });
}
