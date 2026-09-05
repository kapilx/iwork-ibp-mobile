import { Injectable, Scope } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Request-scoped service to hold the current datasource
 * This allows different requests to use different databases
 */
@Injectable({ scope: Scope.REQUEST })
export class DatasourceContext {
  private _dataSource: DataSource | null = null;
  private _databaseName: string | null = null;

  setDataSource(dataSource: DataSource, databaseName: string) {
    this._dataSource = dataSource;
    this._databaseName = databaseName;
  }

  getDataSource(): DataSource | null {
    return this._dataSource;
  }

  getDatabaseName(): string | null {
    return this._databaseName;
  }

  hasDataSource(): boolean {
    return this._dataSource !== null;
  }

  clear() {
    this._dataSource = null;
    this._databaseName = null;
  }
}