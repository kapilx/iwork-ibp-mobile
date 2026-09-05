import { HttpStatus, Injectable } from "@nestjs/common";
import {
  Repository,
  EntityTarget,
  ObjectLiteral,
  DataSource,
  ILike,
  FindOptionsWhere,
  FindOptionsOrder,
  Between,
  In,
  SelectQueryBuilder,
  Brackets,
  QueryRunner,
} from "typeorm";
import { createErrorResponse } from "./response.utils";
import { MAPPED_DATA_DELETION, ENTITY_NAME } from "../constants";
import { User } from "../../../../../apps/services/service-lib/src/lib/entities/user";
import { LookUp } from "../../../../../apps/services/service-lib/src/lib/entities/look-up.entity";
import {
  buildWhereCondition,
  buildOrderCondition,
  applySearchConditions,
} from "./helper.utils";
import { isString } from "class-validator";

@Injectable()
export class EntityService {
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Retrieves data for the specified entity.
   */

  async getData<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    page: number,
    limit: number,
    search?: string,
    sortBy?: string,
    sort: { field: string; order: string }[] = [],
    relations?: any,
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    select?: (keyof T)[],
    searchArray?: { searchBy: string; searchValue: string }[],
    userFilter?: {
      userId: number;
      reporteeUserIds?: number[];
      org?: { key: string; value: number[] };
      branch?: { key: string; value: number[] };
      lob?: { key: string; value: number[] };
      custom?: number[];
      tagged?: number[];
    }
  ): Promise<{ data: T[]; count: number }> {
    try {
      const repository: Repository<T> = this.dataSource.getRepository(entity);
      const skip = (page - 1) * limit;

      // Build search and order conditions using helper functions
      let whereCondition = buildWhereCondition(
        repository,
        where,
        searchArray,
        relations
      );
      if (userFilter) {
        whereCondition = applyRbacFilters(whereCondition, userFilter);
      }

      const orderCondition = buildOrderCondition(repository, sort, relations);

      // Fetch data
      const [data, total] = await repository.findAndCount({
        skip,
        take: limit,
        where: whereCondition,
        relations,
        order: orderCondition,
        select: select ? (select as any) : undefined,
      });

      // Recursively remove unwanted fields
      const filteredData = data.map((item) => removeUnwantedFields(item));
      return { data: filteredData, count: total };
    } catch (error) {
      console.error(error);
      createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message);
      throw new Error("Failed to fetch entity data.", error.message);
    }
  }

  /**
   * Retrieves data for the specified entity by ID.
   */
  async getDataById<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    id: number,
    relations?: any
  ): Promise<T> {
    try {
      const repository: Repository<T> = this.dataSource.getRepository(entity);
      const data = await repository.findOne({
        where: { id } as unknown as FindOptionsWhere<T>,
        relations,
      });

      if (!data) {
        createErrorResponse(
          HttpStatus.NOT_FOUND,
          `Entity with ID ${id} not found`
        );
      }

      return removeUnwantedFields(data);
    } catch (error) {
      console.error("Error fetching entity data by ID:", error);
      createErrorResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        (error as Error).message
      );
      throw new Error("Failed to fetch entity data by ID.");
    }
  }

  async fetchEntityList<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    // Omit both to fetch every matching row unpaginated (e.g. full exports) —
    // every existing caller passes concrete numbers, so this is additive.
    page?: number,
    limit?: number,
    sort: { field: string; order: "ASC" | "DESC" }[] = [],
    relations?: string | string[],
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    select?: string[],
    searchArray?: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    userFilter?: {
      userId: number | null;
      reporteeUserIds?: number[];
      org?: { key: string; value: number[] };
      branch?: { key: string; value: number[] };
      lob?: { key: string; value: number[] };
      custom?: number[];
      tagged?: number[];
    },
    searchString?: string,
    searchOn?: string[],
    dateFilter?: { field: string; from: Date; to?: Date },
    period?: { field: string; from: Date; to?: Date },
    preserveCreatedAt?: boolean,
    entityIds?: number[],
    customWhereCondition?: Brackets,
    secondDateFilter?: { field: string; from: Date; to?: Date },
    debugOptions?: {
      logQuery?: boolean;
    },
    funnel?: boolean
  ): Promise<{ data: T[]; count: number }> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      let repo;
      if (
        String(entity).toLowerCase() ===
        String(ENTITY_NAME.OPPORTUNITY).toLowerCase()
      ) {
        await queryRunner.connect();
        repo = queryRunner.manager.getRepository(entity);
      } else {
        repo = this.dataSource.getRepository(entity);
      }
      const qb = repo.createQueryBuilder("main");

      // 1) Apply user filter if provided

      // 1) top-level WHERE
      const relationFilters: Array<[string, any]> = [];
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (key.includes(".")) {
            relationFilters.push([key, value]);
            delete (where as Record<string, any>)[key];
          } else {
            return; // Skip plain values for now
          }
        });
        if (where && Object.keys(where).length > 0) {
          qb.where(where);
        }
      }

      if (userFilter) {
        if (
          String(entity).toLowerCase() ===
          String(ENTITY_NAME.OPPORTUNITY).toLowerCase()
        ) {
          if (funnel && funnel == true) {
            await applyFunnelOpportunityCommonfilters(qb, userFilter);
          } else {
            await applyCommonfilterForOpportunity(qb, userFilter, queryRunner);
          }
        } else if (
          String(entity).toLowerCase() ===
          String(ENTITY_NAME.POLICY).toLowerCase()
        ) {
          await applyCommonfilterForPolicy(qb, userFilter);
        } else {
          await applyCommonfilters(qb, userFilter, String(entity).toLowerCase());
        }
      }

      // 2) normalize relations into dot-paths
      const relationPaths =
        typeof relations === "string"
          ? [relations]
          : Array.isArray(relations)
          ? relations
          : [];

      // 3) JOIN & SELECT
      for (const path of relationPaths) {
        const alias = path.replace(/\./g, "_");
        const segments = path.split(".");
        const parent =
          segments.length > 1 ? segments.slice(0, -1).join("_") : "main";
        const relationName = segments[segments.length - 1];

        qb.leftJoinAndSelect(
          `${parent === "main" ? "main" : parent}.${relationName}`,
          alias
        );
      }

      // Apply andWhere for relation-based filters
      if (relationFilters.length > 0) {
        relationFilters.forEach(([key, value]) => {
          const parts = key.split(".");
          const column = parts.pop()!;
          const alias = parts.join("_") || "main";
          const param = `${alias}_${column}`;
          qb.andWhere(`${alias}.${column} = :${param}`, { [param]: value });
        });
      }

      if (customWhereCondition) {
        qb.andWhere(customWhereCondition);
      }

      // 4) searchArray → IN or ILIKE
      if (Array.isArray(searchArray) && searchArray.length > 0) {
        searchArray.forEach(({ searchBy, searchValue }, idx) => {
          const param = `param_${idx}`;
          let alias: string, column: string;

          if (searchBy.includes(".")) {
            const parts = searchBy.split(".");
            column = parts.pop()!;
            alias = parts.join("_");
          } else {
            alias = "main";
            column = searchBy;
          }

          if (Array.isArray(searchValue)) {
            qb.andWhere(`${alias}.${column} IN (:...${param})`, {
              [param]: searchValue,
            });
          } else {
            if (column === "id") {
              qb.andWhere(`CAST(${alias}.${column} AS TEXT) ILIKE :${param}`, {
                [param]: `%${searchValue}%`,
              });
            } else {
              qb.andWhere(`${alias}.${column} ILIKE :${param}`, {
                [param]: `%${searchValue}%`,
              });
            }
          }
        });
      }

      // 5) search
      if (searchString) {
        applySearchConditions(qb, searchString, searchOn || []);
      }

      // 6) date filter
      if (dateFilter) {
        applyDateFilter(qb, dateFilter.field, dateFilter.from, dateFilter.to);
      }

      if (secondDateFilter) {
        applyDateFilter(
          qb,
          secondDateFilter.field,
          secondDateFilter.from,
          secondDateFilter.to
        );
      }

      if (period) {
        applyDateFilter(qb, period.field, period.from, period.to);
      }

      // 7) sorting
      for (const { field, order } of sort) {
        let alias: string, column: string;
        if (field.includes(".")) {
          const parts = field.split(".");
          column = parts.pop()!;
          alias = parts.join("_");
        } else {
          alias = "main";
          column = field;
        }

        qb.addOrderBy(`${alias}.${column}`, order, "NULLS LAST");
      }

      // 8) pagination & select — omitting both page and limit fetches every
      // matching row instead of a page (full exports; mirrors how the
      // BizDone export never pages its report query).
      if (page != null && limit != null) {
        qb.skip((page - 1) * limit).take(limit);
      }

      // Handle select fields
      if (select?.length) {
        qb.select(
          select.map((f) => {
            if (isString(f) && f.includes(".")) {
              const parts = f.split(".");
              const column = parts.pop()!;
              const alias = parts.join("_"); // handles nested relations
              return `${alias}.${column}`;
            }
            return `main.${String(f)}`;
          })
        );
      }

      if (debugOptions?.logQuery) {
        const [query, parameters] = qb.getQueryAndParameters();
        console.log("EntityService.fetchEntityList final SQL:", query);
        console.log("EntityService.fetchEntityList parameters:", parameters);
      }

      // 9) inspect SQL and run
      const [rows, total] = await qb.getManyAndCount();
      let filteredData = rows.map((row) => {
        const filteredRow = removeUnwantedFields(row);

        // Conditionally preserve `createdAt`
        if (preserveCreatedAt && row.createdAt) {
          filteredRow.createdAt = row.createdAt;
        }

        return filteredRow;
      });

      if (entityIds && entityIds.length > 0) {
        const isOpportunity =
          String(entity).toLowerCase() ===
          String(ENTITY_NAME.OPPORTUNITY).toLowerCase();

        const existingIds = new Set(
          rows
            .filter(Boolean)
            .map((r) =>
              isOpportunity ? (r as any)?.opportunityId : (r as any)?.id
            )
            .filter(Boolean)
        );

        let missingIds: number[] = [];
        let additional;

        missingIds = entityIds.filter((id) => !existingIds.has(id));

        if (missingIds.length > 0) {
          additional = await repo.find({
            where: isOpportunity
              ? ({ opportunityId: In(missingIds) } as FindOptionsWhere<T>)
              : ({ id: In(missingIds) } as FindOptionsWhere<T>),
            relations: relationPaths,
            select: select as (keyof T)[] | undefined,
          });
        }

        const processed =
          additional?.map((row) => removeUnwantedFields(row)).filter(Boolean) ||
          [];

        filteredData = filteredData.concat(processed);
      }

      if (
        String(entity).toLowerCase() ===
        String(ENTITY_NAME.OPPORTUNITY).toLowerCase()
      ) {
        await queryRunner.release();
      }
      return {
        data: filteredData,
        count: total,
      };
    } catch (error) {
      console.error("Error in fetchEntityList:", error);
      throw new Error("Failed to fetch entity list.", error.message);
    }
  }

  async getFiltersData<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    page: number,
    limit: number,
    search?: string,
    searchBy?: string,
    sortBy?: string,
    sort: "ASC" | "DESC" = "ASC",
    relations?: any
  ) {
    try {
      const repository: Repository<T> = this.dataSource.getRepository(entity);
      const skip = (page - 1) * limit;

      // **Build Search Condition**
      let whereCondition: FindOptionsWhere<T>[] | {} = {};

      if (search && searchBy) {
        const searchColumn = repository.metadata.columns.find(
          (col) => col.propertyName === searchBy
        );

        if (!searchColumn) {
          console.error(`Invalid searchBy column: ${searchBy}`);
          throw new Error(`Invalid searchBy column: ${searchBy}`);
        }

        // **Handle Different Data Types**
        const columnType = searchColumn.type as string;

        if (["varchar", "text"].includes(columnType)) {
          whereCondition = {
            [searchBy]: ILike(`%${search}%`),
          } as FindOptionsWhere<T>;
        } else if (["int", "bigint", "decimal", "float"].includes(columnType)) {
          whereCondition = {
            [searchBy]: Number(search),
          } as FindOptionsWhere<T>;
        } else if (
          columnType &&
          [
            "timestamp",
            "datetime",
            "date",
            "timestamptz",
            "timestamp with time zone",
          ].includes(columnType)
        ) {
          const startOfDay = new Date(search);
          startOfDay.setUTCHours(0, 0, 0, 0);

          const endOfDay = new Date(search);
          endOfDay.setUTCHours(23, 59, 59, 999);

          whereCondition = {
            [searchBy]: Between(startOfDay, endOfDay),
          } as FindOptionsWhere<T>;
        } else {
          console.error(`Unsupported column type for search: ${columnType}`);
          throw new Error(`Unsupported column type for search: ${columnType}`);
        }
      }

      // **Sorting Condition**
      const validSortColumn =
        sortBy &&
        repository.metadata.columns.some((col) => col.propertyName === sortBy)
          ? sortBy
          : "id";

      const orderCondition: FindOptionsOrder<T> = {
        [validSortColumn]: sort,
      } as FindOptionsOrder<T>;

      // **Fetch Data**
      const [data, total] = await repository.findAndCount({
        skip,
        take: limit,
        where: whereCondition,
        relations,
        order: orderCondition,
      });

      // **Recursively remove unwanted fields**
      const filteredData = data.map((item) => removeUnwantedFields(item));

      return { data: filteredData, count: total };
    } catch (error) {
      console.error("Error in getFiltersData:", error);

      return createErrorResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        (error as Error).message
      );
    }
  }

  async getListOfValues<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    selectedFields: string | string[],
    whereCondition: FindOptionsWhere<T>,
    relations?: string | string[]
  ): Promise<T | null> {
    try {
      const repository: Repository<T> = await this.dataSource.getRepository(
        entity
      );

      // Fetch data with selected fields and relations
      const data = await repository.findOne({
        select: selectedFields,
        relations: relations,
        where: whereCondition,
      });

      return data;
    } catch (error) {
      throw new Error("Failed to fetch list of values.");
    }
  }

  async getLookupValues(
    keys: number[]
  ): Promise<{ id: number; lookUpValue: string }[]> {
    try {
      if (!keys || keys.length === 0) {
        throw new Error("Keys array is required.");
      }

      const repository = this.dataSource.getRepository(LookUp);

      const lookUps = await repository.find({
        where: { id: In(keys) },
        select: ["id", "lookUpValue"],
      });

      return lookUps.map((lookup) => ({
        id: lookup.id,
        lookUpValue: lookup.lookUpValue,
      }));
    } catch (error) {
      return error;
    }
  }

  async getUserValues(
    keys: number[]
  ): Promise<{ userId: number; firstName: string; lastName: string }[]> {
    if (!keys || keys.length === 0) {
      throw new Error("Keys array is required.");
    }

    const repository = this.dataSource.getRepository(User);

    const userDetails = await repository.find({
      where: { userId: In(keys) },
      select: ["userId", "firstName", "lastName"],
    });

    return userDetails.map((userData) => ({
      userId: userData.userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
    }));
  }

  /**
   * Retrieves all the data ids for the specified entity.
   */
  async getEntityMapByIds<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    select: keyof T, // Enforce type safety for selected field
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]
  ): Promise<any[]> {
    try {
      const repository: Repository<T> = this.dataSource.getRepository(entity);
      const data = await repository.find({
        where,
        select: [select],
      });
      if (!data || data.length === 0) {
        return [];
      }
      return data.map((item) => item[select]);
    } catch (error) {
      console.error("Error in getEntityMapByIds:", error);
      return [];
    }
  }

  async updateEntityFieldsByWhere<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    fields: Partial<T>,
    whereCondition?: any
  ): Promise<any> {
    try {
      const repository: Repository<T> = this.dataSource.getRepository(entity);
      const result = await repository.update(whereCondition, fields);
      return result;
    } catch (error) {
      console.error("Error in updateEntityFieldsByWhere:", error);
      return error;
    }
  }
  /**
   * Removes mapped data by hard deleting (if MAP_REMOVED) or soft deleting (by setting deletedAt) the specified IDs for the given entity.
   */
  async deleteEntityMapByIds<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    deleteIds: (string | number)[],
    select: keyof T,
    deletionType: string
  ): Promise<boolean | null> {
    try {
      const repository: Repository<T> = this.dataSource.getRepository(entity);

      if (deletionType === MAPPED_DATA_DELETION.MAP_REMOVED) {
        await Promise.all(
          deleteIds.map((mappedId) =>
            repository.delete({ [select]: mappedId } as any)
          )
        );
      } else {
        await Promise.all(
          deleteIds.map((mappedId) =>
            repository.update({ [select]: mappedId } as any, {
              deletedAt: new Date(),
            })
          )
        );
      }

      return true;
    } catch (error) {
      return null;
    }
  }

  async deleteFileUploadByIds<T extends ObjectLiteral>(
    fileUploadEntity: EntityTarget<T>,
    entity: EntityTarget<T>,
    select: keyof T,
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    deletionType: string
  ): Promise<boolean | null> {
    try {
      const fileRepository: Repository<T> =
        this.dataSource.getRepository(fileUploadEntity);
      const deleteIds = await this.getEntityMapByIds(entity, select, where);
      if (deleteIds.length > 0) {
        if (deletionType === MAPPED_DATA_DELETION.MAP_REMOVED) {
          await Promise.all(
            deleteIds.map((mappedId) =>
              fileRepository.delete({ id: mappedId } as any)
            )
          );
        } else {
          await Promise.all(
            deleteIds.map((mappedId) =>
              fileRepository.update({ id: mappedId } as any, {
                deletedAt: new Date(),
              })
            )
          );
        }
      }
      return true;
    } catch (error) {
      console.error("Error deleting file uploads:", error);
      return null;
    }
  }
}
/**
 * Recursively removes `createdBy`, `updatedBy`, `createdAt`, and `updatedAt` from an object.
 */
