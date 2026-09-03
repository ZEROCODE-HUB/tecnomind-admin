import { createFileRoute } from "@tanstack/react-router";

import { MovimientosTabla } from "@/components/movimientos-tabla";

export const Route = createFileRoute("/admin/general/movimientos/retiros")({
  component: Page,
});

function Page() {
  return (
    <MovimientosTabla
      titulo="Retiros y pagos"
      descripcion="Salidas de dinero de las cuentas de los clientes."
      grupo="retiros"
    />
  );
}
