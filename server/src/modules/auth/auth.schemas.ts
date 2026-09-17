import { z } from 'zod';

/** POST /api/auth/google */
export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
});

/** POST /api/auth/refresh (mobile clients send body — web uses cookie) */
export const refreshSchema = z
  .object({
    refreshToken: z.string().optional(),
  })
  .optional()
  .default({});

/**
 * POST /api/auth/dev-login
 * Only registered when NODE_ENV !== 'production'.
 */
export const devLoginSchema = z.object({
  email: z.string().email(),
  roles: z.array(z.enum(['tenant', 'landlord', 'admin'])).min(1).default(['tenant']),
  name: z.string().default('Dev User'),
});

export type GoogleAuthBody = z.infer<typeof googleAuthSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
export type DevLoginBody = z.infer<typeof devLoginSchema>;
