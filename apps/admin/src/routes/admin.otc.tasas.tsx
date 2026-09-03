import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/otc/tasas")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Tasas y montos OTC"
      descripcion="Control manual de tasas aplicadas y montos finales."
      motivo="La operatoria OTC pertenece al producto con cripto (tecnomind-otc), que tiene su propia base. En el producto fiat esta sección queda sin datos."
    />
  );
}
