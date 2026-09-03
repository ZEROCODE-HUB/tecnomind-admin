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
    },
  });
}
