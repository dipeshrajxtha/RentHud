import path from 'path';
import fs from 'fs';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { Kysely } from 'kysely';

import config from '../config/env.js';
import { pingDatabase } from '../config/database.js';
import { NotFoundError } from './common/errors/index.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createLandlordsRouter } from './modules/landlords/index.js';
import { createPropertiesRouter } from './modules/properties/index.js';
import { createTenancyRouter } from './modules/tenancy/index.js';
import { createOperationsRouter } from './modules/operations/index.js';
import type { Database } from './types/database.js';

export function createApp(overrideDb?: Kysely<Database>): Application {
  const app = express();

  if (overrideDb) {
    app.locals.db = overrideDb;
  }

  // Ensure uploads directory exists
  const uploadsPath = path.resolve(process.cwd(), config.storage.uploadDir);
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  // ── Static uploaded assets
  app.use('/uploads', express.static(uploadsPath));

  // ── Security headers
  app.use(
    helmet({
      // Google Sign-In (GSI / One Tap) uses cross-origin postMessage from accounts.google.com.
      // same-origin-allow-popups blocks that channel and generates console warnings.
      // unsafe-none is safe here since we have no SharedArrayBuffer usage.
      crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    })
  );

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
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: false, limit: '25mb' }));

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
  app.use('/api/landlords', createLandlordsRouter(overrideDb));
  app.use('/api/properties', createPropertiesRouter(overrideDb));
  app.use('/api/tenancy', createTenancyRouter(overrideDb));
  app.use('/api', createOperationsRouter(overrideDb));

  // ── 404 for unmatched routes — forwarded to centralized error handler
  app.use((_req: Request, _res: Response, next) => {
    next(new NotFoundError('Resource not found'));
  });

  // ── Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}
