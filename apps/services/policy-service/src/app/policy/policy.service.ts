import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { DataSource, EntityManager, In } from "typeorm";
import {
  ACCOUNT_NUMBER_PLACEHOLDER,
  BUSINESS_TARGET_ENTITY_TYPE,
  EMPLOYEE_ENDORSEMENT_READY,
  ENDORSEMENT_TRANSACTION_REMARK,
  ENTITY_NAME,
  LOOK_UP_DATA,
  MASTER_DATA,
  POLICY_PERFORMANCE_FIELDS,
  POLICY_SECTION_APPROVAL_DECISION_STATUS,
  POLICY_SECTION_APPROVAL_STATUS_VALUE,
  RENEWAL_OPPORTUNITY,
  SALES_OPPORTUNITY,
  SEZ_APPLICABLE_FIELD_NAME,
  MAX_DEPENDENT_COUNT_INTERNAL_TYPE,
  VALID_POLICY_TYPES,
  OWNER_TYPES,
  POLICY_AUDIT_ACTION_APPROVED,
  POLICY_AUDIT_ACTION_REJECTED,
  POLICY_AUDIT_ACTION_POLICY_ACTIVATED,
  POLICY_AUDIT_ACTION_CONFIGURATION_LIVE,
  POLICY_AUDIT_ACTION_CAUTION_DEPOSIT_ACCOUNT_NUMBER_UPDATED,
  POLICY_AUDIT_ENTITY_POLICY,
  POLICY_CONFIGURATION_STATUS_LIVE,
  POLICY_AUDIT_ENTITY_POLICY_CONFIGURATION,
  POLICY_AUDIT_ENTITY_CAUTION_DEPOSIT,
  POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL,
  POLICY_COMPONENT_UPLOAD_DEFAULTS,
  EMPLOYEE_INSURED_EMPTY_RESULT,
  POLICY_CONFIGURATION_STATUS_LIVE_EDIT_SUBMIT,
  EMPLOYEE_INSURED_EXCEL_LABELS,
  EMPLOYEE_INSURED_EXCEL_MIME_TYPE,
  EMPLOYEE_INSURED_EXCEL_STORAGE_PREFIX,
  EMPLOYEE_INSURED_OPTIMIZED_SORT_FIELDS,
  EMPLOYEE_INSURED_WORKSHEET_NAME,
  POLICY_LOCATION_FIELD_NAME,
  DOCUMENT_TYPES,
  OPPORTUNITY_POLICY_STATUS_ACTIVE,
  POLICY_STATUS_MIG_ACTIVE,
  POLICY_STATUS_MIG_GENERATED,
  POLICY_CONFIGURATION_STATUS_WIP,
  POLICY_CONFIGURATION_SEED_REMARKS,
  ADDRESS_TYPE_POLICY_LOCATION,
  ENDORSEMENT_TYPES,
  ACTIVITY_KEY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  successMessage,
  templateHelperMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { resolveEmployeeInsuredSearchParams } from "../../../../../../libs/service-lib/src/lib/utils/employee-insured.utils";
import { getDateRange, getDateRangeWithoutTimestamp } from "../../../../service-lib/src/lib/utils/get-data-range.utils";
import { MigrationDataSourceService } from "../../../../service-lib/src/lib/migration-datasource.service";
import { Response } from "express";
import {
  MstrCoverSection,
  MstrCoverTemplate,
  OpportunityCoverMap,
} from "../../../../service-lib/src/lib/entities";
import * as XLSX from "xlsx";
import * as ExcelJS from "exceljs";
import {
  DataTemplateField,
  MandatoryDataIntakeFields,
  NonFinancialFields,
} from "./dto/create.template.dto";
import path from "path";
import * as fs from "fs";
import os from "os";
import * as AWS from "aws-sdk";
import {
  formatDateWithTime,
  mapSearchParams,
  mapSortParams,
  filterCoversByActivity,
  getDurationDates,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import {
  ENDORSEMENT_TAT_BUCKETS,
  ENDORSEMENT_TAT_FILTER_LABELS,
  EndorsementTatFilterLabel,
  normalizeEndorsementTatFilter,
} from "../../../../../../libs/service-lib/src/lib/utils/tat.utils";
import { ServiceTatService } from "../service-tat/service-tat.service";
import {
  ACL_ACTIONS,
  ACL_CATEGORY,
  ATTRIBUTE_FIELD_MAP,
  CONTACT_STATUS,
  DEFAULT_POLICY_REPORT_FIELDS,
  DEFAULT_VALUES,
  ENDORSEMENT_HEADERS,
  ENROLLMENT_RELATION_DATA,
  FAKEEMPLOYEEID,
  OPPORTUNITY_MAP_TABLE_DELETE_FIELDS,
  POLICY_TEMPLATE_MOCK_NAMES,
  PORTFOLIO_COMPANY_AGGREGATE_SORT_KEYS,
  serviceNames,
  UTILITY_UPLOAD_ENTITY,
  DOCUMENT_TYPE_POLICY_EMPLOYEE_BYPASS_ENROLLMENT,
  DEPENDENT_COUNT_INTERNAL_TYPE,
  UserBizdoneReportType,
  UserBizdoneReportStatus,
} from "../../../../service-lib/src/lib/constants";
import * as ReportExportJob from "../../../../service-lib/src/lib/utils/report-export-job.util";
import {
  FileUpload,
  PerformanceOutput,
  Policy,
  PolicyConfiguration,
  PolicyEnrollmentDependent,
  PolicyEnrollmentTemplateDocMap,
  LookUp,
} from "../../../../service-lib/src/lib/entities";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { getFilePasswordConfigClient } from "../../../../service-lib/src/lib/service-communication/file-password-config-client";
import { TraceHttpService } from "../../../../service-lib/src/lib/trace-http.service";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import {
  downloadFromS3,
  generateExcel,
  generateExcelWithAppliedFilters,
  getSignedUrl,
  uploadToS3,
} from "../../../../service-lib/src/lib/utils/file-management.utils";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import {
  applyPasswordProtection,
  generatePasswordFromConfig,
  UserDetailsForPassword
} from "../../../../service-lib/src/lib/utils/password-protection.utils";
import { sanitizePath } from "../../../../service-lib/src/lib/utils/path-sanitizer.util";
import { PolicyReportService, rewardsAllowedFor } from "../../../../service-lib/src/lib/utils/policy-report";
import { ActivatePolicyDto } from "./dto/activate-policy.dto";
import { CreateCautionDepositDto } from "./dto/create-caution-deposit.dto";
import { UpsertBusinessTargetDto } from "./dto/upsert-business-target.dto";
import { BusinessTargetReportQueryDto } from "./dto/business-target-report-query.dto";
import { CreatePolicyConfigurationDto } from "./dto/create-policy-configuration.dto";
import { DateRange, GetPoliciesDto } from "./dto/get-policy.dto";
import { GetPolicyQueryDto } from "./dto/get-all-policy.dto";
import { GetTatBucketsQueryDto } from "./dto/get-tat-buckets-query.dto";
import { GetTatSummaryQueryDto } from "./dto/get-tat-summary-query.dto";
import { PolicyComponentUploadDto } from "./dto/policy-component-upload.dto";
import {
  PolicySectionApprovalDto,
  PolicySectionIdentifier,
  PolicySectionSubmissionDto,
} from "./dto/policy-section-approval.dto";
import { PolicySummaryDto } from "./dto/policy-summary.dto";
import { CreatePolicyDto } from "./dto/policy.dto";
import { TatBucketListItemDto } from "./dto/tat-bucket-list-item.dto";
import { UpdateCautionDepositAccountNumberDto } from "./dto/update-caution-deposit-account-number.dto";
import { UpdateCautionDepositDto } from "./dto/update-caution-deposit.dto";
import { UpdatePolicyConfigurationDto } from "./dto/update-policy-configuration.dto";
import { UpdatePolicyCoverDto } from "./dto/update-policy-cover.dto";
import { UpdatePolicyDTO } from "./dto/update-policy.dto";
import {
  ClaimTatSnapshot,
  EndorsementTatSnapshot,
  PolicyRepository,
  PolicySectionStatuses,
} from "./policy.repository";
import { CreatePolicyInstallmentDto } from "./dto/create-policy-installment.dto";
import { UpdatePolicyInstallmentDto } from "./dto/update-policy-installment.dto";

// Vertical and branch are multiselect filters: accept a single id or a list.
const idMatches = (selected: any, rowId: any): boolean => {
  if (!selected) return true;
  const ids = (Array.isArray(selected) ? selected : [selected]).map(Number);
  return ids.includes(Number(rowId));
};


// ACL Constants
const ACL_CATEGORY_POLICY_CONFIGURE = "POLICY_CONFIGURE";
const ACL_ACTION_POLICY_CONFIGURE_LIVE_EDIT = "POLICY_CONFIGURE_LIVE_EDIT_001";
const RELATIONSHIP_GROUP_FIELD_NAME = "Relationship Group";
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

interface TatBucketSummary {
  label: string;
  range: { from: number; to: number | null };
  count: number;
}

interface TatBucketDefinition<TRecord> {
  label: EndorsementTatFilterLabel;
  range: { from: number; to: number | null };
  match: (context: { record: TRecord; tatDays: number }) => boolean;
}

interface TatSectionSummary {
  title: string;
  totalCount: number;
  buckets: TatBucketSummary[];
}

interface EndorsementTatRecord {
  endorsementId: number;
  endorsementNumber: string | null;
  endorsementEntryDate: string | null;
  insurerEndorsementDate: string | null;
  clientConfirmationDate: string | null;
  status: string | null;
}
interface ClaimTatRecord {
  claimId: number;
  claimNumber: string | null;
  reportedDate: string | null;
  settlementDate: string | null;
  status: string | null;
}
export interface TatSummaryResponse {
  endorsements: TatSectionSummary;
  claims: TatSectionSummary;
  policyExpiryTimelineBySbu?: {
    sbuId: number;
    sbuName: string;
    sourceSbuIds?: number[];
    policyExpiryTimeline: { label: string; count: number }[];
  }[];
  sbuData?: {
    endorsements: { title: string; bucketLabels: string[]; rows: TatSbuRow[] };
    claims: { title: string; bucketLabels: string[]; rows: TatSbuRow[] };
  };
}

export interface TatSbuRow {
  sbuId: number;
  sbuName: string;
  sourceSbuIds?: number[];
  totalCount: number;
  buckets: number[];
}

export interface TatSummaryBySbuResponse {
  endorsements: {
    title: string;
    bucketLabels: string[];
    rows: TatSbuRow[];
  };
  claims: {
    title: string;
    bucketLabels: string[];
    rows: TatSbuRow[];
  };
}

type PolicyComponentExcelRow = Record<string, unknown>;

const parsePolicyComponentPolicyId = (value: unknown): number | null => {
  if (value == null) return null;
  const text = String(value).trim();
  const match = text.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizePolicyComponentRows = (
  rows: PolicyComponentExcelRow[],
): PolicyComponentExcelRow[] =>
  rows.map((row) => {
    const normalized: PolicyComponentExcelRow = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = String(key)
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      normalized[normalizedKey] = value;
    }
    return normalized;
  });

// ---------------------------------------------------------------------------
// Policy Migration source config. MIGRATION_DB_URL (see
// MigrationDataSourceService in service-lib) points this at the client's
// database; the view name(s) below identify what to read once connected.
// ---------------------------------------------------------------------------
// Either a single view name, or a comma-separated list of views with an
// IDENTICAL schema to UNION together in application code (e.g. the source
// splits individual vs. corporate policies into separate views). Schema
// introspection always uses the first view in the list.
const POLICY_MIGRATION_SOURCE_VIEW =
  process.env.POLICY_MIGRATION_SOURCE_VIEW || "vw_policy_migration_source";
const POLICY_MIGRATION_UPDATE_SOURCE_VIEW =
  process.env.POLICY_MIGRATION_UPDATE_SOURCE_VIEW || "vw_policy_migration_update_source";
// Policies whose company couldn't be resolved at source time — the row
// carries `company_unique_id` (matched against company.mig_ref_no) instead
// of a direct `company_id`. See the "missed-company" phase in
// migratePolicies() below.
const POLICY_MIGRATION_MISSED_COMPANY_SOURCE_VIEW =
  process.env.POLICY_MIGRATION_MISSED_COMPANY_SOURCE_VIEW || "vw_policy_migration_missed_company_source";
// Policies to be disabled-for-performance at the source — matched by BOTH id
// and mig_ref_no (same dual-key rule as the update phase), then just
// `enabled_for_performance_lid` is updated. See the "disable" phase in
// migratePolicies() below.
const POLICY_MIGRATION_DISABLE_SOURCE_VIEW =
  process.env.POLICY_MIGRATION_DISABLE_SOURCE_VIEW || "vw_policy_migration_disable_source";
const POLICY_MIGRATION_ORDER_COLUMN = process.env.POLICY_MIGRATION_ORDER_COLUMN || "row_seq";
const POLICY_MIGRATION_BATCH_SIZE = Number(process.env.POLICY_MIGRATION_BATCH_SIZE) || 100;
const POLICY_MIGRATION_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
// migration_log.system — identifies the SOURCE system this migrated data
// comes from (not our own service name): both policy and company migration
// data originate from the client's finops system.
const MIGRATION_LOG_SYSTEM = "finops";
// Postgres advisory lock key guarding migratePolicies() against overlapping
// runs (e.g. a caller retrying after the request-level timeout while the
// original invocation is still processing in the background). Two
// overlapping runs racing to UPDATE the same policy rows produced exactly
// this symptom: a run's logged success/error counts (and its success CSV)
// captured a stale, tiny snapshot while the real UPDATE work — blocked for
// tens of minutes behind the other run's row locks — quietly finished much
// later and for real. Arbitrary constant, just needs to be unique across
// this codebase's advisory lock usage.
const POLICY_MIGRATION_ADVISORY_LOCK_KEY = 861234501;

const parseViewList = (value: string): string[] =>
  value.split(",").map((v) => v.trim()).filter(Boolean);

interface MigratePoliciesBatchResult {
  batchNumber: number;
  rowsRead: number;
  validRows: number;
  errorRows: number;
  status: "completed" | "failed";
  error?: string;
  durationMs?: number;
}

interface MigratePoliciesResult {
  migrationRunId: string;
  stagingTable: string;
  refTable: string;
  totalRows: number;
  totalBatches: number;
  validRows: number;
  errorRows: number;
  insertedIntoPolicy: number;
  insertedIntoPolicyInsurerMap: number;
  errorLogTable: string;
  batches: MigratePoliciesBatchResult[];
  rawDataCsvKey: string | null;
  createErrorCsvKey: string | null;
  createSuccessCsvKey: string | null;
  updateStagingTable: string | null;
  updateBackupTable: string | null;
  updateTotalRows: number;
  updateTotalBatches: number;
  updatedRows: number;
  updateErrorRows: number;
  updateBatches: MigratePoliciesBatchResult[];
  updateRawDataCsvKey: string | null;
  updateErrorCsvKey: string | null;
  updateSuccessCsvKey: string | null;
  missedCompanyStagingTable: string | null;
  missedCompanyRefTable: string | null;
  missedCompanyTotalRows: number;
  missedCompanyTotalBatches: number;
  missedCompanyValidRows: number;
  missedCompanyErrorRows: number;
  missedCompanyInsertedIntoPolicy: number;
  missedCompanyInsertedIntoPolicyInsurerMap: number;
  missedCompanyBatches: MigratePoliciesBatchResult[];
  missedCompanyRawDataCsvKey: string | null;
  missedCompanyErrorCsvKey: string | null;
  missedCompanySuccessCsvKey: string | null;
  disableTotalRows: number;
  disableTotalBatches: number;
  disabledRows: number;
  disableErrorRows: number;
  disableBatches: MigratePoliciesBatchResult[];
  disableRawDataCsvKey: string | null;
  disableErrorCsvKey: string | null;
  disableSuccessCsvKey: string | null;
}

@Injectable()
export class PolicyService {
  private readonly s3: AWS.S3;
  private readonly bucket = process.env.S3_AWS_BUCKET || "";
  private readonly repoMode = process.env.DOCUMENT_REPOSITORY_MODE || "LFS";
  private readonly docRepoPath =
    process.env.DOCUMENT_REPOSITORY || "tmp/document-repository";
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(
    private policyRepository: PolicyRepository,
    public readonly dataSource: DataSource,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly masterValidation: MasterValidationService,
    private readonly policyReportService: PolicyReportService,
    private readonly traceIdService: TraceIdService,
    private readonly scopeService: ScopeService,
    private readonly traceHttpService: TraceHttpService,
    private readonly serviceTatService: ServiceTatService,
    private readonly migrationDataSourceService: MigrationDataSourceService,
  ) {
    if (this.repoMode === "AWS") {
      AWS.config.update({ region: process.env.S3_AWS_REGION });
      this.s3 = new AWS.S3();
    }
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE,
    );
  }

  /**
   * Fetch module-specific password protection configuration from document-service
   * @param categoryKey - The module category key (e.g., 'inception')
   * @returns Boolean indicating if password protection is enabled for this module
   */
  private async getModulePasswordConfig(categoryKey: string): Promise<boolean> {
    try {
      const documentServiceUrl = ENV.URL_DOCUMENT_SERVICE || 'http://localhost:3013';
      const response = await this.traceHttpService.get(
        `${documentServiceUrl}/password-protection-config/${categoryKey}`
      );
      
      // Response structure: { id, categoryName, categoryKey, enablePassword, status }
      return response.data?.enablePassword ?? false;
    } catch (error) {
      this.logger.warn({
        level: 'warn',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'warning',
          location: 'PolicyService',
          method: 'getModulePasswordConfig',
          messageData: `Failed to fetch module config for ${categoryKey}, defaulting to false: ${error.message}`,
        }),
      });
      return false;
    }
  }

  private async isPolicyEnrolmentPremiumBased(policyId: number): Promise<boolean> {
    const policyRepo = this.dataSource.getRepository(Policy);
    const lookUpRepo = this.dataSource.getRepository(LookUp);

    const [policy, toggleYes] = await Promise.all([
      policyRepo.findOne({
        where: { id: policyId },
        select: ["id", "isEnrolmentPremiumBasedLid"],
      }),
      lookUpRepo.findOne({
        where: { lookUpKey: "TOGGLE_TYPE_YES" },
      }),
    ]);

    return (
      policy?.isEnrolmentPremiumBasedLid != null &&
      policy.isEnrolmentPremiumBasedLid === toggleYes?.id
    );
  }

  private async shouldBypassPolicyConfigurationForInception(
    policyId: number,
    isInception: boolean,
    documentType: string,
  ): Promise<boolean> {
    if (documentType === DOCUMENT_TYPE_POLICY_EMPLOYEE_BYPASS_ENROLLMENT) {
      return true;
    }

    if (!isInception) {
      return false;
    }

    return this.isPolicyEnrolmentPremiumBased(policyId);
  }

  /**
   * Reconfiguration: rewinds an active policy back to the configuration stage —
   * config back to WIP, enrollment template doc mappings dropped, policy back to
   * MIG_GENERATED. Privileged + irreversible.
   */
  async reconfigurePolicy(policyId: number, userId: number) {
    const policy = await this.dataSource.getRepository(Policy).findOne({
      where: { id: policyId },
      relations: ["policyStatus"],
      select: { id: true, policyStatus: { id: true, lookUpKey: true } },
    });
    if (!policy) {
      throw new NotFoundException(errorMessages.policyNotFound);
    }
    if (policy.policyStatus?.lookUpKey !== POLICY_STATUS_MIG_ACTIVE) {
      throw new BadRequestException(errorMessages.policyMustBeActiveToReconfigure);
    }

    const lookUpRepo = this.dataSource.getRepository(LookUp);
    const [wipStatus, generatedStatus] = await Promise.all([
      lookUpRepo.findOne({ where: { lookUpKey: POLICY_CONFIGURATION_STATUS_WIP } }),
      lookUpRepo.findOne({ where: { lookUpKey: POLICY_STATUS_MIG_GENERATED } }),
    ]);
    if (!wipStatus || !generatedStatus) {
      throw new BadRequestException(errorMessages.unknownError);
    }

    return this.dataSource.transaction(async (manager) => {
      const updated = await manager.update(
        PolicyConfiguration,
        { policyId },
        { policyConfiguartionStatusLid: wipStatus.id },
      );
      if (!updated.affected) {
        const { companyId, policyTypeLid } = await manager
          .getRepository(Policy)
          .findOneOrFail({
            where: { id: policyId },
            select: { id: true, companyId: true, policyTypeLid: true },
          });
        await manager.insert(PolicyConfiguration, {
          companyId,
          policyTypeLid,
          policyId,
          policyConfiguartionStatusLid: wipStatus.id,
          policyStep: 0,
          policyConfiguration: {},
          remarks: POLICY_CONFIGURATION_SEED_REMARKS,
          version: 1,
        });
      }
      await manager.delete(PolicyEnrollmentTemplateDocMap, { policyId });
      await manager.update(
        Policy,
        { id: policyId },
        { policyStatusLid: generatedStatus.id, updatedBy: userId, updatedAt: new Date() },
      );
      return { policyId, policyStatus: POLICY_STATUS_MIG_GENERATED };
    });
  }

  private async assertPolicyIsActive(policyId: number): Promise<void> {
    const policy = await this.dataSource.getRepository(Policy).findOne({
      where: { id: policyId },
      relations: ["policyStatus"],
      select: { id: true, policyStatus: { id: true, lookUpKey: true } },
    });
    const statusKey = policy?.policyStatus?.lookUpKey ?? "";
    const isActive =
      statusKey === OPPORTUNITY_POLICY_STATUS_ACTIVE ||
      statusKey === POLICY_STATUS_MIG_ACTIVE;
    if (!isActive) {
      throw new BadRequestException(
        errorMessages.policyMustBeActivatedForBypassInception,
      );
    }
  }

  private async assertCompanyHasPolicyLocationAddress(
    policyId: number,
  ): Promise<void> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select("1", "exists")
      .from("policy", "p")
      .innerJoin("company_address", "ca", "ca.company_id = p.company_id AND ca.deleted_at IS NULL")
      .innerJoin("address", "a", "a.id = ca.address_id AND a.deleted_at IS NULL")
      .innerJoin("lookup_data", "ld", "ld.id = a.address_type_lid")
      .where("p.id = :policyId", { policyId })
      .andWhere("ld.lookup_key = :key", {
        key: ADDRESS_TYPE_POLICY_LOCATION,
      })
      .limit(1)
      .getRawOne();
    if (!row) {
      throw new BadRequestException(
        errorMessages.policyLocationsRequireAddress,
      );
    }
  }

  private async assertInceptionCompleted(policyId: number): Promise<void> {
    const { isInceptionCompleted } =
      await this.policyRepository.getInceptionStatus(policyId);
    if (!isInceptionCompleted) {
      throw new BadRequestException(
        errorMessages.inceptionMustBeCompletedForBypassEndorsement,
      );
    }
  }

  async getUserDetails(userId: number): Promise<UserDetailsForPassword | null> {
    try {
      const user = await this.policyRepository.getUserDetails(userId);
      if (!user) return null;
      
      return {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailId || '',
        mobileNumber: user.mobile || '',
        dob: user.dob || '',
        organisationKey: user.organisation?.organisationKey || '',
      };
    } catch (error) {
      this.logger.warn({
        level: 'warn',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'warning',
          location: 'PolicyService',
          method: 'getUserDetails',
          messageData: `Failed to fetch user details for userId ${userId}: ${error.message}`,
        }),
      });
      return null;
    }
  }

  private generateEmployeeId(index: number): string {
    return `${FAKEEMPLOYEEID}${(index + 1).toString().padStart(3, "0")}`;
  }

  private getEnabledRelationshipOptionNames(config: any): string[] {
    const relations = config?.relationships?.enabledPolicyRelations;
    if (!Array.isArray(relations)) {
      return [];
    }

    const enabledNames: string[] = [];
    for (const relation of relations) {
      if (!relation?.enabled) {
        continue;
      }

      const configuredOptions = Array.isArray(relation.configuredOptions)
        ? relation.configuredOptions
        : [];

      for (const option of configuredOptions) {
        if (
          option?.enabled &&
          option?.name &&
          !enabledNames.includes(option.name)
        ) {
          enabledNames.push(option.name);
        }
      }
    }

    return enabledNames;
  }

  private getRelationGroupLabel(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value).trim();
  }

  private getRelationGroupOptions(config: any): string[] {
    const relationParam = config?.parameters?.find(
      (p: any) => p?.type === "relation",
    );
    if (!relationParam?.relationGroupDetails?.length) {
      return [];
    }
    const options = relationParam.relationGroupDetails
      .map(
        (group: any) =>
          group?.groupDisplayName || group?.name || group?.type || "",
      )
      .map((name: any) => this.getRelationGroupLabel(name))
      .filter((name: string) => name.length > 0);
    return Array.from(new Set(options));
  }

  private shouldIncludeRelationshipGroupField(config: any): boolean {
    return this.getRelationGroupOptions(config).length > 0;
  }

  private getIncludedRelationshipFieldName(config: any): string | null {
    if (this.getRelationGroupOptions(config).length > 0) {
      const relationParam = config?.parameters?.find(
        (param: any) => param?.type === "relation",
      );
      return relationParam?.displayName || RELATIONSHIP_GROUP_FIELD_NAME;
    } else {
      return null;
    }
  }

  async getTatSummary(
    userId: number,
    query: GetTatSummaryQueryDto,
    isLeadership?: boolean = false,
  ): Promise<TatSummaryResponse> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyService",
        method: "getTatSummary",
        payload: query,
        messageData: "method invoked",
      }),
    });

    try {
      const { fromDate: effectiveFromDate, toDate: effectiveToDate } =
        this.resolveTatDateRange(query);
      const effectiveOrgIds = await this.resolveTatOrganisationIds(
        query.orgId ?? query.organisationId,
      );

      // When ownerId is explicitly provided, always scope to that owner's team/self
      // regardless of leadership role. Leadership-only bypass applies only when
      // no explicit ownerId is given (i.e. the caller wants the full unfiltered view).
      const hasExplicitOwner = query?.ownerId != null;
      const ownerIds =
        hasExplicitOwner || !isLeadership
          ? await this.resolveTatOwnerScope(userId, query)
          : undefined;

      const restrictToCreators =
        !isLeadership &&
        query?.viewBy === OWNER_TYPES.TEAM &&
        (ownerIds?.length ?? 0) > 0;

      const shouldFetchSnapshot =
        (isLeadership && !hasExplicitOwner) ||
        (ownerIds !== undefined && ownerIds.length > 0);

      const snapshot = shouldFetchSnapshot
        ? await this.policyRepository.getTatSummarySnapshot(ownerIds, {
            restrictToCreators,
            isLeadership,
            orgIds: effectiveOrgIds,
            sbuId: query.sbuId,
            verticalId: query.verticalId,
            departmentId: query.departmentId,
            branchId: query.branchId,
            fromDate: effectiveFromDate,
            toDate: effectiveToDate,
            insurerId: query.insurerId,
            businessMonth: query.businessMonth,
          })
        : { endorsements: [], claims: [] };

      const expiryResult = shouldFetchSnapshot
        ? await this.policyRepository.getPolicyExpiryTimelineBySbu(
            userId,
            ownerIds,
            effectiveOrgIds,
            {
              isLeadership,
              search: query.search,
              sbuId: query.sbuId,
              verticalId: query.verticalId,
              departmentId: query.departmentId,
              branchId: query.branchId,
              fromDate: effectiveFromDate,
              toDate: effectiveToDate,
              insurerId: query.insurerId,
              businessMonth: query.businessMonth,
            },
          )
        : { data: [], total: 0, page: 1, limit: 10 };

      const sbuResult = await this.getTatSummaryBySbu(
        userId,
        {
          ...query,
          page: 1,
          limit: 1000,
          from: effectiveFromDate,
          to: effectiveToDate,
        },
        isLeadership,
      );

      const computedSummary = this.composeTatSummary(
        snapshot.endorsements.map((endorsement) =>
          this.mapEndorsementTatSnapshot(endorsement),
        ),
        snapshot.claims.map((claim) => this.mapClaimTatSnapshot(claim)),
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "getTatSummary",
          payload: { ownerIds },
          messageData: "returning computed TAT snapshot",
        }),
      });

      return {
        ...computedSummary,
        policyExpiryTimelineBySbu: expiryResult.data,
        sbuData: sbuResult.data,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "getTatSummary",
          payload: query,
          messageData: error,
        }),
      });

      throw new InternalServerErrorException(
        errorMessages.tatSummaryFetchFailed,
      );
    }
  }

  async getTatSummaryBySbu(
    userId: number,
    query: GetTatSummaryQueryDto,
    isLeadership = false,
  ): Promise<any> {
    try {
      const { fromDate: effectiveFromDate, toDate: effectiveToDate } =
        this.resolveTatDateRange(query);
      const effectiveOrgIds = await this.resolveTatOrganisationIds(
        query.orgId ?? query.organisationId,
      );

      const hasExplicitOwner = query?.ownerId != null;
      const ownerIds =
        hasExplicitOwner || !isLeadership
          ? await this.resolveTatOwnerScope(userId, query)
          : undefined;

      const shouldFetchSnapshot =
        (isLeadership && !hasExplicitOwner) ||
        (ownerIds !== undefined && ownerIds.length > 0);

      if (!shouldFetchSnapshot) {
        return {
          data: {
            endorsements: {
              title: "endorsements",
              bucketLabels: [],
              rows: [],
            },
            claims: {
              title: "claims",
              bucketLabels: [],
              rows: [],
            },
          },
          total: 0,
          page: query.page || 1,
          limit: query.limit || 10,
        };
      }

      const paginatedResult =
        await this.policyRepository.getTatSummarySnapshotBySbu(
          userId,
          ownerIds,
          effectiveOrgIds,
          {
            isLeadership,
            page: query.page,
            limit: query.limit,
            search: query.search,
            sbuId: query.sbuId,
            verticalId: query.verticalId,
            departmentId: query.departmentId,
            branchId: query.branchId,
            fromDate: effectiveFromDate,
            toDate: effectiveToDate,
            insurerId: query.insurerId,
            businessMonth: query.businessMonth,
          },
        );

      const { data: sbuRows, total, page, limit } = paginatedResult;

      const bucketDefs =
        this.createOpenTatBucketDefinitions<EndorsementTatRecord>();
      const bucketLabels = bucketDefs.map((b) => b.label);

      const endorsementRows: TatSbuRow[] = sbuRows.map((sbu) => {
        const summary = this.buildEndorsementTatSummary(
          sbu.endorsements.map((endorsement) =>
            this.mapEndorsementTatSnapshot(endorsement),
          ),
        );
        return {
          sbuId: sbu.sbuId,
          sbuName: sbu.sbuName,
          sourceSbuIds: sbu.sourceSbuIds,
          totalCount: summary.totalCount,
          buckets: summary.buckets.map((b) => b.count),
        };
      });

      const claimRows: TatSbuRow[] = sbuRows.map((sbu) => {
        const summary = this.buildClaimTatSummary(
          sbu.claims.map((claim) => this.mapClaimTatSnapshot(claim)),
        );
        return {
          sbuId: sbu.sbuId,
          sbuName: sbu.sbuName,
          sourceSbuIds: sbu.sourceSbuIds,
          totalCount: summary.totalCount,
          buckets: summary.buckets.map((b) => b.count),
        };
      });

      const claimBucketDefs =
        this.createOpenTatBucketDefinitions<ClaimTatRecord>();

      return {
        data: {
          endorsements: {
            title: "endorsements",
            bucketLabels,
            rows: endorsementRows,
          },
          claims: {
            title: "claims",
            bucketLabels: claimBucketDefs.map((b) => b.label),
            rows: claimRows,
          },
        },
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "getTatSummaryBySbu",
          payload: query,
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        errorMessages.tatSummaryFetchFailed,
      );
    }
  }

  async getTatBuckets(
    userId: number,
    query: GetTatBucketsQueryDto,
  ): Promise<TatBucketListItemDto[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyService",
        method: "getTatBuckets",
        payload: query,
        messageData: "method invoked",
      }),
    });

    try {
      const orgId =
        typeof query?.orgId === "number" && !Number.isNaN(query.orgId)
          ? query.orgId
          : undefined;
      const trimmedName = query?.name?.trim();

      const buckets = await this.policyRepository.findActiveTatBuckets(
        orgId,
        trimmedName,
      );

      const response = buckets.map(
        (bucket) => new TatBucketListItemDto(bucket),
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "getTatBuckets",
          payload: { orgId, name: trimmedName },
          messageData: "active TAT buckets retrieved",
        }),
      });

      return response;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "getTatBuckets",
          payload: query,
          messageData: error,
        }),
      });

      throw new InternalServerErrorException(
        errorMessages.tatBucketListFetchFailed,
      );
    }
  }

  private composeTatSummary(
    endorsementRecords: EndorsementTatRecord[],
    claimRecords: ClaimTatRecord[],
  ): TatSummaryResponse {
    return {
      endorsements: this.buildEndorsementTatSummary(endorsementRecords),
      claims: this.buildClaimTatSummary(claimRecords),
    };
  }

  private resolveTatDateRange(query: GetTatSummaryQueryDto): {
    fromDate?: Date;
    toDate?: Date;
  } {
    if (query.from && query.to) {
      return { fromDate: query.from, toDate: query.to };
    }

    if (
      typeof query.financialYear === "number" &&
      !Number.isNaN(query.financialYear)
    ) {
      const startYear = query.financialYear;
      return {
        fromDate: new Date(`${startYear}-04-01`),
        toDate: new Date(`${startYear + 1}-03-31`),
      };
    }

    return {};
  }

  private async resolveTatOrganisationIds(
    organisationId?: number,
  ): Promise<number[] | undefined> {
    if (
      typeof organisationId !== "number" ||
      Number.isNaN(organisationId) ||
      organisationId <= 0
    ) {
      return undefined;
    }

    const organisationIdNew = await this.policyRepository.getEntityTableMapIds(
      OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
      OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
      { id: organisationId },
    );

    const lookupCriteria =
      organisationIdNew.length === 0
        ? { parentOrganisationId: organisationId }
        : { id: organisationId };

    const organisationIds = await this.policyRepository.getEntityTableMapIds(
      OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
      OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
      lookupCriteria,
    );

    return Array.isArray(organisationIds) && organisationIds.length > 0
      ? organisationIds
      : [organisationId];
  }

  private async resolveTatOwnerScope(
    userId: number,
    query: GetTatSummaryQueryDto,
  ): Promise<number[]> {
    const resolveNumber = (value: unknown): number | null =>
      typeof value === "number" && !Number.isNaN(value) ? value : null;

    const baseUserId =
      resolveNumber(query?.ownerId) ?? resolveNumber(userId) ?? null;

    if (baseUserId === null) {
      return [];
    }

    if (query?.viewBy === OWNER_TYPES.TEAM) {
      const hierarchy = await this.scopeService.getNewEmployeeHierarchyByUserId(
        baseUserId,
      );

      const hierarchyIds = Array.isArray(hierarchy)
        ? hierarchy
            .map((node: { userId?: number } | null | undefined) => node?.userId)
            .filter((id): id is number => typeof id === "number")
        : [];

      if (!hierarchyIds.includes(baseUserId)) {
        hierarchyIds.push(baseUserId);
      }

      return Array.from(new Set(hierarchyIds));
    }

    return [baseUserId];
  }

  private buildEndorsementTatSummary(
    records: EndorsementTatRecord[],
  ): TatSectionSummary {
    return this.buildTatSummary("endorsements", records, {
      getStart: (record) => record.endorsementEntryDate,
      getEnd: (record) => record.clientConfirmationDate,
      shouldInclude: (record) => {
        const hasEntryDate =
          record.endorsementEntryDate !== null &&
          record.endorsementEntryDate !== undefined;
        const isUnacknowledged =
          record.clientConfirmationDate === null ||
          record.clientConfirmationDate === undefined;

        return hasEntryDate && isUnacknowledged;
      },
      bucketDefinitions:
        this.createOpenTatBucketDefinitions<EndorsementTatRecord>(),
    });
  }

  private buildClaimTatSummary(records: ClaimTatRecord[]): TatSectionSummary {
    return this.buildTatSummary("claims", records, {
      getStart: (record) => record.reportedDate,
      getEnd: (record) => record.settlementDate,
      shouldInclude: (record) => {
        const hasReportedDate =
          record.reportedDate !== null && record.reportedDate !== undefined;
        const isUnsettled =
          record.settlementDate === null || record.settlementDate === undefined;

        return hasReportedDate && isUnsettled;
      },
      bucketDefinitions: this.createOpenTatBucketDefinitions<ClaimTatRecord>(),
    });
  }

  private createOpenTatBucketDefinitions<
    TRecord,
  >(): TatBucketDefinition<TRecord>[] {
    return ENDORSEMENT_TAT_FILTER_LABELS.map((label) => {
      const { min, max } = ENDORSEMENT_TAT_BUCKETS[label];
      return {
        label,
        range: { from: min, to: typeof max === "number" ? max : null },
        match: ({ tatDays }) =>
          tatDays >= min && (typeof max === "number" ? tatDays <= max : true),
      } satisfies TatBucketDefinition<TRecord>;
    });
  }

  private mapEndorsementTatSnapshot(
    snapshot: EndorsementTatSnapshot,
  ): EndorsementTatRecord {
    return {
      endorsementId: snapshot.id,
      endorsementNumber:
        snapshot.insurerEndorsementNumber ??
        snapshot.insurerAcknowledgementNumber ??
        null,
      endorsementEntryDate: this.toIsoString(snapshot.endorsementEntryDate),
      insurerEndorsementDate: this.toIsoString(snapshot.insurerEndorsementDate),
      clientConfirmationDate: this.toIsoString(snapshot.clientConfirmationDate),
      status: snapshot.endorsementStatus ?? null,
    };
  }

  private mapClaimTatSnapshot(snapshot: ClaimTatSnapshot): ClaimTatRecord {
    return {
      claimId: snapshot.id,
      claimNumber: snapshot.claimPreAuthId ?? snapshot.claimInsuredId ?? null,
      reportedDate: snapshot.claimDate
        ? this.toDateOnlyIsoString(snapshot.claimDate)
        : this.toIsoString(snapshot.createdAt ?? null),
      settlementDate: this.toDateOnlyIsoString(snapshot.settlementDate ?? null),
      status: snapshot.claimStatus ?? null,
    };
  }

  // claim_dt / clm_sett_date are date-only columns: the pg driver parses them
  // as LOCAL midnight, so reading UTC components (as toIsoString does) lands on
  // the previous day for timezones ahead of UTC and inflates TAT by one day.
  // Recover the stored calendar date from local components instead.
  private toDateOnlyIsoString(
    value: Date | string | null | undefined,
  ): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return null;
      }
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}T00:00:00.000Z`;
    }

    return this.toIsoString(value);
  }

  private toIsoString(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private resolveCalendarDate(
    value: string | Date | null | undefined,
  ): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return new Date(
      Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
      ),
    );
  }

  private buildTatSummary<TRecord>(
    title: string,
    records: TRecord[],
    config: {
      getStart: (record: TRecord) => string | Date | null | undefined;
      getEnd: (record: TRecord) => string | Date | null | undefined;
      bucketDefinitions: TatBucketDefinition<TRecord>[];
      shouldInclude?: (record: TRecord) => boolean;
    },
  ): TatSectionSummary {
    const buckets = config.bucketDefinitions.map((bucket) => ({
      label: bucket.label,
      range: bucket.range,
      count: 0,
    }));

    let totalCount = 0;

    for (const record of records) {
      if (config.shouldInclude && !config.shouldInclude(record)) {
        continue;
      }

      const tatDays = this.calculateTatDays(
        config.getStart(record),
        config.getEnd(record),
      );

      if (tatDays === null) {
        continue;
      }

      const bucketIndex = config.bucketDefinitions.findIndex((bucket) =>
        bucket.match({ record, tatDays }),
      );

      if (bucketIndex === -1) {
        continue;
      }

      buckets[bucketIndex].count += 1;
      totalCount += 1;
    }

    return {
      title,
      totalCount,
      buckets,
    };
  }

  private calculateTatDays(
    startValue: string | Date | null | undefined,
    endValue: string | Date | null | undefined,
  ): number | null {
    const start = this.resolveCalendarDate(startValue);
    if (!start) return null;

    const end = this.resolveCalendarDate(endValue ?? new Date());
    if (!end) return null;

    // Normalize both to UTC midnight to avoid timezone/DST drift
    const startUTC = Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
    );
    const endUTC = Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate(),
    );

    const diff = endUTC - startUTC;
    // Future-dated start dates have no elapsed TAT; exclude them so dashboard
    // buckets match the listing SQL (CURRENT_DATE - date BETWEEN min AND max).
    if (diff < 0) return null;

    return Math.floor(diff / MILLISECONDS_PER_DAY);
  }

  async getPolicyById(
    policyId: number,
    section: string,
    page?: number,
    limit?: number,
    sort?: string,
    relationshipGroup?: string,
    claimStatus?: string,
    effectiveFrom?: string,
    effectiveTo?: string,
    searchBy?: string,
    search?: string,
    iirmPolicyId?: string,
    insurerEndorsementNumber?: string,
    insurerEndorsementDate?: string,
    tpaId?: string,
    status?: string,
    endorsementId?: string,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyById",
          payload: { policyId, section },
          messageData: "method invoked",
        }),
      });
      let policy;
      switch (section) {
        case "basicDetails":
          policy = await this.policyRepository.getPolicyBasicDetailsById(
            policyId,
          );
          break;

        case "policyDetails":
          policy = await this.policyRepository.getPolicyDetailedSectionById(
            policyId,
          );
          break;

        case "contactDetails":
          policy = await this.policyRepository.getPolicyContactDetailsById(
            policyId,
          );
          break;

        case "cdDetails":
          policy = await this.policyRepository.getPolicyCdDetailsById(policyId);
          break;

        case "installmentDetails":
          policy = await this.policyRepository.getPolicyInstallmentDetailsById(
            policyId,
            page || DEFAULT_VALUES.PAGE,
            limit || DEFAULT_VALUES.LIMIT,
            sort,
          );
          break;

        case "employeeInsured": {
          const {
            relationshipGroup: effectiveRelationshipGroup,
            claimStatus: effectiveClaimStatus,
            effectiveFrom: effectiveEffectiveFrom,
            effectiveTo: effectiveEffectiveTo,
            searchBy: effectiveSearchBy,
            employeeId: effectiveEmployeeId,
            iirmPolicyId: effectiveIirmPolicyId,
            insurerEndorsementNumber: effectiveInsurerEndorsementNumber,
            insurerEndorsementDate: effectiveInsurerEndorsementDate,
            tpaId: effectiveTpaId,
            status: effectiveStatus,
            endorsementId: effectiveEndorsementId,
          } = resolveEmployeeInsuredSearchParams({
            relationshipGroup,
            claimStatus,
            effectiveFrom,
            effectiveTo,
            searchBy,
            search,
            iirmPolicyId,
            insurerEndorsementNumber,
            insurerEndorsementDate,
            tpaId,
            status,
            endorsementId,
          });

          const sortParams = sort
            ? sort
                .split(",")
                .map((item) => {
                  const [rawKey, rawOrder] = item.trim().split(":");
                  const field = rawKey.trim();
                  const order = (rawOrder || "ASC").trim().toUpperCase() as
                    | "ASC"
                    | "DESC";
                  return { field, order };
                })
                .filter(({ field }) => Boolean(field))
            : [];

          const parsedEndorsementId = effectiveEndorsementId
            ? Number(effectiveEndorsementId)
            : undefined;
          if (effectiveEndorsementId && Number.isNaN(parsedEndorsementId)) {
            policy = EMPLOYEE_INSURED_EMPTY_RESULT;
            break;
          }

          policy =
            await this.policyRepository.getPolicyEmployeeInsuredDetailsById(
              policyId,
              page || DEFAULT_VALUES.PAGE,
              limit || DEFAULT_VALUES.LIMIT,
              effectiveRelationshipGroup,
              effectiveClaimStatus,
              effectiveEffectiveFrom,
              effectiveEffectiveTo,
              effectiveSearchBy,
              effectiveEmployeeId,
              effectiveIirmPolicyId,
              effectiveInsurerEndorsementNumber,
              effectiveInsurerEndorsementDate,
              effectiveTpaId,
              effectiveStatus,
              sortParams,
              parsedEndorsementId,
            );
          break;
        }

        case "coversMeta":
          policy = await this.getPolicyCoversMetaById(policyId);
          break;

        case "coversData":
          policy = await this.getPolicyCoversDataById(policyId);
          break;

        case "linkedPolicies":
          policy = await this.policyRepository.getLinkedPoliciesByPolicyId(
            policyId,
          );
          break;

        case "endorsement":
          policy = await this.policyRepository.getEndorsementDetailsByPolicyId(
            policyId,
          );
          break;

        case "supportTickets":
          policy = await this.policyRepository.getSupportTicketsByPolicyId(
            policyId,
          );
          break;

        case "policyDefinitions":
          policy = await this.policyRepository.getPolicyDefinitionByPolicyId(
            policyId,
          );
          break;

        case "documents":
          policy = await this.policyRepository.getPolicyDocumentsByPolicyId(
            policyId,
          );
          break;

        case "financialInfo":
          policy = await this.policyRepository.getPolicyFinancialDetailsById(
            policyId,
          );
          break;

        case "premiumReceipts":
          policy = await this.policyRepository.getPolicyPremiumReceipts(policyId, search, sort);
          break;

        case "commissionStatements":
          policy = await this.policyRepository.getPolicyCommissionStatements(policyId, search, sort);
          break;

        case "invoices":
          policy = await this.policyRepository.getPolicyInvoices(policyId, search, sort);
          break;

        case "collections":
          policy = await this.policyRepository.getPolicyCollections(policyId, search, sort);
          break;


        default:
          throw new BadRequestException(
            `Unsupported policy section: ${section}`,
          );
      }
      if (!policy) {
        throw new NotFoundException(`Policy not found for ID: ${policyId}`);
      }
      return policy;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyById",
          payload: { policyId, section },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to fetch policy.",
      );
    }
  }

  async updatePolicyById(
    policyId: number,
    payload: UpdatePolicyDTO,
    userId: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "updatePolicyById",
          messageData: "method invoked",
        }),
      });

      return await this.policyRepository.updatePolicyDetailedSectionById(
        policyId,
        payload,
        userId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "updatePolicyById",
          messageData: error,
        }),
      });

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to update policy.",
      );
    }
  }

  async inceptionCreatePolicies(policies: CreatePolicyDto[], userId: number) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyService",
        method: "inceptionCreatePolicies",
        messageData: "method invoked",
      }),
    });

    if (!Array.isArray(policies) || policies.length === 0) {
      throw new BadRequestException("No policies provided");
    }

    const results = await Promise.all(
      policies.map(async (policy) => {
        try {
          const policyData = await this.inceptionCreatePolicy(policy, userId);
          return {
            status: "success",
            data: {
              id: policyData?.id,
              policyName: policyData?.policyName,
              policyFrom: policyData?.policyFrom,
              policyTo: policyData?.policyTo,
            },
            message: successMessage.policyCreated,
          };
        } catch (err) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "PolicyService",
              method: "inceptionCreatePolicies",
              payload: { policy },
              messageData: err,
            }),
          });
          return {
            status: "failure",
            message:
              err instanceof Error
                ? err.message
                : errorMessages.policyCreationFailed,
            payload: policy,
          };
        }
      }),
    );

    return results;
  }

  async inceptionCreatePolicy(
    policyData: CreatePolicyDto,
    userId: number,
    entityManager?: EntityManager,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "inceptionCreatePolicy",
          payload: { policyData, userId },
          messageData: "method invoked",
        }),
      });

      const createPolicy = async (manager: EntityManager) => {
        await this.lookUpValidation.validateDynamicLookupValues(
          policyData,
          LOOK_UP_DATA,
        );
        await this.masterValidation.validateMasterIds(policyData, MASTER_DATA);

        const { policyTpas, policyInsurers, ...restPolicyData } = policyData;
        const policy = await this.policyRepository.inceptionCreatePolicy(
          manager,
          restPolicyData,
          userId,
        );

        if (policyTpas && policyTpas.length > 0) {
          await this.policyRepository.createPolicyTpas(
            manager,
            policy.id,
            policyTpas,
          );
        }

        if (policyInsurers && policyInsurers.length > 0) {
          await this.policyRepository.createPolicyInsurers(
            manager,
            policy.id,
            policyInsurers,
          );
        }

        return policy;
      };
      if (entityManager) {
        return await createPolicy(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(createPolicy); // Start a new transaction
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "inceptionCreatePolicy",
          payload: { policyData, userId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create policy.",
      );
    }
  }

  async getPolicySummariesByCompanyId(
    companyId: number,
  ): Promise<PolicySummaryDto[]> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicySummariesByCompanyId",
          payload: { companyId },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.getPolicySummariesByCompanyId(
        companyId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicySummariesByCompanyId",
          payload: { companyId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : errorMessages.policyNotFound,
      );
    }
  }

  async getPolicyOptionsByCompanyId(
    companyId: number,
    page: number,
    limit: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyOptionsByCompanyId",
          payload: { companyId, page, limit },
          messageData: "method invoked",
        }),
      });
      const { items, total } = await this.policyRepository.getPolicyOptionsByCompanyId(
        companyId,
        page,
        limit,
      );
      return { items, total, page, limit };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyOptionsByCompanyId",
          payload: { companyId, page, limit },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : errorMessages.policyNotFound,
      );
    }
  }

  async getPoliciesByCompanyId(
    companyId: number,
    getPoliciesDto: GetPolicyQueryDto,
    loggedInUserId?: number,
  ): Promise<{ data: any[]; count: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPoliciesByCompanyId",
          payload: { companyId },
          messageData: "method invoked",
        }),
      });

      // Client portfolio drill-down: reuse the same getAllPolicies query the
      // portfolio count is built from (so EVERY portfolio filter — policy type,
      // insurer, IIRM type, period, owner scope, etc. — is inherited), scoped to
      // this company and forced to Active. Output is remapped to the drill-down
      // table shape so its UI is unchanged. Other consumers (e.g. the company
      // detail PolicyList) don't send activeOnly and keep the original path.
      if (getPoliciesDto.activeOnly && loggedInUserId) {
        const {
          page,
          limit,
          search,
          sort,
          searchBy,
          field,
          from,
          to,
          period,
          month,
          financialYear,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          ownerId,
          viewBy,
          renewalPeriod,
          policyId,
          iirmPolicyTypeLid,
          insurerId,
          pastCompanies,
        } = getPoliciesDto;

        const result = await this.getAllPolicies(
          page || DEFAULT_VALUES.PAGE,
          limit || DEFAULT_VALUES.LIMIT,
          search || "",
          sort,
          searchBy,
          Number(loggedInUserId),
          field,
          from,
          to || null,
          period,
          month,
          financialYear,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          ownerId,
          viewBy,
          renewalPeriod,
          policyId,
          iirmPolicyTypeLid,
          insurerId,
          undefined, // businessMonth
          false, // groupByCompany
          true, // forceActive
          companyId, // scopedCompanyId
          pastCompanies, // pastCompanies
        );

        const data = (result.data || []).map((policy: any) => ({
          id: policy.policyId,
          policyName: policy.insurerPolicyNumber ?? policy.policyName ?? null,
          companyName: policy.companyName ?? null,
          contact: policy.contact ?? null,
          opportunityId: policy.opportunityId ?? null,
          policyType: policy.policyType?.lookUpValue ?? null,
          status: policy.policyStatus?.lookUpValue ?? null,
          sumInsured: policy.sumInsured ?? null,
          premium: policy.premium ?? null,
          brokerage: policy.basicBrokerageAmount ?? null,
          policyFrom: policy.policyFrom ?? null,
          policyTo: policy.policyTo ?? null,
          accountManager: policy.accountManager ?? null,
          policyNumber: policy.insurerPolicyNumber ?? null,
        }));

        return { data, count: result.count };
      }

      return await this.policyRepository.getPoliciesByCompanyId(companyId, {
        page: getPoliciesDto.page,
        limit: getPoliciesDto.limit,
        sort: getPoliciesDto.sort,
        search: getPoliciesDto.search,
        searchBy: getPoliciesDto.searchBy,
      } as GetPoliciesDto);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPoliciesByCompanyId",
          payload: { companyId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to fetch policies.",
      );
    }
  }

  async getPoliciesByOpportunityId(opportunityId: number): Promise<any[]> {
    try {
      return await this.policyRepository.getPoliciesByOpportunityId(
        opportunityId,
      );
    } catch (error) {
      console.error("Error in getPoliciesByOpportunityId:", error);
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to fetch policies.",
      );
    }
  }

  async getAllPolicies(
    // Omit both to fetch every matching row unpaginated (full exports) —
    // every listing call site passes concrete numbers, so this is additive.
    page: number | undefined,
    limit: number | undefined,
    search: string,
    sort: string,
    searchBy: string,
    loggedInUserId: number,
    field: string,
    fromDate: Date,
    toDate: Date,
    period: string,
    timeFilter?: string,
    financialYear?: number,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    ownerId?: number,
    viewBy?: string,
    renewalPeriod?: string,
    policyId?: number,
    iirmPolicyTypeLid?: number,
    insurerId?: number,
    businessMonth?: string,
    groupByCompany = false,
    forceActive = false,
    scopedCompanyId?: number,
    pastCompanies = false,
    insurerBranchId?: number,
    branchViewBy?: string,
    // Client Portfolio ENHANCED only — see the repository's recursiveTeam.
    recursiveTeam = false,
    // See PolicyRepository.getAllPolicies — skips the KPI aggregate block
    // for callers (exports) that only read `data`.
    skipKpi = false,
  ): Promise<{ data: any[]; count: number; kpiData: any }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getAllPolicies",
          payload: { page, limit, loggedInUserId },
          messageData: "method invoked",
        }),
      });
      const isLeadership = await this.scopeService.hasLeadershipRole(
        Number(loggedInUserId),
      );
      let searchParams = mapSearchParams(search);
      // insurerId is handled via a PolicyInsurerMap subquery — remove it from
      // searchParams so validateOpportunityScope doesn't try to map it as a column
      searchParams = searchParams.filter((p) => p.searchBy !== "insurerId");
      const policyIdSearchParamIndex = searchParams.findIndex(
        (param) =>
          param.searchBy === "id" &&
          Array.isArray(param.searchValue) &&
          param.searchValue.length === 1,
      );
      if (policyIdSearchParamIndex !== -1) {
        searchParams[policyIdSearchParamIndex].searchValue = String(
          searchParams[policyIdSearchParamIndex].searchValue[0],
        );
      }
      const expiryFromParam = searchParams.find(
        (param) => param.searchBy === "policyExpiryFromDate",
      );
      const expiryToParam = searchParams.find(
        (param) => param.searchBy === "policyExpiryToDate",
      );
      let policyExpiryFromDate: Date | undefined;
      let policyExpiryToDate: Date | undefined;
      if (expiryFromParam) {
        const val = expiryFromParam.searchValue;
        policyExpiryFromDate = Array.isArray(val)
          ? (val[0] as Date)
          : (val as Date);
      }
      if (expiryToParam) {
        const val = expiryToParam.searchValue;
        policyExpiryToDate = Array.isArray(val)
          ? (val[0] as Date)
          : (val as Date);
      }
      searchParams = searchParams.filter(
        (param) =>
          param.searchBy !== "policyExpiryFromDate" &&
          param.searchBy !== "policyExpiryToDate",
      );

      // Extract and resolve iirmPolicyType search param (passed as lookUpValue string(s))
      const iirmPolicyTypeParam = searchParams.find(
        (param) => param.searchBy === "iirmPolicyType",
      );
      searchParams = searchParams.filter(
        (param) => param.searchBy !== "iirmPolicyType",
      );
      if (iirmPolicyTypeParam) {
        const values = (
          Array.isArray(iirmPolicyTypeParam.searchValue)
            ? iirmPolicyTypeParam.searchValue
            : [iirmPolicyTypeParam.searchValue]
        ).map((v) => String(v));
        const matchedLids =
          await this.policyRepository.getPolicyTypeLidsByIirmPolicyTypeValues(
            values,
          );
        searchParams.push({
          searchBy: "policyTypeLid",
          searchValue: matchedLids.length > 0 ? matchedLids : [-1],
        });
      }
      if (searchParams.length > 0) {
        const organisationIdParam = searchParams.find(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId,
        );
        const organisationId = organisationIdParam?.searchValue ?? null;

        const orgId = organisationId?.[0] ?? null;

        const organisationIdNew =
          await this.policyRepository.getEntityTableMapIds(
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
            { id: orgId },
          );

        const lookupCriteria =
          organisationIdNew.length === 0
            ? { parentOrganisationId: orgId }
            : { id: orgId };

        const countryId = await this.policyRepository.getEntityTableMapIds(
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
          lookupCriteria,
        );

        const countryIdIndex = searchParams.findIndex(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId,
        );

        if (countryIdIndex !== -1) {
          searchParams[countryIdIndex].searchValue = countryId;
        }
      }
      if (sbuId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.sbuId,
          searchValue: [sbuId],
        });
      }
      if (verticalId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.verticalId,
          searchValue: [verticalId],
        });
      }
      if (departmentId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.departmentId,
          searchValue: [departmentId],
        });
      }
      if (branchId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.branchId,
          searchValue: [branchId],
        });
      }
      const userId = ownerId ? ownerId : loggedInUserId;
      const shouldApplyOwnerScope = !(isLeadership && !ownerId);
      if (shouldApplyOwnerScope) {
        searchParams.push({
          searchBy: "owner.userId",
          searchValue: [userId],
        });
        if (viewBy === OWNER_TYPES.TEAM || !viewBy) {
          searchParams.push({
            searchBy: "viewByTeam",
            searchValue: OWNER_TYPES.TEAM,
          });
        } else if (viewBy === OWNER_TYPES.MANAGER) {
          searchParams.push({
            searchBy: "viewByTeam",
            searchValue: OWNER_TYPES.MANAGER,
          });
        }
      }
      if (policyId) {
        searchParams.push({
          searchBy: "id",
          searchValue: String(policyId),
        });
      }
      if (iirmPolicyTypeLid) {
        const matchedPolicyTypeLids =
          await this.policyRepository.getPolicyTypeLidsByIirmPolicyTypeLid(
            iirmPolicyTypeLid,
          );
        if (matchedPolicyTypeLids.length > 0) {
          searchParams.push({
            searchBy: "policyTypeLid",
            searchValue: matchedPolicyTypeLids,
          });
        } else {
          // No matching policy types — return empty result
          searchParams.push({
            searchBy: "policyTypeLid",
            searchValue: [-1],
          });
        }
      }
      // Client Portfolio's company-grain aggregate columns (policyPremium,
      // roPremium, soPremium, roBrokerage, claimAmount) have no per-policy
      // relation path, so ENTITY_SORT_FIELDS.POLICY has no entry for them
      // and mapSortParams silently drops them -- they're already computed
      // in-memory by aggregateActiveCompaniesByPolicies and looked up via
      // PORTFOLIO_COMPANY_SORT_FIELD_MAP there. Bypass the translation for
      // just these keys, company-grain mode only, using the raw (untranslated)
      // field name mapSortParams would otherwise have discarded.
      const [rawSortKey, rawSortOrder] =
        sort?.split(",")[0]?.trim().split(":") ?? [];
      const sortParams =
        groupByCompany && PORTFOLIO_COMPANY_AGGREGATE_SORT_KEYS.has(rawSortKey?.trim())
          ? [
              {
                field: rawSortKey.trim(),
                order: (
                  (rawSortOrder || "ASC").trim().toUpperCase() === "DESC"
                    ? "DESC"
                    : "ASC"
                ) as "ASC" | "DESC",
              },
            ]
          : mapSortParams(sort, ENTITY_NAME.POLICY.toUpperCase());
      // Resolve insurer-branch filter: just the selected branch, or the branch
      // plus its descendant sub-branches when branchViewBy === "branchWithSub".
      const insurerBranchIds = await this.policyReportService.resolveInsurerBranchIds(
        insurerBranchId,
        branchViewBy,
      );
      const policies = await this.policyRepository.getAllPolicies(
        page,
        limit,
        searchParams,
        sortParams,
        searchBy,
        userId,
        field,
        fromDate,
        toDate,
        period,
        timeFilter,
        financialYear,
        renewalPeriod,
        policyExpiryFromDate,
        policyExpiryToDate,
        insurerId,
        businessMonth,
        groupByCompany,
        forceActive,
        scopedCompanyId,
        pastCompanies,
        insurerBranchIds,
        recursiveTeam,
        skipKpi,
      );
      return policies;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getAllPolicies",
          payload: { page, limit, loggedInUserId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to fetch policies.",
      );
    }
  }

  /**
   * Full (non-paginated) export of the /policy/policies listing for the given
   * filters — reuses getAllPolicies' own search/scope/date-filter parsing
   * instead of re-deriving any of it. Returns the raw S3 key (not a
   * pre-signed URL) — the async export path keeps the key as-is, same
   * convention as the BizDone export.
   */
  async getPolicyListReportExcel(
    search: string,
    sort: string,
    searchBy: string,
    loggedInUserId: number,
    field: string,
    fromDate: any,
    toDate: any,
    period: string,
    timeFilter: string | undefined,
    financialYear: number | undefined,
    sbuId: number | undefined,
    verticalId: number | undefined,
    departmentId: number | undefined,
    branchId: number | undefined,
    ownerId: number | undefined,
    viewBy: string | undefined,
    renewalPeriod: string | undefined,
    policyId: number | undefined,
    iirmPolicyTypeLid: number | undefined,
    insurerId: number | undefined,
    businessMonth: string | undefined,
    insurerBranchId: number | undefined,
    branchViewBy: string | undefined,
    appliedFiltersRows?: { filter: string; value: string }[],
    columns?: { key: string; label: string }[],
  ): Promise<string> {
    // Omitting page/limit fetches every matching row unpaginated in one call
    // — mirrors how the BizDone export never pages its report query.
    // skipKpi=true: an export never reads count/kpiData, and computing them
    // costs a full second validateOpportunityScope call (its own WHERE/date
    // resolution + query over every matching row) plus a
    // getPolicyConfigurationCount query with one id per matching policy —
    // the dominant cost, well beyond the join/relations overhead.
    // Temporary phase timers to see where the export's wall-clock time goes
    // beyond what pg_stat_statements can show (DB round trip vs. TypeORM
    // hydration/transform/Excel-write/upload, all invisible to the DB).
    const fetchStart = Date.now();
    const full = await this.getAllPolicies(
      undefined, undefined, search, sort, searchBy, loggedInUserId, field, fromDate, toDate,
      period, timeFilter, financialYear, sbuId, verticalId, departmentId,
      branchId, ownerId, viewBy, renewalPeriod, policyId, iirmPolicyTypeLid,
      insurerId, businessMonth, false, false, undefined, false,
      insurerBranchId, branchViewBy, false, true,
    );
    const fetchMs = Date.now() - fetchStart;
    const rows = full.data?.length
      ? full.data
      : [{ Message: "No records found for the selected filters" }];
    const excelStart = Date.now();
    const buffer = await generateExcelWithAppliedFilters(
      rows as any[],
      appliedFiltersRows?.length
        ? appliedFiltersRows
        : [{ filter: "Filters", value: "None (all records)" }],
      "Filtered Data",
      columns,
    );
    const excelMs = Date.now() - excelStart;
    const key = `uploads/policy/reports/${loggedInUserId}/Policy_List_Report_${Date.now()}.xlsx`;
    const uploadStart = Date.now();
    await uploadToS3(
      buffer,
      key,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const uploadMs = Date.now() - uploadStart;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "getPolicyListReportExcel",
        payload: { rowCount: rows.length, fetchMs, excelMs, uploadMs },
        messageData: "export phase timings",
      }),
    });
    return key;
  }

  /**
   * Replays a stored /policy/policies listing query through the exact same
   * generation path getPolicyListReportExcel uses, so the async export
   * output matches what the equivalent synchronous listing call would show.
   * Mirrors OpportunityService.generateSalesOpportunityExcelFromQuery.
   */
  async generatePolicyListExcelFromQuery(
    query: Record<string, any>,
    loggedInUserId: number,
  ): Promise<string> {
    const search = typeof query?.search === "string" ? query.search : "";
    const appliedFiltersRows = ReportExportJob.parseReportAppliedFilters(
      query?.appliedFilters,
    );
    const columns = ReportExportJob.parseReportColumns(query?.columns);
    return this.getPolicyListReportExcel(
      search,
      query?.sort,
      query?.searchBy,
      loggedInUserId,
      query?.field,
      query?.from ?? null,
      query?.to ?? null,
      query?.period,
      query?.month,
      query?.financialYear !== undefined ? Number(query.financialYear) : undefined,
      query?.sbuId !== undefined ? Number(query.sbuId) : undefined,
      query?.verticalId !== undefined ? Number(query.verticalId) : undefined,
      query?.departmentId !== undefined ? Number(query.departmentId) : undefined,
      query?.branchId !== undefined ? Number(query.branchId) : undefined,
      query?.ownerId !== undefined ? Number(query.ownerId) : undefined,
      query?.viewBy,
      query?.renewalPeriod,
      query?.policyId !== undefined ? Number(query.policyId) : undefined,
      query?.iirmPolicyTypeLid !== undefined ? Number(query.iirmPolicyTypeLid) : undefined,
      query?.insurerId !== undefined ? Number(query.insurerId) : undefined,
      query?.businessMonth,
      query?.insurerBranchId !== undefined ? Number(query.insurerBranchId) : undefined,
      query?.branchViewBy,
      appliedFiltersRows,
      columns,
    );
  }

  /**
   * Enqueue an async /policy/policies listing export as a background job —
   * same enqueue/dedup/fire-and-forget-trigger mechanism as BizDone's export,
   * against the same shared `user_bizdone_report` table, discriminated by
   * UserBizdoneReportType.POLICY_LIST.
   */
  async enqueuePolicyListReportExport(
    userId: number,
    filtersApplied: Record<string, unknown>,
  ): Promise<{ jobId: number; status: string; alreadyInProgress: boolean }> {
    try {
      return await ReportExportJob.enqueueReportExportJob(
        this.dataSource,
        userId,
        UserBizdoneReportType.POLICY_LIST,
        filtersApplied,
        (filters, uid) => this.generatePolicyListExcelFromQuery(filters ?? {}, uid),
      );
    } catch (error) {
      console.error("Error in enqueuePolicyListReportExport:", error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to queue report export.",
      );
    }
  }

  /**
   * Recent exports for the requesting user, scoped to POLICY_LIST only — the
   * policy listing page's Downloads panel must not show BizDone (or any
   * other module's) exports even though they share the same table.
   */
  async listPolicyListReportExports(userId: number) {
    return ReportExportJob.listReportExports(this.dataSource, userId, [
      UserBizdoneReportType.POLICY_LIST,
    ]);
  }

  async getPortfolioCompanies(
    page: number,
    limit: number,
    search: string,
    sort: string,
    searchBy: string,
    loggedInUserId: number,
    field: string,
    fromDate: Date,
    toDate: Date,
    period: string,
    timeFilter?: string,
    financialYear?: number,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    ownerId?: number,
    viewBy?: string,
    renewalPeriod?: string,
    policyId?: number,
    iirmPolicyTypeLid?: number,
    insurerId?: number,
    pastCompanies = false,
    serviceScore?: string,
    // Client Portfolio ENHANCED only — see getAllPolicies' recursiveTeam.
    recursiveTeam = false,
  ): Promise<{ data: any[]; count: number; kpiData: any }> {
    const policies = await this.getAllPolicies(
      page,
      limit,
      search,
      sort,
      searchBy,
      loggedInUserId,
      field,
      fromDate,
      toDate,
      period,
      timeFilter,
      financialYear,
      sbuId,
      verticalId,
      departmentId,
      branchId,
      ownerId,
      viewBy,
      renewalPeriod,
      policyId,
      iirmPolicyTypeLid,
      insurerId,
      undefined, // businessMonth — not applicable for portfolio view
      true, // groupByCompany
      false, // forceActive
      undefined, // scopedCompanyId
      pastCompanies,
      undefined, // insurerBranchId — not forwarded for the portfolio view
      undefined, // branchViewBy — likewise
      recursiveTeam,
    );

    if (!policies?.data?.length) {
      return policies;
    }

    try {
      const searchParams = mapSearchParams(search);
      const organisationIdParam = searchParams.find(
        (p) =>
          p.searchBy === "owner.organisationId" ||
          p.searchBy === "organisationId",
      );
      const scopedOrganisationId = organisationIdParam
        ? Number(
            Array.isArray(organisationIdParam.searchValue)
              ? organisationIdParam.searchValue[0]
              : organisationIdParam.searchValue,
          )
        : undefined;

      const companyIds = Array.from(
        new Set(
          policies.data
            .map((row: any) => Number(row.companyId))
            .filter((id: number) => Number.isFinite(id) && id > 0),
        ),
      );

      const { from: serviceScoreFrom, to: serviceScoreTo } =
        this.resolveSmartSearchDateRange({
          timeFilter,
          financialYear,
          period,
          fromDate,
          toDate,
        });

      const summaryByCompanyId =
        await this.serviceTatService.getSummaryDetailsForCompanies(
          loggedInUserId,
          {
            companyIds,
            organisationId: scopedOrganisationId,
            financialYear,
            from: serviceScoreFrom,
            to: serviceScoreTo,
          },
        );

      policies.data = policies.data.map((row: any) => ({
        ...row,
        serviceScoreSummary:
          summaryByCompanyId.get(Number(row.companyId)) ?? null,
      }));

      if (serviceScore) {
        const match = serviceScore.match(/^([<>])(\d+(?:\.\d+)?)$/);
        const threshold = match
          ? { op: match[1] as "<" | ">", value: Number(match[2]) }
          : null;
        if (threshold) {
          policies.data = policies.data.filter((row: any) => {
            const score = row?.serviceScoreSummary?.totalServiceScore;
            if (typeof score !== "number") return false;
            return threshold.op === ">"
              ? score > threshold.value
              : score < threshold.value;
          });
        }
      }
    } catch (error) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPortfolioCompanies",
          payload: { page, limit, loggedInUserId },
          messageData: `Service Score enrichment failed, listing will show scores as null: ${
            error instanceof Error ? error.message : error
          }`,
        }),
      });
    }

    return policies;
  }

  async getServiceScoreChart(
    loggedInUserId: number,
    companyId: number,
    params: {
      financialYear?: number;
      quarter?: string;
      month?: string;
      from?: Date;
      to?: Date;
    }
  ): Promise<{ companyId: number; xAxis: string[]; yAxis: number[] }> {
    const { financialYear, quarter, month, from: fromDate, to: toDate } = params;
    const { from, to } = this.resolveSmartSearchDateRange({
      timeFilter: month || quarter,
      financialYear,
      fromDate,
      toDate,
    });
    return this.serviceTatService.getServiceScoreChartData(loggedInUserId, {
      companyId,
      financialYear,
      from,
      to,
    });
  }

  private resolveSmartSearchDateRange(params: {
    timeFilter?: string;
    financialYear?: number;
    period?: string;
    fromDate?: Date;
    toDate?: Date;
  }): { from?: Date; to?: Date } {
    const { timeFilter, financialYear, period, fromDate, toDate } = params;
    let from: Date | undefined;
    let to: Date | undefined;
    if (timeFilter || financialYear !== undefined) {
      const range = getDateRangeWithoutTimestamp(timeFilter, financialYear);
      from = range.start;
      to = range.end;
    } else if (period) {
      try {
        const fromToDate = getDurationDates(period);
        from = fromToDate.startDate;
        to = fromToDate.endDate;
      } catch {
        // fall through to fromDate/toDate below
      }
    }
    if ((!from || !to) && (fromDate || toDate)) {
      from = fromDate;
      to = toDate;
    }
    return { from, to };
  }

  // Template ids (= OpportunityCoverMap.id) hidden on the policy because their
  // "show until activity" cutoff is before Placement Slip (policy = post-PSG
  // mirror). Fail open: ids with no matching cover row are never hidden.
  private async getCoverTemplateIdsHiddenOnPolicy(
    templateIds: number[]
  ): Promise<Set<number>> {
    const ids = templateIds.filter((id) => Number.isInteger(id) && id > 0);
    if (!ids.length) return new Set();
    const rows = await this.dataSource.getRepository(OpportunityCoverMap).find({
      where: { id: In(ids) },
      select: ["id", "visibleUntilActivityKey"],
    });
    const visible = new Set(
      filterCoversByActivity(
        rows,
        ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY
      ).map((r) => r.id)
    );
    return new Set(rows.filter((r) => !visible.has(r.id)).map((r) => r.id));
  }

  async getPolicyCoversMetaById(policyId: number): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyCoversMetaById",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });
      const relations = ["policyStatus", "coverMappings"];
      const policy = await this.policyRepository.findOnePolicy(
        policyId,
        relations,
      );

      if (!policy) {
        throw new NotFoundException(
          `Policy Basic Details not found for ID: ${policyId}`,
        );
      }

      const sectionHeading = "Combined Coverage Details",
        sectionSubHeading = "Details of all combined coverage options";
      const coverMappings = policy.coverMappings ?? [];
      const coverTemplateIds = Array.from(
        new Set(
          coverMappings
            .map((cover: any) => Number(cover?.coverTemplateId))
            .filter((id: number) => Number.isInteger(id) && id > 0)
        )
      );
      let fallbackSectionByTemplateId = new Map<number, number>();
      let coverOrderByTemplateId = new Map<number, number>();
      let mandatoryByTemplateId = new Map<number, string>();

      if (coverTemplateIds.length > 0) {
        const opportunityCoverRows = await this.dataSource
          .getRepository(OpportunityCoverMap)
          .find({
            where: {
              id: In(coverTemplateIds),
              policyTypeId: policy.policyTypeLid,
            },
            select: ["id", "coverId", "sectionId", "displaySequence"],
          });
        const templateRows = await this.dataSource
          .getRepository(MstrCoverTemplate)
          .find({
            where: [
              {
                policyTypeId: policy.policyTypeLid,
                id: In(coverTemplateIds),
              },
              {
                policyTypeId: policy.policyTypeLid,
                refCoverId: In(coverTemplateIds),
              },
            ],
            select: ["id", "refCoverId", "sectionId", "displaySequence"],
          });

        const fromOpportunityCover = opportunityCoverRows.reduce((acc, cover) => {
          if (Number.isInteger(cover.id) && Number.isInteger(cover.sectionId)) {
            acc.set(Number(cover.id), Number(cover.sectionId));
          }
          if (
            Number.isInteger(cover.id) &&
            Number.isInteger(cover.displaySequence)
          ) {
            coverOrderByTemplateId.set(
              Number(cover.id),
              Number(cover.displaySequence),
            );
          }
          return acc;
        }, new Map<number, number>());

        fallbackSectionByTemplateId = templateRows.reduce((acc, template) => {
            if (Number.isInteger(template.sectionId)) {
              if (Number.isInteger(template.id)) {
                if (!acc.has(Number(template.id))) {
                  acc.set(Number(template.id), Number(template.sectionId));
                }
                if (
                  !coverOrderByTemplateId.has(Number(template.id)) &&
                  Number.isInteger(template.displaySequence)
                ) {
                  coverOrderByTemplateId.set(
                    Number(template.id),
                    Number(template.displaySequence),
                  );
                }
              }
              if (Number.isInteger(template.refCoverId)) {
                const refId = Number(template.refCoverId);
                if (!acc.has(refId)) {
                  acc.set(refId, Number(template.sectionId));
                }
                if (
                  !coverOrderByTemplateId.has(refId) &&
                  Number.isInteger(template.displaySequence)
                ) {
                  coverOrderByTemplateId.set(
                    refId,
                    Number(template.displaySequence),
                  );
                }
              }
            }
            return acc;
          },
          fromOpportunityCover
        );

        // Build mandatoryByTemplateId:
        // PolicyCoverMap.coverTemplateId = OpportunityCoverMap.id
        // OpportunityCoverMap.coverId = MstrCover.id = MstrCoverTemplate.refCoverId
        // So the chain is: coverTemplateId (OpportunityCoverMap.id) → coverId → MstrCoverTemplate.mandatory
        const mstrCoverIds = Array.from(new Set(
          opportunityCoverRows
            .map((cover: any) => Number(cover?.coverId))
            .filter((id: number) => Number.isInteger(id) && id > 0)
        ));

        if (mstrCoverIds.length > 0) {
          const mandatoryTemplateRows = await this.dataSource
            .getRepository(MstrCoverTemplate)
            .find({
              where: {
                refCoverId: In(mstrCoverIds),
                policyTypeId: policy.policyTypeLid,
              },
              select: ["refCoverId", "mandatory"],
            });

          const mandatoryByCoverId = new Map<number, string>();
          for (const tmpl of mandatoryTemplateRows) {
            if (Number.isInteger(tmpl.refCoverId)) {
              const coverId = Number(tmpl.refCoverId);
              if (!mandatoryByCoverId.has(coverId)) {
                mandatoryByCoverId.set(coverId, tmpl.mandatory ?? "Yes");
              }
            }
          }

          for (const ocover of opportunityCoverRows) {
            const oppCoverId = Number((ocover as any).id);
            const coverId = Number((ocover as any).coverId);
            if (Number.isInteger(oppCoverId) && Number.isInteger(coverId)) {
              const mandatoryVal = mandatoryByCoverId.get(coverId);
              if (mandatoryVal !== undefined && !mandatoryByTemplateId.has(oppCoverId)) {
                mandatoryByTemplateId.set(oppCoverId, mandatoryVal);
              }
            }
          }
        }
      }

      const hiddenTemplateIds = await this.getCoverTemplateIdsHiddenOnPolicy(
        coverMappings.map((c: any) => Number(c?.coverTemplateId))
      );
      const visibleCoverMappings = coverMappings.filter(
        (cover: any) => !hiddenTemplateIds.has(Number(cover?.coverTemplateId))
      );

      const coverMappingsWithResolvedSection = visibleCoverMappings.map((cover: any) => {
        const coverTemplateId = Number(cover?.coverTemplateId);
        const resolvedSectionId = fallbackSectionByTemplateId.get(
          coverTemplateId
        );
        const resolvedDisplaySequence = coverOrderByTemplateId.get(coverTemplateId);
        return {
          ...cover,
          // Use deterministic sources only for API grouping.
          // This avoids stale/manual section_id values on policy_cover_map
          // from incorrectly forcing a section bucket.
          sectionId: Number.isInteger(resolvedSectionId)
            ? Number(resolvedSectionId)
            : null,
          displaySequence: Number.isInteger(resolvedDisplaySequence)
            ? Number(resolvedDisplaySequence)
            : null,
        };
      });

      coverMappingsWithResolvedSection.sort((coverA: any, coverB: any) => {
        const sequenceA = Number.isInteger(coverA?.displaySequence)
          ? Number(coverA.displaySequence)
          : Number.MAX_SAFE_INTEGER;
        const sequenceB = Number.isInteger(coverB?.displaySequence)
          ? Number(coverB.displaySequence)
          : Number.MAX_SAFE_INTEGER;

        if (sequenceA !== sequenceB) {
          return sequenceA - sequenceB;
        }

        const idA = Number(coverA?.coverTemplateId);
        const idB = Number(coverB?.coverTemplateId);
        if (Number.isInteger(idA) && Number.isInteger(idB) && idA !== idB) {
          return idA - idB;
        }

        return 0;
      });

      const formConfig = coverMappingsWithResolvedSection.flatMap((cover: any) => {
        const coverTemplateId = Number(cover?.coverTemplateId);
        const mandateType = mandatoryByTemplateId.get(coverTemplateId);
        const rawMeta = cover.coversMeta;
        let reconciledFormConfig: any[];
        if (mandateType !== undefined && Array.isArray(rawMeta?.formConfig)) {
          const isMandatory = String(mandateType).trim().toLowerCase() === "yes";
          reconciledFormConfig = rawMeta.formConfig.map((field: any) => {
            const rules = { ...(field?.rules ?? {}) };
            if (isMandatory) {
              rules.required = rules.required ?? {
                value: "true",
                message: "This is required field",
              };
            } else {
              delete rules.required;
            }
            return { ...field, rules };
          });
        } else {
          reconciledFormConfig = rawMeta?.formConfig || [];
        }
        return reconciledFormConfig.map((config: any) => ({
          ...config,
          id: String(cover.coverTemplateId),
          key: String(cover.coverTemplateId),
          name: String(cover.coverTemplateId),
        }));
      });

      const defaultcoverValues = coverMappingsWithResolvedSection.reduce(
        (acc, cover) => ({
          ...acc,
          ...(cover.coversMeta?.defaultValues ?? {}),
        }),
        {},
      );

      // Extract section IDs from cover mappings
      const sectionIds = Array.from(
        new Set(
          coverMappingsWithResolvedSection
            .map((cover: any) => cover?.sectionId)
            .filter((sectionId: any) => Number.isInteger(sectionId))
        )
      ) as number[];

      let sectionMap = new Map<
        number,
        { id: number; name: string; key: string; displaySequence: number }
      >();

      if (sectionIds.length > 0) {
        const sections = await this.dataSource.getRepository(MstrCoverSection).find({
          where: { id: In(sectionIds), isActive: true },
          select: ["id", "name", "key", "displaySequence"],
          order: { displaySequence: "ASC", id: "ASC" },
        });

        sectionMap = new Map(sections.map((section) => [section.id, section]));
      }

      const getFieldIdentifiers = (field: any): string[] => {
        const values = [field?.id, field?.key, field?.name];
        return Array.from(
          new Set(
            values
              .filter(
                (value) => value !== null && value !== undefined && value !== ""
              )
              .map((value) => String(value))
          )
        );
      };

      const fieldToSection = new Map<
        string,
        { sectionId: number; sectionName: string; sectionKey: string }
      >();

      coverMappingsWithResolvedSection.forEach((cover: any) => {
        if (!Number.isInteger(cover?.sectionId)) {
          return;
        }

        const section = sectionMap.get(cover.sectionId);
        if (!section) {
          return;
        }

        const normalizedCoverFields = (cover.coversMeta?.formConfig || []).map(
          (config: any) => ({
            ...config,
            id: String(cover.coverTemplateId),
            key: String(cover.coverTemplateId),
            name: String(cover.coverTemplateId),
          })
        );

        normalizedCoverFields.forEach((field: any) => {
          getFieldIdentifiers(field).forEach((identifier) => {
            if (!fieldToSection.has(identifier)) {
              fieldToSection.set(identifier, {
                sectionId: section.id,
                sectionName: section.name,
                sectionKey: section.key,
              });
            }
          });
        });
      });

      const sectionRenderPlan: {
        blocks: Array<
          | {
              type: "section";
              sectionId: number;
              sectionName: string;
              sectionKey: string;
              fields: any[];
            }
          | { type: "unmapped"; fields: any[] }
        >;
      } = {
        blocks: [],
      };

      formConfig.forEach((field: any) => {
        const mappedSection = getFieldIdentifiers(field)
          .map((identifier) => fieldToSection.get(identifier))
          .find(Boolean);
        const previousBlock =
          sectionRenderPlan.blocks[sectionRenderPlan.blocks.length - 1];

        if (!mappedSection) {
          if (previousBlock?.type === "unmapped") {
            previousBlock.fields.push(field);
            return;
          }

          sectionRenderPlan.blocks.push({
            type: "unmapped",
            fields: [field],
          });
          return;
        }

        const canAppendToPreviousSection =
          previousBlock?.type === "section" &&
          previousBlock.sectionId === mappedSection.sectionId;

        if (canAppendToPreviousSection) {
          previousBlock.fields.push(field);
          return;
        }

        sectionRenderPlan.blocks.push({
          type: "section",
          sectionId: mappedSection.sectionId,
          sectionName: mappedSection.sectionName,
          sectionKey: mappedSection.sectionKey,
          fields: [field],
        });
      });

      const result = {
        formConfig,
        sectionRenderPlan,
        isMultiple: false,
        defaultcoverValues,
        sectionHeading: sectionHeading,
        sectionSubHeading: sectionSubHeading,
      };
      return {
        id: policy?.id ?? null,
        companyId: policy?.companyId ?? null,
        result: result,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyCoversMetaById",
          payload: { policyId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        `Failed to fetch policy covers meta details: ${error.message}`,
      );
    }
  }

  async getPolicyCoversDataById(policyId: number): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyCoversDataById",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });
      const relations = ["policyStatus", "coverMappings"];
      const policy = await this.policyRepository.findOnePolicy(
        policyId,
        relations,
      );

      if (!policy) {
        throw new NotFoundException(
          `Policy Basic Details not found for ID: ${policyId}`,
        );
      }
      const coverDetails: Record<number, string> = {};
      const coverMappings = policy.coverMappings ?? [];

      // Policy is the post-PSG mirror: drop covers cut off before Placement Slip.
      const hiddenIds = await this.getCoverTemplateIdsHiddenOnPolicy(
        coverMappings.map((c: any) => Number(c?.coverTemplateId ?? c?.coverMapId))
      );

      coverMappings.forEach((cover: any) => {
        const id = cover.coverTemplateId ?? cover.coverMapId;
        const response = cover.coverResponse ?? cover.insurerCoverResponse;
        if (hiddenIds.has(Number(id))) return;
        if (id !== undefined && response !== undefined) {
          coverDetails[id] = response;
        }
      });

      return {
        id: policy?.id ?? null,
        companyId: policy?.companyId ?? null,
        covers: coverDetails,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyCoversDataById",
          payload: { policyId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        `Failed to fetch policy covers data details: ${error.message}`,
      );
    }
  }

  async updatePolicyCover(
    policyId: number,
    dto: UpdatePolicyCoverDto,
    userId?: number,
  ) {
    const coverEntries = Object.entries(dto.covers || {});
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "updatePolicyCover",
          payload: {
            policyId,
            coverTemplateIds: coverEntries.map(([templateId]) => templateId),
          },
          messageData: "method invoked",
        }),
      });

      if (!coverEntries.length) {
        throw new BadRequestException(errorMessages.policyCoverUpdatesRequired);
      }

      // Build mandatory status lookup before validation
      // ID chain: templateId (=OpportunityCoverMap.id) → coverId → MstrCoverTemplate.mandatory
      const numericTemplateIds = coverEntries
        .map(([tid]) => Number(tid))
        .filter((id) => Number.isInteger(id) && id > 0);

      const oppCoverRowsForUpdate = numericTemplateIds.length > 0
        ? await this.dataSource.getRepository(OpportunityCoverMap).find({
            where: { id: In(numericTemplateIds) },
            select: ["id", "coverId", "policyTypeId"],
          })
        : [];

      const mstrCoverIdsForUpdate = Array.from(
        new Set(
          oppCoverRowsForUpdate
            .map((r) => Number(r.coverId))
            .filter((id) => Number.isInteger(id) && id > 0),
        ),
      );

      const mandatoryTemplateRowsForUpdate = mstrCoverIdsForUpdate.length > 0
        ? await this.dataSource.getRepository(MstrCoverTemplate).find({
            where: { refCoverId: In(mstrCoverIdsForUpdate) },
            select: ["refCoverId", "policyTypeId", "mandatory"],
          })
        : [];

      const mandatoryByCoverAndType = new Map<string, string>();
      for (const tmpl of mandatoryTemplateRowsForUpdate) {
        const key = `${tmpl.refCoverId}_${tmpl.policyTypeId}`;
        if (!mandatoryByCoverAndType.has(key)) {
          mandatoryByCoverAndType.set(key, tmpl.mandatory ?? "Yes");
        }
      }

      const mandatoryByTemplateIdForUpdate = new Map<number, string>();
      for (const ocover of oppCoverRowsForUpdate) {
        const coverId = Number(ocover.coverId);
        const policyTypeId = Number(ocover.policyTypeId);
        const oppCovId = Number(ocover.id);
        if (Number.isInteger(coverId) && Number.isInteger(policyTypeId)) {
          const key = `${coverId}_${policyTypeId}`;
          const mandatory = mandatoryByCoverAndType.get(key) ?? "Yes";
          mandatoryByTemplateIdForUpdate.set(oppCovId, mandatory);
        }
      }

      for (const [templateId, coverResponse] of coverEntries) {
        const numericTemplateId = Number(templateId);
        if (!Number.isInteger(numericTemplateId) || numericTemplateId <= 0) {
          throw new BadRequestException(
            errorMessages.invalidPolicyCoverTemplateId(templateId),
          );
        }

        if (
          coverResponse === null ||
          coverResponse === undefined ||
          (typeof coverResponse === "string" && coverResponse.trim() === "")
        ) {
          const mandatory =
            mandatoryByTemplateIdForUpdate.get(numericTemplateId) ?? "Yes";
          if (String(mandatory).trim().toLowerCase() === "yes") {
            throw new BadRequestException(
              errorMessages.invalidPolicyCoverResponse(templateId),
            );
          }
        }
      }

      await this.policyRepository.updatePolicyCover(policyId, dto, userId);

      return await this.getPolicyCoversDataById(policyId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "updatePolicyCover",
          payload: {
            policyId,
            coverTemplateIds: coverEntries.map(([templateId]) => templateId),
          },
          messageData: error,
        }),
      });
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.policyCoverUpdateFailed,
      );
    }
  }

  private withOverriddenSectionComments(
    statuses: PolicySectionStatuses,
    section: PolicySectionIdentifier,
    comments?: string | null,
  ): PolicySectionStatuses {
    if (comments === undefined) {
      return statuses;
    }

    const sectionStatus = statuses.sections?.[section];
    if (!sectionStatus) {
      return statuses;
    }

    return {
      ...statuses,
      sections: {
        ...statuses.sections,
        [section]: {
          ...sectionStatus,
          comments: comments ?? null,
        },
      },
    };
  }

  async submitPolicySection(
    policyId: number,
    dto: PolicySectionSubmissionDto,
    userId: number,
  ): Promise<PolicySectionStatuses> {
    if (!Number.isFinite(userId)) {
      throw new BadRequestException(errorMessages.policyApprovalUserIdRequired);
    }

    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "submitPolicySection",
          payload: { policyId, section: dto.section },
          messageData: "method invoked",
        }),
      });

      await this.policyRepository.updatePolicySectionStatus(
        policyId,
        dto.section,
        POLICY_SECTION_APPROVAL_STATUS_VALUE.SUBMITTED,
        userId,
        dto.comments,
      );

      const approver = await this.policyRepository.getParentUserWithPrivilege(
        userId,
        ACL_CATEGORY.POLICY,
        ACL_ACTIONS.APPROVE_POLICY_CHANGES,
      );

      const approverId = Number(approver?.userId);
      if (!Number.isFinite(approverId)) {
        throw new NotFoundException(
          `No approver found with the required privilege for policy section ${dto.section}`,
        );
      }

      await this.policyRepository.createPolicySectionApprovalTask(
        policyId,
        dto.section,
        approverId,
        userId,
      );

      const refreshedStatuses =
        await this.policyRepository.getPolicySectionStatuses(policyId);

      return this.withOverriddenSectionComments(
        refreshedStatuses,
        dto.section,
        dto.comments,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "submitPolicySection",
          payload: { policyId, section: dto.section },
          messageData: error,
        }),
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? `${errorMessages.policyApprovalStatusUpdateFailed}: ${error.message}`
          : errorMessages.policyApprovalStatusUpdateFailed,
      );
    }
  }

  async approvePolicySection(
    policyId: number,
    dto: PolicySectionApprovalDto,
    userId: number,
  ): Promise<PolicySectionStatuses> {
    if (!Number.isFinite(userId)) {
      throw new BadRequestException(errorMessages.policyApprovalUserIdRequired);
    }

    if (
      dto.status === POLICY_SECTION_APPROVAL_DECISION_STATUS.REJECTED &&
      (!dto.comments || dto.comments.trim().length === 0)
    ) {
      throw new BadRequestException(
        errorMessages.policyApprovalCommentsRequired,
      );
    }

    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "approvePolicySection",
          payload: { policyId, section: dto.section, status: dto.status },
          messageData: "method invoked",
        }),
      });

      await this.policyRepository.updatePolicySectionStatus(
        policyId,
        dto.section,
        dto.status,
        userId,
        dto.comments,
      );

      if (dto.status === POLICY_SECTION_APPROVAL_DECISION_STATUS.APPROVED) {
        await this.policyRepository.completePolicySectionApprovalTask(
          policyId,
          dto.section,
          userId,
        );
      }

      const refreshedStatuses =
        await this.policyRepository.getPolicySectionStatuses(policyId);

      return this.withOverriddenSectionComments(
        refreshedStatuses,
        dto.section,
        dto.comments,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "approvePolicySection",
          payload: { policyId, section: dto.section, status: dto.status },
          messageData: error,
        }),
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? `${errorMessages.policyApprovalStatusUpdateFailed}: ${error.message}`
          : errorMessages.policyApprovalStatusUpdateFailed,
      );
    }
  }

  async getPolicySectionStatuses(
    policyId: number,
  ): Promise<PolicySectionStatuses> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicySectionStatuses",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });

      return await this.policyRepository.getPolicySectionStatuses(policyId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicySectionStatuses",
          payload: { policyId },
          messageData: error,
        }),
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? `${errorMessages.policyApprovalStatusFetchFailed}: ${error.message}`
          : errorMessages.policyApprovalStatusFetchFailed,
      );
    }
  }

  async generateExcelFromJson(fileName: string): Promise<string> {
    try {
      if (typeof fileName !== "string" || !fileName.trim()) {
        throw new BadRequestException("File name is required");
      }

      const TEMPLATE_HEADERS = [
        "Intake Type",
        "Cover code",
        "Risk Location Type",
        "Risk Location Detail",
        "Category",
        "Coverage Type",
        "Quantity",
        "UOM",
        "Rate",
        "Sum Insured",
        "Premium",
        "Is Main Asset",
        "Sub limit Amount",
        "Sub Limit Description",
        "Sub Limit Type",
        "Effective Date",
      ] as const;

      // Single empty row (or keep defaults if needed later)
      const emptyRow = TEMPLATE_HEADERS.reduce<Record<string, string>>(
        (row, header) => {
          row[header] = "";
          return row;
        },
        {},
      );

      const assetTemplateSheet = XLSX.utils.json_to_sheet([emptyRow], {
        header: Array.from(TEMPLATE_HEADERS),
      });

      const helperTemplateRow: Record<
        (typeof TEMPLATE_HEADERS)[number],
        string
      > = {
        "Intake Type": "Addition",
        "Cover code": "FIRE-BLD200",
        "Risk Location Type": "Office - New-4",
        "Risk Location Detail": "Sub branch",
        Category: "Property",
        "Coverage Type": "Primary",
        Quantity: "1",
        UOM: "sq.ft",
        Rate: "0.5",
        "Sum Insured": "500",
        Premium: "50000",
        "Is Main Asset": "Yes",
        "Sub limit Amount": "",
        "Sub Limit Description": "",
        "Sub Limit Type": "",
        "Effective Date": "2025-09-23",
      };

      const helperSubAssetRow: Record<
        (typeof TEMPLATE_HEADERS)[number],
        string
      > = {
        "Intake Type": "Addition",
        "Cover code": "FIRE-BLD200",
        "Risk Location Type": "Office - New-4",
        "Risk Location Detail": "Sub branch",
        Category: "Property",
        "Coverage Type": "Primary",
        Quantity: "1",
        UOM: "sq.ft",
        Rate: "0.5",
        "Sum Insured": "500",
        Premium: "50000",
        "Is Main Asset": "",
        "Sub limit Amount": "67689",
        "Sub Limit Description":
          "Description should be different for each file upload",
        "Sub Limit Type": "CAT-B",
        "Effective Date": "2025-09-23",
      };

      const helperTemplateSheet = XLSX.utils.json_to_sheet(
        [helperTemplateRow, helperSubAssetRow],
        { header: Array.from(TEMPLATE_HEADERS) },
      );

      const trimmedName = fileName.trim();
      const fileNameWithExtension = trimmedName.toLowerCase().endsWith(".xlsx")
        ? trimmedName
        : `${trimmedName}.xlsx`;
      const sanitizedFileName = fileNameWithExtension.replace(
        /[^a-zA-Z0-9._-]/g,
        "-",
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        assetTemplateSheet,
        "Asset-Template",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        helperTemplateSheet,
        "Template Helper",
      );

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const storageKey = `uploads/policy/generated/${Date.now()}-${sanitizedFileName}`;
      return await uploadToS3(
        buffer,
        storageKey,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "generateExcelFromJson",
          payload: { fileName },
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(errorMessages.excelGenerationError);
    }
  }

  async createPolicyConfiguration(dto: CreatePolicyConfigurationDto) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "createPolicyConfiguration",
          payload: {},
          messageData: "method invoked",
        }),
      });
      // Fetch the policy type from the lookup table
      const policyType = await this.policyRepository.getPolicyTypeById(
        dto.policyTypeLid,
      );

      // Validate the policy type
      if (!policyType || !VALID_POLICY_TYPES.includes(policyType.lookUpValue)) {
        throw new BadRequestException(
          `Invalid policy type: ${
            policyType?.lookUpValue
          }. Allowed types are ${VALID_POLICY_TYPES.join(", ")}.`,
        );
      }

      // Proceed with policy configuration creation
      return await this.policyRepository.createPolicyConfiguration(dto);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "createPolicyConfiguration",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to create policy configuration.",
      );
    }
  }

  async updatePolicyConfiguration(
    id: number,
    dto: UpdatePolicyConfigurationDto,
    userId?: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "updatePolicyConfiguration",
          payload: { id },
          messageData: "method invoked",
        }),
      });

      // Get the current policy configuration to check its status
      const currentConfig =
        await this.policyRepository.findPolicyConfigurationById(id);
      if (!currentConfig) {
        throw new NotFoundException(
          `Policy configuration not found with ID: ${id}`,
        );
      }

      // Guard: enablePolicyLocations requires the company to have at least
      // one address of type ADDRESS_TYPE_POLICY_LOCATION.
      const enablePolicyLocations = (
        dto.policyConfiguration as { enablePolicyLocations?: boolean } | undefined
      )?.enablePolicyLocations;
      if (enablePolicyLocations === true) {
        await this.assertCompanyHasPolicyLocationAddress(currentConfig.policyId);
      }

      // B-1, B-3, B-6: Run policy-configuration validations before saving.
      const incomingConfig = dto.policyConfiguration as any;
      this.validateBenefitComponents(incomingConfig);
      this.validateDependentCountBands(incomingConfig);
      this.validateAndDefaultApplyToDependents(incomingConfig);

      // Check if current configuration is in live status
      const isLiveStatus =
        currentConfig.policyStatus?.lookUpKey ===
        POLICY_CONFIGURATION_STATUS_LIVE;
      if (isLiveStatus) {
        // If live, create an edit version instead of updating directly
        const editVersion = await this.createPolicyConfigurationEditVersion(
          currentConfig.policyId,
          dto.policyConfiguration || currentConfig.policyConfiguration,
          dto.remarks,
          dto.policyStep || currentConfig.policyStep,
          userId,
        );

        // B-4: Sync parameters to policy_enrollment_parameters after save.
        // if (Array.isArray(incomingConfig?.parameters)) {
        //   await this.policyRepository.syncEnrollmentParameters(
        //     currentConfig.policyId,
        //     incomingConfig.parameters,
        //     userId ?? 0,
        //   );
        // }

        return await this.mapLiveStatusResponse(editVersion, false);
      } else {
        // If not live, proceed with normal update
        const updatedConfiguration =
          await this.policyRepository.updatePolicyConfiguration(
            id,
            dto,
            userId,
          );

        // B-4: Sync parameters to policy_enrollment_parameters after save.
        // if (Array.isArray(incomingConfig?.parameters)) {
        //   await this.policyRepository.syncEnrollmentParameters(
        //     currentConfig.policyId,
        //     incomingConfig.parameters,
        //     userId ?? 0,
        //   );
        // }

        return await this.mapLiveStatusResponse(updatedConfiguration, false);
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "updatePolicyConfiguration",
          payload: { id },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to update policy configuration.",
      );
    }
  }

  private async mapLiveStatusResponse(
    configuration: PolicyConfiguration | null,
    shouldForceLiveStatus: boolean,
  ) {
    if (!configuration) {
      return configuration;
    }

    const [liveEditPendingApprovalStatus, liveEditSubmitStatus] =
      await Promise.all([
        this.policyRepository.getLookupByKey(
          POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL,
        ),
        this.policyRepository.getLookupByKey(
          POLICY_CONFIGURATION_STATUS_LIVE_EDIT_SUBMIT,
        ),
      ]);

    if (
      shouldForceLiveStatus ||
      (liveEditPendingApprovalStatus &&
        configuration.policyConfiguartionStatusLid ===
          liveEditPendingApprovalStatus.id) ||
      (liveEditSubmitStatus &&
        configuration.policyConfiguartionStatusLid === liveEditSubmitStatus.id)
    ) {
      const liveStatus = await this.policyRepository.getLookupByKey(
        POLICY_CONFIGURATION_STATUS_LIVE,
      );

      return {
        ...configuration,
        policyConfiguartionStatusLid: liveStatus
          ? liveStatus.id
          : configuration.policyConfiguartionStatusLid,
        policyStatus: liveStatus
          ? {
              id: liveStatus.id,
              lookUpValue: liveStatus.lookUpValue,
              lookUpKey: liveStatus.lookUpKey,
            }
          : configuration.policyStatus,
      };
    }

    return configuration;
  }

  async getPolicyConfigurationByPolicyId(policyId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyConfigurationByPolicyId",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });
      const policyConfiguration =
        await this.policyRepository.getPolicyConfigurationByPolicyId(policyId);

      if (!policyConfiguration) {
        throw new NotFoundException(
          `Policy configuration not found for ID: ${policyId}`,
        );
      }

      return policyConfiguration;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyConfigurationByPolicyId",
          payload: { policyId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy configuration.",
      );
    }
  }

  async createPolicyConfigurationEditVersion(
    policyId: number,
    policyConfiguration: unknown,
    remarks?: string,
    policyStep?: number,
    userId?: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "createPolicyConfigurationEditVersion",
          payload: { policyId, remarks, policyStep },
          messageData: "method invoked",
        }),
      });

      // Check if policy has live configuration
      const hasLiveConfig = await this.policyRepository.checkPolicyInLiveStatus(
        policyId,
      );
      if (!hasLiveConfig) {
        throw new BadRequestException(
          errorMessages.policyConfigurationNotInLiveStatus,
        );
      }

      // Check if edit version already exists
      const editVersionExists =
        await this.policyRepository.checkEditVersionExists(policyId);
      if (editVersionExists) {
        throw new BadRequestException(
          errorMessages.policyConfigurationEditVersionExists,
        );
      }

      // Create edit version
      const editVersion =
        await this.policyRepository.createPolicyConfigurationEditVersion(
          policyId,
          policyConfiguration,
          remarks,
          policyStep || 1,
          userId,
        );

      return editVersion;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "createPolicyConfigurationEditVersion",
          payload: { policyId, remarks, policyStep },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.policyConfigurationEditVersionCreationFailed,
      );
    }
  }

  async getPolicyConfigurationByPolicyIdForRole(
    policyId: number,
    userId: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyConfigurationByPolicyIdForRole",
          payload: { policyId, userId },
          messageData: "method invoked",
        }),
      });

      // Check if user has ACL permission for live edit
      const user = await this.policyRepository.findUserWithRole(userId);
      if (!user) {
        throw new NotFoundException(`User not found with ID: ${userId}`);
      }

      // Check ACL permission using action and category keys
      // User may have multiple roles, check if ANY role has the permission
      let hasPermission = false;

      try {
        if (user.userRoles && user.userRoles.length > 0) {
          for (const userRole of user.userRoles) {
            try {
              const rolePermission =
                await this.policyRepository.checkAclPermission(
                  userRole.roleId,
                  ACL_CATEGORY_POLICY_CONFIGURE,
                  ACL_ACTION_POLICY_CONFIGURE_LIVE_EDIT,
                );
              if (rolePermission) {
                hasPermission = true;
                break; // Found a role with permission, no need to check others
              }
            } catch (roleError) {
              this.logger.warn({
                level: "warn",
                message: buildLogMessage({
                  traceId: this.traceIdService.traceId,
                  status: "failure",
                  location: "PolicyService",
                  method: "getPolicyConfigurationByPolicyIdForRole",
                  payload: { policyId, userId, roleId: userRole.roleId },
                  messageData: `ACL check failed for role ${userRole.roleId}: ${roleError?.message}`,
                }),
              });
            }
          }
        } else {
          // Fallback for single role properties
          const userRole = user.userRole || user.role;
          if (userRole) {
            try {
              hasPermission = await this.policyRepository.checkAclPermission(
                userRole.id,
                ACL_CATEGORY_POLICY_CONFIGURE,
                ACL_ACTION_POLICY_CONFIGURE_LIVE_EDIT,
              );
            } catch (roleError) {
              this.logger.warn({
                level: "warn",
                message: buildLogMessage({
                  traceId: this.traceIdService.traceId,
                  status: "failure",
                  location: "PolicyService",
                  method: "getPolicyConfigurationByPolicyIdForRole",
                  payload: { policyId, userId, roleId: userRole.roleId },
                  messageData: `ACL check failed for single role ${userRole.id}: ${roleError?.message}`,
                }),
              });
            }
          }
        }
      } catch (aclError) {
        hasPermission = false;
      }
      // Check if there's a pending approval configuration
      const pendingApprovalConfig =
        await this.policyRepository.getPolicyConfigurationForRole(
          policyId,
          POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL,
        );

      // If user has permission and there's pending approval, return that
      if (hasPermission && pendingApprovalConfig) {
        const policyConfiguration = pendingApprovalConfig;

        // Remove metadata fields and build user names
        const {
          createdAt,
          updatedAt,
          deletedAt,
          policyType,
          policyStatus,
          ...filteredConfig
        } = policyConfiguration;

        const userIds = [
          filteredConfig.approverId,
          filteredConfig.rejectedById,
        ].filter((id): id is number => typeof id === "number");

        let approverName: string | null = null;
        let rejectedByName: string | null = null;

        if (userIds.length > 0) {
          const users = await this.policyRepository.findUsersByIds(userIds);

          for (const user of users) {
            if (user.userId === filteredConfig.approverId) {
              approverName = `${user.firstName} ${user.lastName}`;
            }
            if (user.userId === filteredConfig.rejectedById) {
              rejectedByName = `${user.firstName} ${user.lastName}`;
            }
          }
        }

        // Get live status for frontend display
        const liveStatus = await this.policyRepository.getLookupByKey(
          POLICY_CONFIGURATION_STATUS_LIVE,
        );

        // Use the stored approver name from the configuration
        // This ensures all users see the same approver, not their own hierarchy
        const requestSentToName = approverName;

        // Get approver details in the required format
        const approverDetails =
          await this.policyRepository.getPolicyConfigurationApproverDetails(
            policyId,
          );

        return {
          ...filteredConfig,
          policyType: policyType
            ? {
                id: policyType.id,
                lookUpValue: policyType.lookUpValue,
                lookUpKey: policyType.lookUpKey,
              }
            : null,
          policyStatus: liveStatus
            ? {
                id: liveStatus.id,
                lookUpValue: liveStatus.lookUpValue,
                lookUpKey: liveStatus.lookUpKey,
              }
            : policyStatus
            ? {
                id: policyStatus.id,
                lookUpValue: policyStatus.lookUpValue,
                lookUpKey: policyStatus.lookUpKey,
              }
            : null,
          approverName,
          rejectedByName,
          requestSentToName,
          approverDetails,
        };
      }

      // Otherwise, get the regular configuration
      const policyConfiguration =
        await this.policyRepository.getPolicyConfigurationByPolicyId(policyId);

      if (!policyConfiguration) {
        throw new NotFoundException(
          `Policy configuration not found for ID: ${policyId}`,
        );
      }

      // Use the stored approver from configuration if available
      let requestSentToName = null;
      if (policyConfiguration.approverId) {
        const approver = await this.policyRepository.findUsersByIds([
          policyConfiguration.approverId,
        ]);
        if (approver && approver.length > 0) {
          requestSentToName = `${approver[0].firstName} ${approver[0].lastName}`.trim();
        }
      }

      // Get approver details in the required format
      const approverDetails =
        await this.policyRepository.getPolicyConfigurationApproverDetails(
          policyId,
        );

      return {
        ...policyConfiguration,
        requestSentToName,
        approverDetails,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyConfigurationByPolicyIdForRole",
          payload: { policyId, userId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy configuration.",
      );
    }
  }

  async listPolicyConfigurations(page: number, limit: number, search?: string) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "listPolicyConfigurations",
          payload: { page, limit },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.listPolicyConfigurations(
        page,
        limit,
        search,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "listPolicyConfigurations",
          payload: { page, limit },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to list policy configurations.",
      );
    }
  }

  async updatePolicyConfigurationStatus(
    id: number,
    isApproved: boolean,
    userId: number,
    remarks?: string,
  ) {
    try {
      const existingConfig =
        await this.policyRepository.findPolicyConfigurationById(id);
      if (!Number.isFinite(userId)) {
        throw new BadRequestException(
          errorMessages.policyConfigurationApprovalUserIdRequired,
        );
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "updatePolicyConfigurationStatus",
          payload: { id, isApproved, userId },
          messageData: "method invoked",
        }),
      });
      const policyConfiguration =
        await this.policyRepository.updatePolicyConfigurationStatus(
          id,
          isApproved,
          userId,
          remarks,
        );

      if (policyConfiguration) {
        const [liveEditPendingApprovalStatus, liveEditSubmitStatus] =
          await Promise.all([
            this.policyRepository.getLookupByKey(
              POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL,
            ),
            this.policyRepository.getLookupByKey(
              POLICY_CONFIGURATION_STATUS_LIVE_EDIT_SUBMIT,
            ),
          ]);

        const shouldForceLiveStatus =
          !isApproved &&
          !!existingConfig &&
          ((liveEditPendingApprovalStatus &&
            existingConfig.policyConfiguartionStatusLid ===
              liveEditPendingApprovalStatus.id) ||
            (liveEditSubmitStatus &&
              existingConfig.policyConfiguartionStatusLid ===
                liveEditSubmitStatus.id));

        await this.policyRepository.createPolicyAuditLogEntry({
          policyId: policyConfiguration.policyId,
          policyConfigurationId: policyConfiguration.id,
          entityType: POLICY_AUDIT_ENTITY_POLICY_CONFIGURATION,
          entityId: policyConfiguration.id,
          action: isApproved
            ? POLICY_AUDIT_ACTION_APPROVED
            : POLICY_AUDIT_ACTION_REJECTED,
          performedBy: userId,
          remarks,
          metadata: { isApproved },
        });
        return await this.mapLiveStatusResponse(
          policyConfiguration,
          shouldForceLiveStatus,
        );
      }

      return policyConfigurationWithRelations ?? policyConfiguration;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "updatePolicyConfigurationStatus",
          payload: { id, isApproved, userId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.policyConfigurationUpdateFailed,
      );
    }
  }

  async listLivePolicyConfigurationsForExport(companyId: number, policyTypeLid: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "listLivePolicyConfigurationsForExport",
          payload: { companyId, policyTypeLid },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.listLivePolicyConfigurationsForExport(
        companyId,
        policyTypeLid
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "listLivePolicyConfigurationsForExport",
          payload: { companyId, policyTypeLid },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to list live policy configurations.",
      );
    }
  }

  async getPolicyTypesByCompanyId(
    companyId: number,
    search?: string,
    page?: number,
    limit?: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyTypesByCompanyId",
          payload: { companyId, search, page, limit },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.getPolicyTypesByCompanyId(
        companyId,
        search,
        page,
        limit
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyTypesByCompanyId",
          payload: { companyId, search, page, limit },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to get policy types by company.",
      );
    }
  }

  async exportPolicyConfiguration(
    policyId: number,
    sourcePolicyConfigurationId: number,
    userId: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "exportPolicyConfiguration",
          payload: { policyId, sourcePolicyConfigurationId, userId },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.exportPolicyConfiguration(
        policyId,
        sourcePolicyConfigurationId,
        userId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "exportPolicyConfiguration",
          payload: { policyId, sourcePolicyConfigurationId, userId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to export policy configuration.",
      );
    }
  }

  private buildEnrollmentTemplateFieldList(config: any): { fieldList: DataTemplateField[], componentMap: Map<string, any>, policyFieldNames: Set<string> } {
    const fieldList: DataTemplateField[] = MandatoryDataIntakeFields.concat(
      NonFinancialFields,
    ).map((f) => ({ ...f }));

    // Add component fields (MULTIPLE sum insured)
    if (config?.components) {
      for (const comp of config.components) {
        if (comp.sumInsuredModel === "MULTIPLE" && comp.siMultipleLabel) {
          if (!fieldList.find((f) => f.fieldName === comp.siMultipleLabel)) {
            fieldList.push({
              fieldName: comp.siMultipleLabel,
              fieldType: "number",
              options: null,
            });
          }
        }
      }
    }

    // Add parameter fields
    if (config?.parameters) {
      for (const param of config.parameters) {
        if (
          param.parameterMasterName === "Age" ||
          param.type === "relation" ||
          param.type === "max-dependent-count"
        ) {
          continue;
        }
        if (!param.displayName) continue;
        if (fieldList.find((f) => f.fieldName === param.displayName)) continue;
        const field: DataTemplateField = {
          fieldName: param.displayName,
          fieldType: param.type === "range" ? "number" : "list",
          options:
            param.type === "range"
              ? null
              : (param.lovDetails ?? []).map((o: any) => o.value),
        };
        fieldList.push(field);
      }
    }

    // Add relationship group field
    if (this.shouldIncludeRelationshipGroupField(config)) {
      if (
        !fieldList.some(
          (field) =>
            field.fieldName === this.getIncludedRelationshipFieldName(config),
        )
      ) {
        fieldList.push({
          fieldName:
            this.getIncludedRelationshipFieldName(config) ??
            RELATIONSHIP_GROUP_FIELD_NAME,
          fieldType: "string",
          options: null,
        });
      }
    }

    // Add SEZ field
    if (this.isSezConstraintEnabled(config)) {
      const hasSezField = fieldList.some(
        (field) => field.fieldName === SEZ_APPLICABLE_FIELD_NAME,
      );
      if (!hasSezField) {
        fieldList.push(this.buildSezApplicableField());
      }
    }

    // Add Max Dependent Count field when configured
    const maxDependentCountParam = this.getMaxDependentCountParam(config);
    if (maxDependentCountParam?.maxDependentCountConfig?.options?.length) {
      const mdcFieldName = maxDependentCountParam.displayName?.trim() || "Max Dependent Count";
      if (!fieldList.some((field) => field.fieldName === mdcFieldName)) {
        fieldList.push(this.buildMaxDependentCountField(maxDependentCountParam));
      }
    }

    // Add Policy Location field when enabled
    if (config?.enablePolicyLocations === true) {
      if (!fieldList.some((f) => f.fieldName === POLICY_LOCATION_FIELD_NAME)) {
        fieldList.push({ fieldName: POLICY_LOCATION_FIELD_NAME, fieldType: 'string', options: null });
      }
    }

    // Add user detail label columns from configuration
    const userDetailItems: { id: string; label: string }[] = config?.userDetailsSection?.items ?? [];
    for (const item of userDetailItems) {
      const label = item.label?.trim();
      if (label && !fieldList.some((f) => f.fieldName === label)) {
        fieldList.push({ fieldName: label, fieldType: 'string', options: null });
      }
    }

    // Build component map for policy fields
    const componentMap = new Map<string, any>();
    const policyFieldNames = new Set<string>();
    if (config?.components) {
      config.components.forEach((c: any) => componentMap.set(String(c.id), c));
      config.components.forEach((c: any) =>
        componentMap.set(String(c.type), c),
      );
    }

    // Add policy fields (base and parental policies with addons)
    const addPolicyFields = (tpl: any) => {
      if (!tpl) return;
      const mainComp = componentMap.get(String(tpl.mainPolicyId));
      if (mainComp) {
        fieldList.push({
          fieldName: mainComp.label,
          fieldType: "string",
          options: null,
          example: "Yes/No",
        });
        fieldList.push({
          fieldName: `${mainComp.label} Sum Insured`,
          fieldType: "number",
          options: null,
        });
        policyFieldNames.add(mainComp.label);
        policyFieldNames.add(`${mainComp.label} Sum Insured`);
      }
      tpl?.addonIds?.forEach((a: any) => {
        const addonComp = componentMap.get(String(a.optionId));
        if (addonComp) {
          const prefix = mainComp ? mainComp.label : String(tpl.mainPolicyId);
          fieldList.push({
            fieldName: `${prefix} Addon - ${addonComp.label}`,
            fieldType: "string",
            options: null,
            example: "Yes/No",
          });
          fieldList.push({
            fieldName: `${prefix} Addon - ${addonComp.label} Sum Insured`,
            fieldType: "number",
            options: null,
          });
          policyFieldNames.add(`${prefix} Addon - ${addonComp.label}`);
          policyFieldNames.add(
            `${prefix} Addon - ${addonComp.label} Sum Insured`,
          );
        }
      });
    };

    if (config?.policyTemplate) {
      addPolicyFields(config.policyTemplate.basePolicy);
      addPolicyFields(config.policyTemplate.parentalPolicy);
    }

    return { fieldList, componentMap, policyFieldNames};
  }

  async activatePolicy(
    policyId: number,
    userId: number,
    dto?: ActivatePolicyDto,
  ) {
    try {
      if (!Number.isFinite(userId)) {
        throw new BadRequestException(
          errorMessages.policyActivationUserIdRequired,
        );
      }

      const shouldActivate = dto?.isActivate ?? true;

      if (!shouldActivate) {
        throw new BadRequestException(
          errorMessages.policyActivationFlagRequired,
        );
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "activatePolicy",
          payload: { policyId, userId, isActivate: shouldActivate },
          messageData: "method invoked",
        }),
      });

      const activationResult = await this.policyRepository.activatePolicy(
        policyId,
        userId,
      );

      let finalizedConfiguration = activationResult.policyConfiguration;

      if (
        activationResult.policyConfigurationStatusChanged &&
        activationResult.policyConfiguration
      ) {
        finalizedConfiguration = await this.finalizePolicyConfiguration(
          activationResult.policyConfiguration,
          userId,
        );
      }

      await this.policyRepository.createPolicyAuditLogEntry({
        policyId: activationResult.policy.id,
        policyConfigurationId: finalizedConfiguration?.id ?? null,
        entityType: POLICY_AUDIT_ENTITY_POLICY,
        entityId: activationResult.policy.id,
        action: POLICY_AUDIT_ACTION_POLICY_ACTIVATED,
        performedBy: userId,
        remarks: null,
        metadata: {
          previousPolicyStatusLid: activationResult.previousPolicyStatusLid,
          currentPolicyStatusLid: activationResult.policy.policyStatusLid,
        },
      });

      if (
        activationResult.policyConfigurationStatusChanged &&
        finalizedConfiguration
      ) {
        await this.policyRepository.createPolicyAuditLogEntry({
          policyId: activationResult.policy.id,
          policyConfigurationId: finalizedConfiguration.id,
          entityType: POLICY_AUDIT_ENTITY_POLICY_CONFIGURATION,
          entityId: finalizedConfiguration.id,
          action: POLICY_AUDIT_ACTION_CONFIGURATION_LIVE,
          performedBy: userId,
          remarks: null,
          metadata: {
            previousPolicyConfigurationStatusLid:
              activationResult.previousPolicyConfigurationStatusLid,
            currentPolicyConfigurationStatusLid:
              finalizedConfiguration.policyConfiguartionStatusLid,
          },
        });
      }

      // Initialize templates in Strapi for the activated policy
      try {
        const strapiBaseUrlRaw =
          ENV.STRAPI_INTERNAL_URL ||
          ENV.URL_STRAPI_CMS_SERVICE ||
          ENV.STRAPI_PUBLIC_URL;
        const strapiBaseUrl = (strapiBaseUrlRaw || "").replace(/\/+$/, "");
        const initializeTemplatesUrl = `${strapiBaseUrl}/api/initialize-templates`;

        const policyConfigJson = finalizedConfiguration?.policyConfiguration as any;
        const policyComponents = Array.isArray(policyConfigJson?.components)
          ? policyConfigJson.components.map((c: any) => ({
              id: c.id,
              type: c.type,
              label: c.label,
              isBenefitComponent: c.isBenefitComponent === true,
            }))
          : [];

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "info",
            location: "PolicyService",
            method: "activatePolicy",
            payload: {
              policyId: activationResult.policy.id,
              companyId: activationResult.policy.companyId,
              finalizedConfigurationId: finalizedConfiguration?.id ?? null,
              hasPolicyConfiguration: !!policyConfigJson,
              componentsIsArray: Array.isArray(policyConfigJson?.components),
              componentCount: policyComponents.length,
              components: policyComponents,
            },
            messageData: "Strapi template init - component data",
          }),
        });

        const strapiResponse = await axios.post(
          initializeTemplatesUrl,
          {
            companyId: activationResult.policy.companyId,
            policyId: activationResult.policy.id,
            components: policyComponents,
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          }
        );

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PolicyService",
            method: "activatePolicy",
            payload: {
              policyId: activationResult.policy.id,
              companyId: activationResult.policy.companyId,
              initializeTemplatesUrl,
            },
            messageData: "Strapi templates initialized successfully",
            metadata: strapiResponse.data,
          }),
        });
      } catch (strapiError) {
        // Non-blocking: Log error but don't fail policy activation
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "PolicyService",
            method: "activatePolicy",
            payload: {
              policyId: activationResult.policy.id,
              companyId: activationResult.policy.companyId,
              initializeTemplatesUrl:
                `${(ENV.STRAPI_INTERNAL_URL || ENV.URL_STRAPI_CMS_SERVICE || ENV.STRAPI_PUBLIC_URL || "").replace(/\/+$/, "")}/api/initialize-templates`,
            },
            messageData: "Failed to initialize Strapi templates",
            error:
              strapiError instanceof Error
                ? strapiError.message
                : String(strapiError),
          }),
        });
      }

      return {
        policy: activationResult.policy,
        policyConfiguration: finalizedConfiguration ?? null,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "activatePolicy",
          payload: { policyId, userId, dto },
          messageData: error,
        }),
      });

      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.policyActivationFailed,
      );
    }
  }

  private async finalizePolicyConfiguration(
    policyConfiguration: PolicyConfiguration,
    userId: number,
  ): Promise<PolicyConfiguration> {
    if (
      !policyConfiguration ||
      !policyConfiguration.policyConfiguration ||
      !Array.isArray(
        (policyConfiguration.policyConfiguration as any)?.components,
      )
    ) {
      return policyConfiguration;
    }

    const savedComponentsDetails =
      await this.policyRepository.insertPolicyComponentConfigurationDetails(
        policyConfiguration,
        userId,
      );

    if (!Array.isArray(savedComponentsDetails)) {
      return policyConfiguration;
    }

    const idMap: Record<string, number> = {};
    const components = (policyConfiguration.policyConfiguration as any)
      ?.components;

    if (Array.isArray(components)) {
      for (const comp of components) {
        const newComp = savedComponentsDetails.find(
          (saved: any) =>
            saved.type === comp.type && saved.label === comp.label,
        );
        if (newComp) {
          idMap[comp.id] = newComp.id;
          comp.id = newComp.id;
        }
      }
    }

    const policyOptions = (policyConfiguration.policyConfiguration as any)
      ?.policyOptions;
    if (Array.isArray(policyOptions)) {
      for (const option of policyOptions) {
        const baseChoices = option.basePolicyChoices;
        if (baseChoices?.mainPolicyChoices?.policyId) {
          const oldId = baseChoices.mainPolicyChoices.policyId;
          if (idMap[oldId]) {
            baseChoices.mainPolicyChoices.policyId = idMap[oldId];
          }
        }
        if (Array.isArray(baseChoices?.addonChoices)) {
          baseChoices.addonChoices.forEach((addon: any) => {
            const oldId = addon.policyId;
            if (idMap[oldId]) {
              addon.policyId = idMap[oldId];
            }
          });
        }
        const parentalChoices = option.parentalPolicyChoices;
        if (parentalChoices?.mainPolicyChoices?.policyId) {
          const oldId = parentalChoices.mainPolicyChoices.policyId;
          if (idMap[oldId]) {
            parentalChoices.mainPolicyChoices.policyId = idMap[oldId];
          }
        }
        if (Array.isArray(parentalChoices?.addonChoices)) {
          parentalChoices.addonChoices.forEach((addon: any) => {
            const oldId = addon.policyId;
            if (idMap[oldId]) {
              addon.policyId = idMap[oldId];
            }
          });
        }
      }
    }

    const policyTemplate = (policyConfiguration.policyConfiguration as any)
      ?.policyTemplate;
    if (policyTemplate) {
      const updateTemplateSection = (section: any) => {
        if (!section) return;
        if (section.mainPolicyId && idMap[section.mainPolicyId]) {
          section.mainPolicyId = idMap[section.mainPolicyId];
        }
        if (Array.isArray(section.addonIds)) {
          section.addonIds.forEach((addon: any) => {
            const oldId = addon.optionId;
            if (idMap[oldId]) {
              addon.optionId = idMap[oldId];
            }
          });
        }
      };

      updateTemplateSection(policyTemplate.basePolicy);
      updateTemplateSection(policyTemplate.parentalPolicy);
    }

    const updatedConfiguration =
      await this.policyRepository.updatePolicyConfiguration(
        policyConfiguration.id,
        { policyConfiguration: policyConfiguration.policyConfiguration },
        userId,
      );

    return updatedConfiguration ?? policyConfiguration;
  }

  async deletePolicyConfiguration(id: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "deletePolicyConfiguration",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      const result = await this.policyRepository.softDeletePolicyConfiguration(
        id,
      );

      if (!result) {
        throw new NotFoundException(
          `Policy configuration not found for ID: ${id}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "deletePolicyConfiguration",
          payload: { id },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to delete policy configuration.",
      );
    }
  }

  async getPolicyConstraintsByPolicyId(policyId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyConstraintsByPolicyId",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.getPolicyConstraintsByPolicyId(
        policyId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyConstraintsByPolicyId",
          payload: { policyId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy constraints.",
      );
    }
  }

  async generateTemplate(policyId: number): Promise<{
    documentId: number;
    fileName: string;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "generateTemplate",
        payload: { policyId },
        messageData: "method invoked",
      }),
    });
    try {
      const policyConfigEntity =
        await this.policyRepository.getLivePolicyConfiguration(policyId);
      if (!policyConfigEntity) {
        throw new BadRequestException("Configuration is not live");
      }

      const existingMap = await this.policyRepository.findTemplateDocMap(
        policyId,
      );

      const effectiveEnablePolicyLocations =
        (policyConfigEntity.policyConfiguration as { enablePolicyLocations?: boolean })?.enablePolicyLocations === true;

      if (existingMap) {
        const fileUpload = await this.policyRepository.getFileUploadById(
          existingMap.documentId,
        );
        if (fileUpload) {
          const hasLocationCode = effectiveEnablePolicyLocations
            ? await this.enrollmentTemplateHasLocationCodeHeader(fileUpload.fileKey)
            : true;
          if (hasLocationCode) {
            return {
              documentId: existingMap.documentId,
              fileName: path.basename(fileUpload.fileKey),
            };
          }
        }
      }
      const config = policyConfigEntity.policyConfiguration as any;
      const fieldList: DataTemplateField[] = MandatoryDataIntakeFields.map(
        (f) => ({ ...f }),
      );

      if (config?.components) {
        for (const comp of config.components) {
          if (comp.sumInsuredModel === "MULTIPLE" && comp.siMultipleLabel) {
            if (!fieldList.find((f) => f.fieldName === comp.siMultipleLabel)) {
              fieldList.push({
                fieldName: comp.siMultipleLabel,
                fieldType: "number",
                options: null,
              });
            }
          }
        }
      }

      if (config?.parameters) {
        for (const param of config.parameters) {
          if (
            param.parameterMasterName === "Age" ||
            param.type === "relation" ||
            param.type === "max-dependent-count"
          ) {
            continue;
          }
          if (!param.displayName) continue;
          if (fieldList.find((f) => f.fieldName === param.displayName))
            continue;
          const field: DataTemplateField = {
            fieldName: param.displayName,
            fieldType: param.type === "range" ? "number" : "list",
            options:
              param.type === "range"
                ? null
                : (param.lovDetails ?? []).map((o: any) => o.value),
          };
          fieldList.push(field);
        }
      }

      if (this.shouldIncludeRelationshipGroupField(config)) {
        if (
          !fieldList.some(
            (field) =>
              field.fieldName === this.getIncludedRelationshipFieldName(config),
          )
        ) {
          fieldList.push({
            fieldName:
              this.getIncludedRelationshipFieldName(config) ??
              RELATIONSHIP_GROUP_FIELD_NAME,
            fieldType: "string",
            options: null,
          });
        }
      }

      if (this.isSezConstraintEnabled(config)) {
        const hasSezField = fieldList.some(
          (field) => field.fieldName === SEZ_APPLICABLE_FIELD_NAME,
        );
        if (!hasSezField) {
          fieldList.push(this.buildSezApplicableField());
        }
      }

      const maxDependentCountParam = this.getMaxDependentCountParam(config);
      if (maxDependentCountParam?.maxDependentCountConfig?.options?.length) {
        const mdcFieldName = maxDependentCountParam.displayName?.trim() || "Max Dependent Count";
        if (!fieldList.some((field) => field.fieldName === mdcFieldName)) {
          fieldList.push(this.buildMaxDependentCountField(maxDependentCountParam));
        }
      }

      // Add Policy Location field when enabled
      if (config?.enablePolicyLocations === true) {
        if (!fieldList.some((f) => f.fieldName === POLICY_LOCATION_FIELD_NAME)) {
          fieldList.push({ fieldName: POLICY_LOCATION_FIELD_NAME, fieldType: 'string', options: null });
        }
      }

      // Add user detail label columns from configuration
      const userDetailItems: { id: string; label: string }[] = config?.userDetailsSection?.items ?? [];
      for (const item of userDetailItems) {
        const label = item.label?.trim();
        if (label && !fieldList.some((f) => f.fieldName === label)) {
          fieldList.push({ fieldName: label, fieldType: 'string', options: null });
        }
      }

      const policyEffectiveDateRaw =
        await this.policyRepository.getPolicyEffectiveDate(policyId);
      const effectiveDateValue = this.resolveEffectiveDate(
        policyEffectiveDateRaw,
      );

      const mockNames = POLICY_TEMPLATE_MOCK_NAMES;

      const generateMockValue = (
        field: DataTemplateField,
        index: number,
      ): string | number => {
        const name = field.fieldName.toLowerCase();
        if (name === "claim status") {
          return "No";
        }
        if (name === "intake type") {
          return (
            field.options?.find(
              (o: string) => o.toLowerCase() === "addition",
            ) || "ADDITION"
          );
        }
        if (name === "employee id") {
          return this.generateEmployeeId(index);
        }
        if (name === "relation") {
          return "Self";
        }
        if (name.includes("name")) {
          return mockNames[index % mockNames.length];
        }
        if (name.includes("email")) {
          return `user${index + 1}@example.com`;
        }
        if (name.includes("mobile") || name.includes("phone")) {
          return String(9000000000 + index);
        }
        if (field.fieldType === "list" && field.options?.length) {
          return field.options[index % field.options.length];
        }
        if (field.fieldType === "number") {
          return index + 1;
        }
        if (name === "effective date") {
          return effectiveDateValue;
        }
        if (field.fieldType === "date") {
          const day = String((index % 28) + 1).padStart(2, "0");
          return `1990-01-${day}`;
        }
        return `${field.fieldName} ${index + 1}`;
      };

      const headerRow = fieldList.map((f) => f.fieldName);
      const dataRows: (string | number)[][] = [];
      for (let i = 0; i < 10; i++) {
        dataRows.push(fieldList.map((f) => generateMockValue(f, i)));
      }

      const wb = XLSX.utils.book_new();
      const mainSheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
      XLSX.utils.book_append_sheet(wb, mainSheet, "Template");

      const additionHelperRows =
        templateHelperMessages.enrollmentAdditionPremiumRows.map((line) => [
          line,
        ]);
      const deletionHelperRows =
        templateHelperMessages.enrollmentDeletionPremiumRows.map((line) => [
          line,
        ]);
      const helperRows = [
        fieldList.map((f) => f.fieldName),
        fieldList.map((f) => f.fieldType),
        fieldList.map((f) =>
          f.fieldType === "list"
            ? (f.options || []).join(",")
            : f.example || "",
        ),
        [""],
        [""],
        ...additionHelperRows,
        [""],
        ...deletionHelperRows,
      ];
      const helperSheet = XLSX.utils.aoa_to_sheet(helperRows);
      XLSX.utils.book_append_sheet(wb, helperSheet, "Template Helper");

      const fileName = `policy-${policyId}-DATA_TEMPLATE.xlsx`;
      const key = `uploads/company/policy/templates/${fileName}`;

      let buffer: Buffer | null = null;
      let fileUploadEntry: FileUpload | null = null;

      fileUploadEntry = await this.policyRepository.getFileUploadByKey(key);

      buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
      if (this.repoMode === "AWS") {
        try {
          const putRes = await this.s3
            .putObject({ Bucket: this.bucket, Key: key, Body: buffer })
            .promise();
          if (!putRes?.ETag) {
            throw new Error("Missing ETag");
          }
        } catch (err) {
          throw new InternalServerErrorException(
            "Failed to upload template to S3",
          );
        }
      }

      if (!fileUploadEntry) {
        fileUploadEntry = await this.policyRepository.createFileUploadRecord({
          fileKey: key,
          companyType: "policy",
          companyId: policyId,
          uploadType: this.repoMode === "AWS" ? "AWS" : "LFS",
          documentTypeLid: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 0,
          updatedBy: 0,
          deletedAt: null,
        });
      }

      if (fileUploadEntry) {
        const existingMap = await this.policyRepository.findTemplateDocMap(
          policyId,
        );
        if (!existingMap) {
          await this.policyRepository.createTemplateDocMap(
            policyId,
            fileUploadEntry.id,
          );
        }
      }

      return {
        documentId: fileUploadEntry?.id as number,
        fileName,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "generateTemplate",
          payload: { policyId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async generateDownloadableTemplate(policyId: number): Promise<{
    documentId: number;
    fileName: string;
  }>{
    const mappings = await this.getActiveMappingTemplates(
      policyId,
      UTILITY_UPLOAD_ENTITY.UPLOAD_INCEPTION,
      "INBOUND",
    );
    const isMapped = mappings && mappings.length > 0;
    return isMapped ? await this.generateEnrollmentMappedTemplate(policyId, mappings) : await this.generateEnrollmentTemplate(policyId);
  }

  async generateBypassTemplate(
    policyId: number,
    endorsementType?: string,
  ): Promise<{
    documentId: number;
    fileName: string;
  }> {
    const policy = await this.policyRepository.findOnePolicy(policyId);
    if (!policy) {
      throw new NotFoundException(`Policy not found for ID ${policyId}`);
    }

    // Non-financial endorsements have no premium impact, so their bypass template
    // omits the Total Sum Insured and Premium columns. Cache the two variants
    // under different keys so they are never served interchangeably.
    const isNonFinancial =
      !!endorsementType &&
      endorsementType !== ENDORSEMENT_TYPES.FINANCIAL_ENDORSEMENT;

    const fileName = `policy-${policyId}-BYPASS_ENROLLMENT_TEMPLATE${
      isNonFinancial ? "_NON_FINANCIAL" : ""
    }.xlsx`;
    const fileKey = `uploads/company/policy/templates/${fileName}`;

    const existingFile = await this.policyRepository.getFileUploadByKey(fileKey);
    if (existingFile) {
      return {
        documentId: existingFile.id,
        fileName,
      };
    }

    const buffer = await this.policyRepository.generateBypassEnrollmentTemplate(
      policyId,
      endorsementType,
    );

    if (this.repoMode === "AWS") {
      await uploadToS3(
        buffer,
        fileKey,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } else {
      const targetPath = path.join(this.docRepoPath, fileKey);
      if (!path.resolve(targetPath).startsWith(path.resolve(this.docRepoPath) + path.sep)) {
        throw new BadRequestException('Invalid file path');
      }
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, buffer);
    }

    let fileUploadEntry = await this.policyRepository.getFileUploadByKey(fileKey);
    if (!fileUploadEntry) {
      fileUploadEntry = await this.policyRepository.createFileUploadRecord({
        fileKey,
        companyType: "policy",
        companyId: policyId,
        uploadType: this.repoMode === "AWS" ? "AWS" : "LFS",
        documentTypeLid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 0,
        updatedBy: 0,
      });
    }

    return {
      documentId: fileUploadEntry.id,
      fileName,
    };
  }

  async generateEnrollmentTemplate(policyId: number): Promise<{
    documentId: number;
    fileName: string;
  }> {
    let policyConfigEntity =
      await this.policyRepository.getLivePolicyConfiguration(policyId);
    if (!policyConfigEntity) {
      if (!(await this.isPolicyEnrolmentPremiumBased(policyId))) {
        throw new BadRequestException("Configuration is not live");
      }
      policyConfigEntity = { policyConfiguration: {} } as any;
    }

    let existingUpload: FileUpload | null = null;
    const fileName = `policy-${policyId}-ENROLLMENT_TEMPLATE.xlsx`;
    const key = `uploads/company/policy/templates/${fileName}`;

    const effectiveEnablePolicyLocations =
      policyConfigEntity.policyConfiguration?.enablePolicyLocations === true;

    const existingMap =
      await this.policyRepository.findEnrollmentTemplateDocMap(policyId);

    if (existingMap) {
      existingUpload = await this.policyRepository.getFileUploadById(
        existingMap.documentId,
      );
      const hasClaimStatus = existingUpload
        ? await this.enrollmentTemplateHasClaimStatus(existingUpload.fileKey)
        : false;
      const hasPremiumHelper = existingUpload
        ? await this.enrollmentTemplateHasPremiumHelper(existingUpload.fileKey)
        : false;
      const hasLegacyAddressCodeHeader = existingUpload
        ? await this.enrollmentTemplateHasLegacyAddressCodeHeader(
            existingUpload.fileKey,
          )
        : false;
      const hasLocationCode =
        existingUpload && effectiveEnablePolicyLocations
          ? await this.enrollmentTemplateHasLocationCodeHeader(existingUpload.fileKey)
          : true;
      if (
        existingUpload &&
        hasClaimStatus &&
        hasPremiumHelper &&
        !hasLegacyAddressCodeHeader &&
        hasLocationCode
      ) {
        return {
          documentId: existingMap.documentId,
          fileName: path.basename(existingUpload.fileKey),
        };
      }
    }
    const config: any = policyConfigEntity.policyConfiguration;
    if (effectiveEnablePolicyLocations) {
      config.enablePolicyLocations = true;
    }

    const policyEffectiveDateRaw =
      await this.policyRepository.getPolicyEffectiveDate(policyId);
    const effectiveDateValue = this.resolveEffectiveDate(
      policyEffectiveDateRaw,
    );

    const fieldList: DataTemplateField[] = MandatoryDataIntakeFields.map(
      (f) => ({ ...f }),
    );
    if (config?.components) {
      for (const comp of config.components) {
        if (comp.sumInsuredModel === "MULTIPLE" && comp.siMultipleLabel) {
          if (!fieldList.find((f) => f.fieldName === comp.siMultipleLabel)) {
            fieldList.push({
              fieldName: comp.siMultipleLabel,
              fieldType: "number",
              options: null,
            });
          }
        }
      }
    }

    if (config?.parameters) {
      for (const param of config.parameters) {
        if (
          param.parameterMasterName === "Age" ||
          param.type === "relation" ||
          param.type === "max-dependent-count"
        ) {
          continue;
        }
        if (!param.displayName) continue;
        if (fieldList.find((f) => f.fieldName === param.displayName)) continue;
        const field: DataTemplateField = {
          fieldName: param.displayName,
          fieldType: param.type === "range" ? "number" : "list",
          options:
            param.type === "range"
              ? null
              : (param.lovDetails ?? []).map((o: any) => o.value),
        };
        fieldList.push(field);
      }
    }

    if (this.shouldIncludeRelationshipGroupField(config)) {
      if (
        !fieldList.some(
          (field) =>
            field.fieldName === this.getIncludedRelationshipFieldName(config),
        )
      ) {
        fieldList.push({
          fieldName:
            this.getIncludedRelationshipFieldName(config) ??
            RELATIONSHIP_GROUP_FIELD_NAME,
          fieldType: "string",
          options: null,
        });
      }
    }

    if (this.isSezConstraintEnabled(config)) {
      const hasSezField = fieldList.some(
        (field) => field.fieldName === SEZ_APPLICABLE_FIELD_NAME,
      );
      if (!hasSezField) {
        fieldList.push(this.buildSezApplicableField());
      }
    }

    const maxDependentCountParam = this.getMaxDependentCountParam(config);
    if (maxDependentCountParam?.maxDependentCountConfig?.options?.length) {
      const mdcFieldName = maxDependentCountParam.displayName?.trim() || "Max Dependent Count";
      if (!fieldList.some((field) => field.fieldName === mdcFieldName)) {
        fieldList.push(this.buildMaxDependentCountField(maxDependentCountParam));
      }
    }

    // Add Policy Location field when enabled
    if (config?.enablePolicyLocations === true) {
      if (!fieldList.some((f) => f.fieldName === POLICY_LOCATION_FIELD_NAME)) {
        fieldList.push({ fieldName: POLICY_LOCATION_FIELD_NAME, fieldType: 'string', options: null });
      }
    }

    // Add Parental Lock column when parentalLockInPeriod is configured
    if ((config?.constraints?.parentalLockInPeriod ?? 0) > 0) {
      if (!fieldList.some((f) => f.fieldName === 'Parental Lock')) {
        fieldList.push({ fieldName: 'Parental Lock', fieldType: 'list', options: ['Yes', 'No'] });
      }
    }

    // Add user detail label columns from configuration
    const userDetailItems: { id: string; label: string }[] = config?.userDetailsSection?.items ?? [];
    for (const item of userDetailItems) {
      const label = item.label?.trim();
      if (label && !fieldList.some((f) => f.fieldName === label)) {
        fieldList.push({ fieldName: label, fieldType: 'string', options: null });
      }
    }

    const componentMap = new Map<string, any>();
    const policyFieldNames = new Set<string>();
    if (config?.components) {
      config.components.forEach((c: any) => componentMap.set(String(c.id), c));
      config.components.forEach((c: any) =>
        componentMap.set(String(c.type), c),
      );
    }

    const addPolicyFields = (tpl: any) => {
      if (!tpl) return;
      const mainComp = componentMap.get(String(tpl.mainPolicyId));
      if (mainComp) {
        fieldList.push({
          fieldName: mainComp.label,
          fieldType: "string",
          options: null,
          example: "Yes/No",
        });
        fieldList.push({
          fieldName: `${mainComp.label} Sum Insured`,
          fieldType: "number",
          options: null,
        });
        policyFieldNames.add(mainComp.label);
        policyFieldNames.add(`${mainComp.label} Sum Insured`);
      }
      tpl?.addonIds?.forEach((a: any) => {
        const addonComp = componentMap.get(String(a.optionId));
        if (addonComp) {
          const prefix = mainComp ? mainComp.label : String(tpl.mainPolicyId);
          fieldList.push({
            fieldName: `${prefix} Addon - ${addonComp.label}`,
            fieldType: "string",
            options: null,
            example: "Yes/No",
          });
          fieldList.push({
            fieldName: `${prefix} Addon - ${addonComp.label} Sum Insured`,
            fieldType: "number",
            options: null,
          });
          policyFieldNames.add(`${prefix} Addon - ${addonComp.label}`);
          policyFieldNames.add(
            `${prefix} Addon - ${addonComp.label} Sum Insured`,
          );
        }
      });
    };

    if (config?.policyTemplate) {
      addPolicyFields(config.policyTemplate.basePolicy);
      addPolicyFields(config.policyTemplate.parentalPolicy);
    }
    const relationParam = config.parameters?.find(
      (p: any) => p.type === "relation",
    );
    const relationGroupOptions = this.getRelationGroupOptions(config);

    const getSumInsured = (comp: any, id: number) => {
      const match = comp?.sumInsuredOptions?.find((o: any) => o.id === id);
      return match ? match.value : "";
    };

    const buildPolicyValues = (option: any) => {
      const values: Record<string, string | number> = {};

      const fillValues = (tpl: any, mainChoice: any, addonChoices: any[]) => {
        if (!tpl) return;
        const mainComp = componentMap.get(String(tpl.mainPolicyId));
        if (mainComp && mainChoice) {
          const label = mainComp.label;
          values[label] = "Yes";
          values[`${label} Sum Insured`] = getSumInsured(
            mainComp,
            mainChoice.sumInsuredId,
          );
        }
        tpl?.addonIds?.forEach((a: any) => {
          const addonComp = componentMap.get(String(a.optionId));
          if (addonComp) {
            const prefix = `${mainComp.label} Addon - ${addonComp.label}`;
            const addon = addonChoices.find(
              (ac: any) => ac.policyId === a.optionId,
            );
            const addonChoice =
              addon?.choices?.find((c: any) => c.isDefault) ||
              addon?.choices?.[0];
            values[prefix] = "Yes";
            if (addonChoice) {
              values[`${prefix} Sum Insured`] = getSumInsured(
                addonComp,
                addonChoice.sumInsuredId,
              );
            }
          }
        });
      };

      if (config.policyTemplate?.basePolicy) {
        const baseChoices =
          option?.basePolicyChoices?.mainPolicyChoices?.choices;
        const baseChoice =
          baseChoices?.find((c: any) => c.isDefault) || baseChoices?.[0];
        fillValues(
          config.policyTemplate.basePolicy,
          baseChoice,
          option?.basePolicyChoices?.addonChoices || [],
        );
      }
      if (config.policyTemplate?.parentalPolicy) {
        const pChoices =
          option?.parentalPolicyChoices?.mainPolicyChoices?.choices;
        const pChoice =
          pChoices?.find((c: any) => c.isDefault) || pChoices?.[0];
        fillValues(
          config.policyTemplate.parentalPolicy,
          pChoice,
          option?.parentalPolicyChoices?.addonChoices || [],
        );
      }
      return values;
    };

    const relationData: Record<string, any> = ENROLLMENT_RELATION_DATA;

    const generateRow = (
      relationName: string,
      employeeId: string,
      rowIdx: number,
      option: any,
      depIndex = 0,
      empIndex = 0,
      relationGroupLabel?: string,
    ): (string | number)[] => {
      const personTemplate = relationData[relationName] || relationData["Self"];
      const namesList = personTemplate.names || [];
      const nameIdx = relationName === "Self" ? empIndex : depIndex - 1;
      const baseName = namesList.length
        ? namesList[nameIdx % namesList.length]
        : "Sample Name";
      const fullName = `${baseName} Fake`;
      const policyValues =
        relationName === "Self" ? buildPolicyValues(option) : {};
      return fieldList.map((f) => {
        const name = f.fieldName;
        const lower = name.toLowerCase();
        if (name === "Intake Type") return "ADDITION";
        if (name === "Employee ID") return employeeId;
        if (name === "Full Name") return fullName;
        if (name === "Date of Birth") return personTemplate.dob;
        if (name === "Gender") return personTemplate.gender;
        if (lower === "claim status") return "No";
        if (lower.includes("email"))
          return `user${empIndex + 1}${
            depIndex ? `.${depIndex}` : ""
          }@example.com`;
        if (lower.includes("mobile") || lower.includes("phone"))
          return String(9000000000 + empIndex * 10 + depIndex);
        if (name === "Effective Date") return effectiveDateValue;
        if (name === RELATIONSHIP_GROUP_FIELD_NAME) {
          return relationGroupLabel ?? "";
        }
        if (name === "Relation") return personTemplate.relation;
        if (name === SEZ_APPLICABLE_FIELD_NAME) {
          return relationName === "Self" ? "Yes" : "No";
        }
        if (
          maxDependentCountParam?.maxDependentCountConfig?.options?.length &&
          name === (maxDependentCountParam.displayName?.trim() || "Max Dependent Count")
        ) {
          // Only meaningful on the employee's own row — dependents don't carry it.
          return relationName === "Self"
            ? maxDependentCountParam.maxDependentCountConfig.options[0]?.label ?? ""
            : "";
        }
        if (policyValues[name] !== undefined) return policyValues[name];
        if (policyFieldNames.has(name)) return "";
        if (f.fieldType === "list" && f.options?.length) return f.options[0];
        if (f.fieldType === "number") return rowIdx + 1;
        return `${name} ${rowIdx + 1}`;
      });
    };

    const dataRows: (string | number)[][] = [];
    let rowIndex = 0;
    let employeeCounter = 0;
    if (relationParam?.relationGroupDetails?.length) {
      const groups = relationParam.relationGroupDetails;
      const groupsWithDeps = groups.filter((g: any) =>
        g.selectedRelations?.some((r: any) => r.selected && r.name !== "Self"),
      );
      const selfOnlyGroups = groups.filter(
        (g: any) =>
          !g.selectedRelations?.some(
            (r: any) => r.selected && r.name !== "Self",
          ),
      );

      for (const group of groupsWithDeps) {
        const option = (config.policyOptions || []).find((o: any) =>
          o.optionMeta?.some(
            (m: any) =>
              m.parameterId === relationParam.id &&
              m.parameterOptionId === group.id,
          ),
        );
        const relationGroupLabel =
          this.getRelationGroupLabel(
            group?.groupDisplayName || group?.name || group?.type,
          ) ||
          group?.groupDisplayName ||
          group?.name ||
          group?.type;
        const employeeId = this.generateEmployeeId(employeeCounter);
        dataRows.push(
          generateRow(
            "Self",
            employeeId,
            rowIndex++,
            option,
            0,
            employeeCounter,
            relationGroupLabel,
          ),
        );
        let remaining = parseInt(group.familyMaxCount);
        if (isNaN(remaining)) remaining = Infinity;
        const relations = (group.selectedRelations || [])
          .filter((r: any) => r.selected && r.name !== "Self")
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        for (const rel of relations) {
          let count = parseInt(rel.maxCount);
          if (isNaN(count) || count < 1) count = 1;
          const relConfig = config.relationships?.enabledPolicyRelations?.find(
            (r: any) => r.type === rel.name && r.enabled,
          );
          const enabledOptions =
            relConfig?.configuredOptions
              ?.filter((o: any) => o.enabled)
              .map((o: any) => o.name) || [];
          const names = enabledOptions.slice(0, count);
          if (!names.length) {
            names.push(rel.name);
          }
          for (let idx = 0; idx < names.length && remaining > 0; idx++) {
            dataRows.push(
              generateRow(
                names[idx],
                employeeId,
                rowIndex++,
                option,
                idx + 1,
                employeeCounter,
                relationGroupLabel,
              ),
            );
            if (remaining !== Infinity) remaining -= 1;
          }
          if (remaining <= 0) break;
        }
        employeeCounter++;
      }

      for (const group of selfOnlyGroups) {
        const option = (config.policyOptions || []).find((o: any) =>
          o.optionMeta?.some(
            (m: any) =>
              m.parameterId === relationParam.id &&
              m.parameterOptionId === group.id,
          ),
        );
        const relationGroupLabel =
          this.getRelationGroupLabel(
            group?.groupDisplayName || group?.name || group?.type,
          ) ||
          group?.groupDisplayName ||
          group?.name ||
          group?.type;
        const employeeId = this.generateEmployeeId(employeeCounter);
        dataRows.push(
          generateRow(
            "Self",
            employeeId,
            rowIndex++,
            option,
            0,
            employeeCounter,
            relationGroupLabel,
          ),
        );
        employeeCounter++;
      }
    } else {
      const option = (config.policyOptions || [])[0];
      for (let i = 0; i < 10; i++) {
        const employeeId = this.generateEmployeeId(i);
        dataRows.push(
          generateRow("Self", employeeId, rowIndex++, option, 0, i),
        );
      }
    }

    const wb = XLSX.utils.book_new();
    const headerRow = fieldList.map((f) => f.fieldName);
    const mainSheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    XLSX.utils.book_append_sheet(wb, mainSheet, "Template");
    const helperRelationOptions =
      this.getEnabledRelationshipOptionNames(config);

    const additionHelperRows =
      templateHelperMessages.enrollmentAdditionPremiumRows.map((line) => [
        line,
      ]);
    const deletionHelperRows =
      templateHelperMessages.enrollmentDeletionPremiumRows.map((line) => [
        line,
      ]);
    const helperRows = [
      fieldList.map((f) => f.fieldName),
      fieldList.map((f) => f.fieldType),
      fieldList.map((f) =>
        f.fieldName === "Relation" && helperRelationOptions.length
          ? helperRelationOptions.join(",")
          : f.fieldName === RELATIONSHIP_GROUP_FIELD_NAME &&
            relationGroupOptions.length
          ? relationGroupOptions.join(",")
          : f.fieldType === "list"
          ? (f.options || []).join(",")
          : f.example || "",
      ),
      [""],
      [""],
      ...additionHelperRows,
      [""],
      ...deletionHelperRows,
    ];
    const helperSheet = XLSX.utils.aoa_to_sheet(helperRows);
    XLSX.utils.book_append_sheet(wb, helperSheet, "Template Helper");

    const targetKey = existingUpload?.fileKey || key;
    const targetFileName = path.basename(targetKey);
    let buffer: Buffer | null = null;
    let fileUploadEntry: FileUpload | null =
      existingUpload ||
      (await this.policyRepository.getFileUploadByKey(targetKey));
    buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    if (this.repoMode === "AWS") {
      try {
        const putRes = await this.s3
          .putObject({ Bucket: this.bucket, Key: targetKey, Body: buffer })
          .promise();
        if (!putRes?.ETag) {
          throw new Error("Missing ETag");
        }
      } catch (err) {
        throw new InternalServerErrorException(
          "Failed to upload template to S3",
        );
      }
    } else {
      const sanitizedTargetKey = sanitizePath(targetKey, this.docRepoPath);
      const targetPath = path.join(this.docRepoPath, sanitizedTargetKey);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, buffer);
    }
    if (!fileUploadEntry) {
      fileUploadEntry = await this.policyRepository.createFileUploadRecord({
        fileKey: targetKey,
        companyType: "policy",
        companyId: policyId,
        uploadType: this.repoMode === "AWS" ? "AWS" : "LFS",
        documentTypeLid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 0,
        updatedBy: 0,
        deletedAt: null,
      });
    }
    if (fileUploadEntry) {
      const existingMap =
        await this.policyRepository.findEnrollmentTemplateDocMap(policyId);
      if (!existingMap) {
        await this.policyRepository.createEnrollmentTemplateDocMap(
          policyId,
          fileUploadEntry.id,
        );
      } else if (existingMap.documentId !== fileUploadEntry.id) {
        await this.policyRepository.updateEnrollmentTemplateDocMapDocumentId(
          policyId,
          fileUploadEntry.id,
        );
      }
    }
    return {
      documentId: fileUploadEntry?.id as number,
      fileName: targetFileName,
    };
  }

  async generateEnrollmentMappedTemplate(policyId: number, mappings: any[]): Promise<{
    documentId: number;
    fileName: string;
  }> {
    let policyConfigEntity =
      await this.policyRepository.getLivePolicyConfiguration(policyId);
    if (!policyConfigEntity) {
      if (!(await this.isPolicyEnrolmentPremiumBased(policyId))) {
        throw new BadRequestException("Configuration is not live");
      }
      policyConfigEntity = { policyConfiguration: {} } as any;
    }

    const isMapped = mappings.length > 0;

    const effectiveEnablePolicyLocationsMapped =
      policyConfigEntity.policyConfiguration?.enablePolicyLocations === true;

    let existingUpload: FileUpload | null = null;
    const fileName = `policy-${policyId}-${Date.now()}-MAPPED_ENROLLMENT_TEMPLATE.xlsx`;
    const key = `uploads/company/policy/templates/${fileName}`;

    const existingMap =
      await this.policyRepository.findEnrollmentTemplateDocMap(policyId);
      if (existingMap && existingMap.mappedDocumentId) {
      existingUpload = await this.policyRepository.getFileUploadById(
        existingMap.mappedDocumentId,
      );
      const hasClaimStatus = existingUpload
        ? await this.enrollmentTemplateHasClaimStatus(existingUpload.fileKey, mappings)
        : false;
      const hasPremiumHelper = existingUpload
        ? await this.enrollmentTemplateHasPremiumHelper(existingUpload.fileKey)
        : false;
      const hasLegacyAddressCodeHeader = existingUpload
        ? await this.enrollmentTemplateHasLegacyAddressCodeHeader(
            existingUpload.fileKey,
          )
        : false;
      const hasLocationCodeMapped =
        existingUpload && effectiveEnablePolicyLocationsMapped
          ? await this.enrollmentTemplateHasLocationCodeHeader(existingUpload.fileKey)
          : true;
      if (
        existingUpload &&
        hasClaimStatus &&
        hasPremiumHelper &&
        !hasLegacyAddressCodeHeader &&
        hasLocationCodeMapped
      ) {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "PolicyService",
              method: "generateEnrollmentMappedTemplate",
              payload: {},
              messageData: "Existing mapped template found, returning existing document",
            }),
          });
        return {
          documentId: existingMap.mappedDocumentId,
          fileName: path.basename(existingUpload.fileKey),
        };
      }
    }

    const config: any = policyConfigEntity.policyConfiguration;
    if (effectiveEnablePolicyLocationsMapped) {
      config.enablePolicyLocations = true;
    }

    const policyEffectiveDateRaw =
      await this.policyRepository.getPolicyEffectiveDate(policyId);
    const effectiveDateValue = this.resolveEffectiveDate(
      policyEffectiveDateRaw,
    );

    const {fieldList, componentMap} = this.buildEnrollmentTemplateFieldList(
      policyConfigEntity.policyConfiguration,
    );

    const relationParam = config.parameters?.find(
      (p: any) => p.type === "relation",
    );
    const relationGroupOptions = this.getRelationGroupOptions(config);

    const getSumInsured = (comp: any, id: number) => {
      const match = comp?.sumInsuredOptions?.find((o: any) => o.id === id);
      return match ? match.value : "";
    };

    const buildPolicyValues = (option: any) => {
      const values: Record<string, string | number> = {};

      const fillValues = (tpl: any, mainChoice: any, addonChoices: any[]) => {
        if (!tpl) return;
        const mainComp = componentMap.get(String(tpl.mainPolicyId));
        if (mainComp && mainChoice) {
          const label = mainComp.label;
          values[label] = "Yes";
          values[`${label} Sum Insured`] = getSumInsured(
            mainComp,
            mainChoice.sumInsuredId,
          );
        }
        tpl?.addonIds?.forEach((a: any) => {
          const addonComp = componentMap.get(String(a.optionId));
          if (addonComp) {
            const prefix = `${mainComp.label} Addon - ${addonComp.label}`;
            const addon = addonChoices.find(
              (ac: any) => ac.policyId === a.optionId,
            );
            const addonChoice =
              addon?.choices?.find((c: any) => c.isDefault) ||
              addon?.choices?.[0];
            values[prefix] = "Yes";
            if (addonChoice) {
              values[`${prefix} Sum Insured`] = getSumInsured(
                addonComp,
                addonChoice.sumInsuredId,
              );
            }
          }
        });
      };

      if (config.policyTemplate?.basePolicy) {
        const baseChoices =
          option?.basePolicyChoices?.mainPolicyChoices?.choices;
        const baseChoice =
          baseChoices?.find((c: any) => c.isDefault) || baseChoices?.[0];
        fillValues(
          config.policyTemplate.basePolicy,
          baseChoice,
          option?.basePolicyChoices?.addonChoices || [],
        );
      }
      if (config.policyTemplate?.parentalPolicy) {
        const pChoices =
          option?.parentalPolicyChoices?.mainPolicyChoices?.choices;
        const pChoice =
          pChoices?.find((c: any) => c.isDefault) || pChoices?.[0];
        fillValues(
          config.policyTemplate.parentalPolicy,
          pChoice,
          option?.parentalPolicyChoices?.addonChoices || [],
        );
      }
      return values;
    };

    const relationData: Record<string, any> = ENROLLMENT_RELATION_DATA;

    const snakeToTitle = (input: string) => {
      if (!input) return "";

      return input
        .replace(/_-_/g, " - ")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const generateRow = (
      relationName: string,
      employeeId: string,
      rowIdx: number,
      option: any,
      depIndex = 0,
      empIndex = 0,
      relationGroupLabel?: string,
    ): (string | number)[] => {
      const personTemplate = relationData[relationName] || relationData["Self"];
      const namesList = personTemplate.names || [];
      const nameIdx = relationName === "Self" ? empIndex : depIndex - 1;
      const baseName = namesList.length
        ? namesList[nameIdx % namesList.length]
        : "Sample Name";
      const fullName = `${baseName} Fake`;
      const policyValues =
        relationName === "Self" ? buildPolicyValues(option) : {};
      const normalizedHeader = (header: string) =>
        header.toLowerCase().replace(/[\s_]+/g, "");

      return isMapped
        ? mappings.map((mapping: any) => {
            const sourceColumn = normalizedHeader(mapping.source_column_name);

            // Find the target column correspoding to source column in the mappings
            const mappingInfo = mappings.find(
              (m: any) =>
                normalizedHeader(m.source_column_name) === sourceColumn,
            );
            const targetColumn = mappingInfo ? mappingInfo?.target_column_name : null;
            const config = mappingInfo ? mappingInfo?.transformation_config: null;
            
            if (targetColumn) {
              // const normalizedTarget = normalizedHeader(targetColumn);
              if (targetColumn === "intake_type") return "ADDITION";
              if (targetColumn === "employee_id") return employeeId;
              if (targetColumn === "full_name") return fullName;
              if (targetColumn === "date_of_birth") return personTemplate.dob;
              if (targetColumn === "gender") return personTemplate.gender;
              if (targetColumn === "claim_status") return "No";
              if (targetColumn.includes("email"))
                return `user${empIndex + 1}${
                  depIndex ? `.${depIndex}` : ""
                }@example.com`;
              if (
                targetColumn.includes("mobile") ||
                targetColumn.includes("phone")
              )
                return String(9000000000 + empIndex * 10 + depIndex);
              if (targetColumn === "effective_date")
                return effectiveDateValue;
              if (
                targetColumn === 'relationship_group'
              ) {
                return relationGroupLabel ?? "";
              }
              if (targetColumn === "relation")
                return personTemplate.relation;
              if (
                targetColumn.toLowerCase() === SEZ_APPLICABLE_FIELD_NAME.toLowerCase()
              ) {
                return relationName === "Self" ? "Yes" : "No";
              }
              if(targetColumn === 'policy_location')
                return `${POLICY_LOCATION_FIELD_NAME} ${rowIdx + 1}`
              const snakeToTitleColumn = snakeToTitle(targetColumn);
              if (policyValues[snakeToTitleColumn] !== undefined) {
                return policyValues[snakeToTitleColumn];
              }
              const listFields = fieldList.filter((f: DataTemplateField) => f.fieldType === "list");
              const foundListField = listFields.find((f: DataTemplateField) => normalizedHeader(f.fieldName) === normalizedHeader(targetColumn));
              if (foundListField) {
                return foundListField.options && foundListField.options.length > 0 ? foundListField.options[0] : "";
              }
              if (config.type.toLowerCase() === "number" && !targetColumn.includes('policy')) return rowIdx + 1; // Don't add number values for policy fields as they are dynamic based on the option selected
              return "";
            }
          })
        : [];
    };

    const dataRows: (string | number)[][] = [];
    let rowIndex = 0;
    let employeeCounter = 0;
    if (relationParam?.relationGroupDetails?.length) {
      const groups = relationParam.relationGroupDetails;
      const groupsWithDeps = groups.filter((g: any) =>
        g.selectedRelations?.some((r: any) => r.selected && r.name !== "Self"),
      );
      const selfOnlyGroups = groups.filter(
        (g: any) =>
          !g.selectedRelations?.some(
            (r: any) => r.selected && r.name !== "Self",
          ),
      );

      for (const group of groupsWithDeps) {
        const option = (config.policyOptions || []).find((o: any) =>
          o.optionMeta?.some(
            (m: any) =>
              m.parameterId === relationParam.id &&
              m.parameterOptionId === group.id,
          ),
        );
        const relationGroupLabel =
          this.getRelationGroupLabel(
            group?.groupDisplayName || group?.name || group?.type,
          ) ||
          group?.groupDisplayName ||
          group?.name ||
          group?.type;
        const employeeId = this.generateEmployeeId(employeeCounter);
        dataRows.push(
          generateRow(
            "Self",
            employeeId,
            rowIndex++,
            option,
            0,
            employeeCounter,
            relationGroupLabel,
          ),
        );
        let remaining = parseInt(group.familyMaxCount);
        if (isNaN(remaining)) remaining = Infinity;
        const relations = (group.selectedRelations || [])
          .filter((r: any) => r.selected && r.name !== "Self")
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        for (const rel of relations) {
          let count = parseInt(rel.maxCount);
          if (isNaN(count) || count < 1) count = 1;
          const relConfig = config.relationships?.enabledPolicyRelations?.find(
            (r: any) => r.type === rel.name && r.enabled,
          );
          const enabledOptions =
            relConfig?.configuredOptions
              ?.filter((o: any) => o.enabled)
              .map((o: any) => o.name) || [];
          const names = enabledOptions.slice(0, count);
          if (!names.length) {
            names.push(rel.name);
          }
          for (let idx = 0; idx < names.length && remaining > 0; idx++) {
            dataRows.push(
              generateRow(
                names[idx],
                employeeId,
                rowIndex++,
                option,
                idx + 1,
                employeeCounter,
                relationGroupLabel,
              ),
            );
            if (remaining !== Infinity) remaining -= 1;
          }
          if (remaining <= 0) break;
        }
        employeeCounter++;
      }

      for (const group of selfOnlyGroups) {
        const option = (config.policyOptions || []).find((o: any) =>
          o.optionMeta?.some(
            (m: any) =>
              m.parameterId === relationParam.id &&
              m.parameterOptionId === group.id,
          ),
        );
        const relationGroupLabel =
          this.getRelationGroupLabel(
            group?.groupDisplayName || group?.name || group?.type,
          ) ||
          group?.groupDisplayName ||
          group?.name ||
          group?.type;
        const employeeId = this.generateEmployeeId(employeeCounter);
        dataRows.push(
          generateRow(
            "Self",
            employeeId,
            rowIndex++,
            option,
            0,
            employeeCounter,
            relationGroupLabel,
          ),
        );
        employeeCounter++;
      }
    } else {
      const option = (config.policyOptions || [])[0];
      for (let i = 0; i < 10; i++) {
        const employeeId = this.generateEmployeeId(i);
        dataRows.push(
          generateRow("Self", employeeId, rowIndex++, option, 0, i),
        );
      }
    }

    const wb = XLSX.utils.book_new();
    const mappedSourceNames = new Set(mappings.map((m: any) => (m.source_column_name as string).toLowerCase()));
    const userDetailExtraColumns: string[] = (config?.userDetailsSection?.items ?? [])
      .map((item: { label?: string }) => item.label?.trim() ?? '')
      .filter((label: string) => label && !mappedSourceNames.has(label.toLowerCase()));
    const headerRow = [
      ...mappings.map((m: any) => m.source_column_name),
      ...userDetailExtraColumns,
    ];
    const paddedDataRows = dataRows.map((row) => [
      ...row,
      ...userDetailExtraColumns.map(() => ''),
    ]);
    const mainSheet = XLSX.utils.aoa_to_sheet([headerRow, ...paddedDataRows]);
    XLSX.utils.book_append_sheet(wb, mainSheet, "Template");
    const helperRelationOptions =
      this.getEnabledRelationshipOptionNames(config);

    const additionHelperRows =
      templateHelperMessages.enrollmentAdditionPremiumRows.map((line) => [
        line,
      ]);
    const deletionHelperRows =
      templateHelperMessages.enrollmentDeletionPremiumRows.map((line) => [
        line,
      ]);
    const helperRows = [
      fieldList.map((f) => f.fieldName),
      fieldList.map((f) => f.fieldType),
      fieldList.map((f) =>
        f.fieldName === "Relation" && helperRelationOptions.length
          ? helperRelationOptions.join(",")
          : f.fieldName === RELATIONSHIP_GROUP_FIELD_NAME &&
            relationGroupOptions.length
          ? relationGroupOptions.join(",")
          : f.fieldType === "list"
          ? (f.options || []).join(",")
          : f.example || "",
      ),
      [""],
      [""],
      ...additionHelperRows,
      [""],
      ...deletionHelperRows,
    ];
    const helperSheet = XLSX.utils.aoa_to_sheet(helperRows);
    XLSX.utils.book_append_sheet(wb, helperSheet, "Template Helper");
    
    const targetKey = key;
    const targetFileName = path.basename(targetKey);
    let buffer: Buffer | null = null;
    let fileUploadEntry: FileUpload | null = null;
    buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    if (this.repoMode === "AWS") {
      try {
        const putRes = await this.s3
          .putObject({ Bucket: this.bucket, Key: targetKey, Body: buffer })
          .promise();
        if (!putRes?.ETag) {
          throw new Error("Missing ETag");
        }
      } catch (err) {
        throw new InternalServerErrorException(
          "Failed to upload template to S3",
        );
      }
    } else {
      const targetPath = path.join(this.docRepoPath, targetKey);
      if (!path.resolve(targetPath).startsWith(path.resolve(this.docRepoPath) + path.sep)) {
        throw new BadRequestException('Invalid file path');
      }
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, buffer);
    }
    if (!fileUploadEntry) {
      fileUploadEntry = await this.policyRepository.createFileUploadRecord({
        fileKey: targetKey,
        companyType: "policy",
        companyId: policyId,
        uploadType: this.repoMode === "AWS" ? "AWS" : "LFS",
        documentTypeLid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 0,
        updatedBy: 0,
        deletedAt: null,
      });
    }
    if (fileUploadEntry) {
      const existingMap =
        await this.policyRepository.findEnrollmentTemplateDocMap(policyId);
      // Insert when there is no existing mapping document
      if (!existingMap) {
          await this.policyRepository.createEnrollmentTemplateDocMap(
          policyId,
          fileUploadEntry.id,
          isMapped
        );
      }
      else {
        await this.policyRepository.updateEnrollmentTemplateDocMap(
          policyId,
          fileUploadEntry.id,
        );
      } 
    }
    return {
      documentId: fileUploadEntry?.id as number,
      fileName: targetFileName,
    };
  }

  private isSezConstraintEnabled(config: any): boolean {
    if (!config) {
      return false;
    }
    const configuration = (config as { configuration?: unknown })
      ?.configuration;
    const constraints =
      (config as { constraints?: Record<string, unknown> })?.constraints ??
      (configuration as { constraints?: Record<string, unknown> })
        ?.constraints ??
      (config as { policyConstraints?: Record<string, unknown> })
        ?.policyConstraints ??
      (configuration as { policyConstraints?: Record<string, unknown> })
        ?.policyConstraints;

    if (!constraints) {
      return false;
    }
    const rawValue = constraints.sezApplicable;
    if (typeof rawValue === "boolean") {
      return rawValue;
    }
    if (typeof rawValue === "string") {
      const normalized = rawValue.trim().toLowerCase();
      return (
        normalized === "true" || normalized === "yes" || normalized === "1"
      );
    }
    if (typeof rawValue === "number") {
      return rawValue === 1;
    }
    return false;
  }

  private buildSezApplicableField(): DataTemplateField {
    return {
      fieldName: SEZ_APPLICABLE_FIELD_NAME,
      fieldType: "list",
      options: ["Yes", "No"],
    };
  }

  private getMaxDependentCountParam(config: any): any {
    return (config?.parameters || []).find(
      (p: any) =>
        p.type === MAX_DEPENDENT_COUNT_INTERNAL_TYPE ||
        p.internalType === MAX_DEPENDENT_COUNT_INTERNAL_TYPE,
    );
  }

  private buildMaxDependentCountField(param: any): DataTemplateField {
    const options = (param?.maxDependentCountConfig?.options || [])
      .map((opt: any) => String(opt.label ?? "").trim())
      .filter((label: string) => label.length > 0);
    return {
      fieldName: param?.displayName?.trim() || "Max Dependent Count",
      fieldType: "list",
      options,
    };
  }

  private formatDateForTemplate(
    dateInput?: Date | string | null,
  ): string | null {
    if (!dateInput) {
      return null;
    }
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return null;
    }
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private resolveEffectiveDate(dateInput?: Date | string | null): string {
    const formatted = this.formatDateForTemplate(dateInput);
    if (formatted) {
      return formatted;
    }
    const fallback = this.formatDateForTemplate(new Date());
    return fallback || "1970-01-01";
  }

  private async enrollmentTemplateHasClaimStatus(
    fileKey: string,
    mappings?: any[],
  ): Promise<boolean> {
    try {
      let buffer: Buffer | null = null;
      if (this.repoMode === "AWS") {
        const data = await this.s3
          .getObject({ Bucket: this.bucket, Key: fileKey })
          .promise();
        if (!data?.Body) {
          return false;
        }
        buffer = Buffer.isBuffer(data.Body)
          ? data.Body
          : Buffer.from(data.Body as ArrayBuffer);
      } else {
        const sanitizedFileKey = sanitizePath(fileKey, this.docRepoPath);
        const filePath = path.join(this.docRepoPath, sanitizedFileKey);
        if (!fs.existsSync(filePath)) {
          return false;
        }
        buffer = fs.readFileSync(filePath);
      }

      if (!buffer?.length) {
        return false;
      }

      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets["Template"];
      if (!sheet) {
        return false;
      }
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as
        | string[][]
        | undefined;
      const headerRow = rows?.[0];
      if (!Array.isArray(headerRow)) {
        return false;
      }
      if (mappings && mappings.length > 0) {
        const mappedSourceColumn = mappings.find((mapping: any) => mapping.target_column_name.toLowerCase() === "claim_status")?.source_column_name;
        return headerRow.some(
          (cell) => String(cell).trim().toLowerCase() === mappedSourceColumn?.toLowerCase(),
        );
      }
      return headerRow.some(
        (cell) => String(cell).trim().toLowerCase() === "claim status",
      );
    } catch (error) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "enrollmentTemplateHasClaimStatus",
          payload: { fileKey },
          messageData: error,
        }),
      });
      return false;
    }
  }

  /**
   * Returns true if the cached enrollment template's first sheet still
   * contains the legacy "Address Code" column header. Used to invalidate
   * old cached templates after the rename to "Location Code" so the file
   * is regenerated with the new header on next download.
   */
  private async enrollmentTemplateHasLegacyAddressCodeHeader(
    fileKey: string,
  ): Promise<boolean> {
    try {
      let buffer: Buffer | null = null;
      if (this.repoMode === "AWS") {
        const data = await this.s3
          .getObject({ Bucket: this.bucket, Key: fileKey })
          .promise();
        if (!data?.Body) return false;
        buffer = Buffer.isBuffer(data.Body)
          ? data.Body
          : Buffer.from(data.Body as ArrayBuffer);
      } else {
        const sanitizedFileKey = sanitizePath(fileKey, this.docRepoPath);
        const filePath = path.join(this.docRepoPath, sanitizedFileKey);
        if (!fs.existsSync(filePath)) return false;
        buffer = fs.readFileSync(filePath);
      }
      if (!buffer?.length) return false;

      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) return false;
      const headerRow = (XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
      }) as string[][])?.[0];
      if (!Array.isArray(headerRow)) return false;
      return headerRow.some(
        (cell) => String(cell ?? "").trim().toLowerCase() === "address code"
      );
    } catch (error) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "enrollmentTemplateHasLegacyAddressCodeHeader",
          payload: { fileKey },
          messageData: error,
        }),
      });
      return false;
    }
  }

  private async enrollmentTemplateHasLocationCodeHeader(
    fileKey: string,
  ): Promise<boolean> {
    try {
      let buffer: Buffer | null = null;
      if (this.repoMode === "AWS") {
        const data = await this.s3
          .getObject({ Bucket: this.bucket, Key: fileKey })
          .promise();
        if (!data?.Body) return false;
        buffer = Buffer.isBuffer(data.Body)
          ? data.Body
          : Buffer.from(data.Body as ArrayBuffer);
      } else {
        const sanitizedFileKey = sanitizePath(fileKey, this.docRepoPath);
        const filePath = path.join(this.docRepoPath, sanitizedFileKey);
        if (!fs.existsSync(filePath)) return false;
        buffer = fs.readFileSync(filePath);
      }
      if (!buffer?.length) return false;

      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) return false;
      const headerRow = (XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
      }) as string[][])?.[0];
      if (!Array.isArray(headerRow)) return false;
      return headerRow.some(
        (cell) => String(cell ?? "").trim().toLowerCase() === POLICY_LOCATION_FIELD_NAME.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  private async enrollmentTemplateHasPremiumHelper(
    fileKey: string,
  ): Promise<boolean> {
    try {
      let buffer: Buffer | null = null;
      if (this.repoMode === "AWS") {
        const data = await this.s3
          .getObject({ Bucket: this.bucket, Key: fileKey })
          .promise();
        if (!data?.Body) {
          return false;
        }
        buffer = Buffer.isBuffer(data.Body)
          ? data.Body
          : Buffer.from(data.Body as ArrayBuffer);
      } else {
        const sanitizedFileKey = sanitizePath(fileKey, this.docRepoPath);
        const filePath = path.join(this.docRepoPath, sanitizedFileKey);
        if (!fs.existsSync(filePath)) {
          return false;
        }
        buffer = fs.readFileSync(filePath);
      }

      if (!buffer?.length) {
        return false;
      }

      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets["Template Helper"];
      if (!sheet) {
        return false;
      }
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as
        | string[][]
        | undefined;
      if (!Array.isArray(rows)) {
        return false;
      }
      const hasAddition = rows.some((row) =>
        Array.isArray(row)
          ? row.some(
              (cell) =>
                String(cell).trim().toLowerCase() ===
                "addition premium calculation:",
            )
          : false,
      );
      const hasDeletion = rows.some((row) =>
        Array.isArray(row)
          ? row.some(
              (cell) =>
                String(cell).trim().toLowerCase() ===
                "deletion premium calculation:",
            )
          : false,
      );
      return hasAddition && hasDeletion;
    } catch (error) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "enrollmentTemplateHasPremiumHelper",
          payload: { fileKey },
          messageData: error,
        }),
      });
      return false;
    }
  }

  async downloadTemplateByDocumentId(
    documentId: number,
    userDetails: UserDetailsForPassword | null
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "downloadTemplateByDocumentId",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const fileUpload = await this.policyRepository.getFileUploadById(
        documentId,
      );
      if (!fileUpload) {
        throw new NotFoundException(
          `Template document not found for id ${documentId}`,
        );
      }
      const key = fileUpload.fileKey;
      const fileName = path.basename(key);

      console.log(`Downloading template file: ${fileName} from key: ${key}`);

      let buffer: Buffer;
      if (this.repoMode === "AWS") {
        const data = await this.s3
          .getObject({ Bucket: this.bucket, Key: key })
          .promise();
        buffer = (data.Body || Buffer.from([])) as Buffer;
      } else {
        const sanitizedKey = sanitizePath(key, this.docRepoPath);
        const filePath = path.join(this.docRepoPath, sanitizedKey);
        buffer = fs.readFileSync(filePath);
      }

      // Apply password protection
      const configClient = getFilePasswordConfigClient();
      const passwordConfig = await configClient.getConfiguration();
      const password = generatePasswordFromConfig(passwordConfig, userDetails);
      const isModulePasswordEnabled = await this.getModulePasswordConfig('inception');

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'info',
          location: 'PolicyService',
          method: 'downloadTemplateByDocumentId',
          payload: { documentId, moduleKey: 'inception', isModulePasswordEnabled, passwordType: passwordConfig?.passwordType },
          messageData: `Module password protection flag: ${isModulePasswordEnabled}, using ${passwordConfig?.passwordType || 'default'} password type`,
        }),
      });

      const protectedFile = await applyPasswordProtection(
        buffer,
        fileName,
        password,
        'inception',
        isModulePasswordEnabled
      );

      return {
        fileName: protectedFile.fileName,
        mimeType: protectedFile.mimeType,
        buffer: protectedFile.data,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "downloadTemplateByDocumentId",
          payload: { documentId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getPremiumCalculationDownload(
    policyId: number,
    endorsementId: number,
  ): Promise<{ fileName: string; mimeType: string; buffer: Buffer }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "getPremiumCalculationDownload",
        payload: { policyId, endorsementId },
        messageData: "method invoked",
      }),
    });
    try {
      const fileId = await this.policyRepository.getEndorsementPremiumCalculationFileId(
        policyId,
        endorsementId,
      );
      if (!fileId) {
        throw new NotFoundException(
          `Premium calculation file not found for endorsement ${endorsementId}`,
        );
      }
      const fileUpload = await this.policyRepository.getFileUploadById(fileId);
      if (!fileUpload) {
        throw new NotFoundException(
          `File upload record not found for id ${fileId}`,
        );
      }
      const key = fileUpload.fileKey;
      const fileName = path.basename(key);
      if (this.repoMode === "AWS") {
        const data = await this.s3
          .getObject({ Bucket: this.bucket, Key: key })
          .promise();
        return {
          fileName,
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          buffer: (data.Body || Buffer.from([])) as Buffer,
        };
      }
      const filePath = path.join(this.docRepoPath, key);
      if (!path.resolve(filePath).startsWith(path.resolve(this.docRepoPath) + path.sep)) {
        throw new BadRequestException('Invalid file path');
      }
      const buffer = fs.readFileSync(filePath);
      return {
        fileName,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPremiumCalculationDownload",
          payload: { policyId, endorsementId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async prepareTPAUploadTemplate(
    policyId: number,
    endorsementId?: number,
  ): Promise<{ documentId: number; fileName: string }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "in-progress",
        location: "PolicyService",
        method: "prepareTPAUploadTemplate",
        payload: { policyId, endorsementId },
        messageData: "method invoked",
      }),
    });

    try {
      const { documentId, fileName } =
        await this.policyRepository.prepareTPAUploadTemplate(
          policyId,
          endorsementId,
        );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "prepareTPAUploadTemplate",
          payload: { policyId, endorsementId, documentId, fileName },
          messageData: "TPA upload template prepared successfully",
        }),
      });

      return {
        documentId,
        fileName,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "prepareTPAUploadTemplate",
          payload: { policyId, endorsementId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async createEnrollmentUpload(
    policyId: number,
    userId: number,
    documentId: number,
    documentType: string,
    employeeCount: number = 0,
    dependentCount: number = 0,
    endorsementId?: number,
    osTicketNumber?: string,
    endorsementType?: string,
    endorsementEntryDate?: string,
    enrollmentStartDate?: string,
    enrollmentEndDate?: string,
    isInception: boolean = false,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "createEnrollmentUpload",
        payload: { policyId, documentId, userId },
        messageData: "method invoked",
      }),
    });
    const bypassPolicyConfiguration =
      await this.shouldBypassPolicyConfigurationForInception(
        policyId,
        isInception,
        documentType,
      );
    if (bypassPolicyConfiguration) {
      await this.assertPolicyIsActive(policyId);
      if (!isInception) {
        await this.assertInceptionCompleted(policyId);
      }
    }
    return this.policyRepository.createEnrollmentUpload(
      policyId,
      userId,
      documentId,
      documentType,
      employeeCount,
      dependentCount,
      endorsementId,
      osTicketNumber,
      endorsementType,
      endorsementEntryDate,
      enrollmentStartDate,
      enrollmentEndDate,
      isInception,
      bypassPolicyConfiguration,
    );
  }

  async createAssetEnrollmentUpload(
    policyId: number,
    userId: number,
    documentId: number,
    documentType: string,
    assetCount: number = 0,
    subAssetCount: number = 0,
    endorsementId?: number,
    osTicketNumber?: string,
    endorsementType?: string,
    endorsementEntryDate?: string,
    isInception: boolean = false,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "createEnrollmentUpload",
        payload: { policyId, documentId, userId },
        messageData: "method invoked",
      }),
    });
    return this.policyRepository.createAssetEnrollmentUpload(
      policyId,
      userId,
      documentId,
      documentType,
      assetCount,
      subAssetCount,
      endorsementId,
      osTicketNumber,
      endorsementType,
      endorsementEntryDate,
      isInception,
    );
  }

  async getPolicyAssets(
    policyId: number,
    page: number,
    limit: number,
    search: string,
  ) {
    const normalizedSearch = search?.trim() ?? "";
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyAssets",
          payload: { policyId, page, limit },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.getPolicyAssets(
        policyId,
        page,
        limit,
        normalizedSearch,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyAssets",
          payload: { policyId, page, limit },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy assets.",
      );
    }
  }

  async getPolicySubAssets(
    policyId: number,
    page: number,
    limit: number,
    search: string,
  ) {
    const normalizedSearch = search?.trim() ?? "";
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicySubAssets",
          payload: { policyId, page, limit },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.getPolicySubAssets(
        policyId,
        page,
        limit,
        normalizedSearch,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicySubAssets",
          payload: { policyId, page, limit },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy sub-assets.",
      );
    }
  }

  async listEnrollmentUploadSummary(
    policyId: number,
    page: number,
    limit: number,
    endorsementId?: number,
    usePolicyAssetEndorsement?: string,
    tpaData?: string,
    sort?: string,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "listEnrollmentUploadSummary",
        payload: { policyId, page, limit, sort },
        messageData: "method invoked",
      }),
    });
    return this.policyRepository.listEnrollmentUploadSummary(
      policyId,
      page,
      limit,
      endorsementId,
      usePolicyAssetEndorsement,
      tpaData,
      sort,
    );
  }

  async processPolicyComponentUpload(
    dto: PolicyComponentUploadDto,
    requestUserId?: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "processPolicyComponentUpload",
          payload: { fileId: dto.fileId, onlyPolicyId: dto.onlyPolicyId },
          messageData: "method invoked",
        }),
      });

      const fileUpload = await this.policyRepository.getFileUploadById(
        dto.fileId,
      );
      if (!fileUpload) {
        throw new NotFoundException(`File with ID ${dto.fileId} not found`);
      }

      const buffer = await downloadFromS3(fileUpload.fileKey);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const [sheetName] = workbook.SheetNames;
      if (!sheetName) {
        throw new BadRequestException("Excel file has no sheets");
      }
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<PolicyComponentExcelRow>(sheet, {
        defval: null,
      });
      const rows = normalizePolicyComponentRows(rawRows);
      if (!rows.length) {
        throw new BadRequestException("No rows found in Excel file");
      }

      const filteredRows = dto.onlyPolicyId
        ? rows.filter(
            (row) =>
              parsePolicyComponentPolicyId(row.policy_id) === dto.onlyPolicyId,
          )
        : rows;

      const groupedRows = new Map<number, PolicyComponentExcelRow[]>();
      for (const row of filteredRows) {
        const policyId = parsePolicyComponentPolicyId(row.policy_id);
        if (!policyId) continue;
        if (!groupedRows.has(policyId)) groupedRows.set(policyId, []);
        groupedRows.get(policyId)?.push(row);
      }

      if (!groupedRows.size) {
        throw new BadRequestException(
          "No policies grouped. Check policy_id values in the sheet.",
        );
      }

      const result =
        await this.policyRepository.updatePolicyComponentConfigurationUpload({
          groupedRows,
          dryRun: POLICY_COMPONENT_UPLOAD_DEFAULTS.DRY_RUN,
          migrationUserId: POLICY_COMPONENT_UPLOAD_DEFAULTS.MIGRATION_USER_ID,
          clubSumInsuredTrueLid:
            POLICY_COMPONENT_UPLOAD_DEFAULTS.CLUB_SUM_INSURED_TRUE_LID,
          clubSumInsuredFalseLid:
            POLICY_COMPONENT_UPLOAD_DEFAULTS.CLUB_SUM_INSURED_FALSE_LID,
        });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "processPolicyComponentUpload",
          payload: {
            fileId: dto.fileId,
            onlyPolicyId: dto.onlyPolicyId,
            requestUserId,
          },
          messageData: "policy component upload processed",
        }),
      });

      return {
        ...result,
        fileId: dto.fileId,
        dryRun: POLICY_COMPONENT_UPLOAD_DEFAULTS.DRY_RUN,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "processPolicyComponentUpload",
          payload: { fileId: dto.fileId, onlyPolicyId: dto.onlyPolicyId },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to process policy component upload",
      );
    }
  }

  async uploadTpaIds(
    documentId: number,
    endorsementId: number,
    policyId: number,
    tpaAcknowledgedDate?: Date,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "queueTpaIdUpload",
          payload: {
            documentId,
            endorsementId,
            policyId,
            tpaAcknowledgedDate,
          },
          messageData: "method invoked",
        }),
      });
      if (!policyId) {
        throw new BadRequestException("policyId is required");
      }
      return await this.policyRepository.queueTpaIdUpload(
        documentId,
        endorsementId,
        policyId,
        tpaAcknowledgedDate,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "queueTpaIdUpload",
          payload: { documentId, endorsementId, policyId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to queue TPA upload",
      );
    }
  }

  async getTpaIdUploads(policyId: number, page: number, limit: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getTpaIdUploads",
          payload: { policyId, page, limit },
          messageData: "method invoked",
        }),
      });

      return await this.policyRepository.listTpaIdUploads(
        policyId,
        page,
        limit,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getTpaIdUploads",
          payload: { policyId, page, limit },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to fetch TPA uploads",
      );
    }
  }

  async uploadEndorsementTemplate(
    policyId: number,
    insurerId: number,
    documentId: number,
  ): Promise<void> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "uploadEndorsementTemplate",
          payload: { policyId, insurerId, documentId },
          messageData: "method invoked",
        }),
      });
      await this.policyRepository.createEndorsementTemplateDocMap(
        policyId,
        insurerId,
        documentId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "uploadEndorsementTemplate",
          payload: { policyId, insurerId, documentId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.endorsementTemplateUploadFailed,
      );
    }
  }

  async createEndorsementFieldMapping(
    insurerId: number,
    fieldMap: Record<string, string>,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "createEndorsementFieldMapping",
          payload: { insurerId },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.saveEndorsementFieldMapping(
        insurerId,
        fieldMap,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "createEndorsementFieldMapping",
          payload: { insurerId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.endorsementFieldMappingFailed,
      );
    }
  }

  async generateEndorsementExcel(
    policyId: number,
    insurerId: number,
    userId: number,
  ): Promise<string> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "generateEndorsementExcel",
          payload: { policyId, insurerId },
          messageData: "method invoked",
        }),
      });

      let template = await this.policyRepository.findEndorsementTemplateDocMap(
        policyId,
        insurerId,
      );
      if (!template) {
        template =
          await this.policyRepository.findAnyEndorsementTemplateDocMap();
        if (!template) {
          throw new NotFoundException(
            "No template available for endorsement creation",
          );
        }
      }
      const fileUpload = await this.policyRepository.getFileUploadById(
        template.documentId,
      );
      if (!fileUpload) {
        throw new NotFoundException("Template document not found");
      }
      const key = fileUpload.fileKey;
      let buffer: Buffer;
      if (this.repoMode === "AWS") {
        buffer = await downloadFromS3(key);
      } else {
        if (!this.docRepoPath || !key) {
          throw new Error(
            `Invalid file path configuration. DOCUMENT_REPO_PATH: ${this.docRepoPath}, key: ${key}`,
          );
        }
        const sanitizedKey = sanitizePath(key, this.docRepoPath);
        const filePath = path.join(this.docRepoPath, sanitizedKey);
        buffer = fs.readFileSync(filePath);
      }
      const fieldMapping =
        await this.policyRepository.getEndorsementFieldMapping(insurerId);
      const enrollments =
        await this.policyRepository.listEndorsementReadyEnrollments(policyId);
      if (enrollments.length === 0) {
        throw new NotFoundException("No employee is ready for endorsement");
      }
      const policy = await this.policyRepository.fetchPolicyById(policyId);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const headers = XLSX.utils.sheet_to_json<any[]>(
        workbook.Sheets[sheetName],
        { header: 1 },
      )[0] as string[];
      const normalizedHeaders = headers.map((h) =>
        h.toUpperCase().replace(/\s+/g, "_"),
      );
      if (!normalizedHeaders.includes(ENDORSEMENT_HEADERS.ENDORSEMENT_TYPE)) {
        headers.push("ENDORSEMENT TYPE");
      }
      // Append "Location Code" to the insurer file when the policy has
      // enablePolicyLocations turned on and the template hasn't already
      // included it. The row builder fills it from the per-row stored value.
      const policyConfigForExcel =
        await this.policyRepository.getLivePolicyConfiguration(policyId);
      const endorsementEnablePolicyLocations =
        (policyConfigForExcel?.policyConfiguration as any)
          ?.enablePolicyLocations === true;
      if (
        endorsementEnablePolicyLocations &&
        !normalizedHeaders.includes(ENDORSEMENT_HEADERS.ADDRESS_CODE)
      ) {
        headers.push(POLICY_LOCATION_FIELD_NAME);
      }
      const endorsementTypeHeader =
        headers.find(
          (h) =>
            h.toUpperCase().replace(/\s+/g, "_") ===
            ENDORSEMENT_HEADERS.ENDORSEMENT_TYPE,
        ) ?? "ENDORSEMENT TYPE";
      const resolvePath = (obj: any, p: string): any =>
        p.split(".").reduce((acc, part) => acc?.[part], obj);
      const placementSlipForRow =
        await this.policyRepository.getPlacementSlipDetailsByPolicyId(policyId);
      const gstPercentageForRow = Number(
        placementSlipForRow?.gstPercentage ?? 0,
      );
      const buildRow = (
        enroll: any,
        dep: any,
        slNo: number,
        effectiveDate?: Date | null,
      ): Record<string, any> => {
        const isBypassRow = dep
          ? dep.bypassPremiumAmount != null
          : (enroll.employee as any)?.bypassPremiumAmount != null;
        const rowBypassNet = isBypassRow
          ? Number(
              (dep
                ? dep.bypassPremiumAmount
                : (enroll.employee as any)?.bypassPremiumAmount) ?? 0,
            ) || 0
          : 0;
        const rowBypassGross = isBypassRow
          ? rowBypassNet + (rowBypassNet * gstPercentageForRow) / 100
          : 0;
        const row: Record<string, any> = {};
        headers.forEach((h) => {
          const keyMap = fieldMapping?.fieldMap?.[h];
          const normalized = h.toUpperCase().replace(/\s+/g, "_");
          if (isBypassRow && /PREMIUM/.test(normalized)) {
            row[h] = /GROSS/.test(normalized) ? rowBypassGross : rowBypassNet;
            return;
          }
          switch (normalized) {
            case ENDORSEMENT_HEADERS.SL_NO:
            case ENDORSEMENT_HEADERS.SERIAL_NO:
              row[h] = slNo;
              break;

            case ENDORSEMENT_HEADERS.FAMILY_NO:
              row[h] = enroll.employee?.dependents?.length ?? 0;
              break;

            case ENDORSEMENT_HEADERS.INSUREDNAME:
              row[h] = dep ? dep.name : enroll.employee?.employeeName ?? "";
              break;

            case ENDORSEMENT_HEADERS.RELATION:
              row[h] = dep ? dep.relation : "Self";
              break;

            case ENDORSEMENT_HEADERS.GENDER:
              row[h] = dep ? dep.gender : enroll.employee?.gender ?? "";
              break;

            case ENDORSEMENT_HEADERS.DOB:
              row[h] = dep ? dep.dateOfBirth : enroll.employee?.dateOfBirth;
              break;

            case ENDORSEMENT_HEADERS.AGE: {
              const dob = dep ? dep.dateOfBirth : enroll.employee?.dateOfBirth;
              if (dob) {
                const diff = Date.now() - new Date(dob).getTime();
                row[h] = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
              } else {
                row[h] = "";
              }
              break;
            }

            case ENDORSEMENT_HEADERS.BASE_SUM_INSURED:
              row[h] = enroll.components[0]?.sumInsured ?? "";
              break;

            case ENDORSEMENT_HEADERS.TOP_UP_SUM_INSURED:
              row[h] = enroll.components[1]?.sumInsured ?? "";
              break;

            case ENDORSEMENT_HEADERS.TOTAL_SI:
              row[h] =
                (Number(enroll.components[0]?.sumInsured) || 0) +
                (Number(enroll.components[1]?.sumInsured) || 0);
              break;

            case ENDORSEMENT_HEADERS.EMPLOYEE_NUMBER:
              row[h] = enroll.employee?.companyEmployeeId ?? "";
              break;

            case ENDORSEMENT_HEADERS.DOJ:
              row[h] = dep ? dep.effectiveDate : effectiveDate;
              break;

            case ENDORSEMENT_HEADERS.ENDORSEMENT_TYPE: {
              const isDeletion = dep
                ? !!dep.deletedAt || !!dep.enrollmentDeletionBatchId
                : !!enroll.deletedAt ||
                  !!enroll.employee?.deletedAt ||
                  !!(enroll as any).enrollmentDeletionBatchId;
              const isAddition = dep
                ? !!dep.enrollmentAdditionBatchId
                : !!(enroll as any).enrollmentAdditionBatchId;
              row[h] = isDeletion
                ? "Deletion"
                : isAddition
                ? "Addition"
                : "Addition";
              break;
            }

            case ENDORSEMENT_HEADERS.ADDRESS_CODE:
              // Raw value captured at upload time on the employee row.
              // Dependents inherit from their employee.
              row[h] = enroll.employee?.policyLocation ?? "";
              break;

            default: {
              const pathKey = keyMap || h;
              row[h] =
                resolvePath(
                  {
                    enrollment: enroll,
                    employee: enroll.employee,
                    dependent: dep,
                  },
                  pathKey,
                ) ?? "";
            }
          }
        });
        return row;
      };

      const rows: Record<string, any>[] = [];
      let sl = 1;
      let dependentCount = 0;
      for (const enroll of enrollments) {
        const employeeEffectiveDate =
          await this.policyRepository.getEffectiveDateOfEmployee(
            enroll.employeeId,
            enroll.policyId,
          );
        rows.push(buildRow(enroll, null, sl++, employeeEffectiveDate));

        const dependents = (enroll.employee?.dependents ?? []).filter(
          (d: PolicyEnrollmentDependent) =>
            d.endorsementStatusKey === EMPLOYEE_ENDORSEMENT_READY,
        );
        for (const dep of dependents) {
          rows.push(buildRow(enroll, dep, sl++, dep.effectiveDate));
          dependentCount += 1;
        }
      }
      const additionCount = rows.filter(
        (r) => r[endorsementTypeHeader] === "Addition",
      ).length;
      const deletionCount = rows.filter(
        (r) => r[endorsementTypeHeader] === "Deletion",
      ).length;
      const newSheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      workbook.Sheets[sheetName] = newSheet;
      const outBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });
      // await this.policyRepository.updateEmployeeEnrollmentStatus(
      //   enrollments.map((e: any) => e.id),
      //   EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT
      // );
      const fileName = `endorsement/policy-${policyId}-endorsement.xlsx`;
      const url = await uploadToS3(
        outBuffer,
        fileName,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      const policyFrom = new Date(policy.policyFrom);
      const policyTo = new Date(policy.policyTo);
      const totalPolicyDays =
        (policyTo.getTime() - policyFrom.getTime()) / (1000 * 60 * 60 * 24) + 1;

      const totals = {
        count: 0,
        sumInsured: 0,
        premiumAtInception: 0,
        grossPremium: 0,
        netPremium: 0,
      };
      let additionPremiumTotal = 0;
      let deletionPremiumTotal = 0;

      for (const e of enrollments) {
        const isDeletion =
          !!e.deletedAt ||
          !!e.employee?.deletedAt ||
          !!(e as any).enrollmentDeletionBatchId;
        const sumInsured = Number(e.sumInsured) || 0;
        const totalPremium = Number(e.totalPremium) || 0;
        const isBypass = (e.employee as any)?.bypassPremiumAmount != null;
        let applicablePremium: number;
        if (isBypass) {
          const empBypass =
            Number((e.employee as any)?.bypassPremiumAmount ?? 0) || 0;
          const depBypass = (e.employee?.dependents ?? []).reduce(
            (sum: number, d: PolicyEnrollmentDependent) =>
              sum + (Number(d.bypassPremiumAmount ?? 0) || 0),
            0,
          );
          applicablePremium = empBypass + depBypass;
        } else {
          const effectiveDate =
            (await this.policyRepository.getEffectiveDateOfEmployee(
              e.employeeId,
              e.policyId,
            )) || policyFrom;
          const effective = new Date(effectiveDate);
          const remainingDays =
            (policyTo.getTime() - effective.getTime()) / (1000 * 60 * 60 * 24) +
            1;
          const perDayPremium = totalPremium / totalPolicyDays;
          applicablePremium = perDayPremium * Math.max(0, remainingDays);
        }

        totals.count += isDeletion ? -1 : 1;
        totals.sumInsured += (isDeletion ? -1 : 1) * sumInsured;
        totals.premiumAtInception += (isDeletion ? -1 : 1) * totalPremium;
        if (isDeletion) {
          totals.grossPremium -= applicablePremium;
          totals.netPremium -= applicablePremium;
          deletionPremiumTotal += applicablePremium;
        } else {
          totals.grossPremium += applicablePremium;
          totals.netPremium += applicablePremium;
          additionPremiumTotal += applicablePremium;
        }
      }

      const placementSlip =
        await this.policyRepository.getPlacementSlipDetailsByPolicyId(policyId);
      const gstPercentage = placementSlip?.gstPercentage ?? 0;
      const additionServiceTax = (additionPremiumTotal * gstPercentage) / 100;
      const deletionServiceTax = (deletionPremiumTotal * gstPercentage) / 100;
      const gstAmount = additionServiceTax - deletionServiceTax;

      const basicBrokeragePercentage = policy?.basicBrokeragePercentage ?? 0;
      const basicBrokerageAmount =
        ((totals.netPremium + gstAmount) * basicBrokeragePercentage) / 100;

      const totalDebit = totals.netPremium + gstAmount;
      const additionTransactionAmount = Math.round(
        additionPremiumTotal + additionServiceTax,
      );
      const deletionTransactionAmount = Math.round(
        deletionPremiumTotal + deletionServiceTax,
      );
      const netTransactionAmount = Math.round(Math.abs(totalDebit));
      const cdAccounts = await this.policyRepository.getCautionDepositsByPolicy(
        policyId,
      );
      let cdAccount = cdAccounts[0];
      if (!cdAccount) {
        throw new BadRequestException(
          "Caution deposit account not found for policy",
        );
      }
      const cdBalance = Number(cdAccount.balanceAmount || 0);
      if (
        additionTransactionAmount > 0 &&
        cdBalance < additionTransactionAmount
      ) {
        throw new BadRequestException("Insufficient CD balance");
      }

      const fileUploadData = await this.policyRepository.createFileUploadRecord(
        {
          fileKey: fileName,
          companyType: "policy",
          companyId: policyId,
          uploadType: this.repoMode === "AWS" ? "AWS" : "LFS",
          documentTypeLid: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 0,
          updatedBy: 0,
        },
      );

      const endorsement = await this.policyRepository.createEndorsement({
        policyId,
        companyId: policy?.companyId ?? 0,
        endorsementDate: new Date(),
        endorsementEntryDate: new Date(),
        endorsmentFileId: fileUploadData.id,
        endorsmentCount: totals.count,
        endorsmentDependentCount: dependentCount,
        sumInsured: totals.sumInsured,
        premiumAtInception: totals.premiumAtInception,
        grossPremium: totalDebit,
        netPremium: totals.netPremium,
        gstAmount: gstAmount ?? 0,
        terrorismAmount: policy?.terrorismAmount ?? 0,
        basicBrokeragePercentage,
        basicBrokerageAmount,
        employeeEndorsementAdditionCount: additionCount,
        employeeEndorsementDeletionCount: deletionCount,
        commissionTerrorismAmount: policy?.commissionTerrorism ?? 0,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      });

      const [
        getDebitTransactionLookupDetails,
        getCreditTransactionLookupDetails,
        getTransactionReferenceDetails,
      ] = await Promise.all([
        this.policyRepository.getDebitTransactionLookupDetails(),
        this.policyRepository.getCreditTransactionLookupDetails(),
        this.policyRepository.getDebitTransactionReferenceDetails(),
      ]);
      if (additionTransactionAmount > 0 && !getDebitTransactionLookupDetails) {
        throw new NotFoundException(
          `Debit transaction lookup details not found`,
        );
      }
      if (deletionTransactionAmount > 0 && !getCreditTransactionLookupDetails) {
        throw new NotFoundException(
          `Credit transaction lookup details not found`,
        );
      }
      if (!getTransactionReferenceDetails) {
        throw new NotFoundException(`Transaction reference details not found`);
      }

      if (additionTransactionAmount > 0) {
        cdAccount = await this.policyRepository.updateCautionDepositBalance(
          cdAccount.id,
          {
            transactionType: getDebitTransactionLookupDetails.id,
            bankName: `${cdAccount.cdBankName}, ${ACCOUNT_NUMBER_PLACEHOLDER}${cdAccount.cdAccountNumber}`,
            ifscCode: "",
            referenceType: getTransactionReferenceDetails.id,
            remarks: `${ENDORSEMENT_TRANSACTION_REMARK} ${endorsement.id}`,
            transactionReferenceId: endorsement.id.toString(),
            transactionAmount: additionTransactionAmount,
            endorsementId: endorsement.id,
          },
          userId,
        );
      }

      if (deletionTransactionAmount > 0) {
        cdAccount = await this.policyRepository.updateCautionDepositBalance(
          cdAccount.id,
          {
            transactionType: getCreditTransactionLookupDetails.id,
            bankName: `${cdAccount.cdBankName}, ${ACCOUNT_NUMBER_PLACEHOLDER}${cdAccount.cdAccountNumber}`,
            ifscCode: "",
            referenceType: getTransactionReferenceDetails.id,
            remarks: `${ENDORSEMENT_TRANSACTION_REMARK} ${endorsement.id}`,
            transactionReferenceId: endorsement.id.toString(),
            transactionAmount: deletionTransactionAmount,
            endorsementId: endorsement.id,
          },
          userId,
        );
      } else if (additionTransactionAmount === 0 && netTransactionAmount > 0) {
        const fallbackLookup =
          totalDebit >= 0
            ? getDebitTransactionLookupDetails
            : getCreditTransactionLookupDetails;
        if (!fallbackLookup) {
          throw new NotFoundException(
            totalDebit >= 0
              ? `Debit transaction lookup details not found`
              : `Credit transaction lookup details not found`,
          );
        }

        await this.policyRepository.updateCautionDepositBalance(
          cdAccount.id,
          {
            transactionType: fallbackLookup.id,
            bankName: `${cdAccount.cdBankName}, ${ACCOUNT_NUMBER_PLACEHOLDER}${cdAccount.cdAccountNumber}`,
            ifscCode: "",
            referenceType: getTransactionReferenceDetails.id,
            remarks: `${ENDORSEMENT_TRANSACTION_REMARK} ${endorsement.id}`,
            transactionReferenceId: endorsement.id.toString(),
            transactionAmount: netTransactionAmount,
            endorsementId: endorsement.id,
          },
          userId,
        );
      }

      await this.policyRepository.updatePolicyEmployeeEndorsements(
        policyId,
        enrollments.map((e: any) => e.employeeId),
        endorsement.id,
        fileUploadData.id,
      );

      return url;
    } catch (error) {
      console.error("Error in generateEndorsementExcel:", error);
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "generateEndorsementExcel",
          payload: { policyId, insurerId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getDashboardBusinessPerformance(
    userId: number,
    timeFilter?: string,
    financialYear?: number,
    owner?: string,
    organisationId?: number,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
  ): Promise<any[]> {
    try {
      let employeeHierarchy, userIdsList;
      if (owner) {
        const userDetails = await this.policyRepository.getUserDetails(
          userId,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
        );
        userIdsList = userDetails ? [userId] : [];
      } else {
        employeeHierarchy =
          await this.policyRepository.getEmployeeHierarchyByUserId(userId);
        if (organisationId || sbuId || verticalId || departmentId || branchId) {
          employeeHierarchy = employeeHierarchy?.filter(
            (user) =>
              (!organisationId || user.organisationId === organisationId) &&
              (!sbuId || user.sbuId === sbuId) &&
              idMatches(verticalId, user.verticalId) &&
              (!departmentId || user.departmentId === departmentId) &&
              idMatches(branchId, user.branchId),
          );
        }
        userIdsList = employeeHierarchy?.map((node) => node.userId) || [];
      }
      return userIdsList.length < 1
        ? []
        : await this.policyRepository.getDashboardBusinessPerformance(
            userIdsList,
            timeFilter,
            financialYear,
          );
    } catch (error) {
      console.error("Error in getDashboardBusinessPerformance:", error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch KPI data.",
      );
    }
  }

  async getNewDashboardBusinessPerformance(
    userId: number,
    timeFilter?: string,
    financialYear?: number,
    owner?: string,
    organisationId?: any,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    isLeadership = false,
    from?: Date,
    to?: Date,
    incomeType?: string,
  ): Promise<any[]> {
    try {
      let userIdsList: number[] = [];
      if (isLeadership === false) {
        userIdsList = await this.getFilteredUserIds(
          userId,
          !owner || owner === OWNER_TYPES.MANAGER
            ? OWNER_TYPES.MANAGER
            : undefined,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
        );
      } else {
        if (isLeadership === true) {
          const orgId = organisationId;
          if (orgId === 0) {
            const organisationIdNew =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
                { id: orgId },
              );

            const lookupCriteria =
              organisationIdNew.length === 0
                ? { parentOrganisationId: orgId }
                : { id: orgId };

            const organisationIds =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
                lookupCriteria,
              );
            organisationId = organisationIds;
          } else {
            organisationId = [organisationId];
          }
        }
      }

      // If from/to dates are provided, use them; otherwise fall back to timeFilter/financialYear
      const useFromToDates = from && to;
      const effectiveTimeFilter = useFromToDates ? undefined : timeFilter;
      const effectiveFinancialYear = useFromToDates ? undefined : financialYear;

      return userIdsList.length < 1 && !isLeadership
        ? []
        : await this.policyRepository.getNewDashboardBusinessPerformance(
            userIdsList,
            effectiveTimeFilter,
            effectiveFinancialYear,
            isLeadership,
            organisationId,
            sbuId,
            verticalId,
            departmentId,
            branchId,
            from,
            to,
            incomeType,
          );
    } catch (error) {
      console.error("Error in getNewDashboardBusinessPerformance:", error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch KPI data.",
      );
    }
  }

  async getNewDashboardPolicySummary(
    userId: number,
    timeFilter?: string,
    financialYear?: number,
    owner?: string,
    organisationId?: any,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    isLeadership = false,
    from?: Date,
    to?: Date,
    insurerId?: number,
    businessMonth?: string,
    // True when a specific owner was explicitly picked. In that case we scope to
    // what the picked owner OWNS (self + reporting hierarchy) instead of their
    // role-based visibility, so e.g. picking a CS user shows that user's book
    // rather than the whole org.
    explicitOwnerSelected = false,
  ): Promise<{
    policyTypesDistribution: {
      iirmPolicyTypeLid: number | null;
      iirmPolicyType: string | null;
      premiumAmount: number;
      basicBrokerageAmount: number;
      policyCount: number;
    }[];
    policyExpiryTimeline: { label: string; count: number }[];
  }> {
    try {
      if (organisationId !== undefined && organisationId !== null) {
        const orgId = Array.isArray(organisationId)
          ? Number(organisationId[0])
          : Number(organisationId);

        if (Number.isFinite(orgId)) {
          const organisationIdNew =
            await this.policyRepository.getEntityTableMapIds(
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
              { id: orgId },
            );

          const lookupCriteria =
            organisationIdNew.length === 0
              ? { parentOrganisationId: orgId }
              : { id: orgId };

          const organisationIds =
            await this.policyRepository.getEntityTableMapIds(
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
              lookupCriteria,
            );

          if (organisationIds.length > 0) {
            organisationId = organisationIds;
          }
        }
      }

      let userIdsList: any = [];
      let participantScope: {
        isBranch: boolean;
        branchId: number | null;
        isReportee: boolean;
        reportingUserId: number;
      } | null = null;
      const shouldUseOwnerScope = owner === OWNER_TYPES.TEAM || owner === OWNER_TYPES.MANAGER;
      if (isLeadership === false || shouldUseOwnerScope) {
        // Resolve the exact member set the policy listing uses for an
        // explicit owner selection so pie/timeline totals match the rows
        // getAllPolicies returns for the same owner + view-by.
        const scope = await this.scopeService.resolvePolicyOwnerScope(
          userId,
          !owner || owner === OWNER_TYPES.MANAGER
            ? OWNER_TYPES.MANAGER
            : OWNER_TYPES.TEAM,
          explicitOwnerSelected,
        );
        userIdsList = scope.memberIds;
        participantScope = scope.participantScope;
      } else {
        if (isLeadership === true) {
          const orgId = organisationId;
          if (Array.isArray(orgId)) {
            organisationId = orgId;
          } else if (orgId === 0) {
            const organisationIdNew =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
                { id: orgId },
              );

            const lookupCriteria =
              organisationIdNew.length === 0
                ? { parentOrganisationId: orgId }
                : { id: orgId };

            const organisationIds =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
                lookupCriteria,
              );
            organisationId = organisationIds;
          } else {
            organisationId = [organisationId];
          }
        }
      }

      // If from/to dates are provided, use them; otherwise fall back to timeFilter/financialYear
      const useFromToDates = from && to;
      const effectiveTimeFilter = useFromToDates ? undefined : timeFilter;
      const effectiveFinancialYear = useFromToDates ? undefined : financialYear;

      return await this.policyRepository.getNewDashboardPolicySummary(
        userIdsList,
        effectiveTimeFilter,
        effectiveFinancialYear,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        isLeadership && !shouldUseOwnerScope,
        from,
        to,
        insurerId,
        businessMonth,
        participantScope,
      );
    } catch (error) {
      console.error("Error in getNewDashboardPolicySummary:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy summary data.",
      );
    }
  }

  /**
   * Org scope for the reward leg of the live Business Performance aggregate.
   * Lifted from getPolicyReportList so the dashboard and the Biz Done listing
   * agree on which rewards a viewer may see: rewards have no owner and no
   * hierarchy, so organisation is the only scope available. Leadership with no
   * org selected gets `null` (= every org); everyone else is pinned to their own
   * org, resolved explicitly rather than left open.
   */
  private async resolveRewardOrganisationIds(
    userId: number,
    isLeadership: boolean,
    organisationId: any,
  ): Promise<number[] | null> {
    const selectedOrgIds = (
      Array.isArray(organisationId) ? organisationId : [organisationId]
    )
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (isLeadership) {
      return selectedOrgIds.length ? selectedOrgIds : null;
    }
    const employee = await this.scopeService.getEmployeeDetails(userId);
    return [employee?.organisationId ?? -1];
  }

  async getQuarterlyDashboardBusinessPerformance(
    userId: number,
    financialYear?: number,
    quarter?: string,
    month?: string,
    owner?: string,
    organisationId?: any,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    isLeadership?: boolean = false,
    from?: Date,
    to?: Date,
    // When true, achieved values are aggregated live from
    // policy/endorsement/reward instead of the hourly performance_output ETL
    // table, so the widget can never lag the Biz Done report.
    useLiveData = false,
    // Selects which income legs (policy / endorsement / rewards) count towards
    // achieved, using the Biz Done listing's vocabulary. Honoured on the live
    // path only. Targets are never filtered by it — business_target has no
    // policy-vs-endorsement dimension, matching the legacy widget.
    incomeType?: string,
  ): Promise<any[]> {
    try {
      let userIdsList: any[] = [];
      if (isLeadership === false) {
        userIdsList = await this.getFilteredUserIds(
          userId,
          !owner || owner === OWNER_TYPES.MANAGER
            ? OWNER_TYPES.MANAGER
            : undefined,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
        );
      }

      // If from/to dates are provided, use them; otherwise fall back to financialYear/quarter/month
      const useFromToDates = from && to;
      const effectiveFinancialYear = useFromToDates ? undefined : financialYear;
      const effectiveQuarter = useFromToDates ? undefined : quarter;
      const effectiveMonth = useFromToDates ? undefined : month;

      // Reward org scope, resolved exactly as the Biz Done listing does
      // (see getPolicyReportList): leadership sees the selected org(s) or all,
      // everyone else only their own org — rewards carry no owner hierarchy, so
      // this is the only thing stopping a cross-org leak.
      const rewardOrganisationIds = useLiveData
        ? await this.resolveRewardOrganisationIds(
            userId,
            isLeadership,
            organisationId,
          )
        : undefined;

      return userIdsList.length < 1 && !isLeadership
        ? []
        : await this.policyRepository.getQuarterlyDashboardBusinessPerformance(
            userIdsList,
            effectiveFinancialYear,
            effectiveQuarter,
            effectiveMonth,
            isLeadership,
            organisationId,
            sbuId,
            verticalId,
            departmentId,
            branchId,
            from,
            to,
            useLiveData,
            rewardOrganisationIds,
            incomeType,
          );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "failure",
          location: "PolicyService",
          method: "getQuarterlyDashboardBusinessPerformance",
          messageData: `Error in getQuarterlyDashboardBusinessPerformance: ${error}`,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch quarterly business performance data.",
      );
    }
  }

  async getQuarterlyDashboardBusinessPerformanceBySbu(
    userId: number,
    financialYear?: number,
    quarter?: string,
    month?: string,
    owner?: string,
    organisationId?: any,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    isLeadership?: boolean = false,
    from?: Date,
    to?: Date,
    // See getQuarterlyDashboardBusinessPerformance.
    useLiveData = false,
    incomeType?: string,
  ): Promise<any[]> {
    try {
      let userIdsList: number[] = [];
      if (isLeadership === false) {
        userIdsList = await this.getFilteredUserIds(
          userId,
          !owner || owner === OWNER_TYPES.MANAGER
            ? OWNER_TYPES.MANAGER
            : undefined,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
        );
      }

      // If from/to dates are provided, use them; otherwise fall back to financialYear/quarter/month
      const useFromToDates = from && to;
      const effectiveFinancialYear = useFromToDates ? undefined : financialYear;
      const effectiveQuarter = useFromToDates ? undefined : quarter;
      const effectiveMonth = useFromToDates ? undefined : month;

      // Same reward org scope the quarterly chart uses, so the per-SBU
      // breakdown sums back to it.
      const rewardOrganisationIds = useLiveData
        ? await this.resolveRewardOrganisationIds(
            userId,
            isLeadership,
            organisationId,
          )
        : undefined;

      return userIdsList.length < 1 && !isLeadership
        ? []
        : await this.policyRepository.getQuarterlyDashboardBusinessPerformanceBySbu(
            userIdsList,
            isLeadership,
            effectiveFinancialYear,
            effectiveQuarter,
            effectiveMonth,
            organisationId,
            sbuId,
            from,
            to,
            useLiveData,
            rewardOrganisationIds,
            incomeType,
          );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "failure",
          location: "PolicyService",
          method: "getQuarterlyDashboardBusinessPerformanceBySbu",
          messageData: `Error in getQuarterlyDashboardBusinessPerformanceBySbu: ${error}`,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch quarterly business performance data by SBU.",
      );
    }
  }

  async getPolicyDashboardDetails(policyId: number, isNonGroupPolicy = false) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyDashboardDetails",
          payload: { policyId, isNonGroupPolicy },
          messageData: "method invoked",
        }),
      });
      return await this.policyRepository.getPolicyDashboardDetails(
        policyId,
        isNonGroupPolicy,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyDashboardDetails",
          payload: { policyId, isNonGroupPolicy },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data.",
      );
    }
  }

  async getPolicyReport(
    userId: number,
    entityType: string,
    timeFilter?: string,
    financialYear?: number,
    searchBy?: string,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyService",
        method: "getPolicyReport",
        payload: { userId, entityType, timeFilter, financialYear },
        messageData: "method invoked",
      }),
    });

    try {
      const startTime = Date.now();
      // const employeeHierarchy =
      //   await this.policyRepository.getEmployeeHierarchyByUserId(userId);
      // const userIdsList = employeeHierarchy?.map((user) => user.userId) || [
      //   userId,
      // ];

      const policyData = {
        // userIds: userIdsList,
        userIds: [],
        entityType,
        timeFilter,
        financialYear,
      };
      const stream = this.policyReportService.streamPolicyReport(
        policyData.userIds,
        policyData.entityType,
        policyData.timeFilter,
        policyData.financialYear,
        searchBy,
        5000,
      );

      // const policyDataStartTime = Date.now();
      // const reportData = await this.policyReportService.getPolicyReport(
      //   policyData.userIds,
      //   policyData.entityType,
      //   policyData.timeFilter,
      //   policyData.financialYear
      // );

      // this.logger.log({
      //   level: "info",
      //   message: buildLogMessage({
      //     traceId: this.traceIdService.traceId,
      //     userId,
      //     status: "success",
      //     location: "PolicyService",
      //     method: "getPolicyReport",
      //     payload: {
      //       companySummary: Array.isArray(reportData.companySummary)
      //         ? reportData.companySummary.length
      //         : 0,
      //       policySummary: Array.isArray(reportData.policySummary)
      //         ? reportData.policySummary.length
      //         : 0,
      //       insurerSummary: Array.isArray(reportData.insurerSummary)
      //         ? reportData.insurerSummary.length
      //         : 0,
      //       policyDetails: Array.isArray(reportData.policyDetails)
      //         ? reportData.policyDetails.length
      //         : 0,
      //       coInsurerDetails: Array.isArray(reportData.coInsurerDetails)
      //         ? reportData.coInsurerDetails.length
      //         : 0,
      //     },
      //     messageData: "Policy report retrieved",
      //   }),
      // });
      // const policyDataEndTime = Date.now();
      // console.log(
      //   `getPolicyReport - policyData took ${
      //     policyDataEndTime - policyDataStartTime
      //   } ms`
      // );

      const now = new Date();
      const year = now.getFullYear();
      const month = now
        .toLocaleString("en-US", { month: "short" })
        .toLowerCase();
      const fileName = `document-generation/policy/${userId}/${year}/${
        month.charAt(0).toUpperCase() + month.slice(1)
      }/BizDone-Report`;
      const generateBizStartTime = Date.now();
      const result = await this.policyRepository.generateBizDoneReportInBatches(
        userId,
        fileName,
        stream,
      );
      const generalDataEndTime = Date.now();
      console.log(
        `getPolicyReport - generateBizDoneReport took ${
          generalDataEndTime - generateBizStartTime
        } ms`,
      );
      // let result: string | null = null;
      // try {
      //   const now = new Date();
      //   const year = now.getFullYear();
      //   const month = now
      //     .toLocaleString("en-US", { month: "short" })
      //     .toLowerCase();
      //   const fileName = `document-generation/policy/${userId}/${year}/${
      //     month.charAt(0).toUpperCase() + month.slice(1)
      //   }/BizDone-Report`;
      //   const response = await axios.post(
      //     `${ENV.URL_DOCUMENT_SERVICE}/document/excel/policy-generation`,
      //     {
      //       fileName: fileName,
      //       data: reportData,
      //     },
      //     {
      //       timeout: 240000, // 4 minutes in milliseconds
      //     }
      //   );
      //   result = response?.data?.data ?? null;
      // } catch (error) {
      //   console.log(
      //     "Error occurred while generating excel for policy report:",
      //     error
      //   );
      //   throw new BadRequestException(
      //     `Failed to generate excel via axios call: ${(error as Error).message}`
      //   );
      // }
      const endTime = Date.now();
      console.log(
        `getPolicyReport function took ${endTime - startTime} ms to execute`,
      );
      if (result === null) {
        throw new BadRequestException("Failed to generate excel file");
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyReport",
          payload: { result },
          messageData: "Policy report retrieved - result",
        }),
      });

      // generateBizDoneReportInBatches now returns the S3 object key; this is a
      // synchronous download endpoint, so mint a fresh pre-signed URL for the
      // client here (the async export path keeps the raw key instead).
      return await this.toDownloadUrl(result);
    } catch (error) {
      console.error("Error in getPolicyReport:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy report.",
      );
    }
  }

  async listEndorsementBatches(
    policyId: number,
    page: number,
    limit: number,
    sort?: string,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "listEndorsementBatches",
        payload: { policyId, page, limit, sort },
        messageData: "method invoked",
      }),
    });
    return this.policyRepository.listEndorsementBatches(policyId, page, limit, sort);
  }

  async listEndorsementBatchesTracker(
    policyId: number,
    page: number,
    limit: number,
    sort?: string,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "listEndorsementBatchesTracker",
        payload: { policyId, page, limit, sort },
        messageData: "method invoked",
      }),
    });
    return this.policyRepository.listEndorsementBatchesTracker(
      policyId,
      page,
      limit,
      sort,
    );
  }

  async listAssetEndorsementBatchesTracker(
    policyId: number,
    page: number,
    limit: number,
    sort?: string,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "listAssetEndorsementBatchesTracker",
        payload: { policyId, page, limit, sort },
        messageData: "method invoked",
      }),
    });
    return this.policyRepository.listAssetEndorsementBatchesTracker(
      policyId,
      page,
      limit,
      sort,
    );
  }

  async acknowledgeEndorsementBatch(
    endorsementId: number,
    insurerEndorsementNumber?: string,
    uploadedFileId?: number,
    insurerEndorsementDate?: string,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "acknowledgeEndorsementBatch",
        payload: {
          endorsementId,
          insurerEndorsementNumber,
          uploadedFileId,
          insurerEndorsementDate,
        },
        messageData: "method invoked",
      }),
    });
    return this.policyRepository.acknowledgeEndorsementBatch(
      endorsementId,
      insurerEndorsementNumber,
      uploadedFileId,
      insurerEndorsementDate,
    );
  }

  async getPoliciesByContactId(contactId: number, page: number, limit: number) {
    try {
      const { data: contactPolicies, count } =
        await this.policyRepository.getPoliciesByContactId(
          contactId,
          page,
          limit,
        );
      const transformedPolicies =
        this.policyRepository.transformPoliciesResponse(contactPolicies);
      return {
        data: transformedPolicies,
        count: count,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to fetch policies for contact ID: ${contactId}. ${error.message}`,
      );
    }
  }

  async getFilteredUserIds(
    userId: number,
    owner?: string,
    organisationId?: number,
    sbuId?: number,
    // Vertical and Branch are multiselect dashboard filters: one id or a list.
    verticalId?: number | number[],
    departmentId?: number,
    branchId?: number | number[],
  ): Promise<number[]> {
    if (owner) {
      const userDetails = await this.policyRepository.getUserDetails(
        userId,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
      );
      return userDetails ? [userId] : [];
    } else {
      let employeeHierarchy =
        await this.policyRepository.getNewEmployeeHierarchyByUserId(userId);
      if (organisationId || verticalId || departmentId || branchId || sbuId) {
        employeeHierarchy = employeeHierarchy?.filter(
          (user) =>
            (!organisationId || user.organisationId === organisationId) &&
            (!sbuId || user.sbuId === sbuId) &&
            idMatches(verticalId, user.verticalId) &&
            (!departmentId || user.departmentId === departmentId) &&
            idMatches(branchId, user.branchId),
        );
      }
      return employeeHierarchy?.map((node) => node.userId) || [];
    }
  }

  // Org-hierarchy drilldown aggregate for Biz Done Report Enhanced: one row
  // per child node at the requested level, with policy count / premium /
  // brokerage. Visibility mirrors getPolicyReportList's own default scoping
  // (no explicit owner selection -> OWNER_TYPES.MANAGER, i.e. self only, for
  // non-leadership users) so the accordion never shows more than the report
  // itself would for the same user.
  async getPolicyScopeSummary(
    userId: number,
    params: {
      level: "organisation" | "unit" | "vertical" | "branch" | "owner";
      organisationId?: number;
      sbuId?: number;
      verticalId?: number;
      departmentId?: number;
      branchId?: number;
      from?: Date;
      to?: Date;
      financialYear?: number;
      owner?: string;
      filterByBusinessDate?: boolean;
    },
    isLeadership?: boolean,
  ) {
    const { level, organisationId, sbuId, verticalId, departmentId, branchId, financialYear, owner, filterByBusinessDate } = params;
    let { from, to } = params;
    // Same precedence as getPolicyReportList (policy-report.ts streamPolicyReport):
    // financialYear resolves the base range via getDateRange, explicit from/to
    // override it. A whole-FY selection arrives as financialYear alone, so the
    // accordion filters the exact same window as the table/KPIs.
    if (financialYear !== undefined && !(from && to)) {
      const range = getDateRange(undefined, financialYear);
      from = range.start ?? from;
      to = range.end ?? to;
    }
    const emptyScopeTotal = { policyCount: 0, premium: 0, brokerage: 0, soBrokerage: 0, roBrokerage: 0, feeAmount: 0, rewardAmount: 0, total: 0 };

    // Owner accordion (Enhanced pages only): one row per member of the
    // logged-in user's reporting downline (self included) — the same
    // population the employee/hierarchy owner tree-select shows. Policies
    // attribute to exactly ONE owner (policy.ownerId), so:
    //   view-by manager: each member's individual rows, straight from the
    //     per-owner GROUP BY;
    //   view-by team: each member also absorbs their subtree, rolled up here
    //     by walking each per-owner row up its reporting chain — exact, since
    //     single-owner attribution can't double-count within a card.
    // isLeadership is passed as false to getScopeSummaryByLevel on purpose:
    // that forces the policy.ownerId IN (downline) filter, which IS the owner
    // population — leadership users simply see their own downline's cards,
    // same as everyone else.
    if (level === "owner") {
      const downline =
        (await this.policyRepository.getNewEmployeeHierarchyByUserId(userId)) ??
        [];
      const ownerIds: number[] = Array.from(
        new Set(
          (downline as Array<{ userId: number }>)
            .map((node) => Number(node.userId))
            .filter((id) => !Number.isNaN(id)),
        ),
      );
      if (ownerIds.length === 0) {
        return { level, nodes: [] };
      }
      const perOwner = await this.policyReportService.getScopeSummaryByLevel(
        "owner",
        ownerIds,
        false,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        from,
        to,
        null,
        filterByBusinessDate,
      );
      if (!owner || owner === OWNER_TYPES.MANAGER) {
        return { level, nodes: perOwner };
      }
      const parentOf = new Map<number, number>();
      (downline as Array<{ userId: number; reportingUserId: number }>).forEach(
        (node) => parentOf.set(Number(node.userId), Number(node.reportingUserId)),
      );
      const rolled = new Map<
        number,
        { id: number; policyCount: number; premium: number; brokerage: number; soBrokerage: number; roBrokerage: number; feeAmount: number; rewardAmount: number; total: number }
      >();
      perOwner.forEach((row) => {
        let cursor: number | undefined = row.id;
        const visited = new Set<number>();
        while (
          cursor != null &&
          ownerIds.includes(cursor) &&
          !visited.has(cursor)
        ) {
          visited.add(cursor);
          const acc = rolled.get(cursor) ?? { id: cursor, ...emptyScopeTotal };
          acc.policyCount += row.policyCount;
          acc.premium += row.premium;
          acc.brokerage += row.brokerage;
          acc.soBrokerage += row.soBrokerage;
          acc.roBrokerage += row.roBrokerage;
          acc.feeAmount += row.feeAmount;
          acc.rewardAmount += row.rewardAmount;
          acc.total += row.total;
          rolled.set(cursor, acc);
          cursor = parentOf.get(cursor);
        }
      });
      return { level, nodes: Array.from(rolled.values()) };
    }

    // Same view-by resolution getPolicyReportList applies to its own
    // userIdsList: no explicit owner (or "manager") -> self only; anything
    // else (e.g. "team") -> the requesting user's full reporting hierarchy.
    // Without this the accordion always showed "self only" regardless of
    // the report's actual Owner/View-by selection, undercounting whenever
    // the report was scoped to "Manager + Team".
    let userIdsList: number[] = [];
    if (!isLeadership) {
      userIdsList = await this.getFilteredUserIds(
        userId,
        !owner || owner === OWNER_TYPES.MANAGER ? OWNER_TYPES.MANAGER : undefined,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
      );
      
      if (userIdsList.length === 0 && (!owner || owner === OWNER_TYPES.MANAGER)) {
        userIdsList = [userId];
      }
      if (userIdsList.length === 0) {
        return { level, nodes: [], ...(level === "organisation" ? { total: emptyScopeTotal } : {}) };
      }
    }

    // Reward org scoping mirrors getPolicyReportList exactly: leadership sees
    // the selected organisation (or every org, if none picked yet);
    // everyone else is pinned to their own organisation regardless of scope
    // filters, since rewards have no owner-hierarchy of their own.
    let rewardOrganisationIds: number[] | null;
    if (isLeadership) {
      rewardOrganisationIds = organisationId != null ? [organisationId] : null;
    } else {
      const rewardEmployee = await this.scopeService.getEmployeeDetails(userId);
      rewardOrganisationIds = [rewardEmployee?.organisationId ?? -1];
    }


    // No per-org user partitioning at organisation level: the listing scopes
    // purely by policy.ownerId IN (visible users) and attributes each row to
    // its own policy.organisationId — a hierarchy member's policy tagged to a
    // DIFFERENT org still counts there on the listing. Partitioning users by
    // their home org here dropped those cross-org rows and made the accordion
    // undercount vs the table.
    const nodes = await this.policyReportService.getScopeSummaryByLevel(
      level,
      userIdsList,
      Boolean(isLeadership),
      organisationId,
      sbuId,
      verticalId,
      departmentId,
      branchId,
      from,
      to,
      rewardOrganisationIds,
      filterByBusinessDate,
    );

    // Grand total across every organisation the caller can see, for the root
    // "All <org>" summary header — summed from this same response's rows
    // rather than a second query, since the underlying GROUP BY already
    // partitions the identical filtered set exactly.
    if (level === "organisation") {
      const total = nodes.reduce(
        (acc, node) => ({
          policyCount: acc.policyCount + node.policyCount,
          premium: acc.premium + node.premium,
          brokerage: acc.brokerage + node.brokerage,
          soBrokerage: acc.soBrokerage + node.soBrokerage,
          roBrokerage: acc.roBrokerage + node.roBrokerage,
          feeAmount: acc.feeAmount + node.feeAmount,
          rewardAmount: acc.rewardAmount + node.rewardAmount,
          total: acc.total + node.total,
        }),
        emptyScopeTotal,
      );
      return { level, nodes, total };
    }

    return { level, nodes };
  }

  /**
   * Client-Portfolio-only scope aggregate (org-filter cards for My Client
   * Portfolio Enhanced). Same owner/leadership/downline resolution as
   * getPolicyScopeSummary above, but delegates to the portfolio "active book"
   * aggregate (getPortfolioScopeSummaryByLevel) so the cards reconcile with the
   * page's KPI cards. getPolicyScopeSummary (Biz Done's engine) is untouched.
   * pastCompanies is intentionally NOT plumbed: the cards always reflect the
   * active book, independent of the table's Past-companies toggle.
   */
  async getPortfolioScopeSummary(
    userId: number,
    params: {
      level: "organisation" | "unit" | "vertical" | "branch" | "owner";
      organisationId?: number;
      sbuId?: number;
      verticalId?: number;
      departmentId?: number;
      branchId?: number;
      from?: Date;
      to?: Date;
      financialYear?: number;
      owner?: string;
    },
    isLeadership?: boolean,
  ) {
    const { level, organisationId, sbuId, verticalId, departmentId, branchId, financialYear, owner } = params;
    let { from, to } = params;
    if (financialYear !== undefined && !(from && to)) {
      // getDateRangeWithoutTimestamp (NOT getDateRange) to match the portfolio
      // listing exactly: getAllPolicies resolves the FY window with this same
      // helper, whose end boundary is Mar 31 00:00 (not 23:59:59.999). Using
      // getDateRange here would widen the window by up to a day and pull in
      // boundary-dated policies the KPIs exclude.
      const range = getDateRangeWithoutTimestamp(undefined, financialYear);
      from = range.start ?? from;
      to = range.end ?? to;
    }
    const emptyScopeTotal = { policyCount: 0, premium: 0, brokerage: 0, total: 0 };

    if (level === "owner") {
      const downline =
        (await this.policyRepository.getNewEmployeeHierarchyByUserId(userId)) ?? [];
      const ownerIds: number[] = Array.from(
        new Set(
          (downline as Array<{ userId: number }>)
            .map((node) => Number(node.userId))
            .filter((id) => !Number.isNaN(id)),
        ),
      );
      if (ownerIds.length === 0) {
        return { level, nodes: [] };
      }
      // Owner cards use the LISTING's own owner predicate (ownerId OR createdBy
      // OR participant, over {owner} ∪ directReportees(owner)) so each card
      // reconciles with the page's KPI cards. The previous implementation
      // grouped on policy.ownerId alone and then rolled each row up the whole
      // reporting chain, which read LOWER than the listing for every owner
      // (e.g. card 19 vs KPI 34) because it ignored created-by and participant
      // attribution. That predicate cannot be a GROUP BY — one policy can
      // attribute to several owners — so the fan-out happens in the aggregate.
      //
      // Consequence: there is no subtree roll-up any more. A manager's card is
      // self + DIRECT reportees, exactly like the listing, so senior managers'
      // cards no longer equal their branch total.
      const perOwner = await this.policyReportService.getPortfolioOwnerScopeSummary(
        downline as Array<{ userId: number; reportingUserId?: number | null }>,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        from,
        to,
      );
      return { level, nodes: perOwner };
    }

    // Non-owner levels: resolve the visible-user population exactly like
    // getPolicyScopeSummary (self vs full downline by view-by; leadership sees
    // all), then aggregate the active book grouped by the requested level.
    let userIdsList: number[] = [];
    if (!isLeadership) {
      userIdsList = await this.getFilteredUserIds(
        userId,
        !owner || owner === OWNER_TYPES.MANAGER ? OWNER_TYPES.MANAGER : undefined,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
      );
      if (userIdsList.length === 0) {
        return { level, nodes: [], ...(level === "organisation" ? { total: emptyScopeTotal } : {}) };
      }
    }

    const nodes = await this.policyReportService.getPortfolioScopeSummaryByLevel(
      level,
      userIdsList,
      Boolean(isLeadership),
      organisationId,
      sbuId,
      verticalId,
      departmentId,
      branchId,
      from,
      to,
    );

    if (level === "organisation") {
      const total = nodes.reduce(
        (acc, node) => ({
          policyCount: acc.policyCount + node.policyCount,
          premium: acc.premium + node.premium,
          brokerage: acc.brokerage + node.brokerage,
          total: acc.total + node.total,
        }),
        emptyScopeTotal,
      );
      return { level, nodes, total };
    }

    return { level, nodes };
  }

  async getPolicyReportList(
    userId: number,
    entityType: string,
    page: number,
    limit: number,
    timeFilter?: string,
    financialYear?: number,
    owner?: string,
    organisationId?: any,
    sbuId?: number,
    verticalId?: any,
    departmentId?: number,
    branchId?: number,
    searchBy?: string,
    isLeadership?: boolean = false,
    insurerId?: number,
    fromDate?: Date,
    toDate?: Date,
    businessPerformanceType?: string,
    allowAllInsurer?: boolean = false,
    incomeType?: string,
    businessMonth?: string,
    insurerBranchId?: number,
    branchViewBy?: string,
    filterByBusinessDate?: boolean,
    policyType?: string,
    groupCompanyId?: number,
    brokerId?: number,
    sort?: string,
  ) {
    try {
      console.log("isLeadership", isLeadership);
      const offset = Math.max((page - 1) * limit, 0);
      // Initialize variables to collect results
      let rows = [];
      let userIdsList: number[] = [];
      let totalCount = 0,
        kpiData = {
          grosspremium: 0,
          terrorismcommissionamount: 0,
          commissionamount: 0,
          brokeragecollected: 0,
          brokeragetobecollected: 0,
          netpremium: 0,
          terrorism: 0,
          other: 0,
          gstPercentage: 0,
          commissionamountasenteredbyisg: 0,
          commissionamountasperiwork: 0,
          fees: 0,
          commissionterrorism: 0,
        };
      if (isLeadership === false) {
        if (organisationId != null) {
          organisationId = Array.isArray(organisationId) ? organisationId : [organisationId];
        }
        userIdsList = await this.getFilteredUserIds(
          userId,
          !owner || owner === OWNER_TYPES.MANAGER
            ? OWNER_TYPES.MANAGER
            : undefined,
          organisationId?.[0],
          undefined,
          undefined,
          undefined,
          undefined,
        );
        
        if (userIdsList.length === 0) {
          if (!owner || owner === OWNER_TYPES.MANAGER) {
            userIdsList = [userId];
          } else {
            return { count: 0, data: [], kpiDetails: kpiData };
          }
        }
      } else {
        if (isLeadership === true) {
          const orgId = organisationId;
          if (orgId === 0) {
            const organisationIdNew =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
                { id: orgId },
              );

            const lookupCriteria =
              organisationIdNew.length === 0
                ? { parentOrganisationId: orgId }
                : { id: orgId };

            const organisationIds =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
                lookupCriteria,
              );
            organisationId = organisationIds;
          } else if (orgId != null) {
            organisationId = [organisationId];
          }
        }
      }

      // Org scope for the reward union branch (rewards have no owner hierarchy):
      // leadership -> selected org(s) or null (= all); everyone else -> own org
      // (resolved explicitly to avoid a cross-org leak). Mirrors the export sheet.
      const rewardSelectedOrgIds = Array.isArray(organisationId)
        ? (organisationId as any[])
            .map((x) => Number(x))
            .filter((x) => Number.isInteger(x) && x > 0)
        : [];
      let rewardOrganisationIds: number[] | null;
      if (isLeadership) {
        rewardOrganisationIds = rewardSelectedOrgIds.length
          ? rewardSelectedOrgIds
          : null;
      } else {
        const rewardEmployee = await this.scopeService.getEmployeeDetails(userId);
        rewardOrganisationIds = [rewardEmployee?.organisationId ?? -1];
      }

      // if (userIdsList.length > 0) {
      // Process the async generator
      for await (const batch of this.policyReportService.streamPolicyReport(
        userIdsList, // userIds array (empty for all users)
        entityType,
        timeFilter,
        financialYear,
        searchBy,
        limit,
        offset,
        false, // fetchAll = false for pagination
        isLeadership,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        insurerId,
        fromDate,
        toDate,
        businessPerformanceType,
        allowAllInsurer,
        incomeType,
        businessMonth,
        insurerBranchId,
        branchViewBy,
        filterByBusinessDate,
        policyType,
        groupCompanyId,
        brokerId,
        true, // includeRewards: union rewards into the Biz Done listing
        rewardOrganisationIds,
        undefined, // selectedSheets: listing reads a single entityType
        sort,
      )) {
        if (batch.rows.length > 0) {
          rows = batch.rows;
          totalCount = batch.totalCount || 0; // For pagination, you might want a separate count query
          break; // Since fetchAll=false, we only need the first batch
        }
      }
      kpiData = await this.policyReportService.policyDetailsKpi(
        userIdsList,
        timeFilter,
        financialYear,
        searchBy,
        isLeadership,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        insurerId,
        fromDate,
        toDate,
        businessPerformanceType,
        businessMonth,
        insurerBranchId,
        branchViewBy,
        incomeType,
        filterByBusinessDate,
        policyType,
        groupCompanyId,
        brokerId,
        true, // includeRewards: reward total flows into the brokerage KPI
        rewardOrganisationIds,
      );
      // }
      return {
        count: totalCount,
        data: rows,
        kpiDetails: kpiData,
      };
    } catch (error) {
      console.error("Error in getPolicyReportList:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy report list.",
      );
    }
  }


  async getPolicyReportExcel(
    userId: number,
    // TEMP (revert when the sheet-selection checkbox feature ships):
    // download is scoped to the Policy Details sheet only — both real
    // callers (controller + async export worker) pass undefined here, so
    // this default is what actually takes effect for every real request.
    // Original signature had no default (`entityType: string,`) — remove
    // the default below to restore multi-sheet/caller-selectable behavior.
    entityType: string = "policyDetails",
    page: number,
    limit: number,
    timeFilter?: string,
    financialYear?: number,
    owner?: string,
    organisationId?: any,
    sbuId?: any,
    verticalId?: any,
    departmentId?: any,
    branchId?: any,
    searchBy?: string,
    isLeadership?: boolean = false,
    insurerId?: any,
    fromDate?: Date,
    toDate?: Date,
    businessPerformanceType?: string,
    incomeType?: string,
    businessMonth?: string,
    filterByBusinessDate?: boolean,
    policyType?: string,
    groupCompanyId?: number,
    brokerId?: number,
    // Default true so the export sees the same population as the Biz Done
    // listing, which always sends allowAllInsurer=true. It was hardcoded
    // false below, silently dropping records without a lead insurer mapping
    // from the sheet while the listing/KPI counted them.
    allowAllInsurer: boolean = true,
    selectedSheets?: string[],
    appliedFiltersRows?: { filter: string; value: string }[],
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyService",
        method: "getPolicyReportExcel",
        payload: { userId, entityType, timeFilter, financialYear },
        messageData: "method invoked",
      }),
    });

    try {
      const startTime = Date.now();
      const offset = 0;
      let userIdsList = [];
      if (isLeadership === false) {
        if (organisationId != null) {
          organisationId = Array.isArray(organisationId) ? organisationId : [organisationId];
        }
        userIdsList = await this.getFilteredUserIds(
          userId,
          !owner || owner === OWNER_TYPES.MANAGER
            ? OWNER_TYPES.MANAGER
            : undefined,
          organisationId?.[0],
          undefined,
          undefined,
          undefined,
          undefined,
        );
        
        if (
          userIdsList.length === 0 &&
          (!owner || owner === OWNER_TYPES.MANAGER)
        ) {
          userIdsList = [userId];
        }
      } else {
        if (isLeadership === true) {
          const orgId = organisationId;
          if (orgId === 0) {
            const organisationIdNew =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
                { id: orgId },
              );

            const lookupCriteria =
              organisationIdNew.length === 0
                ? { parentOrganisationId: orgId }
                : { id: orgId };

            const organisationIds =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
                lookupCriteria,
              );
            organisationId = organisationIds;
          } else if (orgId != null) {
            organisationId = [organisationId];
          }
        }
      }
      // Rewards is a separately-appended sheet; split it out from the stream
      // sheets. selectedSheets undefined = legacy single-sheet behavior.
      // Ticking the Rewards sheet is necessary but not sufficient: the same
      // income-type / policy-only-filter rules the listing applies decide
      // whether rewards exist for this request at all.
      const wantsRewards =
        !!selectedSheets?.includes("rewards") &&
        rewardsAllowedFor({
          incomeType,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          policyType,
          groupCompanyId,
          brokerId,
          searchBy,
        });
      const standardSheets = selectedSheets
        ? selectedSheets.filter((s) => s !== "rewards")
        : undefined;
      const hasStandardSheets =
        standardSheets === undefined || standardSheets.length > 0;

      let stream: any;
      if (!hasStandardSheets) {
        // Only the Rewards sheet was selected — nothing to stream here.
        stream = (async function* () {})();
      } else if (isLeadership === true || userIdsList.length > 0) {
        stream = this.policyReportService.streamPolicyReport(
          userIdsList,
          entityType,
          timeFilter,
          financialYear,
          searchBy,
          10000,
          offset,
          true,
          isLeadership,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          insurerId,
          fromDate,
          toDate,
          businessPerformanceType,
          allowAllInsurer,
          incomeType,
          businessMonth,
          undefined,
          undefined,
          filterByBusinessDate,
          policyType,
          groupCompanyId,
          brokerId,
          false, // includeRewards: rewards are handled separately for exports
          undefined, // rewardOrganisationIds
          standardSheets, // explicit sheet selection (rewards handled separately)
        );
      } else {
        // No visible users: yield one empty placeholder per requested sheet so
        // the workbook still has the correct sheet structure.
        const fieldsBySheet: Record<string, any> = {
          companySummary: DEFAULT_POLICY_REPORT_FIELDS.COMPANY_SUMMARY_FIELDS,
          policySummary: DEFAULT_POLICY_REPORT_FIELDS.POLICY_SUMMARY_FIELDS,
          insurerSummary: DEFAULT_POLICY_REPORT_FIELDS.INSURER_SUMMARY_FIELDS,
          policyDetails: DEFAULT_POLICY_REPORT_FIELDS.POLICY_DETAILS_FIELDS,
          coInsurerDetails:
            DEFAULT_POLICY_REPORT_FIELDS.CO_INSURER_DEFAULT_FIELDS,
        };
        const placeholderTypes =
          standardSheets && standardSheets.length
            ? standardSheets
            : [entityType];
        const sampleHeaders: Record<string, any> = {};
        placeholderTypes.forEach((t) => {
          sampleHeaders[t] =
            fieldsBySheet[t] ?? DEFAULT_POLICY_REPORT_FIELDS.POLICY_DETAILS_FIELDS;
        });
        stream = (async function* () {
          for (const type of placeholderTypes) {
            yield { type, rows: [], totalCount: 0, sampleHeaders };
          }
        })();
      }

      if (wantsRewards) {
        const selectedOrgIds = Array.isArray(organisationId)
          ? (organisationId as any[])
              .map((x) => Number(x))
              .filter((x) => Number.isInteger(x) && x > 0)
          : [];
        let rewardOrgIds: number[] | null;
        if (isLeadership) {
          rewardOrgIds = selectedOrgIds.length ? selectedOrgIds : null;
        } else {
          const employee = await this.scopeService.getEmployeeDetails(userId);
          rewardOrgIds = [employee?.organisationId ?? -1];
        }
        const rewardInsurerId = Array.isArray(insurerId)
          ? insurerId[0]
          : insurerId;
        // Resolve the period the same way streamPolicyReport does. Passing the
        // raw request params meant an export without explicit from/to skipped the
        // reward date filter entirely (getRewardsForReport only applies it when
        // BOTH are set), so a July reward showed up in a May report.
        const rewardPeriod =
          fromDate && toDate
            ? { start: fromDate, end: toDate }
            : getDateRange(timeFilter, financialYear);
        const rewardRows = await this.policyRepository.getRewardsForReport({
          organisationIds: rewardOrgIds,
          insurerId: rewardInsurerId ? Number(rewardInsurerId) : null,
          fromDate: rewardPeriod.start,
          toDate: rewardPeriod.end,
          filterByBusinessDate,
        });
        const baseStream = stream;
        stream = (async function* () {
          for await (const batch of baseStream) yield batch;
          yield {
            type: "rewards",
            rows: rewardRows,
            totalCount: rewardRows.length,
            sampleHeaders: {
              rewards: DEFAULT_POLICY_REPORT_FIELDS.REWARDS_FIELDS,
            },
          };
        })();
      }

      // Prepend the "Applied Filters" sheet when the caller supplied its rows.
      if (appliedFiltersRows && appliedFiltersRows.length) {
        const dataStream = stream;
        stream = (async function* () {
          yield {
            type: "appliedFilters",
            rows: appliedFiltersRows,
            totalCount: appliedFiltersRows.length,
            sampleHeaders: { appliedFilters: ["filter", "value"] },
          };
          for await (const batch of dataStream) yield batch;
        })();
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now
        .toLocaleString("en-US", { month: "short" })
        .toLowerCase();
      const fileName = `document-generation/policy/${userId}/${year}/${
        month.charAt(0).toUpperCase() + month.slice(1)
      }/BizDone-Report`;
      const generateBizStartTime = Date.now();
      const result = await this.policyRepository.generateBizDoneReportInBatches(
        userId,
        fileName,
        stream,
      );
      const generalDataEndTime = Date.now();
      console.log(
        `getPolicyReportExcel - generateBizDoneReport took ${
          generalDataEndTime - generateBizStartTime
        } ms`,
      );
      const endTime = Date.now();
      console.log(
        `getPolicyReportExcel function took ${
          endTime - startTime
        } ms to execute`,
      );
      if (result === null) {
        throw new BadRequestException("Failed to generate excel file");
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyReportExcel",
          payload: { result },
          messageData: "Policy report retrieved - result",
        }),
      });

      return result;
    } catch (error) {
      console.error("Error in getPolicyReportExcel:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy report.",
      );
    }
  }

  /**
   * Enqueue a BizDone Excel export as a background job. Returns instantly with a
   * job id — the scheduler-service worker generates the workbook and uploads it
   * to S3, so this call never blocks on the heavy query/generation work and
   * cannot 504 regardless of record count. Params are stored exactly as the
   * caller sent them (already scoped to what this user may download).
   */
  async enqueueReportExport(
    userId: number,
    filtersApplied: Record<string, unknown>,
  ): Promise<{ jobId: number; status: string; alreadyInProgress: boolean }> {
    try {
      // Trigger generation immediately (fire-and-forget internally) so the
      // report starts now instead of waiting for the safety-net cron.
      return await ReportExportJob.enqueueReportExportJob(
        this.dataSource,
        userId,
        UserBizdoneReportType.BIZDONE,
        filtersApplied,
        (filters, uid) => this.generateBizDoneExcelFromQuery(filters ?? {}, uid),
      );
    } catch (error) {
      console.error("Error in enqueueReportExport:", error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to queue report export.",
      );
    }
  }

  /**
   * Status of a queued export, for the frontend to poll. Returns the S3
   * download URL once COMPLETED. Scoped to the requesting user.
   */
  // The DB stores the S3 object KEY (new rows) so we can mint a fresh, unexpired
  // pre-signed URL on every read. Legacy rows stored a full (now-expired) URL —
  // detect those by the http(s) prefix and pass them through unchanged.
  async toDownloadUrl(stored?: string | null): Promise<string | null> {
    return ReportExportJob.toReportDownloadUrl(this.dataSource, stored);
  }

  async getReportExportStatus(jobId: number, userId: number) {
    const result = await ReportExportJob.getReportExportStatus(
      this.dataSource,
      jobId,
      userId,
    );
    if (!result) {
      throw new NotFoundException("Export job not found");
    }
    return result;
  }

  async downloadReportExportFile(
    jobId: number,
    userId: number,
  ): Promise<{ fileName: string; mimeType: string; buffer: Buffer }> {
    const job = await ReportExportJob.getReportExportJob(
      this.dataSource,
      jobId,
      userId,
    );
    if (!job) {
      throw new NotFoundException("Export job not found");
    }
    if (job.status !== UserBizdoneReportStatus.COMPLETED || job.documentId == null) {
      throw new BadRequestException("Report is not ready for download.");
    }
    const fileUpload = await this.dataSource
      .getRepository(FileUpload)
      .findOne({ where: { id: job.documentId } });
    if (!fileUpload) {
      throw new NotFoundException("Report file not found");
    }
    const key = fileUpload.fileKey;
    const fileName = path.basename(key);
    let buffer: Buffer;
    if (this.repoMode === "AWS") {
      const data = await this.s3.getObject({ Bucket: this.bucket, Key: key }).promise();
      buffer = (data.Body || Buffer.from([])) as Buffer;
    } else {
      const sanitizedKey = sanitizePath(key, this.docRepoPath);
      const filePath = path.join(this.docRepoPath, sanitizedKey);
      buffer = fs.readFileSync(filePath);
    }
    return {
      fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    };
  }

  /**
   * Recent exports for the requesting user, for the Downloads panel. Scoped
   * to BIZDONE — opportunity-service now enqueues its own
   * SALES_OPPORTUNITY_LIST jobs against this same shared table, and this
   * page must never show another module's exports.
   */
  async listReportExports(userId: number) {
    return ReportExportJob.listReportExports(this.dataSource, userId, [
      UserBizdoneReportType.BIZDONE,
    ]);
  }

  // The frontend sends the already-resolved applied filters (labels included,
  // exactly as shown in the smart-search Applied Filters), stored on the job as
  // `filtersApplied.appliedFilters` (a JSON string). Parse it back into rows for
  // the Applied Filters sheet and the Downloads-panel summary — no server-side
  // id→name resolution needed.
  private parseAppliedFilters(
    raw: unknown,
  ): { filter: string; value: string }[] {
    return ReportExportJob.parseReportAppliedFilters(raw);
  }

  // Same lightweight parser the controller uses to unpack the "key:value,..."
  // search string; replicated here so the worker can replay a stored query
  // without depending on the controller.
  private parseReportSearchString(search?: string): Record<string, any> {
    const parsed: Record<string, any> = {};
    if (typeof search === "string" && search.trim()) {
      for (const pair of search.split(",")) {
        const [key, value] = pair.split(":");
        if (key && value) {
          const cleanedValue = value.replace(/[\[\]]/g, "");
          parsed[key.trim()] = isNaN(Number(cleanedValue))
            ? cleanedValue
            : Number(cleanedValue);
        }
      }
    }
    return parsed;
  }

  /**
   * Replays a stored BizDone query through the exact same generation path the
   * synchronous download uses, and returns the S3 URL. This mirrors the
   * parsing in PolicyController.getPolicyReportExcelDownload so the async output
   * is identical to the synchronous one; the only difference is it runs from the
   * worker instead of inside the HTTP request.
   */
  async generateBizDoneExcelFromQuery(
    query: Record<string, any>,
    loggedInUserId: number,
  ): Promise<string> {
    const isTrue = (v: unknown): boolean =>
      v === true || v === "true" || v === 1 || v === "1";

    const parsedSearch =
      typeof query?.search === "string" && query.search.trim()
        ? this.parseReportSearchString(query.search)
        : {};
    const search = parsedSearch;

    const from = search.from || query?.from;
    const to = search.to || query?.to;
    const financialYear = search.financialYear || query?.financialYear;
    const month = search.month || query?.month;
    const quarter = search.quarter || query?.quarter;
    const businessMonth = search.businessMonth || query?.businessMonth;
    const filterByBusinessDateExcel =
      isTrue(search.filterByBusinessDate) || isTrue(query?.filterByBusinessDate);
    const policyTypeExcel = search.policyType
      ? String(search.policyType)
      : undefined;
    const groupCompanyIdExcel = search.groupCompanyId
      ? Number(search.groupCompanyId)
      : undefined;
    const brokerIdExcel = search.brokerId ? Number(search.brokerId) : undefined;

    if (search.userId === undefined || search.userId === null) {
      search.userId = loggedInUserId;
    }
    
    const isLeadership =
      search.owner === OWNER_TYPES.MANAGER
        ? false
        : await this.scopeService.hasLeadershipRole(Number(search.userId));
    let selectedInsurerId: number | undefined;
    if (query?.insurerId || search.insurerId) {
      selectedInsurerId = query?.insurerId ? query.insurerId : search.insurerId;
    }
    const effectiveSearchByExcel =
      query?.searchBy ?? (search.companyName ? String(search.companyName) : undefined);

    // Sheets the user ticked in the Generate dropdown (comma-separated).
    // Absent → getPolicyReportExcel falls back to the default single sheet.
    const selectedSheets =
      typeof query?.sheets === "string" && query.sheets.trim()
        ? query.sheets
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined;

    // Applied Filters sheet: the frontend already resolved these to labels
    // (exactly as shown in the smart-search Applied Filters) and sent them with
    // the export request, so we write them verbatim — no id→name resolution.
    const parsedApplied = this.parseAppliedFilters(query?.appliedFilters);
    const appliedFiltersRows = parsedApplied.length
      ? parsedApplied
      : [{ filter: "Filters", value: "None (all records)" }];

    const url = await this.getPolicyReportExcel(
      search.userId,
      undefined,
      query?.page,
      query?.limit,
      month ? month : quarter,
      financialYear,
      search.owner,
      search.organisationId,
      search.sbuId,
      search.verticalId,
      search.departmentId,
      search.branchId,
      effectiveSearchByExcel,
      isLeadership,
      selectedInsurerId,
      from,
      to,
      query?.businessPerformanceType,
      search.incomeType,
      businessMonth,
      filterByBusinessDateExcel,
      policyTypeExcel,
      groupCompanyIdExcel,
      brokerIdExcel,
      true, // allowAllInsurer (default)
      selectedSheets,
      appliedFiltersRows,
    );
    return url as string;
  }

  async searchEndorsementBatches(
    page: number,
    limit: number,
    search: string,
    sort: string,
    searchBy: string,
    userId: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "searchEndorsementBatches",
          payload: { page, limit, userId },
          messageData: "method invoked",
        }),
      });
      const searchParams = mapSearchParams(search);
      const sortParams = sort
        ? sort.split(",").map((item) => {
            const [field, order] = item.trim().split(":");
            return {
              field: field.trim(),
              order: (order || "ASC").trim().toUpperCase() as "ASC" | "DESC",
            };
          })
        : [];
      return await this.policyRepository.searchEndorsementBatches(
        page,
        limit,
        searchParams,
        sortParams,
        searchBy,
        userId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "searchEndorsementBatches",
          payload: { page, limit, userId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch endorsement batches.",
      );
    }
  }

  async searchEndorsementManagementBatches(
    page: number,
    limit: number,
    search: string,
    sort: string,
    searchBy: string,
    userId: number,
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    period?: string,
    timeFilter?: string,
    financialYear?: number,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    ownerId?: number,
    viewBy?: string,
    tatRange?: string,
    insurerId?: number,
    businessMonth?: string,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "searchEndorsementBatches",
          payload: { page, limit, userId },
          messageData: "method invoked",
        }),
      });
      let searchParams = mapSearchParams(search);

      const extractStringValues = (
        value:
          | string
          | number
          | Date
          | Array<string | number | Date>
          | undefined
          | null,
      ): string[] => {
        if (Array.isArray(value)) {
          return value
            .map((item) =>
              item instanceof Date ? item.toISOString() : String(item),
            )
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        }
        if (value === undefined || value === null) {
          return [];
        }
        if (value instanceof Date) {
          return [value.toISOString()];
        }
        const normalized = String(value).trim();
        return normalized ? [normalized] : [];
      };

      let statusStepKeys: string[] | undefined;

      if (searchParams.length > 0) {
        searchParams = searchParams.filter((param) => {
          const isStatusField =
            param.searchBy === ATTRIBUTE_FIELD_MAP.status ||
            param.searchBy === "status" ||
            param.searchBy === "endorsementStatus";

          if (!isStatusField) {
            return true;
          }

          const values = extractStringValues(param.searchValue);
          if (values.length > 0) {
            statusStepKeys = values;
          }

          return false;
        });
      }
      const parseNumericValue = (value: unknown): number | undefined => {
        if (typeof value === "number") {
          return Number.isNaN(value) ? undefined : value;
        }
        if (typeof value === "string" && value.trim() !== "") {
          const parsed = Number(value);
          return Number.isNaN(parsed) ? undefined : parsed;
        }
        return undefined;
      };

      let tatRangeFilter = tatRange;

      if (!tatRangeFilter && searchParams.length > 0) {
        const tatRangeIndex = searchParams.findIndex(
          (param) => param.searchBy === "tatRange",
        );

        if (tatRangeIndex > -1) {
          const [tatRangeParam] = searchParams.splice(tatRangeIndex, 1);
          const { searchValue } = tatRangeParam;

          if (Array.isArray(searchValue)) {
            const firstStringValue = searchValue.find(
              (value): value is string => typeof value === "string",
            );
            if (firstStringValue) {
              tatRangeFilter = firstStringValue;
            } else if (searchValue.length > 0) {
              tatRangeFilter = String(searchValue[0]);
            }
          } else if (
            typeof searchValue === "string" ||
            typeof searchValue === "number"
          ) {
            tatRangeFilter = String(searchValue);
          }
        }
      }

      if (searchParams.length > 0) {
        const organisationParam = searchParams.find(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId,
        );
        if (
          organisationParam &&
          organisationParam.searchValue !== undefined &&
          organisationParam.searchValue !== null
        ) {
          const rawValues = Array.isArray(organisationParam.searchValue)
            ? organisationParam.searchValue
            : [organisationParam.searchValue];
          const organisationId = rawValues
            .map((val) => parseNumericValue(val))
            .find((val): val is number => val !== undefined);
          if (organisationId !== undefined) {
            const organisationIdNew =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
                { id: organisationId },
              );
            const lookupCriteria =
              organisationIdNew.length === 0
                ? { parentOrganisationId: organisationId }
                : { id: organisationId };
            const organisationIds =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
                lookupCriteria,
              );
            organisationParam.searchValue = organisationIds;
          }
        }
      }

      if (sbuId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.sbuId,
          searchValue: [sbuId],
        });
      }
      if (verticalId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.verticalId,
          searchValue: [verticalId],
        });
      }
      if (departmentId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.departmentId,
          searchValue: [departmentId],
        });
      }
      if (branchId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.branchId,
          searchValue: [branchId],
        });
      }

      const effectiveOwnerId = ownerId ?? userId;
      // Leadership bypass — mirrors the TAT summary widget (getTatSummary):
      // a leadership/super user with NO explicit owner selected sees org-wide
      // data, so the drilldown listing matches the widget's org-wide count.
      // An explicit owner selection always scopes, even for leadership. For
      // non-leadership users nothing changes (owner scope still applies).
      const hasExplicitOwner = ownerId != null;
      const skipOwnerScopeForLeadership =
        !hasExplicitOwner &&
        (await this.scopeService.hasLeadershipRole(Number(effectiveOwnerId)));
      if (skipOwnerScopeForLeadership) {
        // Org-wide: no owner.userId filter. The org/sbu/vertical/dept/branch
        // filters below still constrain the result set.
      } else if (viewBy && viewBy === OWNER_TYPES.TEAM) {
        const users = await this.scopeService.getNewEmployeeHierarchyByUserId(
          effectiveOwnerId,
        );
        const userIdsList = users?.map((user: any) => user.userId) || [];
        if (!userIdsList.includes(effectiveOwnerId)) {
          userIdsList.push(effectiveOwnerId);
        }
        if (userIdsList.length > 0) {
          searchParams.push({
            searchBy: "owner.userId",
            searchValue: userIdsList,
          });
        }
      } else if ((viewBy && viewBy === OWNER_TYPES.MANAGER) || ownerId) {
        searchParams.push({
          searchBy: "owner.userId",
          searchValue: [effectiveOwnerId],
        });
      }

      const companyPriorityParam = searchParams.find(
        (param) =>
          param.searchBy === "companyPriority.lookUpValue" ||
          param.searchBy === ATTRIBUTE_FIELD_MAP.policyPriority ||
          param.searchBy === "companyPriority",
      );

      if (companyPriorityParam) {
        const rawValues = Array.isArray(companyPriorityParam.searchValue)
          ? companyPriorityParam.searchValue
          : [companyPriorityParam.searchValue];
        const numericValues = rawValues
          .map((val) => parseNumericValue(val))
          .filter((val): val is number => val !== undefined);
        if (numericValues.length > 0) {
          const lookupValues = await this.policyRepository.getLookupValues(
            numericValues,
          );
          if (lookupValues.length > 0) {
            companyPriorityParam.searchValue = lookupValues.map(
              (lookup) => lookup.lookUpValue,
            );
          }
        }
      }

      const transformedSearchParams = searchParams.map((param) => {
        const transformedParam = { ...param };
        switch (param.searchBy) {
          case ATTRIBUTE_FIELD_MAP.organisationId:
            transformedParam.searchBy = "policy.organisationId";
            break;
          case ATTRIBUTE_FIELD_MAP.sbuId:
            transformedParam.searchBy = "policy.sbuId";
            break;
          case ATTRIBUTE_FIELD_MAP.verticalId:
            transformedParam.searchBy = "policy.verticalId";
            break;
          case ATTRIBUTE_FIELD_MAP.departmentId:
            transformedParam.searchBy = "policy.departmentId";
            break;
          case ATTRIBUTE_FIELD_MAP.branchId:
            transformedParam.searchBy = "policy.branchId";
            break;
          case ATTRIBUTE_FIELD_MAP.ownerId:
          case "owner.userId":
            transformedParam.searchBy = "policy.owner.userId";
            break;
          case ATTRIBUTE_FIELD_MAP.companyName:
            transformedParam.searchBy = "policy.company.id";
            break;
          case ATTRIBUTE_FIELD_MAP.policyType:
            transformedParam.searchBy = "policy.policyType.lookUpValue";
            break;
          case "companyPriority.lookUpValue":
          case ATTRIBUTE_FIELD_MAP.policyPriority:
          case "companyPriority":
            transformedParam.searchBy = "policy.company.priority.lookUpValue";
            break;
          default:
            break;
        }
        return transformedParam;
      });

      const sortParams = mapSortParams(
        sort,
        ENTITY_NAME.ENDORSEMENT.toUpperCase(),
      );

      const normalizedTatRange = normalizeEndorsementTatFilter(tatRangeFilter);

      return await this.policyRepository.searchEndorsementManagementBatches(
        page,
        limit,
        transformedSearchParams,
        sortParams,
        searchBy,
        userId,
        field,
        fromDate,
        toDate,
        period,
        timeFilter,
        financialYear,
        normalizedTatRange,
        statusStepKeys,
        insurerId,
        businessMonth,
        skipOwnerScopeForLeadership,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "searchEndorsementBatches",
          payload: { page, limit, userId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch endorsement batches.",
      );
    }
  }

  async getAllEndorsementSteps(page: number, limit: number, search?: string) {
    try {
      return await this.policyRepository.getAllEndorsementSteps(
        page,
        limit,
        search,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch endorsement steps: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }
  async createCompanyCautionDeposit(
    dto: CreateCautionDepositDto,
    userId: number,
  ) {
    try {
      return await this.policyRepository.createCompanyCautionDeposit(
        dto,
        userId,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create caution deposit account: ${error.message}`,
      );
    }
  }

  async getCautionDepositsByCompany(
    companyId: number,
    search = "",
    page = 1,
    limit = 20,
  ) {
    try {
      return await this.policyRepository.getCautionDepositsByCompany(
        companyId,
        search,
        page,
        limit,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch caution deposits by company: ${error.message}`,
      );
    }
  }

  async getCompanyCautionDeposits(
    search = "",
    searchBy?: string,
    page = 1,
    limit = 20,
    loggedInUserId: number,
    ownerId?: number,
    viewBy?: "manager" | "team",
    organisationId?: number,
    sbuId?: number,
    verticalId?: number,
    branchId?: number,
  ) {
    try {
      const userId = ownerId ?? loggedInUserId;
      let userIds: number[] = [];
      if (viewBy === OWNER_TYPES.TEAM) {
        const users = await this.scopeService.getNewEmployeeHierarchyByUserId(
          userId,
        );
        userIds = Array.from(new Set([userId, ...users.map((u) => u.userId)]));
      } else {
        userIds = [userId];
      }
      const normalizedSearch =
        typeof search === "string" && search.includes("cdAccountStatus")
          ? search.replace(
              /cdAccountStatus:\[\/?([^/\]]+)\/?\]/gi,
              (_m, p1) => {
                return `cdAccountStatus:[${p1}]`;
              },
            )
          : search;
      const searchParams = mapSearchParams(normalizedSearch);
      if (organisationId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.organisationId,
          searchValue: [organisationId],
        });
      }
      if (organisationId) {
        const orgId = organisationId;
        const organisationIdNew =
          await this.policyRepository.getEntityTableMapIds(
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
            { id: orgId },
          );
        const lookupCriteria =
          organisationIdNew.length === 0
            ? { parentOrganisationId: orgId }
            : { id: orgId };
        const organisationIds =
          await this.policyRepository.getEntityTableMapIds(
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
            lookupCriteria,
          );
        const idx = searchParams.findIndex(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId,
        );
        if (idx !== -1) {
          searchParams[idx].searchValue = organisationIds;
        }
      }
      if (sbuId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.sbuId,
          searchValue: [sbuId],
        });
      }
      if (verticalId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.verticalId,
          searchValue: [verticalId],
        });
      }
      if (branchId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.branchId,
          searchValue: [branchId],
        });
      }
      return await this.policyRepository.getCompanyCautionDeposits(
        search,
        searchBy,
        page,
        limit,
        userIds,
        searchParams,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch company caution deposits: ${error.message}`,
      );
    }
  }

  async getCautionDepositTransactionsByCautionDepositId(
    cautionDepositId: number,
    page = 1,
    limit = 10,
    sort?: string,
  ) {
    try {
      return await this.policyRepository.getCautionDepositTransactionsByCautionDepositId(
        cautionDepositId,
        page,
        limit,
        undefined,
        sort,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch caution deposit transactions: ${error.message}`,
      );
    }
  }

  async exportCautionDepositTransactions(cautionDepositId: number): Promise<string> {
    try {
      const { data } =
        await this.policyRepository.getCautionDepositTransactionsByCautionDepositId(
          cautionDepositId,
        );

      // Use XLSX library like generateExcel does (proven to work)
      const workbook = XLSX.utils.book_new();
      const rows: any[][] = [];

      // const excelBuffer = await generateExcel(rows);

      // const passwordConfig = await getFilePasswordConfigClient().getConfiguration();
      // const password = generatePasswordFromConfig(passwordConfig, null);
      // const isModulePasswordEnabled = await this.getModulePasswordConfig(
      //   "cd_management"
      // );

      // const protectedFile = await applyPasswordProtection(
      //   excelBuffer,
      //   `caution-deposit-${cautionDepositId}-transactions.xlsx`,
      //   password,
      //   "cd_management",
      //   isModulePasswordEnabled
      // );

      // return protectedFile.data;
      // Add header row - All columns matching frontend table
      const headers = [
        "Transaction Date",
        "Transaction Type",
        "Transaction/Cheque Number",
        "Credit Amount",
        "Debit Amount",
        "Total Balance",
        "Intake Type",
        "Intake Number",
        "Transaction Mode",
        "Transaction Remarks",
        "IIRM Policy Number",
        "Insurer Policy Number",
        "Policy Type",
        "Creation Date",
        "Created By",
      ];
      rows.push(headers);

      // Add data rows with all columns matching frontend table
      if (data && data.length > 0) {
        data.forEach((row: any) => {
          const rowData = [
          row.transactionDate ? formatDateWithTime(new Date(row.transactionDate)) : "",
          row.type || "",
          row.neftRtgsNumber || "",
          row.creditAmount || 0,
          row.debitAmount || 0,
          row.balance || "",
          row.endorsementType || "",
          row.endorsementNumber || "",
          row.description || "",
          row.neftRtgsRemark || "",
          row.policyId || "",
          row.policyInsurerNumber || "",
          row.policyType || "",
          row.createdAt ? formatDateWithTime(new Date(row.createdAt)) : "",
          row.createdBy || "",
          ]; 
          
          rows.push(rowData);
        });
      }

      const sheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, "Transactions");
      
      const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      const buffer = Buffer.from(xlsxBuffer);

      // Generate filename and upload to S3
      const currentDate = new Date().toISOString().split("T")[0];
      const fileName = `caution-deposit-transactions-${cautionDepositId}_${currentDate}.xlsx`;
      const storageKey = `caution-deposit-transactions/${cautionDepositId}/${fileName}`;
      
      // Upload to S3 and return signed URL (same as employee insured export)
      const signedUrl = await uploadToS3(
        buffer,
        storageKey,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      
      return signedUrl;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "exportCautionDepositTransactions",
          payload: { cautionDepositId },
          messageData: error,
        }),
      });

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to export caution deposit transactions",
      );
    }
  }

  async getCautionDepositTransactionsByPolicy(
    policyId: number,
    page = 1,
    limit = 10,
  ) {
    try {
      return await this.policyRepository.getCautionDepositTransactionsByPolicy(
        policyId,
        page,
        limit,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch caution deposit transactions: ${error.message}`,
      );
    }
  }

  async getPolicyEmployeeInsuredExcel(
    policyId: number,
    relationshipGroup?: string,
    claimStatus?: string,
    effectiveFrom?: string,
    effectiveTo?: string,
    searchBy?: string,
    employeeId?: string,
    iirmPolicyId?: string,
    insurerEndorsementNumber?: string,
    insurerEndorsementDate?: string,
    tpaId?: string,
    status?: string,
    sort?: { field: string; order: "ASC" | "DESC" }[],
    userDetails?: UserDetailsForPassword | null,
    endorsementId?: string
  ): Promise<string> {
    try {
      const parsedEndorsementId = endorsementId
        ? Number(endorsementId)
        : undefined;
      if (endorsementId && Number.isNaN(parsedEndorsementId)) {
        const emptyRow = Object.values(EMPLOYEE_INSURED_EXCEL_LABELS).reduce(
          (acc, label) => {
            acc[label] = null;
            return acc;
          },
          {} as Record<string, null>,
        );
        const emptyRows = [emptyRow];
        const buffer = await generateExcel(emptyRows);
        const storageKey = `${EMPLOYEE_INSURED_EXCEL_STORAGE_PREFIX}/${policyId}/employee-insured-${Date.now()}.xlsx`;
        return await uploadToS3(
          buffer,
          storageKey,
          EMPLOYEE_INSURED_EXCEL_MIME_TYPE,
        );
      }

      // const { data } =
      //   await this.policyRepository.getPolicyEmployeeInsuredExcelByPolicyId(
      //     policyId,
      //     relationshipGroup,
      //     claimStatus,
      //     effectiveFrom,
      //     effectiveTo,
      //     searchBy,
      //     employeeId,
      //     iirmPolicyId,
      //     insurerEndorsementNumber,
      //     insurerEndorsementDate,
      //     tpaId,
      //     status,
      //     parsedEndorsementId,
      //     sort,
      //   );
      //   const emptyRows = [emptyRow];
      //   const buffer = await generateExcel(emptyRows);
      //   const storageKey = `${EMPLOYEE_INSURED_EXCEL_STORAGE_PREFIX}/${policyId}/employee-insured-${Date.now()}.xlsx`;
      //   return await uploadToS3(
      //     buffer,
      //     storageKey,
      //     EMPLOYEE_INSURED_EXCEL_MIME_TYPE,
      //   );
      // }

      // const rows = data.map((row: any) => ({
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.EMPLOYEE_COMPANY_ID]:
      //     row.employeeCompanyId ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.INSURED_NAME]: row.insuredName ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.INC_END_ID]: row.endorsementId ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.DOB]: row.dateOfBirth ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.GENDER]: row.gender ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.EFFECTIVE_FROM]:
      //     row.effectiveFrom ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.EFFECTIVE_TO]: row.effectiveTo ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.RELATIONSHIP_GROUP]:
      //     row.relationshipGroup ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.RELATION]: row.relation ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.SI_TOTAL]: row.sumInsuredTotal ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.SI_UTILIZED]:
      //     row.sumInsuredUtilized ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.SI_BALANCE]:
      //     row.sumInsuredBalance ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.CLAIMS_STATUS]: row.claimStatus ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.IIRM_POLICY_ID]:
      //     row.iirmPolicyId ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.INSURER_POLICY_NUMBER]:
      //     row.insurerPolicyNumber ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.INSURER_ENDORSEMENT_NUMBER]:
      //     row.insurerEndorsementNumber ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.INSURER_ENDORSEMENT_DATE]:
      //     row.insurerEndorsementDate ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.TPA_ID]: row.tpaId ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.MOBILE_NUMBER]: row.mobileNumber ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.EMAIL]: row.email ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.ENDORSEMENT_EFFECTIVE_DATE]:
      //     row.endorsementEffectiveDate ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.ADDITION_PRORATA_DAYS]:
      //     row.additionProrataDays ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.ADDITION_PREMIUM_EXCL_GST]:
      //     row.additionPremiumExcludingGst ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.DELETION_PRORATA_DAYS]:
      //     row.deletionProrataDays ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.DELETION_PREMIUM_EXCL_GST]:
      //     row.deletionPremiumExcludingGst ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.NET_PREMIUM_EXCL_GST]:
      //     row.netPremiumExcludingGst ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.IIRM_EMP_ID]: row.iirmEmpId ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.EMP_ID]: row.employeeId ?? null,
      //   [EMPLOYEE_INSURED_EXCEL_LABELS.STATUS]: row.status ?? null,
      // }));

      // const buffer = await generateExcel(rows);
      // const passwordConfig = await getFilePasswordConfigClient().getConfiguration();
      // const password = generatePasswordFromConfig(passwordConfig, userDetails || null);
      // const isModulePasswordEnabled = await this.getModulePasswordConfig("policies");
      // const baseFileName = `employee-insured-${Date.now()}.xlsx`;

      // const protectedFile = await applyPasswordProtection(
      const optimizedSortFields = new Set(
        EMPLOYEE_INSURED_OPTIMIZED_SORT_FIELDS,
      );
      const canUseOptimizedBatches =
        (sort ?? []).every(({ field }) => optimizedSortFields.has(field as any));

      if (!canUseOptimizedBatches) {
        const { data } =
          await this.policyRepository.getPolicyEmployeeInsuredExcelByPolicyId(
            policyId,
            relationshipGroup,
            claimStatus,
            effectiveFrom,
            effectiveTo,
            searchBy,
            employeeId,
            iirmPolicyId,
            insurerEndorsementNumber,
            insurerEndorsementDate,
            tpaId,
            status,
            parsedEndorsementId,
            sort,
          );

        const rows = data.map((row: any) => ({
          [EMPLOYEE_INSURED_EXCEL_LABELS.EMPLOYEE_COMPANY_ID]:
            row.employeeCompanyId ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.INSURED_NAME]: row.insuredName ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.INC_END_ID]: row.endorsementId ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.DOB]: row.dateOfBirth ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.GENDER]: row.gender ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.EFFECTIVE_FROM]:
            row.effectiveFrom ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.EFFECTIVE_TO]: row.effectiveTo ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.RELATIONSHIP_GROUP]:
            row.relationshipGroup ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.RELATION]: row.relation ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.SI_TOTAL]: row.sumInsuredTotal ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.SI_UTILIZED]:
            row.sumInsuredUtilized ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.SI_BALANCE]:
            row.sumInsuredBalance ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.CLAIMS_STATUS]:
            row.claimStatus ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.IIRM_POLICY_ID]:
            row.iirmPolicyId ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.INSURER_POLICY_NUMBER]:
            row.insurerPolicyNumber ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.INSURER_ENDORSEMENT_NUMBER]:
            row.insurerEndorsementNumber ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.INSURER_ENDORSEMENT_DATE]:
            row.insurerEndorsementDate ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.TPA_ID]: row.tpaId ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.MOBILE_NUMBER]:
            row.mobileNumber ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.EMAIL]: row.email ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.ENDORSEMENT_EFFECTIVE_DATE]:
            row.endorsementEffectiveDate ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.ADDITION_PRORATA_DAYS]:
            row.additionProrataDays ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.ADDITION_PREMIUM_EXCL_GST]:
            row.additionPremiumExcludingGst ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.DELETION_PRORATA_DAYS]:
            row.deletionProrataDays ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.DELETION_PREMIUM_EXCL_GST]:
            row.deletionPremiumExcludingGst ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.NET_PREMIUM_EXCL_GST]:
            row.netPremiumExcludingGst ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.IIRM_EMP_ID]: row.iirmEmpId ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.EMP_ID]: row.employeeId ?? null,
          [EMPLOYEE_INSURED_EXCEL_LABELS.STATUS]: row.status ?? null,
        }));

        const buffer = await generateExcel(rows);
        const storageKey = `${EMPLOYEE_INSURED_EXCEL_STORAGE_PREFIX}/${policyId}/employee-insured-${Date.now()}.xlsx`;
        return await uploadToS3(
          buffer,
          storageKey,
          EMPLOYEE_INSURED_EXCEL_MIME_TYPE,
        );
      }

      const tempFilePath = path.join(
        os.tmpdir(),
        `employee-insured-${policyId}-${Date.now()}.xlsx`,
      );
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: tempFilePath,
      });
      const worksheet = workbook.addWorksheet(EMPLOYEE_INSURED_WORKSHEET_NAME);
      worksheet
        .addRow(Object.values(EMPLOYEE_INSURED_EXCEL_LABELS))
        .commit();

      const batchSize = 2000;
      let page = 1;
      let total = 0;
      let writtenRows = 0;

      while (true) {
        const batch =
          await this.policyRepository.getPolicyEmployeeInsuredDetailsById(
            policyId,
            page,
            batchSize,
            relationshipGroup,
            claimStatus,
            effectiveFrom,
            effectiveTo,
            searchBy,
            employeeId,
            iirmPolicyId,
            insurerEndorsementNumber,
            insurerEndorsementDate,
            tpaId,
            status,
            sort,
            parsedEndorsementId,
          );

        if (page === 1) {
          total = batch.count ?? 0;
        }
        if (!batch.data?.length) {
          break;
        }

        for (const row of batch.data) {
          worksheet
            .addRow([
              row.employeeCompanyId ?? null,
              row.insuredName ?? null,
              row.endorsementId ?? null,
              row.dateOfBirth ?? null,
              row.gender ?? null,
              row.effectiveFrom ?? null,
              row.effectiveTo ?? null,
              row.relationshipGroup ?? null,
              row.relation ?? null,
              row.sumInsuredTotal ?? null,
              row.sumInsuredUtilized ?? null,
              row.sumInsuredBalance ?? null,
              row.claimStatus ?? null,
              row.iirmPolicyId ?? null,
              row.insurerPolicyNumber ?? null,
              row.insurerEndorsementNumber ?? null,
              row.insurerEndorsementDate ?? null,
              row.tpaId ?? null,
              row.mobileNumber ?? null,
              row.email ?? null,
              row.endorsementEffectiveDate ?? null,
              row.additionProrataDays ?? null,
              row.additionPremiumExcludingGst ?? null,
              row.deletionProrataDays ?? null,
              row.deletionPremiumExcludingGst ?? null,
              row.netPremiumExcludingGst ?? null,
              row.iirmEmpId ?? null,
              row.employeeId ?? null,
              row.status ?? null,
            ])
            .commit();
          writtenRows += 1;
        }

        if (writtenRows >= total) {
          break;
        }
        page += 1;
      }

      worksheet.commit();
      await workbook.commit();

      const buffer = await fs.promises.readFile(tempFilePath);
      const storageKey = `${EMPLOYEE_INSURED_EXCEL_STORAGE_PREFIX}/${policyId}/employee-insured-${Date.now()}.xlsx`;
      const signedUrl = await uploadToS3(
        buffer,
        storageKey,
        EMPLOYEE_INSURED_EXCEL_MIME_TYPE,
      );
      await fs.promises.unlink(tempFilePath).catch(() => undefined);
      return signedUrl;

      // const buffer = await fs.promises.readFile(tempFilePath);
      // const storageKey = `${EMPLOYEE_INSURED_EXCEL_STORAGE_PREFIX}/${policyId}/employee-insured-${Date.now()}.xlsx`;
      // const signedUrl = await uploadToS3(
      //   buffer,
      //   baseFileName,
      //   password,
      //   "policies",
      //   isModulePasswordEnabled
      // );

      // const storageKey = `${EMPLOYEE_INSURED_EXCEL_STORAGE_PREFIX}/${policyId}/${protectedFile.fileName}`;
      // return await uploadToS3(
      //   protectedFile.data,
      //   storageKey,
      //   protectedFile.mimeType || EMPLOYEE_INSURED_EXCEL_MIME_TYPE
      //   EMPLOYEE_INSURED_EXCEL_MIME_TYPE,
      // );
      await fs.promises.unlink(tempFilePath).catch(() => undefined);
      return signedUrl;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to export employee insured details: ${error.message}`,
      );
    }
  }

  async getCautionDepositsByPolicy(policyId: number) {
    try {
      return await this.policyRepository.getCautionDepositsByPolicy(policyId);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch caution deposits by policy: ${error.message}`,
      );
    }
  }

  async getInsurersByPolicy(policyId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getInsurersByPolicy",
          messageData: "method invoked",
        }),
      });
      const insurers = await this.policyRepository.getInsurersByPolicy(
        policyId,
      );

      if (!insurers || insurers.length === 0) {
        return { data: [], count: 0 };
      }
      // Transform the data to return only necessary fields
      const transformedInsurers = insurers.map((insurer) => ({
        id: insurer?.insurer?.id ?? null,
        insurerName: insurer?.insurer?.insurerName ?? null,
        displayName: insurer?.insurer?.displayName ?? null,
      }));
      return { data: transformedInsurers, count: insurers.length };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getInsurersByPolicy",
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
        `Failed to fetch insurers by policy: ${error.message}`,
      );
    }
  }

  async getCautionDepositDetailsById(id: number) {
    try {
      return await this.policyRepository.getCautionDepositDetailsById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch caution deposit balance: ${error.message}`,
      );
    }
  }

  async updateCautionDepositBalance(
    id: number,
    dto: UpdateCautionDepositDto,
    userId: number,
  ) {
    try {
      return await this.policyRepository.updateCautionDepositBalance(
        id,
        dto,
        userId,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update caution deposit balance: ${error.message}`,
      );
    }
  }

  async updateCautionDepositBalanceByPolicy(
    cautionDepositId: number,
    policyId: number,
    dto: UpdateCautionDepositDto,
    userId: number,
  ) {
    try {
      return await this.policyRepository.updateCautionDepositBalanceByPolicy(
        cautionDepositId,
        policyId,
        dto,
        userId,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update caution deposit balance for policy: ${error.message}`,
      );
    }
  }

  async updateCautionDepositAccountNumber(
    id: number,
    dto: UpdateCautionDepositAccountNumberDto,
    userId: number,
  ) {
    try {
      const updatedCautionDeposit =
        await this.policyRepository.updateCautionDepositAccountNumber(
          id,
          dto.cdAccountNumber,
          dto?.cdAccountName ?? null,
          userId,
        );

      await this.policyRepository.createPolicyAuditLogEntry({
        policyId: null,
        policyConfigurationId: null,
        entityType: POLICY_AUDIT_ENTITY_CAUTION_DEPOSIT,
        entityId: updatedCautionDeposit.id,
        action: POLICY_AUDIT_ACTION_CAUTION_DEPOSIT_ACCOUNT_NUMBER_UPDATED,
        performedBy: userId,
        remarks: null,
        metadata: {
          companyId: updatedCautionDeposit.companyId,
          insurerId: updatedCautionDeposit.insurerId,
          previousCdAccountNumber:
            updatedCautionDeposit.previousCdAccountNumber ?? null,
          updatedCdAccountNumber: updatedCautionDeposit.cdAccountNumber,
        },
      });

      const { previousCdAccountNumber, ...cautionDeposit } =
        updatedCautionDeposit;

      return cautionDeposit;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "updateCautionDepositAccountNumber",
          payload: { id, cdAccountNumber: dto.cdAccountNumber },
          messageData: error,
        }),
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.cautionDepositAccountNumberUpdateFailed,
      );
    }
  }

  async mergeCautionDeposits(
    sourceCdIds: number[],
    targetCDId: number,
    userId: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "mergeCautionDeposits",
          payload: { sourceCdIds, targetCDId },
          messageData: "method invoked",
        }),
      });

      return await this.policyRepository.mergeCautionDeposits(
        sourceCdIds,
        targetCDId,
        userId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "mergeCautionDeposits",
          payload: { sourceCdIds, targetCDId },
          messageData: error,
        }),
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to merge caution deposits",
      );
    }
  }

  async generatePerformanceOutputForAllUsers(
    month?: number,
    year?: number,
  ): Promise<boolean> {
    try {
      const ranges = await this.getDateRanges(month, year);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          ranges,
          status: "success",
          location: "PolicyService",
          method: "generatePerformanceOutputForAllUsers",
          messageData: "method invoked",
        }),
      });
      if (ranges.length === 0) {
        return;
      }

      const users = await this.policyRepository.findAllUsers();
      const activeUserIds = users.map((u) => u.userId);
      console.log(`Processing for the following month ranges:`, ranges);
      let allSucceeded = true;
      for (const range of ranges) {
        try {
          await this.processPolicyRange(activeUserIds, range);
        } catch (error) {
          console.error("Error processing range:", range, error);
          allSucceeded = false;
        }
      }
      return allSucceeded;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "generatePerformanceOutputForAllUsers",
          messageData: error,
        }),
      });
      console.error("Error in generatePerformanceOutputForAllUsers:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to generate performance output for all users.",
      );
    }
  }

  async getDateRanges(month?: number, year?: number): Promise<DateRange[]> {
    try {
      const ranges: DateRange[] = [];

      if (month !== undefined && year !== undefined) {
        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month, 1) - 1);
        ranges.push({
          start,
          end,
          performanceMonth: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
        });
        return ranges;
      }

      if (month !== undefined) {
        const currentYear = new Date().getFullYear();
        const start = new Date(Date.UTC(currentYear, month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(currentYear, month, 1) - 1);
        ranges.push({
          start,
          end,
          performanceMonth: new Date(
            Date.UTC(currentYear, month - 1, 1, 0, 0, 0, 0),
          ),
        });
        return ranges;
      }

      if (year !== undefined) {
        for (let m = 0; m < 12; m++) {
          const start = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0));
          const end = new Date(Date.UTC(year, m + 1, 1) - 1);
          ranges.push({
            start,
            end,
            performanceMonth: new Date(Date.UTC(year, m, 1, 0, 0, 0, 0)),
          });
        }
        return ranges;
      }
      // No args: rebuild every month from the earliest income date to today.
      const today = new Date();
      const earliest = await this.policyRepository.getEarliestPerformanceDate();
      if (!earliest) {
        return ranges;
      }
      const firstIdx =
        earliest.getUTCFullYear() * 12 + earliest.getUTCMonth();
      const lastIdx = today.getUTCFullYear() * 12 + today.getUTCMonth();
      for (let i = firstIdx; i <= lastIdx; i++) {
        const start = new Date(Date.UTC(Math.floor(i / 12), i % 12, 1, 0, 0, 0, 0));
        ranges.push({
          start,
          end: new Date(Date.UTC(Math.floor(i / 12), (i % 12) + 1, 1) - 1),
          performanceMonth: start,
        });
      }
      return ranges;
    } catch (error) {
      console.error("Error in getDateRanges:", error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to get date ranges.",
      );
    }
  }

  async processPolicyRange(
    activeUserIds: number[],
    range: DateRange,
  ): Promise<boolean> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          payload: {
            dateRange: range,
            activeUserIdsCount: activeUserIds.length,
          },
          status: "success",
          location: "PolicyService",
          method: "processPolicyRange",
          messageData: "method invoked",
        }),
      });
      if (activeUserIds.length === 0) {
        return true;
      }
      const start = range.start.toISOString().split("T")[0];
      const end = range.end.toISOString().split("T")[0];
      const [policyData, endorsementData, premiumData, brokerageCollectedData, rewardData] =
        await Promise.all([
          this.policyRepository.getPolicyPerformanceData(activeUserIds, start, end),
          this.policyRepository.getEndorsementPerformanceData(activeUserIds, start, end),
          this.policyRepository.getPolicyPremiumPerformanceData(activeUserIds, start, end),
          this.policyRepository.getPolicyBrokeragePerformanceData(activeUserIds, start, end),
          this.policyRepository.getRewardPerformanceData(activeUserIds, start, end),
        ]);

      const dataMap = new Map<
        string,
        {
          userId: number;
          organisationId: number | null;
          sbuId: number | null;
          verticalId: number | null;
          departmentId: number | null;
          branchId: number | null;
          policy: {
            so: { count: number; total: number };
            ro: { count: number; total: number };
            mined: { count: number; total: number };
          };
          endorsement: {
            so: { count: number; total: number };
            ro: { count: number; total: number };
            mined: { count: number; total: number };
          };
          premium: {
            policy: { count: number; total: number };
            endorsement: { count: number; total: number };
          };
          brokerageCollected: {
            policy: { count: number; total: number };
            endorsement: { count: number; total: number };
          };
          reward: { count: number; total: number };
        }
      >();

      const makeCompositeKey = (
        userId: number,
        organisationId: number | null,
        sbuId: number | null,
        verticalId: number | null,
        departmentId: number | null,
        branchId: number | null,
      ) => `${userId}|${organisationId}|${sbuId}|${verticalId}|${departmentId}|${branchId}`;

      const getOrCreateEntry = (
        userId: number,
        organisationId: number | null,
        sbuId: number | null,
        verticalId: number | null,
        departmentId: number | null,
        branchId: number | null,
      ) => {
        const key = makeCompositeKey(userId, organisationId, sbuId, verticalId, departmentId, branchId);
        if (!dataMap.has(key)) {
          dataMap.set(key, {
            userId,
            organisationId,
            sbuId,
            verticalId,
            departmentId,
            branchId,
            policy: {
              so: { count: 0, total: 0 },
              ro: { count: 0, total: 0 },
              mined: { count: 0, total: 0 },
            },
            endorsement: {
              so: { count: 0, total: 0 },
              ro: { count: 0, total: 0 },
              mined: { count: 0, total: 0 },
            },
            premium: {
              policy: { count: 0, total: 0 },
              endorsement: { count: 0, total: 0 },
            },
            brokerageCollected: {
              policy: { count: 0, total: 0 },
              endorsement: { count: 0, total: 0 },
            },
            reward: { count: 0, total: 0 },
          });
        }
        return dataMap.get(key)!;
      };

      for (const row of policyData) {
        const userId = parseInt(row.userId, 10);
        const entry = getOrCreateEntry(userId, row.organisationId ?? null, row.sbuId ?? null, row.verticalId ?? null, row.departmentId ?? null, row.branchId ?? null);
        const count = parseInt(row.count, 10);
        const total = parseFloat(row.total);

        if (row.opportunityType === SALES_OPPORTUNITY && row.isMined) {
          entry.policy.mined.count += count;
          entry.policy.mined.total += total;
        } else if (row.opportunityType === SALES_OPPORTUNITY) {
          entry.policy.so.count += count;
          entry.policy.so.total += total;
        } else if (row.opportunityType === RENEWAL_OPPORTUNITY) {
          entry.policy.ro.count += count;
          entry.policy.ro.total += total;
        }
      }

      for (const row of endorsementData) {
        const userId = parseInt(row.userId, 10);
        const entry = getOrCreateEntry(userId, row.organisationId ?? null, row.sbuId ?? null, row.verticalId ?? null, row.departmentId ?? null, row.branchId ?? null);
        const count = parseInt(row.count, 10);
        const total = parseFloat(row.total);

        if (row.opportunityType === SALES_OPPORTUNITY && row.isMined) {
          entry.endorsement.mined.count += count;
          entry.endorsement.mined.total += total;
        } else if (row.opportunityType === SALES_OPPORTUNITY) {
          entry.endorsement.so.count += count;
          entry.endorsement.so.total += total;
        } else if (row.opportunityType === RENEWAL_OPPORTUNITY) {
          entry.endorsement.ro.count += count;
          entry.endorsement.ro.total += total;
        }
      }

      for (const row of premiumData) {
        const userId = parseInt(row.userId, 10);
        const entry = getOrCreateEntry(userId, row.organisationId ?? null, row.sbuId ?? null, row.verticalId ?? null, row.departmentId ?? null, row.branchId ?? null);
        const target = parseFloat(row.targetPremium);
        const achieved = parseFloat(row.premiumCollected);
        if (row.sourceType === "ENDORSEMENT") {
          entry.premium.endorsement.total += Math.round(target);
          entry.premium.endorsement.count += Math.round(achieved);
        } else {
          entry.premium.policy.total += Math.round(target);
          entry.premium.policy.count += Math.round(achieved);
        }
      }

      for (const row of brokerageCollectedData) {
        const userId = parseInt(row.userId, 10);
        const entry = getOrCreateEntry(userId, row.organisationId ?? null, row.sbuId ?? null, row.verticalId ?? null, row.departmentId ?? null, row.branchId ?? null);
        const target = parseFloat(row.targetBrokerage);
        const achieved = parseFloat(row.brokerageCollected);
        if (row.sourceType === "ENDORSEMENT") {
          entry.brokerageCollected.endorsement.total += target;
          entry.brokerageCollected.endorsement.count += achieved;
        } else {
          entry.brokerageCollected.policy.total += target;
          entry.brokerageCollected.policy.count += achieved;
        }
      }

      for (const row of rewardData) {
        const userId = parseInt(String(row.userId), 10);
        const entry = getOrCreateEntry(userId, row.organisationId ?? null, row.sbuId ?? null, row.verticalId ?? null, row.departmentId ?? null, row.branchId ?? null);
        entry.reward.count += Number(row.count) || 0;
        entry.reward.total += Number(row.total) || 0;
      }

      const records: Partial<PerformanceOutput>[] = [];
      for (const dimensionEntry of dataMap.values()) {
        const { userId, organisationId, sbuId, verticalId, departmentId, branchId, policy: pStats, endorsement: eStats, premium, brokerageCollected: brokerage, reward: rStats } = dimensionEntry;
        const policyTotal = {
          count: pStats.so.count + pStats.ro.count + pStats.mined.count,
          total: pStats.so.total + pStats.ro.total + pStats.mined.total,
        };
        const endorsementTotal = {
          count: eStats.so.count + eStats.ro.count + eStats.mined.count,
          total: eStats.so.total + eStats.ro.total + eStats.mined.total,
        };
        const premiumPolicy = {
          count: premium.policy.count,
          total: premium.policy.total,
        };

        const premiumEndorsement = {
          count: premium.endorsement.count,
          total: premium.endorsement.total,
        };

        const brokerageCollectedPolicy = {
          count: brokerage.policy.count,
          total: brokerage.policy.total,
        };

        const brokerageCollectedEndorsement = {
          count: brokerage.endorsement.count,
          total: brokerage.endorsement.total,
        };

        const base = {
          userId,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          kpi: POLICY_PERFORMANCE_FIELDS.BROKERAGE,
          typeOfTarget: POLICY_PERFORMANCE_FIELDS.AMOUNT,
          performanceMonth: range.performanceMonth,
        };

        const entityStats = [
          { type: BUSINESS_TARGET_ENTITY_TYPE.SO, ...pStats.so },
          { type: BUSINESS_TARGET_ENTITY_TYPE.RO, ...pStats.ro },
          { type: BUSINESS_TARGET_ENTITY_TYPE.MINED, ...pStats.mined },
          { type: BUSINESS_TARGET_ENTITY_TYPE.TOTAL, ...policyTotal },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.SO_ENDORSEMENT,
            ...eStats.so,
          },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.RO_ENDORSEMENT,
            ...eStats.ro,
          },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.MINED_ENDORSEMENT,
            ...eStats.mined,
          },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.TOTAL_ENDORSEMENT,
            ...endorsementTotal,
          },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.POLICY_PREMIUM_POLICY,
            ...premiumPolicy,
          },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.POLICY_PREMIUM_ENDORSEMENT,
            ...premiumEndorsement,
          },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.BROKERAGE_COLLECTED_POLICY,
            ...brokerageCollectedPolicy,
          },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.BROKERAGE_COLLECTED_ENDORSEMENT,
            ...brokerageCollectedEndorsement,
          },
          {
            type: BUSINESS_TARGET_ENTITY_TYPE.TOTAL_REWARD,
            ...rStats,
          },
        ];

        for (const s of entityStats) {
          records.push({
            ...base,
            kpi:
              s.type === BUSINESS_TARGET_ENTITY_TYPE.POLICY_PREMIUM_POLICY ||
              s.type === BUSINESS_TARGET_ENTITY_TYPE.POLICY_PREMIUM_ENDORSEMENT
                ? POLICY_PERFORMANCE_FIELDS.PREMIUM_COLLECTED
                : s.type ===
                    BUSINESS_TARGET_ENTITY_TYPE.BROKERAGE_COLLECTED_POLICY ||
                  s.type ===
                    BUSINESS_TARGET_ENTITY_TYPE.BROKERAGE_COLLECTED_ENDORSEMENT
                ? POLICY_PERFORMANCE_FIELDS.BROKERAGE_COLLECTED
                : s.type === BUSINESS_TARGET_ENTITY_TYPE.TOTAL_REWARD
                ? POLICY_PERFORMANCE_FIELDS.REWARD
                : base.kpi,
            entityType: s.type,
            valueOfTarget: s.total,
            entityCount: s.count,
            updatedAt: new Date(),
          });
        }
      }
      await this.policyRepository.deletePerformanceOutputsByMonth(
        range.performanceMonth,
      );

      if (records.length > 0) {
        await this.policyRepository.savePerformanceOutputs(records);
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            payload: { insertedCount: records.length },
            status: "success",
            location: "PolicyService",
            method: "processPolicyRange",
            messageData: "performance outputs inserted",
          }),
        });
      }
      return true;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "processPolicyRange",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to process policy range.",
      );
    }
  }

  async getPolicyEndorsementSteps(policyId: number) {
    try {
      return await this.policyRepository.getPolicyEndorsementSteps(policyId);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch endorsement steps: ${error.message}`,
      );
    }
  }

  async getEndorsementSteps(policyId: number, endorsementId: number) {
    try {
      const startTime = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getEndorsementSteps",
          messageData: {
            message: "request-start",
            policyId,
            endorsementId,
          },
        }),
      });
      const data = await this.policyRepository.getEndorsementSteps(
        policyId,
        endorsementId,
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getEndorsementSteps",
          messageData: {
            message: "request-completed",
            policyId,
            endorsementId,
            durationMs: Date.now() - startTime,
          },
        }),
      });
      return data;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch endorsement steps: ${error.message}`,
      );
    }
  }

  async getAssetEndorsementSteps(policyId: number, endorsementId: number) {
    try {
      return await this.policyRepository.getAssetEndorsementSteps(
        policyId,
        endorsementId,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch asset endorsement steps: ${error.message}`,
      );
    }
  }

  async updateAssetEndorsementSteps(
    endorsementId: number,
    steps: Record<string, any>,
    userId: number,
  ) {
    try {
      await this.policyRepository.updateAssetEndorsementSteps(
        endorsementId,
        steps,
        userId,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update asset endorsement steps: ${error.message}`,
      );
    }
  }

  async updateEndorsementSteps(
    endorsementId: number,
    steps: Record<string, any>,
    userId: number,
  ) {
    try {
      await this.policyRepository.updateEndorsementSteps(
        endorsementId,
        steps,
        userId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update endorsement steps: ${error.message}`,
      );
    }
  }

  async updateEndorsementHeaders(
    endorsementId: number,
    netPremium: number,
    userId: number,
  ) {
    try {
      return await this.policyRepository.updateEndorsementHeaders(
        endorsementId,
        netPremium,
        userId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update endorsement headers: ${error.message}`,
      );
    }
  }

  async getInsurersBrokerageToCollect(
    page: number,
    limit: number,
    userId: number,
    financialYear?: number,
    timeFilter?: string,
    organisationId?: any,
    sbuId?: number,
    // Vertical and Branch are multiselect dashboard filters: one id or a list.
    verticalId?: number | number[],
    departmentId?: number,
    branchId?: number | number[],
    owner?: string,
    sort?: string,
    isLeadership?: boolean = false,
    from?: Date,
    to?: Date,
    insurerId?: number,
    businessMonth?: string,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getInsurersBrokerageToCollect",
          messageData: "method invoked",
        }),
      });
      let userIdsList;
      if (isLeadership === false) {
        userIdsList = await this.getFilteredUserIds(
          userId,
          !owner || owner === OWNER_TYPES.MANAGER
            ? OWNER_TYPES.MANAGER
            : undefined,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
        );
      } else {
        if (isLeadership === true) {
          const orgId = organisationId;
          if (orgId === 0) {
            const organisationIdNew =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
                { id: orgId },
              );

            const lookupCriteria =
              organisationIdNew.length === 0
                ? { parentOrganisationId: orgId }
                : { id: orgId };

            const organisationIds =
              await this.policyRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
                lookupCriteria,
              );
            organisationId = organisationIds;
          } else {
            organisationId = [organisationId];
          }
        }
      }
      const sortParams = sort ? mapSortParams(sort) : [];
      if (isLeadership === false && userIdsList.length < 1) return [];

      // If from/to dates are provided, use them; otherwise fall back to financialYear/timeFilter
      const useFromToDates = from && to;
      const effectiveFinancialYear = useFromToDates ? undefined : financialYear;
      const effectiveTimeFilter = useFromToDates ? undefined : timeFilter;

      const result = await this.policyRepository.getInsurersBrokerageToCollect(
        page,
        limit,
        userIdsList,
        effectiveFinancialYear,
        effectiveTimeFilter,
        sortParams,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        isLeadership,
        from,
        to,
        insurerId,
        businessMonth,
      );

      if (result.data.length > 0 || result.summary.length > 0) {
        const transformItem = (item) => ({
          insurerId: item.insurerId,
          insurerName: item.insurername,
          currentMonth: item.currentmonth,
          lastMonth: item.lastmonth,
          priorToThat: item.priortothat,
          total: item.total,
        });
        result.data = result.data.map(transformItem);
        result.summary = result.summary.map(transformItem);
      }

      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getInsurersBrokerageToCollect",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to get insurers brokerage to collect.",
      );
    }
  }

  async sendEndorsementNotificationEmails(
    policyId: number,
    url: string,
    contactType: string,
    isClientConfirmation: boolean = true,
    attachmentIds?: number[],
    emailIds?: number[],
    ccEmails?: string[],
  ) {
    try {
      await this.policyRepository.sendEndorsementNotificationEmails(
        policyId,
        url,
        contactType,
        isClientConfirmation,
        attachmentIds,
        emailIds,
        ccEmails,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send endorsement emails: ${error.message}`,
      );
    }
  }

  /**
   * Bulk update policies with specified field changes
   */
  async bulkUpdatePolicies(
    recordIds: number[],
    fieldUpdates: any,
    userId: number,
    selectedAll: boolean = false,
    excludedIds: number[] = [],
    selectedFilterValues: Record<string, any> = {},
  ): Promise<{
    totalRecords: number;
    successCount: number;
    failureCount: number;
    errors: {
      recordId: number;
      fieldName: string;
      errorCode: string;
      errorMessage: string;
    }[];
    affectedRecords: number[];
    processingDuration: number;
    bdOwnerUserList: any;
    isgOwnerUserList: any;
    accountManagerUserList: any;
  }> {
    try {
      const start = Date.now();

      // Determine final record IDs based on selectedAll flag
      let finalRecordIds: number[];

      if (selectedAll) {
        // Fetch all records matching the filter criteria
        if (
          selectedFilterValues.viewBy &&
          selectedFilterValues.viewBy.value == OWNER_TYPES.TEAM
        ) {
          const users =
            await this.policyRepository.getEmployeeHierarchyByUserId(
              selectedFilterValues?.ownerId?.value
                ? Number(selectedFilterValues?.ownerId?.value)
                : userId,
            );
          const userIdsList = users?.map((user: any) => user.userId) || [];
          selectedFilterValues["userIdsList"] = userIdsList;
        }

        const allFilteredIds = await this.policyRepository.getFilteredPolicyIds(
          selectedFilterValues,
          selectedFilterValues?.ownerId?.value
            ? Number(selectedFilterValues?.ownerId?.value)
            : userId,
        );

        // Remove excluded IDs from the filtered results
        finalRecordIds = allFilteredIds.filter(
          (id) => !excludedIds.includes(id),
        );
      } else {
        // Use provided recordIds directly
        finalRecordIds = recordIds;
      }
      let bdOwnerUserList, isgOwnerUserList, accountManagerUserList;
      bdOwnerUserList = await this.policyRepository.getBdUsersByPolicyIds(
        finalRecordIds,
      );
      isgOwnerUserList = await this.policyRepository.getIsgUsersByPolicyIds(
        finalRecordIds,
      );
      accountManagerUserList =
        await this.policyRepository.getAccountManagersByPolicyIds(
          finalRecordIds,
        );
      const errors: {
        recordId: number;
        fieldName: string;
        errorCode: string;
        errorMessage: string;
      }[] = [];
      const affectedRecords: number[] = [];

      if (!finalRecordIds?.length) {
        return {
          totalRecords: 0,
          successCount: 0,
          failureCount: 0,
          errors: [],
          affectedRecords: [],
          processingDuration: 0,
          bdOwnerUserList: [],
          isgOwnerUserList: [],
          accountManagerUserList: [],
        };
      }

      const normalizeFieldName = (fieldName: string): string =>
        typeof fieldName !== "string"
          ? ""
          : fieldName
              .trim()
              .replace(/[\s_-]+(.)?/g, (_, chr: string) =>
                chr ? chr.toUpperCase() : "",
              )
              .replace(/^(.)/, (match) => match.toLowerCase());

      const normalizedUpdates = Object.entries(fieldUpdates || {}).map(
        ([fieldName, value]) => ({
          originalFieldName: fieldName,
          fieldName: normalizeFieldName(fieldName),
          value: value,
          operation: "set",
        }),
      );

      if (!normalizedUpdates.length) {
        return {
          totalRecords: finalRecordIds.length,
          successCount: 0,
          failureCount: finalRecordIds.length,
          errors: finalRecordIds.map((recordId) => ({
            recordId,
            fieldName: "*",
            errorCode: "NO_UPDATES_PROVIDED",
            errorMessage: "No updates provided for bulk update",
          })),
          affectedRecords: [],
          processingDuration: 0,
          bdOwnerUserList: [],
          isgOwnerUserList: [],
          accountManagerUserList: [],
        };
      }

      const BULK_EDITABLE_FIELDS = new Set([
        "ownerId",
        "isgId",
        "amId",
        "policyStatusLid",
      ]);

      const BATCH_SIZE = 1000; // Process 1000 records per batch

      // Split records into batches for optimal processing
      const batches = [];
      for (let i = 0; i < finalRecordIds.length; i += BATCH_SIZE) {
        batches.push(finalRecordIds.slice(i, i + BATCH_SIZE));
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "bulkUpdatePolicies",
          messageData: `Start bulk update for ${finalRecordIds.length} policies (${normalizedUpdates.length} fields) in ${batches.length} batches of ${BATCH_SIZE}`,
        }),
      });

      // Process each batch in its own transaction for optimal performance
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchStart = Date.now();

        try {
          await this.policyRepository.dataSource.transaction(
            async (entityManager) => {
              for (const policyId of batch) {
                try {
                  // Check if policy exists using repository method
                  const existingId =
                    await this.policyRepository.getEntityTableMapIds(
                      "Policy",
                      "id",
                      { id: policyId },
                    );

                  if (!existingId || existingId.length === 0) {
                    errors.push({
                      recordId: policyId,
                      fieldName: "*",
                      errorCode: "NOT_FOUND",
                      errorMessage: "Policy not found",
                    });
                    this.logger.warn({
                      level: "warn",
                      message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        userId,
                        status: "failure",
                        location: "PolicyService",
                        method: "bulkUpdatePolicies",
                        messageData: `Policy ${policyId} not found`,
                      }),
                    });
                    continue;
                  }

                  // Validate and apply each field update
                  const updateData: any = {};
                  let hasValidUpdates = false;

                  for (const update of normalizedUpdates) {
                    try {
                      const { fieldName, value, originalFieldName } = update;

                      // Validate field is bulk editable
                      if (!BULK_EDITABLE_FIELDS.has(fieldName)) {
                        errors.push({
                          recordId: policyId,
                          fieldName: originalFieldName,
                          errorCode: "FIELD_NOT_BULK_EDITABLE",
                          errorMessage: `Field '${originalFieldName}' is not bulk editable for policies`,
                        });
                        continue;
                      }

                      // Handle different field types and operations
                      if (value === null || value === undefined) {
                        // Clear operation - set to null
                        updateData[fieldName] = null;
                      } else if (
                        fieldName === "policyStatusLid" &&
                        typeof value !== "number"
                      ) {
                        // Validate policyStatusLid is numeric
                        const numValue = parseInt(value as string, 10);
                        if (isNaN(numValue)) {
                          errors.push({
                            recordId: policyId,
                            fieldName: originalFieldName,
                            errorCode: "INVALID_TYPE",
                            errorMessage: `Invalid numeric value for ${originalFieldName}`,
                          });
                          continue;
                        }
                        updateData[fieldName] = numValue;
                      } else {
                        // Direct assignment for other fields
                        updateData[fieldName] = value;
                      }

                      hasValidUpdates = true;

                      this.logger.log({
                        level: "info",
                        message: buildLogMessage({
                          traceId: this.traceIdService.traceId,
                          userId,
                          status: "success",
                          location: "PolicyService",
                          method: "bulkUpdatePolicies",
                          messageData: `Policy ${policyId}: Setting ${originalFieldName} = ${value}`,
                        }),
                      });
                    } catch (fieldError) {
                      errors.push({
                        recordId: policyId,
                        fieldName: originalFieldName,
                        errorCode: "EXCEPTION",
                        errorMessage: `Field update failed: ${
                          (fieldError as Error).message
                        }`,
                      });

                      this.logger.error({
                        level: "error",
                        message: buildLogMessage({
                          traceId: this.traceIdService.traceId,
                          userId,
                          status: "failure",
                          location: "PolicyService",
                          method: "bulkUpdatePolicies",
                          messageData: `Policy ${policyId} field ${originalFieldName} error: ${
                            (fieldError as Error).message
                          }`,
                        }),
                      });
                    }
                  }

                  if (hasValidUpdates) {
                    // Update the policy using common updateEntityTableMapIds method
                    try {
                      if (
                        updateData["ownerId"] !== undefined &&
                        updateData["ownerId"] !== null
                      ) {
                        updateData["createdBy"] = Number(updateData["ownerId"]);
                      }
                      await this.policyRepository.updateEntityTableMapIds(
                        "Policy",
                        updateData,
                        { id: policyId },
                      );

                      affectedRecords.push(policyId);

                      this.logger.log({
                        level: "info",
                        message: buildLogMessage({
                          traceId: this.traceIdService.traceId,
                          userId,
                          status: "success",
                          location: "PolicyService",
                          method: "bulkUpdatePolicies",
                          messageData: `Policy ${policyId} updated successfully with ${
                            Object.keys(updateData).length
                          } fields`,
                        }),
                      });
                    } catch (updateError) {
                      errors.push({
                        recordId: policyId,
                        fieldName: "*",
                        errorCode: "UPDATE_FAILED",
                        errorMessage: `Database update failed: ${
                          (updateError as Error).message
                        }`,
                      });

                      this.logger.error({
                        level: "error",
                        message: buildLogMessage({
                          traceId: this.traceIdService.traceId,
                          userId,
                          status: "failure",
                          location: "PolicyService",
                          method: "bulkUpdatePolicies",
                          messageData: `Policy ${policyId} update failed: ${
                            (updateError as Error).message
                          }`,
                        }),
                      });
                    }
                  }
                } catch (recordError) {
                  errors.push({
                    recordId: policyId,
                    fieldName: "*",
                    errorCode: "EXCEPTION",
                    errorMessage: `Record processing failed: ${
                      (recordError as Error).message
                    }`,
                  });

                  this.logger.error({
                    level: "error",
                    message: buildLogMessage({
                      traceId: this.traceIdService.traceId,
                      userId,
                      status: "failure",
                      location: "PolicyService",
                      method: "bulkUpdatePolicies",
                      messageData: `Policy ${policyId} processing failed: ${
                        (recordError as Error).message
                      }`,
                    }),
                  });
                }
              }
            },
          );

          const batchDuration = Date.now() - batchStart;
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "success",
              location: "PolicyService",
              method: "bulkUpdatePolicies",
              messageData: `Batch ${batchIndex + 1}/${
                batches.length
              } completed in ${batchDuration}ms (${batch.length} policies)`,
            }),
          });
        } catch (batchError) {
          // Handle batch-level transaction errors
          for (const policyId of batch) {
            if (!errors.some((e) => e.recordId === policyId)) {
              errors.push({
                recordId: policyId,
                fieldName: "*",
                errorCode: "EXCEPTION",
                errorMessage: `Batch transaction failed: ${
                  (batchError as Error).message
                }`,
              });
            }
          }

          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "PolicyService",
              method: "bulkUpdatePolicies",
              messageData: `Batch ${batchIndex + 1} transaction failed: ${
                (batchError as Error).message
              }`,
            }),
          });
        }
      }

      const processingDuration = Date.now() - start;
      const successCount = affectedRecords.length;
      const failureCount = finalRecordIds.length - successCount;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "bulkUpdatePolicies",
          messageData: `Bulk update completed: ${successCount} success, ${failureCount} failed, ${processingDuration}ms total`,
        }),
      });
      finalRecordIds.map((recordId) => {
        bdOwnerUserList.map((item: any) => {
          if (item.policyIds.includes(recordId) && fieldUpdates.ownerId) {
            item.bdOwnerCount = item.bdOwnerCount + 1;
          }
        });
        isgOwnerUserList.map((item: any) => {
          if (item.policyIds.includes(recordId) && fieldUpdates.isgId) {
            item.isgOwnerCount = item.isgOwnerCount + 1;
          }
        });
        accountManagerUserList.map((item: any) => {
          if (item.policyIds.includes(recordId) && fieldUpdates.amId) {
            item.accountManagerCount = item.accountManagerCount + 1;
          }
        });
      });
      bdOwnerUserList.map(
        (item: any) => item.policyIds && delete item.policyIds,
      );
      isgOwnerUserList.map(
        (item: any) => item.policyIds && delete item.policyIds,
      );
      accountManagerUserList.map(
        (item: any) => item.policyIds && delete item.policyIds,
      );
      return {
        totalRecords: finalRecordIds.length,
        successCount,
        failureCount,
        errors,
        affectedRecords,
        processingDuration,
        bdOwnerUserList,
        isgOwnerUserList,
        accountManagerUserList,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "bulkUpdatePolicies",
          messageData: `Bulk update failed: ${(error as Error).message}`,
        }),
      });
      throw new BadRequestException("Policy bulk update failed");
    }
  }

  async getPolicyDocuments(
    policyId: number,
    page: number,
    limit: number,
    searchBy?: string,
    from?: Date,
    to?: Date,
    sort?: string,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyDocuments",
          payload: {
            policyId,
            page,
            limit,
            searchBy,
            from,
            to,
            sort,
          },
          messageData: "method invoked",
        }),
      });
      const documents = await this.policyRepository.getDocumentsByPolicyId(
        policyId,
        page,
        limit,
        searchBy,
        from,
        to,
        sort,
      );
      if (!documents || documents.count === 0) {
        return { data: [], count: 0 };
      }
      // Transform the data to return only necessary fields
      const transformedDocuments = documents.data.map((document: any) => ({
        id: document?.id ?? null,
        fileName: document?.filekey ?? null,
        activityId: document?.activityid ?? null,
        activityName: document?.activityname ?? null,
        subActivityName: document?.subactivityname ?? null,
        osTicketNumber: document?.osticketnumber ?? null,
        documentName: document?.documentname ?? null,
        uploadedAt: document?.uploadedat ?? null,
        uploadedBy: document?.uploadername ?? null,
        // Underlying document_type (or a per-branch sentinel for rows that
        // aren't from document_processing_file at all — endorsement creation
        // files, insurer acknowledgements, claim documents) — lets consumers
        // filter by real document type instead of guessing from documentName,
        // which is ambiguous (the same "Endorsement Document" label appears
        // from more than one of the UNIONed branches).
        documentType: document?.documenttype ?? null,
      }));
      return { data: transformedDocuments, count: documents.count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyDocuments",
          payload: {
            policyId,
            page,
            limit,
            searchBy,
            from,
            to,
          },
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
        `Failed to fetch documents for policy ID ${policyId}: ${error.message}`,
      );
    }
  }

  async uploadPolicyDocument(
    policyId: number,
    documentId: number,
    documentType: string,
    userId: number,
  ): Promise<any> {
    const ALLOWED_DOCUMENT_TYPES = [DOCUMENT_TYPES.MANDATE, DOCUMENT_TYPES.POLICY_FEATURE_DOCUMENT];
    const normalizedDocumentType = String(documentType ?? '').toLowerCase();
    if (!ALLOWED_DOCUMENT_TYPES.includes(normalizedDocumentType)) {
      throw new BadRequestException(
        `Invalid documentType. Allowed values: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
      );
    }

    const fileUpload = await this.policyRepository.getFileUploadById(documentId);
    if (!fileUpload) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const existing = await this.policyRepository.findActiveDocumentByType(policyId, normalizedDocumentType);
    if (existing) {
      const label =
        normalizedDocumentType === DOCUMENT_TYPES.MANDATE
          ? 'Mandate'
          : 'Policy Feature';
      throw new ConflictException(
        `Already ${label} document exists for this policy`,
      );
    }

    const record = await this.policyRepository.createPolicyFeatureDocument(
      policyId,
      documentId,
      userId,
      normalizedDocumentType,
    );

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PolicyService",
        method: "uploadPolicyDocument",
        payload: { policyId, documentId, documentType },
        messageData: "Policy document uploaded successfully",
      }),
    });

    return {
      id: record.id,
      policyId: record.policyId,
      documentId: record.documentId,
      documentType: record.documentType,
      status: record.status,
      createdAt: record.createdAt,
    };
  }

  // Policy Feature Document Methods
  async createPolicyFeatureDocument(
    policyId: number,
    documentId: number,
    userId: number,
    documentType: string,
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "createPolicyFeatureDocument",
          payload: { policyId, documentId, userId },
          messageData: "Creating policy feature document",
        }),
      });

      // Validate that the document exists in file_uploads table
      const fileUpload = await this.policyRepository.getFileUploadById(
        documentId,
      );

      if (!fileUpload) {
        throw new NotFoundException("Document not found in file uploads");
      }

      // Check if there's already an active document for this policy
      const existingDocuments =
        await this.policyRepository.getActivePolicyFeatureDocument(policyId);
      const isReplacement = existingDocuments.count > 0;

      // If there's an existing active document, mark it as replaced
      if (existingDocuments.count > 0 && existingDocuments.data.length > 0) {
        const existingDocument = existingDocuments.data[0] as { id: number };
        await this.policyRepository.markAsReplacedPolicyFeatureDocument(
          existingDocument.id,
          userId,
        );
      }

      // Create new policy feature document record
      const policyFeatureDocument =
        await this.policyRepository.createPolicyFeatureDocument(
          policyId,
          documentId,
          userId,
          documentType,
        );

      const operationType = isReplacement ? "replaced" : "created";
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "createPolicyFeatureDocument",
          payload: {
            policyId,
            documentId,
            result: policyFeatureDocument,
            operationType,
          },
          messageData: `Policy feature document ${operationType} successfully`,
        }),
      });

      return {
        id: policyFeatureDocument.id,
        policyId: policyFeatureDocument.policyId,
        documentId: policyFeatureDocument.documentId,
        status: policyFeatureDocument.status,
        createdAt: policyFeatureDocument.createdAt,
        updatedAt: policyFeatureDocument.updatedAt,
        createdBy: policyFeatureDocument.createdBy,
        updatedBy: policyFeatureDocument.updatedBy,
        isReplacement,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "createPolicyFeatureDocument",
          payload: { policyId, documentId, userId },
          messageData: `Failed to create policy feature document: ${
            (error as Error).message
          }`,
        }),
      });
      throw error;
    }
  }

  async getActivePolicyFeatureDocument(
    policyId: number,
  ): Promise<{ data: unknown[]; count: number }> {
    try {
      const result = await this.policyRepository.getActivePolicyFeatureDocument(
        policyId,
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getActivePolicyFeatureDocument",
          payload: { policyId },
          messageData: `Retrieved ${result.count} active policy feature documents`,
        }),
      });

      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getActivePolicyFeatureDocument",
          payload: { policyId },
          messageData: `Failed to get active policy feature document: ${
            (error as Error).message
          }`,
        }),
      });
      throw error;
    }
  }

  /**
   * Get policy feature document upload history with smart pagination
   * Returns paginated list of all policy feature document uploads for a policy
   * Repository handles pagination logic internally
   */
  async getPolicyFeatureDocumentUploadHistory(
    policyId: number,
    page?: string,
    limit?: string,
  ): Promise<{ data: unknown[]; count: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyFeatureDocumentUploadHistory",
          payload: { policyId, page, limit },
          messageData: "Retrieving policy feature document upload history",
        }),
      });

      const result =
        await this.policyRepository.getPolicyFeatureDocumentUploadHistory(
          policyId,
          page,
          limit,
        );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyFeatureDocumentUploadHistory",
          payload: { policyId, count: result.count },
          messageData:
            "Policy feature document upload history retrieved successfully",
        }),
      });

      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyFeatureDocumentUploadHistory",
          payload: { policyId, page, limit },
          messageData: `Failed to get policy feature document upload history: ${
            (error as Error).message
          }`,
        }),
      });
      throw error;
    }
  }

  async getSendToInsurerDocumentStatus(
    policyId: number,
    endorsementId: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "getSendToInsurerDocumentStatus",
          payload: { policyId, endorsementId },
          messageData: "method invoked",
        }),
      });

      return await this.policyRepository.getSendToInsurerDocumentStatus(
        policyId,
        endorsementId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "getSendToInsurerDocumentStatus",
          payload: { policyId, endorsementId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch send to insurer document status",
      );
    }
  }

  async resetSendToInsurerDocumentStatus(
    policyId: number,
    endorsementId: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyService",
          method: "resetSendToInsurerDocumentStatus",
          payload: { policyId, endorsementId },
          messageData: "method invoked",
        }),
      });

      return await this.policyRepository.resetSendToInsurerDocumentStatus(
        policyId,
        endorsementId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "resetSendToInsurerDocumentStatus",
          payload: { policyId, endorsementId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to reset send to insurer document status",
      );
    }
  }

  async getPolicyContacts(
    policyId: number,
    userId: number,
    contactType: string,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyContacts",
          payload: { policyId, contactType },
          messageData: "method invoked",
        }),
      });

      // Fetch contact details based on type
      let result;
      if (contactType === CONTACT_STATUS.INSURERS) {
        result = await this.policyRepository.fetchPolicyInsurerDetails(
          policyId,
        );
      } else if (contactType === CONTACT_STATUS.COMPANY) {
        result = await this.policyRepository.fetchPolicyCompanyContacts(
          policyId,
        );
      } else {
        throw new BadRequestException(
          "Invalid contact type. Must be 'insurers' or 'company'",
        );
      }

      if (!result || result.count === 0) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "success",
            location: "PolicyService",
            method: "getPolicyContacts",
            payload: { policyId, contactType },
            messageData: `No ${contactType} contacts found for this policy`,
          }),
        });
        return { data: [], count: 0 };
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "getPolicyContacts",
          payload: { policyId, contactType, contactCount: result.count },
          messageData: "Contact details fetched successfully",
        }),
      });

      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "getPolicyContacts",
          payload: { policyId, contactType },
          messageData: error,
        }),
      });

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch contact details for policy",
      );
    }
  }

  async createPolicyContacts(
    policyId: number,
    userId: number,
    contactType: string,
    contacts: any[],
  ): Promise<void> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "createPolicyContacts",
          payload: { policyId, contactType, contactCount: contacts.length },
          messageData: "method invoked",
        }),
      });

      // Validate contactType parameter
      if (
        contactType !== CONTACT_STATUS.INSURERS &&
        contactType !== CONTACT_STATUS.COMPANY
      ) {
        throw new BadRequestException(
          "Invalid contact type. Must be 'insurers' or 'company'",
        );
      }

      // Process each contact individually
      for (const contact of contacts) {
        if (!contact.companyId) {
          throw new BadRequestException(
            contactType === "insurers"
              ? "companyId (insurerId) is required for insurer contacts"
              : "companyId is required for company contacts",
          );
        }
        await this.policyRepository.processContact(
          contact,
          userId,
          policyId,
          contactType,
        );
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "createPolicyContacts",
          payload: { policyId, contactType, contactCount: contacts.length },
          messageData: "Contacts processed successfully",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "createPolicyContacts",
          payload: { policyId, contactType },
          messageData: error,
        }),
      });

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to process contact details for policy",
      );
    }
  }

  async getActiveMappingTemplates(
    companyId: number | undefined,
    entityName: string,
    fileDirection: string,
  ) {
    try {
      return await this.policyRepository.fetchMappingTemplates(
        companyId,
        entityName,
        fileDirection
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : `Failed to fetch active mapping templates for insurer ${companyId}`,
      );
    }
  }


  async prepareSeedDataByPolicyId(policyId: number): Promise<any> {
    try {
      const policyConfiguration =
        await this.policyRepository.getPolicyConfigurationByPolicyId(policyId);

      if (!policyConfiguration?.policyConfiguration) {
        throw new NotFoundException(`No policy configuration found for policy ID ${policyId}`);
      }

      const { fieldList } = this.buildEnrollmentTemplateFieldList(
        policyConfiguration?.policyConfiguration,
      );
      
      // DO insert the seed data in mstr_entity_fields_utility_ref
      return await this.policyRepository.insertInceptionSeedData(
        policyConfiguration?.policyId,
        fieldList,
      );
    }
    catch(e) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: null,
          status: "failure",
          location: "PolicyService",
          method: "prepareSeedDataByPolicyId",
          payload: { policyId },
          messageData: e,
        }),
      });

      if (
        e instanceof NotFoundException ||
        e instanceof BadRequestException
      ) {
        throw e;
      }

      throw new InternalServerErrorException(
        e instanceof Error
          ? e.message
          : "Failed to prepare seed data for policy",
      );
    }
  }

  async extractExcelData(documentId: number): Promise<{
    headers: string[];
    rows: Record<string, any>[];
    fileName: string | null;
  }> {
    try {
      return await this.policyRepository.extractExcelData(documentId);
    }
    catch(error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyService",
          method: "extractExcelData",
          payload: { documentId },
          messageData: error,
        }),
      });

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to extract Excel data",
      );
    }
  }

  /**
   * Create a new policy installment
   */
  async createPolicyInstallment(
    policyId: number,
    createInstallmentDto: CreatePolicyInstallmentDto,
    userId: number,
    file?: Express.Multer.File,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "createPolicyInstallment",
          payload: { policyId, installmentData: createInstallmentDto, hasFile: !!file },
          messageData: "method invoked",
        }),
      });

      let sourceFileId = createInstallmentDto.sourceFileId;

      // Handle file upload if file is provided
      if (file) {
        const fileUploadResult = await this.handleInstallmentFileUpload(
          file, 
          policyId, 
          userId
        );
        sourceFileId = fileUploadResult.id;
      } 
      // Handle case where frontend sends existing fileUpload object with ID
      else if (createInstallmentDto.fileUpload && createInstallmentDto.fileUpload.id) {
        sourceFileId = createInstallmentDto.fileUpload.id;
      }
      // Handle documents array (same pattern as meeting service)
      else if (createInstallmentDto.documents && Array.isArray(createInstallmentDto.documents) && createInstallmentDto.documents.length > 0) {
        const firstDocument = createInstallmentDto.documents[0];
        if (firstDocument && firstDocument.documentId) {
          sourceFileId = firstDocument.documentId;
        }
      }

      const installmentData = {
        ...createInstallmentDto,
        sourceFileId,
      };
      
      // Remove fileUpload, documents and other helper fields as they're not entity fields
      delete installmentData.fileUpload;
      delete installmentData.documents;

      return await this.policyRepository.createPolicyInstallment(
        policyId,
        installmentData,
        userId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "createPolicyInstallment",
          payload: { policyId, installmentData: createInstallmentDto, hasFile: !!file },
          messageData: error,
        }),
      });

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to create policy installment",
      );
    }
  }

  /**
   * Update an existing policy installment
   */
  async updatePolicyInstallment(
    policyId: number,
    installmentId: number,
    updateInstallmentDto: UpdatePolicyInstallmentDto,
    userId: number,
    file?: Express.Multer.File,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyService",
          method: "updatePolicyInstallment",
          payload: { policyId, installmentId, installmentData: updateInstallmentDto, hasFile: !!file },
          messageData: "method invoked",
        }),
      });

      let sourceFileId = updateInstallmentDto.sourceFileId;

      // Handle file upload if file is provided
      if (file) {
        const fileUploadResult = await this.handleInstallmentFileUpload(
          file, 
          policyId, 
          userId
        );
        sourceFileId = fileUploadResult.id;
      } 
      // Handle case where frontend sends existing fileUpload object with ID
      else if (updateInstallmentDto.fileUpload && updateInstallmentDto.fileUpload.id) {
        sourceFileId = updateInstallmentDto.fileUpload.id;
      }
      // Handle documents array (same pattern as meeting service)
      else if (updateInstallmentDto.documents && Array.isArray(updateInstallmentDto.documents) && updateInstallmentDto.documents.length > 0) {
        const firstDocument = updateInstallmentDto.documents[0];
        if (firstDocument && firstDocument.documentId) {
          sourceFileId = firstDocument.documentId;
        }
      }

      const installmentData = {
        ...updateInstallmentDto,
        sourceFileId,
      };
      
      // Remove fileUpload, documents and other helper fields as they're not entity fields
      delete installmentData.fileUpload;
      delete installmentData.documents;

      return await this.policyRepository.updatePolicyInstallment(
        policyId,
        installmentId,
        installmentData,
        userId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "updatePolicyInstallment",
          payload: { policyId, installmentId, installmentData: updateInstallmentDto, hasFile: !!file },
          messageData: error,
        }),
      });

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to update policy installment",
      );
    }
  }

  /**
   * Handle file upload for policy installments
   */
  private async handleInstallmentFileUpload(
    file: Express.Multer.File, 
    policyId: number, 
    userId: number
  ) {
    try {
      // Generate unique file key
      const timestamp = Date.now();
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileKey = `policy-installments/${policyId}/${timestamp}-${sanitizedFileName}`;
      
      // Upload to S3
      await uploadToS3(file.buffer, fileKey, file.mimetype);
      
      // Create file upload record
      const fileUploadRecord = await this.policyRepository.createFileUploadRecord({
        fileKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        companyType: "policy",
        companyId: policyId,
        uploadType: "AWS",
        documentTypeLid: 0, // Default value, you can adjust based on requirements
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        policyId: policyId,
      });
      
      return fileUploadRecord;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyService",
          method: "handleInstallmentFileUpload",
          payload: { policyId, fileName: file?.originalname },
          messageData: error,
        }),
      });
      
      throw new InternalServerErrorException(
        "Failed to upload installment file"
      );
    }
  }

  async getPolicyTypes(
    loggedInUserId: number,
    ownerId?: number,
    viewBy?: "manager" | "team",
    companyId?: number,
    insurerId?: number,
    showActive?: boolean,
  ): Promise<{ policyTypes: string[]; policies: PolicySummaryDto[] }> {
    if (companyId) {
      const policies = await this.policyRepository.findPoliciesByCompanyId(
        companyId,
        insurerId,
        showActive,
      );
      const policyTypes = Array.from(
        new Set(policies.map((p) => p.policyType).filter(Boolean)),
      );
      return { policyTypes, policies };
    }

    const userId = ownerId ?? loggedInUserId;
    let userIds: number[] = [];
    if (viewBy === OWNER_TYPES.TEAM) {
      const users = await this.scopeService.getNewEmployeeHierarchyByUserId(
        userId,
      );
      userIds =
        users && users.length > 0 ? users.map((u) => u.userId) : [userId];
    } else {
      userIds = [userId];
    }

    const uniqueUserIds = Array.from(new Set(userIds));
    if (!uniqueUserIds.length) {
      return { policyTypes: [], policies: [] };
    }

    const policyTypes = await this.policyRepository.findUniquePolicyTypes(
      uniqueUserIds,
    );
    return { policyTypes, policies: [] };
  }

  // FR-054.3: isBenefitComponent is a pure semantic marker. The only constraint
  // is ERR-BC-001 — the flag is meaningful only on optional add-on components.
  // SI model, SI option count, and SI value all follow the standard optional-
  // component rules (see §4.2a / FR-054 / FR-054.1).
  private validateBenefitComponents(config: any): void {
    if (!Array.isArray(config?.components)) return;
    for (const comp of config.components) {
      if (comp.isBenefitComponent === true && comp.type !== "optional") {
        throw new BadRequestException(
          "ERR-BC-001: isBenefitComponent may only be set on optional (add-on) components",
        );
      }
    }
  }

  // B-3: Validate dependent-count band rules (ERR-DC-001 to ERR-DC-006)
  private validateDependentCountBands(config: any): void {
    if (!Array.isArray(config?.parameters)) return;

    for (const param of config.parameters) {
      const isDependentCount =
        param.internalType === DEPENDENT_COUNT_INTERNAL_TYPE ||
        param.type === DEPENDENT_COUNT_INTERNAL_TYPE;
      if (!isDependentCount) continue;

      const bands: any[] = param.dependentCountConfig?.countBands ?? [];

      if (bands.length === 0) {
        throw new BadRequestException(
          "ERR-DC-001: At least one count band is required for a Dependent Count parameter",
        );
      }

      const sorted = [...bands].sort(
        (a, b) => Number(a.minCount) - Number(b.minCount),
      );

      if (Number(sorted[0].minCount) !== 0) {
        throw new BadRequestException(
          "ERR-DC-002: First count band must start at minCount = 0",
        );
      }

      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i];
        const next = sorted[i + 1];

        if (curr.maxCount === null || curr.maxCount === undefined) {
          throw new BadRequestException(
            "ERR-DC-004: Only the last count band may have maxCount = null (unlimited)",
          );
        }

        const currMax = Number(curr.maxCount);
        const nextMin = Number(next.minCount);

        if (currMax >= nextMin) {
          throw new BadRequestException("ERR-DC-003: Count bands must not overlap");
        }
        if (currMax + 1 !== nextMin) {
          throw new BadRequestException(
            "ERR-DC-005: Count bands must be contiguous — gap detected between bands",
          );
        }
      }

      for (const band of sorted) {
        if (Number(band.siEnhancement) < 0) {
          throw new BadRequestException(
            "ERR-DC-006: siEnhancement must be 0 or a positive integer",
          );
        }
      }
    }
  }

  // B-6: Validate applyToDependents boolean (ERR-ATD-001) and default absent values to false
  private validateAndDefaultApplyToDependents(config: any): void {
    if (!Array.isArray(config?.parameters)) return;

    for (const param of config.parameters) {
      if (param.applyToDependents === undefined || param.applyToDependents === null) {
        param.applyToDependents = false;
        continue;
      }
      if (typeof param.applyToDependents !== "boolean") {
        throw new BadRequestException(
          "ERR-ATD-001: applyToDependents must be a boolean value (true or false)",
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Policy Migration
  // ---------------------------------------------------------------------------

  private assertSafeIdentifier(name: string, label: string): void {
    if (!POLICY_MIGRATION_IDENTIFIER_RE.test(name)) {
      throw new BadRequestException(`Invalid ${label}: ${name}`);
    }
  }

  private assertSafeIdentifierList(names: string[], label: string): void {
    for (const name of names) {
      this.assertSafeIdentifier(name, label);
    }
  }

  async migratePolicies(
    batchSizeOverride?: number,
  ): Promise<MigratePoliciesResult> {
    // pg_advisory_lock/unlock are session-scoped — they must run on the SAME
    // physical connection, which a pooled this.dataSource.query() call does
    // not guarantee (each call can borrow a different connection). Use a
    // dedicated QueryRunner for the lock's whole lifetime instead.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const lockResult: Array<{ locked: boolean }> = await queryRunner.query(
        `SELECT pg_try_advisory_lock($1) AS locked`,
        [POLICY_MIGRATION_ADVISORY_LOCK_KEY],
      );
      if (!lockResult[0]?.locked) {
        throw new Error(
          "A policy migration run is already in progress on this database — skipping this invocation to avoid two runs racing to update the same rows.",
        );
      }
      try {
        return await this.migratePoliciesInternal(batchSizeOverride);
      } finally {
        await queryRunner.query(`SELECT pg_advisory_unlock($1)`, [
          POLICY_MIGRATION_ADVISORY_LOCK_KEY,
        ]);
      }
    } finally {
      await queryRunner.release();
    }
  }

  private async migratePoliciesInternal(
    batchSizeOverride?: number,
  ): Promise<MigratePoliciesResult> {
    const sourceViews = parseViewList(POLICY_MIGRATION_SOURCE_VIEW);
    const updateSourceViews = parseViewList(POLICY_MIGRATION_UPDATE_SOURCE_VIEW);
    const missedCompanySourceViews = parseViewList(POLICY_MIGRATION_MISSED_COMPANY_SOURCE_VIEW);
    const disableSourceViews = parseViewList(POLICY_MIGRATION_DISABLE_SOURCE_VIEW);
    this.assertSafeIdentifierList(sourceViews, "POLICY_MIGRATION_SOURCE_VIEW");
    this.assertSafeIdentifierList(updateSourceViews, "POLICY_MIGRATION_UPDATE_SOURCE_VIEW");
    this.assertSafeIdentifierList(missedCompanySourceViews, "POLICY_MIGRATION_MISSED_COMPANY_SOURCE_VIEW");
    this.assertSafeIdentifierList(disableSourceViews, "POLICY_MIGRATION_DISABLE_SOURCE_VIEW");
    this.assertSafeIdentifier(POLICY_MIGRATION_ORDER_COLUMN, "POLICY_MIGRATION_ORDER_COLUMN");

    const runId = new Date().toISOString().replace(/\D/g, "").substring(0, 14);
    const stagingTable = `zz_load_policy_${runId}`;
    const refTable = `${stagingTable}_ref`;
    const updateStagingTable = `zz_load_policy_upd_${runId}`;
    const updateBackupTable = `${updateStagingTable}_bkup`;
    const missedCompanyStagingTable = `zz_load_policy_missed_company_${runId}`;
    const missedCompanyRefTable = `${missedCompanyStagingTable}_ref`;
    const batchSize =
      batchSizeOverride && batchSizeOverride > 0
        ? batchSizeOverride
        : POLICY_MIGRATION_BATCH_SIZE;

    const result: MigratePoliciesResult = {
      migrationRunId: runId,
      stagingTable,
      refTable,
      totalRows: 0,
      totalBatches: 0,
      validRows: 0,
      errorRows: 0,
      insertedIntoPolicy: 0,
      insertedIntoPolicyInsurerMap: 0,
      errorLogTable: "policy_migration_error_log",
      batches: [],
      rawDataCsvKey: null,
      createErrorCsvKey: null,
      createSuccessCsvKey: null,
      updateStagingTable: null,
      updateBackupTable: null,
      updateTotalRows: 0,
      updateTotalBatches: 0,
      updatedRows: 0,
      updateErrorRows: 0,
      updateBatches: [],
      updateRawDataCsvKey: null,
      updateErrorCsvKey: null,
      updateSuccessCsvKey: null,
      missedCompanyStagingTable: null,
      missedCompanyRefTable: null,
      missedCompanyTotalRows: 0,
      missedCompanyTotalBatches: 0,
      missedCompanyValidRows: 0,
      missedCompanyErrorRows: 0,
      missedCompanyInsertedIntoPolicy: 0,
      missedCompanyInsertedIntoPolicyInsurerMap: 0,
      missedCompanyBatches: [],
      missedCompanyRawDataCsvKey: null,
      missedCompanyErrorCsvKey: null,
      missedCompanySuccessCsvKey: null,
      disableTotalRows: 0,
      disableTotalBatches: 0,
      disabledRows: 0,
      disableErrorRows: 0,
      disableBatches: [],
      disableRawDataCsvKey: null,
      disableErrorCsvKey: null,
      disableSuccessCsvKey: null,
    };

    // Accumulates one row per successfully created OR updated policy across
    // both phases and all batches, exported as
    // migrate_policy_success_log/..._<runId>.csv once the whole run finishes.
    const successRecords: Array<{
      policy_id: number;
      mig_ref_no: string | null;
      policy_name: string | null;
      phase: "create" | "update" | "missed_company" | "disable";
      timestamp: string;
    }> = [];

    // Helper: get a cell value — returns null for empty or "NULL" — works
    // whether the source view hands back strings (our sample: all TEXT) or
    // natively-typed values (a real client view: numbers/dates/etc.). Shared
    // by both the create-policy and update-policy phases below.
    const getVal = (row: Record<string, unknown>, col: string): string | null => {
      const v = row[col];
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return !s || s === "NULL" ? null : s;
    };

    // 1. Resolve the source database — MIGRATION_DB_URL (shared with
    // company migration, configured in service-lib) points this at the
    // client's database; unset falls back to this app's own DataSource for
    // local/dev testing against the sample views.
    const src = await this.migrationDataSourceService.getDataSource(this.dataSource);

    // 2. Fetch policy table schema (kept dynamic — mig_ref_no/ingested_at/
    //    ingested_mode live on the DB table but not on the TypeORM entity)
    const schemaCols: Array<{ column_name: string }> = await this.dataSource.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'policy' AND table_schema = 'public'`,
    );
    const schemaSet = new Set(schemaCols.map((c) => c.column_name));

    // Fetch the source view's own columns, in stable column order — used both
    // as the CSV header for the raw dump below, and to decide which policy
    // columns the source actually supplies (only columns the source provides
    // get written to `policy`/staging/ref — a column policy has but the
    // source doesn't is left OUT of every INSERT column list, so Postgres
    // applies its table DEFAULT instead of an explicit NULL, which would
    // violate NOT NULL columns with no default, e.g. `add_only_dependents`).
    const viewCols: Array<{ column_name: string }> = await src.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 ORDER BY ordinal_position`,
      [sourceViews[0]],
    );
    const viewColumns = viewCols.map((c) => c.column_name);

    // 3. Pull the ENTIRE source view(s) once. This is both (a) the raw audit
    // dump uploaded below and (b) the in-memory working set batches are
    // sliced from — no repeated querying of the source per batch. When
    // POLICY_MIGRATION_SOURCE_VIEW lists more than one view (e.g. individual vs.
    // corporate policies, split at the source but identically shaped), each
    // is queried separately and the rows are concatenated here rather than
    // combined via SQL UNION, so schema introspection above can keep
    // targeting a single named relation.
    const allRows: Array<Record<string, unknown>> = (
      await Promise.all(
        sourceViews.map((view) =>
          src.query(`SELECT * FROM ${view} ORDER BY ${POLICY_MIGRATION_ORDER_COLUMN}`),
        ),
      )
    ).flat();
    result.totalRows = allRows.length;
    result.totalBatches = Math.ceil(allRows.length / batchSize);

    // 4. Dump exactly what we received from the source to S3 BEFORE any
    // processing — a daily audit trail of "what the client's view gave us
    // today," independent of validation outcome. Non-fatal: an S3 failure
    // here shouldn't block the migration itself.
    try {
      result.rawDataCsvKey = await this.uploadCsvToS3(
        allRows,
        viewColumns,
        "migrate_policy_log",
        `migrate_policy_log_${runId}.csv`,
      );
    } catch (rawLogError) {
      this.logger.error({
        message: "Failed to upload raw policy migration source CSV",
        migrationRunId: runId,
        error: rawLogError,
      });
    }

    if (allRows.length > 0) {
    // 5. Create ONE staging table and ONE ref table for the whole run — every
    //    batch below inserts into these same two tables (NOT one pair per batch)
    const stagingCols = viewColumns.filter(
      (c) => c !== "id" && (schemaSet.has(c) || c === "insurer_id"),
    );
    const allStagingCols = [...stagingCols, "insurer_id"].filter(
      (v, i, a) => a.indexOf(v) === i,
    );
    await this.dataSource.query(
      `CREATE TABLE ${stagingTable} AS SELECT * FROM policy WHERE 1 = 2`,
    );
    await this.dataSource.query(
      `ALTER TABLE ${stagingTable} ADD COLUMN IF NOT EXISTS insurer_id bigint`,
    );
    await this.dataSource.query(
      `CREATE TABLE ${refTable} AS SELECT * FROM policy WHERE 1 = 2`,
    );
    await this.dataSource.query(
      `ALTER TABLE ${refTable} ADD COLUMN IF NOT EXISTS insurer_id bigint`,
    );

    interface RowError {
      rowSeq: number | null;
      migRefNo: string | null;
      column: string;
      value: string;
      reason: string;
    }

    // 6. Batch loop — slices the already-fetched rows, no further source queries
    for (
      let batchNumber = 1, offset = 0;
      offset < allRows.length;
      batchNumber++, offset += batchSize
    ) {
      const batchStart = Date.now();
      const rows = allRows.slice(offset, offset + batchSize);
      try {
        const collectUnique = (col: string): string[] => [
          ...new Set(
            rows
              .map((r) => getVal(r, col))
              .filter((v): v is string => v !== null),
          ),
        ];

        // Bulk FK/lookup checks — scoped to just this batch's distinct values
        const [
          validCompanyIds,
          validUserIds,
          validBrokerIds,
          validInsurerIds,
          validOrgIds,
          validSbuIds,
          validVerticalIds,
          validDeptIds,
          validBranchIds,
          validPolicyTypeLids,
          existingMigRefNos,
        ] = await Promise.all([
          this.migCheckIds("company", collectUnique("company_id")),
          this.migCheckIds("users", [
            ...collectUnique("owner_id"),
            ...collectUnique("created_by"),
            ...collectUnique("updated_by"),
          ]),
          this.migCheckIds("broker", collectUnique("broker_id")),
          this.migCheckIds("insurer", collectUnique("insurer_id")),
          this.migCheckIds("organisation", collectUnique("organisation_id")),
          this.migCheckIds("org_sbu", collectUnique("sbu_id")),
          this.migCheckIds("org_vertical", collectUnique("vertical_id")),
          this.migCheckIds("org_department", collectUnique("department_id")),
          this.migCheckIds("org_branch", collectUnique("branch_id")),
          this.migCheckLookupIds("POLICY_TYPE", collectUnique("policy_type_lid")),
          this.migGetExistingMigRefNos(collectUnique("mig_ref_no")),
        ]);

        // Validate every row in the batch — same rules as the original CSV flow
        const batchErrors: RowError[] = [];
        const validRows: Array<Record<string, unknown>> = [];

        for (const row of rows) {
          const rowSeqRaw = row[POLICY_MIGRATION_ORDER_COLUMN];
          const rowSeq =
            rowSeqRaw !== null && rowSeqRaw !== undefined && !Number.isNaN(Number(rowSeqRaw))
              ? Number(rowSeqRaw)
              : null;
          const migRefNo = getVal(row, "mig_ref_no");
          const errs: Array<{ column: string; value: string; reason: string }> = [];
          const g = (col: string) => getVal(row, col);

          const fkCheck = (
            col: string,
            validSet: Set<string>,
            table: string,
            nullable = false,
          ) => {
            const v = g(col);
            if (nullable && v === null) return;
            if (v !== null && !validSet.has(v)) {
              errs.push({ column: col, value: v, reason: `Not found in ${table}` });
            }
          };

          if (!g("policy_name")) {
            errs.push({ column: "policy_name", value: "", reason: "Required field is null/empty" });
          }
          if (!g("date_of_income")) {
            errs.push({ column: "date_of_income", value: "", reason: "Required field is null/empty" });
          }

          fkCheck("company_id", validCompanyIds, "company");
          fkCheck("owner_id", validUserIds, "users");
          fkCheck("broker_id", validBrokerIds, "broker", true);
          fkCheck("created_by", validUserIds, "users");
          fkCheck("updated_by", validUserIds, "users");
          fkCheck("insurer_id", validInsurerIds, "insurer", true);
          fkCheck("organisation_id", validOrgIds, "organisation");
          fkCheck("sbu_id", validSbuIds, "org_sbu");
          fkCheck("vertical_id", validVerticalIds, "org_vertical", true);
          fkCheck("department_id", validDeptIds, "org_department");
          fkCheck("branch_id", validBranchIds, "org_branch");
          fkCheck("policy_type_lid", validPolicyTypeLids, "lookup_data(POLICY_TYPE)");

          if (migRefNo && existingMigRefNos.has(migRefNo)) {
            errs.push({ column: "mig_ref_no", value: migRefNo, reason: "Already exists in policy table" });
          }

          if (errs.length > 0) {
            batchErrors.push(...errs.map((e) => ({ rowSeq, migRefNo, ...e })));
          } else {
            validRows.push(row);
          }
        }

        // Writes for this batch happen in one transaction — a failure here
        // rolls back only this batch; earlier committed batches are unaffected
        await this.dataSource.transaction(async (manager) => {
          // Multi-row INSERT of all rows in this batch into the staging table
          if (rows.length > 0) {
            const valueRows: unknown[] = [];
            const placeholders = rows.map((row, ri) => {
              const base = ri * allStagingCols.length;
              const vals = allStagingCols.map((col) => {
                if (col === "created_by" || col === "updated_by") {
                  return getVal(row, "owner_id");
                }
                return getVal(row, col);
              });
              valueRows.push(...vals);
              return `(${vals.map((_, ci) => `$${base + ci + 1}`).join(", ")})`;
            });
            await manager.query(
              `INSERT INTO ${stagingTable} (${allStagingCols.join(", ")}) VALUES ${placeholders.join(", ")}`,
              valueRows,
            );
          }

          // Insert this batch's valid rows into the ref table (generated ids + overrides)
          if (validRows.length > 0) {
            const validMigRefNos = validRows
              .map((r) => getVal(r, "mig_ref_no"))
              .filter((v): v is string => v !== null);

            const stagingSelectCols = allStagingCols.map((c) => {
              if (c === "premium_collected") return "gross_premium AS premium_collected";
              if (c === "ingested_at") return "current_timestamp AS ingested_at";
              if (c === "ingested_mode") return `'SQL_LOAD' AS ingested_mode`;
              if (c === "brokerage_collected") return "basic_brokerage_amount AS brokerage_collected";
              return c;
            });

            await manager.query(
              `INSERT INTO ${refTable} (id, ${allStagingCols.join(", ")})
               SELECT nextval('policy_id_seq'), ${stagingSelectCols.join(", ")}
               FROM ${stagingTable}
               WHERE mig_ref_no::text = ANY($1::text[])`,
              [validMigRefNos],
            );
            await manager.query(
              `UPDATE ${refTable} SET unique_ref_key = fm_get_unique_ref('PLC', id) WHERE unique_ref_key IS NULL`,
            );

            const policyCols = allStagingCols.filter((c) => c !== "insurer_id");
            const insertedPolicy: Array<{
              id: number;
              mig_ref_no: string | null;
              policy_name: string | null;
            }> = await manager.query(
              `INSERT INTO policy (id, ${policyCols.join(", ")})
               SELECT id, ${policyCols.join(", ")}
               FROM ${refTable}
               WHERE mig_ref_no::text = ANY($1::text[])
               RETURNING id, mig_ref_no, policy_name`,
              [validMigRefNos],
            );
            const insertedMap = await manager.query(
              `INSERT INTO policy_insurer_map (id, policy_id, insurer_id, insurer_participation_type_lid)
               SELECT nextval('policy_insurer_map_id_seq'), id, insurer_id, 486
               FROM ${refTable}
               WHERE insurer_id IS NOT NULL AND mig_ref_no::text = ANY($1::text[])
               RETURNING id`,
              [validMigRefNos],
            );
            result.insertedIntoPolicy += insertedPolicy.length;
            result.insertedIntoPolicyInsurerMap += insertedMap.length;

            const createdAt = new Date().toISOString();
            insertedPolicy.forEach((p) => {
              successRecords.push({
                policy_id: p.id,
                mig_ref_no: p.mig_ref_no,
                policy_name: p.policy_name,
                phase: "create",
                timestamp: createdAt,
              });
            });
          }

          // Persist this batch's failures so they can be found and corrected later
          if (batchErrors.length > 0) {
            const valueRows: unknown[] = [];
            const placeholders = batchErrors.map((e, ei) => {
              const base = ei * 7;
              valueRows.push(runId, batchNumber, e.rowSeq, e.migRefNo, e.column, e.value, e.reason);
              return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
            });
            await manager.query(
              `INSERT INTO policy_migration_error_log
                 (migration_run_id, batch_number, row_seq, mig_ref_no, column_name, bad_value, reason)
               VALUES ${placeholders.join(", ")}`,
              valueRows,
            );
          }
        });

        result.validRows += validRows.length;
        result.errorRows += batchErrors.length;
        result.batches.push({
          batchNumber,
          rowsRead: rows.length,
          validRows: validRows.length,
          errorRows: batchErrors.length,
          status: "completed",
          durationMs: Date.now() - batchStart,
        });
      } catch (batchError) {
        // Matches the bulkUpdatePolicies convention: log + continue to the
        // next batch rather than aborting the whole run
        this.logger.error({
          message: `Policy migration batch ${batchNumber} failed: ${
            batchError instanceof Error ? batchError.message : String(batchError)
          } ${(batchError as { code?: string })?.code ? `[${(batchError as { code?: string }).code}]` : ""}`,
        });
        result.batches.push({
          batchNumber,
          rowsRead: 0,
          validRows: 0,
          errorRows: 0,
          status: "failed",
          error: batchError instanceof Error ? batchError.message : String(batchError),
        });
      }
    }
    } // end if (allRows.length > 0) — create-policy phase

    // 6. Update-policy phase — the SAME stored procedure call above also
    // refreshes a second "update" view: existing policies whose fields
    // changed at the source. Reference: script-policy-update-pl-20260804-1845.sql
    // — matches rows by BOTH id and mig_ref_no (defense against a wrong
    // pairing), requires policy_from/policy_to to be present, and updates
    // every column the source supplies except mig_ref_no/unique_ref_key
    // (immutable identifiers) and ingested_at/ingested_mode (preserved from
    // the existing record, matching the legacy script's explicit no-op on
    // those two columns).
    const updateViewCols: Array<{ column_name: string }> = await src.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 ORDER BY ordinal_position`,
      [updateSourceViews[0]],
    );
    const updateViewColumns = updateViewCols.map((c) => c.column_name);

    // Same multi-view merge as the create phase — e.g. individual vs.
    // corporate policy updates split at the source into separate views.
    const updateRows: Array<Record<string, unknown>> = (
      await Promise.all(
        updateSourceViews.map((view) =>
          src.query(`SELECT * FROM ${view} ORDER BY ${POLICY_MIGRATION_ORDER_COLUMN}`),
        ),
      )
    ).flat();
    result.updateTotalRows = updateRows.length;
    result.updateTotalBatches = Math.ceil(updateRows.length / batchSize);

    try {
      result.updateRawDataCsvKey = await this.uploadCsvToS3(
        updateRows,
        updateViewColumns,
        "migrate_policy_log",
        `migrate_policy_log_update_${runId}.csv`,
      );
    } catch (updateRawLogError) {
      this.logger.error({
        message: "Failed to upload raw policy migration update-source CSV",
        migrationRunId: runId,
        error: updateRawLogError,
      });
    }

    if (updateRows.length > 0) {
      result.updateStagingTable = updateStagingTable;
      result.updateBackupTable = updateBackupTable;

      const IMMUTABLE_UPDATE_COLS = new Set([
        "id",
        "mig_ref_no",
        "unique_ref_key",
        "ingested_at",
        "ingested_mode",
        // Stamped explicitly by the UPDATE statement below (updated_via_sql_lid
        // = 9401, updated_via_sql_at = current_timestamp), not sourced from the
        // view — must be excluded here even though the view carries them,
        // otherwise they end up in both the dynamic SET clause AND the
        // explicit override, which Postgres rejects with "multiple
        // assignments to same column" (every update batch failed on this).
        "updated_via_sql_lid",
        "updated_via_sql_at",
      ]);
      const updateCols = updateViewColumns.filter(
        (c) => !IMMUTABLE_UPDATE_COLS.has(c) && schemaSet.has(c),
      );

      await this.dataSource.query(
        `CREATE TABLE ${updateStagingTable} AS SELECT * FROM policy WHERE 1 = 2`,
      );
      await this.dataSource.query(
        `CREATE TABLE ${updateBackupTable} AS SELECT * FROM policy WHERE 1 = 2`,
      );

      // Bulk-fetch (id -> mig_ref_no) for every policy referenced by the
      // update view, once for the whole run — used to enforce the dual-key
      // match rule per row without a query per batch.
      const updateIds = [
        ...new Set(
          updateRows.map((r) => getVal(r, "id")).filter((v): v is string => v !== null),
        ),
      ];
      const existingPolicies: Array<{ id: string; mig_ref_no: string | null }> = updateIds.length
        ? await this.dataSource.query(
            `SELECT id::text, mig_ref_no::text FROM policy WHERE id::text = ANY($1::text[])`,
            [updateIds],
          )
        : [];
      const existingPolicyByid = new Map(existingPolicies.map((p) => [p.id, p.mig_ref_no]));

      // FK/lookup validation — computed once for the whole phase (all rows
      // already in memory), matching the create/missed-company phases. This
      // phase previously had NO FK validation at all: a single bad FK
      // reference anywhere in a batch made the whole batch's UPDATE throw
      // (caught by the outer per-batch catch, logged to the console only —
      // never to policy_migration_error_log), silently dropping every row in
      // that batch from BOTH the success and error counts. Nullability here
      // mirrors the create phase's fkCheck calls exactly. Only checked when
      // the update view actually supplies (and this phase will therefore
      // write) that column.
      const collectUniqueUpdate = (col: string): string[] => [
        ...new Set(
          updateRows.map((r) => getVal(r, col)).filter((v): v is string => v !== null),
        ),
      ];
      const [
        validCompanyIdsUpdate,
        validUserIdsUpdate,
        validBrokerIdsUpdate,
        validInsurerIdsUpdate,
        validOrgIdsUpdate,
        validSbuIdsUpdate,
        validVerticalIdsUpdate,
        validDeptIdsUpdate,
        validBranchIdsUpdate,
        validPolicyTypeLidsUpdate,
      ] = await Promise.all([
        this.migCheckIds("company", collectUniqueUpdate("company_id")),
        this.migCheckIds("users", [
          ...collectUniqueUpdate("owner_id"),
          ...collectUniqueUpdate("created_by"),
          ...collectUniqueUpdate("updated_by"),
        ]),
        this.migCheckIds("broker", collectUniqueUpdate("broker_id")),
        this.migCheckIds("insurer", collectUniqueUpdate("insurer_id")),
        this.migCheckIds("organisation", collectUniqueUpdate("organisation_id")),
        this.migCheckIds("org_sbu", collectUniqueUpdate("sbu_id")),
        this.migCheckIds("org_vertical", collectUniqueUpdate("vertical_id")),
        this.migCheckIds("org_department", collectUniqueUpdate("department_id")),
        this.migCheckIds("org_branch", collectUniqueUpdate("branch_id")),
        this.migCheckLookupIds("POLICY_TYPE", collectUniqueUpdate("policy_type_lid")),
      ]);

      const updateFkChecks: Array<{
        column: string;
        validSet: Set<string>;
        table: string;
        nullable: boolean;
      }> = [
        { column: "company_id", validSet: validCompanyIdsUpdate, table: "company", nullable: false },
        { column: "owner_id", validSet: validUserIdsUpdate, table: "users", nullable: false },
        { column: "broker_id", validSet: validBrokerIdsUpdate, table: "broker", nullable: true },
        { column: "created_by", validSet: validUserIdsUpdate, table: "users", nullable: false },
        { column: "updated_by", validSet: validUserIdsUpdate, table: "users", nullable: false },
        { column: "insurer_id", validSet: validInsurerIdsUpdate, table: "insurer", nullable: true },
        { column: "organisation_id", validSet: validOrgIdsUpdate, table: "organisation", nullable: false },
        { column: "sbu_id", validSet: validSbuIdsUpdate, table: "org_sbu", nullable: false },
        { column: "vertical_id", validSet: validVerticalIdsUpdate, table: "org_vertical", nullable: true },
        { column: "department_id", validSet: validDeptIdsUpdate, table: "org_department", nullable: false },
        { column: "branch_id", validSet: validBranchIdsUpdate, table: "org_branch", nullable: false },
        {
          column: "policy_type_lid",
          validSet: validPolicyTypeLidsUpdate,
          table: "lookup_data(POLICY_TYPE)",
          nullable: false,
        },
      ].filter((def) => updateCols.includes(def.column));

      interface UpdateRowError {
        rowSeq: number | null;
        migRefNo: string | null;
        column: string | null;
        value: string | null;
        reason: string;
      }

      for (
        let batchNumber = 1, offset = 0;
        offset < updateRows.length;
        batchNumber++, offset += batchSize
      ) {
        const batchStart = Date.now();
        const rows = updateRows.slice(offset, offset + batchSize);
        try {
          const batchErrors: UpdateRowError[] = [];
          const validRows: Array<Record<string, unknown>> = [];
          const validIds: string[] = [];

          for (const row of rows) {
            const rowSeqRaw = row[POLICY_MIGRATION_ORDER_COLUMN];
            const rowSeq =
              rowSeqRaw !== null && rowSeqRaw !== undefined && !Number.isNaN(Number(rowSeqRaw))
                ? Number(rowSeqRaw)
                : null;
            const id = getVal(row, "id");
            const migRefNo = getVal(row, "mig_ref_no");

            if (!id) {
              batchErrors.push({ rowSeq, migRefNo, column: "id", value: null, reason: "Required field is null/empty" });
              continue;
            }
            if (!migRefNo) {
              batchErrors.push({ rowSeq, migRefNo, column: "mig_ref_no", value: null, reason: "Required field is null/empty" });
              continue;
            }
            const existingMigRefNo = existingPolicyByid.get(id);
            if (existingMigRefNo === undefined) {
              batchErrors.push({ rowSeq, migRefNo, column: "id", value: id, reason: "No policy found with this id" });
              continue;
            }
            if (existingMigRefNo !== migRefNo) {
              batchErrors.push({
                rowSeq,
                migRefNo,
                column: "mig_ref_no",
                value: migRefNo,
                reason: `mig_ref_no does not match existing policy record (expected ${existingMigRefNo})`,
              });
              continue;
            }
            if (!getVal(row, "policy_from") || !getVal(row, "policy_to")) {
              batchErrors.push({
                rowSeq,
                migRefNo,
                column: "policy_from/policy_to",
                value: null,
                reason: "policy_from and policy_to must both be present to apply an update",
              });
              continue;
            }

            const fkErrors: UpdateRowError[] = [];
            for (const { column, validSet, table, nullable } of updateFkChecks) {
              const v = getVal(row, column);
              if (v === null) {
                if (!nullable) {
                  fkErrors.push({ rowSeq, migRefNo, column, value: null, reason: "Required field is null/empty" });
                }
                continue;
              }
              if (!validSet.has(v)) {
                fkErrors.push({ rowSeq, migRefNo, column, value: v, reason: `Not found in ${table}` });
              }
            }
            if (fkErrors.length > 0) {
              batchErrors.push(...fkErrors);
              continue;
            }

            validRows.push(row);
            validIds.push(id);
          }

          await this.dataSource.transaction(async (manager) => {
            if (validRows.length > 0) {
              // Snapshot pre-update state for audit/rollback
              await manager.query(
                `INSERT INTO ${updateBackupTable} SELECT * FROM policy WHERE id::text = ANY($1::text[])`,
                [validIds],
              );

              // Stage this batch's incoming values — typed via the real
              // policy schema, same INSERT-coerces-text-to-typed-column
              // mechanism the create-phase staging table already relies on.
              const stagingInsertCols = ["id", ...updateCols];
              const valueRows: unknown[] = [];
              const placeholders = validRows.map((row) => {
                const base = valueRows.length;
                const vals = stagingInsertCols.map((c) => getVal(row, c));
                valueRows.push(...vals);
                return `(${vals.map((_, ci) => `$${base + ci + 1}`).join(", ")})`;
              });
              await manager.query(
                `INSERT INTO ${updateStagingTable} (${stagingInsertCols.join(", ")}) VALUES ${placeholders.join(", ")}`,
                valueRows,
              );

              const setClause = updateCols.map((c) => `${c} = s.${c}`).join(", ");
              // manager.query() for UPDATE/DELETE (unlike INSERT) returns a
              // [rows, affectedCount] tuple, not a plain rows array — must
              // destructure. Getting this wrong (treating the tuple itself
              // as the rows array) made `.length` always exactly 2 and every
              // row's fields undefined, regardless of how many rows the
              // UPDATE actually affected for real: every update-phase batch
              // silently reported ~2 phantom successes since this phase was
              // written.
              const [updated]: [
                Array<{
                  id: number;
                  mig_ref_no: string | null;
                  policy_name: string | null;
                }>,
                number,
              ] = await manager.query(
                `UPDATE policy p SET ${setClause}, updated_via_sql_lid = 9401, updated_via_sql_at = current_timestamp
                 FROM ${updateStagingTable} s
                 WHERE p.id = s.id AND s.id::text = ANY($1::text[])
                 RETURNING p.id AS id, p.mig_ref_no, p.policy_name`,
                [validIds],
              );
              result.updatedRows += updated.length;

              const updatedAt = new Date().toISOString();
              updated.forEach((p) => {
                successRecords.push({
                  policy_id: p.id,
                  mig_ref_no: p.mig_ref_no,
                  policy_name: p.policy_name,
                  phase: "update",
                  timestamp: updatedAt,
                });
              });
            }

            if (batchErrors.length > 0) {
              const valueRows: unknown[] = [];
              const placeholders = batchErrors.map((e) => {
                const base = valueRows.length;
                valueRows.push(runId, batchNumber, e.rowSeq, e.migRefNo, e.column, e.value, e.reason, "update");
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
              });
              await manager.query(
                `INSERT INTO policy_migration_error_log
                   (migration_run_id, batch_number, row_seq, mig_ref_no, column_name, bad_value, reason, phase)
                 VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }
          });

          result.updateErrorRows += batchErrors.length;
          result.updateBatches.push({
            batchNumber,
            rowsRead: rows.length,
            validRows: validRows.length,
            errorRows: batchErrors.length,
            status: "completed",
            durationMs: Date.now() - batchStart,
          });
        } catch (batchError) {
          this.logger.error({
            message: `Policy update-migration batch ${batchNumber} failed: ${
              batchError instanceof Error ? batchError.message : String(batchError)
            } ${(batchError as { code?: string })?.code ? `[${(batchError as { code?: string }).code}]` : ""}`,
          });
          result.updateBatches.push({
            batchNumber,
            rowsRead: 0,
            validRows: 0,
            errorRows: 0,
            status: "failed",
            error: batchError instanceof Error ? batchError.message : String(batchError),
          });
        }
      }
    }

    // 8. Missed-company phase — policies where the company couldn't be
    // resolved at source time; each row carries `company_unique_id` instead
    // of a direct `company_id`, resolved here against `company.mig_ref_no`
    // (the persisted source key added for exactly this purpose). Reference:
    // script-policy-load-with-company-unique-id-20260805-1940.sql. Same
    // staging/ref/insert pipeline shape as the create phase, except:
    // insurer_id and vertical_id are REQUIRED here (not nullable), matching
    // that reference script's validation rules.
    const missedCompanyViewCols: Array<{ column_name: string }> = await src.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 ORDER BY ordinal_position`,
      [missedCompanySourceViews[0]],
    );
    const missedCompanyViewColumns = missedCompanyViewCols.map((c) => c.column_name);

    const missedCompanyRows: Array<Record<string, unknown>> = (
      await Promise.all(
        missedCompanySourceViews.map((view) =>
          src.query(`SELECT * FROM ${view} ORDER BY ${POLICY_MIGRATION_ORDER_COLUMN}`),
        ),
      )
    ).flat();
    result.missedCompanyTotalRows = missedCompanyRows.length;
    result.missedCompanyTotalBatches = Math.ceil(missedCompanyRows.length / batchSize);

    try {
      result.missedCompanyRawDataCsvKey = await this.uploadCsvToS3(
        missedCompanyRows,
        missedCompanyViewColumns,
        "migrate_policy_log",
        `migrate_policy_log_missed_company_${runId}.csv`,
      );
    } catch (missedCompanyRawLogError) {
      this.logger.error({
        message: `Failed to upload raw policy migration missed-company source CSV: ${
          missedCompanyRawLogError instanceof Error
            ? missedCompanyRawLogError.message
            : String(missedCompanyRawLogError)
        }`,
        migrationRunId: runId,
      });
    }

    if (missedCompanyRows.length > 0) {
      result.missedCompanyStagingTable = missedCompanyStagingTable;
      result.missedCompanyRefTable = missedCompanyRefTable;

      const missedCompanyStagingCols = missedCompanyViewColumns.filter(
        (c) => c !== "id" && c !== "company_unique_id" && (schemaSet.has(c) || c === "insurer_id"),
      );
      const allMissedCompanyStagingCols = [...missedCompanyStagingCols, "insurer_id"].filter(
        (v, i, a) => a.indexOf(v) === i,
      );

      await this.dataSource.query(
        `CREATE TABLE ${missedCompanyStagingTable} AS SELECT * FROM policy WHERE 1 = 2`,
      );
      await this.dataSource.query(
        `ALTER TABLE ${missedCompanyStagingTable} ADD COLUMN IF NOT EXISTS insurer_id bigint`,
      );
      await this.dataSource.query(
        `CREATE TABLE ${missedCompanyRefTable} AS SELECT * FROM policy WHERE 1 = 2`,
      );
      await this.dataSource.query(
        `ALTER TABLE ${missedCompanyRefTable} ADD COLUMN IF NOT EXISTS insurer_id bigint`,
      );

      // Resolve company_id via company.mig_ref_no — once for the whole
      // phase (all rows already in memory).
      const companyUniqueIds = [
        ...new Set(
          missedCompanyRows
            .map((r) => getVal(r, "company_unique_id"))
            .filter((v): v is string => v !== null),
        ),
      ];
      const resolvedCompanies: Array<{ id: string; mig_ref_no: string }> = companyUniqueIds.length
        ? await this.dataSource.query(
            `SELECT id::text, mig_ref_no::text FROM company WHERE mig_ref_no::text = ANY($1::text[])`,
            [companyUniqueIds],
          )
        : [];
      const companyIdByUniqueId = new Map(resolvedCompanies.map((c) => [c.mig_ref_no, c.id]));

      // FK/lookup checks — computed once for the whole phase.
      const collectUniqueMissed = (col: string): string[] => [
        ...new Set(
          missedCompanyRows.map((r) => getVal(r, col)).filter((v): v is string => v !== null),
        ),
      ];
      const [
        validUserIdsMissed,
        validBrokerIdsMissed,
        validInsurerIdsMissed,
        validOrgIdsMissed,
        validSbuIdsMissed,
        validVerticalIdsMissed,
        validDeptIdsMissed,
        validBranchIdsMissed,
        validPolicyTypeLidsMissed,
        existingMigRefNosMissed,
      ] = await Promise.all([
        this.migCheckIds("users", [
          ...collectUniqueMissed("owner_id"),
          ...collectUniqueMissed("created_by"),
          ...collectUniqueMissed("updated_by"),
        ]),
        this.migCheckIds("broker", collectUniqueMissed("broker_id")),
        this.migCheckIds("insurer", collectUniqueMissed("insurer_id")),
        this.migCheckIds("organisation", collectUniqueMissed("organisation_id")),
        this.migCheckIds("org_sbu", collectUniqueMissed("sbu_id")),
        this.migCheckIds("org_vertical", collectUniqueMissed("vertical_id")),
        this.migCheckIds("org_department", collectUniqueMissed("department_id")),
        this.migCheckIds("org_branch", collectUniqueMissed("branch_id")),
        this.migCheckLookupIds("POLICY_TYPE", collectUniqueMissed("policy_type_lid")),
        this.migGetExistingMigRefNos(collectUniqueMissed("mig_ref_no")),
      ]);

      interface MissedCompanyRowError {
        rowSeq: number | null;
        migRefNo: string | null;
        column: string;
        value: string;
        reason: string;
      }

      for (
        let batchNumber = 1, offset = 0;
        offset < missedCompanyRows.length;
        batchNumber++, offset += batchSize
      ) {
        const batchStart = Date.now();
        const rows = missedCompanyRows.slice(offset, offset + batchSize);
        try {
          const batchErrors: MissedCompanyRowError[] = [];
          const validRows: Array<Record<string, unknown>> = [];

          for (const row of rows) {
            const rowSeqRaw = row[POLICY_MIGRATION_ORDER_COLUMN];
            const rowSeq =
              rowSeqRaw !== null && rowSeqRaw !== undefined && !Number.isNaN(Number(rowSeqRaw))
                ? Number(rowSeqRaw)
                : null;
            const migRefNo = getVal(row, "mig_ref_no");
            const errs: Array<{ column: string; value: string; reason: string }> = [];
            const g = (col: string) => getVal(row, col);

            // Unlike the create phase's fkCheck (which leaves a NULL
            // required column unflagged — a pre-existing gap this doesn't
            // touch elsewhere), this one correctly rejects NULL when
            // nullable=false, matching the reference script's SQL
            // `col IN (SELECT ...)` semantics (NULL never satisfies IN).
            const fkCheck = (col: string, validSet: Set<string>, table: string, nullable = false) => {
              const v = g(col);
              if (v === null) {
                if (!nullable) {
                  errs.push({ column: col, value: "", reason: "Required field is null/empty" });
                }
                return;
              }
              if (!validSet.has(v)) {
                errs.push({ column: col, value: v, reason: `Not found in ${table}` });
              }
            };

            const companyUniqueId = g("company_unique_id");
            let resolvedCompanyId: string | null = null;
            if (!companyUniqueId) {
              errs.push({ column: "company_unique_id", value: "", reason: "Required field is null/empty" });
            } else {
              resolvedCompanyId = companyIdByUniqueId.get(companyUniqueId) ?? null;
              if (resolvedCompanyId === null) {
                errs.push({
                  column: "company_unique_id",
                  value: companyUniqueId,
                  reason: "No company found with this company_unique_id (company.mig_ref_no)",
                });
              }
            }

            if (!g("policy_name")) {
              errs.push({ column: "policy_name", value: "", reason: "Required field is null/empty" });
            }
            if (!g("date_of_income")) {
              errs.push({ column: "date_of_income", value: "", reason: "Required field is null/empty" });
            }

            fkCheck("owner_id", validUserIdsMissed, "users");
            fkCheck("broker_id", validBrokerIdsMissed, "broker", true);
            fkCheck("created_by", validUserIdsMissed, "users");
            fkCheck("updated_by", validUserIdsMissed, "users");
            fkCheck("insurer_id", validInsurerIdsMissed, "insurer");
            fkCheck("organisation_id", validOrgIdsMissed, "organisation");
            fkCheck("sbu_id", validSbuIdsMissed, "org_sbu");
            fkCheck("vertical_id", validVerticalIdsMissed, "org_vertical");
            fkCheck("department_id", validDeptIdsMissed, "org_department");
            fkCheck("branch_id", validBranchIdsMissed, "org_branch");
            fkCheck("policy_type_lid", validPolicyTypeLidsMissed, "lookup_data(POLICY_TYPE)");

            if (migRefNo && existingMigRefNosMissed.has(migRefNo)) {
              errs.push({ column: "mig_ref_no", value: migRefNo, reason: "Already exists in policy table" });
            }

            if (errs.length > 0) {
              batchErrors.push(...errs.map((e) => ({ rowSeq, migRefNo, ...e })));
            } else {
              // Clone with company_id overridden to the resolved value so
              // the insert logic below (which reads company_id via getVal)
              // picks it up transparently.
              validRows.push({ ...row, company_id: resolvedCompanyId });
            }
          }

          await this.dataSource.transaction(async (manager) => {
            if (rows.length > 0) {
              const valueRows: unknown[] = [];
              const placeholders = rows.map((row, ri) => {
                const base = ri * allMissedCompanyStagingCols.length;
                const vals = allMissedCompanyStagingCols.map((col) => {
                  if (col === "created_by" || col === "updated_by") return getVal(row, "owner_id");
                  if (col === "company_id") {
                    const cuid = getVal(row, "company_unique_id");
                    return cuid ? companyIdByUniqueId.get(cuid) ?? null : null;
                  }
                  return getVal(row, col);
                });
                valueRows.push(...vals);
                return `(${vals.map((_, ci) => `$${base + ci + 1}`).join(", ")})`;
              });
              await manager.query(
                `INSERT INTO ${missedCompanyStagingTable} (${allMissedCompanyStagingCols.join(", ")}) VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }

            if (validRows.length > 0) {
              const validMigRefNos = validRows
                .map((r) => getVal(r, "mig_ref_no"))
                .filter((v): v is string => v !== null);

              const stagingSelectCols = allMissedCompanyStagingCols.map((c) => {
                if (c === "premium_collected") return "gross_premium AS premium_collected";
                if (c === "ingested_at") return "current_timestamp AS ingested_at";
                if (c === "ingested_mode") return `'SQL_LOAD' AS ingested_mode`;
                if (c === "brokerage_collected") return "basic_brokerage_amount AS brokerage_collected";
                return c;
              });

              await manager.query(
                `INSERT INTO ${missedCompanyRefTable} (id, ${allMissedCompanyStagingCols.join(", ")})
                 SELECT nextval('policy_id_seq'), ${stagingSelectCols.join(", ")}
                 FROM ${missedCompanyStagingTable}
                 WHERE mig_ref_no::text = ANY($1::text[])`,
                [validMigRefNos],
              );
              await manager.query(
                `UPDATE ${missedCompanyRefTable} SET unique_ref_key = fm_get_unique_ref('PLC', id) WHERE unique_ref_key IS NULL`,
              );

              const policyCols = allMissedCompanyStagingCols.filter((c) => c !== "insurer_id");
              const insertedPolicy: Array<{
                id: number;
                mig_ref_no: string | null;
                policy_name: string | null;
              }> = await manager.query(
                `INSERT INTO policy (id, ${policyCols.join(", ")})
                 SELECT id, ${policyCols.join(", ")}
                 FROM ${missedCompanyRefTable}
                 WHERE mig_ref_no::text = ANY($1::text[])
                 RETURNING id, mig_ref_no, policy_name`,
                [validMigRefNos],
              );
              const insertedMap = await manager.query(
                `INSERT INTO policy_insurer_map (id, policy_id, insurer_id, insurer_participation_type_lid)
                 SELECT nextval('policy_insurer_map_id_seq'), id, insurer_id, 486
                 FROM ${missedCompanyRefTable}
                 WHERE insurer_id IS NOT NULL AND mig_ref_no::text = ANY($1::text[])
                 RETURNING id`,
                [validMigRefNos],
              );
              result.missedCompanyInsertedIntoPolicy += insertedPolicy.length;
              result.missedCompanyInsertedIntoPolicyInsurerMap += insertedMap.length;

              const createdAt = new Date().toISOString();
              insertedPolicy.forEach((p) => {
                successRecords.push({
                  policy_id: p.id,
                  mig_ref_no: p.mig_ref_no,
                  policy_name: p.policy_name,
                  phase: "missed_company",
                  timestamp: createdAt,
                });
              });
            }

            if (batchErrors.length > 0) {
              const valueRows: unknown[] = [];
              const placeholders = batchErrors.map((e) => {
                const base = valueRows.length;
                valueRows.push(runId, batchNumber, e.rowSeq, e.migRefNo, e.column, e.value, e.reason, "missed_company");
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
              });
              await manager.query(
                `INSERT INTO policy_migration_error_log
                   (migration_run_id, batch_number, row_seq, mig_ref_no, column_name, bad_value, reason, phase)
                 VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }
          });

          result.missedCompanyValidRows += validRows.length;
          result.missedCompanyErrorRows += batchErrors.length;
          result.missedCompanyBatches.push({
            batchNumber,
            rowsRead: rows.length,
            validRows: validRows.length,
            errorRows: batchErrors.length,
            status: "completed",
            durationMs: Date.now() - batchStart,
          });
        } catch (batchError) {
          this.logger.error({
            message: `Policy missed-company migration batch ${batchNumber} failed: ${
              batchError instanceof Error ? batchError.message : String(batchError)
            } ${(batchError as { code?: string })?.code ? `[${(batchError as { code?: string }).code}]` : ""}`,
          });
          result.missedCompanyBatches.push({
            batchNumber,
            rowsRead: 0,
            validRows: 0,
            errorRows: 0,
            status: "failed",
            error: batchError instanceof Error ? batchError.message : String(batchError),
          });
        }
      }
    }

    // 7. Disable phase — policies to be disabled-for-performance at the
    // source. Matched by BOTH id and mig_ref_no (same dual-key rule as the
    // update phase); only `enabled_for_performance_lid` is written, via an
    // inline VALUES join rather than a staging table since it's the only
    // column touched. manager.query() for UPDATE returns a [rows,
    // affectedCount] tuple (see the update phase's fix above) — destructured
    // the same way here.
    const disableViewCols: Array<{ column_name: string }> = await src.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 ORDER BY ordinal_position`,
      [disableSourceViews[0]],
    );
    const disableViewColumns = disableViewCols.map((c) => c.column_name);

    const disableRows: Array<Record<string, unknown>> = (
      await Promise.all(
        disableSourceViews.map((view) =>
          src.query(`SELECT * FROM ${view} ORDER BY ${POLICY_MIGRATION_ORDER_COLUMN}`),
        ),
      )
    ).flat();
    result.disableTotalRows = disableRows.length;
    result.disableTotalBatches = Math.ceil(disableRows.length / batchSize);

    try {
      result.disableRawDataCsvKey = await this.uploadCsvToS3(
        disableRows,
        disableViewColumns,
        "migrate_policy_log",
        `migrate_policy_log_disable_${runId}.csv`,
      );
    } catch (disableRawLogError) {
      this.logger.error({
        message: `Failed to upload raw policy migration disable-source CSV: ${
          disableRawLogError instanceof Error ? disableRawLogError.message : String(disableRawLogError)
        }`,
        migrationRunId: runId,
      });
    }

    if (disableRows.length > 0) {
      // Bulk-fetch (id -> mig_ref_no) for every policy referenced by the
      // disable view, once for the whole run — same dual-key match pattern
      // as the update phase.
      const disableIds = [
        ...new Set(
          disableRows.map((r) => getVal(r, "id")).filter((v): v is string => v !== null),
        ),
      ];
      const existingDisablePolicies: Array<{ id: string; mig_ref_no: string | null }> = disableIds.length
        ? await this.dataSource.query(
            `SELECT id::text, mig_ref_no::text FROM policy WHERE id::text = ANY($1::text[])`,
            [disableIds],
          )
        : [];
      const existingDisablePolicyById = new Map(existingDisablePolicies.map((p) => [p.id, p.mig_ref_no]));

      const validEnabledForPerformanceLids = await this.migCheckLookupIds(
        "TOGGLE_TYPE",
        [
          ...new Set(
            disableRows
              .map((r) => getVal(r, "enabled_for_performance_lid"))
              .filter((v): v is string => v !== null),
          ),
        ],
      );

      interface DisableRowError {
        rowSeq: number | null;
        migRefNo: string | null;
        column: string | null;
        value: string | null;
        reason: string;
      }

      for (
        let batchNumber = 1, offset = 0;
        offset < disableRows.length;
        batchNumber++, offset += batchSize
      ) {
        const batchStart = Date.now();
        const rows = disableRows.slice(offset, offset + batchSize);
        try {
          const batchErrors: DisableRowError[] = [];
          const validRows: Array<{ id: string; migRefNo: string; enabledForPerformanceLid: string }> = [];

          for (const row of rows) {
            const rowSeqRaw = row[POLICY_MIGRATION_ORDER_COLUMN];
            const rowSeq =
              rowSeqRaw !== null && rowSeqRaw !== undefined && !Number.isNaN(Number(rowSeqRaw))
                ? Number(rowSeqRaw)
                : null;
            const id = getVal(row, "id");
            const migRefNo = getVal(row, "mig_ref_no");
            const enabledForPerformanceLid = getVal(row, "enabled_for_performance_lid");

            if (!id) {
              batchErrors.push({ rowSeq, migRefNo, column: "id", value: null, reason: "Required field is null/empty" });
              continue;
            }
            if (!migRefNo) {
              batchErrors.push({ rowSeq, migRefNo, column: "mig_ref_no", value: null, reason: "Required field is null/empty" });
              continue;
            }
            const existingMigRefNo = existingDisablePolicyById.get(id);
            if (existingMigRefNo === undefined) {
              batchErrors.push({ rowSeq, migRefNo, column: "id", value: id, reason: "No policy found with this id" });
              continue;
            }
            if (existingMigRefNo !== migRefNo) {
              batchErrors.push({
                rowSeq,
                migRefNo,
                column: "mig_ref_no",
                value: migRefNo,
                reason: `mig_ref_no does not match existing policy record (expected ${existingMigRefNo})`,
              });
              continue;
            }
            if (!enabledForPerformanceLid) {
              batchErrors.push({
                rowSeq,
                migRefNo,
                column: "enabled_for_performance_lid",
                value: null,
                reason: "Required field is null/empty",
              });
              continue;
            }
            if (!validEnabledForPerformanceLids.has(enabledForPerformanceLid)) {
              batchErrors.push({
                rowSeq,
                migRefNo,
                column: "enabled_for_performance_lid",
                value: enabledForPerformanceLid,
                reason: "Not found in lookup_data(TOGGLE_TYPE)",
              });
              continue;
            }

            validRows.push({ id, migRefNo, enabledForPerformanceLid });
          }

          await this.dataSource.transaction(async (manager) => {
            if (validRows.length > 0) {
              const valueRows: unknown[] = [];
              const placeholders = validRows.map((r) => {
                const base = valueRows.length;
                valueRows.push(r.id, r.enabledForPerformanceLid);
                return `($${base + 1}::bigint, $${base + 2}::bigint)`;
              });
              const [updated]: [
                Array<{ id: number; mig_ref_no: string | null; policy_name: string | null }>,
                number,
              ] = await manager.query(
                `UPDATE policy p SET enabled_for_performance_lid = v.enabled_for_performance_lid
                 FROM (VALUES ${placeholders.join(", ")}) AS v(id, enabled_for_performance_lid)
                 WHERE p.id = v.id
                 RETURNING p.id, p.mig_ref_no, p.policy_name`,
                valueRows,
              );
              result.disabledRows += updated.length;

              const updatedAt = new Date().toISOString();
              updated.forEach((p) => {
                successRecords.push({
                  policy_id: p.id,
                  mig_ref_no: p.mig_ref_no,
                  policy_name: p.policy_name,
                  phase: "disable",
                  timestamp: updatedAt,
                });
              });
            }

            if (batchErrors.length > 0) {
              const valueRows: unknown[] = [];
              const placeholders = batchErrors.map((e) => {
                const base = valueRows.length;
                valueRows.push(runId, batchNumber, e.rowSeq, e.migRefNo, e.column, e.value, e.reason, "disable");
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
              });
              await manager.query(
                `INSERT INTO policy_migration_error_log
                   (migration_run_id, batch_number, row_seq, mig_ref_no, column_name, bad_value, reason, phase)
                 VALUES ${placeholders.join(", ")}`,
                valueRows,
              );
            }
          });

          result.disableErrorRows += batchErrors.length;
          result.disableBatches.push({
            batchNumber,
            rowsRead: rows.length,
            validRows: validRows.length,
            errorRows: batchErrors.length,
            status: "completed",
            durationMs: Date.now() - batchStart,
          });
        } catch (batchError) {
          this.logger.error({
            message: `Policy disable-migration batch ${batchNumber} failed: ${
              batchError instanceof Error ? batchError.message : String(batchError)
            } ${(batchError as { code?: string })?.code ? `[${(batchError as { code?: string }).code}]` : ""}`,
          });
          result.disableBatches.push({
            batchNumber,
            rowsRead: 0,
            validRows: 0,
            errorRows: 0,
            status: "failed",
            error: batchError instanceof Error ? batchError.message : String(batchError),
          });
        }
      }
    }

    // 8. Export this run's error and success records to CSV, one pair of
    // files PER PHASE (create/update/missed_company) — not one combined file
    // — so a phase's Migration Log row links only to that phase's own data.
    // No dedup against prior runs: the bad data is corrected in the client's
    // own source system, not ours, so a row that's still broken simply shows
    // up again in tomorrow's file until they fix it. Wrapped separately so
    // an export/S3 failure doesn't turn an otherwise-successful migration
    // into an error response — the batches above have already committed.
    const exportErrorCsvForPhase = async (
      phase: "create" | "update" | "missed_company" | "disable",
    ): Promise<string | null> => {
      try {
        const phaseErrors: Array<Record<string, unknown>> = await this.dataSource.query(
          `SELECT migration_run_id, batch_number, phase, row_seq, mig_ref_no, column_name, bad_value, reason, created_at
           FROM policy_migration_error_log
           WHERE migration_run_id = $1 AND phase = $2
           ORDER BY id`,
          [runId, phase],
        );
        if (phaseErrors.length === 0) return null;
        return await this.uploadCsvToS3(
          phaseErrors,
          [
            "migration_run_id",
            "batch_number",
            "phase",
            "row_seq",
            "mig_ref_no",
            "column_name",
            "bad_value",
            "reason",
            "created_at",
          ],
          "migrate_policy_error_log",
          `migrate_policy_error_log_${phase}_${runId}.csv`,
        );
      } catch (exportError) {
        this.logger.error({
          message: `Failed to export/upload policy migration error CSV for phase=${phase}: ${
            exportError instanceof Error ? exportError.message : String(exportError)
          } ${(exportError as { code?: string })?.code ? `[${(exportError as { code?: string }).code}]` : ""}`,
          migrationRunId: runId,
        });
        return null;
      }
    };

    // Export every successfully created OR updated policy from this run —
    // (policy_id, mig_ref_no, policy_name, phase, timestamp) — for the
    // client to cross-reference against their source system, mirroring
    // migrate_company_success_log for the company migration flow.
    const exportSuccessCsvForPhase = async (
      phase: "create" | "update" | "missed_company" | "disable",
    ): Promise<string | null> => {
      try {
        const phaseSuccesses = successRecords.filter((r) => r.phase === phase);
        if (phaseSuccesses.length === 0) return null;
        return await this.uploadCsvToS3(
          phaseSuccesses,
          ["policy_id", "mig_ref_no", "policy_name", "phase", "timestamp"],
          "migrate_policy_success_log",
          `migrate_policy_success_log_${phase}_${runId}.csv`,
        );
      } catch (successExportError) {
        this.logger.error({
          message: `Failed to export/upload policy migration success CSV for phase=${phase}: ${
            successExportError instanceof Error ? successExportError.message : String(successExportError)
          } ${(successExportError as { code?: string })?.code ? `[${(successExportError as { code?: string }).code}]` : ""}`,
          migrationRunId: runId,
        });
        return null;
      }
    };

    [
      result.createErrorCsvKey,
      result.createSuccessCsvKey,
      result.updateErrorCsvKey,
      result.updateSuccessCsvKey,
      result.missedCompanyErrorCsvKey,
      result.missedCompanySuccessCsvKey,
      result.disableErrorCsvKey,
      result.disableSuccessCsvKey,
    ] = await Promise.all([
      exportErrorCsvForPhase("create"),
      exportSuccessCsvForPhase("create"),
      exportErrorCsvForPhase("update"),
      exportSuccessCsvForPhase("update"),
      exportErrorCsvForPhase("missed_company"),
      exportSuccessCsvForPhase("missed_company"),
      exportErrorCsvForPhase("disable"),
      exportSuccessCsvForPhase("disable"),
    ]);

    await Promise.all([
      this.logMigrationSummary(
        runId,
        "policy_create",
        result.insertedIntoPolicy,
        result.errorRows,
        result.createSuccessCsvKey,
        result.createErrorCsvKey,
      ),
      this.logMigrationSummary(
        runId,
        "policy_update",
        result.updatedRows,
        result.updateErrorRows,
        result.updateSuccessCsvKey,
        result.updateErrorCsvKey,
      ),
      this.logMigrationSummary(
        runId,
        "policy_missed",
        result.missedCompanyInsertedIntoPolicy,
        result.missedCompanyErrorRows,
        result.missedCompanySuccessCsvKey,
        result.missedCompanyErrorCsvKey,
      ),
      this.logMigrationSummary(
        runId,
        "policy_disable",
        result.disabledRows,
        result.disableErrorRows,
        result.disableSuccessCsvKey,
        result.disableErrorCsvKey,
      ),
    ]);

    return result;
  }

  /**
   * Serializes `rows` to CSV and uploads them to `<folder>/<fileName>` in the
   * migration S3 bucket. Returns the S3 key, or null if S3 isn't configured
   * (DOCUMENT_REPOSITORY_MODE !== "AWS") or there's nothing to upload.
   */
  private async uploadCsvToS3(
    rows: Array<Record<string, unknown>>,
    columns: string[],
    folder: string,
    fileName: string,
  ): Promise<string | null> {
    if (!this.s3) {
      this.logger.error({
        message: `Cannot upload ${fileName} — S3 is not configured (DOCUMENT_REPOSITORY_MODE !== 'AWS')`,
      });
      return null;
    }
    const bucket = process.env.S3_AWS_BUCKET || "";
    const key = `${folder}/${fileName}`;
    const csv = this.toCsv(rows, columns);
    await this.s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(csv, "utf-8"),
        ContentType: "text/csv",
      })
      .promise();
    return key;
  }

  private toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.join(",")];
    for (const row of rows) {
      lines.push(columns.map((c) => escape(row[c])).join(","));
    }
    return lines.join("\n");
  }

  private async logMigrationSummary(
    runId: string,
    eventType: string,
    successCount: number,
    errorCount: number,
    successLog: string | null,
    errorLog: string | null,
  ): Promise<void> {
    try {
      await this.dataSource.query(
        `INSERT INTO migration_log
           (system, migration_run_id, event_type, success_count, error_count, success_log, error_log)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [MIGRATION_LOG_SYSTEM, runId, eventType, successCount, errorCount, successLog, errorLog],
      );
    } catch (logError) {
      this.logger.error({
        message: `Failed to write migration_log row for ${eventType}: ${
          logError instanceof Error ? logError.message : String(logError)
        }`,
        migrationRunId: runId,
      });
    }
  }

  private static readonly MIGRATION_LOG_SORT_COLUMNS: Record<string, string> = {
    id: "id",
    executedAt: "executed_at",
    eventType: "event_type",
    successCount: "success_count",
    errorCount: "error_count",
    migrationRunId: "migration_run_id",
    system: "system",
  };

  async getMigrationLogs(
    page: number,
    limit: number,
    sort?: string,
    system?: string,
  ): Promise<{
    data: Array<{
      id: number;
      system: string;
      migrationRunId: string;
      eventType: string;
      executedAt: Date;
      successCount: number;
      errorCount: number;
      successLogUrl: string | null;
      errorLogUrl: string | null;
    }>;
    count: number;
    systems: string[];
  }> {
    // Each clause's column comes only from MIGRATION_LOG_SORT_COLUMNS (a
    // static whitelist), never directly from the client-supplied `sort`
    // string, so this stays injection-safe while supporting a full
    // multi-column "field1:ASC,field2:DESC" request instead of just the
    // first field.
    const orderByClauses = (sort || "")
      .split(",")
      .map((entry) => {
        const [rawField, rawDir] = entry.trim().split(":");
        const column =
          PolicyService.MIGRATION_LOG_SORT_COLUMNS[rawField?.trim()];
        if (!column) return null;
        const direction: "ASC" | "DESC" =
          rawDir?.trim().toUpperCase() === "ASC" ? "ASC" : "DESC";
        return `${column} ${direction}`;
      })
      .filter((clause): clause is string => Boolean(clause));
    const orderByClause =
      orderByClauses.length > 0 ? orderByClauses.join(", ") : "id DESC";

    const offset = (page - 1) * limit;
    const systemFilter = system?.trim() || null;
    const whereClause = systemFilter ? `WHERE system = $3` : "";
    const queryParams = systemFilter ? [limit, offset, systemFilter] : [limit, offset];

    const [rows, countResult, systemsResult] = await Promise.all([
      this.dataSource.query(
        `SELECT id, system, migration_run_id, event_type, executed_at, success_count, error_count, success_log, error_log
         FROM migration_log
         ${whereClause}
         ORDER BY ${orderByClause}
         LIMIT $1 OFFSET $2`,
        queryParams,
      ),
      systemFilter
        ? this.dataSource.query(
            `SELECT count(*)::int AS count FROM migration_log WHERE system = $1`,
            [systemFilter],
          )
        : this.dataSource.query(`SELECT count(*)::int AS count FROM migration_log`),
      this.dataSource.query(`SELECT DISTINCT system FROM migration_log ORDER BY system`),
    ]);

    const toSignedUrl = async (key: string | null): Promise<string | null> => {
      if (!key) return null;
      try {
        return await getSignedUrl(key, { expiresSeconds: 60 * 60 });
      } catch (signError) {
        this.logger.error({
          message: `Failed to sign migration log URL for key ${key}: ${
            signError instanceof Error ? signError.message : String(signError)
          }`,
        });
        return null;
      }
    };

    const data = await Promise.all(
      rows.map(
        async (row: {
          id: number;
          system: string;
          migration_run_id: string;
          event_type: string;
          executed_at: Date;
          success_count: number;
          error_count: number;
          success_log: string | null;
          error_log: string | null;
        }) => ({
          id: row.id,
          system: row.system,
          migrationRunId: row.migration_run_id,
          eventType: row.event_type,
          executedAt: row.executed_at,
          successCount: row.success_count,
          errorCount: row.error_count,
          successLogUrl: await toSignedUrl(row.success_log),
          errorLogUrl: await toSignedUrl(row.error_log),
        }),
      ),
    );

    return {
      data,
      count: countResult[0]?.count ?? 0,
      systems: systemsResult.map((r: { system: string }) => r.system),
    };
  }

  private async migCheckIds(table: string, ids: string[]): Promise<Set<string>> {
    if (!ids.length) return new Set<string>();
    const unique = [...new Set(ids)];
    const rows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id::text FROM ${table} WHERE id::text = ANY($1::text[])`,
      [unique],
    );
    return new Set(rows.map((r) => r.id));
  }

  private async migCheckLookupIds(lookupName: string, ids: string[]): Promise<Set<string>> {
    if (!ids.length) return new Set<string>();
    const unique = [...new Set(ids)];
    const rows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id::text FROM lookup_data WHERE lookup_name = $1 AND id::text = ANY($2::text[])`,
      [lookupName, unique],
    );
    return new Set(rows.map((r) => r.id));
  }

  private async migGetExistingMigRefNos(migRefNos: string[]): Promise<Set<string>> {
    if (!migRefNos.length) return new Set<string>();
    const unique = [...new Set(migRefNos)];
    const rows: Array<{ mig_ref_no: string }> = await this.dataSource.query(
      `SELECT mig_ref_no::text FROM policy WHERE mig_ref_no::text = ANY($1::text[])`,
      [unique],
    );
    return new Set(rows.map((r) => r.mig_ref_no));
  }

  // ==== Business targets: CRUD + report ======================================

  private parseCsvIds(csv?: string): number[] | undefined {
    if (!csv) return undefined;
    const ids = String(csv)
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    return ids.length ? ids : undefined;
  }


  private toTargetMonth(value: Date | string): string {
    if (value instanceof Date) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
    }
    return String(value).slice(0, 7);
  }

  // Precedence: a single month ('YYYY-MM') wins; else explicit from+to; else the
  // financial year via the shared getDateRange resolver (Apr–Mar, UTC) with
  // fullPeriod=true so future target months aren't clipped to today.
  //
  // When NONE of the three is supplied the range is left undefined on purpose,
  // so getBusinessTargetReport skips its BETWEEN and returns targets across all
  // financial years. Defaulting to the current FY here silently hid every
  // earlier year's targets from a page whose filters all looked empty.
  private resolveTargetMonthRange(dto: BusinessTargetReportQueryDto): {
    start?: Date;
    end?: Date;
  } {
    if (dto.month) {
      const ym = dto.month.slice(0, 7);
      const start = new Date(`${ym}-01T00:00:00.000Z`);
      const end = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999),
      );
      return { start, end };
    }
    if (dto.from && dto.to) {
      return { start: new Date(dto.from), end: new Date(dto.to) };
    }
    const fy = dto.financialYear
      ? parseInt(String(dto.financialYear).slice(0, 4), 10)
      : undefined;
    if (!Number.isFinite(fy as number)) return {};
    return getDateRange(undefined, fy as number, false, true);
  }

  // Access is gated by privilege at the api-gateway (BUSINESS_TARGET/WRITE_001),
  // so a request that reaches here is already authorized to manage targets
  // org-wide — no additional role/hierarchy check.
  async upsertBusinessTarget(dto: UpsertBusinessTargetDto) {
    try {
      return await this.policyRepository.upsertBusinessTarget(dto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to save business target: ${(error as Error).message}`,
      );
    }
  }

  private async fetchBusinessTargetReportRows(
    dto: BusinessTargetReportQueryDto,
    paging?: { page: number; limit: number },
  ): Promise<{ rows: any[]; total: number }> {
    // Org-wide by default (admin/privilege feature); the userId filter narrows.
    const userIds = this.parseCsvIds(dto.userId);
    const range = this.resolveTargetMonthRange(dto);
    const { rows, total } =
      await this.policyRepository.getBusinessTargetReport(
        userIds,
        {
          // No default: an absent entityType means "every entity type", not
          // TOTAL_POLICY. The repository turns it into a group-by in that case.
          entityType: dto.entityType || undefined,
          kpi: dto.kpi || POLICY_PERFORMANCE_FIELDS.BROKERAGE,
          start: range.start,
          end: range.end,
          search: dto.search?.trim() || undefined,
          organisationIds: this.parseCsvIds(dto.organisationId),
          sbuIds: this.parseCsvIds(dto.sbuId),
          verticalIds: this.parseCsvIds(dto.verticalId),
          sort: dto.sort,
        },
        paging,
      );
    // id/userId/kpi/typeOfTarget are not displayed — they are the payload the
    // report's Edit action hands to AddEditTarget, which rebuilds the form from
    // location.state.target and sends `id` back to upsertBusinessTarget.
    const mapped = rows.map((r) => ({
      id: r.id != null ? Number(r.id) : null,
      userId: r.userId != null ? Number(r.userId) : null,
      sbu: r.sbu ?? "",
      vertical: r.vertical ?? "",
      teamMember: r.teamMember ?? "",
      entityType: r.entityType ?? "",
      kpi: r.kpi ?? "",
      typeOfTarget: r.typeOfTarget ?? "",
      month: this.toTargetMonth(r.month),
      target: Number(r.target) || 0,
      // AddEditTarget reads valueOfTarget for the "Target value" field; the row
      // holds exactly one record, so its SUM is that record's value.
      valueOfTarget: Number(r.target) || 0,
    }));
    return { rows: mapped, total };
  }

  async getBusinessTargetReportList(dto: BusinessTargetReportQueryDto) {
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 20;
    const { rows, total } = await this.fetchBusinessTargetReportRows(dto, {
      page,
      limit,
    });
    return { rows, total, page, limit };
  }

  // Generator handed to the shared export-job framework. Returns the S3 object
  // KEY (not a URL); the framework stores it and mints fresh signed URLs at
  // download time — same contract as generateBizDoneExcelFromQuery.
  async generateBusinessTargetExcel(
    query: Record<string, any>,
  ): Promise<string> {
    const dto = query as BusinessTargetReportQueryDto;
    const { rows } = await this.fetchBusinessTargetReportRows(dto);
    const applied = ReportExportJob.parseReportAppliedFilters(
      query?.appliedFilters,
    );
    const buffer = await generateExcelWithAppliedFilters(
      rows,
      applied,
      "Business Targets",
      [
        { key: "sbu", label: "SBU" },
        { key: "vertical", label: "Vertical" },
        { key: "teamMember", label: "Team Member" },
        { key: "entityType", label: "Entity Type" },
        { key: "month", label: "Month" },
        { key: "target", label: "Target" },
      ],
    );
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    ]
      .map((p) => p.toString().padStart(2, "0"))
      .join("");
    const key = `business-target-reports/business_target_${timestamp}.xlsx`;
    await uploadToS3(
      buffer,
      key,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    return key;
  }

  async enqueueBusinessTargetReportExport(
    userId: number,
    filtersApplied: Record<string, unknown>,
  ): Promise<{ jobId: number; status: string; alreadyInProgress: boolean }> {
    try {
      return await ReportExportJob.enqueueReportExportJob(
        this.dataSource,
        userId,
        UserBizdoneReportType.BUSINESS_TARGET,
        filtersApplied,
        (filters: Record<string, unknown> | undefined) =>
          this.generateBusinessTargetExcel(filters ?? {}),
      );
    } catch (error) {
      console.error("Error in enqueueBusinessTargetReportExport:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to queue business target export.",
      );
    }
  }

  async listBusinessTargetReportExports(userId: number) {
    return ReportExportJob.listReportExports(this.dataSource, userId, [
      UserBizdoneReportType.BUSINESS_TARGET,
    ]);
  }
}
