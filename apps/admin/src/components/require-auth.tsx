import { Navigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/contexts/auth";

/**
 * Guard del backoffice.
 *
 * Es una defensa de interfaz, no de datos: quien realmente impide leer
 * algo es el RLS de Supabase. Esto evita mostrar pantallas vacías a quien
 * no corresponde y manda al login a quien no tiene sesión.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, hasAccess, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Verificando sesión…</span>
      </div>
    );
  }

  if (!session || !hasAccess) {
    // Guardar "/login" como destino de vuelta deja al usuario dando
    // vueltas sobre el propio login; en ese caso no se manda redirect.
    const volverA = pathname.startsWith("/login") ? undefined : pathname;
    return <Navigate to="/login" search={volverA ? { redirect: volverA } : {}} replace />;
  }

  return <>{children}</>;
}
