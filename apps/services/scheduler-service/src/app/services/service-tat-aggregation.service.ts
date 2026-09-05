import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import {
  Meeting,
  OpportunityActivityMap,
  OrgServiceTatSummary,
  Policy,
  PolicyClaim,
  PolicyClaimSettlement,
  ServiceMaster,
  ServiceTatScoreMap,
  TatBucket,
  Endorsement,
} from "../../../../service-lib/src/lib/entities";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";

import {
  serviceNames,
  SERVICE_TAT_SERVICE_LIST,
  SERVICE_TAT_SERVICE_NAMES,
} from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  HEALTH_POLICY_TYPE_LOOKUP_VALUES,
  MS_IN_DAY,
  SERVICE_TAT_LOG_CONTEXT,
} from "../constants/service-tat.constants";

import { createLogger } from "../../../../service-lib/src/lib/logger";

interface DateRange {
  start: Date;
  end: Date;
  snapshot: Date;
}

interface TatEvent {
  orgId?: number | null;
  companyId?: number | null;
  policyId?: number | null;
  serviceId: number;
  startDate: Date;
  completionDate: Date;
  opportunityId?: number | null;
}

interface ServiceTatBucketConfig {
  bucketId: number;
  startDay: number;
  endDay: number;
  tatWeight: number;
  isCompliant: boolean;
  displayOrder: number;
}

interface AggregatedRecord {
  key: string;
  orgId: number;
  companyId: number;
  policyId: number;
  serviceId: number;
  tatBucket: ServiceTatBucketConfig;
  snapshotDate: Date;
  eventCount: number;
  totalTatDays: number;
}

const ACTIVE_STATUS = "ACTIVE";

