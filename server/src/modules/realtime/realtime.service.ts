import { EventEmitter } from 'events';
import type { Response } from 'express';

export type RealtimeEventType =
  | 'connected'
  | 'tenancy:application_created'
  | 'tenancy:application_approved'
  | 'tenancy:application_rejected'
  | 'tenancy:application_cancelled'
  | 'tenancy:lease_signed'
  | 'tenancy:lease_terminated'
  | 'maintenance:created'
  | 'maintenance:updated'
  | 'payment:paid'
  | 'payment:created'
  | 'property:created'
  | 'property:updated'
  | 'property:deleted'
  | 'unit:created'
  | 'unit:updated'
  | 'unit:deleted'
  | 'dispute:created'
  | 'kyc:updated'
  | 'user:profile_updated';

interface SseClient {
  id: string;
  res: Response;
  userId?: string;
  connectedAt: Date;
}

class RealtimeEventHub extends EventEmitter {
  private clients: Map<string, SseClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Increase listener limit for busy environments
    this.setMaxListeners(200);

    // Heartbeat ping every 25 seconds to keep SSE connections alive through reverse proxies
    this.heartbeatInterval = setInterval(() => {
      this.broadcastHeartbeat();
    }, 25000);
  }

  public registerClient(res: Response, userId?: string): string {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const client: SseClient = {
      id: clientId,
      res,
      userId,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);

    // Write SSE connection headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // For Nginx / Cloudflare compatibility
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial handshake
    this.sendToClient(client, 'connected', {
      clientId,
      status: 'active',
      timestamp: new Date().toISOString(),
      activeClients: this.clients.size,
    });

    return clientId;
  }

  public removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.res.end();
      } catch {}
      this.clients.delete(clientId);
    }
  }

  public emitEvent(type: RealtimeEventType, payload: any, targetUserId?: string): void {
    const message = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.emit(type, message);

    for (const [clientId, client] of this.clients.entries()) {
      if (targetUserId && client.userId && client.userId !== targetUserId) {
        continue;
      }
      this.sendToClient(client, type, message);
    }
  }

  private sendToClient(client: SseClient, eventName: string, data: any): void {
    try {
      client.res.write(`event: ${eventName}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      this.clients.delete(client.id);
    }
  }

  private broadcastHeartbeat(): void {
    const pingData = JSON.stringify({ ping: true, time: new Date().toISOString() });
    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.res.write(`: heartbeat ${pingData}\n\n`);
      } catch {
        this.clients.delete(clientId);
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const realtimeHub = new RealtimeEventHub();
