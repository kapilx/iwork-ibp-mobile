import { EntityTarget, FindOptionsWhere, ObjectLiteral } from "typeorm";
import { HttpStatus } from "@nestjs/common";

export type SortOrder = "ASC" | "DESC";

export interface SortOption {
  field: string;
  order: SortOrder;
}

export interface SearchCriteria {
  searchBy: string;
  searchValue: string | number | Date | Array<string | number | Date>;
}

export interface UserFilter {
  userId: number;
  reporteeUserIds?: number[];
  org?: { key: string; value: number[] };
  branch?: { key: string; value: number[] };
  lob?: { key: string; value: number[] };
  custom?: number[];
  tagged?: number[];
}

export interface DateRange {
  field: string;
  from: Date;
  to?: Date;
}

export interface BaseQueryOptions<T> {
  entity: EntityTarget<T>;
  page: number;
  limit: number;
  sort?: SortOption[];
  relations?: string | string[];
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  select?: string[];
  searchArray?: SearchCriteria[];
  userFilter?: UserFilter;
  searchString?: string;
  searchOn?: string[];
  dateFilter?: DateRange;
  period?: DateRange;
  preserveCreatedAt?: boolean;
  entityIds?: number[];
}

// Optional: Extend base options for specific function use cases
export type FetchEntityListType<T> = BaseQueryOptions<T>;

export interface GetDataOptions<T> {
  entity: EntityTarget<T>;
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sort?: SortOption[]; // already typed correctly
  relations?: any; // matches `relations?: any` in your function
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  select?: (keyof T)[];
  searchArray?: { searchBy: string; searchValue: string }[];
  userFilter?: UserFilter;
}

export interface ValidateScopeParams<T extends ObjectLiteral> {
  fetchEntityData?: FetchEntityListType<T>;
}
export type ResultData<T> = { data: T[]; count: number };
export type ValidateScopeResult<T> =
  | ResultData<T>
  | { status: HttpStatus; message: string };

export interface GetFiltersDataOptions<T> {
  entity: EntityTarget<T>;
  page: number;
  limit: number;
  search?: string;
  searchBy?: string;
  sortBy?: string;
  sort?: SortOrder;
  relations?: string | string[];
}
