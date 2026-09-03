import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/general/movimientos/impuestos")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Impuestos"
      descripcion="Retenciones e impuestos aplicados a los movimientos."
      motivo="El cálculo de retenciones (ingresos brutos, débitos y créditos) todavía no está implementado en la base: no hay percepciones registradas para mostrar."
    />
  );
}