function removeUnwantedFields(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUnwantedFields);
  } else if (obj instanceof Date) {
    // Convert Date objects to ISO string
    return obj.toISOString();
  } else if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(
          ([key]) =>
            !["createdBy", "updatedBy", "createdAt", "updatedAt"].includes(key)
        )
        .map(([key, value]) => [key, removeUnwantedFields(value)])
    );
  }
  return obj;
}

function applyCommonfilters(qb: SelectQueryBuilder<any>, userFilter: any, entityName: string) {
  if (userFilter) {
    const createdByIds: number[] = [];
    const taggedByIds: number[] = [];

    // Apply 'createdBy' filter if any of these conditions match
    // if (userFilter.userId)
    if (userFilter.userId && !userFilter.org)
      createdByIds.push(userFilter.userId);
    if (userFilter.reporteeUserIds?.length)
      createdByIds.push(...userFilter.reporteeUserIds);
    if (userFilter.custom?.length) createdByIds.push(...userFilter.custom);
    if (userFilter.tagged?.length) taggedByIds.push(...userFilter.tagged);
    const isCompany = entityName === ENTITY_NAME.COMPANY;

    if (isCompany) {
      if (taggedByIds.length > 0) {
        qb.andWhere("main.id IN (:...taggedByIds)", { taggedByIds });
      }
    } else {
      if (taggedByIds.length > 0 && createdByIds.length > 0) {
        qb.andWhere(
          new Brackets((qb1) => {
            qb1.where("main.createdBy IN (:...createdByIds)", { createdByIds });
            qb1.orWhere("main.id IN (:...taggedByIds)", { taggedByIds });
          })
        );
      } else if (createdByIds.length > 0) {
        qb.andWhere("main.createdBy IN (:...createdByIds)", { createdByIds });
      }
    }

    // Apply filters for org, branch, and lob (refactored)
    const filterKeys = ["org", "branch", "lob"];
    filterKeys.forEach(async (filterKey, index) => {
      const filter = userFilter[filterKey];
      if (filter && filter.key) {
        await applyfilterOnKey(qb, filterKey, filter, index);
      } else {
        console.warn(
          `getData ▶ userFilter.${filterKey} is missing or invalid.`
        );
      }
    });
  }
}

