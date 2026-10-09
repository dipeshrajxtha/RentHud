import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/index.js';

export interface CreateMaintenanceInput {
  tenancyId?: string;
  propertyId: string;
  unitId?: string;
  category: string;
  urgency?: 'Emergency' | 'High' | 'Normal' | 'Low';
  title: string;
  description: string;
  preferredTimeWindow?: string;
}

export interface UpdateMaintenanceInput {
  status?: 'Reported' | 'Scheduled' | 'In Progress' | 'Resolved';
  assignedContractor?: string;
  scheduledDate?: string;
}

export async function createMaintenanceTicket(
  db: Kysely<Database>,
  userId: string,
  input: CreateMaintenanceInput
) {
  // Verify property exists
  const prop = await db
    .selectFrom('properties')
    .select(['id', 'title'])
    .where('id', '=', input.propertyId)
    .executeTakeFirst();

  if (!prop) {
    throw new NotFoundError('Property not found');
  }

  const [ticket] = await db
    .insertInto('maintenance_requests')
    .values({
      property_id: input.propertyId,
      tenancy_id: input.tenancyId ?? null,
      unit_id: input.unitId ?? null,
      reported_by_id: userId,
      category: input.category,
      urgency: input.urgency ?? 'Normal',
      title: input.title,
      description: input.description,
      preferred_time_window: input.preferredTimeWindow ?? null,
      status: 'Reported',
    })
    .returningAll()
    .execute();

  return formatTicket(ticket, prop.title);
}

export async function getMaintenanceTickets(
  db: Kysely<Database>,
  userId: string,
  userRoles: string[]
) {
  const isLandlord = userRoles.includes('landlord');

  let query = db
    .selectFrom('maintenance_requests as m')
    .innerJoin('properties as p', 'p.id', 'm.property_id')
    .innerJoin('users as u', 'u.id', 'm.reported_by_id')
    .leftJoin('property_units as pu', 'pu.id', 'm.unit_id')
    .select([
      'm.id',
      'm.property_id',
      'm.tenancy_id',
      'm.unit_id',
      'm.reported_by_id',
      'm.category',
      'm.urgency',
      'm.title',
      'm.description',
      'm.preferred_time_window',
      'm.assigned_contractor',
      'm.scheduled_date',
      'm.status',
      'm.created_at',
      'm.updated_at',
      'p.title as property_title',
      'pu.unit_identifier',
      'u.name as reporter_name',
    ]);

  if (isLandlord) {
    query = query.where('p.landlord_id', '=', userId);
  } else {
    query = query.where('m.reported_by_id', '=', userId);
  }

  const rows = await query.orderBy('m.created_at', 'desc').execute();

  return rows.map((r) => ({
    id: r.id,
    tenancyId: r.tenancy_id,
    propertyId: r.property_id,
    propertyTitle: r.property_title,
    unitId: r.unit_id,
    unitIdentifier: r.unit_identifier ?? 'General Building',
    reportedBy: r.reporter_name,
    category: r.category,
    urgency: r.urgency,
    title: r.title,
    description: r.description,
    status: r.status,
    preferredTimeWindow: r.preferred_time_window,
    assignedContractor: r.assigned_contractor,
    scheduledDate: r.scheduled_date ? new Date(r.scheduled_date).toISOString().split('T')[0] : null,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }));
}

export async function updateMaintenanceTicket(
  db: Kysely<Database>,
  userId: string,
  userRoles: string[],
  ticketId: string,
  input: UpdateMaintenanceInput
) {
  const ticket = await db
    .selectFrom('maintenance_requests as m')
    .innerJoin('properties as p', 'p.id', 'm.property_id')
    .select(['m.id', 'p.landlord_id', 'm.reported_by_id'])
    .where('m.id', '=', ticketId)
    .executeTakeFirst();

  if (!ticket) {
    throw new NotFoundError('Maintenance ticket not found');
  }

  const isLandlord = ticket.landlord_id === userId || userRoles.includes('admin');
  const isReporter = ticket.reported_by_id === userId;

  if (!isLandlord && !isReporter) {
    throw new ForbiddenError('Not authorized to update this ticket');
  }

  const updateData: any = {
    updated_at: new Date(),
  };

  if (input.status) updateData.status = input.status;
  if (input.assignedContractor !== undefined) updateData.assigned_contractor = input.assignedContractor;
  if (input.scheduledDate) updateData.scheduled_date = new Date(input.scheduledDate);

  const [updated] = await db
    .updateTable('maintenance_requests')
    .set(updateData)
    .where('id', '=', ticketId)
    .returningAll()
    .execute();

  return updated;
}

