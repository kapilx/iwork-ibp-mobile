import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import {
  Company,
  Endorsement,
  LookUp,
  Meeting,
  MirReport,
  Opportunity,
  OpportunityActivityMap,
  OrgServiceTatSummary,
  OrgServiceWeightage,
  Policy,
  PolicyAssetEndorsement,
  PolicyClaim,
  PolicyTypeSegregation,
  ServiceMaster,
  ServiceTatScoreMap,
  TatBucket,
} from "../../../../service-lib/src/lib/entities";
import { SERVICE_TAT_SERVICE_LIST } from "../../../../service-lib/src/lib/constants";
import {
  SERVICE_SCORE_CLAIM_STATUS,
  SERVICE_SCORE_ENDORSEMENT_EXTENSION_TYPE,
  SERVICE_SCORE_ENDORSEMENT_REQUEST_RECEIVED_STATUS,
  SERVICE_SCORE_HEALTH_POLICY_TYPE_VALUES,
  SERVICE_SCORE_MEETING_STATUS_COMPLETED_PATTERN,
  SERVICE_SCORE_MEETING_TYPE_LOOKUP_KEYS,
  SERVICE_SCORE_MIR_PUBLISHED_STATUS,
  SERVICE_SCORE_QCR_ACTIVITY_NAME_PATTERN,
  SERVICE_SCORE_SERVICE_NAMES,
} from "./service-tat.constants";

const ACTIVE_STATUS = "ACTIVE";

export interface ServiceTatBucketConfig {
  bucketId: number;
  startDay: number;
  endDay: number;
  tatWeight: number;
  isCompliant: boolean;
  label: string;
  displayOrder: number;
}

interface MonthlySummaryBaseParams {
  orgId: number;
  start: Date;
  end: Date;
  serviceIds: number[];
}

export interface ServiceScoreSourceEventRow {
  serviceName: string;
  createdAt: Date;
  eventDate: Date;
}

interface CompanyDateRangeParams {
  companyId: number;
  organisationId?: number;
  start: Date;
  end: Date;
}

interface ClaimEventRow {
  createdAt: Date;
  eventDate: Date;
  policyTypeValue: string | null;
}