export function buildOpportunityInvolvementScope(
  scopeUserIds: number[],
  alias = "main"
): string {
  const ids =
    scopeUserIds.filter((id) => Number.isFinite(Number(id))).join(",") ||
    "NULL";
  return `(${alias}.createdBy IN (${ids}) OR ${alias}.id IN (
    SELECT opportunity_id FROM opportunity_activity_participants WHERE participant_id IN (${ids})
    UNION SELECT opportunity_id FROM opportunity_activity_map WHERE owner_id IN (${ids})
    UNION SELECT opportunity_id FROM task WHERE assignee_id IN (${ids})
  ))`;
}

function applyFunnelOpportunityCommonfilters(
  qb: SelectQueryBuilder<any>,
  userFilter: any
) {
  if (
    userFilter.tagged &&
    userFilter.tagged.length > 0 &&
    userFilter.tagged[5] == 0
  ) {
    qb.andWhere(
      buildOpportunityInvolvementScope([
        userFilter.userId,
        ...(userFilter.reporteeUserIds ?? []),
      ])
    );
  }
  // Apply filters for org, branch, and lob (refactored)
  const filterKeys = ["org", "branch", "lob"];
  filterKeys.forEach(async (filterKey, index) => {
    const filter = userFilter[filterKey];
    if (filter && filter.key) {
      await applyfilterOnKey(qb, filterKey, filter, index);
    } else {
      console.warn(`getData ▶ userFilter.${filterKey} is missing or invalid.`);
    }
  });
}

