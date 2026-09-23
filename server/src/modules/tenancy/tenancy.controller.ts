import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { db as defaultDb } from '../../../config/database.js';
import {
  submitRentalRequest,
  listRentalRequests,
  getRentalRequestById,
  cancelRentalRequest,
  rejectRentalRequest,
  approveRentalRequest,
  listLeases,
  getLeaseById,
  signLease,
  terminateLease,
} from './tenancy.service.js';
import type {
  LeaseIdParam,
  LeaseQuery,
  TerminateLeaseInput,
} from './tenancy.lease.schemas.js';
import { sendSuccess } from '../../common/utils/response.js';
import type {
  CreateRentalRequestInput,
  RentalRequestIdParam,
  RentalRequestQuery,
} from './tenancy.schemas.js';
import type { UserRole } from '../../../../shared/enums/roles.js';

export function getDb(req: Request): Kysely<Database> {
  return (req.app?.locals?.db as Kysely<Database>) ?? defaultDb;
}

/**
 * POST /api/tenancy/requests
 * Tenant submits a rental application for an available unit.
 */
export async function createRentalApplication(
  req: Request<{}, {}, CreateRentalRequestInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await submitRentalRequest(db, req.user!.id, req.body);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tenancy/requests
 * Lists rental applications for the authenticated user (as tenant or landlord).
 */
export async function getRentalApplications(
  req: Request<any, any, any, any>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const query = req.query as unknown as RentalRequestQuery;
    const result = await listRentalRequests(
      db,
      req.user!.id,
      req.user!.roles as UserRole[],
      query
    );
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tenancy/requests/:id
 * Retrieves application details (restricted to applicant, landlord, or admin).
 */
export async function getRentalApplicationById(
  req: Request<RentalRequestIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await getRentalRequestById(
      db,
      req.params.id,
      req.user!.id,
      req.user!.roles as UserRole[]
    );
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tenancy/requests/:id/cancel
 * Tenant cancels their own pending application.
 */
export async function cancelApplication(
  req: Request<RentalRequestIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await cancelRentalRequest(db, req.params.id, req.user!.id);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tenancy/requests/:id/reject
 * Landlord rejects a pending application.
 */
export async function rejectApplication(
  req: Request<RentalRequestIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await rejectRentalRequest(db, req.params.id, req.user!.id);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tenancy/requests/:id/approve
 * Landlord approves application with ACID transaction & One Active Tenancy lock.
 */
export async function approveApplication(
  req: Request<RentalRequestIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await approveRentalRequest(db, req.params.id, req.user!.id);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tenancy/leases
 * Lists lease agreements for the authenticated user (RBAC-scoped).
 */
export async function getLeases(
  req: Request<any, any, any, any>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const query = req.query as unknown as LeaseQuery;
    const result = await listLeases(
      db,
      req.user!.id,
      req.user!.roles as UserRole[],
      query
    );
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tenancy/leases/:id
 * Retrieves a lease agreement by ID (restricted to parties + admin).
 */
export async function getLeaseAgreementById(
  req: Request<LeaseIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await getLeaseById(
      db,
      req.params.id,
      req.user!.id,
      req.user!.roles as UserRole[]
    );
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tenancy/leases/:id/sign
 * Records the authenticated party's digital signature on a pending lease.
 * Activates the lease atomically when both parties have signed.
 */
export async function signLeaseAgreement(
  req: Request<LeaseIdParam>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await signLease(
      db,
      req.params.id,
      req.user!.id,
      req.user!.roles as UserRole[]
    );
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tenancy/leases/:id/terminate
 * Initiates early termination of an active lease (either party may call this).
 */
export async function terminateLeaseAgreement(
  req: Request<LeaseIdParam, any, TerminateLeaseInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const result = await terminateLease(db, req.params.id, req.user!.id, req.body);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}