@Injectable()
export class ServiceTatRepository {
  constructor(
    @InjectRepository(OrgServiceTatSummary)
    private readonly summaryRepository: Repository<OrgServiceTatSummary>,
    @InjectRepository(ServiceMaster)
    private readonly serviceRepository: Repository<ServiceMaster>,
    @InjectRepository(OrgServiceWeightage)
    private readonly weightageRepository: Repository<OrgServiceWeightage>,
    @InjectRepository(ServiceTatScoreMap)
    private readonly serviceTatScoreRepository: Repository<ServiceTatScoreMap>,
    @InjectRepository(TatBucket)
    private readonly tatBucketRepository: Repository<TatBucket>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Endorsement)
    private readonly endorsementRepository: Repository<Endorsement>,
    @InjectRepository(PolicyClaim)
    private readonly policyClaimRepository: Repository<PolicyClaim>,
    @InjectRepository(MirReport)
    private readonly mirReportRepository: Repository<MirReport>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(OpportunityActivityMap)
    private readonly opportunityActivityMapRepository: Repository<OpportunityActivityMap>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicyAssetEndorsement)
    private readonly policyAssetEndorsementRepository: Repository<PolicyAssetEndorsement>
  ) {}

  findActiveServiceMasters(): Promise<ServiceMaster[]> {
    return this.serviceRepository.find({
      where: {
        serviceName: In(SERVICE_TAT_SERVICE_LIST),
        status: ACTIVE_STATUS,
      },
      order: { serviceDisplayOrder: "ASC" },
    });
  }

  findWeightages(orgId?: number): Promise<OrgServiceWeightage[]> {
    return this.weightageRepository.find({
      where: orgId ? { orgId } : {},
    });
  }

  // orgId omitted = no org filter — see findWeightages.
  findActiveTatBuckets(orgId?: number): Promise<TatBucket[]> {
    return this.tatBucketRepository.find({
      where: orgId ? { orgId, status: ACTIVE_STATUS } : { status: ACTIVE_STATUS },
      order: { tatDisplayOrder: "ASC" },
    });
  }

  async getMonthlySummaryRowsForCompany(
    params: MonthlySummaryBaseParams & { companyId: number }
  ): Promise<Array<Record<string, any>>> {
    return this.createMonthlySummaryBaseQuery(params)
      .andWhere("fact.company_id = :companyId", { companyId: params.companyId })
      .groupBy("month_start")
      .addGroupBy("fact.service_id")
      .addGroupBy("fact.tat_bucket_id")
      .orderBy("month_start", "ASC")
      .getRawMany();
  }

  async getMonthlySummaryRowsForCompanies(
    params: MonthlySummaryBaseParams & { companyIds: number[] }
  ): Promise<Array<Record<string, any>>> {
    if (!params.companyIds.length) {
      return [];
    }

    return this.createMonthlySummaryBaseQuery(params)
      .andWhere("fact.company_id IN (:...companyIds)", {
        companyIds: params.companyIds,
      })
      .groupBy("month_start")
      .addGroupBy("fact.service_id")
      .addGroupBy("fact.tat_bucket_id")
      .orderBy("month_start", "ASC")
      .getRawMany();
  }

  async getMonthlyServiceDetailsRowsForCompany(
    params: MonthlySummaryBaseParams & { companyId: number }
  ): Promise<Array<Record<string, any>>> {
    return this.createMonthlyServiceDetailsBaseQuery(params)
      .andWhere("fact.company_id = :companyId", { companyId: params.companyId })
      .groupBy("fact.service_id")
      .addGroupBy("fact.tat_bucket_id")
      .getRawMany();
  }

  async getMonthlyServiceDetailsRowsForCompanies(
    params: MonthlySummaryBaseParams & { companyIds: number[] }
  ): Promise<Array<Record<string, any>>> {
    if (!params.companyIds.length) {
      return [];
    }

    return this.createMonthlyServiceDetailsBaseQuery(params)
      .andWhere("fact.company_id IN (:...companyIds)", {
        companyIds: params.companyIds,
      })
      .groupBy("fact.service_id")
      .addGroupBy("fact.tat_bucket_id")
      .getRawMany();
  }

  // orgId omitted = no org filter — see findWeightages.
  async buildServiceBucketConfig(
    orgId: number | undefined,
    baseBuckets: TatBucket[],
    serviceIds: number[]
  ): Promise<Map<number, ServiceTatBucketConfig[]>> {
    const configMap = new Map<number, ServiceTatBucketConfig[]>();
    if (!baseBuckets.length || !serviceIds.length) {
      return configMap;
    }

    const bucketIds = baseBuckets.map((bucket) => bucket.id);
    await this.ensureServiceBucketMappings(serviceIds, bucketIds);

    const baseBucketById = new Map(
      baseBuckets.map((bucket) => [bucket.id, bucket])
    );

    const mappingsQuery = this.serviceTatScoreRepository
      .createQueryBuilder("map")
      .leftJoinAndSelect("map.tatBucket", "bucket")
      .where("bucket.status = :status", { status: ACTIVE_STATUS })
      .andWhere("map.serviceId IN (:...serviceIds)", { serviceIds });
    if (orgId) {
      mappingsQuery.andWhere("bucket.orgId = :orgId", { orgId });
    }
    const mappings = await mappingsQuery.getMany();

    const mappingGroups = new Map<number, ServiceTatScoreMap[]>();
    mappings.forEach((item) => {
      const list = mappingGroups.get(item.serviceId) ?? [];
      list.push(item);
      mappingGroups.set(item.serviceId, list);
    });

    for (const serviceId of serviceIds) {
      const serviceMappings = mappingGroups.get(serviceId) ?? [];
      const configs: ServiceTatBucketConfig[] = [];

      serviceMappings.forEach((mapping) => {
        const bucket =
          mapping.tatBucket ?? baseBucketById.get(mapping.tatBucketId);
        if (!bucket) {
          return;
        }
        configs.push(this.toBucketConfig(bucket));
      });

      if (!configs.length) {
        baseBuckets.forEach((bucket) => {
          configs.push(this.toBucketConfig(bucket));
        });
      }

      configs.sort((a, b) => {
        if (a.startDay !== b.startDay) {
          return a.startDay - b.startDay;
        }
        if (a.endDay !== b.endDay) {
          return a.endDay - b.endDay;
        }
        return a.displayOrder - b.displayOrder;
      });

      configMap.set(serviceId, configs);
    }

    return configMap;
  }

  async findCompanyIdsByUserIds(userIds: number[]): Promise<number[]> {
    if (!userIds.length) {
      return [];
    }

    const rows = await this.companyRepository
      .createQueryBuilder("company")
      .select("company.id", "companyId")
      .where(
        "(company.leadCrm IN (:...userIds) OR (company.leadCrm IS NULL AND company.createdBy IN (:...userIds)))",
        { userIds }
      )
      .getRawMany<{ companyId: number | null }>();

    const companyIds = rows
      .map((row) =>
        typeof row.companyId === "number" ? Number(row.companyId) : null
      )
      .filter((id): id is number => typeof id === "number");

    return Array.from(new Set(companyIds));
  }

  // Service Score summary-details (IIRM-6282): raw source-entity event rows,
  // one row per completed/settled event, tagged with its `mstr_service.service_name`.
  async getServiceScoreSourceEvents(
    params: CompanyDateRangeParams
  ): Promise<ServiceScoreSourceEventRow[]> {
    const policyIds = await this.findPolicyIdsForCompanyInFinancialYear(
      params
    );

    const [
      endorsementRows,
      claimRows,
      mirRows,
      meetingRows,
      qcrRows,
    ] = await Promise.all([
      this.getEndorsementEvents(policyIds),
      this.getClaimEvents(policyIds),
      this.getMirEvents(params),
      this.getMeetingEvents(params),
      this.getQcrSubmissionEvents(params),
    ]);

    return [
      ...endorsementRows,
      ...claimRows,
      ...mirRows,
      ...meetingRows,
      ...qcrRows,
    ];
  }

  private async findPolicyIdsForCompanyInFinancialYear(
    params: CompanyDateRangeParams
  ): Promise<number[]> {
    const { companyId, organisationId, start, end } = params;
    const qb = this.policyRepository
      .createQueryBuilder("policy")
      .select("policy.id", "id")
      .innerJoin(
        LookUp,
        "policyType",
        "policyType.id = policy.policyTypeLid AND policyType.status = 1 AND policyType.organisationId = policy.organisationId"
      )
      .where("policy.companyId = :companyId", { companyId })
      .andWhere("policy.policyFrom <= :end", { end })
      .andWhere("policy.policyTo >= :start", { start });

    if (organisationId) {
      qb.andWhere("policy.organisationId = :organisationId", {
        organisationId,
      });
    }

    const rows = await qb.getRawMany<{ id: number }>();
    return rows.map((row) => Number(row.id));
  }

  private async getEndorsementEvents(
    policyIds: number[]
  ): Promise<ServiceScoreSourceEventRow[]> {
    if (!policyIds.length) {
      return [];
    }

    const [groupRows, nonGroupRows] = await Promise.all([
      this.endorsementRepository
        .createQueryBuilder("endorsement")
        .select(
          "COALESCE(endorsement.createdAt, endorsement.endorsementEntryDate)",
          "createdAt",
        )
        .addSelect("endorsement.insurerEndorsementDate", "eventDate")
        .where("endorsement.policyId IN (:...policyIds)", { policyIds })
        .andWhere("endorsement.insurerEndorsementDate IS NOT NULL")
        .getRawMany<{ createdAt: Date; eventDate: Date }>(),
      this.policyAssetEndorsementRepository
        .createQueryBuilder("pae")
        .select(
          "COALESCE(pae.createdAt, pae.endorsementEntryDate)",
          "createdAt",
        )
        .addSelect("pae.updatedAt", "updatedAt")
        .addSelect("pae.endorsementType", "endorsementType")
        .addSelect("pae.endorsementStatus", "endorsementStatus")
        .addSelect("pae.insurerEndorsementDate", "insurerEndorsementDate")
        .where("pae.policyId IN (:...policyIds)", { policyIds })
        .getRawMany<{
          createdAt: Date;
          updatedAt: Date;
          endorsementType: string | null;
          endorsementStatus: string | null;
          insurerEndorsementDate: Date | null;
        }>(),
    ]);

    const nonGroupEvents: ServiceScoreSourceEventRow[] = nonGroupRows
      .filter((row) => {
        if (row.endorsementType === SERVICE_SCORE_ENDORSEMENT_EXTENSION_TYPE) {
          return (
            row.endorsementStatus !==
            SERVICE_SCORE_ENDORSEMENT_REQUEST_RECEIVED_STATUS
          );
        }
        return row.insurerEndorsementDate != null;
      })
      .map((row) => ({
        serviceName: SERVICE_SCORE_SERVICE_NAMES.ENDORSEMENT,
        createdAt: row.createdAt,
        eventDate:
          row.endorsementType === SERVICE_SCORE_ENDORSEMENT_EXTENSION_TYPE
            ? row.updatedAt
            : (row.insurerEndorsementDate as Date),
      }));

    return [
      ...groupRows.map((row) => ({
        serviceName: SERVICE_SCORE_SERVICE_NAMES.ENDORSEMENT,
        createdAt: row.createdAt,
        eventDate: row.eventDate,
      })),
      ...nonGroupEvents,
    ];
  }

  private async getClaimEvents(
    policyIds: number[]
  ): Promise<ServiceScoreSourceEventRow[]> {
    if (!policyIds.length) {
      return [];
    }

    const rows = await this.policyClaimRepository
      .createQueryBuilder("claim")
      .innerJoin("claim.settlements", "settlement")
      .leftJoin(Policy, "policy", "policy.id = claim.policyId")
      .leftJoin(
        PolicyTypeSegregation,
        "policyTypeSegregation",
        "policyTypeSegregation.policyTypeLid = policy.policyTypeLid"
      )
      .leftJoin(
        LookUp,
        "irdaiPolicyType",
        "irdaiPolicyType.id = policyTypeSegregation.irdaiPolicyTypeLid"
      )
      .select("COALESCE(claim.claimDate, claim.createdAt)", "createdAt")
      .addSelect("settlement.settlementDate", "eventDate")
      .addSelect("irdaiPolicyType.lookUpValue", "policyTypeValue")
      .where("claim.policyId IN (:...policyIds)", { policyIds })
      .andWhere("UPPER(claim.claimStatus) = :status", {
        status: SERVICE_SCORE_CLAIM_STATUS.toUpperCase(),
      })
      .andWhere("settlement.settlementDate IS NOT NULL")
      .getRawMany<ClaimEventRow>();

    return rows.map((row) => ({
      serviceName: SERVICE_SCORE_HEALTH_POLICY_TYPE_VALUES.includes(
        row.policyTypeValue ?? ""
      )
        ? SERVICE_SCORE_SERVICE_NAMES.HEALTH_CLAIMS
        : SERVICE_SCORE_SERVICE_NAMES.NON_HEALTH_CLAIMS,
      createdAt: row.createdAt,
      eventDate: row.eventDate,
    }));
  }

  private async getMirEvents(
    params: CompanyDateRangeParams
  ): Promise<ServiceScoreSourceEventRow[]> {
    const { companyId, start, end } = params;
    const rows = await this.mirReportRepository
      .createQueryBuilder("mir")
      .select("mir.createdAt", "createdAt")
      .addSelect("mir.updatedAt", "eventDate")
      .where("mir.companyId = :companyId", { companyId })
      .andWhere("mir.status = :status", {
        status: SERVICE_SCORE_MIR_PUBLISHED_STATUS,
      })
      .andWhere("mir.updatedAt >= :start", { start })
      .andWhere("mir.updatedAt < :end", { end })
      .getRawMany<{ createdAt: Date; eventDate: Date }>();

    return rows.map((row) => ({
      serviceName: SERVICE_SCORE_SERVICE_NAMES.MIR,
      createdAt: row.createdAt,
      eventDate: row.eventDate,
    }));
  }

  private async getMeetingEvents(
    params: CompanyDateRangeParams
  ): Promise<ServiceScoreSourceEventRow[]> {
    const { companyId, start, end } = params;
    const meetingTypeKeys = Object.values(
      SERVICE_SCORE_MEETING_TYPE_LOOKUP_KEYS
    );
    const rows = await this.meetingRepository
      .createQueryBuilder("meeting")
      .leftJoin(LookUp, "meetingType", "meetingType.id = meeting.meetingTypeLid")
      .leftJoin(
        LookUp,
        "meetingStatus",
        "meetingStatus.id = meeting.meetingStatusLid"
      )
      .select("meeting.createdAt", "createdAt")
      .addSelect("meeting.completedAt", "eventDate")
      .addSelect("meetingType.lookUpKey", "meetingTypeKey")
      .where("meeting.companyId = :companyId", { companyId })
      .andWhere("meetingType.lookUpKey IN (:...meetingTypeKeys)", {
        meetingTypeKeys,
      })
      .andWhere("meetingStatus.lookUpKey ILIKE :completedPattern", {
        completedPattern: SERVICE_SCORE_MEETING_STATUS_COMPLETED_PATTERN,
      })
      .andWhere("meeting.completedAt IS NOT NULL")
      .andWhere("meeting.completedAt >= :start", { start })
      .andWhere("meeting.completedAt < :end", { end })
      .getRawMany<{
        createdAt: Date;
        eventDate: Date;
        meetingTypeKey: string | null;
      }>();

    const serviceNameByMeetingType: Record<string, string> = {
      [SERVICE_SCORE_MEETING_TYPE_LOOKUP_KEYS.MONTHLY]:
        SERVICE_SCORE_SERVICE_NAMES.MONTHLY_MEETING,
      [SERVICE_SCORE_MEETING_TYPE_LOOKUP_KEYS.QUARTERLY]:
        SERVICE_SCORE_SERVICE_NAMES.QUARTERLY_MEETING,
      [SERVICE_SCORE_MEETING_TYPE_LOOKUP_KEYS.MULTILATERAL]:
        SERVICE_SCORE_SERVICE_NAMES.MULTILATERAL_MEETINGS,
    };

    return rows
      .filter((row) => row.meetingTypeKey && serviceNameByMeetingType[row.meetingTypeKey])
      .map((row) => ({
        serviceName: serviceNameByMeetingType[row.meetingTypeKey as string],
        createdAt: row.createdAt,
        eventDate: row.eventDate,
      }));
  }

  private async getQcrSubmissionEvents(
    params: CompanyDateRangeParams
  ): Promise<ServiceScoreSourceEventRow[]> {
    const { companyId, start, end } = params;
    const rows = await this.opportunityActivityMapRepository
      .createQueryBuilder("activity")
      .leftJoin(Opportunity, "opportunity", "opportunity.id = activity.opportunityId")
      .select("activity.createdAt", "createdAt")
      .addSelect("activity.completedAt", "eventDate")
      .where("opportunity.companyId = :companyId", { companyId })
      .andWhere("activity.activityName ILIKE :activityNamePattern", {
        activityNamePattern: SERVICE_SCORE_QCR_ACTIVITY_NAME_PATTERN,
      })
      .andWhere("activity.completedAt IS NOT NULL")
      .andWhere("activity.completedAt >= :start", { start })
      .andWhere("activity.completedAt < :end", { end })
      .getRawMany<{ createdAt: Date; eventDate: Date }>();

    return rows.map((row) => ({
      serviceName: SERVICE_SCORE_SERVICE_NAMES.QCR_SUBMISSION,
      createdAt: row.createdAt,
      eventDate: row.eventDate,
    }));
  }

  private createMonthlySummaryBaseQuery(
    params: MonthlySummaryBaseParams
  ) {
    const { orgId, start, end, serviceIds } = params;
    const baseQuery = this.summaryRepository
      .createQueryBuilder("fact")
      .select("DATE_TRUNC('month', fact.snapshot_date)", "month_start")
      .addSelect("fact.service_id", "service_id")
      .addSelect("fact.tat_bucket_id", "tat_bucket_id")
      .addSelect("SUM(fact.bucket_score)", "bucket_score")
      .addSelect("SUM(fact.event_count)", "event_count")
      .where("fact.org_id = :orgId", { orgId })
      .andWhere("fact.snapshot_date >= :start", { start })
      .andWhere("fact.snapshot_date < :end", { end });

    if (serviceIds.length) {
      baseQuery.andWhere("fact.service_id IN (:...serviceIds)", { serviceIds });
    }

    return baseQuery;
  }

  private createMonthlyServiceDetailsBaseQuery(
    params: MonthlySummaryBaseParams
  ) {
    const { orgId, start, end, serviceIds } = params;
    const baseQuery = this.summaryRepository
      .createQueryBuilder("fact")
      .select("fact.service_id", "service_id")
      .addSelect("fact.tat_bucket_id", "tat_bucket_id")
      .addSelect("SUM(fact.bucket_score)", "bucket_score")
      .addSelect("SUM(fact.event_count)", "event_count")
      .where("fact.org_id = :orgId", { orgId })
      .andWhere("fact.snapshot_date >= :start", { start })
      .andWhere("fact.snapshot_date < :end", { end });

    if (serviceIds.length) {
      baseQuery.andWhere("fact.service_id IN (:...serviceIds)", { serviceIds });
    }

    return baseQuery;
  }

  private async ensureServiceBucketMappings(
    serviceIds: number[],
    bucketIds: number[]
  ): Promise<void> {
    if (!serviceIds.length || !bucketIds.length) {
      return;
    }

    const seededServices = await this.serviceTatScoreRepository
      .createQueryBuilder("map")
      .select("DISTINCT map.serviceId", "serviceId")
      .where("map.serviceId IN (:...serviceIds)", { serviceIds })
      .andWhere("map.tatBucketId IN (:...bucketIds)", { bucketIds })
      .getRawMany<{ serviceId: string }>();

    const seededIds = new Set(
      seededServices.map((row) => Number(row.serviceId))
    );
    const servicesToSeed = serviceIds.filter(
      (serviceId) => !seededIds.has(serviceId)
    );

    if (!servicesToSeed.length) {
      return;
    }

    const values: Array<{ serviceId: number; tatBucketId: number }> = [];
    for (const serviceId of servicesToSeed) {
      for (const bucketId of bucketIds) {
        values.push({ serviceId, tatBucketId: bucketId });
      }
    }

    if (!values.length) {
      return;
    }

    await this.serviceTatScoreRepository
      .createQueryBuilder()
      .insert()
      .into(ServiceTatScoreMap)
      .values(values)
      .orIgnore()
      .execute();
  }

  private toBucketConfig(bucket: TatBucket): ServiceTatBucketConfig {
    return {
      bucketId: bucket.id,
      startDay: bucket.startDay,
      endDay: bucket.endDay,
      tatWeight: Number(bucket.tatWeight ?? 0),
      isCompliant: bucket.isCompliant,
      label: bucket.tatLabel ?? "",
      displayOrder: bucket.tatDisplayOrder ?? 0,
    };
  }
}