async function applyCommonfilterForOpportunity(
  qb: SelectQueryBuilder<any>,
  userFilter: any,
  queryRunner?: QueryRunner
) {
  if (userFilter) {
    const createdByIds: number[] = [];
    let taggedByIds: number[] = [];

    // Apply 'createdBy' filter if any of these conditions match
    // if (userFilter.userId)
    if (userFilter.userId && !userFilter.org)
      createdByIds.push(userFilter.userId);
    if (userFilter.reporteeUserIds?.length)
      createdByIds.push(...userFilter.reporteeUserIds);
    if (userFilter.custom?.length) createdByIds.push(...userFilter.custom);
    if (userFilter.tagged?.length) taggedByIds = userFilter.tagged;
    // Remove null values from taggedByIds to ensure type safety
    taggedByIds = taggedByIds.filter(
      (id): id is number => id !== null && id !== undefined
    );
    if (
      taggedByIds.length > 0 &&
      createdByIds.length > 0 &&
      queryRunner &&
      taggedByIds[5] == 0
    ) {
      const isBranch = taggedByIds[0] === 0 ? false : true;
      const isReportee = taggedByIds[2] === 0 ? false : true;
      const team = taggedByIds[4] === 0 ? false : true;
      qb.andWhere(
        new Brackets((qb1) => {
          qb1.where("main.createdBy IN (:...createdByIds)", {
            createdByIds,
          });
          qb1.orWhere(`main.id IN (
            WITH user_results AS (
              SELECT DISTINCT id AS user_id
              FROM users
              WHERE (${isBranch} = true AND branch_id = ${taggedByIds[1]})
              UNION
              SELECT DISTINCT user_id
              FROM employee_hierarchy
              WHERE (${isReportee} = true AND reporting_user_id = ${taggedByIds[3]})
              UNION
              SELECT ${taggedByIds[3]} AS user_id
              WHERE ${taggedByIds[3]} IS NOT NULL
          ),
          scope_users AS (
              SELECT  ${taggedByIds[3]} AS user_id
              UNION
              SELECT ur.user_id
              FROM user_results ur
              WHERE ${team} = true
          ),
          opportunity_results AS (
              SELECT DISTINCT opportunity_id
              FROM opportunity_activity_participants
              WHERE participant_id IN (SELECT user_id FROM scope_users)
              UNION
              SELECT DISTINCT opportunity_id
              FROM opportunity_activity_map
              WHERE owner_id IN (SELECT user_id FROM scope_users)
              UNION
              SELECT DISTINCT opportunity_id
              FROM task
              WHERE assignee_id IN (SELECT user_id FROM scope_users)
          )
          SELECT DISTINCT opportunity_id
          FROM opportunity_results
          ORDER BY opportunity_id)`);
        })
      );
    } else if (createdByIds.length > 0 && taggedByIds[5] == 0) {
      await qb.andWhere("main.createdBy IN (:...createdByIds)", {
        createdByIds,
      });
    }

    // Apply filters for org, branch, and lob (refactored)
    const filterKeys = ["org", "branch", "lob"];
    filterKeys.forEach(async (filterKey, index) => {
      const filter = userFilter[filterKey];
      if (filter && filter.key) {
        await applyfilterOnKey(qb, filterKey, filter, index);
      } else {
        console.warn(
          `getData ▶ userFilter.${filterKey} is missing or invalid.`
        );
      }
    });
  }
}

