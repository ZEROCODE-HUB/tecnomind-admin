import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/configuracion")({
  component: ConfiguracionLayout,
});

/**
 * Antes esta sección era el "Gestor de Integraciones" (todo mock: monitor de
 * cron/login providers argentinos). Se limpió: ahora es solo "Configuración"
 * con los ajustes reales de la plataforma (ver el índice). Sin pestañas.
 */
function ConfiguracionLayout() {
  return <Outlet />;
}
