import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TabLayout, type Tab } from "@/components/tab-layout";

export const Route = createFileRoute("/admin/comercios/apis")({
  component: Layout,
  
});

const tabs: Tab[] = [
  { label: "Usuarios", to: "/admin/comercios/apis" },
  { label: "Endpoints", to: "/admin/comercios/apis/endpoints" },
  { label: "Restricciones", to: "/admin/comercios/apis/restricciones" },
];

function Layout() {
  return (
    <TabLayout tabs={tabs}>
      <Outlet />
    </TabLayout>
  );
}