async function applyCommonfilterForPolicy(
  qb: SelectQueryBuilder<any>,
  userFilter: any
) {
  if (userFilter) {
    const createdByIds: number[] = [];
    let taggedByIds: number[] = [];

    // Apply 'createdBy' filter if any of these conditions match
    // if (userFilter.userId)
    if (userFilter.userId && !userFilter.org)
      createdByIds.push(userFilter.userId);
    if (userFilter.custom?.length) createdByIds.push(...userFilter.custom);
    if (userFilter.tagged?.length) taggedByIds.push(...userFilter.tagged);
    if (
      userFilter.reporteeUserIds?.length &&
      taggedByIds &&
      taggedByIds[4] !== 0
    )
      createdByIds.push(...userFilter.reporteeUserIds);

    // Remove null values from taggedByIds to ensure type safety
    taggedByIds = taggedByIds.filter(
      (id): id is number => id !== null && id !== undefined
    );

    if (
      taggedByIds.length > 0 &&
      createdByIds.length > 0 &&
      taggedByIds[5] == 0
    ) {
      const isBranch = taggedByIds[0] === 0 ? false : true;
      const isReportee = taggedByIds[2] === 0 ? false : true;
      const team = taggedByIds[4] === 0 ? false : true;
      qb.andWhere(
        new Brackets((qb1) => {
          qb1.where("main.createdBy IN (:...createdByIds)", { createdByIds });
          qb1.orWhere("main.ownerId IN (:...createdByIds)", { createdByIds });
          qb1.orWhere(
            `main.id IN (
              WITH scope_users AS (
                SELECT DISTINCT id AS user_id
                FROM users
                WHERE (:isBranch = true AND branch_id = :branchId)
                
                UNION ALL
                
                SELECT DISTINCT eh.user_id
                FROM employee_hierarchy eh
                WHERE (:isReportee = true AND eh.reporting_user_id = :reportingUserId)
                
                UNION ALL
                
                SELECT :reportingUserId AS user_id
                WHERE :reportingUserId IS NOT NULL
              ),
              policy_results AS (
                SELECT DISTINCT ppm.policy_id
                FROM policy_participant_map ppm
                WHERE ppm.participant_id IN (
                  SELECT user_id FROM scope_users
                )
              )
              SELECT policy_id
              FROM policy_results
            )`,
            {
              isBranch,
              branchId: taggedByIds[1],
              isReportee,
              reportingUserId: taggedByIds[3],
              team,
            }
          );
        })
      );
    } else if (createdByIds.length > 0 && taggedByIds[5] == 0) {
      qb.andWhere(
        new Brackets((qb1) => {
          qb1.where("main.createdBy IN (:...createdByIds)", { createdByIds });
          qb1.orWhere("main.ownerId IN (:...createdByIds)", { createdByIds });
          qb1.orWhere(
            "main.id IN (SELECT DISTINCT policy_id FROM policy_participant_map WHERE participant_id IN (:...participantIds))",
            { participantIds: createdByIds }
          );
        })
      );
    }

    // Apply filters for org, branch, and lob (refactored)
    const filterKeys = ["org", "branch", "lob"];
    filterKeys.forEach(async (filterKey, index) => {
      const filter = userFilter[filterKey];
      if (filter && filter.key) {
        await applyfilterOnKey(qb, filterKey, filter, index);
      } else {
        console.warn(
          `getData ▶ userFilter.${filterKey} is missing or invalid.`
        );
      }
    });
  }
}

