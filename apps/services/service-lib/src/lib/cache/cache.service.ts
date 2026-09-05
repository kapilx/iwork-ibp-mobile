import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  BeforeApplicationShutdown,
} from '@nestjs/common';
import Redis from 'ioredis';
import { createPool, Pool } from 'generic-pool';
import { CACHE_MODULE_OPTIONS } from '../constants/cache.constants';
import { CacheModuleOptions } from './interfaces';
import { ENV } from '../environment';

@Injectable()
export class CacheService implements OnModuleDestroy, BeforeApplicationShutdown {
  private readonly logger = new Logger(CacheService.name);
  private pool: Pool<Redis>;
  private readonly options: CacheModuleOptions;

  constructor(@Inject(CACHE_MODULE_OPTIONS) options: CacheModuleOptions = {}) {
    this.options = options;

    const host = ENV.REDIS_HOST || '127.0.0.1';
    const port = ENV.REDIS_PORT ? parseInt(ENV.REDIS_PORT, 10) : 6379;

    const factory = {
      create: async () => {
        console.log('[Valkey] Creating Redis-compatible client...');
        const client = new Redis({
          host,
          port,
          tls: {},
          // lazyConnect: false, // prevent hanging issues
          maxRetriesPerRequest: this.options.maxRetries ?? 5,
          retryStrategy: (times: number) => {
            if (times > (this.options.maxRetries ?? 5)) return null;
            return (this.options.retryDelay ?? 300) * Math.pow(2, times);
          },
        });

        client.on('ready', () => console.log('[Valkey] Client ready'));
        client.on('error', (err) =>
          console.error('[Valkey Client Error]', err),
        );

        // DO NOT call client.connect() manually — ioredis handles it

        return client;
      },
      destroy: async (client: Redis) => {
        try {
          await client.quit();
        } catch (err) {
          this.logger.error('Error closing Valkey client', err as any);
        }
      },
    };

    this.pool = createPool(factory, {
      max: this.options.maxConnections ?? 10,
      min: 1,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    let client: Redis | null = null;
    try {
      console.log('[Valkey] Acquiring client for GET key:', key);
      client = await this.pool.acquire();
      const data = await client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (err) {
      this.logger.error(`Valkey GET failed for key ${key}`, err as any);
      return null;
    } finally {
      if (client) {
        await this.pool.release(client);
      }
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    let client: Redis | null = null;
    try {
      console.log('[Valkey] Acquiring client for SET key:', key);
      client = await this.pool.acquire();
      const payload = JSON.stringify(value);
      if (ttl) {
        await client.set(key, payload, 'EX', ttl);
      } else {
        await client.set(key, payload);
      }
    } catch (err) {
      this.logger.error(`Valkey SET failed for key ${key}`, err as any);
    } finally {
      if (client) {
        await this.pool.release(client);
      }
    }
  }

  async del(key: string): Promise<void> {
    let client: Redis | null = null;
    try {
      console.log('[Valkey] Acquiring client for DEL key:', key);
      client = await this.pool.acquire();
      await client.del(key);
    } catch (err) {
      this.logger.error(`Valkey DEL failed for key ${key}`, err as any);
    } finally {
      if (client) {
        await this.pool.release(client);
      }
    }
  }

  async onModuleDestroy() {
    await this.pool.drain();
    await this.pool.clear();
  }

  async beforeApplicationShutdown() {
    await this.onModuleDestroy();
  }
}
