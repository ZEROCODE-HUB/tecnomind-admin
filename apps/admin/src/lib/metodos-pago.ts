import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/**
 * Métodos de pago para depósitos (tabla payment_methods, migración 00036).
 * Los edita el operador con permiso 'movimientos','update' (lo hace cumplir la
 * RLS pm_manage). El cliente ve solo los activos al depositar.
 */

export type MetodoPago = {
  id: string;
  label: string;
  image_path: string | null;
  bank_name: string | null;
  holder_name: string | null;
  account_number: string | null;
  alias: string | null;
  instructions: string | null;
  is_active: boolean;
  sort_order: number;
};

export type MetodoInput = Omit<MetodoPago, "id">;

export function useMetodosPago() {
  return useQuery({
    queryKey: ["metodos-pago"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_methods")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MetodoPago[];
    },
  });
}

export function useGuardarMetodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id?: string; values: MetodoInput }) => {
      const { id, values } = args;
      if (id) {
        const { error } = await (supabase as any).from("payment_methods").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("payment_methods").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metodos-pago"] }),
  });
}

export function useEliminarMetodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metodos-pago"] }),
  });
}