function formatTicket(t: any, propertyTitle: string) {
  return {
    id: t.id,
    tenancyId: t.tenancy_id,
    propertyId: t.property_id,
    propertyTitle,
    unitId: t.unit_id,
    unitIdentifier: t.unit_identifier ?? 'Unit',
    category: t.category,
    urgency: t.urgency,
    title: t.title,
    description: t.description,
    status: t.status,
    preferredTimeWindow: t.preferred_time_window,
    assignedContractor: t.assigned_contractor,
    scheduledDate: t.scheduled_date,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rent Payments
// ─────────────────────────────────────────────────────────────────────────────

export async function getRentPayments(
  db: Kysely<Database>,
  userId: string,
  userRoles: string[]
) {
  const isLandlord = userRoles.includes('landlord');

  // Auto-generate current month pending invoice for any active lease if not already present
  await generatePendingInvoices(db);

  let query = db
    .selectFrom('rent_payments as rp')
    .innerJoin('properties as p', 'p.id', 'rp.property_id')
    .innerJoin('tenancies as t', 't.id', 'rp.tenancy_id')
    .innerJoin('users as u', 'u.id', 'rp.tenant_id')
    .leftJoin('property_units as pu', 'pu.id', 't.unit_id')
    .select([
      'rp.id',
      'rp.tenancy_id',
      'rp.property_id',
      'rp.tenant_id',
      'rp.amount',
      'rp.month_for',
      'rp.due_date',
      'rp.paid_date',
      'rp.payment_method',
      'rp.transaction_id',
      'rp.status',
      'rp.receipt_number',
      'rp.created_at',
      'p.title as property_title',
      'pu.unit_identifier',
      'u.name as tenant_name',
    ]);

  if (isLandlord) {
    query = query.where('p.landlord_id', '=', userId);
  } else {
    query = query.where('rp.tenant_id', '=', userId);
  }

  const rows = await query.orderBy('rp.due_date', 'desc').execute();

  return rows.map((r) => ({
    id: r.id,
    tenancyId: r.tenancy_id,
    propertyId: r.property_id,
    propertyTitle: r.property_title,
    unitIdentifier: r.unit_identifier ?? 'Unit',
    tenantName: r.tenant_name,
    amount: Number(r.amount),
    monthFor: r.month_for,
    dueDate: new Date(r.due_date).toISOString().split('T')[0],
    paidDate: r.paid_date ? new Date(r.paid_date).toISOString() : null,
    paymentMethod: r.payment_method,
    transactionId: r.transaction_id,
    status: r.status,
    receiptNumber: r.receipt_number,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export async function payRentRecord(
  db: Kysely<Database>,
  userId: string,
  paymentId: string,
  method: string,
  transactionId?: string
) {
  const payment = await db
    .selectFrom('rent_payments')
    .selectAll()
    .where('id', '=', paymentId)
    .executeTakeFirst();

  if (!payment) {
    throw new NotFoundError('Payment record not found');
  }

  let isAuthorized = payment.tenant_id === userId;
  if (!isAuthorized) {
    const prop = await db
      .selectFrom('properties')
      .select('landlord_id')
      .where('id', '=', payment.property_id)
      .executeTakeFirst();
    if (prop && prop.landlord_id === userId) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    throw new ForbiddenError('Not authorized to settle this payment');
  }

  if (payment.status === 'PAID') {
    throw new BadRequestError('This invoice has already been paid');
  }

  const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const [updated] = await db
    .updateTable('rent_payments')
    .set({
      status: 'PAID',
      paid_date: new Date(),
      payment_method: method,
      transaction_id: transactionId || `TX-${Date.now()}`,
      receipt_number: receiptNumber,
      updated_at: new Date(),
    })
    .where('id', '=', paymentId)
    .returningAll()
    .execute();

  return updated;
}

async function generatePendingInvoices(db: Kysely<Database>) {
  // Find active tenancies
  const activeTenancies = await db
    .selectFrom('tenancies as t')
    .innerJoin('property_units as pu', 'pu.id', 't.unit_id')
    .innerJoin('properties as p', 'p.id', 'pu.property_id')
    .select([
      't.id as tenancy_id',
      't.tenant_id',
      't.agreed_monthly_rent',
      'p.id as property_id',
    ])
    .where('t.status', '=', 'active')
    .execute();

  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthStr = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);

  for (const tenancy of activeTenancies) {
    const existing = await db
      .selectFrom('rent_payments')
      .select('id')
      .where('tenancy_id', '=', tenancy.tenancy_id)
      .where('month_for', '=', currentMonthStr)
      .executeTakeFirst();

    if (!existing) {
      await db
        .insertInto('rent_payments')
        .values({
          tenancy_id: tenancy.tenancy_id,
          property_id: tenancy.property_id,
          tenant_id: tenancy.tenant_id,
          amount: tenancy.agreed_monthly_rent,
          month_for: currentMonthStr,
          due_date: dueDate,
          status: 'PENDING',
        })
        .execute();
    }
  }
}
