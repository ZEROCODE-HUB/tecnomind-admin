import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { iniciarSesion, cerrarSesion } from '@/lib/auth-service';

export type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** true mientras se resuelve la sesión inicial: evita mostrar el login de más. */
  isLoading: boolean;
  login: (email: string, pin: string) => Promise<boolean>;
  /** Igual que login, pero devuelve el motivo del fallo para mostrarlo. */
  loginConDetalle: (email: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Fila de public.users -> el User que consumen las pantallas. */
function aUser(fila: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  document_number: string;
  tax_id: string;
  verification_status: string | null;
  photo_url: string | null;
}): User {
  const verificado = fila.verification_status === 'verified';
  return {
    id: fila.id,
    name: `${fila.first_name} ${fila.last_name}`.trim(),
    email: fila.email,
    avatar: fila.photo_url ?? undefined,
    dni: fila.document_number,
    cuit: fila.tax_id,
    phone: fila.phone,
    isVerified: verificado,
    subtitle: verificado ? 'Cuenta verificada' : 'Verificación pendiente',
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // El perfil se lee de public.users, no del JWT: el token solo trae el id
  // y el email, y las pantallas necesitan nombre, documento y verificación.
  const cargarPerfil = useCallback(async (actual: Session | null) => {
    if (!actual) {
      setUser(null);
      return;
    }
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, document_number, tax_id, verification_status, photo_url')
      .eq('id', actual.user.id)
      .maybeSingle();

    if (error || !data) {
      console.error('No se pudo cargar el perfil', error);
      setUser(null);
      return;
    }
    setUser(aUser(data));
  }, []);

  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!activo) return;
      setSession(data.session);
      await cargarPerfil(data.session);
      if (activo) setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evento, siguiente) => {
      if (!activo) return;
      setSession(siguiente);
      await cargarPerfil(siguiente);
      if (activo) setIsLoading(false);
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, [cargarPerfil]);

  const loginConDetalle = useCallback(async (email: string, pin: string) => {
    const resultado = await iniciarSesion(email, pin);
    return resultado.ok ? { ok: true } : { ok: false, error: resultado.error };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(session && user),
      isLoading,
      login: async (email, pin) => (await iniciarSesion(email, pin)).ok,
      loginConDetalle,
      logout: async () => {
        await cerrarSesion();
        // No se espera al listener: el estado se limpia ya, así el guard
        // reacciona en el mismo tick.
        setSession(null);
        setUser(null);
      },
      // Optimista en memoria: la escritura real la hace cada pantalla y
      // refreshUser vuelve a traer el estado del servidor.
      updateUser: (updates) => setUser((prev) => (prev ? { ...prev, ...updates } : prev)),
      refreshUser: () => cargarPerfil(session),
    }),
    [user, session, isLoading, loginConDetalle, cargarPerfil],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
