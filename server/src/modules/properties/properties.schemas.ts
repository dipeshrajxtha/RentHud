import { z } from 'zod';

export const propertySearchQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().optional(),
  stepLevel: z.coerce.number().int().min(1).max(6).optional(),
  expandRadius: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      if (typeof val === 'boolean') return val;
      return true;
    }, z.boolean())
    .optional()
    .default(true),
  minRent: z.coerce.number().nonnegative().optional(),
  maxRent: z.coerce.number().positive().optional(),
  minArea: z.coerce.number().positive().optional(),
  maxArea: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  amenities: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      if (Array.isArray(val)) return val;
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    })
    .optional(),
  availability: z
    .enum(['AVAILABLE', 'RESERVED', 'PENDING_SIGNATURE', 'ON_RENT', 'UNAVAILABLE'])
    .optional()
    .default('AVAILABLE'),
  city: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['rent_asc', 'rent_desc', 'newest', 'distance']).optional(),
}).refine(
  (data) => {
    // If one coordinate is provided, both must be provided
    const hasLat = data.latitude !== undefined;
    const hasLng = data.longitude !== undefined;
    return (hasLat && hasLng) || (!hasLat && !hasLng);
  },
  {
    message: 'Both latitude and longitude must be provided for spatial search',
    path: ['latitude'],
  }
).refine(
  (data) => {
    if (data.minRent !== undefined && data.maxRent !== undefined) {
      return data.minRent <= data.maxRent;
    }
    return true;
  },
  {
    message: 'minRent cannot be greater than maxRent',
    path: ['minRent'],
  }
).refine(
  (data) => {
    if (data.minArea !== undefined && data.maxArea !== undefined) {
      return data.minArea <= data.maxArea;
    }
    return true;
  },
  {
    message: 'minArea cannot be greater than maxArea',
    path: ['minArea'],
  }
);

export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;

export const propertyIdParamSchema = z.object({
  id: z.string().uuid('Invalid property ID format'),
});

export type PropertyIdParam = z.infer<typeof propertyIdParamSchema>;
