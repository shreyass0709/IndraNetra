import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: any = null;
  private subClient: any = null;
  private isConnected = false;
  private localEmitter = new EventEmitter();

  async onModuleInit() {
    try {
      // Dynamically require ioredis to prevent bootstrap crashes if dependency is missing
      const Redis = require('ioredis');
      const redisUrl = process.env.REDIS_HOST || 'redis://localhost:6379';
      
      console.log(`[Redis] Connecting to: ${redisUrl}`);
      
      // Connection options to avoid long hangs
      const options = {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      };

      this.client = new Redis(redisUrl, options);
      this.subClient = new Redis(redisUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('[Redis] Publisher connected successfully.');
      });

      this.subClient.on('connect', () => {
        console.log('[Redis] Subscriber connected successfully.');
      });

      const handleErr = (type: string, err: any) => {
        console.warn(`[Redis] ${type} connection issue: ${err.message}. Using local fallback.`);
        this.isConnected = false;
      };

      this.client.on('error', (err) => handleErr('Publisher', err));
      this.subClient.on('error', (err) => handleErr('Subscriber', err));
    } catch (e) {
      console.warn('[Redis] ioredis is not installed. Using local in-memory event system.');
      this.isConnected = false;
    }
  }

  async publish(channel: string, message: any) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    if (this.isConnected && this.client) {
      try {
        await this.client.publish(channel, payload);
      } catch (err) {
        console.warn(`[Redis] Publish failed to ${channel}, falling back to local:`, err.message);
        this.localEmitter.emit(channel, payload);
      }
    } else {
      this.localEmitter.emit(channel, payload);
    }
  }

  subscribe(channel: string, callback: (message: string) => void) {
    this.localEmitter.on(channel, callback);
    
    if (this.isConnected && this.subClient) {
      this.subClient.subscribe(channel, (err) => {
        if (err) {
          console.error(`[Redis] Failed to subscribe to channel ${channel}:`, err.message);
        } else {
          console.log(`[Redis] Subscribed to channel: ${channel}`);
        }
      });

      this.subClient.on('message', (chan, msg) => {
        if (chan === channel) {
          this.localEmitter.emit(channel, msg);
        }
      });
    }
  }

  onModuleDestroy() {
    try {
      if (this.client) this.client.disconnect();
      if (this.subClient) this.subClient.disconnect();
    } catch (err) {
      // Ignore
    }
  }
}
