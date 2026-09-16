import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Raíz del backoffice.
 *
 * Antes acá vivía un login de PRUEBA del prototipo: su botón no autenticaba
 * nada (solo hacía setRole("admin") y navegaba a /admin), y como /admin exige
 * sesión real, rebotaba a /login y el usuario terminaba iniciando sesión DOS
 * veces. Ahora la raíz solo redirige al flujo real: /admin decide (con sesión
 * entra; sin sesión su guard manda a /login). Así hay un único login.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
