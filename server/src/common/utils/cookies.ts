import type { Response } from 'express';
import config from '../../../config/env.js';

const COOKIE_NAME = 'renthub_rt';
/**
 * Sets the HttpOnly refresh token cookie on the response as a session cookie.
 * No maxAge or expires is set, ensuring closing the browser destroys the cookie
 * and fully ends the RentHub session.
 * Secure flag is enabled only in production.
 */
export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: config.server.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

/**
 * Clears the refresh token cookie.
 * Note: The token itself remains stateless-valid until its expiry.
 * This only removes it from the browser cookie jar.
 */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.server.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

export { COOKIE_NAME as REFRESH_COOKIE_NAME };
