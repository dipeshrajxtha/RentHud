import { z } from 'zod';

export const createReviewSchema = z.object({
  tenancy_id: z.string().uuid('Invalid tenancy ID format'),
  rating: z.number().int().min(1).max(5),
  cleanliness_rating: z.number().int().min(1).max(5).optional().nullable(),
  communication_rating: z.number().int().min(1).max(5).optional().nullable(),
  review_text: z.string().max(2000).optional().nullable(),
  amenities_feedback: z.string().max(1000).optional().nullable(),
});

export type CreateReviewBody = z.infer<typeof createReviewSchema>;

export const getReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;
