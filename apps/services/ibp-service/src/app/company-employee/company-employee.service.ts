
import axios from "axios";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import archiver from "archiver";
import { JwtService } from "@nestjs/jwt";
import {
  GetEmployeeDetails,
  GetEmployeeDetailsWithPolicyComponents,
} from "./dto/get-employee-details-with-components.dto";
import { CompanyEmployeeRepository } from "./company-employee.repository";
import { TpaSsoExecutorService } from "./tpa-sso-executor.service";
import { CreatePolicyEmployeeComponentDto } from "./dto/create-policy-employee-component.dto";
import { UpdatePolicyEmployeeComponentDto } from "./dto/update-policy-employee-component.dto";
import {
  LifeEventDependentAction,
  UpsertEnrollmentDependentDto,
} from "./dto/upsert-enrollment-dependent.dto";
import {
  EmployeeECardItemDto,
  EmployeeECardResponseDto,
} from "./dto/employee-ecard-details.dto";
import {
  UpsertEnrollmentDataDto,
  EnrollmentAction,
  UpsertCombinedEnrollmentDataDto,
} from "./dto/upsert-enrollment-data.dto";
import { UpsertProfileDependentsDto } from "./dto/upsert-profile-dependents.dto";
import { SearchHospitalDto } from "./dto/search-hospital.dto";
import { UpdateEmployeeDetails } from "./dto/update-employee-details.dto";
import { IntimateClaimDto, IntimateClaimResponseDto, SubmitClaimDto, SubmitClaimResponseDto } from "./dto/claims.dto";
import {
  CreatePolicyHospitalDto,
  CreatePolicyHospitalResponseDto,
} from "./dto/create-policy-hospital.dto";
import { GetPolicyFeatureDocumentsQueryDto } from "./dto/get-policy-feature-documents-query.dto";
import { BulkDownloadEmployeeFilesDto } from "./dto/bulk-download-employee-files.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { resolveEmployeeInsuredSearchParams } from "../../../../../../libs/service-lib/src/lib/utils/employee-insured.utils";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { updateEndorsementSummaryAfterEnrollment } from "../../../../service-lib/src/lib/utils/enrollment-processing.util";
import { formatDateWithTime } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import {
  serviceNames,
  EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
  EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS,
  DOCUMENT_PROCESS_STATUS,
  DOCUMENT_TYPE_POLICY_EMPLOYEE_DATA,
  COMPANY_EMPLOYEE_ROLE_KEY,
  USER_TYPE_COMPANY_EMPLOYEE,
  USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
  USER_TYPE_IIRM_EMPLOYEE,
  
} from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { createRedisClient } from "../../../../service-lib/src/lib/utils/redis.util";
import { EnrollmentProcessingService } from "../../../../service-lib/src/lib/utils/enrollment-processing.util";
import {
  createEnrollmentProcessingFiles,
  EmployeeWithDependentsData,
  processEnrollmentFile,
  ValidatedEnrollmentProcessingResult,
} from "../../../../service-lib/src/lib/utils/enrollment-file-upload.util";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EmployeeDetailsDto } from "./dto/get-company-employee-details.dto";
import {
  PolicyEnrollmentDependent,
  PolicyEmployeeEnrollmentChoice,
  PolicyEmployeeEnrollmentChoiceDependent,
  PolicyEmployeeEnrollment,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEnrollmentUploadSummary,
  DocumentProcessingFile,
  FileUpload,
  Policy,
  PolicyEmployeeEndorsement,
  Endorsement,
  User,
  Role,
  UserRole,
  LookUp,
  PolicyConfiguration,
  PolicyContactMetric,
  CompanyPortalConfigurationDetail,
  ConfigCompany,
  CompanyAuthenticationMapping,
  CompanyAuthenticationConfig,
  AuthenticationMethod,
  OpportunityPlacementSlipGeneration,
  Insurer,
  PolicyClaim,
  PolicyClaimStatus,
  PolicyClaimAudit,
  ClaimTpaSubmissionJob,
  CLAIM_TPA_JOB_TYPE,
  CLAIM_TPA_JOB_STATUS,
  PolicyDependentEndorsement,
  Company,
  GroupCompanyMap,
  Opportunity,
  HrUserManagement,
  PolicyTpaMap,
  RaiseTicket,
} from "../../../../service-lib/src/lib/entities";
import { MstrExtApplicationRef } from "../../../../service-lib/src/lib/entities/mstr-ext-application-ref.entity";
import {
  DATA_INTAKE_TYPE,
  DATA_TYPES,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_TOTAL_KPI_COUNT,
  EMPLOYEE_ENDORSEMENT_READY,
  PARENT_RELATIONSHIP_TYPES,
  PER_MILLE_RATE,
  POLICY_CONFIGURATION_STATUS_LIVE,
  POLICY_RELATIONSHIP_TYPE_PARAMETER,
  SUM_INSURED_MODELS,
  GENDER_VALUES,
  BOOLEAN_VALUES,
  USER_STATUS_INACTIVE,
} from "../../../../../../libs/service-lib/src/lib/constants";
const COMPANY_CONFIGURATION_STATUS_ACTIVE_KEY =
  "COMPANY_CONFIGURATION_STATUS_ACTIVE";
const EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED =
  "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED";

const TICKET_STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["resolved", "open"],
  resolved: ["closed", "open"],
  closed: ["open"],
};

interface CompanyPolicyConfigEntry {
  policyId?: string | number | null;
  policyName?: string | null;
  policyTypeKey?: string | null;
  settings?: {
    autoLockEnrollment?: boolean;
    autoLockAfterConfirmation?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

interface PolicyAutoLockSettings {
  autoLockEnrollment?: boolean;
  autoLockAfterConfirmation?: boolean;
}

type MyDocumentCategory =
  | "all"
  | "policies"
  | "claims"
  | "life_events"
  | "personal_documents"
  | "mail"
  | "other";

type MyDocumentType =
  | "all"
  | "policy_certificate"
  | "claim_form"
  | "life_event_proof"
  | "personal_document"
  | "communication"
  | "document";

type MyDocumentSortOrder = "latest" | "oldest";

type EmployeeDocumentRecord = {
  id?: number | string | null;
  documentId?: number | string | null;
  fileName?: string | null;
  fileKey?: string | null;
  companyType?: string | null;
  companyId?: number | string | null;
  documentTypeLid?: number | null;
  fileSize?: string | number | null;
  policyId?: number | string | null;
  policyName?: string | null;
  featureType?: string | null;
  title?: string | null;
  subtitle?: string | null;
  uploadedAt?: string | Date | null;
  lastUpdated?: string | Date | null;
  uploadedByName?: string | null;
  [key: string]: unknown;
};

const formatDateOnly = (value?: string | Date | null): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const dateOnlyMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnlyMatch) {
      return dateOnlyMatch[1];
    }
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const POLICY_TYPE_KEY_TO_POLICY_ID: Record<string, string> = {
  POLICY_TYPE_GMC: "GMC",
  POLICY_TYPE_GTL: "GTL",
  POLICY_TYPE_GPA: "GPA",
};

import {
  executeHospitalSearch,
  executeHospitalSearchByPolicyIds,
  generateHospitalExport,
  getActivePolicyFeatureDocument,
  getPolicyLocationData,
  getPolicyLocationDataByPolicyIds,
} from "../../../../service-lib/src/lib/utils/portal-configuration.util";
import {
  EmployeePolicyOverviewResponseDto,
  ClaimSummaryDto,
  ClaimStatusCountsDto,
  CoverageDetailDto,
  PolicySectionDto,
} from "./dto/employee-policy-overview.dto";
import {
  PolicyContactMatrixLightContactDto,
  PolicyContactMatrixPartyDto,
  PolicyContactMatrixResponseDto,
} from "./dto/policy-contact-matrix.dto";
import { EmployeePolicyContactMatrixResponseDto } from "./dto/employee-policy-contact-matrix.dto";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { UpdateCompanyEmployeePassword } from "../../../../service-lib/src/lib/dto/company-employee-password-update.dto";
import {
  hashPassword,
  isPasswordMatch,
} from "../../../../service-lib/src/lib/utils/password.util";
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
  Repository,
} from "typeorm";
import {
  addDays,
  endOfDay,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import { InjectRepository } from "@nestjs/typeorm";
import { EnrollmentChoiceDto } from "./dto/enrollment-choice.dto";
import { OnboardingService } from "../onboarding/onboarding.service";
import { HrService } from "../hr-module/hr.service";
import * as fs from "fs";
import * as os from "os";
import path from "path";
import * as XLSX from "xlsx";
import {
  downloadFromS3,
  checkS3KeyExists,
  getFileStreamFromStorage,
  getSignedUrl,
  prepareFileDownload,
  saveFileToStorage,
  uploadToS3,
} from "../../../../service-lib/src/lib/utils/file-management.utils";
import { assertUploadedFileNotPasswordProtected } from "../../../../service-lib/src/lib/utils/password-protection.utils";
import { processEmployeeUpload } from "../../../../service-lib/src/lib/utils/company-employee-upload.util";
import { sanitizePath } from "../../../../service-lib/src/lib/utils/path-sanitizer.util";
import { premiumCalculator } from "../../../../service-lib/src/lib/utils/premium-calculator.util";
import { EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT } from "../../../../../../libs/service-lib/src/lib/constants";
import Redis from "ioredis";
import { CompanyEmployeeFileUploadDto } from "./dto/company-employee-file-upload.dto";
import { EmployeeEnrollmentSubmission } from "../../../../service-lib/src/lib/entities/employee-enrollment-submission.entity";
import { CompanyPortalConfigScope } from "../../../../service-lib/src/lib/entities/company-portal-config-scope.entity";
import type { Response } from "express";
import { EmployeeECardSignedUrlResponseDto } from "./dto/get-employee-ecard-signed-url.dto";
import {
  CompanyAdditionalDocumentDto,
  CompanyAdditionalDocumentsResponseDto,
} from "./dto/company-additional-documents.dto";
import {
  EmployeePersonalDocumentDto,
  EmployeePersonalDocumentsResponseDto,
} from "./dto/employee-personal-documents.dto";

interface CreateUserActivityLogParams {
  userId: number;
  activityKey: string;
  activityCategory?: string;
  referenceId?: string | number;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CompanyEmployeeService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly enrollmentProcessing: EnrollmentProcessingService;
  private readonly redis!: Redis;
  private storageType: string | undefined;
  private readonly repoMode = process.env.DOCUMENT_REPOSITORY_MODE || "LFS";
  private readonly docRepoPath =
    process.env.DOCUMENT_REPOSITORY || "tmp/document-repository";
  private readonly bucket = process.env.S3_AWS_BUCKET || "";

  constructor(
    private companyEmployeeRepository: CompanyEmployeeRepository,
    private readonly tpaSsoExecutorService: TpaSsoExecutorService,
    private readonly onboardingService: OnboardingService,
    private readonly hrService: HrService,
    private readonly traceIdService: TraceIdService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    @InjectRepository(DocumentProcessingFile)
    private readonly uploadRepo: Repository<DocumentProcessingFile>,
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly companyEmployeeRepo: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(PolicyEnrollmentDependent)
    private readonly dependentRepo: Repository<PolicyEnrollmentDependent>,
    @InjectRepository(PolicyEmployeeEnrollmentChoiceDependent)
    private readonly employeeChoiceDependentRepo: Repository<PolicyEmployeeEnrollmentChoiceDependent>,
    @InjectRepository(PolicyEnrollmentUploadSummary)
    private readonly summaryRepo: Repository<PolicyEnrollmentUploadSummary>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
    @InjectRepository(PolicyEmployeeEnrollment)
    private readonly employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Endorsement)
    private readonly endorsementRepository: Repository<Endorsement>,
    @InjectRepository(PolicyEmployeeEndorsement)
    private readonly policyEmployeeEndorsementRepo: Repository<PolicyEmployeeEndorsement>,
    @InjectRepository(PolicyConfiguration)
    private readonly policyConfigRepo: Repository<PolicyConfiguration>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(CompanyPortalConfigurationDetail)
    private readonly companyPortalConfigDetailRepository: Repository<CompanyPortalConfigurationDetail>,
    @InjectRepository(ConfigCompany)
    private readonly configCompanyRepository: Repository<ConfigCompany>,
    @InjectRepository(CompanyAuthenticationMapping)
    private readonly companyAuthenticationMappingRepository: Repository<CompanyAuthenticationMapping>,
    @InjectRepository(CompanyAuthenticationConfig)
    private readonly companyAuthenticationConfigRepository: Repository<CompanyAuthenticationConfig>,
    @InjectRepository(AuthenticationMethod)
    private readonly authenticationMethodRepo: Repository<AuthenticationMethod>,
    @InjectRepository(OpportunityPlacementSlipGeneration)
    private readonly opportunityPlacementSlipRepo: Repository<OpportunityPlacementSlipGeneration>,
    @InjectRepository(Insurer)
    private readonly insurerRepo: Repository<Insurer>,
    @InjectRepository(PolicyClaim)
    private readonly claimRepo: Repository<PolicyClaim>,
    @InjectRepository(PolicyClaimStatus)
    private readonly claimStatusRepo: Repository<PolicyClaimStatus>,
    @InjectRepository(PolicyClaimAudit)
    private readonly claimAuditRepo: Repository<PolicyClaimAudit>,
    @InjectRepository(ClaimTpaSubmissionJob)
    private readonly claimTpaJobRepo: Repository<ClaimTpaSubmissionJob>,
    @InjectRepository(PolicyDependentEndorsement)
    private readonly policyDependentEndorsementRepo: Repository<PolicyDependentEndorsement>,
    @InjectRepository(EmployeeEnrollmentSubmission)
    private readonly employeeEnrollmentSubmissionRepo: Repository<EmployeeEnrollmentSubmission>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(GroupCompanyMap)
    private readonly groupCompanyMapRepo: Repository<GroupCompanyMap>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
    @InjectRepository(HrUserManagement)
    private readonly hrUserManagementRepo: Repository<HrUserManagement>,
    @InjectRepository(CompanyPortalConfigScope)
    private readonly portalConfigScopeRepo: Repository<CompanyPortalConfigScope>,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.IBP_SERVICE);
    this.storageType = ENV.STORAGE_TYPE;
    if (this.storageType === "valkey") {
      this.redis = createRedisClient({
        logger: this.logger,
        traceId: this.traceIdService.traceId,
        location: "IBP CompanyEmployeeService",
        method: "constructor",
      })!;
    }
    this.enrollmentProcessing = new EnrollmentProcessingService({
      logger: this.logger,
      traceId: this.traceIdService.traceId,
      location: "IBP CompanyEmployeeService",
      redis: this.redis,
      dataSource: this.dataSource,
      policyRepo: this.policyRepo,
      enrollmentRepository: this.companyEmployeeRepository,
    });
  }

  private buildEnrollmentSubmissionReference(
    employeeId: number,
    submissionCount: number,
    submittedAt: Date,
  ): string {
    const yyyy = submittedAt.getUTCFullYear();
    const mm = String(submittedAt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(submittedAt.getUTCDate()).padStart(2, "0");
    const hh = String(submittedAt.getUTCHours()).padStart(2, "0");
    const mi = String(submittedAt.getUTCMinutes()).padStart(2, "0");
    const ss = String(submittedAt.getUTCSeconds()).padStart(2, "0");
    return `ENR-${employeeId}-${submissionCount}`;
  }

  private async createEnrollmentSubmissionRecord(params: {
    employeeId: number;
    companyId: number;
    policyIds: number[];
    createdBy?: number | null;
  }): Promise<{ submissionCount: number; referenceNumber: string }> {
    const { employeeId, companyId, policyIds, createdBy } = params;

    for (let attempt = 0; attempt < 3; attempt++) {
      const nextCountRow = await this.employeeEnrollmentSubmissionRepo
        .createQueryBuilder("s")
        .select("COALESCE(MAX(s.submissionCount), 0) + 1", "nextCount")
        .where("s.employeeId = :employeeId", { employeeId })
        .andWhere("s.companyId = :companyId", { companyId })
        .getRawOne<{ nextCount: string }>();

      const submissionCount = Number(nextCountRow?.nextCount ?? 1);
      const submittedAt = new Date();
      const referenceNumber = this.buildEnrollmentSubmissionReference(
        employeeId,
        submissionCount,
        submittedAt,
      );

      try {
        await this.employeeEnrollmentSubmissionRepo.insert({
          employeeId,
          companyId,
          policyIds,
          submissionCount,
          referenceNumber,
          submittedAt,
          createdBy: createdBy ?? null,
          updatedBy: createdBy ?? null,
        });

        return { submissionCount, referenceNumber };
      } catch (e: any) {
        if (e?.code === "23505") continue;
        throw e;
      }
    }

    throw new BadRequestException(
      "Could not generate enrollment submission reference. Please retry.",
    );
  }

  private logInfo(method: string, messageData: unknown) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method,
        messageData,
      }),
    });
  }

  private logError(method: string, messageData: unknown) {
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "failure",
        location: "IBP CompanyEmployeeService",
        method,
        messageData,
      }),
    });
  }

  async getGroupCompanies(companyId: number, userId?: number) {
    if (userId && userId > 0) {
      // For auth-detached HR users, the session id = hr_user_management.id (not users.id)
      // Try primary key lookup first, then fall back to legacy user_id FK
      const hrRecord =
        await this.hrUserManagementRepo.findOne({ where: { id: userId, deletedAt: IsNull() } }) ??
        await this.hrUserManagementRepo.findOne({ where: { userId, deletedAt: IsNull() } });
      if (hrRecord) {
        if (hrRecord.userStatusKey === USER_STATUS_INACTIVE) return [];
        // Use external_hr_policy_map to get the exact companies this user has access to
        const rows: { company_id: number }[] =
          await this.hrUserManagementRepo.manager.query(
            `SELECT DISTINCT company_id
             FROM public.external_hr_policy_map
             WHERE hr_management_id = $1 AND company_id IS NOT NULL`,
            [hrRecord.id],
          );

        if (rows.length === 0) {
          // Fallback to legacy single company_id on hr_user_management
          const companyRow = hrRecord.companyId
            ? await this.companyRepo.findOne({ where: { id: hrRecord.companyId }, select: ["id", "companyName"] })
            : null;
          return {
            isGroupCompany: false,
            companies: companyRow ? [{ id: companyRow.id, name: companyRow.companyName ?? "" }] : [],
            parentCompany: null,
          };
        }

        const companyIds = rows.map((r) => r.company_id);
        const [companyRows, parentMaps] = await Promise.all([
          this.companyRepo.find({ where: { id: In(companyIds) }, select: ["id", "companyName"] }),
          // Find which of these companies are group parents
          this.groupCompanyMapRepo.find({ where: { groupCompanyId: In(companyIds) } }),
        ]);

        const parentIds = new Set(parentMaps.map((m) => m.groupCompanyId!));

        const companies = companyRows.map((c) => ({
          id: c.id,
          name: c.companyName ?? "",
          isParent: parentIds.has(c.id),
        }));

        const parentCompany = companies.find((c) => c.isParent) ?? null;

        return {
          isGroupCompany: companies.length > 1,
          companies,
          parentCompany,
        };
      }
    }

    // Find all group_company_map rows for this company as a child
    const childMap = await this.groupCompanyMapRepo.findOne({ where: { companyId } });

    if (childMap?.groupCompanyId) {
      // This company is a child — group parent is childMap.groupCompanyId
      const groupParentId = childMap.groupCompanyId;
      const siblingMaps = await this.groupCompanyMapRepo.find({
        where: { groupCompanyId: groupParentId },
      });
      // Include self + all siblings (all children of the parent)
      const allChildIds = siblingMaps.map((m) => m.companyId!);

      const [childRows, parentRow] = await Promise.all([
        this.companyRepo.find({ where: { id: In(allChildIds) }, select: ['id', 'companyName'] }),
        this.companyRepo.findOne({ where: { id: groupParentId }, select: ['id', 'companyName'] }),
      ]);

      const companies = childRows.map((c) => ({ id: c.id, name: c.companyName ?? '' }));
      const parentCompany = parentRow
        ? { id: parentRow.id, name: parentRow.companyName ?? '' }
        : { id: groupParentId, name: '' };
      return { isGroupCompany: true, companies, parentCompany };
    }

    // This company might be a group parent — check if any child maps to it
    const parentMaps = await this.groupCompanyMapRepo.find({ where: { groupCompanyId: companyId } });
    const childIds = parentMaps.map((m) => m.companyId!).filter((id) => id !== companyId);
    if (childIds.length === 0) return { isGroupCompany: false, companies: [], parentCompany: null };

    const [childRows, selfRow] = await Promise.all([
      this.companyRepo.find({ where: { id: In(childIds) }, select: ['id', 'companyName'] }),
      this.companyRepo.findOne({ where: { id: companyId }, select: ['id', 'companyName'] }),
    ]);

    const companies = childRows.map((c) => ({ id: c.id, name: c.companyName ?? '' }));
    const parentCompany = selfRow
      ? { id: selfRow.id, name: selfRow.companyName ?? '' }
      : { id: companyId, name: '' };
    return { isGroupCompany: companies.length > 0, companies, parentCompany };
  }

  async getCompanyPortalConfiguration(companyId: number) {
    if (!companyId) {
      throw new BadRequestException("companyId is required");
    }

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "getCompanyPortalConfiguration",
        messageData: `Fetching portal configuration for company ${companyId}`,
      }),
    });

    const config = await this.configCompanyRepository.findOne({
      where: { companyId },
      relations: [
        "companyPortalConfigurationDetail",
        "companyConfigurationStatus",
      ],
    });

    const portalConfigDetail =
      config?.companyPortalConfigurationDetail ??
      (await this.companyPortalConfigDetailRepository.findOne({
        where: { companyId },
        order: { updatedAt: "DESC", id: "DESC" },
      }));

    const authMappings = await this.companyAuthenticationMappingRepository.find(
      {
        where: { companyId, configId: IsNull() },
        relations: ["companyAuthenticationConfig"],
        order: { displayOrder: "ASC" },
      },
    );

    const authentication = authMappings.map((mapping) => ({
      authentication_method_id: mapping.authenticationMethodId,
      authentication_method_key: mapping.authenticationMethodKey ?? null,
      ...mapping.companyAuthenticationConfig?.companyPortalAuthConfig,
    }));

    const logoFileId = config?.companyLogoFileId ?? null;
    const subDomain = config?.subDomain ?? null;
    const isDefaultConfiguration = !subDomain || !subDomain.trim();
    const companyConfigurationStatus = config?.companyConfigurationStatus
      ? {
          lid: config.companyConfigurationStatus.id,
          key: config.companyConfigurationStatus.lookUpKey,
          value: config.companyConfigurationStatus.lookUpValue,
        }
      : null;

    const brandingConfig =
      portalConfigDetail?.companyPortalBrandingConfig ?? {};
    const brandingWithLogo = {
      ...brandingConfig,
      companyLogoFileId: brandingConfig.companyLogoFileId ?? logoFileId,
    };

    const isCompanyConfigurationApproved =
      companyConfigurationStatus?.key ===
      COMPANY_CONFIGURATION_STATUS_ACTIVE_KEY;
    const approvalMessage = isCompanyConfigurationApproved
      ? undefined
      : "Company portal configuration is not approved yet";

    return {
      companyId,
      subDomain,
      companyLogoId: logoFileId,
      companyConfigurationStatus,
      isDefault: isDefaultConfiguration,
      companyPortalConfig: isCompanyConfigurationApproved
        ? {
            authentication,
            branding: brandingWithLogo,
          }
        : null,
      companyPortalDashboardConfig: isCompanyConfigurationApproved
        ? portalConfigDetail?.companyPortalDashboardConfig ?? null
        : null,
      companyPolicyConfig: isCompanyConfigurationApproved
        ? portalConfigDetail?.companyPolicyConfig ?? null
        : null,
      isCompanyConfigurationApproved,
      approvalMessage,
    };
  }

  private normalizeCompanyAdditionalDocuments(
    documents: unknown[]
  ): CompanyAdditionalDocumentDto[] {
    return documents
      .map((document) => {
        if (!document || typeof document !== "object") {
          return null;
        }

        const candidate = document as Record<string, unknown>;
        const id = Number(
          candidate.id ?? candidate.documentId ?? candidate.fileId ?? NaN
        );

        if (!Number.isFinite(id)) {
          return null;
        }

        const fileName =
          typeof candidate.fileName === "string"
            ? candidate.fileName
            : typeof candidate.name === "string"
            ? candidate.name
            : undefined;

        return {
          id,
          name: fileName,
          fileName,
          filePath:
            typeof candidate.filePath === "string"
              ? candidate.filePath
              : typeof candidate.fileKey === "string"
              ? candidate.fileKey
              : undefined,
          fileSize:
            typeof candidate.fileSize === "string"
              ? candidate.fileSize
              : candidate.fileSize != null
              ? String(candidate.fileSize)
              : undefined,
          uploadedAt:
            typeof candidate.uploadedAt === "string"
              ? candidate.uploadedAt
              : typeof candidate.createdAt === "string"
              ? candidate.createdAt
              : typeof candidate.updatedAt === "string"
              ? candidate.updatedAt
              : undefined,
          uploadedBy:
            typeof candidate.uploadedBy === "string"
              ? candidate.uploadedBy
              : undefined,
        } as CompanyAdditionalDocumentDto;
      })
      .filter((document): document is CompanyAdditionalDocumentDto =>
        Boolean(document)
      );
  }

  async getCompanyAdditionalDocuments(
    companyId: number
  ): Promise<CompanyAdditionalDocumentsResponseDto> {
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const documentIds = Array.isArray(company.documentIds)
      ? this.normalizeCompanyAdditionalDocuments(
          company.documentIds as unknown[]
        )
      : [];

    return {
      companyId,
      documentIds,
    };
  }

  async upsertCompanyAdditionalDocuments(
    companyId: number,
    documents: CompanyAdditionalDocumentDto[],
    userId: number
  ): Promise<CompanyAdditionalDocumentsResponseDto> {
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    if (!Array.isArray(documents)) {
      throw new BadRequestException("documentIds must be an array");
    }

    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const normalizedDocuments = this.normalizeCompanyAdditionalDocuments(
      documents
    );

    company.documentIds = normalizedDocuments as unknown as JSON;
    company.updatedBy = userId || company.updatedBy;
    company.auditRefId = companyId;

    await this.companyRepo.save(company);

    return {
      companyId,
      documentIds: normalizedDocuments,
    };
  }

  async getEmployeePersonalDocuments(
    employeeId: number,
  ): Promise<EmployeePersonalDocumentsResponseDto> {
    if (!Number.isFinite(employeeId)) {
      throw new BadRequestException("employeeId is required");
    }

    const employee = await this.companyEmployeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const personalDocuments = Array.isArray(employee.documentIds)
      ? (employee.documentIds as unknown[])
      : [];

    return {
      employeeId,
      documentIds: personalDocuments
        .map((document) => this.normalizePersonalDocument(document))
        .filter((document) => Boolean(document.id)) as EmployeePersonalDocumentDto[],
    };
  }

  async upsertEmployeePersonalDocuments(
    employeeId: number,
    documents: EmployeePersonalDocumentDto[],
    userId: number,
  ): Promise<EmployeePersonalDocumentsResponseDto> {
    if (!Number.isFinite(employeeId)) {
      throw new BadRequestException("employeeId is required");
    }

    if (!Array.isArray(documents)) {
      throw new BadRequestException("documentIds must be an array");
    }

    const employee = await this.companyEmployeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const normalizedDocuments = documents
      .map((document) =>
        this.normalizePersonalDocument(document, employee.companyId ?? null),
      )
      .filter((document) => Boolean(document.id));

    const existingDocuments = Array.isArray(employee.documentIds)
      ? (employee.documentIds as Record<string, any>[])
      : [];
    const mergedDocumentsMap = new Map<string, Record<string, any>>();

    [...existingDocuments, ...normalizedDocuments].forEach((document) => {
      const normalizedDocument = this.normalizePersonalDocument(document);
      if (!normalizedDocument.id) {
        return;
      }
      const key = String(normalizedDocument.id);
      if (!mergedDocumentsMap.has(key)) {
        mergedDocumentsMap.set(key, normalizedDocument);
      }
    });

    const mergedDocuments = Array.from(mergedDocumentsMap.values());

    employee.documentIds = mergedDocuments as unknown as JSON;
    employee.updatedBy = userId || employee.updatedBy;

    await this.companyEmployeeRepo.save(employee);

    return {
      employeeId,
      documentIds: mergedDocuments as EmployeePersonalDocumentDto[],
    };
  }

  private normalizePersonalDocument(
    document: Record<string, any>,
    fallbackCompanyId?: number | null,
  ): Record<string, any> {
    return {
      id:
        document?.id ?? document?.documentId ?? document?.fileId ?? null,
      fileKey: document?.fileKey ?? null,
      fileName: document?.fileName ?? document?.name ?? null,
      fileSize:
        document?.fileSize != null ? String(document.fileSize) : null,
      companyType: document?.companyType ?? "company",
      companyId: document?.companyId ?? fallbackCompanyId ?? null,
      documentTypeLid:
        document?.documentTypeLid != null
          ? Number(document.documentTypeLid)
          : null,
    };
  }

  private async findFileUpload(
    documentId: bigint | number,
  ): Promise<FileUpload> {
    const fileUpload = await this.fileRepo.findOne({
      where: { id: Number(documentId) },
    });

    if (!fileUpload) {
      throw new NotFoundException("Document not found");
    }
    return fileUpload;
  }

  private async getFileStream(fileKey: string) {
    return getFileStreamFromStorage(fileKey, {
      repoMode: this.repoMode,
      bucket: this.bucket,
      docRepoPath: this.docRepoPath,
      region: ENV.S3_AWS_REGION,
      logger: this.logger,
    });
  }

  async uploadEmployeeFile(
    file: Express.Multer.File,
    body: CompanyEmployeeFileUploadDto,
    userId: number,
  ) {
    this.logInfo("uploadEmployeeFile", {
      userId,
      companyId: body.companyId,
      companyType: body.companyType,
    });
    try {
      if (!file) {
        throw new BadRequestException("File is required");
      }
      await assertUploadedFileNotPasswordProtected(file);
      if (!body.companyType) {
        throw new BadRequestException("companyType is required");
      }

      const normalizedCompanyType = body.companyType.toLowerCase();
      const MAX_POLICY_FEATURE_SIZE = 25 * 1024 * 1024; // 25 MB
      const normalizedTypeForCheck = normalizedCompanyType.replace(/-/g, "");
      if (normalizedTypeForCheck === "policyfeature") {
        const isPdf =
          file.mimetype === "application/pdf" ||
          (file.originalname || "").toLowerCase().endsWith(".pdf");
        if (!isPdf) {
          throw new BadRequestException(
            "Only PDF files are allowed for policyFeature uploads",
          );
        }
        if (file.size > MAX_POLICY_FEATURE_SIZE) {
          throw new BadRequestException(
            "File size must be 25 MB or less for policyFeature uploads",
          );
        }
      }

      let status = "ACTIVE";
      if (body.opportunityId && body.opportunityActivityId) {
        status = "INACTIVE";
      }

      const { key, fileName, uploadType } = await saveFileToStorage(
        file,
        normalizedCompanyType,
        {
          repoMode: this.repoMode,
          bucket: this.bucket,
          docRepoPath: this.docRepoPath,
          region: ENV.S3_AWS_REGION,
          logger: this.logger,
        },
      );

      const fileUpload = this.fileRepo.create({
        fileKey: key,
        entityType: normalizedCompanyType,
        entityId: body.companyId,
        uploadType,
        documentTypeLid: body.documentTypeLid,
        opportunityId: body.opportunityId,
        opportunityActivityId: body.opportunityActivityId,
        policyId: body.policyId,
        claimId: body.claimId,
        claimActivityId: body.claimActivityId,
        status,
        meetingId: body.meetingId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        deletedAt: null,
      });

      const savedFile = await this.fileRepo.save(fileUpload);
      if (!savedFile || !savedFile.id) {
        throw new BadRequestException("File metadata not saved");
      }

      return {
        status: HttpStatus.OK,
        message: "File uploaded successfully",
        data: {
          id: savedFile.id,
          fileKey: savedFile.fileKey,
          fileName,
          companyType: savedFile.entityType,
          companyId: savedFile.entityId,
          opportunityId: savedFile.opportunityId,
          opportunityActivityId: savedFile.opportunityActivityId,
          policyId: savedFile.policyId,
          claimId: savedFile.claimId,
          claimActivityId: savedFile.claimActivityId,
          meetingId: savedFile.meetingId,
          documentTypeLid: savedFile.documentTypeLid,
          fileBuffer: file.buffer.toString("base64"),
        },
      };
    } catch (error) {
      this.logError("uploadEmployeeFile", error);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error ? error.message : "File upload failed",
          );
    }
  }

  async downloadEmployeeFile(documentId: bigint) {
    // documentId is a native bigint — JSON.stringify (used by the logger) can't
    // serialize that type at all, so it must be stringified before logging.
    this.logInfo("downloadEmployeeFile", { documentId: documentId.toString() });
    try {
      return await prepareFileDownload(documentId, {
        findDocument: (id) => this.findFileUpload(id),
        fetchStream: (key) => this.getFileStream(key),
      });
    } catch (error) {
      this.logError("downloadEmployeeFile", error);
      throw error;
    }
  }

  private abortArchive(archive: archiver.Archiver, res: Response): void {
    if (typeof archive.abort === "function") {
      archive.abort();
      return;
    }
    if (typeof archive.destroy === "function") {
      archive.destroy();
      return;
    }
    if (!res.headersSent) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
      return;
    }
    res.end();
  }

  /**
   * Convert a readable stream to a buffer with proper error handling
   * and timeout protection to prevent hanging streams.
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream, timeoutMs: number = 30000): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const timeout = setTimeout(() => {
        stream.destroy();
        reject(new Error('Stream timeout: Failed to read stream within 30 seconds'));
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timeout);
        stream.removeAllListeners();
      };

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        cleanup();
        try {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        } catch (error) {
          reject(new Error(`Failed to concatenate buffer chunks: ${error.message}`));
        }
      });

      stream.on('error', (error) => {
        cleanup();
        reject(new Error(`Stream error: ${error.message}`));
      });

      // Handle case where stream is already closed/destroyed
      if (stream.readableEnded || stream.destroyed) {
        cleanup();
        resolve(Buffer.concat(chunks));
      }
    });
  }

  private sanitizeZipEntryName(fileName: string): string {
    if (!fileName) {
      return "unnamed-file";
    }

    let sanitized = fileName.replace(/^[A-Za-z]:/, "");
    sanitized = sanitized.replace(/\.\./g, "");
    sanitized = sanitized.replace(/^[\/\\]+|[\/\\]+$/g, "");
    sanitized = sanitized.replace(/[\/\\]/g, "_");
    sanitized = sanitized.replace(/\0/g, "");
    sanitized = sanitized.replace(/[\r\n\t]/g, "");
    sanitized = sanitized.trim();

    return sanitized && sanitized !== "." ? sanitized : "unnamed-file";
  }

  private ensureUniqueZipEntryName(
    baseName: string,
    usedNames: Set<string>,
  ): string {
    let uniqueName = baseName;
    let counter = 1;

    while (usedNames.has(uniqueName)) {
      const lastDotIndex = baseName.lastIndexOf(".");
      if (lastDotIndex > 0) {
        const nameWithoutExt = baseName.substring(0, lastDotIndex);
        const ext = baseName.substring(lastDotIndex);
        uniqueName = `${nameWithoutExt}_(${counter})${ext}`;
      } else {
        uniqueName = `${baseName}_(${counter})`;
      }
      counter++;
    }

    usedNames.add(uniqueName);
    return uniqueName;
  }

  async bulkDownloadEmployeeFilesAsZip(
    body: BulkDownloadEmployeeFilesDto,
    res: Response,
  ) {
    const MAX_DOCS = 50;
    const documentIds = body?.documentIds ?? [];
    const zipFileName = (body?.zipFileName || "my-documents").trim() || "my-documents";

    this.logInfo("bulkDownloadEmployeeFilesAsZip", {
      documentIds,
      zipFileName,
    });

    try {
      if (!documentIds.length) {
        throw new BadRequestException(
          "documentIds array is required and cannot be empty",
        );
      }

      if (documentIds.length > MAX_DOCS) {
        throw new BadRequestException(
          `Maximum ${MAX_DOCS} documents allowed per request. Requested: ${documentIds.length}`,
        );
      }

      let normalizedDocumentIds: bigint[];
      try {
        normalizedDocumentIds = documentIds.map((id) => BigInt(id));
      } catch {
        throw new BadRequestException(
          "Invalid documentIds: all values must be valid numbers or numeric strings",
        );
      }

      const tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), "ibp-bulk-download-"),
      );
      const usedNames = new Set<string>();
      let successCount = 0;
      const downloadFileName = `${this.sanitizeZipEntryName(zipFileName).replace(/\.zip$/i, "") || "my-documents"}.zip`;
      const zipPath = path.join(tempDir, downloadFileName);

      try {
        const archive = archiver("zip", {
          zlib: { level: 9 },
        });
        const output = fs.createWriteStream(zipPath);

        archive.on("error", (err) => {
          this.logError("bulkDownloadEmployeeFilesAsZip.archive", err);
          this.abortArchive(archive, res);
        });

        archive.pipe(output);

        for (const documentId of normalizedDocumentIds) {
          try {
            const fileResult = await prepareFileDownload(documentId, {
              findDocument: (id) => this.findFileUpload(id),
              fetchStream: (key) => this.getFileStream(key),
            });

            // Read the stream into a buffer before appending to the archive.
            // Appending raw S3 streams causes race conditions: S3 opens the HTTP
            // connection immediately (createReadStream), but archiver processes
            // entries sequentially during finalize(). By the time archiver reads
            // a later stream, the connection may have already emitted/lost data,
            // resulting in 0-byte ZIP entries. Buffering avoids this entirely.
            const buffer = await this.streamToBuffer(fileResult.stream);

            if (!buffer || buffer.length === 0) {
              this.logError("bulkDownloadEmployeeFilesAsZip.emptyBuffer", {
                documentId: documentId.toString(),
                fileName: fileResult.fileName,
              });
              continue;
            }

            const sanitizedName = this.sanitizeZipEntryName(fileResult.fileName);
            const uniqueName = this.ensureUniqueZipEntryName(
              sanitizedName,
              usedNames,
            );
            archive.append(buffer, { name: uniqueName });
            successCount++;
          } catch (error) {
            this.logError("bulkDownloadEmployeeFilesAsZip.document", {
              documentId: documentId.toString(),
              error,
            });
          }
        }

        if (!successCount) {
          throw new NotFoundException("No valid documents found to download");
        }

        // Finalize archive with better error handling
        await new Promise<void>((resolve, reject) => {
          let isResolved = false;
          
          const cleanup = () => {
            output.removeAllListeners();
            archive.removeAllListeners();
          };

          const safeResolve = () => {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              resolve();
            }
          };

          const safeReject = (error: Error) => {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              reject(error);
            }
          };

          output.once('close', () => {
            this.logInfo("Archive output stream closed successfully");
            safeResolve();
          });

          output.once('error', (err) => {
            this.logError("Archive output stream error", err);
            safeReject(new Error(`Output stream error: ${err.message}`));
          });

          archive.once('error', (err) => {
            this.logError("Archive error during finalization", err);
            safeReject(new Error(`Archive error: ${err.message}`));
          });

          archive.once('warning', (warning) => {
            this.logInfo("Archive warning", warning);
          });

          try {
            this.logInfo("Finalizing archive...");
            archive.finalize();
          } catch (err) {
            safeReject(new Error(`Failed to finalize archive: ${err.message}`));
          }
        });

        const zipStats = await fs.promises.stat(zipPath);
        this.logInfo("ZIP file created", { 
          size: zipStats.size, 
          path: zipPath,
          successCount 
        });

        if (!zipStats.size) {
          throw new BadRequestException("Generated ZIP file is empty");
        }

        // Validate ZIP file integrity before sending
        try {
          await fs.promises.access(zipPath, fs.constants.R_OK);
        } catch (error) {
          throw new BadRequestException("Generated ZIP file is not readable");
        }

        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${downloadFileName}"`,
        );
        res.setHeader("Content-Length", String(zipStats.size));
        res.setHeader(
          "Access-Control-Expose-Headers",
          "Content-Disposition",
        );

        // Stream the ZIP file to response with better error handling
        await new Promise<void>((resolve, reject) => {
          const zipStream = fs.createReadStream(zipPath);
          let isComplete = false;

          const cleanup = () => {
            zipStream.removeAllListeners();
          };

          const safeResolve = () => {
            if (!isComplete) {
              isComplete = true;
              cleanup();
              this.logInfo("ZIP file streaming completed successfully");
              resolve();
            }
          };

          const safeReject = (error: Error) => {
            if (!isComplete) {
              isComplete = true;
              cleanup();
              this.logError("ZIP file streaming failed", error);
              reject(error);
            }
          };

          zipStream.once('end', safeResolve);
          zipStream.once('error', (err) => {
            safeReject(new Error(`ZIP stream error: ${err.message}`));
          });

          res.once('error', (err) => {
            safeReject(new Error(`Response stream error: ${err.message}`));
          });

          res.once('close', () => {
            this.logInfo("Response connection closed");
            safeResolve();
          });

          zipStream.pipe(res);
        });
      } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.logError("bulkDownloadEmployeeFilesAsZip", {
        documentIds,
        zipFileName,
        error,
      });
      throw error;
    }
  }

  private isEnrollmentEditableWithinCutoff(
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
    return this.enrollmentProcessing.isEnrollmentEditableWithinCutoff(
      lockEnrollmentAfterCutoff,
      enrollmentWindowSource
    );
  }

  private getLockEnrollmentAfterCutoffConstraint(
    config?: PolicyConfiguration | null,
  ): boolean {
    if (!config) {
      return false;
    }

    const rawConfiguration = config.policyConfiguration as unknown;

    let parsedConfiguration: unknown = rawConfiguration;

    if (typeof rawConfiguration === "string") {
      try {
        parsedConfiguration = JSON.parse(rawConfiguration);
      } catch {
        return false;
      }
    }

    if (!parsedConfiguration || typeof parsedConfiguration !== "object") {
      return false;
    }

    const constraints = (
      parsedConfiguration as {
        constraints?: { lockEnrollmentAfterCutoff?: boolean };
      }
    ).constraints;

    return Boolean(constraints?.lockEnrollmentAfterCutoff);
  }

  private getAutoLockAfterConfirmationConstraint(
    config?: PolicyConfiguration | null,
  ): boolean {
    if (!config) {
      return false;
    }

    const rawConfiguration = config.policyConfiguration as unknown;

    let parsedConfiguration: unknown = rawConfiguration;

    if (typeof rawConfiguration === "string") {
      try {
        parsedConfiguration = JSON.parse(rawConfiguration);
      } catch {
        return false;
      }
    }

    if (!parsedConfiguration || typeof parsedConfiguration !== "object") {
      return false;
    }

    const constraints = (
      parsedConfiguration as {
        constraints?: { autoLockEnrollmentAfterConfirmation?: boolean };
      }
    ).constraints;

    return Boolean(constraints?.autoLockEnrollmentAfterConfirmation);
  }

  private buildCompanyPolicyAutoLockSettings(
    companyPolicyConfig?: CompanyPolicyConfigEntry[] | null,
  ): Map<string, PolicyAutoLockSettings> {
    const lookup = new Map<string, PolicyAutoLockSettings>();

    if (!companyPolicyConfig?.length) {
      return lookup;
    }

    for (const entry of companyPolicyConfig) {
      const rawSettings = entry.settings ?? {};

      const entrySettings: PolicyAutoLockSettings = {};
      if (rawSettings.autoLockEnrollment !== undefined) {
        entrySettings.autoLockEnrollment = Boolean(
          rawSettings.autoLockEnrollment,
        );
      }

      if (rawSettings.autoLockAfterConfirmation !== undefined) {
        entrySettings.autoLockAfterConfirmation = Boolean(
          rawSettings.autoLockAfterConfirmation,
        );
      }

      const hasSettings =
        typeof entrySettings.autoLockEnrollment === "boolean" ||
        typeof entrySettings.autoLockAfterConfirmation === "boolean";

      if (!hasSettings) {
        continue;
      }

      const normalizedKeys = [
        this.normalizePolicyConfigKey(entry.policyId),
        this.normalizePolicyConfigKey(entry.policyName),
        this.normalizePolicyConfigKey(
          this.getPolicyIdFromTypeKey(entry.policyTypeKey),
        ),
      ];

      const settingsForEntry = { ...entrySettings };

      for (const normalizedKey of normalizedKeys) {
        if (!normalizedKey) {
          continue;
        }
        lookup.set(normalizedKey, settingsForEntry);
      }
    }

    return lookup;
  }

  private normalizePolicyConfigKey(
    value?: string | number | null,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = String(value).trim().toLowerCase();
    return normalized.length ? normalized : null;
  }

  private getPolicyIdFromTypeKey(policyTypeKey?: string | null): string | null {
    if (!policyTypeKey) {
      return null;
    }

    const normalizedKey = policyTypeKey.trim();
    if (!normalizedKey.length) {
      return null;
    }

    const mappedPolicyId = POLICY_TYPE_KEY_TO_POLICY_ID[normalizedKey];
    if (mappedPolicyId) {
      return mappedPolicyId;
    }

    return normalizedKey.replace(/^POLICY_TYPE_/, "");
  }

  private findPolicyAutoLockSettings(
    policy: Policy | undefined,
    lookup: Map<string, PolicyAutoLockSettings>,
  ): PolicyAutoLockSettings | undefined {
    if (!policy || !lookup.size) {
      return undefined;
    }

    const candidates = [
      this.normalizePolicyConfigKey(policy.policyType?.lookUpKey),
      this.normalizePolicyConfigKey(policy.policyType?.lookUpValue),
      this.normalizePolicyConfigKey(
        this.getPolicyIdFromTypeKey(policy.policyType?.lookUpKey),
      ),
      this.normalizePolicyConfigKey(policy.policyName),
      this.normalizePolicyConfigKey(policy.id?.toString()),
    ];

    for (const candidate of candidates) {
      if (candidate && lookup.has(candidate)) {
        return lookup.get(candidate);
      }
    }

    return undefined;
  }

  private determinePolicyEditability(
    lockEnrollmentAfterCutoff: boolean,
    enrollmentWindowSource:
      | Pick<Endorsement, "enrollmentStartDate" | "enrollmentEndDate" | "createdAt">
      | Pick<
          PolicyEnrollmentEmployeePolicyMap,
          "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
        >
      | null,
    settings?: PolicyAutoLockSettings,
  ): boolean {
    if (!settings) {
      return this.isEnrollmentEditableWithinCutoff(
        lockEnrollmentAfterCutoff,
        enrollmentWindowSource,
      );
    }

    const { autoLockAfterConfirmation, autoLockEnrollment } = settings;
    const hasExplicitAutoLockAfterConfirmation =
      typeof autoLockAfterConfirmation === "boolean";
    const hasExplicitAutoLockEnrollment =
      typeof autoLockEnrollment === "boolean";

    if (autoLockAfterConfirmation) {
      return false;
    }

    if (
      hasExplicitAutoLockAfterConfirmation &&
      autoLockAfterConfirmation === false &&
      hasExplicitAutoLockEnrollment &&
      autoLockEnrollment === false
    ) {
      return true;
    }

    if (autoLockEnrollment) {
      return this.isEnrollmentEditableWithinCutoff(
        lockEnrollmentAfterCutoff,
        enrollmentWindowSource,
      );
    }

    return this.isEnrollmentEditableWithinCutoff(
      lockEnrollmentAfterCutoff,
      enrollmentWindowSource,
    );
  }

  async processEmployeeUploadFile(documentId: number): Promise<void> {
    this.logInfo("processEmployeeUploadFile", { documentId });
    const upload = await this.uploadRepo.findOne({
      where: {
        documentId,
        documentType: DOCUMENT_TYPE_POLICY_EMPLOYEE_DATA,
      },
    });

    if (!upload) {
      throw new NotFoundException(
        `Document processing file not found for documentId ${documentId}`,
      );
    }

    void processEmployeeUpload(upload, {
      logInfo: this.logInfo.bind(this),
      logError: this.logError.bind(this),
      uploadRepo: this.uploadRepo,
      fileRepo: this.fileRepo,
      policyRepo: this.policyRepo,
      endorsementRepo: this.endorsementRepository,
      companyEmployeeRepo: this.companyEmployeeRepo,
      dependentRepo: this.dependentRepo,
      summaryRepo: this.summaryRepo,
      employeePolicyMapRepo: this.employeePolicyMapRepo,
      employeeEnrollmentRepo: this.employeeEnrollmentRepo,
      policyEmployeeEndorsementRepo: this.policyEmployeeEndorsementRepo,
      policyDependentEndorsementRepo: this.policyDependentEndorsementRepo,
      userRepo: this.userRepo,
      roleRepo: this.roleRepo,
      userRoleRepo: this.userRoleRepo,
      lookUpRepository: this.lookUpRepository,
      policyConfigRepo: this.policyConfigRepo,
      authenticationMethodRepo: this.authenticationMethodRepo,
      companyAuthenticationMapRepo: this.companyAuthenticationMappingRepository,
    }).catch((error) => {
      this.logError("processEmployeeUploadFile", {
        documentId,
        error: error instanceof Error ? error.message : error,
      });
    });
  }

  private async resolveCompanyIdByDomain(domain?: string): Promise<{
    companyId: number | null;
    isCommon: boolean;
    allCompanyIds: number[];
    configId: number | null;
  }> {
    console.log("resolveCompanyIdByDomain called with domain:", domain);
    if (!domain) {
      return { companyId: null, isCommon: true, allCompanyIds: [], configId: null };
    }

    const configs = await this.configCompanyRepository.find({
      where: { subDomain: domain },
    });

    const validConfigs = configs.filter((c) => c.companyId != null);
    
    if (validConfigs.length === 0) {
      return { companyId: null, isCommon: true, allCompanyIds: [], configId: null };
    }

    const allCompanyIds = validConfigs.map((c) => c.companyId as number);
    console.log("resolveCompanyIdByDomain allCompanyIds",allCompanyIds )
    const primaryConfig = validConfigs[0];

    return {
      companyId: primaryConfig.companyId,
      isCommon: primaryConfig.isCompanyConfig === false,
      allCompanyIds,
      configId: primaryConfig.id,
    };
  }

  /**
   * Throws ForbiddenException if the employee is not covered by the domain's scope.
   *
   * Scope semantics (company_portal_config_scope):
   *   - No rows OR any row with policy_id=null  → ALL_POLICIES mode, everyone allowed
   *   - Rows with specific policy_ids            → employee must be enrolled in ≥1
   *   - Row also has address_id set              → employee's policyConfigLocationId must match
   */
  private async assertEmployeeInDomainScope(
    configId: number,
    employeeId: number,
    logPrefix = "[scope-check]",
  ): Promise<void> {
    const scopeRows = await this.portalConfigScopeRepo.find({ where: { configId } });
    // No rows or sentinel null row → all policies/locations allowed
    if (scopeRows.length === 0 || scopeRows.some((r) => r.policyId === null)) {
      return;
    }

    const enrolledMaps = await this.employeePolicyMapRepo.find({ where: { employeeId } });
    const enrolledPolicyIds = new Set(enrolledMaps.map((m) => m.policyId));

    // Fetch employee's location only if any scope row has an address restriction
    const hasLocationRestriction = scopeRows.some((r) => r.addressId !== null);
    let employeeLocationId: number | null = null;
    if (hasLocationRestriction) {
      const empRecord = await this.companyEmployeeRepo.findOne({
        where: { id: employeeId },
        select: ["id", "policyConfigLocationId"] as any,
      });
      employeeLocationId = (empRecord as any)?.policyConfigLocationId ?? null;
    }

    // A match exists if any scope row (policy, optional location) is satisfied
    const hasMatch = scopeRows.some((row) => {
      if (!enrolledPolicyIds.has(row.policyId as number)) return false;
      if (row.addressId === null) return true; // no location restriction for this policy
      return employeeLocationId === row.addressId;
    });

    console.log(
      `${logPrefix} scope check configId=${configId} employeeId=${employeeId} ` +
      `enrolledPolicies=[${[...enrolledPolicyIds].join(",")}] ` +
      `employeeLocation=${employeeLocationId} hasMatch=${hasMatch}`,
    );

    if (!hasMatch) {
      throw new ForbiddenException(
        "You are not enrolled in any policy covered under this portal. Please use the correct portal URL or contact your HR.",
      );
    }
  }

  private async ensureEmployeeBelongsToCompany(
    userId: number,
    companyIds: number | number[] | null,
  ) {
    const ids = companyIds === null ? [] : Array.isArray(companyIds) ? companyIds : [companyIds];
    if (ids.length === 0) {
      throw new NotFoundException(errorMessages.userNotFound);
    }

    const employee = await this.companyEmployeeRepo.findOne({
      where: { userId, companyId: ids.length === 1 ? ids[0] : (In(ids) as any) },
    });

    if (employee) {
      return;
    }

    // Fallback: HR-only users are not in policy_enrollment_employee
    const isHrInCompany = await this.companyEmployeeRepository.isHrUserInAnyCompany(userId, ids);
    console.log(`[ensureEmployeeBelongsToCompany] userId=${userId} companyIds=${ids} isHrInCompany=${isHrInCompany}`);
    if (!isHrInCompany) {
      throw new NotFoundException(errorMessages.userNotFound);
    }
  }

  private async resolveCompanyId(userId: number): Promise<number | null> {
    const record = await this.companyEmployeeRepo.findOne({
      where: { userId },
      select: ["companyId"],
      order: { id: "DESC" },
    });
    return record?.companyId ?? null;
  }

  private parseSessionTimeoutMinutes(config?: Record<string, any> | null): number | null {
    if (!config) return null;
    const minutes = Number(
      config?.passwordConfig?.sessionSettings?.sessionTimeoutMinutes ??
        config?.sessionSettings?.sessionTimeoutMinutes ??
        config?.otpConfig?.sessionTimeoutMinutes
    );
    if (Number.isNaN(minutes) || minutes <= 0) {
      return null;
    }
    return minutes;
  }

  private async fetchMethodConfiguration(
    companyId: number | null,
    methodCode: string
  ): Promise<Record<string, any> | null> {
    if (!companyId || !methodCode) {
      return null;
    }
    const config = await this.companyAuthenticationConfigRepository
      .createQueryBuilder("config")
      .leftJoinAndSelect("config.authenticationMethod", "method")
      .where("config.companyId = :companyId", { companyId })
      .andWhere("method.methodCode = :methodCode", {
        methodCode: methodCode.toUpperCase(),
      })
      .orderBy("config.id", "DESC")
      .getOne();
    return config?.companyPortalAuthConfig ?? null;
  }

  private async resolveTokenExpiryForMethod(
    companyId: number | null,
    methodCode?: string
  ): Promise<string> {
    if (!companyId || !methodCode) {
      return this.resolveDefaultAccessTokenExpiry();
    }
    const config = await this.fetchMethodConfiguration(companyId, methodCode);
    const minutes = this.parseSessionTimeoutMinutes(config);
    if (!minutes) {
      return this.resolveDefaultAccessTokenExpiry();
    }
    return `${minutes}m`;
  }

  private resolveDefaultAccessTokenExpiry(): string {
    const sessionTimeoutMinutes = Number(ENV.SESSION_TIMEOUT_MINUTES);
    if (!Number.isNaN(sessionTimeoutMinutes) && sessionTimeoutMinutes > 0) {
      return `${sessionTimeoutMinutes}m`;
    }

    const jwtExpiration = String(ENV.JWT_EXPIRATION || "").trim();
    if (jwtExpiration) {
      // Numeric string in jsonwebtoken is interpreted as milliseconds.
      // Treat plain numbers as minutes to avoid accidental ultra-short TTL.
      if (/^\d+$/.test(jwtExpiration)) {
        return `${jwtExpiration}m`;
      }
      return jwtExpiration;
    }

    return "2h";
  }

  private resolveRefreshTokenExpiry(): string {
    return ENV.JWT_REFRESH_EXPIRATION || "7d";
  }

  async validateUser(
    loginName: string,
    password: string,
    domain?: string,
    loginMethod?: string,
  ): Promise<any | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "validateUser",
        payload: { loginName },
        messageData: "method invoked",
      }),
    });
    try {
      const { companyId, isCommon, allCompanyIds, configId } = await this.resolveCompanyIdByDomain(
        domain,
      );
      const methodCode = (loginMethod || "").toUpperCase();

      if (
        (!domain || isCommon) &&
        methodCode &&
        methodCode !== "USERNAME_PASSWORD"
      ) {
        throw new NotFoundException(errorMessages.userNotFound);
      }

      let user = null;
      let isHrUser = false;
      let resolvedCompanyId = companyId;

      // When multiple companies share the same domain, search across all of them
      const companyIdsToSearch = allCompanyIds.length > 1 && !isCommon ? allCompanyIds : null;

      if (companyIdsToSearch) {
        // Try each company until we find the employee
        for (const cid of companyIdsToSearch) {
          switch (methodCode) {
            case "EMAIL_PASSWORD":
            case "EMAIL_OTP":
              user = await this.companyEmployeeRepository.findByEmail(loginName, cid);
              break;
            case "PHONE_PASSWORD":
            case "PHONE_OTP":
            case "MOBILE_OTP":
              user = await this.companyEmployeeRepository.findByPhoneNumber(loginName, cid);
              break;
            default:
              // EMPLOYEE_ID, USERNAME_PASSWORD, etc.
              user = await this.companyEmployeeRepository.findByLoginName(loginName, cid);
              break;
          }
          if (user) {
            resolvedCompanyId = cid;
            break;
          }
        }
      } else {
        const scopedCompanyId = companyId && !isCommon ? companyId : undefined;
        switch (methodCode) {
          case "EMAIL_PASSWORD":
            user = await this.companyEmployeeRepository.findByEmail(loginName, scopedCompanyId);
            break;
          case "PHONE_PASSWORD":
            user = await this.companyEmployeeRepository.findByPhoneNumber(loginName, scopedCompanyId);
            break;
          default:
            user = await this.companyEmployeeRepository.findByLoginName(loginName, scopedCompanyId);
            break;
        }
      }

      let isPureHrUser = false;
      if (!user) {
        // Fallback: HR users have a different userTypeKey — look up via hr_user_management
        user = await this.companyEmployeeRepository.findHRUserByIdentifier(loginName, methodCode);
        if (user) {
          isHrUser = true;
          isPureHrUser = true;
          this.logger.log({ level: "info", message: `[validateUser] HR fallback found user: userId=${user.userId} userTypeKey=${user.userTypeKey}` });
        }
      } else if (!isCommon && allCompanyIds.length > 0) {
        // Employee found — check if they're also an HR user for this domain (hybrid user).
        // HR users bypass the domain scope enrollment check.
        const email = user.emailId ?? '';
        isHrUser = await this.companyEmployeeRepository.isHrUserByEmailInAnyCompany(email, allCompanyIds);
        if (isHrUser) this.logger.log({ level: "info", message: `[validateUser] hybrid HR user detected email=${email}` });
      }

      if (!user) {
        throw new NotFoundException(errorMessages.userNotFound);
      }

      if ((user as any).userStatusKey === USER_STATUS_INACTIVE) {
        throw new ForbiddenException("Your account has been blocked by the organisation. Please contact your HR.");
      }

      // Only pure HR users (found via HR fallback, not employee table) need the company membership check.
      // Hybrid users were already scoped to a domain company by findByEmail.
      if (isPureHrUser && !isCommon && allCompanyIds.length > 0) {
        console.log(`[validateUser] HR ensureEmployeeBelongsToCompany userId=${user.userId} allCompanyIds=${allCompanyIds}`);
        await this.ensureEmployeeBelongsToCompany(user.userId, allCompanyIds);
      }

      // Domain scope check: employee must be enrolled in at least one policy+location
      // combination covered by this domain's scope.
      if (configId && !isHrUser) {
        await this.assertEmployeeInDomainScope(configId, user.userId, "[validateUser]");
      }

      // Domain scope check: employee must be enrolled in at least one policy+location
      // combination covered by this domain's scope.
      if (configId && !isHrUser) {
        await this.assertEmployeeInDomainScope(configId, user.userId, "[validateUser]");
      }

      if (user && (await isPasswordMatch(password, user.ibpPassword ?? user.password ?? ""))) {
        const accessToken = await this.getTokens(user as User, {
          loginMethodCode: methodCode || "USERNAME_PASSWORD",
          companyId: resolvedCompanyId ?? null,
          configId: configId ?? null,
        });
        delete user.password;
        delete user.ibpPassword;
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId: user.userId,
            status: "success",
            location: "IBP CompanyEmployeeService",
            method: "validateUser",
            payload: { loginName },
            messageData: "Access token generated",
          }),
        });
        if (loginName === `${ENV.SCHEDULER_LOGIN_USERNAME}`) {
          throw new ForbiddenException(errorMessages.unauthorizedUser);
        }
        return { accessToken };
      }
      throw new ForbiddenException(errorMessages.invalidCredentials);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: "validateUser",
          payload: { loginName },
          status: "failure",
          location: "IBP CompanyEmployeeService",
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new NotFoundException(errorMessages.userNotFound);
    }
  }

  private maskEmail(email?: string | null): string {
    const value = String(email || "").trim();
    if (!value.includes("@")) return "";
    const [name, domain] = value.split("@");
    if (!name || !domain) return "";
    if (name.length <= 2) return `${name[0] || "*"}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }

  async checkPasswordReadiness(
    userName: string,
    domain?: string,
    loginMethod?: string,
  ): Promise<{
    canUsePassword: boolean;
    shouldSendResetLink: boolean;
    message: string;
    maskedEmail?: string;
  }> {
    const { companyId, isCommon, allCompanyIds, configId } = await this.resolveCompanyIdByDomain(domain);
    const methodCode = (loginMethod || "").toUpperCase();
    console.log(`[password-readiness] userName=${userName} domain=${domain} methodCode=${methodCode} companyId=${companyId} isCommon=${isCommon} allCompanyIds=${allCompanyIds}`);

    let user = null;
    let isHrUser = false;

    // For shared domains, search across all tagged companies
    const companyIdsToSearch = allCompanyIds.length > 1 && !isCommon ? allCompanyIds : null;
    console.log(`[password-readiness] companyIdsToSearch=${companyIdsToSearch}`);
    if (companyIdsToSearch) {
      for (const cid of companyIdsToSearch) {
        console.log(`[password-readiness] if block Searching for user in companyId=${cid}, methodCode=${methodCode}, userName=${userName}`);
        switch (methodCode) {
          case "EMAIL_PASSWORD":
          case "EMAIL_OTP":
            user = await this.companyEmployeeRepository.findByEmail(userName, cid);
            break;
          case "PHONE_PASSWORD":
          case "PHONE_OTP":
          case "MOBILE_OTP":
            user = await this.companyEmployeeRepository.findByPhoneNumber(userName, cid);
            break;
          default:
            user = await this.companyEmployeeRepository.findByLoginName(userName, cid);
            break;
        }
        if (user) break;
      }
    } else {
      console.log(`[password-readiness]else block Searching for user in companyId=${companyId}, methodCode=${methodCode}, userName=${userName}`);
      const scopedCompanyId = companyId && !isCommon ? companyId : undefined;
      switch (methodCode) {
        case "EMAIL_PASSWORD":
        case "EMAIL_OTP":
          user = await this.companyEmployeeRepository.findByEmail(userName, scopedCompanyId);
          break;
        case "PHONE_PASSWORD":
        case "PHONE_OTP":
        case "MOBILE_OTP":
          user = await this.companyEmployeeRepository.findByPhoneNumber(userName, scopedCompanyId);
          break;
        default:
          user = await this.companyEmployeeRepository.findByLoginName(userName, scopedCompanyId);
          break;
      }
    }
    console.log(`[password-readiness] findByEmail/Phone/LoginName result:`, user ? `found userId=${user.userId} email=${user.emailId}` : 'null');

    let isPureHrUser = false;
    if (!user) {
      // Fallback: HR-only users have a different userTypeKey — look up via hr_user_management
      user = await this.companyEmployeeRepository.findHRUserByIdentifier(userName, methodCode);
      isHrUser = !!user;
      isPureHrUser = isHrUser;
      console.log(`[password-readiness] findHRUserByIdentifier result:`, user ? `found userId=${user.userId} email=${user.emailId}` : 'null');
    } else if (!isCommon && allCompanyIds.length > 0) {
      // Employee found — but they may also be an HR user for this domain (hybrid user).
      // HR users bypass the domain scope enrollment check, so detect this case.
      const email = user.emailId ?? '';
      isHrUser = await this.companyEmployeeRepository.isHrUserByEmailInAnyCompany(email, allCompanyIds);
      console.log(`[password-readiness] hybrid HR check email=${email} isHrUser=${isHrUser}`);
    }

    if (!user) {
      throw new NotFoundException(errorMessages.userNotFound);
    }

    if ((user as any).userStatusKey === USER_STATUS_INACTIVE) {
      throw new ForbiddenException("Your account has been blocked by the organisation. Please contact your HR.");
    }

    // Only pure HR users (found via HR fallback, not employee table) need the company membership check.
    // Hybrid users were already scoped to a domain company by findByEmail.
    if (isPureHrUser && !isCommon && allCompanyIds.length > 0) {
      console.log(`[password-readiness] HR ensureEmployeeBelongsToCompany userId=${user.userId} allCompanyIds=${allCompanyIds}`);
      await this.ensureEmployeeBelongsToCompany(user.userId, allCompanyIds);
    }

    // Domain scope check: employee must be enrolled in at least one policy+location
    // combination covered by this domain's scope.
    if (configId && !isHrUser) {
      await this.assertEmployeeInDomainScope(configId, user.userId, "[password-readiness]");
    }

    // Domain scope check: employee must be enrolled in at least one policy+location
    // combination covered by this domain's scope.
    if (configId && !isHrUser) {
      await this.assertEmployeeInDomainScope(configId, user.userId, "[password-readiness]");
    }

    // The sole signal for IBP password readiness is whether ibpPassword has been
    // set. We intentionally do NOT check isPasswordSet here because that field
    // is shared with IWork and IWork does not maintain it the same way.
    if (!user.ibpPassword) {
      return {
        canUsePassword: false,
        shouldSendResetLink: true,
        message:
          "Looks like your password is not set yet. We sent a reset link to your email.",
        maskedEmail: this.maskEmail(user.emailId),
      };
    }

    return {
      canUsePassword: true,
      shouldSendResetLink: false,
      message: "Password can be used for this account.",
      maskedEmail: this.maskEmail(user.emailId),
    };
  }

  async getTokens(
    userDetails: User,
    options?: {
      loginMethodCode?: string;
      companyId?: number | null;
      configId?: number | null;
    },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId: userDetails?.userId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "getTokens",
        payload: { userId: userDetails?.userId },
        messageData: "method invoked",
      }),
    });
    try {
      if (!userDetails) {
        throw new ForbiddenException(
          "User details are required to generate tokens.",
        );
      }

      if (!userDetails.userId) {
        throw new ForbiddenException("User ID is missing in user details.");
      }

      const resolvedMethodCode =
        options?.loginMethodCode?.toUpperCase() || "USERNAME_PASSWORD";
      const resolvedCompanyId =
        options?.companyId ??
        (await this.resolveCompanyId(userDetails.userId)) ??
        userDetails.organisationId ??
        null;
      const tokenExpiry = await this.resolveTokenExpiryForMethod(
        resolvedCompanyId,
        resolvedMethodCode
      );
      const refreshTokenExpiry = this.resolveRefreshTokenExpiry();

      const payload = {
        userDetails: {
          departmentId: userDetails.departmentId,
          emailId: userDetails.emailId,
          userId: userDetails.userId,
          iirmId: userDetails.iirmEmpId,
          roles: userDetails?.roles,
          organisationId: userDetails?.organisationId,
        },
        portal: "IBP",
        loginMethod: resolvedMethodCode,
        companyId: resolvedCompanyId,
        configId: options?.configId ?? null,
      };

      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: tokenExpiry,
      });

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET,
        expiresIn: refreshTokenExpiry,
      });
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userDetails.userId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "getTokens",
          payload: { userId: userDetails.userId },
          messageData: "Access token generated",
        }),
      });
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userDetails?.userId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getTokens",
          payload: { userId: userDetails?.userId },
          messageData: error,
        }),
      });
      throw new ForbiddenException(
        error.message || "An error occurred while generating tokens.",
      );
    }
  }

  async findEnrolledEmployeeByEmailAndCompany(
    email: string,
    companyId: number,
  ): Promise<{ id: number } | null> {
    return this.companyEmployeeRepository.findEnrolledEmployeeByEmailAndCompany(email, companyId);
  }

  async generateCrmRefreshableTokens(
    userId: number,
    companyId: number | null,
    emailId: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenExpiry = this.resolveDefaultAccessTokenExpiry();
    const refreshTokenExpiry = this.resolveRefreshTokenExpiry();
    const payload = {
      userDetails: { userId, emailId },
      portal: "HR_PORTAL",
      roleKey: "PORTAL_CRM",
      companyId,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: tokenExpiry }),
      this.jwtService.signAsync(payload, {
        secret: ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET,
        expiresIn: refreshTokenExpiry,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async validateRefreshTokenAndRotateTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken?.trim()) {
      throw new ForbiddenException("Refresh token is required.");
    }

    try {
      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(refreshToken, {
          secret:
            ENV.JWT_REFRESH_SECRET ||
            ENV.JWT_SECRET ||
            process.env.JWT_SECRET ||
            "default_jwt_secret",
        });
      } catch {
        payload = await this.jwtService.verifyAsync(refreshToken, {
          secret:
            ENV.JWT_SECRET || process.env.JWT_SECRET || "default_jwt_secret",
        });
      }
      const userDetails = payload?.userDetails;
      if (!userDetails?.userId) {
        throw new ForbiddenException("Invalid refresh token.");
      }
      if (payload?.portal && payload.portal !== "IBP" && payload.portal !== "HR_PORTAL") {
        throw new ForbiddenException("Invalid refresh token for IBP.");
      }

      const isCrmSession = payload?.roleKey === "PORTAL_CRM";

      // CRM sessions use a simpler rotation — preserve portal/roleKey, no login-method lookup.
      if (isCrmSession) {
        return this.generateCrmRefreshableTokens(
          Number(userDetails.userId),
          (payload?.companyId as number | null) ?? null,
          userDetails.emailId ?? null,
        );
      }

      const userId = Number(userDetails.userId);
      const loginMethodCode = String(
        payload?.loginMethod || "USERNAME_PASSWORD",
      ).toUpperCase();
      const companyId =
        (payload?.companyId as number | undefined) ??
        (await this.resolveCompanyId(userId)) ??
        userDetails.organisationId ??
        null;
      const tokenExpiry = await this.resolveTokenExpiryForMethod(
        companyId,
        loginMethodCode
      );
      const refreshTokenExpiry = this.resolveRefreshTokenExpiry();

      const nextPayload = {
        userDetails,
        portal: "IBP",
        loginMethod: loginMethodCode,
        companyId,
        configId: (payload?.configId as number | null | undefined) ?? null,
      };

      const [nextAccessToken, nextRefreshToken] = await Promise.all([
        this.jwtService.signAsync(nextPayload, {
          expiresIn: tokenExpiry,
        }),
        this.jwtService.signAsync(nextPayload, {
          secret: ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET,
          expiresIn: refreshTokenExpiry,
        }),
      ]);

      return {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      };
    } catch (error: any) {
      if (error?.name === "TokenExpiredError") {
        throw new UnauthorizedException("Refresh token has expired.");
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException("Invalid refresh token.");
    }
  }

  async getEmployeeDetailsByUserId(
    userId: number,
  ): Promise<EmployeeDetailsDto | null> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeeDetailsByUserId",
          messageData: "method invoked",
        }),
      });
      const employeeDetails =
        await this.companyEmployeeRepository.getEmployeeDetailsByUserId(userId);
      return employeeDetails;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeeDetailsByUserId",
          messageData: error,
        }),
      });
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.failedToFetchEmployeeDetails,
      );
    }
  }

  async getEmployeeLocalization(userId: number) {
    return this.companyEmployeeRepository.getEmployeeLocalization(userId);
  }

  async getEmployeeContactMatrix(
    employeeId: number,
    userId: number,
  ): Promise<EmployeePolicyContactMatrixResponseDto> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeeContactMatrix",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });

      const policyIds =
        await this.companyEmployeeRepository.getPolicyIdsForEmployee(
          employeeId,
        );

      const policyDetails = policyIds.length
        ? await this.policyRepo.find({
            where: { id: In(policyIds) },
            select: ["id", "policyName", "policyTypeLid"],
          })
        : [];
      const policyDetailsMap = new Map(
        policyDetails.map((policy) => [policy.id, policy]),
      );

      const typeIds = Array.from(
        new Set(
          policyDetails
            .map((policy) => policy.policyTypeLid)
            .filter((id): id is number => typeof id === "number"),
        ),
      );
      const typeRows = typeIds.length
        ? await this.lookUpRepository.find({
            where: { id: In(typeIds) },
            select: ["id", "lookUpValue"],
          })
        : [];
      const typeMap = new Map(typeRows.map((row) => [row.id, row.lookUpValue]));

      const policies = await Promise.all(
        policyIds.map(async (policyId) => {
          const [metrics, partyDetails] = await Promise.all([
            this.companyEmployeeRepository.getPolicyContactMetrics(policyId),
            this.companyEmployeeRepository.getPolicyPrimaryPartyDetails(
              policyId,
            ),
          ]);
          const response = this.buildPolicyContactMatrixResponse(
            policyId,
            metrics,
          );
          response.contacts.tpa.companyId = partyDetails.tpa?.id;
          response.contacts.tpa.companyName = partyDetails.tpa?.name ?? null;
          response.contacts.tpa.companyDisplayName =
            partyDetails.tpa?.displayName ?? null;
          response.contacts.tpa.logoFileId =
            partyDetails.tpa?.logoFileId ?? null;
          response.contacts.insurer.companyId = partyDetails.insurer?.id;
          response.contacts.insurer.companyName =
            partyDetails.insurer?.name ?? null;
          response.contacts.insurer.companyDisplayName =
            partyDetails.insurer?.displayName ?? null;
          response.contacts.insurer.logoFileId =
            partyDetails.insurer?.logoFileId ?? null;
          const details = policyDetailsMap.get(policyId);
          response.policyName = details?.policyName ?? null;
          response.policyTypeLid =
            typeof details?.policyTypeLid === "number"
              ? details.policyTypeLid
              : null;
          response.policyType = details?.policyTypeLid
            ? typeMap.get(details.policyTypeLid) ?? null
            : null;
          return response;
        }),
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeeContactMatrix",
          payload: {
            employeeId,
            policyCount: policies.length,
          },
          messageData: "Employee policy contact matrix retrieved",
        }),
      });

      return {
        employeeId,
        policies,
        hasPolicies: policies.length > 0,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeeContactMatrix",
          payload: { employeeId },
          messageData:
            error instanceof Error
              ? error.message
              : "Failed to fetch employee contact matrix",
        }),
      });

      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to retrieve employee contact matrix",
      );
    }
  }

  async UpdateEmployeeDetailsByEmployeeId(
    userId: number,
    employeeId: number,
    employeeDetails: UpdateEmployeeDetails,
  ): Promise<EmployeeDetailsDto | null> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "UpdateEmployeeDetailsByEmployeeId",
          messageData: "method invoked",
        }),
      });
      const updatedEmployeeDetails =
        await this.companyEmployeeRepository.updateEmployeeDetails(
          userId,
          employeeId,
          employeeDetails,
        );
      return updatedEmployeeDetails;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "UpdateEmployeeDetailsByEmployeeId",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.failedToFetchEmployeeDetails,
      );
    }
  }

  async getEmployeeRelatedComponentsBasedOnPolicy(
    employeeId: number,
    policy_id: number,
    dependents: UpsertEnrollmentDependentDto[] = [],
    isModified: boolean = false,
  ) {
    try {
      let employeeComponentDetails;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeeRelatedComponentsBasedOnPolicy",
          payload: { employeeId, policy_id },
          messageData: "method invoked",
        }),
      });
      const employeeDetails =
        await this.companyEmployeeRepository.getEmployeeDetailsByEmployeeId(
          employeeId,
        );
      const employeePolicyConfigurations =
        await this.companyEmployeeRepository.getPolicyConfigurationByPolicyId(
          policy_id,
        );
      if (!employeeDetails || !employeePolicyConfigurations) {
        throw new BadRequestException(
          errorMessages.failedToFetchEmployeePolicyComponents,
        );
      } else {
        const data = employeePolicyConfigurations?.policyConfiguration as any;
        let isRelationshipGroup = Array.isArray(data?.parameters)
          ? data.parameters.some(
              (p: any) => p.type === POLICY_RELATIONSHIP_TYPE_PARAMETER,
            )
          : false;
        employeeComponentDetails =
          await this.getEmployeeDetailsWithPolicyComponents(
            employeeDetails,
            employeePolicyConfigurations.policyConfiguration,
            policy_id,
            dependents,
            isRelationshipGroup,
            isModified,
          );
      }
      return employeeComponentDetails;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeeRelatedComponentsBasedOnPolicy",
          payload: { employeeId, policy_id },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.failedToFetchEmployeePolicyComponents,
      );
    }
  }

  async getEmployeeDetailsWithPolicyComponents(
    employeeDetails: GetEmployeeDetails,
    policyConfig: any,
    policyId: number,
    dependents: UpsertEnrollmentDependentDto[] = [],
    isPolicyConfigBasedOnRelationship: boolean = false,
    isModified: boolean = false,
  ): Promise<GetEmployeeDetailsWithPolicyComponents | null> {
    return this.enrollmentProcessing.getEmployeeDetailsWithPolicyComponents(
      employeeDetails as any,
      policyConfig,
      policyId,
      dependents,
      isPolicyConfigBasedOnRelationship,
      isModified
    );
  }

  filterPolicyOptions(
    employeeDetails: any,
    policyConfig: any,
    dependents: UpsertEnrollmentDependentDto[] = [],
  ) {
    return this.enrollmentProcessing.filterPolicyOptions(
      employeeDetails,
      policyConfig,
      dependents
    );
  }

  convertToCamelCase(str: string) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
        index === 0 ? match.toLowerCase() : match.toUpperCase(),
      )
      .replace(/\s+/g, "") // Remove spaces
      .replace(/_/g, ""); // Remove underscores if any
  }

  private matchesRelationGroupSelection(
    selection: string,
    group: any,
  ): boolean {
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
        this.normalizeValue(String(candidate)) === normalizedSelection,
    );
  }

  getEmployeeDetailsBasedOnProperties(
    employeeDetails: any,
    employeeKey: string,
  ) {
    let normalizedAdditionalDetails: any = {};
    // prepare normalized map of the additional parameters;
    for (let key in employeeDetails.additionalDetails) {
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
    // Step 1: check if the employee property is main property of employee entity
    if (employeeDetails[employeeKey]) {
      return employeeDetails[employeeKey];
    } // Step 2: check if that value is present in the additional properties of employee entity
    else if (
      normalizedAdditionalDetails?.hasOwnProperty(employeeKey.toLowerCase())
    ) {
      return normalizedAdditionalDetails[employeeKey.toLowerCase()];
    } // Step 3: Handling the age property with the special case as we only have Date of birth
    else if (
      employeeKey.toLowerCase() === "age" &&
      employeeDetails.dateOfBirth
    ) {
      const dob = new Date(employeeDetails.dateOfBirth);
      const today = new Date(employeeDetails?.effectiveDate) ?? new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    }
  }

  getEmployeeRelationTypes(
    dependents: UpsertEnrollmentDependentDto[],
    relationships: any,
    constraints: Record<string, any> = {},
    employeeGender = "",
    relationGroupSelection?: string,
    relationGroupDetails?: any[],
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
                "",
              );
              availableRelationNames.add(sanitizedOptionName);
            }
          });
        });
      }
      const relationTypes = new Set<string>();
      relationTypes.add("Self");
      let hasDisallowedRelation = false;
      const normalizedGender = (employeeGender ?? "").toLowerCase();
      const isMale = normalizedGender === GENDER_VALUES.MALE;
      const isFemale = normalizedGender === GENDER_VALUES.FEMALE;
      const matchedRelationGroup =
        relationGroupSelection && Array.isArray(relationGroupDetails)
          ? relationGroupDetails.find((group: any) =>
              this.matchesRelationGroupSelection(relationGroupSelection, group),
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
        constraints?.maleEmployeesCoverParents,
      );
      const allowMaleInLaws = parseConstraintFlag(
        constraints?.maleEmployeesCoverInLaws,
      );
      const allowFemaleParents = parseConstraintFlag(
        constraints?.femaleEmployeesCoverParents,
      );
      const allowFemaleInLaws = parseConstraintFlag(
        constraints?.femaleEmployeesCoverInLaws,
      );
      const crossParentsAllowed = parseConstraintFlag(
        constraints?.crossParentsAllowed,
      );
      const sameGenderParentsAllowed = parseConstraintFlag(
        constraints?.sameGenderParentsAllowed,
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
          PARENT_RELATIONSHIP_TYPES.IN_LAW,
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

        const mapped =
          optionToType[relationName] ??
          optionToType[normalizedRelation] ??
          dependent.relationshipType ??
          dependent.relation;
        if (mapped) {
          relationTypes.add(mapped);
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
            .filter((relation) => relation.length > 0),
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
        hasDisallowedRelation,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeeRelationTypes",
          payload: { dependents, relationships },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to get employee relation types",
      );
    }
  }

  async getRelationsConstraintsAndDependents(
    policyId: number,
    employeeId: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "getRelationsConstraintsAndDependents",
          payload: { policyId, employeeId },
          messageData: "method invoked",
        }),
      });
      const config =
        await this.companyEmployeeRepository.getConfigRelationsAndContains(
          policyId,
        );
      if (!config) {
        throw new BadRequestException("Policy configuration not found");
      }
      let dependents: PolicyEnrollmentDependent[] = [];
      let employeeChosenChoices: PolicyEmployeeEnrollmentChoice[] = [];
      let isEnrolled = false;

      try {
        const summary =
          await this.companyEmployeeRepository.getEnrollmentSummary(
            policyId,
            employeeId,
          );
        dependents = summary.dependents;
        employeeChosenChoices = summary.enrolledChoices;
        isEnrolled =
          summary.employeeEnrollmentStatusKey ===
          EMPLOYEE_ENROLLMENT_STATUS_ENROLLED;
      } catch (err) {
        if (!(err instanceof NotFoundException)) {
          throw err;
        }
      }

      if (!dependents.length) {
        dependents =
          await this.companyEmployeeRepository.getDependentsByEmployeeId(
            employeeId,
            policyId,
          );
      }

      // Merge in the employee's other dependents (added under a different or
      // now-expired policy, or with no policy at all) so they still appear as
      // unchecked/eligible options here. Skip any whose name+relation+gender
      // already exists in the policy-specific list to avoid duplicates.
      const otherDependents =
        await this.companyEmployeeRepository.getAllDependentsByEmployeeId(
          employeeId,
        );
      if (otherDependents.length) {
        const normalizeKey = (d: { name?: string; relation?: string; gender?: string }) =>
          `${String(d.name ?? "").trim().toLowerCase()}|${String(d.relation ?? "").trim().toLowerCase()}|${String(d.gender ?? "").trim().toLowerCase()}`;
        const existingKeys = new Set(dependents.map(normalizeKey));
        const newDeps = otherDependents.filter(
          (d) => !existingKeys.has(normalizeKey(d)),
        );
        dependents = [...dependents, ...newDeps];
      }

      const dependentsWithChoiceFields =
        await this.buildDependentsWithChoiceFields(dependents);

      //Employee details fetch
      const employeeDetails =
        await this.companyEmployeeRepository.getEmployeeDetailsByEmployeeId(
          employeeId,
        );
      const employeePolicyConfigurations =
        await this.companyEmployeeRepository.getPolicyConfigurationByPolicyId(
          policyId,
        );
      if (!employeeDetails || !employeePolicyConfigurations) {
        throw new BadRequestException(
          errorMessages.failedToFetchEmployeePolicyComponents,
        );
      }
      // const availableEmployeePolicyChoicesBasedonConfig =
      //   !config.isRelationshipGroup
      //     ? await this.getEmployeeDetailsWithPolicyComponents(
      //         employeeDetails,
      //         employeePolicyConfigurations.policyConfiguration,
      //         policyId,
      //         []
      //       )
      //     : null;

      // Only dependents actually linked to a saved enrollment choice
      // (non-empty `choices`, from buildDependentsWithChoiceFields above)
      // should count toward the relation-group bucket match — otherwise
      // every dependent ever recorded for the employee (including ones
      // never chosen for this policy) inflates the matched bucket (e.g.
      // "Self+5" instead of "Self+3"), producing the wrong contribution.
      const enrolledDependentsOnly = dependentsWithChoiceFields.filter(
        (dep: any) => Array.isArray(dep?.choices) && dep.choices.length > 0,
      );
      const transformedDependents: UpsertEnrollmentDependentDto[] =
        this.transformDependentsData(
          dependents.filter((dep) =>
            enrolledDependentsOnly.some((d: any) => Number(d.id) === dep.id),
          ),
        );

      const data = employeePolicyConfigurations?.policyConfiguration as any;
      const isRelationshipGroup = Array.isArray(data?.parameters)
        ? data.parameters.some(
            (p: any) => p.type === POLICY_RELATIONSHIP_TYPE_PARAMETER,
          )
        : false;

      const availableEmployeePolicyChoicesBasedonConfig =
        await this.getEmployeeDetailsWithPolicyComponents(
          employeeDetails,
          employeePolicyConfigurations.policyConfiguration,
          policyId,
          transformedDependents,
          isRelationshipGroup,
          // config.isRelationshipGroup
        );
      const policyTemplate =
        (employeePolicyConfigurations.policyConfiguration as any)
          ?.policyTemplate ?? null;

      // Per-employee-per-policy effective date, from policy_enrollment_employee_policy_map —
      // the same employee can have a different effective date on a different policy, so this
      // must be scoped to (employeeId, policyId), not read from a generic employee-level field.
      const employeePolicyMapRow = await this.employeePolicyMapRepo.findOne({
        where: { employeeId, policyId },
      });
      const employeeEffectiveDate = formatDateOnly(
        employeePolicyMapRow?.effectiveDate ?? null,
      );

      return {
        ...config,
        dependents: dependentsWithChoiceFields,
        employeeChosenChoices,
        isEnrolled,
        employeeEffectiveDate,
        policyComponentsConfiguration:
          availableEmployeePolicyChoicesBasedonConfig
            ? availableEmployeePolicyChoicesBasedonConfig.policyComponentsConfiguration
            : null,
        policyTemplate,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "IBP CompanyEmployeeService",
            method: "getRelationsConstraintsAndDependents",
            payload: { policyId, employeeId },
            messageData: error,
          }),
        });
        throw error;
      }
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getRelationsConstraintsAndDependents",
          payload: { policyId, employeeId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.failedToFetchRelationsAndDependents,
      );
    }
  }

  //New Get function for getting all the relationship constraints
  async getAllRelationsConstraintsAndDependents(employeeId: number, configId?: number | null) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "getAllRelationsConstraintsAndDependents",
          payload: { employeeId, configId },
          messageData: "method invoked",
        }),
      });
      let relationshipConstraintsData: any[] = [];
      let getMappedPoliciesForEmployee =
        await this.companyEmployeeRepository.getPoliciesByEmployee(employeeId);

      // Same domain/config scoping as getEmployeePolicies — restrict to the
      // policies this config is actually allowed to see, same as the
      // employees/:employeeId/policies endpoint already does. A config row
      // with policyId === null means "all policies" (no restriction).
      if (configId) {
        const scopeRows = await this.portalConfigScopeRepo.find({ where: { configId } });
        const hasAllPolicies = scopeRows.some((r) => r.policyId === null);
        if (!hasAllPolicies && scopeRows.length > 0) {
          const allowedPolicyIds = new Set(scopeRows.map((r) => r.policyId).filter((id): id is number => id !== null));
          getMappedPoliciesForEmployee = getMappedPoliciesForEmployee.filter((p) => allowedPolicyIds.has(p.id));
        }
      }
      console.log("getMappedPoliciesForEmployee", getMappedPoliciesForEmployee);
      for (
        let index = 0;
        index < getMappedPoliciesForEmployee.length;
        index++
      ) {
        const config =
          await this.companyEmployeeRepository.getConfigRelationsAndContains(
            getMappedPoliciesForEmployee[index].id,
          );
        if (!config) {
          throw new BadRequestException("Policy configuration not found");
        }
        let dependents: PolicyEnrollmentDependent[] = [];
        let employeeChosenChoices: PolicyEmployeeEnrollmentChoice[] = [];
        let isEnrolled = false;
        const enrolledDependentIds = new Set<number>();

        try {
          const summary =
            await this.companyEmployeeRepository.getEnrollmentSummary(
              getMappedPoliciesForEmployee[index].id,
              employeeId,
            );
          dependents = summary.dependents;
          employeeChosenChoices = summary.enrolledChoices;
          isEnrolled =
            summary.employeeEnrollmentStatusKey ===
            EMPLOYEE_ENROLLMENT_STATUS_ENROLLED;
          summary.dependents.forEach((d: any) => {
            if (d?.id != null) enrolledDependentIds.add(Number(d.id));
          });
        } catch (err) {
          if (!(err instanceof NotFoundException)) {
            throw err;
          }
        }

        if (!dependents.length) {
          dependents =
            await this.companyEmployeeRepository.getDependentsByEmployeeId(
              employeeId,
              getMappedPoliciesForEmployee[index].id,
            );
        }

        // Merge in the employee's other dependents (added under a different or
        // now-expired policy, or with no policy at all) so they still appear as
        // unchecked/eligible options here. Skip any whose name+relation+gender
        // already exists in the policy-specific list to avoid duplicates.
        const otherDependents =
          await this.companyEmployeeRepository.getAllDependentsByEmployeeId(
            employeeId,
          );
        if (otherDependents.length) {
          const normalizeKey = (d: { name?: string; relation?: string; gender?: string }) =>
            `${String(d.name ?? "").trim().toLowerCase()}|${String(d.relation ?? "").trim().toLowerCase()}|${String(d.gender ?? "").trim().toLowerCase()}`;
          const existingKeys = new Set(dependents.map(normalizeKey));
          const newDeps = otherDependents.filter(
            (d) => !existingKeys.has(normalizeKey(d)),
          );
          dependents = [...dependents, ...newDeps];
        }

        const dependentsWithChoiceFields =
          await this.buildDependentsWithChoiceFields(dependents);

        const taggedDependents = dependentsWithChoiceFields.map((dep: any) => ({
          ...dep,
          isEnrolledForPolicy: enrolledDependentIds.has(Number(dep?.id)),
        }));

        //Employee details fetch
        const employeeDetails =
          await this.companyEmployeeRepository.getEmployeeDetailsByEmployeeId(
            employeeId,
          );
        const employeePolicyConfigurations =
          await this.companyEmployeeRepository.getPolicyConfigurationByPolicyId(
            getMappedPoliciesForEmployee[index].id,
          );
        if (!employeeDetails || !employeePolicyConfigurations) {
          throw new BadRequestException(
            errorMessages.failedToFetchEmployeePolicyComponents,
          );
        }
        // Only dependents actually linked to a saved enrollment choice
        // (non-empty `choices`, from buildDependentsWithChoiceFields above)
        // should count toward the relation-group bucket match — otherwise
        // every dependent ever recorded for the employee (including ones
        // never chosen for this policy) inflates the matched bucket (e.g.
        // "Self+5" instead of "Self+3"), producing the wrong contribution.
        const enrolledDependentsOnly = dependentsWithChoiceFields.filter(
          (dep: any) => Array.isArray(dep?.choices) && dep.choices.length > 0,
        );
        const transformedDependents: UpsertEnrollmentDependentDto[] =
          this.transformDependentsData(
            dependents.filter((dep) =>
              enrolledDependentsOnly.some((d: any) => Number(d.id) === dep.id),
            ),
          );

        const data = employeePolicyConfigurations?.policyConfiguration as any;
        const isRelationshipGroup = Array.isArray(data?.parameters)
          ? data.parameters.some(
              (p: any) => p.type === POLICY_RELATIONSHIP_TYPE_PARAMETER,
            )
          : false;

        const availableEmployeePolicyChoicesBasedonConfig =
          await this.getEmployeeDetailsWithPolicyComponents(
            employeeDetails,
            employeePolicyConfigurations.policyConfiguration,
            getMappedPoliciesForEmployee[index].id,
            transformedDependents,
            isRelationshipGroup,
          );
        const policyTemplate =
          (employeePolicyConfigurations.policyConfiguration as any)
            ?.policyTemplate ?? null;

        // Per-employee-per-policy effective date, from policy_enrollment_employee_policy_map —
        // the same employee can have a different effective date on a different policy, so this
        // must be scoped to (employeeId, policyId), not read from a generic employee-level field.
        const employeePolicyMapRow = await this.employeePolicyMapRepo.findOne({
          where: { employeeId, policyId: getMappedPoliciesForEmployee[index].id },
        });
        const employeeEffectiveDate = formatDateOnly(
          employeePolicyMapRow?.effectiveDate ?? null,
        );

        relationshipConstraintsData.push({
          policyId: getMappedPoliciesForEmployee[index].id,
          policyName: getMappedPoliciesForEmployee[index].policyName,
          policyTypeKey:
            getMappedPoliciesForEmployee[index].policyType?.lookUpKey ?? null,
          configuration: {
            ...config,
            dependents: taggedDependents,
            employeeChosenChoices,
            isEnrolled,
            employeeEffectiveDate,
            policyComponentsConfiguration:
              availableEmployeePolicyChoicesBasedonConfig
                ? availableEmployeePolicyChoicesBasedonConfig.policyComponentsConfiguration
                : null,
            policyTemplate,
          },
        });
      }
      return relationshipConstraintsData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "IBP CompanyEmployeeService",
            method: "getAllRelationsConstraintsAndDependents",
            payload: { employeeId },
            messageData: error,
          }),
        });
        throw error;
      }
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getAllRelationsConstraintsAndDependents",
          payload: { employeeId },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.failedToFetchRelationsAndDependents,
      );
    }
  }

  private calculateAge(dateOfBirth: Date) {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

  private calculateAgeAtEffectiveDate(dateOfBirth: Date, effectiveDate: Date): number {
    const today = new Date(effectiveDate);
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return Math.floor(age);
  }

  private normalizeValue(val: string): string {
    return val.toLowerCase().replace(/[^a-z0-9]/gi, "");
  }

  private async validateDependentAges(
    policyId: number,
    dtos: UpsertEnrollmentDependentDto[],
    employeeId?: number,
  ) {
    return this.enrollmentProcessing.validateDependentAges(
      policyId,
      dtos,
      employeeId
    );
    // const config =
    //   await this.companyEmployeeRepository.getConfigRelationsAndContains(
    //     policyId
    //   );
    // if (!config) {
    //   throw new BadRequestException("Policy configuration not found");
    // }
    // const constraints = (config.constraints as Record<string, any>) ?? {};
    // const optionMap = new Map<
    //   string,
    //   { min?: number; max?: number; type: string }
    // >();
    // const typeMap = new Map<string, { maxCount?: number; type: string }>();
    // const rels = config.relationships?.enabledPolicyRelations || [];
    // for (const rel of rels) {
    //   const typeKey = this.normalizeValue(rel.type);
    //   typeMap.set(typeKey, {
    //     maxCount: rel.maxCount ? Number(rel.maxCount) : undefined,
    //     type: rel.type,
    //   });
    //   for (const opt of rel.configuredOptions || []) {
    //     if (opt.enabled) {
    //       optionMap.set(this.normalizeValue(opt.name), {
    //         min: opt.minAge ? Number(opt.minAge) : undefined,
    //         max: opt.maxAge ? Number(opt.maxAge) : undefined,
    //         type: rel.type,
    //       });
    //     }
    //   }
    // }

    // let employeeAge: number | undefined = 0;
    // if (employeeId) {
    //   const employeeDetails =
    //     await this.companyEmployeeRepository.getEmployeeDetailsByEmployeeId(
    //       employeeId
    //     );
    //   const employeeDob = employeeDetails?.dateOfBirth
    //     ? new Date(employeeDetails.dateOfBirth)
    //     : undefined;
    //   if (employeeDob && !Number.isNaN(employeeDob.getTime())) {
    //     employeeAge = this.calculateAge(employeeDob);
    //   }
    // }

    // const counts = new Map<string, number>();
    // for (const dto of dtos) {
    //   const optCfg = optionMap.get(this.normalizeValue(dto.relation));
    //   if (!optCfg) continue;
    //   dto.relationshipType = dto.relationshipType || optCfg.type;

    //   if (dto.dateOfBirth) {
    //     const effectiveDate = dto.effectiveDate ? new Date(dto.effectiveDate) : new Date();
    //     const age = this.calculateAgeAtEffectiveDate(new Date(dto.dateOfBirth), effectiveDate);

    //     const sanitizedRelation = this.normalizeValue(dto.relation);
    //     const sanitizedType = this.normalizeValue(optCfg.type);
    //     const isInLawRelation = sanitizedRelation.includes(
    //       PARENT_RELATIONSHIP_TYPES.IN_LAW
    //     );
    //     if (optCfg.min !== undefined && age < optCfg.min) {
    //       throw new BadRequestException(
    //         `Age for relation ${dto.relation} must be at least ${optCfg.min}`
    //       );
    //     }

    //     let effectiveMaxAge =
    //       typeof optCfg.max === DATA_TYPES.NUMBER && !Number.isNaN(optCfg.max)
    //         ? optCfg.max ?? 0
    //         : 0;
    //     if (typeof effectiveMaxAge === DATA_TYPES.NUMBER) {
    //       const studyingSonExtension = Number(
    //         constraints?.studyingSonAgeExtension ?? 0
    //       );
    //       if (
    //         studyingSonExtension > 0 &&
    //         sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.SON) &&
    //         !isInLawRelation
    //       ) {
    //         effectiveMaxAge += studyingSonExtension;
    //       }

    //       const unmarriedDaughterExtension = Number(
    //         constraints?.unmarriedDaughterAgeExtension ??
    //           constraints?.unmarriedDaughterAgLimitExtension ??
    //           0
    //       );
    //       if (
    //         unmarriedDaughterExtension > 0 &&
    //         sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.DAUGHTER) &&
    //         !isInLawRelation
    //       ) {
    //         effectiveMaxAge += unmarriedDaughterExtension;
    //       }
    //     }

    //     if (
    //       typeof effectiveMaxAge === "number" &&
    //       !Number.isNaN(effectiveMaxAge) &&
    //       age > effectiveMaxAge
    //     ) {
    //       throw new BadRequestException(
    //         `Age for relation ${dto.relation} must not exceed ${effectiveMaxAge}`
    //       );
    //     }
    //     if (typeof employeeAge === DATA_TYPES.NUMBER) {
    //       const isParentRelation =
    //         sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.PARENT) ||
    //         sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.FATHER) ||
    //         sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.MOTHER) ||
    //         sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.PARENTS);

    //       if (isParentRelation) {
    //         const parentGapThreshold = Number(
    //           constraints?.ageGapBetweenParentAndEmployee ?? 0
    //         );
    //         if (parentGapThreshold > 0) {
    //           const actualGap = age - employeeAge;
    //           if (actualGap < parentGapThreshold) {
    //             throw new BadRequestException(
    //               `Age gap between employee and ${dto.relation} should be at least ${parentGapThreshold} years.`
    //             );
    //           }
    //         }
    //       }

    //       const isChildRelation =
    //         sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.CHILD) ||
    //         (!isInLawRelation &&
    //           sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.SON)) ||
    //         (!isInLawRelation &&
    //           sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.DAUGHTER)) ||
    //         sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.CHILD);

    //       if (isChildRelation) {
    //         const childGapConstraint =
    //           constraints?.ageGapBetweenChildrenAndEmployee ??
    //           constraints?.ageGapBetweenParentAndEmployee ??
    //           0;
    //         const childGapThreshold = Number(childGapConstraint);
    //         if (childGapThreshold > 0) {
    //           const actualGap = employeeAge - age;
    //           if (actualGap < childGapThreshold) {
    //             throw new BadRequestException(
    //               `Age gap between employee and ${dto.relation} should be at least ${childGapThreshold} years.`
    //             );
    //           }
    //         }
    //       }
    //     }
    //   }

    //   const typeKey = this.normalizeValue(optCfg.type);
    //   const newCount = (counts.get(typeKey) || 0) + 1;
    //   counts.set(typeKey, newCount);
    //   const tCfg = typeMap.get(typeKey);
    //   if (tCfg?.maxCount !== undefined && newCount > tCfg.maxCount) {
    //     throw new BadRequestException(
    //       `Exceeded max count ${tCfg.maxCount} for ${tCfg.type}`
    //     );
    //   }
    // }
  }

  async getEmployeePolicyOverview(
    employeeId: number,
  ): Promise<EmployeePolicyOverviewResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "getEmployeePolicyOverview",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      const { policyMaps, dependents, claims, enrollments } =
        await this.companyEmployeeRepository.getEmployeePolicyOverviewData(
          employeeId,
        );

      const policies = policyMaps.map((map) => {
        const policy = map.policy;
        const policyType = policy?.policyType?.lookUpValue ?? null;
        const policyTypeKey = policy?.policyType?.lookUpKey ?? null;
        const enrollment = enrollments.find((e) => e.policyId === map.policyId);
        const policyClaims = claims.filter((c) => c.policyId === map.policyId);
        const policyDependents = dependents.filter(
          (dependent) => dependent.policyId === map.policyId,
        );

        const sumInsuredFromEnrollment =
          enrollment?.sumInsured !== undefined &&
          enrollment?.sumInsured !== null
            ? Number(enrollment.sumInsured)
            : policy?.sumInsured ?? 0;

        const claimSummaries = policyClaims
          .sort((a, b) => {
            const dateA =
              a.claimDate ?? a.claimDateOfAdmission ?? a.createdAt ?? null;
            const dateB =
              b.claimDate ?? b.claimDateOfAdmission ?? b.createdAt ?? null;
            if (!dateA || !dateB) return 0;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          })
          .map((claim) => this.buildClaimSummary(claim, map.employee));

        const components = enrollment?.components ?? [];
        const { baseSumInsured, parentalSumInsured } =
          this.calculatePolicyComponentSumInsured(components);
        const totalComponentSum = baseSumInsured + parentalSumInsured;
        const totalSumInsured =
          totalComponentSum > 0
            ? totalComponentSum
            : this.safeNumber(sumInsuredFromEnrollment);

        const hasParentalCoverage = parentalSumInsured > 0;
        const basePolicyClaims = hasParentalCoverage
          ? claimSummaries
              .filter((entry) => !entry.isParent)
              .map((entry) => entry.summary)
          : claimSummaries.map((entry) => entry.summary);
        const parentalPolicyClaims = hasParentalCoverage
          ? claimSummaries
              .filter((entry) => entry.isParent)
              .map((entry) => entry.summary)
          : [];

        const baseClaimed = this.sumClaimAmounts(basePolicyClaims);
        const parentalClaimed = this.sumClaimAmounts(parentalPolicyClaims);
        const baseSettled = this.sumSettledAmounts(basePolicyClaims);
        const parentalSettled = this.sumSettledAmounts(parentalPolicyClaims);

        const baseCoverageSum =
          baseSumInsured > 0 ? baseSumInsured : totalSumInsured;
        const parentalCoverageSum = parentalSumInsured;

        const baseFamilyMembers = [
          {
            name: map.employee?.employeeName ?? "Self",
            relation: "Self",
          },
          ...policyDependents
            .filter(
              (dependent) => !this.isParentRelation(dependent.relationshipType),
            )
            .map((dependent) => ({
              name: dependent.name,
              relation: dependent.relation,
            })),
        ];

        const parentalFamilyMembers = policyDependents
          .filter((dependent) =>
            this.isParentRelation(dependent.relationshipType),
          )
          .map((dependent) => ({
            name: dependent.name,
            relation: dependent.relation,
          }));

        const baseSection: PolicySectionDto = {
          coverage: {
            sumInsured: this.safeNumber(baseCoverageSum),
            claimed: this.safeNumber(baseClaimed),
            settled: this.safeNumber(baseSettled),
            available: Math.max(baseCoverageSum - baseSettled, 0),
          },
          claimsStatusCounts: this.deriveClaimStatusCounts(basePolicyClaims),
          claims: basePolicyClaims,
          familyMembersCovered: baseFamilyMembers,
        };

        const parentalSection = hasParentalCoverage
          ? {
              coverage: {
                sumInsured: this.safeNumber(parentalCoverageSum),
                claimed: this.safeNumber(parentalClaimed),
                settled: this.safeNumber(parentalSettled),
                available: Math.max(parentalCoverageSum - parentalSettled, 0),
              },
              claimsStatusCounts:
                this.deriveClaimStatusCounts(parentalPolicyClaims),
              claims: parentalPolicyClaims,
              familyMembersCovered: parentalFamilyMembers,
            }
          : undefined;

        return {
          policyId: policy?.id ?? map.policyId,
          policyType,
          policyTypeKey,
          policyName: policy?.policyName ?? "",
          policyNumber: policy?.insurerPolicyNumber ?? null,
          policyFrom: this.formatDateString(policy?.policyFrom) ?? null,
          policyExpiry: this.formatDateString(policy?.policyTo) ?? null,
          policyStartDate: policy?.policyFrom ? String(policy.policyFrom).split("T")[0] : null,
          policyEndDate: policy?.policyTo ? String(policy.policyTo).split("T")[0] : null,
          sumInsured: this.safeNumber(totalSumInsured),
          basePolicy: baseSection,
          parentalPolicy: parentalSection,
          isParentalPolicy: hasParentalCoverage,
          lifeEventCta:
            policyType?.toUpperCase() === "GMC"
              ? {
                  show: true,
                  title:
                    "Had a recent life event? Update your insurance coverage now.",
                  description:
                    "You can update your dependents under the Group Mediclaim Policy...",
                  ctaPath: "/in-progress",
                }
              : { show: false },
          addOns: policyType?.toUpperCase() === "GMC" ? {} : undefined,
        };
      });

      const policyTabs = Array.from(
        new Set(
          policies
            .map((policy) => policy.policyType)
            .filter((type): type is string => Boolean(type)),
        ),
      ).map((policyType) => ({
        policyType,
        label: this.getPolicyTabLabel(policyType),
      }));

      // Compute lastSyncedAt:
      // 1. Try MAX(fetched_at) from tpa_claim_data for this employee's policy numbers
      // 2. Fallback: MAX(created_at) from policy_claim for this employee
      let lastSyncedAt: Date | null = null;
      try {
        const policyNumbers = policyMaps
          .map((m) => m.policy?.insurerPolicyNumber)
          .filter(Boolean) as string[];

        if (policyNumbers.length > 0) {
          const tpaRow = await this.dataSource.query(
            `SELECT MAX(fetched_at) AS max_fetched
             FROM tpa_claim_data
             WHERE policy_number = ANY($1)`,
            [policyNumbers],
          );
          lastSyncedAt = tpaRow?.[0]?.max_fetched ?? null;
        }

        if (!lastSyncedAt) {
          const claimRow = await this.dataSource.query(
            `SELECT MAX(created_at) AS max_created
             FROM policy_claim
             WHERE employee_id = $1`,
            [employeeId],
          );
          lastSyncedAt = claimRow?.[0]?.max_created ?? null;
        }
      } catch {
        // Non-fatal — lastSyncedAt stays null
      }

      return new EmployeePolicyOverviewResponseDto({
        policies,
        policyTabs,
        lastSyncedAt,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeePolicyOverview",
          payload: { employeeId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        errorMessages.employeeClaimFetchFailed,
      );
    }
  }

  async updateUserPassword(params: { userId: number; currentPassword: string; newPassword: string }): Promise<void> {
    const { userId, currentPassword, newPassword } = params;

    // After HR auth detach, HR users' JWT carries hr_user_management.id as userId.
    // Check hr_user_management first; fall back to policy_enrollment_employee for company employees.
    const hrUser = await this.companyEmployeeRepository.findHrUserById(userId);

    if (hrUser) {
      // HR user path — password lives in hr_user_management.password
      if (!hrUser.password) {
        throw new NotFoundException(errorMessages.userNotFound);
      }
      const isMatch = await isPasswordMatch(currentPassword, hrUser.password);
      if (!isMatch) {
        throw new ForbiddenException('Current password is incorrect');
      }
      const isSameAsCurrent = await isPasswordMatch(newPassword, hrUser.password);
      if (isSameAsCurrent) {
        throw new BadRequestException('New password cannot be same as current password');
      }
      const hashedPassword = await hashPassword(newPassword);
      await this.companyEmployeeRepository.updateHrUserPassword(userId, hashedPassword);
      return;
    }

    // Company employee path — password lives in policy_enrollment_employee.ibp_password
    const user = await this.companyEmployeeRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(errorMessages.userNotFound);
    }

    const existingPassword = user.ibpPassword ?? user.password ?? null;
    if (!existingPassword) {
      throw new NotFoundException(errorMessages.userNotFound);
    }

    const isMatch = await isPasswordMatch(currentPassword, existingPassword);
    if (!isMatch) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const isSameAsCurrent = await isPasswordMatch(newPassword, existingPassword);
    if (isSameAsCurrent) {
      throw new BadRequestException('New password cannot be same as current password');
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.companyEmployeeRepository.updateUserPassword(userId, hashedPassword);
  }

  private async validateComponentChoices(
    policyId: number,
    dtos: EnrollmentChoiceDto[],
    employeeId: number,
    dependents: UpsertEnrollmentDependentDto[] = [],
  ) {
    return this.enrollmentProcessing.validateComponentChoices(
      policyId,
      dtos,
      employeeId,
      dependents
    );
  }

  private transformPolicyChoices(
    validChoices: any[],
    employeeDetails: GetEmployeeDetails,
  ) {
    let updatedChoices = validChoices.map((item: any) => {
      if (item?.sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE) {
        let sumInsuredValue = this.resolveApplicableSumInsuredValue(
          item,
          item.sumInsured *
            ((employeeDetails as any)[item.sumInsuredModelProperty] ||
              (employeeDetails.additionalDetails as any)[
                item.sumInsuredModelProperty
              ] ||
              1),
        );
        return {
          ...item,
          updatedSumInsured: item.sumInsured,
          updatedCompanyContribution: item.companyContribution,
          updatedEmployeeContribution: item.employeeContribution,
        };
      } else {
        return {
          ...item,
          updatedSumInsured: item.sumInsured,
          updatedCompanyContribution: item.companyContribution,
          updatedEmployeeContribution: item.employeeContribution,
        };
      }
    });
    return updatedChoices;
  }

  private resolveApplicableSumInsuredValue = (
    choice: any,
    sumInsured?: number,
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

  private parseNumericValue = (value: unknown): number | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(
      typeof value === DATA_TYPES.STRING
        ? (value as string).replace(/,/g, "")
        : value,
    );
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  async updateEmployeeEnrollmentStatus(
    policyId: number,
    employeeId: number,
    status: string,
  ) {
    return this.companyEmployeeRepository.updateEmployeeEnrollmentStatus(
      policyId,
      employeeId,
      status,
    );
  }

  async processEnrollmentData(
    payload: UpsertEnrollmentDataDto,
    userId: number,
    isUpdate = false,
    options?: { skipValidations?: boolean; dependentOnly?: boolean },
    endorsementId?: number,
  ) {
    return this.enrollmentProcessing.processEnrollmentData(
      payload,
      userId,
      isUpdate,
      options,
      endorsementId
    );
  }

  private buildEnrollmentChoiceKey(input: {
    policyComponentActionTypeId?: number | string | null;
    policyComponentActionType?: string | null;
    parentpolicyComponentActionTypeId?: number | string | null;
    policyComponentActionLabel?: string | null;
  }): string {
    const normalizeNumber = (value?: number | string | null): number | null => {
      if (value === null || value === undefined) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const typeId = normalizeNumber(input.policyComponentActionTypeId);
    const type =
      typeof input.policyComponentActionType === "string" &&
      input.policyComponentActionType.trim().length > 0
        ? input.policyComponentActionType.trim()
        : null;
    const parentId = normalizeNumber(input.parentpolicyComponentActionTypeId);
    const label =
      typeof input.policyComponentActionLabel === "string" &&
      input.policyComponentActionLabel.trim().length > 0
        ? input.policyComponentActionLabel.trim()
        : null;

    return `${typeId ?? "null"}|${type ?? "null"}|${parentId ?? "null"}|${label ?? "null"}`;
  }

  private selectDefaultChoice(choiceBlock?: {
    choices?: Array<{
      isDefault?: boolean;
      isAvailable?: boolean;
      sumInsuredId?: number;
      companyContribution?: number;
      employeeContribution?: number;
    }>;
  }): {
    sumInsuredId: number;
    companyContribution: number;
    employeeContribution: number;
  } | null {
    const list = choiceBlock?.choices ?? [];
    const eligible = list.filter((c) => Boolean(c?.isAvailable));
    if (!eligible.length) return null;
    const selected = eligible.find((c) => Boolean(c?.isDefault)) ?? eligible[0];
    const sumInsuredId = Number(selected.sumInsuredId);
    if (!Number.isFinite(sumInsuredId)) return null;
    return {
      sumInsuredId,
      companyContribution: Number(selected.companyContribution ?? 0),
      employeeContribution: Number(selected.employeeContribution ?? 0),
    };
  }

  private buildDefaultEnrollmentChoice(params: {
    component: any;
    parentComponentId?: number | null;
    choiceBlock: {
      choices?: Array<{
        isDefault?: boolean;
        isAvailable?: boolean;
        sumInsuredId?: number;
        companyContribution?: number;
        employeeContribution?: number;
      }>;
      policyId?: number;
    };
    coveredDependentIds?: number[];
  }): EnrollmentChoiceDto | null {
    const resolved = this.selectDefaultChoice(params.choiceBlock);
    if (!resolved) return null;

    const component = params.component ?? {};
    const sumInsuredOption = (component.sumInsuredOptions ?? []).find(
      (opt: any) => Number(opt?.id) === resolved.sumInsuredId,
    );
    const sumInsured = Number(sumInsuredOption?.value ?? 0);

    const companyPay = Number(resolved.companyContribution ?? 0);
    const employeePay = Number(resolved.employeeContribution ?? 0);
    const premium = companyPay + employeePay;

    const componentId = Number(component.id);
    if (!Number.isFinite(componentId)) {
      return null;
    }

    const sumInsuredModelProperty =
      component.sumInsuredModelProperty ??
      component.siMultipleLabel ??
      undefined;

    return {
      sumInsured,
      premium,
      companyPay,
      employeePay,
      policyComponentActionType: String(component.type ?? ""),
      policyComponentActionTypeId: componentId,
      parentpolicyComponentActionTypeId:
        typeof params.parentComponentId === "number"
          ? params.parentComponentId
          : undefined,
      policyComponentActionLabel:
        typeof component.label === "string" ? component.label : undefined,
      premiumPerLife: Boolean(component.premiumPerLife),
      sumInsuredPerLife: Boolean(component.sumInsuredPerLife),
      sumInsuredModel:
        typeof component.sumInsuredModel === "string"
          ? component.sumInsuredModel
          : undefined,
      sumInsuredModelProperty:
        typeof sumInsuredModelProperty === "string"
          ? sumInsuredModelProperty
          : undefined,
      coveredDependentIds: params.coveredDependentIds,
    };
  }

  private resolveApplicablePolicyOption(params: {
    employeeDetails: any;
    policyConfig: any;
    dependents: UpsertEnrollmentDependentDto[];
  }): any {
    const option = this.enrollmentProcessing.filterPolicyOptions(
      params.employeeDetails,
      params.policyConfig,
      params.dependents,
    );
    if (option && typeof option === "object" && option.optionId) {
      return option;
    }

    // Fallback: if no match, pick first option (most configs only have one, or
    // the first is treated as the default in UI).
    const first = Array.isArray(params.policyConfig?.policyOptions)
      ? params.policyConfig.policyOptions[0]
      : undefined;
    return first && typeof first === "object" ? first : {};
  }

  async autoSubmitEnrollmentsAfterCutoff(triggerDate: string): Promise<{
    triggerDate: string;
    processed: number;
    submitted: number;
    skippedAlreadyEnrolled: number;
    failed: number;
  }> {
    const normalizedTriggerDate = (triggerDate ?? "").trim().slice(0, 10);
    if (!normalizedTriggerDate) {
      throw new BadRequestException("triggerDate is required");
    }

    // System user context for cron-driven submissions.
    const SYSTEM_USER_ID = 1;

    const batchSize = 200;
    let lastId = 0;
    const now = new Date();

    let processed = 0;
    let submitted = 0;
    let skippedAlreadyEnrolled = 0;
    let failed = 0;
    const autoSubmittedByEmployee = new Map<number, Set<number>>();

    while (true) {
      const rows = await this.employeePolicyMapRepo
        .createQueryBuilder("map")
        .innerJoin(Policy, "policy", "policy.id = map.policyId")
        .leftJoin(
          PolicyEmployeeEnrollment,
          "enrollment",
          "enrollment.policyId = map.policyId AND enrollment.employeeId = map.employeeId",
        )
        .select("map.id", "id")
        .addSelect("map.employeeId", "employeeId")
        .addSelect("map.policyId", "policyId")
        .addSelect("policy.companyId", "companyId")
        .addSelect("policy.policyTo", "policyTo")
        .where("map.deletedAt IS NULL")
        // Pick windows that have already ended (on or before triggerDate).
        .andWhere("map.enrollmentEndDate <= :triggerDate", {
          triggerDate: normalizedTriggerDate,
        })
        // Avoid attempting enrollment on already-expired policies (processEnrollmentData would reject these anyway).
        .andWhere("policy.policyTo >= :now", { now })
        .andWhere(
          "(enrollment.id IS NULL OR enrollment.employeeEnrollmentStatusKey <> :enrolledStatus)",
          { enrolledStatus: EMPLOYEE_ENROLLMENT_STATUS_ENROLLED },
        )
        .andWhere("map.id > :lastId", { lastId })
        .orderBy("map.id", "ASC")
        .take(batchSize)
        .getRawMany<{
          id: number;
          employeeId: number;
          policyId: number;
          companyId: number;
          policyTo: Date | string;
        }>();
      if (!rows.length) {
        break;
      }

      for (const row of rows) {
        lastId = Math.max(lastId, Number(row.id) || 0);
        processed += 1;

        const employeeId = Number(row.employeeId);
        const policyId = Number(row.policyId);
        const companyId = Number(row.companyId);
        if (!employeeId || !policyId || !companyId) {
          failed += 1;
          continue;
        }

        try {
          const enrollment = await this.employeeEnrollmentRepo.findOne({
            where: { policyId, employeeId },
          });
          if (
            enrollment?.employeeEnrollmentStatusKey ===
            EMPLOYEE_ENROLLMENT_STATUS_ENROLLED
          ) {
            skippedAlreadyEnrolled += 1;
            continue;
          }

          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "IBP CompanyEmployeeService",
              method: "autoSubmitEnrollmentsAfterCutoff",
              payload: {
                mappingId: Number(row.id),
                policyId,
                employeeId,
                companyId,
                triggerDate: normalizedTriggerDate,
                policyTo: row.policyTo,
                existingEnrollmentStatus:
                  enrollment?.employeeEnrollmentStatusKey ?? null,
              },
              messageData: "Auto-submit candidate selected",
            }),
          });

          await this.autoSubmitSingleEnrollmentAfterCutoff({
            policyId,
            employeeId,
            companyId,
            userId: SYSTEM_USER_ID,
          });
          await this.employeeEnrollmentRepo.update(
            { employeeId, policyId },
            { isAutoSubmitted: true },
          );
          submitted += 1;
          const set = autoSubmittedByEmployee.get(employeeId) ?? new Set<number>();
          set.add(policyId);
          autoSubmittedByEmployee.set(employeeId, set);
        } catch (error) {
          failed += 1;
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "IBP CompanyEmployeeService",
              method: "autoSubmitEnrollmentsAfterCutoff",
              payload: { policyId, employeeId, companyId, triggerDate: normalizedTriggerDate },
              messageData: error instanceof Error ? error.message : error,
            }),
          });
        }
      }
    }

    // Send confirmation mails (single email per employee with all policyIds),
    // using the same template with subject variant via isAutoSubmit flag.
    for (const [employeeId, policyIdSet] of autoSubmittedByEmployee.entries()) {
      const policyIds = Array.from(policyIdSet.values());
      if (!policyIds.length) continue;
      try {
        await this.onboardingService.sendEnrollmentConfirmationNotification({
          employeeId,
          policyIds,
          isAutoSubmit: true,
        });
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "IBP CompanyEmployeeService",
            method: "autoSubmitEnrollmentsAfterCutoff",
            payload: { employeeId, policyIds, triggerDate: normalizedTriggerDate },
            messageData:
              error instanceof Error ? error.message : String(error),
          }),
        });
      }
    }

    return {
      triggerDate: normalizedTriggerDate,
      processed,
      submitted,
      skippedAlreadyEnrolled,
      failed,
    };
  }

  private async autoSubmitSingleEnrollmentAfterCutoff(params: {
    policyId: number;
    employeeId: number;
    companyId: number;
    userId: number;
  }): Promise<void> {
    const { policyId, employeeId, companyId, userId } = params;

    const configRecord =
      await this.companyEmployeeRepository.getPolicyConfigurationByPolicyId(
        policyId,
      );
    const policyConfig = (configRecord?.policyConfiguration as any) ?? {};

    const employeeDetails =
      await this.companyEmployeeRepository.getEmployeeDetailsByEmployeeId(
        employeeId,
      );
    if (!employeeDetails) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    const formatDateOnly = (
      value?: Date | string | null,
    ): string | undefined => {
      if (!value) return undefined;
      // DOB is a calendar date stored at server-local midnight. Use local Y-M-D,
      // not toISOString() (UTC), which drops to the previous day on ahead-of-UTC
      // servers like IST (e.g. 2007-06-15T18:30:00Z -> should read as 2007-06-16).
      const toLocalYmd = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate(),
        ).padStart(2, "0")}`;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        // If already in YYYY-MM-DD form, keep it as-is.
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return trimmed;
        }
        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? undefined : toLocalYmd(parsed);
      }
      return Number.isNaN(value.getTime()) ? undefined : toLocalYmd(value);
    };

    const dependentEntities = await this.dependentRepo.find({
      where: { policyId, employeeId, deletedAt: IsNull() },
    });
    const dependents: UpsertEnrollmentDependentDto[] = dependentEntities.map(
      (dep) => ({
        id: dep.id,
        name: dep.name,
        relation: dep.relation,
        relationshipType: dep.relationshipType ?? undefined,
        dateOfBirth: formatDateOnly(dep.dateOfBirth),
        gender: dep.gender ?? undefined,
        effectiveDate: formatDateOnly(dep.effectiveDate),
        enrollmentAdditionBatchId: dep.enrollmentAdditionBatchId ?? undefined,
        claimStatus: dep.claimStatus ?? undefined,
      }),
    );

    const existingChoices =
      await this.companyEmployeeRepository.getEnrollmentComponents(
        policyId,
        employeeId,
      );

    const choiceIds = existingChoices
      .map((c) => Number(c.id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const dependentLinks = choiceIds.length
      ? await this.employeeChoiceDependentRepo.find({
          where: { employeeEnrollmentChoiceId: In(choiceIds) },
        })
      : [];
    const coveredByChoiceId = new Map<number, number[]>();
    for (const link of dependentLinks) {
      const list = coveredByChoiceId.get(link.employeeEnrollmentChoiceId) ?? [];
      list.push(Number(link.dependentId));
      coveredByChoiceId.set(link.employeeEnrollmentChoiceId, list);
    }

    const existingDtos: EnrollmentChoiceDto[] = existingChoices.map((choice) => ({
      id: choice.id,
      sumInsured: Number(choice.sumInsured ?? 0),
      premium: Number(choice.premium ?? 0),
      companyPay: Number(choice.companyPay ?? 0),
      employeePay: Number(choice.employeePay ?? 0),
      policyComponentActionType: String(choice.policyComponentActionType ?? ""),
      policyComponentActionTypeId: choice.policyComponentActionTypeId ?? undefined,
      parentpolicyComponentActionTypeId:
        choice.parentpolicyComponentActionTypeId ?? undefined,
      policyComponentActionLabel: choice.policyComponentActionLabel ?? undefined,
      premiumPerLife: choice.premiumPerLife ?? undefined,
      proRationEnabled: choice.proRationEnabled ?? undefined,
      sumInsuredModel: choice.sumInsuredModel ?? undefined,
      sumInsuredModelProperty: choice.sumInsuredModelProperty ?? undefined,
      minSumInsuredValue: choice.minSumInsuredValue ?? undefined,
      maxSumInsuredValue: choice.maxSumInsuredValue ?? undefined,
      coveredDependentIds: coveredByChoiceId.get(choice.id) ?? undefined,
    }));

    const applicableOption = this.resolveApplicablePolicyOption({
      employeeDetails,
      policyConfig,
      dependents,
    });

    const components = Array.isArray(policyConfig?.components)
      ? policyConfig.components
      : [];
    const componentById = new Map<number, any>();
    for (const comp of components) {
      const id = Number(comp?.id);
      if (Number.isFinite(id)) {
        componentById.set(id, comp);
      }
    }

    const baseMainId =
      Number(applicableOption?.basePolicyChoices?.mainPolicyChoices?.policyId) ||
      Number(components.find((c: any) => c?.type === "base")?.id) ||
      0;
    const parentalMainId =
      Number(
        applicableOption?.parentalPolicyChoices?.mainPolicyChoices?.policyId,
      ) ||
      // component.type is populated inconsistently across environments (seen
      // both "parental" and "optional" stored for the same parental main
      // component), so a components.find(type==="parental") fallback here is
      // unreliable -- read the parental main id straight from the template,
      // which is the authoritative source policyTemplate.parentalPolicy is
      // itself built from.
      Number(policyConfig?.policyTemplate?.parentalPolicy?.mainPolicyId) ||
      0;

    const existingKeys = new Set<string>();
    for (const dto of existingDtos) {
      existingKeys.add(this.buildEnrollmentChoiceKey(dto));
    }

    const hasParentalSelection = existingDtos.some(
      (dto) =>
        Number(dto.policyComponentActionTypeId) === parentalMainId ||
        Number(dto.parentpolicyComponentActionTypeId) === parentalMainId,
    );

    const outputDtos: EnrollmentChoiceDto[] = [...existingDtos];

    // Ensure base main is always present (otherwise submit would result in 0 totals).
    if (baseMainId && componentById.has(baseMainId)) {
      const baseKey = this.buildEnrollmentChoiceKey({
        policyComponentActionTypeId: baseMainId,
        policyComponentActionType: "base",
        parentpolicyComponentActionTypeId: null,
        policyComponentActionLabel: componentById.get(baseMainId)?.label ?? null,
      });
      if (!existingKeys.has(baseKey)) {
        const baseDefault = this.buildDefaultEnrollmentChoice({
          component: componentById.get(baseMainId),
          parentComponentId: null,
          choiceBlock: applicableOption?.basePolicyChoices?.mainPolicyChoices ?? {},
          coveredDependentIds: undefined,
        });
        if (baseDefault) {
          outputDtos.push(baseDefault);
          existingKeys.add(this.buildEnrollmentChoiceKey(baseDefault));
        }
      }
    }

    // If the employee had started selecting parental (or its add-ons), ensure parental main exists.
    if (hasParentalSelection && parentalMainId && componentById.has(parentalMainId)) {
      const parentalKey = this.buildEnrollmentChoiceKey({
        policyComponentActionTypeId: parentalMainId,
        policyComponentActionType: "parental",
        parentpolicyComponentActionTypeId: null,
        policyComponentActionLabel:
          componentById.get(parentalMainId)?.label ?? null,
      });
      if (!existingKeys.has(parentalKey)) {
        const parentalDefault = this.buildDefaultEnrollmentChoice({
          component: componentById.get(parentalMainId),
          parentComponentId: null,
          choiceBlock:
            applicableOption?.parentalPolicyChoices?.mainPolicyChoices ?? {},
          coveredDependentIds: undefined,
        });
        if (parentalDefault) {
          outputDtos.push(parentalDefault);
          existingKeys.add(this.buildEnrollmentChoiceKey(parentalDefault));
        }
      }
    }

    // Fill missing/zeroed choice values for any existing choice (common when user saved dependents but didn't select plan).
    for (let i = 0; i < outputDtos.length; i += 1) {
      const dto = outputDtos[i];
      // FR-054: Any optional component may legitimately have SI=0 (not only benefit
      // components). Treat such choices as fully filled when premium >= 0 so the
      // auto-submit loop doesn't overwrite them.
      const compDefForFill = componentById.get(Number(dto.policyComponentActionTypeId));
      const isOptionalCompForFill = compDefForFill?.type === "optional";
      if (
        Number.isFinite(Number(dto.sumInsured)) &&
        (Number(dto.sumInsured) > 0 || isOptionalCompForFill) &&
        Number.isFinite(Number(dto.premium)) &&
        Number(dto.premium) >= 0
      ) {
        continue;
      }

      const componentId = Number(dto.policyComponentActionTypeId);
      if (!componentId || !componentById.has(componentId)) {
        continue;
      }

      const parentId = Number(dto.parentpolicyComponentActionTypeId) || null;
      const component = componentById.get(componentId);

      const isBaseMain = componentId === baseMainId && component?.type === "base";
      // component.type for the parental main component is populated
      // inconsistently across environments ("parental" in some, "optional"
      // in others), so don't gate on it -- componentId === parentalMainId
      // alone is sufficient and unambiguous, since baseMainId/parentalMainId
      // are always distinct ids.
      const isParentalMain = componentId === parentalMainId;

      let choiceBlock: any | undefined;
      if (isBaseMain) {
        choiceBlock = applicableOption?.basePolicyChoices?.mainPolicyChoices;
      } else if (isParentalMain) {
        choiceBlock =
          applicableOption?.parentalPolicyChoices?.mainPolicyChoices;
      } else if (component?.type === "optional" && parentId) {
        if (parentId === baseMainId) {
          choiceBlock = (applicableOption?.basePolicyChoices?.addonChoices ?? []).find(
            (b: any) => Number(b?.policyId) === componentId,
          );
        } else if (parentId === parentalMainId) {
          choiceBlock = (applicableOption?.parentalPolicyChoices?.addonChoices ?? []).find(
            (b: any) => Number(b?.policyId) === componentId,
          );
        }
      }

      if (!choiceBlock) {
        continue;
      }

      const patched = this.buildDefaultEnrollmentChoice({
        component,
        parentComponentId: parentId,
        choiceBlock,
        coveredDependentIds: dto.coveredDependentIds,
      });
      if (!patched) {
        continue;
      }
      // Preserve record id so the existing row is updated rather than deleted+recreated.
      patched.id = dto.id;
      outputDtos[i] = { ...dto, ...patched };
    }

    // Submit using the same path as frontend final submit.
    await this.processEnrollmentData(
      {
        employeeId,
        policyId,
        companyId,
        action: EnrollmentAction.SUBMIT,
        dependents,
        choices: outputDtos,
      },
      userId,
      false,
      {
        // Cron should be resilient: if config changed mid-window, we still want to finalize enrollment.
        skipValidations: true,
      },
    );
  }

  async resetEnrollment(
    userId: number,
    options: {
      clearChoices: boolean;
      clearDependents: boolean;
      resetPassword: boolean;
      clearClaims: boolean;
      clearActivityLogs: boolean;
      clearMails: boolean;
      clearTickets: boolean;
    },
  ): Promise<void> {
    console.log("[resetEnrollment] START userId=%s options=", userId, JSON.stringify(options));

    // userid header = employee primary key (id), NOT the userId column
    const employeeId = userId;
    console.log(`[resetEnrollment] employeeId=${employeeId}`);
    console.log(`[resetEnrollment] employeeId=${employeeId}`);

    await this.dataSource.transaction(async (manager) => {
      const enrollments = await manager.find(PolicyEmployeeEnrollment, { where: { employeeId } });
      console.log(`[resetEnrollment] enrollments found=${enrollments.length} ids=${enrollments.map(e => e.id)}`);

      if (options.clearChoices && enrollments.length > 0) {
        const enrollmentIds = enrollments.map((e) => e.id);
        // Delete choices and dependent links first (FK dependency on enrollment)
        const choices = await manager.find(PolicyEmployeeEnrollmentChoice, {
          where: { employeeEnrollmentId: In(enrollmentIds) },
        });
        console.log(`[resetEnrollment] choices found=${choices.length}`);
        if (choices.length > 0) {
          const choiceIds = choices.map((c) => c.id);
          const depDel = await manager.delete(PolicyEmployeeEnrollmentChoiceDependent, { employeeEnrollmentChoiceId: In(choiceIds) });
          console.log(`[resetEnrollment] choice-dependents deleted=${JSON.stringify(depDel.affected)}`);
          const choiceDel = await manager.delete(PolicyEmployeeEnrollmentChoice, { id: In(choiceIds) });
          console.log(`[resetEnrollment] choices deleted=${JSON.stringify(choiceDel.affected)}`);
        }
        // Delete policy_employee_enrollment records entirely (not just reset status)
        const enrollDel = await manager.delete(PolicyEmployeeEnrollment, { id: In(enrollmentIds) });
        console.log(`[resetEnrollment] enrollment records deleted=${JSON.stringify(enrollDel.affected)}`);
      } else if (!options.clearChoices) {
        console.log(`[resetEnrollment] clearChoices=false, skipping`);
      } else {
        console.log(`[resetEnrollment] no enrollments found for employeeId=${employeeId}`);
      }

      // Clear enrollmentProgress JSON column on the employee record
      if (options.clearChoices) {
        await manager.update(
          PolicyEnrollmentEmployee,
          { id: employeeId },
          { enrollmentProgress: { sessions: [], activeEnrollmentBatchKey: null } } as any,
        );
        console.log(`[resetEnrollment] enrollmentProgress cleared for employeeId=${employeeId}`);
      }

      if (options.clearDependents) {
        const depDel = await manager.delete(PolicyEnrollmentDependent, { employeeId });
        console.log(`[resetEnrollment] dependents deleted=${JSON.stringify(depDel.affected)}`);
      }

      if (options.clearClaims) {
        const claimDel = await manager.delete(PolicyClaim, { employeeId });
        console.log(`[resetEnrollment] claims deleted=${JSON.stringify(claimDel.affected)}`);
      }

      if (options.clearTickets) {
        const ticketDel = await manager.delete(RaiseTicket, { employeeId });
        console.log(`[resetEnrollment] tickets deleted=${JSON.stringify(ticketDel.affected)}`);
      }
    });

    if (options.clearActivityLogs) {
      const result = await this.dataSource.query(
        `DELETE FROM user_activity_log WHERE user_id = $1 AND (reference_type IS NULL OR reference_type != 'NOTIFICATION_INFO')`,
        [userId],
      );
      console.log(`[resetEnrollment] activity logs deleted=`, result);
    }

    if (options.clearMails) {
      const result = await this.dataSource.query(
        `DELETE FROM user_activity_log WHERE user_id = $1 AND reference_type = 'NOTIFICATION_INFO'`,
        [userId],
      );
      console.log(`[resetEnrollment] mail logs deleted=`, result);
    }

    if (options.resetPassword) {
      // employeeId = employee's primary key (id column)
      const pwResult = await this.companyEmployeeRepo.update(
        { id: employeeId },
        { ibpPassword: null, isPasswordSet: false } as any,
      );
      console.log(`[resetEnrollment] password reset affected=${JSON.stringify(pwResult.affected)} for employeeId=${employeeId}`);
    }

    console.log(`[resetEnrollment] DONE userId=${userId}`);
  }

  async upsertProfileDependents(
    payload: UpsertProfileDependentsDto,
    userId: number,
  ) {
    if (payload.policyId) {
      const enrollmentPayload: UpsertEnrollmentDataDto = {
        employeeId: payload.employeeId,
        policyId: payload.policyId,
        companyId: payload.companyId,
        action: EnrollmentAction.SAVE,
        dependents: payload.dependents ?? [],
        choices: [],
        isDependentOnly: true,
      };
      return this.processEnrollmentData(
        enrollmentPayload,
        userId,
        Boolean(payload.isUpdate),
        { dependentOnly: true },
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const dependents = await this.companyEmployeeRepository.updateDependents(
        manager,
        null,
        payload.employeeId,
        payload.dependents ?? [],
        userId,
        { skipDeletion: true },
      );
      return { dependents };
    });
  }

  // New service logic for getting the enrollment data processing
  async processCombinedEnrollmentData(
    payload: UpsertCombinedEnrollmentDataDto,
    userId: number,
    isUpdate = false,
    options?: { skipValidations?: boolean; dependentOnly?: boolean },
    endorsementId?: number,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "processCombinedEnrollmentData",
        payload: { ...payload, userId, isUpdate },
        messageData: "method invoked",
      }),
    });
    const {
      employeeId,
      companyId,
      action,
      dependents = [],
      combinedChoices = [],
      isLifeEvent = false,
      deletedDependentIds = [],
      disclaimersAccepted = [],
    } = payload;
    const lifeEventMode = Boolean(isLifeEvent);
    const submit =
      action.toLowerCase() == EnrollmentAction.SUBMIT.toLowerCase();

    // In Life Event mode, deletions must be explicit so we can persist proof documents.
    // Normal enrollment keeps the current behavior (missing dependent in payload => soft delete).
    const incomingDependents = Array.isArray(dependents) ? dependents : [];
    const lifeEventDeleteDtos = lifeEventMode
      ? incomingDependents.filter(
          (d) => d.lifeEventAction === LifeEventDependentAction.DELETE,
        )
      : [];
    const upsertDependents = lifeEventMode
      ? incomingDependents.filter(
          (d) => d.lifeEventAction !== LifeEventDependentAction.DELETE,
        )
      : incomingDependents;

    const lifeEventDeleteDtosByPolicyId = new Map<
      number,
      UpsertEnrollmentDependentDto[]
    >();
    if (lifeEventMode && lifeEventDeleteDtos.length) {
      const deleteIds = Array.from(
        new Set(
          lifeEventDeleteDtos
            .map((d) => Number(d.id))
            .filter((id) => Number.isFinite(id) && id > 0),
        ),
      );
      if (deleteIds.length !== lifeEventDeleteDtos.length) {
        throw new BadRequestException(
          "Life event delete dependents must include a valid id",
        );
      }

      const existingToDelete = await this.dependentRepo.find({
        where: { employeeId, id: In(deleteIds), deletedAt: IsNull() },
        select: ["id", "policyId", "employeeId"],
      });
      const policyIdByDependentId = new Map<number, number>();
      existingToDelete.forEach((dep) => {
        policyIdByDependentId.set(Number(dep.id), Number(dep.policyId));
      });

      for (const dto of lifeEventDeleteDtos) {
        const depId = Number(dto.id);
        const policyId = policyIdByDependentId.get(depId);
        if (!policyId) {
          throw new NotFoundException(
            `Dependent ${depId} not found for employee ${employeeId}`,
          );
        }
        const existing = lifeEventDeleteDtosByPolicyId.get(policyId) ?? [];
        existing.push(dto);
        lifeEventDeleteDtosByPolicyId.set(policyId, existing);
      }
    }
    const normalizeNumber = (
      value?: number | string | null,
    ): number | null => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          return null;
        }
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };
    const buildChoiceKey = (input: {
      policyComponentActionTypeId?: number | string | null;
      policyComponentActionType?: string | null;
      parentpolicyComponentActionTypeId?: number | string | null;
      policyComponentActionLabel?: string | null;
    }) => {
      const typeId = normalizeNumber(input.policyComponentActionTypeId);
      const type =
        typeof input.policyComponentActionType === "string" &&
        input.policyComponentActionType.trim().length > 0
          ? input.policyComponentActionType.trim()
          : null;
      const parentId = normalizeNumber(input.parentpolicyComponentActionTypeId);
      const label =
        typeof input.policyComponentActionLabel === "string" &&
        input.policyComponentActionLabel.trim().length > 0
          ? input.policyComponentActionLabel.trim()
          : null;

      const key = `${typeId ?? "null"}|${type ?? "null"}|${parentId ?? "null"}|${label ?? "null"}`;
      const hasMapping =
        typeId !== null || type !== null || parentId !== null || label !== null;

      return { key, hasMapping };
    };
    const buildDependentSignature = (input: {
      name?: string | null;
      relation?: string | null;
      relationshipType?: string | null;
      gender?: string | null;
      effectiveDate?: string | Date | null;
    }) => {
      const normalizeString = (value?: string | null) =>
        typeof value === "string" && value.trim().length > 0
          ? value.trim()
          : null;

      const normalizeDate = (value?: string | Date | null) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      return [
        normalizeString(input.name),
        normalizeString(input.relation),
        normalizeString(input.relationshipType),
        normalizeString(input.gender),
        normalizeDate(input.effectiveDate),
      ].join("|");
    };

    const buildDependentIdentityKey = (input: {
      name?: string | null;
      relation?: string | null;
      relationshipType?: string | null;
      gender?: string | null;
    }) => {
      const normalizeString = (value?: string | null) =>
        typeof value === "string" ? value.trim().toLowerCase() : "";
      return [
        normalizeString(input.name),
        normalizeString(input.relation),
        normalizeString(input.relationshipType),
        normalizeString(input.gender),
      ].join("|");
    };

    const dedupeDependentsForValidation = (
      input: UpsertEnrollmentDependentDto[],
    ) => {
      const seenIds = new Set<number>();
      const seenIdentityKeys = new Set<string>();
      const deduped: UpsertEnrollmentDependentDto[] = [];

      for (const dependent of input) {
        const identityKey = buildDependentIdentityKey(dependent);
        const depId = normalizeNumber(dependent.id as number);
        if (depId !== null) {
          if (seenIds.has(depId)) {
            continue;
          }
          seenIds.add(depId);
          seenIdentityKeys.add(identityKey);
          deduped.push(dependent);
          continue;
        }

        if (seenIdentityKeys.has(identityKey)) {
          continue;
        }
        seenIdentityKeys.add(identityKey);
        deduped.push(dependent);
      }

      return deduped;
    };

    const getMappedChoicesFromDependent = (
      dependent: UpsertEnrollmentDependentDto,
    ): Array<{
      policyComponentActionTypeId?: number | string | null;
      policyComponentActionType?: string | null;
      parentpolicyComponentActionTypeId?: number | string | null;
      policyComponentActionLabel?: string | null;
    }> => {
      const mappedChoices: Array<{
        policyComponentActionTypeId?: number | string | null;
        policyComponentActionType?: string | null;
        parentpolicyComponentActionTypeId?: number | string | null;
        policyComponentActionLabel?: string | null;
      }> = [];
      const seenKeys = new Set<string>();

      // New contract: when choices[] is provided, treat it as source of truth.
      if (Array.isArray(dependent?.choices) && dependent.choices.length > 0) {
        for (const choice of dependent.choices) {
          const normalizedChoice = {
            policyComponentActionTypeId: choice?.policyComponentActionTypeId,
            policyComponentActionType: choice?.policyComponentActionType ?? null,
            parentpolicyComponentActionTypeId:
              choice?.parentpolicyComponentActionTypeId ?? null,
            policyComponentActionLabel:
              choice?.policyComponentActionLabel ?? null,
          };
          const { key, hasMapping } = buildChoiceKey(normalizedChoice);
          if (!hasMapping || seenKeys.has(key)) {
            continue;
          }
          seenKeys.add(key);
          mappedChoices.push(normalizedChoice);
        }
        return mappedChoices;
      }

      // Backward compatibility for older clients that only send top-level mapping.
      const topLevelChoice = {
        policyComponentActionTypeId: dependent?.policyComponentActionTypeId,
        policyComponentActionType: dependent?.policyComponentActionType ?? null,
        parentpolicyComponentActionTypeId:
          dependent?.parentpolicyComponentActionTypeId ?? null,
        policyComponentActionLabel: dependent?.policyComponentActionLabel ?? null,
      };
      const { key, hasMapping } = buildChoiceKey(topLevelChoice);
      if (hasMapping && !seenKeys.has(key)) {
        seenKeys.add(key);
        mappedChoices.push(topLevelChoice);
      }

      return mappedChoices;
    };

    const buildPolicyScopedDependentPayload = (
      inputDependents: UpsertEnrollmentDependentDto[],
      policyChoiceKeys: Set<string>,
    ): {
      policyScopedDependents: UpsertEnrollmentDependentDto[];
      dependentChoiceDtos: UpsertEnrollmentDependentDto[];
    } => {
      const policyScopedDependents: UpsertEnrollmentDependentDto[] = [];
      const dependentChoiceDtos: UpsertEnrollmentDependentDto[] = [];

      for (const dependent of inputDependents) {
        const mappedChoices = getMappedChoicesFromDependent(dependent).filter(
          (choice) => policyChoiceKeys.has(buildChoiceKey(choice).key),
        );

        if (!mappedChoices.length) {
          continue;
        }

        policyScopedDependents.push({ ...dependent });

        for (const choice of mappedChoices) {
          dependentChoiceDtos.push({
            ...dependent,
            policyComponentActionTypeId: normalizeNumber(
              choice.policyComponentActionTypeId,
            ),
            policyComponentActionType: choice.policyComponentActionType ?? null,
            parentpolicyComponentActionTypeId: normalizeNumber(
              choice.parentpolicyComponentActionTypeId,
            ),
            policyComponentActionLabel: choice.policyComponentActionLabel ?? null,
          });
        }
      }

      return {
        policyScopedDependents: dedupeDependentsForValidation(
          policyScopedDependents,
        ),
        dependentChoiceDtos,
      };
    };

    const processingResult = [];
    try {
      const employeeMappedPolicies =
        await this.companyEmployeeRepository.getPoliciesByEmployee(employeeId);

      for (let index = 0; index < employeeMappedPolicies.length; index++) {
        const policyId = employeeMappedPolicies[index].id;
        // Absent => skip, as before. Present with choices:[] => user unselected
        // everything, so let it through to clear that policy's stored choices.
        const policyPayload = combinedChoices.find(
          (choice) => choice.policyId === policyId,
        );

        if (!policyPayload) {
          continue;
        }

        let choices: EnrollmentChoiceDto[] = policyPayload.choices || [];
        const config =
          await this.companyEmployeeRepository.getConfigRelationsAndContains(
            policyId,
          );
        if (!config) {
          return {
            message: "Policy configuration not found",
            policyId: policyId,
            policyName: employeeMappedPolicies[index].policyName,
          };
        }

        const lockEnrollmentAfterCutoff = Boolean(
          (config.constraints as { lockEnrollmentAfterCutoff?: boolean })
            ?.lockEnrollmentAfterCutoff,
        );

        const policyChoiceKeys = new Set<string>(
          choices.map((choice) => buildChoiceKey(choice).key),
        );
        const { policyScopedDependents, dependentChoiceDtos } =
          buildPolicyScopedDependentPayload(upsertDependents, policyChoiceKeys);

        // Deps in payload that have no choices for this policy (unchecked) but carry
        // a valid id should be preserved, not deleted. Collecting their ids here so
        // updateDependents can skip the soft-delete for them.
        const preserveIds = new Set<number>(
          upsertDependents
            .filter((d) => {
              if (!d.id) return false;
              const depChoices = getMappedChoicesFromDependent(d).filter(
                (c) => policyChoiceKeys.has(buildChoiceKey(c).key),
              );
              return depChoices.length === 0;
            })
            .map((d) => Number(d.id))
            .filter((id) => Number.isFinite(id) && id > 0),
        );

        if (submit && !options?.skipValidations) {
          if (dependentChoiceDtos.length !== policyScopedDependents.length) {
            this.logger.log({
              level: "warn",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "warning",
                location: "IBP CompanyEmployeeService",
                method: "processCombinedEnrollmentData",
                payload: {
                  policyId,
                  employeeId,
                  originalDependentCount: policyScopedDependents.length,
                  expandedChoiceMappingCount: dependentChoiceDtos.length,
                },
                messageData:
                  "Dependents expanded to choice-level mappings for component validation",
              }),
            });
          }
          await this.validateDependentAges(
            policyId,
            policyScopedDependents,
            employeeId,
          );
          await this.validateComponentChoices(
            policyId,
            choices,
            employeeId,
            dependentChoiceDtos.length
              ? dependentChoiceDtos
              : policyScopedDependents,
          );
        }

        // Pre-capture: if employee has no lastPaidNetPremium stored yet (first post-deploy edit)
        // but already has a pee row for an endorsement, calculate and store their current
        // prorated contribution BEFORE the transaction overwrites their choices.
        // This ensures the incremental delta after the transaction uses the correct old value.
        const existingEnrollmentForCapture = await this.employeeEnrollmentRepo.findOne({
          where: { policyId, employeeId },
          select: ["id", "lastPaidNetPremium", "lastPaidGrossPremium"] as any,
        });
        if (Number(existingEnrollmentForCapture?.lastPaidNetPremium ?? 0) === 0) {
          const existingPee = await this.policyEmployeeEndorsementRepo.findOne({
            where: { policyId, employeeId, employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY },
            select: ["endorsementId"] as any,
          });
          if (existingPee?.endorsementId) {
            await updateEndorsementSummaryAfterEnrollment(
              existingPee.endorsementId,
              {
                endorsementRepo: this.endorsementRepository,
                policyRepo: this.policyRepo,
                policyEmployeeEndorsementRepo: this.policyEmployeeEndorsementRepo,
                policyDependentEndorsementRepo: this.policyDependentEndorsementRepo,
                dependentRepo: this.dependentRepo,
                uploadRepo: this.uploadRepo,
                employeePolicyMapRepo: this.employeePolicyMapRepo,
                employeeEnrollmentRepo: this.employeeEnrollmentRepo,
                policyConfigRepo: this.policyConfigRepo,
                lookUpRepository: this.lookUpRepository,
                opportunityRepo: this.opportunityRepo,
              },
              this.logger,
              this.traceIdService.traceId,
              employeeId,
              true, // captureOnly — stores lastPaidNetPremium without touching endorsement
            );
          }
        }

        let policyProcessingResult = await this.dataSource.transaction(
          async (manager: EntityManager) => {
            let savedDependents: PolicyEnrollmentDependent[] = [];
            let savedChoices: PolicyEmployeeEnrollmentChoice[] = [];

            const dependentDtos = policyScopedDependents.map((d) => ({ ...d }));
            const existingDependentIds = new Set(
              policyScopedDependents
                .map((d) => Number(d.id))
                .filter((id) => Number.isFinite(id) && id > 0),
            );
            savedDependents =
              await this.companyEmployeeRepository.updateDependents(
                manager,
                policyId,
                employeeId,
                dependentDtos,
                userId,
                { skipDeletion: lifeEventMode ? true : !isUpdate, isLifeEvent: lifeEventMode, preserveIds },
              );

            if (savedDependents.length) {
              const newDependentIds = savedDependents
                .map((dep) => Number(dep.id))
                .filter(
                  (id) =>
                    Number.isFinite(id) &&
                    !existingDependentIds.has(Number(id)),
                );

              if (newDependentIds.length) {
                const idSet = new Set(newDependentIds);
                await manager.update(
                  PolicyEnrollmentDependent,
                  { id: In(newDependentIds) },
                  {
                    endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                    additionEndorsementId: endorsementId ?? null,
                    updatedBy: userId,
                  },
                );
                for (const dep of savedDependents) {
                  if (idSet.has(Number(dep.id))) {
                    dep.endorsementStatusKey = EMPLOYEE_ENDORSEMENT_READY;
                    dep.additionEndorsementId = endorsementId ?? null;
                    dep.updatedBy = userId;
                  }
                }
              }
            }

            // Runs for empty choices too, so updateEnrollmentChoices can clear
            // stored choices that are no longer in the payload.
            {
              const dtos = choices.map((c) => ({
                ...c,
                employeeId,
                policyId,
                companyId,
              }));
              savedChoices =
                await this.companyEmployeeRepository.updateEnrollmentChoices(
                  manager,
                  dtos,
                  { policyId, employeeId, companyId },
                );
            }

            const choiceDependentRepo = manager.getRepository(
              this.employeeChoiceDependentRepo
                .target as unknown as typeof PolicyEmployeeEnrollmentChoiceDependent,
            );

            if (lifeEventMode) {
              const deletesForPolicy =
                lifeEventDeleteDtosByPolicyId.get(policyId) ?? [];
              if (deletesForPolicy.length) {
                const now = new Date();
                const deleteIds = deletesForPolicy
                  .map((d) => Number(d.id))
                  .filter((id) => Number.isFinite(id) && id > 0);

                // Persist deletion proof docs (documentIds) and soft-delete the dependents.
                // These rows may not be present in the normal "upsertDependents" payload
                // because they are being deleted.
                for (const dto of deletesForPolicy) {
                  const depId = Number(dto.id);
                  await manager.update(
                    PolicyEnrollmentDependent,
                    { id: depId, employeeId, policyId, deletedAt: IsNull() },
                    {
                      documentIds: dto.documentIds ?? null,
                      isLifeEvent: true,
                      deletedAt: now,
                      updatedBy: userId,
                    },
                  );
                }

                // Ensure dependent-choice mappings are not left active for deleted dependents.
                await choiceDependentRepo.update(
                  { dependentId: In(deleteIds), deletedAt: IsNull() },
                  { deletedAt: now },
                );
              }
            }

            const choiceKeyToChoice = new Map<
              string,
              PolicyEmployeeEnrollmentChoice
            >();
            for (const choice of savedChoices) {
              const { key } = buildChoiceKey(choice);
              choiceKeyToChoice.set(key, choice);
            }
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "IBP CompanyEmployeeService",
                method: "processCombinedEnrollmentData",
                payload: {
                  policyId,
                  savedChoiceKeys: Array.from(choiceKeyToChoice.keys()),
                },
                messageData: "Choice mapping keys prepared",
              }),
            });
            const dependentById = new Map<number, PolicyEnrollmentDependent>();
            const dependentBySignature = new Map<
              string,
              PolicyEnrollmentDependent[]
            >();
            const remainingNewDependents: PolicyEnrollmentDependent[] = [];
            const normalizeText = (value?: string | null) =>
              typeof value === "string" ? value.trim().toLowerCase() : "";
            for (const dep of savedDependents) {
              dependentById.set(dep.id, dep);
              const signature = buildDependentSignature(dep);
              const existing = dependentBySignature.get(signature) ?? [];
              if (existing.length) {
                this.logger.log({
                  level: "warn",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "warning",
                    location: "IBP CompanyEmployeeService",
                    method: "processCombinedEnrollmentData",
                    payload: {
                      policyId,
                      signature,
                      existingDependentIds: existing.map((item) => item.id),
                      newDependentId: dep.id,
                    },
                    messageData:
                      "Multiple dependents share same signature; fallback match may be ambiguous",
                  }),
                });
              }
              existing.push(dep);
              dependentBySignature.set(signature, existing);
              if (!existingDependentIds.has(Number(dep.id))) {
                remainingNewDependents.push(dep);
              }
            }
            remainingNewDependents.sort((a, b) => Number(a.id) - Number(b.id));

            const takeBestNewDependent = (
              depDto: UpsertEnrollmentDependentDto,
            ): PolicyEnrollmentDependent | undefined => {
              if (!remainingNewDependents.length) {
                return undefined;
              }

              const dtoName = normalizeText(depDto.name);
              const dtoRelation = normalizeText(depDto.relation);
              const dtoRelationshipType = normalizeText(depDto.relationshipType);
              const dtoGender = normalizeText(depDto.gender);
              const dtoEffective = (() => {
                const value = depDto.effectiveDate;
                if (!value) return "";
                const date = new Date(value);
                if (Number.isNaN(date.getTime())) return "";
                const year = date.getFullYear();
                const month = `${date.getMonth() + 1}`.padStart(2, "0");
                const day = `${date.getDate()}`.padStart(2, "0");
                return `${year}-${month}-${day}`;
              })();

              let bestIndex = -1;
              let bestScore = -1;

              for (let i = 0; i < remainingNewDependents.length; i += 1) {
                const candidate = remainingNewDependents[i];
                let score = 0;

                if (normalizeText(candidate.name) === dtoName && dtoName) score += 4;
                if (normalizeText(candidate.relation) === dtoRelation && dtoRelation)
                  score += 3;
                if (
                  normalizeText(candidate.relationshipType) === dtoRelationshipType &&
                  dtoRelationshipType
                )
                  score += 2;
                if (normalizeText(candidate.gender) === dtoGender && dtoGender)
                  score += 1;

                const candidateEffective = (() => {
                  const value = candidate.effectiveDate;
                  if (!value) return "";
                  const date = new Date(value);
                  if (Number.isNaN(date.getTime())) return "";
                  const year = date.getFullYear();
                  const month = `${date.getMonth() + 1}`.padStart(2, "0");
                  const day = `${date.getDate()}`.padStart(2, "0");
                  return `${year}-${month}-${day}`;
                })();

                if (
                  dtoEffective &&
                  candidateEffective &&
                  dtoEffective === candidateEffective
                )
                  score += 1;

                if (score > bestScore) {
                  bestScore = score;
                  bestIndex = i;
                }
              }

              if (bestIndex === -1 || bestScore <= 0) {
                return undefined;
              }

              const [matched] = remainingNewDependents.splice(bestIndex, 1);
              return matched;
            };
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "IBP CompanyEmployeeService",
                method: "processCombinedEnrollmentData",
                payload: {
                  policyId,
                  savedDependentSignatures: Array.from(
                    dependentBySignature.keys(),
                  ),
                },
                messageData: "Dependent signatures prepared",
              }),
            });

            const newLinks: PolicyEmployeeEnrollmentChoiceDependent[] = [];
            const choiceIdsInScope = savedChoices.map((choice) => choice.id);
            let matchedById = 0;
            let matchedBySignature = 0;
            let matchedByHeuristic = 0;
            let skippedNoMapping = 0;
            let skippedNoChoice = 0;
            let skippedNoDependent = 0;
            const createdLinkKeys = new Set<string>();
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "IBP CompanyEmployeeService",
                method: "processCombinedEnrollmentData",
                payload: {
                  policyId,
                  dependentInputCount: dependentChoiceDtos.length,
                  savedDependentCount: savedDependents.length,
                  savedChoiceCount: savedChoices.length,
                },
                messageData: "Dependent-choice mapping started",
              }),
            });

            for (const depDto of dependentChoiceDtos) {
              const { key, hasMapping } = buildChoiceKey(depDto);
              const depSignature = buildDependentSignature(depDto);
              if (!hasMapping) {
                skippedNoMapping += 1;
                this.logger.log({
                  level: "info",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "IBP CompanyEmployeeService",
                    method: "processCombinedEnrollmentData",
                    payload: {
                      policyId,
                      dependentSignature: depSignature,
                      dependentKey: key,
                      dependent: depDto,
                    },
                    messageData: "Skipping dependent without mapping fields",
                  }),
                });
                continue;
              }
              const matchedChoice = choiceKeyToChoice.get(key);
              if (!matchedChoice) {
                skippedNoChoice += 1;
                this.logger.log({
                  level: "info",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "IBP CompanyEmployeeService",
                    method: "processCombinedEnrollmentData",
                    payload: {
                      policyId,
                      dependentSignature: depSignature,
                      dependentKey: key,
                      savedChoiceKeys: Array.from(choiceKeyToChoice.keys()),
                      dependent: depDto,
                    },
                    messageData: "No matching choice found for dependent",
                  }),
                });
                continue;
              }

              let savedDependent: PolicyEnrollmentDependent | undefined;
              let matchStrategy: "id" | "signature" | "heuristic" | null = null;
              const normalizedDepId = normalizeNumber(depDto.id as number);
              if (normalizedDepId !== null) {
                savedDependent = dependentById.get(normalizedDepId);
                if (savedDependent) {
                  matchStrategy = "id";
                  matchedById += 1;
                }
              }
              if (!savedDependent) {
                const signature = buildDependentSignature(depDto);
                const candidates = dependentBySignature.get(signature) ?? [];
                if (candidates.length) {
                  savedDependent = candidates[0];
                  if (savedDependent) {
                    matchStrategy = "signature";
                    matchedBySignature += 1;
                  }
                }
              }
              if (!savedDependent && normalizedDepId === null) {
                savedDependent = takeBestNewDependent(depDto);
                if (savedDependent) {
                  matchStrategy = "heuristic";
                  matchedByHeuristic += 1;
                }
              }
              if (!savedDependent) {
                skippedNoDependent += 1;
                this.logger.log({
                  level: "info",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "IBP CompanyEmployeeService",
                    method: "processCombinedEnrollmentData",
                    payload: {
                      policyId,
                      dependentSignature: depSignature,
                      dependentKey: key,
                      dependent: depDto,
                    },
                    messageData: "No matching dependent found for mapping",
                  }),
                });
                continue;
              }

              this.logger.log({
                level: "info",
                message: buildLogMessage({
                  traceId: this.traceIdService.traceId,
                  status: "success",
                  location: "IBP CompanyEmployeeService",
                  method: "processCombinedEnrollmentData",
                  payload: {
                    policyId,
                    dependentKey: key,
                    dependentSignature: depSignature,
                    mappedChoiceId: matchedChoice.id,
                    mappedDependentId: savedDependent.id,
                    matchStrategy,
                  },
                  messageData: "Dependent-choice mapping resolved",
                }),
              });

              const linkKey = `${matchedChoice.id}|${savedDependent.id}`;
              if (createdLinkKeys.has(linkKey)) {
                continue;
              }
              createdLinkKeys.add(linkKey);
              newLinks.push(
                manager.create(PolicyEmployeeEnrollmentChoiceDependent, {
                  employeeEnrollmentChoiceId: matchedChoice.id,
                  dependentId: savedDependent.id,
                }),
              );
            }
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "IBP CompanyEmployeeService",
                method: "processCombinedEnrollmentData",
                payload: {
                  policyId,
                  mappedDependentCount: newLinks.length,
                  matchedById,
                  matchedBySignature,
                  matchedByHeuristic,
                  skippedNoMapping,
                  skippedNoChoice,
                  skippedNoDependent,
                },
                messageData: "Dependent-choice links prepared",
              }),
            });

            if (choiceIdsInScope.length) {
              await choiceDependentRepo.update(
                // Soft-delete current active links for these choices; they will be rebuilt below.
                { employeeEnrollmentChoiceId: In(choiceIdsInScope), deletedAt: IsNull() },
                { deletedAt: new Date() },
              );
            }

            if (newLinks.length) {
              await manager
                .createQueryBuilder()
                .insert()
                .into(PolicyEmployeeEnrollmentChoiceDependent)
                .values(
                  newLinks.map((link) => ({
                    employeeEnrollmentChoiceId: link.employeeEnrollmentChoiceId,
                    dependentId: link.dependentId,
                  })),
                )
                // Idempotent upsert:
                // This table uses soft-delete. The intended uniqueness is for *active* rows only:
                // unique(choice_id, dependent_id) WHERE deleted_at IS NULL.
                // Postgres requires the same predicate in the ON CONFLICT target to use that index.
                .onConflict(
                  '("employee_enrollment_choice_id","dependent_id") WHERE deleted_at IS NULL DO UPDATE SET deleted_at = NULL, updated_at = NOW()',
                )
                .execute();
            }

            const choiceById = new Map<number, PolicyEmployeeEnrollmentChoice>();
            for (const choice of savedChoices) {
              choiceById.set(choice.id, choice);
            }

            const dependentIdToChoices = new Map<
              number,
              PolicyEmployeeEnrollmentChoice[]
            >();
            for (const link of newLinks) {
              const choice = choiceById.get(link.employeeEnrollmentChoiceId);
              if (choice) {
                const existing = dependentIdToChoices.get(link.dependentId) ?? [];
                existing.push(choice);
                dependentIdToChoices.set(link.dependentId, existing);
              }
            }

            const dependentsWithChoiceFields = savedDependents.map(
              (dependent) => {
                const choices = dependentIdToChoices.get(dependent.id) ?? [];
                const primaryChoice = choices[0];
                // Use formatDateOnly (server-local Y-M-D). toISOString() returns
                // the UTC date, dropping a day for IST-midnight timestamps.
                const dateOfBirth =
                  formatDateOnly(dependent.dateOfBirth) ?? undefined;
                const effectiveDate =
                  formatDateOnly(dependent.effectiveDate) ?? undefined;

                return {
                  id: dependent.id,
                  name: dependent.name,
                  relation: dependent.relation,
                  relationshipType: dependent.relationshipType,
                  dateOfBirth,
                  effectiveDate,
                  gender: dependent.gender,
                  documentIds: dependent.documentIds ?? [],
                  isLifeEvent: dependent.isLifeEvent ?? false,
                  enrollmentAdditionBatchId:
                    dependent.enrollmentAdditionBatchId ?? undefined,
                  claimStatus: dependent.claimStatus ?? undefined,
                  policyComponentActionTypeId:
                    primaryChoice?.policyComponentActionTypeId ?? null,
                  policyComponentActionType:
                    primaryChoice?.policyComponentActionType ?? null,
                  parentpolicyComponentActionTypeId:
                    primaryChoice?.parentpolicyComponentActionTypeId ?? null,
                  policyComponentActionLabel:
                    primaryChoice?.policyComponentActionLabel ?? null,
                  choices: choices.map((choice) => ({
                    policyComponentActionTypeId:
                      choice.policyComponentActionTypeId ?? null,
                    policyComponentActionType:
                      choice.policyComponentActionType ?? null,
                    parentpolicyComponentActionTypeId:
                      choice.parentpolicyComponentActionTypeId ?? null,
                    policyComponentActionLabel:
                      choice.policyComponentActionLabel ?? null,
                  })),
                };
              },
            );

            let resolvedEndorsementId: number | undefined = undefined;

            if (submit) {
              const enrollment =
                await this.companyEmployeeRepository.findEmployeeEnrollment(
                  policyId,
                  employeeId,
                );
              const enrolledKey = EMPLOYEE_ENROLLMENT_STATUS_ENROLLED;
              if (
                enrollment &&
                enrollment.employeeEnrollmentStatusKey === enrolledKey
              ) {
                const policyMap = await this.employeePolicyMapRepo.findOne({
                  where: { policyId, employeeId },
                });

                if (
                  !this.isEnrollmentEditableWithinCutoff(
                    lockEnrollmentAfterCutoff,
                    policyMap,
                  )
                ) {
                  return {
                    message:
                      "Employee already enrolled to this policy and the enrollment period is closed",
                    policyId: policyId,
                    policyName: employeeMappedPolicies[index].policyName,
                  };
                }
              }
              // Every component was unselected => the employee is no longer enrolled
              // in this policy, so the row must not keep saying ENROLLED. The row
              // itself is KEPT (never soft-deleted): updateEnrollmentChoices and the
              // endorsement util both resolve it via findOne(policyId, employeeId),
              // and hiding it makes those create a duplicate enrollment and wipe the
              // endorsement aggregate. Flipping the status is enough.
              await this.companyEmployeeRepository.updateEnrollmentStatus(
                manager,
                policyId,
                employeeId,
                companyId,
                choices.length
                  ? EMPLOYEE_ENROLLMENT_STATUS_ENROLLED
                  : EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS,
                endorsementId,
              );

              // Store accepted disclaimers for this policy in additionalParams
              if (disclaimersAccepted?.length > 0) {
                const policyDisclaimers = disclaimersAccepted.filter(
                  (d) => Number(d.policyId) === Number(policyId)
                );
                if (policyDisclaimers.length > 0) {
                  const policyMapRecord = await manager.findOne(
                    PolicyEnrollmentEmployeePolicyMap,
                    { where: { policyId, employeeId } }
                  );
                  if (policyMapRecord) {
                    policyMapRecord.additionalParams = {
                      ...(policyMapRecord.additionalParams ?? {}),
                      disclaimersAccepted: policyDisclaimers.map((d) => ({
                        text: d.text,
                        isMandatory: d.isMandatory,
                        acceptedAt: d.acceptedAt,
                      })),
                    };
                    await manager.save(PolicyEnrollmentEmployeePolicyMap, policyMapRecord);
                  }
                }
              }

              resolvedEndorsementId = endorsementId ?? undefined;
              if (!resolvedEndorsementId) {
                const policyMap = await this.employeePolicyMapRepo.findOne({
                  where: { policyId, employeeId },
                  select: ['enrollmentAdditionBatchId']
                });
                const documentId = policyMap?.enrollmentAdditionBatchId;
                if (documentId) {
                  const documentStatus = await this.uploadRepo.findOne({
                    where: { documentId },
                  });
                  resolvedEndorsementId = documentStatus?.endorsementId ?? undefined;
                }
              }
            }

            return {
              message: submit ? "Enrollment submitted" : "Enrollment saved",
              policyId: policyId,
              policyName: employeeMappedPolicies[index].policyName,
              choices: savedChoices,
              dependents: dependentsWithChoiceFields,
              resolvedEndorsementId,
            };
          },
        );

        // Update endorsement summary AFTER the transaction has committed.
        // Pass employeeId so the util runs incremental delta update (atomic +=) for just
        // this employee instead of rescanning all endorsement-ready employees.
        const summaryEndorsementId = policyProcessingResult?.resolvedEndorsementId;
        if (summaryEndorsementId) {
          await updateEndorsementSummaryAfterEnrollment(
            summaryEndorsementId,
            {
              endorsementRepo: this.endorsementRepository,
              policyRepo: this.policyRepo,
              policyEmployeeEndorsementRepo: this.policyEmployeeEndorsementRepo,
              policyDependentEndorsementRepo: this.policyDependentEndorsementRepo,
              dependentRepo: this.dependentRepo,
              uploadRepo: this.uploadRepo,
              employeePolicyMapRepo: this.employeePolicyMapRepo,
              employeeEnrollmentRepo: this.employeeEnrollmentRepo,
              policyConfigRepo: this.policyConfigRepo,
              lookUpRepository: this.lookUpRepository,
              opportunityRepo: this.opportunityRepo,
            },
            this.logger,
            this.traceIdService.traceId,
            employeeId,
          );
        }

        processingResult.push(policyProcessingResult);
      }

      // Deps sent with no choices and no existing id must be persisted as profile-level
      // records (policyId=null) so they survive enrollment saves and reappear as unchecked
      // suggestions the next time the employee opens the enrollment page.
      const noChoiceDeps = upsertDependents.filter((d) => {
        if (d.id) return false;
        return getMappedChoicesFromDependent(d).length === 0;
      });
      if (noChoiceDeps.length) {
        await this.dataSource.transaction(async (manager) => {
          await this.companyEmployeeRepository.updateDependents(
            manager,
            null,
            employeeId,
            noChoiceDeps,
            userId,
            { skipDeletion: true },
          );
        });
      }

      // Business requirement: every explicit "submit" action should generate a new
      // submission counter + reference id (used in UI + confirmation mail),
      // even if the employee was already enrolled and enrollment window is closed.
      const submissionMeta = submit
        ? await this.createEnrollmentSubmissionRecord({
            employeeId,
            companyId,
            policyIds: employeeMappedPolicies
              .map((policy) => Number(policy?.id))
              .filter((id) => Number.isFinite(id)),
            createdBy: userId ?? null,
          })
        : null;

      if (deletedDependentIds.length) {
        const validIds = deletedDependentIds.filter((id) =>
          Number.isFinite(Number(id))
        );
        if (validIds.length) {
          await this.dependentRepo.update(
            { id: In(validIds), employeeId },
            { deletedAt: new Date(), updatedBy: userId },
          );
        }
      }

      return {
        companyId: companyId,
        dependents: processingResult[0]?.dependents || [],
        referenceNumber: submissionMeta?.referenceNumber,
        submissionCount: submissionMeta?.submissionCount,
        processingResult: processingResult.map((result: any) => ({
          policyId: result.policyId,
          policyName: result.policyName,
          message: result.message,
          choices: result.choices,
        })),
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "processCombinedEnrollmentData",
          payload: { ...payload, userId, isUpdate },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async checkInProgressEnrollments(policyId: number): Promise<boolean> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "checkInProgressEnrollments",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });
      const inProgress =
        await this.companyEmployeeRepository.checkInProgressEnrollments(
          policyId,
        );
      if (inProgress) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "IBP CompanyEmployeeService",
            method: "checkInProgressEnrollments",
            payload: { policyId },
            messageData: "in progress enrollments found",
          }),
        });
      }
      return inProgress;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeService",
          method: "checkInProgressEnrollments",
          payload: { policyId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getLatestEnrollmentSubmissionMeta(params: {
    employeeId: number;
    companyId: number;
  }): Promise<{ referenceNumber: string; submissionCount: number } | null> {
    const { employeeId, companyId } = params;
    const row = await this.employeeEnrollmentSubmissionRepo
      .createQueryBuilder("s")
      .select("s.referenceNumber", "referenceNumber")
      .addSelect("s.submissionCount", "submissionCount")
      .where("s.employeeId = :employeeId", { employeeId })
      .andWhere("s.companyId = :companyId", { companyId })
      .orderBy("s.submittedAt", "DESC")
      .addOrderBy("s.id", "DESC")
      .limit(1)
      .getRawOne<{ referenceNumber: string; submissionCount: number }>();

    if (!row?.referenceNumber) {
      return null;
    }

    return {
      referenceNumber: row.referenceNumber,
      submissionCount: Number(row.submissionCount),
    };
  }

  async startEnrollmentProcess(
    endorsementFileId: number,
    policyId: number,
    endorsementId?: number,
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeService",
          method: "startEnrollmentProcess",
          payload: { policyId, endorsementFileId, endorsementId },
          messageData: "method invoked",
        }),
      });
      const policyConfig =
        await this.companyEmployeeRepository.getPolicyConfigurationByPolicyId(
          policyId,
        );
      if (!policyConfig) {
        throw new NotFoundException("Policy configuration not found");
      }
      const fileUpload = await this.companyEmployeeRepository.getFileUploadById(
        endorsementFileId,
      );
      if (!fileUpload) {
        throw new NotFoundException("Template document not found");
      }

      const documentProcessingFile =
        await this.companyEmployeeRepository.getDocumentProcessingFileEntry(
          endorsementFileId,
          policyId,
        );
      if (!documentProcessingFile) {
        throw new NotFoundException("Document processing entry not found");
      }
      // Mark the document processing entry as processing
      await this.companyEmployeeRepository.updateDocumentEntryStatus(
        documentProcessingFile,
        DOCUMENT_PROCESS_STATUS.PROCESSING,
      );

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
      // Calling the common function for the file processing:
      const validatedEmployeeRecords: ValidatedEnrollmentProcessingResult =
        await processEnrollmentFile(buffer, policyConfig, {
          fetchEmployeeByCompanyEmployeeId: (employeeId: string) =>
            this.companyEmployeeRepository.getCompanyEmployeeByEmployeeIdAndCompany(
              employeeId,
              policyConfig.companyId,
            ),
          fetchDependentsByEmployeeId: (
            employeeId: number,
            currentPolicyId?: number,
          ) =>
            this.companyEmployeeRepository.getDependentsByEmployeeId(
              employeeId,
              currentPolicyId,
            ),
        });
      // Further processing of validatedEmployeeRecords
      const processingResult =
        await this.companyEmployeeRepository.startEnrollmentProcess(
          validatedEmployeeRecords,
          policyId,
          {
            companyId: policyConfig.companyId,
            endorsementId,
          },
        );

      const toDateOnlyString = (
        value?: Date | string | null,
      ): string | undefined => {
        if (!value) {
          return undefined;
        }
        if (value instanceof Date) {
          if (Number.isNaN(value.getTime())) {
            return undefined;
          }
          const adjusted = new Date(
            value.getTime() - value.getTimezoneOffset() * 60000,
          );
          return adjusted.toISOString().split("T")[0];
        }
        const trimmed = String(value).trim();
        if (!trimmed) {
          return undefined;
        }
        // Already a plain calendar date — keep as-is. Re-parsing + getTimezoneOffset
        // math below shifts the day on servers whose timezone is behind UTC, which
        // is why re-saving (e.g. deleting a sibling) moved the other DOBs back a day.
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          return trimmed;
        }
        // ISO datetime — take the literal date part without timezone conversion.
        const isoDateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
        if (isoDateMatch) {
          return isoDateMatch[1];
        }
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
          const adjusted = new Date(
            parsed.getTime() - parsed.getTimezoneOffset() * 60000,
          );
          return adjusted.toISOString().split("T")[0];
        }
        return trimmed;
      };

      const validEmployeesToProcess =
        processingResult?.validatedEmployeeRecords?.employees.filter(
          (x: EmployeeWithDependentsData) =>
            (x.intakeType ?? "").toLowerCase() !==
            DATA_INTAKE_TYPE.DELETION.toLowerCase(),
        ) ?? [];

      for (const employeeRecord of validEmployeesToProcess) {
        const companyEmployee = employeeRecord.companyEmployee ?? {};
        const rawEmployeeId = companyEmployee.id as number | string | undefined;
        const employeeIdNumeric =
          typeof rawEmployeeId === "number"
            ? rawEmployeeId
            : rawEmployeeId !== undefined && rawEmployeeId !== null
            ? Number(rawEmployeeId)
            : NaN;
        if (!Number.isFinite(employeeIdNumeric) || employeeIdNumeric <= 0) {
          this.logger.warn({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "CompanyEmployeeService",
              method: "startEnrollmentProcess",
              payload: {
                policyId,
                endorsementFileId,
                endorsementId,
              },
              messageData: "Skipping employee without a valid identifier",
            }),
          });
          continue;
        }

        const rawUserId = companyEmployee.userId;
        const userIdNumeric =
          typeof rawUserId === "number"
            ? rawUserId
            : rawUserId !== undefined && rawUserId !== null
            ? Number(rawUserId)
            : NaN;
        if (!Number.isFinite(userIdNumeric) || userIdNumeric <= 0) {
          this.logger.warn({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "CompanyEmployeeService",
              method: "startEnrollmentProcess",
              payload: {
                policyId,
                endorsementFileId,
                endorsementId,
                employeeId: employeeIdNumeric,
              },
              messageData: "Skipping employee without a valid userId",
            }),
          });
          continue;
        }

        const dependentsDtos = (employeeRecord.dependents ?? [])
          .map((dependent) => {
            if (!dependent) {
              return undefined;
            }
            const name = String(dependent.name ?? "").trim();
            const relation = String(dependent.relation ?? "").trim();
            if (!name || !relation) {
              return undefined;
            }
            let dependentId: number | undefined;
            if (typeof dependent.id === "number") {
              dependentId = dependent.id;
            } else if (dependent.id !== undefined && dependent.id !== null) {
              const parsedId = Number(dependent.id);
              if (!Number.isNaN(parsedId)) {
                dependentId = parsedId;
              }
            }

            const dto: UpsertEnrollmentDependentDto = {
              name,
              relation,
            };

            if (
              dependentId !== undefined &&
              Number.isFinite(dependentId) &&
              dependentId > 0
            ) {
              dto.id = dependentId;
            }

            if (dependent.relationshipType) {
              dto.relationshipType = String(dependent.relationshipType);
            }

            const dob = toDateOnlyString(dependent.dateOfBirth as any);
            if (dob) {
              dto.dateOfBirth = dob;
            }

            const effectiveDate = toDateOnlyString(
              dependent.effectiveDate as any,
            );
            if (effectiveDate) {
              dto.effectiveDate = effectiveDate;
            }

            if (dependent.gender) {
              dto.gender = String(dependent.gender);
            }

            if (
              dependent.enrollmentAdditionBatchId !== undefined &&
              dependent.enrollmentAdditionBatchId !== null
            ) {
              const batchId = Number(dependent.enrollmentAdditionBatchId);
              if (!Number.isNaN(batchId)) {
                dto.enrollmentAdditionBatchId = batchId;
              }
            }

            return dto;
          })
          .filter((dependent): dependent is UpsertEnrollmentDependentDto =>
            Boolean(dependent),
          );

        const configCompanyId = Number(policyConfig.companyId);
        const fallbackCompanyId = Number(
          companyEmployee.employeeCompanyId ?? NaN,
        );
        const resolvedCompanyId = !Number.isNaN(configCompanyId)
          ? configCompanyId
          : fallbackCompanyId;
        if (!Number.isFinite(resolvedCompanyId) || resolvedCompanyId <= 0) {
          this.logger.warn({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "CompanyEmployeeService",
              method: "startEnrollmentProcess",
              payload: {
                policyId,
                endorsementFileId,
                endorsementId,
                employeeId: employeeIdNumeric,
              },
              messageData: "Skipping employee without a valid companyId",
            }),
          });
          continue;
        }
        const isDependentOnlyRecord = Boolean(employeeRecord?.isDependentOnly);
        const choiceDtos = await this.buildEnrollmentChoices(
          employeeRecord,
          policyConfig,
          dependentsDtos,
          {
            policyId,
            employeeId: employeeIdNumeric,
          },
        );

        const dto: UpsertEnrollmentDataDto = {
          employeeId: employeeIdNumeric,
          policyId,
          companyId: resolvedCompanyId,
          action: EnrollmentAction.SUBMIT,
          isDependentOnly: isDependentOnlyRecord,
        };

        if (dependentsDtos.length) {
          dto.dependents = dependentsDtos;
        }

        if (choiceDtos.length) {
          dto.choices = choiceDtos;
        }

        await this.processEnrollmentData(
          dto,
          userIdNumeric,
          true,
          {
            skipValidations: true,
            dependentOnly: isDependentOnlyRecord,
          },
          endorsementId,
        );
      }

      // Creating an excel file with success/failure records and saving the summary in the document processing table
      const { errorFileKey, successFileKey, summary } =
        await createEnrollmentProcessingFiles(processingResult, {
          policyId,
          companyType: fileUpload.entityType,
        });

      await this.companyEmployeeRepository.finalizeEnrollmentProcess({
        documentProcessingFileId: documentProcessingFile.id,
        policyId,
        sourceFile: fileUpload,
        summary,
        successFileKey,
        errorFileKey,
        endorsementId,
      });

      return processingResult;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeService",
          method: "startEnrollmentProcess",
          payload: { policyId, endorsementFileId, endorsementId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async processEnrollmentBatch(
    enrollmentBatchKey: string,
    userId: number,
    endorsementId?: number,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "processEnrollmentBatch",
        payload: { enrollmentBatchKey, userId },
        messageData: "method invoked",
      }),
    });
    const uploadId = Number(enrollmentBatchKey.split(":")[1]);
    const start = Date.now();
    const summary = { total: 0, success: 0, failed: 0 };
    let deleted = 0;
    try {
      if (!this.redis) {
        throw new BadRequestException("Redis client not initialized");
      }
      const backend = "valkey";
      const raw = await this.redis.get(enrollmentBatchKey);
      if (raw) {
        // Safety-net TTL: finally block will DEL on clean exit, but if the
        // process is killed mid-batch this ensures the key expires in 24h.
        await this.redis.expire(enrollmentBatchKey, 86400);
      }
      if (!raw) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "IBP CompanyEmployeeService",
            method: "processEnrollmentBatch",
            payload: { enrollmentBatchKey, backend },
            messageData: "Enrollment payload not found",
          }),
        });
        await this.uploadRepo.update(uploadId, {
          processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
        });
        throw new BadRequestException("Enrollment payload not found");
      }
      const payloads = JSON.parse(raw) as UpsertEnrollmentDataDto[];
      summary.total = payloads.length;
      const results: any[] = [];
      for (const dto of payloads) {
        try {
          const res = await this.processEnrollmentData(
            dto,
            userId,
            true,
            {
              skipValidations: true,
            },
            endorsementId,
          );
          summary.success++;
          results.push(res);
        } catch (err) {
          summary.failed++;
          results.push(err);
        }
      }
      if (endorsementId) {
        await updateEndorsementSummaryAfterEnrollment(
          endorsementId,
          {
            endorsementRepo: this.endorsementRepository,
            policyRepo: this.policyRepo,
            policyEmployeeEndorsementRepo: this.policyEmployeeEndorsementRepo,
            policyDependentEndorsementRepo: this.policyDependentEndorsementRepo,
            dependentRepo: this.dependentRepo,
            uploadRepo: this.uploadRepo,
            employeePolicyMapRepo: this.employeePolicyMapRepo,
            employeeEnrollmentRepo: this.employeeEnrollmentRepo,
            policyConfigRepo: this.policyConfigRepo,
            lookUpRepository: this.lookUpRepository,
            opportunityRepo: this.opportunityRepo,
          },
          this.logger,
          this.traceIdService.traceId
        );
        const endorsement = await this.endorsementRepository.findOne({
          where: { id: endorsementId },
          select: ["policyId"],
        });
        if (endorsement?.policyId) {
          try {
            await premiumCalculator(
              endorsement.policyId,
              endorsementId,
              {
                endorsementRepo: this.endorsementRepository,
                policyRepo: this.policyRepo,
                policyConfigRepo: this.policyConfigRepo,
                employeePolicyMapRepo: this.employeePolicyMapRepo,
                fileRepo: this.fileRepo,
                employeeEnrollmentRepo: this.employeeEnrollmentRepo,
                lookUpRepository: this.lookUpRepository,
                dependentRepo: this.dependentRepo,
              },
              this.logger,
              this.traceIdService.traceId,
            );
          } catch (err) {
            this.logError("processEnrollmentBatch", {
              message: "Failed to update premium calculator after enrollment processing",
              error: err instanceof Error ? err.message : err,
            });
          }
        }
      }
      await this.uploadRepo.update(uploadId, {
        processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
      });
      return results;
    } catch (error) {
      await this.uploadRepo.update(uploadId, {
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      });
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "processEnrollmentBatch",
          payload: { enrollmentBatchKey, userId },
          messageData: error,
        }),
      });
      throw error;
    } finally {
      if (this.redis) {
        deleted = await this.redis.del(enrollmentBatchKey);
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "IBP CompanyEmployeeService",
            method: "processEnrollmentBatch",
            payload: { enrollmentBatchKey, deleted: Boolean(deleted) },
            messageData: "redis key deleted",
          }),
        });
      }
      const end = Date.now();
      const duration = intervalToDuration({ start, end });
      const humanDuration = formatDuration(duration);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "processEnrollmentBatch",
          payload: {
            enrollmentBatchKey,
            summary,
            startTime: new Date(start).toISOString(),
            endTime: new Date(end).toISOString(),
            duration: humanDuration,
          },
          messageData: "batch completed",
        }),
      });
    }
  }

  async processEnrollmentPayload(
    payloadId: string,
    payloadMapId: string,
    userId: number,
    endorsementId?: number
  ) {
    return this.enrollmentProcessing.processEnrollmentPayload(
      payloadId,
      payloadMapId,
      userId,
      endorsementId
    );
  }

  async getEmployeePolicies(employeeId: number, configId?: number | null) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "getEmployeePolicies",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      let policies =
        await this.companyEmployeeRepository.getPoliciesByEmployee(employeeId);

      if (configId) {
        const scopeRows = await this.portalConfigScopeRepo.find({ where: { configId } });
        const hasAllPolicies = scopeRows.some((r) => r.policyId === null);
        if (!hasAllPolicies && scopeRows.length > 0) {
          const allowedPolicyIds = new Set(scopeRows.map((r) => r.policyId).filter((id): id is number => id !== null));
          policies = policies.filter((p) => allowedPolicyIds.has(p.id));
        }
      }

      const policyMap = new Map(policies.map((policy) => [policy.id, policy]));

      const enrollments =
        await this.companyEmployeeRepository.getEnrolledPolicies(employeeId);
      const enrolledIds = new Set(
        enrollments.map((enrollment) => enrollment.policyId),
      );

      // Fetch enrollment dates per employee using map-table values first,
      // then fall back to the upload record linked by enrollmentAdditionBatchId.
      const allPolicyIds = policies.map((policy) => policy.id);
      const employeePolicyDates = allPolicyIds.length
        ? await this.employeePolicyMapRepo
            .createQueryBuilder("peepm")
            .select([
              "peepm.policyId AS id",
              "COALESCE(peepm.enrollmentStartDate, dpf.enrollmentStartDate) AS startDate",
              "COALESCE(peepm.enrollmentEndDate, dpf.enrollmentEndDate) AS endDate",
              "peepm.createdAt AS createdAt",
              "peepm.additionalParams AS additionalParams",
              "peepm.effectiveDate AS effectiveDate",
            ])
            .leftJoin(
              DocumentProcessingFile,
              "dpf",
              "dpf.documentId = peepm.enrollmentAdditionBatchId",
            )
            .where("peepm.employeeId = :employeeId", { employeeId })
            .andWhere("peepm.policyId = ANY(:policyIds)", {
              policyIds: allPolicyIds,
            })
            .orderBy("peepm.updatedAt", "DESC")
            .addOrderBy("peepm.createdAt", "DESC")
            .getRawMany()
        : [];

      const employeePolicyDateMap = new Map();
      for (const policyDate of employeePolicyDates) {
        // Use the most recent map row per policy (due to DESC order)
        if (!employeePolicyDateMap.has(policyDate.id)) {
          employeePolicyDateMap.set(policyDate.id, {
            enrollmentStartDate: policyDate.startdate,
            enrollmentEndDate: policyDate.enddate,
            createdAt: policyDate.createdat,
            additionalParams: policyDate.additionalparams ?? null,
            // Per-employee-per-policy effective date from policy_enrollment_employee_policy_map —
            // the same employee can have a different effective date on a different policy, so this
            // must come from here, not a single generic employee-level field.
            effectiveDate: policyDate.effectivedate ?? null,
          });
        }
      }

      const inProgressEnrollmentMap = new Map<number, string>();
      if (allPolicyIds.length > 0) {
        const inProgressEnrollments = await this.employeeEnrollmentRepo.find({
          where: {
            employeeId,
            policyId: In(allPolicyIds),
            employeeEnrollmentStatusKey: EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS,
          },
        });

        for (const enrollment of inProgressEnrollments) {
          inProgressEnrollmentMap.set(
            enrollment.policyId,
            enrollment.employeeEnrollmentStatusKey,
          );
        }
      }

      const employeePolicies = policies
        .filter((policy) => !enrolledIds.has(policy.id))
        .map((policyDetail) => {
          const endorsementData = employeePolicyDateMap.get(
            policyDetail.id,
          ) || {
            enrollmentStartDate: null,
            enrollmentEndDate: null,
            effectiveDate: null,
          };
          return {
            policyId: policyDetail.id,
            policyName: policyDetail.policyName,
            policyTypeKey: policyDetail.policyType?.lookUpKey ?? null,
            startDate: policyDetail.policyFrom,
            dueDate: policyDetail.policyTo,
            enrollmentStartDate: formatDateOnly(
              endorsementData.enrollmentStartDate,
            ),
            enrollmentEndDate: formatDateOnly(
              endorsementData.enrollmentEndDate,
            ),
            // Per-policy effective date for this employee (policy_enrollment_employee_policy_map) —
            // used client-side for per-life proration; do NOT confuse with the generic
            // additionalDetails["Effective Date"] employee-level field, which isn't policy-scoped.
            effectiveDate: formatDateOnly(endorsementData.effectiveDate),
            employeeEnrollmentStatusKey:
              inProgressEnrollmentMap.get(policyDetail.id) ??
              EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED,
            addOnlyDependents: policyDetail.addOnlyDependents ?? false,
          };
        });

      const enrolledPolicyIds = enrollments.map(
        (enrollment) => enrollment.policyId,
      );

      let lockEnrollmentByPolicyId = new Map<number, boolean>();
      let autoLockAfterConfirmByPolicyId = new Map<number, boolean>();

      if (enrolledPolicyIds.length > 0) {
        const liveStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
        });

        const configurations = await this.policyConfigRepo.find({
          where: {
            policyId: In(enrolledPolicyIds),
            ...(liveStatus ? { policyConfiguartionStatusLid: liveStatus.id } : {}),
          },
        });

        lockEnrollmentByPolicyId = new Map(
          configurations.map((configuration) => [
            configuration.policyId,
            this.getLockEnrollmentAfterCutoffConstraint(configuration),
          ]),
        );

        autoLockAfterConfirmByPolicyId = new Map(
          configurations.map((configuration) => [
            configuration.policyId,
            this.getAutoLockAfterConfirmationConstraint(configuration),
          ]),
        );
      }

      // Fetch insurer logo file IDs for all enrolled policies
      const insurerLogoMap = new Map<number, number | null>();
      if (enrolledPolicyIds.length > 0) {
        try {
          // Query to get lead insurer IDs for all policies
          const leadInsurerData = await this.opportunityPlacementSlipRepo
            .createQueryBuilder("placement_slip")
            .select("policy.id", "policyId")
            .addSelect("placement_slip.leadInsurerId", "leadInsurerId")
            .innerJoin(
              "opportunity_activity_map",
              "activity_map",
              "activity_map.id = placement_slip.opportunityActivityId",
            )
            .innerJoin(
              "policy",
              "policy",
              "policy.opportunityId = activity_map.opportunityId",
            )
            .where("policy.id IN (:...policyIds)", {
              policyIds: enrolledPolicyIds,
            })
            .andWhere("activity_map.activityName = :activityName", {
              activityName: "Placement Slip Generation",
            })
            .getRawMany();

          // Extract unique lead insurer IDs
          const leadInsurerIds = Array.from(
            new Set(
              leadInsurerData
                .map((item) => item.leadInsurerId)
                .filter((id): id is number => id != null),
            ),
          );

          // Fetch insurer logo file IDs for all lead insurers
          if (leadInsurerIds.length > 0) {
            const insurers = await this.insurerRepo
              .createQueryBuilder("insurer")
              .select(["insurer.id", "insurer.insurerLogoFileId"])
              .where("insurer.id IN (:...insurerIds)", {
                insurerIds: leadInsurerIds,
              })
              .getMany();

            // Create insurer ID to logo file ID map
            const insurerLogoFileMap = new Map(
              insurers.map((insurer) => [
                insurer.id,
                insurer.insurerLogoFileId,
              ]),
            );

            // Map policy IDs to their insurer logo file IDs
            for (const data of leadInsurerData) {
              const logoFileId =
                insurerLogoFileMap.get(data.leadInsurerId) || null;
              insurerLogoMap.set(data.policyId, logoFileId);
            }
          }
        } catch (error) {
          // Log error but don't fail the entire request
          this.logger.warn({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "IBP CompanyEmployeeService",
              method: "getEmployeePolicies",
              payload: { employeeId, enrolledPolicyIds },
              messageData: `Failed to fetch insurer logos: ${
                error instanceof Error ? error.message : error
              }`,
            }),
          });
        }
      }

      const enrolledPolicies = enrollments
        .filter((enrollment) => policyMap.has(enrollment.policyId))
        .map((enrollment) => {
        const policy = policyMap.get(enrollment.policyId);
        const endorsementData = employeePolicyDateMap.get(
          enrollment.policyId,
        );
        const hasWindowFromMap =
          Boolean(endorsementData?.enrollmentStartDate) ||
          Boolean(endorsementData?.enrollmentEndDate);
        // Prefer the map-table enrollment window; endorsement.createdAt fallback can incorrectly
        // keep the policy editable if endorsement no longer stores start/end dates.
        const enrollmentWindowSource = hasWindowFromMap
          ? ({
              enrollmentStartDate: endorsementData?.enrollmentStartDate ?? null,
              enrollmentEndDate: endorsementData?.enrollmentEndDate ?? null,
              createdAt:
                endorsementData?.createdAt
                  ? new Date(endorsementData.createdAt)
                  : new Date(),
            } as Pick<
              PolicyEnrollmentEmployeePolicyMap,
              "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
            >)
          : null;
        // Once the policy due date (policyTo) has passed, the policy is locked
        // regardless of any other setting.
        const policyEndDate = policy?.policyTo
          ? endOfDay(new Date(policy.policyTo))
          : null;
        const isPastDueDate = policyEndDate
          ? policyEndDate.getTime() < Date.now()
          : false;
        // Editability is driven solely by the policy's own constraints (company
        // portal auto-lock settings are intentionally ignored). A policy is
        // editable unless one of its locks engages:
        //  - autoLockEnrollmentAfterConfirmation: locked once the employee has confirmed, or
        //  - lockEnrollmentAfterCutoff: when ON, locked once outside the enrollment window.
        // With both locks OFF the policy stays editable (the enrollment window is
        // only enforced when lockEnrollmentAfterCutoff is ON).
        const lockEnrollmentAfterCutoff =
          lockEnrollmentByPolicyId.get(enrollment.policyId) ?? false;
        const isEditable =
          !isPastDueDate &&
          !(autoLockAfterConfirmByPolicyId.get(enrollment.policyId) ?? false) &&
          (!lockEnrollmentAfterCutoff ||
            this.isEnrollmentEditableWithinCutoff(
              lockEnrollmentAfterCutoff,
              enrollmentWindowSource,
            ));

        // Get the insurer logo file ID from the map
        const insurerLogoFileId =
          insurerLogoMap.get(enrollment.policyId) || null;

        return {
          policyId: enrollment.policyId,
          policyName: policy?.policyName,
          policyNumber: policy?.insurerPolicyNumber,
          policyTypeKey: policy?.policyType?.lookUpKey ?? null,
          startDate: policy?.policyFrom,
          enrollmentStartDate: formatDateOnly(
            endorsementData?.enrollmentStartDate,
          ),
          enrollmentEndDate: formatDateOnly(
            endorsementData?.enrollmentEndDate,
          ),
          // Per-policy effective date for this employee — see the identical field on
          // employeePolicies above for why this must be policy-scoped, not employee-level.
          effectiveDate: formatDateOnly(endorsementData?.effectiveDate),
          dueDate: policy?.policyTo,
          sumInsured: enrollment.sumInsured,
          balance: enrollment.balance,
          dependentsCount: enrollment.dependentsCount,
          employeeEnrollmentStatusKey: EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
          isEditable,
          insurerLogoFileId: insurerLogoFileId,
          disclaimersAccepted: endorsementData?.additionalParams?.disclaimersAccepted ?? [],
          addOnlyDependents: policy?.addOnlyDependents ?? false,
        };
      });

      return { employeePolicies, enrolledPolicies };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getEmployeePolicies",
          payload: { employeeId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getEnrollmentSummary(policyId: number, employeeId: number) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "getEnrollmentSummary",
        payload: { policyId, employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      return await this.companyEmployeeRepository.getEnrollmentSummary(
        policyId,
        employeeId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getEnrollmentSummary",
          payload: { policyId, employeeId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getPolicyEmployeeInsuredDetails(
    policyId: number,
    page?: number,
    limit?: number,
    relationshipGroup?: string,
    claimStatus?: string,
    effectiveFrom?: string,
    effectiveTo?: string,
    searchBy?: string,
    search?: string,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "getPolicyEmployeeInsuredDetails",
        payload: { policyId },
        messageData: "method invoked",
      }),
    });

    try {
      const {
        relationshipGroup: effectiveRelationshipGroup,
        claimStatus: effectiveClaimStatus,
        effectiveFrom: effectiveEffectiveFrom,
        effectiveTo: effectiveEffectiveTo,
        searchBy: effectiveSearchBy,
        employeeId: effectiveEmployeeId,
      } = resolveEmployeeInsuredSearchParams({
        relationshipGroup,
        claimStatus,
        effectiveFrom,
        effectiveTo,
        searchBy,
        search,
      });

      return await this.companyEmployeeRepository.getPolicyEmployeeInsuredDetailsById(
        policyId,
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        effectiveRelationshipGroup,
        effectiveClaimStatus,
        effectiveEffectiveFrom,
        effectiveEffectiveTo,
        effectiveSearchBy,
        effectiveEmployeeId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "getPolicyEmployeeInsuredDetails",
          payload: { policyId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  // Code for validating the company employee and setting his password accordingly
  async validateCompanyEmployee(
    companyEmployeeDetails: UpdateCompanyEmployeePassword,
  ): Promise<any | null> {
    let isPasswordUpdated: boolean = false;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "SimpleAuthService",
        method: "validateCompanyEmployee",
        payload: {
          name: companyEmployeeDetails.companyEmployeeName,
          email: companyEmployeeDetails.companyEmployeeEmail,
          mobile: companyEmployeeDetails.companyEmployeePhoneNumber,
          companyEmployeeId: companyEmployeeDetails.companyEmployeeId,
        },
        messageData: "method invoked",
      }),
    });
    try {
      if (
        companyEmployeeDetails.companyEmployeeName ===
        `${ENV.SCHEDULER_LOGIN_USERNAME}`
      ) {
        throw new ForbiddenException(errorMessages.unauthorizedUser);
      }
      const employeeDetails =
        await this.companyEmployeeRepository.getCompanyEmployeeDataByEmployeeProperties(
          companyEmployeeDetails.companyEmployeeName,
          companyEmployeeDetails.companyEmployeeEmail,
          companyEmployeeDetails.companyEmployeePhoneNumber,
          companyEmployeeDetails.companyEmployeeId,
        );
      if (!employeeDetails || !employeeDetails.id) {
        throw new NotFoundException(errorMessages.companyEmployeeNotFound);
      }
      let hashedPassword = await hashPassword(companyEmployeeDetails.password);
      isPasswordUpdated =
        (await this.companyEmployeeRepository.updateCompanyEmployeePassword(
          employeeDetails.id,
          hashedPassword,
        )) ?? false;
      if (isPasswordUpdated) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId: employeeDetails.userId,
            status: "success",
            location: "SimpleAuthService",
            method: "validateCompanyEmployee",
            payload: {
              name: companyEmployeeDetails.companyEmployeeName,
              email: companyEmployeeDetails.companyEmployeeEmail,
              mobile: companyEmployeeDetails.companyEmployeePhoneNumber,
            },
            messageData: "password updated successfully..!",
          }),
        });
        return employeeDetails;
      }
      throw new ForbiddenException(errorMessages.companyEmployeeNotFound);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: "validateCompanyEmployee",
          payload: {
            name: companyEmployeeDetails.companyEmployeeName,
            email: companyEmployeeDetails.companyEmployeeEmail,
            mobile: companyEmployeeDetails.companyEmployeePhoneNumber,
          },
          status: "failure",
          location: "SimpleAuthService",
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new NotFoundException(errorMessages.companyEmployeeNotFound);
    }
  }

  private getPolicyConfigurationObject(policyConfig: any) {
    if (!policyConfig || typeof policyConfig !== "object") {
      return {};
    }
    if (
      Object.prototype.hasOwnProperty.call(policyConfig, "policyConfiguration")
    ) {
      const nested = (policyConfig as Record<string, any>).policyConfiguration;
      return nested && typeof nested === "object" ? nested : {};
    }
    return policyConfig;
  }

  private mapAvailableChoice(
    component: any,
    choice: any,
    parentId?: number,
  ): EnrollmentChoiceDto {
    const sumInsured = component.sumInsuredOptions?.find(
      (opt: any) => opt.id === choice.sumInsuredId,
    )?.value;
    const companyContribution = Number(choice?.companyContribution ?? 0);
    const employeeContribution = Number(choice?.employeeContribution ?? 0);
    return {
      sumInsured: Number(sumInsured),
      premium: companyContribution + employeeContribution,
      companyPay: companyContribution,
      employeePay: employeeContribution,
      policyComponentActionType: component.type,
      policyComponentActionTypeId: component.id,
      policyComponentActionLabel: component.label,
      parentpolicyComponentActionTypeId: parentId,
      premiumPerLife: Boolean(component?.premiumPerLife),
      sumInsuredPerLife: Boolean(component?.sumInsuredPerLife),
      sumInsuredModel: component?.sumInsuredModel,
      sumInsuredModelProperty: component?.siMultipleLabel,
      maxSumInsuredValue: component?.maxSumInsuredValue,
      minSumInsuredValue: component?.minSumInsuredValue,
    };
  }

  private async buildEnrollmentChoices(
    employeeRecord: any,
    policyConfig: any,
    dependents: UpsertEnrollmentDependentDto[],
    context: { policyId: number; employeeId: number },
  ): Promise<EnrollmentChoiceDto[]> {
    const isDependentOnly = Boolean(employeeRecord?.isDependentOnly);

    let employeeChoices = Array.isArray(employeeRecord?.choices)
      ? employeeRecord.choices
      : [];

    if (isDependentOnly) {
      try {
        const existingChoices =
          await this.companyEmployeeRepository.getEnrollmentComponents(
            context.policyId,
            context.employeeId,
          );
        if (existingChoices.length) {
          employeeChoices = existingChoices
            .map((choice) => ({
              policyLabel:
                String(choice.policyComponentActionLabel ?? "") ||
                String(choice.policyComponentActionType ?? ""),
              sumInsuredValue: Number(choice.sumInsured),
              policyComponentActionTypeId: choice.policyComponentActionTypeId,
              parentPolicyComponentActionTypeId:
                choice.parentpolicyComponentActionTypeId,
              companyContribution: Number(choice.companyPay ?? 0),
              employeeContribution: Number(choice.employeePay ?? 0),
              premium: Number(choice.premium ?? 0),
              premiumPerLife: Boolean(choice.premiumPerLife),
              sumInsuredModel: choice.sumInsuredModel,
              sumInsuredModelProperty: choice.sumInsuredModelProperty,
              minSumInsuredValue: choice.minSumInsuredValue,
              maxSumInsuredValue: choice.maxSumInsuredValue,
            }))
            .filter(
              (choice) =>
                Boolean(choice.policyLabel) &&
                Number.isFinite(choice.sumInsuredValue),
            );
        }
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "CompanyEmployeeService",
            method: "buildEnrollmentChoices",
            payload: {
              policyId: context.policyId,
              employeeId: context.employeeId,
            },
            messageData: error,
          }),
        });
      }
    }

    if (!employeeChoices.length) {
      return [];
    }

    const config = this.getPolicyConfigurationObject(policyConfig);
    const components: any[] = Array.isArray(config?.components)
      ? config.components
      : [];
    if (!components.length) {
      return [];
    }

    const employeeDetails = {
      ...(employeeRecord?.companyEmployee ?? {}),
      additionalDetails:
        employeeRecord?.companyEmployee?.additionalDetails ??
        employeeRecord?.additionalParams ??
        {},
      effectiveDate: employeeRecord?.effectiveDate ?? null,
    };

    let availableChoices: any;
    try {
      availableChoices = this.filterPolicyOptions(
        employeeDetails,
        config,
        dependents,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeService",
          method: "buildEnrollmentChoices",
          payload: {
            policyId: context.policyId,
            employeeId: context.employeeId,
          },
          messageData: error,
        }),
      });
      return [];
    }

    if (!availableChoices || Object.keys(availableChoices).length === 0) {
      return [];
    }

    const componentById = new Map<number, any>();
    for (const component of components) {
      if (component && typeof component.id === "number") {
        componentById.set(component.id, component);
      }
    }

    const hasRelationshipParameter = Array.isArray(config?.parameters)
      ? config.parameters.some(
          (param: any) =>
            String(param?.type ?? "").toLowerCase() ===
            POLICY_RELATIONSHIP_TYPE_PARAMETER.toLowerCase(),
        )
      : false;

    const availableComponentMap = new Map<
      string,
      Map<number, { component: any; choice: any; parentId?: number }>
    >();

    const availableComponentsById = new Map<
      number,
      { component: any; choices: any[]; parentId?: number }
    >();

    const registerChoices = (section: any, parentId?: number) => {
      if (!section || !section.choices) return;
      const policyComponent = componentById.get(section.policyId);
      if (!policyComponent) return;
      const availableOptions = Array.isArray(section.choices)
        ? section.choices.filter((option: any) => option?.isAvailable)
        : [];
      if (!availableOptions.length) {
        return;
      }
      availableComponentsById.set(policyComponent.id, {
        component: policyComponent,
        choices: availableOptions,
        parentId,
      });
      const normalizedLabel = String(policyComponent.label ?? "")
        .trim()
        .toLowerCase();
      const key = `${normalizedLabel}_${parentId ?? ""}`;
      let mapBySi = availableComponentMap.get(key);
      if (!mapBySi) {
        mapBySi = new Map();
        availableComponentMap.set(key, mapBySi);
      }
      for (const option of availableOptions) {
        const sumInsured = policyComponent.sumInsuredOptions?.find(
          (opt: any) => opt.id === option.sumInsuredId,
        )?.value;
        if (sumInsured === undefined || sumInsured === null) continue;
        mapBySi.set(Number(sumInsured), {
          component: policyComponent,
          choice: option,
          parentId,
        });
      }
    };

    const basePolicy = availableChoices?.basePolicyChoices;
    if (basePolicy?.mainPolicyChoices) {
      registerChoices(basePolicy.mainPolicyChoices);
      for (const addon of basePolicy.addonChoices ?? []) {
        registerChoices(addon, basePolicy.mainPolicyChoices.policyId);
      }
    }

    const parentalPolicy = availableChoices?.parentalPolicyChoices;
    if (parentalPolicy?.mainPolicyChoices) {
      registerChoices(parentalPolicy.mainPolicyChoices);
      for (const addon of parentalPolicy.addonChoices ?? []) {
        registerChoices(addon, parentalPolicy.mainPolicyChoices.policyId);
      }
    }

    const mappedChoices: EnrollmentChoiceDto[] = [];
    const unresolvedChoices: { label: string; sumInsured: number }[] = [];

    for (const choice of employeeChoices) {
      if (!choice) continue;
      const normalizedLabel = String(choice.policyLabel ?? "")
        .trim()
        .toLowerCase();
      if (!normalizedLabel) continue;

      const sumInsuredValue = Number(
        choice.sumInsuredValue ??
          choice.sumInsured ??
          choice.sumInsuredAmount ??
          choice.sumInsuredValue,
      );
      if (!Number.isFinite(sumInsuredValue)) {
        continue;
      }

      let matched:
        | { component: any; choice: any; parentId?: number }
        | undefined;

      const directKey = `${normalizedLabel}_`;
      matched = availableComponentMap.get(directKey)?.get(sumInsuredValue);

      if (!matched && isDependentOnly && hasRelationshipParameter) {
        const componentIdCandidate = Number(
          choice.policyComponentActionTypeId ??
            choice.policyComponentActionTypeID ??
            choice.policyComponentActionId,
        );

        const possibleEntries: {
          component: any;
          choices: any[];
          parentId?: number;
        }[] = [];

        if (Number.isFinite(componentIdCandidate)) {
          const entry = availableComponentsById.get(componentIdCandidate);
          if (entry) {
            possibleEntries.push(entry);
          }
        }

        if (!possibleEntries.length && normalizedLabel) {
          for (const entry of availableComponentsById.values()) {
            const entryLabel = String(entry.component?.label ?? "")
              .trim()
              .toLowerCase();
            if (entryLabel === normalizedLabel) {
              possibleEntries.push(entry);
            }
          }
        }

        for (const entry of possibleEntries) {
          const fallbackOption = entry.choices[0];
          if (fallbackOption) {
            matched = {
              component: entry.component,
              choice: fallbackOption,
              parentId: entry.parentId,
            };
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "CompanyEmployeeService",
                method: "buildEnrollmentChoices",
                payload: {
                  policyId: context.policyId,
                  employeeId: context.employeeId,
                  policyLabel: choice.policyLabel,
                },
                messageData:
                  "Selected fallback enrollment choice for dependent-only record",
              }),
            });
            break;
          }
        }
      }

      if (!matched) {
        for (const [key, mapBySi] of availableComponentMap.entries()) {
          if (!key.startsWith(`${normalizedLabel}_`)) continue;
          const candidate = mapBySi.get(sumInsuredValue);
          if (candidate) {
            matched = candidate;
            break;
          }
        }
      }

      if (!matched) {
        this.logger.warn({
          level: "warn",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "CompanyEmployeeService",
            method: "buildEnrollmentChoices",
            payload: {
              policyId: context.policyId,
              employeeId: context.employeeId,
              policyLabel: choice.policyLabel,
              sumInsured: choice.sumInsuredValue,
            },
            messageData: "No matching policy component found for choice",
          }),
        });
        if (!matched && isDependentOnly && hasRelationshipParameter) {
          const componentIdCandidate = Number(
            choice.policyComponentActionTypeId ??
              choice.policyComponentActionTypeID ??
              choice.policyComponentActionId,
          );

          const possibleEntries: {
            component: any;
            choices: any[];
            parentId?: number;
          }[] = [];

          if (Number.isFinite(componentIdCandidate)) {
            const entry = availableComponentsById.get(componentIdCandidate);
            if (entry) {
              possibleEntries.push(entry);
            }
          }

          if (!possibleEntries.length && normalizedLabel) {
            for (const entry of availableComponentsById.values()) {
              const entryLabel = String(entry.component?.label ?? "")
                .trim()
                .toLowerCase();
              if (entryLabel === normalizedLabel) {
                possibleEntries.push(entry);
              }
            }
          }

          for (const entry of possibleEntries) {
            const fallbackOption = entry.choices[0];
            if (fallbackOption) {
              matched = {
                component: entry.component,
                choice: fallbackOption,
                parentId: entry.parentId,
              };
              this.logger.log({
                level: "info",
                message: buildLogMessage({
                  traceId: this.traceIdService.traceId,
                  status: "success",
                  location: "CompanyEmployeeService",
                  method: "buildEnrollmentChoices",
                  payload: {
                    policyId: context.policyId,
                    employeeId: context.employeeId,
                    policyLabel: choice.policyLabel,
                  },
                  messageData:
                    "Selected fallback enrollment choice for dependent-only record",
                }),
              });
              break;
            }
          }
        }
        continue;
      }

      const mappedChoice = this.mapAvailableChoice(
        matched.component,
        matched.choice,
        matched.parentId,
      );

      if (!Number.isFinite(mappedChoice.sumInsured)) {
        continue;
      }

      mappedChoices.push(mappedChoice);
    }

    if (
      isDependentOnly &&
      hasRelationshipParameter &&
      unresolvedChoices.length
    ) {
      throw new BadRequestException(
        `Unable to determine enrollment choices for dependent-only employee ${
          context.employeeId
        } under policy ${
          context.policyId
        }. Affected selections: ${unresolvedChoices
          .map((item) => `${item.label} (${item.sumInsured})`)
          .join(", ")}`,
      );
    }

    if (!mappedChoices.length) {
      return [];
    }

    return mappedChoices;
  }

  private transformDependentsData(
    dependents: PolicyEnrollmentDependent[],
  ): UpsertEnrollmentDependentDto[] {
    return dependents.map((dependent: PolicyEnrollmentDependent) => ({
      name: dependent.name,
      relation: dependent.relation,
      // dateOfBirth loaded from the DB via TypeORM arrives as a native Date
      // object, not a string — the old string-only check silently dropped it
      // (=> undefined), which made age-band resolution for applyToDependents
      // parameters fail silently for every DB-sourced dependent (e.g. on the
      // Save & Exit → resume / relations-constraints-dependents path), while
      // the POST preview path (client sends a JSON date string directly)
      // was unaffected. Accept both shapes.
      dateOfBirth:
        typeof dependent.dateOfBirth === "string"
          ? dependent.dateOfBirth
          : dependent.dateOfBirth instanceof Date &&
            !isNaN(dependent.dateOfBirth.getTime())
          ? dependent.dateOfBirth.toISOString().split("T")[0]
          : undefined,
      effectiveDate:
        dependent.effectiveDate && typeof dependent.effectiveDate === "string"
          ? (dependent.effectiveDate as any).split("T")[0]
          : undefined,
      // effectiveDate: dependent.effectiveDate
      //   ? dependent.effectiveDate.toISOString().split("T")[0]
      //   : undefined,
      gender: dependent.gender,
      relationshipType: dependent.relationshipType,
      documentIds: dependent.documentIds ?? [],
      id: dependent.id,
      isLifeEvent: dependent.isLifeEvent ?? false,
    }));
  }

  private async buildDependentsWithChoiceFields(
    dependents: PolicyEnrollmentDependent[],
  ): Promise<UpsertEnrollmentDependentDto[]> {
    if (!dependents.length) {
      return [];
    }

    const dependentIds = dependents.map((dep) => dep.id);
    // Use an explicit join to ensure choice fields are loaded reliably.
    const links = await this.employeeChoiceDependentRepo
      .createQueryBuilder("link")
      .innerJoinAndSelect("link.choice", "choice")
      .where("link.dependentId IN (:...dependentIds)", { dependentIds })
      .andWhere("link.deletedAt IS NULL")
      .orderBy("choice.id", "ASC")
      .getMany();

    const dependentIdToChoices = new Map<number, PolicyEmployeeEnrollmentChoice[]>();
    for (const link of links) {
      const choice = (link as any).choice as PolicyEmployeeEnrollmentChoice | undefined;
      if (!choice) continue;
      const existing = dependentIdToChoices.get(link.dependentId) ?? [];
      existing.push(choice);
      dependentIdToChoices.set(link.dependentId, existing);
    }

    return dependents.map((dependent) => {
      const choices = dependentIdToChoices.get(dependent.id) ?? [];
      const primaryChoice = choices[0];
      // Use formatDateOnly (server-local Y-M-D). toISOString() here returns the
      // UTC date, which drops a day for IST-midnight timestamps (the read shift).
      const dateOfBirth = formatDateOnly(dependent.dateOfBirth) ?? undefined;
      const effectiveDate = formatDateOnly(dependent.effectiveDate) ?? undefined;

      return {
        id: dependent.id,
        name: dependent.name,
        relation: dependent.relation,
        relationshipType: dependent.relationshipType,
        dateOfBirth,
        effectiveDate,
        gender: dependent.gender,
        documentIds: dependent.documentIds ?? [],
        isLifeEvent: dependent.isLifeEvent ?? false,
        enrollmentAdditionBatchId:
          dependent.enrollmentAdditionBatchId ?? undefined,
        claimStatus: dependent.claimStatus ?? undefined,
        policyComponentActionTypeId:
          primaryChoice?.policyComponentActionTypeId ?? null,
        policyComponentActionType:
          primaryChoice?.policyComponentActionType ?? null,
        parentpolicyComponentActionTypeId:
          primaryChoice?.parentpolicyComponentActionTypeId ?? null,
        policyComponentActionLabel:
          primaryChoice?.policyComponentActionLabel ?? null,
        choices: choices.map((choice) => ({
          policyComponentActionTypeId: choice.policyComponentActionTypeId ?? null,
          policyComponentActionType: choice.policyComponentActionType ?? null,
          parentpolicyComponentActionTypeId:
            choice.parentpolicyComponentActionTypeId ?? null,
          policyComponentActionLabel:
            choice.policyComponentActionLabel ?? null,
        })),
      };
    });
  }

  async getEmployeeFaqs(
    employeeId: number,
    category?: string,
    search?: string,
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT,
  ) {
    this.logInfo("getEmployeeFaqs", {
      employeeId,
      category,
      search,
      page,
      limit,
    });

    try {
      // Validate employeeId
      if (!employeeId || employeeId < DEFAULT_PAGE) {
        throw new Error("Employee ID must be a valid positive number");
      }

      // Validate pagination parameters
      if (page < DEFAULT_PAGE) {
        page = DEFAULT_PAGE;
      }
      if (limit < DEFAULT_PAGE || limit > DEFAULT_LIMIT) {
        limit = DEFAULT_LIMIT;
      }

      // Call repository method to get employee FAQs
      const result = await this.companyEmployeeRepository.getEmployeeFaqs(
        employeeId,
        category,
        search,
        page,
        limit,
      );

      // Check if employee has any mapped policies
      if (result.sourcePolicyIds.length === 0) {
        this.logInfo("getEmployeeFaqs", {
          message: "No active policies found for employee",
          employeeId,
        });

        return {
          faqs: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          availableCategories: [],
          sourcePolicyIds: [],
          total: 0,
        };
      }

      this.logInfo("getEmployeeFaqs", {
        message: "Employee FAQs retrieved successfully",
        employeeId,
        faqCount: result.faqs.length,
        totalFaqs: result.total,
        sourcePolicies: result.sourcePolicyIds.length,
        categories: result.availableCategories.length,
      });

      return result;
    } catch (error) {
      this.logError("getEmployeeFaqs", {
        employeeId,
        category,
        search,
        page,
        limit,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async searchHospitals(
    policyId: number,
    searchParams: SearchHospitalDto,
    userId: number,
  ) {
    return executeHospitalSearch({
      repository: this.companyEmployeeRepository,
      policyId,
      searchParams,
      userId,
      logger: this.logger,
      traceIdService: this.traceIdService,
    });
  }

  async searchHospitalsByPolicyIds(
    policyIds: number[],
    searchParams: SearchHospitalDto,
    userId: number,
  ) {
    return executeHospitalSearchByPolicyIds({
      repository: this.companyEmployeeRepository,
      policyIds,
      searchParams,
      userId,
      logger: this.logger,
      traceIdService: this.traceIdService,
    });
  }

  async exportHospitalsToExcel(
    policyId: number,
    searchParams: SearchHospitalDto,
    userId: number,
  ) {
    return generateHospitalExport({
      repository: this.companyEmployeeRepository,
      policyId,
      searchParams,
      userId,
      logger: this.logger,
      traceIdService: this.traceIdService,
    });
  }

  async createPolicyHospital(
    policyId: number,
    payload: CreatePolicyHospitalDto,
    userId: number,
  ): Promise<CreatePolicyHospitalResponseDto> {
    this.logInfo("createPolicyHospital", {
      policyId,
      userId,
      hospitalName: payload?.hospitalName,
      city: payload?.city,
      state: payload?.state,
      isNetworkHospital: payload?.isNetworkHospital ?? false,
    });

    // Default to excluded for manual addition unless explicitly requested.
    const isNetworkHospital = payload.isNetworkHospital ?? false;

    return this.companyEmployeeRepository.createOrMapPolicyHospital({
      policyId,
      userId,
      hospitalName: payload.hospitalName,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2,
      landmark: payload.landmark,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      pinCode: payload.pinCode,
      code: payload.code,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      isNetworkHospital,
    });
  }

  async getActivePolicyFeatureDocumentForEmployee(
    employeeId: number,
    userId?: number,
    filters?: GetPolicyFeatureDocumentsQueryDto,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeService",
        method: "getActivePolicyFeatureDocumentForEmployee",
        payload: { employeeId },
        messageData: "Retrieving policy feature documents for employee",
      }),
    });

    const policyIds =
      await this.companyEmployeeRepository.getPolicyIdsByEmployee(employeeId);
    const companyLevelResult =
      await this.companyEmployeeRepository.getCompanyPolicyFeatureDocumentByEmployee(
        employeeId
      );
    if (!policyIds.length) {
      const companyLevelDocuments = this.applyMyDocumentFilters(
        companyLevelResult.data as EmployeeDocumentRecord[],
        filters,
      );

      return {
        data: companyLevelDocuments,
        count: companyLevelDocuments.length,
      };
    }

    const policyNames =
      await this.companyEmployeeRepository.getPolicyNamesByIds(policyIds);

    const results = await Promise.all(
      policyIds.map((policyId) =>
        this.companyEmployeeRepository.getActivePolicyFeatureDocument(policyId),
      ),
    );
    const aggregatedData = results.flatMap(
      (result) => result.data as EmployeeDocumentRecord[],
    );

    const dataWithPolicyNames = aggregatedData.map((entry) => ({
      ...entry,
      policyName:
        typeof entry.policyId === "number" ? policyNames[entry.policyId] ?? null : null,
      featureType: "policy_level",
      title:
        typeof entry.policyId === "number" ? policyNames[entry.policyId] ?? null : null,
      subtitle: "Policy feature document",
    }));

    const seenPolicyIds = new Set(
      dataWithPolicyNames.map((entry) => entry.policyId),
    );
    const placeholders = policyIds
      .filter((policyId) => !seenPolicyIds.has(policyId))
      .map((policyId) => ({
        id: null,
        policyId,
        documentId: null,
        fileName: null,
        fileStatus: null,
        uploadedAt: null,
        uploadedBy: null,
        uploadedByName: null,
        policyName: policyNames[policyId] ?? null,
        featureType: "policy_level",
        title: policyNames[policyId] ?? null,
        subtitle: "Policy feature document",
      }));

    const companyLevelDocuments = (
      companyLevelResult.data as EmployeeDocumentRecord[]
    ).map((entry) => ({
      ...entry,
      title: entry.policyName ?? null,
      subtitle: "Company policy feature document",
    }));

    const [claimDocuments, lifeEventDocuments, personalDocuments, raiseTicketDocuments] = await Promise.all([
      this.getClaimIntimationDocuments(employeeId, policyNames),
      this.getLifeEventDocuments(employeeId, policyNames),
      this.getPersonalDocuments(employeeId),
      this.getRaiseTicketDocuments(employeeId, policyNames),
    ]);

    const mailDocuments = await this.getMailDocumentsForEmployee(userId, employeeId);

    const combinedData: EmployeeDocumentRecord[] = [
      ...dataWithPolicyNames,
      ...placeholders,
      ...companyLevelDocuments,
      ...claimDocuments,
      ...lifeEventDocuments,
      ...personalDocuments,
      ...raiseTicketDocuments,
      ...mailDocuments,
    ];

    const filteredData = this.applyMyDocumentFilters(combinedData, filters);

    return {
      data: filteredData,
      count: filteredData.length,
    };
  }

  async getPolicyFeatureDocumentByPolicyId(policyId: number) {
    return this.companyEmployeeRepository.getActivePolicyFeatureDocument(policyId);
  }

  private applyMyDocumentFilters(
    documents: EmployeeDocumentRecord[],
    filters?: GetPolicyFeatureDocumentsQueryDto,
  ): EmployeeDocumentRecord[] {
    const search = filters?.search?.trim().toLowerCase();
    const category = (filters?.category ?? "all") as MyDocumentCategory;
    const documentType = (filters?.documentType ?? "all") as MyDocumentType;
    const sortOrder = (filters?.sortOrder ?? "latest") as MyDocumentSortOrder;

    let filteredDocuments = documents;

    if (search) {
      filteredDocuments = filteredDocuments.filter((document) => {
        const searchableFields = [
          document.title,
          document.fileName,
          document.policyName,
          document.subtitle,
          document.uploadedByName,
        ];

        return searchableFields.some((value) =>
          String(value ?? "").toLowerCase().includes(search),
        );
      });
    }

    if (category !== "all") {
      filteredDocuments = filteredDocuments.filter(
        (document) => this.getMyDocumentCategory(document) === category,
      );
    }

    if (documentType !== "all") {
      filteredDocuments = filteredDocuments.filter(
        (document) => this.getMyDocumentType(document) === documentType,
      );
    }

    return [...filteredDocuments].sort((firstDocument, secondDocument) => {
      const firstTime = this.getMyDocumentTimestamp(firstDocument);
      const secondTime = this.getMyDocumentTimestamp(secondDocument);

      return sortOrder === "oldest"
        ? firstTime - secondTime
        : secondTime - firstTime;
    });
  }

  private getMyDocumentCategory(
    document: EmployeeDocumentRecord,
  ): Exclude<MyDocumentCategory, "all"> {
    const featureType = String(document.featureType ?? "").toLowerCase();

    if (featureType === "policy_level" || featureType === "company_level") {
      return "policies";
    }
    if (featureType === "claim_intimation") {
      return "claims";
    }
    if (featureType === "life_event") {
      return "life_events";
    }
    if (featureType === "personal_document") {
      return "personal_documents";
    }
    if (featureType === "raise_ticket") {
      return "support_tickets";
    }
    if (featureType === "mail") {
      return "mail";
    }

    return "other";
  }

  private getMyDocumentType(
    document: EmployeeDocumentRecord,
  ): Exclude<MyDocumentType, "all"> {
    const featureType = String(document.featureType ?? "").toLowerCase();

    if (featureType === "policy_level" || featureType === "company_level") {
      return "policy_certificate";
    }
    if (featureType === "claim_intimation") {
      return "claim_form";
    }
    if (featureType === "life_event") {
      return "life_event_proof";
    }
    if (featureType === "personal_document") {
      return "personal_document";
    }
    if (featureType === "raise_ticket") {
      return "support_ticket";
    }
    if (featureType === "mail") {
      return "communication";
    }

    return "document";
  }

  private getMyDocumentTimestamp(document: EmployeeDocumentRecord): number {
    const rawValue = document.lastUpdated ?? document.uploadedAt ?? null;

    if (!rawValue) {
      return 0;
    }

    const parsedTime =
      rawValue instanceof Date ? rawValue.getTime() : new Date(rawValue).getTime();

    return Number.isFinite(parsedTime) ? parsedTime : 0;
  }

  private async getMailDocumentsForEmployee(userId: number | null | undefined, employeeId: number) {
    const mailActivityKeys = new Set([
      "CONFIRMATION_EMAIL_SENT",
      "INITIAL_ONBOARDING_EMAIL_SENT",
      "ENROLLMENT_START_EMAIL_SENT",
      "ENROLLMENT_REMINDER_EMAIL_SENT",
    ]);

    const validUserId = userId && Number.isFinite(userId) && userId !== employeeId ? userId : null;
    const queryStrategy = validUserId ? `userId=${validUserId}` : `employeeId(metadata)=${employeeId}`;
    this.logInfo("getMailDocumentsForEmployee", {
      step: "query-strategy",
      userId,
      employeeId,
      validUserId,
      queryStrategy,
      isDetachedEmployee: !validUserId,
    });

    const mailActivityLogs = validUserId
      ? await this.companyEmployeeRepository.getMailActivityLogs(validUserId)
      : await this.companyEmployeeRepository.getMailActivityLogsByEmployeeId(employeeId);

    this.logInfo("getMailDocumentsForEmployee", {
      step: "activity-logs-fetched",
      queryStrategy,
      totalLogsFound: mailActivityLogs.length,
      logIds: mailActivityLogs.map((l) => l.id),
      activityKeys: mailActivityLogs.map((l) => l.activityKey),
    });

    const filteredMailLogs = mailActivityLogs.filter((log) =>
      mailActivityKeys.has(log.activityKey),
    );

    this.logInfo("getMailDocumentsForEmployee", {
      step: "filtered-by-activity-key",
      filteredCount: filteredMailLogs.length,
      filteredActivityKeys: filteredMailLogs.map((l) => l.activityKey),
    });

    const notificationInfoIds = Array.from(
      new Set(
        filteredMailLogs
          .map((log) => Number(log.referenceId))
          .filter((id) => Number.isFinite(id)),
      ),
    );

    this.logInfo("getMailDocumentsForEmployee", {
      step: "notification-info-ids",
      notificationInfoIds,
      fetchingWithUserId: validUserId ?? null,
    });

    const notificationInfos =
      await this.companyEmployeeRepository.getNotificationInfosByIds(
        notificationInfoIds,
        validUserId ?? undefined,
      );

    this.logInfo("getMailDocumentsForEmployee", {
      step: "notification-infos-fetched",
      requested: notificationInfoIds.length,
      found: notificationInfos.length,
      foundIds: notificationInfos.map((n) => n.id),
    });

    const notificationInfoById = new Map(
      notificationInfos.map((item) => [item.id, item]),
    );

    const mailTitleMap: Record<string, string> = {
      CONFIRMATION_EMAIL_SENT: "Enrolment confirmation email",
      INITIAL_ONBOARDING_EMAIL_SENT: "Onboarding email",
      ENROLLMENT_START_EMAIL_SENT: "Enrollment window open mail",
      ENROLLMENT_REMINDER_EMAIL_SENT: "Enrollment reminder mail",
    };

    return filteredMailLogs
      .map((log) => {
        const notificationInfo = notificationInfoById.get(Number(log.referenceId));
        if (!notificationInfo) {
          return null;
        }

        return {
          id: `mail-${log.id}`,
          documentId: null,
          fileName: `${mailTitleMap[log.activityKey] ?? "Mail"}.pdf`,
          mimeType: "application/pdf",
          lastUpdated: notificationInfo.sentAt ?? notificationInfo.createdAt,
          policyId: null,
          policyName: null,
          featureType: "mail",
          title: mailTitleMap[log.activityKey] ?? notificationInfo.subject ?? "Mail",
          subtitle: notificationInfo.subject ?? "Email preview",
          uploadedByName: null,
          referenceId: String(notificationInfo.id),
          referenceType: "NOTIFICATION_INFO",
          activityKey: log.activityKey,
          renderedHtml: notificationInfo.renderedHtml,
          hasPreview: Boolean(notificationInfo.renderedHtml),
          hasDownload: Boolean(notificationInfo.renderedHtml),
        };
      })
      .filter(Boolean);
  }

  private buildUploadedByName(fileUpload?: FileUpload | null): string | null {
    if (!fileUpload?.createdByUser) {
      return null;
    }

    const fullName = `${fileUpload.createdByUser.firstName || ""} ${fileUpload.createdByUser.lastName || ""}`.trim();
    return fullName || "Unknown User";
  }

  private getDisplayFileName(
    fileUpload?: FileUpload | null,
    fallback = "Document",
  ): string {
    if (!fileUpload?.fileKey) {
      return fallback;
    }

    return fileUpload.fileKey.split("/").pop() || fallback;
  }

  private async getClaimIntimationDocuments(
    employeeId: number,
    policyNames: Record<number, string | null>,
  ) {
    const claims = await this.claimRepo.find({
      where: {
        employeeId,
        deletedAt: IsNull(),
        documentIds: Not(IsNull()),
      },
      order: { createdAt: "DESC" },
    });

    // Helper: normalize documentIds which may be old number[] or new {documentId,documentType}[]
    const normalizeDocumentIds = (
      raw: any,
    ): { documentId: number; documentType: string | null }[] => {
      if (!Array.isArray(raw)) return [];
      return raw
        .map((item) => {
          if (typeof item === "number") return { documentId: item, documentType: null };
          if (typeof item === "object" && item !== null && typeof item.documentId === "number") {
            return { documentId: item.documentId, documentType: item.documentType ?? null };
          }
          return null;
        })
        .filter(Boolean) as { documentId: number; documentType: string | null }[];
    };

    const allDocumentIds = Array.from(
      new Set(
        claims.flatMap((claim) =>
          normalizeDocumentIds(claim.documentIds).map((d) => d.documentId),
        ),
      ),
    );

    const fileUploads =
      await this.companyEmployeeRepository.getFileUploadsByIds(allDocumentIds);
    const fileUploadMap = new Map(fileUploads.map((file) => [file.id, file]));

    return claims.flatMap((claim) => {
      const claimDocs = normalizeDocumentIds(claim.documentIds);

      return claimDocs
        .map(({ documentId, documentType }) => {
          const fileUpload = fileUploadMap.get(documentId);
          if (!fileUpload) {
            return null;
          }

          const claimTitle = claim.claimNumber
            ? `Claim Intimation - ${claim.claimNumber}`
            : `Claim Intimation - ${claim.id}`;
          const patientSummary = [claim.patientName, claim.patientRelation]
            .filter(Boolean)
            .join(" - ");

          return {
            id: `claim-${claim.id}-${documentId}`,
            policyId: claim.policyId,
            policyName: policyNames[claim.policyId] ?? claim.policyType ?? null,
            documentId: fileUpload.id,
            fileName: this.getDisplayFileName(fileUpload, "Claim document"),
            fileStatus: fileUpload.status ?? "ACTIVE",
            uploadedAt: fileUpload.createdAt ?? claim.createdAt ?? null,
            uploadedBy: fileUpload.createdBy ?? null,
            uploadedByName: this.buildUploadedByName(fileUpload),
            featureType: "claim_intimation",
            title: claimTitle,
            subtitle: documentType
              ? patientSummary
                ? `${patientSummary} | ${documentType}`
                : documentType
              : patientSummary || "Claim supporting document",
            documentType,
            sourceId: claim.id,
            sourceLabel: claim.claimNumber ?? null,
          };
        })
        .filter(Boolean);
    });
  }

  private async getLifeEventDocuments(
    employeeId: number,
    policyNames: Record<number, string | null>,
  ) {
    const dependents = await this.dependentRepo.find({
      where: {
        employeeId,
        // Only include life-event dependents/actions. We also include soft-deleted
        // records so "deletion" life-event proofs continue to show in My Documents.
        isLifeEvent: true,
      },
      withDeleted: true,
      order: { updatedAt: "DESC" },
    });

    const documentIds = Array.from(
      new Set(
        dependents.flatMap((dependent) =>
          Array.isArray(dependent.documentIds) ? dependent.documentIds : [],
        ),
      ),
    );

    const fileUploads =
      await this.companyEmployeeRepository.getFileUploadsByIds(documentIds);
    const fileUploadMap = new Map(fileUploads.map((file) => [file.id, file]));

    return dependents.flatMap((dependent) => {
      const dependentDocumentIds = Array.isArray(dependent.documentIds)
        ? dependent.documentIds
        : [];

      const lifeEventAction = dependent.deletedAt ? "DELETE" : "ADD";
      return dependentDocumentIds
        .map((documentId) => {
          const fileUpload = fileUploadMap.get(documentId);
          if (!fileUpload) {
            return null;
          }

          const relationLabel = dependent.relation || dependent.relationshipType || "Dependent";

          return {
            id: `life-event-${dependent.id}-${documentId}`,
            policyId: dependent.policyId,
            policyName: policyNames[dependent.policyId] ?? null,
            documentId: fileUpload.id,
            fileName: this.getDisplayFileName(fileUpload, "Life event document"),
            fileStatus: fileUpload.status ?? "ACTIVE",
            uploadedAt: fileUpload.createdAt ?? dependent.updatedAt ?? null,
            uploadedBy: fileUpload.createdBy ?? null,
            uploadedByName: this.buildUploadedByName(fileUpload),
            featureType: "life_event",
            lifeEventAction,
            title: `Life Event - ${dependent.name || "Dependent"}`,
            subtitle: `${relationLabel}${policyNames[dependent.policyId] ? ` - ${policyNames[dependent.policyId]}` : ""}`,
            sourceId: dependent.id,
            sourceLabel: dependent.name ?? null,
          };
        })
        .filter(Boolean);
    });
  }

  private async getRaiseTicketDocuments(
    employeeId: number,
    policyNames: Record<number, string | null>,
  ) {
    const tickets = await this.companyEmployeeRepository.getTicketsByEmployeeId(
      employeeId,
      { page: 1, limit: 1000 }, // Get all tickets for the employee with pagination
    );

    const allDocumentIds = Array.from(
      new Set(
        tickets.tickets.flatMap((ticket) =>
          Array.isArray(ticket.documentIds) ? ticket.documentIds : [],
        ),
      ),
    );

    const fileUploads =
      await this.companyEmployeeRepository.getFileUploadsByIds(allDocumentIds);
    const fileUploadMap = new Map(fileUploads.map((file) => [file.id, file]));

    return tickets.tickets.flatMap((ticket) => {
      const ticketDocumentIds = Array.isArray(ticket.documentIds)
        ? ticket.documentIds
        : [];

      return ticketDocumentIds
        .map((documentId) => {
          const fileUpload = fileUploadMap.get(documentId);
          if (!fileUpload) {
            return null;
          }

          const ticketTitle = ticket.ticketId
            ? `Support Ticket - ${ticket.ticketId}`
            : `Support Ticket - ${ticket.id}`;

          return {
            id: `raise-ticket-${ticket.id}-${documentId}`,
            policyId: null, // Tickets are not policy-specific
            policyName: null,
            documentId: fileUpload.id,
            fileName: this.getDisplayFileName(fileUpload, "Support ticket document"),
            fileStatus: fileUpload.status ?? "ACTIVE",
            uploadedAt: fileUpload.createdAt ?? ticket.createdAt ?? null,
            uploadedBy: fileUpload.createdBy ?? null,
            uploadedByName: this.buildUploadedByName(fileUpload),
            featureType: "raise_ticket",
            title: ticketTitle,
            subtitle: `${ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)} - ${ticket.status.toUpperCase()}`,
            categoryType: ticket.category,
            status: ticket.status,
            sourceId: ticket.id,
            sourceLabel: ticket.ticketId ?? null,
          };
        })
        .filter(Boolean);
    });
  }

  private async getPersonalDocuments(employeeId: number) {
    const employee = await this.companyEmployeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      return [];
    }

    const storedDocuments = Array.isArray(employee.documentIds)
      ? (employee.documentIds as Record<string, any>[])
      : [];

    const normalizedDocuments = storedDocuments
      .map((document) => {
        const documentId = Number(document?.id ?? document?.documentId ?? document?.fileId);
        if (!Number.isFinite(documentId)) {
          return null;
        }

        return {
          id: documentId,
          fileName: document?.fileName ?? null,
          fileKey: document?.fileKey ?? null,
          companyType: document?.companyType ?? "company",
          companyId: document?.companyId ?? employee.companyId ?? null,
          documentTypeLid:
            document?.documentTypeLid != null
              ? Number(document.documentTypeLid)
              : null,
          fileSize: document?.fileSize ?? null,
        };
      })
      .filter(Boolean) as Array<{
      id: number;
      fileName: string | null;
      fileKey: string | null;
      companyType: string;
      companyId: number | null;
      documentTypeLid: number | null;
      fileSize: string | number | null;
    }>;

    if (!normalizedDocuments.length) {
      return [];
    }

    const fileUploads = await this.companyEmployeeRepository.getFileUploadsByIds(
      normalizedDocuments.map((document) => document.id),
    );
    const fileUploadMap = new Map(fileUploads.map((file) => [file.id, file]));

    return normalizedDocuments
      .map((document) => {
        const fileUpload = fileUploadMap.get(document.id);
        const fileName =
          document.fileName ?? this.getDisplayFileName(fileUpload, "Personal Document");

        return {
          id: `personal-${document.id}`,
          policyId: null,
          policyName: "Personal Documents",
          documentId: document.id,
          fileName,
          fileStatus: fileUpload?.status ?? "ACTIVE",
          uploadedAt: fileUpload?.createdAt ?? employee.updatedAt ?? null,
          uploadedBy: fileUpload?.createdBy ?? null,
          uploadedByName: this.buildUploadedByName(fileUpload),
          featureType: "personal_document",
          title: fileName,
          subtitle: "Personal Documents",
          documentType: "personal_document",
          sourceId: document.id,
          sourceLabel: fileName,
        };
      })
      .filter(Boolean);
  }

  async getLocationData(policyId: number, state?: string) {
    return getPolicyLocationData({
      repository: this.companyEmployeeRepository,
      policyId,
      state,
      logger: this.logger,
      traceIdService: this.traceIdService,
    });
  }

  async getLocationDataByPolicyIds(policyIds: number[], state?: string) {
    return getPolicyLocationDataByPolicyIds({
      repository: this.companyEmployeeRepository,
      policyIds,
      state,
      logger: this.logger,
      traceIdService: this.traceIdService,
    });
  }

  private buildClaimSummary(
    claim: PolicyClaim,
    employee?: PolicyEnrollmentEmployee,
  ): { summary: ClaimSummaryDto; isParent: boolean } {
    const memberName =
      claim.dependent?.name ??
      claim.employee?.employeeName ??
      employee?.employeeName ??
      "Self";
    const isParent = this.isParentClaim(claim);
    const relation = isParent
      ? PARENT_RELATIONSHIP_TYPES.PARENTS
      : claim.dependent?.relation ?? "Self";
    const documentsLabel =
      claim.claimChecklistCount && claim.claimChecklistCount > 0
        ? `${claim.claimChecklistCount} document${
            claim.claimChecklistCount > 1 ? "s" : ""
          }`
        : null;
    const claimAmount =
      claim.claimAmount !== undefined && claim.claimAmount !== null
        ? Number(claim.claimAmount)
        : 0;
    const claimDate =
      this.formatDateString(claim.claimDate) ??
      this.formatDateString(claim.claimDateOfAdmission) ??
      null;
    const updatedAt = claim.updatedAt
      ? formatDateWithTime(new Date(claim.updatedAt))
      : null;
    const claimSettledAmount = (claim.settlements ?? []).reduce(
      (sum, settlement) => sum + Number(settlement.settlementAmount ?? 0),
      0,
    );
    const summary: ClaimSummaryDto = {
      claimId: claim.id,
      memberName,
      relation,
      claimNumber:
        claim.claimNumber ?? claim.claimInsuredId ?? String(claim.id),
      claimDate,
      updatedAt,
      claimAmount,
      documentsLabel,
      status: claim.claimStatus ?? null,
      claimSettledAmount: this.safeNumber(claimSettledAmount),
      claimDescription: claim.claimDescription ?? null,
      tpaClaimNo: claim.tpaClaimNo ?? null,
    };
    return {
      summary,
      isParent,
    };
  }

  private sumClaimAmounts(claims: ClaimSummaryDto[]): number {
    return claims.reduce((sum, claim) => sum + (claim.claimAmount ?? 0), 0);
  }

  private sumSettledAmounts(claims: ClaimSummaryDto[]): number {
    return claims.reduce((sum, claim) => {
      if (!this.isSettledClaimStatus(claim.status)) {
        return sum;
      }
      return sum + (claim.claimSettledAmount ?? 0);
    }, 0);
  }

  private deriveClaimStatusCounts(
    claims: ClaimSummaryDto[],
  ): ClaimStatusCountsDto {
    return claims.reduce(
      (acc, claim) => {
        acc.total += 1;
        const normalizedStatus = this.normalizeClaimStatusValue(claim.status);
        switch (normalizedStatus) {
          case "SETTLED":
          case "APPROVED":
            acc.settled += 1;
            break;
          case "INPROGRESS":
          case "PENDING":
            acc.inProgress += 1;
            break;
          default:
            break;
        }
        return acc;
      },
      { total: 0, settled: 0, inProgress: 0 },
    );
  }

  private calculatePolicyComponentSumInsured(
    components: PolicyEmployeeEnrollmentChoice[],
  ): { baseSumInsured: number; parentalSumInsured: number } {
    if (!components.length) {
      return { baseSumInsured: 0, parentalSumInsured: 0 };
    }
    const baseComponents = components.filter((component) =>
      this.isComponentType(component, "base"),
    );
    const parentalComponents = components.filter((component) =>
      this.isComponentType(component, "parental"),
    );
    const optionalComponents = components.filter((component) =>
      this.isComponentType(component, "optional"),
    );

    const baseIds = new Set(
      baseComponents
        .map((component) => component.policyComponentActionTypeId)
        .filter((id): id is number => id !== undefined && id !== null),
    );
    const parentalIds = new Set(
      parentalComponents
        .map((component) => component.policyComponentActionTypeId)
        .filter((id): id is number => id !== undefined && id !== null),
    );

    const baseSum =
      this.sumComponentSumInsured(baseComponents) +
      this.sumOptionalAddons(optionalComponents, baseIds);
    const parentalSum =
      this.sumComponentSumInsured(parentalComponents) +
      this.sumOptionalAddons(optionalComponents, parentalIds);

    return {
      baseSumInsured: baseSum,
      parentalSumInsured: parentalSum,
    };
  }

  private sumComponentSumInsured(
    components: PolicyEmployeeEnrollmentChoice[],
  ): number {
    return components.reduce(
      (sum, component) => sum + Number(component.sumInsured ?? 0),
      0,
    );
  }

  private sumOptionalAddons(
    optionalComponents: PolicyEmployeeEnrollmentChoice[],
    parentIds: Set<number>,
  ): number {
    return optionalComponents.reduce((sum, component) => {
      if (
        !component.parentpolicyComponentActionTypeId ||
        !parentIds.has(component.parentpolicyComponentActionTypeId)
      ) {
        return sum;
      }
      return sum + Number(component.sumInsured ?? 0);
    }, 0);
  }

  private isComponentType(
    component: PolicyEmployeeEnrollmentChoice,
    policyType: string,
  ): boolean {
    return (
      (component.policyComponentActionType ?? "").toLowerCase().trim() ===
      policyType.toLowerCase()
    );
  }

  private buildPolicyContactMatrixResponse(
    policyId: number,
    metrics: PolicyContactMetric[],
  ): PolicyContactMatrixResponseDto {
    const updatedAt =
      metrics.length > 0
        ? new Date(
            Math.max(
              ...metrics.map((metric) =>
                metric.updatedAt ? metric.updatedAt.getTime() : 0,
              ),
            ),
          )
        : undefined;

    return {
      policyId,
      updatedAt,
      contacts: {
        tpa: this.buildPartyContacts(metrics, "TPA"),
        insurer: this.buildPartyContacts(metrics, "INSURER"),
      },
    };
  }

  private buildPartyContacts(
    metrics: PolicyContactMetric[],
    partyType: "TPA" | "INSURER",
  ): PolicyContactMatrixPartyDto {
    const partyMetrics = metrics.filter(
      (metric) => metric.partyType === partyType,
    );

    return partyMetrics.reduce((result, metric) => {
      const contactDto = this.mapMetricToLightContact(metric);
      if (!contactDto) {
        return result;
      }

      if (metric.contactLevel === "PRIMARY") {
        result.primary = contactDto;
      } else if (metric.contactLevel === "SECONDARY") {
        result.secondary = contactDto;
      }
      return result;
    }, {} as PolicyContactMatrixPartyDto);
  }

  private mapMetricToLightContact(
    metric: PolicyContactMetric,
  ): PolicyContactMatrixLightContactDto | undefined {
    const contact = metric.contact;
    if (!contact) return undefined;

    const communications = contact.communicationDetails ?? [];
    const phone = communications.find((detail) =>
      detail.communicationType?.toLowerCase().includes("phone"),
    );
    const email = communications.find((detail) =>
      detail.communicationType?.toLowerCase().includes("email"),
    );

    return {
      contactId: contact.id ?? 0,
      displayName: contact.displayName,
      firstName: contact.firstName,
      lastName: contact.lastName,
      designation: contact.designation ?? undefined,
      department: contact.department ?? undefined,
      phone: phone?.communicationDetails ?? "",
      email: email?.communicationDetails ?? "",
    };
  }

  private formatDateString(value?: Date | string | null): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  async getEmployeeECardDetails(
    employeeId: number,
  ): Promise<EmployeeECardResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IBP CompanyEmployeeService",
        method: "getEmployeeECardDetails",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    const employee =
      await this.companyEmployeeRepository.getEmployeeECardBase(employeeId);
    if (!employee) {
      throw new NotFoundException(errorMessages.employeeNotFound);
    }

    const [policyMaps, dependents] = await Promise.all([
      this.companyEmployeeRepository.getEmployeeECardPolicies(employeeId),
      this.companyEmployeeRepository.getDependentsByEmployeeId(employeeId),
    ]);

    const dependentsByPolicyId = new Map<number, PolicyEnrollmentDependent[]>();
    dependents.forEach((dependent) => {
      const list = dependentsByPolicyId.get(dependent.policyId) ?? [];
      list.push(dependent);
      dependentsByPolicyId.set(dependent.policyId, list);
    });

    const employeeDob = this.formatDateString(employee.dateOfBirth) ?? null;
    const employeeCompanyId = employee.companyEmployeeId ?? null;

    console.log("[getEmployeeECardDetails] policyMaps count:", policyMaps.length);
    console.log("[getEmployeeECardDetails] policy types found:", policyMaps.map(m => m.policy?.policyType?.lookUpKey));

    const allPolicyIds = Array.from(
      new Set(
        policyMaps
          .map((map) => map.policy?.id)
          .filter((id): id is number => typeof id === "number"),
      ),
    );

    const insurerLogoMap = new Map<number, number | null>();
    if (allPolicyIds.length > 0) {
      try {
        const policyParties = await Promise.all(
          allPolicyIds.map(async (policyId) => ({
            policyId,
            parties:
              await this.companyEmployeeRepository.getPolicyPrimaryPartyDetails(
                policyId,
              ),
          })),
        );

        policyParties.forEach(({ policyId, parties }) => {
          const insurerId = parties.insurer?.id;
          const logoFileId = parties.insurer?.logoFileId ?? null;
          if (insurerId) {
            insurerLogoMap.set(policyId, logoFileId);
          }
        });
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "IBP CompanyEmployeeService",
            method: "getEmployeeECardDetails",
            messageData: error,
          }),
        });
      }
    }

    const ecarddata: EmployeeECardItemDto[] = [];
    policyMaps.forEach((map) => {
      const policy = map.policy;
      const policyId = policy?.id ?? map.policyId;
      const policyDependents = dependentsByPolicyId.get(policyId) ?? [];
      const policyNumber = policy?.insurerPolicyNumber ?? null;
      const companyName = policy?.company?.displayName ?? null;
      const policyFrom = this.formatDateString(policy?.policyFrom) ?? null;
      const policyTo = this.formatDateString(policy?.policyTo) ?? null;
      const insurerLogoFileId = insurerLogoMap.get(policyId) || null;
      const employeeTpaId = map.employeeTpaId ?? null;

      ecarddata.push({
        policyId,
        policyNumber,
        companyName,
        insurerLogoFileId,
        tpaId: employeeTpaId,
        gender: employee.gender ?? null,
        name: employee.fullName ?? employee.employeeName ?? null,
        policyFrom,
        policyTo,
        dateOfBirth: employeeDob,
        relation: "Self",
        companyEmployeeId: employeeCompanyId,
      });

      policyDependents.forEach((dependent) => {
        ecarddata.push({
          policyId,
          policyNumber,
          companyName,
          insurerLogoFileId,
          tpaId: dependent.dependentTpaId ?? null,
          gender: dependent.gender ?? null,
          name: dependent.name ?? null,
          policyFrom,
          policyTo,
          dateOfBirth: this.formatDateString(dependent.dateOfBirth) ?? null,
          relation: dependent.relation ?? dependent.relationshipType ?? null,
          companyEmployeeId: employeeCompanyId,
        });
      });
    });

    return {
      employeeId,
      ecarddata,
    };
  }

  async getPolicyTpaAppKey(
    policyId: number,
    apiType: string,
    isDependent = false,
  ): Promise<{ appKey: string; dynamicFields: Record<string, string>; ecardResponseMode: string | null } | null> {
    console.log(`[TpaAppKey] ── START policyId=${policyId} apiType=${apiType} isDependent=${isDependent}`);
    const row = await this.dataSource
      .createQueryBuilder()
      // SELECT — TypeORM translates entity property names to column names here
      .select("ear.label", "appKey")
      .addSelect("ear.ecardResponseMode", "ecardResponseMode")
      .addSelect("ear.individualEcardAppRefId", "individualEcardAppRefId")
      .addSelect("p.insurerPolicyNumber", "policyNo")
      .addSelect("p.policyFrom", "policyFrom")
      .addSelect("p.policyTo", "policyTo")
      .addSelect("p.externalTpaPolicyId", "groupCode")
      .addSelect("cfg.dynamic_param_mapping", "dynamicParamMapping")
      // FROM + JOINs — entity classes register metadata for SELECT translation
      // Condition strings use real DB column names (TypeORM does NOT auto-translate those)
      .from(Policy, "p")
      .innerJoin(PolicyTpaMap, "ptm", "ptm.policy_id = p.id")
      .innerJoin(
        "tpa_external_feature_config",
        "cfg",
        // Match by api_type (worker-style configs) OR by feature_type key (IBP button-style configs)
        `cfg.tpa_id = ptm.tpa_id AND cfg.is_active = true AND (
          cfg.api_type = :apiType
          OR (cfg.api_type IS NULL AND EXISTS (
            SELECT 1 FROM mstr_tpa_feature_type ft
            WHERE ft.id = cfg.feature_type_id AND UPPER(ft.key) = UPPER(:apiType)
          ))
        )`,
        { apiType },
      )
      .innerJoin(
        MstrExtApplicationRef,
        "ear",
        "ear.id = cfg.app_ref_id AND ear.is_active = true",
      )
      .where("p.id = :policyId", { policyId })
      .limit(1)
      .getRawOne<{
        appKey: string;
        individualEcardAppRefId: number | null;
        ecardResponseMode: string | null;
        policyNo: string;
        policyFrom: string | Date;
        policyTo: string | Date;
        groupCode: string | null;
        dynamicParamMapping: Record<string, string> | null;
      }>();

    if (!row) {
      console.warn(`[TpaAppKey] ── NO ROW FOUND policyId=${policyId} apiType=${apiType} — check: 1) policy_tpa_map has row for this policy, 2) tpa_external_feature_config has active row for that tpa_id with matching api_type or feature_type key, 3) mstr_ext_application_ref is active`);
      return null;
    }

    console.log(`[TpaAppKey] ── ROW FOUND policyId=${policyId} apiType=${apiType} appKey="${row.appKey}" policyNo="${row.policyNo}" dynamicParamMapping=${JSON.stringify(row.dynamicParamMapping)} individualEcardAppRefId=${row.individualEcardAppRefId}`);

    // Two-API e-card TPAs (e.g. Health India): a dependent's card comes from a different
    // app ref than the family/self one. Good Health/FHPL leave this column NULL and are
    // unaffected -- the family config's own appKey is used for everyone either way.
    let appKey = row.appKey;
    if (isDependent && apiType === "ECARD" && row.individualEcardAppRefId) {
      const individualRef = await this.dataSource
        .getRepository(MstrExtApplicationRef)
        .findOne({
          where: { id: row.individualEcardAppRefId, isActive: true },
          select: ["label"],
        });
      if (individualRef?.label) {
        console.log(`[TpaAppKey] ── DEPENDENT → using linked individual e-card appKey="${individualRef.label}" (was "${row.appKey}")`);
        appKey = individualRef.label;
      } else {
        console.warn(`[TpaAppKey] ── individualEcardAppRefId=${row.individualEcardAppRefId} set but not found/inactive — falling back to family appKey="${row.appKey}"`);
      }
    }

    const toDateStr = (val: string | Date | null | undefined): string => {
      if (!val) return "";
      const d = val instanceof Date ? val : new Date(val);
      return d.toISOString().slice(0, 10);
    };

    // Base fields derived from policy record
    const dynamicFields: Record<string, string> = {
      policyNo: row.policyNo ?? "",
      policyStartDate: toDateStr(row.policyFrom),
      policyEndDate: toDateStr(row.policyTo),
    };
    if (row.groupCode) dynamicFields.groupCode = row.groupCode;

    // Merge per-TPA-feature custom placeholder mappings configured in iWork.
    // These override base fields if keys collide (admin intent takes priority).
    if (row.dynamicParamMapping && typeof row.dynamicParamMapping === "object") {
      Object.assign(dynamicFields, row.dynamicParamMapping);
    }

    console.log(`[TpaAppKey] ── DONE appKey="${appKey}" dynamicFields=${JSON.stringify(dynamicFields)} ecardResponseMode=${row.ecardResponseMode}`);
    return { appKey, dynamicFields, ecardResponseMode: row.ecardResponseMode };
  }

  async getEmployeeECardSignedUrl(
    companyId: number,
    companyEmployeeId: string,
  ): Promise<EmployeeECardSignedUrlResponseDto> {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new BadRequestException("companyId is required");
    }
    if (!companyEmployeeId || !companyEmployeeId.trim()) {
      throw new BadRequestException("companyEmployeeId is required");
    }

    const key = `uploads/e-cards/company/${companyId}/${companyEmployeeId}.pdf`;
    const exists = await checkS3KeyExists(key);
    if (!exists) {
      throw new NotFoundException("No such key found for E-Card");
    }

    const signedUrl = await getSignedUrl(key, {
      expiresSeconds: 300,
      responseContentDisposition: "inline",
    });
    const downloadUrl = await getSignedUrl(key, {
      expiresSeconds: 300,
      responseContentDisposition: `attachment; filename="${companyEmployeeId}.pdf"`,
    });

    return { key, signedUrl, downloadUrl };
  }

  async getEmployeeECardPdfStream(companyId: number, companyEmployeeId: string) {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new BadRequestException("companyId is required");
    }
    if (!companyEmployeeId || !companyEmployeeId.trim()) {
      throw new BadRequestException("companyEmployeeId is required");
    }
    if (companyEmployeeId.includes("/") || companyEmployeeId.includes("..")) {
      throw new BadRequestException("Invalid companyEmployeeId");
    }

    const key = `uploads/e-cards/company/${companyId}/${companyEmployeeId}.pdf`;
    const fileResult = await getFileStreamFromStorage(key, {
      repoMode: "AWS",
      bucket: this.bucket,
      region: ENV.S3_AWS_REGION,
      docRepoPath: this.docRepoPath,
      logger: this.logger,
    });

    return {
      stream: fileResult.stream,
      mimeType: fileResult.mimeType || "application/pdf",
      contentLength: fileResult.contentLength,
      fileName: `${companyEmployeeId}.pdf`,
    };
  }

  private safeNumber(value: unknown): number {
    const num = Number(value ?? DEFAULT_TOTAL_KPI_COUNT);
    return Number.isFinite(num) ? num : DEFAULT_TOTAL_KPI_COUNT;
  }

  private getPolicyTabLabel(policyType: string): string {
    const normalized = policyType.toUpperCase();
    if (normalized === "GMC") {
      return "GMC (Group Mediclaim)";
    }
    if (normalized === "GPA") {
      return "GPA (Group Personal Accident)";
    }
    if (normalized === "GTL") {
      return "GTL (Group Term Life)";
    }
    return policyType;
  }

  private normalizeClaimStatusValue(status?: string | null): string | null {
    if (!status) return null;
    const normalized = status
      .toString()
      .trim()
      .replace(/[\s\-_]+/g, "")
      .toUpperCase();
    return normalized || null;
  }

  private isSettledClaimStatus(status?: string | null): boolean {
    const normalizedStatus = this.normalizeClaimStatusValue(status);
    return normalizedStatus === "SETTLED" || normalizedStatus === "APPROVED";
  }

  private isParentRelation(relationshipType?: string): boolean {
    if (!relationshipType) return false;
    const normalized = relationshipType.trim().toLowerCase();
    return (
      normalized === PARENT_RELATIONSHIP_TYPES.PARENT ||
      normalized === PARENT_RELATIONSHIP_TYPES.PARENTS
    );
  }

  private isParentClaim(claim: PolicyClaim): boolean {
    return this.isParentRelation(claim.dependent?.relationshipType);
  }

  async fetchUserActivityLogs(userId?: number, employeeId?: number, activityKey?: string) {
    try {
      // An explicit employeeId always means "give me THIS employee's logs" —
      // e.g. an HR admin viewing someone else's profile. The previous
      // isDetached heuristic compared the requester's own userId (from the
      // auth header) against employeeId (policy_enrollment_employee.id) —
      // two unrelated id spaces that essentially never coincidentally match,
      // so it silently fell through to the requester's OWN logs instead of
      // the target employee's, returning an empty list.
      if (employeeId && Number.isFinite(employeeId)) {
        return await this.companyEmployeeRepository.getMailActivityLogsByEmployeeId(employeeId, activityKey);
      }
      const validUserId = userId && Number.isFinite(userId) ? userId : undefined;
      return await this.companyEmployeeRepository.getUserActivityLogs(validUserId, activityKey);
    } catch (error) {
      throw new Error("Failed to fetch user activity logs: " + (error instanceof Error ? error.message : String(error)));
    }
  }

  async createUserActivityLog(params: CreateUserActivityLogParams) {
    try {
      return await this.companyEmployeeRepository.createUserActivityLog(params);
    } catch (error) {
      throw new Error(
        "Failed to create user activity log: " +
        (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async fetchNotificationInfoById(id: number, userId?: number) {
    try {
      const notificationInfo =
        await this.companyEmployeeRepository.getNotificationInfoById(id, userId);

      if (!notificationInfo) {
        throw new NotFoundException(`Notification info with ID ${id} not found`);
      }

      return {
        id: notificationInfo.id,
        toRecipients: notificationInfo.toRecipients,
        ccRecipients: notificationInfo.ccRecipients,
        fromSender: notificationInfo.fromSender,
        subject: notificationInfo.subject,
        notificationType: notificationInfo.notificationType,
        templateId: notificationInfo.templateId,
        variables: notificationInfo.variables,
        renderedHtml: notificationInfo.renderedHtml,
        provider: notificationInfo.provider,
        status: notificationInfo.status,
        providerMessageId: notificationInfo.providerMessageId,
        error: notificationInfo.error,
        createdAt: notificationInfo.createdAt,
        createdBy: notificationInfo.createdBy,
        sentAt: notificationInfo.sentAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        "Failed to fetch notification info: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async getEnrollmentProgress(
    employeeId: number,
    enrollmentBatchKey?: string
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'CompanyEmployeeService',
        method: 'getEnrollmentProgress',
        payload: { employeeId, enrollmentBatchKey },
        messageData: 'method invoked',
      }),
    });

    const employee = await this.companyEmployeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const enrollmentProgress = employee.enrollmentProgress || {
      sessions: [],
      activeEnrollmentBatchKey: null,
    };

    const sessions = enrollmentProgress.sessions || [];
    const activeKey = enrollmentProgress.activeEnrollmentBatchKey;

    let targetSession = null;
    if (enrollmentBatchKey) {
      targetSession = sessions.find(
        (s: any) => s.enrollmentBatchKey === enrollmentBatchKey
      );
    } else if (activeKey) {
      targetSession = sessions.find((s: any) => s.enrollmentBatchKey === activeKey);
    }

    if (!targetSession) {
      return {
        employeeId,
        enrollmentBatchKey: null,
        policyIds: [],
        currentStep: 0,
        completionPercentage: 0,
        steps: [],
        allSessions: sessions,
      };
    }

    const steps = targetSession.steps || {};
    const stepList = [
      { step: 1, name: 'login', completed: steps.login?.completed || false },
      {
        step: 2,
        name: 'reviewBenefits',
        completed: steps.reviewBenefits?.completed || false,
      },
      {
        step: 3,
        name: 'addDependents',
        completed: steps.addDependents?.completed || false,
      },
      {
        step: 4,
        name: 'selectTopUps',
        completed: steps.selectTopUps?.completed || false,
      },
      {
        step: 5,
        name: 'submitEnrollment',
        completed: steps.submitEnrollment?.completed || false,
      },
      {
        step: 6,
        name: 'receiveConfirmation',
        completed: steps.receiveConfirmation?.completed || false,
      },
    ];

    const completedSteps = stepList.filter((s) => s.completed).length;
    const currentStep = targetSession.currentStep || completedSteps + 1;
    const completionPercentage = Math.round((completedSteps / 6) * 100);

    const stepsWithCurrent = stepList.map((s) => ({
      ...s,
      current: s.step === currentStep,
    }));

    return {
      employeeId,
      enrollmentBatchKey: targetSession.enrollmentBatchKey,
      policyIds: targetSession.policyIds || [],
      currentStep,
      completionPercentage,
      steps: stepsWithCurrent,
      allSessions: sessions,
    };
  }

  async updateEnrollmentProgress(
    employeeId: number,
    enrollmentBatchKey: string,
    stepName: string,
    completed = true,
    policiesCompleted?: number[]
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'CompanyEmployeeService',
        method: 'updateEnrollmentProgress',
        payload: { employeeId, enrollmentBatchKey, stepName, completed },
        messageData: 'method invoked',
      }),
    });

    const employee = await this.companyEmployeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const enrollmentProgress = employee.enrollmentProgress || {
      sessions: [],
      activeEnrollmentBatchKey: null,
    };

    const sessions = enrollmentProgress.sessions || [];
    let session = sessions.find(
      (s: any) => s.enrollmentBatchKey === enrollmentBatchKey
    );

    if (!session) {
      throw new NotFoundException(
        `Enrollment session with key ${enrollmentBatchKey} not found`
      );
    }

    if (!session.steps) {
      session.steps = {
        login: { completed: false },
        reviewBenefits: { completed: false },
        addDependents: { completed: false },
        selectTopUps: { completed: false },
        submitEnrollment: { completed: false },
        receiveConfirmation: { completed: false },
      };
    }

    const stepData: any = { completed };
    if (completed) {
      stepData.completedAt = new Date().toISOString();
    }
    if (policiesCompleted && policiesCompleted.length > 0) {
      stepData.policiesCompleted = policiesCompleted;
    }

    session.steps[stepName] = stepData;

    const stepOrder = [
      'login',
      'reviewBenefits',
      'addDependents',
      'selectTopUps',
      'submitEnrollment',
      'receiveConfirmation',
    ];
    let currentStepIndex = 0;
    for (let i = 0; i < stepOrder.length; i++) {
      if (session.steps[stepOrder[i]]?.completed) {
        currentStepIndex = i + 1;
      } else {
        break;
      }
    }
    session.currentStep = Math.min(currentStepIndex + 1, 6);

    if (stepName === 'receiveConfirmation' && completed) {
      session.completedAt = new Date().toISOString();
      session.active = false;
    }

    await this.companyEmployeeRepo.update(employeeId, {
      enrollmentProgress,
    });

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'CompanyEmployeeService',
        method: 'updateEnrollmentProgress',
        payload: { employeeId, stepName, currentStep: session.currentStep },
        messageData: 'Enrollment progress updated successfully',
      }),
    });

    return this.getEnrollmentProgress(employeeId, enrollmentBatchKey);
  }

  async initializeEnrollmentProgress(employeeId: number, policyIds: number[]) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'CompanyEmployeeService',
        method: 'initializeEnrollmentProgress',
        payload: { employeeId, policyIds },
        messageData: 'method invoked',
      }),
    });

    const employee = await this.companyEmployeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const sortedPolicyIds = [...policyIds].sort((a, b) => a - b);
    const enrollmentBatchKey = `enroll:${employeeId}:${sortedPolicyIds.join('_')}:${Date.now()}`;

    const newSession = {
      enrollmentBatchKey,
      policyIds: sortedPolicyIds,
      startedAt: new Date().toISOString(),
      completedAt: null,
      steps: {
        login: { completed: true, completedAt: new Date().toISOString() },
        reviewBenefits: { completed: false },
        addDependents: { completed: false },
        selectTopUps: { completed: false },
        submitEnrollment: { completed: false },
        receiveConfirmation: { completed: false },
      },
      active: true,
      currentStep: 2,
    };

    const enrollmentProgress = employee.enrollmentProgress || {
      sessions: [],
      activeEnrollmentBatchKey: null,
    };

    const sessions = enrollmentProgress.sessions || [];
    sessions.forEach((s: any) => {
      s.active = false;
    });
    sessions.push(newSession);

    enrollmentProgress.sessions = sessions;
    enrollmentProgress.activeEnrollmentBatchKey = enrollmentBatchKey;

    await this.companyEmployeeRepo.update(employeeId, {
      enrollmentProgress,
    });

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'CompanyEmployeeService',
        method: 'initializeEnrollmentProgress',
        payload: { employeeId, enrollmentBatchKey },
        messageData: 'Enrollment progress initialized successfully',
      }),
    });

    return {
      enrollmentBatchKey,
      policyIds: sortedPolicyIds,
      currentStep: 2,
    };
  }

  /**
   * Extends an enrollment period's end date. A period card on the HR Portal
   * "Enrolment Status" page can span multiple policies (each backed by its
   * own document_processing_file row, one per policy/endorsement) — periodIds
   * carries every one of those rows so they all get pushed to the same new
   * end date together, along with every employee's individual enrollment
   * window for that policy+batch in policy_enrollment_employee_policy_map.
   */
  async extendEnrollmentPeriod(
    companyId: number,
    periodIds: number[],
    newEndDate: string,
  ): Promise<{ updatedPeriods: number; updatedEmployeeMappings: number; newEndDate: string }> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'CompanyEmployeeService',
        method: 'extendEnrollmentPeriod',
        payload: { companyId, periodIds, newEndDate },
        messageData: 'method invoked',
      }),
    });

    try {
      if (!periodIds || periodIds.length === 0) {
        throw new BadRequestException('periodIds is required');
      }

      const parsedNewEndDate = new Date(newEndDate);
      if (Number.isNaN(parsedNewEndDate.getTime())) {
        throw new BadRequestException('newEndDate is invalid');
      }

      const result = await this.companyEmployeeRepository.extendEnrollmentPeriod(
        companyId,
        periodIds,
        parsedNewEndDate,
      );

      // The Enrolment Status page's report result is cached server-side for 90s
      // (HrService.resultCache) — without this, a client refetch right after a
      // successful extend would keep serving the pre-extend dates until that
      // cache entry naturally expires.
      this.hrService.invalidateReportCache('policy_enrollment_period_status_summary');

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'CompanyEmployeeService',
          method: 'extendEnrollmentPeriod',
          payload: { companyId, periodIds, ...result },
          messageData: 'Enrollment period(s) extended successfully',
        }),
      });

      return { ...result, newEndDate };
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: 'extendEnrollmentPeriod',
          payload: { companyId, periodIds, newEndDate },
          status: 'failure',
          location: 'CompanyEmployeeService',
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }

  async intimateClaim(dto: IntimateClaimDto, authHeader: string): Promise<IntimateClaimResponseDto> {
    try {
      this.logInfo("intimateClaim", { message: "[STEP 1] Received claim intimation request", payload: dto });

      // 1. Validate and fetch policy with relations
      const policy = await this.policyRepo.findOne({
        where: { id: dto.policyId },
        relations: ['policyType', 'tpaMappings', 'policyStatus', 'company'],
      });

      if (!policy) {
        this.logError("intimateClaim", { message: `[STEP 1] FAIL — Policy ${dto.policyId} not found` });
        throw new BadRequestException(`Policy with ID ${dto.policyId} not found`);
      }

      const statusKey = policy.policyStatus?.lookUpKey ?? '';
      if (statusKey !== 'OPPORTUNITY_POLICY_STATUS_ACTIVE' && statusKey !== 'POLICY_STATUS_MIG_ACTIVE') {
        this.logError("intimateClaim", { message: `[STEP 1] FAIL — Policy ${dto.policyId} not active`, statusKey });
        throw new BadRequestException(`Policy ${dto.policyId} is not active`);
      }

      this.logInfo("intimateClaim", {
        message: "[STEP 1] Policy OK",
        policyId: policy.id,
        insurerPolicyNumber: policy.insurerPolicyNumber,
        statusKey,
      });

      // 2. Validate employee enrollment
      const employeeMapping = await this.employeePolicyMapRepo.findOne({
        where: { employeeId: dto.employeeId, policyId: dto.policyId },
      });

      if (!employeeMapping) {
        this.logError("intimateClaim", { message: `[STEP 2] FAIL — Employee ${dto.employeeId} not enrolled in policy ${dto.policyId}` });
        throw new BadRequestException(`Employee ${dto.employeeId} is not enrolled in policy ${dto.policyId}`);
      }

      const employee = await this.companyEmployeeRepo.findOne({ where: { id: dto.employeeId } });

      if (!employee) {
        this.logError("intimateClaim", { message: `[STEP 2] FAIL — Employee ${dto.employeeId} not found` });
        throw new BadRequestException(`Employee with ID ${dto.employeeId} not found`);
      }

      this.logInfo("intimateClaim", {
        message: "[STEP 2] Employee OK",
        employeeId: employee.id,
        employeeName: employee.employeeName,
        employeeTpaId: employeeMapping.employeeTpaId,
      });

      // 3. Dependent validation
      let dependent = null;
      let patientName = employee.employeeName;
      let patientRelation = 'SELF';
      let patientTpaId = employeeMapping.employeeTpaId;
      let dependentId = null;

      if (dto.dependentId) {
        dependent = await this.dependentRepo.findOne({
          where: { id: dto.dependentId, policyId: dto.policyId, employeeId: dto.employeeId },
        });

        if (!dependent) {
          this.logError("intimateClaim", { message: `[STEP 3] FAIL — Dependent ${dto.dependentId} not found` });
          throw new BadRequestException(`Dependent ${dto.dependentId} not found for employee ${dto.employeeId} in policy ${dto.policyId}`);
        }

        patientName = dependent.name;
        patientRelation = dependent.relation;
        patientTpaId = dependent.dependentTpaId;
        dependentId = dependent.id;
      }

      this.logInfo("intimateClaim", {
        message: "[STEP 3] Patient resolved",
        patientName,
        patientRelation,
        patientTpaId,
        isDependent: !!dto.dependentId,
      });

      // 4. Get PENDING status (used for SINGLE-flow TPAs and as the fallback status)
      const pendingStatus = await this.claimStatusRepo.findOne({ where: { status: 'PENDING' } });

      if (!pendingStatus) {
        this.logError("intimateClaim", { message: "[STEP 4] FAIL — PENDING status not configured" });
        throw new BadRequestException('PENDING claim status not configured in system');
      }

      // 5. Generate claim number
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000);
      const claimNumber = `CLM-${timestamp}-${randomNum}`;

      this.logInfo("intimateClaim", { message: "[STEP 5] Claim number generated", claimNumber });

      // 6. Get policyTpaId + resolve hospital
      const policyTpaId = policy.tpaMappings && policy.tpaMappings.length > 0
        ? policy.tpaMappings[0].tpaId
        : null;

      // Resolve appKey + claim_form_type + legacy_handler from tpa_external_feature_config
      // for this TPA before deciding whether to call TPA API and which flow to use.
      let resolvedAppKey: string | null = null;
      let claimFormType: 'SINGLE' | 'MULTI' = 'SINGLE';
      let legacyHandler: string | null = null;
      if (policyTpaId) {
        const configRows = await this.claimRepo.manager.query<{ label: string; claim_form_type: string | null; legacy_handler: string | null }[]>(`
          SELECT ear.label, cfg.claim_form_type, cfg.legacy_handler
          FROM   public.tpa_external_feature_config cfg
          JOIN   public.mstr_ext_application_ref    ear
                   ON ear.id = cfg.app_ref_id AND ear.is_active = true
          WHERE  cfg.tpa_id = $1 AND cfg.api_type = 'INTIMATE_CLAIM' AND cfg.is_active = true
          LIMIT  1
        `, [policyTpaId]);
        resolvedAppKey = configRows?.[0]?.label ?? null;
        claimFormType = configRows?.[0]?.claim_form_type === 'MULTI' ? 'MULTI' : 'SINGLE';
        legacyHandler = configRows?.[0]?.legacy_handler ?? null;
        console.log(`[CompanyEmployee:intimateClaim] TPA appKey resolution tpaId=${policyTpaId} resolved=${resolvedAppKey ?? "(none)"} claimFormType=${claimFormType} legacyHandler=${legacyHandler ?? "(none)"}`);
      }

      this.logInfo("intimateClaim", {
        message: "[STEP 6A] TPA appKey resolution",
        policyTpaId,
        resolvedAppKey,
        claimFormType,
        legacyHandler,
        willCallTpaApi: !!resolvedAppKey,
      });

      let resolvedHospitalName = dto.hospitalName ?? undefined;
      let resolvedHospitalLocation = dto.hospitalLocation ?? undefined;
      let resolvedHospital: any = null;

      if (dto.hospitalId) {
        resolvedHospital = await this.companyEmployeeRepository.getHospitalById(dto.hospitalId);
        if (resolvedHospital?.addresses) {
          const address = resolvedHospital.addresses as any;
          resolvedHospitalName = resolvedHospital.name ?? resolvedHospitalName;
          resolvedHospitalLocation = [
            address.addressLine1, address.addressLine2, address.landmark,
            address.cityName, address.stateName, address.pinCode, address.countryName,
          ].filter(Boolean).join(", ");
        }
      }

      this.logInfo("intimateClaim", {
        message: "[STEP 6] Hospital resolved",
        hospitalId: dto.hospitalId,
        resolvedHospitalName,
        resolvedHospitalLocation,
        externalHospitalId: resolvedHospital?.externalHospitalId ?? null,
        hospitalCity: (resolvedHospital?.addresses as any)?.cityName ?? null,
      });

      // 7. Build the TPA request payload — validated SYNCHRONOUSLY (same UX as
      // before: a missing/invalid field still fails immediately, before
      // anything is saved), but the actual TPA call is NO LONGER made here.
      // Fixes a real reliability gap: this used to call the TPA before
      // writing anything to our own DB, so a TPA-side failure (timeout,
      // outage, a claim raised on the policy's last valid day hitting some
      // TPA edge case) meant the claim was never stored anywhere at all,
      // even though the employee — OUR user, not the TPA's — successfully
      // submitted it through our application. Delivery is now queued as a
      // ClaimTpaSubmissionJob and attempted in the background by
      // ClaimTpaSubmissionScheduler (scheduler-service), with bounded
      // retries — see that entity for the full design.
      if (!resolvedAppKey) {
        this.logError("intimateClaim", {
          message: "[STEP 7] FAIL — No INTIMATE_CLAIM API URL configured for this TPA",
          policyTpaId,
        });
        throw new BadRequestException(
          `Claim intimation URL not found for this TPA${policyTpaId ? ` (TPA ID: ${policyTpaId})` : ''}. Please contact support.`,
        );
      }

      // Snapshot of everything ClaimTpaJobProcessor needs to actually call the
      // TPA later, independent of whether the source policy/employee/dependent
      // rows change in the meantime. Deliberately excludes authHeader — a
      // background job has no live user session token to safely reuse or
      // persist. NOTE: document-service's /external-app-sso/magic-url
      // endpoint MANDATES a valid Bearer JWT (401s with "Authorization token
      // not provided" otherwise) — it is not optional on the receiving end.
      // processClaimTpaJob mints a short-lived system JWT at delivery time
      // instead (see buildSystemAuthHeader), the same pattern
      // GenericTpaSyncScheduler already uses for its own unattended calls to
      // this same endpoint.
      let tpaJobPayload: Record<string, unknown>;

      if (claimFormType === 'MULTI') {
        this.logInfo("intimateClaim", { message: "[STEP 7] Building generic MULTI-step TPA intimation payload...", appKey: resolvedAppKey });

        const genericFields = this.buildGenericIntimationFields({
          dto, policy, employee, employeeMapping, patientName,
          resolvedHospitalName, resolvedHospitalLocation, resolvedHospital,
        });

        // MULTI originally hard-failed (assertNoTpaBusinessFailure +
        // extractTpaClaimRef, non-optional ref) if the TPA didn't return a
        // usable claim reference — claimRefRequired preserves that.
        tpaJobPayload = {
          flow: 'GENERIC',
          appKey: resolvedAppKey,
          userEmail: employee.email!,
          dynamicFields: genericFields,
          employeeId: dto.employeeId,
          policyId: dto.policyId,
          claimRefRequired: true,
        };
        this.logInfo("intimateClaim", { message: "[STEP 7] MULTI-step TPA intimation payload built" });
      } else if (legacyHandler === 'ISBS_BROKER_CLAIM') {
        this.logInfo("intimateClaim", { message: "[STEP 7] Building TPA BrokerClaimCreation (ISBS legacy SINGLE-step) payload...", appKey: resolvedAppKey });

        const { dynamicFields } = this.buildIsbsDynamicFields({
          dto, policy, employee, dependent, patientName, patientTpaId,
          resolvedHospitalName, hospitalAddress: resolvedHospital,
        });

        tpaJobPayload = {
          flow: 'ISBS',
          appKey: resolvedAppKey,
          userEmail: employee.email!,
          dynamicFields,
        };
        this.logInfo("intimateClaim", { message: "[STEP 7] ISBS payload built" });
      } else {
        this.logInfo("intimateClaim", { message: "[STEP 7] Building generic SINGLE-step TPA intimation payload...", appKey: resolvedAppKey });

        const genericFields = this.buildGenericIntimationFields({
          dto, policy, employee, employeeMapping, patientName,
          resolvedHospitalName, resolvedHospitalLocation, resolvedHospital,
        });
        if (Array.isArray(dto.documentIds) && dto.documentIds.length) {
          // Fetched and embedded now (not deferred) so the queued job is
          // fully self-contained — the background processor doesn't need
          // document-service to still have this document reachable whenever
          // it eventually runs.
          genericFields.documents = await Promise.all(
            dto.documentIds.map(async (d) => {
              const { base64, fileName } = await this.getDocumentAsBase64(d.documentId);
              return { documentType: d.documentType, fileBase64: base64, fileName };
            }),
          );
        }

        tpaJobPayload = {
          flow: 'GENERIC',
          appKey: resolvedAppKey,
          userEmail: employee.email!,
          dynamicFields: genericFields,
          employeeId: dto.employeeId,
          policyId: dto.policyId,
          // A claim reference is nice-to-have here (this call is already
          // final/SUBMITTED), not mandatory the way it is for MULTI — don't
          // hard-fail the job if this TPA doesn't return a recognisable one.
          claimRefRequired: false,
        };
        this.logInfo("intimateClaim", { message: "[STEP 7] Generic SINGLE-step TPA intimation payload built" });
      }

      // 8. Save claim to DB — ALWAYS, regardless of whether TPA delivery has
      // happened yet. Starts at CLAIM INTIMATION (a status this codebase
      // already defines in policy_claim_status but never used until now,
      // confirmed via full-codebase grep) rather than jumping straight to
      // PENDING/INTIMATED — those represent "the TPA has it," which isn't
      // true yet. ClaimTpaJobProcessor advances the status to what it would
      // have been synchronously (PENDING for SINGLE-flow, INTIMATED for
      // MULTI-flow) once delivery actually succeeds.
      this.logInfo("intimateClaim", { message: "[STEP 8] Saving claim to DB" });

      const documentMeta = Array.isArray(dto.documentIds) && dto.documentIds.length
        ? dto.documentIds
        : undefined;

      const intimationReceivedStatus = await this.claimStatusRepo.findOne({ where: { status: 'CLAIM INTIMATION' } });
      if (!intimationReceivedStatus) {
        this.logError("intimateClaim", { message: "[STEP 8] FAIL — CLAIM INTIMATION status not configured" });
        throw new BadRequestException('CLAIM INTIMATION claim status not configured in system');
      }

      const claimPayload = {
        policyId: policy.id,
        employeeId: dto.employeeId,
        employeeTpaId: employeeMapping.employeeTpaId ?? undefined,
        companyEmployeeId: employee.companyEmployeeId ?? undefined,
        extraFields: dto.extraFields ?? undefined,
        dependentId: dependentId ?? undefined,
        documentIds: documentMeta ?? undefined,
        claimNumber,
        claimType: dto.claimType,
        benefitType: dto.benefitType ?? undefined,
        claimAmount: dto.estimatedClaimAmount,
        claimDescription: dto.diagnosis,
        placeOfAccident: dto.placeOfAccident,
        claimDate: new Date(),
        claimDateOfAdmission: dto.dateOfAdmission ? new Date(dto.dateOfAdmission) : undefined,
        claimDateOfDischarge: dto.proposedDischargeDate ? new Date(dto.proposedDischargeDate) : undefined,
        hospitalId: dto.hospitalId ?? undefined,
        claimHospital: resolvedHospitalName,
        claimHospitalLocation: resolvedHospitalLocation,
        claimStatus: intimationReceivedStatus.status,
        companyName: policy.company?.companyName ?? undefined,
        // Pre-existing bug fixed here: this used to be String(policy.id) (the
        // internal DB PK), not the actual policy number — so every claim's
        // policy_claim.policy_number and, downstream, tpa_claim_data's
        // correlation key (via linkTpaClaimData below) were both wrong. Use
        // the same insurerPolicyNumber already used correctly for
        // dynamicFields.policyNumber (see buildGenericIntimationFields).
        policyNumber: policy.insurerPolicyNumber ?? String(policy.id),
        policyTpaId: policyTpaId ?? undefined,
        policyType: policy.policyType?.lookUpValue ?? undefined,
        policyStartDate: policy.policyFrom,
        policyEndDate: policy.policyTo,
        employeeName: employee.employeeName,
        patientName,
        patientRelation,
        patientTpaId: patientTpaId ?? undefined,
        sourceFileUploadId: null,
      };

      this.logInfo("intimateClaim", { message: "[STEP 8] DB claim payload", claimPayload });

      const savedClaim = await this.claimRepo.manager.transaction(async (manager) => {
        const claim = this.claimRepo.create(claimPayload);
        const [savedClaimRecord] = await manager.save(PolicyClaim, [claim]);
        const claimAudit = this.claimAuditRepo.create({
          policyClaimId: savedClaimRecord.id,
          policyClaimStatusId: intimationReceivedStatus.id,
          userId: employee.userId ?? 0,
          sourceFileUploadId: null,
        });
        await manager.save(PolicyClaimAudit, [claimAudit]);

        // 9. Queue TPA delivery — carries everything needed to both make the
        // call (flow/appKey/dynamicFields) and finish the job afterwards
        // (claimFormType/legacyHandler decide which status to advance to;
        // policyNumber/employeeTpaId feed linkTpaClaimData, same as the old
        // synchronous code did right after saving).
        const job = this.claimTpaJobRepo.create({
          policyClaimId: savedClaimRecord.id,
          jobType: CLAIM_TPA_JOB_TYPE.INTIMATION,
          status: CLAIM_TPA_JOB_STATUS.PENDING,
          // Our own side of the story — exactly what the employee
          // submitted, before any TPA-specific transformation. Not used by
          // the processor at all (it only reads requestPayload below); this
          // is purely for support/debugging traceability.
          sourcePayload: { dto, claimId: savedClaimRecord.id, claimNumber },
          requestPayload: {
            ...tpaJobPayload,
            claimFormType,
            legacyHandler,
            policyNumber: claimPayload.policyNumber,
            employeeTpaId: employeeMapping.employeeTpaId ?? null,
          },
        });
        await manager.save(ClaimTpaSubmissionJob, [job]);

        return savedClaimRecord;
      });

      this.logInfo("intimateClaim", {
        message: "[STEP 8] Claim saved successfully, TPA delivery queued",
        claimId: savedClaim.id,
        claimNumber: savedClaim.claimNumber,
        claimFormType,
      });

      return {
        success: true,
        claimId: savedClaim.id,
        claimNumber: savedClaim.claimNumber ?? claimNumber,
        message: 'Claim intimated successfully. We are delivering it to your TPA now — this happens in the background, and you can check back shortly for the outcome.',
        claimFormType,
      };

    } catch (error) {
      this.logError("intimateClaim", { message: "[FAIL] intimateClaim threw an error", error, incomingDto: dto });
      throw error;
    }
  }

  // Mints a short-lived, system-identified JWT so background delivery
  // (processClaimTpaJob) can call document-service's /external-app-sso/
  // magic-url endpoint, which MANDATES a valid Bearer JWT and 401s
  // ("Authorization token not provided") on a missing/empty header — it does
  // not treat Authorization as optional despite there being no live user
  // session at delivery time. Mirrors GenericTpaSyncScheduler's identical
  // "system-cron" token pattern for its own unattended calls to this same
  // endpoint (scheduler-service/generic-tpa-sync.scheduler.ts) — the
  // endpoint only checks the JWT is validly signed and shaped
  // (userDetails.emailId), not that it belongs to a live session, so this is
  // safe to mint fresh per delivery attempt with no persisted secret beyond
  // the shared JWT_SECRET this module's JwtModule is already configured with.
  private async buildSystemAuthHeader(): Promise<string> {
    const token = await this.jwtService.signAsync(
      { userDetails: { emailId: "system-claim-tpa-job@iirm.com" } },
      { expiresIn: "5m" },
    );
    return `Bearer ${token}`;
  }

  // Called by ClaimTpaJobController (an internal-only route — not exposed
  // through api-gateway to end users) on behalf of ClaimTpaSubmissionScheduler
  // (scheduler-service), which polls PENDING rows and calls this once per
  // row on each cron tick. Replays the exact TPA delivery that used to
  // happen synchronously inside intimateClaim()/submitClaim(), using the
  // payload snapshot built and validated at request time — see
  // ClaimTpaSubmissionJob.requestPayload. Dispatches to deliverIntimationJob
  // or deliverSubmitClaimJob by job.jobType; both share this same outer
  // attempt-tracking / retry / resolvedTpaRequest-persistence scaffold.
  async processClaimTpaJob(jobId: number): Promise<{ status: string; message: string }> {
    this.logInfo("processClaimTpaJob", { message: "[JOB] Request received", jobId });

    const job = await this.claimTpaJobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      this.logError("processClaimTpaJob", { message: "[JOB] FAIL — job not found", jobId });
      throw new BadRequestException(`Claim TPA submission job ${jobId} not found`);
    }
    if (job.status !== CLAIM_TPA_JOB_STATUS.PENDING) {
      // Not an error — the scheduler may have already picked this up in a
      // prior tick, or a manual retrigger raced with the cron. No-op rather
      // than double-deliver to the TPA.
      this.logInfo("processClaimTpaJob", { message: "[JOB] Skipped — not PENDING", jobId, currentStatus: job.status });
      return { status: job.status, message: `Job ${jobId} is not PENDING (current: ${job.status}) — skipped` };
    }

    const attemptCount = job.attemptCount + 1;
    await this.claimTpaJobRepo.update(job.id, {
      status: CLAIM_TPA_JOB_STATUS.PROCESSING,
      attemptCount,
      lastAttemptedAt: new Date(),
    });

    this.logInfo("processClaimTpaJob", { message: "[JOB] Starting delivery attempt", jobId, jobType: job.jobType, attemptCount, maxAttempts: job.maxAttempts });

    // Populated by callIsbsBrokerClaimApi/callGenericExternalApp with
    // document-service's resolvedRequest — the exact, fully-resolved
    // TPA-bound request (secrets included) it actually built — whether this
    // attempt succeeds or fails. Persisted onto the job row below either way,
    // so a failed delivery can be diagnosed/retried by copy-pasting the
    // stored JSON straight at the TPA instead of reverse-engineering the
    // template/field-mapping pipeline.
    const debugCapture: { resolvedRequest?: Record<string, any> } = {};

    try {
      if (job.jobType === CLAIM_TPA_JOB_TYPE.INTIMATION) {
        await this.deliverIntimationJob(job, debugCapture);
      } else if (job.jobType === CLAIM_TPA_JOB_TYPE.SUBMIT_CLAIM) {
        await this.deliverSubmitClaimJob(job, debugCapture);
      } else {
        throw new BadRequestException(`Job type ${job.jobType} is not supported by processClaimTpaJob`);
      }

      await this.claimTpaJobRepo.update(job.id, {
        status: CLAIM_TPA_JOB_STATUS.COMPLETED,
        completedAt: new Date(),
        lastError: null,
        ...(debugCapture.resolvedRequest ? { resolvedTpaRequest: debugCapture.resolvedRequest } : {}),
      });

      this.logInfo("processClaimTpaJob", { message: "[JOB] Delivery succeeded", jobId, jobType: job.jobType, policyClaimId: job.policyClaimId });
      return { status: CLAIM_TPA_JOB_STATUS.COMPLETED, message: "Delivered to TPA successfully" };

    } catch (err: any) {
      const errorMessage = err?.message ?? String(err);
      const exhausted = attemptCount >= job.maxAttempts;
      await this.claimTpaJobRepo.update(job.id, {
        status: exhausted ? CLAIM_TPA_JOB_STATUS.FAILED : CLAIM_TPA_JOB_STATUS.PENDING,
        lastError: errorMessage,
        // Captured even on failure — debugCapture is set right before the
        // outbound TPA call fires (see callGenericExternalApp/
        // callIsbsBrokerClaimApi), so a business/HTTP failure still carries
        // the exact request that was attempted, ready to copy-paste and
        // retry directly against the TPA while investigating.
        ...(debugCapture.resolvedRequest ? { resolvedTpaRequest: debugCapture.resolvedRequest } : {}),
      });
      this.logError("processClaimTpaJob", {
        message: exhausted
          ? "[JOB] Delivery failed — attempts exhausted, marked FAILED for manual follow-up"
          : "[JOB] Delivery attempt failed — will retry on next cron tick",
        jobId, attemptCount, maxAttempts: job.maxAttempts, error: errorMessage,
      });
      return {
        status: exhausted ? CLAIM_TPA_JOB_STATUS.FAILED : CLAIM_TPA_JOB_STATUS.PENDING,
        message: errorMessage,
      };
    }
  }

  // Extracted from processClaimTpaJob's old INTIMATION-only body — behavior is
  // byte-identical, just moved into its own method so processClaimTpaJob can
  // dispatch to this OR deliverSubmitClaimJob by job.jobType, sharing one
  // retry/attempt/resolvedTpaRequest scaffold instead of duplicating it.
  // Throws on any failure — the caller's catch block handles retry/exhaustion.
  private async deliverIntimationJob(
    job: ClaimTpaSubmissionJob,
    debugCapture: { resolvedRequest?: Record<string, any> },
  ): Promise<void> {
    const payload = job.requestPayload as {
      flow: 'GENERIC' | 'ISBS';
      appKey: string;
      userEmail: string;
      dynamicFields: Record<string, unknown>;
      employeeId?: number;
      policyId?: number;
      claimRefRequired?: boolean;
      claimFormType: 'SINGLE' | 'MULTI';
      legacyHandler: string | null;
      policyNumber: string;
      employeeTpaId: string | null;
    };

    let tpaClaimRef: string | null = null;
    let tpaRawResponse: any = null;

    // document-service's magic-url endpoint requires a valid Bearer JWT
    // (see buildSystemAuthHeader) — a background job has no live user
    // token, so mint a short-lived system one instead of sending none.
    const systemAuthHeader = await this.buildSystemAuthHeader();

    if (payload.flow === 'ISBS') {
      this.logInfo("deliverIntimationJob", { message: "[JOB] Calling TPA BrokerClaimCreation (ISBS legacy)...", jobId: job.id, appKey: payload.appKey });
      const isbsResult = await this.callIsbsBrokerClaimApi(payload.appKey, payload.userEmail, payload.dynamicFields, systemAuthHeader, debugCapture);
      this.logInfo("deliverIntimationJob", {
        message: "[JOB] ISBS response received",
        jobId: job.id,
        error_Flag: isbsResult.error_Flag,
        error_Message: isbsResult.error_Message,
        ccn: isbsResult.ccn,
      });
      if (isbsResult.error_Flag === "1") {
        throw new BadRequestException(isbsResult.error_Message || "TPA rejected the claim. Please try again.");
      }
      tpaClaimRef = isbsResult.ccn || null;
    } else {
      this.logInfo("deliverIntimationJob", { message: "[JOB] Calling generic TPA intimation...", jobId: job.id, appKey: payload.appKey });
      const raw = await this.callGenericExternalApp(
        payload.appKey, payload.userEmail, payload.dynamicFields, systemAuthHeader,
        { employeeId: payload.employeeId, policyId: payload.policyId }, debugCapture,
      );
      this.assertNoTpaBusinessFailure(raw, "intimation");
      if (payload.claimRefRequired) {
        const { ref, ext } = this.extractTpaClaimRef(raw);
        tpaClaimRef = ext ? `${ref}:${ext}` : ref;
      } else {
        tpaClaimRef = this.extractTpaClaimRefOptional(raw);
      }
      tpaRawResponse = raw;
    }

    // Advance the claim to the status it would have started at
    // synchronously, now that the TPA actually has it — INTIMATED
    // (awaiting submitClaim) for MULTI, PENDING for SINGLE-flow.
    const finalStatusKey = payload.claimFormType === 'MULTI' ? 'INTIMATED' : 'PENDING';
    const finalStatus = await this.claimStatusRepo.findOne({ where: { status: finalStatusKey } });
    if (!finalStatus) {
      throw new BadRequestException(`${finalStatusKey} claim status not configured in system`);
    }

    const claim = await this.claimRepo.findOne({ where: { id: job.policyClaimId } });
    if (!claim) {
      throw new BadRequestException(`PolicyClaim ${job.policyClaimId} not found for job ${job.id}`);
    }

    await this.claimRepo.manager.transaction(async (manager) => {
      await manager.update(PolicyClaim, claim.id, {
        claimStatus: finalStatus.status,
        // refClaimId duplicates tpaClaimNo as a plain string dedup key — the
        // pull-side sync mechanism's admin-configured "Dedup column
        // (ref_claim_id)" setting matches against this to detect "already
        // exists, update don't duplicate" on re-sync. Previously unmapped on
        // the entity entirely, so a claim delivered via this push flow was
        // invisible to that dedup check — see the entity's own comment.
        ...(tpaClaimRef ? { tpaClaimNo: tpaClaimRef, refClaimId: tpaClaimRef } : {}),
      });
      const claimAudit = this.claimAuditRepo.create({
        policyClaimId: claim.id,
        policyClaimStatusId: finalStatus.id,
        // 0 = system — this transition is driven by the background job
        // succeeding, not a live user action (the employee already acted,
        // back at intimation time).
        userId: 0,
        sourceFileUploadId: null,
      });
      await manager.save(PolicyClaimAudit, [claimAudit]);
    });

    // Best-effort — same as the old synchronous linking, a failure here must
    // not fail the job (the claim already reached the TPA successfully, so
    // retrying the whole job would mean re-submitting to the TPA just to fix
    // internal bookkeeping — worse than a missing link). Retries a couple of
    // times for transient DB blips before giving up, since this was found to
    // silently leave tpa_claim_ref_id null with no other recovery path.
    //
    // Widened from the original `tpaClaimRef && tpaRawResponse` guard to just
    // `tpaClaimRef` — a missing raw response shouldn't also block linking
    // when we do have a claim reference; falls back to an empty object so
    // tpa_claim_data still gets a row (and policy_claim.tpa_claim_ref_id
    // still gets set) even without response content to store alongside it.
    if (tpaClaimRef) {
      const maxLinkAttempts = 2;
      for (let attempt = 1; attempt <= maxLinkAttempts; attempt++) {
        try {
          await this.linkTpaClaimData({
            claimId: claim.id,
            policyNumber: payload.policyNumber,
            tpaClaimNo: tpaClaimRef,
            employeeTpaId: payload.employeeTpaId,
            claimData: tpaRawResponse ?? {},
          });
          break;
        } catch (linkErr) {
          this.logError("deliverIntimationJob", { message: `[JOB] linkTpaClaimData failed (attempt ${attempt}/${maxLinkAttempts}, non-fatal)`, jobId: job.id, error: linkErr });
        }
      }
    }

    // "Claim Intimation Confirmation" email — moved here from the frontend
    // (which used to fire it immediately on intimateClaim's OLD synchronous
    // success, right after the TPA call itself succeeded). Now that
    // intimateClaim returns success as soon as the claim is saved and
    // queued — BEFORE the TPA has been contacted at all — firing this email
    // that early would claim "Successfully Intimated" for a claim the TPA
    // hasn't actually seen yet, and there'd be no corresponding email if
    // delivery later failed. Sending it here instead means it only ever
    // fires once the TPA has genuinely accepted the claim (this method
    // reaching this point at all means the TPA call above succeeded).
    // Content/template unchanged — only the trigger point moved. Best-effort,
    // same as linkTpaClaimData above: a failed email must not fail the job,
    // the claim already reached the TPA successfully.
    try {
      await this.onboardingService.sendClaimIntimationConfirmationNotification({
        employeeId: claim.employeeId,
        policyId: claim.policyId,
        claimNumber: claim.claimNumber ?? String(claim.id),
        claimType: claim.claimType ?? undefined,
        patientName: claim.patientName ?? "",
        patientRelation: claim.patientRelation ?? "",
        diagnosis: claim.claimDescription ?? "",
        estimatedClaimAmount: Number(claim.claimAmount ?? 0),
        dateOfAdmission: claim.claimDateOfAdmission ? this.formatDateString(claim.claimDateOfAdmission) ?? undefined : undefined,
        proposedDischargeDate: claim.claimDateOfDischarge ? this.formatDateString(claim.claimDateOfDischarge) ?? undefined : undefined,
        placeOfAccident: claim.placeOfAccident ?? undefined,
        hospitalName: claim.claimHospital ?? undefined,
        hospitalLocation: claim.claimHospitalLocation ?? undefined,
        // policyTypeKey intentionally omitted — sendClaimIntimationConfirmationNotification
        // already falls back to resolving it from the policy it loads internally.
      });
    } catch (emailErr) {
      this.logError("deliverIntimationJob", { message: "[JOB] Claim intimation confirmation email failed (non-fatal)", jobId: job.id, error: emailErr });
    }
  }

  // Mirrors deliverIntimationJob's shape for the SUBMIT_CLAIM job type — the
  // background counterpart to the old synchronous submitClaim() TPA calls.
  // Document bytes are fetched HERE (delivery time), not at submission time —
  // see submitClaim's header comment for why. Throws on any failure (including
  // a single failed document in PER_DOCUMENT mode) — the caller's catch block
  // retries the WHOLE job from scratch next attempt, mirroring the old
  // synchronous code's "any document fails → reject the whole submission,
  // nothing marked SUBMITTED" semantics, just retried by the scheduler instead
  // of the employee. Known trade-off: a retry re-sends every document, not
  // just the one(s) that failed — acceptable since TPA submission endpoints in
  // this codebase are treated as safe to resend (same assumption the bounded
  // retry design already makes for intimation).
  private async deliverSubmitClaimJob(
    job: ClaimTpaSubmissionJob,
    debugCapture: { resolvedRequest?: Record<string, any> },
  ): Promise<void> {
    const payload = job.requestPayload as {
      appKey: string;
      executionMode: 'SINGLE_CALL' | 'PER_DOCUMENT';
      userEmail: string;
      employeeId?: number;
      policyId?: number;
      tpaClaimRef: string;
      tpaClaimRefExt: string;
      originalIntimationFields: Record<string, unknown>;
      documentIds: { documentId: number; documentType: string }[];
      submissionFields: {
        dateOfDischarge: string | null;
        finalClaimedAmount: number | null;
        payeeName: string | null;
        bankAccountNo: string | null;
        accountType: string | null;
        ifscCode: string | null;
      };
      extraFields: Record<string, unknown>;
    };

    const systemAuthHeader = await this.buildSystemAuthHeader();
    const context = { employeeId: payload.employeeId, policyId: payload.policyId };

    if (payload.executionMode === 'PER_DOCUMENT') {
      this.logInfo("deliverSubmitClaimJob", { message: "[JOB] Submitting documents one-by-one (PER_DOCUMENT)...", jobId: job.id, appKey: payload.appKey, documentCount: payload.documentIds.length });
      const resolvedRequests: Array<{ documentId: number; documentType: string; request?: Record<string, any> }> = [];
      for (const doc of payload.documentIds) {
        const { base64 } = await this.getDocumentAsBase64(doc.documentId);
        const fields = {
          ...payload.originalIntimationFields,
          claimReferenceId: payload.tpaClaimRef || "",
          claimReferenceExt: payload.tpaClaimRefExt || "0",
          documentType: doc.documentType,
          fileBase64: base64,
          ...payload.extraFields,
        };
        const perDocCapture: { resolvedRequest?: Record<string, any> } = {};
        const raw = await this.callGenericExternalApp(payload.appKey, payload.userEmail, fields, systemAuthHeader, context, perDocCapture);
        this.assertNoTpaBusinessFailure(raw, "submission");
        resolvedRequests.push({ documentId: doc.documentId, documentType: doc.documentType, request: perDocCapture.resolvedRequest });
      }
      // Array shape here (one entry per document), unlike the single-object shape
      // deliverIntimationJob/SINGLE_CALL use — resolved_tpa_request is jsonb, so
      // either shape is fine; a support engineer reading this needs to see EVERY
      // per-document request, not just the last one.
      debugCapture.resolvedRequest = { executionMode: 'PER_DOCUMENT', documents: resolvedRequests };
    } else {
      this.logInfo("deliverSubmitClaimJob", { message: "[JOB] Submitting all documents in one call (SINGLE_CALL)...", jobId: job.id, appKey: payload.appKey, documentCount: payload.documentIds.length });
      // FHPL/Health India-style: one call carrying all fields + all documents
      // together — the "documents" array feeds the app ref's "$forEach" payload
      // template (payload-template.util.ts).
      const documents = await Promise.all(
        payload.documentIds.map(async (d) => {
          const { base64, fileName } = await this.getDocumentAsBase64(d.documentId);
          return { documentType: d.documentType, fileBase64: base64, fileName };
        }),
      );
      const fields = {
        ...payload.originalIntimationFields,
        claimReferenceId: payload.tpaClaimRef || "",
        // Health India's GetClaimDocumentSubmission needs CCN_EXT (claimReferenceExt)
        // alongside CCN — FHPL's own template doesn't reference this field, so it's a
        // harmless extra there.
        claimReferenceExt: payload.tpaClaimRefExt || "0",
        dateOfDischarge: payload.submissionFields.dateOfDischarge ?? "",
        finalClaimedAmount: payload.submissionFields.finalClaimedAmount ?? "",
        payeeName: payload.submissionFields.payeeName ?? "",
        bankAccountNo: payload.submissionFields.bankAccountNo ?? "",
        accountType: payload.submissionFields.accountType ?? "",
        ifscCode: payload.submissionFields.ifscCode ?? "",
        documents,
        ...payload.extraFields,
      };
      const raw = await this.callGenericExternalApp(payload.appKey, payload.userEmail, fields, systemAuthHeader, context, debugCapture);
      this.assertNoTpaBusinessFailure(raw, "submission");
    }

    // Submission complete — claim moves from CLAIM BILLS PENDING into the
    // normal claims pipeline, starting at PENDING (same status SINGLE-flow
    // claims start at today).
    const pendingStatus = await this.claimStatusRepo.findOne({ where: { status: "PENDING" } });
    if (!pendingStatus) {
      throw new BadRequestException("PENDING claim status not configured in system");
    }

    await this.claimRepo.manager.transaction(async (manager) => {
      await manager.update(PolicyClaim, job.policyClaimId, { claimStatus: pendingStatus.status });
      const claimAudit = this.claimAuditRepo.create({
        policyClaimId: job.policyClaimId,
        policyClaimStatusId: pendingStatus.id,
        // 0 = system — this transition is driven by the background job
        // succeeding, not a live user action (the employee already acted,
        // back at submission time).
        userId: 0,
        sourceFileUploadId: null,
      });
      await manager.save(PolicyClaimAudit, [claimAudit]);
    });
  }

  // Split from the old callIsbsBrokerClaim (below) into a pure, network-free
  // half (this one — validation + dynamicFields construction) and a network
  // half (callIsbsBrokerClaimApi) — so intimateClaim can keep running this
  // validation SYNCHRONOUSLY (preserving the existing "tell the user
  // immediately if a required field is missing" UX) while deferring only
  // the actual TPA network call to the async ClaimTpaSubmissionJob queue.
  // Mechanical extraction, not a behavior change — every check/field below
  // is byte-identical to the original inline code.
  private buildIsbsDynamicFields(ctx: {
    dto: IntimateClaimDto;
    policy: any;
    employee: any;
    dependent: any;
    patientName: string;
    patientTpaId: string | null | undefined;
    resolvedHospitalName: string | undefined;
    hospitalAddress: any;
  }): { dynamicFields: Record<string, unknown> } {
    const { dto, policy, employee, patientName, patientTpaId, resolvedHospitalName, hospitalAddress } = ctx;
    const addr = hospitalAddress?.addresses as any;

    // ── Step A: Validate all required fields before calling ISBS ──────────
      this.logInfo("buildIsbsDynamicFields", { message: "[ISBS-A] Validating required fields" });

      const missingFields: string[] = [];
      if (!patientTpaId)                              missingFields.push("ptGhCardId — patient TPA card ID not found in policy map");
      if (!policy.insurerPolicyNumber)                missingFields.push("policyNo — policy.insurer_policy_number is empty");
      if (!patientName)                               missingFields.push("clmPatientName — patient name is empty");
      if (!employee.phoneNumber)                      missingFields.push("ptMobileNo — employee.phone_number_enc is empty");
      if (!employee.email)                            missingFields.push("ptEmail — employee.email_enc is empty");
      if (!dto.estimatedClaimAmount)                  missingFields.push("clmRequestedAmt — estimatedClaimAmount is empty");
      if (!dto.dateOfAdmission)                       missingFields.push("clmHospFrom — dateOfAdmission is required");
      if (!dto.proposedDischargeDate)                 missingFields.push("clmHospTo — proposedDischargeDate is required");
      if (!resolvedHospitalName && !dto.hospitalName) missingFields.push("clmHospName — hospital name could not be resolved");
      if (!dto.diagnosis)                             missingFields.push("clmReasonAdmission — diagnosis is empty");

      if (missingFields.length > 0) {
        this.logError("buildIsbsDynamicFields", { message: "[ISBS-A] FAIL — Missing required fields", missingFields });
        throw new BadRequestException(
          `Cannot submit claim to ISBS — missing required fields: ${missingFields.join("; ")}`,
        );
      }
      this.logInfo("buildIsbsDynamicFields", { message: "[ISBS-A] All required fields present ✓" });

      // Date of admission must fall within the policy's coverage period.
      if (dto.dateOfAdmission && policy.policyFrom && policy.policyTo) {
        const admission = new Date(dto.dateOfAdmission);
        const from = new Date(policy.policyFrom);
        const to = new Date(policy.policyTo);
        if (admission < from || admission > to) {
          this.logError("buildIsbsDynamicFields", { message: "[ISBS-A] FAIL — Date of admission outside policy period", dateOfAdmission: dto.dateOfAdmission, policyFrom: policy.policyFrom, policyTo: policy.policyTo });
          throw new BadRequestException(
            `Date of admission (${dto.dateOfAdmission}) must be within the policy period (${policy.policyFrom} to ${policy.policyTo})`,
          );
        }
      }

      // ── Step B: Log hospital address resolution ───────────────────────────
      this.logInfo("buildIsbsDynamicFields", {
        message: "[ISBS-B] Hospital address resolution",
        hospitalId:         dto.hospitalId ?? null,
        externalHospitalId: hospitalAddress?.externalHospitalId ?? null,
        cityName:           addr?.cityName     ?? null,
        stateName:          addr?.stateName    ?? null,
        addressLine1:       addr?.addressLine1 ?? null,
        pinCode:            addr?.pinCode      ?? null,
      });

      const ghHospitalId = hospitalAddress?.externalHospitalId
        ? parseInt(hospitalAddress.externalHospitalId, 10) || 0
        : 0;

      // ── Step C: Build dynamicFields (no hardcoded fallbacks) ──────────────
      // ISBS expects DD/MM/YYYY for date fields — convert from ISO
      const toIsbsDate = (iso: string): string => {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        const day   = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getUTCFullYear()} 00:00:00`;
      };

      const dynamicFields: Record<string, unknown> = {
        ptGhCardId:              patientTpaId!,
        policyNo:                policy.insurerPolicyNumber!,
        clmPatientName:          patientName!,
        ptMobileNo:              employee.phoneNumber!,
        ptEmail:                 employee.email!,
        ghHospitalId,
        clmRequestedAmt:         Number(dto.estimatedClaimAmount),
        clmHospFrom:             toIsbsDate(dto.dateOfAdmission!),
        clmHospTo:               toIsbsDate(dto.proposedDischargeDate!),
        clmHospName:             resolvedHospitalName ?? dto.hospitalName!,
        clmCity:                 addr?.cityName     ?? "",
        clmState:                addr?.stateName    ?? "",
        clmHospAddress:          addr?.addressLine1 ?? "",
        clmPincode:              addr?.pinCode      ?? "",
        clmReasonAdmission:      dto.diagnosis!,
        clmCommunicationRemarks: dto.diagnosis!,
        clmSubtype:              dto.claimType === "REIMBURSEMENT" ? "IP-2" : "IP-1",
      };

    return { dynamicFields };
  }

  // The network half of the old callIsbsBrokerClaim — takes the dynamicFields
  // buildIsbsDynamicFields already validated/built (synchronously, at
  // intimation time) and makes the actual call. This is the only part of the
  // ISBS flow that now runs from the async ClaimTpaSubmissionJob queue
  // instead of inline in intimateClaim.
  private async callIsbsBrokerClaimApi(
    appKey: string,
    userEmail: string,
    dynamicFields: Record<string, unknown>,
    authHeader: string,
    // Optional mutable out-param — populated with document-service's
    // resolvedRequest (the exact, fully-resolved TPA-bound request it built,
    // secrets included) whether this call succeeds or throws. Callers persist
    // this onto claim_tpa_submission_job so a failed delivery can be retried
    // by copy-pasting the stored JSON straight at the TPA.
    debugCapture?: { resolvedRequest?: Record<string, any> },
  ): Promise<{ ccn: string; error_Flag: string; error_Message?: string }> {
    try {
      // ── Step D: Use the appKey resolved by intimateClaim before this call ────

      const documentServiceUrl = process.env["URL_DOCUMENT_SERVICE"] ?? "http://localhost:3013";
      const magicUrlEndpoint   = `${documentServiceUrl}/external-app-sso/magic-url`;

      this.logInfo("callIsbsBrokerClaimApi", {
        message: "[ISBS-D] POST to document-service magic-url (auth header forwarded)",
        endpoint: magicUrlEndpoint,
        appKey,
        hasAuthHeader: !!authHeader,
      });

      const dsResponse = await axios.post(
        magicUrlEndpoint,
        { appKey, userEmail, dynamicFields },
        {
          timeout: 30_000,
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        },
      );

      if (debugCapture) debugCapture.resolvedRequest = (dsResponse.data as any)?.resolvedRequest;

      const isbsData = (dsResponse.data as any)?.data ?? dsResponse.data;

      this.logInfo("callIsbsBrokerClaimApi", {
        message: "[ISBS-E] Response received via document-service",
        httpStatus: dsResponse.status,
        isbsData,
      });

      if (!isbsData) {
        throw new BadRequestException("ISBS returned an empty response via document-service");
      }

      return {
        ccn:           String(isbsData.ccn           ?? ""),
        error_Flag:    String(isbsData.error_Flag    ?? "0"),
        error_Message: isbsData.error_Message        ?? isbsData.errorMsg ?? undefined,
      };

    } catch (err: any) {
      // ?? preserves a resolvedRequest already captured on the success path above
      // (e.g. the "ISBS returned an empty response" case) — a NestJS exception
      // thrown internally has no err.response, so this must not clobber it with undefined.
      if (debugCapture) debugCapture.resolvedRequest = err?.response?.data?.resolvedRequest ?? debugCapture.resolvedRequest;
      if (err instanceof BadRequestException) throw err;

      const msg = err?.response?.data?.message
        ?? err?.response?.data?.error_Message
        ?? err?.message
        ?? "Unknown error communicating with ISBS via document-service";

      this.logError("callIsbsBrokerClaimApi", {
        message: "[ISBS] Unexpected error",
        errorMessage: msg,
        httpStatus: err?.response?.status ?? null,
      });
      throw new BadRequestException(`ISBS integration error: ${msg}`);
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Generic MULTI-step claim flow (FHPL, Health India, and any future TPA
  // configured with claim_form_type = 'MULTI'). Unlike callIsbsBrokerClaim
  // above, this builds a flat, CANONICAL dynamicFields object — the TPA-specific
  // field renaming (Member_UHID, policY_NUMBER, etc.) lives entirely in the
  // admin-configured magicUrlApiPayload template on that TPA's app ref, the same
  // mechanism ISBS's own template already uses. Adding a new MULTI TPA should
  // only ever require new config rows, not new code here.
  // ────────────────────────────────────────────────────────────────────────

  // employee.phoneNumber is stored with a +91 country code, but FHPL (and likely other
  // TPAs) reject anything but a bare 10-digit number ("Mobile number can not be empty
  // or Invalid"). Strips all non-digits and keeps just the last 10 — works regardless
  // of whether the stored prefix is "+91", "91", "0", or has spaces/dashes in it.
  private normalizeIndianMobile(phone?: string | null): string {
    const digits = (phone ?? "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  private buildGenericIntimationFields(ctx: {
    dto: IntimateClaimDto;
    policy: any;
    employee: any;
    employeeMapping: any;
    patientName?: string;
    resolvedHospitalName: string | undefined;
    resolvedHospitalLocation: string | undefined;
    resolvedHospital: any;
  }): Record<string, unknown> {
    const { dto, policy, employee, employeeMapping, patientName, resolvedHospitalName, resolvedHospitalLocation, resolvedHospital } = ctx;
    const hospitalAddr = resolvedHospital?.addresses as any;

    const missingFields: string[] = [];
    if (!policy.insurerPolicyNumber)                   missingFields.push("policyNumber — policy.insurer_policy_number is empty");
    if (!employeeMapping.employeeTpaId && !dto.dependentId) missingFields.push("memberCardId — employee TPA card ID not found in policy map");
    if (!dto.dateOfAdmission)                          missingFields.push("dateOfAdmission is required");
    if (!dto.diagnosis)                                missingFields.push("diagnosis is empty");
    if (!resolvedHospitalName && !dto.hospitalName)    missingFields.push("hospitalName could not be resolved");

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Cannot submit claim intimation — missing required fields: ${missingFields.join("; ")}`,
      );
    }

    // Date of admission must fall within the policy's coverage period — TPAs reject
    // (or silently mishandle) claims for treatment outside the policy term.
    if (dto.dateOfAdmission && policy.policyFrom && policy.policyTo) {
      const admission = new Date(dto.dateOfAdmission);
      const from = new Date(policy.policyFrom);
      const to = new Date(policy.policyTo);
      if (admission < from || admission > to) {
        throw new BadRequestException(
          `Date of admission (${dto.dateOfAdmission}) must be within the policy period (${policy.policyFrom} to ${policy.policyTo})`,
        );
      }
    }

    return {
      policyNumber:          policy.insurerPolicyNumber!,
      memberCardId:          employeeMapping.employeeTpaId ?? "",
      employeeCode:          employee.companyEmployeeId ?? "",
      claimType:             dto.claimType ?? "",
      benefitType:           dto.benefitType ?? "",
      estimatedClaimAmount:  Number(dto.estimatedClaimAmount),
      dateOfAdmission:       dto.dateOfAdmission!,
      // Not every MULTI TPA needs discharge date at intimation (FHPL/Health India only
      // need it at submission) — ISBS's BrokerClaimCreation does (clmHospTo). Harmless
      // extra field for TPAs whose intimation template doesn't reference it.
      dateOfDischarge:       dto.proposedDischargeDate ?? "",
      diagnosis:             dto.diagnosis!,
      patientName:           patientName ?? employee.employeeName ?? "",
      patientMobile:         this.normalizeIndianMobile(employee.phoneNumber),
      patientEmail:          employee.email ?? "",
      hospitalId:            dto.hospitalId ?? "",
      hospitalCode:          resolvedHospital?.externalHospitalId ?? "",
      hospitalName:          resolvedHospitalName ?? dto.hospitalName!,
      hospitalAddress:       resolvedHospitalLocation ?? "",
      hospitalCity:          hospitalAddr?.cityName ?? "",
      hospitalState:         hospitalAddr?.stateName ?? "",
      hospitalPincode:       hospitalAddr?.pinCode ?? "",
      hospitalPhone:         hospitalAddr?.phoneNumber ?? "",
      // TPA-specific USER_INPUT fields collected via getClaimExtraFields — spread last
      // since these are always new placeholder names outside the canonical set above
      // (CLAIM_CANONICAL_FIELDS is locked/non-mappable in iWork), never a clobber risk.
      ...(dto.extraFields ?? {}),
    };
  }

  // Reconstructs the original Intimate-stage canonical fields from an already-saved
  // PolicyClaim row — needed for TPAs whose "submission" call repeats the full
  // intimation payload rather than referencing it by ID alone (Health India's
  // GetClaimIntimationWithDMS). Best-effort: re-resolves the hospital's external
  // code/phone from the master record if hospitalId is present, same as intimation did;
  // missing hospital data doesn't block the submission, since not every TPA needs it here.
  private async buildOriginalIntimationFieldsFromClaim(claim: PolicyClaim, employee: any): Promise<Record<string, unknown>> {
    let hospitalCode = "";
    let hospitalPhone = "";
    if (claim.hospitalId) {
      try {
        const hospital = await this.companyEmployeeRepository.getHospitalById(claim.hospitalId);
        hospitalCode = hospital?.externalHospitalId ?? "";
        hospitalPhone = (hospital?.addresses as any)?.phoneNumber ?? "";
      } catch { /* best-effort — resubmission still proceeds without it */ }
    }

    return {
      policyNumber:          claim.policy?.insurerPolicyNumber ?? "",
      // Intimation always sends the employee's own TPA id here (buildGenericIntimationFields
      // isn't dependent-aware), regardless of whether the claim is for the employee or a
      // dependent — mirror that exactly. claim.patientTpaId (dependent-specific) is preferred
      // if it's ever populated, but falls back to employeeTpaId so this matches what was
      // actually sent at intimation instead of going blank when a dependent has no TPA id on file.
      memberCardId:          claim.patientTpaId || claim.employeeTpaId || "",
      employeeCode:          claim.companyEmployeeId ?? "",
      claimType:             claim.claimType ?? "",
      benefitType:           claim.benefitType ?? "",
      estimatedClaimAmount:  claim.claimAmount ?? "",
      dateOfAdmission:       claim.claimDateOfAdmission ? new Date(claim.claimDateOfAdmission).toISOString().slice(0, 10) : "",
      diagnosis:             claim.claimDescription ?? "",
      patientMobile:         this.normalizeIndianMobile(employee.phoneNumber),
      patientEmail:          employee.email ?? "",
      hospitalId:            claim.hospitalId ?? "",
      hospitalCode,
      hospitalName:          claim.claimHospital ?? "",
      hospitalAddress:       claim.claimHospitalLocation ?? "",
      hospitalPhone,
      // Persisted at intimation from the same USER_INPUT fields getGenericIntimationFields
      // merged in — reconstructed here for TPAs whose submission call repeats them.
      ...(claim.extraFields ?? {}),
    };
  }

  // Same document-service gateway used by callIsbsBrokerClaim, generalised for any
  // MULTI-flow TPA call (intimation or submission) — no TPA-specific fields baked in.
  // employeeId/policyId are forwarded as context so document-service's
  // resolveFieldMappings (tpa_payload_field_mapping — the admin-configured "pull this
  // placeholder from a DB column" mechanism, already built and used by other TPA
  // features) actually activates for claims too. Without this, any DB-sourced field
  // mapping an admin configures for a claims app-ref would silently never resolve.
  private async callGenericExternalApp(
    appKey: string,
    userEmail: string,
    dynamicFields: Record<string, unknown>,
    authHeader: string,
    context?: { employeeId?: number; policyId?: number },
    // Optional mutable out-param — populated with document-service's
    // resolvedRequest (the exact, fully-resolved TPA-bound request it built,
    // secrets included) whether this call succeeds or throws. Callers persist
    // this onto claim_tpa_submission_job so a failed delivery can be retried
    // by copy-pasting the stored JSON straight at the TPA.
    debugCapture?: { resolvedRequest?: Record<string, any> },
  ): Promise<any> {
    const documentServiceUrl = process.env["URL_DOCUMENT_SERVICE"] ?? "http://localhost:3013";
    const magicUrlEndpoint   = `${documentServiceUrl}/external-app-sso/magic-url`;

    this.logInfo("callGenericExternalApp", {
      message: "POST to document-service magic-url (auth header forwarded)",
      endpoint: magicUrlEndpoint,
      appKey,
      hasAuthHeader: !!authHeader,
    });

    try {
      const dsResponse = await axios.post(
        magicUrlEndpoint,
        { appKey, userEmail, dynamicFields, employeeId: context?.employeeId, policyId: context?.policyId },
        {
          timeout: 60_000,
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        },
      );
      if (debugCapture) debugCapture.resolvedRequest = (dsResponse.data as any)?.resolvedRequest;
      return (dsResponse.data as any)?.data ?? dsResponse.data;
    } catch (err: any) {
      if (debugCapture) debugCapture.resolvedRequest = err?.response?.data?.resolvedRequest;
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "Unknown error communicating with TPA via document-service";
      this.logError("callGenericExternalApp", { message: "TPA call failed", appKey, errorMessage: msg, httpStatus: err?.response?.status ?? null });
      throw new BadRequestException(`TPA integration error: ${msg}`);
    }
  }

  // Best-effort HTTP-200-but-business-failure detection for TPAs whose exact error
  // response shape isn't fully documented yet (FHPL/Health India — see architecture
  // doc §7). Mirrors the same heuristic already used by the admin "test API config"
  // tool (TpaExternalFeatureService.testApiConfig) so behaviour is consistent.
  private assertNoTpaBusinessFailure(raw: any, stage: "intimation" | "submission"): void {
    // Some TPAs (FHPL) return a bare string instead of a JSON object when something's
    // wrong with the request (e.g. "Mobile number can not be empty or Invalid") — that's
    // always an error, never valid claim data. Treat it as the failure message directly;
    // otherwise it falls through to extractTpaClaimRef's Object.keys(raw), which on a
    // string enumerates character indices (0, 1, 2, ...), producing a nonsensical
    // "raw response keys: 0, 1, 2, ..." message instead of the actual TPA error text.
    if (typeof raw === "string") {
      throw new BadRequestException(raw.trim() || `TPA rejected the claim ${stage}.`);
    }
    if (!raw || typeof raw !== "object") return;
    const status = raw.status ?? raw.Status;
    // ISBS uses its own convention entirely: error_Flag ("1" = failure, "0" = success)
    // + error_Message, no status/message fields at all (e.g. {"ccn":null,"error_Flag":"1",
    // "error_Message":"String was not recognized as a valid DateTime."}) — matches the
    // exact fields the legacy callIsbsBrokerClaim() already checks for this same TPA.
    const errorFlag = raw.error_Flag ?? raw.errorFlag;
    const message = raw.message ?? raw.Message ?? raw.error ?? raw.Error ?? raw.error_Message ?? raw.errorMsg ?? "";
    const isFailure = status === false || status === "false" ||
      errorFlag === "1" || errorFlag === 1 ||
      /invalid|fail|error|unauthorized|not found|expired|reject/i.test(String(message));
    if (isFailure) {
      // Health India nests the actually-useful detail one level down (result[0].message,
      // e.g. "Date of Admission should be between policy period...") behind a generic
      // outer message ("INVALID PARAMETERS") — prefer that when present. FHPL and other
      // TPAs that put the real detail directly in the outer message are unaffected, since
      // nested/result won't exist for them and this just falls back to `message`.
      const nested = Array.isArray(raw.result) ? raw.result[0] : (Array.isArray(raw.Result) ? raw.Result[0] : null);
      const nestedMessage = nested?.message ?? nested?.Message;
      const detail = nestedMessage && String(nestedMessage).trim() && !/^success$/i.test(String(nestedMessage))
        ? nestedMessage
        : message;
      throw new BadRequestException(String(detail) || `TPA rejected the claim ${stage}.`);
    }
  }

  // Persists the raw TPA response into tpa_claim_data and links it back via
  // policy_claim.tpa_claim_ref_id. Mirrors generic-tpa-sync.scheduler.ts's own
  // upsert+link pattern exactly (same columns, same ON CONFLICT target) so both the
  // synchronous (this) and the periodic pull-side sync can write to this table without
  // clashing — distinguished by data_type ('CLAIM_SUBMISSION' here vs 'TPA_SYNC' there).
  // Best-effort: swallows its own errors so a linking failure never fails the claim itself.
  private async linkTpaClaimData(ctx: {
    claimId: number;
    policyNumber: string;
    tpaClaimNo: string;
    employeeTpaId: string | null;
    claimData: unknown;
  }): Promise<void> {
    const { claimId, policyNumber, tpaClaimNo, employeeTpaId, claimData } = ctx;
    // Deliberately no internal try/catch here (unlike before) — errors now
    // propagate to the caller (deliverIntimationJob), which owns the
    // retry-a-couple-times-then-give-up-non-fatally policy. The old internal
    // try/catch swallowed every failure silently on the very first attempt,
    // with no way for anything to retry — the direct cause of
    // tpa_claim_ref_id/ref_claim_id staying null on transient failures.
    const [tpaDataRow] = await this.claimRepo.manager.query(
      `INSERT INTO tpa_claim_data
         (policy_number, tpa_claim_no, employee_tpa_id, data_type, claim_data, fetched_at, created_at, created_by, updated_at, updated_by)
       VALUES ($1, $2, $3, 'CLAIM_SUBMISSION', $4, NOW(), NOW(), 0, NOW(), 0)
       ON CONFLICT (policy_number, tpa_claim_no, data_type) DO UPDATE
         SET claim_data      = EXCLUDED.claim_data,
             employee_tpa_id = EXCLUDED.employee_tpa_id,
             fetched_at      = NOW(),
             updated_at      = NOW()
       RETURNING id`,
      [policyNumber, tpaClaimNo, employeeTpaId, JSON.stringify(claimData)],
    );
    if (!tpaDataRow?.id) {
      throw new Error(`tpa_claim_data upsert for claim ${claimId} did not return an id`);
    }
    await this.claimRepo.manager.query(
      `UPDATE policy_claim SET tpa_claim_ref_id = $1 WHERE id = $2`,
      [tpaDataRow.id, claimId],
    );
    this.logInfo("linkTpaClaimData", { message: "Linked claim to tpa_claim_data", claimId, tpaClaimDataId: tpaDataRow.id });
  }

  // Extracts the TPA's own claim reference from an intimation response. Prefers the
  // standardised keys (TPA_CLAIM_REF / TPA_CLAIM_REF_EXT) an admin can configure via
  // response mappings on the app ref (mstr_ext_app_response_mapping) so this code never
  // needs to know a TPA's raw field name; falls back to a few common raw key guesses
  // (IntimationID/ClaimID for FHPL — confirmed via a real response:
  // {"Message":"Intimation created Successfully","IntimationID":"1189449"} — top-level
  // CCN/CCN_EXT, or Health India's nested result[0].ccn/ccN_EXT) until those mappings
  // are configured. Nested lookup only kicks in when the top-level keys are absent, so
  // FHPL's flat response shape is unaffected.
  private extractTpaClaimRef(raw: any): { ref: string; ext?: string } {
    const nested = Array.isArray(raw?.result) ? raw.result[0] : (Array.isArray(raw?.Result) ? raw.Result[0] : null);
    const ref = raw?.TPA_CLAIM_REF ?? raw?.IntimationID ?? raw?.ClaimID ?? raw?.claimId ?? raw?.CCN ?? raw?.claim_id
      ?? nested?.ccn ?? nested?.CCN ?? nested?.claimId ?? null;
    const extRaw = raw?.TPA_CLAIM_REF_EXT ?? raw?.CCN_EXT ?? nested?.ccN_EXT ?? nested?.CCN_EXT;
    if (!ref) {
      throw new BadRequestException(
        `TPA did not return a recognisable claim reference. Configure a response mapping (TPA_CLAIM_REF) for this app ref — raw response keys: ${Object.keys(raw ?? {}).join(", ") || "(empty)"}`,
      );
    }
    return { ref: String(ref), ext: extRaw !== undefined && extRaw !== null ? String(extRaw) : undefined };
  }

  // Same lookup as extractTpaClaimRef, but for the generic SINGLE-step path — that call
  // is already the final/SUBMITTED one, so a missing reference is a shrug, not a failure
  // (unlike MULTI, where the reference is mandatory to correlate the later submit call).
  private extractTpaClaimRefOptional(raw: any): string | null {
    if (!raw || typeof raw !== "object") return null;
    const nested = Array.isArray(raw.result) ? raw.result[0] : (Array.isArray(raw.Result) ? raw.Result[0] : null);
    const ref = raw.TPA_CLAIM_REF ?? raw.IntimationID ?? raw.ClaimID ?? raw.claimId ?? raw.CCN ?? raw.claim_id
      ?? nested?.ccn ?? nested?.CCN ?? nested?.claimId ?? null;
    const extRaw = raw.TPA_CLAIM_REF_EXT ?? raw.CCN_EXT ?? nested?.ccN_EXT ?? nested?.CCN_EXT;
    if (!ref) return null;
    return extRaw !== undefined && extRaw !== null ? `${ref}:${extRaw}` : String(ref);
  }

  // Fetches an uploaded claim document as base64 — reuses the same S3 stream + buffer
  // path already used for file downloads (downloadEmployeeFile / streamToBuffer),
  // rather than a second, parallel implementation of file retrieval.
  private async getDocumentAsBase64(documentId: number): Promise<{ base64: string; fileName: string }> {
    const result = await this.downloadEmployeeFile(BigInt(documentId));
    const buffer = await this.streamToBuffer(result.stream as any);
    return { base64: buffer.toString("base64"), fileName: result.fileName };
  }

  /**
   * Submits the remaining claim details (bank/payee info, discharge date, bills) for a
   * claim that was previously INTIMATED under a MULTI-flow TPA (FHPL, Health India).
   * Not applicable to SINGLE-flow TPAs — those are fully submitted at intimation time.
   */
  // Redesigned to the same persist-first, deliver-async pattern as intimateClaim
  // (see ClaimTpaSubmissionJob / processClaimTpaJob) — fixes the identical
  // reliability gap for the submission step: the old code below called the TPA
  // synchronously (once per document, or once with all documents) and only
  // updated our own records if that succeeded, so a TPA hiccup while submitting
  // bills/documents could lose the submission the same way the original
  // intimation bug worked, just one step later in the journey.
  //
  // Document fetching (getDocumentAsBase64) is ALSO deferred to delivery time
  // now, unlike intimation's SINGLE-flow (which still fetches synchronously —
  // a known, separately-flagged residual gap, see TRD §10). Documents live in
  // our own S3-backed storage, not the TPA's, so fetching them later at
  // delivery time carries none of the "TPA is down" risk and keeps the queued
  // job row small (document ids only, not base64 blobs).
  async submitClaim(claimId: number, dto: SubmitClaimDto, authHeader: string, requestingEmployeeId: number): Promise<SubmitClaimResponseDto> {
    try {
      this.logInfo("submitClaim", { message: "[STEP 1] Received claim submission request", claimId, payload: dto });

      const claim = await this.claimRepo.findOne({
        where: { id: claimId },
        relations: ["policy", "policy.tpaMappings"],
      });

      if (!claim) {
        throw new BadRequestException(`Claim ${claimId} not found`);
      }
      if (claim.employeeId !== requestingEmployeeId) {
        throw new BadRequestException(`Claim ${claimId} does not belong to this employee`);
      }
      if (claim.claimStatus !== "INTIMATED") {
        throw new BadRequestException(`Claim ${claimId} is not awaiting submission (current status: ${claim.claimStatus})`);
      }
      if (!dto.documentIds?.length) {
        throw new BadRequestException("At least one document is required to submit a claim");
      }

      const policyTpaId = claim.policyTpaId ?? claim.policy?.tpaMappings?.[0]?.tpaId ?? null;
      if (!policyTpaId) {
        throw new BadRequestException(`No TPA resolved for claim ${claimId}`);
      }

      const configRows = await this.claimRepo.manager.query<{ label: string; submit_execution_mode: string | null }[]>(`
        SELECT ear.label, cfg.submit_execution_mode
        FROM   public.tpa_external_feature_config cfg
        JOIN   public.mstr_ext_application_ref    ear
                 ON ear.id = cfg.app_ref_id AND ear.is_active = true
        WHERE  cfg.tpa_id = $1 AND cfg.api_type = 'SUBMIT_CLAIM' AND cfg.is_active = true
        LIMIT  1
      `, [policyTpaId]);
      const appKey = configRows?.[0]?.label ?? null;
      const executionMode = configRows?.[0]?.submit_execution_mode === "PER_DOCUMENT" ? "PER_DOCUMENT" : "SINGLE_CALL";

      if (!appKey) {
        throw new BadRequestException(`Claim submission URL not found for this TPA (TPA ID: ${policyTpaId}). Please contact support.`);
      }

      const employee = await this.companyEmployeeRepo.findOne({ where: { id: claim.employeeId } });
      if (!employee) {
        throw new BadRequestException(`Employee ${claim.employeeId} not found`);
      }

      const [tpaClaimRef, tpaClaimRefExt] = (claim.tpaClaimNo ?? "").split(":");

      this.logInfo("submitClaim", { message: "[STEP 2] Resolved TPA submit config", policyTpaId, appKey, executionMode, tpaClaimRef, tpaClaimRefExt });

      // Some TPAs' "submission" call repeats the full intimation payload rather than
      // referencing it by ID alone (Health India's GetClaimIntimationWithDMS) — merge
      // those fields in alongside the submission-specific ones below. Harmless extra
      // fields for a TPA (like FHPL) whose own template doesn't reference them. Pure
      // DB reconstruction, no network — safe to keep synchronous and freeze into the
      // job payload, same as intimation's buildGenericIntimationFields.
      const originalIntimationFields = await this.buildOriginalIntimationFieldsFromClaim(claim, employee);

      // "Received by us" interim status — mirrors CLAIM INTIMATION's role for the
      // intimation job. Confirmed via full-codebase grep to be completely unused
      // anywhere before this change, same adoption process as CLAIM INTIMATION.
      const submissionReceivedStatus = await this.claimStatusRepo.findOne({ where: { status: "CLAIM BILLS PENDING" } });
      if (!submissionReceivedStatus) {
        throw new BadRequestException("CLAIM BILLS PENDING claim status not configured in system");
      }

      const savedClaim = await this.claimRepo.manager.transaction(async (manager) => {
        await manager.update(PolicyClaim, claimId, {
          claimStatus: submissionReceivedStatus.status,
          documentIds: dto.documentIds,
          claimDateOfDischarge: dto.dateOfDischarge ? new Date(dto.dateOfDischarge) : claim.claimDateOfDischarge,
          claimAmount: dto.finalClaimedAmount ?? claim.claimAmount,
        });
        const claimAudit = this.claimAuditRepo.create({
          policyClaimId: claimId,
          policyClaimStatusId: submissionReceivedStatus.id,
          userId: employee.userId ?? 0,
          sourceFileUploadId: null,
        });
        await manager.save(PolicyClaimAudit, [claimAudit]);

        const job = this.claimTpaJobRepo.create({
          policyClaimId: claimId,
          jobType: CLAIM_TPA_JOB_TYPE.SUBMIT_CLAIM,
          status: CLAIM_TPA_JOB_STATUS.PENDING,
          sourcePayload: { dto, claimId },
          requestPayload: {
            appKey,
            executionMode,
            userEmail: employee.email ?? "",
            employeeId: claim.employeeId,
            policyId: claim.policyId,
            tpaClaimRef: tpaClaimRef ?? "",
            tpaClaimRefExt: tpaClaimRefExt ?? "0",
            originalIntimationFields,
            // Document ids/types only — the actual file bytes are fetched fresh
            // from our own storage at delivery time (see deliverSubmitClaimJob),
            // not embedded here. Keeps this row small and avoids the
            // synchronous-fetch-can-fail gap intimation's SINGLE-flow still has.
            documentIds: dto.documentIds,
            submissionFields: {
              dateOfDischarge: dto.dateOfDischarge ?? null,
              finalClaimedAmount: dto.finalClaimedAmount ?? claim.claimAmount ?? null,
              payeeName: dto.payeeName ?? null,
              bankAccountNo: dto.bankAccountNo ?? null,
              accountType: dto.accountType ?? null,
              ifscCode: dto.ifscCode ?? null,
            },
            extraFields: dto.extraFields ?? {},
          },
        });
        await manager.save(ClaimTpaSubmissionJob, [job]);

        return { claim, job };
      });

      this.logInfo("submitClaim", { message: "[STEP 3] Claim submission received — queued for background delivery", claimId, executionMode, jobId: savedClaim.job.id });

      return {
        success: true,
        claimId,
        claimStatus: submissionReceivedStatus.status,
        message: "Your claim submission has been received. We're delivering your documents to the TPA now — this happens in the background, and you can check back shortly for the outcome.",
        documentResults: undefined,
      };
    } catch (error) {
      this.logError("submitClaim", { message: "[FAIL] submitClaim threw an error", error, claimId, incomingDto: dto });
      throw error;
    }
  }

  /**
   * Resolves whether a policy's TPA uses the SINGLE-step (combined) or MULTI-step
   * (intimate then submit) claim flow — lets the frontend decide which form/wizard
   * to show before the user starts filling anything in.
   */
  async getClaimFlowMode(policyId: number): Promise<{
    claimFormType: "SINGLE" | "MULTI";
    requiresDischargeAtIntimation: boolean;
    requiresDischargeAtSubmission: boolean;
  }> {
    const policy = await this.policyRepo.findOne({ where: { id: policyId }, relations: ["tpaMappings"] });
    if (!policy) {
      throw new BadRequestException(`Policy with ID ${policyId} not found`);
    }
    const policyTpaId = policy.tpaMappings?.[0]?.tpaId ?? null;
    if (!policyTpaId) {
      return { claimFormType: "SINGLE", requiresDischargeAtIntimation: false, requiresDischargeAtSubmission: false };
    }
    const rows = await this.claimRepo.manager.query<{
      claim_form_type: string | null;
      api_type: string;
      has_discharge: boolean;
    }[]>(`
      SELECT cfg.claim_form_type, cfg.api_type,
             (ear.magic_url_api_payload::text ILIKE '%dateOfDischarge%') AS has_discharge
      FROM   public.tpa_external_feature_config cfg
      JOIN   public.mstr_ext_application_ref ear ON ear.id = cfg.app_ref_id
      WHERE  cfg.tpa_id = $1 AND cfg.api_type IN ('INTIMATE_CLAIM', 'SUBMIT_CLAIM') AND cfg.is_active = true
    `, [policyTpaId]);

    // Whether the claim form needs a discharge date field at each stage is decided
    // purely by whether that TPA's OWN configured payload template (admin-editable via
    // iWork, no code involved) actually references {{dateOfDischarge}} — not a hardcoded
    // per-TPA check. ISBS needs it at intimation (clmHospTo); FHPL needs it at submission
    // (DateofDischarge); Health India currently needs it at neither (GetClaimDocumentSubmission
    // doesn't reference it) — all three fall out of this same generic check automatically.
    const intimateRow = rows.find((r) => r.api_type === "INTIMATE_CLAIM");
    const submitRow = rows.find((r) => r.api_type === "SUBMIT_CLAIM");

    return {
      claimFormType: intimateRow?.claim_form_type === "MULTI" ? "MULTI" : "SINGLE",
      requiresDischargeAtIntimation: !!intimateRow?.has_discharge,
      requiresDischargeAtSubmission: !!submitRow?.has_discharge,
    };
  }

  // Turns "someExternalFieldName" / "some_external_field" into "Some External Field Name"
  // for a reasonable default label — there's no dedicated label column on
  // tpa_payload_field_mapping, just externalFieldName.
  private humanizeFieldName(name: string): string {
    const spaced = name
      .replace(/[_-]+/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    return spaced
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  /**
   * Fields a TPA's claim payload needs that our own system can't source (not a
   * canonical field, not DB-mappable) — configured by an admin on the app ref's
   * "Default Field Mappings" (iWork, TpaAppRefForm) as sourceType = USER_INPUT on
   * tpa_payload_field_mapping. The claims-intimation/-submission form fetches this
   * list to render extra inputs dynamically, instead of every new TPA-specific field
   * requiring a new hardcoded form field and a new canonical dynamicField in code.
   */
  async getClaimExtraFields(
    policyId: number,
    apiType: "INTIMATE_CLAIM" | "SUBMIT_CLAIM",
  ): Promise<{ name: string; label: string; fieldType: string; isRequired: boolean }[]> {
    const policy = await this.policyRepo.findOne({ where: { id: policyId }, relations: ["tpaMappings"] });
    const policyTpaId = policy?.tpaMappings?.[0]?.tpaId ?? null;
    if (!policyTpaId) return [];

    const rows = await this.claimRepo.manager.query<{
      external_field_name: string;
      field_type: string | null;
      is_required: boolean;
    }[]>(`
      SELECT f.external_field_name, f.field_type, f.is_required
      FROM   public.tpa_payload_field_mapping f
      JOIN   public.tpa_external_feature_config c ON c.id = f.feature_config_id
      WHERE  c.tpa_id = $1 AND c.api_type = $2 AND c.is_active = true AND f.source_type = 'USER_INPUT'
      ORDER BY f.id
    `, [policyTpaId, apiType]);

    return rows.map((r) => ({
      name: r.external_field_name,
      label: this.humanizeFieldName(r.external_field_name),
      fieldType: r.field_type || "text",
      isRequired: r.is_required,
    }));
  }

  /**
   * Lists an employee's claims currently sitting in INTIMATED status (MULTI-flow
   * TPAs only) — lets the frontend surface a "Continue Submission" action without
   * needing to touch the main claims-overview response shape used elsewhere.
   */
  async getIntimatedClaims(employeeId: number): Promise<{
    claimId: number;
    claimNumber: string | null;
    policyId: number;
    hospitalName: string | null;
    claimDate: Date | null;
  }[]> {
    const claims = await this.claimRepo.find({
      where: { employeeId, claimStatus: "INTIMATED" },
      order: { claimDate: "DESC" },
    });
    return claims.map((c) => ({
      claimId: c.id,
      claimNumber: c.claimNumber ?? null,
      policyId: c.policyId,
      hospitalName: c.claimHospital ?? null,
      claimDate: c.claimDate ?? null,
    }));
  }

  async createTicket(
    employeeId: number | null,
    createTicketDto: any,
    userId?: number,
  ): Promise<any> {
    try {
      this.logInfo("createTicket", { employeeId, createTicketDto });

      let employee: any = null;
      if (employeeId !== null && Number.isFinite(Number(employeeId))) {
        employee = await this.companyEmployeeRepository.getEmployeeDetailsByEmployeeId(
          Number(employeeId),
        );
        if (!employee) {
          throw new NotFoundException(`Employee with ID ${employeeId} not found`);
        }
      }

      const savedTicket = await this.companyEmployeeRepository.createTicket({
        employeeId: employeeId ?? null,
        isAnonymousUser: employeeId === null,
        category: createTicketDto.category,
        mailId: createTicketDto.mailId,
        escalationDescription: createTicketDto.escalationDescription,
        documentIds: createTicketDto.documentIds,
        userId: userId ?? undefined,
      });

      this.logInfo("createTicket", {
        message: "Ticket created successfully",
        ticketId: savedTicket.ticketId,
        employeeId
      });

      return {
        id: savedTicket.id,
        employeeId: savedTicket.employeeId ?? null,
        isAnonymousUser: Boolean(savedTicket.isAnonymousUser),
        ticketId: savedTicket.ticketId,
        status: savedTicket.status,
        createdAt: savedTicket.createdAt,
      };

    } catch (error) {
      this.logError("createTicket", { error, employeeId, createTicketDto });
      throw error;
    }
  }

  async updateTicketStatus(
    id: number,
    dto: { status: string; comment: string },
  ): Promise<any> {
    try {
      this.logInfo("updateTicketStatus", { id, dto });

      const ticket = await this.companyEmployeeRepository.findTicketById(id);
      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${id} not found`);
      }

      const allowedNextStatuses = TICKET_STATUS_TRANSITIONS[ticket.status] ?? [];
      if (!allowedNextStatuses.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change ticket status from ${ticket.status} to ${dto.status}`,
        );
      }

      const savedTicket = await this.companyEmployeeRepository.updateTicketStatus(
        id,
        dto.status as any,
        dto.comment,
      );

      this.logInfo("updateTicketStatus", {
        message: "Ticket status updated successfully",
        id,
        status: savedTicket.status,
      });

      return {
        id: savedTicket.id,
        ticketId: savedTicket.ticketId,
        employeeId: savedTicket.employeeId ?? null,
        isAnonymousUser: Boolean(savedTicket.isAnonymousUser),
        mailId: savedTicket.mailId,
        category: savedTicket.category,
        status: savedTicket.status,
        comment: savedTicket.comment,
      };
    } catch (error) {
      this.logError("updateTicketStatus", { error, id, dto });
      throw error;
    }
  }

  async getTicketsByEmployeeId(
    employeeId: number,
    queryDto: any
  ): Promise<any> {
    try {
      this.logInfo("getTicketsByEmployeeId", { employeeId, queryDto });

      // Verify employee exists
      const employee = await this.companyEmployeeRepository.getEmployeeDetailsByEmployeeId(employeeId);
      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      const { page = 1, limit = 10, status, category } = queryDto;

      const { tickets, totalItems } = await this.companyEmployeeRepository.getTicketsByEmployeeId(
        employeeId,
        { page, limit, status, category }
      );

      // Transform to response format
      const now = new Date();
      const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const calendarDayDiff = (a: Date, b: Date) =>
        Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
                    new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) / 86400000);

      const data = tickets.map(ticket => {
        const createdDate = new Date(ticket.createdAt);
        const raisedDaysAgo = Math.round(
          (todayDay - new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime()) / 86400000
        );
        const isClosedOrResolved = ['resolved', 'closed'].includes(ticket.status);
        const closedDate = ticket.resolvedAt ?? (isClosedOrResolved ? ticket.updatedAt : null);
        const daysToClose = (isClosedOrResolved && closedDate)
          ? calendarDayDiff(new Date(closedDate), createdDate)
          : null;

        return {
          id: ticket.id,
          employeeId: ticket.employeeId,
          ticketId: ticket.ticketId,
          category: ticket.category,
          mailId: ticket.mailId,
          escalationDescription: ticket.escalationDescription,
          documentIds: ticket.documentIds,
          status: ticket.status,
          priority: ticket.priority,
          raisedBy: (ticket as any).raisedBy ?? 'EMPLOYEE',
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          resolvedAt: ticket.resolvedAt ?? null,
          raisedDaysAgo,
          daysToClose,
          employee: ticket.employee ? {
            name: ticket.employee.name || '',
            email: ticket.employee.primaryContactPersonEmail || '',
            employeeId: ticket.employee.employeeId || '',
          } : undefined,
        };
      });

      const totalPages = Math.ceil(totalItems / limit);

      this.logInfo("getTicketsByEmployeeId", { 
        message: "Retrieved tickets successfully", 
        employeeId, 
        totalItems,
        page,
        limit 
      });

      return {
        data,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

    } catch (error) {
      this.logError("getTicketsByEmployeeId", { error, employeeId, queryDto });
      throw error;
    }
  }

  async getTicketsByDomain(domain: string, queryDto: any): Promise<any> {
    try {
      this.logInfo("getTicketsByDomain", { domain, queryDto });

      if (!domain?.trim()) {
        return { data: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false, hasPrev: false }, companyId: null };
      }

      const config = await this.configCompanyRepository.findOne({
        where: { subDomain: domain.trim() },
      });

      if (!config?.companyId) {
        this.logInfo("getTicketsByDomain", { message: "No company found for domain", domain });
        return { data: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false, hasPrev: false }, companyId: null };
      }

      const companyId = config.companyId;
      const { page = 1, limit = 50, status, category } = queryDto;

      const { tickets, totalItems } = await this.companyEmployeeRepository.getTicketsByCompanyId(
        companyId, { page, limit, status, category }
      );

      const now = new Date();
      const todayDayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const calDiff = (a: Date, b: Date) =>
        Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
                    new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) / 86400000);

      const data = tickets.map(ticket => {
        const createdDate = new Date(ticket.createdAt);
        const raisedDaysAgo = Math.round(
          (todayDayTs - new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime()) / 86400000
        );
        const isClosedOrResolved = ['resolved', 'closed'].includes(ticket.status);
        const closedDate = ticket.resolvedAt ?? (isClosedOrResolved ? ticket.updatedAt : null);
        const daysToClose = (isClosedOrResolved && closedDate)
          ? calDiff(new Date(closedDate), createdDate)
          : null;

        return {
          id: ticket.id,
          employeeId: ticket.employeeId,
          ticketId: ticket.ticketId,
          category: ticket.category,
          mailId: ticket.mailId,
          escalationDescription: ticket.escalationDescription,
          documentIds: ticket.documentIds,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          resolvedAt: ticket.resolvedAt ?? null,
          raisedDaysAgo,
          daysToClose,
          employee: ticket.employee ? {
            name: ticket.employee.name || '',
            email: ticket.employee.primaryContactPersonEmail || '',
            employeeId: ticket.employee.employeeId || '',
          } : undefined,
        };
      });

      const totalPages = Math.ceil(totalItems / limit);
      this.logInfo("getTicketsByDomain", { message: "Retrieved company tickets", companyId, totalItems });

      return {
        data,
        pagination: { currentPage: page, totalPages, totalItems, hasNext: page < totalPages, hasPrev: page > 1 },
        companyId,
      };
    } catch (error) {
      this.logError("getTicketsByDomain", { error, domain, queryDto });
      throw error;
    }
  }

  async getTicketById(ticketId: number, employeeId: number): Promise<any> {
    try {
      this.logInfo("getTicketById", { ticketId, employeeId });

      const ticket = await this.companyEmployeeRepository.getTicketById(ticketId, employeeId);

      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${ticketId} not found for employee ${employeeId}`);
      }

      this.logInfo("getTicketById", { 
        message: "Retrieved ticket successfully", 
        ticketId, 
        employeeId 
      });

      return {
        id: ticket.id,
        employeeId: ticket.employeeId,
        ticketId: ticket.ticketId,
        category: ticket.category,
        mailId: ticket.mailId,
        escalationDescription: ticket.escalationDescription,
        documentIds: ticket.documentIds,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        employee: ticket.employee ? {
          name: ticket.employee.name || '',
          email: ticket.employee.primaryContactPersonEmail || '',
          employeeId: ticket.employee.employeeId || '',
        } : undefined,
      };

    } catch (error) {
      this.logError("getTicketById", { error, ticketId, employeeId });
      throw error;
    }
  }

  async getAllCountries() {
    return this.companyEmployeeRepository.fetchAllCountries();
  }

  async getStatesByCountry(countryId: number) {
    return this.companyEmployeeRepository.findStatesByCountry(countryId);
  }

  async getCitiesByState(stateId: number, search?: string) {
    return this.companyEmployeeRepository.findCitiesByState(stateId, search);
  }

  async getEmployeeTpaFeatures(employeeId: number) {
    return this.companyEmployeeRepository.getEmployeeTpaFeatures(employeeId);
  }

  async getEmployeeTpaPortalSsoUrl(employeeId: number): Promise<{ redirectUrl: string }> {
    const tpaInfo = await this.companyEmployeeRepository.getEmployeeTpaInfo(employeeId);

    if (!tpaInfo?.companyEmployeeId) {
      throw new NotFoundException("TPA enrollment information not found for this employee");
    }

    if (!tpaInfo.tpaId) {
      throw new NotFoundException("This employee's policy is not linked to a TPA");
    }

    // buildRedirectUrl itself throws a NotFoundException if this TPA has no active
    // tpa_sso_config row — covers the "does that TPA exist in config" case.
    const redirectUrl = await this.tpaSsoExecutorService.buildRedirectUrl(tpaInfo.tpaId, {
      employeeId,
      policyId: tpaInfo.policyId,
      context: {
        POLICY: { externalTpaPolicyId: tpaInfo.externalTpaPolicyId },
        EMPLOYEE: { companyEmployeeId: tpaInfo.companyEmployeeId },
      },
    });

    return { redirectUrl };
  }

  async saveClaimFormExtraction(payload: {
    policyId: number | null;
    employeeId: number | null;
    fileName: string;
    claimData: Record<string, any>;
    aiResponseData: Record<string, any> | null;
  }) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "IBP CompanyEmployeeService",
          method: "saveClaimFormExtraction",
          payload: { employeeId: payload.employeeId, policyId: payload.policyId, fileName: payload.fileName },
          messageData: "method invoked",
        }),
      });
      return await this.companyEmployeeRepository.saveClaimFormExtraction(payload);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "IBP CompanyEmployeeService",
          method: "saveClaimFormExtraction",
          payload: { employeeId: payload.employeeId, policyId: payload.policyId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw error;
    }
  }
}
