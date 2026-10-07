import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured, type Profile } from './supabase';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithTelegram: (data: Record<string, unknown>) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await getSupabase().from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Supabase callback ichida to'g'ridan-to'g'ri await qilmaslik uchun
      setTimeout(() => void loadProfile(next?.user.id), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Kutish holatida admin tasdiqlaganini avtomatik aniqlash
  useEffect(() => {
    if (!session || profile?.status === 'approved') return;
    const id = window.setInterval(() => void loadProfile(session.user.id), 10000);
    return () => window.clearInterval(id);
  }, [session, profile?.status, loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      refreshProfile: () => loadProfile(session?.user.id),
      signInWithGoogle: async () => {
        await getSupabase().auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
      },
      signInWithTelegram: async (tgData) => {
        const res = await fetch('/api/telegram-auth', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(tgData),
        });
        const json = (await res.json().catch(() => ({}))) as { token_hash?: string; error?: string };
        if (!res.ok || !json.token_hash) return json.error ?? 'Telegram orqali kirib bo‘lmadi';
        const { error } = await getSupabase().auth.verifyOtp({ token_hash: json.token_hash, type: 'magiclink' });
        return error ? error.message : null;
      },
      signOut: async () => {
        await getSupabase().auth.signOut();
        setProfile(null);
      },
    }),
    [session, profile, loading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
