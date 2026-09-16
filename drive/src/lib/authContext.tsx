/**
 * Auth for the drive at ali.tactag.app/drive: the PINK MENACE session cookie.
 * GET /api/me tells us who's signed in. No tokens, no local storage.
 * Keeps the old `useAuth()` shape so the highway hooks still compile
 * (their `token` is always null, so their legacy server calls are skipped).
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthContextValue } from '@/types/auth';

interface MeResponse {
  ok: boolean;
  signedIn: boolean;
  kind?: 'game' | 'parents';
  wrongPortal?: boolean;
  redirect?: string;
  person?: { id: string; role: 'student' | 'parent'; name: string; last4: string | null };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/me', { credentials: 'same-origin' })
      .then((r) => r.json() as Promise<MeResponse>)
      .then((me) => {
        if (!alive) return;
        if (me.wrongPortal && me.redirect) { window.location.href = me.redirect; return; }
        if (!me.signedIn || !me.person) { window.location.href = '/'; return; } // sign in on the card game's home
        setUser({ uid: me.person.id, email: '', displayName: me.person.name, role: me.person.role === 'parent' ? 'parent' : 'player' });
        setLoading(false);
      })
      .catch(() => { if (alive) { setError('Could not reach the server.'); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const notSupported = async (): Promise<User> => { throw new Error('Sign in on the home screen.'); };
  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user, token: null, loading, error,
      signUp: notSupported, signIn: notSupported, signOut,
      isAuthenticated: !!user,
      isPlayer: user?.role === 'player',
      isParent: user?.role === 'parent',
      hasGameAccess: user?.role === 'player',
      hasDashboardAccess: user?.role === 'parent',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
