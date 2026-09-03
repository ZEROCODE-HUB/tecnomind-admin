import { createFileRoute } from "@tanstack/react-router";

import { SeccionPendiente } from "@/components/seccion-pendiente";

export const Route = createFileRoute("/admin/otc/registro/")({
  component: Page,
});

function Page() {
  return (
    <SeccionPendiente
      titulo="Registro de operaciones OTC"
      descripcion="Operaciones de cambio entre cripto y pesos."
      motivo="La operatoria OTC pertenece al producto con cripto (tecnomind-otc), que tiene su propia base. En el producto fiat esta sección queda sin datos."
    />
  );
}
