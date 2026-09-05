import { BadRequestException } from "@nestjs/common";
import { addDays, endOfDay } from "date-fns";
import Redis from "ioredis";
import {
  Brackets,
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
  Repository,
} from "typeorm";

import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EMPLOYEE_ENROLLMENT_STATUS_ENROLLED } from "../constants";
import {
  BOOLEAN_VALUES,
  DATA_TYPES,
  DEFAULT_PAGE,
  DEFAULT_TOTAL_KPI_COUNT,
  EMPLOYEE_ENDORSEMENT_ACKNOWLEDGED,
  EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT,
  EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING,
  EMPLOYEE_ENDORSEMENT_DOWNLOADED,
  EMPLOYEE_ENDORSEMENT_PROCESSED,
  EMPLOYEE_ENDORSEMENT_READY,
  EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED,
  GENDER_VALUES,
  NON_FINANCIAL_CONSTANTS,
  OPPORTUNITY_TYPE,
  PARENT_RELATIONSHIP_TYPES,
  PER_MILLE_RATE,
  POLICY_CONFIGURATION_STATUS_LIVE,
  DEPENDENT_COUNT_INTERNAL_TYPE,
  DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
  DEPENDENT_COUNT_ALL_CATEGORY,
  POLICY_RELATIONSHIP_TYPE_PARAMETER,
  SUM_INSURED_MODELS
} from "../../../../../../libs/service-lib/src/lib/constants";
import { Policy } from "../entities/policy.entity";
import { Endorsement } from "../entities/endorsement.entity";
import { Opportunity } from "../entities/opportunity.entity";
import { PolicyConfiguration } from "../entities/policy-configuration.entity";
import { PolicyEmployeeEndorsement } from "../entities/policy-employee-endorsement.entity";
import { PolicyEmployeeEnrollment } from "../entities/policy-employee-enrollment.entity";
import { PolicyEmployeeEnrollmentChoice } from "../entities/policy-employee-enrollment-choice.entity";
import { PolicyEmployeeEnrollmentChoiceDependent } from "../entities/policy-employee-enrollment-choice-dependent.entity";
import { PolicyEnrollmentDependent } from "../entities/policy-enrollment-dependent.entity";
import { PolicyEnrollmentEmployeePolicyMap } from "../entities/policy-enrollment-employee-policy-map.entity";
import { PolicyDependentEndorsement } from "../entities/policy-dependent-endorsement.entity";
import { DocumentProcessingFile } from "../entities/document-processing-file.entity";
import { buildLogMessage } from "./logger.util";
import { convertSafeStringToInteger } from "./parse.utils";
import { ENV } from "../environment";
import {
  resolveApplyToDependentsPremium,
  resolveDependentAttributePremium,
  resolveDependentOnlyPremiumByConfiguration,
  resolveOptionIdForLife,
  resolveSumInsuredIdForValue,
  type DependentAttributeParam,
  type OptionMetaEntry,
} from "./per-dependent-resolution.util";
import { toMidnight, daysBetweenInclusive, calculateApplicableDays } from "./premium-calculator.util";

export interface LoggerLike {
  log: (message: { level: string; message: string }) => void;
  error: (message: { level: string; message: string }) => void;
}

export interface EnrollmentChoiceDto {
  id?: number;
  sumInsured: number;
  premium: number;
  companyPay: number;
  employeePay: number;
  policyComponentActionType: string;
  policyComponentActionTypeId?: number;
  parentpolicyComponentActionTypeId?: number;
  policyComponentActionLabel?: string;
  premiumPerLife?: boolean;
  proRationEnabled?: boolean;
  sumInsuredModel?: string;
  sumInsuredModelProperty?: string;
  minSumInsuredValue?: number;
  maxSumInsuredValue?: number;
}

export interface UpsertEnrollmentDependentDto {
  id?: number;
  name: string;
  relation: string;
  relationshipType?: string;
  dateOfBirth?: string;
  gender?: string;
  effectiveDate?: string;
  enrollmentAdditionBatchId?: number;
  claimStatus?: string;
}

export interface UpsertEnrollmentDataDto {
  employeeId: number;
  policyId: number;
  companyId: number;
  action: string;
  dependents?: UpsertEnrollmentDependentDto[];
  choices?: EnrollmentChoiceDto[];
  isDependentOnly?: boolean;
  statusUpdateForNewDependentsOnly?: boolean;
}

export interface EnrollmentProcessingRepository {
  getConfigRelationsAndContains(policyId: number): Promise<{
    isRelationshipGroup: boolean;
    relationships: any;
    constraints: any;
  } | null>;
  getPolicyConfigurationByPolicyId(
    policyId: number
  ): Promise<PolicyConfiguration | null>;
  getEmployeeDetailsByEmployeeId(employeeId: number): Promise<{
    id: number;
    policyId?: number;
    employeeCompanyId?: number;
    employeeName?: string;
    dateOfBirth?: string;
    gender?: string;
    email?: string;
    phone?: string;
    designation?: string;
    maritalStatus?: string;
    fullName?: string;
    additionalDetails?: Record<string, unknown>;
    relationGroup?: string;
  } | null>;
  getEnrollmentComponents(
    policyId: number,
    employeeId: number
  ): Promise<PolicyEmployeeEnrollmentChoice[]>;
  updateDependents(
    manager: EntityManager,
    policyId: number | null,
    employeeId: number,
    dtos: UpsertEnrollmentDependentDto[],
    userId: number,
    options?: { skipDeletion?: boolean; preserveIds?: Set<number> },
    endorsementId?: number
  ): Promise<PolicyEnrollmentDependent[]>;
  updateEnrollmentChoices(
    manager: EntityManager,
    dtos: Array<
      EnrollmentChoiceDto & {
        policyId: number;
        employeeId: number;
        companyId: number;
      }
    >,
    enrollmentContext?: {
      policyId: number;
      employeeId: number;
      companyId: number;
    }
  ): Promise<PolicyEmployeeEnrollmentChoice[]>;
  findEmployeeEnrollment(
    policyId: number,
    employeeId: number
  ): Promise<PolicyEmployeeEnrollment | null>;
  updateEnrollmentStatus(
    manager: EntityManager,
    policyId: number,
    employeeId: number,
    companyId: number,
    valueKey: string,
    endorsementId?: number,
    newDependentsOnly?: boolean,
    newlyAddedDependentIds?: number[],
    deletedDependentIds?: number[]
  ): Promise<PolicyEmployeeEnrollment>;
  deleteExistingEnrollmentChoices(
    policyId: number,
    employeeId: number
  ): Promise<void>;
  getPoliciesByEmployee(employeeId: number): Promise<Policy[]>;
  getEmployeeEnrollmentWindowSource(
    policyId: number,
    employeeId: number
  ): Promise<
    | Pick<
      PolicyEnrollmentEmployeePolicyMap,
      "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
    >
    | null
  >;
}

export interface EnrollmentProcessingDependencies {
  logger: LoggerLike;
  traceId?: string;
  location: string;
  redis: Redis;
  dataSource: DataSource;
  policyRepo: Repository<Policy>;
  enrollmentRepository: EnrollmentProcessingRepository;
}

export interface DependentCountRelationLike {
  relation?: string | null;
  relationshipType?: string | null;
}

/**
 * Finds the Dependent Count parameter's "0 dependents" band and returns it as an
 * OptionMetaEntry, so per-life premium resolution can price each dependent as if
 * they were the only life enrolled. Matches by min/max count value (0), never by
 * the admin-configurable display name (which could be "0", "0D", or anything).
 * Returns null when no dependent-count parameter is configured.
 */
function findDependentCountZeroOptionMeta(
  parameters: any[],
): { parameterId: string; parameterOptionId: string } | null {
  const dcParam = (parameters ?? []).find(
    (p: any) =>
      p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
      p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE,
  );
  const bands = dcParam?.dependentCountConfig?.countBands;
  if (!dcParam || !Array.isArray(bands) || bands.length === 0) return null;

  const zeroBand = bands.find((band: any) => {
    const min = parseInt(String(band.minCount ?? 0)) || 0;
    const rawMax =
      band.maxCount !== null && band.maxCount !== undefined
        ? parseInt(String(band.maxCount))
        : NaN;
    const max = isNaN(rawMax) ? Number.POSITIVE_INFINITY : rawMax;
    return 0 >= min && 0 <= max;
  });
  if (!zeroBand) return null;

  return { parameterId: dcParam.id, parameterOptionId: String(zeroBand.id) };
}

/**
 * Sums the "Dependent Count" siEnhancement across all configured dependent-count
 * parameters for the given dependents. Unlike the choice-submission validation path
 * (see EnrollmentProcessingService.validateComponentChoices), an unmatched band here
 * resolves to 0 rather than throwing — callers of this pure helper run outside the
 * submission flow and must not be blocked by a stale/edge-case dependent count.
 */
export function resolveDependentCountSiEnhancement(
  config: any,
  dependents: DependentCountRelationLike[],
  isEmployeeInThisEndorsement: boolean = true,
): number {
  const dcParams = (config?.parameters ?? []).filter(
    (p: any) =>
      p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
      p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE,
  );

  let dependentCountSiEnhancement = 0;
  for (const dcParam of dcParams) {
    const dcConfig = dcParam.dependentCountConfig;
    if (!dcConfig?.countBands?.length) continue;
    const targetNorm = (dcConfig.targetRelationCategory ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z]/g, "");
    // "All" counts dependents only — a dependent being added is what triggers the
    // SI enhancement; the employee is never part of this count.
    const enrolledCount =
      targetNorm === DEPENDENT_COUNT_ALL_CATEGORY.toLowerCase()
        ? (dependents ?? []).length
        : (dependents ?? []).filter((dep) => {
            const relNorm = (dep.relation ?? dep.relationshipType ?? "")
              .toLowerCase()
              .trim()
              .replace(/[^a-z]/g, "");
            return (
              relNorm === targetNorm ||
              relNorm.includes(targetNorm) ||
              targetNorm.includes(relNorm)
            );
          }).length;
    const matchedBand = dcConfig.countBands.find((band: any) => {
      const min = parseInt(String(band.minCount ?? 0)) || 0;
      const rawMax =
        band.maxCount !== null && band.maxCount !== undefined
          ? parseInt(String(band.maxCount))
          : NaN;
      const max = isNaN(rawMax) ? Number.POSITIVE_INFINITY : rawMax;
      return enrolledCount >= min && enrolledCount <= max;
    });
    if (!matchedBand) continue;
    dependentCountSiEnhancement += Number(matchedBand.siEnhancement) || 0;
  }
  return dependentCountSiEnhancement;
}

/**
 * Resolves which count-band option a single "Dependent Count" parameter currently
 * matches, based on the given dependents — the counterpart to resolveOptionIdForLife
 * for parameters that describe the whole family rather than one life. Used to keep
 * a per-dependent premium lookup's "Dependent Count" portion of optionMeta in sync
 * with the CURRENT total dependent count, instead of carrying forward whatever value
 * happened to be on the first policyOption matched on other (e.g. Age) criteria alone.
 */
