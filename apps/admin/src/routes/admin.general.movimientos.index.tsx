import { createFileRoute } from "@tanstack/react-router";

import { MovimientosTabla } from "@/components/movimientos-tabla";

export const Route = createFileRoute("/admin/general/movimientos/")({
  component: Page,
});

function Page() {
  return (
    <MovimientosTabla
      titulo="Todos los movimientos"
      descripcion="Historial completo de transacciones de la plataforma."
      grupo="todos"
    />
  );
}
