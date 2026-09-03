import { createFileRoute } from "@tanstack/react-router";

import { MovimientosTabla } from "@/components/movimientos-tabla";

export const Route = createFileRoute("/admin/general/movimientos/comisiones")({
  component: Page,
});

function Page() {
  return (
    <MovimientosTabla
      titulo="Comisiones"
      descripcion="Comisiones cobradas por la plataforma."
      grupo="comisiones"
    />
  );
}
