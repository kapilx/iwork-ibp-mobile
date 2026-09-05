import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  ENTITY_NAME,
  LOOK_UP_DATA,
  MASTER_DATA,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { removeMetadataFields } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { ContactResponseDto } from "../contact/dto/contact-response.dto";
import { CreateTpaDto } from "./dto/create-tpa.dto";
import { TpaDto } from "./dto/get-tpa.dto";
import { UpdateTpaDto } from "./dto/update-tpa.dto";
import { TpaRepository } from "./tpa.repository";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { sortRealtionsMapping } from "../../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class TpaService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly tpaRepository: TpaRepository,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly masterValidation: MasterValidationService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Create a new TPA record by delegating its repository.
   */
  async addTpa(createTpaObject: CreateTpaDto, userId: number): Promise<TpaDto> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "TpaService",
          method: "addTpa",
          messageData: "method invoked",
        }),
      });
      await this.masterValidation.validateMasterIds(
        createTpaObject,
        MASTER_DATA
      );
      await this.lookUpValidation.validateDynamicLookupValues(
        createTpaObject,
        LOOK_UP_DATA
      );

      const tpa = await this.tpaRepository.addTpa(createTpaObject, userId);
      removeMetadataFields(tpa);
      return tpa;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "TpaService",
          method: "addTpa",
          messageData: error,
        }),
      });
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  /**
   * Retrieve all TPA recordsby delegating its repository.
   */
  async getTpas(
    userId: number,
    sortBy: string,
    page: number,
    limit: number,
    search?: string,
    searchBy?: string
  ): Promise<{
    data: TpaDto[];
    count: number;
    totalActiveTpa: number;
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "TpaService",
          method: "getTpas",
          messageData: "method invoked",
        }),
      });
      const searchParams = mapSearchParams(search || "");
      const sortParams = mapSortParams(sortBy, ENTITY_NAME.TPA.toUpperCase());
      if (sortParams) {
        const tpaSortOrderSearch = sortParams.find(
          (item) => item.field === sortRealtionsMapping.PARENT_TPA_CITY_SORT_KEY
        );
        if (tpaSortOrderSearch) {
          tpaSortOrderSearch.field = sortRealtionsMapping.PARENT_TPA_CITY_SORT;
        }
        const tpaSortOrderStateSearch = sortParams.find(
          (item) =>
            item.field === sortRealtionsMapping.PARENT_TPA_STATE_SORT_KEY
        );
        if (tpaSortOrderStateSearch) {
          tpaSortOrderStateSearch.field =
            sortRealtionsMapping.PARENT_TPA_STATE_SORT;
        }
      }
      const [tpaData, count, totalActiveTpa] = await this.tpaRepository.getTpas(
        userId,
        searchParams,
        sortParams,
        page,
        limit,
        searchBy
      );
      return { data: tpaData, count, totalActiveTpa };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "TpaService",
          method: "getTpas",
          messageData: error,
        }),
      });
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  /**
   * Retrieve the TPA record by Id by delegating its repository.
   */
  async getTpaById(tpaId: number): Promise<TpaDto> {
    const tpa = await this.tpaRepository.getTpaById(tpaId);
    if (!tpa) {
      throw new NotFoundException(infoMessages.tpaNotFound);
    }
    removeMetadataFields(tpa);
    return tpa;
  }

  /**
   * Update a TPA record by tpaId by delegating its repository.
   */
  async updateTpaById(
    tpaId: number,
    updateTpaObject: UpdateTpaDto,
    userId: number
  ): Promise<TpaDto> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updateTpaObject,
        LOOK_UP_DATA
      );
      const updated = await this.tpaRepository.updateTpaById(
        tpaId,
        updateTpaObject,
        userId
      );
      if (!updated) {
        throw new NotFoundException(infoMessages.tpaNotFound);
      }
      return updated;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  /**
   * Delete a TPA record by tpaId by delegating its repository.
   */
  async deleteTpaById(tpaId: number): Promise<void> {
    try {
      const deleted = await this.tpaRepository.deleteTpaById(tpaId);
      if (!deleted) {
        throw new NotFoundException(infoMessages.tpaNotFound);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  /** Returns the active tpa company list data */
  async getCompanyList(
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sort: "ASC" | "DESC",
    userId: number,
    entityIds?: number[]
  ) {
    try {
      // Check if the user has permission to access the company list
      const tpaCompanies = await this.tpaRepository.CompanyList(
        page,
        limit,
        search,
        sortBy,
        sort,
        userId,
        entityIds
      );

      return tpaCompanies;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw NotFoundException to be handled by the controller
      }

      throw new Error("Failed to fetch companies");
    }
  }
  /** Returns the active tpa company address and contacts data */
  async getCompanyBasicDetails(id: number, userId: number) {
    try {
      const fields = ["id", "tpaName", "displayName"];
      const relations = ["tpaAddresses.address"];
      const whereCondition = { id: id };
      const companyDetails = await this.tpaRepository.getCompanyListData(
        fields,
        relations,
        whereCondition
      );
      if (!companyDetails) {
        throw new NotFoundException(errorMessages.tpaCompanyNotFound);
      }
      return companyDetails;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /** Fetches TPA contacts by TPA ID. */
  async getTpaContacts(
    tpaId: number,
    page: number,
    limit: number,
    search: string,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      const tpaContacts = await this.tpaRepository.fetchTpaContacts(
        tpaId,
        page,
        limit,
        search,
        status
      );

      if (!tpaContacts || tpaContacts.data.length === 0) {
        return { data: [], count: 0 };
      }
      // Transform the data to return only necessary fields
      const transformedContacts = tpaContacts.data.map((contact) => ({
        id: contact?.linkedContact?.id ?? null,
        firstName: contact?.linkedContact?.firstName ?? null,
        lastName: contact?.linkedContact?.lastName ?? null,
        displayName: contact?.linkedContact?.displayName ?? null,
        status: contact?.linkedContact?.status?.lookUpValue ?? null,
      }));

      return { data: transformedContacts, count: transformedContacts.length };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error; // Re-throw NotFoundException to be handled by the controller
      }
      throw new BadRequestException(
        `Failed to fetch contacts for TPA ID ${tpaId}: ${error.message}`
      );
    }
  }
}
