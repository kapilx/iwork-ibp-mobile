import { DynamicModule, Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE_MODULE_OPTIONS } from '../constants/cache.constants';
import { CacheModuleOptions } from './interfaces';

@Global()
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions = {}): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        { provide: CACHE_MODULE_OPTIONS, useValue: options },
        CacheService,
      ],
      exports: [CacheService],
    };
  }
}
