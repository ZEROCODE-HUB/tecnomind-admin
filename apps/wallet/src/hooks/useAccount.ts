import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { formatCurrencyARS } from "@/lib/formatters";
import type { BalanceData } from "@/types";

export type Cuenta = {
  id: string;
  cbu: string;
  cvu: string;
  alias: string;
  balance: number;
  status: string;
  currency: string;
};

/**
 * Cuenta principal del usuario.
 *
 * El RLS ya limita las filas a las suyas, así que no hace falta filtrar por
 * user_id: pedir la cuenta primaria alcanza.
 */
export function useCuenta() {
  return useQuery({
    queryKey: ["cuenta"],
    queryFn: async (): Promise<Cuenta | null> => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, cbu, cvu, alias, balance, status, account_types(currency)")
        .eq("is_primary", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const tipo = data.account_types as { currency: string } | null;
      return {
        id: data.id,
        cbu: data.cbu,
        cvu: data.cvu,
        alias: data.alias,
        balance: Number(data.balance ?? 0),
        status: data.status ?? "active",
        currency: tipo?.currency ?? "ARS",
      };
    },
  });
}

/**
 * Saldo con la variación del día, en la forma que espera la UI.
 *
 * La variación sale de los movimientos completados de hoy, no de un campo
 * guardado: cualquier valor persistido se desincroniza.
 */
export function useSaldo() {
  const cuenta = useCuenta();

  const variacion = useQuery({
    queryKey: ["saldo", "variacion-hoy", cuenta.data?.id],
    enabled: Boolean(cuenta.data?.id),
    queryFn: async (): Promise<number> => {
      const desdeMedianoche = new Date();
      desdeMedianoche.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("account_movements")
        .select("income_amount, expense_amount")
        .eq("account_id", cuenta.data!.id)
        .eq("status", "completed")
        .gte("created_at", desdeMedianoche.toISOString());

      if (error) throw error;
      return (data ?? []).reduce(
        (total, m) => total + Number(m.income_amount ?? 0) - Number(m.expense_amount ?? 0),
        0,
      );
    },
  });

  const disponible = cuenta.data?.balance ?? 0;
  const cambio = variacion.data ?? 0;

  const saldo: BalanceData = {
    available: disponible,
    formatted: formatCurrencyARS(disponible),
    todayChange: cambio,
    todayChangeFormatted: `${cambio >= 0 ? "+ " : "- "}${formatCurrencyARS(Math.abs(cambio))}`,
  };

  return {
    saldo,
    cuenta: cuenta.data ?? null,
    isLoading: cuenta.isLoading || variacion.isLoading,
    error: cuenta.error ?? variacion.error,
  };
}

/** Límites operativos de la cuenta, para la pantalla de perfil y transferencias. */
export function useLimites() {
  const { data: cuenta } = useCuenta();

  return useQuery({
    queryKey: ["limites", cuenta?.id],
    enabled: Boolean(cuenta?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_limits")
        .select("monthly_limit, monthly_spent, monthly_available, daily_limit, daily_spent, per_transaction_limit")
        .eq("account_id", cuenta!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        mensual: Number(data.monthly_limit ?? 0),
        mensualGastado: Number(data.monthly_spent ?? 0),
        mensualDisponible: Number(data.monthly_available ?? 0),
        diario: Number(data.daily_limit ?? 0),
        diarioGastado: Number(data.daily_spent ?? 0),
        porOperacion: Number(data.per_transaction_limit ?? 0),
      };
    },
  });
}

/**
 * Código QR estático de la cuenta.
 *
 * Lo crea `create_user_bank_account()` al dar de alta al usuario y su
 * `qr_data` es el JSON que debe viajar dentro del QR (cvu, cbu, alias y
 * account_id). No se arma en el cliente: así el que escanea y el que
 * comparte hablan del mismo formato.
 */
export function useQrCuenta() {
  const { data: cuenta } = useCuenta();

  return useQuery({
    queryKey: ["qr", cuenta?.id],
    enabled: Boolean(cuenta?.id),
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("qr_codes")
        .select("qr_data")
        .eq("account_id", cuenta!.id)
        .eq("qr_type", "static")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data?.qr_data ?? null;
    },
  });
}

/**
 * Comprueba si un alias está libre.
 *
 * La respuesta la da la base (`alias_disponible`), no el cliente: acá no
 * hay forma de saber qué aliases existen sin poder leer las cuentas
 * ajenas, y eso es justo lo que el RLS impide.
 */
export function useVerificarAlias() {
  return useMutation({
    mutationFn: async (alias: string): Promise<{ disponible: boolean; motivo: string | null }> => {
      const { data, error } = await supabase.rpc("alias_disponible", { p_alias: alias });
      if (error) throw error;
      const fila = (data ?? [])[0];
      return {
        disponible: Boolean(fila?.disponible),
        motivo: fila?.motivo ?? null,
      };
    },
  });
}

/**
 * Guarda el alias nuevo.
 *
 * Es un UPDATE directo y no una función: 00018 dejó `GRANT UPDATE (alias)`
 * al titular justamente para esto, y la base se encarga del resto —
 * registra el historial y sincroniza el QR de la cuenta por trigger.
 */
export function useCambiarAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cuentaId, alias }: { cuentaId: string; alias: string }) => {
      const { error } = await supabase
        .from("accounts")
        .update({ alias: alias.toLowerCase().trim() })
        .eq("id", cuentaId);

      // La constraint UNIQUE es la que decide de verdad: entre la
      // verificación y el guardado alguien pudo tomar el alias.
      if (error?.code === "23505") {
        throw new Error("Ese alias acaba de ser tomado. Probá con otro.");
      }
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cuenta"] });
      void queryClient.invalidateQueries({ queryKey: ["qr"] });
    },
  });
}
