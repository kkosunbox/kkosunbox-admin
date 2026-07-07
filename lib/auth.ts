import Cookies from 'js-cookie';
import type { AdminInfo, AuthState } from '@/types';

const AUTH_TOKEN_KEY = 'kkosunbox_admin_token';
const AUTH_INFO_KEY = 'kkosunbox_admin_info';

export function saveAuth(state: AuthState): void {
  Cookies.set(AUTH_TOKEN_KEY, state.accessToken, {
    expires: 7,
    sameSite: 'lax',
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(state.admin));
  }
}

export function getToken(): string | undefined {
  return Cookies.get(AUTH_TOKEN_KEY);
}

export function getAdminInfo(): AdminInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminInfo;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  Cookies.remove(AUTH_TOKEN_KEY);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_INFO_KEY);
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
