import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useCuenta } from "./useAccount";

export type Destinatario = {
  accountId: string | null;
  nombre: string;
  alias: string | null;
  esExterna: boolean;
};

/** Método de pago según la pinta del identificador que escribió el usuario. */
export function metodoDe(identificador: string): "alias" | "cbu" | "cvu" {
  const limpio = identificador.trim();
  if (/^\d{22}$/.test(limpio)) return limpio.startsWith("000") ? "cvu" : "cbu";
  return "alias";
}

/** Busca al destinatario por alias, CBU o CVU antes de confirmar. */
export async function buscarDestinatario(identificador: string): Promise<Destinatario | null> {
  const { data, error } = await supabase.rpc("search_account_for_transfer", {
    p_identifier: identificador.trim(),
  });
  if (error) throw error;
  if (!data?.length) return null;

  const fila = data[0];
  return {
    accountId: fila.account_id,
    nombre: fila.holder_name,
    alias: fila.alias,
    esExterna: fila.is_external,
  };
}

/**
 * Mensajes de error de process_transfer.
 *
 * La función devuelve códigos con prefijo (INSUFFICIENT_BALANCE: ...). Se
 * traducen acá para no mostrarle al usuario el texto crudo de la base.
 */
function traducirError(mensaje: string): string {
  const codigo = mensaje.split(":")[0].replace(/^.*\b([A-Z_]{4,})$/, "$1").trim();
  const mapa: Record<string, string> = {
    UNAUTHORIZED: "No tenés permisos sobre esta cuenta.",
    ACCOUNT_NOT_FOUND: "No encontramos tu cuenta.",
    ACCOUNT_NOT_ACTIVE: "Tu cuenta no está activa. Contactá a soporte.",
    INVALID_AMOUNT: "El monto debe ser mayor a cero.",
    SAME_ACCOUNT: "No podés transferirte a tu propia cuenta.",
    INSUFFICIENT_BALANCE: "Saldo insuficiente.",
    MONTHLY_LIMIT_EXCEEDED: "Superás tu límite mensual.",
    DAILY_LIMIT_EXCEEDED: "Superás tu límite diario.",
    PER_TRANSACTION_LIMIT_EXCEEDED: "El monto supera tu límite por operación.",
    LIMITS_NOT_FOUND: "Tu cuenta no tiene límites configurados. Contactá a soporte.",
    DESTINATION_NOT_FOUND: "No encontramos la cuenta de destino.",
  };
  for (const [clave, texto] of Object.entries(mapa)) {
    if (mensaje.includes(clave)) return texto;
  }
  return "No pudimos completar la transferencia. Intentá de nuevo.";
}

export type DatosTransferencia = {
  destinatario: string;
  monto: number;
  concepto?: string;
};

export function useTransferir() {
  const { data: cuenta } = useCuenta();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: DatosTransferencia) => {
      if (!cuenta) throw new Error("ACCOUNT_NOT_FOUND");

      // Toda la validación de saldo, estado y límites vive en la función:
      // hacerla también acá abriría la puerta a que difieran.
      const { data, error } = await supabase.rpc("process_transfer", {
        p_from_account_id: cuenta.id,
        p_to_identifier: datos.destinatario.trim(),
        p_amount: datos.monto,
        p_concept: datos.concepto ?? "",
        p_payment_method: metodoDe(datos.destinatario),
      });

      if (error) throw new Error(traducirError(error.message));
      return data as { success?: boolean; transaction_id?: string; reference_number?: string };
    },
    onSuccess: () => {
      // El saldo y los movimientos cambiaron: se refrescan.
      void queryClient.invalidateQueries({ queryKey: ["cuenta"] });
      void queryClient.invalidateQueries({ queryKey: ["saldo"] });
      void queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      void queryClient.invalidateQueries({ queryKey: ["limites"] });
    },
  });
}
