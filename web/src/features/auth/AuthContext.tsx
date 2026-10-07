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
} from './auth.service';

/* ── Context interface ──────────────────────────────────────────────────── */
interface AuthContextValue extends AuthState {
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  /** Called from role-selection screen after new-user onboarding (single role). */
  completeOnboarding: (role: 'tenant' | 'landlord') => Promise<void>;
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

function clearLegacyBrowserStorage() {
  try {
    sessionStorage.clear();
    localStorage.removeItem('rh_user');
    localStorage.removeItem('rh_active_view');
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_access_token');
    localStorage.removeItem('renthub_token');
  } catch {}
}

const SESSION_HINT_KEY = 'rh_session_active';

function hasSessionHint(): boolean {
  try {
    return (
      localStorage.getItem(SESSION_HINT_KEY) === 'true' ||
      document.cookie.includes('renthub_has_session=1')
    );
  } catch {
    return false;
  }
}

function setSessionHint(active: boolean) {
  try {
    if (active) {
      localStorage.setItem(SESSION_HINT_KEY, 'true');
    } else {
      localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {}
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
      // Clean up any stale legacy cached authentication artifacts
      clearLegacyBrowserStorage();

      // If no session hint exists, user is definitely unauthenticated on this browser.
      // Avoid firing an unneeded request to /api/auth/refresh that would return 401.
      if (!hasSessionHint()) {
        if (!cancelled) {
          setAuth({ status: 'unauthenticated', user: null, accessToken: null, error: null });
        }
        return;
      }

      try {
        const data = await refreshSession();
        if (cancelled) return;

        if (data && data.user) {
          setSessionHint(true);
          // Authoritative source of truth: backend session + HttpOnly cookie
          setAuth({
            status: resolveStatusFromUser(data.user),
            user: data.user,
            accessToken: data.accessToken,
            error: null,
          });
        } else {
          setSessionHint(false);
          setAuth({ status: 'unauthenticated', user: null, accessToken: null, error: null });
        }
      } catch {
        if (cancelled) return;
        setSessionHint(false);
        setAuth({
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          error: null,
        });
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
      setSessionHint(true);
      if (isMounted.current) {
        setAuth({
          status: resolveStatusFromUser(data.user),
          user: data.user,
          accessToken: data.accessToken,
          error: null,
        });
      }
    } catch (err) {
      setSessionHint(false);
      if (isMounted.current) {
        setAuth(prev => ({ ...prev, status: 'unauthenticated', error: parseAuthError(err) }));
      }
      throw err;
    }
  }, []);

  /* ── Complete Onboarding (new user selects single role) ── */
  const completeOnboarding = useCallback(async (role: 'tenant' | 'landlord') => {
    if (!auth.accessToken) return;
    try {
      const data = await setRoles([role], auth.accessToken);
      setSessionHint(true);
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

  /* ── Sign Out ── */
  const signOut = useCallback(async () => {
    clearLegacyBrowserStorage();
    setSessionHint(false);
    // Instruct Google Identity Services not to auto-select on next visit
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id?.disableAutoSelect) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch {}
    }
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ───────────────────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
