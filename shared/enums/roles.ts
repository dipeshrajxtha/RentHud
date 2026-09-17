/**
 * RentHub User Roles
 *
 * Roles are stored in users.roles (TEXT[] in PostgreSQL).
 * A user may hold multiple roles simultaneously (e.g. ['tenant', 'landlord']).
 * Authorization is driven exclusively by users.roles — never by any client-side concept.
 */
export type UserRole = 'tenant' | 'landlord' | 'admin';

export const USER_ROLES = {
  TENANT: 'tenant',
  LANDLORD: 'landlord',
  ADMIN: 'admin',
} as const satisfies Record<string, UserRole>;