@Injectable()
export class ServiceTatAggregationService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly bucketCache = new Map<string, ServiceTatBucketConfig[]>();
  private readonly orgBucketCache = new Map<number, TatBucket[]>();

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ServiceMaster)
    private readonly serviceRepository: Repository<ServiceMaster>,
    @InjectRepository(TatBucket)
    private readonly tatBucketRepository: Repository<TatBucket>,
    @InjectRepository(ServiceTatScoreMap)
    private readonly serviceTatScoreRepository: Repository<ServiceTatScoreMap>,
    @InjectRepository(Endorsement)
    private readonly endorsementRepository: Repository<Endorsement>,
    @InjectRepository(PolicyClaim)
    private readonly claimRepository: Repository<PolicyClaim>,
    @InjectRepository(PolicyClaimSettlement)
    private readonly claimSettlementRepository: Repository<PolicyClaimSettlement>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(OpportunityActivityMap)
    private readonly activityRepository: Repository<OpportunityActivityMap>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE
    );
  }

  async aggregateDailyTat(targetDate: Date = new Date()): Promise<void> {
    const range = this.resolveRange(targetDate);

    this.logger.log({
      level: "log",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "started",
        location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
        method: "aggregateDailyTat",
        messageData: `Aggregating TAT snapshots for ${range.snapshot
          .toISOString()
          .slice(0, 10)}`,
      }),
    });

    this.bucketCache.clear();
    this.orgBucketCache.clear();

    const serviceMap = await this.loadServiceMasters();
    if (!serviceMap.size) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "skipped",
          location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
          method: "aggregateDailyTat",
          messageData:
            "No active service master records found for TAT aggregation",
        }),
      });
      return;
    }

    await this.seedServiceBucketMappings(Array.from(serviceMap.values()));

    const allEvents: TatEvent[] = [];

    allEvents.push(
      ...(await this.collectEndorsementEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.ENDORSEMENT)
      ))
    );

    allEvents.push(
      ...(await this.collectClaimEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.HEALTH_CLAIMS),
        true
      ))
    );
    allEvents.push(
      ...(await this.collectClaimEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.NON_HEALTH_CLAIMS),
        false
      ))
    );

    allEvents.push(
      ...(await this.collectMeetingEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.QUARTERLY_MEETING),
        SERVICE_TAT_SERVICE_NAMES.QUARTERLY_MEETING
      ))
    );
    allEvents.push(
      ...(await this.collectMeetingEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.MONTHLY_MEETING),
        SERVICE_TAT_SERVICE_NAMES.MONTHLY_MEETING
      ))
    );
    allEvents.push(
      ...(await this.collectMeetingEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.MULTILATERAL_MEETINGS),
        "Multilateral Meeting"
      ))
    );
    allEvents.push(
      ...(await this.collectActivityEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.MIR),
        "mir"
      ))
    );
    allEvents.push(
      ...(await this.collectActivityEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.RENEWAL_NOTICE),
        "renewal notice"
      ))
    );
    allEvents.push(
      ...(await this.collectActivityEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.RENEWAL_STRATEGY_REPORT),
        "renewal strategy"
      ))
    );
    allEvents.push(
      ...(await this.collectActivityEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.VALUE_ADDED_SERVICE),
        "value added service"
      ))
    );
    allEvents.push(
      ...(await this.collectActivityEvents(
        range,
        serviceMap.get(SERVICE_TAT_SERVICE_NAMES.QCR_SUBMISSION),
        "QCR Generation",
        true
      ))
    );

    if (!allEvents.length) {
      this.logger.log({
        level: "log",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "skipped",
          location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
          method: "aggregateDailyTat",
          messageData:
            "No service completion events detected for the snapshot period",
        }),
      });
      return;
    }

    const enrichedEvents = await this.populatePolicyContext(allEvents);
    this.logger.log({
      level: "debug",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "progress",
        location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
        method: "aggregateDailyTat",
        messageData: `Enriched ${enrichedEvents.length} service TAT events with policy context`,
      }),
    });
    const normalizedEvents = enrichedEvents
      .map((e) => {
        e.startDate = this.coerceToDate(e.startDate);
        e.completionDate = this.coerceToDate(e.completionDate);
        return e;
      })
      .filter((e) => {
        const valid =
          e.startDate instanceof Date &&
          !isNaN(e.startDate.getTime()) &&
          e.completionDate instanceof Date &&
          !isNaN(e.completionDate.getTime());
        if (!valid) {
          this.logger.warn({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "dropped",
              location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
              method: "aggregateDailyTat",
              messageData: `Dropped event (invalid dates) serviceId=${e.serviceId} policyId=${e.policyId}`,
            }),
          });
        }
        return valid;
      });

    const filteredEvents = normalizedEvents.filter(
      (event) =>
        !!event.orgId &&
        !!event.companyId &&
        !!event.policyId &&
        event.completionDate >= range.start &&
        event.completionDate < range.end
    );

    if (!filteredEvents.length) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "skipped",
          location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
          method: "aggregateDailyTat",
          messageData:
            "Events detected but none contained complete policy context for aggregation",
        }),
      });
      return;
    }

    const aggregated = await this.aggregateByBucket(
      filteredEvents,
      range.snapshot
    );
    if (!aggregated.length) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "skipped",
          location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
          method: "aggregateDailyTat",
          messageData: "No matching TAT buckets found for the computed events",
        }),
      });
      return;
    }

    await this.persistAggregates(aggregated);

    this.logger.log({
      level: "log",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
        method: "aggregateDailyTat",
        messageData: `Persisted ${
          aggregated.length
        } TAT aggregate rows for ${range.snapshot.toISOString().slice(0, 10)}`,
      }),
    });
  }

  private resolveRange(targetDate: Date): DateRange {
    const cursor = new Date(targetDate);
    cursor.setUTCHours(0, 0, 0, 0);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + MS_IN_DAY);
    return { start, end, snapshot: start };
  }

  private async loadServiceMasters(): Promise<Map<string, ServiceMaster>> {
    const services = await this.serviceRepository.find({
      where: {
        serviceName: In(SERVICE_TAT_SERVICE_LIST),
        status: ACTIVE_STATUS,
      },
    });
    const map = new Map<string, ServiceMaster>();
    services.forEach((service) => map.set(service.serviceName, service));

    return map;
  }

  private async seedServiceBucketMappings(
    services: ServiceMaster[]
  ): Promise<void> {
    if (!services.length) {
      return;
    }

    const buckets = await this.tatBucketRepository.find({
      where: { status: ACTIVE_STATUS },
    });

    if (!buckets.length) {
      return;
    }

    const serviceIds = services.map((service) => service.id);
    const bucketIds = buckets.map((bucket) => bucket.id);

    await this.ensureServiceBucketMappings(serviceIds, bucketIds);
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

  private async collectEndorsementEvents(
    range: DateRange,
    service?: ServiceMaster
  ): Promise<TatEvent[]> {
    if (!service) {
      return [];
    }

    const endorsements = await this.endorsementRepository
      .createQueryBuilder("endorsement")
      .innerJoinAndSelect("endorsement.policy", "policy")
      .leftJoinAndSelect("policy.owner", "policyOwner")
      .where("endorsement.tpa_acknowledged_date IS NOT NULL")
      .andWhere("endorsement.tpa_acknowledged_date >= :start", {
        start: range.start,
      })
      .andWhere("endorsement.tpa_acknowledged_date < :end", { end: range.end })
      .getMany();

    return endorsements
      .map((endorsement) => {
        if (!endorsement.tpaAcknowledgedDate || !endorsement.createdAt) {
          return null;
        }
        const orgId = endorsement.policy?.owner?.organisationId;
        const policyId = endorsement.policyId;
        const companyId =
          endorsement.companyId ?? endorsement.policy?.companyId;
        if (!orgId || !policyId || !companyId) {
          return null;
        }
        return {
          orgId,
          policyId,
          companyId,
          serviceId: service.id,
          startDate: endorsement.createdAt,
          completionDate: endorsement.tpaAcknowledgedDate,
        } as TatEvent;
      })
      .filter((event): event is TatEvent => event !== null);
  }

  private async collectClaimEvents(
    range: DateRange,
    service: ServiceMaster | undefined,
    isHealth: boolean
  ): Promise<TatEvent[]> {
    if (!service) {
      return [];
    }

    const settlements = await this.claimSettlementRepository
      .createQueryBuilder("settlement")
      .innerJoinAndSelect("settlement.claim", "claim")
      .innerJoinAndSelect("claim.policy", "policy")
      .leftJoinAndSelect("policy.owner", "policyOwner")
      .leftJoinAndSelect("policy.policyType", "policyType")
      .where("settlement.clm_sett_date IS NOT NULL")
      .andWhere("settlement.clm_sett_date >= :start", { start: range.start })
      .andWhere("settlement.clm_sett_date < :end", { end: range.end })
      .getMany();

    return settlements
      .map((settlement) => {
        if (!settlement.settlementDate) {
          return null;
        }
        const policy = settlement.claim?.policy;
        const policyOwner = policy?.owner;
        if (!policy || !policyOwner) {
          return null;
        }
        const policyTypeValue = policy.policyType?.lookUpValue;
        const isHealthPolicy = policyTypeValue
          ? HEALTH_POLICY_TYPE_LOOKUP_VALUES.has(policyTypeValue.toLowerCase())
          : false;
        if (isHealthPolicy !== isHealth) {
          return null;
        }
        const startDate =
          settlement.claim.claimDate ?? settlement.claim.createdAt;
        if (!startDate) {
          return null;
        }
        return {
          orgId: policyOwner.organisationId,
          companyId: policy.companyId,
          policyId: policy.id,
          serviceId: service.id,
          startDate,
          completionDate: settlement.settlementDate,
        } as TatEvent;
      })
      .filter((event): event is TatEvent => event !== null);
  }

  private async collectMeetingEvents(
    range: DateRange,
    service: ServiceMaster | undefined,
    meetingTypeLabel: string
  ): Promise<TatEvent[]> {
    if (!service) {
      return [];
    }
    this.logger.log({
      level: "debug",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "progress",
        location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
        method: "collectMeetingEvents",
        messageData: `Collecting ${meetingTypeLabel} meetings between ${range.start
          .toISOString()
          .slice(0, 10)} and ${range.end.toISOString().slice(0, 10)}`,
      }),
    });
    const meetings = await this.meetingRepository
      .createQueryBuilder("meeting")
      .leftJoinAndSelect("meeting.meetingType", "meetingType")
      .leftJoinAndSelect("meeting.opportunity", "opportunity")
      .leftJoinAndSelect("opportunity.owner", "opportunityOwner")
      .where("meeting.meeting_date >= :start", { start: range.start })
      .andWhere("meeting.meeting_date < :end", { end: range.end })
      .andWhere("LOWER(meetingType.lookUpValue) = LOWER(:label)", {
        label: meetingTypeLabel,
      })
      .getMany();

    if (!meetings.length) {
      return [];
    }

    const opportunityIds = meetings
      .map((meeting) => meeting.opportunityId)
      .filter((id): id is number => typeof id === "number");
    const policyMap = await this.fetchPoliciesByOpportunity(opportunityIds);

    return meetings
      .map((meeting) => {
        if (!meeting.meetingDate) {
          return null;
        }
        const policy = meeting.opportunityId
          ? policyMap.get(meeting.opportunityId)
          : undefined;
        const opportunity = meeting.opportunity;
        const startDate = meeting.createdAt ?? meeting.meetingDate;
        return {
          orgId:
            policy?.owner?.organisationId ??
            opportunity?.owner?.organisationId ??
            null,
          companyId:
            policy?.companyId ??
            meeting.companyId ??
            opportunity?.companyId ??
            null,
          policyId: policy?.id ?? null,
          serviceId: service.id,
          startDate,
          completionDate: meeting.meetingDate,
          opportunityId: meeting.opportunityId ?? null,
        } as TatEvent;
      })
      .filter((event): event is TatEvent => event !== null);
  }

  private async collectActivityEvents(
    range: DateRange,
    service: ServiceMaster | undefined,
    pattern: string,
    restrictToExpiringOpportunities = false
  ): Promise<TatEvent[]> {
    if (!service) {
      return [];
    }
    console.log(
      `Collecting activities matching '${pattern}' between ${range.start
        .toISOString()
        .slice(0, 10)} and ${range.end.toISOString().slice(0, 10)}`
    );
    const activities = await this.activityRepository
      .createQueryBuilder("activity")
      .leftJoinAndSelect("activity.opportunity", "opportunity")
      .leftJoinAndSelect("opportunity.owner", "opportunityOwner")
      .where("activity.completed_at IS NOT NULL")
      .andWhere("activity.completed_at >= :start", { start: range.start })
      .andWhere("activity.completed_at < :end", { end: range.end })
      .andWhere("LOWER(activity.activity_name) LIKE :pattern", {
        pattern: `%${pattern.toLowerCase()}%`,
      })
      .getMany();
    console.log(`Found ${activities.length} matching activities`);
    if (!activities.length) {
      return [];
    }

    const opportunityIds = activities
      .map((activity) => activity.opportunityId)
      .filter((id): id is number => typeof id === "number");
    const policyMap = await this.fetchPoliciesByOpportunity(opportunityIds);

    const expiryCutOff = new Date(range.start.getTime() + 60 * MS_IN_DAY);

    return activities
      .map((activity) => {
        if (!activity.completedAt || !activity.createdAt) {
          return null;
        }
        const policy = activity.opportunityId
          ? policyMap.get(activity.opportunityId)
          : undefined;
        const opportunity = activity.opportunity;
        if (restrictToExpiringOpportunities) {
          const sourceOpportunity = opportunity;
          const expiryDate = sourceOpportunity?.expiryDate;
          if (!expiryDate) {
            return null;
          }
          if (expiryDate < range.start || expiryDate > expiryCutOff) {
            return null;
          }
        }
        return {
          orgId:
            policy?.owner?.organisationId ??
            opportunity?.owner?.organisationId ??
            null,
          companyId: policy?.companyId ?? opportunity?.companyId ?? null,
          policyId: policy?.id ?? null,
          serviceId: service.id,
          startDate: activity.createdAt,
          completionDate: activity.completedAt,
          opportunityId: activity.opportunityId ?? null,
        } as TatEvent;
      })
      .filter((event): event is TatEvent => event !== null);
  }

  private async fetchPoliciesByOpportunity(
    opportunityIds: number[]
  ): Promise<Map<number, Policy>> {
    if (!opportunityIds.length) {
      return new Map();
    }
    const uniqueIds = Array.from(new Set(opportunityIds));
    const policies = await this.policyRepository.find({
      where: { opportunityId: In(uniqueIds) },
      relations: ["owner"],
    });
    const map = new Map<number, Policy>();
    policies.forEach((policy) => {
      if (typeof policy.opportunityId === "number") {
        map.set(policy.opportunityId, policy);
      }
    });
    return map;
  }

  private async populatePolicyContext(events: TatEvent[]): Promise<TatEvent[]> {
    const missingPolicyOpportunityIds = events
      .filter((event) => !event.policyId && event.opportunityId)
      .map((event) => event.opportunityId!)
      .filter((id, index, array) => array.indexOf(id) === index);

    const policyMap = await this.fetchPoliciesByOpportunity(
      missingPolicyOpportunityIds
    );

    return events.map((event) => {
      if (
        (!event.policyId || !event.orgId || !event.companyId) &&
        event.opportunityId
      ) {
        const policy = policyMap.get(event.opportunityId);
        if (policy) {
          event.policyId = event.policyId ?? policy.id;
          event.companyId = event.companyId ?? policy.companyId;
          event.orgId = event.orgId ?? policy.owner?.organisationId;
        }
      }
      return event;
    });
  }

  private calculateTatDays(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    if (Number.isNaN(diff)) {
      return 0;
    }
    return Math.max(0, Math.floor(diff / MS_IN_DAY));
  }

  private async resolveBucket(
    orgId: number,
    serviceId: number,
    tatDays: number
  ): Promise<ServiceTatBucketConfig | undefined> {
    const buckets = await this.loadServiceBucketConfigs(orgId, serviceId);
    if (!buckets.length) {
      return undefined;
    }
    return (
      buckets.find(
        (bucket) => tatDays >= bucket.startDay && tatDays <= bucket.endDay
      ) ?? buckets[buckets.length - 1]
    );
  }

  private async loadServiceBucketConfigs(
    orgId: number,
    serviceId: number
  ): Promise<ServiceTatBucketConfig[]> {
    const cacheKey = `${orgId}:${serviceId}`;
    let buckets = this.bucketCache.get(cacheKey);
    if (buckets) {
      return buckets;
    }

    const orgBuckets = await this.loadOrgBuckets(orgId);
    if (!orgBuckets.length) {
      return [];
    }

    const baseBucketById = new Map(
      orgBuckets.map((bucket) => [bucket.id, bucket])
    );

    const mappings = await this.serviceTatScoreRepository
      .createQueryBuilder("map")
      .leftJoinAndSelect("map.tatBucket", "bucket")
      .where("map.serviceId = :serviceId", { serviceId })
      .andWhere("bucket.orgId = :orgId", { orgId })
      .andWhere("bucket.status = :status", { status: ACTIVE_STATUS })
      .getMany();

    const configs: ServiceTatBucketConfig[] = [];

    mappings.forEach((mapping) => {
      const bucket =
        mapping.tatBucket ?? baseBucketById.get(mapping.tatBucketId);
      if (!bucket) {
        return;
      }
      configs.push(this.toServiceBucketConfig(bucket));
    });

    if (!configs.length) {
      orgBuckets.forEach((bucket) => {
        configs.push(this.toServiceBucketConfig(bucket));
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

    this.bucketCache.set(cacheKey, configs);
    return configs;
  }

  private toServiceBucketConfig(bucket: TatBucket): ServiceTatBucketConfig {
    return {
      bucketId: bucket.id,
      startDay: bucket.startDay,
      endDay: bucket.endDay,
      tatWeight: Number(bucket.tatWeight ?? 0),
      isCompliant: bucket.isCompliant,
      displayOrder: bucket.tatDisplayOrder ?? 0,
    };
  }

  private async loadOrgBuckets(orgId: number): Promise<TatBucket[]> {
    let buckets = this.orgBucketCache.get(orgId);
    if (!buckets) {
      buckets = await this.tatBucketRepository.find({
        where: { orgId, status: ACTIVE_STATUS },
        order: { tatDisplayOrder: "ASC" },
      });
      this.orgBucketCache.set(orgId, buckets);
    }
    return buckets;
  }

  private async aggregateByBucket(
    events: TatEvent[],
    snapshotDate: Date
  ): Promise<AggregatedRecord[]> {
    const aggregateMap = new Map<string, AggregatedRecord>();

    for (const event of events) {
      if (
        typeof event.orgId !== "number" ||
        typeof event.companyId !== "number" ||
        typeof event.policyId !== "number"
      ) {
        continue;
      }
      const tatDays = this.calculateTatDays(
        event.startDate,
        event.completionDate
      );
      const bucket = await this.resolveBucket(
        event.orgId,
        event.serviceId,
        tatDays
      );
      if (!bucket) {
        this.logger.warn({
          level: "warn",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "warning",
            location: SERVICE_TAT_LOG_CONTEXT.AGGREGATION,
            method: "aggregateByBucket",
            messageData: `No TAT bucket found for org ${event.orgId} and TAT days ${tatDays}`,
          }),
        });
        continue;
      }
      const key = [
        event.orgId,
        event.companyId,
        event.policyId,
        event.serviceId,
        bucket.bucketId,
        snapshotDate.toISOString().slice(0, 10),
      ].join("|");
      let record = aggregateMap.get(key);
      if (!record) {
        record = {
          key,
          orgId: event.orgId,
          companyId: event.companyId,
          policyId: event.policyId,
          serviceId: event.serviceId,
          tatBucket: bucket,
          snapshotDate,
          eventCount: 0,
          totalTatDays: 0,
        };
        aggregateMap.set(key, record);
      }
      record.eventCount += 1;
      record.totalTatDays += tatDays;
    }

    return Array.from(aggregateMap.values());
  }

  private async persistAggregates(records: AggregatedRecord[]): Promise<void> {
    if (!records.length) {
      return;
    }
    const insertValues = records.map((record) => ({
      orgId: record.orgId,
      companyId: record.companyId,
      policyId: record.policyId,
      serviceId: record.serviceId,
      tatBucketId: record.tatBucket.bucketId,
      snapshotDate: record.snapshotDate,
      eventCount: record.eventCount,
      bucketScore: Number(record.tatBucket.tatWeight) * record.eventCount,
      averageTatDays:
        record.eventCount > 0 ? record.totalTatDays / record.eventCount : null,
      tatWeight: Number(record.tatBucket.tatWeight),
      isCompliant: record.tatBucket.isCompliant,
    }));

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(OrgServiceTatSummary)
      .values(insertValues)
      .orUpdate(
        [
          "event_count",
          "bucket_score",
          "average_tat_days",
          "tat_weight",
          "is_compliant",
          "updated_at",
        ],
        [
          "org_id",
          "company_id",
          "policy_id",
          "service_id",
          "tat_bucket_id",
          "snapshot_date",
        ]
      )
      .execute();
  }

  private coerceToDate(val: any): Date {
    if (val instanceof Date) return val;
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date("Invalid") : d;
    }
    return new Date("Invalid");
  }
}
