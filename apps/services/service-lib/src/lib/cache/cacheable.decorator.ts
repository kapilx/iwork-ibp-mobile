import { ENV } from '../environment';
import { CacheService } from './cache.service';
import { CacheableOptions } from './interfaces';

export function Cacheable(options: CacheableOptions = {}): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = (this as any).cacheService;
      if (!cacheService) {
        return original.apply(this, args);
      }

      const disable = typeof options.disable === 'function' ? options.disable(...args) : options.disable;
      if (disable) {
        return original.apply(this, args);
      }

      const prefix = options.keyPrefix ?? `${target.constructor.name}:${String(propertyKey)}`;
      const keyPart = typeof options.key === 'function' ? options.key(...args) : options.key ?? JSON.stringify(args);
      const cacheKey = `${prefix}:${keyPart}`;

      const cached = await cacheService.get<any>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await original.apply(this, args);
      const ttl = typeof options.ttl === 'function' ? options.ttl(...args) : (options.ttl ?? parseInt(ENV.CACHE_TTL || '600'));
      await cacheService.set(cacheKey, result, ttl);
      return result;
    };
    return descriptor;
  };
}
