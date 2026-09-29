import { z } from 'zod';

/** PATCH /api/users/me — updatable profile fields */
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).nullable().optional(),
  avatar_url: z.string().url().max(1024).nullable().optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

/** POST /api/users/me/roles — set initial roles for new users */
export const setRolesSchema = z.object({
  roles: z.array(z.enum(['tenant', 'landlord'])).min(1).max(2),
});
export type SetRolesBody = z.infer<typeof setRolesSchema>;

/** POST /api/users/me/roles/:role — add a single role */
export const addRoleParamSchema = z.object({
  role: z.enum(['tenant', 'landlord']),
});
export type AddRoleParam = z.infer<typeof addRoleParamSchema>;

export {
  createLandlordProfileSchema,
  updateLandlordProfileSchema,
  landlordIdParamSchema,
  type CreateLandlordProfileBody,
  type UpdateLandlordProfileBody,
  type LandlordIdParam,
} from '../landlords/landlords.schemas.js';
