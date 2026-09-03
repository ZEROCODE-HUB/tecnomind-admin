import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/comercios")({
  component: ComerciosLayout,
  
});

function ComerciosLayout() {
  return (
    <div className="space-y-4">
      <Outlet />
    </div>
  );
}
