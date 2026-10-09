import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as authService from '../services/authService';
import { supabase, supabaseConfigError } from '../services/supabaseClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const activeUserIdRef = useRef(null);

  const applySession = useCallback((nextSession) => {
    const nextUserId = nextSession?.user?.id ?? null;
    if (activeUserIdRef.current !== nextUserId) {
      queryClient.clear();
      activeUserIdRef.current = nextUserId;
    }
    setSession(nextSession);
  }, [queryClient]);

  useEffect(() => {
    let mounted = true;

    if (supabaseConfigError) {
      setInitializing(false);
      return undefined;
    }

    authService
      .getSession()
      .then((value) => mounted && applySession(value))
      .catch(() => mounted && applySession(null))
      .finally(() => mounted && setInitializing(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        applySession(nextSession);
        setInitializing(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

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
