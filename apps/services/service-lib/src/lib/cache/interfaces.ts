export interface CacheModuleOptions {
  maxConnections?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface CacheableOptions {
  ttl?: number | ((...args: any[]) => number);
  keyPrefix?: string;
  key?: string | ((...args: any[]) => string);
  disable?: boolean | ((...args: any[]) => boolean);
}

export interface InvalidateCacheOptions {
  key?: string | ((...args: any[]) => string);
  keyPrefix?: string;
}
