'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AdminInfo } from '@/types';
import {
  saveAuth,
  getAdminInfo,
  clearAuth,
  getToken,
} from '@/lib/auth';
import { adminApi } from '@/lib/api';

interface AuthContextValue {
  admin: AdminInfo | null;
  isLoading: boolean;
  login: (params: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const token = getToken();
      const info = getAdminInfo();

      if (!token) {
        if (info) clearAuth();
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (info) {
        setAdmin(info);
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const me = await adminApi.getMe();
        if (cancelled) return;
        saveAuth({ accessToken: token, admin: me });
        setAdmin(me);
      } catch {
        if (cancelled) return;
        clearAuth();
        setAdmin(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (params: { username: string; password: string }) => {
      const result = await adminApi.login(params);
      saveAuth({ accessToken: result.accessToken, admin: result.admin });
      setAdmin(result.admin);
      router.push('/');
    },
    [router],
  );

  const logout = useCallback(() => {
    clearAuth();
    setAdmin(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
