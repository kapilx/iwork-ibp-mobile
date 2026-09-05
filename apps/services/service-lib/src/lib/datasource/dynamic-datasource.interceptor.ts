import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { DynamicDatasourceService } from './dynamic-datasource.service';
import { DatasourceContext } from './datasource-context.service';
import { DATASOURCE_KEY, DatasourceType } from './use-datasource.decorator';

/**
 * Generic Dynamic Datasource Interceptor
 * 
 * Automatically sets up the correct datasource before controller method execution
 * based on the @UseDatasource decorator. Works with any service and entities.
 * 
 * Usage:
 * 1. Apply @UseInterceptors(DynamicDatasourceInterceptor) to controllers
 * 2. Use @UseDatasource() decorators on methods
 * 3. Repositories will automatically use the correct datasource via DatasourceContext
 */
@Injectable()
export class DynamicDatasourceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DynamicDatasourceInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly datasourceService: DynamicDatasourceService,
    private readonly datasourceContext: DatasourceContext,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const datasourceType = this.reflector.get<DatasourceType>(
      DATASOURCE_KEY,
      context.getHandler()
    );

    // If no decorator specified, use centralized database by default
    if (!datasourceType) {
      const centralizedDs = await this.datasourceService.getCentralizedDataSource();
      this.datasourceContext.setDataSource(centralizedDs, 'iirm-centralize');
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    try {
      switch (datasourceType) {
        case DatasourceType.MASTER:
          await this.setupMasterDatasource();
          break;

        case DatasourceType.CENTRALIZED:
          await this.setupCentralizedDatasource();
          break;

        case DatasourceType.CLIENT:
          await this.setupClientDatasource(request);
          break;

        case DatasourceType.DYNAMIC:
          await this.setupDynamicDatasource(request);
          break;

        default:
          await this.setupCentralizedDatasource();
      }
    } catch (error) {
      this.logger.error('Failed to setup datasource', error);
      // Fallback to centralized database
      await this.setupCentralizedDatasource();
    }

    return next.handle();
  }

  private async setupMasterDatasource() {
    const masterDs = await this.datasourceService.getMasterDataSource();
    this.datasourceContext.setDataSource(masterDs, 'iirm-master');
    this.logger.debug('🔵 Using MASTER database');
  }

  private async setupCentralizedDatasource() {
    const centralizedDs = await this.datasourceService.getCentralizedDataSource();
    this.datasourceContext.setDataSource(centralizedDs, 'iirm-centralize');
    this.logger.debug('🟢 Using CENTRALIZED database');
  }

  private async setupClientDatasource(request: Record<string, unknown>) {
    // Get company ID from request (header, param, or body)
    const companyId =
      request.headers['x-company-id'] ||
      request.params.companyId ||
      request.query.companyId ||
      request.body?.companyId;

    if (!companyId) {
      this.logger.warn('No company ID found, using centralized database');
      await this.setupCentralizedDatasource();
      return;
    }

    try {
      // Get database config from master database
      const masterDs = await this.datasourceService.getMasterDataSource();
      const databaseConnectRepo = masterDs.getRepository('DatabaseConnect');
      
      const dbConfig = await databaseConnectRepo.findOne({
        where: { id: parseInt(companyId) },
      });

      if (!dbConfig) {
        this.logger.warn(
          `No database config found for company ${companyId}, using centralized database`
        );
        await this.setupCentralizedDatasource();
        return;
      }

      // Connect to client-specific database
      const clientDs = await this.datasourceService.getClientDataSource(
        parseInt(companyId),
        {
          id: dbConfig.id,
          name: dbConfig.name,
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          type: 'postgres',
        }
      );

      this.datasourceContext.setDataSource(clientDs, dbConfig.database);
      this.logger.debug(`🟡 Using CLIENT database: ${dbConfig.database}`);
    } catch (error) {
      this.logger.error('Error setting up client datasource:', error);
      await this.setupCentralizedDatasource();
    }
  }

  private async setupDynamicDatasource(request: Record<string, unknown>) {
    // Determine datasource based on request context
    const subdomain = request.headers['x-subdomain'] || request.query.subdomain;

    if (subdomain) {
      try {
        // Get company config from master database to determine client database
        const masterDs = await this.datasourceService.getMasterDataSource();
        const configCompanyRepo = masterDs.getRepository('ConfigCompany');
        
        const companyConfig = await configCompanyRepo.findOne({
          where: { subDomain: subdomain },
          relations: ['databaseConnect'],
        });

        if (companyConfig?.databaseConnect) {
          // Use client database for this subdomain
          const clientDs = await this.datasourceService.getClientDataSource(
            companyConfig.id,
            {
              id: companyConfig.databaseConnect.id,
              name: companyConfig.databaseConnect.name,
              host: companyConfig.databaseConnect.host,
              port: companyConfig.databaseConnect.port,
              username: companyConfig.databaseConnect.username,
              password: companyConfig.databaseConnect.password,
              database: companyConfig.databaseConnect.database,
              type: 'postgres',
            }
          );

          this.datasourceContext.setDataSource(clientDs, companyConfig.databaseConnect.database);
          this.logger.debug(`🟡 Using DYNAMIC CLIENT database: ${companyConfig.databaseConnect.database}`);
          return;
        }
      } catch (error) {
        this.logger.error('Error in dynamic datasource setup:', error);
      }
    }

    // Fallback to centralized database
    await this.setupCentralizedDatasource();
  }
}