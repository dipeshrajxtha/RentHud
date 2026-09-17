import { z } from 'zod';

/** PATCH /api/users/me — updatable profile fields */
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).nullable().optional(),
  avatar_url: z.string().url().max(1024).nullable().optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
