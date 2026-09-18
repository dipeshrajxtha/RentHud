import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { UserRole } from '../../../../shared/enums/roles.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';

/**
 * Authorizes requests based on users.roles only.
 *
 * Rules:
 * - Missing authentication (req.user is undefined) returns 401 Unauthorized.
 * - Missing required role returns 403 Forbidden.
 * - Authorization is driven exclusively by the roles array from the verified JWT,
 *   which reflects users.roles in the database.
 * - There is NO admin bypass — an admin must explicitly possess the required role
 *   (e.g., 'landlord') to access landlord-specific endpoints.
 * - A multi-role user is authorized if any of their roles matches the allowed roles.
 * - Empty or malformed roles arrays never authorize access.
 */
export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const hasPermission =
      allowedRoles.length > 0 && allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `Access denied. Requires one of: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
}

/** Reusable role middleware requiring the 'tenant' role. */
export const requireTenant = requireRole('tenant');

/** Reusable role middleware requiring the 'landlord' role. */
export const requireLandlord = requireRole('landlord');

/** Reusable role middleware requiring the 'admin' role. */
export const requireAdmin = requireRole('admin');
