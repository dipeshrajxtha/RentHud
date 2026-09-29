/**
 * RentHub AuthContext
 *
 * State lifecycle:
 *   initializing → (session + roles set)     → authenticated
 *   initializing → (session, no roles)       → needs-role  (new user onboarding)
 *   initializing → (no session)              → unauthenticated
 *   unauthenticated → (google login, has roles) → authenticated
 *   unauthenticated → (google login, new user)  → needs-role
 *   needs-role  → (role selected)            → authenticated
 *   authenticated → (logout)                 → unauthenticated
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { AuthState, AuthUser } from './auth.types';
import {
  googleLogin,
  refreshSession,
  logout as apiLogout,
  parseAuthError,
  setRoles,
  addRoleToAccount,
} from './auth.service';

/* ── Context interface ──────────────────────────────────────────────────── */
interface AuthContextValue extends AuthState {
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  /** Called from role-selection screen after new-user onboarding. */
  completeOnboarding: (roles: ('tenant' | 'landlord')[]) => Promise<void>;
  /** Called from settings to add a second role to an existing account. */
  addRole: (role: 'tenant' | 'landlord') => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────────────────────── */
const INITIAL_STATE: AuthState = {
  status: 'initializing',
  user: null,
  accessToken: null,
  error: null,
};

function resolveStatusFromUser(user: AuthUser | null): AuthState['status'] {
  if (!user) return 'unauthenticated';
  return (user.roles?.length ?? 0) === 0 ? 'needs-role' : 'authenticated';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(INITIAL_STATE);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  /* ── Session initialization ── */
  useEffect(() => {
    let cancelled = false;
    async function initSession() {
      try {
        const data = await refreshSession();
        if (cancelled) return;

        if (data) {
          const cachedUser = sessionStorage.getItem('rh_user');
          const user: AuthUser | null = cachedUser ? JSON.parse(cachedUser) as AuthUser : null;
          setAuth({
            status: resolveStatusFromUser(user),
            user,
            accessToken: data.accessToken,
            error: null,
          });
        } else {
          setAuth({ status: 'unauthenticated', user: null, accessToken: null, error: null });
        }
      } catch {
        if (cancelled) return;
        setAuth({ status: 'unauthenticated', user: null, accessToken: null, error: null });
      }
    }

    void initSession();
    return () => { cancelled = true; };
  }, []);

  /* ── Google Sign-In ── */
  const signInWithGoogle = useCallback(async (idToken: string) => {
    setAuth(prev => ({ ...prev, error: null }));
    try {
      const data = await googleLogin(idToken);
      sessionStorage.setItem('rh_user', JSON.stringify(data.user));
      if (isMounted.current) {
        setAuth({
          status: resolveStatusFromUser(data.user),
          user: data.user,
          accessToken: data.accessToken,
          error: null,
        });
      }
    } catch (err) {
      if (isMounted.current) {
        setAuth(prev => ({ ...prev, status: 'unauthenticated', error: parseAuthError(err) }));
      }
      throw err;
    }
  }, []);

  /* ── Complete Onboarding (new user sets initial roles) ── */
  const completeOnboarding = useCallback(async (roles: ('tenant' | 'landlord')[]) => {
    if (!auth.accessToken) return;
    try {
      const data = await setRoles(roles, auth.accessToken);
      sessionStorage.setItem('rh_user', JSON.stringify(data.user));
      if (isMounted.current) {
        setAuth({
          status: 'authenticated',
          user: data.user,
          accessToken: data.accessToken,
          error: null,
        });
      }
    } catch (err) {
      if (isMounted.current) {
        setAuth(prev => ({ ...prev, error: parseAuthError(err) }));
      }
      throw err;
    }
  }, [auth.accessToken]);

  /* ── Add Role (existing user adds a second role) ── */
  const addRole = useCallback(async (role: 'tenant' | 'landlord') => {
    if (!auth.accessToken) return;
    try {
      const data = await addRoleToAccount(role, auth.accessToken);
      sessionStorage.setItem('rh_user', JSON.stringify(data.user));
      if (isMounted.current) {
        setAuth(prev => ({
          ...prev,
          user: data.user,
          accessToken: data.accessToken,
        }));
      }
    } catch (err) {
      if (isMounted.current) {
        setAuth(prev => ({ ...prev, error: parseAuthError(err) }));
      }
      throw err;
    }
  }, [auth.accessToken]);

  /* ── Sign Out ── */
  const signOut = useCallback(async () => {
    sessionStorage.removeItem('rh_user');
    await apiLogout();
    if (isMounted.current) {
      setAuth({ status: 'unauthenticated', user: null, accessToken: null, error: null });
    }
  }, []);

  /* ── Clear Error ── */
  const clearError = useCallback(() => {
    setAuth(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...auth,
    signInWithGoogle,
    signOut,
    clearError,
    completeOnboarding,
    addRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ───────────────────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
