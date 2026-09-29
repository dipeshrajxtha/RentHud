import { z } from 'zod';
import type { TenancyStatus } from '../../../../shared/types/tenancy.js';

/** Route param schema for lease ID */
export const leaseIdParamSchema = z.object({
  id: z.string().uuid('Invalid lease ID format'),
});

export type LeaseIdParam = z.infer<typeof leaseIdParamSchema>;

/** Query parameters for listing leases */
export const leaseQuerySchema = z.object({
  status: z
    .enum([
      'rental_requested',
      'application_rejected',
      'application_cancelled',
      'pending_signature',
      'active',
      'completed',
      'terminated_early',
    ] satisfies [TenancyStatus, ...TenancyStatus[]])
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type LeaseQuery = z.infer<typeof leaseQuerySchema>;

/** Request body schema for early lease termination */
export const terminateLeaseSchema = z.object({
  reasonCode: z.string().trim().min(1).max(100).optional().default('EARLY_TERMINATION'),
  narrative: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .optional()
    .default('Lease terminated early by party request'),
  disputeId: z.string().uuid('Invalid dispute ID format').optional(),
});

export type TerminateLeaseInput = z.infer<typeof terminateLeaseSchema>;

/** Request body schema for filing a tenancy dispute */
export const createTenancyDisputeSchema = z.object({
  tenancyId: z.string().uuid('Invalid tenancy ID format'),
  category: z.string().trim().min(1).max(100),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(10).max(3000),
  claimAmount: z.coerce.number().nonnegative().optional().default(0),
  evidenceUrls: z.array(z.string()).optional().default([]),
});

export type CreateTenancyDisputeInput = z.infer<typeof createTenancyDisputeSchema>;

