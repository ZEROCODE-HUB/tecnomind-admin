import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/administracion/usuarios")({
  component: Layout,
});

/**
 * Antes había dos pestañas: "Administración de personal" (100% mock, con 3
 * roles hardcodeados que no coincidían con los reales) y "Roles y permisos"
 * (real). Se dejó solo la real; el índice redirige a ella. Sin pestañas,
 * porque es una sola pantalla.
 */
function Layout() {
  return <Outlet />;
}
