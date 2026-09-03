import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/pagos/comprobantes")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Comprobantes"
      descripcion="Carga y validación de comprobantes de pago."
      motivo="Depende del circuito de pagos internacionales, que todavía no está modelado en la base."
    />
  );
}
