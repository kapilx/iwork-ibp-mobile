import { Repository, EntityTarget, ObjectLiteral } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DatasourceContext } from './datasource-context.service';

/**
 * Base Dynamic Repository
 * 
 * Automatically uses the correct datasource based on the request context.
 * Extend this class for repositories that need multi-tenant database support.
 * 
 * @example
 * @Injectable()
 * export class UserRepository extends BaseDynamicRepository<User> {
 *   constructor(datasourceContext: DatasourceContext) {
 *     super(User, datasourceContext);
 *   }
 * 
 *   async findByEmail(email: string): Promise<User | null> {
 *     const repository = this.getRepository();
 *     return repository.findOne({ where: { email } });
 *   }
 * }
 */
@Injectable()
export abstract class BaseDynamicRepository<T extends ObjectLiteral> {
  private readonly entityTarget: EntityTarget<T>;
  
  constructor(
    entityTarget: EntityTarget<T>,
    private readonly datasourceContext: DatasourceContext,
  ) {
    this.entityTarget = entityTarget;
  }

  /**
   * Get the repository for the current datasource context
   * Falls back to default if no dynamic context is available
   */
  protected getRepository(): Repository<T> {
    const dataSource = this.datasourceContext.getDataSource();
    
    if (dataSource && dataSource.isInitialized) {
      return dataSource.getRepository(this.entityTarget);
    }
    
    throw new Error(
      `No active datasource found. Ensure @UseDatasource() decorator is applied to the controller method and DynamicDatasourceInterceptor is registered.`
    );
  }

  /**
   * Get the current database name for debugging/logging
   */
  protected getCurrentDatabaseName(): string | null {
    return this.datasourceContext.getDatabaseName();
  }

  /**
   * Check if a dynamic datasource is active
   */
  protected hasDynamicDatasource(): boolean {
    return this.datasourceContext.hasDataSource();
  }

  // Common repository methods that can be overridden
  
  async findOne(options: Parameters<Repository<T>['findOne']>[0]): Promise<T | null> {
    const repository = this.getRepository();
    return repository.findOne(options);
  }

  async find(options?: Parameters<Repository<T>['find']>[0]): Promise<T[]> {
    const repository = this.getRepository();
    return repository.find(options);
  }

  async findAndCount(options?: Parameters<Repository<T>['findAndCount']>[0]): Promise<[T[], number]> {
    const repository = this.getRepository();
    return repository.findAndCount(options);
  }

  async save(entity: T): Promise<T>;
  async save(entities: T[]): Promise<T[]>;
  async save(entityOrEntities: T | T[]): Promise<T | T[]> {
    const repository = this.getRepository();
    if (Array.isArray(entityOrEntities)) {
      return repository.save(entityOrEntities);
    }
    return repository.save(entityOrEntities);
  }

  async remove(entity: T): Promise<T>;
  async remove(entities: T[]): Promise<T[]>;
  async remove(entityOrEntities: T | T[]): Promise<T | T[]> {
    const repository = this.getRepository();
    if (Array.isArray(entityOrEntities)) {
      return repository.remove(entityOrEntities);
    }
    return repository.remove(entityOrEntities);
  }

  async count(options?: Parameters<Repository<T>['count']>[0]): Promise<number> {
    const repository = this.getRepository();
    return repository.count(options);
  }

  async exists(options: Parameters<Repository<T>['exists']>[0]): Promise<boolean> {
    const repository = this.getRepository();
    return repository.exists(options);
  }

  /**
   * Create a query builder for complex queries
   */
  createQueryBuilder(alias?: string) {
    const repository = this.getRepository();
    return repository.createQueryBuilder(alias);
  }
}