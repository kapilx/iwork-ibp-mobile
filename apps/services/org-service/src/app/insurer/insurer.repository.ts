import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, In, QueryRunner, Repository } from "typeorm";
import {
  DEFAULT_CONTACT_STATUS_ACTIVE_KEY,
  DEFAULT_CONTACT_STATUS_INACTIVE_KEY,
  DEFAULT_INSURER_ENTITY_NAME,
  DEFAULT_INSURER_STATUS_ACTIVE_KEY,
  DEFAULT_INSURER_ADDRESS_ENTITY_NAME,
} from "../../.../../../../../../libs/service-lib/src/lib/constants";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { InsurerAddress } from "../../../../service-lib/src/lib/entities/insurer-address.entity";
import { InsureContact } from "../../../../service-lib/src/lib/entities/insurer-contact.entity";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import { StateGstDetail } from "../../../../service-lib/src/lib/entities/company-gst-detail.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { createErrorResponse } from "../../../../service-lib/src/lib/response.util";
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { InsurerAddressDto } from "./dto/insurer-company-address.dto";
import { InsurerContactDto } from "./dto/insurer-contact.dto";
import { UpdateInsurerDto } from "./dto/update-insurer.dto";
import { InsurerSearchObject } from "../../../../service-lib/src/lib/constants";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { Endorsement } from "../../../../service-lib/src/lib/entities/endorsement.entity";
import { PolicyAssetEndorsement } from "../../../../service-lib/src/lib/entities/policy-asset-endorsement.entity";
import {
  RENEWAL_OPPORTUNITY,
  SALES_OPPORTUNITY,
  POLICY_STATUS_MIG_ACTIVE,
  TOGGLE_TYPE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { CompanyInsurerDto } from "./dto/company-insurer.dto";
import { brokerageAmountExpr } from "../../../../../../libs/service-lib/src/lib/constants";

@Injectable()
export class InsurerRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  createQueryRunner() {
    throw new Error("Method not implemented.");
  }
  constructor(
    @InjectRepository(Insurer)
    private readonly insurerRepository: Repository<Insurer>,
    @InjectRepository(InsureContact)
    private readonly insurerContactRepository: Repository<InsureContact>,
    @InjectRepository(InsurerAddress)
    private readonly insurerAddressRepository: Repository<InsurerAddress>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(StateGstDetail)
    private readonly stateGstDetailRepository: Repository<StateGstDetail>,
    private readonly entityService: EntityService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Adds a new insurer using a transaction manager. */
  async addInsurer(
    queryRunner: QueryRunner,
    createInsurerDto: CreateInsurerDto
  ): Promise<Insurer> {
    try {
      const insurer = queryRunner.manager.create(Insurer, createInsurerDto);
      return await queryRunner.manager.save(insurer);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToAddInsurer || error.message
        )
      );
    }
  }

  /** Fetches an insurer by its ID. */
  async fetchInsurerById(insurerId: number): Promise<Insurer> {
    try {
      const insurer = await this.insurerRepository.findOne({
        where: { id: insurerId },
        relations: ["insurerAddresses.address", "status"],
      });
      if (!insurer) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.insurerNotFound
          )
        );
      }
      return insurer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.insurerNotFound
        )
      );
    }
  }

  /** Retrieves all insurers with their associated addresses. */
  async fetchAllInsurersWithAddress(
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    searchBy?: string,
    userId?: number
  ): Promise<{ data: Insurer[]; count: number }> {
    const relations = [
      "insurerAddresses",
      "insurerAddresses.address",
      "insurerAddresses.address.cityId",
      "insurerAddresses.address.stateId",
      "insurerAddresses.address.branchType",
      "status",
      "companyTag",
      "companyType",
    ];
    const status = await this.lookUpRepository.findOne({
      where: { lookUpKey: DEFAULT_INSURER_STATUS_ACTIVE_KEY },
    });
    const whereCondition = {
      statusLid: status?.id ?? undefined,
    };
    // const { data, count } = await this.entityService.fetchEntityList(
    //   "insurer",
    //   page,
    //   limit,
    //   sort.length > 0 ? sort : [{ field: "id", order: "ASC" }],
    //   relations,
    //   whereCondition,
    //   undefined,
    //   searchArray.length === 0 ? [] : searchArray,
    //   undefined,
    //   searchBy,
    //   InsurerSearchObject
    // );
    const ADDRESS_FIELD_MAP: Record<string, string> = {
      "companyAddresses.address.cityId.id": "insurerAddresses.address.cityId.id",
      branchTypeLid: "insurerAddresses.address.branchType.lookUpValue",
      branchCode: "insurerAddresses.address.branchCode",
      branchName: "insurerAddresses.address.branchName",
      insurerNameFilter: "insurerName",
    };

    const TEXT_PARTIAL_FIELDS = new Set([
      "insurerAddresses.address.branchCode",
      "insurerAddresses.address.branchName",
      "insurerName",
    ]);

    const remappedSearchArray = (searchArray ?? []).map((item) => {
      const remappedKey = ADDRESS_FIELD_MAP[item.searchBy] ?? item.searchBy;
      const value =
        TEXT_PARTIAL_FIELDS.has(remappedKey) &&
        Array.isArray(item.searchValue) &&
        item.searchValue.length === 1
          ? item.searchValue[0]
          : item.searchValue;
      return { searchBy: remappedKey, searchValue: value };
    });

    const { data, count } = await this.scopeService.validateMasterScope(
      {
        entity: "insurer",
        page: page,
        limit: limit,
        sort: sort && sort.length > 0 ? sort : [{ field: "id", order: "ASC" }],
        relations: relations,
        where: whereCondition,
        select: undefined,
        searchArray: remappedSearchArray,
        userFilter: undefined,
        searchString: searchBy,
        searchOn: InsurerSearchObject,
      },
      userId as number,
      "insurer"
    );
    const transformedData = (data as Insurer[]).map((insurer: Insurer) => ({
      id: insurer.id,
      insurerName: insurer.insurerName,
      displayName: insurer.displayName,
      status: insurer.status
        ? {
            id: insurer.status.id,
            lookUpValue: insurer.status.lookUpValue,
          }
        : null,
      companyTag: insurer.companyTag
        ? {
            id: insurer.companyTag.id,
            lookUpValue: insurer.companyTag.lookUpValue,
          }
        : null,
      companyType: insurer.companyType
        ? {
            id: insurer.companyType.id,
            lookUpValue: insurer.companyType.lookUpValue,
          }
        : null,
      insurerAddresses: insurer.insurerAddresses?.map(
        (address: InsurerAddress) => ({
          id: address.id,
          address1: address.address?.address1,
          city: address.address?.cityId,
          state: address.address?.stateId,
          country: address.address?.countryId,
          phoneNumber: address.address?.phoneNumber,
          branchType: address.address?.branchType
            ? { id: address.address.branchType.id, lookUpValue: address.address.branchType.lookUpValue }
            : null,
          branchCode: address.address?.branchCode ?? null,
          branchName: address.address?.branchName ?? null,
        })
      ),
    }));

    return { data: transformedData, count };
  }

  /** Saves an insurer-company address mapping to the database. */
  async addInsurerAddressMap(insurerAddress: InsurerAddressDto): Promise<void> {
    try {
      const insurerAddressData =
        this.insurerAddressRepository.create(insurerAddress);
      await this.insurerAddressRepository.save(insurerAddressData);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.BAD_REQUEST,
          errorMessages.failedToSaveAddressMapping || error.message
        )
      );
    }
  }

  /** Finds the insurer company and address data mapping in InsurerAddress Table */
  async findInsurerCompanyAddressMap(
    companyId: number,
    addressId: number
  ): Promise<InsurerAddress | null> {
    return this.insurerAddressRepository.findOne({
      where: {
        insurer: { id: companyId },
        address: { id: addressId },
      },
    });
  }

  /** Updates the contact_id on the insurer_address row for the given insurer+address combination. */
  async updateInsurerAddressContactId(
    insurerId: number,
    addressId: number,
    contactId: number
  ): Promise<void> {
    try {
      await this.insurerAddressRepository.update(
        { insurerId, addressId },
        { contactId }
      );
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToSaveAddressMapping || (error as Error).message
        )
      );
    }
  }

  // saves insurer companyid and addressid in InsurerAddress Table */
  async addInsurerAddress(
    queryRunner: QueryRunner,
    insurerAddress: InsurerAddress
  ): Promise<void> {
    try {
      await queryRunner.manager.save(insurerAddress);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToSaveAddressMapping || error.message
        )
      );
    }
  }

  /** Saves an insurer-company contact mapping to the database. */
  async addInsurerContact(insurerContact: InsurerContactDto): Promise<void> {
    try {
      await this.insurerContactRepository.save(insurerContact);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToSaveContactMapping || error.message
        )
      );
    }
  }

  /** Remove an insurer contact details */
  async delinkInsurerContactMapping(
    docObject: InsurerContactDto
  ): Promise<void> {
    try {
      await this.insurerContactRepository.delete(docObject);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.insurerContactMappingDeletionFailed || error.message
        )
      );
    }
  }

  /** Updates an existing insurer in the database. */
  async modifyInsurer(
    queryRunner: QueryRunner,
    insurerId: number,
    updateInsurerDto: UpdateInsurerDto
  ): Promise<Insurer> {
    try {
      const insurer = await queryRunner.manager.findOne(Insurer, {
        where: { id: insurerId },
      });

      if (!insurer) {
        throw new NotFoundException(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            errorMessages.insurerNotFound
          )
        );
      }

      // Update the insurer details
      Object.entries(updateInsurerDto).forEach(([key, value]) => {
        if (value !== undefined) {
          (insurer as any)[key] = value;
        }
      });
      const updatedInsurer = await queryRunner.manager.save(Insurer, insurer);
      return updatedInsurer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToModifyInsurer
        )
      );
    }
  }

  /** Removes an insurer from the database by its ID. */
  async softDeleteInsurer(insurerId: number): Promise<void> {
    try {
      await this.insurerRepository.update(insurerId, {
        deletedAt: new Date(), // Set the current timestamp
      });
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToDeleteInsurer || error.message
        )
      );
    }
  }

  async fetchInsurerByIdWithDetails(insurerId: number): Promise<Insurer> {
    const insurer = await this.insurerRepository.findOne({
      where: { id: insurerId },
      relations: [
        "insurerAddresses",
        "insurerAddresses.address.addressType",
        "insurerAddresses.address.branchType",
        "insurerContacts",
        "insurerContacts.contact",
        "insurerContacts.contact.contactAddresses",
        "insurerContacts.contact.contactAddresses.address.addressType",
        "companyTag",
        "companyType",
        "status",
        "isLife",
        "country",
      ],
    });

    const gstDetailIds = (insurer?.insurerAddresses ?? [])
      .map((ia: any) => ia?.address?.stateGstDetailId)
      .filter((id: any) => id != null);

    const gstDetails: StateGstDetail[] = gstDetailIds.length
      ? await this.stateGstDetailRepository.find({
          where: { id: In(gstDetailIds) },
          relations: ["state", "gstCategory"],
        })
      : [];

    if (!insurer) {
      throw new NotFoundException(`Insurer with ID ${insurerId} not found`);
    }
    return await this.transformInsurer(insurer, gstDetails);
  }

  /** Fetches insurers based on the given name. */
  async findInsurerByName(name: string, countryId: number): Promise<Insurer[]> {
    try {
      const insurers = await this.insurerRepository.find({
        where: {
          insurerName: ILike(`%${name}%`),
          countryId: countryId,
        },
      });

      return insurers;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to find insurer with name "${name}".`
      );
    }
  }

  /** Fetches the total number of active insurers based on the given status ID. */
  async getTotalActiveInsurers(statusLid?: number): Promise<number> {
    try {
      return await this.insurerRepository.count({
        where: {
          statusLid: statusLid,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchInsurers || error.message
        )
      );
    }
  }

  async getInsurerIdsByAddressFilters(
    searchArray: { searchBy: string; searchValue: string | number | Date | Array<string | number | Date> }[]
  ): Promise<number[]> {
    const ADDRESS_SPECIFIC_KEYS = new Set([
      "companyAddresses.address.cityId.id",
      "branchTypeLid",
      "branchCode",
      "branchName",
    ]);

    const nameFilter = searchArray.find((p) => p.searchBy === "insurerNameFilter");
    const addressFilters = searchArray.filter((p) => ADDRESS_SPECIFIC_KEYS.has(p.searchBy));
    const countryFilter = searchArray.find((p) => p.searchBy === "countryId");

    if (!nameFilter && addressFilters.length === 0 && !countryFilter) return [];

    const qb = this.insurerRepository
      .createQueryBuilder("insurer")
      .select("DISTINCT insurer.id", "id");

    if (addressFilters.length > 0) {
      qb.innerJoin("insurer.insurerAddresses", "insurerAddr")
        .innerJoin("insurerAddr.address", "address")
        .leftJoin("address.cityId", "city")
        .leftJoin("address.branchType", "branchType");
    }

    if (countryFilter) {
      const val = Array.isArray(countryFilter.searchValue) ? countryFilter.searchValue[0] : countryFilter.searchValue;
      qb.andWhere("insurer.countryId = :countryId", { countryId: Number(val) });
    }

    if (nameFilter) {
      const val = Array.isArray(nameFilter.searchValue) ? nameFilter.searchValue[0] : nameFilter.searchValue;
      qb.andWhere("insurer.insurerName ILIKE :insurerName", { insurerName: `%${val}%` });
    }

    for (const filter of addressFilters) {
      const val = Array.isArray(filter.searchValue) ? filter.searchValue[0] : filter.searchValue;
      if (filter.searchBy === "companyAddresses.address.cityId.id") {
        qb.andWhere("city.id = :cityId", { cityId: Number(val) });
      } else if (filter.searchBy === "branchTypeLid") {
        qb.andWhere("branchType.lookUpValue ILIKE :branchTypeVal", { branchTypeVal: `%${val}%` });
      } else if (filter.searchBy === "branchCode") {
        qb.andWhere("address.branchCode ILIKE :branchCode", { branchCode: `%${val}%` });
      } else if (filter.searchBy === "branchName") {
        qb.andWhere("address.branchName ILIKE :branchName", { branchName: `%${val}%` });
      }
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => Number(r.id));
  }

  async getInsurerListingKpis(insurerIds?: number[]): Promise<{
    totalActivePolicies: number;
    brokerageAmount: number;
    netPremium: number;
  }> {
    const [activeLookup, enabledForPerformanceLookup] = await Promise.all([
      this.lookUpRepository.findOne({ where: { lookUpKey: POLICY_STATUS_MIG_ACTIVE } }),
      this.lookUpRepository.findOne({ where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES } }),
    ]);
    const enabledForPerformanceLid = enabledForPerformanceLookup?.id;

    const activePolicyQb = this.policyRepository
      .createQueryBuilder("policy")
      .select("COUNT(DISTINCT policy.id)::int", "count")
      .innerJoin("policy.insurerMappings", "pim")
      .where("policy.status_lid = :statusLid", { statusLid: activeLookup?.id ?? 0 });
    if (insurerIds && insurerIds.length > 0) {
      activePolicyQb.andWhere("pim.insurerId IN (:...insurerIds)", { insurerIds });
    }
    const activePolicyResult = await activePolicyQb.getRawOne();
    const totalActivePolicies = Number(activePolicyResult?.count || 0);

    const policyKpiQb = this.policyRepository
      .createQueryBuilder("policy")
      .select([
        `COALESCE(SUM(${brokerageAmountExpr("policy")}), 0)::float8 AS brokerageAmount`,
        "COALESCE(SUM(policy.netPremium), 0)::float8 AS netPremium",
      ]);
    if (insurerIds && insurerIds.length > 0) {
      policyKpiQb
        .innerJoin("policy.insurerMappings", "pim")
        .andWhere("pim.insurerId IN (:...insurerIds)", { insurerIds });
    }
    if (enabledForPerformanceLid) {
      policyKpiQb.andWhere("policy.enabled_for_performance_lid = :enabledForPerformanceLid", { enabledForPerformanceLid });
    }
    const policyTotals = await policyKpiQb.getRawOne();

    const endorsementKpiQb = this.policyRepository.manager
      .getRepository(Endorsement)
      .createQueryBuilder("endorsement")
      .innerJoin("endorsement.policy", "policy")
      .select([
        `COALESCE(SUM(${brokerageAmountExpr("endorsement", { terrorismAmountColumn: "commissionTerrorismAmount" })}), 0)::float8 AS brokerageAmount`,
        "COALESCE(SUM(endorsement.netPremium), 0)::float8 AS netPremium",
      ]);
    if (insurerIds && insurerIds.length > 0) {
      endorsementKpiQb
        .innerJoin("policy.insurerMappings", "pim")
        .andWhere("pim.insurerId IN (:...insurerIds)", { insurerIds });
    }
    if (enabledForPerformanceLid) {
      endorsementKpiQb
        .andWhere("policy.enabled_for_performance_lid = :enabledForPerformanceLid", { enabledForPerformanceLid })
        .andWhere("endorsement.enabled_for_performance_lid = :endorsementEnabledForPerformanceLid", { endorsementEnabledForPerformanceLid: enabledForPerformanceLid });
    }
    const endorsementTotals = await endorsementKpiQb.getRawOne();

    const assetEndKpiQb = this.policyRepository.manager
      .getRepository(PolicyAssetEndorsement)
      .createQueryBuilder("endorsement")
      .innerJoin("endorsement.policy", "policy")
      .select([
        `COALESCE(SUM(${brokerageAmountExpr("endorsement", {
          // aliased "endorsement" but backed by PolicyAssetEndorsement, which has
          // no SRCC/TC brokerage columns.
          terrorismAmountColumn: "commissionTerrorismAmount",
          hasSrcc: false,
          hasTc: false,
        })}), 0)::float8 AS brokerageAmount`,
        "COALESCE(SUM(endorsement.netPremium), 0)::float8 AS netPremium",
      ]);
    if (insurerIds && insurerIds.length > 0) {
      assetEndKpiQb
        .innerJoin("policy.insurerMappings", "pim")
        .andWhere("pim.insurerId IN (:...insurerIds)", { insurerIds });
    }
    if (enabledForPerformanceLid) {
      assetEndKpiQb.andWhere("policy.enabled_for_performance_lid = :enabledForPerformanceLid", { enabledForPerformanceLid });
    }
    const assetEndTotals = await assetEndKpiQb.getRawOne();

    return {
      totalActivePolicies,
      brokerageAmount:
        Number(policyTotals?.brokerageamount || 0) +
        Number(endorsementTotals?.brokerageamount || 0) +
        Number(assetEndTotals?.brokerageamount || 0),
      netPremium:
        Number(policyTotals?.netpremium || 0) +
        Number(endorsementTotals?.netpremium || 0) +
        Number(assetEndTotals?.netpremium || 0),
    };
  }

  /** Fetches a paginated list of insurers based on various filters. */
  async fetchInsurerList(
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortOrder: string,
    userId: number,
    entityIds?: number[]
  ): Promise<{ data: Insurer[]; total: number }> {
    try {
      const status = await this.lookUpRepository.findOne({
        where: { lookUpKey: DEFAULT_INSURER_STATUS_ACTIVE_KEY },
      });

      const whereCondition: Record<string, any> = {
        statusLid: status?.id ?? undefined,
      };
      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: "insurer",
          page,
          limit,
          sort: [
            {
              field: sortBy,
              order: sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC",
            },
          ],
          relations: undefined,
          where: whereCondition,
          select: ["id", "insurerName", "displayName"],
          searchArray: [],
          userFilter: undefined,
          searchString: search,
          searchOn: ["insurerName", "displayName"],
        },
        userId as number,
        "insurer"
      );

      let finalData = data;

      // ✅ Append missing TPAs (same logic as company)
      if (entityIds && entityIds.length > 0) {
        const existingInsurerIds = new Set(data.map((r) => r.id));
        const missingInsurerIds = entityIds.filter(
          (id) => !existingInsurerIds.has(id)
        );

        if (missingInsurerIds.length > 0) {
          const additional = await this.insurerRepository.find({
            where: { id: In(missingInsurerIds) },
            select: ["id", "insurerName", "displayName"],
          });
          const sanitizedAdditional = additional.map((item) => ({
            id: item.id,
            insurerName: item.insurerName,
            displayName: item.displayName,
          }));
          finalData = finalData.concat(sanitizedAdditional);
        }
      }
      return { data: finalData, total: count };
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchInsurers || (error as any).message
        )
      );
    }
  }

  /** Fetches insurer details based on various conditions. */
  async fetchInsurerDetails(
    fields: string[],
    relations: string[],
    whereCondition: FindOptionsWhere<Insurer>
  ): Promise<Insurer> {
    try {
      const entityName = DEFAULT_INSURER_ENTITY_NAME;
      const data = await this.entityService.getListOfValues(
        entityName,
        fields,
        whereCondition,
        relations
      );
      if (!data || data.length === 0) {
        throw new NotFoundException(errorMessages.insurerNotFound);
      }

      return data;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerRepository",
          method: "fetchInsurerDetails",
          payload: { whereCondition: whereCondition },
          messageData: error,
        }),
      });
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

  /** Fetches insurer details based on various conditions. */
  async getInsurerLocations(
    insurerId: number,
    page: number,
    limit: number,
    search?: string,
    entityIds?: number[]
  ) {
    try {
      const insurer = await this.insurerRepository.findOne({
        where: { id: insurerId },
      });
      if (!insurer) {
        throw new NotFoundException(`Insurer with ID ${insurerId} not found`);
      }
      const { data, count } = await this.entityService.fetchEntityList(
        DEFAULT_INSURER_ADDRESS_ENTITY_NAME, // Entity name
        page,
        limit,
        [{ field: "id", order: "ASC" }], // Sort options
        ["address", "address.cityId"], // Relations
        { insurerId }, // Filter by insurer ID
        ["id", "address.id", "address.address1", "address.cityId.name"], // Select fields
        undefined, // Search array
        undefined, // User filter
        search, // Search string
        ["address.address1", "address.cityId.name"] // Search on
      );
      return { data, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerRepository",
          method: "getInsurerLocations",
          payload: { insurerId, page, limit, search },
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

  private transformInsurer(insurerOrInsurers: Insurer | Insurer[], gstDetails: StateGstDetail[] = []): any {
    const mapAddress = (addressMapping: InsurerAddress) => {
      const addr = addressMapping.address as any;
      const gstRecord = addr?.stateGstDetailId
        ? gstDetails.find((g) => g.id === addr.stateGstDetailId)
        : null;

      return {
        id: addr?.id,
        addressTypeLid: addr?.addressTypeLid,
        addressType: mapLookup(addr?.addressType),
        address1: addr?.address1,
        countryId: addr?.countryId
          ? { name: addr.countryId.name, isoCode: addr.countryId.isoCode, id: addr.countryId.id }
          : null,
        stateId: addr?.stateId
          ? { name: addr.stateId.name, stateCode: addr.stateId.stateCode, id: addr.stateId.id }
          : null,
        cityId: addr?.cityId
          ? { name: addr.cityId.name, id: addr.cityId.id }
          : null,
        address2: addr?.address2,
        area: addr?.area,
        pinCode: addr?.pinCode,
        phoneNumber: addr?.phoneNumber,
        alternatePhoneNumber: addr?.alternatePhoneNumber,
        email: addr?.email,
        supportNumber: addr?.supportNumber,
        branchTypeLid: addr?.branchTypeLid,
        branchType: addr?.branchType
          ? {
              id: addr.branchType.id,
              lookUpValue: addr.branchType.lookUpValue,
              lookUpValueKey: addr.branchType.lookUpValueKey,
            }
          : null,
        branchCode: addr?.branchCode,
        branchName: addr?.branchName,
        parentBranchId: addr?.parentBranchId ?? null,
        // contact_id stored on the insurer_address row (branch-specific contact)
        contactId: addressMapping?.contactId ?? null,
        panCardNo: addr?.panCardNo ?? null,
        registrationNo: addr?.registrationNo ?? null,
        tanNumber: addr?.tanNumber ?? null,
        stateGstDetailId: addr?.stateGstDetailId ?? null,
        gstDetails: gstRecord
          ? {
              id: gstRecord.id,
              gstStateId: gstRecord.stateId,
              state: gstRecord.state ? { id: gstRecord.state.id, name: gstRecord.state.name } : null,
              gstNumber: gstRecord.gstNumber,
              gstCategoryLid: gstRecord.gstCategoryLid,
              gstCategory: mapLookup(gstRecord.gstCategory),
            }
          : null,
        createdBy: addr?.createdBy,
        updatedBy: addr?.updatedBy,
        createdAt: addr?.createdAt,
        updatedAt: addr?.updatedAt,
      };
    };

    const mapContact = (contactMapping: InsureContact) => ({
      id: contactMapping.contact?.id,
      salutationLid: contactMapping.contact?.salutationLid,
      firstName: contactMapping.contact?.firstName,
      lastName: contactMapping.contact?.lastName,
      middleName: contactMapping.contact?.middleName,
      displayName: contactMapping.contact?.displayName,
      companyId: contactMapping.contact?.companyId,
      companyLocationId: contactMapping.contact?.companyLocationId,
      companyBranchId: contactMapping.contact?.companyBranchId,
      tagLid: contactMapping.contact?.tagLid,
      contactTypeLid: contactMapping.contact?.contactTypeLid,
      department: contactMapping.contact?.department,
      designation: contactMapping.contact?.designation,
      reportingToId: contactMapping.contact?.reportingToId,
      assistantId: contactMapping.contact?.assistantId,
      emailId: contactMapping.contact?.emailId,
      phone: contactMapping.contact?.phone,
      remarks: contactMapping.contact?.remarks,
      statusLid: contactMapping.contact?.statusLid,
      contactAddresses:
        contactMapping.contact?.contactAddresses?.map(mapAddress),
    });

    const mapLookup = (lookup: LookUp) => ({
      id: lookup?.id,
      lookUpValue: lookup?.lookUpValue,
    });

    const mapGstDetail = (gst: StateGstDetail) => ({
      id: gst.id,
      stateId: gst.stateId,
      state: gst.state ? { id: gst.state.id, name: gst.state.name, stateCode: gst.state.stateCode } : null,
      gstNumber: gst.gstNumber,
      gstCategoryLid: gst.gstCategoryLid,
      gstCategory: mapLookup(gst.gstCategory),
      entityType: gst.entityType,
      statusLid: gst.statusLid,
    });

    const transform = (insurer: Insurer) => {
      // Resolve the branch-specific contact via insurer_address.contact_id:
      // map each insurer contact by its own id so an address can look up the
      // exact contact stored against it in the insurer_address table.
      const contactById = new Map<number, { id: number; firstName: string; lastName: string; displayName: string }>();
      insurer.insurerContacts?.forEach((contactMapping) => {
        const contact = contactMapping.contact;
        if (contact?.id != null) {
          contactById.set(contact.id, {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            displayName: contact.displayName,
          });
        }
      });

      return {
        id: insurer.id,
        insurerName: insurer.insurerName,
        displayName: insurer.displayName,
        companyTypeLid: insurer.companyTypeLid,
        companyTag: mapLookup(insurer.companyTag),
        companyType: mapLookup(insurer.companyType),
        isLife: mapLookup(insurer.isLife),
        status: mapLookup(insurer.status),
        website: insurer.website,
        companyTagLid: insurer.companyTagLid,
        remarks: insurer.remarks,
        insureCode: insurer.insureCode,
        panCardNumber: insurer.panCardNumber,
        registrationNo: insurer.registrationNo,
        tanNumber: insurer.tanNumber,
        countryId: insurer.countryId,
        country: insurer.country,
        policy: [],
        insurerAddresses: insurer.insurerAddresses?.map((addressMapping) => {
          const mapped = mapAddress(addressMapping);
          const contact =
            addressMapping?.contactId != null
              ? contactById.get(addressMapping.contactId)
              : undefined;
          return {
            ...mapped,
            contactDetails: contact
              ? { id: contact.id, firstName: contact.firstName, lastName: contact.lastName, displayName: contact.displayName }
              : null,
          };
        }),
        insurerContacts: insurer.insurerContacts?.map(mapContact),
        insurerLogoFileId: insurer.insurerLogoFileId,
        gstDetails: gstDetails.map(mapGstDetail),
      };
    };

    return Array.isArray(insurerOrInsurers)
      ? insurerOrInsurers.map(transform)
      : transform(insurerOrInsurers);
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

  async findCompanyInsurers(
    companyId: number,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ data: CompanyInsurerDto[]; count: number }> {
    try {
      const rows = await this.policyRepository
        .createQueryBuilder("policy")
        .innerJoin("policy.insurerMappings", "insurerMapping")
        .innerJoin("insurerMapping.insurer", "insurer")
        .select([
          'DISTINCT insurer.id AS "insurerId"',
          'COALESCE(insurer.displayName, insurer.insurerName) AS "insurerName"',
        ])
        .where("policy.companyId = :companyId", { companyId })
        .andWhere("policy.opportunityType IN (:...opportunityTypes)", {
          opportunityTypes: [SALES_OPPORTUNITY, RENEWAL_OPPORTUNITY],
        })
        // IMPORTANT: alias was created as "insurerName" (quoted) so must quote in ORDER BY
        .orderBy('"insurerName"', "ASC")
        .getRawMany();

      const mappedRows = rows
        .filter((row: any) => row.insurerId !== null)
        .map((row: any) => ({
          insurerId: Number(row.insurerId),
          insurerName: row.insurerName ?? "",
        }));

      const normalizedSearch = search?.trim().toLowerCase();
      const filteredRows = normalizedSearch
        ? mappedRows.filter((row) =>
            row.insurerName.toLowerCase().includes(normalizedSearch)
          )
        : mappedRows;

      const startIndex = (page - 1) * limit;
      const paginatedRows = filteredRows.slice(startIndex, startIndex + limit);
      console.log("Paginated Rows:", paginatedRows); // Debug log
      return { data: paginatedRows, count: filteredRows.length };
    } catch (error) {
      console.log("Error in findCompanyInsurers:", error); // Debug log
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InsurerRepository",
          method: "findCompanyInsurers",
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
  async fetchInsurerContacts(
    insurerId: number,
    page: number,
    limit: number,
    search: string,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      let statusKey, statusLid;
      const whereCondition: Record<string, any> = {
        insurerId,
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
        "InsureContact", // Entity name
        page,
        limit,
        [{ field: "id", order: "ASC" }], // Sort options
        ["contact", "contact.status"], // Relations
        whereCondition, // Filter by insurer ID
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch contacts for insurer with ID ${insurerId}.`
      );
    }
  }

  async fetchInsurerBranches(
    insurerId: number,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const qb = this.insurerAddressRepository
        .createQueryBuilder("ia")
        .leftJoinAndSelect("ia.address", "address")
        .leftJoinAndSelect("address.branchType", "branchType")
        .where("ia.insurerId = :insurerId", { insurerId });

      if (search) {
        qb.andWhere(
          "(address.branchCode ILIKE :search OR address.branchName ILIKE :search OR address.address1 ILIKE :search)",
          { search: `%${search}%` },
        );
      }

      const [branches, count] = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return { branches, count };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch branches for insurer with ID ${insurerId}.`
      );
    }
  }

  async fetchInsurerDropdown(
    search?: string,
    page: number = 1,
    limit: number = 10,
    entityIds?: number[],
  ): Promise<{ data: { id: number; insurerName: string }[]; count: number }> {
    const qb = this.insurerRepository
      .createQueryBuilder("insurer")
      .select(["insurer.id", "insurer.insurerName"])
      .where("insurer.deletedAt IS NULL");

    if (search) {
      qb.andWhere("insurer.insurerName ILIKE :search", { search: `%${search}%` });
    }

    const [rows, count] = await qb
      .orderBy("insurer.insurerName", "ASC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    let data = rows.map((r) => ({ id: r.id, insurerName: r.insurerName }));

    if (entityIds && entityIds.length > 0) {
      const existingIds = new Set(data.map((r) => r.id));
      const missingIds = entityIds.filter((id) => !existingIds.has(id));
      if (missingIds.length > 0) {
        const additional = await this.insurerRepository.find({
          where: { id: In(missingIds) },
          select: ["id", "insurerName"],
        });
        data = data.concat(additional.map((r) => ({ id: r.id, insurerName: r.insurerName })));
      }
    }

    return { data, count };
  }

  async getDistinctInsurerNames(search?: string): Promise<string[]> {
    const qb = this.insurerRepository
      .createQueryBuilder("insurer")
      .select("DISTINCT insurer.insurerName", "name")
      .where("insurer.deletedAt IS NULL");
    if (search) {
      qb.andWhere("insurer.insurerName ILIKE :search", {
        search: `%${search}%`,
      });
    }
    qb.orderBy("insurer.insurerName", "ASC").limit(50);
    const rows = await qb.getRawMany();
    return rows.map((r) => r.name).filter(Boolean);
  }

  async getDistinctBranchCodes(search?: string): Promise<string[]> {
    const qb = this.insurerAddressRepository
      .createQueryBuilder("ia")
      .innerJoin("ia.address", "address")
      .select("DISTINCT address.branchCode", "branchCode")
      .where("address.branchCode IS NOT NULL")
      .andWhere("address.branchCode != ''");
    if (search) {
      qb.andWhere("address.branchCode ILIKE :search", {
        search: `%${search}%`,
      });
    }
    qb.orderBy("address.branchCode", "ASC").limit(50);
    const rows = await qb.getRawMany();
    return rows.map((r) => r.branchCode).filter(Boolean);
  }

  async getDistinctBranchNames(search?: string): Promise<string[]> {
    const qb = this.insurerAddressRepository
      .createQueryBuilder("ia")
      .innerJoin("ia.address", "address")
      .select("DISTINCT address.branchName", "branchName")
      .where("address.branchName IS NOT NULL")
      .andWhere("address.branchName != ''");
    if (search) {
      qb.andWhere("address.branchName ILIKE :search", {
        search: `%${search}%`,
      });
    }
    qb.orderBy("address.branchName", "ASC").limit(50);
    const rows = await qb.getRawMany();
    return rows.map((r) => r.branchName).filter(Boolean);
  }
}
