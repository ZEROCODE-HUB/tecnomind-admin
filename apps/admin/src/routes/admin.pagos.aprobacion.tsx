import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/pagos/aprobacion")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Aprobación de pagos"
      descripcion="Decisión de aprobación o rechazo de cada operación."
      motivo="Depende del circuito de pagos internacionales, que todavía no está modelado en la base."
    />
  );
}
