import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { getEntityByName } from "../../../../service-lib/src/lib/utils/get-entity.utils";
import type { Request, Response } from "express";
import { MasterService } from "./master.service";
import {
  ApiResponse,
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { GetLookUpsQueryDto } from "../look-up/dto/look-up-query-param.dto";
import {
  createRecordSwaggerMetadata,
  deleteRecordByIdSwaggerMetadata,
  getAllRecordsSwaggerMetadata,
  getRecordByIdSwaggerMetadata,
  updateRecordByIdSwaggerMetadata,
  getEntitiesSwaggerMetadata,
  getEntityMetadataSwaggerMetadata,
  getEntityOptionsSwaggerMetadata,
  getFiltersByEntitySwaggerMetadata,
  saveUserFilterSwaggerMetadata,
  updateUserFilterSwaggerMetadata,
} from "./master.swagger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  CreateFilterPreferenceDto,
  UpdateFilterPreferenceDto,
} from "./dto/filter-preference.dto";
import { CoverService } from "../cover/cover.service";
import { SyncCoverTemplateDto } from "../cover/dto/sync-cover-template.dto";

@ApiTags("Master")
@Controller("master")
export class MasterController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly masterService: MasterService,
    private readonly coverService: CoverService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Returns list of supported master entities for dropdowns
   */
  @Get("entities")
  @getEntitiesSwaggerMetadata()
  async getEntities(@Res() res: Response) {
    const data = this.masterService.getEntitiesList();
    return res
      .status(HttpStatus.OK)
      .json(createResponse(HttpStatus.OK, "Entities retrieved successfully", { entities: data }));
  }

  /**
   * Returns metadata for the selected entity to build dynamic filter/grid/form
   */
  @Get(":entity/metadata")
  @getEntityMetadataSwaggerMetadata()
  async getEntityMetadata(
    @Param("entity") entity: string,
    @Res() res: Response
  ) {
    try {
      const data = await this.masterService.getEntityMetadata(entity);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Metadata retrieved successfully", data));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to retrieve metadata"
          )
        );
    }
  }

  /**
   * Minimal options list for forms: returns only id and name, no pagination
   */
  @Get(":entity/options")
  @getEntityOptionsSwaggerMetadata()
  async getEntityOptions(
    @Param("entity") entity: string,
    @Query("lookupName") lookupName: string | undefined,
    @Res() res: Response
  ) {
    try {
      const data = await this.masterService.getOptionList(entity, lookupName);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Options retrieved successfully", { data }));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to retrieve options"
          )
        );
    }
  }

  /**
   * Cover-template mappings for a policy type (Step 2 of the master Covers flow).
   * Served under /master so it inherits the master module ACL.
   * Declared before the `:entity` param routes so the static path wins.
   */
  @Get("cover-templates")
  async getCoverTemplates(
    @Query("policyTypeId") policyTypeId: string,
    @Query("organizationId") organizationId: string | undefined,
    @Res() res: Response
  ) {
    try {
      const policyType = parseInt(policyTypeId, 10);
      if (!policyType) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(HttpStatus.BAD_REQUEST, "policyTypeId is required")
          );
      }
      const orgId = organizationId ? parseInt(organizationId, 10) : undefined;
      const data = await this.coverService.getMappings(policyType, orgId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Cover mappings retrieved successfully",
            { data }
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "Failed to retrieve cover mappings"
          )
        );
    }
  }

  @Post("cover-templates/sync")
  async syncCoverTemplates(
    @Body() dto: SyncCoverTemplateDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string, 10) || 0;
      const data = await this.coverService.syncMappings(dto, userId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "Cover mappings updated successfully", {
            data,
          })
        );
    } catch (error) {
      const status =
        error instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(status)
        .json(
          createErrorResponse(
            status,
            error instanceof Error
              ? error.message
              : "Failed to sync cover mappings"
          )
        );
    }
  }

  @Get("/orgFilter/:entity")
  @getAllRecordsSwaggerMetadata()
  async getAllRecordsForOrgFilter<T>(
    @Param("entity") entity: string,
    @Res() res: Response,
    @Req() req: Request,
    @Query() query?: GetLookUpsQueryDto
  ): Promise<Response<ApiResponse<{ data: T[] }>>> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const requestStartTime = Date.now();
      const serviceStartTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "getAllRecordsForOrgFilter",
          payload: { entity },
          messageData: "method invoked",
        }),
      });
      const records = await this.masterService.getAllRecordsForOrgFilter(
        userId,
        entity,
        query?.search,
        query?.searchId,
        query?.searchBy,
        query?.sortBy,
        query?.roleKey,
        query?.sortOrder,
        query?.page,
        query?.limit,
        query?.entityIds
      );
      const serviceEndTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "getAllRecordsForOrgFilter",
          messageData: `Execution:${
            serviceEndTime - serviceStartTime
          }ms Response:${Date.now() - requestStartTime}ms`,
        }),
      });
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Records retrieved successfully",
            records
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterController",
          method: "getAllRecordsForOrgFilter",
          payload: { entity },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "Failed to retrieve records"
          )
        );
    }
  }

  // Retrieve filter preferences based on user ID
  @Get("filter-preferences")
  @getFiltersByEntitySwaggerMetadata()
  async getFiltersByEntity(@Res() res: Response, @Req() req: Request) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "getFiltersByEntity",
          messageData: "method invoked",
        }),
      });
      const filters = await this.masterService.getFiltersByEntity(userId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Filter preferences retrieved successfully",
            filters
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterController",
          method: "getFiltersByEntity",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "Failed to retrieve records"
          )
        );
    }
  }

  /**
   * Retrieves all records for the specified entity, by delegating the service
   */
  @Get(":entity")
  @getAllRecordsSwaggerMetadata()
  async getAllRecords<T>(
    @Param("entity") entity: string,
    @Res() res: Response,
    @Req() req: Request
  ): Promise<Response<ApiResponse<{ data: T[] }>>> {
    try {
      const userId = parseInt(req?.headers?.userid as string) || 0; // Default to 0 if parsing fails
      const requestStartTime = Date.now();
      const serviceStartTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "getAllRecords",
          payload: { entity },
          messageData: "method invoked",
        }),
      });

      // Parse and validate query parameters manually
      const rawQuery = req.query as any;
      
      // Create a processed query object with defaults and validation
      const processedQuery: any = {
        page: rawQuery.page ? parseInt(rawQuery.page as string, 10) : 1,
        limit: rawQuery.limit ? parseInt(rawQuery.limit as string, 10) : 50,
        search: rawQuery.search as string,
        searchId: rawQuery.searchId ? parseInt(rawQuery.searchId as string, 10) : undefined,
        searchBy: rawQuery.searchBy as string,
        sortBy: rawQuery.sortBy as string,
        sortOrder: rawQuery.sortOrder as "ASC" | "DESC" || "ASC",
        // Drop non-numeric input rather than letting NaN reach the query —
        // callers occasionally send a placeholder label instead of an id.
        entityIds: rawQuery.entityIds
          ? (() => {
              const ids = String(rawQuery.entityIds)
                .split(",")
                .map((v) => parseInt(v, 10))
                .filter((v) => !isNaN(v));
              return ids.length ? ids : undefined;
            })()
          : undefined,
      };

      // Dynamic handling of all query parameters
      // Copy all additional query parameters that could be field filters
      Object.keys(rawQuery).forEach(key => {
        if (!['page', 'limit', 'search', 'searchId', 'searchBy', 'sortBy', 'sortOrder', 'entityIds'].includes(key)) {
          // Handle numeric fields (ending with Id) by parsing them
          if (key.endsWith('Id') && rawQuery[key]) {
            processedQuery[key] = parseInt(rawQuery[key] as string, 10);
          } else {
            // Handle text fields as strings
            processedQuery[key] = rawQuery[key] as string;
          }
        }
      });

      // Parse multiple searchBy and searchId pairs dynamically for any entity
      const searchByArray = Array.isArray(rawQuery.searchBy) ? rawQuery.searchBy : [rawQuery.searchBy].filter(Boolean);
      const searchIdArray = Array.isArray(rawQuery.searchId) ? rawQuery.searchId : [rawQuery.searchId].filter(Boolean);
      
      // Keep the first searchBy/searchId for backward compatibility
      if (searchByArray.length > 0) {
        processedQuery.searchBy = searchByArray[0];
      }
      if (searchIdArray.length > 0) {
        // A multiselect parent filter arrives as CSV ("3,7"). Keep a single id
        // as a number so existing callers are unaffected; drop non-numeric
        // input rather than letting NaN reach the query.
        const ids = String(searchIdArray[0])
          .split(",")
          .map((v) => parseInt(v, 10))
          .filter((v) => !isNaN(v));
        processedQuery.searchId =
          ids.length > 1 ? ids : ids.length === 1 ? ids[0] : undefined;
      }
      
      // Handle direct search mapping for name field when searchBy=name
      if (rawQuery.searchBy === 'name' && rawQuery.search) {
        processedQuery.name = rawQuery.search;
      }

      // Extract additional filters (everything except core parameters)
      const coreParams = ['page', 'limit', 'search', 'searchId', 'searchBy', 'sortBy', 'sortOrder', 'entityIds'];
      const additionalFilters: Record<string, any> = {};
      
      Object.keys(processedQuery).forEach(key => {
        if (!coreParams.includes(key) && processedQuery[key] !== undefined) {
          additionalFilters[key] = processedQuery[key];
        }
      });

      const records = await this.masterService.getAllRecords(
        userId,
        entity,
        processedQuery?.search,
        processedQuery?.searchId,
        processedQuery?.searchBy,
        processedQuery?.sortBy,
        processedQuery?.roleKey,
        processedQuery?.sortOrder,
        processedQuery?.page,
        processedQuery?.limit,
        processedQuery?.entityIds,
        additionalFilters
      );
      const serviceEndTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "getAllRecords",
          messageData: `Execution:${
            serviceEndTime - serviceStartTime
          }ms Response:${Date.now() - requestStartTime}ms`,
        }),
      });
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Records retrieved successfully",
            records
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterController",
          method: "getAllRecords",
          payload: { entity },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "Failed to retrieve records"
          )
        );
    }
  }

  /**
   * Retrieves a single record by ID for the specified entity, by delegating the service
   */
  @Get(":entity/:id")
  @getRecordByIdSwaggerMetadata()
  async getRecordById<T>(
    @Param("entity") entity: string,
    @Param("id") id: string,
    @Res() res: Response
  ): Promise<Response<ApiResponse<{ data: T }>>> {
    try {
      const requestStartTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "getRecordById",
          payload: { entity, id },
          messageData: "method invoked",
        }),
      });
      const serviceStartTime = Date.now();
      
      const record = await this.masterService.getRecordById(entity, id);
      const serviceEndTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "getRecordById",
          messageData: `Execution:${
            serviceEndTime - serviceStartTime
          }ms Response:${Date.now() - requestStartTime}ms`,
        }),
      });
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "Record retrieved successfully", record)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterController",
          method: "getRecordById",
          payload: { entity, id },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to retrieve record"
          )
        );
    }
  }

  @Post("filter-preference")
  @saveUserFilterSwaggerMetadata()
  async saveUserFilter(
    @Body() filterData: CreateFilterPreferenceDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "MasterController",
          method: "saveUserFilter",
          payload: { filterData },
          messageData: "method invoked",
        }),
      });
      const result = await this.masterService.saveUserFilter(
        userId,
        filterData
      );
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            "User filter preference saved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "MasterController",
          method: "saveUserFilter",
          payload: { filterData },
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  /**
   * Creates a new record for the specified entity, by delegating the service
   */
  @Post(":entity")
  @createRecordSwaggerMetadata()
  async createRecord<T>(
    @Param("entity") entity: string,
    @Body() data: T,
    @Res() res: Response
  ): Promise<Response<ApiResponse<T>>> {
    try {
      const requestStartTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "createRecord",
          payload: { entity },
          messageData: "method invoked",
        }),
      });
      const serviceStartTime = Date.now();
      const entityClass = getEntityByName(entity);
      const newRecord = await this.masterService.createRecord(
        entityClass,
        data
      );
      const serviceEndTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "createRecord",
          messageData: `Execution:${
            serviceEndTime - serviceStartTime
          }ms Response:${Date.now() - requestStartTime}ms`,
        }),
      });
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            "Record created successfully",
            newRecord
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterController",
          method: "createRecord",
          payload: { entity },
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorResponse(HttpStatus.BAD_REQUEST, error.message));
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to create record"
          )
        );
    }
  }

  @Put("filter-preference/:entity")
  @updateUserFilterSwaggerMetadata()
  async updateUserFilter(
    @Param("entity") entity: string,
    @Body() filterData: UpdateFilterPreferenceDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "updateUserFilter",
          payload: { entity, filterData },
          messageData: "method invoked",
        }),
      });
      const result = await this.masterService.updateUserFilter(
        userId,
        entity,
        filterData
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "User filter updated successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterController",
          method: "updateUserFilter",
          payload: { entity, filterData },
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  /**
   * Updates an existing record by ID for the specified entity, by delegating the service
   */
  @Put(":entity/:id")
  @updateRecordByIdSwaggerMetadata()
  async updateRecordById<T>(
    @Param("entity") entity: string,
    @Param("id") id: string,
    @Body() data: T,
    @Res() res: Response
  ): Promise<Response<ApiResponse<T>>> {
    try {
      const requestStartTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "updateRecordById",
          payload: { entity, id },
          messageData: "method invoked",
        }),
      });
      const serviceStartTime = Date.now();
      const entityClass = getEntityByName(entity);
      const updatedRecord = await this.masterService.updateRecordById(
        entityClass,
        id,
        data
      );
      const serviceEndTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "updateRecordById",
          messageData: `Execution:${
            serviceEndTime - serviceStartTime
          }ms Response:${Date.now() - requestStartTime}ms`,
        }),
      });
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Record updated successfully",
            updatedRecord
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterController",
          method: "updateRecordById",
          payload: { entity, id },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to update record"
          )
        );
    }
  }

  /**
   * Deletes a record by ID for the specified entity, by delegating the service
   */
  @Delete(":entity/:id")
  @deleteRecordByIdSwaggerMetadata()
  async deleteRecordById(
    @Param("entity") entity: string,
    @Param("id") id: string,
    @Res() res: Response
  ): Promise<Response<ApiResponse<{}>>> {
    try {
      const requestStartTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "deleteRecordById",
          payload: { entity, id },
          messageData: "method invoked",
        }),
      });
      const serviceStartTime = Date.now();
      const entityClass = getEntityByName(entity);
      await this.masterService.deleteRecordById(entityClass, id);
      const serviceEndTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterController",
          method: "deleteRecordById",
          messageData: `Execution:${
            serviceEndTime - serviceStartTime
          }ms Response:${Date.now() - requestStartTime}ms`,
        }),
      });
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Record deleted successfully"));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterController",
          method: "deleteRecordById",
          payload: { entity, id },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to delete record"
          )
        );
    }
  }
}
