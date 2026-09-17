import type { UserRole } from '../../../shared/enums/roles.js';

declare global {
  namespace Express {
    interface Request {
      /**
       * Attached by the authenticate middleware after JWT verification.
       * Contains only the minimal authorization fields — no PII.
       * Fetch full profile via GET /api/users/me.
       */
      user?: {
        id: string;       // users.id (UUID)
        roles: UserRole[]; // users.roles (PostgreSQL TEXT[])
      };
    }
  }
}
