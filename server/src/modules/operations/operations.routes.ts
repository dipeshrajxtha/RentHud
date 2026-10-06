import { Router } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import * as operationsController from './operations.controller.js';

export function createOperationsRouter(dbInstance?: Kysely<Database>): Router {
  const router = Router();

  if (dbInstance) {
    router.use((req, _res, next) => {
      if (!req.app.locals.db) {
        req.app.locals.db = dbInstance;
      }
      next();
    });
  }

  // All endpoints require authentication
  router.use(authenticate);

  // ── Maintenance Endpoints ──────────────────────────────────────────────────
  router.post('/maintenance', operationsController.createMaintenanceTicketHandler);
  router.get('/maintenance', operationsController.getMaintenanceTicketsHandler);
  router.patch('/maintenance/:id', operationsController.updateMaintenanceTicketHandler);

  // ── Payment Endpoints ──────────────────────────────────────────────────────
  router.get('/payments', operationsController.getRentPaymentsHandler);
  router.post('/payments/:id/pay', operationsController.payRentHandler);

  return router;
}
