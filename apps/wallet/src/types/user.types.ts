/**
 * Tipos relacionados con usuarios y autenticación
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  dni: string;
  cuit: string;
  phone: string;
  isVerified: boolean;
  subtitle: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  pin: string;
}
