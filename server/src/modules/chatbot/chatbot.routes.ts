import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { verifyAccessToken } from '../../common/utils/jwt.js';
import { USER_ROLES, type UserRole } from '../../../../shared/enums/roles.js';
import * as chatbotController from './chatbot.controller.js';

const VALID_ROLES = new Set<string>(Object.values(USER_ROLES));

function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.has(role);
}

/**
 * Optional authentication middleware for chatbot.
 * Attaches req.user if a valid token is provided, but does NOT reject unauthenticated guests.
 */
function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (token.length === 0) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    if (
      payload &&
      typeof payload === 'object' &&
      typeof payload.sub === 'string' &&
      Array.isArray(payload.roles) &&
      payload.roles.every(isValidUserRole)
    ) {
      req.user = { id: payload.sub, roles: payload.roles };
    }
  } catch {
    // Guest fallback if token invalid or expired
  }

  next();
}

export function createChatbotRouter(dbInstance?: Kysely<Database>): Router {
  const router = Router();

  if (dbInstance) {
    router.use((req, _res, next) => {
      if (!req.app.locals.db) {
        req.app.locals.db = dbInstance;
      }
      next();
    });
  }

  router.use(optionalAuthenticate);

  router.post('/conversations', chatbotController.createConversationHandler);
  router.get('/conversations', chatbotController.listConversationsHandler);
  router.get('/conversations/:id', chatbotController.getConversationHandler);
  router.post('/conversations/:id/messages', chatbotController.sendMessageHandler);
  router.post('/conversations/:id/action', chatbotController.executeActionHandler);
  router.delete('/conversations/:id', chatbotController.deleteConversationHandler);

  return router;
}

