import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DataSource, DataSourceOptions, EntityTarget, ObjectLiteral } from 'typeorm';

export interface DatabaseConfig {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  type: 'postgres' | 'mysql' | 'mariadb';
}

export enum DatabaseType {
  MASTER = 'iirm-master',
  CENTRALIZED = 'iirm-centralize',
  CLIENT = 'client',
}

/**
 * Dynamic Datasource Service
 * 
 * Manages multiple database connections for multi-tenant applications.
 * Supports master, centralized, and client-specific databases.
 */
@Injectable()
export class DynamicDatasourceService implements OnModuleDestroy {
  private readonly logger = new Logger(DynamicDatasourceService.name);
  private readonly dataSources = new Map<string, DataSource>();
  private readonly connectionPromises = new Map<string, Promise<DataSource>>();

  /**
   * Get or create a datasource connection
   * @param dbConfig Database configuration
   * @param entities Optional entities to register with this datasource
   * @returns DataSource instance
   */
  async getDataSource(
    dbConfig: DatabaseConfig,
    entities?: EntityTarget<ObjectLiteral>[]
  ): Promise<DataSource> {
    const connectionKey = this.getConnectionKey(dbConfig);

    // Return existing connection if available
    if (this.dataSources.has(connectionKey)) {
      const dataSource = this.dataSources.get(connectionKey);
      if (dataSource?.isInitialized) {
        return dataSource;
      }
    }

    // Wait for pending connection if it exists
    if (this.connectionPromises.has(connectionKey)) {
      const promise = this.connectionPromises.get(connectionKey);
      if (promise) {
        return promise;
      }
    }

    // Create new connection
    const connectionPromise = this.createDataSource(dbConfig, connectionKey, entities);
    this.connectionPromises.set(connectionKey, connectionPromise);

    try {
      const dataSource = await connectionPromise;
      this.dataSources.set(connectionKey, dataSource);
      return dataSource;
    } finally {
      this.connectionPromises.delete(connectionKey);
    }
  }

  /**
   * Get datasource by database name (for convenience)
   * @param databaseName Database name
   * @param dbConfig Optional full config if not using cached connection
   */
  async getDataSourceByName(
    databaseName: string,
    dbConfig?: DatabaseConfig
  ): Promise<DataSource | null> {
    // Try to find existing connection
    for (const [key, dataSource] of this.dataSources.entries()) {
      if (key.includes(databaseName) && dataSource.isInitialized) {
        return dataSource;
      }
    }

    // Create new connection if config provided
    if (dbConfig) {
      return this.getDataSource(dbConfig);
    }

    return null;
  }

  /**
   * Create a new DataSource instance
   */
  private async createDataSource(
    dbConfig: DatabaseConfig,
    connectionKey: string,
    entities?: EntityTarget<ObjectLiteral>[]
  ): Promise<DataSource> {
    this.logger.log(`Creating new datasource: ${connectionKey}`);

    // Get entities from the main entities export if not provided
    if (!entities) {
      const { entities: allEntities } = await import('../entities');
      entities = allEntities;
    }

    const dataSourceOptions: DataSourceOptions = {
      type: dbConfig.type || 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: entities || [],
      synchronize: false, // Never use true in production
      logging: process.env.NODE_ENV === 'dev' ? ['error', 'warn'] : false,
      poolSize: 10,
      extra: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout:  process.env.QUERY_TIMEOUT_MS ? Number.parseInt(process.env.QUERY_TIMEOUT_MS) : 60000,
        lock_timeout: process.env.QUERY_TIMEOUT_MS ? Number.parseInt(process.env.QUERY_TIMEOUT_MS) : 60000,
      },
    };

    const dataSource = new DataSource(dataSourceOptions);

    try {
      await dataSource.initialize();
      this.logger.log(`✅ Datasource initialized: ${connectionKey}`);
      return dataSource;
    } catch (error) {
      this.logger.error(
        `❌ Failed to initialize datasource: ${connectionKey}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get the master database connection
   * This should always be available for configuration data
   */
  async getMasterDataSource(entities?: EntityTarget<ObjectLiteral>[]): Promise<DataSource> {
    const masterConfig: DatabaseConfig = {
      id: 0,
      name: DatabaseType.MASTER,
      host: process.env.MASTER_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.MASTER_DB_PORT || process.env.DB_PORT || '5432'),
      username: process.env.MASTER_DB_USER || process.env.DB_USER || 'postgres',
      password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'iirm-master',
      type: (process.env.MASTER_DB_TYPE || process.env.DB_TYPE || 'postgres') as 'postgres',
    };

    return this.getDataSource(masterConfig, entities);
  }

  /**
   * Get the centralized (default) database connection
   */
  async getCentralizedDataSource(entities?: EntityTarget<ObjectLiteral>[]): Promise<DataSource> {
    const centralizedConfig: DatabaseConfig = {
      id: 1,
      name: DatabaseType.CENTRALIZED,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'iirm_centralize',
      type: (process.env.DB_TYPE || 'postgres') as 'postgres',
    };

    return this.getDataSource(centralizedConfig, entities);
  }

  /**
   * Get client-specific database connection
   * @param companyId Company/client ID
   * @param dbConfig Database configuration for this client
   * @param entities Optional entities to register
   */
  async getClientDataSource(
    companyId: number,
    dbConfig: DatabaseConfig,
    entities?: EntityTarget<ObjectLiteral>[]
  ): Promise<DataSource> {
    return this.getDataSource(dbConfig, entities);
  }

  /**
   * Generate unique connection key
   */
  private getConnectionKey(dbConfig: DatabaseConfig): string {
    return `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
  }

  /**
   * Close a specific datasource
   */
  async closeDataSource(connectionKey: string): Promise<void> {
    const dataSource = this.dataSources.get(connectionKey);
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      this.dataSources.delete(connectionKey);
      this.logger.log(`🔒 Datasource closed: ${connectionKey}`);
    }
  }

  /**
   * Close all datasources
   */
  async closeAllDataSources(): Promise<void> {
    this.logger.log('Closing all datasources...');
    const closePromises = Array.from(this.dataSources.values()).map(
      async (dataSource) => {
        if (dataSource.isInitialized) {
          await dataSource.destroy();
        }
      }
    );
    await Promise.all(closePromises);
    this.dataSources.clear();
    this.connectionPromises.clear();
    this.logger.log('✅ All datasources closed');
  }

  /**
   * Get all active connections (for debugging/monitoring)
   */
  getActiveConnections(): string[] {
    return Array.from(this.dataSources.keys());
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await this.closeAllDataSources();
  }
}