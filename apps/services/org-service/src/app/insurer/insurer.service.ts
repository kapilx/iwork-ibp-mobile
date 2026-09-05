import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, QueryRunner } from "typeorm";
import { Organisation } from "../../../../service-lib/src/lib/entities/organisation.entity";
import {
  DEFAULT_INSURER_STATUS_ACTIVE_KEY,
  LOOK_UP_DATA,
  MASTER_DATA,
  MAPPED_DATA_DELETION,
  ENTITY_NAME,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createErrorResponse,
  removeMetadataFields,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { InsurerAddress } from "../../../../service-lib/src/lib/entities/insurer-address.entity";
import { StateGstDetail } from "../../../../service-lib/src/lib/entities/company-gst-detail.entity";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { AddressService } from "../address/address.service";
import { LookUpRepository } from "../look-up/look-up.repository";
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { InsurerResponseDto } from "./dto/insurer-response.dto";
import { UpdateInsurerDto } from "./dto/update-insurer.dto";
import { InsurerRepository } from "./insurer.repository";
import { CompanyInsurerDto } from "./dto/company-insurer.dto";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import {
  sortRealtionsMapping,
  INSURER_MAP_TABLE_DELETE_FIELDS,
} from "../../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class InsurerService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly insurerRepository: InsurerRepository,
    private readonly addressService: AddressService,
    private readonly lookUpRepository: LookUpRepository,
    private readonly dataSource: DataSource,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly masterValidation: MasterValidationService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  // Adds a new insurer with addreess using the repository.
  async addInsurer(
    createInsurerDto: CreateInsurerDto,
    userId: number
  ): Promise<InsurerResponseDto> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "InsurerService",
        method: "addInsurer",
        messageData: "method invoked",
      }),
    });

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Check if the insurer already exists
      const existingInsurer = await this.insurerRepository.findInsurerByName(
        createInsurerDto.insurerName,
        createInsurerDto.countryId
      );
      if (existingInsurer && existingInsurer.length > 0) {
        throw new ConflictException(
          `An insurer with the name "${createInsurerDto.insurerName}" already exists.`
        );
      }

      await this.masterValidation.validateMasterIds(
        createInsurerDto,
        MASTER_DATA
      );
      await this.lookUpValidation.validateDynamicLookupValues(
        createInsurerDto,
        { ...LOOK_UP_DATA, companyTypeLid: LOOK_UP_DATA.insuranceCompanyTypeLid }
      );

      // Set default status and metadata
      const insurerStatus = await this.lookUpRepository.findByLookUpKey(
        DEFAULT_INSURER_STATUS_ACTIVE_KEY
      );
      createInsurerDto.statusLid = insurerStatus[0].id;
      createInsurerDto.createdAt = new Date();
      createInsurerDto.updatedAt = new Date();
      createInsurerDto.createdBy = userId;
      createInsurerDto.updatedBy = userId;

      // Add insurer
      const insurer = await this.insurerRepository.addInsurer(
        queryRunner,
        createInsurerDto
      );

      // Save address details (KYC stored on address; GST record created then linked via stateGstDetailId)
      const addressMappings = [];
      if (createInsurerDto.address && createInsurerDto.address.length > 0) {
        for (const addressDto of createInsurerDto.address) {
          const { gstStateId, gstNumber, gstCategoryLid, ...cleanAddressDto } = addressDto as any;

          if (gstStateId || gstNumber || gstCategoryLid) {
            const gstEntity = queryRunner.manager.create(StateGstDetail, {
              stateId: gstStateId as number,
              gstNumber,
              gstCategoryLid: gstCategoryLid as number,
              companyId: insurer.id,
              entityType: "INSURER",
              statusLid: 1,
              createdBy: userId,
              updatedBy: userId,
            });
            const savedGst = await queryRunner.manager.save(gstEntity);
            cleanAddressDto.stateGstDetailId = savedGst.id;
          }

          const address = await this.addressService.addAddress(cleanAddressDto, userId);

          const insurerAddress = new InsurerAddress();
          insurerAddress.insurerId = insurer.id;
          if (!address || !address.id) {
            throw new InternalServerErrorException(
              createErrorResponse(HttpStatus.BAD_REQUEST, errorMessages.addressIdNotfound)
            );
          }
          insurerAddress.addressId = address.id;
          await this.insurerRepository.addInsurerAddress(queryRunner, insurerAddress);
          addressMappings.push(address);
        }
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      const insurerDetails =
        await this.insurerRepository.fetchInsurerByIdWithDetails(insurer.id);

      if (!insurerDetails) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            errorMessages.failedToAddInsurer
          )
        );
      }

      // Return the detailed response

      // Prepare the response
      const response = {
        ...insurerDetails,
      };

      // Remove metadata fields from the response
      removeMetadataFields(response);
      return response;
    } catch (error) {
      // Rollback the transaction in case of an error
      await queryRunner.rollbackTransaction();

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "InsurerService",
          method: "addInsurer",
          messageData: error,
        }),
      });

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof HttpException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          `${errorMessages.failedToAddInsurer}: ${(error as Error)?.message || String(error)}`
        )
      );
    } finally {
      await queryRunner.release();
    }
  }

  // Gets all insurers using the repository.
  async getAllInsurers(
    page: number,
    limit: number,
    sortBy: string,
    search?: string,
    searchBy?: string,
    userId?: number
  ): Promise<{
    insurers: InsurerResponseDto[];
    total: number;
    totalActiveInsurers: number;
    kpisData: {
      totalActiveInsurers: number;
      totalActivePolicies: number;
      brokerageAmount: number;
      netPremium: number;
    };
  }> {
    try {
      const searchParams = mapSearchParams(search || "");
      if (searchBy) {
        searchParams.push({ searchBy: "insurerNameFilter", searchValue: [searchBy] });
      }
      const sortParams = mapSortParams(
        sortBy,
        ENTITY_NAME.INSURER.toUpperCase()
      );

      const orgIndex = searchParams.findIndex(
        (p) => p.searchBy === "owner.organisationId"
      );
      if (orgIndex !== -1) {
        const organisationId = Number(
          Array.isArray(searchParams[orgIndex].searchValue)
            ? (searchParams[orgIndex].searchValue as string[])[0]
            : searchParams[orgIndex].searchValue
        );
        searchParams.splice(orgIndex, 1);
        const org = await this.dataSource
          .getRepository(Organisation)
          .findOne({ where: { id: organisationId }, select: ["countryId"] });
        if (org?.countryId) {
          searchParams.push({
            searchBy: "countryId",
            searchValue: [String(org.countryId)],
          });
        }
      }

      const { data, count } =
        await this.insurerRepository.fetchAllInsurersWithAddress(
          page,
          limit,
          searchParams,
          sortParams,
          searchBy,
          userId
        );

      const insurerStatus = await this.lookUpRepository.findByLookUpKey(
        DEFAULT_INSURER_STATUS_ACTIVE_KEY
      );
      const totalActiveInsurers =
        await this.insurerRepository.getTotalActiveInsurers(
          insurerStatus[0].id
        );

      if (count === 0) {
        return {
          insurers: data,
          total: count,
          totalActiveInsurers,
          kpisData: {
            totalActiveInsurers: 0,
            totalActivePolicies: 0,
            brokerageAmount: 0,
            netPremium: 0,
          },
        };
      }

      const INSURER_FILTER_KEYS = new Set([
        "companyAddresses.address.cityId.id",
        "branchTypeLid",
        "branchCode",
        "branchName",
        "insurerNameFilter",
        "countryId",
      ]);
      const hasInsurerFilters = searchParams.some((p) =>
        INSURER_FILTER_KEYS.has(p.searchBy)
      );

      let kpiInsurerIds: number[] | undefined;
      if (hasInsurerFilters) {
        kpiInsurerIds = await this.insurerRepository.getInsurerIdsByAddressFilters(searchParams);
      }

      let totalActivePolicies = 0;
      let brokerageAmount = 0;
      let netPremium = 0;
      try {
        const kpis = await this.insurerRepository.getInsurerListingKpis(kpiInsurerIds);
        totalActivePolicies = kpis.totalActivePolicies;
        brokerageAmount = kpis.brokerageAmount;
        netPremium = kpis.netPremium;
      } catch (kpiError) {
        console.error("getInsurerListingKpis error:", kpiError);
      }
      return {
        insurers: data,
        total: count,
        totalActiveInsurers,
        kpisData: {
          totalActiveInsurers: count,
          totalActivePolicies,
          brokerageAmount,
          netPremium,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          errorMessages.failedToFetchInsurers || error.message
        )
      );
    }
  }
  // Gets a single insurer by ID using the repository.
  async getInsurerById(insurerId: number): Promise<Insurer> {
    try {
      const insurer = await this.insurerRepository.fetchInsurerByIdWithDetails(
        insurerId
      );

      if (!insurer) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.insurerNotFound
          )
        );
      }

      removeMetadataFields(insurer);
      return insurer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          errorMessages.failedToFetchInsurer
        )
      );
    }
  }

  // Modifies an insurer by ID using the repository.
  async modifyInsurer(
    insurerId: number,
    updateInsurerDto: UpdateInsurerDto,
    userId: number
  ): Promise<InsurerResponseDto> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const insurer = await this.insurerRepository.fetchInsurerById(insurerId);

      if (!insurer) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.insurerNotFound
          )
        );
      }
      await this.lookUpValidation.validateDynamicLookupValues(
        updateInsurerDto,
        { ...LOOK_UP_DATA, companyTypeLid: LOOK_UP_DATA.insuranceCompanyTypeLid }
      );
      // Filter out the `address` and `gstDetails` fields before updating the insurer
      const { address, gstDetails, ...insurerDetails } = updateInsurerDto;

      insurerDetails.updatedBy = userId;
      insurerDetails.updatedAt = new Date();
      if (
        insurerDetails.insurerName &&
        insurerDetails.insurerName !== insurer.insurerName
      ) {
        // Check if the insurer name already exists
        const existingInsurer = await this.insurerRepository.findInsurerByName(
          insurerDetails.insurerName,
          insurerDetails.countryId ?? insurer.countryId
        );
        if (existingInsurer && existingInsurer.length > 0) {
          throw new ConflictException(
            `An insurer with the name "${insurerDetails.insurerName}" already exists.`
          );
        }
      }
      // Update the insurer details using a transaction
      const updatedInsurer = await this.insurerRepository.modifyInsurer(
        queryRunner,
        insurerId,
        insurerDetails
      );

      // Handle address updates
      const addressMappings = [];
      if (address) {
        // retrieves the existing address
        const existingAddressIds =
          await this.insurerRepository.getEntityTableMapIds(
            INSURER_MAP_TABLE_DELETE_FIELDS.INSURER_ADDRESS,
            INSURER_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
            { insurerId: insurerId }
          );
        if (address.length > 0) {
          for (const addressDto of address) {
            const { gstStateId, gstNumber, gstCategoryLid: gstCatLid, ...cleanAddressDto } = addressDto as any;
            let updatedAddress;

            if (gstStateId || gstNumber || gstCatLid) {
              if (cleanAddressDto.stateGstDetailId) {
                await queryRunner.manager.update(StateGstDetail, { id: cleanAddressDto.stateGstDetailId }, {
                  stateId: gstStateId,
                  gstNumber,
                  gstCategoryLid: gstCatLid,
                  companyId: insurerId,
                  entityType: "INSURER",
                  statusLid: 1,
                  updatedBy: userId,
                });
              } else {
                const gstEntity = queryRunner.manager.create(StateGstDetail, {
                  stateId: gstStateId as number,
                  gstNumber,
                  gstCategoryLid: gstCatLid as number,
                  companyId: insurerId,
                  entityType: "INSURER",
                  statusLid: 1,
                  createdBy: userId,
                  updatedBy: userId,
                });
                const savedGst = await queryRunner.manager.save(gstEntity);
                cleanAddressDto.stateGstDetailId = savedGst.id;
              }
            }

            if (cleanAddressDto.id) {
              const index = existingAddressIds.indexOf(cleanAddressDto.id);
              if (index !== -1) existingAddressIds.splice(index, 1);
              updatedAddress = await this.addressService.updateAddressById(cleanAddressDto.id, cleanAddressDto, userId);
            } else {
              updatedAddress = await this.addressService.addAddress(cleanAddressDto, userId);
              const insurerAddress = new InsurerAddress();
              insurerAddress.insurerId = insurerId;
              insurerAddress.addressId = updatedAddress.id;
              await this.insurerRepository.addInsurerAddress(queryRunner, insurerAddress);
            }
            addressMappings.push(updatedAddress);
          }
        }
        // Only delete stale address mappings when the payload includes existing
        // addresses (i.e. the caller sent a full address list). If every address
        // in the payload is brand-new (no id), it is an append-only operation
        // and we must not touch the existing branches.
        const payloadHasExistingAddress = address.some((a: any) => a.id);
        if (payloadHasExistingAddress) {
          await this.insurerRepository.deleteEntityTableMapIds(
            INSURER_MAP_TABLE_DELETE_FIELDS.INSURER_ADDRESS,
            existingAddressIds,
            INSURER_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
            MAPPED_DATA_DELETION.MAP_REMOVED
          );
        }
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = {
        ...updatedInsurer,
        address: addressMappings,
      };

      // Remove metadata fields from the response
      removeMetadataFields(response);
      return response;
    } catch (error) {
      // Rollback the transaction in case of an error
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof HttpException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `${errorMessages.failedToModifyInsurer}: ${(error as Error)?.message || String(error)}`
        )
      );
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  // Deletes an insurer by ID using the repository.
  async deleteInsurer(insurerId: number): Promise<{ message: string }> {
    try {
      const insurer = await this.insurerRepository.fetchInsurerById(insurerId);

      if (!insurer) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.insurerNotFound
          )
        );
      }

      await this.insurerRepository.softDeleteInsurer(insurerId);

      return { message: successMessage.insurerDeleted };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToDeleteInsurer
        )
      );
    }
  }

  // Gets a list of insurers with pagination and sorting.
  async getInsurerList(
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortOrder: string,
    userId: number,
    entityIds?: number[]
  ): Promise<{ data: InsurerResponseDto[]; total: number }> {
    try {
      const insurers = await this.insurerRepository.fetchInsurerList(
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        userId,
        entityIds
      );
      return insurers;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchInsurers
        )
      );
    }
  }

  async getCompanyInsurers(
    companyId: number,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ data: CompanyInsurerDto[]; count: number }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "InsurerService",
        method: "getCompanyInsurers",
        payload: { companyId, page, limit, search },
        messageData: "method invoked",
      }),
    });

    try {
      return await this.insurerRepository.findCompanyInsurers(
        companyId,
        page,
        limit,
        search
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerService",
          method: "getCompanyInsurers",
          payload: { companyId, page, limit, search },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchInsurers
        )
      );
    }
  }

  /** Fetches insurer contacts by insurer ID. */
  async getInsurerContacts(
    insurerId: number,
    page: number,
    limit: number,
    search: string,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "InsurerService",
          method: "getInsurerContacts",
          payload: { insurerId, page, limit, search, status },
          messageData: "method invoked",
        }),
      });

      const insurerContacts = await this.insurerRepository.fetchInsurerContacts(
        insurerId,
        page,
        limit,
        search,
        status
      );

      if (!insurerContacts || insurerContacts.count === 0) {
        return { data: [], count: 0 };
      }

      // Transform the data to return only necessary fields
      const transformedContacts = insurerContacts.data.map(
        (contactMapping) => ({
          id: contactMapping?.contact?.id ?? null,
          firstName: contactMapping?.contact?.firstName ?? null,
          lastName: contactMapping?.contact?.lastName ?? null,
          displayName: contactMapping?.contact?.displayName ?? null,
          status: contactMapping?.contact?.status?.lookUpValue ?? null,
        })
      );

      return { data: transformedContacts, count: transformedContacts.length };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerService",
          method: "getInsurerContacts",
          payload: { insurerId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchInsurerContacts || error.message
        )
      );
    }
  }
  async getInsurerBranches(insurerId: number, search?: string, page: number = 1, limit: number = 10) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "InsurerService",
          method: "getInsurerBranches",
          payload: { insurerId },
          messageData: "method invoked",
        }),
      });

      const { branches, count } = await this.insurerRepository.fetchInsurerBranches(
        insurerId,
        search,
        page,
        limit,
      );

      const data = branches.map((b) => ({
        id: b.address?.id ?? null,
        branchName: b.address?.branchName ?? null,
        branchCode: b.address?.branchCode ?? null,
        branchType: b.address?.branchType?.lookUpValueKey ?? null,
        address1: b.address?.address1 ?? null,
      }));

      return { data, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerService",
          method: "getInsurerBranches",
          payload: { insurerId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchInsurerBranches || error.message
        )
      );
    }
  }

  // Gets insurer details by ID and user ID.
  async getInsurerDetails(id: number, userId: number): Promise<Insurer> {
    try {
      const fields = ["id", "insurerName", "displayName"];
      const relations = ["insurerAddresses.address"];
      const whereCondition = {
        id: id,
      };

      const insurerDetails = await this.insurerRepository.fetchInsurerDetails(
        fields,
        relations,
        whereCondition
      );

      const transformedData = {
        id: insurerDetails.id,
        insurerName: insurerDetails.insurerName,
        displayName: insurerDetails.displayName,
        insurerAddresses: insurerDetails.insurerAddresses?.map((address) => ({
          id: address.address?.id,
          address1: address.address?.address1,
          city: address.address?.cityId,
        })),
      };

      return transformedData;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchInsurer
        )
      );
    }
  }

  // Gets insurer locations by ID and user ID.
  async getInsurerLocations(
    id: number,
    page: number,
    limit: number,
    search?: string,
    entityIds?: number[]
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "InsurerService",
          method: "getInsurerLocations",
          payload: { id, page, limit, search },
          messageData: "method invoked",
        }),
      });

      const { data, count } = await this.insurerRepository.getInsurerLocations(
        id,
        page,
        limit,
        search,
        entityIds
      );

      const transformedData =
        data?.map((location) => ({
          id: location?.address?.id ?? null,
          address1: location?.address?.address1 ?? null,
          city: location?.address?.cityId?.name ?? null,
        })) ?? [];

      return { data: transformedData, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerService",
          method: "getInsurerLocations",
          payload: { id, page, limit, search },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch insurer locations: ${error.message}`
      );
    }
  }

  async getInsurerDropdown(search?: string, page: number = 1, limit: number = 10, entityIds?: number[]) {
    return this.insurerRepository.fetchInsurerDropdown(search, page, limit, entityIds);
  }

  async getDistinctInsurerNames(search?: string): Promise<string[]> {
    return this.insurerRepository.getDistinctInsurerNames(search);
  }

  async getDistinctBranchCodes(search?: string): Promise<string[]> {
    return this.insurerRepository.getDistinctBranchCodes(search);
  }

  async getDistinctBranchNames(search?: string): Promise<string[]> {
    return this.insurerRepository.getDistinctBranchNames(search);
  }
}
