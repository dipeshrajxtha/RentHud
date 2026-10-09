import { Router, type Request, type Response } from 'express';
import { realtimeHub } from './realtime.service.js';

export function createRealtimeRouter(): Router {
  const router = Router();

  // SSE Stream Endpoint: GET /api/realtime/stream
  router.get('/stream', (req: Request, res: Response) => {
    // Optional token query or header for targeted messages
    const userId = (req.query.userId as string) || undefined;
    const clientId = realtimeHub.registerClient(res, userId);

    req.on('close', () => {
      realtimeHub.removeClient(clientId);
    });
  });

  // Health and connection statistics: GET /api/realtime/status
  router.get('/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        activeClients: realtimeHub.getConnectedCount(),
        serverTime: new Date().toISOString(),
        status: 'healthy',
      },
    });
  });

  return router;
}
