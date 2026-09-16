import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/general/usuarios")({
  component: UsuariosLayout,
});

/**
 * Antes tenía pestañas (Personas físicas / jurídicas / usuarios con cuenta /
 * carga de comisiones). Todas menos "Personas físicas" eran mock o quedaron
 * fuera del producto, así que ya no hay pestañas: la sección es una sola
 * pantalla (Personas físicas, que trae su propio encabezado).
 */
function UsuariosLayout() {
  return <Outlet />;
}
