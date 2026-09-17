import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../../../../shared/enums/roles.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';

/**
 * Authorizes requests based on users.roles only.
 *
 * Authorization is driven exclusively by the roles array from the verified JWT,
 * which reflects users.roles in the database. There is no admin bypass —
 * admin users require the specific domain role (e.g. 'landlord') to access
 * landlord-specific endpoints. There is no client-side activeRole influence.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const hasPermission = allowedRoles.some((role) => req.user!.roles.includes(role));

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
