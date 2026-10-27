import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate.js';
import {
  getMyKyc,
  getKycStatus,
  submitKyc,
} from './kyc.controller.js';

/**
 * Builds /api/kyc router — user-facing KYC endpoints.
 * Admin KYC routes are registered in admin.routes.ts.
 */
export function createKycRouter(): Router {
  const router = Router();

  // All KYC routes require authentication
  router.use(authenticate);

  // Get my current KYC submission
  router.get('/me', getMyKyc);

  // Quick verification status check
  router.get('/status', getKycStatus);

  // Submit KYC documents for review
  router.post('/submit', submitKyc);

  return router;
}
