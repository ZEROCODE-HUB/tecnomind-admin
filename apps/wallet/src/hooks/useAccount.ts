import { useQuery } from "@tanstack/react-query";

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