export function resolveDependentCountOptionId(
  parameter: any,
  dependents: DependentCountRelationLike[],
): string | null {
  const dcConfig = parameter?.dependentCountConfig;
  if (!dcConfig?.countBands?.length) return null;
  const targetNorm = (dcConfig.targetRelationCategory ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, "");
  // "All" counts dependents only — the employee is never part of this count.
  const enrolledCount =
    targetNorm === DEPENDENT_COUNT_ALL_CATEGORY.toLowerCase()
      ? (dependents ?? []).length
      : (dependents ?? []).filter((dep) => {
          const relNorm = (dep.relation ?? dep.relationshipType ?? "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z]/g, "");
          return (
            relNorm === targetNorm ||
            relNorm.includes(targetNorm) ||
            targetNorm.includes(relNorm)
          );
        }).length;
  const matchedBand = dcConfig.countBands.find((band: any) => {
    const min = parseInt(String(band.minCount ?? 0)) || 0;
    const rawMax =
      band.maxCount !== null && band.maxCount !== undefined
        ? parseInt(String(band.maxCount))
        : NaN;
    const max = isNaN(rawMax) ? Number.POSITIVE_INFINITY : rawMax;
    return enrolledCount >= min && enrolledCount <= max;
  });
  return matchedBand?.id ?? null;
}

export class EnrollmentProcessingService {
  private readonly logger: LoggerLike;
  private readonly traceId?: string;
  private readonly location: string;
  private readonly redis: Redis;
  private readonly dataSource: DataSource;
  private readonly policyRepo: Repository<Policy>;
  private readonly enrollmentRepository: EnrollmentProcessingRepository;
  private readonly cacheTtlMs = 5 * 60 * 1000;
  private readonly configCache = new Map<
    number,
    {
      fetchedAt: number;
      value: { isRelationshipGroup: boolean; relationships: any; constraints: any } | null;
    }
  >();
  private readonly policyEndDateCache = new Map<
    number,
    { fetchedAt: number; policyTo: Date | null; exists: boolean }
  >();

  constructor(deps: EnrollmentProcessingDependencies) {
    this.logger = deps.logger;
    this.traceId = deps.traceId;
    this.location = deps.location;
    this.redis = deps.redis;
    this.dataSource = deps.dataSource;
    this.policyRepo = deps.policyRepo;
    this.enrollmentRepository = deps.enrollmentRepository;
  }

  private logInfo(
    method: string,
    messageData: unknown,
    payload?: unknown,
    userId?: number
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceId,
        userId,
        status: "success",
        location: this.location,
        method,
        payload,
        messageData,
      }),
    });
  }

  private logError(
    method: string,
    messageData: unknown,
    payload?: unknown,
    userId?: number
  ) {
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceId,
        userId,
        status: "failure",
        location: this.location,
        method,
        payload,
        messageData,
      }),
    });
  }

  private async getConfigRelationsAndContainsCached(policyId: number) {
    const cached = this.configCache.get(policyId);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < this.cacheTtlMs) {
      return cached.value;
    }
    const value = await this.enrollmentRepository.getConfigRelationsAndContains(
      policyId
    );
    this.configCache.set(policyId, { fetchedAt: now, value });
    return value;
  }

  private async getPolicyEndDateCached(policyId: number) {
    const cached = this.policyEndDateCache.get(policyId);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < this.cacheTtlMs) {
      return cached;
    }
    const policy = await this.policyRepo.findOne({
      where: { id: policyId },
      select: ["id", "policyTo"],
    });
    const value = {
      fetchedAt: now,
      policyTo: policy?.policyTo ? new Date(policy.policyTo) : null,
      exists: Boolean(policy),
    };
    this.policyEndDateCache.set(policyId, value);
    return value;
  }

  async processEnrollmentPayload(
    payloadId: string,
    payloadMapId: string,
    userId: number,
    endorsementId?: number
  ) {
    const payloadStartTime = Date.now();
    this.logInfo(
      "processEnrollmentPayload",
      "method invoked",
      { payloadId, payloadMapId },
      userId
    );

    try {
      if (!this.redis) {
        throw new BadRequestException("Redis client not initialized");
      }

      const statusEntryData = await this.redis.hget(payloadMapId, payloadId);
      if (!statusEntryData) {
        throw new BadRequestException(
          `Payload ${payloadId} not found in status map`
        );
      }

      const currentStatusEntry = JSON.parse(statusEntryData);
      const updatedStatusEntry = {
        ...currentStatusEntry,
        enrollmentStatus: "in-progress",
        updatedAt: new Date().toISOString(),
      };

      await this.redis.hset(
        payloadMapId,
        payloadId,
        JSON.stringify(updatedStatusEntry)
      );
      await this.redis.expire(payloadMapId, 86400);

      const payloadData = await this.redis.get(payloadId);
      if (!payloadData) {
        throw new BadRequestException(`Payload data not found for ${payloadId}`);
      }

      const payloadBucket = JSON.parse(payloadData);
      const payloads = payloadBucket.payloads || [];

      if (!payloads.length) {
        throw new BadRequestException(
          `No payloads found in bucket ${payloadId}`
        );
      }

      let successCount = 0;
      let failedCount = 0;
      let firstErrorLogged = false;
      const results: unknown[] = [];
      const logInterval = 500;
      const concurrencyLimit = 5;
      let intervalStartMs = Date.now();
      let intervalProcessed = 0;

      this.logInfo(
        "processEnrollmentPayload",
        "Payload processing started",
        {
          payloadId,
          totalRecords: payloads.length,
          concurrencyLimit,
          logInterval,
          startTime: new Date(payloadStartTime).toISOString(),
        },
        userId
      );

      for (let start = 0; start < payloads.length; start += concurrencyLimit) {
        const batch = payloads.slice(start, start + concurrencyLimit);
        const batchResults = await Promise.all(
          batch.map(async (dto) => {
            try {
              const res = await this.processEnrollmentData(
                dto,
                userId,
                true,
                { skipValidations: true },
                endorsementId
              );
              return { ok: true, value: res } as const;
            } catch (err) {
              return { ok: false, value: err } as const;
            }
          })
        );

        for (const result of batchResults) {
          if (result.ok) {
            successCount++;
            results.push(result.value);
          } else {
            failedCount++;
            results.push(result.value);
            this.logError(
              "processEnrollmentPayload",
              "Failed to process individual payload",
              { payloadId, error: result.value },
              userId
            );
            if (!firstErrorLogged) {
              firstErrorLogged = true;
              this.logError(
                "processEnrollmentPayload",
                "First payload failure",
                { payloadId, error: result.value },
                userId
              );
            }
          }

          intervalProcessed += 1;
          if (intervalProcessed % logInterval === 0) {
            const intervalEndMs = Date.now();
            this.logInfo(
              "processEnrollmentPayload",
              "Payload processing checkpoint",
              {
                payloadId,
                processedCount: intervalProcessed,
                intervalStartTime: new Date(intervalStartMs).toISOString(),
                intervalEndTime: new Date(intervalEndMs).toISOString(),
                intervalDurationMs: intervalEndMs - intervalStartMs,
              },
              userId
            );
            intervalStartMs = intervalEndMs;
          }
        }
      }

      const finalStatusEntryData = await this.redis.hget(payloadMapId, payloadId);
      if (finalStatusEntryData) {
        const finalStatusEntry = JSON.parse(finalStatusEntryData);
        const finalStatus = failedCount > 0 ? "failed" : "completed";
        const payloadEndTime = Date.now();
        const updatedFinalEntry = {
          ...finalStatusEntry,
          enrollmentStatus: finalStatus,
          updatedAt: new Date().toISOString(),
        };

        await this.redis.hset(
          payloadMapId,
          payloadId,
          JSON.stringify(updatedFinalEntry)
        );
        await this.redis.expire(payloadMapId, 86400);

        this.logInfo(
          "processEnrollmentPayload",
          "Payload processing completed",
          {
            payloadId,
            status: finalStatus,
            successCount,
            failedCount,
            totalProcessed: payloads.length,
            durationMs: payloadEndTime - payloadStartTime,
          },
          userId
        );
      }

      return {
        payloadId,
        totalProcessed: payloads.length,
        successCount,
        failedCount,
        results,
      };
    } catch (error) {
      try {
        const statusEntryData = await this.redis.hget(payloadMapId, payloadId);
        if (statusEntryData) {
          const statusEntry = JSON.parse(statusEntryData);
          const updatedEntry = {
            ...statusEntry,
            enrollmentStatus: "failed",
            updatedAt: new Date().toISOString(),
          };
          await this.redis.hset(
            payloadMapId,
            payloadId,
            JSON.stringify(updatedEntry)
          );
          await this.redis.expire(payloadMapId, 86400);
        }
      } catch (redisError) {
        this.logError(
          "processEnrollmentPayload",
          "Failed to update status to failed",
          { payloadId, redisError },
          userId
        );
      }

      this.logError(
        "processEnrollmentPayload",
        error,
        { payloadId, payloadMapId },
        userId
      );
      throw error;
    }
  }

  calculateAge(dateOfBirth: Date) {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

  calculateAgeAtEffectiveDate(dateOfBirth: Date, effectiveDate: Date): number {
    const today = new Date(effectiveDate);
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return Math.floor(age);
  }

  normalizeValue(val: string): string {
    return val.toLowerCase().replace(/[^a-z0-9]/gi, "");
  }

  matchesRelationGroupSelection(selection: string, group: any): boolean {
    const normalizedSelection = this.normalizeValue(String(selection ?? ""));
    const candidates = [
      group?.groupDisplayName,
      group?.name,
      group?.type,
      group?.relationGroupName,
    ];
    return candidates.some(
      (candidate) =>
        candidate &&
        this.normalizeValue(String(candidate)) === normalizedSelection
    );
  }

  convertToCamelCase(str: string) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
        index === 0 ? match.toLowerCase() : match.toUpperCase()
      )
      .replace(/\s+/g, "")
      .replace(/_/g, "");
  }

  getEmployeeDetailsBasedOnProperties(
    employeeDetails: any,
    employeeKey: string
  ) {
    const normalizedAdditionalDetails: Record<string, unknown> = {};
    for (const key in employeeDetails.additionalDetails) {
      if (!Object.prototype.hasOwnProperty.call(employeeDetails.additionalDetails, key)) continue;
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      normalizedAdditionalDetails[key.replace(/\s+/g, "").toLowerCase()] =
        employeeDetails.additionalDetails[key];
    }
    const normalizedKey = employeeKey.toLowerCase();
    if (
      (normalizedKey === "relationshipgroup" ||
        normalizedKey === "relationgroup") &&
      employeeDetails.relationGroup
    ) {
      return employeeDetails.relationGroup;
    }
    if (employeeDetails[employeeKey]) {
      return employeeDetails[employeeKey];
    }
    if (normalizedAdditionalDetails?.hasOwnProperty(employeeKey.toLowerCase())) {
      return normalizedAdditionalDetails[employeeKey.toLowerCase()];
    }
    if (employeeKey.toLowerCase() === "age" && employeeDetails.dateOfBirth) {
      const dob = new Date(employeeDetails.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    }
    return undefined;
  }

  getEmployeeRelationTypes(
    dependents: UpsertEnrollmentDependentDto[],
    relationships: any,
    constraints: Record<string, any> = {},
    employeeGender = "",
    relationGroupSelection?: string,
    relationGroupDetails?: any[]
  ) {
    try {
      const optionToType: Record<string, string> = {};
      const availableRelationNames = new Set<string>();
      if (relationships?.enabledPolicyRelations) {
        relationships.enabledPolicyRelations.forEach((relType: any) => {
          relType.configuredOptions.forEach((option: any) => {
            if (!option?.name) {
              return;
            }
            optionToType[option.name] = relType.type;
            if (typeof option.name === DATA_TYPES.STRING) {
              const normalizedOptionName = option.name.toLowerCase();
              optionToType[normalizedOptionName] = relType.type;
              const sanitizedOptionName = normalizedOptionName.replace(
                /[-_\s]+/g,
                ""
              );
              availableRelationNames.add(sanitizedOptionName);
            }
          });
        });
      }
      const relationTypes = new Set<string>();
      relationTypes.add("Self");
      // Counts, per mapped relation category (e.g. "parents"), of how many actual
      // dependents fall into it — used to enforce each relation group bucket's own
      // maxCount, since buckets can share the same allowed relation *types* and
      // differ only by how many of that type they permit (e.g. "Single Parents"
      // vs "Two Parents" both allow the "Parents" type, capped at 1 vs 2).
      const relationTypeCounts = new Map<string, number>([["self", 1]]);
      let hasDisallowedRelation = false;
      const normalizedGender = (employeeGender ?? "").toLowerCase();
      const isMale = normalizedGender === GENDER_VALUES.MALE;
      const isFemale = normalizedGender === GENDER_VALUES.FEMALE;
      const matchedRelationGroup =
        relationGroupSelection && Array.isArray(relationGroupDetails)
          ? relationGroupDetails.find((group: any) =>
            this.matchesRelationGroupSelection(relationGroupSelection, group)
          )
          : undefined;
      if (matchedRelationGroup?.selectedRelations?.length) {
        matchedRelationGroup.selectedRelations
          .filter((relation: any) => relation?.selected)
          .forEach((relation: any) => {
            if (relation?.name) {
              relationTypes.add(String(relation.name));
            }
          });
      }
      const parseConstraintFlag = (value: any, defaultValue = true) => {
        if (typeof value === DATA_TYPES.BOOLEAN) {
          return value;
        }
        if (typeof value === DATA_TYPES.STRING) {
          const normalized = value.toLowerCase().trim();
          if (normalized === BOOLEAN_VALUES.TRUE) {
            return true;
          }
          if (normalized === BOOLEAN_VALUES.FALSE) {
            return false;
          }
        }
        return defaultValue;
      };
      const allowMaleParents = parseConstraintFlag(
        constraints?.maleEmployeesCoverParents
      );
      const allowMaleInLaws = parseConstraintFlag(
        constraints?.maleEmployeesCoverInLaws
      );
      const allowFemaleParents = parseConstraintFlag(
        constraints?.femaleEmployeesCoverParents
      );
      const allowFemaleInLaws = parseConstraintFlag(
        constraints?.femaleEmployeesCoverInLaws
      );
      const crossParentsAllowed = parseConstraintFlag(
        constraints?.crossParentsAllowed
      );
      const sameGenderParentsAllowed = parseConstraintFlag(
        constraints?.sameGenderParentsAllowed
      );
      const hasAllCrossParentRelations = [
        PARENT_RELATIONSHIP_TYPES.FATHER,
        PARENT_RELATIONSHIP_TYPES.MOTHER,
        PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW,
        PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW,
      ].every((relation) => availableRelationNames.has(relation));

      const selectedRelationsInfo: {
        sanitized: string;
        type:
        | typeof PARENT_RELATIONSHIP_TYPES.PARENT
        | typeof PARENT_RELATIONSHIP_TYPES.IN_LAW
        | typeof GENDER_VALUES.OTHER;
        gender?: typeof GENDER_VALUES.MALE | typeof GENDER_VALUES.FEMALE;
      }[] = [];
      dependents.forEach((dependent) => {
        const relationName = (
          dependent.relation ??
          dependent.relationshipType ??
          ""
        ).trim();
        if (!relationName) {
          return;
        }
        const normalizedRelation = relationName.toLowerCase();
        const sanitizedRelation = normalizedRelation.replace(/[-_\s]+/g, "");
        const isInLaw = sanitizedRelation.includes(
          PARENT_RELATIONSHIP_TYPES.IN_LAW
        );
        const parentLabels = [
          PARENT_RELATIONSHIP_TYPES.FATHER,
          PARENT_RELATIONSHIP_TYPES.MOTHER,
          PARENT_RELATIONSHIP_TYPES.PARENT,
          PARENT_RELATIONSHIP_TYPES.PARENTS,
        ];
        const isParent = parentLabels.includes(sanitizedRelation);
        const relationType:
          | typeof PARENT_RELATIONSHIP_TYPES.PARENT
          | typeof PARENT_RELATIONSHIP_TYPES.IN_LAW
          | typeof GENDER_VALUES.OTHER = isInLaw
            ? PARENT_RELATIONSHIP_TYPES.IN_LAW
            : isParent
              ? PARENT_RELATIONSHIP_TYPES.PARENT
              : GENDER_VALUES.OTHER;
        let relationGender:
          | typeof GENDER_VALUES.MALE
          | typeof GENDER_VALUES.FEMALE
          | undefined;
        if (
          sanitizedRelation === PARENT_RELATIONSHIP_TYPES.FATHER ||
          sanitizedRelation === PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW
        ) {
          relationGender = (
            dependent.gender ?? GENDER_VALUES.MALE
          ).toLowerCase();
        } else if (
          sanitizedRelation === PARENT_RELATIONSHIP_TYPES.MOTHER ||
          sanitizedRelation === PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW
        ) {
          relationGender = (
            dependent.gender ?? GENDER_VALUES.FEMALE
          ).toLowerCase();
        } else if (relationType !== GENDER_VALUES.OTHER) {
          const dependentGender =
            typeof dependent?.gender === DATA_TYPES.STRING
              ? dependent?.gender?.toLowerCase().trim()
              : "";
          if (
            dependentGender === GENDER_VALUES.MALE ||
            dependentGender === GENDER_VALUES.FEMALE
          ) {
            relationGender = dependentGender;
          }
        }
        if (sanitizedRelation) {
          selectedRelationsInfo.push({
            sanitized: sanitizedRelation,
            type: relationType,
            gender: relationGender,
          });
        }
        let allowed = true;
        if (isInLaw) {
          if (isMale) {
            allowed = allowMaleInLaws;
          } else if (isFemale) {
            allowed = allowFemaleInLaws;
          }
        } else if (isParent) {
          if (isMale) {
            allowed = allowMaleParents;
          } else if (isFemale) {
            allowed = allowFemaleParents;
          }
        }

        if (!allowed) {
          hasDisallowedRelation = true;
          return;
        }

        // Only count this dependent toward relation-group matching if the
        // CURRENT policy's own configured relations actually recognize its
        // relation type. Falling back to the dependent's raw relationshipType
        // when unrecognized let a dependent from an unrelated policy (e.g. a
        // Spouse added under GMC) poison a policy that doesn't define that
        // relation at all (e.g. a Parental-only policy), causing every
        // relation-group option to fail matching and availablePolicyChoices
        // to come back empty.
        const mapped =
          optionToType[relationName] ?? optionToType[normalizedRelation];
        if (mapped) {
          relationTypes.add(mapped);
          const mappedKey = String(mapped).toLowerCase();
          relationTypeCounts.set(
            mappedKey,
            (relationTypeCounts.get(mappedKey) ?? 0) + 1
          );
        }
      });
      if (!crossParentsAllowed && hasAllCrossParentRelations) {
        const selectedRelations = new Set(
          dependents
            .map((dependent) => {
              const relationValue =
                typeof dependent?.relation === DATA_TYPES.STRING
                  ? dependent.relation ?? ""
                  : typeof dependent?.relationshipType === DATA_TYPES.STRING
                    ? dependent.relationshipType ?? ""
                    : "";
              return relationValue
                .trim()
                .toLowerCase()
                .replace(/[-_\s]+/g, "");
            })
            .filter((relation) => relation.length > 0)
        );
        if (selectedRelations.size > 0) {
          const hasFatherWithMotherInLaw =
            selectedRelations.has(PARENT_RELATIONSHIP_TYPES.FATHER) &&
            selectedRelations.has(PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW);
          const hasMotherWithFatherInLaw =
            selectedRelations.has(PARENT_RELATIONSHIP_TYPES.MOTHER) &&
            selectedRelations.has(PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW);
          if (hasFatherWithMotherInLaw || hasMotherWithFatherInLaw) {
            hasDisallowedRelation = true;
          }
        }
      }
      if (!sameGenderParentsAllowed && hasAllCrossParentRelations) {
        const parentGenders = new Set<string>();
        const inLawGenders = new Set<string>();
        selectedRelationsInfo.forEach((info) => {
          if (info.type === PARENT_RELATIONSHIP_TYPES.PARENT && info.gender) {
            parentGenders.add(info.gender);
          }
          if (info.type === PARENT_RELATIONSHIP_TYPES.IN_LAW && info.gender) {
            inLawGenders.add(info.gender);
          }
        });
        const hasMaleConflict =
          parentGenders.has(GENDER_VALUES.MALE) &&
          inLawGenders.has(GENDER_VALUES.MALE);
        const hasFemaleConflict =
          parentGenders.has(GENDER_VALUES.FEMALE) &&
          inLawGenders.has(GENDER_VALUES.FEMALE);
        if (hasMaleConflict || hasFemaleConflict) {
          hasDisallowedRelation = true;
        }
      }
      return {
        relationTypes: Array.from(relationTypes).sort(),
        relationTypeCounts,
        hasDisallowedRelation,
      };
    } catch (error) {
      this.logError(
        "getEmployeeRelationTypes",
        error,
        { dependents, relationships }
      );
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.failedToFetchRelationsAndDependents
      );
    }
  }

  async getEmployeeDetailsWithPolicyComponents(
    employeeDetails: {
      id: number;
      relationGroup?: string;
      additionalDetails?: Record<string, unknown>;
      [key: string]: unknown;
    },
    policyConfig: any,
    policyId: number,
    dependents: UpsertEnrollmentDependentDto[] = [],
    isPolicyConfigBasedOnRelationship: boolean = false,
    isModified: boolean = false,
    isEmployeeInThisEndorsement: boolean = true
  ) {
    const policiesMappedToCompanyEmployee =
      await this.enrollmentRepository.getPoliciesByEmployee(employeeDetails.id);
    const isCompanyEmployeeMappedToPolicy =
      policiesMappedToCompanyEmployee.filter((policies) => policies.id === policyId);
    if (!isCompanyEmployeeMappedToPolicy.length) {
      throw new BadRequestException(
        `The policy with ID ${policyId} is not mapped to the employee`
      );
    }
    const policyChoicesApplicable = this.filterPolicyOptions(
      employeeDetails,
      policyConfig,
      dependents,
      isEmployeeInThisEndorsement
    );

    // Preview-time per-life premium: for parameters with `applyToDependents: true`,
    // the flat bucket premium above is only the base choice — each enrolled life's
    // own premium must be summed in (same logic already used at final submission
    // in validateComponentChoices). Without this, the preview screen shows the raw
    // per-component premium and the frontend naively multiplies it by headcount,
    // which is wrong whenever lives have different ages/bands.
    const applyToDepParams = (policyConfig?.parameters ?? []).filter(
      (p: any) => p.applyToDependents === true
    );
    const previewGatePasses =
      applyToDepParams.length > 0 &&
      Boolean(policyChoicesApplicable) &&
      typeof policyChoicesApplicable === "object" &&
      Array.isArray((policyChoicesApplicable as any)?.optionMeta) &&
      (policyChoicesApplicable as any).optionMeta.length > 0;
    if (!previewGatePasses) {
      this.logError(
        "getEmployeeDetailsWithPolicyComponents",
        "applyToDependents preview override skipped — falling back to flat/self-only premium",
        {
          applyToDepParamsCount: applyToDepParams.length,
          hasPolicyChoicesApplicable: Boolean(policyChoicesApplicable),
          optionMetaLength: Array.isArray(
            (policyChoicesApplicable as any)?.optionMeta
          )
            ? (policyChoicesApplicable as any).optionMeta.length
            : "not-an-array",
          dependentCount: (dependents ?? []).length,
        }
      );
    }
    if (previewGatePasses) {
      const baseOptionMeta = (policyChoicesApplicable as any).optionMeta;
      const allPolicyOptions: any[] = Array.isArray(policyConfig?.policyOptions)
        ? policyConfig.policyOptions
        : [];
      const dependentCountZeroOptionMeta = findDependentCountZeroOptionMeta(
        policyConfig?.parameters ?? []
      );
      const sections: any[] = [
        (policyChoicesApplicable as any).basePolicyChoices?.mainPolicyChoices,
        ...((policyChoicesApplicable as any).basePolicyChoices?.addonChoices ?? []),
        (policyChoicesApplicable as any).parentalPolicyChoices?.mainPolicyChoices,
        ...((policyChoicesApplicable as any).parentalPolicyChoices?.addonChoices ?? []),
      ].filter(Boolean);

      for (const param of applyToDepParams) {
        for (const section of sections) {
          const compId = Number(section?.policyId ?? 0);
          if (!compId) continue;
          const choice = (section.choices ?? []).find(
            (c: any) => c.isAvailable !== false
          );
          if (!choice) continue;
          try {
            const resolved = resolveApplyToDependentsPremium({
              parameter: param,
              employee: employeeDetails,
              dependents,
              baseOptionMeta,
              policyOptions: allPolicyOptions,
              componentId: compId,
              effectiveDate: (employeeDetails as any).effectiveDate ?? null,
              dependentCountZeroOptionMeta,
            });
            choice.companyContribution = resolved.companyPay;
            choice.employeeContribution = resolved.employeePay;
            // Signals to the frontend that this premium is already the full
            // per-life sum — do not multiply by enrolled member count again.
            choice.premiumPerLife = false;
            // Per-life composition so the UI can show how the total was built
            // up (e.g. "Self: X + Radha: Y") instead of just the lump sum.
            choice.premiumBreakdown = resolved.perLife;
          } catch (err) {
            // Preview must never block on a resolution error (e.g. a life's
            // age doesn't match any band yet) — leave the base choice as-is,
            // but log it so a silently-reverted-to-self-only premium is
            // diagnosable instead of invisible.
            this.logError(
              "getEmployeeDetailsWithPolicyComponents",
              err instanceof Error ? err.message : String(err),
              {
                compId,
                parameterId: param?.id,
                dependentCount: (dependents ?? []).length,
              }
            );
          }
        }
      }
    }

    // Preview-time Sum Insured enhancement: same reasoning as the premium
    // override above — the Dependent Count band's siEnhancement is real money
    // (used at final save via resolveDependentCountSiEnhancement) but the
    // preview screen was showing only the flat base SI. Add it here too, on
    // the same `choice.sumInsured` field the frontend already reads as-is.
    {
      const siEnhancement = resolveDependentCountSiEnhancement(
        policyConfig,
        dependents,
        isEmployeeInThisEndorsement
      );
      if (siEnhancement > 0) {
        const allSections: any[] = [
          (policyChoicesApplicable as any)?.basePolicyChoices?.mainPolicyChoices,
          ...((policyChoicesApplicable as any)?.basePolicyChoices?.addonChoices ?? []),
          (policyChoicesApplicable as any)?.parentalPolicyChoices?.mainPolicyChoices,
          ...((policyChoicesApplicable as any)?.parentalPolicyChoices?.addonChoices ?? []),
        ].filter(Boolean);
        const componentsList: any[] = Array.isArray(policyConfig?.components)
          ? policyConfig.components
          : [];
        for (const section of allSections) {
          const choice = (section.choices ?? []).find(
            (c: any) => c.isAvailable !== false
          );
          if (!choice) continue;
          const component = componentsList.find(
            (c: any) => Number(c.id) === Number(section.policyId)
          );
          const siOption = component?.sumInsuredOptions?.find(
            (opt: any) => opt.id === choice.sumInsuredId
          );
          const baseSi = Number(siOption?.value ?? 0);
          if (baseSi > 0) {
            choice.sumInsured = baseSi + siEnhancement;
            // Breakdown so the UI can show "Base + Dependent Enhancement" instead
            // of just the combined total.
            choice.sumInsuredBreakdown = { base: baseSi, enhancement: siEnhancement };
          }
        }
      }
    }

    let enrollmentChoicesMade: any[] = [];
    if (isModified && isPolicyConfigBasedOnRelationship) {
      enrollmentChoicesMade = [];
    } else {
      enrollmentChoicesMade =
        await this.enrollmentRepository.getEnrollmentComponents(
          policyId,
          employeeDetails.id
        );
    }
    return {
      enrollmentChoicesMade,
      policyComponentsConfiguration: {
        components: policyConfig.components,
        parameters: policyConfig.parameters,
        // Needed by the UI to price a not-yet-saved dependent's own age/lov
        // bucket for applyToDependents parameters while the enrollment is
        // still being composed (before any submit call runs this class's
        // own per-life resolution against persisted dependents).
        policyOptions: policyConfig.policyOptions,
        availablePolicyChoices: policyChoicesApplicable,
      },
    };
  }

  filterPolicyOptions(
    employeeDetails: any,
    policyConfig: any,
    dependents: UpsertEnrollmentDependentDto[] = [],
    isEmployeeInThisEndorsement: boolean = true
  ) {
    for (const option of policyConfig.policyOptions) {
      let matchesAllConditions = true;

      for (const meta of option.optionMeta) {
        const paramDetails = policyConfig.parameters.find(
          (parameter: any) => parameter.id === meta.parameterId
        );

        const paramName = paramDetails.displayName;
        const employeeKey = this.convertToCamelCase(paramName.toLowerCase());
        const employeeValue = this.getEmployeeDetailsBasedOnProperties(
          employeeDetails,
          employeeKey
        );

        let isMatch = false;

        if (
          paramDetails.type?.toLocaleLowerCase() ===
          POLICY_RELATIONSHIP_TYPE_PARAMETER.toLocaleLowerCase() &&
          paramDetails.relationGroupDetails &&
          paramDetails.relationGroupDetails.length > 0
        ) {
          // const relationGroupSelection =
          //   typeof employeeValue === DATA_TYPES.STRING
          //     ? employeeValue
          //     : undefined;
          const matchedGroup = paramDetails.relationGroupDetails.find(
            (relationGroupDetail: any) =>
              relationGroupDetail.id === meta.parameterOptionId
          );
          if (matchedGroup) {
            const {
              relationTypes: employeeRelations,
              relationTypeCounts,
              hasDisallowedRelation,
            } = this.getEmployeeRelationTypes(
                dependents,
                policyConfig.relationships,
                policyConfig.constraints,
                // employeeDetails.gender,
                // relationGroupSelection,
                // paramDetails.relationGroupDetails
              );

            const selectedGroupRelations = matchedGroup.selectedRelations
              .filter((selectedReation: any) => selectedReation.selected);
            const groupRelations = selectedGroupRelations
              .map((selectedReation: any) => selectedReation.name)
              .sort();
            if (!hasDisallowedRelation) {
              const normalizedGroupRelations = new Set(
                groupRelations.map((groupRelation: string) =>
                  groupRelation.toLowerCase(),
                ),
              );

              const allRelationTypesAllowed = employeeRelations.every(
                (employeeRelation: string) =>
                  normalizedGroupRelations.has(employeeRelation.toLowerCase()),
              );

              // Relation groups can share the same allowed relation types and differ
              // only by how many of each type they permit (e.g. "Single Parents" vs
              // "Two Parents" both allow "Parents", capped at 1 vs 2) — so matching
              // on type alone can't tell them apart. Require the actual dependent
              // count per type to fit within this group's own maxCount too.
              const countsWithinLimits = selectedGroupRelations.every(
                (selectedRelation: any) => {
                  const relationKey = String(
                    selectedRelation.name ?? ""
                  ).toLowerCase();
                  const actualCount =
                    relationTypeCounts.get(relationKey) ?? 0;
                  const maxCount =
                    convertSafeStringToInteger(selectedRelation.maxCount) ??
                    Number.POSITIVE_INFINITY;
                  return actualCount <= maxCount;
                },
              );

              isMatch = allRelationTypesAllowed && countsWithinLimits;
            }
          }
        } else if (
          paramDetails.lovDetails &&
          paramDetails.lovDetails.length > 0
        ) {
          const matchedLov = paramDetails.lovDetails.find(
            (lovDetail: any) => lovDetail.id === meta.parameterOptionId
          );
          const expectedValue = matchedLov?.value;

          if (
            (employeeValue ?? "").toLowerCase() ===
            (expectedValue ?? "").toLowerCase()
          ) {
            isMatch = true;
          }
        } else if (
          paramDetails.rangeDetails &&
          paramDetails.rangeDetails.length > 0
        ) {
          const value = convertSafeStringToInteger(employeeValue) ?? 0;
          const matchedRange = paramDetails.rangeDetails.find(
            (rangeDetail: any) => rangeDetail.id === meta.parameterOptionId
          );

          isMatch =
            value >=
            (typeof matchedRange?.min === "string"
              ? convertSafeStringToInteger(matchedRange?.min)
              : matchedRange?.min) &&
            value <=
            (typeof matchedRange?.max === "string"
              ? convertSafeStringToInteger(matchedRange?.max)
              : matchedRange?.max);
        } else if (
          paramDetails.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
          paramDetails.internalType === DEPENDENT_COUNT_INTERNAL_TYPE
        ) {
          // Dependent-count parameter: count enrolled dependents of the target
          // relation category and match against the configured count bands.
          const dcConfig = paramDetails.dependentCountConfig;
          if (dcConfig?.countBands?.length) {
            const targetNorm = (dcConfig.targetRelationCategory ?? "")
              .toLowerCase()
              .trim()
              .replace(/[^a-z]/g, "");
            // "All" counts dependents only — the employee is never part of this count.
            const enrolledCount =
              targetNorm === DEPENDENT_COUNT_ALL_CATEGORY.toLowerCase()
                ? (dependents ?? []).length
                : (dependents ?? []).filter((dep) => {
                    const relNorm = (dep.relation ?? dep.relationshipType ?? "")
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z]/g, "");
                    return (
                      relNorm === targetNorm ||
                      relNorm.includes(targetNorm) ||
                      targetNorm.includes(relNorm)
                    );
                  }).length;

            const matchedBand = dcConfig.countBands.find((band: any) => {
              const min = parseInt(String(band.minCount ?? 0)) || 0;
              const rawMax =
                band.maxCount !== null && band.maxCount !== undefined
                  ? parseInt(String(band.maxCount))
                  : NaN;
              const max = isNaN(rawMax)
                ? Number.POSITIVE_INFINITY
                : rawMax;
              return enrolledCount >= min && enrolledCount <= max;
            });

            isMatch =
              matchedBand !== undefined &&
              String(matchedBand.id) === String(meta.parameterOptionId);
          }
        }

        if (!isMatch) {
          matchesAllConditions = false;
          break;
        }
      }

      if (matchesAllConditions) {
        return option;
      }
    }

    return {};
  }

  async validateDependentAges(
    policyId: number,
    dtos: UpsertEnrollmentDependentDto[],
    employeeId?: number
  ) {
    const config =
      await this.enrollmentRepository.getConfigRelationsAndContains(policyId);
    if (!config) {
      throw new BadRequestException("Policy configuration not found");
    }
    const constraints = (config.constraints as Record<string, any>) ?? {};
    const optionMap = new Map<
      string,
      { min?: number; max?: number; type: string }
    >();
    const typeMap = new Map<string, { maxCount?: number; type: string }>();
    const rels = config.relationships?.enabledPolicyRelations || [];
    for (const rel of rels) {
      const typeKey = this.normalizeValue(rel.type);
      typeMap.set(typeKey, {
        maxCount: rel.maxCount ? Number(rel.maxCount) : undefined,
        type: rel.type,
      });
      for (const opt of rel.configuredOptions || []) {
        if (opt.enabled) {
          optionMap.set(this.normalizeValue(opt.name), {
            min: opt.minAge ? Number(opt.minAge) : undefined,
            max: opt.maxAge ? Number(opt.maxAge) : undefined,
            type: rel.type,
          });
        }
      }
    }

    let employeeAge: number | undefined = 0;
    if (employeeId) {
      const employeeDetails =
        await this.enrollmentRepository.getEmployeeDetailsByEmployeeId(
          employeeId
        );
      const employeeDob = employeeDetails?.dateOfBirth
        ? new Date(employeeDetails.dateOfBirth)
        : undefined;
      if (employeeDob && !Number.isNaN(employeeDob.getTime())) {
        employeeAge = this.calculateAge(employeeDob);
      }
    }

    const counts = new Map<string, number>();
    // Track DOBs per relationship type for twin override validation.
    const typeDobs = new Map<string, number[]>();
    for (const dto of dtos) {
      const optCfg = optionMap.get(this.normalizeValue(dto.relation));
      if (!optCfg) continue;
      dto.relationshipType = dto.relationshipType || optCfg.type;

      if (dto.dateOfBirth) {
        const effectiveDate = dto.effectiveDate ? new Date(dto.effectiveDate) : new Date();
        const age = this.calculateAgeAtEffectiveDate(new Date(dto.dateOfBirth), effectiveDate);

        const sanitizedRelation = this.normalizeValue(dto.relation);
        const sanitizedType = this.normalizeValue(optCfg.type);
        const isInLawRelation = sanitizedRelation.includes(
          PARENT_RELATIONSHIP_TYPES.IN_LAW
        );
        if (optCfg.min !== undefined && age < optCfg.min) {
          throw new BadRequestException(
            `Age for relation ${dto.relation} must be at least ${optCfg.min}`
          );
        }

        let effectiveMaxAge =
          typeof optCfg.max === DATA_TYPES.NUMBER && !Number.isNaN(optCfg.max)
            ? optCfg.max ?? 0
            : 0;
        if (typeof effectiveMaxAge === DATA_TYPES.NUMBER) {
          const studyingSonExtension = Number(
            constraints?.studyingSonAgeExtension ?? 0
          );
          if (
            studyingSonExtension > 0 &&
            sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.SON) &&
            !isInLawRelation
          ) {
            effectiveMaxAge += studyingSonExtension;
          }

          const unmarriedDaughterExtension = Number(
            constraints?.unmarriedDaughterAgeExtension ??
            constraints?.unmarriedDaughterAgLimitExtension ??
            0
          );
          if (
            unmarriedDaughterExtension > 0 &&
            sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.DAUGHTER) &&
            !isInLawRelation
          ) {
            effectiveMaxAge += unmarriedDaughterExtension;
          }
        }

        if (
          typeof effectiveMaxAge === "number" &&
          !Number.isNaN(effectiveMaxAge) &&
          age > effectiveMaxAge
        ) {
          throw new BadRequestException(
            `Age for relation ${dto.relation} must not exceed ${effectiveMaxAge}`
          );
        }
        if (typeof employeeAge === DATA_TYPES.NUMBER) {
          const isParentRelation =
            sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.PARENT) ||
            sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.FATHER) ||
            sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.MOTHER) ||
            sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.PARENTS);

          if (isParentRelation) {
            const parentGapThreshold = Number(
              constraints?.ageGapBetweenParentAndEmployee ?? 0
            );
            if (parentGapThreshold > 0) {
              const actualGap = age - employeeAge;
              if (actualGap < parentGapThreshold) {
                throw new BadRequestException(
                  `Age gap between employee and ${dto.relation} should be at least ${parentGapThreshold} years.`
                );
              }
            }
          }

          const isChildRelation =
            sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.CHILD) ||
            (!isInLawRelation &&
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.SON)) ||
            (!isInLawRelation &&
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.DAUGHTER)) ||
            sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.CHILD);

          if (isChildRelation) {
            const childGapConstraint =
              constraints?.ageGapBetweenChildrenAndEmployee ??
              constraints?.ageGapBetweenParentAndEmployee ??
              0;
            const childGapThreshold = Number(childGapConstraint);
            if (childGapThreshold > 0) {
              const actualGap = employeeAge - age;
              if (actualGap < childGapThreshold) {
                throw new BadRequestException(
                  `Age gap between employee and ${dto.relation} should be at least ${childGapThreshold} years.`
                );
              }
            }
          }
        }
      }

      const typeKey = this.normalizeValue(optCfg.type);
      const newCount = (counts.get(typeKey) || 0) + 1;

      // Collect DOB timestamp for twin override check.
      if (dto.dateOfBirth) {
        const dobTime = new Date(dto.dateOfBirth).getTime();
        if (!Number.isNaN(dobTime)) {
          if (!typeDobs.has(typeKey)) typeDobs.set(typeKey, []);
          typeDobs.get(typeKey)!.push(dobTime);
        }
      }

      counts.set(typeKey, newCount);
      const tCfg = typeMap.get(typeKey);
      if (tCfg?.maxCount !== undefined && newCount > tCfg.maxCount) {
        // Allow extra children when twins/triplets constraints are enabled and
        // the youngest children share the same DOB (mirrors canAddChildWithTwinOverride
        // and canAddChildWithTripletOverride in enrollment-file-upload.util.ts).
        let overrideAllowed = false;
        const twinsSecondChildAllowed = !!constraints?.twinsSecondChildAllowed;
        const tripletsSecondChildAllowed = !!constraints?.tripletsSecondChildAllowed;
        const allowFirstChildAsTwin = !!constraints?.allowFirstChildAsTwin;
        const isChildType = typeKey.includes('child');

        if (isChildType) {
          const allDobTimes = typeDobs.get(typeKey) || [];
          const sorted = [...allDobTimes].sort((a, b) => a - b);
          const last = sorted[sorted.length - 1];

          // Each enabled multiple-birth scenario is checked independently and
          // OR-ed together (mirrors the OR of canAdd* overrides in
          // enrollment-file-upload.util.ts and enrollment-upload.scheduler.ts).
          // Using `else if` here would let an earlier-but-non-matching branch
          // (e.g. triplets-only) shadow a later combination branch (twin+triplet).
          if (!overrideAllowed && twinsSecondChildAllowed && newCount === tCfg.maxCount + 1 && sorted.length >= 2) {
            // Twins: 2 youngest share same DOB
            const secondLast = sorted[sorted.length - 2];
            if (last === secondLast) {
              const count = sorted.filter((t) => t === last).length;
              overrideAllowed = count === 2;
            }
          }
          if (!overrideAllowed && tripletsSecondChildAllowed && sorted.length >= 2) {
            if (newCount === tCfg.maxCount + 1) {
              const secondLast = sorted[sorted.length - 2];
              if (last === secondLast) {
                const count = sorted.filter((t) => t === last).length;
                overrideAllowed = count >= 2 && count <= 3;
              }
            } else if (newCount === tCfg.maxCount + 2 && sorted.length >= 3) {
              const thirdLast = sorted[sorted.length - 3];
              if (last === thirdLast) {
                const count = sorted.filter((t) => t === last).length;
                overrideAllowed = count === 3;
              }
            }
          }
          if (!overrideAllowed && allowFirstChildAsTwin && newCount === tCfg.maxCount + 1 && sorted.length >= 2) {
            // First child slot is a twin pair: 2 OLDEST share same DOB, 3rd is a different younger child
            const oldest = sorted[0];
            const secondOldest = sorted[1];
            if (oldest === secondOldest) {
              const count = sorted.filter((t) => t === oldest).length;
              overrideAllowed = count === 2;
            }
          }
          if (!overrideAllowed && allowFirstChildAsTwin && tripletsSecondChildAllowed && sorted.length >= 3 && newCount <= tCfg.maxCount + 3) {
            // Oldest 2 are twin pair (same DOB), remaining (up to 3) are triplet group (same different DOB)
            const twinDob = sorted[0];
            if (sorted[1] === twinDob) {
              const twinCount = sorted.filter((t) => t === twinDob).length;
              if (twinCount === 2) {
                const tripletDob = sorted[2];
                if (tripletDob !== undefined && tripletDob !== twinDob) {
                  overrideAllowed = sorted.slice(2).every((t) => t === tripletDob);
                }
              }
            }
          }
          if (!overrideAllowed && twinsSecondChildAllowed && allowFirstChildAsTwin && sorted.length >= 3) {
            // Double twin: oldest 2 share one DOB, youngest 2 share a different DOB → maxCount+2 total
            if (newCount === tCfg.maxCount + 1) {
              // Either pair being formed
              const oldest = sorted[0];
              const secondOldest = sorted[1];
              if (oldest === secondOldest) {
                overrideAllowed = sorted.filter((t) => t === oldest).length === 2;
              } else if (last === sorted[sorted.length - 2]) {
                overrideAllowed = sorted.filter((t) => t === last).length === 2;
              }
            } else if (newCount === tCfg.maxCount + 2 && sorted.length >= 4) {
              const oldest = sorted[0];
              const secondOldest = sorted[1];
              const youngest = sorted[sorted.length - 1];
              const secondYoungest = sorted[sorted.length - 2];
              if (oldest === secondOldest && youngest === secondYoungest && oldest !== youngest) {
                const oldestCount = sorted.filter((t) => t === oldest).length;
                const youngestCount = sorted.filter((t) => t === youngest).length;
                overrideAllowed = oldestCount === 2 && youngestCount === 2;
              }
            }
          }
        }

        if (!overrideAllowed) {
          throw new BadRequestException(
            `Exceeded max count ${tCfg.maxCount} for ${tCfg.type}`
          );
        }
      }
    }
  }

  async validateComponentChoices(
    policyId: number,
    dtos: EnrollmentChoiceDto[],
    employeeId: number,
    dependents: UpsertEnrollmentDependentDto[] = [],
    isEmployeeInThisEndorsement: boolean = true
  ) {
    if (!dtos.length) return;
    const configRecord =
      await this.enrollmentRepository.getPolicyConfigurationByPolicyId(
        policyId
      );
    if (!configRecord) {
      throw new BadRequestException("Policy configuration not found");
    }
    const config = configRecord.policyConfiguration as any;

    const employeeDetails =
      await this.enrollmentRepository.getEmployeeDetailsByEmployeeId(employeeId);
    if (!employeeDetails) {
      throw new BadRequestException(
        errorMessages.failedToFetchEmployeePolicyComponents
      );
    }

    const policyChoicesApplicable = this.filterPolicyOptions(
      employeeDetails,
      configRecord.policyConfiguration,
      dependents,
      isEmployeeInThisEndorsement
    );

    const componentMap = new Map<number, any>();
    for (const component of config?.components || []) {
      componentMap.set(component.id, component);
    }

    const validMap = new Map<
      number,
      Array<{
        sumInsured: number;
        companyContribution: number;
        employeeContribution: number;
        premiumPerLife?: boolean;
        sumInsuredModel?: string;
        sumInsuredModelProperty?: string;
        minSumInsuredValue?: number;
        maxSumInsuredValue?: number;
      }>
    >();

    const collectChoices = (section: any) => {
      if (!section || !section.choices) return;
      const componentId = section.policyId;
      const component = componentMap.get(componentId);
      if (!component) return;
      for (const choice of section.choices) {
        if (!choice.isAvailable) continue;
        const si = component.sumInsuredOptions?.find(
          (opt: any) => opt.id === choice.sumInsuredId
        );
        if (!si) continue;
        const list = validMap.get(componentId) ?? [];
        list.push({
          sumInsured: Number(si.value),
          companyContribution: choice.companyContribution,
          employeeContribution: choice.employeeContribution,
          premiumPerLife: component.premiumPerLife ?? false,
          sumInsuredModel: component?.sumInsuredModel,
          sumInsuredModelProperty: component?.siMultipleLabel,
          minSumInsuredValue: component?.siMultipleMin,
          maxSumInsuredValue: component.siMultipleMax,
        });
        validMap.set(componentId, list);
      }
    };

    if (policyChoicesApplicable.basePolicyChoices) {
      collectChoices(
        policyChoicesApplicable.basePolicyChoices.mainPolicyChoices
      );
      for (const addon of policyChoicesApplicable.basePolicyChoices
        .addonChoices || []) {
        collectChoices(addon);
      }
    }
    if (policyChoicesApplicable.parentalPolicyChoices) {
      collectChoices(
        policyChoicesApplicable.parentalPolicyChoices.mainPolicyChoices
      );
      for (const addon of policyChoicesApplicable.parentalPolicyChoices
        .addonChoices || []) {
        collectChoices(addon);
      }
    }

    // C-1: Block enrollment when the enrolled dependent count for a
    // dependent-count parameter falls outside all configured bands (BR-028).
    // The siEnhancement itself is NOT computed/stored here — it's calculated
    // fresh in updateEnrollmentStatus (via resolveDependentCountSiEnhancement)
    // so it never goes stale when dependents are added independently later.
    const dcParams = (config?.parameters ?? []).filter(
      (p: any) =>
        p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
        p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE,
    );
    for (const dcParam of dcParams) {
      const dcConfig = dcParam.dependentCountConfig;
      if (!dcConfig?.countBands?.length) continue;
      const targetNorm = (dcConfig.targetRelationCategory ?? "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z]/g, "");
      // "All" counts dependents only — the employee is never part of this count.
      const enrolledCount =
        targetNorm === DEPENDENT_COUNT_ALL_CATEGORY.toLowerCase()
          ? (dependents ?? []).length
          : (dependents ?? []).filter((dep) => {
              const relNorm = (dep.relation ?? dep.relationshipType ?? "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z]/g, "");
              return (
                relNorm === targetNorm ||
                relNorm.includes(targetNorm) ||
                targetNorm.includes(relNorm)
              );
            }).length;
      const matchedBand = dcConfig.countBands.find((band: any) => {
        const min = parseInt(String(band.minCount ?? 0)) || 0;
        const rawMax =
          band.maxCount !== null && band.maxCount !== undefined
            ? parseInt(String(band.maxCount))
            : NaN;
        const max = isNaN(rawMax) ? Number.POSITIVE_INFINITY : rawMax;
        return enrolledCount >= min && enrolledCount <= max;
      });
      if (!matchedBand) {
        throw new BadRequestException(
          `Enrolled count of ${dcConfig.targetRelationCategory} (${enrolledCount}) does not match any configured count band. Please review your dependent selections.`,
        );
      }
    }

    // C-3 below recomputes premium/companyPay/employeePay for components governed
    // by an `applyToDependents: true` parameter (dependent-aware combined total:
    // self band + each dependent's own band). Strict premium matching in the loop
    // below would always reject that submitted total since it isn't any single
    // Stage 5 choice in updatedValidChoices — so for those policies, skip premium
    // matching here and validate sum insured legitimacy only, deferring to C-3 as
    // the authoritative source for premium/companyPay/employeePay.
    const applyToDepParams = (config?.parameters ?? []).filter(
      (p: any) => p.applyToDependents === true,
    );
    const skipPremiumMatch = applyToDepParams.length > 0;

    // Dependent Count SI enhancement (see resolveDependentCountSiEnhancement) is
    // added to the base Sum Insured at preview time (getEmployeeDetailsWithPolicyComponents),
    // so the client legitimately submits `sumInsured = base + enhancement`. Add the
    // same enhancement to the expected value here so a valid enhanced submission
    // isn't rejected as an "invalid choice". Resolves to 0 (no-op) for policies
    // without a Dependent Count parameter.
    const siEnhancement = resolveDependentCountSiEnhancement(
      config,
      dependents,
      isEmployeeInThisEndorsement,
    );

    for (const choice of dtos) {
      const compId = choice.policyComponentActionTypeId || 0;
      if (!componentMap.has(compId)) {
        throw new BadRequestException(`Invalid policy component id ${compId}`);
      }
      const validChoices = validMap.get(compId) || [];
      const updatedValidChoices = this.transformPolicyChoices(
        validChoices,
        employeeDetails as any
      );
      const normalizeMoney = (value: unknown): number => {
        const numeric = Number(value ?? 0);
        if (!Number.isFinite(numeric)) {
          return 0;
        }
        return Math.round(numeric * 100) / 100;
      };
      let match = skipPremiumMatch ? undefined : updatedValidChoices.find((validChoice) => {
        let expectedSumInsured = validChoice.sumInsured;
        let expectedCompanyPay = validChoice.updatedCompanyContribution;
        let expectedEmployeePay = validChoice.updatedEmployeeContribution;

        if (validChoice.sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE) {
          const multiplier =
            this.resolveEmployeeMultiplierValue(
              employeeDetails as Record<string, any>,
              validChoice.sumInsuredModelProperty
            ) ?? 1;
          const resolvedSumInsured = this.resolveApplicableSumInsuredValue(
            validChoice,
            validChoice.sumInsured * multiplier
          );
          const finalSumInsured =
            resolvedSumInsured ?? validChoice.sumInsured * multiplier;
          expectedSumInsured = finalSumInsured;
          expectedCompanyPay =
            (finalSumInsured * validChoice.updatedCompanyContribution) / 1000;
          expectedEmployeePay =
            (finalSumInsured * validChoice.updatedEmployeeContribution) / 1000;
        }
        expectedSumInsured += siEnhancement;

        return (
          expectedSumInsured === choice.sumInsured &&
          normalizeMoney(expectedCompanyPay) === normalizeMoney(choice.companyPay) &&
          normalizeMoney(expectedEmployeePay) === normalizeMoney(choice.employeePay) &&
          normalizeMoney(expectedCompanyPay + expectedEmployeePay) ===
          normalizeMoney(choice.premium)
        );
      });
      if (!match) {
        // Client can send stale premium/companyPay/employeePay after relationship-group refresh.
        // Normalize to server-calculated contributions as long as sum insured is valid.
        const sumInsuredOnlyMatch = updatedValidChoices.find((validChoice) => {
          let expectedSumInsured = validChoice.sumInsured;

          if (validChoice.sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE) {
            const multiplier =
              this.resolveEmployeeMultiplierValue(
                employeeDetails as Record<string, any>,
                validChoice.sumInsuredModelProperty
              ) ?? 1;
            const resolvedSumInsured = this.resolveApplicableSumInsuredValue(
              validChoice,
              validChoice.sumInsured * multiplier
            );
            expectedSumInsured =
              resolvedSumInsured ?? validChoice.sumInsured * multiplier;
          }
          expectedSumInsured += siEnhancement;

          return expectedSumInsured === choice.sumInsured;
        });

        if (sumInsuredOnlyMatch) {
          let expectedCompanyPay = sumInsuredOnlyMatch.updatedCompanyContribution;
          let expectedEmployeePay =
            sumInsuredOnlyMatch.updatedEmployeeContribution;

          if (sumInsuredOnlyMatch.sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE) {
            const multiplier =
              this.resolveEmployeeMultiplierValue(
                employeeDetails as Record<string, any>,
                sumInsuredOnlyMatch.sumInsuredModelProperty
              ) ?? 1;
            const resolvedSumInsured = this.resolveApplicableSumInsuredValue(
              sumInsuredOnlyMatch,
              sumInsuredOnlyMatch.sumInsured * multiplier
            );
            const finalSumInsured =
              resolvedSumInsured ?? sumInsuredOnlyMatch.sumInsured * multiplier;
            expectedCompanyPay =
              (finalSumInsured *
                sumInsuredOnlyMatch.updatedCompanyContribution) /
              1000;
            expectedEmployeePay =
              (finalSumInsured *
                sumInsuredOnlyMatch.updatedEmployeeContribution) /
              1000;
          }

          this.logger.log({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceId,
              status: "warning",
              location: this.location,
              method: "validateComponentChoices",
              payload: {
                policyId,
                employeeId,
                compId,
                received: {
                  sumInsured: choice.sumInsured,
                  companyPay: choice.companyPay,
                  employeePay: choice.employeePay,
                  premium: choice.premium,
                },
                normalized: {
                  companyPay: normalizeMoney(expectedCompanyPay),
                  employeePay: normalizeMoney(expectedEmployeePay),
                  premium: normalizeMoney(expectedCompanyPay + expectedEmployeePay),
                },
              },
              messageData: "Normalizing client-provided contributions to server-calculated values",
            }),
          });

          choice.companyPay = normalizeMoney(expectedCompanyPay);
          choice.employeePay = normalizeMoney(expectedEmployeePay);
          choice.premium = normalizeMoney(expectedCompanyPay + expectedEmployeePay);
          match = sumInsuredOnlyMatch;
        }
      }
      if (!match) {
        const receivedChoice = {
          sumInsured: choice.sumInsured,
          companyPay: choice.companyPay,
          employeePay: choice.employeePay,
          premium: choice.premium,
          policyComponentActionTypeId: choice.policyComponentActionTypeId,
          policyComponentActionType: choice.policyComponentActionType,
        };

        const candidates = updatedValidChoices.map((validChoice) => {
          let expectedSumInsured = validChoice.sumInsured;
          let expectedCompanyPay = validChoice.updatedCompanyContribution;
          let expectedEmployeePay = validChoice.updatedEmployeeContribution;

          if (validChoice.sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE) {
            const multiplier =
              this.resolveEmployeeMultiplierValue(
                employeeDetails as Record<string, any>,
                validChoice.sumInsuredModelProperty
              ) ?? 1;
            const resolvedSumInsured = this.resolveApplicableSumInsuredValue(
              validChoice,
              validChoice.sumInsured * multiplier
            );
            const finalSumInsured =
              resolvedSumInsured ?? validChoice.sumInsured * multiplier;
            expectedSumInsured = finalSumInsured;
            expectedCompanyPay =
              (finalSumInsured * validChoice.updatedCompanyContribution) / 1000;
            expectedEmployeePay =
              (finalSumInsured * validChoice.updatedEmployeeContribution) / 1000;
          }
          expectedSumInsured += siEnhancement;
          const expectedPremium = expectedCompanyPay + expectedEmployeePay;
          return {
            expected: {
              expectedSumInsured,
              expectedCompanyPay,
              expectedEmployeePay,
              expectedPremium,
              sumInsuredModel: validChoice.sumInsuredModel,
              sumInsuredModelProperty: validChoice.sumInsuredModelProperty,
              minSumInsuredValue: validChoice.minSumInsuredValue,
              maxSumInsuredValue: validChoice.maxSumInsuredValue,
              premiumPerLife: validChoice.premiumPerLife ?? false,
            },
            received: receivedChoice,
            matches: {
              sumInsured: expectedSumInsured === receivedChoice.sumInsured,
              companyPay: expectedCompanyPay === receivedChoice.companyPay,
              employeePay: expectedEmployeePay === receivedChoice.employeePay,
              premium: expectedPremium === receivedChoice.premium,
            },
          };
        });

        this.logError(
          "validateComponentChoices",
          "No matching choice found for component",
          {
            policyId,
            employeeId,
            compId,
            receivedChoice,
            candidateCount: candidates.length,
            candidates,
          }
        );
        throw new BadRequestException(
          `Invalid choice for component id ${compId}`
        );
      }
      choice.premiumPerLife = match.premiumPerLife ?? false;
      choice.proRationEnabled = match.proRationEnabled ?? true;
      choice.sumInsuredModel = match?.sumInsuredModel;
      choice.sumInsuredModelProperty = match?.sumInsuredModelProperty;
      choice.minSumInsuredValue = match?.minSumInsuredValue;
      choice.maxSumInsuredValue = match?.maxSumInsuredValue;
    }

    // C-3: Override premiums for components whose policy option dimensions include
    // a parameter with `applyToDependents: true` (FR-051, FR-052, FR-053).
    // The per-dependent sum replaces whatever the client submitted; the choice SI
    // has already been validated by the standard loop above.
    if (
      applyToDepParams.length > 0 &&
      policyChoicesApplicable &&
      typeof policyChoicesApplicable === "object" &&
      Array.isArray((policyChoicesApplicable as any).optionMeta) &&
      (policyChoicesApplicable as any).optionMeta.length > 0
    ) {
      const baseOptionMeta: Array<{ parameterId: string; parameterOptionId: string }> =
        (policyChoicesApplicable as any).optionMeta;
      const allPolicyOptions: any[] = Array.isArray(config?.policyOptions)
        ? config.policyOptions
        : [];
      const dependentCountZeroOptionMeta = findDependentCountZeroOptionMeta(
        config?.parameters ?? []
      );

      for (const param of applyToDepParams) {
        for (const choice of dtos) {
          const compId = Number(choice.policyComponentActionTypeId ?? 0);
          if (!compId) continue;
          try {
            const resolved = resolveApplyToDependentsPremium({
              parameter: param,
              employee: employeeDetails,
              dependents,
              baseOptionMeta,
              policyOptions: allPolicyOptions,
              componentId: compId,
              effectiveDate: (employeeDetails as any).effectiveDate ?? null,
              sumInsuredId: resolveSumInsuredIdForValue(
                config?.components,
                compId,
                choice.sumInsured
              ),
              dependentCountZeroOptionMeta,
            });
            // FR-053: set per-dependent sum; flag premiumPerLife=false so the
            // endorsement/premiumCalculator path does not multiply again.
            choice.companyPay = resolved.companyPay;
            choice.employeePay = resolved.employeePay;
            choice.premium = resolved.premium;
            choice.premiumPerLife = false;
          } catch (err) {
            throw new BadRequestException(
              err instanceof Error
                ? err.message
                : `Per-dependent premium resolution failed for component ${compId}`,
            );
          }
        }
      }
    }

    // Dependent Attribute (DA) additive premium is intentionally NOT computed or
    // baked into the persisted choice here (FR-058, BR-033) — it's calculated fresh
    // in updateEnrollmentStatus from the current active dependents, same as the
    // Dependent Count SI enhancement above, so it's correct regardless of whether
    // dependents were enrolled with the employee or added independently later, and
    // regardless of whether this validation path even ran (e.g. skipValidations).
  }

  transformPolicyChoices(validChoices: any[], employeeDetails: any) {
    return validChoices.map((item: any) => {
      if (item?.sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE) {
        this.resolveApplicableSumInsuredValue(
          item,
          item.sumInsured *
          (employeeDetails[item.sumInsuredModelProperty] ||
            employeeDetails.additionalDetails?.[
            item.sumInsuredModelProperty
            ] ||
            1)
        );
        return {
          ...item,
          updatedSumInsured: item.sumInsured,
          updatedCompanyContribution: item.companyContribution,
          updatedEmployeeContribution: item.employeeContribution,
        };
      }
      return {
        ...item,
        updatedSumInsured: item.sumInsured,
        updatedCompanyContribution: item.companyContribution,
        updatedEmployeeContribution: item.employeeContribution,
      };
    });
  }

  resolveApplicableSumInsuredValue = (
    choice: any,
    sumInsured?: number
  ): number | undefined => {
    if (sumInsured === undefined || sumInsured <= 0) {
      return sumInsured;
    }

    const maxSumInsured = this.parseNumericValue(choice.maxSumInsuredValue);
    if (maxSumInsured !== undefined && maxSumInsured > 0) {
      if (maxSumInsured <= sumInsured) {
        return maxSumInsured;
      }
    }

    const minSumInsured = this.parseNumericValue(choice.minSumInsuredValue);
    if (minSumInsured !== undefined && minSumInsured > 0) {
      if (minSumInsured >= sumInsured) {
        return minSumInsured;
      }
    }

    return sumInsured;
  };

  parseNumericValue = (value: unknown): number | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(
      typeof value === DATA_TYPES.STRING
        ? (value as string).replace(/,/g, "")
        : value
    );
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  private resolveEmployeeMultiplierValue(
    employeeDetails: Record<string, any> | undefined,
    propertyKey?: string
  ): number | undefined {
    if (!employeeDetails || !propertyKey?.trim()) {
      return undefined;
    }

    const normalizedTarget = this.normalizeValue(propertyKey);

    const tryResolve = (
      source: Record<string, any> | undefined
    ): number | undefined => {
      if (!source || typeof source !== "object") {
        return undefined;
      }

      for (const [key, rawValue] of Object.entries(source)) {
        if (rawValue === null || rawValue === undefined) {
          continue;
        }
        if (typeof rawValue === "object") {
          continue;
        }
        const normalizedKey = this.normalizeValue(key);
        if (normalizedKey !== normalizedTarget) {
          continue;
        }
        const numericValue = this.parseNumericValue(rawValue);
        if (numericValue !== undefined) {
          return numericValue;
        }
      }

      return undefined;
    };

    const directValue = tryResolve(employeeDetails);
    if (directValue !== undefined) {
      return directValue;
    }

    return tryResolve(employeeDetails.additionalDetails as Record<string, any>);
  }

  private resolveEnrollmentWindowDates(
    source?:
      | Pick<
        Endorsement,
        "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
      >
      | Pick<
        PolicyEnrollmentEmployeePolicyMap,
        "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
      >
      | null,
  ): { startDate: Date; endDate: Date } | null {
    if (!source) {
      return null;
    }

    const startDate = source.enrollmentStartDate
      ? new Date(source.enrollmentStartDate)
      : source.createdAt
        ? new Date(source.createdAt)
        : null;

    if (!startDate || Number.isNaN(startDate.getTime())) {
      return null;
    }

    const endDate = source.enrollmentEndDate
      ? new Date(source.enrollmentEndDate)
      : addDays(startDate, 15);

    return { startDate, endDate };
  }

  isEnrollmentEditableWithinCutoff(
    lockEnrollmentAfterCutoff: boolean,
    enrollmentWindowSource?:
      | Pick<
        Endorsement,
        "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
      >
      | Pick<
        PolicyEnrollmentEmployeePolicyMap,
        "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
      >
      | null,
  ): boolean {
    if (!lockEnrollmentAfterCutoff) {
      return false;
    }

    const now = new Date();

    const resolvedWindow =
      this.resolveEnrollmentWindowDates(enrollmentWindowSource);

    if (!resolvedWindow) {
      return false;
    }

    const { startDate, endDate } = resolvedWindow;

    if (now < startDate) {
      return false;
    }

    return now <= endDate;
  }

  async processEnrollmentData(
    payload: UpsertEnrollmentDataDto,
    userId: number,
    isUpdate = false,
    options?: { skipValidations?: boolean; dependentOnly?: boolean },
    endorsementId?: number
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceId,
        userId,
        status: "success",
        location: this.location,
        method: "processEnrollmentData",
        payload: { ...payload, userId, isUpdate },
        messageData: "method invoked",
      }),
    });
    const {
      policyId,
      employeeId,
      companyId,
      action,
      dependents = [],
      choices = [],
      isDependentOnly = false,
      statusUpdateForNewDependentsOnly = false,
    } = payload;
    const submit = action.toLowerCase() === "submit";
    const dependentOnly = Boolean(options?.dependentOnly ?? isDependentOnly);
    const newDependentsOnly = Boolean(statusUpdateForNewDependentsOnly);
    const shouldSubmit = submit && !dependentOnly;

    const config = await this.getConfigRelationsAndContainsCached(policyId);
    if (!config) {
      throw new BadRequestException("Policy configuration not found");
    }
    const lockEnrollmentAfterCutoff = Boolean(
      (config.constraints as { lockEnrollmentAfterCutoff?: boolean })
        ?.lockEnrollmentAfterCutoff
    );

    if (shouldSubmit) {
      try {
        const { policyTo, exists } = await this.getPolicyEndDateCached(policyId);
        if (!exists) {
          throw new BadRequestException(errorMessages.policyNotFound);
        }
        const policyEndDate = policyTo
          ? endOfDay(new Date(policyTo))
          : null;
        if (policyEndDate && policyEndDate.getTime() < Date.now()) {
          const priorEndorsementCount = await this.dataSource
            .getRepository(Endorsement)
            .count({ where: { policyId } });
          if (priorEndorsementCount === 0) {
            throw new BadRequestException(errorMessages.policyExpired);
          }
        }
      } catch (error) {
        this.logError("processEnrollmentData", {
          policyId,
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }
    }

    if (submit && !options?.skipValidations) {
      await this.validateDependentAges(policyId, dependents, employeeId);
      await this.validateComponentChoices(
        policyId,
        choices,
        employeeId,
        dependents,
        !dependentOnly
      );
    }

    try {
      return await this.dataSource.transaction(
        async (manager: EntityManager) => {
          const slowDbThresholdMs = 1000;
          let savedDependents: PolicyEnrollmentDependent[] = [];
          let savedChoices: PolicyEmployeeEnrollmentChoice[] = [];

          const dependentDtos = dependents.map((d) => ({ ...d }));
          const existingDependentIds = new Set(
            dependents
              .map((d) => Number(d.id))
              .filter((id) => Number.isFinite(id) && id > 0)
          );
          const dependentsStartMs = Date.now();
          savedDependents = await this.enrollmentRepository.updateDependents(
            manager,
            policyId,
            employeeId,
            dependentDtos,
            userId,
            { skipDeletion: dependentOnly ? true : !isUpdate },
            endorsementId
          );
          const dependentsDurationMs = Date.now() - dependentsStartMs;
          if (dependentsDurationMs >= slowDbThresholdMs) {
            this.logInfo(
              "processEnrollmentData",
              "DB timing: updateDependents",
              {
                policyId,
                employeeId,
                dependentCount: savedDependents.length,
                durationMs: dependentsDurationMs,
              },
              userId
            );
          }

          const newDependentIds = savedDependents
            .map((dep) => Number(dep.id))
            .filter(
              (id) =>
                Number.isFinite(id) && !existingDependentIds.has(Number(id))
            );

          // savedDependents only returns ACTIVE dependents (updateDependents
          // filters deletedAt IS NULL), so a dependent removed in this same call
          // never appears in it — look them up separately via the reliable
          // deletionEndorsementId stamp updateDependents just set, so
          // updateEnrollmentStatus can compute their deletion refund.
          const deletedDependentIds = endorsementId
            ? (
                await manager.find(PolicyEnrollmentDependent, {
                  where: { policyId, employeeId, deletionEndorsementId: endorsementId },
                  withDeleted: true,
                })
              ).map((dep) => dep.id)
            : [];

          if (dependentOnly && savedDependents.length) {
            if (newDependentIds.length) {
              const idSet = new Set(newDependentIds);
              const depUpdateStartMs = Date.now();
              await manager.update(
                PolicyEnrollmentDependent,
                { id: In(newDependentIds) },
                {
                  endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                  additionEndorsementId: endorsementId ?? null,
                  updatedBy: userId,
                }
              );
              const depUpdateDurationMs = Date.now() - depUpdateStartMs;
              if (depUpdateDurationMs >= slowDbThresholdMs) {
                this.logInfo(
                  "processEnrollmentData",
                  "DB timing: dependent endorsement update",
                  {
                    policyId,
                    employeeId,
                    updatedCount: newDependentIds.length,
                    durationMs: depUpdateDurationMs,
                  },
                  userId
                );
              }
              for (const dep of savedDependents) {
                if (idSet.has(Number(dep.id))) {
                  dep.endorsementStatusKey = EMPLOYEE_ENDORSEMENT_READY;
                  dep.additionEndorsementId = endorsementId ?? null;
                  dep.updatedBy = userId;
                }
              }
            }
          }

          if (choices.length && !dependentOnly) {
            const dtos = choices.map((c) => ({
              ...c,
              employeeId,
              policyId,
              companyId,
            }));
            const choicesStartMs = Date.now();
            savedChoices = await this.enrollmentRepository.updateEnrollmentChoices(
              manager,
              dtos,
              { policyId, employeeId, companyId }
            );
            const choicesDurationMs = Date.now() - choicesStartMs;
            if (choicesDurationMs >= slowDbThresholdMs) {
              this.logInfo(
                "processEnrollmentData",
                "DB timing: updateEnrollmentChoices",
                {
                  policyId,
                  employeeId,
                  choiceCount: savedChoices.length,
                  durationMs: choicesDurationMs,
                },
                userId
              );
            }
          }

          if (savedChoices.length && savedDependents.length && !dependentOnly) {
            const policyConfig = await this.enrollmentRepository.getPolicyConfigurationByPolicyId(policyId);
            const policyTemplate = (policyConfig?.policyConfiguration as any)?.policyTemplate;

            if (policyTemplate) {
              const componentRelations = new Map<number, Set<string>>();
              const addComponent = (compId: unknown, relations: unknown) => {
                const id = typeof compId === 'number' && Number.isFinite(compId) ? compId
                  : typeof compId === 'string' ? (Number.isFinite(Number(compId)) ? Number(compId) : null) : null;
                if (!id) return;
                const existing = componentRelations.get(id) ?? new Set<string>();
                if (Array.isArray(relations)) {
                  for (const r of relations) {
                    if (typeof r === 'string') {
                      const norm = r.trim().toLowerCase();
                      if (norm && norm !== 'self') existing.add(norm);
                    }
                  }
                }
                componentRelations.set(id, existing);
              };

              for (const section of ['basePolicy', 'parentalPolicy']) {
                const pol = (policyTemplate as any)[section];
                if (!pol) continue;
                addComponent(pol.mainPolicyId, pol.eligibleRelations);
                for (const addon of pol.addonIds ?? []) {
                  if (typeof addon === 'object' && addon?.optionId) {
                    addComponent(addon.optionId, addon.eligibleRelations);
                  }
                }
              }

              const choiceIds = savedChoices.map(c => c.id).filter(id => Number.isFinite(id) && id > 0);
              const choiceDepRepo = manager.getRepository(PolicyEmployeeEnrollmentChoiceDependent);

              if (choiceIds.length) {
                await choiceDepRepo.update(
                  { employeeEnrollmentChoiceId: In(choiceIds), deletedAt: IsNull() },
                  { deletedAt: new Date() },
                );
              }

              const linkValues: Array<{ employeeEnrollmentChoiceId: number; dependentId: number }> = [];
              const seenLinks = new Set<string>();

              for (const choice of savedChoices) {
                const compId = choice.policyComponentActionTypeId;
                if (!compId) continue;
                const eligibleRelations = componentRelations.get(compId);
                if (!eligibleRelations?.size) continue;
                for (const dep of savedDependents) {
                  const rel = dep.relation?.trim().toLowerCase();
                  if (!rel || !eligibleRelations.has(rel)) continue;
                  const linkKey = `${choice.id}|${dep.id}`;
                  if (seenLinks.has(linkKey)) continue;
                  seenLinks.add(linkKey);
                  linkValues.push({ employeeEnrollmentChoiceId: choice.id, dependentId: dep.id });
                }
              }

              if (linkValues.length) {
                await manager
                  .createQueryBuilder()
                  .insert()
                  .into(PolicyEmployeeEnrollmentChoiceDependent)
                  .values(linkValues)
                  .onConflict('("employee_enrollment_choice_id","dependent_id") WHERE deleted_at IS NULL DO UPDATE SET deleted_at = NULL, updated_at = NOW()')
                  .execute();
              }
            }
          }

          if (shouldSubmit || newDependentsOnly) {
            const enrollmentFindStartMs = Date.now();
            const enrollment =
              await this.enrollmentRepository.findEmployeeEnrollment(
                policyId,
                employeeId
              );
            const enrollmentFindDurationMs =
              Date.now() - enrollmentFindStartMs;
            if (enrollmentFindDurationMs >= slowDbThresholdMs) {
              this.logInfo(
                "processEnrollmentData",
                "DB timing: findEmployeeEnrollment",
                {
                  policyId,
                  employeeId,
                  durationMs: enrollmentFindDurationMs,
                },
                userId
              );
            }
            const enrolledKey = EMPLOYEE_ENROLLMENT_STATUS_ENROLLED;
            // The cutoff-lock check only applies to a full resubmission of the
            // employee's own enrollment. When a dependent is added independently
            // the employee is always already ENROLLED by definition (that's the
            // whole premise of this path) — enforcing the employee's own enrollment
            // window here would incorrectly block a dependent-only endorsement that
            // legitimately happens after that window has closed.
            if (
              !newDependentsOnly &&
              enrollment &&
              enrollment.employeeEnrollmentStatusKey === enrolledKey
            ) {
              let windowSource:
                | Pick<
                  PolicyEnrollmentEmployeePolicyMap,
                  "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
                >
                | null = null;
              if (lockEnrollmentAfterCutoff) {
                const windowFindStartMs = Date.now();
                windowSource =
                  await this.enrollmentRepository.getEmployeeEnrollmentWindowSource(
                    policyId,
                    employeeId
                  );
                const windowFindDurationMs = Date.now() - windowFindStartMs;
                if (windowFindDurationMs >= slowDbThresholdMs) {
                  this.logInfo(
                    "processEnrollmentData",
                    "DB timing: getEmployeeEnrollmentWindowSource",
                    { policyId, employeeId, durationMs: windowFindDurationMs },
                    userId
                  );
                }
              }

              if (
                !this.isEnrollmentEditableWithinCutoff(
                  lockEnrollmentAfterCutoff,
                  windowSource
                )
              ) {
                throw new BadRequestException("Already enrolled");
              }
            }
            const statusUpdateStartMs = Date.now();
            await this.enrollmentRepository.updateEnrollmentStatus(
              manager,
              policyId,
              employeeId,
              companyId,
              EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
              endorsementId,
              newDependentsOnly,
              newDependentIds,
              deletedDependentIds
            );
            const statusUpdateDurationMs = Date.now() - statusUpdateStartMs;
            if (statusUpdateDurationMs >= slowDbThresholdMs) {
              this.logInfo(
                "processEnrollmentData",
                "DB timing: updateEnrollmentStatus",
                {
                  policyId,
                  employeeId,
                  durationMs: statusUpdateDurationMs,
                },
                userId
              );
            }
          }

          return {
            message: shouldSubmit ? "Enrollment submitted" : "Enrollment saved",
            dependents: savedDependents,
            choices: savedChoices,
          };
        }
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceId,
          userId,
          status: "failure",
          location: this.location,
          method: "processEnrollmentData",
          payload: { ...payload, userId, isUpdate },
          messageData: error,
        }),
      });
      throw error;
    }
  }
}

