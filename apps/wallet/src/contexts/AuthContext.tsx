import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';

export type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Mock user for development
const mockUser: User = {
  id: "usr_001",
  name: "Santiago García",
  email: "santiago@magnate.com.ar",
  dni: "XX.XXX.XXX",
  cuit: "20-12345678-9",
  phone: "+54 9 11 1234 5678",
  isVerified: true,
  subtitle: "Emprendedor Verificado",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(mockUser); // Start with mock user for dev
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Start authenticated for dev

  const login = async (email: string, pin: string): Promise<boolean> => {
    // Mock login - in production this would call an API
    if (email && pin.length === 4) {
      setUser(mockUser);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};