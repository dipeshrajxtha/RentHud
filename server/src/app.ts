import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { Kysely } from 'kysely';

import config from '../config/env.js';
import { pingDatabase } from '../config/database.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import type { Database } from './types/database.js';

export function createApp(overrideDb?: Kysely<Database>): Application {
  const app = express();

  // ── Security headers
  app.use(helmet());

  // ── CORS — strictly limited to configured client origin
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // ── Cookie parsing (required for HttpOnly refresh token cookie)
  app.use(cookieParser());

  // ── Health check
  app.get('/health', async (_req: Request, res: Response) => {
    const dbStatus = await pingDatabase();
    res.status(dbStatus.connected ? 200 : 503).json({
      status: dbStatus.connected ? 'ok' : 'degraded',
      uptime: Math.floor(process.uptime()),
      database: {
        connected: dbStatus.connected,
        postgresVersion: dbStatus.postgresVersion ?? null,
        postgisVersion: dbStatus.postgisVersion ?? null,
        error: dbStatus.error ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // ── Domain routers
  app.use('/api/auth', createAuthRouter());
  app.use('/api/users', createUsersRouter());

  // ── 404 for unmatched routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: { message: 'Not found' } });
  });

  // ── Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}