// Helper function to apply the filters
async function applyfilterOnKey(
  qb: SelectQueryBuilder<any>,
  filterKey: string,
  filter: any,
  index: number
) {
  const param = `param_${filterKey}_${index}`;
  let alias: string, column: string;

  if (filter.key.includes(".")) {
    const parts = filter.key.split(".");
    column = parts.pop()!;
    alias = parts.join("_");
  } else {
    alias = "main";
    column = filter.key;
  }

  // Check if the value is an array
  if (Array.isArray(filter?.value)) {
    qb.andWhere(`${alias}.${column} IN (:...${param})`, {
      [param]: filter?.value,
    });
  }
}

function objectDeepMerge<T extends object, U extends object>(
  target: T,
  source: U
): T & U {
  for (const key of Object.keys(source) as (keyof U)[]) {
    const sourceValue = source[key];
    const targetValue = (target as any)[key]; // type-safe access workaround

    if (
      typeof targetValue === "object" &&
      targetValue !== null &&
      typeof sourceValue === "object" &&
      sourceValue !== null
    ) {
      objectDeepMerge(targetValue as object, sourceValue as object);
    } else {
      (target as any)[key] = sourceValue;
    }
  }

  return target as T & U;
}

// Supports both nested & direct keys
function buildNestedObject<T>(path: string, value: T[]) {
  if (!path.includes(".")) {
    return { [path]: In(value) };
  }
  return path
    .split(".")
    .reverse()
    .reduce((acc, key) => ({ [key]: acc }), In(value));
}

