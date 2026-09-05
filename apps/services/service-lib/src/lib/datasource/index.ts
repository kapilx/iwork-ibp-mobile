// Dynamic Datasource Module - Multi-tenant Database Support
export { DynamicDatasourceModule } from './dynamic-datasource.module';

// Core Services
export { DynamicDatasourceService } from './dynamic-datasource.service';
export type { DatabaseConfig } from './dynamic-datasource.service';
export { DatabaseType } from './dynamic-datasource.service';
export { DatasourceContext } from './datasource-context.service';

// Decorators and Interceptors
export { UseDatasource, DatasourceType, DATASOURCE_KEY } from './use-datasource.decorator';
export { DynamicDatasourceInterceptor } from './dynamic-datasource.interceptor';

// Re-export common TypeORM types for convenience
export type { DataSource, Repository, EntityTarget, ObjectLiteral } from 'typeorm';