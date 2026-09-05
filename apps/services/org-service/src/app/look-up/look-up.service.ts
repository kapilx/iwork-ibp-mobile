import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { CreateLookUpDto } from "./dto/create-look-up.dto";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { UpdateLookUpDto } from "./dto/update-look-up.dto";
import { LookUpRepository } from "./look-up.repository";
import { LookUpDto } from "./dto/look-up.dto";
import { DEFAULT_VALUES } from "../../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class LookUpService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly lookUpRepository: LookUpRepository,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Retrieves all LookUps by delegating the repository.
   */
  async getAllLookUps(
    search?: string,
    sortBy: keyof LookUpDto = "id",
    sortOrder: "ASC" | "DESC" = "ASC",
    page: number = DEFAULT_VALUES.PAGE,
    limit: number = DEFAULT_VALUES.LIMIT
  ) {
    try {
      const lookUps = await this.lookUpRepository.getAllLookUps(
        search,
        sortBy,
        sortOrder,
        page,
        limit
      );
      return lookUps;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpService",
          method: "getAllLookUps",
          messageData: error,
        }),
      });

      return createErrorResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : "Failed to retrieve LookUps"
      );
    }
  }

  /**
   * Creates a new LookUp by delegating to the repository.
   */
  async createLookUp(createLookUpDto: CreateLookUpDto): Promise<LookUpDto> {
    try {
      return this.lookUpRepository.createLookUp(createLookUpDto);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpService",
          method: "createLookUp",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : "Failed to create LookUp"
        )
      );
    }
  }

  /**
   * Delegates the retreival of a LookUp by ID to the repository.
   */
  async getLookUpById(id: number): Promise<{ data: LookUpDto }> {
    try {
      return this.lookUpRepository.getLookUpById(id);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : "Failed to find LookUp"
        )
      );
    }
  }

  /**
   * Delegates the updation of a LookUp by ID to the repository.
   */
  async updateLookUpById(
    id: number,
    updateLookUpDto: UpdateLookUpDto
  ): Promise<{ data: LookUpDto }> {
    try {
      return this.lookUpRepository.updateLookUpById(id, updateLookUpDto);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpService",
          method: "updateLookUpById",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : "Failed to update LookUp"
        )
      );
    }
  }

  /**
   * Delegates the deletion of a LookUp by ID to the repository.
   */
  async deleteLookUpById(id: number): Promise<void> {
    try {
      return this.lookUpRepository.deleteLookUpById(id);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpService",
          method: "deleteLookUpById",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : "Failed to delete LookUp"
        )
      );
    }
  }

  /**
   * Get lookup values by delegating the repository.
   */
  async getLookUpsByName(
    lookUpName: string,
    organisationId: number,
    sortOrder: "ASC" | "DESC" = "ASC"
  ): Promise<{ id: number; lookUpValue: string }[]> {
    try {
      return await this.lookUpRepository.findByLookUpName(
        lookUpName,
        organisationId,
        sortOrder
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpService",
          method: "getLookUpsByName",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : "Failed to retrieve LookUps"
        )
      );
    }
  }

  /**
   * Get lookup values using look up key by delegating the repository
   */
  async getLookUpsByKey(
    lookUpKey: string
  ): Promise<
    { id: number; lookUpValue: string; lookUpKey: string; lookUpName: string }[]
  > {
    try {
      return await this.lookUpRepository.findByLookUpKey(lookUpKey);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpService",
          method: "getLookUpsByKey",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : "Failed to retrieve LookUps"
        )
      );
    }
  }

  /**
   * Retrieves distinct lookup names.
   */
  async getDistinctLookUpNames(): Promise<string[]> {
    try {
      return this.lookUpRepository.getDistinctLookUpNames();
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpService",
          method: "getDistinctLookUpNames",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error
            ? error.message
            : "Failed to retrieve LookUp Names"
        )
      );
    }
  }

  /**
   * Retrieves LookUp records based on a list of lookup names.
   */
  async getLookUpsByNames(
    lookupNames: string[]
  ): Promise<Record<string, { id: number; lookUpValue: string }[]>> {
    try {
      // Ensure lookupNames is valid
      if (!Array.isArray(lookupNames) || lookupNames.length === 0) {
        throw new Error("lookupNames must be a non-empty array");
      }

      const lookUpRecords = await this.lookUpRepository.findByLookupNames(
        lookupNames
      );

      // Transform the result into the desired format
      const transformedRecords = lookupNames.reduce((acc, name) => {
        acc[name] = lookUpRecords
          .filter((record) => record.lookUpName === name)
          .map((record) => ({
            id: record.id,
            lookUpValue: record.lookUpValue,
            lookUpKey: record.lookUpKey,
          }));
        return acc;
      }, {} as Record<string, { id: number; lookUpValue: string }[]>);

      return transformedRecords;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LookUpService",
          method: "getLookUpsByNames",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to retrieve LookUp records"
      );
    }
  }
}
