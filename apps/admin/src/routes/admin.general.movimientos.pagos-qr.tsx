import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/general/movimientos/pagos-qr")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Pagos QR"
      descripcion="Pagos realizados escaneando un código QR."
      motivo="La app genera códigos QR, pero todavía no registra el pago como un tipo de transacción propio: se contabiliza como transferencia. Hace falta un tipo de operación específico antes de poder listarlos acá."
    />
  );
}
