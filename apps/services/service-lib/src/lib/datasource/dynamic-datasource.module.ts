import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicDatasourceService } from './dynamic-datasource.service';
import { DatasourceContext } from './datasource-context.service';
import { DynamicDatasourceInterceptor } from './dynamic-datasource.interceptor';
import { ConfigCompany } from '../entities/config-company.entity';
import { DatabaseConnect } from '../entities/database-connect.entity';

/**
 * Dynamic Datasource Module
 * 
 * Provides multi-tenant database support with dynamic datasource switching
 * based on request context, subdomains, or explicit datasource types.
 * 
 * Features:
 * - Master database for configuration
 * - Centralized database for shared data
 * - Client-specific databases for tenant isolation
 * - Dynamic switching based on decorators and context
 * 
 * Usage:
 * 1. Import DynamicDatasourceModule in your service module
 * 2. Use @UseDatasource() decorator on controllers/methods
 * 3. Extend BaseDynamicRepository for automatic datasource switching
 * 4. Apply DynamicDatasourceInterceptor to controllers
 */
@Global()
@Module({
  imports: [
    // Import entities that are needed for master database operations
    TypeOrmModule.forFeature([ConfigCompany, DatabaseConnect]),
  ],
  providers: [
    DynamicDatasourceService,
    DatasourceContext,
    DynamicDatasourceInterceptor,
  ],
  exports: [
    DynamicDatasourceService,
    DatasourceContext, 
    DynamicDatasourceInterceptor,
    TypeOrmModule, // Re-export for convenience
  ],
})
export class DynamicDatasourceModule {}