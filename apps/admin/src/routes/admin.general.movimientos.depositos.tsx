import { createFileRoute } from "@tanstack/react-router";

import { MovimientosTabla } from "@/components/movimientos-tabla";

export const Route = createFileRoute("/admin/general/movimientos/depositos")({
  component: Page,
});

function Page() {
  return (
    <MovimientosTabla
      titulo="Depósitos"
      descripcion="Ingresos de dinero a las cuentas de los clientes."
      grupo="depositos"
    />
  );
}
