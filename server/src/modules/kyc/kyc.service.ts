import type { Kysely } from 'kysely';
import type { Database, KycSubmission, KycStatus } from '../../types/database.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/index.js';
import { saveBase64Image } from '../../common/utils/storage.js';

/**
 * Check if a user has an approved KYC submission.
 */
export async function isUserKycApproved(
  db: Kysely<Database>,
  userId: string
): Promise<boolean> {
  const row = await db
    .selectFrom('kyc_submissions')
    .select('status')
    .where('user_id', '=', userId)
    .where('status', '=', 'approved')
    .executeTakeFirst();
  return !!row;
}

/**
 * Get the user's current/latest KYC submission.
 */
export async function getMyKycSubmission(
  db: Kysely<Database>,
  userId: string
): Promise<KycSubmission | null> {
  const row = await db
    .selectFrom('kyc_submissions')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('created_at', 'desc')
    .executeTakeFirst();
  return row ?? null;
}

interface SubmitKycInput {
  citizenshipFrontUrl: string;
  citizenshipBackUrl: string;
  policeReportUrl?: string | null;
  ownershipDocumentUrl?: string | null;
  businessRegistrationUrl?: string | null;
}

/**
 * Submit or re-submit KYC documents.
 * Only one active submission per user — replaces any previous rejected submission.
 */
export async function submitKycDocuments(
  db: Kysely<Database>,
  userId: string,
  userRole: 'tenant' | 'landlord',
  input: SubmitKycInput
): Promise<KycSubmission> {
  // Block if already approved
  const existing = await getMyKycSubmission(db, userId);
  if (existing?.status === 'approved') {
    throw new BadRequestError('Your KYC is already approved');
  }
  if (existing?.status === 'pending') {
    throw new BadRequestError('You already have a pending KYC submission. Please wait for admin review.');
  }

  // Validate required docs based on role
  if (!input.citizenshipFrontUrl || !input.citizenshipBackUrl) {
    throw new BadRequestError('Citizenship front and back images are required');
  }
  if (userRole === 'tenant' && !input.policeReportUrl) {
    throw new BadRequestError('Police report document is required for tenant verification');
  }
  if (userRole === 'landlord' && !input.ownershipDocumentUrl) {
    throw new BadRequestError('Property ownership document is required for landlord verification');
  }

  // Save base64 images to disk
  const citizenshipFrontUrl = await saveBase64Image(input.citizenshipFrontUrl, 'kyc');
  const citizenshipBackUrl = await saveBase64Image(input.citizenshipBackUrl, 'kyc');
  const policeReportUrl = input.policeReportUrl
    ? await saveBase64Image(input.policeReportUrl, 'kyc')
    : null;
  const ownershipDocumentUrl = input.ownershipDocumentUrl
    ? await saveBase64Image(input.ownershipDocumentUrl, 'kyc')
    : null;
  const businessRegistrationUrl = input.businessRegistrationUrl
    ? await saveBase64Image(input.businessRegistrationUrl, 'kyc')
    : null;

  // If previous rejected submission exists, delete it
  if (existing?.status === 'rejected') {
    await db.deleteFrom('kyc_submissions').where('id', '=', existing.id).execute();
  }

  return await db
    .insertInto('kyc_submissions')
    .values({
      user_id: userId,
      user_role: userRole,
      citizenship_front_url: citizenshipFrontUrl,
      citizenship_back_url: citizenshipBackUrl,
      police_report_url: policeReportUrl,
      ownership_document_url: ownershipDocumentUrl,
      business_registration_url: businessRegistrationUrl,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * List all KYC submissions for admin review.
 */
export async function listKycSubmissions(
  db: Kysely<Database>,
  statusFilter?: KycStatus
): Promise<any[]> {
  let query = db
    .selectFrom('kyc_submissions as k')
    .innerJoin('users as u', 'u.id', 'k.user_id')
    .select([
      'k.id',
      'k.user_id',
      'k.user_role',
      'k.citizenship_front_url',
      'k.citizenship_back_url',
      'k.police_report_url',
      'k.ownership_document_url',
      'k.business_registration_url',
      'k.status',
      'k.reviewed_at',
      'k.rejection_reason',
      'k.created_at',
      'u.name as user_name',
      'u.email as user_email',
      'u.avatar_url as user_avatar',
    ]);

  if (statusFilter) {
    query = query.where('k.status', '=', statusFilter);
  }

  return await query.orderBy('k.created_at', 'desc').execute();
}

/**
 * Admin approves a KYC submission.
 */
export async function approveKyc(
  db: Kysely<Database>,
  submissionId: string,
  adminId: string
): Promise<KycSubmission> {
  const submission = await db
    .selectFrom('kyc_submissions')
    .selectAll()
    .where('id', '=', submissionId)
    .executeTakeFirst();

  if (!submission) throw new NotFoundError('KYC submission not found');
  if (submission.status !== 'pending') {
    throw new BadRequestError(`Cannot approve a submission with status "${submission.status}"`);
  }

  return await db
    .updateTable('kyc_submissions')
    .set({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', submissionId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Admin rejects a KYC submission with a reason.
 */
export async function rejectKyc(
  db: Kysely<Database>,
  submissionId: string,
  adminId: string,
  reason: string
): Promise<KycSubmission> {
  const submission = await db
    .selectFrom('kyc_submissions')
    .selectAll()
    .where('id', '=', submissionId)
    .executeTakeFirst();

  if (!submission) throw new NotFoundError('KYC submission not found');
  if (submission.status !== 'pending') {
    throw new BadRequestError(`Cannot reject a submission with status "${submission.status}"`);
  }

  return await db
    .updateTable('kyc_submissions')
    .set({
      status: 'rejected',
      reviewed_by: adminId,
      rejection_reason: reason || 'Rejected by admin',
      updated_at: new Date(),
    })
    .where('id', '=', submissionId)
    .returningAll()
    .executeTakeFirstOrThrow();
}
