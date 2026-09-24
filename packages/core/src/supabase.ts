import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type TecnoMindClient = SupabaseClient<Database>;

/**
 * Crea el cliente de Supabase tipado contra el esquema real.
 *
 * Cada app pasa sus propias variables porque Vite las inyecta en build y
 * no se pueden leer desde un paquete compartido.
 */
export function createTecnoMindClient(url: string, anonKey: string): TecnoMindClient {
  if (!url || !anonKey) {
    throw new Error(
      "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env y completalos.",
    );
  }

  // La service_role key nunca debe llegar al navegador: saltea todo el RLS.
  // Es un error de configuración lo bastante grave como para no dejarlo pasar.
  if (anonKey.includes("service_role")) {
    throw new Error("Se pasó una service_role key al cliente del navegador. Usá la anon key.");
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Lock de auth NO bloqueante. El lock por defecto (Navigator LockManager)
      // ESPERA el candado; si otra pestaña/instancia lo retiene y no lo libera
      // (o la pestaña quedó en segundo plano), el refresh de token queda colgado
      // y las queries se quedan "cargando para siempre" (se arreglaba recargando).
      // Con `ifAvailable` coordina cuando puede y, si no, ejecuta igual — nunca
      // espera indefinidamente.
      lock: (name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        if (typeof navigator === "undefined" || !navigator.locks?.request) return fn();
        return navigator.locks.request(name, { ifAvailable: true }, () => fn());
      },
    },
  });
}