function applyRbacFilters<T extends ObjectLiteral>(
  baseWhere: FindOptionsWhere<T>[] | FindOptionsWhere<T> | undefined,
  userFilter: {
    userId: number;
    reporteeUserIds?: number[];
    org?: { key: string; value: number[] };
    branch?: { key: string; value: number[] };
    lob?: { key: string; value: number[] };
    custom?: number[];
    tagged?: number[];
  }
): FindOptionsWhere<T>[] | FindOptionsWhere<T> {
  const rbacFilter: Record<string, any> = {};
  const createdByList = [
    userFilter.userId,
    ...(userFilter.reporteeUserIds || []),
    ...(userFilter.custom || []),
    ...(userFilter.tagged || []),
  ];

  if (createdByList.length > 0) {
    rbacFilter.createdBy = In(createdByList);
  }

  const nestedFilters = [userFilter.org, userFilter.branch, userFilter.lob];
  nestedFilters.forEach((filter) => {
    if (filter?.key && filter.value.length > 0) {
      const nestedObj = buildNestedObject(filter.key, filter.value);
      if (typeof nestedObj === "object" && nestedObj !== null) {
        objectDeepMerge(rbacFilter, nestedObj);
      }
    }
  });

  if (Array.isArray(baseWhere)) {
    return baseWhere.map((cond) => ({ ...cond, ...rbacFilter }));
  } else if (baseWhere && Object.keys(baseWhere).length > 0) {
    return { ...baseWhere, ...rbacFilter };
  } else {
    return rbacFilter;
  }
}

