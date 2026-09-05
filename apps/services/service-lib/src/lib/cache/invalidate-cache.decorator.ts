import { CacheService } from './cache.service';
import { InvalidateCacheOptions } from './interfaces';

export function InvalidateCache(options: InvalidateCacheOptions = {}): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = (this as any).cacheService;
      if (!cacheService) {
        return original.apply(this, args);
      }

      const prefix = options.keyPrefix ?? `${target.constructor.name}:${String(propertyKey)}`;
      const keyPart = typeof options.key === 'function'
        ? options.key(...args)
        : options.key ?? JSON.stringify(args);
      const cacheKey = `${prefix}:${keyPart}`;

      console.log(`InvalidateCache: Deleting key ${cacheKey}`);
      await cacheService.del(cacheKey);

      return original.apply(this, args);
    };

    return descriptor;
  };
}
