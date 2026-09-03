import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/general/movimientos/pagos-tarjeta")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Pagos con tarjeta"
      descripcion="Operaciones liquidadas con tarjeta."
      motivo="No hay integración con adquirente ni tabla de pagos con tarjeta. La sección queda lista para cuando se defina el proveedor."
    />
  );
}
