import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

/**
 * Backs Socket.IO with Redis pub/sub so the CrowdGateway's broadcasts (crowd
 * updates, alerts, SOS, notifications) reach every connected client even when
 * the API runs as multiple instances behind a load balancer. Falls back to
 * Socket.IO's default in-memory adapter (single-instance only) if Redis is
 * unreachable, so local dev without Redis still works exactly as before.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_HOST || 'redis://localhost:6379';

    try {
      const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000, lazyConnect: true });
      const subClient = pubClient.duplicate();

      // Errors are already surfaced via the connect() rejection below; without
      // these listeners ioredis logs a noisy "Unhandled error event" on top.
      pubClient.on('error', () => {});
      subClient.on('error', () => {});

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      console.log('[Realtime] Socket.IO Redis adapter connected — gateway can now scale horizontally.');
    } catch (err: any) {
      console.warn('[Realtime] Redis unavailable, Socket.IO will run single-instance (in-memory):', err.message);
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
