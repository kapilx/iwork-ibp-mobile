import { SetMetadata } from '@nestjs/common';

export const DATASOURCE_KEY = 'datasource';

export enum DatasourceType {
  MASTER = 'master',
  CENTRALIZED = 'centralized',
  CLIENT = 'client',
  DYNAMIC = 'dynamic', // Will be determined at runtime based on request
}

/**
 * Decorator to specify which datasource to use for a controller method
 *
 * @example
 * // Use master database
 * @UseDatasource(DatasourceType.MASTER)
 * @Get('admin/config')
 * getAdminConfig() { ... }
 *
 * @example
 * // Use centralized database (default)
 * @UseDatasource(DatasourceType.CENTRALIZED)
 * @Get('companies')
 * getCompanies() { ... }
 *
 * @example
 * // Use client-specific database (determined from request header/params)
 * @UseDatasource(DatasourceType.CLIENT)
 * @Get('client/:companyId/data')
 * getClientData(@Param('companyId') companyId: number) { ... }
 */
export const UseDatasource = (datasourceType: DatasourceType) =>
  SetMetadata(DATASOURCE_KEY, datasourceType);