import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types';
import { storage } from '@/utils/storage';
import { getCurrentUser } from '@/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = storage.getToken();
    const savedUser = storage.getUser<User>();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      setLoading(false);
    } else if (savedToken) {
      // 有 token 但没用户信息，拉取用户信息
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
          storage.setUser(userData);
        })
        .catch(() => {
          storage.clear();
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setAuth = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    storage.setToken(newToken);
    storage.setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    storage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
