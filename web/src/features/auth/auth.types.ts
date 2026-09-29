/**
 * RentHub Frontend Auth Types
 *
 * These mirror the backend shared/types/auth.ts contract.
 * Do NOT diverge from the backend API response shape.
 */

import type { UserRole } from '../../../../shared/enums/roles';

/** Authenticated user profile as returned by /api/auth/google and stored in auth state */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: UserRole[];
  /** True if this is a brand-new account with no roles set yet */
  isNewUser: boolean;
}

/** Auth state lifecycle */
export type AuthStatus =
  | 'initializing'    // App startup — checking for existing session
  | 'unauthenticated' // No valid session
  | 'needs-role'      // Authenticated but no roles set yet (new user onboarding)
  | 'authenticated'   // Session established + roles set
  | 'error';          // Auth error occurred

/** Complete authentication state */
export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  /** Human-readable error for display (never expose internal details) */
  error: string | null;
}

/** Envelope shape returned by the backend for all success responses */
export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

/** Envelope shape returned by the backend for all error responses */
export interface ApiErrorEnvelope {
  success: false;
  error: {
    message: string;
    fields?: Record<string, string[]>;
  };
}

/** POST /api/auth/google — response data */
export interface GoogleLoginResponseData {
  accessToken: string;
  user: AuthUser;
}

/** POST /api/auth/refresh — response data */
export interface RefreshResponseData {
  accessToken: string;
}
