import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { MasterRepository } from "./master.repository";
import { DEFAULT_VALUES } from "../../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  CreateFilterPreferenceDto,
  UpdateFilterPreferenceDto,
} from "./dto/filter-preference.dto";

@Injectable()
export class MasterService {
  private readonly masterRepository: MasterRepository;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    masterRepository: MasterRepository,
    private readonly traceIdService: TraceIdService
  ) {
    this.masterRepository = masterRepository;
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Returns the list of supported master entities and display labels.
   */
  getEntitiesList(): { name: string; label: string }[] {
    // Keep in sync with getEntityByName mapping
    const entities = [
      { name: DEFAULT_VALUES.ORGANISATION_ENTITY, label: "Organisation" },
      { name: DEFAULT_VALUES.ORG_DEPARTMENT_ENTITY, label: "Org Department" },
      { name: DEFAULT_VALUES.ORG_DESIGNATION_ENTITY, label: "Org Designation" },
      { name: DEFAULT_VALUES.ORG_SBU_ENTITY, label: "Org SBU" },
      { name: DEFAULT_VALUES.ORG_VERTICAL_ENTITY, label: "Org Vertical" },
      { name: DEFAULT_VALUES.ORG_BRANCH_ENTITY, label: "Org Branch" },
      { name: DEFAULT_VALUES.COUNTRY_ENTITY, label: "Country" },
      { name: DEFAULT_VALUES.STATE_ENTITY, label: "State" },
      { name: DEFAULT_VALUES.CITY_ENTITY, label: "City" },
      { name: DEFAULT_VALUES.REGION_ENTITY, label: "Region" },
      { name: DEFAULT_VALUES.CURRENCY_ENTITY, label: "Currency" },
      { name: DEFAULT_VALUES.ROLE_ENTITY, label: "Role" },
      { name: DEFAULT_VALUES.COVER_ENTITY, label: "Covers" },
      {name:DEFAULT_VALUES.POLICY_TYPE,label:"Policy Type"},
      // { name: DEFAULT_VALUES.USER_ENTITY, label: "User" },
    ];
    return entities;
  }

  /**
   * Builds a generic metadata definition for the given entity to drive dynamic UI.
   * This includes filter fields, list columns and a basic form config.
   */
  async getEntityMetadata(
    entityName: string
  ): Promise<{
    endPoint: string;
    parameterList: { name: string; label: string; dataType: string; options: any[] | null }[];
    resultsList: { name: string; label: string; dataType: string; alignment?: string }[];
    formConfig: Record<
      string,
      {
        fieldName: string;
        dataType: string;
        fieldType: string;
        optionType: string | null;
        option: any;
        validation: { max?: number; min?: number };
      }
    >;
  }> {
    // Resolve repository metadata via repository layer utility to keep service slim
    return this.masterRepository.buildEntityMetadata(entityName);
  }

  /**
   * Returns minimal options list (id, name) for dropdowns without pagination.
   */
  async getOptionList(
    entityName: string,
    lookupName?: string
  ): Promise<Array<{ id: number | string; name: string }>> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "MasterService",
        method: "getOptionList",
        payload: { entityName },
        messageData: "method invoked",
      }),
    });
    return this.masterRepository.getOptionList(entityName, lookupName);
  }

  /**
   * Retrieves all LookUps by delegating the repository.
   */
  async getAllRecords<T>(
    userId: number,
    entityClass: string,
    search?: string,
    searchId?: number | number[],
    sortBy?: string,
    searchBy?: string,
    roleKey?: string,
    sortOrder: "ASC" | "DESC" = "ASC",
    page: number = DEFAULT_VALUES.PAGE,
    limit: number = DEFAULT_VALUES.LIMIT,
    entityIds?: number[],
    additionalFilters?: Record<string, any>
  ): Promise<{ data: T[]; count?: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "getAllRecords",
          payload: { entityClass },
          messageData: "method invoked",
        }),
      });
      return await this.masterRepository.getAllRecords(
        userId,
        entityClass,
        search,
        searchId,
        sortBy,
        searchBy,
        roleKey,
        sortOrder,
        page,
        limit,
        entityIds,
        additionalFilters
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "getAllRecords",
          payload: { entityClass },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to retrieve records"
      );
    }
  }

  async getAllRecordsForOrgFilter<T>(
    userId: number,
    entityClass: string,
    search?: string,
    searchId?: number | number[],
    sortBy?: string,
    searchBy?: string,
    roleKey?: string,
    sortOrder: "ASC" | "DESC" = "ASC",
    page: number = DEFAULT_VALUES.PAGE,
    limit: number = DEFAULT_VALUES.LIMIT,
    entityIds?: number[]
  ): Promise<{ data: T[]; count?: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "getAllRecordsForOrgFilter",
          payload: { entityClass },
          messageData: "method invoked",
        }),
      });
      return await this.masterRepository.getAllRecordsForOrgFilter(
        userId,
        entityClass,
        search,
        searchId,
        sortBy,
        searchBy,
        roleKey,
        sortOrder,
        page,
        limit,
        entityIds
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "getAllRecordsForOrgFilter",
          payload: { entityClass },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to retrieve records"
      );
    }
  }

  /**
   * Retrieves a single record using ID by delegating the repository.
   */
  async getRecordById<T>(
    entity: string,
    id: string
  ): Promise<{ data: T }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "getRecordById",
          payload: { entity, id },
          messageData: "method invoked",
        }),
      });
      return await this.masterRepository.getRecordById(entity, id);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "getRecordById",
          payload: { entity, id },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to retrieve record"
      );
    }
  }

  /**
   * Creates a new record by delegating the repository.
   */
  async createRecord<T>(entityClass: string, data: any): Promise<T> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "createRecord",
          payload: { entityClass },
          messageData: "method invoked",
        }),
      });
      return await this.masterRepository.createRecord(entityClass, data);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "createRecord",
          payload: { entityClass },
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to create record"
      );
    }
  }

  /**
   * Updates an existing record by ID for the specified entity by delegating the repository.
   */
  async updateRecordById<T>(
    entityClass: string,
    id: string,
    data: any
  ): Promise<T> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "updateRecordById",
          payload: { entityClass, id },
          messageData: "method invoked",
        }),
      });
      return await this.masterRepository.updateRecordById(
        entityClass,
        id,
        data
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "updateRecordById",
          payload: { entityClass, id },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to update record"
      );
    }
  }

  /**
   * Deletes a record using the ID delegating the repository.
   */
  async deleteRecordById<T>(entityClass: string, id: string): Promise<void> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "deleteRecordById",
          payload: { entityClass, id },
          messageData: "method invoked",
        }),
      });
      await this.masterRepository.deleteRecordById(entityClass, id);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "deleteRecordById",
          payload: { entityClass, id },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to delete record"
      );
    }
  }

  async getFiltersByEntity(userId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "getFiltersByEntity",
          messageData: "method invoked",
        }),
      });
      return await this.masterRepository.getFiltersByEntity(userId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "getFiltersByEntity",
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to retrieve filters"
      );
    }
  }

  async saveUserFilter(userId: number, filterData: CreateFilterPreferenceDto) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "saveUserFilter",
          payload: { filterData },
          messageData: "method invoked",
        }),
      });
      return await this.masterRepository.saveUserFilter(userId, filterData);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "saveUserFilter",
          payload: { filterData },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to save filter"
      );
    }
  }

  async updateUserFilter(
    userId: number,
    entity: string,
    filterData: UpdateFilterPreferenceDto
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterService",
          method: "updateUserFilter",
          payload: { entity, filterData },
          messageData: "method invoked",
        }),
      });
      return await this.masterRepository.updateUserFilter(
        userId,
        entity,
        filterData
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterService",
          method: "updateUserFilter",
          payload: { entity, filterData },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update filter"
      );
    }
  }
}
