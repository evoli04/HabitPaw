import { createContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { supabase, supabaseConfigError } from '../services/supabaseClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (supabaseConfigError) {
      setInitializing(false);
      return undefined;
    }

    authService
      .getSession()
      .then((value) => mounted && setSession(value))
      .catch(() => mounted && setSession(null))
      .finally(() => mounted && setInitializing(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        setInitializing(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      initializing,
      configurationError: supabaseConfigError,
      signIn: authService.signIn,
      signUp: authService.signUp,
      signOut: authService.signOut,
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
