import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, setCsrf } from './api';
import { setLang } from './i18n';

export type User = { id: string; username: string; name: string; role: 'admin' | 'staff'; active: boolean; must_change_password: boolean; language: 'en' | 'nl'; job_title: string; phone: string; email: string; avatar: string };

type Auth = {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<Auth>(null as unknown as Auth);
export const useAuth = () => useContext(AuthContext);

export const can = {
  write: (u: User | null) => !!u,
  finance: (u: User | null) => !!u,
  admin: (u: User | null) => u?.role === 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const setUser = useCallback((u: User | null) => { if (u?.language) setLang(u.language); setUserState(u); }, []);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api<{ user: User | null; csrf: string }>('/auth/me').then((r) => { setCsrf(r.csrf); setUser(r.user); }).catch(() => setUser(null)).finally(() => setReady(true));
    const out = () => setUser(null);
    window.addEventListener('moonshine:logged-out', out);
    return () => window.removeEventListener('moonshine:logged-out', out);
  }, []);
  const login = useCallback(async (username: string, password: string) => {
    const r = await api<{ user: User; csrf: string }>('/auth/login', { method: 'POST', body: { username, password } });
    setCsrf(r.csrf);
    setUser(r.user);
  }, []);
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    const r = await api<{ csrf: string }>('/auth/me').catch(() => ({ csrf: '' }));
    setCsrf(r.csrf);
    setUser(null);
  }, []);
  return <AuthContext.Provider value={{ user, ready, login, logout, setUser }}>{children}</AuthContext.Provider>;
}
