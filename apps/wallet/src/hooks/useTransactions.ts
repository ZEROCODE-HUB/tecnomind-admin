import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Building2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { formatCurrencyARS } from "@/lib/formatters";
import type { DashboardTransaction, Transaction } from "@/types";
import { useCuenta } from "./useAccount";

/** Fila cruda de la vista public.account_movements. */
type Movimiento = {
  transaction_id: string;
  created_at: string;
  completed_at: string | null;
  amount: number;
  concept: string | null;
  payment_method: string | null;
  reference_number: string | null;
  category: string | null;
  transaction_type_name: string | null;
  movement_type: string | null;
  income_amount: number | null;
  expense_amount: number | null;
  status: string | null;
  counterpart_name: string | null;
};

const COLUMNAS =
  "transaction_id, created_at, completed_at, amount, concept, payment_method, reference_number, category, transaction_type_name, movement_type, income_amount, expense_amount, status, counterpart_name";

const esIngreso = (m: Movimiento) => m.movement_type === "income";

/** El ícono depende de si entra o sale, salvo comisiones e impuestos. */
function iconoDe(m: Movimiento) {
  if (m.category === "internal") return Building2;
  return esIngreso(m) ? ArrowDownLeft : ArrowUpRight;
}

function montoConSigno(m: Movimiento) {
  const bruto = esIngreso(m) ? Number(m.income_amount ?? m.amount) : Number(m.expense_amount ?? m.amount);
  return `${esIngreso(m) ? "+ " : "- "}${formatCurrencyARS(Math.abs(bruto))}`;
}

/** "Hoy", "Ayer" o la fecha corta: lo que la UI muestra como agrupador. */
function etiquetaDia(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  const mismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (mismoDia(fecha, hoy)) return "Hoy";
  if (mismoDia(fecha, ayer)) return "Ayer";
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

/** Nombre a mostrar: la contraparte si la hay, si no el tipo de operación. */
const titulo = (m: Movimiento) =>
  m.counterpart_name ?? m.transaction_type_name ?? m.concept ?? "Movimiento";

/**
 * Los tipos de la UI usan `id: number` porque venían de datos mock. Las
 * transacciones reales tienen UUID, así que se numeran por posición y el
 * UUID viaja aparte para quien necesite el detalle.
 */
export type MovimientoUI = Transaction & { transactionId: string; fechaISO: string };

function aTransaction(m: Movimiento, indice: number): MovimientoUI {
  const bruto = esIngreso(m) ? Number(m.income_amount ?? m.amount) : Number(m.expense_amount ?? m.amount);
  return {
    id: indice + 1,
    transactionId: m.transaction_id,
    fechaISO: m.created_at,
    icon: iconoDe(m),
    name: titulo(m),
    category: m.transaction_type_name ?? "Movimiento",
    time: hora(m.created_at),
    amount: montoConSigno(m),
    numericAmount: Math.abs(bruto),
    type: esIngreso(m) ? "income" : "expense",
    dateGroup: etiquetaDia(m.created_at),
  };
}

function aDashboard(m: Movimiento, indice: number): DashboardTransaction {
  return {
    id: indice + 1,
    icon: iconoDe(m),
    title: titulo(m),
    description: `${m.transaction_type_name ?? "Movimiento"} • ${etiquetaDia(m.created_at)}`,
    amount: montoConSigno(m),
    type: esIngreso(m) ? "income" : "expense",
  };
}

/** Últimos movimientos, para el resumen del dashboard. */
export function useMovimientosRecientes(limite = 5) {
  const { data: cuenta } = useCuenta();

  return useQuery({
    queryKey: ["movimientos", "recientes", cuenta?.id, limite],
    enabled: Boolean(cuenta?.id),
    queryFn: async (): Promise<DashboardTransaction[]> => {
      const { data, error } = await supabase
        .from("account_movements")
        .select(COLUMNAS)
        .eq("account_id", cuenta!.id)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (error) throw error;
      return ((data ?? []) as Movimiento[]).map(aDashboard);
    },
  });
}

export type FiltrosMovimientos = {
  desde?: Date;
  hasta?: Date;
  tipo?: "all" | "income" | "expense";
  busqueda?: string;
};

/** Listado completo de movimientos, con los filtros de la pantalla. */
export function useMovimientos(filtros: FiltrosMovimientos = {}) {
  const { data: cuenta } = useCuenta();

  return useQuery({
    queryKey: ["movimientos", "listado", cuenta?.id, filtros],
    enabled: Boolean(cuenta?.id),
    queryFn: async (): Promise<MovimientoUI[]> => {
      let consulta = supabase
        .from("account_movements")
        .select(COLUMNAS)
        .eq("account_id", cuenta!.id)
        .order("created_at", { ascending: false });

      if (filtros.desde) consulta = consulta.gte("created_at", filtros.desde.toISOString());
      if (filtros.hasta) consulta = consulta.lte("created_at", filtros.hasta.toISOString());
      if (filtros.tipo && filtros.tipo !== "all") consulta = consulta.eq("movement_type", filtros.tipo);

      const { data, error } = await consulta;
      if (error) throw error;

      let filas = (data ?? []) as Movimiento[];

      // La búsqueda se hace en cliente: mezcla contraparte, concepto y
      // referencia, que en la vista son columnas distintas.
      const texto = filtros.busqueda?.trim().toLowerCase();
      if (texto) {
        filas = filas.filter((m) =>
          [m.counterpart_name, m.concept, m.reference_number, m.transaction_type_name]
            .some((campo) => campo?.toLowerCase().includes(texto)),
        );
      }

      return filas.map(aTransaction);
    },
  });
}
