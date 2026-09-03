import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/notificaciones")({
  component: NotificacionesLayout,
  
});

function NotificacionesLayout() {
  return <Outlet />;
}
