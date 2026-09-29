import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { Database, User } from '../../types/database.js';
import type { UpdateProfileBody } from './users.schemas.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/index.js';
import type { UserRole } from '../../../../shared/enums/roles.js';

const VALID_USER_ROLES: UserRole[] = ['tenant', 'landlord'];

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
 * Sets the initial roles for a brand-new user (roles is currently empty).
 * Only 'tenant' and 'landlord' are accepted; 'admin' cannot be self-assigned.
 * Throws 400 if roles are already set (idempotency guard).
 */
export async function setInitialRoles(
  db: Kysely<Database>,
  userId: string,
  roles: UserRole[]
): Promise<User> {
  if (roles.length === 0) throw new BadRequestError('At least one role is required');
  const invalid = roles.filter(r => !VALID_USER_ROLES.includes(r));
  if (invalid.length) throw new BadRequestError(`Invalid roles: ${invalid.join(', ')}`);

  const user = await findActiveUserById(db, userId);
  if (!user) throw new NotFoundError('User not found or deactivated');

  const current = (user.roles as string[]) ?? [];
  if (current.length > 0) throw new ForbiddenError('Roles already set — use the add-role endpoint to add a second role');

  return await db
    .updateTable('users')
    .set({ roles: roles as unknown as string[], updated_at: new Date() })
    .where('id', '=', userId)
    .where('is_active', '=', true)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Appends a single role to the user's roles array atomically.
 * Idempotent: returns existing user if the role is already present.
 * Only 'tenant' and 'landlord' are self-assignable.
 */
export async function addRole(
  db: Kysely<Database>,
  userId: string,
  role: UserRole
): Promise<User> {
  if (!VALID_USER_ROLES.includes(role)) throw new BadRequestError(`Role '${role}' cannot be self-assigned`);

  const user = await findActiveUserById(db, userId);
  if (!user) throw new NotFoundError('User not found or deactivated');

  const currentRoles = (user.roles as string[]) ?? [];
  if (currentRoles.includes(role)) return user; // already has this role — idempotent

  return await db
    .updateTable('users')
    .set({
      roles: sql`array_append(roles, ${role})`,
      updated_at: new Date(),
    })
    .where('id', '=', userId)
    .where('is_active', '=', true)
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * @deprecated Use addRole('landlord') instead. Kept for backward compat.
 */
export async function addLandlordRole(
  db: Kysely<Database>,
  userId: string
): Promise<User> {
  return addRole(db, userId, 'landlord');
}
