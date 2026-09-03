import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/pagos/solicitudes/")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Solicitudes de pago"
      descripcion="Pagos internacionales solicitados por los clientes."
      motivo="El circuito de pagos internacionales todavía no tiene tablas en la base: hace falta definir el flujo (solicitud, comprobante, aprobación) antes de conectarlo."
    />
  );
}
