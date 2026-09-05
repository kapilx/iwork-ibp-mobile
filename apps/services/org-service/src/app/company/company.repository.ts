import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Brackets,
  EntityManager,
  ILike,
  QueryFailedError,
  In,
  Repository,
  Not,
  FindOptionsWhere,
} from "typeorm";
import {
  DEFAULT_COMPANY_ENTITY_NAME,
  DEFAULT_COMPANY_STATUS_ACTIVE,
  DEFAULT_COMPANY_STATUS_INACTIVE,
  DUPLICATE_CONSTRAINT,
  OPPORTUNITY_ACTIVITY_STATUS_CLOSED,
  OPPORTUNITY_STAGES,
  OPPORTUNITY_STATUS_OPEN,
  OPPORTUNITY_STATUS_WON,
  OPPORTUNITY_STATUS_WORK_IN_PROGRESS,
  OPPORTUNITY_TYPES,
  QCR_GENERATION_KEY,
  POLICY_STATUS_MIG_ACTIVE,
  COMPANY_LIST_COLOUR,
  OPPORTUNITY_TYPE,
  DEFAULT_CONTACT_STATUS_ACTIVE_KEY,
  DEFAULT_CONTACT_STATUS_INACTIVE_KEY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import {
  errorMessages,
  infoMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { getDurationDates } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { getDateRange } from "../../../../service-lib/src/lib/utils/get-data-range.utils";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CompanyDetail } from "../../../../service-lib/src/lib/entities/company-detail.entity";
import { CompanyDocMap } from "../../../../service-lib/src/lib/entities/company-document-map.entity";
import { StateGstDetail } from "../../../../service-lib/src/lib/entities/company-gst-detail.entity";
import { CompanyAddress } from "../../../../service-lib/src/lib/entities/company.address.entity"; // Import the mapping entity
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { FileUpload } from "../../../../service-lib/src/lib/entities/file-upload.entity";
import { GroupCompanyMap } from "../../../../service-lib/src/lib/entities/group-comapny-map.entity";
import { UpdateAddressDto } from "../address/dto/update-address.dto";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { User } from "../../../../service-lib/src/lib/entities/user";
import {
  Currency,
  Policy,
  PolicyClaim,
} from "../../../../service-lib/src/lib/entities";
import {
  companyLocationSearchObject,
  companySearchObject,
  DEFAULT_DATE_FILTER_FIELD,
  fileSearchObject,
  OPPORTUNITY_STATUS_LOST,
  PRIORITY_HIGH,
  PRIORITY_IMP,
  PRIORITY_VIMP,
} from "../../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { brokerageAmountExpr } from "../../../../../../libs/service-lib/src/lib/constants";

@Injectable()
export class CompanyRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(GroupCompanyMap)
    private readonly groupCompanyMapRepository: Repository<GroupCompanyMap>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicyClaim)
    private readonly PolicyClaimRepository: Repository<PolicyClaim>,
    private readonly entityService: EntityService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  // Creates a new company entity and saves it to the database.
  async createCompany(
    entityManager: EntityManager,
    companyData: Partial<Company>
  ): Promise<Company> {
    try {
      const company = entityManager.create(Company, companyData);
      return await entityManager.save(company);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const constraint = (error as any).constraint; // Extract the constraint name
        if (constraint === DUPLICATE_CONSTRAINT.duplicatePanEntry) {
          // Unique constraint violation for PAN
          throw new Error(
            `Duplicate entry: A company with the same value (${companyData.panCardNumber}) already exists.`
          );
        } else if (constraint === DUPLICATE_CONSTRAINT.duplicateTanEntry) {
          // Unique constraint violation for TAN
          throw new Error(
            `Duplicate entry: A company with the same value (${companyData.tanNumber}) already exists.`
          );
        }
      }
      throw error;
    }
  }

  // Create a new company details entity and save it to the database
  async createCompanyDetails(
    entityManager: EntityManager,
    detailsData: Partial<CompanyDetail>
  ): Promise<CompanyDetail> {
    const details = entityManager.create(CompanyDetail, detailsData);
    return entityManager.save(details);
  }

  async refreshCompanyAnalytics(): Promise<void> {
    try {
      const companies = await this.companyRepository.find({ select: ["id"] });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyRepository",
          method: "refreshCompanyAnalytics",
          messageData: `Fetched ${companies.length} companies for analytics refresh`,
        }),
      });

      if (companies.length === 0) {
        return;
      }

      const [soType, roType] = await Promise.all([
        this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.SO },
        }),
        this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.RO },
        }),
      ]);

      if (!soType?.id || !roType?.id) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "CompanyRepository",
            method: "refreshCompanyAnalytics",
            messageData: "Opportunity type lookups not configured.",
          }),
        });
        return;
      }

      const companyIds = companies.map((company) => company.id);
      const chunkSize = 1000;
      for (let index = 0; index < companyIds.length; index += chunkSize) {
        const chunk = companyIds.slice(index, index + chunkSize);

        const [soRows, roRows, sumRows, policyRows, claimRows] =
          await Promise.all([
            this.opportunityRepository
              .createQueryBuilder("opportunity")
              .select("opportunity.companyId", "companyId")
              .addSelect("COUNT(opportunity.id)", "count")
              .addSelect("COALESCE(SUM(opportunity.premiumPaid), 0)", "premium")
              .where("opportunity.companyId IN (:...chunk)", { chunk })
              .andWhere("opportunity.opportunityTypeLid = :typeId", {
                typeId: soType.id,
              })
              .groupBy("opportunity.companyId")
              .getRawMany(),
            this.opportunityRepository
              .createQueryBuilder("opportunity")
              .select("opportunity.companyId", "companyId")
              .addSelect("COUNT(opportunity.id)", "count")
              .addSelect("COALESCE(SUM(opportunity.premiumPaid), 0)", "premium")
              .where("opportunity.companyId IN (:...chunk)", { chunk })
              .andWhere("opportunity.opportunityTypeLid = :typeId", {
                typeId: roType.id,
              })
              .groupBy("opportunity.companyId")
              .getRawMany(),
            this.opportunityRepository
              .createQueryBuilder("opportunity")
              .select("opportunity.companyId", "companyId")
              .addSelect(
                "COALESCE(SUM(opportunity.sumInsured), 0)",
                "totalSumInsured"
              )
              .where("opportunity.companyId IN (:...chunk)", { chunk })
              .groupBy("opportunity.companyId")
              .getRawMany(),
            this.policyRepository
              .createQueryBuilder("policy")
              .select("policy.companyId", "companyId")
              .addSelect("COUNT(policy.id)", "policyCount")
              .addSelect(
                "COALESCE(SUM(policy.premiumAtInception), 0)",
                "policyTotalPremium"
              )
              .addSelect(
                `COALESCE(SUM(${brokerageAmountExpr("policy")}), 0)`,
                "brokerage"
              )
              .where("policy.companyId IN (:...chunk)", { chunk })
              .groupBy("policy.companyId")
              .getRawMany(),
            this.PolicyClaimRepository.createQueryBuilder("claim")
              .leftJoin("claim.policy", "policy")
              .select("policy.companyId", "companyId")
              .addSelect("COALESCE(SUM(claim.claimAmount), 0)", "claimAmount")
              .where("policy.companyId IN (:...chunk)", { chunk })
              .groupBy("policy.companyId")
              .getRawMany(),
          ]);
        const soMap = new Map<number, { count: number; premium: number }>();
        soRows.forEach((row) =>
          soMap.set(Number(row.companyId), {
            count: Number(row.count ?? 0),
            premium: Number(row.premium ?? 0),
          })
        );

        const roMap = new Map<number, { count: number; premium: number }>();
        roRows.forEach((row) =>
          roMap.set(Number(row.companyId), {
            count: Number(row.count ?? 0),
            premium: Number(row.premium ?? 0),
          })
        );

        const sumMap = new Map<number, number>();
        sumRows.forEach((row) =>
          sumMap.set(Number(row.companyId), Number(row.totalSumInsured ?? 0))
        );

        const policyMap = new Map<
          number,
          { count: number; totalPremium: number; brokerage: number }
        >();
        policyRows.forEach((row) =>
          policyMap.set(Number(row.companyId), {
            count: Number(row.policyCount ?? 0),
            totalPremium: Number(row.policyTotalPremium ?? 0),
            brokerage: Number(row.brokerage ?? 0),
          })
        );

        const claimMap = new Map<number, number>();
        claimRows.forEach((row) =>
          claimMap.set(Number(row.companyId), Number(row.claimAmount ?? 0))
        );

        try {
          const values = chunk
            .map((companyId) => {
              const soData = soMap.get(companyId);
              const roData = roMap.get(companyId);
              const policyData = policyMap.get(companyId);

              return `(${companyId}, ${soData?.count ?? 0}, ${
                soData?.premium ?? 0
              }, ${roData?.count ?? 0}, ${roData?.premium ?? 0}, ${
                sumMap.get(companyId) ?? 0
              }, ${policyData?.count ?? 0}, ${policyData?.totalPremium ?? 0}, ${
                policyData?.brokerage ?? 0
              }, ${claimMap.get(companyId) ?? 0})`;
            })
            .join(",");

          const query = `
                        UPDATE company 
                        SET 
                          so_count = v.so_count,
                          so_total_premium = v.so_total_premium,
                          ro_count = v.ro_count,
                          ro_total_premium = v.ro_total_premium,
                          total_sum_insured = v.total_sum_insured,
                          policy_count = v.policy_count,
                          policy_total_premium = v.policy_total_premium,
                          brokerage = v.brokerage,
                          claim_amount = v.claim_amount,
                          updated_at = NOW()
                        FROM (VALUES ${values}) AS v(id, so_count, so_total_premium, ro_count, ro_total_premium, total_sum_insured, policy_count, policy_total_premium, brokerage, claim_amount)
                        WHERE company.id = v.id
                        `;

          await this.companyRepository.query(query);
        } catch (error) {
          console.log(`Error updating company data:`, error);
          throw error;
        }
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyRepository",
          method: "refreshCompanyAnalytics",
          messageData: `Processed ${companyIds.length} companies in batch chunk of: ${chunkSize}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "refreshCompanyAnalytics",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        errorMessages.companyAnalyticsRefreshFailed
      );
    }
  }

  // Lightweight lookup for the reminder-day settings only - no relations,
  // no scope validation (this is a narrow settings read, not a full company view).
  async getCompanyReminderConfig(companyId: number): Promise<Company | null> {
    return this.companyRepository.findOne({ where: { id: companyId } });
  }

  async updateCompanyReminderConfig(
    companyId: number,
    reminderConfig: {
      installmentReminderDays: number[];
      policyExpiryReminderDays: number[];
      opportunityCloseToExpiryReminderDays: number[];
    },
    updatedBy?: number
  ): Promise<Company | null> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      return null;
    }
    company.installmentReminderDays = reminderConfig.installmentReminderDays;
    company.policyExpiryReminderDays = reminderConfig.policyExpiryReminderDays;
    company.opportunityCloseToExpiryReminderDays =
      reminderConfig.opportunityCloseToExpiryReminderDays;
    if (updatedBy != null) {
      company.updatedBy = updatedBy;
    }
    return this.companyRepository.save(company);
  }

  async getCompanyById(
    companyId: number,
    userId: number
  ): Promise<Company | null> {
    try {
      // const editable
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        DEFAULT_COMPANY_ENTITY_NAME,
        "edit",
        companyId
      );
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
        // relationLoadStrategy: "query",
        relations: [
          "details",
          "companyAddresses",
          "companyAddresses.address",
          "companyAddresses.address.addressType",
          "stateGstDetails.gstCategory",
          "groupCompanyMaps",
          "groupCompanyMaps.groupCompany",
          "companyDocMaps",
          "companyContactMaps",
          "companyContactMaps.contact",
          "companyContactMaps.contact.salutation",
          "companyContactMaps.contact.tag",
          "companyContactMaps.contact.status",
          "companyContactMaps.contact.communicationDetails",
          "companyContactMaps.contact.owner",
          "country",
          "owner",
          "accountManagerInfo",
          "associateCrmInfo",
          "associateCrmMgrInfo",
          "centralOpsTeamLeadInfo",
          "centralOpsLeadInfo",
          "currency",
          // "policyConfigurationLocations",
          // "policyConfigurationLocations.address",
        ],
      });

      if (!company) {
        throw new NotFoundException(errorMessages.companyNotFound);
      }
      // Fetch lookup values for the required fields
      const lookUpValues = await this.entityService.getLookupValues([
        company?.industrySegmentLid ?? 0,
        company?.priorityLid ?? 0,
        company?.statusLid ?? 0,
        company?.companyTypeLid ?? 0,
        company?.groupCompanyLid ?? 0,
        company?.sourceTypeLid ?? 0,
        company?.sentimentLid ?? 0,
      ]);

      if (!lookUpValues) {
        throw new Error("Failed to fetch lookup values");
      }

      // Map the lookup values to their respective fields
      const industrySegment = lookUpValues.find(
        (item) => item.id === company.industrySegmentLid
      );
      const priority = lookUpValues.find(
        (item) => item.id === company.priorityLid
      );
      const status = lookUpValues.find((item) => item.id === company.statusLid);
      const companyType = lookUpValues.find(
        (item) => item.id === company.companyTypeLid
      );
      const groupCompany = lookUpValues.find(
        (item) => item.id === company.groupCompanyLid
      );
      const sourceType = lookUpValues.find(
        (item) => item.id === company.sourceTypeLid
      );
      const sentiment = lookUpValues.find(
        (item) => item.id === company.sentimentLid
      );

      // Spread the lookup values into the company object
      const enrichedCompany = {
        ...company,
        industrySegment,
        priority,
        status,
        companyType,
        groupCompany,
        sourceType,
        sentiment,
      };
      // Map company contacts
      enrichedCompany.contacts =
        company?.companyContactMaps?.map((companyContact) => {
          return companyContact.contact;
        }) || [];
      const soTypeLid = (
        await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.SO },
        })
      )?.id;
      const roTypeLid = (
        await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.RO },
        })
      )?.id;
      if (!soTypeLid || !roTypeLid) {
        throw new BadRequestException(`Opportunity types not found`);
      }
      // Validate and filter the response
      const filteredData = await this.transformCompanyResponse(
        [enrichedCompany],
        soTypeLid,
        roTypeLid
      );
      filteredData[0].editable = editValidation;
      return filteredData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteByCompanyId(id: string): Promise<{ affected?: number | null }> {
    const companyId = Number(id);

    try {
      // Start a transaction to ensure atomicity
      return await this.companyRepository.manager.transaction(
        async (transactionalEntityManager) => {
          // Soft delete associated addresses via the mapping table
          await transactionalEntityManager.update(
            CompanyAddress,
            { company: { id: companyId } },
            { deletedAt: new Date() }
          );

          // Soft delete associated company details
          await transactionalEntityManager.update(
            CompanyDetail,
            { companyId },
            { deletedAt: new Date() }
          );

          // Soft delete associated company strategy
          await transactionalEntityManager.update(
            { companyId },
            { deletedAt: new Date() }
          );

          // Soft delete the company itself
          const result = await transactionalEntityManager.update(
            Company,
            { id: companyId },
            { deletedAt: new Date() }
          );

          return { affected: result.affected };
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to soft delete company with ID ${id}: ${
          (error as Error).message
        }`
      );
    }
  }

  // Retrieves a paginated list of companies with optional search and sorting functionality.
  async findAllCompanyList(
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    userId: number,
    searchBy: string,
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    period?: string,
    timeFilter?: string,
    financialYear?: number,
    customWhereCondition?: Brackets
  ): Promise<{
    data: Company[];
    count: number;
    totalSoCount: number;
    totalSoPremium: number;
    totalRoCount: number;
    totalRoPremium: number;
    untappedCompanies: number;
    salesOpportunityCount: number;
    renewalOpportunityCount: number;
    totalCompaniesPremium: number;
    totalCompaniesBrokerage: number;
    totalPoliciesCount: number;
  }> {
    try {
      const relations = [
        "companyType",
        "industrySegment",
        "companyAddresses",
        "companyAddresses.address",
        "companyAddresses.address.cityId",
        "companyAddresses.address.countryId",
        "priority",
        "sentiment",
        "owner",
        "accountManagerInfo",
        "associateCrmInfo",
        "currency",
        "country",
        "status",
      ];
      // const status = await this.lookUpRepository.findOne({
      //   where: { lookUpKey: DEFAULT_COMPANY_STATUS_ACTIVE },
      // });
      let periodStartAndEndDate;
      if (timeFilter || financialYear !== undefined) {
        const range = getDateRange(timeFilter, financialYear);
        if (range.start && range.end) {
          periodStartAndEndDate = {
            field: field || "createdAt",
            from: range.start,
            to: range.end,
          };
        }
      } else if (period) {
        try {
          const fromToDate = getDurationDates(period);
          periodStartAndEndDate = {
            field: field ?? DEFAULT_DATE_FILTER_FIELD,
            from: fromToDate.startDate,
            to: fromToDate.endDate,
          };
        } catch (error) {
          throw new BadRequestException(error.message);
        }
      }
      let dateFilter;
      if (fromDate || toDate) {
        dateFilter = {
          field: field ?? DEFAULT_DATE_FILTER_FIELD,
          from: fromDate,
          to: toDate,
        };
      }
      // Set limit to 1000 for fetching all companies
      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: DEFAULT_COMPANY_ENTITY_NAME,
          page,
          limit,
          sort:
            sort.length > 0 ? sort : [{ field: "updatedAt", order: "DESC" }],
          relations: relations,
          where: undefined,
          select: undefined,
          searchArray: searchArray.length === 0 ? [] : searchArray,
          userFilter: undefined,
          searchString: searchBy,
          searchOn: companySearchObject,
          customWhereCondition,
          dateFilter:
            dateFilter && Object.keys(dateFilter).length > 0
              ? (dateFilter as { field: string; from: Date; to?: Date })
              : undefined,
          period: periodStartAndEndDate,
        },
        userId,
        DEFAULT_COMPANY_ENTITY_NAME
      );

      if (!data || data.length === 0) {
        return {
          data: [],
          count: 0,
          totalSoCount: 0,
          totalSoPremium: 0,
          totalRoCount: 0,
          totalRoPremium: 0,
          untappedCompanies: 0,
          salesOpportunityCount: 0,
          renewalOpportunityCount: 0,
          totalCompaniesPremium: 0,
          totalCompaniesBrokerage: 0,
          totalPoliciesCount: 0,
        };
      }

      const selectedFields: (keyof Company)[] = [
        "id",
        "soCount",
        "soTotalPremium",
        "roCount",
        "roTotalPremium",
        "policyCount",
        "policyTotalPremium",
        "totalSumInsured",
        "brokerage",
      ];

      const { data: allCompanyData } =
        await this.scopeService.validateMasterScope(
          {
            entity: DEFAULT_COMPANY_ENTITY_NAME,
            page: 1,
            limit: count,
            sort: [{ field: "id", order: "ASC" }],
            relations: relations,
            where: undefined,
            select: selectedFields,
            searchArray: searchArray.length === 0 ? [] : searchArray,
            userFilter: undefined,
            searchString: searchBy,
            searchOn: companySearchObject,
          },
          userId,
          DEFAULT_COMPANY_ENTITY_NAME
        );
      const opportunityOpenStatuses = await this.lookUpRepository.find({
        where: {
          lookUpKey: In([OPPORTUNITY_STATUS_OPEN, OPPORTUNITY_STATUS_LOST]),
        },
      });
      const opportunityLostStatusId = opportunityOpenStatuses.find(
        (status) => status.lookUpKey === OPPORTUNITY_STATUS_LOST
      )?.id;

      const opportunityPolicyActiveStatus = await this.lookUpRepository.findOne(
        {
          where: {
            lookUpKey: POLICY_STATUS_MIG_ACTIVE,
          },
        }
      );

      // Extract all unique priorityLid values from the data
      const priorityLids = [
        ...new Set(data.map((company) => company.priorityLid).filter(Boolean)),
      ];
      const industrySegmentIds = [
        ...new Set(
          data.map((company) => company.industrySegmentLid).filter(Boolean)
        ),
      ];
      const companyTypeLids = [
        ...new Set(
          data.map((company) => company.companyTypeLid).filter(Boolean)
        ),
      ];
      const sentimentLids = [
        ...new Set(data.map((company) => company.sentimentLid).filter(Boolean)),
      ];
      const statusLids = [
        ...new Set(data.map((company) => company.statusLid).filter(Boolean)),
      ];

      const allLids = [
        ...new Set([
          ...priorityLids,
          ...industrySegmentIds,
          ...companyTypeLids,
          ...sentimentLids,
          ...statusLids,
        ]),
      ];

      // Fetch lookup values for all LIDs in one call
      const allLookupValues =
        allLids.length > 0
          ? await this.entityService.getLookupValues(allLids)
          : [];

      const priorityLookup = allLookupValues.filter((item) =>
        priorityLids.includes(item.id)
      );
      const industrySegmentLookup = allLookupValues.filter((item) =>
        industrySegmentIds.includes(item.id)
      );
      const companyTypeLookup = allLookupValues.filter((item) =>
        companyTypeLids.includes(item.id)
      );
      const sentimentLookup = allLookupValues.filter((item) =>
        sentimentLids.includes(item.id)
      );
      const statusLookup = allLookupValues.filter((item) =>
        statusLids.includes(item.id)
      );
      const totals = allCompanyData.reduce(
        (
          acc,
          company: Pick<
            Company,
            | "soCount"
            | "soTotalPremium"
            | "roCount"
            | "roTotalPremium"
            | "policyCount"
            | "policyTotalPremium"
            | "brokerage"
          >
        ) => {
          const soCount = Number(company.soCount ?? 0);
          const roCount = Number(company.roCount ?? 0);
          const policyCount = Number(company.policyCount ?? 0);
          const soPremium = Number(company.soTotalPremium ?? 0);
          const roPremium = Number(company.roTotalPremium ?? 0);
          const policyPremium = Number(company.policyTotalPremium ?? 0);
          const brokerage = Number(company.brokerage ?? 0);

          acc.totalSoCount += soCount;
          acc.totalSoPremium += soPremium;
          acc.totalRoCount += roCount;
          acc.totalRoPremium += roPremium;
          acc.totalPoliciesCount += policyCount;
          acc.totalCompaniesPremium += policyPremium;
          acc.totalCompaniesBrokerage += brokerage;

          if (soCount === 0 && roCount === 0 && policyCount === 0) {
            acc.untappedCompanies += 1;
          }

          return acc;
        },
        {
          totalSoCount: 0,
          totalSoPremium: 0,
          totalRoCount: 0,
          totalRoPremium: 0,
          untappedCompanies: 0,
          totalCompaniesPremium: 0,
          totalCompaniesBrokerage: 0,
          totalPoliciesCount: 0,
        }
      );

      // Transform company data
      const transformCompanyData = async (
        data: any[],
        policyActiveStatusId?: number,
        lostStatusId?: number
      ) => {
        return await Promise.all(
          data.map(async (company) => {
            const colorKey: keyof typeof COMPANY_LIST_COLOUR =
              await this.determineColorKey(
                company.id,
                policyActiveStatusId,
                lostStatusId
              );
            return {
              companyName: company.companyName,
              companyId: company.id,
              displayName: company.displayName,
              noOfEmployees: company.noOfEmployees,
              city:
                company.companyAddresses?.[0]?.address?.cityId?.name || null, // Extract city name from the first address
              country: company.country
                ? {
                    id: company.country.id,
                    name: company.country.name,
                  }
                : null,
              currency: company.currency
                ? {
                    id: company.currency.id,
                    name: company.currency.name,
                    value: company.currency.value,
                  }
                : null,
              priority:
                priorityLookup.find((item) => item.id === company.priorityLid)
                  ?.lookUpValue ?? null,
              industrySegment:
                industrySegmentLookup.find(
                  (item) => item.id === company.industrySegmentLid
                )?.lookUpValue ?? null,
              companyType:
                companyTypeLookup.find(
                  (item) => item.id === company.companyTypeLid
                )?.lookUpValue ?? null,
              status:
                statusLookup.find((item) => item.id === company.statusLid)
                  ?.lookUpValue ?? null,
              sentiment:
                sentimentLookup.find((item) => item.id === company.sentimentLid)
                  ?.lookUpValue ?? null,
              sumInsured: Number(company.totalSumInsured ?? 0),
              salesOpportunityCount: Number(company.soCount ?? 0),
              renewalOpportunityCount: Number(company.roCount ?? 0),
              policyCount: Number(company.policyCount ?? 0),
              annualPremium: company.annualPremium
                ? Number(company.annualPremium)
                : null,
              soPremium: Number(company.soTotalPremium ?? 0),
              roPremium: Number(company.roTotalPremium ?? 0),
              policyPremium: Number(company.policyTotalPremium ?? 0),
              brokerage: Number(company.brokerage ?? 0),
              claimAmount: Number(company.claimAmount ?? 0),
              leadCRM: company?.owner
                ? `${company?.owner?.firstName ?? ""} ${
                    company?.owner?.lastName ?? ""
                  }`.trim()
                : "",
              leadCRMId: company?.owner?.userId ?? null,
              associateCrm: company?.associateCrmInfo
                ? `${company?.associateCrmInfo?.firstName ?? ""} ${
                    company?.associateCrmInfo?.lastName ?? ""
                  }`.trim()
                : "",
              associateCrmId: company?.associateCrmInfo?.userId ?? null,
              previousInsurer: "",
              previousTpa: "",
              previousBroker: "",
              salesOpportunityBeyondTheQuarterCount: 0,
              renewalOpportunityBeyondTheQuarterCount: 0,
              colorKey,
            };
          })
        );
      };

      // Transform the data
      const transformedData = await transformCompanyData(
        data,
        opportunityPolicyActiveStatus?.id,
        opportunityLostStatusId
      );
      return {
        data: transformedData as unknown as Company[],
        count,
        totalSoCount: totals.totalSoCount,
        totalSoPremium: totals.totalSoPremium,
        totalRoCount: totals.totalRoCount,
        totalRoPremium: totals.totalRoPremium,
        untappedCompanies: totals.untappedCompanies,
        totalCompaniesPremium: totals.totalCompaniesPremium,
        totalCompaniesBrokerage: totals.totalCompaniesBrokerage,
        totalPoliciesCount: totals.totalPoliciesCount,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "findAllCompanyList",
          messageData: error,
        }),
      });
      throw new Error("Failed to fetch company list");
    }
  }

  async updateCompany(
    entityManager: EntityManager,
    companyId: string,
    companyData: Partial<Company> & {
      gstDetails?: [];
      groupCompanyMap?: object;
      companyDocMaps?: [];
      addresses?: UpdateAddressDto[];
    }
  ): Promise<Company | null> {
    try {
      const company = await entityManager.findOne(Company, {
        where: { id: Number(companyId) },
      });
      if (!company) {
        throw new NotFoundException(
          createErrorResponse(
            statusCode.notFound,
            errorMessages.companyNotFound
          )
        );
      }
      const {
        gstDetails,
        groupCompanyMap,
        companyDocMaps,
        addresses,
        ...filteredCompanyData
      } = companyData;
      // Merge the updates into the existing company entity and save
      // This triggers the FieldEncryptionSubscriber
      Object.assign(company, filteredCompanyData);
      company.auditRefId = parseInt(companyId);
      const updatedCompany = await entityManager.save(Company, company);
      return updatedCompany;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const constraint = (error as any).constraint; // Extract the constraint name
        if (constraint === DUPLICATE_CONSTRAINT.duplicatePanEntry) {
          // Unique constraint violation for PAN
          throw new Error(
            `Duplicate entry: A company with the same value (${companyData.panCardNumber}) already exists.`
          );
        } else if (constraint === DUPLICATE_CONSTRAINT.duplicateTanEntry) {
          // Unique constraint violation for TAN
          throw new Error(
            `Duplicate entry: A company with the same value (${companyData.tanNumber}) already exists.`
          );
        }
      }
      throw error; // Re-throw the error to be handled by the service/controller
    }
  }

  async updateCompanyDetails(
    entityManager: EntityManager,
    companyId: string,
    userId: number,
    detailsData: Partial<CompanyDetail>
  ): Promise<CompanyDetail | null> {
    try {
      const existingDetails = await entityManager.findOne(CompanyDetail, {
        where: { companyId: Number(companyId) },
      });

      if (existingDetails) {
        await entityManager.update(
          CompanyDetail,
          { companyId: Number(companyId) },
          detailsData
        );
        return await entityManager.findOne(CompanyDetail, {
          where: { companyId: Number(companyId) },
        });
      } else {
        const newDetails = entityManager.create(CompanyDetail, {
          ...detailsData,
          createdBy: userId,
          updatedBy: userId,
          companyId: Number(companyId),
        });
        return await entityManager.save(newDetails);
      }
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const constraint = (error as any).constraint;
        if (constraint === DUPLICATE_CONSTRAINT.duplicateGstinEntry) {
          throw new Error(errorMessages.DuplicateGstinEntry);
        }
      }
      throw error;
    }
  }

  async findCompanyByName(
    companyName: string,
    countryId: number
  ): Promise<Company | null> {
    return await this.companyRepository.findOne({
      where: {
        companyName: ILike(companyName), // Case-insensitive comparison
        countryId: countryId, // Ensure the countryId matches
      },
    });
  }

  async createGstDetail(
    entityManager: EntityManager,
    gstData: Partial<StateGstDetail>
  ): Promise<StateGstDetail> {
    try {
      const gstDetail = entityManager.create(StateGstDetail, gstData);
      return await entityManager.save(gstDetail);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const constraint = (error as any).constraint;
        if (constraint === DUPLICATE_CONSTRAINT.duplicateGstinEntry) {
          throw new Error(errorMessages.DuplicateGstinEntry);
        }
      }
      throw error;
    }
  }

  async transformCompanyResponse(
    data: any,
    soTypeLid: number,
    roTypeLid: number
  ) {
    const companyAnalytics = await this.getCompanyAnalytics(
      data[0]?.id,
      soTypeLid,
      roTypeLid
    );
    return data.map((company: any) => ({
      ...this.omitFields(company),
      details: this.omitFields(company.details),
      companyAddresses: company?.companyAddresses.map((addressEntry: any) => ({
        ...this.omitFields(addressEntry),
        address: {
          ...this.omitFields(addressEntry.address),
          addressType: {
            id: addressEntry?.address?.addressType?.id,
            lookUpValue: addressEntry?.address?.addressType?.lookUpValue,
          },
        },
      })),
      stateGstDetails: company?.stateGstDetails.map(
        ({ companyId, ...gstDetails }: any) => ({
          ...this.omitFields(gstDetails),
          gstCategory: {
            id: gstDetails?.gstCategory?.id,
            lookUpValue: gstDetails?.gstCategory?.lookUpValue,
          },
        })
      ),
      companyDocMaps: company?.companyDocMaps.map(
        ({ companyId, ...docMap }: any) => ({
          ...this.omitFields(docMap),
        })
      ),
      contacts: company.contacts?.map((contact: any) => ({
        id: contact?.id,
        firstName: contact?.firstName,
        lastName: contact?.lastName,
        middleName: contact?.middleName,
        displayName: contact?.displayName,
        salutation: {
          id: contact?.salutation?.id,
          lookUpValue: contact?.salutation?.lookUpValue,
        },
        tag: {
          id: contact?.tag?.id,
          lookUpValue: contact?.tag?.lookUpValue,
        },
        status: {
          id: contact?.status?.id,
          lookUpValue: contact?.status?.lookUpValue,
        },
        communicationDetails: contact?.communicationDetails?.map(
          (communication: any) => ({
            id: communication?.id,
            communicationType: communication?.communicationType,
            communicationDetails: communication?.communicationDetails,
            isPrimary: communication?.isPrimary,
          })
        ),
        owner: {
          userId: contact?.owner?.userId,
          firstName: contact?.owner?.firstName,
          lastName: contact?.owner?.lastName,
        },
        department: contact?.department ?? null,
        designation: contact?.designation ?? null,
      })),
      statusLid: undefined,
      priorityLid: undefined,
      industrySegmentLid: undefined,
      currencyId: undefined,
      companyTypeLid: undefined,
      groupCompanyLid: undefined,
      leadCrm: undefined,
      accountManager: undefined,
      sentimentLid: undefined,
      sourceTypeLid: undefined,
      countryId: undefined,
      companyContactMaps: undefined,
      groupCompanyMap: company?.groupCompanyMaps?.[0]
        ? {
            groupCompanyId: company?.groupCompanyMaps[0]?.groupCompanyId,
            groupCompanyName:
              company?.groupCompanyMaps[0]?.groupCompany?.companyName,
          }
        : null,
      groupCompanyMaps: undefined,
      salesOpportunityCount: companyAnalytics?.soCount || 0,
      renewalOpportunityCount: companyAnalytics?.roCount || 0,
      policyCount: companyAnalytics?.policyCount || 0,
      annualPremium: company?.annualPremium
        ? Number(company?.annualPremium)
        : null,
      soPremium: companyAnalytics?.soTotalPremium || 0,
      roPremium: companyAnalytics?.roTotalPremium || 0,
      policyPremium: companyAnalytics?.policyTotalPremium || 0,
      sumInsured: companyAnalytics?.totalSumInsured || 0,
      currency: {
        id: company?.currency?.id,
        name: company?.currency?.name,
        value: company?.currency?.value,
      },
      leadCrmInfo: company?.owner?.userId
        ? {
            id: company?.owner?.userId,
            name: `${company?.owner?.firstName} ${company?.owner?.lastName}`.trim(),
          }
        : null,
      accountManagerInfo: company?.accountManagerInfo?.userId
        ? {
            id: company?.accountManagerInfo?.userId,
            name: `${company?.accountManagerInfo?.firstName} ${company?.accountManagerInfo?.lastName}`.trim(),
          }
        : null,
      associateCrmInfo: company?.associateCrmInfo?.userId
        ? {
            id: company?.associateCrmInfo?.userId,
            name: `${company?.associateCrmInfo?.firstName} ${company?.associateCrmInfo?.lastName}`.trim(),
          }
        : null,
      associateCrmMgrInfo: company?.associateCrmMgrInfo?.userId
        ? {
            id: company?.associateCrmMgrInfo?.userId,
            name: `${company?.associateCrmMgrInfo?.firstName} ${company?.associateCrmMgrInfo?.lastName}`.trim(),
          }
        : null,
      centralOpsTeamLeadInfo: company?.centralOpsTeamLeadInfo?.userId
        ? {
            id: company?.centralOpsTeamLeadInfo?.userId,
            name: `${company?.centralOpsTeamLeadInfo?.firstName} ${company?.centralOpsTeamLeadInfo?.lastName}`.trim(),
          }
        : null,
      centralOpsLeadInfo: company?.centralOpsLeadInfo?.userId
        ? {
            id: company?.centralOpsLeadInfo?.userId,
            name: `${company?.centralOpsLeadInfo?.firstName} ${company?.centralOpsLeadInfo?.lastName}`.trim(),
          }
        : null,
      sentiment: company?.sentiment
        ? {
            id: company?.sentiment?.id,
            lookUpValue: company?.sentiment?.lookUpValue,
          }
        : null,
      previousInsurer: "",
      previousTpa: "",
      previousBroker: "",
      salesOpportunityBeyondTheQuarterCount: 0,
      renewalOpportunityBeyondTheQuarterCount: 0,
      policyLocations: [],
      // policyLocations: company?.policyConfigurationLocations?.map((loc: any) => ({
      //   id: loc.id,
      //   addressId: loc.addressId,
      //   isPrimary: loc.isPrimary,
      //   address: loc.address ? this.omitFields(loc.address) : null,
      // })) ?? [],
    }));
  }

  private omitFields(entity: Record<string, any>) {
    if (!entity) {
      return {};
    }
    const { createdAt, updatedAt, deletedAt, createdBy, updatedBy, ...rest } =
      entity || {};
    return rest;
  }

  // Get analytics for a specific company.
  async getCompanyAnalytics(
    companyId: number,
    soTypeLid: number,
    roTypeLid: number
  ) {
    try {
      const [soData, roData, sumInsuredResult, policyData, claimData] =
        await Promise.all([
          // Get SO (Sales Opportunity) count and premium
          this.opportunityRepository
            .createQueryBuilder("opportunity")
            .select("COUNT(opportunity.id)", "soCount")
            .addSelect("SUM(opportunity.premiumPaid)", "soTotalPremium")
            .where("opportunity.companyId = :companyId", { companyId })
            .andWhere("opportunity.opportunityTypeLid = :soTypeLid", {
              soTypeLid,
            })
            .getRawOne(),

          // Get RO (Renewal Opportunity) count and premium
          this.opportunityRepository
            .createQueryBuilder("opportunity")
            .select("COUNT(opportunity.id)", "roCount")
            .addSelect("SUM(opportunity.premiumPaid)", "roTotalPremium")
            .where("opportunity.companyId = :companyId", { companyId })
            .andWhere("opportunity.opportunityTypeLid = :roTypeLid", {
              roTypeLid,
            })
            .getRawOne(),

          // Get total sum insured (across all opportunities)
          this.opportunityRepository
            .createQueryBuilder("opportunity")
            .select("SUM(opportunity.sumInsured)", "totalSumInsured")
            .where("opportunity.companyId = :companyId", { companyId })
            .getRawOne(),

          // Get policy count and premium
          this.policyRepository
            .createQueryBuilder("policy")
            .select("COUNT(policy.id)", "policyCount")
            .addSelect("SUM(policy.premiumAtInception)", "policyTotalPremium")
            .addSelect(`SUM(${brokerageAmountExpr("policy")})`, "brokerage")
            .where("policy.companyId = :companyId", { companyId })
            .getRawOne(),

          // Get total claim amount
          this.PolicyClaimRepository.createQueryBuilder("claim")
            .leftJoin("claim.policy", "policy")
            .select("SUM(claim.claimAmount)", "claimAmount")
            .where("policy.companyId = :companyId", { companyId })
            .getRawOne(),
        ]);

      return {
        soCount: parseInt(soData.soCount, 10) || 0,
        soTotalPremium: parseFloat(soData.soTotalPremium) || 0,
        roCount: parseInt(roData.roCount, 10) || 0,
        roTotalPremium: parseFloat(roData.roTotalPremium) || 0,
        totalSumInsured: parseFloat(sumInsuredResult.totalSumInsured) || 0,
        policyCount: parseInt(policyData.policyCount, 10) || 0,
        policyTotalPremium: parseFloat(policyData.policyTotalPremium) || 0,
        brokerage: parseFloat(policyData.brokerage) || 0,
        claimAmount: parseFloat(claimData.claimAmount) || 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch analytics for company ID ${companyId}`);
    }
  }

  private async determineColorKey(
    companyId: number,
    policyActiveStatusId?: number,
    lostStatusId?: number
  ): Promise<keyof typeof COMPANY_LIST_COLOUR> {
    if (this.companyRepository?.manager && policyActiveStatusId) {
      const activePolicy = await this.companyRepository.manager.findOne(
        Policy,
        {
          where: { companyId, policyStatusLid: policyActiveStatusId },
        }
      );
      if (activePolicy) {
        return COMPANY_LIST_COLOUR.GREEN;
      }
    }

    if (this.opportunityRepository) {
      const where: FindOptionsWhere<Opportunity> = { companyId };
      if (lostStatusId) {
        where.statusLid = Not(lostStatusId);
      }
      const existingOpportunity = await this.opportunityRepository.findOne({
        where,
      });
      if (existingOpportunity) {
        return COMPANY_LIST_COLOUR.AMBER;
      }
    }

    return COMPANY_LIST_COLOUR.RED;
  }

  async createGroupCompanyMap(
    entityManager: EntityManager,
    groupCompanyMapData: Partial<GroupCompanyMap>
  ): Promise<GroupCompanyMap> {
    try {
      const groupCompanyMap = entityManager.create(
        GroupCompanyMap,
        groupCompanyMapData
      );
      return await entityManager.save(groupCompanyMap);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes("violates foreign key constraint")
      ) {
        throw new NotFoundException(errorMessages.groupComanyNotFound);
      }
      throw new Error(errorMessages.groupCompanyCreationFailed);
    }
  }

  async createCompanyDocMap(
    entityManager: EntityManager,
    companyDocMapData: Partial<CompanyDocMap>
  ): Promise<CompanyDocMap> {
    try {
      const companyDocMap = entityManager.create(
        CompanyDocMap,
        companyDocMapData
      );
      return await entityManager.save(companyDocMap);
    } catch (error) {
      throw new Error(errorMessages.companyDocCreationFailed);
    }
  }

  async updateGstDetail(
    entityManager: EntityManager,
    gstData: Partial<StateGstDetail>
  ): Promise<StateGstDetail> {
    try {
      const existingGst = await entityManager.findOne(StateGstDetail, {
        where: { id: gstData.id },
      });

      if (existingGst) {
        await entityManager.update(StateGstDetail, { id: gstData.id }, gstData);
        const updatedGst = await entityManager.findOne(StateGstDetail, {
          where: { id: gstData.id },
        });
        if (!updatedGst) {
          throw new NotFoundException(
            `GST detail with ID ${gstData.id} not found`
          );
        }
        return updatedGst;
      } else {
        const newGst = entityManager.create(StateGstDetail, gstData);
        return await entityManager.save(newGst);
      }
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const constraint = (error as any).constraint;
        if (constraint === DUPLICATE_CONSTRAINT.duplicateGstinEntry) {
          throw new Error(errorMessages.DuplicateGstinEntry);
        }
      }
      throw error;
    }
  }

  async createOrUpdateGroupCompanyMap(
    entityManager: EntityManager,
    groupCompanyMapData: Partial<GroupCompanyMap>
  ): Promise<GroupCompanyMap> {
    try {
      // Validate existence of group_company_id and company_id
      const groupCompanyExists = await entityManager.findOne(Company, {
        where: { id: groupCompanyMapData.groupCompanyId },
      });
      const companyExists = await entityManager.findOne(Company, {
        where: { id: groupCompanyMapData.companyId },
      });

      if (!groupCompanyExists) {
        throw new NotFoundException(
          `GroupCompany with ID ${groupCompanyMapData.groupCompanyId} not found`
        );
      }
      if (!companyExists) {
        throw new NotFoundException(
          `Company with ID ${groupCompanyMapData.companyId} not found`
        );
      }

      // Check if a mapping already exists for the company
      const existingGroupCompanyMap = await entityManager.findOne(
        GroupCompanyMap,
        {
          where: { companyId: groupCompanyMapData.companyId },
        }
      );

      if (existingGroupCompanyMap) {
        // Update the existing mapping
        await entityManager.update(
          GroupCompanyMap,
          { id: existingGroupCompanyMap.id },
          groupCompanyMapData
        );
        const updatedGroupCompanyMap = await entityManager.findOne(
          GroupCompanyMap,
          { where: { id: existingGroupCompanyMap.id } }
        );
        if (!updatedGroupCompanyMap) {
          throw new NotFoundException(
            `GroupCompanyMap with ID ${existingGroupCompanyMap.id} not found`
          );
        }
        return updatedGroupCompanyMap;
      } else {
        // Validate existence of group_company_id and company_id
        const groupCompanyExists = await entityManager.findOne(Company, {
          where: { id: groupCompanyMapData.groupCompanyId },
        });
        const companyExists = await entityManager.findOne(Company, {
          where: { id: groupCompanyMapData.companyId },
        });

        if (!groupCompanyExists) {
          throw new NotFoundException(
            `GroupCompany with ID ${groupCompanyMapData.groupCompanyId} not found`
          );
        }
        if (!companyExists) {
          throw new NotFoundException(
            `Company with ID ${groupCompanyMapData.companyId} not found`
          );
        }

        // Create new group company map
        return this.createGroupCompanyMap(entityManager, groupCompanyMapData);
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "createOrUpdateGroupCompanyMap",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async deleteGroupCompanyMap(entityManager: EntityManager, companyId: number) {
    try {
      const deletingGroupCompany = await entityManager.delete(GroupCompanyMap, {
        companyId: companyId,
      });
      return deletingGroupCompany;
    } catch (error) {
      throw new NotFoundException(
        `GroupCompanyMap with companyId ${companyId} not found`
      );
    }
  }

  async createOrUpdateCompanyDocMap(
    entityManager: EntityManager,
    companyDocMapData: Partial<CompanyDocMap>
  ): Promise<CompanyDocMap> {
    try {
      // Check if the document ID exists in the fileupload table

      const documentExists = await entityManager
        .getRepository(FileUpload)
        .findOne({
          where: { id: companyDocMapData.documentId },
        });
      if (!documentExists) {
        throw new NotFoundException(
          `Document with ID ${companyDocMapData.documentId} not found in fileupload table`
        );
      }

      if (companyDocMapData.id) {
        // Update existing document map
        await entityManager.update(
          CompanyDocMap,
          { id: companyDocMapData.id },
          companyDocMapData
        );
        const companyDocMap = await entityManager.findOne(CompanyDocMap, {
          where: { id: companyDocMapData.id },
        });
        if (!companyDocMap) {
          throw new NotFoundException(
            `CompanyDocMap with ID ${companyDocMapData.id} not found`
          );
        }
        return companyDocMap;
      } else {
        return this.createCompanyDocMap(entityManager, companyDocMapData);
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "createOrUpdateCompanyDocMap",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async CompanyList(
    page: number,
    limit: number,
    search: string,
    userId: number,
    entityIds?: number[]
  ): Promise<{ data: Company[]; count: number }> {
    try {
      const status = await this.lookUpRepository.findOne({
        where: { lookUpKey: DEFAULT_COMPANY_STATUS_ACTIVE },
      });
      const user = await this.companyRepository.manager.findOne(User, {
        where: { userId },
        relations: ["organisation"],
      });
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyRepository",
          method: "CompanyList",
          messageData: `Status: ${JSON.stringify(status)}`,
        }),
      });

      // Use QueryBuilder to fetch companies with pagination, search, and country relation
      const queryBuilder = this.companyRepository
        .createQueryBuilder("company")
        .leftJoinAndSelect("company.country", "country");

      if (status?.id !== undefined) {
        queryBuilder.andWhere("company.statusLid = :statusLid", {
          statusLid: status.id,
        });
      }
      if (user?.organisation?.countryId !== undefined) {
        queryBuilder.andWhere("company.countryId = :countryId", {
          countryId: user.organisation.countryId,
        });
      }
      // Use fuzzy search for companyName and displayName
      if (search) {
        // queryBuilder.andWhere(
        //   "(similarity(company.displayName, :search) > 0 OR similarity(company.companyName, :search) > 0)",
        //   { search }
        // );
        queryBuilder.andWhere(
          "(company.displayName ILIKE :search OR company.companyName ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      queryBuilder
        .select([
          "company.id",
          "company.companyName",
          "company.displayName",
          "country",
        ])
        .orderBy("company.companyName", "ASC")
        .skip((page - 1) * limit)
        .take(limit);

      const [data, count] = await queryBuilder.getManyAndCount();
      let finalData = data;
      if (entityIds && entityIds.length > 0) {
        const existingCompanyIds = new Set(data.map((r) => r.id));
        const missingCompanyIds = entityIds.filter(
          (id) => !existingCompanyIds.has(id)
        );
        if (missingCompanyIds.length > 0) {
          const additional = await this.companyRepository.find({
            where: { id: In(missingCompanyIds) },
            relations: ["country"],
            select: ["id", "companyName", "displayName", "country"],
          });
          finalData = finalData.concat(additional);
        }
      }
      return { data: finalData, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "CompanyList",
          messageData: error,
        }),
      });
      throw new Error("Failed to fetch company name list");
    }
  }
  async getCompanyListData(
    fields: string[],
    relations: string | string[],
    whereCondition: FindOptionsWhere<Company>,
    contactId?: number,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      const entityName = DEFAULT_COMPANY_ENTITY_NAME;
      let statusKey, statusLid;
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
      }
      const data = await this.entityService.getListOfValues(
        entityName,
        fields,
        whereCondition,
        relations
      );
      return this.transformResponse(data, contactId, statusLid);
    } catch (error) {
      return error;
    }
  }

  async getContactsByCompanyId(
    companyId: number,
    page: number,
    limit: number,
    search: string,
    status?: "ACTIVE" | "INACTIVE"
  ) {
    try {
      let statusKey, statusLid;
      const whereCondition: Record<string, any> = {
        companyId,
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
        "CompanyContactMap", // Entity name
        page,
        limit,
        [{ field: "id", order: "ASC" }], // Sort options
        ["contact", "contact.status"], // Relations
        whereCondition, // Filter by Company ID
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
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch contacts for company ID ${companyId}: ${error.message}`
      );
    }
  }

  async getDocumentsByCompanyId(
    companyId: number,
    page: number,
    limit: number,
    searchArray?: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    searchBy?: string,
    fromDate?: Date,
    toDate?: Date,
    field?: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyRepository",
          method: "getDocumentsByCompanyId",
          payload: {
            companyId,
            page,
            limit,
            searchArray,
            searchBy,
            fromDate,
            toDate,
            field,
          },
          messageData: "method invoked",
        }),
      });
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }
      let dateFilter;
      if (fromDate || toDate) {
        dateFilter = {
          field: field ?? DEFAULT_DATE_FILTER_FIELD,
          from: fromDate,
          to: toDate,
        };
      }
      const { data, count } = await this.entityService.fetchEntityList(
        "FileUpload", // Entity name
        page,
        limit,
        [{ field: "id", order: "ASC" }], // Sort options
        ["documentType"], // Relations
        { entityId: companyId }, // Filter by Company ID
        [
          "id",
          "fileKey",
          "documentType.id",
          "documentType.lookUpValue",
          "createdAt",
        ], // Select fields
        searchArray, // Search array
        undefined, // User filter
        searchBy, // Search string
        fileSearchObject, // Search on
        dateFilter && Object.keys(dateFilter).length > 0
          ? (dateFilter as { field: string; from: Date; to?: Date })
          : undefined,
        undefined,
        true
      );
      return { data, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "getDocumentsByCompanyId",
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
        `Failed to fetch documents for company ID ${companyId}: ${error.message}`
      );
    }
  }

  async getLocationsByCompanyId(
    companyId: number,
    page: number,
    limit: number,
    searchArray?: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    searchBy?: string,
    fromDate?: Date,
    toDate?: Date,
    field?: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyRepository",
          method: "getLocationsByCompanyId",
          payload: {
            companyId,
            page,
            limit,
            searchArray,
            searchBy,
            fromDate,
            toDate,
            field,
          },
          messageData: "method invoked",
        }),
      });
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }
      let dateFilter;
      if (fromDate || toDate) {
        dateFilter = {
          field: field ?? DEFAULT_DATE_FILTER_FIELD,
          from: fromDate,
          to: toDate,
        };
      }
      const { data, count } = await this.entityService.fetchEntityList(
        "CompanyAddress", // Entity name
        page,
        limit,
        [{ field: "id", order: "ASC" }], // Sort options
        ["address", "address.cityId", "address.stateId"], // Relations
        { companyId }, // Filter by Company ID
        undefined, // Select fields
        searchArray, // Search array
        undefined, // User filter
        searchBy, // Search string
        companyLocationSearchObject, // Search on
        dateFilter && Object.keys(dateFilter).length > 0
          ? (dateFilter as { field: string; from: Date; to?: Date })
          : undefined,
        undefined,
        true
      );
      return { data, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "getLocationsByCompanyId",
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
        `Failed to fetch locations for company ID ${companyId}: ${error.message}`
      );
    }
  }

  async transformResponse(
    data: any,
    contactId?: number,
    statusLid?: number
  ): Promise<any> {
    if (!data) return null;

    return {
      id: data?.id,
      companyName: data?.companyName,
      displayName: data?.displayName,

      companyAddresses: (data?.companyAddresses || []).map((address: any) => ({
        id: address?.address?.id,
        address1: address?.address?.address1,
        cityId: {
          id: address?.address?.cityId?.id,
          name: address?.address?.cityId?.name,
        },
      })),

      contacts: (data?.companyContactMaps || [])
        .filter(
          (companyContact: any) =>
            (!contactId || contactId !== companyContact?.contact?.id) &&
            (!statusLid || companyContact?.contact?.status?.id === statusLid)
        )
        .map((companyContact: any) => ({
          id: companyContact?.contact?.id,
          firstName: companyContact?.contact?.firstName,
          lastName: companyContact?.contact?.lastName,
          middleName: companyContact?.contact?.middleName,
          displayName: companyContact?.contact?.displayName,
          status: companyContact?.contact?.status?.lookUpValue,
        })),
    };
  }

  async fetchByCompanyId(companyId: number): Promise<Company | null> {
    return await this.companyRepository.findOne({
      where: { id: companyId },
    });
  }

  async getCompanies(
    page: number,
    limit: number,
    userId: number,
    search?: string
  ) {
    try {
      const relations = ["status", "country"];
      const sort = [{ field: "companyName", order: "ASC" as const }];
      const trimmedSearch = search?.trim();

      const formatResponse = async (companies: Company[]) => {
        const parentIds = companies.map((company) => company.id);
        const childCompaniesMap = await this.buildChildCompanyMap(
          parentIds,
          trimmedSearch
        );

        return companies.map((company) => ({
          id: company.id,
          companyName: company.companyName,
          country: company.country ? company.country.name : null,
          status: company.status?.lookUpValue || "INACTIVE",
          childCompanies: childCompaniesMap.get(company.id) || [],
        }));
      };

      if (trimmedSearch) {
        // const matchingCompanies = await this.companyRepository.find({
        //   select: ["id"],
        //   where: { companyName: ILike(`%${trimmedSearch}%`) },
        // });
        const matchingCompanies = await this.companyRepository
          .createQueryBuilder("company")
          .select("company.id")
          .where("similarity(company.companyName, :search) > 0.2", {
            search: trimmedSearch,
          })
          .getMany();

        if (!matchingCompanies.length) {
          return { data: [], count: 0 };
        }

        const matchingCompanyIds = matchingCompanies.map(
          (company) => company.id
        );

        const matchingChildMaps = await this.groupCompanyMapRepository.find({
          select: ["companyId", "groupCompanyId"],
          where: { companyId: In(matchingCompanyIds) },
        });

        const childCompanyIds = new Set(
          matchingChildMaps
            .map((map) => map.companyId)
            .filter((id): id is number => typeof id === "number")
        );

        const parentIds = new Set<number>();

        matchingChildMaps.forEach((map) => {
          if (map.groupCompanyId) {
            parentIds.add(map.groupCompanyId);
          }
        });

        matchingCompanyIds.forEach((id) => {
          if (!childCompanyIds.has(id)) {
            parentIds.add(id);
          }
        });

        if (!parentIds.size) {
          return { data: [], count: 0 };
        }

        const whereClause: FindOptionsWhere<Company> = {
          id: In(Array.from(parentIds)),
        };

        const { data, count } = await this.scopeService.validateMasterScope(
          {
            entity: DEFAULT_COMPANY_ENTITY_NAME,
            page,
            limit,
            sort,
            relations,
            where: whereClause,
          },
          userId,
          DEFAULT_COMPANY_ENTITY_NAME
        );

        const formattedData = await formatResponse(data);

        return {
          data: formattedData,
          count,
        };
      }

      const childCompanyMappings = await this.groupCompanyMapRepository.find({
        select: ["companyId"],
      });

      const childCompanyIds = Array.from(
        new Set(
          childCompanyMappings
            .map((map) => map.companyId)
            .filter((id): id is number => typeof id === "number")
        )
      );

      const whereClause = childCompanyIds.length
        ? ({ id: Not(In(childCompanyIds)) } as FindOptionsWhere<Company>)
        : undefined;

      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: DEFAULT_COMPANY_ENTITY_NAME,
          page,
          limit,
          sort,
          relations,
          where: whereClause,
        },
        userId,
        DEFAULT_COMPANY_ENTITY_NAME
      );

      const formattedData = await formatResponse(data);

      return {
        data: formattedData,
        count,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "findCompanyNameList",
          messageData: error,
        }),
      });
      throw new Error("Failed to fetch company name list");
    }
  }
  private async buildChildCompanyMap(
    parentIds: number[],
    search?: string
  ): Promise<
    Map<
      number,
      Array<{
        id: number;
        companyName: string;
        country: string | null;
        status: string;
      }>
    >
  > {
    if (!parentIds.length) {
      return new Map();
    }

    try {
      // Step 1: Get child mappings without relations (fastest query)
      const childMappings = await this.groupCompanyMapRepository.find({
        select: ["id", "companyId", "groupCompanyId"],
        where: { groupCompanyId: In(parentIds) },
      });

      if (!childMappings.length) {
        return new Map();
      }

      // Extract unique child company IDs
      const childCompanyIds = [
        ...new Set(childMappings.map((mapping) => mapping.companyId)),
      ];

      // Step 2: Get all company data in batch
      const companies = await this.companyRepository.find({
        select: ["id", "companyName", "countryId", "statusLid"],
        where: { id: In(childCompanyIds) },
      });

      // Step 3: Get lookup data for statuses
      const statusLookups = await this.lookUpRepository.find({
        select: ["id", "lookUpValue"],
        where: {
          lookUpKey: In([
            DEFAULT_COMPANY_STATUS_ACTIVE,
            DEFAULT_COMPANY_STATUS_INACTIVE, // Add the inactive status key constant
          ]),
        },
      });

      // Step 4: Get country data
      const uniqueCountryIds = [
        ...new Set(
          companies
            .map((company) => company.countryId)
            .filter((countryId) => countryId != null)
        ),
      ];

      let countries: any[] = [];
      if (uniqueCountryIds.length > 0) {
        countries = await this.companyRepository.manager.find("Country", {
          select: ["id", "name"],
          where: { id: In(uniqueCountryIds) },
        });
      }

      // Step 5: Create lookup maps for O(1) access
      const companyMap = new Map(
        companies.map((company) => [company.id, company])
      );
      const statusMap = new Map(
        statusLookups.map((status) => [status.id, status.lookUpValue])
      );
      const countryMap = new Map(
        countries.map((country) => [country.id, country.name])
      );

      // Step 6: Build the result map
      const normalizedSearch = search?.toLowerCase();
      const childCompaniesByParent = new Map<
        number,
        Array<{
          id: number;
          companyName: string;
          country: string | null;
          status: string;
        }>
      >();

      childMappings.forEach((mapping) => {
        const parentId = mapping.groupCompanyId;
        const childCompany = companyMap.get(mapping.companyId);

        if (!parentId || !childCompany) {
          return;
        }

        // Apply search filter if provided
        if (
          normalizedSearch &&
          !childCompany.companyName.toLowerCase().includes(normalizedSearch)
        ) {
          return;
        }

        const formattedChild = {
          id: childCompany.id,
          companyName: childCompany.companyName,
          country: childCompany.countryId
            ? countryMap.get(childCompany.countryId) || null
            : null,
          status: childCompany.statusLid
            ? statusMap.get(childCompany.statusLid) || "INACTIVE"
            : "INACTIVE",
        };

        if (!childCompaniesByParent.has(parentId)) {
          childCompaniesByParent.set(parentId, []);
        }

        childCompaniesByParent.get(parentId)?.push(formattedChild);
      });

      // Step 7: Sort child companies alphabetically
      childCompaniesByParent.forEach((children) => {
        children.sort((a, b) => a.companyName.localeCompare(b.companyName));
      });

      return childCompaniesByParent;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "buildChildCompanyMap",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        `Failed to build child company map: ${error.message}`
      );
    }
  }

  async findCompaniesByOwnerIds(
    userIds: number[],
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    data: {
      companyId: number;
      companyName: string;
      displayName: string | null;
    }[];
    count: number;
  }> {
    if (!userIds.length) {
      return { data: [], count: 0 };
    }

    try {
      type RawCompanyRow = {
        companyId: number | null;
        displayName: string | null;
        companyName: string | null;
      };

      const rows = await this.companyRepository
        .createQueryBuilder("company")
        .select([
          'company.id AS "companyId"',
          'company.displayName AS "displayName"',
          'company.companyName AS "companyName"',
        ])
        .where(
          "(company.leadCrm IN (:...userIds) OR (company.leadCrm IS NULL AND company.createdBy IN (:...userIds)))",
          { userIds }
        )
        .orderBy("COALESCE(company.displayName, company.companyName)", "ASC")
        .getRawMany<RawCompanyRow>();

      const validRows = rows.filter(
        (row): row is RawCompanyRow & { companyId: number } =>
          row.companyId !== null
      );

      const mappedRows = validRows.map((row) => {
        const displayName = row.displayName ?? null;
        return {
          companyId: Number(row.companyId),
          companyName: displayName ?? row.companyName ?? "",
          displayName,
        };
      });

      const normalizedSearch = search?.trim().toLowerCase();
      const filteredRows = normalizedSearch
        ? mappedRows.filter((row) => {
            const comparableValues = [row.companyName, row.displayName ?? ""];
            return comparableValues.some((value) =>
              value.toLowerCase().includes(normalizedSearch)
            );
          })
        : mappedRows;

      const startIndex = (page - 1) * limit;
      const paginatedRows = filteredRows.slice(startIndex, startIndex + limit);

      return {
        data: paginatedRows,
        count: filteredRows.length,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "findCompaniesByOwnerIds",
          payload: { userIds },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.companyListFailed);
    }
  }

  async getGroupCompanies(
    entityManager: EntityManager,
    page: number,
    limit: number,
    search: string,
    countryId: number
  ): Promise<{ data: Partial<Company>[]; count: number }> {
    try {
      const statusLid = (
        await this.lookUpRepository.findOne({
          where: { lookUpKey: DEFAULT_COMPANY_STATUS_ACTIVE },
        })
      )?.id;
      const childCompanies = await entityManager.find(GroupCompanyMap, {
        select: ["companyId"], // Select only the companyId column
      });
      const childCompanyIds = childCompanies.map((child) => child.companyId);
      const { data, count } = await this.entityService.fetchEntityList(
        DEFAULT_COMPANY_ENTITY_NAME,
        page,
        limit,
        [{ field: "companyName", order: "ASC" }],
        [],
        {
          id: Not(In(childCompanyIds)),
          countryId: countryId,
          statusLid: statusLid ? statusLid : undefined,
        },
        ["id", "companyName", "displayName"],
        undefined,
        undefined,
        search,
        ["companyName"]
      );
      return {
        data: data,
        count: count,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "getGroupCompanies",
          messageData: error,
        }),
      });
      throw new Error(errorMessages.groupCompanyListNotFound);
    }
  }

  async getCountryId(
    entityManager: EntityManager,
    userId: number
  ): Promise<number> {
    const user = await entityManager.findOne(User, {
      where: { userId },
      relations: [
        "branch",
        "branch.organisation",
        "branch.organisation.country",
        "organisation",
        "organisation.country",
      ],
    });
    if (!user) {
      throw new NotFoundException(infoMessages.userNotFoundWithId(userId));
    }
    if (user?.branch?.organisation?.country) {
      return user.branch.organisation.country.id;
    }
    if (user?.organisation?.country) {
      return user.organisation.country.id;
    }
    if (user?.organisation?.countryId) {
      return user.organisation.countryId;
    }
    return null;
  }

  async getCurrencyId(
    entityManager: EntityManager,
    countryId: number
  ): Promise<number> {
    const currency = await entityManager.findOne(Currency, {
      where: { countryId: countryId },
      relations: ["country"],
    });
    if (!currency) {
      throw new NotFoundException(
        `Currency not found for the given country ID ${countryId}`
      );
    }
    return currency.id;
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

  async updateEntityTableMapIds(
    entity: string,
    updateData: any,
    whereCondition: any
  ): Promise<any> {
    try {
      const result = await this.entityService.updateEntityFieldsByWhere(
        entity,
        updateData,
        whereCondition
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error);
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

  async isPriorityCompany(
    entityManager: EntityManager,
    companyPriorityId?: number
  ): Promise<boolean> {
    if (!companyPriorityId) return false;

    try {
      const match = await entityManager.findOne(LookUp, {
        where: {
          id: companyPriorityId,
          lookUpKey: In([PRIORITY_VIMP, PRIORITY_HIGH, PRIORITY_IMP]),
        },
        select: ["id"],
      });

      return !!match;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getCompanyProfile(companyId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyRepository",
          method: "getCompanyProfile",
          payload: { companyId },
          messageData: "method invoked",
        }),
      });

      const soOpportunityType = await this.lookUpRepository.findOne({
        where: { lookUpKey: OPPORTUNITY_TYPE.SO },
      });
      if (!soOpportunityType) {
        throw new NotFoundException(
          `Lookup value for ${OPPORTUNITY_TYPE.SO} not found`
        );
      }

      const roOpportunityType = await this.lookUpRepository.findOne({
        where: { lookUpKey: OPPORTUNITY_TYPE.RO },
      });
      if (!roOpportunityType) {
        throw new NotFoundException(
          `Lookup value for ${OPPORTUNITY_TYPE.RO} not found`
        );
      }

      const policyQuery = this.policyRepository
        .createQueryBuilder("policy")
        .select("COUNT(policy.id)", "policyCount")
        .addSelect("COALESCE(SUM(policy.netPremium), 0)", "policyPremiumTotal")
        .addSelect(
          `COALESCE(SUM(${brokerageAmountExpr("policy")}), 0)`,
          "policyBrokerageTotal"
        )
        .where("policy.companyId = :companyId", { companyId });

      const soQuery = this.opportunityRepository
        .createQueryBuilder("opportunity")
        .select("COUNT(opportunity.opportunityId)", "count")
        .addSelect("COALESCE(SUM(opportunity.premiumPaid), 0)", "premium")
        .where("opportunity.companyId = :companyId", { companyId })
        .andWhere("opportunity.opportunityTypeLid = :soType", {
          soType: soOpportunityType.id,
        });

      const roQuery = this.opportunityRepository
        .createQueryBuilder("opportunity")
        .select("COUNT(opportunity.opportunityId)", "count")
        .addSelect("COALESCE(SUM(opportunity.premiumPaid), 0)", "premium")
        .where("opportunity.companyId = :companyId", { companyId })
        .andWhere("opportunity.opportunityTypeLid = :roType", {
          roType: roOpportunityType.id,
        });

      const claimQuery = this.PolicyClaimRepository.createQueryBuilder("claim")
        .innerJoin(Policy, "policy", "policy.id = claim.policyId")
        .select("COUNT(claim.id)", "totalClaim")
        .addSelect("COALESCE(SUM(claim.claimAmount), 0)", "totalClaimAmount")
        .where("policy.companyId = :companyId", { companyId });

      const [policyAgg, soAgg, roAgg, claimAgg] = await Promise.all([
        policyQuery.getRawOne(),
        soQuery.getRawOne(),
        roQuery.getRawOne(),
        claimQuery.getRawOne(),
      ]);

      return {
        policyCount: Number(policyAgg?.policyCount) || 0,
        policyPremiumTotal: Number(policyAgg?.policyPremiumTotal) || 0,
        policyBrokerageTotal: Number(policyAgg?.policyBrokerageTotal) || 0,
        soCount: Number(soAgg?.count) || 0,
        soPremium: Number(soAgg?.premium) || 0,
        roCount: Number(roAgg?.count) || 0,
        roPremium: Number(roAgg?.premium) || 0,
        totalClaim: Number(claimAgg?.totalClaim) || 0,
        totalClaimAmount: Number(claimAgg?.totalClaimAmount) || 0,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "getCompanyProfile",
          payload: { companyId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        `Failed to fetch company profile: ${error.message}`
      );
    }
  }
  async findAllCompanyIds(
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    userId: number,
    searchBy: string,
    field?: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    data: any[];
    count: number;
  }> {
    try {
      const relations = [
        "companyType",
        "industrySegment",
        "companyAddresses",
        "companyAddresses.address",
        "companyAddresses.address.cityId",
        "companyAddresses.address.countryId",
        "priority",
        "sentiment",
        "owner",
        "accountManagerInfo",
        "currency",
        "country",
        "status",
      ];
      var dateFilter: any;
      if (fromDate || toDate) {
        dateFilter = {
          field: field ?? DEFAULT_DATE_FILTER_FIELD,
          from: fromDate,
          to: toDate,
        };
      }
      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: DEFAULT_COMPANY_ENTITY_NAME,
          page,
          limit,
          sort:
            sort && sort.length > 0
              ? sort
              : [{ field: "updatedAt", order: "DESC" }],
          relations: relations,
          where: undefined,
          select: undefined,
          searchArray:
            searchArray && searchArray.length === 0 ? [] : searchArray,
          userFilter: undefined,
          searchString: searchBy,
          searchOn: companySearchObject,
          dateFilter:
            dateFilter && Object.keys(dateFilter).length > 0
              ? (dateFilter as { field: string; from: Date; to?: Date })
              : undefined,
          period: undefined,
        },
        userId,
        DEFAULT_COMPANY_ENTITY_NAME
      );
      const { data: allCompanyData } =
        await this.scopeService.validateMasterScope(
          {
            entity: DEFAULT_COMPANY_ENTITY_NAME,
            page: 1,
            limit: count,
            sort: [{ field: "id", order: "ASC" }],
            relations: relations,
            where: undefined,
            select: ["id"],
            searchArray:
              searchArray && searchArray.length === 0 ? [] : searchArray,
            userFilter: undefined,
            searchString: searchBy,
            searchOn: companySearchObject,
          },
          userId,
          DEFAULT_COMPANY_ENTITY_NAME
        );
      const companyIds = allCompanyData.map((x) => x.id);
      return { data: companyIds, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "findAllCompanyIds",
          messageData: error,
        }),
      });
      throw error;
    }
  }
  async getFilteredCompanyIds(selectedFilters: any, userId: number) {
    try {
      let companyPayload: any = {};
      var searchArray: {
        searchBy: string;
        searchValue: string | number | Date | Array<string | number | Date>;
      }[] = [];
      companyPayload["page"] = 1;
      companyPayload["limit"] = 1;
      companyPayload["sort"] = [];
      companyPayload["userId"] = userId;
      if (selectedFilters.from && selectedFilters.to) {
        companyPayload["from"] = new Date(selectedFilters.from).toISOString();
        companyPayload["to"] = new Date(selectedFilters.to).toISOString();
      }
      companyPayload["field"] = "createdAt";
      if (selectedFilters.companyName1 && selectedFilters.companyName1 !== "") {
        companyPayload["searchBy"] = selectedFilters.companyName1;
      }
      if (selectedFilters.organisationId) {
        searchArray.push({
          searchBy: "owner.organisationId",
          searchValue: [selectedFilters.organisationId.value],
        });
      }
      if (selectedFilters.sbuId) {
        searchArray.push({
          searchBy: "owner.sbuId",
          searchValue: [selectedFilters.sbuId.value],
        });
      }
      if (selectedFilters.verticalId) {
        searchArray.push({
          searchBy: "owner.verticalId",
          searchValue: [selectedFilters.verticalId.value],
        });
      }
      if (selectedFilters.branchId) {
        searchArray.push({
          searchBy: "owner.branchId",
          searchValue: [selectedFilters.branchId.value],
        });
      }
      if (selectedFilters.companyType) {
        searchArray.push({
          searchBy: "companyType.lookUpValue",
          searchValue: [selectedFilters.companyType.value],
        });
      }
      if (selectedFilters.priority) {
        searchArray.push({
          searchBy: "priority.lookUpValue",
          searchValue: [selectedFilters.priority.value],
        });
      }
      if (selectedFilters.industrySegment) {
        searchArray.push({
          searchBy: "industrySegment.lookUpValue",
          searchValue: [selectedFilters.industrySegment.value],
        });
      }
      if (selectedFilters.city) {
        searchArray.push({
          searchBy: "companyAddresses.address.cityId.id",
          searchValue: [selectedFilters.city.value],
        });
      }
      if (selectedFilters.status) {
        searchArray.push({
          searchBy: "status.lookUpValue",
          searchValue: [selectedFilters.status.value],
        });
      }
      if (selectedFilters.viewBy && selectedFilters.ownerId) {
        if (selectedFilters.viewBy.value === "manager") {
          searchArray.push({
            searchBy: "owner.userId",
            searchValue: [selectedFilters.ownerId.value],
          });
        } else {
          searchArray.push({
            searchBy: "owner.userId",
            searchValue: selectedFilters.userIdsList,
          });
        }
      }
      if (selectedFilters.accountManager) {
        searchArray.push({
          searchBy: "accountManager",
          searchValue: [selectedFilters.accountManager.value],
        });
      }

      if (searchArray.length > 0) {
        companyPayload["searchArray"] = searchArray;
      }
      const companyIds = await this.findAllCompanyIds(
        companyPayload.page,
        companyPayload.limit,
        companyPayload.searchArray,
        companyPayload.sort,
        companyPayload.userId,
        companyPayload.searchBy,
        companyPayload.field,
        companyPayload.from,
        companyPayload.to
      );
      return companyIds.data;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "getFilteredCompanyIds",
          messageData: error,
        }),
      });
      throw error;
    }
  }
  async getUsersByCompanyIds(companyIds: number[]): Promise<
    {
      userId: number;
      companyIds: number[];
      leadCrmCount: number;
      priorityCount: number;
    }[]
  > {
    try {
      const leadCrmCount = 0,
        priorityCount = 0;
      if (!companyIds.length) {
        return [];
      }

      const companies = await this.companyRepository.find({
        where: {
          id: In(companyIds),
        },
        select: ["id", "leadCrm"],
      });
      const userCompanyMap = new Map<number, number[]>();

      companies.forEach((company) => {
        const userId = company.leadCrm;
        if (userId) {
          if (!userCompanyMap.has(userId)) {
            userCompanyMap.set(userId, []);
          }
          userCompanyMap.get(userId)!.push(company.id);
        }
      });

      return Array.from(userCompanyMap.entries()).map(
        ([userId, companyIds]) => ({
          userId,
          companyIds,
          leadCrmCount,
          priorityCount,
        })
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "getUsersByCompanyIds",
          messageData: error,
        }),
      });
      throw new Error("Failed to fetch users by company IDs");
    }
  }
  async getUsersByCompanyIdsFromAccountManager(companyIds: number[]): Promise<
    {
      userId: number;
      companyIds: number[];
      accountManagerCount: number;
    }[]
  > {
    try {
      const accountManagerCount = 0;
      if (!companyIds.length) {
        return [];
      }

      const companies = await this.companyRepository.find({
        where: {
          id: In(companyIds),
        },
        select: ["id", "accountManager"],
      });

      const userCompanyMap = new Map<number, number[]>();

      companies.forEach((company) => {
        const userId = company.accountManager;
        if (userId) {
          if (!userCompanyMap.has(userId)) {
            userCompanyMap.set(userId, []);
          }
          userCompanyMap.get(userId)!.push(company.id);
        }
      });

      return Array.from(userCompanyMap.entries()).map(
        ([userId, companyIds]) => ({
          userId,
          companyIds,
          accountManagerCount,
        })
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "getUsersByCompanyIdsFromAccountManager",
          messageData: error,
        }),
      });
      throw new Error(
        "Failed to fetch users by company IDs from account manager"
      );
    }
  }

  async findCompaniesWithPortalConfiguration(
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    data: {
      companyId: number;
      companyName: string;
      displayName: string | null;
    }[];
    count: number;
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyRepository",
          method: "findCompaniesWithPortalConfiguration",
          payload: { page, limit, search },
          messageData: "method invoked",
        }),
      });

      type RawCompanyRow = {
        companyId: number | null;
        displayName: string | null;
        companyName: string | null;
      };

      // Build base query: policy_configuration → policy → company
      // Filter by POLICY_CONFIGURATION_STATUS_LIVE to get companies that have a live config.
      const baseQuery = this.companyRepository.manager
        .createQueryBuilder()
        .select('DISTINCT c.id', 'companyId')
        .addSelect('c.display_name', 'displayName')
        .addSelect('c.company_name', 'companyName')
        .from('policy_configuration', 'pc')
        .innerJoin('policy', 'p', 'p.id = pc.policy_id')
        .innerJoin('company', 'c', 'c.id = p.company_id')
        .where(
          `pc.policy_configuration_status_lid = (SELECT id FROM lookup_data WHERE lookup_key = 'POLICY_CONFIGURATION_STATUS_LIVE' LIMIT 1)`
        )
        .andWhere('c.deleted_at IS NULL');

      let queryBuilder = baseQuery;

      // Add search filter if provided
      if (search && search.trim().length > 0) {
        const searchTerm = `%${search.trim()}%`;
        queryBuilder = queryBuilder.andWhere(
          "(LOWER(c.display_name) LIKE LOWER(:searchTerm) OR LOWER(c.company_name) LIKE LOWER(:searchTerm))",
          { searchTerm }
        );
      }

      // Get total count
      const rawCount = await queryBuilder.getRawMany();
      const totalCount = rawCount.length;

      // Apply pagination and ordering
      const rows = await queryBuilder
        .orderBy("c.display_name", "ASC")
        .addOrderBy("c.company_name", "ASC")
        .offset((page - 1) * limit)
        .limit(limit)
        .getRawMany<RawCompanyRow>();

      const validRows = rows.filter(
        (row): row is RawCompanyRow & { companyId: number } =>
          row.companyId !== null
      );

      const mappedRows = validRows.map((row) => {
        const displayName = row.displayName ?? null;
        return {
          companyId: Number(row.companyId),
          companyName: displayName ?? row.companyName ?? "",
          displayName,
        };
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyRepository",
          method: "findCompaniesWithPortalConfiguration",
          payload: { page, limit, search },
          messageData: `Found ${mappedRows.length} companies`,
        }),
      });

      return {
        data: mappedRows,
        count: totalCount,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyRepository",
          method: "findCompaniesWithPortalConfiguration",
          payload: { page, limit, search },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        "Failed to fetch companies with active policies"
      );
    }
  }
}
