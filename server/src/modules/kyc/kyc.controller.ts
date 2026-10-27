import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { db as defaultDb } from '../../../config/database.js';
import {
  getMyKycSubmission,
  submitKycDocuments,
  listKycSubmissions,
  approveKyc,
  rejectKyc,
  isUserKycApproved,
} from './kyc.service.js';
import { sendSuccess } from '../../common/utils/response.js';
import type { KycStatus } from '../../types/database.js';

function getDb(req: Request): Kysely<Database> {
  return (req.app?.locals?.db as Kysely<Database>) ?? defaultDb;
}

/**
 * GET /api/kyc/me
 * Returns the current user's KYC submission status.
 */
export async function getMyKyc(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const submission = await getMyKycSubmission(db, req.user!.id);
    sendSuccess(res, submission);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/kyc/status
 * Quick boolean check — is the current user KYC-approved?
 */
export async function getKycStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const approved = await isUserKycApproved(db, req.user!.id);
    sendSuccess(res, { verified: approved });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/kyc/submit
 * Submit KYC documents for review.
 */
export async function submitKyc(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const roles = req.user!.roles as string[];
    const userRole = roles.includes('landlord') ? 'landlord' : 'tenant';

    const result = await submitKycDocuments(db, req.user!.id, userRole as 'tenant' | 'landlord', {
      citizenshipFrontUrl: req.body.citizenshipFrontUrl,
      citizenshipBackUrl: req.body.citizenshipBackUrl,
      policeReportUrl: req.body.policeReportUrl ?? null,
      ownershipDocumentUrl: req.body.ownershipDocumentUrl ?? null,
      businessRegistrationUrl: req.body.businessRegistrationUrl ?? null,
    });

    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/kyc
 * Admin lists all KYC submissions (with optional status filter).
 */
export async function adminListKyc(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const statusFilter = req.query.status as KycStatus | undefined;
    const submissions = await listKycSubmissions(db, statusFilter);
    sendSuccess(res, submissions);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/kyc/:id/approve
 */
export async function adminApproveKyc(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await approveKyc(db, id, req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/kyc/:id/reject
 */
export async function adminRejectKyc(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const db = getDb(req);
    const { reason } = req.body;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await rejectKyc(db, id, req.user!.id, reason);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
