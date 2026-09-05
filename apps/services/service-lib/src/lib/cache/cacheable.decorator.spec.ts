import { Cacheable } from './cacheable.decorator';
import { CacheService } from './cache.service';

class FakeCacheService {
  private data = new Map<string, any>();
  async get(key: string) { return this.data.get(key) ?? null; }
  async set(key: string, value: any) { this.data.set(key, value); }
}

describe('Cacheable decorator', () => {
  it('should cache method result', async () => {
    class TestClass {
      constructor(public cacheService: CacheService) {}

      @Cacheable({ ttl: 10, keyPrefix: 't' })
      async compute(a: number) { return a * 2; }
    }
    const svc = new TestClass(new FakeCacheService() as any);
    const first = await svc.compute(2);
    const second = await svc.compute(2);
    expect(first).toBe(4);
    expect(second).toBe(4);
  });
});
