import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Antes acá vivía "Administración de personal": una lista de operadores 100%
 * mock (datos y roles falsos). Se retiró; el índice redirige a "Roles y
 * permisos", la pantalla real. La gestión de operadores real (asignar un rol
 * de backoffice a una persona) todavía no existe como UI.
 */
export const Route = createFileRoute("/admin/administracion/usuarios/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/administracion/usuarios/roles" });
  },
});
