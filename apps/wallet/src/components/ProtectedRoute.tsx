import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";

/**
 * Protege las pantallas que requieren sesión.
 *
 * Es una defensa de interfaz: quien realmente impide leer o escribir datos
 * ajenos es el RLS de Supabase. Esto evita mostrar pantallas vacías y
 * manda al login a quien no tiene sesión.
 */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="sr-only">Verificando sesión…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
