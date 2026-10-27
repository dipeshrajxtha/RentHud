import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../config/database.js';
import { sendSuccess } from '../../common/utils/response.js';
import { ForbiddenError } from '../../common/errors/index.js';
import { sql } from 'kysely';

/**
 * Middleware: require admin role
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const roles = req.user?.roles ?? [];
  if (!roles.includes('admin')) {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}

/**
 * GET /api/admin/stats
 * Platform overview statistics — real data from the database.
 */
export async function getStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Count users by role and status
    const users = await db.selectFrom('users').selectAll().execute();
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const tenants = users.filter(u => (u.roles as string[]).includes('tenant')).length;
    const landlords = users.filter(u => (u.roles as string[]).includes('landlord')).length;
    const admins = users.filter(u => (u.roles as string[]).includes('admin')).length;

    // Count properties
    const propertiesResult = await db
      .selectFrom('properties')
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst();
    const totalProperties = Number(propertiesResult?.count ?? 0);

    // Count active tenancies
    const activeTenanciesResult = await db
      .selectFrom('tenancies')
      .select(sql<number>`count(*)`.as('count'))
      .where('status', '=', 'active')
      .executeTakeFirst();
    const activeTenancies = Number(activeTenanciesResult?.count ?? 0);

    // Count total tenancies
    const totalTenanciesResult = await db
      .selectFrom('tenancies')
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst();
    const totalTenancies = Number(totalTenanciesResult?.count ?? 0);

    // Dispute counts
    const disputesResult = await db
      .selectFrom('tenancy_disputes')
      .selectAll()
      .execute();
    const openDisputes = disputesResult.filter(d => d.status !== 'RESOLVED_MUTUAL' && d.status !== 'RESOLVED_ARBITRATED').length;
    const totalDisputes = disputesResult.length;

    // Payment totals
    const paymentsResult = await db
      .selectFrom('rent_payments')
      .selectAll()
      .execute();
    const totalPaid = paymentsResult
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPending = paymentsResult
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalOverdue = paymentsResult
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Maintenance counts
    const maintenanceResult = await db
      .selectFrom('maintenance_requests')
      .selectAll()
      .execute();
    const openMaintenance = maintenanceResult.filter(m => m.status !== 'Resolved').length;
    const totalMaintenance = maintenanceResult.length;

    // Verification counts
    const verificationsResult = await db
      .selectFrom('verifications')
      .selectAll()
      .execute();
    const pendingVerifications = verificationsResult.filter(v => v.status === 'PENDING').length;

    // KYC counts
    const kycResult = await db
      .selectFrom('kyc_submissions')
      .select(['status'])
      .execute();
    const pendingKyc = kycResult.filter(k => k.status === 'pending').length;

    sendSuccess(res, {
      users: { total: totalUsers, active: activeUsers, tenants, landlords, admins },
      properties: { total: totalProperties },
      tenancies: { total: totalTenancies, active: activeTenancies },
      disputes: { total: totalDisputes, open: openDisputes },
      payments: { totalPaid, totalPending, totalOverdue },
      maintenance: { total: totalMaintenance, open: openMaintenance },
      verifications: { pending: pendingVerifications },
      kyc: { pending: pendingKyc },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users
 * Returns all users with their roles and status.
 */
export async function getUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await db
      .selectFrom('users')
      .select(['id', 'email', 'name', 'avatar_url', 'roles', 'is_active', 'created_at', 'phone'])
      .orderBy('created_at', 'desc')
      .execute();

    // Fetch all approved KYC submissions for fast lookup
    const approvedKycUsers = await db
      .selectFrom('kyc_submissions')
      .select('user_id')
      .where('status', '=', 'approved')
      .execute();
    const verifiedUserIds = new Set(approvedKycUsers.map(k => k.user_id));

    // For each user, count properties (if landlord) and tenancies (if tenant)
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const roles = u.roles as string[];
        let propertiesCount = 0;
        let tenanciesCount = 0;

        if (roles.includes('landlord')) {
          const result = await db
            .selectFrom('properties')
            .select(sql<number>`count(*)`.as('count'))
            .where('landlord_id', '=', u.id)
            .executeTakeFirst();
          propertiesCount = Number(result?.count ?? 0);
        }
        if (roles.includes('tenant')) {
          const result = await db
            .selectFrom('tenancies')
            .select(sql<number>`count(*)`.as('count'))
            .where('tenant_id', '=', u.id)
            .executeTakeFirst();
          tenanciesCount = Number(result?.count ?? 0);
        }

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          roles: u.roles,
          status: u.is_active ? 'active' : 'suspended',
          verified: verifiedUserIds.has(u.id),
          joinedAt: u.created_at,
          propertiesCount,
          tenanciesCount,
        };
      })
    );

    sendSuccess(res, enrichedUsers);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id/toggle-status
 * Suspend or reactivate a user.
 */
