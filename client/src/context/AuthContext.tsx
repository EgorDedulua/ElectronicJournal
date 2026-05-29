import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import httpClient from '../api/httpClient';
import { UserProfile, UserRole } from '../types';

interface LoginDTO {
  login: string;
  password: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (dto: LoginDTO) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {}
});

const STORAGE_KEY = 'ej-user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        setUser(JSON.parse(data));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (dto: LoginDTO) => {
    const response = await httpClient.post('/auth', dto);
    const profile: UserProfile = response.data.data;
    setUser(profile);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  const logout = async () => {
    try {
      await httpClient.post('/logout');
    } finally {
      setUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
