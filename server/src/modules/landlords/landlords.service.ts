import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, User } from '../../types/database.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/index.js';
import { findActiveUserById } from '../users/users.service.js';
import type { CreateLandlordProfileBody, UpdateLandlordProfileBody } from './landlords.schemas.js';

/**
 * Finds an active landlord by primary key.
 * Returns null if the user does not exist, is inactive, or lacks the 'landlord' role.
 */
export async function findActiveLandlordById(
  db: Kysely<Database>,
  id: string
): Promise<User | null> {
  const user = await findActiveUserById(db, id);
  if (!user) return null;

  const roles = (user.roles as string[]) ?? [];
  if (!roles.includes('landlord')) {
    return null;
  }

  return user;
}

/**
 * Updates landlord profile fields (phone, name, avatar_url) for a landlord user.
 * RentHub accounts have a single role. Tenants cannot upgrade to landlords.
 */
export async function createOrUpgradeLandlordProfile(
  db: Kysely<Database>,
  userId: string,
  data: CreateLandlordProfileBody
): Promise<User> {
  const user = await findActiveUserById(db, userId);
  if (!user) {
    throw new NotFoundError('User not found or deactivated');
  }

  const currentRoles = (user.roles as string[]) ?? [];
  if (!currentRoles.includes('landlord')) {
    throw new ForbiddenError('Only accounts with the landlord role can create or manage a landlord profile.');
  }

  const avatarUrl = data.avatar_url !== undefined ? data.avatar_url : data.avatarUrl;

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.name !== undefined) updates.name = data.name;
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

  return await db
    .updateTable('users')
    .set(updates)
    .where('id', '=', userId)
    .where('is_active', '=', true)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Updates mutable profile fields for an existing active landlord.
 * Throws NotFoundError if the user does not exist, is inactive, or is not a landlord.
 */
export async function updateLandlordProfile(
  db: Kysely<Database>,
  userId: string,
  data: UpdateLandlordProfileBody
): Promise<User> {
  const landlord = await findActiveLandlordById(db, userId);
  if (!landlord) {
    throw new NotFoundError('Landlord profile not found or deactivated');
  }

  const avatarUrl = data.avatar_url !== undefined ? data.avatar_url : data.avatarUrl;
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

  return await db
    .updateTable('users')
    .set(updates)
    .where('id', '=', userId)
    .where('is_active', '=', true)
    .returningAll()
    .executeTakeFirstOrThrow();
}
