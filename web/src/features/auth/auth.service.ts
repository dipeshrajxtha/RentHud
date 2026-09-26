/**
 * RentHub Auth API Service
 *
 * Thin wrapper over the existing RentHub backend authentication endpoints.
 * Endpoints used:
 *   POST /api/auth/google   — exchange Google ID token for RentHub session
 *   POST /api/auth/refresh  — obtain a new access token (web: cookie-based)
 *   POST /api/auth/logout   — clear the refresh-token cookie
 *
 * Security rules:
 *   - Refresh token is NEVER stored in JS; the backend manages the HttpOnly cookie.
 *   - Access token is held only in React state (not localStorage/sessionStorage).
 *   - No credentials are logged or exposed to the UI layer.
 */

import type {
  ApiSuccessEnvelope,
  ApiErrorEnvelope,
  GoogleLoginResponseData,
  RefreshResponseData,
} from './auth.types';

/** Extracts a human-readable error string from a backend error response or network error */
function parseAuthError(err: unknown): string {
  if (err instanceof AuthApiError) return err.message;
  if (err instanceof TypeError) {
    // Network failure (fetch threw)
    return 'Unable to reach RentHub. Check your connection and try again.';
  }
  return 'An unexpected error occurred. Please try again.';
}

/** Known backend error message → friendly UI copy */
const ERROR_MAP: Record<string, string> = {
  'Invalid or expired Google ID token':             'Your Google sign-in session expired. Please try again.',
  'Google token payload missing':                   'Google returned an incomplete response. Please try again.',
  'Google account email is not verified':           'Your Google account email is not verified. Please verify it in Google and retry.',
  'Account is deactivated':                         'This account has been deactivated. Contact support for assistance.',
  'Email is already linked to a different Google account':
    'This email is linked to a different Google account. Sign in with the correct Google account.',
  'No refresh token provided':                      'Your session has expired. Please sign in again.',
  'Invalid or expired refresh token':               'Your session has expired. Please sign in again.',
  'Account not found or deactivated':               'Account not found or deactivated. Please contact support.',
};

export class AuthApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Required for the HttpOnly cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;

  if (!response.ok || !payload.success) {
    const errPayload = payload as ApiErrorEnvelope;
    const backendMessage = errPayload.error?.message ?? 'Request failed';
    const userMessage = ERROR_MAP[backendMessage] ?? backendMessage;
    throw new AuthApiError(userMessage, response.status);
  }

  return (payload as ApiSuccessEnvelope<T>).data;
}

/**
 * Exchange a Google ID token credential for a RentHub session.
 * POST /api/auth/google
 */
export async function googleLogin(idToken: string): Promise<GoogleLoginResponseData> {
  return post<GoogleLoginResponseData>('/api/auth/google', { idToken });
}

/**
 * Refresh the access token using the existing HttpOnly cookie.
 * POST /api/auth/refresh
 *
 * Returns null when there is no session to refresh (401/403).
 */
export async function refreshSession(): Promise<RefreshResponseData | null> {
  try {
    return await post<RefreshResponseData>('/api/auth/refresh');
  } catch (err) {
    if (err instanceof AuthApiError && (err.status === 401 || err.status === 403)) {
      return null; // No valid session — treat as unauthenticated, not error
    }
    throw err;
  }
}

/**
 * Log out the current user.
 * POST /api/auth/logout — clears the renthub_rt HttpOnly cookie.
 */
export async function logout(): Promise<void> {
  try {
    await post<{ message: string }>('/api/auth/logout');
  } catch {
    // Best-effort: proceed with local state teardown regardless
  }
}

export { parseAuthError };
