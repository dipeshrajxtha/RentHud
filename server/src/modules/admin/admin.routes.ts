import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate.js';
import {
  requireAdmin,
  getStats,
  getUsers,
  toggleUserStatus,
  getDisputes,
  resolveDispute,
  getVerifications,
  approveVerification,
  rejectVerification,
} from './admin.controller.js';

/**
 * Builds and returns the /api/admin router.
 * All routes require authentication + admin role.
 */
export function createAdminRouter(): Router {
  const router = Router();

  // All admin routes require authentication and admin role
  router.use(authenticate);
  router.use(requireAdmin);

  // Platform overview statistics
  router.get('/stats', getStats);

  // User management
  router.get('/users', getUsers);
  router.patch('/users/:id/toggle-status', toggleUserStatus);

  // Dispute arbitration
  router.get('/disputes', getDisputes);
  router.patch('/disputes/:id/resolve', resolveDispute);

  // Verification desk
  router.get('/verifications', getVerifications);
  router.patch('/verifications/:id/approve', approveVerification);
  router.patch('/verifications/:id/reject', rejectVerification);

  return router;
}