export async function toggleUserStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!user) {
      return next(new ForbiddenError('User not found'));
    }

    const newStatus = !user.is_active;

    await db
      .updateTable('users')
      .set({ is_active: newStatus, updated_at: new Date() })
      .where('id', '=', id)
      .execute();

    sendSuccess(res, { id, is_active: newStatus });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/disputes
 * Returns all tenancy disputes with tenant/landlord names.
 */
export async function getDisputes(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const disputes = await db
      .selectFrom('tenancy_disputes as td')
      .innerJoin('tenancies as t', 't.id', 'td.tenancy_id')
      .innerJoin('users as tenant', 'tenant.id', 't.tenant_id')
      .innerJoin('users as landlord', 'landlord.id', 't.landlord_id')
      .innerJoin('property_units as pu', 'pu.id', 't.unit_id')
      .innerJoin('properties as p', 'p.id', 'pu.property_id')
      .select([
        'td.id',
        'td.tenancy_id',
        'tenant.name as tenant_name',
        'landlord.name as landlord_name',
        'p.title as property_title',
        'td.title as grounds',
        'td.claim_amount',
        'td.status',
        'td.created_at',
        'td.category',
        'td.resolution_summary',
      ])
      .orderBy('td.created_at', 'desc')
      .execute();

    sendSuccess(res, disputes);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/disputes/:id/resolve
 * Resolve a dispute with arbitration decision.
 */
export async function resolveDispute(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;

    await db
      .updateTable('tenancy_disputes')
      .set({
        status: 'RESOLVED_ARBITRATED',
        resolution_summary: `${decision}: ${notes || 'No additional notes'}`,
        resolved_by: req.user!.id,
        resolved_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();

    sendSuccess(res, { id, status: 'RESOLVED_ARBITRATED' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/verifications
 * Returns pending and recent verifications.
 */
export async function getVerifications(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const verifications = await db
      .selectFrom('verifications as v')
      .leftJoin('users as u', 'u.id', 'v.user_id')
      .leftJoin('verification_badges as vb', 'vb.id', 'v.badge_id')
      .select([
        'v.id',
        'v.user_id',
        'v.property_id',
        'v.status',
        'v.document_url',
        'v.created_at',
        'u.name as user_name',
        'u.email as user_email',
        'vb.name as badge_name',
        'vb.code as badge_code',
      ])
      .orderBy('v.created_at', 'desc')
      .execute();

    sendSuccess(res, verifications);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/verifications/:id/approve
 */
export async function approveVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await db
      .updateTable('verifications')
      .set({
        status: 'VERIFIED',
        verified_by: req.user!.id,
        verified_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();

    sendSuccess(res, { id, status: 'VERIFIED' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/verifications/:id/reject
 */
export async function rejectVerification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db
      .updateTable('verifications')
      .set({
        status: 'REJECTED',
        rejection_reason: reason || 'Rejected by admin',
        verified_by: req.user!.id,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();

    sendSuccess(res, { id, status: 'REJECTED' });
  } catch (err) {
    next(err);
  }
}
