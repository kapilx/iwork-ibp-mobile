import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  HttpStatus,
  HttpException,
  BadRequestException,
} from "@nestjs/common";
import { BrokerRepository } from "./broker.repository";
import { CreateBrokerDto } from "./dto/create-broker.dto";
import { BrokerAddress } from "../../../../service-lib/src/lib/entities/broker-address.entity";
import { AddressService } from "../address/address.service";
import { DataSource, QueryRunner } from "typeorm";
import {
  createErrorResponse,
  removeMetadataFields,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { UpdateBrokerDto } from "./dto/update-broker.dto";
import { LookUpRepository } from "../look-up/look-up.repository";
import {
  DEFAULT_BROKER_STATUS_ACTIVE,
  ENTITY_NAME,
  LOOK_UP_DATA,
  MAPPED_DATA_DELETION,
  MASTER_DATA,
  NATURE_OF_BROKING_BUSSINESS_INSURENCE_ONLY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { Broker } from "apps/services/service-lib/src/lib/entities";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import {
  BROKER_MAP_TABLE_DELETE_FIELDS,
  sortRealtionsMapping,
} from "../../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class BrokerService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly brokerRepository: BrokerRepository,
    private readonly addressService: AddressService,
    private readonly dataSource: DataSource,
    private readonly lookUpRepository: LookUpRepository,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly masterValidation: MasterValidationService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Add a new broker with addresses */
  async createBroker(
    createBrokerDto: CreateBrokerDto,
    userId: number
  ): Promise<Broker> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "BrokerService",
          method: "createBroker",
          messageData: "method invoked",
        }),
      });
      // Check if the broker already exists
      const existingBroker = await this.brokerRepository.findBrokerByName(
        createBrokerDto.brokerName,
        createBrokerDto.countryId
      );
      if (existingBroker) {
        throw new ConflictException(
          `A broker with the name "${createBrokerDto.brokerName}" already exists.`
        );
      }
      await this.masterValidation.validateMasterIds(
        createBrokerDto,
        MASTER_DATA
      );
      await this.lookUpValidation.validateDynamicLookupValues(
        createBrokerDto,
        LOOK_UP_DATA
      );
      if (!createBrokerDto.natureOfBrokingBussinessLid) {
        const brokingNature = await this.lookUpRepository.findByLookUpKey(
          NATURE_OF_BROKING_BUSSINESS_INSURENCE_ONLY,
        );
        if (!brokingNature || brokingNature.length === 0) {
          throw new BadRequestException(
            "Lookup key NATURE_OF_BROKING_BUSSINESS_INSURENCE_ONLY not found."
          );
        }
        createBrokerDto.natureOfBrokingBussinessLid = brokingNature[0].id;
      }
      // Set default status and metadata
      const brokerStatus = await this.lookUpRepository.findByLookUpKey(
        DEFAULT_BROKER_STATUS_ACTIVE
      );
      // Set metadata fields
      createBrokerDto.statusLid = brokerStatus[0].id;
      createBrokerDto.createdAt = new Date();
      createBrokerDto.updatedAt = new Date();
      createBrokerDto.createdBy = userId;
      createBrokerDto.updatedBy = userId;

      // Add broker
      const broker = await this.brokerRepository.addBroker(
        queryRunner,
        createBrokerDto
      );

      // Save address details
      const addressMappings = [];
      if (createBrokerDto.address && createBrokerDto.address.length > 0) {
        for (const addressDto of createBrokerDto.address) {
          const address = await this.addressService.addAddress(
            addressDto,
            userId
          );

          const brokerAddress = new BrokerAddress();
          brokerAddress.brokerId = broker.id;
          brokerAddress.addressId = address.id;

          await this.brokerRepository.addBrokerAddress(
            queryRunner,
            brokerAddress
          );
          addressMappings.push(address);
        }
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      const brokerDetails = await this.brokerRepository.fetchBrokerById(
        broker.id
      );

      if (!brokerDetails) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            errorMessages.failedToAddBroker
          )
        );
      }

      const response = {
        ...brokerDetails,
      };

      // Remove metadata fields from the response
      removeMetadataFields(response);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "BrokerService",
          method: "createBroker",
          messageData: error,
        }),
      });
      if (
        error instanceof HttpException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          errorMessages.failedToAddBroker
        )
      );
    } finally {
      await queryRunner.release();
    }
  }

  /** Get all brokers */
  async getAllBrokers(
    page: number,
    limit: number,
    sortBy: string,
    search?: string,
    searchBy?: string,
    userId?: number
  ): Promise<{
    brokers: [];
    total: number;
    totalBrokers: number;
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "BrokerService",
          method: "getAllBrokers",
          messageData: "method invoked",
        }),
      });
      const searchParams = mapSearchParams(search || "");
      const sortParams = mapSortParams(
        sortBy,
        ENTITY_NAME.BROKER.toUpperCase()
      );
      if (sortParams) {
        const brokerSortOrderSearch = sortParams.find(
          (item) =>
            item.field === sortRealtionsMapping.PARENT_BROKER_CITY_SORT_KEY
        );
        if (brokerSortOrderSearch) {
          brokerSortOrderSearch.field =
            sortRealtionsMapping.PARENT_BROKER_CITY_SORT;
        }
        const brokerSortOrderStateSearch = sortParams.find(
          (item) =>
            item.field === sortRealtionsMapping.PARENT_BROKER_STATE_SORT_KEY
        );
        if (brokerSortOrderStateSearch) {
          brokerSortOrderStateSearch.field =
            sortRealtionsMapping.PARENT_BROKER_STATE_SORT;
        }
        const brokerSortOrderPhoneNumberSearch = sortParams.find(
          (item) =>
            item.field ===
            sortRealtionsMapping.PARENT_BROKER_PHONE_NUMBER_SORT_KEY
        );
        if (brokerSortOrderPhoneNumberSearch) {
          brokerSortOrderPhoneNumberSearch.field =
            sortRealtionsMapping.PARENT_BROKER_PHONE_NUMBER_SORT;
        }
      }
      const { data, count } = await this.brokerRepository.fetchAllBrokers(
        page,
        limit,
        searchParams,
        sortParams,
        searchBy,
        userId
      );

      removeMetadataFields(data);
      return {
        brokers: data,
        total: count,
        totalBrokers: count,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "BrokerService",
          method: "getAllBrokers",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          errorMessages.failedToFetchBrokers || error.message
        )
      );
    }
  }

  /** Get a single broker by ID */
  async getBrokerById(brokerId: number): Promise<Broker> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "BrokerService",
          method: "getBrokerById",
          payload: { brokerId },
          messageData: "method invoked",
        }),
      });
      const broker = await this.brokerRepository.fetchBrokerById(brokerId);

      if (!broker) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.brokerNotFound
          )
        );
      }

      removeMetadataFields(broker);
      return broker;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "BrokerService",
          method: "getBrokerById",
          payload: { brokerId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          errorMessages.failedToFetchBrokers
        )
      );
    }
  }

  /** Modify a broker */
  async modifyBroker(
    brokerId: number,
    updateBrokerDto: UpdateBrokerDto,
    userId: number
  ): Promise<Broker> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "BrokerService",
          method: "modifyBroker",
          payload: { brokerId },
          messageData: "method invoked",
        }),
      });
      const broker = await this.brokerRepository.getBrokerById(brokerId);

      if (!broker) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.brokerNotFound
          )
        );
      }

      await this.lookUpValidation.validateDynamicLookupValues(
        updateBrokerDto,
        LOOK_UP_DATA
      );
      // Filter out the `address` field before updating the broker
      const { address, ...brokerDetails } = updateBrokerDto;

      brokerDetails.updatedBy = userId;
      brokerDetails.updatedAt = new Date();
      if (
        brokerDetails.brokerName &&
        brokerDetails.brokerName !== broker.brokerName
      ) {
        // Check if the broker already exists
        const existingBroker = await this.brokerRepository.findBrokerByName(
          brokerDetails.brokerName,
          brokerDetails.countryId ?? broker.countryId
        );
        if (existingBroker) {
          throw new ConflictException(
            `A broker with the name "${brokerDetails.brokerName}" already exists.`
          );
        }
      }
      // Update the broker details using a transaction
      const updatedBroker = await this.brokerRepository.modifyBroker(
        queryRunner,
        brokerId,
        brokerDetails
      );

      // Handle address updates
      const addressMappings = [];
      if (address) {
        // retrieves the existing address
        const existingAddressIds =
          await this.brokerRepository.getEntityTableMapIds(
            BROKER_MAP_TABLE_DELETE_FIELDS.BROKER_ADDRESS,
            BROKER_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
            { brokerId: brokerId }
          );
        if (address.length > 0) {
          for (const addressDto of address) {
            let updatedAddress;
            if (addressDto.id) {
              const index = existingAddressIds.indexOf(addressDto.id);
              if (index !== -1) {
                existingAddressIds.splice(index, 1);
              }
              updatedAddress = await this.addressService.updateAddressById(
                addressDto.id,
                addressDto,
                userId
              );
            } else {
              updatedAddress = await this.addressService.addAddress(
                addressDto,
                userId
              );

              const brokerAddress = new BrokerAddress();
              brokerAddress.brokerId = brokerId;
              brokerAddress.addressId = updatedAddress.id;

              // Add broker address using transaction
              await this.brokerRepository.addBrokerAddress(
                queryRunner,
                brokerAddress
              );
            }
            addressMappings.push(updatedAddress);
          }
        }
        await this.brokerRepository.deleteEntityTableMapIds(
          BROKER_MAP_TABLE_DELETE_FIELDS.BROKER_ADDRESS,
          existingAddressIds,
          BROKER_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
          MAPPED_DATA_DELETION.MAP_REMOVED
        );
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      const response = {
        ...updatedBroker,
        address: addressMappings,
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
          location: "BrokerService",
          method: "modifyBroker",
          payload: { brokerId },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof HttpException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToUpdateBroker
        )
      );
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  /** Delete a broker by ID */
  async deleteBroker(brokerId: number): Promise<{ message: string }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "BrokerService",
          method: "deleteBroker",
          payload: { brokerId },
          messageData: "method invoked",
        }),
      });
      const broker = await this.brokerRepository.getBrokerById(brokerId);

      if (!broker) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.brokerNotFound
          )
        );
      }

      await this.brokerRepository.softDeleteBroker(brokerId);

      return { message: successMessage.brokerDeleted };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "BrokerService",
          method: "deleteBroker",
          payload: { brokerId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToDeleteBroker
        )
      );
    }
  }

  // Gets a list of brokers with pagination and sorting.
  async getBrokerList(
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortOrder: string,
    userId: number
  ): Promise<{ data: []; total: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "BrokerService",
          method: "getBrokerList",
          messageData: "method invoked",
        }),
      });
      const broker = await this.brokerRepository.fetchBrokerList(
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        userId
      );
      return broker;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "BrokerService",
          method: "getBrokerList",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchBrokers
        )
      );
    }
  }

  /** Get broker details by ID */
  async getBrokerDetails(id: number, userId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "BrokerService",
          method: "getBrokerDetails",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      const fields = ["id", "brokerName", "displayName", "createdAt"];
      const relations = ["brokerAddresses.address"];
      const whereCondition = { id };

      const brokerDetails = await this.brokerRepository.fetchBrokerDetails(
        fields,
        relations,
        whereCondition
      );

      if (!brokerDetails) {
        throw new NotFoundException(errorMessages.brokerNotFound);
      }

      // Transform the data to include only required fields
      const transformedData = {
        id: brokerDetails.id,
        brokerName: brokerDetails.brokerName,
        displayName: brokerDetails.displayName,
        brokerAddresses: brokerDetails.brokerAddresses?.map((address: any) => ({
          id: address.address?.id,
          address1: address.address?.address1,
          city: address.address?.cityId,
        })),
      };

      return transformedData;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "BrokerService",
          method: "getBrokerDetails",
          payload: { id },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchBrokers
        )
      );
    }
  }

  /** Fetches broker contacts by broker ID. */
  async getBrokerContacts(
    brokerId: number,
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
          location: "BrokerService",
          method: "getBrokerContacts",
          payload: { brokerId, page, limit, search, status },
          messageData: "method invoked",
        }),
      });
      const brokerContacts = await this.brokerRepository.fetchBrokerContacts(
        brokerId,
        page,
        limit,
        search,
        status
      );

      if (!brokerContacts || brokerContacts.data.length === 0) {
        return { data: [], count: 0 };
      }
      // Transform the data to return only necessary fields
      const transformedContacts = brokerContacts.data.map((contact) => ({
        id: contact?.contact?.id ?? null,
        firstName: contact?.contact?.firstName ?? null,
        lastName: contact?.contact?.lastName ?? null,
        displayName: contact?.contact?.displayName ?? null,
        status: contact?.contact?.status?.lookUpValue ?? null,
      }));

      return { data: transformedContacts, count: transformedContacts.length };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "BrokerService",
          method: "getBrokerContacts",
          payload: { brokerId },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error; // Re-throw NotFoundException to be handled by the controller
      }
      throw new BadRequestException(
        `Failed to fetch contacts for Broker ID ${brokerId}: ${error.message}`
      );
    }
  }
}
