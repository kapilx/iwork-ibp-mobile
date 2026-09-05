import {
  Injectable,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";
import { Tpa } from "../../../../service-lib/src/lib/entities/tpa.entity";
import { TpaAddress } from "../../../../service-lib/src/lib/entities/tpa-address.entity";
import { TpaContact } from "../../../../service-lib/src/lib/entities/tpa-contact.entity";
import { Address } from "../../../../service-lib/src/lib/entities/address.entity";
import { CreateTpaDto } from "./dto/create-tpa.dto";
import { UpdateTpaDto } from "./dto/update-tpa.dto";
import { TpaDto } from "./dto/get-tpa.dto";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  TPA_DEFAULT_PAGE,
  TPA_DEFAULT_PAGE_LIMIT,
  DEFAULT_TPA_SORT_FIELD,
  TPA_STATUS_ACTIVE,
  DEFAULT_TPA_ENTITY_NAME,
  MAPPED_DATA_DELETION,
  DEFAULT_CONTACT_STATUS_ACTIVE_KEY,
  DEFAULT_CONTACT_STATUS_INACTIVE_KEY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { infoMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { TpaContactDto } from "./dto/tpa-contact.dto";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { TpaAddressDto } from "./dto/tpa-contact.dto";
import {
  TPA_MAP_TABLE_DELETE_FIELDS,
  TpaSearchObject,
} from "../../../../service-lib/src/lib/constants";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class TpaRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Tpa)
    private readonly tpaRepository: Repository<Tpa>,
    @InjectRepository(TpaAddress)
    private readonly tpaAddressRepository: Repository<TpaAddress>,
    @InjectRepository(TpaContact)
    private readonly tpaContactRepository: Repository<TpaContact>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    private readonly entityService: EntityService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Creates a new TPA record along with its addresses.
   */
  async addTpa(createTpaObject: CreateTpaDto, userId: number): Promise<TpaDto> {
    const queryRunner =
      this.tpaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const existingTPAByName = await this.findTpaByName(
        createTpaObject.tpaName,
        createTpaObject.countryId
      );
      if (existingTPAByName) {
        throw new ConflictException(
          `TPA with name ${createTpaObject.tpaName} already exists`
        );
      }
      const lookup = await this.lookUpRepository.findOne({
        where: { lookUpKey: TPA_STATUS_ACTIVE },
      });
      if (!lookup) {
        throw new NotFoundException(
          `Lookup with key ${TPA_STATUS_ACTIVE} not found`
        );
      }
      const lookupId = lookup?.id;
      const tpaDetails = { ...createTpaObject };
      const tpa = this.tpaRepository.create({
        ...tpaDetails,
        statusLid: lookupId,
        createdBy: userId,
        updatedBy: userId,
      });
      const savedTpa = await this.tpaRepository.save(tpa);
      // Save addresses and map them
      const savedAddresses = [];
      if (createTpaObject.address && createTpaObject.address.length > 0) {
        for (const address of createTpaObject.address) {
          address.createdBy = userId;
          address.updatedBy = userId;
          const savedAddress = await queryRunner.manager.save(Address, {
            ...address,
            countryId: { id: address.countryId },
            stateId: { id: address.stateId },
            cityId: { id: address.cityId },
          });
          savedAddresses.push(savedAddress);
          const tpaAddress = this.tpaAddressRepository.create({
            id: savedTpa.id,
            addressId: savedAddress.id,
          });
          await queryRunner.manager.save(tpaAddress);
        }
      }

      await queryRunner.commitTransaction();

      const tpadata = await this.getTpaById(savedTpa.id);

      // Return the detailed response
      return tpadata;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException("An unknown error occurred");
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieves all TPA records with their addresses
   */
  async getTpas(
    userId: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: keyof TpaDto = DEFAULT_TPA_SORT_FIELD,
    page: number = TPA_DEFAULT_PAGE,
    limit: number = TPA_DEFAULT_PAGE_LIMIT,
    searchBy: string
  ): Promise<[TpaDto[], number, number]> {
    const relations = [
      "tpaAddresses", // ← parent
      "tpaAddresses.address", // ← child
      "tpaAddresses.address.cityId",
      "tpaAddresses.address.stateId",
      "status",
      "companyType",
    ];
    const status = await this.lookUpRepository.findOne({
      where: { lookUpKey: TPA_STATUS_ACTIVE },
    });
    const whereCondition = {
      statusLid: status?.id ?? undefined,
    };
    // const tpaList = await this.entityService.fetchEntityList(
    //   "Tpa",
    //   page,
    //   limit,
    //   sort.length > 0 ? sort : [{ field: "id", order: "ASC" }],
    //   relations,
    //   whereCondition,
    //   undefined,
    //   searchArray.length === 0 ? [] : searchArray,
    //   undefined,
    //   searchBy,
    //   TpaSearchObject
    // );
    const tpaList = await this.scopeService.validateMasterScope(
      {
        entity: "Tpa",
        page: page,
        limit: limit,
        sort:
          Array.isArray(sort) && sort.length > 0
            ? sort
            : [{ field: "id", order: "ASC" }],
        relations: relations,
        where: whereCondition,
        select: undefined,
        searchArray:
          searchArray && searchArray?.length === 0 ? [] : searchArray,
        userFilter: undefined,
        searchString: searchBy,
        searchOn: TpaSearchObject,
      },
      userId as number,
      "Tpa"
    );
    const tpaStatusCount = await this.getTpaCountsByStatus();
    const { data: tpas, count: totalCount } = tpaList;
    const transformedData = tpas.map((tpa: any) => ({
      id: tpa.id,
      tpaName: tpa.tpaName,
      displayName: tpa.displayName,
      status: tpa.status
        ? {
            id: tpa.status.id,
            lookUpValue: tpa.status.lookUpValue,
          }
        : null,
      tpaAddresses: tpa.tpaAddresses?.map((address: TpaAddress) => ({
        id: address.id,
        address1: address.address?.address1,
        phoneNumber: address.address?.phoneNumber,
        cityId: address.address?.cityId,
        stateId: address.address?.stateId,
        countryId: address.address?.countryId,
      })),
    }));
    return [transformedData, totalCount, tpaStatusCount.ACTIVE];
  }

  /**
   * Retrieves a TPA record by its ID along with its addresses.
   */
  async getTpaById(id: number): Promise<Tpa> {
    const tpa = await this.tpaRepository.findOne({
      where: { id: id },
      relations: [
        "country",
        "tpaAddresses.address.addressType",
        "status",
        "companyType",
      ],
    });

    if (!tpa) {
      throw new NotFoundException(infoMessages.tpaNotFound);
    }
    const tpaData = { ...tpa };
    tpaData.country = tpa.country;
    tpaData.status = tpa.status
      ? {
          id: tpa.status.id,
          lookUpValue: tpa.status.lookUpValue,
        }
      : null;

    tpaData.companyType = tpa.companyType
      ? {
          id: tpa.companyType.id,
          lookUpValue: tpa.companyType.lookUpValue,
        }
      : null;

    const filteredAddresses = tpa.tpaAddresses?.map((address) => {
      const transformedAddress = this.transformAddress(address.address);
      return {
        ...transformedAddress,
      };
    });

    tpaData.tpaAddresses = filteredAddresses ?? [];
    if (tpaData.id === undefined) {
      throw new InternalServerErrorException("TPA ID is undefined");
    }

    return {
      ...tpaData,
    };
  }

  /**
   * Updates a TPA record by its ID along with its addresses.
   */
  async updateTpaById(
    id: number,
    updateTpaObject: UpdateTpaDto,
    userId: number
  ): Promise<TpaDto | null> {
    const queryRunner =
      this.tpaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const tpa = await this.tpaRepository.findOne({
        where: { id },
        relations: ["tpaAddresses", "tpaAddresses.address"],
      });

      if (!tpa) {
        throw new NotFoundException(infoMessages.tpaNotFound);
      }
      // Update TPA details
      const { address, ...tpaDetails } = updateTpaObject;
      if (tpaDetails.tpaName && tpaDetails.tpaName !== tpa.tpaName) {
        const existingTPAByName = await this.findTpaByName(
          tpaDetails.tpaName,
          tpaDetails.countryId ?? tpa.countryId
        );
        if (existingTPAByName) {
          throw new ConflictException(
            `TPA with name ${tpaDetails.tpaName} already exists`
          );
        }
      }
      
      // Update TPA details
      Object.entries(tpaDetails).forEach(([key, value]) => {
        if (value !== undefined) {
          (tpa as any)[key] = value;
        }
      });
      tpa.updatedBy = userId;
      await this.tpaRepository.save(tpa);
      
      // Update or add addresses
      const updateAddressList = [];
      if (updateTpaObject.address) {
        const existingAddressIds = await this.getEntityTableMapIds(
          TPA_MAP_TABLE_DELETE_FIELDS.TPA_ADDRESS,
          TPA_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
          { id: id }
        );
        if (updateTpaObject.address.length > 0) {
          for (const address of updateTpaObject.address) {
            if (address.id) {
              // Update existing address
              const index = existingAddressIds.indexOf(address.id);
              if (index !== -1) {
                existingAddressIds.splice(index, 1);
              }
              const existingAddress = await queryRunner.manager.findOne(Address, {
                where: { id: address.id },
              });
              if (existingAddress) {
                Object.entries(address).forEach(([key, value]) => {
                  if (value !== undefined && key !== 'id') {
                    (existingAddress as any)[key] = value;
                  }
                });
                existingAddress.countryId = { id: address.countryId } as any;
                existingAddress.stateId = { id: address.stateId } as any;
                existingAddress.cityId = { id: address.cityId } as any;
                existingAddress.updatedBy = userId;
                await queryRunner.manager.save(existingAddress);
              }
              updateAddressList.push(address);
            } else {
              // Add new address
              const newAddress = await queryRunner.manager.save(Address, {
                ...address,
                countryId: { id: address.countryId },
                stateId: { id: address.stateId },
                cityId: { id: address.cityId },
                createdBy: userId,
                updatedBy: userId,
              });
              updateAddressList.push(newAddress);

              // Map new address to TPA
              const tpaAddress = this.tpaAddressRepository.create({
                id,
                addressId: newAddress.id,
              });
              await queryRunner.manager.save(tpaAddress);
            }
          }
        }
        await this.deleteEntityTableMapIds(
          TPA_MAP_TABLE_DELETE_FIELDS.TPA_ADDRESS,
          existingAddressIds,
          TPA_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
          MAPPED_DATA_DELETION.MAP_REMOVED
        );
      }

      await queryRunner.commitTransaction();
      return {
        id: id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException("An unknown error occurred");
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deletes a TPA record by its ID along with its addresses.
   */
  async deleteTpaById(id: number): Promise<boolean> {
    const queryRunner =
      this.tpaRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const tpa = await this.tpaRepository.findOne({
        where: { id },
        relations: ["addresses"],
      });
      if (!tpa) {
        throw new NotFoundException(infoMessages.tpaNotFound);
      }

      for (const tpaAddress of tpa.addresses) {
        await queryRunner.manager.softDelete(Address, tpaAddress.addressId);
      }
      await queryRunner.manager.softDelete(this.tpaAddressRepository.target, {
        id: tpa.id,
      });

      const result = await queryRunner.manager.softDelete(
        this.tpaRepository.target,
        id
      );

      await queryRunner.commitTransaction();
      return (result.affected ?? 0) > 0;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException("An unknown error occurred");
    } finally {
      await queryRunner.release();
    }
  }
  /** Add an tpa contact details mapping*/
  async addTpaContact(tpaContactMapData: TpaContactDto): Promise<void> {
    try {
      const tpaContact = this.tpaContactRepository.create(tpaContactMapData);

      await this.tpaContactRepository.save(tpaContact);
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException("An unknown error occurred");
    }
  }

  /** Remove an tpa contact details mapping*/
  async delinkTpaContactMapping(docObject: TpaContactDto): Promise<void> {
    try {
      await this.tpaContactRepository.delete(docObject);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.tpaContactMappingDeletionFailed || error.message
        )
      );
    }
  }

  /**
   * Deletes a TPA address by its ID.
   */
  async deleteTpaAddressById(tpaAddressId: number) {
    const tpaAddress = await this.tpaAddressRepository.findOne({
      where: { tpaAddressId },
    });

    if (!tpaAddress) {
      throw new NotFoundException(
        `TPA Address with ID ${tpaAddressId} not found`
      );
    }

    const result = await this.tpaAddressRepository.softDelete(tpaAddressId);
    return (result.affected ?? 0) > 0;
  }

  // Reusable function to transform an address
  transformAddress(address: Address): Address {
    return {
      id: address.id,
      address1: address.address1,
      address2: address.address2,
      area: address.area,
      pinCode: address.pinCode,
      email: address.email,
      phoneNumber: address.phoneNumber,
      alternatePhoneNumber: address.alternatePhoneNumber,
      supportNumber: address.supportNumber,
      countryId: address.countryId
        ? {
            id: address.countryId.id || address.countryId,
            name: address.countryId.name || null,
            isoCode: address.countryId.isoCode || null,
          }
        : null,
      stateId: address.stateId
        ? {
            id: address.stateId.id || address.stateId,
            name: address.stateId.name || null,
          }
        : null,
      cityId: address.cityId
        ? {
            id: address.cityId.id,
            name: address.cityId.name,
          }
        : null,
      addressTypeLid: address.addressTypeLid,
      addressType: address.addressType
        ? {
            id: address.addressType.id,
            lookUpValue: address.addressType.lookUpValue,
          }
        : null,
    };
  }

  /**
   * Retrieves the count of TPA records by their status.
   */
  async getTpaCountsByStatus(): Promise<Record<string, number>> {
    const queryBuilder = this.tpaRepository
      .createQueryBuilder("tpa")
      .leftJoinAndSelect("tpa.status", "status")
      .select("status.lookUpValueKey", "statusKey")
      .addSelect("COUNT(tpa.id)", "count")
      .groupBy("status.lookUpValueKey");

    const result = await queryBuilder.getRawMany();
    const counts: Record<string, number> = {};
    result.forEach((row) => {
      counts[row.statusKey] = parseInt(row.count, 10);
    });

    return counts;
  }

  async findTpaByName(tpaName: string, countryId: number) {
    return await this.tpaRepository.findOne({
      where: {
        tpaName: ILike(tpaName),
        countryId: countryId,
      },
    });
  }

  /** Create an Tpa Address Data Map */
  async addTpaAddress(tpaAddress: TpaAddressDto): Promise<void> {
    try {
      await this.tpaAddressRepository.save(tpaAddress);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToSaveTpaAddressMapping || error.message
        )
      );
    }
  }

  /** Finds an Tpa Address Data Map Data */
  async findTpaCompanyAddressMap(
    id: number,
    addressId: number
  ): Promise<TpaAddress | null> {
    return this.tpaAddressRepository.findOne({
      where: {
        tpa: { id: id },
        address: { id: addressId },
      },
    });
  }

  /** Returns active tpa company list data*/
  async CompanyList(
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sort: "ASC" | "DESC",
    userId: number,
    entityIds?: number[]
  ): Promise<{ data: Tpa[]; count: number }> {
    try {
      const status = await this.lookUpRepository.findOne({
        where: { lookUpKey: TPA_STATUS_ACTIVE },
      });
      const whereCondition: Record<string, any> = {
        statusLid: status?.id ?? undefined,
      };
      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: "Tpa",
          page: page,
          limit: limit,
          sort: [{ field: sortBy, order: sort }],
          relations: undefined,
          where: whereCondition,
          select: ["id", "tpaName", "displayName"],
          searchArray: undefined,
          userFilter: undefined,
          searchString: search,
          searchOn: ["tpaName", "displayName"],
        },
        userId as number,
        "Tpa"
      );

      let finalData = data;

      // ✅ Append missing TPAs (same logic as company)
      if (entityIds && entityIds.length > 0) {
        const existingTpaIds = new Set(data.map((r) => r.id));
        const missingTpaIds = entityIds.filter((id) => !existingTpaIds.has(id));

        if (missingTpaIds.length > 0) {
          const additional = await this.tpaRepository.find({
            where: { id: In(missingTpaIds) },
            select: ["id", "tpaName", "displayName"],
          });
          // Only take required fields from additional TPAs
          const sanitizedAdditional = additional.map((item) => ({
            id: item.id,
            tpaName: item.tpaName,
            displayName: item.displayName,
          }));
          finalData = finalData.concat(sanitizedAdditional);
        }
      }
      return {
        data: finalData,
        count: count,
      };
    } catch (error) {
      throw new Error("Failed to fetch tpa company name list");
    }
  }

  /** Returns basic tpa company data such as address and contacts */
  async getCompanyListData(
    fields: string,
    relations: any,
    whereCondition: string
  ) {
    try {
      const entityName = DEFAULT_TPA_ENTITY_NAME;
      const data = await this.entityService.getListOfValues(
        entityName,
        fields,
        whereCondition,
        relations
      );
      return this.transformResponse(data);
    } catch (error) {
      return error;
    }
  }

  /** Transform object for tpa details */
  async transformResponse(data: Tpa): Promise<TpaDto> {
    return {
      id: data?.id,
      tpaName: data?.tpaName,
      displayName: data?.displayName,
      tpaAddresses: (data?.tpaAddresses || []).map(
        (addressData: { address: Address }) => ({
          id: addressData?.address?.id,
          address1: addressData?.address?.address1,
          city: {
            id: addressData?.address?.cityId?.id,
            name: addressData?.address?.cityId?.name,
          },
        })
      ),
    };
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

  /** Fetches TPA contacts by TPA ID. */
  async fetchTpaContacts(
    tpaId: number,
    page: number,
    limit: number,
    search: string,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      let statusKey, statusLid;
      const whereCondition: Record<string, any> = {
        id: tpaId,
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
        whereCondition["linkedContact.statusLid"] = statusLid;
      }
      const { data, count } = await this.entityService.fetchEntityList(
        "TpaContact", // Entity name
        page,
        limit,
        [{ field: "tpaContactId", order: "ASC" }], // Sort options
        ["linkedContact", "linkedContact.status"], // Relations
        whereCondition, // Filter by TPA ID
        [
          "tpaContactId",
          "linkedContact.id",
          "linkedContact.firstName",
          "linkedContact.lastName",
          "linkedContact.displayName",
          "linkedContact.statusLid",
          "linkedContact.status.lookUpValue",
        ], // Select fields
        undefined, // Search array
        undefined, // User filter
        search, // Search string
        ["linkedContact.firstName", "linkedContact.lastName"] // Search on
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
        `Failed to fetch contacts for TPA ID ${tpaId}: ${error.message}`
      );
    }
  }
}
