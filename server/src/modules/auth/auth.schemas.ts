import { z } from 'zod';

/** POST /api/auth/google */
export const googleAuthSchema = z
  .object({
    idToken: z.string().optional(),
    accessToken: z.string().optional(),
  })
  .refine((data) => Boolean(data.idToken || data.accessToken), {
    message: 'Either idToken or accessToken must be provided',
    path: ['idToken'],
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
  roles: z.array(z.enum(['tenant', 'landlord'])).min(1).default(['tenant']),
  name: z.string().default('Dev User'),
});

/**
 * POST /api/auth/admin-login
 * Hardcoded admin credentials login (admin@gmail.com / admin123).
 */
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type GoogleAuthBody = z.infer<typeof googleAuthSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
export type DevLoginBody = z.infer<typeof devLoginSchema>;
export type AdminLoginBody = z.infer<typeof adminLoginSchema>;
