import type { Request, Response, NextFunction } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '../../types/database.js';
import { sendSuccess } from '../../common/utils/response.js';
import {
  createConversationSchema,
  sendMessageSchema,
  executeActionSchema,
} from './chatbot.schemas.js';
import { chatbotService } from './chatbot.service.js';

function getDb(req: Request): Kysely<Database> {
  return req.app.locals.db;
}

function getSessionId(req: Request): string | undefined {
  const header = req.headers['x-session-id'];
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim();
  }
  return undefined;
}

export async function createConversationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = createConversationSchema.parse(req.body);
    const userId = req.user?.id;
    const sessionId = input.sessionId || getSessionId(req);
    const db = getDb(req);

    const result = await chatbotService.createConversation(db, userId, {
      ...input,
      sessionId,
    });

    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function listConversationsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const sessionId = (req.query.sessionId as string) || getSessionId(req);
    const db = getDb(req);

    const conversations = await chatbotService.listConversations(db, userId, sessionId);
    sendSuccess(res, { conversations }, 200);
  } catch (err) {
    next(err);
  }
}

export async function getConversationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;
    const sessionId = (req.query.sessionId as string) || getSessionId(req);
    const db = getDb(req);

    const conversation = await chatbotService.getConversationDetail(db, id, userId, sessionId);
    sendSuccess(res, { conversation }, 200);
  } catch (err) {
    next(err);
  }
}

export async function sendMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const input = sendMessageSchema.parse(req.body);
    const userId = req.user?.id;
    const sessionId = input.sessionId || getSessionId(req);
    const db = getDb(req);

    const result = await chatbotService.processUserMessage(
      db,
      id,
      userId,
      sessionId,
      input
    );

    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function executeActionHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const input = executeActionSchema.parse(req.body);
    const userId = req.user?.id;
    const sessionId = input.sessionId || getSessionId(req);
    const db = getDb(req);

    const result = await chatbotService.executeAction(
      db,
      id,
      userId,
      sessionId,
      input
    );

    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function deleteConversationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;
    const sessionId = (req.query.sessionId as string) || getSessionId(req);
    const db = getDb(req);

    await chatbotService.deleteConversation(db, id, userId, sessionId);
    sendSuccess(res, { success: true }, 200);
  } catch (err) {
    next(err);
  }
}
