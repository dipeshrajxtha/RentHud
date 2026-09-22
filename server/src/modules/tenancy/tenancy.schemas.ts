import { z } from 'zod';

export const createRentalRequestSchema = z.object({
  unitId: z.string().uuid('Invalid unit ID format'),
  proposedMoveIn: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format for proposedMoveIn',
    })
    .transform((val) => new Date(val).toISOString().split('T')[0]),
  message: z.string().max(1000).optional(),
});

export type CreateRentalRequestInput = z.infer<typeof createRentalRequestSchema>;

export const rentalRequestIdParamSchema = z.object({
  id: z.string().uuid('Invalid request ID format'),
});

export type RentalRequestIdParam = z.infer<typeof rentalRequestIdParamSchema>;

export const rentalRequestQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type RentalRequestQuery = z.infer<typeof rentalRequestQuerySchema>;