/**
 * Applies a date filter to the QueryBuilder.
 * @param qb - The QueryBuilder instance.
 * @param field - The field to filter on (e.g., "createdAt" or "user.createdAt").
 * @param from - The start date for the filter.
 * @param to - The end date for the filter (optional).
 */
export const applyDateFilter = (
  qb: SelectQueryBuilder<any>,
  field: string,
  from?: Date,
  to?: Date
): void => {
  let alias: string, column: string;

  if (field.includes(".")) {
    const parts = field.split(".");
    column = parts.pop()!;
    alias = parts.join("_");
  } else {
    alias = "main";
    column = field;
  }

  if (from && to) {
    // const startOfDay = new Date(from);
    // startOfDay.setUTCHours(0, 0, 0, 0);

    // const endOfDay = new Date(to);
    // endOfDay.setUTCHours(23, 59, 59, 999);
    const startOfDay = from;
    const endOfDay = to;

    qb.andWhere(
      `${alias}.${column} BETWEEN :from_${alias}_${column} AND :to_${alias}_${column}`,
      {
        [`from_${alias}_${column}`]: startOfDay,
        [`to_${alias}_${column}`]: endOfDay,
      }
    );
  } else if (from) {
    const startOfDay = new Date(from);
    startOfDay.setUTCHours(0, 0, 0, 0);

    qb.andWhere(`${alias}.${column} >= :from`, { from: startOfDay });
  } else if (to) {
    const endOfDay = new Date(to);
    endOfDay.setUTCHours(23, 59, 59, 999);

    qb.andWhere(`${alias}.${column} <= :to`, { to: endOfDay });
  }
  // else: neither provided → no filter
};