/**
 * Updates the endorsement summary after enrollment processing
 * This utility function can be called from any service after enrollment processing completes
 */
export async function updateEndorsementSummaryAfterEnrollment(
  endorsementId: number,
  repositories: {
    endorsementRepo: Repository<Endorsement>;
    policyRepo: Repository<Policy>;
    policyEmployeeEndorsementRepo: Repository<PolicyEmployeeEndorsement>;
    policyDependentEndorsementRepo: Repository<PolicyDependentEndorsement>;
    dependentRepo: Repository<PolicyEnrollmentDependent>;
    uploadRepo: Repository<DocumentProcessingFile>;
    employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>;
    employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>;
    policyConfigRepo?: Repository<PolicyConfiguration>;
    lookUpRepository?: Repository<any>;
    opportunityRepo?: Repository<Opportunity>;
  },
  logger?: LoggerLike,
  traceId?: string,
  singleEmployeeId?: number,
  captureOnly?: boolean
): Promise<void> {
  const calculationStart = Date.now();

  const logInfo = (method: string, messageData: unknown) => {
    if (logger) {
      logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: traceId || "unknown",
          status: "success",
          location: "enrollment-processing.util updateEndorsementSummaryAfterEnrollment",
          method,
          messageData,
        }),
      });
    }
  };

  const logError = (method: string, messageData: unknown) => {
    if (logger) {
      logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: traceId || "unknown",
          status: "failure",
          location: "enrollment-processing.util updateEndorsementSummaryAfterEnrollment",
          method,
          messageData,
        }),
      });
    }
  };

  const formatDuration = (durationMs: number): string => {
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours} hr`);
      parts.push(`${minutes} min`);
      parts.push(`${seconds} sec`);
      return parts.join(" ");
    }
    if (minutes > 0) {
      parts.push(`${minutes} min`);
      parts.push(`${seconds} sec`);
      return parts.join(" ");
    }
    return `${seconds} sec`;
  };

  const hasReportedClaim = (value: unknown): boolean => {
    if (typeof value === DATA_TYPES.BOOLEAN) {
      return value;
    }
    if (typeof value === DATA_TYPES.NUMBER) {
      return value === 1;
    }
    if (value === null || value === undefined) {
      return false;
    }
    const normalized = String(value).trim().toLowerCase();
    return normalized === "yes" || normalized === "1" || normalized === "true";
  };

  const parseNumericValue = (value: unknown): number | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(
      typeof value === DATA_TYPES.STRING
        ? (value as string).replace(/,/g, "")
        : value
    );
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  const parsePremiumPerLife = (value: unknown): boolean => {
    if (typeof value === DATA_TYPES.BOOLEAN) {
      return value;
    }
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === DATA_TYPES.NUMBER) {
      return value === 1;
    }
    const normalized = String(value).trim().toLowerCase();
    return (
      normalized === BOOLEAN_VALUES.TRUE ||
      normalized === DEFAULT_PAGE.toString() ||
      normalized === "yes"
    );
  };

  const parseExcelDate = (value: any): Date | null => {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === DATA_TYPES.STRING) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    if (typeof value === DATA_TYPES.NUMBER) {
      const excelEpoch = new Date(1899, 11, 30);
      const msPerDay = 24 * 60 * 60 * 1000;
      const date = new Date(excelEpoch.getTime() + value * msPerDay);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  };

  const calculateAge = (dateOfBirth: string | Date | null | undefined): number | null => {
    if (!dateOfBirth) return null;

    let dob: Date;
    if (typeof dateOfBirth === DATA_TYPES.STRING) {
      dob = parseExcelDate(dateOfBirth) || new Date(dateOfBirth);
    } else {
      dob = new Date(dateOfBirth);
    }

    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return Math.floor(age);
  };

  const calculateAgeAtEffectiveDate = (
    dateOfBirth: string | Date | null | undefined,
    effectiveDate: Date | null | undefined
  ): number | null => {
    if (!dateOfBirth) return null;

    let dob: Date;
    if (typeof dateOfBirth === DATA_TYPES.STRING) {
      dob = parseExcelDate(dateOfBirth) || new Date(dateOfBirth);
    } else {
      dob = new Date(dateOfBirth);
    }

    if (isNaN(dob.getTime())) return null;

    const today = effectiveDate ? new Date(effectiveDate) : new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return Math.floor(age);
  };

  const findAgeBandPremium = (
    age: number | null,
    basePremium: number,
    policyConfig: any,
    choice: PolicyEmployeeEnrollmentChoice
  ): number => {
    if (age === null || !policyConfig?.parameters || !policyConfig?.policyOptions) {
      return basePremium;
    }

    // Step 1: Find the age parameter and matching range
    let matchingRangeId: string | null = null;
    let ageParameterId: string | null = null;

    for (const parameter of policyConfig.parameters) {
      if (parameter.rangeDetails && parameter.rangeDetails.length > 0) {
        const paramName = (parameter.displayName || parameter.name || '').toLowerCase();
        if (paramName.includes(NON_FINANCIAL_CONSTANTS.AGE)) {
          ageParameterId = parameter.id;
          // Find matching range for this age
          for (const range of parameter.rangeDetails) {
            const minAge = typeof range.min === DATA_TYPES.STRING
              ? parseInt(range.min) || NON_FINANCIAL_CONSTANTS.MIN_AGE
              : range.min || NON_FINANCIAL_CONSTANTS.MIN_AGE;
            const maxAge = typeof range.max === DATA_TYPES.STRING
              ? parseInt(range.max) || NON_FINANCIAL_CONSTANTS.MAX_AGE
              : range.max || NON_FINANCIAL_CONSTANTS.MAX_AGE;

            if (age >= minAge && age <= maxAge) {
              matchingRangeId = range.id;
              break;
            }
          }
          if (matchingRangeId) break;
        }
      }
    }

    if (!matchingRangeId || !ageParameterId) {
      return basePremium;
    }

    // Step 2: Find the policy option that matches this age range
    const matchingPolicyOption = policyConfig.policyOptions?.find((option: any) => {
      return option.optionMeta?.some((meta: any) =>
        meta.parameterId === ageParameterId &&
        meta.parameterOptionId === matchingRangeId
      );
    });

    if (!matchingPolicyOption?.basePolicyChoices?.mainPolicyChoices?.choices) {
      return basePremium;
    }

    // Step 3: Find the matching sum insured option
    // First, try to find the component to get sum insured options
    const choiceId = choice.policyComponentActionTypeId;
    const component = policyConfig.components?.find((comp: any) => comp.id === choiceId);

    if (!component?.sumInsuredOptions) {
      return basePremium;
    }

    // Match the sum insured value from choice with the sumInsuredId
    const choiceSumInsured = parseNumericValue(choice.sumInsured);
    let matchingSumInsuredId: number | null = null;

    for (const siOption of component.sumInsuredOptions) {
      const optionValue = parseNumericValue(siOption.value);
      if (optionValue === choiceSumInsured) {
        matchingSumInsuredId = siOption.id;
        break;
      }
    }

    if (matchingSumInsuredId === null) {
      // If exact match not found, try using the first available option as fallback
      matchingSumInsuredId = component.sumInsuredOptions[0]?.id;
    }

    if (matchingSumInsuredId === null) {
      return basePremium;
    }

    // Step 4: Find the premium for this sum insured ID in the policy option
    const premiumChoice = matchingPolicyOption.basePolicyChoices.mainPolicyChoices.choices.find(
      (c: any) => c.sumInsuredId === matchingSumInsuredId
    );

    if (!premiumChoice) {
      return basePremium;
    }

    // Step 5: Calculate total premium (company + employee contribution)
    const companyContribution = parseNumericValue(premiumChoice.companyContribution) || 0;
    const employeeContribution = parseNumericValue(premiumChoice.employeeContribution) || 0;
    const totalPremium = companyContribution + employeeContribution;

    return totalPremium > 0 ? totalPremium : basePremium;
  };

  const calculateAgeBandBasedPremium = (
    choice: PolicyEmployeeEnrollmentChoice,
    basePremium: number,
    enrollment: PolicyEmployeeEnrollment,
    dependents: PolicyEnrollmentDependent[],
    policyConfig: any,
    employeeAge: number | null,
    effectiveDate?: Date
  ): number => {
    if (!policyConfig) {
      // Fallback to old logic if no policy config
      return basePremium * (1 + dependents.length);
    }

    let totalPremium = 0;
    // Calculate premium for employee based on their age band
    const employeePremium = findAgeBandPremium(employeeAge, basePremium, policyConfig, choice);
    totalPremium += employeePremium;

    // Calculate premium for each dependent based on their age band
    for (const dependent of dependents) {
      const dependentEffectiveDate = dependent.effectiveDate || effectiveDate;
      const dependentAge = calculateAgeAtEffectiveDate(dependent.dateOfBirth, dependentEffectiveDate ?? undefined);
      let dependentPremium: number;

      if (dependentAge !== null) {
        // Try to find premium for dependent's age band
        dependentPremium = findAgeBandPremium(dependentAge, basePremium, policyConfig, choice);
      } else {
        // If we can't determine dependent's age, use employee's age band as fallback
        dependentPremium = employeePremium;
      }

      totalPremium += dependentPremium;
    }

    return totalPremium;
  };


  const resolveEmployeeMultiplierValue = (
    enrollment: PolicyEmployeeEnrollment | undefined,
    propertyKey?: string,
    mapAdditionalParams?: Record<string, any> | null
  ): number | undefined => {
    if (!enrollment?.employee || !propertyKey?.trim()) {
      return undefined;
    }

    const normalizedTarget = propertyKey.replace(/[\s_-]+/g, "").toLowerCase();

    const tryResolve = (
      source: Record<string, any> | undefined
    ): number | undefined => {
      if (!source || typeof source !== "object") {
        return undefined;
      }

      for (const [key, rawValue] of Object.entries(source)) {
        if (rawValue === null || rawValue === undefined) {
          continue;
        }
        if (typeof rawValue === "object") {
          continue;
        }
        const normalizedKey = key.replace(/[\s_-]+/g, "").toLowerCase();
        if (normalizedKey !== normalizedTarget) {
          continue;
        }
        const numericValue = parseNumericValue(rawValue);
        if (numericValue !== undefined) {
          return numericValue;
        }
      }

      return undefined;
    };

    const mapValue = tryResolve(mapAdditionalParams ?? undefined);
    if (mapValue !== undefined) {
      return mapValue;
    }

    const employeeRecord = enrollment.employee as unknown as Record<
      string,
      any
    >;
    const directValue = tryResolve(employeeRecord);
    if (directValue !== undefined) {
      return directValue;
    }

    return tryResolve(
      enrollment.employee.additionalParams as Record<string, any>
    );
  };

  // Normalized-key lookup into a PolicyEnrollmentEmployeePolicyMap.additionalParams
  // blob — the raw upload row's "Premium"/etc. cell lands here under whatever key
  // its column mapping or literal header text produced, not a fixed constant.
  const resolveMapAdditionalParamValue = (
    mapAdditionalParams: Record<string, any> | null | undefined,
    propertyKey: string
  ): number | undefined => {
    if (!mapAdditionalParams || typeof mapAdditionalParams !== "object") {
      return undefined;
    }
    const normalizedTarget = propertyKey.replace(/[\s_-]+/g, "").toLowerCase();
    for (const [key, rawValue] of Object.entries(mapAdditionalParams)) {
      if (rawValue === null || rawValue === undefined || typeof rawValue === "object") {
        continue;
      }
      if (key.replace(/[\s_-]+/g, "").toLowerCase() !== normalizedTarget) {
        continue;
      }
      const numericValue = parseNumericValue(rawValue);
      if (numericValue !== undefined) {
        return numericValue;
      }
    }
    return undefined;
  };

  const resolveApplicableSumInsuredValue = (
    choice: PolicyEmployeeEnrollmentChoice,
    sumInsured?: number
  ): number | undefined => {
    if (sumInsured === undefined || sumInsured <= 0) {
      return sumInsured;
    }

    const maxSumInsured = parseNumericValue(choice.maxSumInsuredValue);
    if (maxSumInsured !== undefined && maxSumInsured > 0) {
      if (maxSumInsured <= sumInsured) {
        return maxSumInsured;
      }
    }

    const minSumInsured = parseNumericValue(choice.minSumInsuredValue);
    if (minSumInsured !== undefined && minSumInsured > 0) {
      if (minSumInsured >= sumInsured) {
        return minSumInsured;
      }
    }

    return sumInsured;
  };

  const calculateTotalPremiumFromChoices = (
    choices: PolicyEmployeeEnrollmentChoice[] | undefined,
    livesCount: number,
    enrollment?: PolicyEmployeeEnrollment,
    dependents?: PolicyEnrollmentDependent[],
    policyConfig?: any,
    effectiveDate?: Date,
    mapAdditionalParams?: Record<string, any> | null
  ): number => {
    if (!choices?.length) {
      return 0;
    }

    // Calculate employee age once if we have the enrollment data
    const employeeAge = enrollment?.employee?.dateOfBirth
      ? calculateAgeAtEffectiveDate(enrollment.employee.dateOfBirth, effectiveDate ?? undefined)
      : null;

    return choices.reduce((total, choice) => {
      let premium = parseNumericValue(choice.premium) ?? 0;

      const sumInsuredModel = choice.sumInsuredModel
        ? String(choice.sumInsuredModel).trim().toUpperCase()
        : undefined;

      if (sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE && enrollment) {
        const multiplier = resolveEmployeeMultiplierValue(
          enrollment,
          choice.sumInsuredModelProperty,
          mapAdditionalParams
        );
        const sumInsured =
          Number(multiplier ?? DEFAULT_PAGE) *
          Number(parseNumericValue(choice.sumInsured) ?? DEFAULT_PAGE);
        const applicableSumInsured = resolveApplicableSumInsuredValue(
          choice,
          sumInsured
        );
        const companyContribution =
          parseNumericValue(choice.companyPay) ?? 0;
        const employeeContribution =
          parseNumericValue(choice.employeePay) ?? 0;

        if (
          multiplier !== undefined &&
          multiplier > 0 &&
          applicableSumInsured !== undefined &&
          applicableSumInsured > 0 &&
          companyContribution + employeeContribution > 0
        ) {
          const contributionPerThousand =
            companyContribution + employeeContribution;
          premium =
            (applicableSumInsured / PER_MILLE_RATE) * contributionPerThousand;
        }
      }

      if (premium === 0) {
        return total;
      }

      let choicePremium: number;
      if (parsePremiumPerLife(choice.premiumPerLife)) {
        let isDependentAgeBasedCalculationEnabled = (
          ENV.ENABLE_DEPENDENT_AGE_BASED_PREMIUM_CALCULATION ?? BOOLEAN_VALUES.FALSE).toLocaleLowerCase() === BOOLEAN_VALUES.TRUE;
        // Use age band-based calculation if we have policy config and dependents
        if (policyConfig && dependents && enrollment && isDependentAgeBasedCalculationEnabled) {
          choicePremium = calculateAgeBandBasedPremium(
            choice,
            premium,
            enrollment,
            dependents,
            policyConfig,
            employeeAge,
            effectiveDate
          );
        } else {
          // Fallback to simple multiplication
          choicePremium = premium * livesCount;
        }
      } else {
        choicePremium = premium;
      }

      return Number(total) + Number(choicePremium);
    }, 0);
  };

  const resolveDeletionEligibleLivesCount = (
    employeeClaimStatus: unknown,
    dependents: PolicyEnrollmentDependent[]
  ): number => {
    const hasEmployeeClaim = hasReportedClaim(employeeClaimStatus);
    const eligibleDependents = dependents.filter(
      (dep) =>
        !hasReportedClaim(
          dep.additionalParams?.claimStatus ?? dep.claimStatus
        )
    ).length;
    return hasEmployeeClaim ? 0 : (1 + eligibleDependents);
  };

  const calculateProratedPremiumsForEnrollment = (
    enrollment: PolicyEmployeeEnrollment,
    livesCount: number,
    policyFrom: Date,
    policyTo: Date,
    additionEffectiveDate: Date,
    deletionEffectiveDate: Date,
    isEmployeeDeleted: boolean = false,
    eligibleDeletionLivesCount?: number,
    dependents?: PolicyEnrollmentDependent[],
    policyConfig?: any,
    isEmployeeInThisEndorsement: boolean = true,
    currentEndorsementId?: number,
    allActiveDependentsForBand?: PolicyEnrollmentDependent[],
    mapAdditionalParams?: Record<string, any> | null
  ): {
    totalPremium: number;
    additionPremiumPortion: number;
    deletionPremiumPortion: number;
  } => {
    const totalPremium = calculateTotalPremiumFromChoices(
      enrollment.components,
      livesCount,
      enrollment,
      dependents,
      policyConfig,
      additionEffectiveDate,
      mapAdditionalParams
    );

    const normalizedPolicyFrom = toMidnight(policyFrom);
    const normalizedPolicyTo = toMidnight(policyTo);
    const totalPolicyDays = Math.max(0, daysBetweenInclusive(normalizedPolicyFrom, normalizedPolicyTo));
    const applicableDaysFor = (effectiveDate: Date): number => {
      const clampedStart = new Date(Math.max(toMidnight(new Date(effectiveDate)).getTime(), normalizedPolicyFrom.getTime()));
      return calculateApplicableDays(clampedStart, normalizedPolicyTo);
    };

    if (!enrollment.components?.length) {
      // ADDITIONS are done via backend - data migration, so they don't possess choices.
      // Hence, to calculate deletion refund checking last paid premium by employee.
      const lastPaidNetPremium = parseNumericValue(enrollment.lastPaidNetPremium) ?? 0;
      if (lastPaidNetPremium <= 0) {
        return { totalPremium: 0, additionPremiumPortion: 0, deletionPremiumPortion: 0 };
      }

      const addApplicableDays = applicableDaysFor(additionEffectiveDate);
      let deletionPremiumPortion = 0;
      if (isEmployeeDeleted && addApplicableDays > 0) {
        const delApplicableDays = applicableDaysFor(deletionEffectiveDate);
        deletionPremiumPortion = Math.round(lastPaidNetPremium * delApplicableDays / addApplicableDays * 100) / 100;
      }

      return {
        totalPremium: lastPaidNetPremium,
        additionPremiumPortion: isEmployeeInThisEndorsement && !isEmployeeDeleted ? lastPaidNetPremium : 0,
        deletionPremiumPortion,
      };
    }

    const adjustedDeletionLivesCount = Math.min(
      livesCount,
      Math.max(0, eligibleDeletionLivesCount ?? livesCount)
    );

    let additionPremiumPortion = 0;
    let deletionPremiumPortion = 0;

    const daParams = policyConfig
      ? (policyConfig.parameters ?? []).filter(
          (p: any) =>
            p.internalType === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE ||
            p.type?.toLowerCase() === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
        )
      : [];
    const daRelationNameToTypeMap = new Map<string, string>();
    if (daParams.length > 0) {
      for (const rel of policyConfig?.relationships?.enabledPolicyRelations ?? []) {
        for (const opt of rel.configuredOptions ?? []) {
          if (opt.name) {
            daRelationNameToTypeMap.set(String(opt.name).toLowerCase().trim(), rel.type ?? "");
          }
        }
      }
    }

    // Calculate proration for each choice individually
    enrollment.components.forEach((choice) => {
      let choicePremium = parseNumericValue(choice.premium) ?? 0;

      const sumInsuredModel = choice.sumInsuredModel
        ? String(choice.sumInsuredModel).trim().toUpperCase()
        : undefined;

      // Handle multiple sum insured model calculations
      if (sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE && enrollment) {
        const multiplier = resolveEmployeeMultiplierValue(
          enrollment,
          choice.sumInsuredModelProperty,
          mapAdditionalParams
        );
        const sumInsured =
          Number(multiplier ?? DEFAULT_PAGE) *
          Number(parseNumericValue(choice.sumInsured) ?? DEFAULT_PAGE);
        const applicableSumInsured = resolveApplicableSumInsuredValue(
          choice,
          sumInsured
        );
        const companyContribution =
          parseNumericValue(choice.companyPay) ?? 0;
        const employeeContribution =
          parseNumericValue(choice.employeePay) ?? 0;

        if (
          multiplier !== undefined &&
          multiplier > 0 &&
          applicableSumInsured !== undefined &&
          applicableSumInsured > 0 &&
          companyContribution + employeeContribution > 0
        ) {
          const contributionPerThousand =
            companyContribution + employeeContribution;
          choicePremium =
            (applicableSumInsured / PER_MILLE_RATE) * contributionPerThousand;
        } else if (applicableSumInsured == DEFAULT_TOTAL_KPI_COUNT) {
          choicePremium = DEFAULT_TOTAL_KPI_COUNT;
        }
      }


      // Check if proration is enabled for this choice (default to true if undefined)
      const isProratedChoice = choice.proRationEnabled !== false;
      const isPPL = parsePremiumPerLife(choice.premiumPerLife);

      if (isPPL) {
        const endorsementDependents = (enrollment.employee?.dependents ?? []) as PolicyEnrollmentDependent[];

        // When any parameter has applyToDependents:true, each dependent's premium is
        // resolved from policyConfig using their own attribute values (e.g. MaritalStatus).
        const applyToDependentsParams: any[] = policyConfig
          ? (policyConfig.parameters ?? []).filter((p: any) => p.applyToDependents)
          : [];
        const useConfigForDependents = applyToDependentsParams.length > 0 && !!policyConfig;

        // "Dependent Count" parameters aren't applyToDependents (they describe the whole
        // family, not one life) but they can still be part of a policyOption's optionMeta
        // alongside Age etc. — matching empBaseOption on applyToDependentsParams alone would
        // pick the first policyOption with the right Age regardless of dependent count, so
        // depBaseOptionMeta's "Dependent Count" entry must also be constrained to the
        // relevant dependent count.
        const dependentCountParams: any[] = policyConfig
          ? (policyConfig.parameters ?? []).filter(
              (p: any) =>
                p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
                p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE,
            )
          : [];

        const empRecord = {
          ...(enrollment.employee as any),
          additionalDetails: enrollment.employee?.additionalParams,
        };

        const computeDepBaseOptionMeta = (dependentsForBand: PolicyEnrollmentDependent[]): OptionMetaEntry[] => {
          const empBaseOption = (policyConfig.policyOptions ?? []).find((opt: any) => {
            const ageAndAttributesMatch = applyToDependentsParams.every((param: any) => {
              try {
                const empId = resolveOptionIdForLife(empRecord, empRecord, param, additionEffectiveDate);
                return !empId || (opt.optionMeta ?? []).some(
                  (m: any) => m.parameterId === param.id && m.parameterOptionId === empId,
                );
              } catch {
                return true;
              }
            });
            const dependentCountMatches = dependentCountParams.every((param: any) => {
              const matchedId = resolveDependentCountOptionId(param, dependentsForBand);
              return !matchedId || (opt.optionMeta ?? []).some(
                (m: any) => m.parameterId === param.id && m.parameterOptionId === matchedId,
              );
            });
            return ageAndAttributesMatch && dependentCountMatches;
          });
          return empBaseOption?.optionMeta ?? [];
        };

        // Not a resubmission of the employee's own choices — a dependent was added
        // and/or deleted independently in THIS endorsement. Per the business Premium
        // Rater Table (confirmed with stakeholder): the employee's own line and every
        // previously-known dependent are frozen — only the newly added dependent(s)'
        // own premium, priced at the CURRENT/enhanced family band, is appended (and a
        // deleted dependent's own premium refunded, at the pre-deletion band).
        const isIndependentDependentChange = useConfigForDependents && !isEmployeeInThisEndorsement;

        const isNewToThisEndorsement = (dep: PolicyEnrollmentDependent) =>
          currentEndorsementId != null && (dep as any).additionEndorsementId === currentEndorsementId;
        const isDeletedInThisEndorsement = (dep: PolicyEnrollmentDependent) =>
          !!dep.deletedAt && currentEndorsementId != null && (dep as any).deletionEndorsementId === currentEndorsementId;

        const newlyAddedDependents = isIndependentDependentChange
          ? endorsementDependents.filter((dep) => isNewToThisEndorsement(dep))
          : [];
        const deletedDependents = isIndependentDependentChange
          ? endorsementDependents.filter((dep) => isDeletedInThisEndorsement(dep))
          : [];

        // Band matching needs the employee's FULL active family (not just this
        // endorsement's own dependent), so Dependent Count is resolved against everyone,
        // not just the new/deleted one(s). allActiveDependentsForBand is the caller's
        // separately-fetched full-family list (only populated when Dependent Count+Age
        // is configured); fall back to endorsementDependents otherwise — for a
        // family-together submission that IS already the full family, and for a policy
        // without Dependent Count+Age configured this exactly matches original behavior.
        const fullFamilyForBand = allActiveDependentsForBand ?? endorsementDependents;
        const afterThisEndorsementDependents = isIndependentDependentChange
          ? fullFamilyForBand
          : endorsementDependents;

        // Current family band — used for the new dependent's own premium on
        // addition (already includes them, since they're active by now).
        const depBaseOptionMeta: OptionMetaEntry[] = computeDepBaseOptionMeta(afterThisEndorsementDependents);

        // Band INCLUDING a dependent being deleted in this endorsement — needed
        // because fullFamilyForBand (the separately-fetched active-family list)
        // already excludes them by the time this runs (their deletedAt is set).
        // A deleted dependent's own refund must resolve at the enhanced band they
        // were actually active under, not the smaller post-deletion one — no
        // subtraction/diff, just resolve-and-prorate at that band.
        const bandIncludingDeleted: OptionMetaEntry[] = isIndependentDependentChange
          ? computeDepBaseOptionMeta([...fullFamilyForBand, ...deletedDependents])
          : depBaseOptionMeta;

        const resolveDepPremiumFromConfig = (
          dep: PolicyEnrollmentDependent,
          depEffectiveDate: Date,
          baseOptionMeta: OptionMetaEntry[],
        ): number => {
          const componentId = choice.policyComponentActionTypeId ?? 0;
          const depLifeRecord = {
            ...dep,
            additionalDetails: dep.additionalAttributes,
            effectiveDate: depEffectiveDate,
          };
          const empLifeRecord = empRecord;

          let totalDepPremium = 0;
          for (const param of applyToDependentsParams) {
            try {
              const result = resolveDependentOnlyPremiumByConfiguration({
                parameter: param,
                dependent: depLifeRecord,
                employee: empLifeRecord,
                baseOptionMeta,
                policyOptions: policyConfig.policyOptions ?? [],
                componentId,
                effectiveDate: depEffectiveDate,
                sumInsuredId: resolveSumInsuredIdForValue(
                  policyConfig.components,
                  componentId,
                  choice.sumInsured
                ),
              });
              totalDepPremium += result.premium;
            } catch {
              totalDepPremium += choicePremium;
            }
          }
          return totalDepPremium;
        };

        const resolveEmpPremiumFromConfig = (
          baseOptionMeta: OptionMetaEntry[],
          empEffectiveDate: Date,
        ): number => {
          let totalEmpPremium = 0;
          let matchedAny = false;
          for (const param of applyToDependentsParams) {
            try {
              const result = resolveDependentOnlyPremiumByConfiguration({
                parameter: param,
                dependent: empRecord,
                employee: empRecord,
                baseOptionMeta,
                policyOptions: policyConfig.policyOptions ?? [],
                componentId: choice.policyComponentActionTypeId ?? 0,
                effectiveDate: empEffectiveDate,
                sumInsuredId: resolveSumInsuredIdForValue(
                  policyConfig.components,
                  choice.policyComponentActionTypeId ?? 0,
                  choice.sumInsured
                ),
              });
              totalEmpPremium = result.premium;
              matchedAny = true;
            } catch {
              // no band resolvable — leave totalEmpPremium at whatever was last matched
            }
          }
          return matchedAny ? totalEmpPremium : choicePremium;
        };

        if (isProratedChoice) {
          if (isIndependentDependentChange) {
            // Per the Premium Rater Table (confirmed with stakeholder): a newly added
            // dependent's own premium is priced at the CURRENT/enhanced family band —
            // no employee-side diff on addition, the employee's own line is frozen. A
            // deleted dependent's own premium is refunded at the enhanced band they
            // were actually active under (bandIncludingDeleted) — no diff/subtraction,
            // just resolve-and-prorate by their own applicable days. The employee's
            // own line is frozen on deletion too — it's not the subject of this
            // endorsement, only the dependent is.
            for (const dep of newlyAddedDependents) {
              const depAddDate = dep.effectiveDate
                ? new Date(dep.effectiveDate as any)
                : additionEffectiveDate;
              const depPremium = resolveDepPremiumFromConfig(dep, depAddDate, depBaseOptionMeta);
              additionPremiumPortion += totalPolicyDays > 0
                ? Math.round(depPremium * applicableDaysFor(depAddDate) / totalPolicyDays * 100) / 100
                : 0;
            }

            for (const dep of deletedDependents) {
              const depHasClaim = hasReportedClaim(
                (dep as any).additionalParams?.claimStatus ?? (dep as any).claimStatus
              );
              if (adjustedDeletionLivesCount > 0 && !depHasClaim) {
                const depDelDate = new Date(dep.deletedAt as any);
                const depPremium = resolveDepPremiumFromConfig(dep, depDelDate, bandIncludingDeleted);
                deletionPremiumPortion += totalPolicyDays > 0
                  ? Math.round(depPremium * applicableDaysFor(depDelDate) / totalPolicyDays * 100) / 100
                  : 0;
              }
            }
          } else {
            if (isEmployeeInThisEndorsement) {
              const empApplicableDays = applicableDaysFor(additionEffectiveDate);
              const empDelApplicableDays = applicableDaysFor(deletionEffectiveDate);
              // Resolved fresh against the CURRENT band (depBaseOptionMeta), same as
              // the deletion refund below — choicePremium (stored on the choice row)
              // isn't guaranteed to reflect the enhanced family SI if it was last set
              // before some other independent addition grew the family since.
              const empAddPremium = useConfigForDependents
                ? resolveEmpPremiumFromConfig(depBaseOptionMeta, additionEffectiveDate)
                : choicePremium;
              additionPremiumPortion += totalPolicyDays > 0
                ? Math.round(empAddPremium * empApplicableDays / totalPolicyDays * 100) / 100
                : 0;
              if (isEmployeeDeleted && adjustedDeletionLivesCount > 0) {
                // Refund resolved at the CURRENT band (depBaseOptionMeta) — since
                // endorsementDependents is unfiltered (includes anyone being deleted
                // alongside the employee), this already reflects the enhanced family
                // SI they were actually under. No diff/subtraction, just resolve and
                // prorate by the employee's own deletion-applicable-days.
                const empRefundPremium = useConfigForDependents
                  ? resolveEmpPremiumFromConfig(depBaseOptionMeta, additionEffectiveDate)
                  : choicePremium;
                deletionPremiumPortion += totalPolicyDays > 0
                  ? Math.round(empRefundPremium * empDelApplicableDays / totalPolicyDays * 100) / 100
                  : 0;
              }
            }

            for (const dep of endorsementDependents) {
              const depAddDate = dep.effectiveDate
                ? new Date(dep.effectiveDate as any)
                : additionEffectiveDate;
              const depPremium = useConfigForDependents
                ? resolveDepPremiumFromConfig(dep, depAddDate, depBaseOptionMeta)
                : choicePremium;

              if (!dep.deletedAt) {
                additionPremiumPortion += totalPolicyDays > 0
                  ? Math.round(depPremium * applicableDaysFor(depAddDate) / totalPolicyDays * 100) / 100
                  : 0;
              }
              const depHasClaim = hasReportedClaim(
                (dep as any).additionalParams?.claimStatus ?? (dep as any).claimStatus
              );
              if (adjustedDeletionLivesCount > 0 && dep.deletedAt && !depHasClaim) {
                const depDelDate = new Date(dep.deletedAt as any);
                // depPremium is already resolved at depBaseOptionMeta, which — since
                // endorsementDependents is unfiltered — already reflects the enhanced
                // band this dependent was actually under. No diff, just prorate.
                deletionPremiumPortion += totalPolicyDays > 0
                  ? Math.round(depPremium * applicableDaysFor(depDelDate) / totalPolicyDays * 100) / 100
                  : 0;
              }
            }
          }
        } else {
          // No proration — flat premium per person, no refund on deletion
          if (isIndependentDependentChange) {
            for (const dep of newlyAddedDependents) {
              const depAddDate = dep.effectiveDate
                ? new Date(dep.effectiveDate as any)
                : additionEffectiveDate;
              additionPremiumPortion += resolveDepPremiumFromConfig(dep, depAddDate, depBaseOptionMeta);
            }
          } else {
            if (isEmployeeInThisEndorsement && !isEmployeeDeleted) {
              additionPremiumPortion += choicePremium;
            }

            for (const dep of endorsementDependents) {
              if (!dep.deletedAt) {
                const depAddDate = dep.effectiveDate
                  ? new Date(dep.effectiveDate as any)
                  : additionEffectiveDate;
                const depPremium = useConfigForDependents
                  ? resolveDepPremiumFromConfig(dep, depAddDate, depBaseOptionMeta)
                  : choicePremium;
                additionPremiumPortion += depPremium;
              }
            }
          }
          deletionPremiumPortion += 0;
        }
      } else {
        // Per family: single flat premium using employee effective dates
        if (isProratedChoice) {
          if (isEmployeeInThisEndorsement) {
            const addApplicableDays = applicableDaysFor(additionEffectiveDate);
            additionPremiumPortion += totalPolicyDays > 0
              ? Math.round(choicePremium * addApplicableDays / totalPolicyDays * 100) / 100
              : 0;
          }
          if (isEmployeeDeleted && adjustedDeletionLivesCount > 0) {
            const delApplicableDays = applicableDaysFor(deletionEffectiveDate);
            const deletionRatio = livesCount > 0 ? adjustedDeletionLivesCount / livesCount : 0;
            deletionPremiumPortion += totalPolicyDays > 0
              ? Math.round(choicePremium * deletionRatio * delApplicableDays / totalPolicyDays * 100) / 100
              : 0;
          }
        } else {
          if (isEmployeeInThisEndorsement && !isEmployeeDeleted) {
            additionPremiumPortion += choicePremium;
          }
          deletionPremiumPortion += 0;
        }
      }

      // Per-dep DA pro-ration (FR-061/FR-062/FR-063): each dep's DA premium is pro-rated
      // by their own effectiveDate (addition) and deletedAt (deletion refund).
      // Non-PPL only — the PPL branch above already iterates deps with their own effectiveDate.
      if (daParams.length > 0 && !isPPL) {
        const allEndorsementDeps = (enrollment.employee?.dependents ?? []) as PolicyEnrollmentDependent[];
        // Same append-only rule as the PPL branch above: when only a dependent changed
        // independently (employee's own choices weren't resubmitted), a previously-known
        // dependent's DA premium was already billed under an earlier endorsement and must
        // not be re-added here — only dependents newly added/deleted IN THIS endorsement
        // contribute DA premium to this endorsement's portion.
        const isIndependentDependentChangeForDA = !isEmployeeInThisEndorsement;
        const endorsementDeps = isIndependentDependentChangeForDA
          ? allEndorsementDeps.filter((dep) => {
              const isNew = currentEndorsementId != null && (dep as any).additionEndorsementId === currentEndorsementId;
              const isDeletedNow = !!dep.deletedAt && currentEndorsementId != null && (dep as any).deletionEndorsementId === currentEndorsementId;
              return isNew || isDeletedNow;
            })
          : allEndorsementDeps;
        for (const daParam of daParams) {
          try {
            const { perDependent } = resolveDependentAttributePremium(
              endorsementDeps as any[],
              daParam as DependentAttributeParam,
              additionEffectiveDate,
              daRelationNameToTypeMap,
            );

            for (const { depRef, companyAdditional, employeeAdditional } of perDependent) {
              const daTotal = companyAdditional + employeeAdditional;
              if (daTotal === 0) continue;
              const dep = depRef as PolicyEnrollmentDependent;
              const depHasClaim = hasReportedClaim(
                (dep as any).additionalParams?.claimStatus ?? (dep as any).claimStatus,
              );

              if (!dep.deletedAt) {
                const depAddDate = dep.effectiveDate
                  ? new Date(dep.effectiveDate as any)
                  : additionEffectiveDate;
                additionPremiumPortion += totalPolicyDays > 0
                  ? Math.round(daTotal * applicableDaysFor(depAddDate) / totalPolicyDays * 100) / 100
                  : daTotal;
              } 
              else if (isProratedChoice && adjustedDeletionLivesCount > 0 && !depHasClaim && dep.deletedAt) {
                const depDelDate = new Date(dep.deletedAt as any);
                deletionPremiumPortion += totalPolicyDays > 0
                  ? Math.round(daTotal * applicableDaysFor(depDelDate) / totalPolicyDays * 100) / 100
                  : 0;
              }
            }
          } catch {
            // DA resolution failure: skip this param, don't block endorsement
          }
        }
      }

    });

    return {
      totalPremium,
      additionPremiumPortion,
      deletionPremiumPortion,
    };
  }

  const listEndorsementReadyEnrollmentsBatch = async (
    policyId: number,
    lastEnrollmentId: number,
    batchSize: number,
    endorsementId?: number,
    employeeId?: number
  ): Promise<PolicyEmployeeEnrollment[]> => {
    // Row-display/premium scope is per-endorsement: only this endorsement's own
    // dependent(s) are attached here. Dependent Count+Age band matching (which needs
    // the FULL active family, not just this endorsement's dependent) is handled
    // separately by fetchActiveDependentsMapByEmployeeIds, gated on that parameter
    // actually being configured — this default join must not affect policies that
    // don't use it.
    const depJoinCondition = endorsementId
      ? "dependents.policy_id = enroll.policy_id AND dependents.endorsement_status_key = :depStatus AND (dependents.addition_endorsement_id = :depEndorsementId OR dependents.deletion_endorsement_id = :depEndorsementId)"
      : "dependents.policy_id = enroll.policy_id AND dependents.endorsement_status_key = :depStatus";
    const depJoinParams = endorsementId
      ? { depStatus: EMPLOYEE_ENDORSEMENT_READY, depEndorsementId: endorsementId }
      : { depStatus: EMPLOYEE_ENDORSEMENT_READY };

    let qb = repositories.employeeEnrollmentRepo
      .createQueryBuilder("enroll")
      .withDeleted()
      .leftJoinAndSelect("enroll.employee", "employee")
      .leftJoinAndSelect(
        "employee.dependents",
        "dependents",
        depJoinCondition,
        depJoinParams
      )
      .leftJoinAndSelect("enroll.components", "components")
      .leftJoin(
        PolicyEmployeeEndorsement,
        "pee",
        "pee.employee_id = enroll.employee_id AND pee.policy_id = enroll.policy_id"
      )
      .where("enroll.policy_id = :policyId", { policyId })
      .andWhere("enroll.id > :lastEnrollmentId", { lastEnrollmentId })
      .andWhere(
        new Brackets((qb) => {
          qb.where("pee.employee_endorsement_status_key = :status", {
            status: EMPLOYEE_ENDORSEMENT_READY,
          }).orWhere("dependents.id IS NOT NULL");
        })
      )
      .orderBy("enroll.id", "ASC")
      .take(batchSize);

    if (endorsementId) {
      qb = qb.andWhere(
        new Brackets((qb) => {
          qb.where("pee.endorsement_id = :endorsementId", {
            endorsementId,
          })
            .orWhere("pee.deletion_endorsement_id = :endorsementId", {
              endorsementId,
            })
            .orWhere("dependents.addition_endorsement_id = :endorsementId", {
              endorsementId,
            })
            .orWhere("dependents.deletion_endorsement_id = :endorsementId", {
              endorsementId,
            });
        })
      );
    }

    if (employeeId) {
      qb = qb.andWhere("enroll.employee_id = :employeeId", { employeeId });
    }

    return qb.getMany();
  };

  // Full active family for an employee, independent of any specific endorsement —
  // used ONLY for Dependent Count+Age band matching, never for deciding which
  // dependent's own row/premium gets computed (that stays scoped to
  // listEndorsementReadyEnrollmentsBatch's per-endorsement dependents).
  const fetchActiveDependentsMapByEmployeeIds = async (
    policyId: number,
    employeeIds: number[]
  ): Promise<Map<number, PolicyEnrollmentDependent[]>> => {
    const map = new Map<number, PolicyEnrollmentDependent[]>();
    if (!employeeIds.length) return map;
    const rows = await repositories.dependentRepo.find({
      where: {
        policyId,
        employeeId: In(employeeIds),
        deletedAt: IsNull(),
      },
    });
    rows.forEach((dep: PolicyEnrollmentDependent) => {
      const list = map.get(dep.employeeId) ?? [];
      list.push(dep);
      map.set(dep.employeeId, list);
    });
    return map;
  };

  try {
    const endorsement = await repositories.endorsementRepo.findOne({
      where: { id: endorsementId },
    });
    if (!endorsement?.policyId) {
      logInfo("updateEndorsementSummaryAfterEnrollment", {
        message: "Endorsement not found or missing policyId",
        endorsementId,
      });
      return;
    }

    const policyId = endorsement.policyId;
    let capturedSingleEmpAddition = 0;
    let capturedSingleEmpDeletion = 0;

    let singleEnrollmentRow: PolicyEmployeeEnrollment | null = null;
    if (singleEmployeeId) {
      singleEnrollmentRow = await repositories.employeeEnrollmentRepo.findOne({
        where: { policyId, employeeId: singleEmployeeId },
        select: ["id", "lastPaidNetPremium", "lastPaidGrossPremium"] as any,
      }) ?? null;
      // [ENDO-DBG] temporary
      console.log("[ENDO-DBG] 1 oldNet-read", JSON.stringify({
        endorsementId, policyId, employeeId: singleEmployeeId, captureOnly,
        rowFound: Boolean(singleEnrollmentRow),
        enrollmentRowId: singleEnrollmentRow?.id ?? null,
        oldNetFromDb: singleEnrollmentRow?.lastPaidNetPremium ?? null,
      }));
      logInfo("updateEndorsementSummaryAfterEnrollment", {
        scenario: captureOnly ? "PRE_CAPTURE" : "IBP_INCREMENTAL",
        employeeId: singleEmployeeId,
        endorsementId,
        lastPaidNetPremium: singleEnrollmentRow?.lastPaidNetPremium ?? 0,
        lastPaidGrossPremium: singleEnrollmentRow?.lastPaidGrossPremium ?? 0,
        message: captureOnly
          ? "Pre-capture mode: will store old premium before transaction overwrites choices"
          : "IBP incremental mode: will apply atomic delta to endorsement",
      });
    } else {
      logInfo("updateEndorsementSummaryAfterEnrollment", {
        scenario: "FULL_SCAN",
        endorsementId,
        message: "Scheduler/batch path: full rescan of all endorsement-ready employees",
      });
    }

    const policy = await repositories.policyRepo.findOne({
      where: { id: policyId },
    });

    // Fetch policy configuration for age band calculations
    let policyConfig: any = null;
    if (repositories.policyConfigRepo && repositories.lookUpRepository) {
      try {
        const liveStatus = await repositories.lookUpRepository.findOne({
          where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
        });
        if (liveStatus) {
          const configEntity = await repositories.policyConfigRepo.findOne({
            where: {
              policyId: policyId,
              policyConfiguartionStatusLid: liveStatus.id
            },
          });
          if (configEntity?.policyConfiguration) {
            policyConfig = configEntity.policyConfiguration;
          }
        }
      } catch (error) {
        logInfo("updateEndorsementSummaryAfterEnrollment", {
          message: "Could not fetch policy configuration, using fallback logic",
          policyId,
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    // Dependent Count+Age band matching needs the employee's FULL active family,
    // not just this endorsement's own dependent(s) — but only when this parameter
    // is actually configured, so policies that don't use it are unaffected.
    const needsFullFamilyForBand = Boolean(
      policyConfig &&
        (policyConfig.parameters ?? []).some(
          (p: any) =>
            p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
            p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE,
        ),
    );

    const endorsementStatusKeys = [
      EMPLOYEE_ENDORSEMENT_READY,
      EMPLOYEE_ENDORSEMENT_PROCESSED,
      EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT,
      EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING,
      EMPLOYEE_ENDORSEMENT_ACKNOWLEDGED,
      EMPLOYEE_ENDORSEMENT_DOWNLOADED,
      EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED,
    ];

    const [
      additionEmployeesCount,
      deletionEmployeesCount,
      additionDependentsCount,
      deletionDependentsCount,
    ] = await Promise.all([
      repositories.policyEmployeeEndorsementRepo
        .createQueryBuilder("employeeEndorsement")
        .where("employeeEndorsement.policy_id = :policyId", { policyId })
        .andWhere("employeeEndorsement.endorsement_id = :endorsementId", {
          endorsementId: endorsement.id,
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              "employeeEndorsement.employee_endorsement_status_key IS NULL"
            );
            qb.orWhere(
              "employeeEndorsement.employee_endorsement_status_key IN (:...statusKeys)",
              { statusKeys: endorsementStatusKeys }
            );
          })
        )
        .andWhere(
          new Brackets((qb) => {
            qb.where("employeeEndorsement.deletion_endorsement_id IS NULL");
            qb.orWhere(
              "employeeEndorsement.deletion_endorsement_id <> :endorsementId",
              { endorsementId: endorsement.id }
            );
          })
        )
        .getCount(),
      repositories.policyEmployeeEndorsementRepo
        .createQueryBuilder("employeeEndorsement")
        .where("employeeEndorsement.policy_id = :policyId", { policyId })
        .andWhere(
          "employeeEndorsement.deletion_endorsement_id = :endorsementId",
          { endorsementId: endorsement.id }
        )
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              "employeeEndorsement.employee_endorsement_status_key IS NULL"
            );
            qb.orWhere(
              "employeeEndorsement.employee_endorsement_status_key IN (:...statusKeys)",
              { statusKeys: endorsementStatusKeys }
            );
          })
        )
        .getCount(),
      repositories.dependentRepo.count({
        where: [
          {
            policyId,
            additionEndorsementId: endorsement.id,
            endorsementStatusKey: In(endorsementStatusKeys),
          },
          {
            policyId,
            additionEndorsementId: endorsement.id,
            endorsementStatusKey: IsNull(),
          },
        ],
        withDeleted: true,
      }),
      repositories.dependentRepo.count({
        where: [
          {
            policyId,
            deletionEndorsementId: endorsement.id,
            endorsementStatusKey: In(endorsementStatusKeys),
          },
          {
            policyId,
            deletionEndorsementId: endorsement.id,
            endorsementStatusKey: IsNull(),
          },
        ],
        withDeleted: true,
      }),
    ]);

    const documentRecords = await repositories.uploadRepo.find({
      where: { endorsementId: endorsement.id },
      select: ["documentId"],
    });

    let totalEmployeesInEndorsement = 0;
    let updateOnlyEmployeeIds: number[] = [];
    if (documentRecords.length > 0) {
      const documentIds = documentRecords.map((doc) => doc.documentId);
      totalEmployeesInEndorsement = await repositories.employeePolicyMapRepo.count({
        where: [
          { enrollmentAdditionBatchId: In(documentIds) },
          { enrollmentDeletionBatchId: In(documentIds) },
        ],
        withDeleted: true,
      });
    }

    if (endorsement.id && totalEmployeesInEndorsement === 0) {
      const updateOnlyEmployees = await repositories.policyEmployeeEndorsementRepo
        .createQueryBuilder("employeeEndorsement")
        .select("DISTINCT employeeEndorsement.employee_id", "employeeId")
        .where("employeeEndorsement.policy_id = :policyId", { policyId })
        .andWhere("employeeEndorsement.endorsement_id = :endorsementId", {
          endorsementId: endorsement.id,
        })
        .andWhere(
          "employeeEndorsement.employee_endorsement_status_key = :statusKey",
          { statusKey: EMPLOYEE_ENDORSEMENT_READY }
        )
        .andWhere(
          "employeeEndorsement.endorsement_updation_file_id IS NOT NULL"
        )
        .getRawMany();
      updateOnlyEmployeeIds = updateOnlyEmployees.map(
        (row) => row.employeeId
      );
      if (updateOnlyEmployeeIds.length > 0) {
        totalEmployeesInEndorsement = updateOnlyEmployeeIds.length;
      }
    }

    let updateOnlyDependentsCount = 0;
    updateOnlyDependentsCount =
      await repositories.policyDependentEndorsementRepo.count({
        where: {
          policyId,
          endorsementId: endorsement.id,
          employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
          endorsementUpdationFileId: Not(IsNull()),
        },
        withDeleted: true,
      });

    const useUpdationFallback =
      (updateOnlyEmployeeIds.length > 0 && totalEmployeesInEndorsement > 0) ||
      updateOnlyDependentsCount > 0;

    const endorsementReadyEmployees = totalEmployeesInEndorsement;
    const endorsementReadyDependents =
      additionDependentsCount +
      deletionDependentsCount +
      updateOnlyDependentsCount;

    let additionCount = additionEmployeesCount + additionDependentsCount;
    let deletionCount = deletionEmployeesCount + deletionDependentsCount;

    if (useUpdationFallback) {
      additionCount = 0;
      deletionCount = 0;
    }

    const roundToTwo = (value: number): number =>
      Math.round((value + Number.EPSILON) * 100) / 100;

    let netPremium = 0;
    let grossPremium = 0;

    if (policy?.policyFrom && policy?.policyTo) {
      const policyFrom = new Date(policy.policyFrom as any);
      const policyTo = new Date(policy.policyTo as any);

      if (
        !Number.isNaN(policyFrom.getTime()) &&
        !Number.isNaN(policyTo.getTime())
      ) {
        policyFrom.setHours(0, 0, 0, 0);
        policyTo.setHours(0, 0, 0, 0);

        const msPerDay = 24 * 60 * 60 * 1000;
        const totalPolicyDays = Math.max(
          0,
          Math.floor((policyTo.getTime() - policyFrom.getTime()) / msPerDay) +
          1
        );

        const gstPercentage = Number(policy?.gstPercentage ?? policy?.gst ?? 0);

        const coverageByEmployee = new Map<
          number,
          Pick<
            PolicyEnrollmentEmployeePolicyMap,
            "effectiveDate" | "enrollmentEndDate" | "deletedAt" | "claimStatus" | "additionalParams"
          >
        >();

        const toDateOrUndefined = (
          value?: Date | string | null
        ): Date | undefined => {
          if (!value) {
            return undefined;
          }
          const parsed = new Date(value);
          return Number.isNaN(parsed.getTime()) ? undefined : parsed;
        };

        const resolveAdditionEffectiveDate = (
          value?: Date | string | null
        ): Date => {
          const parsed = toDateOrUndefined(value) ?? policyFrom;
          if (parsed < policyFrom) {
            return policyFrom;
          }
          if (parsed > policyTo) {
            return policyTo;
          }
          return parsed;
        };

        const resolveDeletionEffectiveDate = (
          value?: Date | string | null
        ): Date => {
          if (!value) {
            return policyTo;
          }
          const parsed = toDateOrUndefined(value) ?? policyTo;
          if (parsed < policyFrom) {
            return policyFrom;
          }
          if (parsed > policyTo) {
            return policyTo;
          }
          return parsed;
        };

        const calculateRemainingDays = (effective: Date): number => {
          const normalized = new Date(effective);
          normalized.setHours(0, 0, 0, 0);
          if (normalized > policyTo) {
            return 0;
          }
          const diff = policyTo.getTime() - normalized.getTime();
          return Math.max(0, Math.floor(diff / msPerDay) + 1);
        };

        let additionPremiumTotal = 0;
        let deletionPremiumTotal = 0;

        const batchSize = 1000;
        let lastEnrollmentId = 0;

        const peeEndorsementEmployeeIds = new Set<number>();
        if (endorsement.id) {
          const peeRaw = await repositories.policyEmployeeEndorsementRepo
            .createQueryBuilder("pee")
            .select("pee.employee_id", "employeeId")
            .where("pee.policy_id = :policyId", { policyId })
            .andWhere(
              new Brackets((qb) => {
                qb.where("pee.endorsement_id = :endorsementId", {
                  endorsementId: endorsement.id,
                }).orWhere("pee.deletion_endorsement_id = :endorsementId", {
                  endorsementId: endorsement.id,
                });
              })
            )
            .getRawMany();
          peeRaw.forEach((r) =>
            peeEndorsementEmployeeIds.add(Number(r.employeeId))
          );
        }

        while (true) {
          const enrollmentBatch = await listEndorsementReadyEnrollmentsBatch(
            policyId,
            lastEnrollmentId,
            batchSize,
            endorsement.id,
            singleEmployeeId
          );

          if (!enrollmentBatch.length) {
            break;
          }

          lastEnrollmentId = enrollmentBatch[enrollmentBatch.length - 1].id;

          const batchEmployeeIds = enrollmentBatch.map(
            (enroll) => enroll.employeeId
          );

          const activeDependentsByEmployee = needsFullFamilyForBand
            ? await fetchActiveDependentsMapByEmployeeIds(
                policyId,
                batchEmployeeIds,
              )
            : new Map<number, PolicyEnrollmentDependent[]>();

          coverageByEmployee.clear();
          if (batchEmployeeIds.length) {
            const coverageRows = await repositories.employeePolicyMapRepo.find({
              where: {
                policyId,
                employeeId: In(batchEmployeeIds),
              },
              select: [
                "employeeId",
                "effectiveDate",
                "enrollmentEndDate",
                "deletedAt",
                "claimStatus",
                "additionalParams",
              ],
              withDeleted: true,
            });
            coverageRows.forEach((entry) => {
              coverageByEmployee.set(entry.employeeId, entry);
            });
          }


          for (const enrollment of enrollmentBatch) {
            const coverage = coverageByEmployee.get(enrollment.employeeId);
            const dependents = (enrollment.employee?.dependents ?? []).filter(
              (dependent: PolicyEnrollmentDependent) =>
                dependent.endorsementStatusKey === EMPLOYEE_ENDORSEMENT_READY
            );

            const livesCount = 1 + dependents.length;
            const eligibleDeletionLivesCount =
              resolveDeletionEligibleLivesCount(
                coverage?.claimStatus ?? enrollment.employee?.additionalParams?.claimStatus,
                dependents
              );

            const additionEffectiveDate = coverage?.effectiveDate
              ? toMidnight(new Date(coverage.effectiveDate))
              : policyFrom;
            // Deletion proration must be based on the actual deletion date, not enrollment_end_date.
            const rawDeletionDate =
              coverage?.deletedAt ??
              enrollment.deletedAt ??
              enrollment.employee?.deletedAt ??
              null;
            const deletionEffectiveDate = rawDeletionDate
              ? toMidnight(new Date(rawDeletionDate))
              : policyTo;

            const isEmployeeDeleted =
              !!(coverage?.deletedAt ??
                enrollment.deletedAt ??
                enrollment.employee?.deletedAt ??
                (enrollment as any).enrollmentDeletionBatchId);

            const isDeletion =
              !!enrollment.deletedAt ||
              !!enrollment.employee?.deletedAt ||
              !!(enrollment as any).enrollmentDeletionBatchId;

            // Check the premium amount paid by employee in PolicyEnrollmentEmployeeMap table first followed by PolicyEnrollmentEmployee table
            const mapPremiumOverride = resolveMapAdditionalParamValue(
              coverage?.additionalParams,
              "premium"
            );
            const isBypass =
              !enrollment.components?.length &&
              (enrollment.employee?.bypassPremiumAmount != null ||
                mapPremiumOverride !== undefined);

            if (isBypass) {
              const rawEmpBypass =
                mapPremiumOverride ??
                Number(enrollment.employee?.bypassPremiumAmount ?? 0);
              const empBypass = isDeletion ? -Math.abs(rawEmpBypass) : Math.abs(rawEmpBypass);
              const depBypass = dependents.reduce(
                (sum, d) => sum + Number(d.bypassPremiumAmount ?? 0),
                0
              );
              const totalBypass = Math.abs(empBypass + depBypass);
              if (isDeletion) {
                deletionPremiumTotal += totalBypass;
                if (singleEmployeeId && enrollment.employeeId === singleEmployeeId) {
                  capturedSingleEmpDeletion += totalBypass;
                }
              } else if (!endorsement.id || peeEndorsementEmployeeIds.has(enrollment.employeeId)) {
                additionPremiumTotal += totalBypass;
                if (singleEmployeeId && enrollment.employeeId === singleEmployeeId) {
                  capturedSingleEmpAddition += totalBypass;
                }
              }
            } else {
              const { additionPremiumPortion, deletionPremiumPortion } =
                calculateProratedPremiumsForEnrollment(
                  enrollment,
                  livesCount,
                  policyFrom,
                  policyTo,
                  additionEffectiveDate,
                  deletionEffectiveDate,
                  isEmployeeDeleted,
                  eligibleDeletionLivesCount,
                  dependents,
                  policyConfig,
                  !endorsement.id || peeEndorsementEmployeeIds.has(enrollment.employeeId),
                  endorsement.id,
                  activeDependentsByEmployee.get(enrollment.employeeId),
                  coverage?.additionalParams
                );

              deletionPremiumTotal += Number(deletionPremiumPortion) || 0;
              if (!isDeletion) {
                additionPremiumTotal += Number(additionPremiumPortion) || 0;
              }
              if (singleEmployeeId && enrollment.employeeId === singleEmployeeId) {
                capturedSingleEmpAddition += isDeletion ? 0 : Number(additionPremiumPortion) || 0;
                capturedSingleEmpDeletion += Number(deletionPremiumPortion) || 0;
              }
            }
          }
        }

        netPremium = roundToTwo(additionPremiumTotal - deletionPremiumTotal);
        grossPremium = roundToTwo(
          netPremium + (netPremium * gstPercentage) / 100
        );
      }
    }

    // [ENDO-DBG] temporary
    console.log("[ENDO-DBG] 2 branch", JSON.stringify({
      endorsementId, policyId, employeeId: singleEmployeeId ?? null,
      hasSingleEmployeeId: Boolean(singleEmployeeId),
      hasEnrollmentRow: Boolean(singleEnrollmentRow),
      willRunIncremental: Boolean(singleEmployeeId && singleEnrollmentRow),
      capturedSingleEmpAddition, capturedSingleEmpDeletion,
      fullScanNetPremium: netPremium, fullScanGrossPremium: grossPremium,
    }));

    if (singleEmployeeId && singleEnrollmentRow) {
      const singleEmpNet = roundToTwo(capturedSingleEmpAddition - capturedSingleEmpDeletion);
      const singleEmpGross = roundToTwo(singleEmpNet + singleEmpNet * (Number(policy?.gstPercentage ?? policy?.gst ?? 0)) / 100);

      if (captureOnly) {
        // Pre-capture mode: called BEFORE the transaction saves new choices.
        // Store the employee's current (old) prorated premium without touching the endorsement.
        // The subsequent normal call (after transaction) will use this as oldNet for correct delta.
        await repositories.employeeEnrollmentRepo.update(
          { id: singleEnrollmentRow.id },
          {
            lastPaidNetPremium: singleEmpNet,
            lastPaidGrossPremium: singleEmpGross,
          }
        );
        logInfo("updateEndorsementSummaryAfterEnrollment", {
          scenario: "PRE_CAPTURE_DONE",
          employeeId: singleEmployeeId,
          endorsementId,
          capturedNet: singleEmpNet,
          capturedGross: singleEmpGross,
          message: "Old premium captured. Endorsement NOT updated. Incremental delta will apply after transaction.",
        });
        return;
      }

      const oldNet = roundToTwo(Number(singleEnrollmentRow.lastPaidNetPremium ?? 0));
      const oldGross = roundToTwo(Number(singleEnrollmentRow.lastPaidGrossPremium ?? 0));
      const deltaNet = roundToTwo(singleEmpNet - oldNet);
      const deltaGross = roundToTwo(singleEmpGross - oldGross);
      const deltaGst = roundToTwo(deltaGross - deltaNet);

      logInfo("updateEndorsementSummaryAfterEnrollment", {
        scenario: oldNet === 0 ? "IBP_NEW_ENROLLMENT" : "IBP_EDIT",
        employeeId: singleEmployeeId,
        endorsementId,
        oldNet,
        newNet: singleEmpNet,
        deltaNet,
        deltaGross,
        message: oldNet === 0
          ? "First submit: adding employee's full prorated premium to endorsement"
          : "Edit: applying delta (new - old) to endorsement atomically",
      });

      // [ENDO-DBG] temporary
      console.log("[ENDO-DBG] 3 delta", JSON.stringify({
        targetEndorsementId: endorsement.id,
        calledWithEndorsementId: endorsementId,
        employeeId: singleEmployeeId,
        oldNet, newNet: singleEmpNet, deltaNet, deltaGross, deltaGst,
        endorsementReadyEmployees, endorsementReadyDependents,
        additionCount, deletionCount,
      }));

      await repositories.endorsementRepo.query(
        `UPDATE endorsement
         SET endorsment_count = $1,
             endorsment_dependent_count = $2,
             employee_endorsement_addition_count = $3,
             employee_endorsement_deletion_count = $4,
             net_premium = COALESCE(net_premium, 0) + $5,
             gross_premium = COALESCE(gross_premium, 0) + $6,
             gst_amount = COALESCE(gst_amount, 0) + $7,
             updated_at = NOW()
         WHERE id = $8`,
        [
          endorsementReadyEmployees,
          endorsementReadyDependents,
          additionCount,
          deletionCount,
          deltaNet,
          deltaGross,
          deltaGst,
          endorsement.id,
        ]
      );

      // [ENDO-DBG] temporary — read the row straight back to see if the += landed
      const afterRow = await repositories.endorsementRepo.query(
        `SELECT id, net_premium, gross_premium, gst_amount FROM endorsement WHERE id = $1`,
        [endorsement.id]
      );
      console.log("[ENDO-DBG] 4 after-update", JSON.stringify(afterRow));

      await repositories.employeeEnrollmentRepo.update(
        { id: singleEnrollmentRow.id },
        {
          lastPaidNetPremium: singleEmpNet,
          lastPaidGrossPremium: singleEmpGross,
        }
      );
    } else {
      logInfo("updateEndorsementSummaryAfterEnrollment", {
        scenario: "FULL_SCAN_WRITE",
        endorsementId,
        netPremium,
        grossPremium,
        endorsmentCount: endorsementReadyEmployees,
        message: "Full recalc complete: writing total to endorsement",
      });
      await repositories.endorsementRepo.update(endorsement.id, {
        endorsmentCount: endorsementReadyEmployees,
        endorsmentDependentCount: endorsementReadyDependents,
        employeeEndorsementAdditionCount: additionCount,
        employeeEndorsementDeletionCount: deletionCount,
        netPremium,
        grossPremium,
        gstAmount: roundToTwo(grossPremium - netPremium),
      });
    }

    if (repositories.opportunityRepo && repositories.lookUpRepository) {
      try {
        const roLookup = await repositories.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.RO },
        });
        if (roLookup) {
          const roOpportunity = await repositories.opportunityRepo.findOne({
            where: { opportunityTypeLid: roLookup.id, refPolicyId: policyId },
            select: ["opportunityId"],
          });
          if (roOpportunity) {
            const premiumRow = await repositories.endorsementRepo
              .createQueryBuilder("e")
              .select("SUM(e.grossPremium)", "total")
              .where("e.policyId = :policyId", { policyId })
              .getRawOne<{ total: string }>();
            const totalEndorsementPremium = parseFloat(premiumRow?.total ?? "0") || 0;
            const policyGrossPremium = Number(policy?.grossPremium ?? 0);
            const newPremiumPaid = policyGrossPremium + totalEndorsementPremium;
            await repositories.opportunityRepo.update(roOpportunity.opportunityId, {
              premiumPaid: newPremiumPaid,
            });
            logInfo("updateEndorsementSummaryAfterEnrollment", {
              message: "Updated RO premiumPaid after endorsement update",
              opportunityId: roOpportunity.opportunityId,
              policyId,
              newPremiumPaid,
            });
          }
        }
      } catch (roError) {
        logError("updateEndorsementSummaryAfterEnrollment", {
          message: "Failed to update RO premiumPaid",
          policyId,
          error: roError instanceof Error ? roError.message : roError,
        });
      }
    }

    logInfo("updateEndorsementSummaryAfterEnrollment", {
      message: "Updated endorsement summary after enrollment processing",
      endorsementId: endorsement.id,
      endorsmentCount: endorsementReadyEmployees,
      endorsmentDependentCount: endorsementReadyDependents,
      employeeEndorsementAdditionCount: additionCount,
      employeeEndorsementDeletionCount: deletionCount,
      netPremium,
      grossPremium,
      durationMs: formatDuration(Date.now() - calculationStart),
    });
  } catch (error) {
    logError("updateEndorsementSummaryAfterEnrollment", {
      message: "Failed to update endorsement summary after enrollment",
      endorsementId,
      error: error instanceof Error ? error.message : error,
    });
  }
}
