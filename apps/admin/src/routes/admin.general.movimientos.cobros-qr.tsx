import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/general/movimientos/cobros-qr")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Cobros QR"
      descripcion="Cobros recibidos mediante código QR."
      motivo="La app genera códigos QR, pero todavía no registra el cobro como un tipo de transacción propio: se contabiliza como transferencia. Hace falta un tipo de operación específico antes de poder listarlos acá."
    />
  );
}
