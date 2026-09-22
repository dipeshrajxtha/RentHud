import { sql, type Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../common/errors/index.js';
import type { UserRole } from '../../../../shared/enums/roles.js';
import type {
  CreateRentalRequestInput,
  RentalRequestQuery,
} from './tenancy.schemas.js';
import type {
  PublicRentalRequestSummary,
  PublicTenancySummary,
} from '../../../../shared/types/tenancy.js';

export async function submitRentalRequest(
  db: Kysely<Database>,
  tenantId: string,
  input: CreateRentalRequestInput
): Promise<PublicRentalRequestSummary> {
  // 1. Validate unit exists and is attached to an active property
  const unit = await db
    .selectFrom('property_units as u')
    .innerJoin('properties as p', 'p.id', 'u.property_id')
    .select([
      'u.id as unit_id',
      'u.unit_identifier',
      'u.floor_number',
      'u.bedrooms',
      'u.bathrooms',
      'u.monthly_rent',
      'u.security_deposit',
      'u.availability_status',
      'p.id as property_id',
      'p.landlord_id',
      'p.title as property_title',
      'p.address as property_address',
      'p.city as property_city',
      'p.is_active as property_is_active',
    ])
    .where('u.id', '=', input.unitId)
    .executeTakeFirst();

  if (!unit) {
    throw new NotFoundError('Property unit not found');
  }

  if (!unit.property_is_active) {
    throw new BadRequestError('Property is currently inactive');
  }

  // 2. Prevent landlord from renting their own unit
  if (unit.landlord_id === tenantId) {
    throw new BadRequestError('You cannot apply to lease your own property');
  }

  // 3. Validate unit availability status
  if (unit.availability_status !== 'AVAILABLE') {
    throw new ConflictError(
      `Unit is not available for rental applications (current status: ${unit.availability_status})`
    );
  }

  // 4. Enforce One Active Tenancy rule check early
  const existingActiveTenancy = await db
    .selectFrom('tenancies')
    .select(['id', 'status'])
    .where('tenant_id', '=', tenantId)
    .where('status', 'in', ['active', 'pending_signature'])
    .executeTakeFirst();

  if (existingActiveTenancy) {
    throw new ConflictError(
      'You already have an active tenancy or pending lease agreement'
    );
  }

  // 5. Prevent duplicate applications for the same unit
  const existingRequest = await db
    .selectFrom('rental_requests')
    .select(['id', 'status'])
    .where('unit_id', '=', input.unitId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst();

  if (existingRequest) {
    throw new ConflictError(
      `You have already submitted an application for this unit (status: ${existingRequest.status})`
    );
  }

  // 6. Insert rental request
  const [created] = await db
    .insertInto('rental_requests')
    .values({
      unit_id: input.unitId,
      tenant_id: tenantId,
      landlord_id: unit.landlord_id,
      status: 'pending',
      proposed_move_in: input.proposedMoveIn as any,
      message: input.message ?? null,
    })
    .returningAll()
    .execute();

  // Fetch applicant user details
  const applicant = await db
    .selectFrom('users')
    .select(['id', 'name', 'email', 'avatar_url', 'phone'])
    .where('id', '=', tenantId)
    .executeTakeFirstOrThrow();

  return {
    id: created.id,
    unitId: created.unit_id,
    tenantId: created.tenant_id,
    landlordId: created.landlord_id,
    status: created.status,
    message: created.message,
    proposedMoveIn: String(created.proposed_move_in),
    createdAt: created.created_at,
    updatedAt: created.updated_at,
    unit: {
      id: unit.unit_id,
      unitIdentifier: unit.unit_identifier,
      floorNumber: unit.floor_number,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      monthlyRent: Number(unit.monthly_rent),
      securityDeposit: Number(unit.security_deposit),
      availabilityStatus: unit.availability_status,
    },
    property: {
      id: unit.property_id,
      title: unit.property_title,
      address: unit.property_address,
      city: unit.property_city,
    },
    tenant: {
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
      avatarUrl: applicant.avatar_url,
      phone: applicant.phone,
    },
  };
}

export async function listRentalRequests(
  db: Kysely<Database>,
  userId: string,
  roles: UserRole[],
  query: RentalRequestQuery
): Promise<{ requests: PublicRentalRequestSummary[]; total: number }> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  let base = db
    .selectFrom('rental_requests as r')
    .innerJoin('property_units as u', 'u.id', 'r.unit_id')
    .innerJoin('properties as p', 'p.id', 'u.property_id')
    .innerJoin('users as t', 't.id', 'r.tenant_id');

  // RBAC scope
  if (roles.includes('tenant') && !roles.includes('landlord')) {
    base = base.where('r.tenant_id', '=', userId);
  } else if (roles.includes('landlord') && !roles.includes('tenant')) {
    base = base.where('r.landlord_id', '=', userId);
  } else {
    // Multi-role or admin
    base = base.where((eb) =>
      eb.or([eb('r.tenant_id', '=', userId), eb('r.landlord_id', '=', userId)])
    );
  }

  if (query.status) {
    base = base.where('r.status', '=', query.status);
  }

  const countResult = await base
    .select(sql<number>`COUNT(r.id)`.as('count'))
    .executeTakeFirst();

  const raw = await base
    .select([
      'r.id as request_id',
      'r.unit_id',
      'r.tenant_id',
      'r.landlord_id',
      'r.status',
      'r.message',
      'r.proposed_move_in',
      'r.created_at',
      'r.updated_at',
      'u.unit_identifier',
      'u.floor_number',
      'u.bedrooms',
      'u.bathrooms',
      'u.monthly_rent',
      'u.security_deposit',
      'u.availability_status',
      'p.id as property_id',
      'p.title as property_title',
      'p.address as property_address',
      'p.city as property_city',
      't.id as tenant_user_id',
      't.name as tenant_name',
      't.email as tenant_email',
      't.avatar_url as tenant_avatar_url',
      't.phone as tenant_phone',
    ])
    .orderBy('r.created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();

  const requests: PublicRentalRequestSummary[] = raw.map((row) => ({
    id: row.request_id,
    unitId: row.unit_id,
    tenantId: row.tenant_id,
    landlordId: row.landlord_id,
    status: row.status,
    message: row.message,
    proposedMoveIn: String(row.proposed_move_in),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    unit: {
      id: row.unit_id,
      unitIdentifier: row.unit_identifier,
      floorNumber: row.floor_number,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      monthlyRent: Number(row.monthly_rent),
      securityDeposit: Number(row.security_deposit),
      availabilityStatus: row.availability_status,
    },
    property: {
      id: row.property_id,
      title: row.property_title,
      address: row.property_address,
      city: row.property_city,
    },
    tenant: {
      id: row.tenant_user_id,
      name: row.tenant_name,
      email: row.tenant_email,
      avatarUrl: row.tenant_avatar_url,
      phone: row.tenant_phone,
    },
  }));

  return {
    requests,
    total: Number(countResult?.count ?? 0),
  };
}

export async function getRentalRequestById(
  db: Kysely<Database>,
  requestId: string,
  userId: string,
  roles: UserRole[]
): Promise<PublicRentalRequestSummary> {
  const row = await db
    .selectFrom('rental_requests as r')
    .innerJoin('property_units as u', 'u.id', 'r.unit_id')
    .innerJoin('properties as p', 'p.id', 'u.property_id')
    .innerJoin('users as t', 't.id', 'r.tenant_id')
    .select([
      'r.id as request_id',
      'r.unit_id',
      'r.tenant_id',
      'r.landlord_id',
      'r.status',
      'r.message',
      'r.proposed_move_in',
      'r.created_at',
      'r.updated_at',
      'u.unit_identifier',
      'u.floor_number',
      'u.bedrooms',
      'u.bathrooms',
      'u.monthly_rent',
      'u.security_deposit',
      'u.availability_status',
      'p.id as property_id',
      'p.title as property_title',
      'p.address as property_address',
      'p.city as property_city',
      't.id as tenant_user_id',
      't.name as tenant_name',
      't.email as tenant_email',
      't.avatar_url as tenant_avatar_url',
      't.phone as tenant_phone',
    ])
    .where('r.id', '=', requestId)
    .executeTakeFirst();

  if (!row) {
    throw new NotFoundError('Rental application not found');
  }

  const isApplicant = row.tenant_id === userId;
  const isLandlord = row.landlord_id === userId;
  const isAdmin = roles.includes('admin');

  if (!isApplicant && !isLandlord && !isAdmin) {
    throw new ForbiddenError(
      'You do not have permission to view this rental application'
    );
  }

  return {
    id: row.request_id,
    unitId: row.unit_id,
    tenantId: row.tenant_id,
    landlordId: row.landlord_id,
    status: row.status,
    message: row.message,
    proposedMoveIn: String(row.proposed_move_in),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    unit: {
      id: row.unit_id,
      unitIdentifier: row.unit_identifier,
      floorNumber: row.floor_number,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      monthlyRent: Number(row.monthly_rent),
      securityDeposit: Number(row.security_deposit),
      availabilityStatus: row.availability_status,
    },
    property: {
      id: row.property_id,
      title: row.property_title,
      address: row.property_address,
      city: row.property_city,
    },
    tenant: {
      id: row.tenant_user_id,
      name: row.tenant_name,
      email: row.tenant_email,
      avatarUrl: row.tenant_avatar_url,
      phone: row.tenant_phone,
    },
  };
}

export async function cancelRentalRequest(
  db: Kysely<Database>,
  requestId: string,
  userId: string
): Promise<PublicRentalRequestSummary> {
  const req = await db
    .selectFrom('rental_requests')
    .selectAll()
    .where('id', '=', requestId)
    .executeTakeFirst();

  if (!req) {
    throw new NotFoundError('Rental application not found');
  }

  if (req.tenant_id !== userId) {
    throw new ForbiddenError('Only the applicant can cancel this application');
  }

  if (req.status !== 'pending') {
    throw new BadRequestError(
      `Cannot cancel an application with status "${req.status}"`
    );
  }

  await db
    .updateTable('rental_requests')
    .set({
      status: 'cancelled',
      updated_at: sql`NOW()`,
    })
    .where('id', '=', requestId)
    .execute();

  return getRentalRequestById(db, requestId, userId, ['tenant']);
}

export async function rejectRentalRequest(
  db: Kysely<Database>,
  requestId: string,
  userId: string
): Promise<PublicRentalRequestSummary> {
  const req = await db
    .selectFrom('rental_requests')
    .selectAll()
    .where('id', '=', requestId)
    .executeTakeFirst();

  if (!req) {
    throw new NotFoundError('Rental application not found');
  }

  if (req.landlord_id !== userId) {
    throw new ForbiddenError(
      'Only the property landlord can reject this application'
    );
  }

  if (req.status !== 'pending') {
    throw new BadRequestError(
      `Cannot reject an application with status "${req.status}"`
    );
  }

  await db
    .updateTable('rental_requests')
    .set({
      status: 'rejected',
      updated_at: sql`NOW()`,
    })
    .where('id', '=', requestId)
    .execute();

  return getRentalRequestById(db, requestId, userId, ['landlord']);
}

/**
 * Concurrency-Safe Application Approval with ACID Transaction
 * Architecture Spec §5.3:
 * 1. Open transaction with row-level locks.
 * 2. SELECT ... FROM tenancies WHERE tenant_id = $1 AND status IN ('active', 'pending_signature') FOR UPDATE
 * 3. SELECT availability_status FROM property_units WHERE id = $2 FOR UPDATE
 * 4. If either check fails, rollback with clear conflict error.
 * 5. Update application to 'approved'.
 * 6. Transition unit to 'PENDING_SIGNATURE'.
 * 7. Insert tenancy in 'pending_signature' status.
 */
export async function approveRentalRequest(
  db: Kysely<Database>,
  requestId: string,
  landlordUserId: string
): Promise<{
  application: PublicRentalRequestSummary;
  tenancy: PublicTenancySummary;
}> {
  return await db.transaction().execute(async (trx) => {
    // 1. Lock and load application
    const req = await trx
      .selectFrom('rental_requests')
      .selectAll()
      .where('id', '=', requestId)
      .forUpdate()
      .executeTakeFirst();

    if (!req) {
      throw new NotFoundError('Rental application not found');
    }

    if (req.landlord_id !== landlordUserId) {
      throw new ForbiddenError(
        'Only the property landlord can approve this application'
      );
    }

    if (req.status !== 'pending') {
      throw new BadRequestError(
        `Cannot approve an application with status "${req.status}"`
      );
    }

    // 2. Lock unit and verify availability
    const unit = await trx
      .selectFrom('property_units')
      .selectAll()
      .where('id', '=', req.unit_id)
      .forUpdate()
      .executeTakeFirst();

    if (!unit) {
      throw new NotFoundError('Associated property unit not found');
    }

    if (unit.availability_status !== 'AVAILABLE') {
      throw new ConflictError(
        `Unit is no longer available for leasing (current status: ${unit.availability_status})`
      );
    }

    // 3. Lock tenant's active tenancies to enforce One Active Tenancy rule
    const activeTenantLease = await trx
      .selectFrom('tenancies')
      .select(['id', 'status'])
      .where('tenant_id', '=', req.tenant_id)
      .where('status', 'in', ['active', 'pending_signature'])
      .forUpdate()
      .executeTakeFirst();

    if (activeTenantLease) {
      throw new ConflictError(
        `Tenant already has an active tenancy or pending lease agreement (tenancy ID: ${activeTenantLease.id})`
      );
    }

    // 4. Lock unit's active tenancies
    const activeUnitLease = await trx
      .selectFrom('tenancies')
      .select(['id', 'status'])
      .where('unit_id', '=', unit.id)
      .where('status', 'in', ['active', 'pending_signature'])
      .forUpdate()
      .executeTakeFirst();

    if (activeUnitLease) {
      throw new ConflictError('Unit already has an active or pending lease binding');
    }

    // 5. Transition rental request to 'approved'
    await trx
      .updateTable('rental_requests')
      .set({
        status: 'approved',
        updated_at: sql`NOW()`,
      })
      .where('id', '=', requestId)
      .execute();

    // 6. Transition unit availability to 'PENDING_SIGNATURE'
    await trx
      .updateTable('property_units')
      .set({
        availability_status: 'PENDING_SIGNATURE',
        updated_at: sql`NOW()`,
      })
      .where('id', '=', unit.id)
      .execute();

    // 7. Create contractual tenancy in 'pending_signature' status
    const startDate = new Date(req.proposed_move_in);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1-year default lease term

    const [tenancy] = await trx
      .insertInto('tenancies')
      .values({
        unit_id: unit.id,
        tenant_id: req.tenant_id,
        landlord_id: req.landlord_id,
        rental_request_id: req.id,
        status: 'pending_signature',
        start_date: startDate as any,
        end_date: endDate as any,
        agreed_monthly_rent: unit.monthly_rent,
        agreed_deposit: unit.security_deposit,
      })
      .returningAll()
      .execute();

    const applicationSummary = await getRentalRequestById(
      trx,
      requestId,
      landlordUserId,
      ['landlord']
    );

    const tenancySummary: PublicTenancySummary = {
      id: tenancy.id,
      unitId: tenancy.unit_id,
      tenantId: tenancy.tenant_id,
      landlordId: tenancy.landlord_id,
      rentalRequestId: tenancy.rental_request_id,
      status: tenancy.status,
      startDate: String(tenancy.start_date),
      endDate: String(tenancy.end_date),
      agreedMonthlyRent: Number(tenancy.agreed_monthly_rent),
      agreedDeposit: Number(tenancy.agreed_deposit),
      signedAt: tenancy.signed_at,
      terminatedAt: tenancy.terminated_at,
      createdAt: tenancy.created_at,
      updatedAt: tenancy.updated_at,
    };

    return {
      application: applicationSummary,
      tenancy: tenancySummary,
    };
  });
}
