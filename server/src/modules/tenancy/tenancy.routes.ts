import { Router } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import * as tenancyController from './tenancy.controller.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { requireTenant, requireLandlord } from '../../common/middleware/requireRole.js';
import { validate } from '../../common/middleware/validate.js';
import {
  createRentalRequestSchema,
  rentalRequestIdParamSchema,
  rentalRequestQuerySchema,
} from './tenancy.schemas.js';
import {
  leaseIdParamSchema,
  leaseQuerySchema,
  terminateLeaseSchema,
} from './tenancy.lease.schemas.js';

export function createTenancyRouter(dbInstance?: Kysely<Database>): Router {
  const router = Router();

  if (dbInstance) {
    router.use((req, _res, next) => {
      if (!req.app.locals.db) {
        req.app.locals.db = dbInstance;
      }
      next();
    });
  }

  // All tenancy/application operations require an authenticated session
  router.use(authenticate);

  // Tenant submits application
  router.post(
    '/requests',
    requireTenant,
    validate(createRentalRequestSchema),
    tenancyController.createRentalApplication
  );

  // List applications for authenticated user
  router.get(
    '/requests',
    validate(rentalRequestQuerySchema, 'query'),
    tenancyController.getRentalApplications
  );

  // View specific application
  router.get(
    '/requests/:id',
    validate(rentalRequestIdParamSchema, 'params'),
    tenancyController.getRentalApplicationById
  );

  // Tenant cancels pending application
  router.post(
    '/requests/:id/cancel',
    validate(rentalRequestIdParamSchema, 'params'),
    tenancyController.cancelApplication
  );

  // Landlord rejects application
  router.post(
    '/requests/:id/reject',
    requireLandlord,
    validate(rentalRequestIdParamSchema, 'params'),
    tenancyController.rejectApplication
  );

  // Landlord approves application (transactional, row locks, one active tenancy check)
  router.post(
    '/requests/:id/approve',
    requireLandlord,
    validate(rentalRequestIdParamSchema, 'params'),
    tenancyController.approveApplication
  );

  // ── Lease / Digital Agreement endpoints ──────────────────────────────────

  // List leases for authenticated user (RBAC-scoped)
  router.get(
    '/leases',
    validate(leaseQuerySchema, 'query'),
    tenancyController.getLeases
  );

  // Retrieve a specific lease agreement
  router.get(
    '/leases/:id',
    validate(leaseIdParamSchema, 'params'),
    tenancyController.getLeaseAgreementById
  );

  // Sign a pending lease (tenant or landlord; second signature activates it)
  router.post(
    '/leases/:id/sign',
    validate(leaseIdParamSchema, 'params'),
    tenancyController.signLeaseAgreement
  );

  // Early termination of an active lease
  router.post(
    '/leases/:id/terminate',
    validate(leaseIdParamSchema, 'params'),
    validate(terminateLeaseSchema, 'body'),
    tenancyController.terminateLeaseAgreement
  );

  return router;
}
