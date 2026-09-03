import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  EMPTY_PERMISSIONS,
  fetchPermissions,
  can as canDo,
  hasAnyAccess,
  type Action,
  type PermissionMap,
  type Resource,
} from "@tecnomind/core";

import { supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  permissions: PermissionMap;
  /** true mientras no se sabe todavía si hay sesión: evita parpadeos de login. */
  loading: boolean;
  /** true si el operador puede leer al menos un recurso del backoffice. */
  hasAccess: boolean;
  can: (resource: Resource, action?: Action) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>(EMPTY_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Los permisos se leen de la base en cada cambio de sesión y nunca se
    // guardan en el navegador: el RLS es la fuente de verdad, esto solo
    // decide qué se dibuja.
    async function load(next: Session | null) {
      if (!next) {
        if (active) {
          setPermissions(EMPTY_PERMISSIONS);
          setLoading(false);
        }
        return;
      }
      try {
        const perms = await fetchPermissions(supabase);
        if (active) setPermissions(perms);
      } catch (err) {
        console.error("No se pudieron cargar los permisos", err);
        if (active) setPermissions(EMPTY_PERMISSIONS);
      } finally {
        if (active) setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void load(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(true);
      void load(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      permissions,
      loading,
      hasAccess: hasAnyAccess(permissions),
      can: (resource, action = "read") => canDo(permissions, resource, action),
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? traducirError(error.message) : null };
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, permissions, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

function traducirError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (message.includes("Email not confirmed")) return "La cuenta todavía no fue confirmada.";
  if (message.includes("Too many requests")) return "Demasiados intentos. Esperá unos minutos.";
  return message;
}
