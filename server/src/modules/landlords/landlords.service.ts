import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, User } from '../../types/database.js';
import { NotFoundError } from '../../common/errors/index.js';
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
 * Creates or initializes landlord capability for an authenticated user.
 * Idempotently appends the 'landlord' role to users.roles while preserving
 * any existing roles (e.g. ['tenant'] becomes ['tenant', 'landlord']).
 * Updates mutable profile fields (phone, name, avatar_url).
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
  const needsRole = !currentRoles.includes('landlord');
  const avatarUrl = data.avatar_url !== undefined ? data.avatar_url : data.avatarUrl;

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.name !== undefined) updates.name = data.name;
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

  if (needsRole) {
    updates.roles = sql`array_append(roles, 'landlord')`;
  }

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
