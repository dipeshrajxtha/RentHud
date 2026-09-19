import { z } from 'zod';

/** Body schema for creating or upgrading to a landlord profile */
export const createLandlordProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(255).optional(),
  phone: z.string().min(1, 'Phone number is required').max(50),
  avatar_url: z.string().url('Avatar URL must be a valid URL').max(1024).nullable().optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').max(1024).nullable().optional(),
});

export type CreateLandlordProfileBody = z.infer<typeof createLandlordProfileSchema>;

/** Body schema for updating mutable landlord profile fields */
export const updateLandlordProfileSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be empty').max(255).optional(),
    phone: z.string().min(1, 'Phone number cannot be empty').max(50).nullable().optional(),
    avatar_url: z.string().url('Avatar URL must be a valid URL').max(1024).nullable().optional(),
    avatarUrl: z.string().url('Avatar URL must be a valid URL').max(1024).nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  );

export type UpdateLandlordProfileBody = z.infer<typeof updateLandlordProfileSchema>;

/** Path parameters schema for validating landlord UUID */
export const landlordIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid landlord ID format, must be a UUID' }),
});

export type LandlordIdParam = z.infer<typeof landlordIdParamSchema>;
