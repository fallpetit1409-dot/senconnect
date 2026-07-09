import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AccountType } from './types';
import type { Profile } from './types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  accountType: AccountType;
  sector?: string;
  companyName?: string;
  region?: string;
  city?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('loadProfile error', error);
      return null;
    }
    return data as Profile | null;
  }, []);

  // Bootstrap session once.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const session = data.session;
      const user = session?.user ?? null;
      const profile = user ? await loadProfile(user.id) : null;
      setState({ session, user, profile, loading: false, error: null });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const user = session?.user ?? null;
        // The profile may not yet exist right after signup (trigger is async-ish);
        // retry once after a short delay if missing.
        let profile: Profile | null = user ? await loadProfile(user.id) : null;
        if (user && !profile) {
          await new Promise((r) => setTimeout(r, 400));
          profile = await loadProfile(user.id);
        }
        setState({ session, user, profile, loading: false, error: null });
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(
    async (p: SignUpParams): Promise<{ error: string | null }> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({
        email: p.email,
        password: p.password,
        options: {
          data: {
            full_name: p.fullName,
            account_type: p.accountType,
            sector: p.sector ?? null,
            company_name: p.companyName ?? null,
            region: p.region ?? null,
            city: p.city ?? null,
            phone: p.phone ?? null,
          },
        },
      });
      if (error) {
        const msg = error.message.includes('already')
          ? 'Un compte existe déjà avec cet e-mail.'
          : error.message;
        setState((s) => ({ ...s, loading: false, error: msg }));
        return { error: msg };
      }
      // The auth.users trigger creates a bare profile row; enrich it with the
      // extra fields supplied at signup so the dashboard is populated.
      if (data.user) {
        await new Promise((r) => setTimeout(r, 250));
        await supabase
          .from('profiles')
          .update({
            account_type: p.accountType,
            sector: p.sector ?? null,
            company_name: p.companyName ?? null,
            region: p.region ?? null,
            city: p.city ?? null,
            phone: p.phone ?? null,
          })
          .eq('id', data.user.id);
      }
      setState((s) => ({ ...s, loading: false }));
      return { error: null };
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.includes('Invalid')
          ? 'E-mail ou mot de passe incorrect.'
          : error.message;
        setState((s) => ({ ...s, loading: false, error: msg }));
        return { error: msg };
      }
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ session: null, user: null, profile: null, loading: false, error: null });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const profile = await loadProfile(state.user.id);
      setState((s) => ({ ...s, profile }));
    }
  }, [state.user, loadProfile]);

  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
