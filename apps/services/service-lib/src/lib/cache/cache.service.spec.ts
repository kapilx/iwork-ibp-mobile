import { Test } from '@nestjs/testing';
import { CacheModule } from './cache.module';
import { CacheService } from './cache.service';

class FakeRedis {
  private store = new Map<string, string>();
  async connect() {}
  async quit() {}
  async get(key: string) { return this.store.get(key) ?? null; }
  async set(key: string, value: string, mode?: string, ttl?: number) { this.store.set(key, value); }
  async del(key: string) { this.store.delete(key); }
}

jest.mock('ioredis', () => jest.fn().mockImplementation(() => new FakeRedis()));

describe('CacheService', () => {
  it('should set and get values', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CacheModule.forRoot()],
    }).compile();
    const service = moduleRef.get(CacheService);
    await service.set('a', { hello: 'world' });
    const val = await service.get<any>('a');
    expect(val).toEqual({ hello: 'world' });
  });
});
