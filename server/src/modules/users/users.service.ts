import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, User } from '../../types/database.js';
import type { UpdateProfileBody } from './users.schemas.js';
import { NotFoundError } from '../../common/errors/index.js';

/**
 * Finds an active user by their UUID primary key.
 * Explicitly filters is_active = true — inactive accounts are never returned.
 */
export async function findActiveUserById(
  db: Kysely<Database>,
  id: string
): Promise<User | null> {
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .where('is_active', '=', true)
    .executeTakeFirst();

  return user ?? null;
}

/**
 * Updates mutable profile fields for the given user.
 * Only name, phone, and avatar_url are allowed — email and roles cannot be changed here.
 */
export async function updateUserProfile(
  db: Kysely<Database>,
  userId: string,
  data: UpdateProfileBody
): Promise<User> {
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

  return await db
    .updateTable('users')
    .set(updates)
    .where('id', '=', userId)
    .where('is_active', '=', true)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Appends 'landlord' to the user's roles array atomically.
 * Idempotent: returns existing user if the user already has the landlord role.
 * Only operates on active users.
 */
export async function addLandlordRole(
  db: Kysely<Database>,
  userId: string
): Promise<User> {
  const user = await findActiveUserById(db, userId);
  if (!user) {
    throw new NotFoundError('User not found or deactivated');
  }

  const currentRoles = (user.roles as string[]) ?? [];
  if (currentRoles.includes('landlord')) {
    return user;
  }

  return await db
    .updateTable('users')
    .set({
      roles: sql`array_append(roles, 'landlord')`,
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .where('is_active', '=', true)
    .returningAll()
    .executeTakeFirstOrThrow();
}
