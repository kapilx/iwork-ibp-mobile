import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryRunner, ILike, Not, IsNull } from "typeorm";
import { Broker } from "../../../../service-lib/src/lib/entities/broker.entity";
import { CreateBrokerDto } from "./dto/create-broker.dto";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { BrokerAddress } from "../../../../service-lib/src/lib/entities/broker-address.entity";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { UpdateBrokerDto } from "./dto/update-broker.dto";
import { BrokerAddressDto } from "./dto/broker-address.dto";
import { BrokerContactDto } from "./dto/broker-contact.dto";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { BrokerContact } from "../../../../service-lib/src/lib/entities/broker-contact.entity";
import {
  DEFAULT_BROKER_ENTITY_NAME,
  DEFAULT_BROKER_STATUS_ACTIVE,
  DEFAULT_CONTACT_STATUS_ACTIVE_KEY,
  DEFAULT_CONTACT_STATUS_INACTIVE_KEY,
  NATURE_OF_BROKING_BUSSINESS_RE_INSURENSE,
  NATURE_OF_BROKING_BUSSINESS
} from "../../../../../../libs/service-lib/src/lib/constants";
import { BrokerSearchObject } from "../../../../service-lib/src/lib/constants";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class BrokerRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Broker)
    private readonly brokerRepository: Repository<Broker>,
    @InjectRepository(BrokerAddress)
    private readonly brokerAddressRepository: Repository<BrokerAddress>,
    @InjectRepository(BrokerContact)
    private readonly brokerContactRepository: Repository<BrokerContact>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    private readonly entityService: EntityService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Add a new broker using a transaction */
  async addBroker(
    queryRunner: QueryRunner,
    createBrokerDto: CreateBrokerDto
  ): Promise<Broker> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "BrokerRepository",
          method: "addBroker",
          messageData: "method invoked",
        }),
      });
      const broker = queryRunner.manager.create(Broker, createBrokerDto);
      return await queryRunner.manager.save(broker);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "BrokerRepository",
          method: "addBroker",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          errorMessages.failedToAddBroker || error.message
        )
      );
    }
  }

  /** Find a broker by name */
  async findBrokerByName(
    brokerName: string,
    countryId: number
  ): Promise<Broker | null> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "BrokerRepository",
          method: "findBrokerByName",
          payload: { brokerName },
          messageData: "method invoked",
        }),
      });
      return await this.brokerRepository.findOne({
        where: { brokerName: ILike(`%${brokerName}%`), countryId: countryId },
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "BrokerRepository",
          method: "findBrokerByName",
          payload: { brokerName },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchBrokers || error.message
        )
      );
    }
  }

  /** Add a new broker address using a transaction */
  async addBrokerAddress(
    queryRunner: QueryRunner,
    brokerAddress: BrokerAddress
  ): Promise<void> {
    await queryRunner.manager.save(brokerAddress);
  }

  /** Fetch all brokers with pagination, search, and sorting */
  async fetchAllBrokers(
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort?: { field: string; order: "ASC" | "DESC" }[],
    searchBy?: string,
    userId?: number
  ): Promise<{ data: []; count: number }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "BrokerRepository",
        method: "fetchAllBrokers",
        messageData: "method invoked",
      }),
    });
    const relations = [
      "brokerAddresses", // ← parent
      "brokerAddresses.address", // ← child
      "brokerAddresses.address.cityId",
      "brokerAddresses.address.stateId",
      "brokerContacts", // ← parent
      "brokerContacts.contact", // ← child
      "brokerContacts.contact.contactAddresses", // ← nested parent
      "brokerContacts.contact.contactAddresses.address", // ← nested child
      "status",
      "companyType",
    ];
    const status = await this.lookUpRepository.findOne({
      where: { lookUpKey: DEFAULT_BROKER_STATUS_ACTIVE },
    });
    const reInsuranceBrokingBusiness = await this.lookUpRepository.findOne({
      where: {
        lookUpName: NATURE_OF_BROKING_BUSSINESS,
        lookUpKey: NATURE_OF_BROKING_BUSSINESS_RE_INSURENSE,
      },
    });
    
    const whereCondition = reInsuranceBrokingBusiness?.id
      ? [
          {
            statusLid: status?.id ?? undefined,
            natureOfBrokingBussinessLid: Not(reInsuranceBrokingBusiness.id),
          },
          {
            statusLid: status?.id ?? undefined,
            natureOfBrokingBussinessLid: IsNull(),
          },
        ]
      : {
          statusLid: status?.id ?? undefined,
        };
    try {
      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: "broker",
          page: page,
          limit: limit,
          sort:
            sort && sort.length > 0 ? sort : [{ field: "id", order: "ASC" }],
          relations: relations,
          where: whereCondition,
          select: undefined,
          searchArray:
            searchArray && searchArray?.length === 0 ? [] : searchArray,
          userFilter: undefined,
          searchString: searchBy,
          searchOn: BrokerSearchObject,
        },
        userId as number,
        "broker"
      );
      // const { data, count } = await this.entityService.fetchEntityList(
      //   "broker",
      //   page,
      //   limit,
      //   sort.length > 0 ? sort : [{ field: "id", order: "ASC" }],
      //   relations,
      //   whereCondition,
      //   undefined,
      //   searchArray.length === 0 ? [] : searchArray,
      //   undefined,
      //   searchBy,
      //   BrokerSearchObject
      // );

      const transformedData = (data as Broker[]).map((broker: Broker) => ({
        id: broker.id,
        brokerName: broker.brokerName,
        displayName: broker.displayName,
        status: broker.status
          ? {
              id: broker.status.id,
              lookUpValue: broker.status.lookUpValue,
            }
          : null,
        companyType: broker.companyType
          ? {
              id: broker.companyType.id,
              lookUpValue: broker.companyType.lookUpValue,
            }
          : null,
        brokerAddresses: broker.brokerAddresses?.map(
          (address: BrokerAddress) => ({
            id: address.id,
            address1: address.address?.address1,
            city: address.address?.cityId,
            state: address.address?.stateId,
            phoneNumber: address.address?.phoneNumber,
          })
        ),
      }));
      return { data: transformedData, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "BrokerRepository",
          method: "fetchAllBrokers",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /** Fetch a broker by ID */
  async fetchBrokerById(brokerId: number): Promise<Broker> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "BrokerRepository",
        method: "fetchBrokerById",
        payload: { brokerId },
        messageData: "method invoked",
      }),
    });
    const broker = await this.brokerRepository.findOne({
      where: { id: brokerId },
      relations: [
        "brokerAddresses",
        "brokerAddresses.address.addressType",
        "status",
        "companyType",
        "country",
      ],
    });

    if (!broker) {
      throw new NotFoundException(`broker with ID ${brokerId} not found`);
    }
    return await this.transformBroker(broker);
  }

  /** Fetches an broker by its ID. */
  async getBrokerById(brokerId: number): Promise<Broker> {
    try {
      const broker = await this.brokerRepository.findOne({
        where: { id: brokerId },
        relations: ["brokerAddresses.address.addressType", "status"],
      });
      if (!broker) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.brokerNotFound
          )
        );
      }
      return broker;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.brokerNotFound
        )
      );
    }
  }
  /** Add a Broker Address mapping data in BrokerAddress table */
  async addBrokerAddressMap(brokerAddress: BrokerAddressDto): Promise<void> {
    try {
      const brokerAddressData =
        this.brokerAddressRepository.create(brokerAddress);
      await this.brokerAddressRepository.save(brokerAddressData);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          errorMessages.failedToSaveBrokerAddressMapping || error.message
        )
      );
    }
  }

  /** Finds the broker company and address data mapping in BrokerAddress Table */
  async findBrokerCompanyAddressMap(
    companyId: number,
    addressId: number
  ): Promise<BrokerAddress | null> {
    return this.brokerAddressRepository.findOne({
      where: {
        broker: { id: companyId },
        address: { id: addressId },
      },
    });
  }
  /** Saves an broker-company contact mapping to the database. */
  async addBrokerContact(brokerContact: BrokerContactDto): Promise<void> {
    try {
      await this.brokerContactRepository.save(brokerContact);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToSaveBrokerContactMapping || error.message
        )
      );
    }
  }
  /** Remove an broker contact details mapping*/
  async delinkBrokerContactMap(docObject: BrokerContactDto): Promise<void> {
    try {
      await this.brokerContactRepository.delete(docObject);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.brokerContactMappingDeletionFailed || error.message
        )
      );
    }
  }
  /** Transforms the broker data to match the required response structure */
  private transformBroker(broker: Broker): Broker {
    const mapAddress = (brokerAddress: BrokerAddress) => ({
      id: brokerAddress.address?.id,
      addressTypeLid: brokerAddress.address?.addressTypeLid,
      addressType: mapLookup(brokerAddress.address?.addressType),
      address1: brokerAddress.address?.address1,
      countryId: brokerAddress.address?.countryId
        ? {
            name: brokerAddress.address.countryId.name,
            isoCode: brokerAddress.address.countryId.isoCode,
            id: brokerAddress.address.countryId.id,
          }
        : null,
      stateId: brokerAddress.address?.stateId
        ? {
            name: brokerAddress.address.stateId.name,
            stateCode: brokerAddress.address.stateId.stateCode,
            id: brokerAddress.address.stateId.id,
          }
        : null,
      cityId: brokerAddress.address?.cityId
        ? {
            name: brokerAddress.address.cityId.name,
            id: brokerAddress.address.cityId.id,
          }
        : null,
      address2: brokerAddress.address?.address2,
      area: brokerAddress.address?.area,
      pinCode: brokerAddress.address?.pinCode,
      phoneNumber: brokerAddress.address?.phoneNumber,
      alternatePhoneNumber: brokerAddress.address?.alternatePhoneNumber,
      email: brokerAddress.address?.email,
      supportNumber: brokerAddress.address?.supportNumber,
    });

    const mapLookup = (lookup: LookUp) => ({
      id: lookup?.id,
      lookUpValue: lookup?.lookUpValue,
    });

    return {
      id: broker.id,
      brokerName: broker.brokerName,
      displayName: broker.displayName,
      website: broker.website,
      remarks: broker.remarks,
      companyTypeLid: broker.companyTypeLid,
      countryId: broker.countryId,
      country: broker.country,
      companyType: mapLookup(broker.companyType),
      status: mapLookup(broker.status),
      brokerAddresses: broker.brokerAddresses?.map(mapAddress),
    };
  }

  /** Updates an existing broker in the database. */
  async modifyBroker(
    queryRunner: QueryRunner,
    brokerId: number,
    updateBrokerDto: UpdateBrokerDto
  ): Promise<Broker> {
    try {
      const broker = await queryRunner.manager.findOne(Broker, {
        where: { id: brokerId },
      });

      if (!broker) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.brokerNotFound
          )
        );
      }

      // Update the broker details
      Object.entries(updateBrokerDto).forEach(([key, value]) => {
        if (value !== undefined) {
          (broker as any)[key] = value;
        }
      });
      const updatedBroker = await queryRunner.manager.save(Broker, broker);
      return updatedBroker;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToModifyBroker
        )
      );
    }
  }

  /** Removes an broker from the database by its ID. */
  async softDeleteBroker(brokerId: number): Promise<void> {
    try {
      await this.brokerRepository.update(brokerId, {
        deletedAt: new Date(),
      });
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToDeleteBroker || error.message
        )
      );
    }
  }

  /** Fetches a paginated list of brokers based on various filters. */
  async fetchBrokerList(
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortOrder: string,
    userId: number
  ): Promise<{ data: []; total: number }> {
    try {
      const status = await this.lookUpRepository.findOne({
        where: { lookUpKey: DEFAULT_BROKER_STATUS_ACTIVE },
      });
      // const [data, count] = await this.brokerRepository.findAndCount({
      //   where: {
      //     brokerName: search ? ILike(`%${search}%`) : undefined,
      //     statusLid: status?.id ?? undefined,
      //   },
      //   order: { [sortBy]: sortOrder },
      //   skip: (page - 1) * limit,
      //   take: limit,
      //   select: ["id", "brokerName", "displayName"],
      // });
      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: "broker",
          page,
          limit,
          sort: [
            {
              field: sortBy,
              order: sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC",
            },
          ],
          relations: undefined,
          where: {
            statusLid: status?.id ?? undefined,
          },
          select: ["id", "brokerName", "displayName"],
          searchArray: [],
          userFilter: undefined,
          searchString: search,
          searchOn: ["brokerName", "displayName"],
        },
        userId as number,
        "broker"
      );
      return { data, total: count };
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchBrokers || error.message
        )
      );
    }
  }

  /** Fetches broker details based on various conditions. */
  async fetchBrokerDetails(
    fields: string[],
    relations: string[],
    whereCondition: any
  ) {
    try {
      const entityName = DEFAULT_BROKER_ENTITY_NAME;
      const data = await this.entityService.getListOfValues(
        entityName,
        fields,
        whereCondition,
        relations
      );

      if (!data || data.length === 0) {
        throw new NotFoundException(errorMessages.brokerNotFound);
      }

      return data;
    } catch (error) {
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

  async getEntityTableMapIds(
    entity: string,
    select: string,
    whereCondition: any
  ): Promise<number[]> {
    try {
      const data = await this.entityService.getEntityMapByIds(
        entity,
        select,
        whereCondition
      );
      return data;
    } catch (error) {
      return [];
    }
  }

  async deleteEntityTableMapIds(
    entity: string,
    deleteIds: number[],
    select: string,
    deletionType: string
  ): Promise<void> {
    try {
      await this.entityService.deleteEntityMapByIds(
        entity,
        deleteIds,
        select,
        deletionType
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /** Fetches broker contacts by broker ID. */
  async fetchBrokerContacts(
    brokerId: number,
    page: number,
    limit: number,
    search: string,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      let statusKey, statusLid;
      const whereCondition: Record<string, any> = {
        brokerId,
      };
      if (status) {
        statusKey =
          status === "ACTIVE"
            ? DEFAULT_CONTACT_STATUS_ACTIVE_KEY
            : DEFAULT_CONTACT_STATUS_INACTIVE_KEY;
        statusLid = (
          await this.lookUpRepository.findOne({
            where: { lookUpKey: statusKey },
          })
        )?.id;
        whereCondition["contact.statusLid"] = statusLid;
      }
      const { data, count } = await this.entityService.fetchEntityList(
        "BrokerContact", // Entity name
        page,
        limit,
        [{ field: "id", order: "ASC" }], // Sort options
        ["contact", "contact.status"], // Relations
        whereCondition, // Filter by Broker ID
        [
          "id",
          "contact.id",
          "contact.firstName",
          "contact.lastName",
          "contact.displayName",
          "contact.statusLid",
          "contact.status.lookUpValue",
        ], // Select fields
        undefined, // Search array
        undefined, // User filter
        search, // Search string
        ["contact.firstName", "contact.lastName"] // Search on
      );
      return { data, count };
    } catch (error) {
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
