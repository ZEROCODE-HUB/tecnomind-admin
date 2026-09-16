import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TabLayout, type Tab } from "@/components/tab-layout";

export const Route = createFileRoute("/admin/general/movimientos")({
  
  component: MovimientosLayout,
});

const tabs: Tab[] = [
  { label: "Todos los movimientos", to: "/admin/general/movimientos" },
  { label: "Depósitos", to: "/admin/general/movimientos/depositos" },
  { label: "Retiros", to: "/admin/general/movimientos/retiros" },
  { label: "Cobro de comisiones", to: "/admin/general/movimientos/comisiones" },
  // Quitados (no aplican a este producto / eran mock): Impuestos, Pagos con
  // tarjeta, Pagos QR, Cobros QR. Las rutas siguen por URL.
];

function MovimientosLayout() {
  return (
    <TabLayout tabs={tabs}>
      <Outlet />
    </TabLayout>
  );
}
