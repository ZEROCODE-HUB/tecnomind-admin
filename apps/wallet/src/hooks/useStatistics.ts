import { useQuery } from "@tanstack/react-query";
import { differenceInDays, eachDayOfInterval, eachWeekOfInterval, format } from "date-fns";
import { es } from "date-fns/locale";

import { supabase } from "@/lib/supabase";
import { useCuenta } from "./useAccount";

export type PuntoGrafico = { date: string; value: number; fullDate: Date };

export type Resumen = {
  income: number;
  expenses: number;
  incomeChange: number;
  expensesChange: number;
  balance: number;
  balanceChange: number;
};

type Fila = { created_at: string; income_amount: number | null; expense_amount: number | null };

/** Buckets del gráfico según el largo del rango: horas, días o semanas. */
function bucketsDe(desde: Date, hasta: Date): { fechas: Date[]; formato: string } {
  const dias = differenceInDays(hasta, desde);
  if (dias <= 1) {
    return {
      fechas: Array.from({ length: 24 }, (_, i) => {
        const d = new Date(desde);
        d.setHours(i, 0, 0, 0);
        return d;
      }),
      formato: "HH:mm",
    };
  }
  if (dias <= 14) {
    return { fechas: eachDayOfInterval({ start: desde, end: hasta }), formato: "dd MMM" };
  }
  return { fechas: eachWeekOfInterval({ start: desde, end: hasta }), formato: "dd MMM" };
}

const mismoBucket = (a: Date, b: Date, porHora: boolean) =>
  porHora
    ? a.toDateString() === b.toDateString() && a.getHours() === b.getHours()
    : a.toDateString() === b.toDateString();

async function traerMovimientos(accountId: string, desde: Date, hasta: Date): Promise<Fila[]> {
  const { data, error } = await supabase
    .from("account_movements")
    .select("created_at, income_amount, expense_amount")
    .eq("account_id", accountId)
    .eq("status", "completed")
    .gte("created_at", desde.toISOString())
    .lte("created_at", hasta.toISOString())
    .order("created_at");

  if (error) throw error;
  return (data ?? []) as Fila[];
}

const neto = (filas: Fila[]) =>
  filas.reduce((t, f) => t + Number(f.income_amount ?? 0) - Number(f.expense_amount ?? 0), 0);

/**
 * Estadísticas del rango pedido, calculadas sobre los movimientos reales.
 *
 * Antes venían de una función que generaba una onda con seno y coseno: se ve
 * bien pero no dice nada. La variación porcentual se compara contra el
 * período inmediatamente anterior de la misma duración.
 */
export function useEstadisticas(desde: Date | null, hasta: Date | null) {
  const { data: cuenta } = useCuenta();
  const habilitado = Boolean(cuenta?.id && desde && hasta);

  return useQuery({
    queryKey: ["estadisticas", cuenta?.id, desde?.toISOString(), hasta?.toISOString()],
    enabled: habilitado,
    queryFn: async (): Promise<{ chartData: PuntoGrafico[]; resumen: Resumen }> => {
      const inicio = desde!;
      const fin = hasta!;
      const duracion = fin.getTime() - inicio.getTime();
      const inicioAnterior = new Date(inicio.getTime() - duracion);

      const [actual, anterior] = await Promise.all([
        traerMovimientos(cuenta!.id, inicio, fin),
        traerMovimientos(cuenta!.id, inicioAnterior, inicio),
      ]);

      const ingresos = actual.reduce((t, f) => t + Number(f.income_amount ?? 0), 0);
      const egresos = actual.reduce((t, f) => t + Number(f.expense_amount ?? 0), 0);
      const ingresosPrev = anterior.reduce((t, f) => t + Number(f.income_amount ?? 0), 0);
      const egresosPrev = anterior.reduce((t, f) => t + Number(f.expense_amount ?? 0), 0);

      // Sin período anterior con qué comparar, la variación es 0 y no
      // infinito: mostrar "+∞%" no le sirve a nadie.
      const variacion = (hoy: number, antes: number) =>
        antes === 0 ? 0 : ((hoy - antes) / antes) * 100;

      const { fechas, formato } = bucketsDe(inicio, fin);
      const porHora = differenceInDays(fin, inicio) <= 1;

      // El gráfico muestra el saldo a lo largo del rango: se parte del saldo
      // actual y se descuenta hacia atrás el neto de cada bucket.
      const saldoFinal = cuenta!.balance;
      const netoPorBucket = fechas.map((f) =>
        neto(actual.filter((m) => mismoBucket(new Date(m.created_at), f, porHora))),
      );

      const saldos: number[] = [];
      let acumulado = saldoFinal;
      for (let i = netoPorBucket.length - 1; i >= 0; i--) {
        saldos[i] = acumulado;
        acumulado -= netoPorBucket[i];
      }

      const chartData: PuntoGrafico[] = fechas.map((f, i) => ({
        date: format(f, formato, { locale: es }),
        value: Math.max(0, saldos[i] ?? saldoFinal),
        fullDate: f,
      }));

      return {
        chartData,
        resumen: {
          income: ingresos,
          expenses: egresos,
          incomeChange: variacion(ingresos, ingresosPrev),
          expensesChange: variacion(egresos, egresosPrev),
          balance: ingresos - egresos,
          balanceChange: variacion(ingresos - egresos, ingresosPrev - egresosPrev),
        },
      };
    },
  });
}
