import { createApp } from './app.js';
import config from '../config/env.js';
import { closeDatabase } from '../config/database.js';

const app = createApp();
const PORT = config.server.port;

const server = app.listen(PORT, () => {
  console.log(`[RentHub] Server running on http://localhost:${PORT} (${config.server.env})`);
  console.log(`[RentHub] Health: http://localhost:${PORT}/health`);
});

// ── Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[RentHub] ${signal} received — shutting down gracefully...`);
  server.close(async () => {
    try {
      await closeDatabase();
      console.log('[RentHub] Database connections closed.');
    } catch (err) {
      console.error('[RentHub] Error closing database:', err);
    }
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('[RentHub] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
