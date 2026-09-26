/**
 * RentHub AuthContext
 *
 * Provides application-wide authentication state and actions.
 * This is the single authoritative auth source — do not create a second one.
 *
 * State lifecycle:
 *   initializing → (session found) → authenticated
 *   initializing → (no session)    → unauthenticated
 *   unauthenticated → (google login) → authenticated
 *   authenticated → (logout) → unauthenticated
 *   any → (error) → error (with recovery action)
 *
 * Access token is held ONLY in React state. Refresh token lives in the
 * HttpOnly cookie managed exclusively by the backend.
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
import { googleLogin, refreshSession, logout as apiLogout, parseAuthError } from './auth.service';

/* ── Context interface ──────────────────────────────────────────────────── */
interface AuthContextValue extends AuthState {
  /** Sign in with a Google credential (ID token from @react-oauth/google). */
  signInWithGoogle: (idToken: string) => Promise<void>;
  /** Sign out — clears server cookie and local state. */
  signOut: () => Promise<void>;
  /** Clear a transient auth error (e.g. on retry). */
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────────────────────── */
const INITIAL_STATE: AuthState = {
  status: 'initializing',
  user: null,
  accessToken: null,
  error: null,
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
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
          // We have a valid refresh cookie — get user info by decoding the JWT claim
          // NOTE: We do NOT decode JWTs client-side for auth decisions.
          // The access token is only used as a Bearer token in future requests.
          // The user object was returned by the backend at login time and is
          // stored in sessionStorage as non-sensitive profile cache only.
          const cachedUser = sessionStorage.getItem('rh_user');
          const user: AuthUser | null = cachedUser ? JSON.parse(cachedUser) as AuthUser : null;

          setAuth({
            status: user ? 'authenticated' : 'unauthenticated',
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
      // Cache non-sensitive user profile to survive refresh
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
        setAuth(prev => ({
          ...prev,
          status: 'unauthenticated',
          error: parseAuthError(err),
        }));
      }
      throw err; // Re-throw so the caller can handle loading state
    }
  }, []);

  /* ── Sign Out ── */
  const signOut = useCallback(async () => {
    sessionStorage.removeItem('rh_user');
    await apiLogout(); // Best-effort — always proceed

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ───────────────────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
