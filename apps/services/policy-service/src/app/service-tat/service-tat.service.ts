import { Injectable } from "@nestjs/common";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { MonthlySummaryQueryDto } from "./dto/monthly-summary-query.dto";
import { MonthlyServiceDetailsQueryDto } from "./dto/monthly-service-details-query.dto";
import type {
  MonthlyServiceDetailsData,
  MonthlyServiceDetailsMonth,
  MonthlyServiceDetailsTatBucket,
  MonthlySummaryData,
  MonthlySummaryMonth,
  ServiceScoreMonth,
  SummaryDetailsData,
} from "./service-tat.types";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { ServiceMaster } from "../../../../service-lib/src/lib/entities";
import {
  ServiceScoreSourceEventRow,
  ServiceTatBucketConfig,
  ServiceTatRepository,
} from "./service-tat.repository";
import { ForbiddenException } from "@nestjs/common";
import { getDateRange } from "../../../../service-lib/src/lib/utils/get-data-range.utils";

interface BucketSummary {
  tatBucketId: number;
  eventCount: number;
  bucketScore: number;
  isCompliant: boolean;
}

interface ServiceAggregate {
  bucketScore: number;
  compliantBucketScore: number;
  eventCount: number;
  compliantEventCount: number;
}

@Injectable()
export class ServiceTatService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly traceIdService: TraceIdService,
    private readonly serviceTatRepository: ServiceTatRepository,
    private readonly scopeService: ScopeService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE ?? "policy-service"
    );
  }

  async getMonthlySummary(
    userId: number,
    query: MonthlySummaryQueryDto
  ): Promise<MonthlySummaryData> {
    const { year, companyId } = query;
    const orgId = await this.resolveOrganisationId(userId);
    const accessibleCompanyIds = await this.resolveAccessibleCompanyIds(userId);
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    this.logger.log({
      level: "log",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        location: "ServiceTatService",
        method: "getMonthlySummary",
        status: "started",
        messageData: `Fetching monthly summary for org ${orgId} year ${year}${
          companyId ? ` company ${companyId}` : ""
        } (user ${userId}, scoped companies=${accessibleCompanyIds.length})`,
      }),
    });

    const [serviceMasters, tatBuckets, weightages] = await Promise.all([
      this.serviceTatRepository.findActiveServiceMasters(),
      this.serviceTatRepository.findActiveTatBuckets(orgId),
      this.serviceTatRepository.findWeightages(orgId),
    ]);
    if (!serviceMasters.length) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          location: "ServiceTatService",
          method: "getMonthlySummary",
          status: "skipped",
          messageData:
            "No active service masters configured for Service TAT reporting",
        }),
      });
    }
    if (!tatBuckets.length) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          location: "ServiceTatService",
          method: "getMonthlySummary",
          status: "skipped",
          messageData:
            "No active TAT buckets configured for Service TAT reporting",
        }),
      });
    }
    const serviceIds = serviceMasters.map((service) => service.id);
    const weightageMap = new Map<number, number>();
    weightages.forEach((item) =>
      weightageMap.set(item.serviceId, Number(item.weightageScore) || 0)
    );
    const bucketConfigMap =
      await this.serviceTatRepository.buildServiceBucketConfig(
        orgId,
        tatBuckets,
        serviceIds
      );
    const bucketLookupMap = this.createBucketLookup(bucketConfigMap);
    const hasPositiveWeight = serviceIds.some((serviceId) => {
      const configs = bucketConfigMap.get(serviceId) ?? [];
      return configs.some((config) => config.tatWeight > 0);
    });

    if (!serviceIds.length || !tatBuckets.length || !hasPositiveWeight) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          location: "ServiceTatService",
          method: "getMonthlySummary",
          status: "skipped",
          messageData: "Required service masters or TAT buckets not configured",
        }),
      });
    }

    let rawRows: Array<Record<string, any>> = [];
    if (companyId) {
      if (!accessibleCompanyIds.includes(companyId)) {
        this.logger.warn({
          level: "warn",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            location: "ServiceTatService",
            method: "getMonthlySummary",
            status: "skipped",
            messageData: `User ${userId} does not have access to company ${companyId}. Returning empty summary.`,
          }),
        });
      } else {
        rawRows =
          await this.serviceTatRepository.getMonthlySummaryRowsForCompany({
            orgId,
            start,
            end,
            serviceIds,
            companyId,
          });
      }
    } else if (accessibleCompanyIds.length) {
      rawRows =
        await this.serviceTatRepository.getMonthlySummaryRowsForCompanies({
          orgId,
          start,
          end,
          serviceIds,
          companyIds: accessibleCompanyIds,
        });
    } else {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          location: "ServiceTatService",
          method: "getMonthlySummary",
          status: "skipped",
          messageData: `No accessible companies resolved for user ${userId} in org ${orgId}. Returning empty summary.`,
        }),
      });
    }

    const monthServiceMap = new Map<string, Map<number, ServiceAggregate>>();
    for (const row of rawRows) {
      const monthKey = this.formatMonthKey(new Date(row.month_start));
      const bucketId = Number(row.tat_bucket_id);
      const bucketScore = Number(row.bucket_score) || 0;
      const eventCount = Number(row.event_count) || 0;
      const serviceId = Number(row.service_id);
      const serviceMap = monthServiceMap.get(monthKey) ?? new Map();
      const aggregate = serviceMap.get(serviceId) ?? {
        bucketScore: 0,
        compliantBucketScore: 0,
        eventCount: 0,
        compliantEventCount: 0,
      };
      aggregate.bucketScore += bucketScore;
      aggregate.eventCount += eventCount;
      const bucketConfig = bucketLookupMap.get(serviceId)?.get(bucketId);
      if (bucketConfig?.isCompliant) {
        aggregate.compliantBucketScore += bucketScore;
        aggregate.compliantEventCount += eventCount;
      }
      serviceMap.set(serviceId, aggregate);
      monthServiceMap.set(monthKey, serviceMap);
    }

    const months: MonthlySummaryMonth[] = [];

    let aggregateMarksScored = 0;
    let aggregateTotalMarks = 0;

    for (let i = 0; i < 12; i += 1) {
      const monthDate = new Date(Date.UTC(year, i, 1));
      const monthKey = this.formatMonthKey(monthDate);
      const serviceAggregates = monthServiceMap.get(monthKey) ?? new Map();
      let monthMarksScored = 0;
      let monthTotalMarks = 0;
      let monthBucketScoreTotal = 0;
      let monthEventTotal = 0;

      serviceAggregates.forEach((aggregate) => {
        monthBucketScoreTotal += aggregate.bucketScore;
        monthEventTotal += aggregate.eventCount;
      });

      for (const service of serviceMasters) {
        const serviceId = service.id;
        const weightage = weightageMap.get(serviceId) ?? 0;
        if (weightage <= 0) {
          continue;
        }
        const aggregate = serviceAggregates.get(serviceId);
        const eventCount = aggregate?.eventCount ?? 0;
        const compliantEventCount = aggregate?.compliantEventCount ?? 0;
        if (eventCount <= 0) {
          continue;
        }
        const complianceRatio =
          eventCount > 0 ? compliantEventCount / eventCount : 0;
        const boundedComplianceRatio = Number.isFinite(complianceRatio)
          ? Math.min(Math.max(complianceRatio, 0), 1)
          : 0;
        const marksForService = boundedComplianceRatio * weightage;
        monthMarksScored += marksForService;
        monthTotalMarks += weightage;
      }

      aggregateMarksScored += monthMarksScored;
      aggregateTotalMarks += monthTotalMarks;
      const percentage =
        monthTotalMarks > 0 ? (monthMarksScored / monthTotalMarks) * 100 : 0;
      const roundedPercentage = Number(percentage.toFixed(2));
      const marksScoredValue = Number(monthMarksScored.toFixed(2));
      const totalMarksValue = Number(monthTotalMarks.toFixed(2));
      const totalBucketScoreValue = Number(monthBucketScoreTotal.toFixed(2));
      months.push({
        month: monthKey,
        marksScored: marksScoredValue,
        totalMarks: totalMarksValue,
        percentage: roundedPercentage,
        totalBucketScore: totalBucketScoreValue,
        totalEvents: monthEventTotal,
        indicator: this.resolvePerformanceIndicator(roundedPercentage),
      });
    }

    const overallPercentage =
      aggregateTotalMarks > 0
        ? (aggregateMarksScored / aggregateTotalMarks) * 100
        : 0;
    const roundedOverallPercentage = Number(overallPercentage.toFixed(2));
    const totalMarksScored = Number(aggregateMarksScored.toFixed(2));
    const totalMarksAvailable = Number(aggregateTotalMarks.toFixed(2));

    return {
      orgId,
      year,
      companyId: companyId ?? null,
      months,
      totals: {
        marksScored: totalMarksScored,
        totalMarks: totalMarksAvailable,
        percentage: roundedOverallPercentage,
        indicator: this.resolvePerformanceIndicator(roundedOverallPercentage),
      },
    };
  }

  async getMonthlyServiceDetails(
    userId: number,
    query: MonthlyServiceDetailsQueryDto
  ): Promise<MonthlyServiceDetailsData> {
    const { month, companyId } = query;
    const orgId = await this.resolveOrganisationId(userId);
    const accessibleCompanyIds = await this.resolveAccessibleCompanyIds(userId);
    const { start, end } = this.resolveMonthRange(month);

    this.logger.log({
      level: "log",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        location: "ServiceTatService",
        method: "getMonthlyServiceDetails",
        status: "started",
        messageData: `Fetching monthly details for org ${orgId}, month ${month}${
          companyId ? ` company ${companyId}` : ""
        } (user ${userId}, scoped companies=${accessibleCompanyIds.length})`,
      }),
    });

    const [serviceMasters, tatBuckets, weightages] = await Promise.all([
      this.serviceTatRepository.findActiveServiceMasters(),
      this.serviceTatRepository.findActiveTatBuckets(orgId),
      this.serviceTatRepository.findWeightages(orgId),
    ]);
    const serviceIds = serviceMasters.map((service) => service.id);
    const serviceOrderMap = new Map<number, number>();
    serviceMasters.forEach((service, index) => {
      serviceOrderMap.set(service.id, service.serviceDisplayOrder ?? index);
    });

    const weightageMap = new Map<number, number>();
    weightages.forEach((item) =>
      weightageMap.set(item.serviceId, Number(item.weightageScore) || 0)
    );
    const bucketConfigMap =
      await this.serviceTatRepository.buildServiceBucketConfig(
        orgId,
        tatBuckets,
        serviceIds
      );
    const bucketLookupMap = this.createBucketLookup(bucketConfigMap);
    let rawRows: Array<Record<string, any>> = [];
    if (companyId) {
      if (!accessibleCompanyIds.includes(companyId)) {
        this.logger.warn({
          level: "warn",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            location: "ServiceTatService",
            method: "getMonthlyServiceDetails",
            status: "skipped",
            messageData: `User ${userId} does not have access to company ${companyId}. Returning empty details.`,
          }),
        });
      } else {
        rawRows =
          await this.serviceTatRepository.getMonthlyServiceDetailsRowsForCompany(
            {
              orgId,
              start,
              end,
              serviceIds,
              companyId,
            }
          );
      }
    } else if (accessibleCompanyIds.length) {
      rawRows =
        await this.serviceTatRepository.getMonthlyServiceDetailsRowsForCompanies(
          {
            orgId,
            start,
            end,
            serviceIds,
            companyIds: accessibleCompanyIds,
          }
        );
    } else {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          location: "ServiceTatService",
          method: "getMonthlyServiceDetails",
          status: "skipped",
          messageData: `No accessible companies resolved for user ${userId} in org ${orgId}. Returning empty details.`,
        }),
      });
    }

    const bucketSummaryMap = new Map<string, BucketSummary>();
    for (const row of rawRows) {
      const serviceId = Number(row.service_id);
      const bucketId = Number(row.tat_bucket_id);
      const key = `${serviceId}:${bucketId}`;
      const bucketConfig = bucketLookupMap.get(serviceId)?.get(bucketId);
      const isCompliant = bucketConfig?.isCompliant ?? false;
      bucketSummaryMap.set(key, {
        tatBucketId: bucketId,
        eventCount: Number(row.event_count) || 0,
        bucketScore: Number(row.bucket_score) || 0,
        isCompliant,
      });
    }

    const monthRows: MonthlyServiceDetailsMonth[] = serviceMasters
      .map((service) => {
        const weightage = weightageMap.get(service.id) ?? 0;

        const bucketConfigs = bucketConfigMap.get(service.id) ?? [];
        let totalNumberOfEvents = 0;
        let compliantWeightedScore = 0;
        const tatBuckets: MonthlyServiceDetailsTatBucket[] = bucketConfigs.map(
          (bucket, index) => {
            const summary = bucketSummaryMap.get(
              `${service.id}:${bucket.bucketId}`
            );
            const eventCount = summary?.eventCount ?? 0;
            totalNumberOfEvents += eventCount;
            if (summary && bucket.isCompliant) {
              const tatWeight = Number.isFinite(bucket.tatWeight)
                ? bucket.tatWeight
                : 0;
              compliantWeightedScore += eventCount * tatWeight;
            }
            return {
              id: `tat${index + 1}`,
              label: this.resolveBucketLabel(bucket, index, bucketConfigs),
              count: eventCount,
            } satisfies MonthlyServiceDetailsTatBucket;
          }
        );

        const scoredValue = Number(compliantWeightedScore.toFixed(2));
        const hasWeightage = weightage > 0;
        const normalizedWeightage = hasWeightage
          ? Number(weightage.toFixed(2))
          : null;
        let wtgScore: number | null = null;
        if (hasWeightage && totalNumberOfEvents > 0) {
          if (scoredValue > 0) {
            const rawWtgScore = (scoredValue / totalNumberOfEvents) * weightage;
            wtgScore = Number(rawWtgScore.toFixed(2));
          } else {
            wtgScore = 0;
          }
        }
        const hasEvents = totalNumberOfEvents > 0;
        const monthRow: MonthlyServiceDetailsMonth = {
          id: service.id,
          serviceName: service.serviceDisplayName ?? service.serviceName,
          totalNumberOfEvents: hasEvents ? totalNumberOfEvents : null,
          scored: hasEvents ? scoredValue : null,
          wtg: hasEvents ? normalizedWeightage : null,
          wtg_score: hasEvents ? wtgScore : null,
          tatBuckets: hasEvents
            ? tatBuckets
            : tatBuckets.map(
                (bucket) =>
                  ({
                    ...bucket,
                    count: null,
                  } satisfies MonthlyServiceDetailsTatBucket)
              ),
        } satisfies MonthlyServiceDetailsMonth;

        return monthRow;
      })
      .sort((a, b) => {
        const orderA = serviceOrderMap.get(a.id) ?? 0;
        const orderB = serviceOrderMap.get(b.id) ?? 0;
        return orderA - orderB;
      });

    return {
      orgId,
      month,
      companyId: companyId ?? null,
      months: monthRows,
    };
  }

  async getSummaryDetailsForCompanies(
    userId: number,
    params: {
      companyIds: number[];
      organisationId?: number;
      financialYear?: number;
      from?: Date;
      to?: Date;
    }
  ): Promise<Map<number, SummaryDetailsData>> {
    const { companyIds } = params;
    if (!companyIds.length) {
      return new Map();
    }
    const organisationId = params.organisationId ?? 0;

    const { start: fyStart } = getDateRange(undefined, params.financialYear);
    const financialYear = (fyStart as Date).getUTCFullYear();

    this.logger.log({
      level: "log",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        location: "ServiceTatService",
        method: "getSummaryDetailsForCompanies",
        status: "started",
        messageData: `Fetching Service Score summary details for org ${organisationId}, ${companyIds.length} companies, financial year ${financialYear}, range ${params.from?.toISOString() ?? "n/a"}..${params.to?.toISOString() ?? "n/a"} (user ${userId})`,
      }),
    });

    const shared = await this.loadServiceScoreSharedData();
    const entries = await Promise.all(
      companyIds.map(
        async (companyId) =>
          [
            companyId,
            await this.computeSummaryDetailsForCompany(
              companyId,
              organisationId,
              financialYear,
              shared,
              { from: params.from, to: params.to }
            ),
          ] as const
      )
    );
    return new Map(entries);
  }

  async getServiceScoreChartData(
    userId: number,
    params: {
      companyId: number;
      financialYear?: number;
      from?: Date;
      to?: Date;
    }
  ): Promise<{
    companyId: number;
    xAxis: string[];
    yAxis: number[];
    indicator: string[];
  }> {
    const { companyId, from, to } = params;

    const { start: fyStart } = getDateRange(undefined, params.financialYear);
    const financialYear = (fyStart as Date).getUTCFullYear();

    this.logger.log({
      level: "log",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        location: "ServiceTatService",
        method: "getServiceScoreChartData",
        status: "started",
        messageData: `Fetching Service Score chart data for company ${companyId}, financial year ${financialYear}, range ${from?.toISOString() ?? "n/a"}..${to?.toISOString() ?? "n/a"} (user ${userId})`,
      }),
    });

    const shared = await this.loadServiceScoreSharedData();
    const summary = await this.computeSummaryDetailsForCompany(
      companyId,
      0,
      financialYear,
      shared,
      { from, to }
    );

    return {
      companyId,
      xAxis: summary.serviceScore.map((month) => month.label),
      yAxis: summary.serviceScore.map((month) => month.scorePercentage),
      indicator: summary.serviceScore.map((month) => month.indicator),
    };
  }

  private async loadServiceScoreSharedData(): Promise<{
    serviceMasters: ServiceMaster[];
    serviceIdByName: Map<string, number>;
    weightageMap: Map<number, number>;
    bucketConfigs: ServiceTatBucketConfig[];
  }> {
    const [serviceMasters, tatBuckets, weightages] = await Promise.all([
      this.serviceTatRepository.findActiveServiceMasters(),
      this.serviceTatRepository.findActiveTatBuckets(),
      this.serviceTatRepository.findWeightages(),
    ]);

    const serviceIdByName = new Map<string, number>();
    serviceMasters.forEach((service) =>
      serviceIdByName.set(service.serviceName, service.id)
    );
    const weightageMap = new Map<number, number>();
    weightages.forEach((item) =>
      weightageMap.set(item.serviceId, Number(item.weightageScore) || 0)
    );

    const bucketConfigs: ServiceTatBucketConfig[] = tatBuckets
      .map((bucket) => ({
        bucketId: bucket.id,
        startDay: bucket.startDay,
        endDay: bucket.endDay,
        tatWeight: Number(bucket.tatWeight) || 0,
        isCompliant: bucket.isCompliant,
        label: bucket.tatLabel ?? "",
        displayOrder: bucket.tatDisplayOrder ?? 0,
      }))
      .sort((a, b) => a.startDay - b.startDay);

    return { serviceMasters, serviceIdByName, weightageMap, bucketConfigs };
  }

  private async computeSummaryDetailsForCompany(
    companyId: number,
    organisationId: number,
    financialYear: number,
    shared: {
      serviceMasters: ServiceMaster[];
      serviceIdByName: Map<string, number>;
      weightageMap: Map<number, number>;
      bucketConfigs: ServiceTatBucketConfig[];
    },
    range?: { from?: Date; to?: Date }
  ): Promise<SummaryDetailsData> {
    const { serviceMasters, serviceIdByName, weightageMap, bucketConfigs } =
      shared;

    const hasExplicitRange = Boolean(range?.from && range?.to);
    const months = hasExplicitRange
      ? this.buildMonthsInRange(range!.from as Date, range!.to as Date)
      : this.buildFinancialYearMonths(financialYear);
    const fyEnd = months[months.length - 1].end;

    const sourceEvents =
      await this.serviceTatRepository.getServiceScoreSourceEvents({
        companyId,
        organisationId,
        start: hasExplicitRange ? (range!.from as Date) : months[0].start,
        end: hasExplicitRange ? (range!.to as Date) : fyEnd,
      });

    // month key ("YYYY-MM") -> serviceId -> { eventCount, bucketCounts }
    const monthServiceMap = new Map<
      string,
      Map<number, { eventCount: number; bucketCounts: Map<number, number> }>
    >();

    months.forEach((month) => {
      monthServiceMap.set(month.key, new Map());
    });

    for (const event of sourceEvents) {
      const serviceId = serviceIdByName.get(event.serviceName);
      if (!serviceId) {
        continue;
      }

      const eventDate = new Date(event.eventDate);
      const monthKey = this.formatMonthKey(eventDate);
      if (!monthServiceMap.has(monthKey)) {
        continue;
      }

      if (!bucketConfigs.length) {
        continue;
      }
      const dayDiff = Math.max(
        0,
        this.diffInDays(new Date(event.createdAt), eventDate)
      );
      const bucket = this.resolveBucketForDayDiff(dayDiff, bucketConfigs);

      const serviceMap = monthServiceMap.get(monthKey)!;
      const aggregate = serviceMap.get(serviceId) ?? {
        eventCount: 0,
        bucketCounts: new Map<number, number>(),
      };
      aggregate.eventCount += 1;
      aggregate.bucketCounts.set(
        bucket.bucketId,
        (aggregate.bucketCounts.get(bucket.bucketId) ?? 0) + 1
      );
      serviceMap.set(serviceId, aggregate);
    }

    const serviceScore: ServiceScoreMonth[] = months.map((month) => {
      const serviceAggregates = monthServiceMap.get(month.key) ?? new Map();
      const {
        details,
        scoredMarks: monthScoredMarks,
        totalMarks: monthTotalMarks,
        weightedScoreSum,
        weightageSum,
      } = this.buildServiceDetails(serviceAggregates, serviceMasters, weightageMap, bucketConfigs);

      // Score percentage = weightageScore / Sum(mstr_org_service_weightage.weightage) * 100
      const scorePercentage =
        weightageSum > 0 ? (weightedScoreSum / weightageSum) * 100 : 0;
      const roundedPercentage = Number(scorePercentage.toFixed(2));

      return {
        month: month.key,
        label: month.label,
        scoredMarks: Number(monthScoredMarks.toFixed(2)),
        totalMarks: Number(monthTotalMarks.toFixed(2)),
        scorePercentage: roundedPercentage,
        indicator: this.resolvePerformanceIndicator(roundedPercentage),
        details,
      } satisfies ServiceScoreMonth;
    });

    // Total Service Score = average of the (already filtered-to-range)
    // months' score percentages — not a re-aggregation of raw marks.
    const totalServiceScore =
      serviceScore.length > 0
        ? serviceScore.reduce((sum, m) => sum + m.scorePercentage, 0) /
          serviceScore.length
        : 0;

    return {
      orgId: organisationId,
      companyId,
      financialYear,
      serviceScore,
      totalServiceScore: Number(totalServiceScore.toFixed(2)),
    };
  }
  async getSummaryDetailsForMIRReport(
    companyId: number,
    organisationId: number,
    start: Date,
    end: Date
  ): Promise<ServiceScoreMonth> {
    const [serviceMasters, tatBuckets, weightages] = await Promise.all([
      this.serviceTatRepository.findActiveServiceMasters(),
      this.serviceTatRepository.findActiveTatBuckets(),
      this.serviceTatRepository.findWeightages(),
    ]);

    const serviceIdByName = new Map<string, number>();
    serviceMasters.forEach((service) =>
      serviceIdByName.set(service.serviceName, service.id)
    );
    const weightageMap = new Map<number, number>();
    weightages.forEach((item) =>
      weightageMap.set(item.serviceId, Number(item.weightageScore) || 0)
    );

    const bucketConfigs: ServiceTatBucketConfig[] = tatBuckets
      .map((bucket) => ({
        bucketId: bucket.id,
        startDay: bucket.startDay,
        endDay: bucket.endDay,
        tatWeight: Number(bucket.tatWeight) || 0,
        isCompliant: bucket.isCompliant,
        label: bucket.tatLabel ?? "",
        displayOrder: bucket.tatDisplayOrder ?? 0,
      }))
      .sort((a, b) => a.startDay - b.startDay);

    const sourceEvents =
      await this.serviceTatRepository.getServiceScoreSourceEvents({
        companyId,
        organisationId,
        start,
        end,
      });

    const serviceAggregates = new Map<
      number,
      { eventCount: number; bucketCounts: Map<number, number> }
    >();
    for (const event of sourceEvents) {
      const serviceId = serviceIdByName.get(event.serviceName);
      if (!serviceId || !bucketConfigs.length) {
        continue;
      }

      const eventDate = new Date(event.eventDate);
      if (eventDate < start || eventDate >= end) {
        continue;
      }

      const dayDiff = Math.max(
        0,
        this.diffInDays(new Date(event.createdAt), eventDate)
      );
      const bucket = this.resolveBucketForDayDiff(dayDiff, bucketConfigs);

      const aggregate = serviceAggregates.get(serviceId) ?? {
        eventCount: 0,
        bucketCounts: new Map<number, number>(),
      };
      aggregate.eventCount += 1;
      aggregate.bucketCounts.set(
        bucket.bucketId,
        (aggregate.bucketCounts.get(bucket.bucketId) ?? 0) + 1
      );
      serviceAggregates.set(serviceId, aggregate);
    }

    const { details, scoredMarks, totalMarks, weightedScoreSum, weightageSum } =
      this.buildServiceDetails(
        serviceAggregates,
        serviceMasters,
        weightageMap,
        bucketConfigs
      );
    // Formula - weightageScore / Sum(mstr_org_service_weightage.weightage) * 100.
    const scorePercentage =
      weightageSum > 0 ? (weightedScoreSum / weightageSum) * 100 : 0;
    const roundedPercentage = Number(scorePercentage.toFixed(2));

    return {
      month: this.formatMonthKey(start),
      label: this.formatCalendarMonthLabel(start),
      scoredMarks: Number(scoredMarks.toFixed(2)),
      totalMarks: Number(totalMarks.toFixed(2)),
      scorePercentage: roundedPercentage,
      indicator: this.resolvePerformanceIndicator(roundedPercentage),
      details,
    } satisfies ServiceScoreMonth;
  }

  private buildServiceDetails(
    serviceAggregates: Map<
      number,
      { eventCount: number; bucketCounts: Map<number, number> }
    >,
    serviceMasters: ServiceMaster[],
    weightageMap: Map<number, number>,
    bucketConfigs: ServiceTatBucketConfig[]
  ): {
    details: Record<string, Record<string, number>>;
    scoredMarks: number;
    totalMarks: number;
    weightedScoreSum: number;
    weightageSum: number;
  } {
    const details: Record<string, Record<string, number>> = {};
    let scoredMarks = 0;
    let totalMarks = 0;
    let weightedScoreSum = 0;
    let weightageSum = 0;

    for (const service of serviceMasters) {
      const aggregate = serviceAggregates.get(service.id);
      // Total = sum of requests across every TAT bucket.
      const total = aggregate?.eventCount ?? 0;
      // Scored = sum of (bucket event count * that bucket's own tat_weight),
      // across every bucket — not just the fully-compliant one.
      const scored = bucketConfigs.reduce((sum, bucket) => {
        const count = aggregate?.bucketCounts.get(bucket.bucketId) ?? 0;
        return sum + count * Number(bucket.tatWeight);
      }, 0);
      const weightageScore = weightageMap.get(service.id) ?? 0;

      const bucketDetails: Record<string, number> = {};
      bucketConfigs.forEach((bucket, index) => {
        bucketDetails[this.resolveBucketLabel(bucket, index, bucketConfigs)] =
          aggregate?.bucketCounts.get(bucket.bucketId) ?? 0;
      });

      // Weighted Score = Scored/Total * service weightage_score.
      const serviceWeightedScore = total > 0 ? (scored / total) * weightageScore : 0;

      details[service.serviceDisplayName ?? service.serviceName] = {
        ...bucketDetails,
        scoredMarks: Number(scored.toFixed(4)),
        totalMarks: total,
        weightage_score: Number(serviceWeightedScore.toFixed(4)),
        maxWeightage: weightageScore,
      };

      scoredMarks += scored;
      totalMarks += total;
      weightedScoreSum += serviceWeightedScore;
      weightageSum += weightageScore;
    }

    return { details, scoredMarks, totalMarks, weightedScoreSum, weightageSum };
  }

  private formatCalendarMonthLabel(date: Date): string {
    const monthLabels = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${monthLabels[date.getUTCMonth()]}${date.getUTCFullYear()}`;
  }

  private buildFinancialYearMonths(
    financialYear: number
  ): Array<{ key: string; label: string; start: Date; end: Date }> {
    const monthLabels = [
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
    ];
    const months: Array<{ key: string; label: string; start: Date; end: Date }> =
      [];
    for (let i = 0; i < 12; i += 1) {
      const calendarMonthIndex = (3 + i) % 12; // Apr=3 .. Mar=2
      const year = calendarMonthIndex < 3 ? financialYear + 1 : financialYear;
      const start = new Date(Date.UTC(year, calendarMonthIndex, 1));
      const end = new Date(Date.UTC(year, calendarMonthIndex + 1, 1));
      months.push({
        key: this.formatMonthKey(start),
        label: `${monthLabels[i]}${year}`,
        start,
        end,
      });
    }
    return months;
  }

  private buildMonthsInRange(
    from: Date,
    to: Date
  ): Array<{ key: string; label: string; start: Date; end: Date }> {
    const monthLabels = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const months: Array<{ key: string; label: string; start: Date; end: Date }> =
      [];
    let cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    const last = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
    while (cursor <= last) {
      const year = cursor.getUTCFullYear();
      const monthIndex = cursor.getUTCMonth();
      const start = new Date(Date.UTC(year, monthIndex, 1));
      const end = new Date(Date.UTC(year, monthIndex + 1, 1));
      months.push({
        key: this.formatMonthKey(start),
        label: `${monthLabels[monthIndex]}${year}`,
        start,
        end,
      });
      cursor = new Date(Date.UTC(year, monthIndex + 1, 1));
    }
    return months;
  }

  private diffInDays(from: Date, to: Date): number {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
  }

  private resolveBucketForDayDiff(
    dayDiff: number,
    bucketConfigs: ServiceTatBucketConfig[]
  ): ServiceTatBucketConfig {
    const match = bucketConfigs.find(
      (config) => dayDiff >= config.startDay && dayDiff <= config.endDay
    );
    return match ?? bucketConfigs[bucketConfigs.length - 1];
  }

  private resolveMonthRange(month: string) {
    const [yearString, monthString] = month.split("-");
    const year = Number(yearString);
    const monthIndex = Number(monthString) - 1;
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1));
    return { start, end };
  }

  private createBucketLookup(
    configMap: Map<number, ServiceTatBucketConfig[]>
  ): Map<number, Map<number, ServiceTatBucketConfig>> {
    const lookup = new Map<number, Map<number, ServiceTatBucketConfig>>();
    configMap.forEach((configs, serviceId) => {
      const byBucket = new Map<number, ServiceTatBucketConfig>();
      configs.forEach((config) => {
        byBucket.set(config.bucketId, config);
      });
      lookup.set(serviceId, byBucket);
    });
    return lookup;
  }

  private resolveBucketLabel(
    bucket: ServiceTatBucketConfig,
    index: number,
    bucketConfigs?: ServiceTatBucketConfig[]
  ): string {
    const start = Number.isFinite(bucket.startDay) ? bucket.startDay : null;
    const end = Number.isFinite(bucket.endDay) ? bucket.endDay : null;

    if (start !== null && end !== null) {
      if (start === end) {
        return `${start} days`;
      }
      return `${start}–${end} days`;
    }

    if (end !== null) {
      return `≤${end} days`;
    }

    if (start !== null) {
      if (bucketConfigs && index > 0) {
        const previousBucket = bucketConfigs[index - 1];
        const previousEnd = previousBucket?.endDay;
        if (typeof previousEnd === "number" && Number.isFinite(previousEnd)) {
          return `>${previousEnd} days`;
        }
      }

      return start > 0 ? `≥${start} days` : `${start} days`;
    }

    const trimmedLabel = bucket.label?.trim();
    if (trimmedLabel) {
      return trimmedLabel;
    }

    return `Bucket ${index + 1}`;
  }

  private async resolveOrganisationId(userId: number): Promise<number> {
    const employee = await this.scopeService.getEmployeeDetails(userId);
    if (!employee || typeof employee.organisationId !== "number") {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          location: "ServiceTatService",
          method: "resolveOrganisationId",
          status: "skipped",
          messageData: `Unable to resolve organisation for user ${userId}`,
        }),
      });
      throw new Error(`Unable to resolve organisation for user ${userId}`);
    }
    return employee.organisationId;
  }

  private async resolveAccessibleCompanyIds(userId: number): Promise<number[]> {
    try {
      const hierarchy = await this.scopeService.getNewEmployeeHierarchyByUserId(
        userId
      );
      const scopedUserIds = new Set<number>();
      scopedUserIds.add(userId);
      hierarchy
        .map((item) => item?.userId)
        .filter((id): id is number => typeof id === "number")
        .forEach((id) => scopedUserIds.add(id));

      const userIds = Array.from(scopedUserIds);
      if (!userIds.length) {
        return [];
      }

      return this.serviceTatRepository.findCompanyIdsByUserIds(userIds);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          location: "ServiceTatService",
          method: "resolveAccessibleCompanyIds",
          status: "failure",
          messageData: `Failed to resolve company scope for user ${userId}: ${
            error instanceof Error ? error.message : error
          }`,
        }),
      });
      return [];
    }
  }

  private formatMonthKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  }

  private resolvePerformanceIndicator(
    percentage: number
  ): MonthlySummaryMonth["indicator"] {
    if (percentage > 90) {
      return "GREEN";
    }
    if (percentage > 80) {
      return "YELLOW";
    }
    if (percentage > 70) {
      return "ORANGE";
    }
    return "RED";
  }
}
