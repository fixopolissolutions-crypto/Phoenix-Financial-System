import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

interface UserData {
  role: 'admin' | 'sucursal';
  name: string;
  username: string;
}

interface AuthContextType {
  user: UserData | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'fixopolis_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.auth.loginLocal.useMutation();

  useEffect(() => {
    // Recuperar usuario de localStorage al cargar
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await loginMutation.mutateAsync({ username, password });
      
      if (result.success && result.user) {
        const userData: UserData = {
          role: result.user.tienda as 'admin' | 'sucursal',
          name: result.user.tienda === 'admin' ? 'Fixopolis Solutions' : 'Fixopolis Solutions Sucursal',
          username: result.user.username,
        };
        setUser(userData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
