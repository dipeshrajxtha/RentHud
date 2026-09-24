import { z } from 'zod';

export const propertySearchQuerySchema = z
  .preprocess((val) => {
    if (val && typeof val === 'object') {
      const copy: Record<string, any> = { ...val };
      if (copy.latitude === undefined && copy.lat !== undefined) {
        copy.latitude = copy.lat;
      }
      if (copy.longitude === undefined && copy.lng !== undefined) {
        copy.longitude = copy.lng;
      }
      if (copy.radiusKm === undefined && copy.radius !== undefined) {
        copy.radiusKm = copy.radius;
      }
      if (copy.bedrooms === undefined && copy.rooms !== undefined) {
        copy.bedrooms = copy.rooms;
      }
      if (copy.sortBy === undefined && copy.sort !== undefined) {
        copy.sortBy = copy.sort;
      }
      return copy;
    }
    return val;
  }, z.object({
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().positive().optional(),
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
    rooms: z.coerce.number().int().nonnegative().optional(),
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
  }))
  .refine(
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
  )
  .refine(
    (data) => {
      if (data.sortBy === 'distance') {
        return data.latitude !== undefined && data.longitude !== undefined;
      }
      return true;
    },
    {
      message: 'Both latitude and longitude must be provided when sorting by distance',
      path: ['sortBy'],
    }
  )
  .refine(
    (data) => {
      if (data.radiusKm !== undefined || data.radius !== undefined) {
        return data.latitude !== undefined && data.longitude !== undefined;
      }
      return true;
    },
    {
      message: 'Both latitude and longitude must be provided when specifying a search radius',
      path: ['radiusKm'],
    }
  )
  .refine(
    (data) => {
      if (data.stepLevel !== undefined) {
        return data.latitude !== undefined && data.longitude !== undefined;
      }
      return true;
    },
    {
      message: 'Both latitude and longitude must be provided when specifying a spatial step level',
      path: ['stepLevel'],
    }
  )
  .refine(
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
  )
  .refine(
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

export const createPropertySchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(255),
  description: z.string().trim().max(5000).optional(),
  address: z.string().trim().min(3, 'Address must be at least 3 characters').max(500),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
  postalCode: z.string().trim().max(20).optional(),
  latitude: z.coerce.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z.coerce.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
  totalFloors: z.coerce.number().int().min(1, 'Total floors must be at least 1').optional().default(1),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = z
  .object({
    title: z.string().trim().min(2).max(255).optional(),
    description: z.string().trim().max(5000).optional(),
    address: z.string().trim().min(3).max(500).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    postalCode: z.string().trim().max(20).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    totalFloors: z.coerce.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const hasLat = data.latitude !== undefined;
      const hasLng = data.longitude !== undefined;
      return (hasLat && hasLng) || (!hasLat && !hasLng);
    },
    {
      message: 'Both latitude and longitude must be provided when updating location',
      path: ['latitude'],
    }
  );

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const createUnitSchema = z.object({
  unitIdentifier: z.string().trim().min(1, 'Unit identifier is required').max(100),
  floorNumber: z.coerce.number().int().optional().default(1),
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms must be >= 0').optional().default(1),
  bathrooms: z.coerce.number().int().min(0, 'Bathrooms must be >= 0').optional().default(1),
  areaSqft: z.coerce.number().positive('Area sqft must be positive').optional(),
  monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
  securityDeposit: z.coerce.number().min(0, 'Security deposit must be >= 0').optional().default(0),
  availabilityStatus: z
    .enum(['AVAILABLE', 'RESERVED', 'PENDING_SIGNATURE', 'ON_RENT', 'UNAVAILABLE'])
    .optional()
    .default('AVAILABLE'),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;

export const updateUnitSchema = z.object({
  unitIdentifier: z.string().trim().min(1).max(100).optional(),
  floorNumber: z.coerce.number().int().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  areaSqft: z.coerce.number().positive().optional(),
  monthlyRent: z.coerce.number().positive().optional(),
  securityDeposit: z.coerce.number().min(0).optional(),
  availabilityStatus: z
    .enum(['AVAILABLE', 'RESERVED', 'PENDING_SIGNATURE', 'ON_RENT', 'UNAVAILABLE'])
    .optional(),
});

export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;

export const propertyAndUnitIdParamSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID format'),
  unitId: z.string().uuid('Invalid unit ID format'),
});

export type PropertyAndUnitIdParam = z.infer<typeof propertyAndUnitIdParamSchema>;

