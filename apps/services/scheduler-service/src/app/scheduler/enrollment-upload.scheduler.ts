import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  IsNull,
  In,
  Brackets,
  Between,
  QueryFailedError,
  Any,
  EntityManager,
  Not,
  DataSource,
} from "typeorm";
import { ENV, IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";
import { DocumentProcessingFile } from "../../../../service-lib/src/lib/entities/document-processing-file.entity";
import { FileUpload } from "../../../../service-lib/src/lib/entities/file-upload.entity";
import { PolicyEnrollmentEmployee } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity";
import { PolicyEnrollmentDependent } from "../../../../service-lib/src/lib/entities/policy-enrollment-dependent.entity";
import { PolicyEnrollmentUploadSummary } from "../../../../service-lib/src/lib/entities/policy-enrollment-upload-summary.entity";
import { PolicyEnrollmentEmployeePolicyMap } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity";
import { PolicyEmployeeEnrollment } from "../../../../service-lib/src/lib/entities/policy-employee-enrollment.entity";
import { PolicyEmployeeEndorsement } from "../../../../service-lib/src/lib/entities/policy-employee-endorsement.entity";
import { PolicyDependentEndorsement } from "../../../../service-lib/src/lib/entities/policy-dependent-endorsement.entity";
import { PolicyAsset } from "../../../../service-lib/src/lib/entities/policy-asset.entity";
import { PolicySubAsset } from "../../../../service-lib/src/lib/entities/policy-sub-asset.entity";
import { PolicyAssetEndorsementMap } from "../../../../service-lib/src/lib/entities/policy-asset-endorsement-map.entity";
import { PolicySubAssetEndorsementMap } from "../../../../service-lib/src/lib/entities/policy-sub-asset-endorsement-map.entity";
import { PolicyAssetEndorsement } from "../../../../service-lib/src/lib/entities/policy-asset-endorsement.entity";
import { Endorsement } from "../../../../service-lib/src/lib/entities/endorsement.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { PolicyExtensionAudit, ENDORSEMENT_TYPE_EXTENSION } from "../../../../service-lib/src/lib/entities/policy-extension-audit.entity";
import { PolicyTpaMap } from "../../../../service-lib/src/lib/entities/policy-tpa-map.entity";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { Role } from "../../../../service-lib/src/lib/entities/roles.entity";
import { UserRole } from "../../../../service-lib/src/lib/entities/user-role.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { AuthenticationMethod } from "../../../../service-lib/src/lib/entities/authentication-method.entity";
import { PolicyEmployeeEnrollmentChoice } from "../../../../service-lib/src/lib/entities/policy-employee-enrollment-choice.entity";
import { CompanyAuthenticationMapping } from "../../../../service-lib/src/lib/entities/company-authentication-mapping.entity";
import { MappingTemplateColumn } from "../../../../service-lib/src/lib/entities/mapping-template-column.entity";
import { MappingTemplateVersion } from "../../../../service-lib/src/lib/entities/mapping-template-version.entity";
import { MstrEntityFieldsUtilityRef } from "../../../../service-lib/src/lib/entities/mstr-entity-fields-utility-ref.entity";
import {
  downloadFromS3,
  generateExcel,
  uploadToS3,
  generateExcelStream,
  processChunksAsStream,
  errorStream
} from "../../../../service-lib/src/lib/utils/file-management.utils";
import {
  buildDeletionLookupKeys,
  findRelationIndex,
  normalizeValue,
  parseDateValue,
  formatDateForDisplay,
  processEmployeeUpload,
  processMemberDataUpload as processMemberDataUploadCore,
  resolveDeletionEffectiveDate,
} from "../../../../service-lib/src/lib/utils/company-employee-upload.util";
import {
  resolveDependentOnlyPremiumByConfiguration,
  resolveOptionIdForLife,
  resolveSumInsuredIdForValue,
  type OptionMetaEntry,
} from "../../../../service-lib/src/lib/utils/per-dependent-resolution.util";
import { convertSafeStringToInteger } from "../../../../service-lib/src/lib/utils/parse.utils";
import {
  fetchValidPolicyLocations,
  fetchDefaultCountryCallingCode,
  normalizePolicyLocationCode,
} from "../../../../service-lib/src/lib/utils/policy-location.util";
import * as XLSX from "xlsx";
import * as ExcelJS from "exceljs";
import {
  serviceNames,
  DOCUMENT_PROCESS_STATUS,
  DOCUMENT_TYPE_POLICY_EMPLOYEE_DATA,
  DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA,
  DOCUMENT_TYPE_POLICY_EMPLOYEE_BYPASS_ENROLLMENT,
  COMPANY_EMPLOYEE_ROLE_KEY,
  USER_TYPE_COMPANY_EMPLOYEE,
  USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
  USER_TYPE_IIRM_EMPLOYEE,
  DOCUMENT_TYPE_POLICY_ASSET_ENROLLMENT_DATA,
  UTILITY_UPLOAD_ENTITY,
  PREMIUM_CALCULATOR_HEADERS,
} from "../../../../service-lib/src/lib/constants";
import { PolicyConfiguration } from "../../../../service-lib/src/lib/entities/policy-configuration.entity";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { createRedisClient } from "../../../../service-lib/src/lib/utils/redis.util";
import {
  endorsementFileUploadMessages,
  errorMessages,
  infoMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import axios, { AxiosError } from "axios";
import Redis from "ioredis";
import { UpsertEnrollmentDependentDto } from "../dto/upsert-enrollment-dependent.dto";
import { EnrollmentEmployeePolicyDto } from "../dto/enrollment-employee-policy.dto";
import {
  POLICY_RELATIONSHIP_TYPE_PARAMETER,
  DEPENDENT_COUNT_INTERNAL_TYPE,
  DEPENDENT_COUNT_ALL_CATEGORY,
  POLICY_CONFIGURATION_STATUS_LIVE,
  USER_STATUS_ACTIVE,
  EMPLOYEE_ENDORSEMENT_READY,
  EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED,
  ASSET_ENDORSEMENT_READY,
  ASSET_ENDORSEMENT_HEADERS,
  DATA_INTAKE_TYPE,
  DATA_TYPES,
  GENDER_VALUES,
  BOOLEAN_VALUES,
  PARENT_RELATIONSHIP_TYPES,
  IS_EDITABLE,
  EMPLOYEE_ID_HEADERS_FOR_TPA_FILE,
  EMPLOYEE_ID_HEADER_LABEL,
  TPA_ID_HEADER_LABEL,
  POSSIBLE_EMPLOYEE_ID_HEADERS_FOR_TPA_FILE,
  DOCUMENT_TYPE_POLICY_TPA_ID_UPLOAD,
  CHILD_RELATIONSHIP_TYPES,
  POSSIBLE_EMPLOYEE_NAME_HEADERS_FOR_TPA_FILE,
  POSSIBLE_EMPLOYEE_GENDER_HEADERS_FOR_TPA_FILE,
  ENROLLMENT_TPA_ID_HEADERS,
  ENROLLMENT_FIELD_HEADERS,
  POLICY_LOCATION_FIELD_NAME,
  POLICY_LOCATION_COLUMN_NAME,
  POLICY_LOCATION_REQUIRED_ERROR,
  POLICY_LOCATION_MISMATCH_ERROR,
  ENDORSEMENT_TYPES,
  NON_FINANCIAL_CONSTANTS,
  UTILITY_UPLOAD_ENTITY_TPA,
  FILE_DIRECTION_INBOUND,
  ERROR_TPA_ID_REQUIRED,
  ERROR_MISSING_MAPPING_FOR_TARGET_PREFIX,
  EMPLOYEE_ENDORSEMENT_PROCESSED,
  EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT,
  EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING,
  EMPLOYEE_ENDORSEMENT_ACKNOWLEDGED,
  EMPLOYEE_ENDORSEMENT_DOWNLOADED,
  EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
  DEFAULT_PAGE,
  PER_MILLE_RATE,
  SUM_INSURED_MODELS,
  SCHEDULER_HANDLERS,
  DEFAULT_TOTAL_KPI_COUNT,
  OPPORTUNITY_TYPE,
  DOCUMENT_ENTITY_TYPE_POLICY_EXTENSION,
  DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
  MAX_DEPENDENT_COUNT_INTERNAL_TYPE,
  DOCUMENT_TYPE_POLICY_ENDORSEMENT_MEMBER_UPLOAD,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { GetEmployeeDetails } from "../dto/get-employee-details.dto";
import { formatDuration, intervalToDuration } from "date-fns";
import { formatSize, normalizeHeader, snakeToTitle } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { S3 } from "aws-sdk";
import {
  EnrollmentProcessingService,
  resolveDependentCountOptionId,
} from "../../../../service-lib/src/lib/utils/enrollment-processing.util";
import { premiumCalculator, toMidnight, daysBetweenInclusive, calculateApplicableDays } from "../../../../service-lib/src/lib/utils/premium-calculator.util";
import { SchedulerEnrollmentProcessingRepository } from "./enrollment-processing.repository";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";
// import { PolicyEmployeeEnrollmentChoice } from "apps/services/service-lib/src/lib/entities";

@Injectable()
export class EnrollmentUploadScheduler implements OnModuleInit {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly enrollmentProcessing: EnrollmentProcessingService;
  private readonly enrollmentRepoAdapter: SchedulerEnrollmentProcessingRepository;
  private redis!: Redis;
  private storageType: string | undefined;
  constructor(
    @InjectRepository(DocumentProcessingFile)
    private readonly uploadRepo: Repository<DocumentProcessingFile>,
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly companyEmployeeRepo: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(PolicyEnrollmentDependent)
    private readonly dependentRepo: Repository<PolicyEnrollmentDependent>,
    @InjectRepository(PolicyEnrollmentUploadSummary)
    private readonly summaryRepo: Repository<PolicyEnrollmentUploadSummary>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
    @InjectRepository(PolicyEmployeeEnrollment)
    private readonly employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>,
    @InjectRepository(PolicyEmployeeEndorsement)
    private readonly policyEmployeeEndorsementRepo: Repository<PolicyEmployeeEndorsement>,
    @InjectRepository(PolicyDependentEndorsement)
    private readonly policyDependentEndorsementRepo: Repository<PolicyDependentEndorsement>,
    @InjectRepository(PolicyAsset)
    private readonly policyAssetRepo: Repository<PolicyAsset>,
    @InjectRepository(PolicySubAsset)
    private readonly policySubAssetRepo: Repository<PolicySubAsset>,
    @InjectRepository(PolicyAssetEndorsementMap)
    private readonly policyAssetEndorsementMapRepo: Repository<PolicyAssetEndorsementMap>,
    @InjectRepository(PolicySubAssetEndorsementMap)
    private readonly policySubAssetEndorsementMapRepo: Repository<PolicySubAssetEndorsementMap>,
    @InjectRepository(PolicyAssetEndorsement)
    private readonly policyAssetEndorsementRepo: Repository<PolicyAssetEndorsement>,
    @InjectRepository(Endorsement)
    private readonly endorsementRepo: Repository<Endorsement>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(PolicyConfiguration)
    private readonly policyConfigRepo: Repository<PolicyConfiguration>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
    @InjectRepository(AuthenticationMethod)
    private readonly authenticationMethodRepo: Repository<AuthenticationMethod>,
    @InjectRepository(CompanyAuthenticationMapping)
    private readonly companyAuthenticationMapRepo: Repository<CompanyAuthenticationMapping>,
    private readonly jwtService: JwtService,
    private readonly traceIdService: TraceIdService,
    private readonly dynamicCronService: DynamicCronService,
    @InjectRepository(PolicyEmployeeEnrollmentChoice)
    private readonly employeeEnrollmentChoiceRepo: Repository<PolicyEmployeeEnrollmentChoice>,
    private readonly dataSource: DataSource,
    @InjectRepository(PolicyExtensionAudit)
    private readonly policyExtensionAuditRepo: Repository<PolicyExtensionAudit>,
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE
    );
    this.storageType = ENV.STORAGE_TYPE;
    if (this.storageType === "valkey") {
      this.redis = createRedisClient({
        logger: this.logger,
        traceId: this.traceIdService.traceId,
        location: "scheduler-service EnrollmentUploadScheduler",
        method: "constructor",
      })!;
    }

    this.enrollmentRepoAdapter = new SchedulerEnrollmentProcessingRepository(
      this.lookUpRepository,
      this.policyConfigRepo,
      this.companyEmployeeRepo,
      this.dependentRepo,
      this.employeeEnrollmentRepo,
      this.employeeEnrollmentChoiceRepo,
      this.employeePolicyMapRepo,
      this.uploadRepo
    );
    this.enrollmentProcessing = new EnrollmentProcessingService({
      logger: this.logger,
      traceId: this.traceIdService.traceId,
      location: "scheduler-service EnrollmentUploadScheduler",
      redis: this.redis,
      dataSource: this.dataSource,
      policyRepo: this.policyRepo,
      enrollmentRepository: this.enrollmentRepoAdapter,
    });
  }

  async onModuleInit() {
    this.logger.log("Initializing EnrollmentUploadScheduler...");

    const ENROLLMENT_UPLOAD_KEYS = [
      "HANDLE_UPLOADS",
      "HANDLE_ENROLLMENT_UPLOADS",
      "HANDLE_ASSET_ENROLLMENT_UPLOADS",
      "HANDLE_TPA_ID_UPLOADS",
      "HANDLE_ENROLLMENT_ACTIVATION",
      "HANDLE_PASSWORD_HASH_BACKFILL",
      "HANDLE_MEMBER_DATA_UPLOADS",
    ];

    const handlers = new Map<string, () => Promise<void>>();

    for (const key of ENROLLMENT_UPLOAD_KEYS) {
      const methodName = SCHEDULER_HANDLERS[key];
      console.log(`Mapping key: ${key} to method: ${methodName}`);
      if (!methodName) {
        this.logger.warn(`No handler mapping found for key: ${key}`);
        continue;
      }
      const method = this[methodName as keyof EnrollmentUploadScheduler];

      if (typeof method === "function") {
        handlers.set(key, (method as () => Promise<void>).bind(this));
        this.logger.log(`Registered handler: ${key} -> ${methodName}`);
      }
    }

    this.dynamicCronService.registerHandlers(handlers);
    this.logger.log("EnrollmentUploadScheduler handlers registered");
  }

  private logInfo(method: string, messageData: unknown) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "scheduler-service EnrollmentUploadScheduler",
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
        location: "scheduler-service EnrollmentUploadScheduler",
        method,
        messageData,
      }),
    });
  }

  private getCellValue(row: Record<string, any>, ...aliases: string[]) {
    for (const alias of aliases) {
      if (alias in row) {
        return row[alias];
      }
      const normalizedAlias = alias.toLowerCase().replace(/\s+/g, "");
      for (const key of Object.keys(row)) {
        if (key.toLowerCase().replace(/\s+/g, "") === normalizedAlias) {
          return row[key];
        }
      }
    }
    return undefined;
  }

  private areAdditionalValuesEqual(
    existingValue: any,
    incomingValue: any
  ): boolean {
    if (existingValue === incomingValue) {
      return true;
    }
    if (
      existingValue !== null &&
      incomingValue !== null &&
      typeof existingValue === "object" &&
      typeof incomingValue === "object"
    ) {
      try {
        return JSON.stringify(existingValue) === JSON.stringify(incomingValue);
      } catch {
        return false;
      }
    }
    return false;
  }

  private mergeAdditionalParams(
    existing: Record<string, any> | null | undefined,
    incoming: Record<string, any> | null | undefined
  ): { merged: Record<string, any>; hasChanges: boolean } {
    const base =
      existing && typeof existing === "object" ? { ...existing } : {};
    const additions = incoming && typeof incoming === "object" ? incoming : {};

    let hasChanges = false;
    for (const [key, value] of Object.entries(additions)) {
      if (!Object.prototype.hasOwnProperty.call(base, key)) {
        base[key] = value;
        hasChanges = true;
      } else if (!this.areAdditionalValuesEqual(base[key], value)) {
        base[key] = value;
        hasChanges = true;
      }
    }

    return { merged: base, hasChanges };
  }

  private isInceptionFlagEnabled(flag?: string) {
    if (typeof flag === "string") {
      return flag.trim().toLowerCase() === "true";
    }
    return Boolean(flag);
  }

  private async getEmployeeDetailsWithDependentsIfExists(
    companyEmployeeId: string,
    companyId: number,
    policyId: number
  ) {
    const employee = await this.companyEmployeeRepo.findOne({
      where: {
        companyId,
        companyEmployeeId,
      },
    });

    if (!employee) {
      return null;
    }

    const isMappedToPolicy = await this.employeePolicyMapRepo.exists({
      where: { policyId, employeeId: employee.id },
    });
    if (!isMappedToPolicy) {
      return null;
    }

    const dependents = await this.dependentRepo.find({
      where: {
        employeeId: employee.id,
        policyId,
        deletedAt: IsNull(),
      },
    });

    return { employee, dependents };
  }

  private buildRowObjectFromEmployeeEntity(
    employee: PolicyEnrollmentEmployee,
    headers: string[]
  ) {
    const rowObj: Record<string, any> = {};
    headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().replace(/[\s_]+/g, "");
      if (normalizedHeader === "employeeid") {
        rowObj[header] = employee.companyEmployeeId ?? "";
      } else if (normalizedHeader === "fullname") {
        rowObj[header] = employee.employeeName ?? "";
      } else if (normalizedHeader === "dateofbirth") {
        rowObj[header] = employee.dateOfBirth
          ? this.toDateOnlyString(new Date(employee.dateOfBirth))
          : "";
      } else if (normalizedHeader === "email") {
        rowObj[header] = employee.email ?? "";
      } else if (normalizedHeader === "mobilenumber") {
        rowObj[header] = employee.phoneNumber ?? "";
      }
    });
    return rowObj;
  }

  private async storeEnrollmentData(key: string, value: any) {
    const serialized = JSON.stringify(value);

    try {
      await this.redis.set(key, serialized);
      const exists = await this.redis.exists(key);
      this.logInfo("storeEnrollmentData", {
        key,
        backend: "valkey",
        stored: exists === 1,
      });
    } catch (err) {
      this.logError("storeEnrollmentData", {
        key,
        backend: "valkey",
        error: err,
      });
      throw err;
    }
  }

  private async submitEnrollmentBatch(
    enrollmentBatchKey: string,
    token: string,
    userId: string | number,
    endorsementId?: number
  ) {
    const url = `${ENV.URL_IBP_SERVICE}/company-employee/policy/enrollment/batch`;
    const config = {
      headers: { 
        Authorization: `Bearer ${token}`, 
        userid: userId,
        'x-bypass-timeout': 'true',
      },
    };
    this.logInfo("submitEnrollmentBatch", {
      enrollmentBatchKey,
      endorsementId,
    });
    try {
      return await axios.put(
        url,
        { enrollmentBatchKey, endorsementId },
        config
      );
    } catch (err) {
      const errorData =
        err instanceof AxiosError ? err.response?.data ?? err.message : err;
      this.logError("submitEnrollmentBatch", { error: errorData });
      throw err;
    }
  }

  private calculateAgeAtEffectiveDate(dob: Date, effectiveDate: Date): number {
      const today = new Date(effectiveDate) ?? new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return Math.floor(age);
  }


  private calculateAge(dob: Date): number {
    const today = new Date();
    if (!(dob instanceof Date) || Number.isNaN(dob.getTime())) {
      throw new Error(endorsementFileUploadMessages.ER0067);
    }

    const createBirthdayForYear = (year: number) => {
      const month = dob.getMonth();
      const day = dob.getDate();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, Math.min(day, daysInMonth));
    };

    const thisYearBirthday = createBirthdayForYear(today.getFullYear());

    let fullYears = today.getFullYear() - dob.getFullYear();
    if (today < thisYearBirthday) {
      fullYears -= 1;
    }

    const lastBirthdayYear =
      today < thisYearBirthday ? today.getFullYear() - 1 : today.getFullYear();
    const lastBirthday = createBirthdayForYear(lastBirthdayYear);
    const nextBirthday = createBirthdayForYear(lastBirthdayYear + 1);

    const elapsedMs = today.getTime() - lastBirthday.getTime();
    const yearDurationMs = nextBirthday.getTime() - lastBirthday.getTime();
    const fractionOfYear = yearDurationMs > 0 ? elapsedMs / yearDurationMs : 0;
    // TODO: Removing the fractional part as per new requirement as users are not considering the fractional age in current business scenarios and only taking the full years into account
    return fullYears;
  }

  private parseExcelDate(value: any): Date | null {
    return parseDateValue(value);
  }

  private parseSupportedEffectiveDate(value: unknown): {
    parsedDate: Date | null;
    hasFormatError: boolean;
  } {
    if (value === undefined || value === null) {
      return { parsedDate: null, hasFormatError: false };
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return { parsedDate: null, hasFormatError: false };
      }

      const isSupportedPattern =
        /^\d{2}\/\d{2}\/\d{4}$/.test(trimmed) ||
        /^\d{4}-\d{2}-\d{2}$/.test(trimmed);

      if (!isSupportedPattern) {
        return { parsedDate: null, hasFormatError: true };
      }

      const parsedDate = this.parseExcelDate(trimmed);
      return { parsedDate, hasFormatError: !parsedDate };
    }

    return {
      parsedDate: this.parseExcelDate(value),
      hasFormatError: false,
    };
  }

  private formatExcelDate(value: any): any {
    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(
          parsed.d
        ).padStart(2, "0")}`;
      }
    }
    return value;
  }

  private async getSelfAgeLimits(
    policyId: number
  ): Promise<{ min?: number; max?: number } | null> {
    try {
      const liveStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
      });

      if (!liveStatus) {
        return null;
      }

      const config = await this.policyConfigRepo.findOne({
        where: {
          policyId,
          policyConfiguartionStatusLid: liveStatus.id,
        },
      });

      if (!config?.policyConfiguration) {
        return null;
      }

      const relationships =
        (config.policyConfiguration as any)?.relationships
          ?.enabledPolicyRelations || [];

      for (const relation of relationships) {
        if (!relation) {
          continue;
        }

        const configuredOptions = Array.isArray(relation.configuredOptions)
          ? relation.configuredOptions
          : [];

        const normalizedType = normalizeValue(String(relation.type ?? ""));
        const selfOption = configuredOptions.find((option: any) => {
          const normalizedName = normalizeValue(String(option?.name ?? ""));
          return normalizedName === "self" || normalizedType === "self";
        });

        if (!selfOption) {
          continue;
        }

        const minAge = Number(selfOption.minAge);
        const maxAge = Number(selfOption.maxAge);
        const hasMinAge =
          selfOption.minAge !== undefined &&
          selfOption.minAge !== null &&
          String(selfOption.minAge).trim() !== "";
        const hasMaxAge =
          selfOption.maxAge !== undefined &&
          selfOption.maxAge !== null &&
          String(selfOption.maxAge).trim() !== "";

        return {
          min: hasMinAge && !Number.isNaN(minAge) ? minAge : undefined,
          max: hasMaxAge && !Number.isNaN(maxAge) ? maxAge : undefined,
        };
      }

      return null;
    } catch (error) {
      this.logError("getSelfAgeLimits", { error, policyId });
      return null;
    }
  }

  @Cron("*/2 * * * *")
  async handleUploads() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logInfo("handleUploads", infoMessages.enrollmentSchedulerRunning);
    const upload = await this.getPendingUploads();
    this.logInfo("handleUploads", `Found ${upload?.id} fileId to process.`);
    if (!upload) {
      this.logInfo(
        "handleEnrollmentUploads",
        `Failed to fetch enrollment upload files`
      );
      return;
    }
    await this.processUpload(upload);
  }

  @Cron("*/2 * * * *")
  async handleMemberDataUploads() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logInfo(
      "handleMemberDataUploads",
      "Member data upload scheduler running"
    );
    const upload = await this.getPendingMemberDataUpload();
    if (!upload) {
      this.logInfo(
        "handleMemberDataUploads",
        "No pending member data uploads found"
      );
      return;
    }
    this.logInfo("handleMemberDataUploads", {
      uploadId: upload.id,
      policyId: upload.entityId,
      documentType: upload.documentType,
      message: "Member data upload claimed for processing",
    });
    await this.processMemberDataUpload(upload);
  }

  @Cron("*/2 * * * *")
  async handleEnrollmentUploads() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logInfo(
      "handleEnrollmentUploads",
      "Enrollment data scheduler running"
    );
    const upload = await this.getPendingEnrollmentUploads();
    if (!upload) {
      this.logInfo(
        "handleEnrollmentUploads",
        `Failed to fetch enrollment upload files`
      );
      return;
    }

    const endorsement = await this.endorsementRepo.findOne({
      where: {
        id: upload.endorsementId,
      },
    });
    if (!endorsement || !endorsement.endorsementType) return;

    if (endorsement.endorsementType === ENDORSEMENT_TYPES.FINANCIAL_ENDORSEMENT) {
      if (upload.bypassPolicyConfiguration) {
        await this.processEnrollmentUpload(upload, true);
      } else if ((ENV.ENABLE_LARGE_FILE_HANDLING ?? BOOLEAN_VALUES.FALSE).toLocaleLowerCase() === BOOLEAN_VALUES.FALSE) {
        await this.processEnrollmentUpload(upload, false);
      } else {
        await this.updatedProcessEnrollmentUpload(upload, endorsement);
      }
    } else {
      await this.processNonFinancialEnrollmentUpload(upload);
    }
  }

  @Cron("*/2 * * * *")
  async handleAssetEnrollmentUploads() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logInfo(
      "handleAssetEnrollmentUploads",
      "Asset enrollment data scheduler running"
    );
    const upload = await this.getPendingEnrollmentUploads(true);
    if (!upload) {
      this.logInfo(
        "handleAssetEnrollmentUploads",
        `Failed to fetch enrollment upload files`
      );
      return;
    }
    await this.processAssetEnrollmentUpload(upload);
  }

  @Cron("*/2 * * * *")
  async handleTpaIdUploads() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logInfo("handleTpaIdUploads", "TPA ID upload scheduler running");
    const upload = await this.getPendingTpaIdUpload();
    if (!upload) {
      this.logInfo("handleTpaIdUploads", "No TPA uploads pending");
      return;
    }
    this.logInfo("handleTpaIdUploads", {
      uploadId: upload.id,
      policyId: upload.entityId,
      documentType: upload.documentType,
      message: "TPA upload claimed for processing",
    });
    await this.processTpaIdUpload(upload);
  }

  async handlePasswordHashBackfill() {
    const batchSize = 5000;
    const hashConcurrency = 25;
    const hashRounds = 10;
    const startMs = Date.now();
    const startTime = new Date(startMs).toISOString();
    this.logInfo("handlePasswordHashBackfill", {
      message: "Password hash backfill scheduler running",
      batchSize,
      hashConcurrency,
      startTime,
    });

    let processedCount = 0;
    let foundUsers = false;
    let claimedCount = 0;

    try {
      let remaining = batchSize;
      while (remaining > 0) {
        const take = Math.min(hashConcurrency, remaining);
        const batchStartMs = Date.now();
        const result = await this.dataSource.transaction(async (manager) => {
          const queryStartMs = Date.now();
          const users = await manager.query(
            `SELECT id, password
             FROM users
             WHERE is_password_hashed = false
               AND deleted_at IS NULL
             ORDER BY id ASC
             LIMIT $1
             FOR UPDATE SKIP LOCKED`,
            [take],
          );
          this.logInfo("handlePasswordHashBackfill", {
            message: "Password hash backfill query completed",
            foundCount: users.length,
            durationMs: Date.now() - queryStartMs,
          });

          if (!users.length) {
            return { processed: 0, claimed: 0 };
          }

          foundUsers = true;
          const userRepo = manager.getRepository(User);
          const updates = await Promise.all(
            users.map(async (user: { id: number; password: string }) => {
              const hashedPassword = await bcrypt.hash(
                user.password ?? "",
                hashRounds
              );
              return {
                userId: user.id,
                password: hashedPassword,
                isPasswordHashed: true,
              };
            })
          );
          await userRepo.save(updates);
          return { processed: updates.length, claimed: users.length };
        });

        processedCount += result.processed;
        claimedCount += result.claimed;
        remaining -= result.processed;

        if (result.processed > 0) {
          this.logInfo("handlePasswordHashBackfill", {
            message: "Password hash backfill chunk processed",
            chunkSize: result.processed,
            processedCount,
            remaining,
            durationMs: Date.now() - batchStartMs,
          });
        }

        if (result.processed === 0) {
          break;
        }
      }
    } catch (error) {
      this.logError("handlePasswordHashBackfill", {
        message: "Password hash backfill failed",
        error,
      });
      throw error;
    }

    const endMs = Date.now();
    const endTime = new Date(endMs).toISOString();
    const durationMs = endMs - startMs;
    const duration = this.formatDuration(durationMs);

    if (!foundUsers) {
      this.logInfo("handlePasswordHashBackfill", {
        message: "No users pending password hashing",
        startTime,
        endTime,
        duration,
        durationMs,
        processedCount: 0,
      });
      return;
    }

    this.logInfo("handlePasswordHashBackfill", {
      message: "Password hash backfill completed",
      processedCount,
      claimedCount,
      startTime,
      endTime,
      duration,
      durationMs,
    });
  }

  private async getPendingEnrollmentUploads(isAssetUpload?: boolean) {
    const unprocessedFile = await this.uploadRepo.findOne({
      where: {
        processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
        documentType: isAssetUpload
          ? DOCUMENT_TYPE_POLICY_ASSET_ENROLLMENT_DATA
          : In([
              DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA,
              DOCUMENT_TYPE_POLICY_EMPLOYEE_BYPASS_ENROLLMENT,
            ]),
      },
      order: {
        createdAt: "ASC",
      },
    });

    if (!unprocessedFile) return null;

    const updateFileStatus = await this.uploadRepo
      .createQueryBuilder()
      .update(DocumentProcessingFile)
      .set({ processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING })
      .where("id = :id and process_status != :processStatus", {
        id: unprocessedFile.id,
        processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
      })
      .execute();
    if ((updateFileStatus.affected ?? 0) !== 1) {
      return null;
    }
    return unprocessedFile;
  }

  private async getPendingMemberDataUpload() {
    const unprocessedFile = await this.uploadRepo.findOne({
      where: {
        processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
        documentType: DOCUMENT_TYPE_POLICY_ENDORSEMENT_MEMBER_UPLOAD,
      },
      order: { createdAt: "ASC" },
    });
    if (!unprocessedFile) {
      return null;
    }
    const updateFileStatus = await this.uploadRepo
      .createQueryBuilder()
      .update(DocumentProcessingFile)
      .set({ processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING })
      .where("id = :id and process_status != :processStatus", {
        id: unprocessedFile.id,
        processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
      })
      .execute();
    if ((updateFileStatus.affected ?? 0) !== 1) {
      return null;
    }
    return unprocessedFile;
  }

  private async getPendingUploads() {
    const unprocessedFile = await this.uploadRepo.findOne({
      where: {
        processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
        documentType: DOCUMENT_TYPE_POLICY_EMPLOYEE_DATA,
      },
      order: { createdAt: "ASC" },
    });
    if (!unprocessedFile) {
      return null;
    }
    const updateFileStatus = await this.uploadRepo
      .createQueryBuilder()
      .update(DocumentProcessingFile)
      .set({ processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING })
      .where("id = :id and process_status != :processStatus", {
        id: unprocessedFile.id,
        processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
      })
      .execute();
    if ((updateFileStatus.affected ?? 0) !== 1) {
      return null;
    }
    return unprocessedFile;
  }

  private async getPendingTpaIdUpload() {
    const unprocessedFile = await this.uploadRepo.findOne({
      where: {
        processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
        documentType: DOCUMENT_TYPE_POLICY_TPA_ID_UPLOAD,
      },
      order: { createdAt: "ASC" },
    });

    if (!unprocessedFile) {
      this.logInfo("getPendingTpaIdUpload", "No pending TPA uploads found");
      return null;
    }
    this.logInfo("getPendingTpaIdUpload", {
      uploadId: unprocessedFile.id,
      action: "found",
    });
    const updateFileStatus = await this.uploadRepo
      .createQueryBuilder()
      .update(DocumentProcessingFile)
      .set({ processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING })
      .where("id = :id and process_status != :processStatus", {
        id: unprocessedFile.id,
        processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
      })
      .execute();
    if ((updateFileStatus.affected ?? 0) !== 1) {
      this.logInfo("getPendingTpaIdUpload", {
        uploadId: unprocessedFile.id,
        action: "claim-skipped",
      });
      return null;
    }
    this.logInfo("getPendingTpaIdUpload", {
      uploadId: unprocessedFile.id,
      action: "claimed",
    });
    this.logInfo("getPendingTpaIdUpload", {
      uploadId: unprocessedFile.id,
      action: "status-updated",
      processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
    });

    return unprocessedFile;
  }

  private getRawCellValue(
    sheet: XLSX.WorkSheet,
    rowIndex: number,
    columnIndex: number
  ): unknown {
    const address = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
    const cell = sheet[address];
    if (!cell) {
      return undefined;
    }

    if (cell.v !== undefined && cell.v !== null) {
      return cell.v;
    }

    if (cell.w !== undefined && cell.w !== null) {
      return cell.w;
    }

    return undefined;
  }

  private async processUpload(upload: DocumentProcessingFile) {
    await processEmployeeUpload(upload, {
      logInfo: this.logInfo.bind(this),
      logError: this.logError.bind(this),
      redis: this.redis,
      uploadRepo: this.uploadRepo,
      fileRepo: this.fileRepo,
      policyRepo: this.policyRepo,
      endorsementRepo: this.endorsementRepo,
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
      companyAuthenticationMapRepo: this.companyAuthenticationMapRepo,
    });
  }

  private async processMemberDataUpload(upload: DocumentProcessingFile) {
    await processMemberDataUploadCore(upload, {
      logInfo: this.logInfo.bind(this),
      logError: this.logError.bind(this),
      uploadRepo: this.uploadRepo,
      fileRepo: this.fileRepo,
      policyRepo: this.policyRepo,
      companyEmployeeRepo: this.companyEmployeeRepo,
      dependentRepo: this.dependentRepo,
      employeePolicyMapRepo: this.employeePolicyMapRepo,
      summaryRepo: this.summaryRepo,
      policyConfigRepo: this.policyConfigRepo,
      lookUpRepository: this.lookUpRepository,
    });
  }

  private async processEnrollmentUpload(upload: DocumentProcessingFile, bypassMode: boolean = false) {
    this.logInfo(
      "processEnrollmentUpload",
      `Processing enrollment upload with ID: ${upload.id}`
    );
    try {
      let config: any = null;
      if (!bypassMode) {
        const liveStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
        });
        if (!liveStatus) {
          throw new NotFoundException(
            `Status lookup not found for key ${POLICY_CONFIGURATION_STATUS_LIVE}`
          );
        }
        config = await this.policyConfigRepo.findOne({
          where: {
            policyId: upload.entityId,
            policyConfiguartionStatusLid: liveStatus.id,
          },
        });
        if (!config) {
          throw new NotFoundException(
            `Approved policy configuration not found for policy ID ${upload.entityId}`
          );
        }
      }

      const currentEndorsementDetails = await this.endorsementRepo.findOne({
        where: {
          id: upload.endorsementId,
        },
      });
      if (!currentEndorsementDetails) {
        throw new NotFoundException(
          `No Endorsements are found with Id ${upload.endorsementId}`
        );
      }

      const constraints: Record<string, any> = bypassMode
        ? {}
        : (config?.policyConfiguration as any)?.constraints || {};

      // In bypass mode config is null, but we still need to load the LIVE config to identify
      // relationship types (so dependent rows are correctly classified) and to check enablePolicyLocations.
      let policyConfigForLocations = config;
      if (bypassMode) {
        const liveStatusForLoc = await this.lookUpRepository.findOne({
          where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
        });
        if (liveStatusForLoc) {
          policyConfigForLocations = await this.policyConfigRepo.findOne({
            where: {
              policyId: upload.entityId,
              policyConfiguartionStatusLid: liveStatusForLoc.id,
            },
          });
        }
      }

      const relationships: any[] = bypassMode
        ? (policyConfigForLocations?.policyConfiguration as any)?.relationships?.enabledPolicyRelations || []
        : (config?.policyConfiguration as any)?.relationships?.enabledPolicyRelations || [];

      // Total-family dependent cap (across all relation types combined) — a separate,
      // additional check on top of the per-relation-type maxCount above. Skipped in
      // bypassMode, same as the relationship/age/twin-triplet validations, since bypass
      // is a "trust the file" fast path that doesn't load the LIVE config for validation.
      // Configured as one or more named {label, max} options — the uploaded file's own
      // "Max Dependent Count" column (read per-employee below) selects which option's
      // max applies to that family, so different families can be capped differently.
      const maxDependentCountParam = !bypassMode
        ? ((config?.policyConfiguration as any)?.parameters || []).find(
            (p: any) =>
              p.type === MAX_DEPENDENT_COUNT_INTERNAL_TYPE ||
              p.internalType === MAX_DEPENDENT_COUNT_INTERNAL_TYPE
          )
        : null;
      const maxDependentCountOptions: { label: string; max: number }[] = (
        maxDependentCountParam?.maxDependentCountConfig?.options || []
      )
        .map((opt: any) => ({
          label: String(opt.label ?? "").trim(),
          max: Number(opt.max),
        }))
        .filter((opt: any) => opt.label && !Number.isNaN(opt.max));
      const maxDependentCountFieldName =
        maxDependentCountParam?.displayName?.trim() || "Max Dependent Count";

      const effectiveEnablePolicyLocations =
        (policyConfigForLocations?.policyConfiguration as any)?.enablePolicyLocations === true;

      let validPolicyLocations: Set<string> | null = null;
      let locationAddressIdMap: Map<string, number> = new Map();
      let phoneCodeByCpclId: Map<number, string> = new Map();
      if (effectiveEnablePolicyLocations) {
        const result = await fetchValidPolicyLocations(
          this.policyConfigRepo.manager,
          upload.entityId,
        );
        validPolicyLocations = result.validCodes;
        locationAddressIdMap = result.addressIdMap;
        phoneCodeByCpclId = result.phoneCodeByCpclId;
      }
      const defaultCountryCallingCode = await fetchDefaultCountryCallingCode(
        this.policyConfigRepo.manager,
        upload.entityId,
        this.redis,
      );
      this.logInfo("processEnrollmentUpload", {
        message: "[PhoneCountryCode] Default calling code resolved",
        policyId: upload.entityId,
        defaultCountryCallingCode,
        locationSpecificCodes: Array.from(phoneCodeByCpclId.entries()),
      });

      const file = await this.fileRepo.findOne({
        where: { id: upload.documentId },
      });
      if (!file) {
        throw new Error("File not found");
      }

      const policy = await this.policyRepo.findOne({
        where: { id: upload.entityId },
      });
      if (!policy) {
        throw new NotFoundException(
          `Policy not found for policy ID ${upload.entityId}`
        );
      }

      const policyCompanyId = policy.companyId;
      const companyAuthMethod = await this.getCompanyAuthenticationMethod(
        policyCompanyId
      );
      const policyTermStart = this.normalizeToStartOfDay(policy.policyFrom);
      const policyTermEnd = this.normalizeToStartOfDay(policy.policyTo);
      const policyTermStartLabel =
        formatDateForDisplay(policyTermStart) ??
        this.toDateOnlyString(policyTermStart) ??
        new Date(policyTermStart).toISOString().split("T")[0];
      const policyTermEndLabel =
        formatDateForDisplay(policyTermEnd) ??
        this.toDateOnlyString(policyTermEnd) ??
        new Date(policyTermEnd).toISOString().split("T")[0];

      // Get the mappings here
      let mappings = await this.fetchMappingTemplates(
        upload.entityId,
        UTILITY_UPLOAD_ENTITY.UPLOAD_INCEPTION,
      );

      const buffer = await downloadFromS3(file.fileKey);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rowsData: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
        dateNF: "yyyy-mm-dd",
      });
      const headerValues = rowsData[0].map((h: any) => String(h).trim());

      // logic for duplicate error records
      const normalizeErrorValue = (value: any) =>
        String(value ?? "")
          .trim()
          .toLowerCase();
      const getNormalizedField = (
        entry: Record<string, any>,
        keys: string[]
      ) => {
        for (const key of keys) {
          const normalizedValue = normalizeErrorValue(entry[key]);
          if (normalizedValue) {
            return normalizedValue;
          }
        }
        return "";
      };
      const errorKeyMatches = (
        errorEntry: Record<string, any>,
        candidate: Record<string, any>
      ) => {
        const errorEmployeeId = getNormalizedField(
          errorEntry,
          ENROLLMENT_FIELD_HEADERS.EMPLOYEE_ID
        );
        const candidateEmployeeId = getNormalizedField(
          candidate,
          ENROLLMENT_FIELD_HEADERS.EMPLOYEE_ID
        );
        const errorFullName = getNormalizedField(
          errorEntry,
          ENROLLMENT_FIELD_HEADERS.FULL_NAME
        );
        const candidateFullName = getNormalizedField(
          candidate,
          ENROLLMENT_FIELD_HEADERS.FULL_NAME
        );
        const errorRelation = getNormalizedField(
          errorEntry,
          ENROLLMENT_FIELD_HEADERS.RELATION
        );
        const candidateRelation = getNormalizedField(
          candidate,
          ENROLLMENT_FIELD_HEADERS.RELATION
        );
        const errorDob = getNormalizedField(
          errorEntry,
          ENROLLMENT_FIELD_HEADERS.DATE_OF_BIRTH
        );
        const candidateDob = getNormalizedField(
          candidate,
          ENROLLMENT_FIELD_HEADERS.DATE_OF_BIRTH
        );

        if (!errorEmployeeId || !candidateEmployeeId) {
          return false;
        }
        if (!errorFullName || !candidateFullName) {
          return false;
        }

        const relationMatches =
          !errorRelation ||
          !candidateRelation ||
          errorRelation === candidateRelation;
        const dobMatches =
          !errorDob || !candidateDob || errorDob === candidateDob;

        return (
          errorEmployeeId === candidateEmployeeId &&
          errorFullName === candidateFullName &&
          relationMatches &&
          dobMatches
        );
      };
      const pushUniqueError = (candidate: Record<string, unknown>) => {
        if (
          !errors.some((errorEntry) => errorKeyMatches(errorEntry, candidate))
        ) {
          errors.push(candidate);
        }
      };

      const normalizeHeader = (h: string) =>
        h.toLowerCase().replace(/[\s_]+/g, "");
      const intakeTypeIdx = this.getColumnIndex(mappings, headerValues, 'intake_type', ['intaketype']);  // Try mapping first, then fallback to static column
      const relationshipIdx = this.getColumnIndex(mappings, headerValues, 'relation', ['relation']);
      const effectiveDateIdx = this.getColumnIndex(mappings, headerValues, 'effective_date', ['effectivedate']);
      const effectiveDateHeaderName =
        effectiveDateIdx >= 0 ? headerValues[effectiveDateIdx] : null;
      // Located by matching the configured parameter's display name against the sheet's
      // own headers — this column isn't a fixed/mapped field like relation or DOB, it's
      // dynamically added to the template only when the parameter is configured (see
      // policy.service.ts's buildEnrollmentTemplateFieldList).
      const maxDependentCountIdx = maxDependentCountOptions.length
        ? headerValues.findIndex(
            (h) => normalizeHeader(h) === normalizeHeader(maxDependentCountFieldName)
          )
        : -1;

      const resolveMaxDependentCountLabelFromAdditionalParams = (
        additionalParams: Record<string, any> | undefined | null
      ): string | undefined => {
        if (!additionalParams || !maxDependentCountOptions.length) return undefined;
        const targetNorm = normalizeHeader(maxDependentCountFieldName);
        for (const [key, value] of Object.entries(additionalParams)) {
          if (normalizeHeader(key) === targetNorm) {
            return String(value ?? "").trim() || undefined;
          }
        }
        return undefined;
      };

      interface RowCollect {
        companyEmployee: Partial<PolicyEnrollmentEmployee>;
        dependents: Partial<PolicyEnrollmentDependent>[];
        intakeType: string;
        rowObj: any;
        dependentRows: any[];
        isFetchedFromDatabase?: boolean;
        databaseDependentCount?: number;
        enrollmentStartDate?: Date | null;
        enrollmentEndDate?: Date | null;
        effectiveDate?: Date | null;
        choices?: any[];
        hasError?: boolean;
        additionalParams?: Record<string, any>;
        skipExistingEmployeeCheck?: boolean;
        claimStatus?: string | null;
        bypassSumInsured?: number | null;
        bypassPremiumAmount?: number | null;
        hasSheetEmail?: boolean;
        hasSheetPhone?: boolean;
        maxDependentCountLabel?: string;
      }

      const rows: RowCollect[] = [];
      const errors: any[] = [];
      const successRows: any[] = [];
      let successEmployeeCount = 0;
      let successDependentCount = 0;
      const deletedEmployeeIds: number[] = [];
      const seenEmployeeIds = new Set<string>();
      const seenEmails = new Set<string>();
      const seenPhones = new Set<string>();
      const counts: Record<string, Record<string, number>> = {};
      const employeeComponentsMap: Record<number, any[]> = {};
      const employeeDependentsMap: Record<
        number,
        UpsertEnrollmentDependentDto[]
      > = {};
      const dependentDeletionRows: {
        companyEmployee: Partial<PolicyEnrollmentEmployee>;
        relation: string;
        rowObj: any;
        claimStatus?: string | null;
      }[] = [];

      const isInception = this.isInceptionFlagEnabled(
        currentEndorsementDetails?.isInception ?? false
          ? BOOLEAN_VALUES.TRUE
          : BOOLEAN_VALUES.FALSE
      );

      const login = await this.login(
        `${ENV.SCHEDULER_LOGIN_USERNAME}`,
        `${ENV.SCHEDULER_LOGIN_PASSWORD}`
      );

      const userDetails = await this.userRepo.findOne({
        where: { loginName: ENV.SCHEDULER_LOGIN_USERNAME },
      });

      if (!userDetails) {
        this.logError("processEnrollmentUpload", {
          message: `No user found with user name: ${ENV.SCHEDULER_LOGIN_USERNAME}`,
        });
        return;
      }

      let totalRecords = 0;
      const overallStartTime = Date.now();
      const payloads: any[] = [];
      const payloadPrepStart = Date.now();

      const staticMap: Record<string, keyof PolicyEnrollmentEmployee> = {
        employeeid: "companyEmployeeId",
        fullname: "employeeName",
        dateofbirth: "dateOfBirth",
        gender: "gender",
        email: "email",
        mobilenumber: "phoneNumber",
        relationshipgroup: "relationGroup",
        maritalStatus: 'maritalStatus',
        policylocation: "policyLocation",
      };

      const targetToPropertyMap: Record<string, string> = {
        employee_id: "companyEmployeeId",
        full_name: "employeeName",
        date_of_birth: "dateOfBirth",
        gender: "gender",
        email: "email",
        mobile_number: "phoneNumber",
        relationship_group: "relationGroup",
        marital_status: 'maritalStatus',
        policy_location: "policyLocation",
      }
      const normalizedMap: Record<string, keyof PolicyEnrollmentEmployee> =
        Object.fromEntries(
          Object.entries(staticMap).map(([k, v]) => [normalizeHeader(k), v])
        );

      const getEmployeeKey = (
        employee: Partial<PolicyEnrollmentEmployee> | undefined
      ): string => String(employee?.companyEmployeeId ?? "").trim();

      const initializeCountsForEmployee = (
        employee: Partial<PolicyEnrollmentEmployee> | undefined,
        dependents: Partial<PolicyEnrollmentDependent>[] = []
      ): string => {
        const employeeKey = getEmployeeKey(employee);
        if (!employeeKey) {
          return employeeKey;
        }

        if (!counts[employeeKey]) {
          counts[employeeKey] = {};
          for (const dependent of dependents) {
            const relationKey = normalizeValue(
              dependent.relationshipType || dependent.relation || ""
            );
            if (relationKey) {
              counts[employeeKey][relationKey] =
                (counts[employeeKey][relationKey] || 0) + 1;
            }
          }
        }

        return employeeKey;
      };

      let currentEmployee: RowCollect | null = null;
      let skipCurrentEmployee = false;
      let childOverridePendingErrors: Array<{ rowObj: any; relTypeNorm: string; maxCountValue: number }> = [];

      const flushPendingChildOverrides = () => {
        if (!currentEmployee || childOverridePendingErrors.length === 0) {
          childOverridePendingErrors = [];
          return;
        }
        const twinsAllowed = this.isTruthyConstraint(constraints?.twinsSecondChildAllowed);
        const tripletsAllowed = this.isTruthyConstraint(constraints?.tripletsSecondChildAllowed);
        const firstAsTwin = this.isTruthyConstraint(constraints?.allowFirstChildAsTwin);
        const validatedRelTypes = new Map<string, boolean>();
        for (const pending of childOverridePendingErrors) {
          if (!validatedRelTypes.has(pending.relTypeNorm)) {
            const allChildren = (currentEmployee.dependents as any[]).filter((d: any) =>
              normalizeValue(String(d.relationshipType ?? d.relation ?? "")) === pending.relTypeNorm
            );
            validatedRelTypes.set(
              pending.relTypeNorm,
              this.isChildGroupValidForOverride(allChildren, pending.maxCountValue, twinsAllowed, tripletsAllowed, firstAsTwin)
            );
          }
          if (!validatedRelTypes.get(pending.relTypeNorm)) {
            pending.rowObj["Remarks"] = endorsementFileUploadMessages.ER0019;
            errors.push(pending.rowObj);
            currentEmployee.hasError = true;
          }
        }
        childOverridePendingErrors = [];
      };

      // On top of the per-relation-type maxCount checks above, also enforce the
      // policy's "Max Dependent Count" parameter (total dependents across all
      // relation types combined). The employee's row selects which configured
      // {label, max} option applies via the "Max Dependent Count" template column
      // (captured as maxDependentCountLabel when the Self row is built). Runs at
      // the same employee-boundary flush points as flushPendingChildOverrides,
      // once currentEmployee.dependents is complete.
      const validateMaxDependentCountForEmployee = () => {
        if (!currentEmployee || !maxDependentCountOptions.length) return;
        const label = currentEmployee.maxDependentCountLabel;
        if (!label) return; // no label given on this upload — nothing to enforce
        const matchedOption = maxDependentCountOptions.find(
          (opt) => normalizeValue(opt.label) === normalizeValue(label)
        );
        if (!matchedOption) {
          if (!currentEmployee.rowObj["Remarks"]) {
            currentEmployee.rowObj["Remarks"] =
              `${endorsementFileUploadMessages.ER0072} (received: "${label}")`;
          }
          currentEmployee.hasError = true;
          return;
        }
        const totalDependents = (currentEmployee.dependents || []).length;
        if (totalDependents > matchedOption.max) {
          if (!currentEmployee.rowObj["Remarks"]) {
            currentEmployee.rowObj["Remarks"] =
              `${endorsementFileUploadMessages.ER0071} (${matchedOption.label}: max ${matchedOption.max})`;
          }
          currentEmployee.hasError = true;
        }
      };

      const processingQueue: {
        values: any[];
        rowIndex: number;
        isRetry: boolean;
        rowObj?: any;
      }[] = rowsData.slice(1).map((values, idx) => ({
        values,
        rowIndex: idx + 1,
        isRetry: false,
      }));

      for (
        let queueIndex = 0;
        queueIndex < processingQueue.length;
        queueIndex++
      ) {
        const queueItem = processingQueue[queueIndex];
        const { values, rowIndex, isRetry } = queueItem;
        const isRowEmpty = values.every(
          (v) =>
            v === "" ||
            v === undefined ||
            v === null ||
            (typeof v === "string" && v.trim() === "")
        );
        if (isRowEmpty) {
          continue;
        }
        const companyEmployee: any = {
          employeeCompanyId: String(file.entityId),
        };
        const additional: Record<string, any> = {};
        let enrollmentStartDate: Date | null = null;
        let enrollmentEndDate: Date | null = null;
        let effectiveDate: Date | null = null;
        let effectiveDateDisplayValue: any = "";
        let effectiveDateFormatError: string | null = null;
        let dobError: string | null = null;
        let claimStatus: string | null = null;
        headerValues.forEach((header, idx) => {
          const norm = normalizeHeader(header);
          const val = values[idx];
          // if (val === undefined || val === null || val === "") return;
          const rawCellValue = this.getRawCellValue(sheet, rowIndex, idx);
          const valueForParsing =
            rawCellValue !== undefined && rawCellValue !== null
              ? rawCellValue
              : val;
          if (
            (val === undefined || val === null || val === "") &&
            (rawCellValue === undefined || rawCellValue === null)
          ) {
            return;
          }
          // Try to find a mapping for this header
          const mapping = mappings?.find(
              (m: any) => normalizeHeader(m.source_column_name) === norm
          );
          // Use the mapping's targetColumn if found, else fallback to normalizedMap
          const targetColumn = mapping?.target_column_name || null;
          const staticKey = targetColumn
              ? targetToPropertyMap[targetColumn]
              : normalizedMap[norm];

          if (staticKey) {
            if (staticKey === "dateOfBirth") {
              const dt = this.parseExcelDate(valueForParsing);
              if (dt) {
                companyEmployee[staticKey] = dt;
              } else {
                dobError = endorsementFileUploadMessages.ER0001;
              }
            } else if (staticKey === "email") {
              companyEmployee[staticKey] = String(val)?.trim()?.toLowerCase();
            } else {
              companyEmployee[staticKey] = String(val).trim();
            }
          } else {
            // Find mapping for this header, if any
            const mapping = mappings?.find(
              (m: any) => normalizeHeader(m.source_column_name) === norm
            );
            const targetColumnNorm = mapping ? normalizeHeader(mapping.target_column_name) : norm;
            if (targetColumnNorm === "claimstatus") {
              claimStatus = this.normalizeClaimStatusValue(valueForParsing);
              additional[mapping ? mapping.target_column_name : header] = claimStatus ?? String(val).trim();
            } else if (targetColumnNorm === "effectivedate") {
              effectiveDateDisplayValue =
                typeof rawCellValue === "string" &&
                rawCellValue.trim() !== ""
                  ? rawCellValue
                  : val;
              const updatedEffectiveDate =
                this.parseExcelDate(val);
              if (updatedEffectiveDate) {
                 effectiveDate = updatedEffectiveDate;
              } else {
                effectiveDateFormatError = endorsementFileUploadMessages.ER0001;
              }
            } else if (norm === "enrollmentstartdate") {
              enrollmentStartDate = this.parseExcelDate(valueForParsing);
            } else if (norm === "enrollmentenddate") {
              enrollmentEndDate = this.parseExcelDate(valueForParsing);
            } else if (norm === "choices") {
              // skip choices
            } else {
              additional[mapping ? mapping.target_column_name : header] = val;
            }
          }
        });

        const rawIntakeType =
          intakeTypeIdx !== -1 && values[intakeTypeIdx]
            ? String(values[intakeTypeIdx]).toLowerCase().trim()
            : currentEmployee?.intakeType || "addition";
        const intakeType =
          rawIntakeType === "inception" ? "addition" : rawIntakeType;

        let rowBypassSumInsured: number | null = null;
        let rowBypassPremiumAmount: number | null = null;
        if (bypassMode) {
          const siIdx = headerValues.findIndex(
            (h) => normalizeHeader(h) === "totalsuminsured"
          );
          if (siIdx >= 0) {
            const rawSI = values[siIdx];
            if (rawSI !== undefined && rawSI !== null && rawSI !== "") {
              const parsedSI = Number(rawSI);
              rowBypassSumInsured = isNaN(parsedSI) ? null : parsedSI;
            } else {
              rowBypassSumInsured = 0;
            }
          }
          const premIdx = headerValues.findIndex(
            (h) => normalizeHeader(h) === "premium"
          );
          if (premIdx >= 0) {
            const rawPremium = values[premIdx];
            if (rawPremium !== undefined && rawPremium !== null && rawPremium !== "") {
              const parsedPremium = Number(rawPremium);
              if (!isNaN(parsedPremium)) {
                rowBypassPremiumAmount =
                  rawIntakeType === "deletion"
                    ? -Math.abs(parsedPremium)
                    : Math.abs(parsedPremium);
              }
            } else {
              rowBypassPremiumAmount = 0;
            }
          }
        }

        // Track whether the contact details actually came from the sheet. A
        // generated email must never replace a real one already on record.
        const sheetEmail = companyEmployee?.email?.trim()
          ? companyEmployee.email.trim().toLowerCase()
          : null;
        const sheetPhone = companyEmployee?.phoneNumber
          ? String(companyEmployee.phoneNumber).trim()
          : null;

        const emailVal = (
          companyEmployee?.email?.trim()
            ? companyEmployee?.email?.trim().toLowerCase()
            : this.generateEmail(
                policyCompanyId,
                companyEmployee?.companyEmployeeId,
                companyEmployee?.employeeName,
                (companyEmployee?.dateOfBirth || new Date())?.toString()
              )
        ) as string | undefined;

        const relationRaw =
          relationshipIdx !== -1 && values[relationshipIdx]
            ? String(values[relationshipIdx]).trim()
            : "";
        const relationNorm = normalizeValue(relationRaw);
        let relTypeRaw = "Self";
        let cfg: any = undefined;
        let option: any = undefined;
        for (const r of relationships) {
          const match = (r.configuredOptions || []).find(
            (o: any) => normalizeValue(o.name) === relationNorm
          );
          if (match) {
            relTypeRaw = r.type;
            cfg = r;
            option = match;
            break;
          }
        }
        if (bypassMode && relTypeRaw === "Self" && relationNorm && relationNorm !== "self") {
          relTypeRaw = "Dependent";
        }
        const relType = relTypeRaw.toLowerCase();
        const relation = relationRaw.toLowerCase();
        const relTypeNorm = normalizeValue(relTypeRaw);
        const rowObj: any = queueItem.rowObj ?? {};
        queueItem.rowObj = rowObj;
        headerValues.forEach((h, idx) => {
          const normalizedHeader = normalizeHeader(h);
          const mapping = mappings?.find(
              (m: any) => normalizeHeader(m.source_column_name) === normalizedHeader
            );
          const targetColumnNorm = mapping ? normalizeHeader(mapping.target_column_name) : normalizedHeader;

          if (targetColumnNorm === "effectivedate") {
            rowObj[h] = effectiveDateDisplayValue ?? values[idx];
          } 
          else if (targetColumnNorm === "email") {
            rowObj[h] = emailVal
          }
          else {
            rowObj[h] = values[idx];
          }
        });

        if (effectiveDateFormatError) {
          rowObj["Remarks"] = effectiveDateFormatError;
          errors.push(rowObj);
          continue;
        }

        const isMockId =
          companyEmployee.companyEmployeeId &&
          String(companyEmployee.companyEmployeeId)
            .toLowerCase()
            .includes("fake");

        if (intakeType === "deletion" && relType !== "self") {
          if (isMockId) {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0002;
            errors.push(rowObj);
            continue;
          }
          dependentDeletionRows.push({
            companyEmployee,
            relation,
            rowObj,
            claimStatus,
            ...(bypassMode && {
              bypassPremiumAmount: rowBypassPremiumAmount,
              bypassSumInsured: rowBypassSumInsured,
            }),
          });
          continue;
        }
        if (relType === "self") {
          if (!companyEmployee.companyEmployeeId) {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0003;
            errors.push(rowObj);
            skipCurrentEmployee = true;
            currentEmployee = null;
            continue;
          }
          if (currentEmployee) {
            flushPendingChildOverrides();
            validateMaxDependentCountForEmployee();
            rows.push(currentEmployee);
          }
          if (isMockId) {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0002;
            errors.push(rowObj);
            skipCurrentEmployee = true;
            currentEmployee = null;
            continue;
          }
          skipCurrentEmployee = false;
          const errorMsgs: string[] = [];
          if (!companyEmployee.employeeName) {
            errorMsgs.push(endorsementFileUploadMessages.ER0007);
          }
          if (!companyEmployee.dateOfBirth) {
            errorMsgs.push(dobError ?? endorsementFileUploadMessages.ER0008);
          }
          companyEmployee.email = emailVal;

          if (!emailVal) {
            errorMsgs.push(
              this.isEmailAuthMethod(companyAuthMethod)
                ? endorsementFileUploadMessages.ER0009
                : endorsementFileUploadMessages.ER0010
            );
          } else if (!/^\S+@\S+\.\S+$/.test(emailVal)) {
            errorMsgs.push(endorsementFileUploadMessages.ER0011);
          }

          if (
            this.isPhoneAuthMethod(companyAuthMethod) &&
            !companyEmployee.phoneNumber
          ) {
            errorMsgs.push(
              endorsementFileUploadMessages.ER0012
            );
          }

          if (
            companyEmployee.companyEmployeeId &&
            seenEmployeeIds.has(String(companyEmployee.companyEmployeeId))
          ) {
            errorMsgs.push(endorsementFileUploadMessages.ER0005);
          }
          if (emailVal && seenEmails.has(emailVal)) {
            errorMsgs.push(endorsementFileUploadMessages.ER0013);
          }
          const phoneVal = companyEmployee.phoneNumber
            ? String(companyEmployee.phoneNumber).trim()
            : undefined;
          if (phoneVal && seenPhones.has(phoneVal)) {
            errorMsgs.push(endorsementFileUploadMessages.ER0070);
          }

          if (effectiveDate) {
            const isWithinPolicyTerm = this.isDateWithinRange(
              effectiveDate,
              policyTermStart,
              policyTermEnd
            );
            if (!isWithinPolicyTerm) {
              errorMsgs.push(
                endorsementFileUploadMessages.ER0014
              );
            }
          }

          if (errorMsgs.length) {
            rowObj["Remarks"] = `${errorMsgs.join("; ")}. Please verify.`;
            errors.push(rowObj);
            currentEmployee = null;
            continue;
          }

          // Validate policy location for self rows when the feature is enabled
          if (validPolicyLocations !== null) {
            const policyLocationValue = normalizePolicyLocationCode(
              rowObj[POLICY_LOCATION_FIELD_NAME] ||
                rowObj[POLICY_LOCATION_COLUMN_NAME],
            );
            if (!policyLocationValue) {
              rowObj["Remarks"] = POLICY_LOCATION_REQUIRED_ERROR;
              errors.push(rowObj);
              currentEmployee = null;
              continue;
            }
            if (!validPolicyLocations.has(policyLocationValue)) {
              rowObj["Remarks"] = POLICY_LOCATION_MISMATCH_ERROR;
              errors.push(rowObj);
              currentEmployee = null;
              continue;
            }
            companyEmployee.policyConfigLocationId = locationAddressIdMap.get(policyLocationValue) ?? null;
          }

          if (companyEmployee.companyEmployeeId) {
            seenEmployeeIds.add(String(companyEmployee.companyEmployeeId));
          }
          if (companyEmployee.email) {
            seenEmails.add(companyEmployee.email);
          }
          if (companyEmployee.phoneNumber) {
            seenPhones.add(String(companyEmployee.phoneNumber).trim());
          }

          companyEmployee.additionalParams = additional;
          const { headers: policyHeaders, rowObj: updatedRowObj } = this.extractPolicyHeadersAndValues(mappings, headerValues, rowObj);
          const policyChoosenArray = this.extractPolicyChoices(policyHeaders, updatedRowObj);
          currentEmployee = {
            companyEmployee,
            dependents: [],
            intakeType,
            rowObj: {
              ...rowObj,
              email: emailVal,
              "Date of Birth": companyEmployee.dateOfBirth.toLocaleDateString(),
            },
            dependentRows: [],
            enrollmentStartDate,
            enrollmentEndDate,
            effectiveDate,
            choices: policyChoosenArray,
            additionalParams: additional,
            claimStatus,
            bypassSumInsured: bypassMode ? rowBypassSumInsured : undefined,
            bypassPremiumAmount: bypassMode ? rowBypassPremiumAmount : undefined,
            hasSheetEmail: !!sheetEmail,
            hasSheetPhone: !!sheetPhone,
            maxDependentCountLabel:
              maxDependentCountIdx >= 0
                ? String(values[maxDependentCountIdx] ?? "").trim()
                : undefined,
          };

          initializeCountsForEmployee(companyEmployee);
        } else {
          if (skipCurrentEmployee) {
            continue;
          }
          if (isMockId) {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0002;
            errors.push(rowObj);
            continue;
          }
          if (!currentEmployee) {
            if (isRetry && !isInception) {
              const existingEmployeeRowIndex = rows.findIndex(
                (row) =>
                  row.companyEmployee.companyEmployeeId &&
                  companyEmployee.companyEmployeeId &&
                  String(row.companyEmployee.companyEmployeeId) ===
                    String(companyEmployee.companyEmployeeId)
              );
              if (existingEmployeeRowIndex !== -1) {
                currentEmployee = rows.splice(existingEmployeeRowIndex, 1)[0];
              } else {
                const existingEmployeeWithDependents =
                  await this.getEmployeeDetailsWithDependentsIfExists(
                    companyEmployee.companyEmployeeId!,
                    policyCompanyId,
                    upload.entityId
                  );

                if (existingEmployeeWithDependents?.employee) {
                  const baseRowObj =
                    queueItem.rowObj ??
                    this.buildRowObjectFromEmployeeEntity(
                      existingEmployeeWithDependents.employee,
                      headerValues
                    );
                  const { headers: policyHeaders, rowObj: updatedRowObj } = this.extractPolicyHeadersAndValues(mappings, headerValues, rowObj);
                  const policyChoosenArray = this.extractPolicyChoices(policyHeaders, updatedRowObj);
                  currentEmployee = {
                    companyEmployee: {
                      ...existingEmployeeWithDependents.employee,
                      employeeCompanyId: String(file.entityId),
                    },
                    dependents: existingEmployeeWithDependents.dependents.map(
                      (dep) => ({ ...dep })
                    ),
                    isFetchedFromDatabase: true,
                    databaseDependentCount:
                      existingEmployeeWithDependents.dependents.length,
                    intakeType,
                    rowObj: baseRowObj,
                    dependentRows: [],
                    enrollmentStartDate,
                    enrollmentEndDate,
                    effectiveDate,
                    choices: policyChoosenArray,
                    skipExistingEmployeeCheck: true,
                    additionalParams:
                      (existingEmployeeWithDependents.employee as any)
                        ?.additionalParams || {},
                    maxDependentCountLabel:
                      resolveMaxDependentCountLabelFromAdditionalParams(
                        (existingEmployeeWithDependents.employee as any)
                          ?.additionalParams
                      ),
                  };
                }
              }

              if (currentEmployee) {
                initializeCountsForEmployee(
                  currentEmployee.companyEmployee,
                  currentEmployee.dependents
                );
                if (isRetry) {
                  const existingErrorIndex = errors.indexOf(rowObj);
                  if (existingErrorIndex !== -1) {
                    errors.splice(existingErrorIndex, 1);
                  }
                  if (
                    rowObj?.Remarks ===
                      endorsementFileUploadMessages.ER0015 ||
                    rowObj?.Remarks === endorsementFileUploadMessages.ER0016
                  ) {
                    delete rowObj["Remarks"];
                  }
                }
              }
            }

            if (!currentEmployee) {
              rowObj["Remarks"] =
                endorsementFileUploadMessages.ER0015;
              pushUniqueError(rowObj);
              if (!isRetry) {
                processingQueue.push({
                  values,
                  rowIndex,
                  isRetry: true,
                  rowObj,
                });
              }
              continue;
            }
          }
          if (isRetry) {
            const existingErrorIndex = errors.indexOf(rowObj);
            if (existingErrorIndex !== -1) {
              errors.splice(existingErrorIndex, 1);
            }
          }
          if (
            companyEmployee.companyEmployeeId &&
            currentEmployee.companyEmployee.companyEmployeeId &&
            companyEmployee.companyEmployeeId !==
              currentEmployee.companyEmployee.companyEmployeeId
          ) {
            if (isRetry && !isInception) {
              const existingEmployeeRowIndex = rows.findIndex(
                (row) =>
                  row.companyEmployee.companyEmployeeId &&
                  companyEmployee.companyEmployeeId &&
                  String(row.companyEmployee.companyEmployeeId) ===
                    String(companyEmployee.companyEmployeeId)
              );
              if (existingEmployeeRowIndex !== -1) {
                flushPendingChildOverrides();
                validateMaxDependentCountForEmployee();
                rows.push(currentEmployee);
                currentEmployee = rows.splice(existingEmployeeRowIndex, 1)[0];
                childOverridePendingErrors = [];
              } else {
                const existingEmployeeWithDependents =
                  await this.getEmployeeDetailsWithDependentsIfExists(
                    companyEmployee.companyEmployeeId!,
                    policyCompanyId,
                    upload.entityId
                  );
                if (existingEmployeeWithDependents?.employee) {
                  const baseRowObj =
                    queueItem.rowObj ??
                    this.buildRowObjectFromEmployeeEntity(
                      existingEmployeeWithDependents.employee,
                      headerValues
                    );

                  if (
                    currentEmployee &&
                    currentEmployee?.companyEmployee?.companyEmployeeId !==
                      existingEmployeeWithDependents?.employee
                        ?.companyEmployeeId
                  ) {
                    flushPendingChildOverrides();
                    validateMaxDependentCountForEmployee();
                    rows.push(currentEmployee);
                    childOverridePendingErrors = [];
                    const { headers: policyHeaders, rowObj: updatedRowObj } = this.extractPolicyHeadersAndValues(mappings, headerValues, baseRowObj);
                    const policyChoosenArray = this.extractPolicyChoices(policyHeaders, updatedRowObj);
                    currentEmployee = {
                      companyEmployee: {
                        ...existingEmployeeWithDependents.employee,
                        employeeCompanyId: String(file.entityId),
                      },
                      dependents: existingEmployeeWithDependents.dependents.map(
                        (dep) => ({ ...dep })
                      ),
                      isFetchedFromDatabase: true,
                      databaseDependentCount:
                        existingEmployeeWithDependents.dependents.length,
                      intakeType,
                      rowObj: baseRowObj,
                      dependentRows: [],
                      enrollmentStartDate,
                      enrollmentEndDate,
                      effectiveDate,
                      choices: policyChoosenArray,
                      skipExistingEmployeeCheck: true,
                      additionalParams:
                        (existingEmployeeWithDependents.employee as any)
                          ?.additionalParams || {},
                      maxDependentCountLabel:
                        resolveMaxDependentCountLabelFromAdditionalParams(
                          (existingEmployeeWithDependents.employee as any)
                            ?.additionalParams
                        ),
                    };
                  }
                } else {
                  rowObj["Remarks"] = endorsementFileUploadMessages.ER0016;
                  errors.push(rowObj);
                  if (!isRetry) {
                    processingQueue.push({
                      values,
                      rowIndex,
                      isRetry: true,
                      rowObj,
                    });
                  }
                  continue;
                }
              }
              initializeCountsForEmployee(
                currentEmployee?.companyEmployee,
                currentEmployee?.dependents || []
              );
            } else {
              rowObj["Remarks"] = endorsementFileUploadMessages.ER0016;
              errors.push(rowObj);
              if (!isRetry) {
                processingQueue.push({
                  values,
                  rowIndex,
                  isRetry: true,
                  rowObj,
                });
              }
              continue;
            }
          }
          if (!companyEmployee.employeeName) {
            rowObj["Remarks"] =
              endorsementFileUploadMessages.ER0017;
            errors.push(rowObj);
            if (currentEmployee) currentEmployee.hasError = true;
            continue;
          }

          if (!bypassMode) {
            if (!cfg || !cfg.enabled) {
              rowObj["Remarks"] = endorsementFileUploadMessages.ER0018;
              errors.push(rowObj);
              if (currentEmployee) currentEmployee.hasError = true;
              continue;
            }
            const employeeKey = initializeCountsForEmployee(
              currentEmployee.companyEmployee,
              currentEmployee.dependents
            );
            const employeeCounts = employeeKey ? counts[employeeKey] : {};
            const updatedCount = (employeeCounts?.[relTypeNorm] || 0) + 1;
            let exceedsMaxCount = false;
            if (cfg.maxCount) {
              const maxCountValue = Number(cfg.maxCount);
              if (!Number.isNaN(maxCountValue) && updatedCount > maxCountValue) {
                const isChildType = this.isChildRelationshipType(relTypeNorm, cfg?.type);
                if (isChildType) {
                  // Defer child override validation until the full set of siblings is collected.
                  childOverridePendingErrors.push({ rowObj, relTypeNorm, maxCountValue });
                } else {
                  exceedsMaxCount = true;
                }
              }
            }
            if (exceedsMaxCount) {
              rowObj[
                "Remarks"
              ] = endorsementFileUploadMessages.ER0019;
              errors.push(rowObj);
              if (currentEmployee) currentEmployee.hasError = true;
              continue;
            }
            if (employeeKey) {
              counts[employeeKey][relTypeNorm] = updatedCount;
            }
            const optionFound = option;
            if (!optionFound) {
              rowObj["Remarks"] = endorsementFileUploadMessages.ER0020;
              errors.push(rowObj);
              if (currentEmployee) currentEmployee.hasError = true;
              continue;
            }
            if (optionFound && !optionFound.enabled) {
              rowObj["Remarks"] = endorsementFileUploadMessages.ER0020;
              errors.push(rowObj);
              if (currentEmployee) currentEmployee.hasError = true;
              continue;
            }
            if (optionFound && companyEmployee.dateOfBirth) {
              const age = this.calculateAgeAtEffectiveDate(
                companyEmployee.dateOfBirth as Date,
                effectiveDate ?? currentEmployee?.effectiveDate ?? new Date()
              );
              const sanitizedRelation = relation
                .replace(/[-_\s]+/g, "")
                .toLowerCase();
              const sanitizedType = (relTypeRaw || "")
                .replace(/[-_\s]+/g, "")
                .toLowerCase();
              const isInLawRelation = sanitizedRelation.includes(
                PARENT_RELATIONSHIP_TYPES.IN_LAW
              );

              const minAge = Number(optionFound.minAge);
              if (optionFound.minAge && !Number.isNaN(minAge) && age < minAge) {
                rowObj[
                  "Remarks"
                ] = endorsementFileUploadMessages.ER0021;
                errors.push(rowObj);
                if (currentEmployee) currentEmployee.hasError = true;
                continue;
              }
              let effectiveMaxAge: number | undefined;
              if (optionFound.maxAge) {
                const rawMaxAge = Number(optionFound.maxAge);
                if (!Number.isNaN(rawMaxAge)) {
                  effectiveMaxAge = rawMaxAge;
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
                    constraints?.unmarriedDaughterAgeExtension ?? 0
                  );
                  if (
                    unmarriedDaughterExtension > 0 &&
                    sanitizedRelation.includes(
                      PARENT_RELATIONSHIP_TYPES.DAUGHTER
                    ) &&
                    !isInLawRelation
                  ) {
                    effectiveMaxAge += unmarriedDaughterExtension;
                  }
                }
              }

              if (
                typeof effectiveMaxAge === "number" &&
                !Number.isNaN(effectiveMaxAge) &&
                age > effectiveMaxAge
              ) {
                rowObj[
                  "Remarks"
                ] = endorsementFileUploadMessages.ER0022;
                errors.push(rowObj);
                if (currentEmployee) currentEmployee.hasError = true;
                continue;
              }

              // validation for the age gap constraint for employee and dependents
              const employeeDobRaw = currentEmployee.companyEmployee.dateOfBirth;
              let employeeDob: Date | null = null;

              if (employeeDobRaw) {
                if (employeeDobRaw instanceof Date) {
                  employeeDob = employeeDobRaw;
                } else if (typeof employeeDobRaw === "string") {
                  employeeDob = new Date(employeeDobRaw);
                }
              }
              if (employeeDob) {
                const employeeAge = this.calculateAgeAtEffectiveDate(
                  employeeDob as Date,
                  effectiveDate ?? currentEmployee?.effectiveDate ?? new Date()
                );
                const isParentRelation =
                  sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.PARENT) ||
                  sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.FATHER) ||
                  sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.MOTHER) ||
                  sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.PARENTS);
                const isChildRelation =
                  sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.CHILD) ||
                  (!isInLawRelation &&
                    sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.SON)) ||
                  (!isInLawRelation &&
                    sanitizedRelation.includes(
                      PARENT_RELATIONSHIP_TYPES.DAUGHTER
                    )) ||
                  sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.CHILD);

                const parentGapThreshold = Number(
                  constraints?.ageGapBetweenParentAndEmployee ?? 0
                );
                if (isParentRelation && parentGapThreshold > 0) {
                  const actualGap = age - employeeAge;
                  if (actualGap < parentGapThreshold) {
                    rowObj[
                      "Remarks"
                    ] = endorsementFileUploadMessages.ER0023;
                    errors.push(rowObj);
                    if (currentEmployee) currentEmployee.hasError = true;
                    continue;
                  }
                }

                const childGapConstraint =
                  constraints?.ageGapBetweenChildrenAndEmployee ??
                  constraints?.ageGapBetweenParentAndEmployee ??
                  0;
                const childGapThreshold = Number(childGapConstraint);
                if (isChildRelation && childGapThreshold > 0) {
                  const actualGap = employeeAge - age;
                  if (actualGap < childGapThreshold) {
                    rowObj[
                      "Remarks"
                    ] = `Age gap between employee and ${relationRaw} should be at least ${childGapThreshold} years.`;
                    errors.push(rowObj);
                    if (currentEmployee) currentEmployee.hasError = true;
                    continue;
                  }
                }
              }
            }
          }

          const dep: Partial<PolicyEnrollmentDependent> = {
            policyId: upload.entityId,
            name: companyEmployee.employeeName,
            relation: relation,
            relationshipType: relType,
            gender: companyEmployee.gender,
            dateOfBirth: companyEmployee.dateOfBirth,
            effectiveDate:
              effectiveDate ?? currentEmployee.effectiveDate ?? undefined,
            enrollmentAdditionBatchId: upload.documentId,
            claimStatus,
            ...(bypassMode && {
              bypassSumInsured: rowBypassSumInsured,
              bypassPremiumAmount: rowBypassPremiumAmount,
            }),
          };
          currentEmployee.dependents.push(dep);
          currentEmployee.dependentRows.push(rowObj);
        }
      }
      if (currentEmployee) {
        flushPendingChildOverrides();
        validateMaxDependentCountForEmployee();
        rows.push(currentEmployee);
      }
      let deletionRows = rows.filter((r) => r.intakeType === "deletion");
      let additionRows = rows.filter((r) => r.intakeType !== "deletion");
      this.logInfo(
        "processEnrollmentUpload",
        `Separated ${deletionRows.length} deletion rows and ${additionRows.length} addition rows.`
      );

      this.logInfo("processEnrollmentUpload", {
        stage: "deletionRowsSummary",
        deletionRowCount: deletionRows.length,
        effectiveDateHeaderName,
      });

      const claimStatusByEmployeeKey = new Map<string, string | null>();

      const getRowClaimStatus = (row: (typeof deletionRows)[number]) =>
        this.normalizeClaimStatusValue(
          row.claimStatus ??
            row.additionalParams?.["Claim Status"] ??
            row.additionalParams?.["claimStatus"]
        );

      for (const row of deletionRows) {
        const status = getRowClaimStatus(row);
        if (status !== null) {
          const empId = row.companyEmployee.companyEmployeeId;
          if (empId) {
            claimStatusByEmployeeKey.set(String(empId), status);
          }
        }
      }

      const deletionEffectiveDateLookup = new Map<string, Date>();
      for (const row of deletionRows) {
        const { companyEmployee } = row;
        const rawEffectiveDateValue = effectiveDateHeaderName
          ? row.rowObj?.[effectiveDateHeaderName]
          : undefined;
        const additionalEffectiveDateValue = effectiveDateHeaderName
          ? row.additionalParams?.[effectiveDateHeaderName]
          : undefined;
        const resolvedEffectiveDate = resolveDeletionEffectiveDate(
          row,
          effectiveDateHeaderName
        );

        this.logInfo("processEnrollmentUpload", {
          stage: "deletionRowEffectiveDateCapture",
          identifiers: {
            employeeId: companyEmployee.companyEmployeeId ?? null,
            email: companyEmployee.email ?? null,
            phone: companyEmployee.phoneNumber ?? null,
          },
          rawEffectiveDate: rawEffectiveDateValue ?? null,
          additionalEffectiveDate: additionalEffectiveDateValue ?? null,
          resolvedEffectiveDate: resolvedEffectiveDate
            ? resolvedEffectiveDate.toISOString()
            : null,
          isValidDate: Boolean(resolvedEffectiveDate),
        });

        if (!resolvedEffectiveDate) {
          continue;
        }

        if (
          !this.isDateWithinRange(
            resolvedEffectiveDate,
            policyTermStart,
            policyTermEnd
          )
        ) {
          row.hasError = true;
          row.rowObj[
            "Remarks"
          ] = endorsementFileUploadMessages.ER0014;
          errors.push(row.rowObj);
          continue;
        }
        const keys = [
          ...buildDeletionLookupKeys("id", companyEmployee.companyEmployeeId),
          ...buildDeletionLookupKeys("phone", companyEmployee.phoneNumber),
          ...buildDeletionLookupKeys("email", companyEmployee.email),
        ];

        for (const key of keys) {
          if (!deletionEffectiveDateLookup.has(key)) {
            deletionEffectiveDateLookup.set(key, resolvedEffectiveDate);
          }
        }
      }

      deletionRows = deletionRows.filter((row) => !row.hasError);

      const validAdditionRows: typeof additionRows = [];
      const employeeRejectionRemark =
        endorsementFileUploadMessages.ER0024;
      const dependentRejectionRemark =
        endorsementFileUploadMessages.ER0025;

      for (const row of additionRows) {
        if (row.hasError) {
          if (!row.rowObj["Remarks"]) {
            row.rowObj["Remarks"] = employeeRejectionRemark;
          }
          pushUniqueError(row.rowObj);
          for (const depRow of row.dependentRows) {
            if (!depRow["Remarks"]) {
              depRow["Remarks"] = dependentRejectionRemark;
            }
            pushUniqueError(depRow);
          }
        } else {
          validAdditionRows.push(row);
        }
      }
      additionRows = validAdditionRows;

      const employeeChoiceMap: Record<string, any[]> = {};
      const validatedRows: typeof additionRows = [];

      // Build dynamic map from mappings (if any), using the same normalization logic
      const dynamicMap: Record<string, keyof PolicyEnrollmentEmployee> =
        {};
      for (const key in targetToPropertyMap) {
        if (!Object.prototype.hasOwnProperty.call(targetToPropertyMap, key)) continue;
        const foundMapping = mappings.find((m: any) => normalizeHeader(m.target_column_name) === normalizeHeader(key));
        if (foundMapping) {
          dynamicMap[normalizeHeader(foundMapping.source_column_name)] =
            targetToPropertyMap[key] as keyof PolicyEnrollmentEmployee;
        }
      }
      // Merge dynamicMap into normalizedMap, dynamicMap takes precedence
      const mergedMap: Record<string, keyof PolicyEnrollmentEmployee> = {
        ...normalizedMap,
        ...dynamicMap,
      };
      if (!bypassMode) {
        // Loop through the employee additional rows to validate choices
        let employeeDetails = this.transformToPolicyEnrollmentEmployees(
          additionRows,
          mergedMap
        );

        let transformedEmployeeDetails = employeeDetails.map((employee) =>
          this.mapCompanyEmployeeDetails(employee)
        );

        for (let additionalEmployeeDetail of additionRows) {
          let employeeDetails = transformedEmployeeDetails.filter(
            (employeeDetail) =>
              employeeDetail.email === additionalEmployeeDetail.rowObj.email
          )[0];

          // Include effective date in employee details for age calculation
          const employeeDetailsWithEffectiveDate = {
            ...employeeDetails,
            effectiveDate: additionalEmployeeDetail.effectiveDate || null
          };

          // filterPolicyOptions scopes the dependent side to only newly-uploaded
          // (not-yet-in-DB) dependents, so no caller-side slicing is needed here.
          let { matchedComponents, invalidComponents } =
            await this.processEnrollmentChoices(
              additionalEmployeeDetail.dependents.map((dependentDetail, i) =>
                this.mapDependentEntity(
                  { ...dependentDetail, enrollmentAdditionBatchId: upload.documentId },
                  additionalEmployeeDetail.dependentRows[i]
                )
              ),
              additionalEmployeeDetail.choices,
              employeeDetailsWithEffectiveDate,
              config.policyConfiguration
            );
          if (
            invalidComponents.length > 0 ||
            (matchedComponents.length === 0 && invalidComponents.length === 0)
          ) {
            additionalEmployeeDetail.hasError = true;
            const rowObjects = filterRowsByValuesIgnoreCase(
              rowsData,
              [
                additionalEmployeeDetail.companyEmployee.companyEmployeeId ??
                  additionalEmployeeDetail.companyEmployee.email ??
                  additionalEmployeeDetail.companyEmployee.phoneNumber ??
                  "",
              ],
              headerValues
            );
            for (const rowData of rowObjects) {
              (rowData as any)["Remarks"] =
                endorsementFileUploadMessages.ER0026;
              pushUniqueError(rowData);
            }
          } else if (matchedComponents.length) {
            const key =
              additionalEmployeeDetail.companyEmployee.companyEmployeeId?.toString() ||
              additionalEmployeeDetail.companyEmployee.email ||
              additionalEmployeeDetail.companyEmployee.phoneNumber ||
              "";
            employeeChoiceMap[key] = matchedComponents;
            validatedRows.push(additionalEmployeeDetail);
          }
        }
        additionRows = validatedRows;
      }

      const deletionRowsByEmployeeId: Record<
        string,
        (typeof deletionRows)[number][]
      > = {};
      // TODO: Enrollment status insertion

      // TODO: Next choices saving part

      const delEmpIds: string[] = Array.from(
        new Set(
          deletionRows
            .map((d) => d?.companyEmployee?.companyEmployeeId ?? "")
            .filter(Boolean)
        )
      );

      for (const row of deletionRows) {
        const empId = row.companyEmployee.companyEmployeeId as any;
        if (empId) {
          deletionRowsByEmployeeId[empId] = [
            ...(deletionRowsByEmployeeId[empId] ?? []),
            row,
          ];
        }
      }

      let mapsToDelete: PolicyEnrollmentEmployeePolicyMap[] = [];
      const effectiveDateByEmployeeId = new Map<number, Date>();
      const claimStatusByEmployeeId = new Map<number, string | null>();

      if (delEmpIds.length) {
        const employeesToDelete = await this.companyEmployeeRepo
          .createQueryBuilder("emp")
          .where("emp.company_employee_id = ANY(:ids)", {
            ids: delEmpIds.map((id) => String(id)),
          })
          .andWhere("emp.company_id = :companyId", {
            companyId: policyCompanyId,
          })
          .getMany();

        const employeesFoundByCompanyEmployeeId = new Set(
          employeesToDelete.map((emp) => emp.companyEmployeeId)
        );

        for (const missingId of delEmpIds.filter(
          (id) => !employeesFoundByCompanyEmployeeId.has(id)
        )) {
          const affectedRows = deletionRowsByEmployeeId[missingId] ?? [];
          for (const row of affectedRows) {
            row.rowObj[
              "Remarks"
            ] = endorsementFileUploadMessages.ER0006;
            row.hasError = true;
            errors.push(row.rowObj, ...(row.dependentRows || []));
          }
        }

        if (employeesToDelete.length) {
          mapsToDelete = await this.employeePolicyMapRepo
            .createQueryBuilder("map")
            .innerJoinAndSelect("map.employee", "emp")
            .where("map.policy_id = :pid", { pid: upload.entityId })
            .andWhere("map.employee_id = ANY(:employeeIds)", {
              employeeIds: employeesToDelete.map((emp) => emp.id),
            })
            .getMany();

          const mappedCompanyEmployeeIds = new Set(
            mapsToDelete.map((map) => map.employee?.companyEmployeeId)
          );

          // Distinguish "never enrolled in this policy" from "already removed
          // from this policy" — the active-only query above can't tell the two
          // apart, but the uploader needs to know which one actually happened.
          const alreadyDeletedMaps = await this.employeePolicyMapRepo
            .createQueryBuilder("map")
            .withDeleted()
            .innerJoinAndSelect("map.employee", "emp")
            .where("map.policy_id = :pid", { pid: upload.entityId })
            .andWhere("map.employee_id = ANY(:employeeIds)", {
              employeeIds: employeesToDelete.map((emp) => emp.id),
            })
            .andWhere("map.deleted_at IS NOT NULL")
            .getMany();

          const alreadyDeletedCompanyEmployeeIds = new Set(
            alreadyDeletedMaps.map((map) => map.employee?.companyEmployeeId)
          );

          for (const emp of employeesToDelete) {
            const companyEmpId = emp.companyEmployeeId;
            if (!companyEmpId) {
              continue;
            }

            if (!mappedCompanyEmployeeIds.has(companyEmpId)) {
              const affectedRows = deletionRowsByEmployeeId[companyEmpId] ?? [];
              const remark = alreadyDeletedCompanyEmployeeIds.has(companyEmpId)
                ? endorsementFileUploadMessages.ER0073
                : endorsementFileUploadMessages.ER0027;
              for (const row of affectedRows) {
                row.rowObj["Remarks"] = remark;
                row.hasError = true;
                errors.push(row.rowObj, ...(row.dependentRows || []));
              }
            }
          }
        }
      }

      for (const map of mapsToDelete) {
        const keys = [
          ...buildDeletionLookupKeys("id", map.employee?.companyEmployeeId),
          ...buildDeletionLookupKeys("phone", map.employee?.phoneNumber),
          ...buildDeletionLookupKeys("email", map.employee?.email),
        ];

        for (const key of keys) {
          const match = deletionEffectiveDateLookup.get(key);
          if (match) {
            effectiveDateByEmployeeId.set(map.employeeId, match);
            this.logInfo("processEnrollmentUpload", {
              stage: "deletionEffectiveDateMatched",
              employeeId: map.employeeId,
              mapId: map.id,
              matchedKey: key,
              matchedEffectiveDate: match.toISOString(),
            });
            break;
          }
        }
        if (map.employee?.companyEmployeeId) {
          const claimStatus = claimStatusByEmployeeKey.get(
            String(map.employee.companyEmployeeId)
          );
          if (claimStatus !== undefined) {
            claimStatusByEmployeeId.set(map.employeeId, claimStatus);
          }
        }
        if (!effectiveDateByEmployeeId.has(map.employeeId)) {
          this.logInfo("processEnrollmentUpload", {
            stage: "deletionEffectiveDateMissing",
            employeeId: map.employeeId,
            mapId: map.id,
            attemptedKeys: keys,
          });
        }
      }

      if (mapsToDelete.length) {
        const endorsementReadyMap = await this.getEndorsementReadyEmployeeIds(
          mapsToDelete.map((m) => m.employeeId),
          upload.entityId
        );

        if (endorsementReadyMap.size) {
          const skipped = mapsToDelete.filter((m) => endorsementReadyMap.has(m.employeeId));
          mapsToDelete = mapsToDelete.filter((m) => !endorsementReadyMap.has(m.employeeId));

          for (const map of skipped) {
            const companyEmpId = map.employee?.companyEmployeeId;
            const endorsementRecordId = endorsementReadyMap.get(map.employeeId);
            const affectedRows = companyEmpId ? (deletionRowsByEmployeeId[companyEmpId] ?? []) : [];
            for (const row of affectedRows) {
              row.rowObj["Remarks"] = `Unable to delete employee with ID ${companyEmpId} as he is endorsement ready in EndorsementID ${endorsementRecordId}`;
              row.hasError = true;
              errors.push(row.rowObj, ...(row.dependentRows || []));
            }
          }
        }
      }

      if (mapsToDelete.length) {
        const bypassByEmployeeId = new Map<number, { premiumAmount: number | null; sumInsured: number | null }>();
        if (bypassMode) {
          for (const map of mapsToDelete) {
            const companyEmpId = map.employee?.companyEmployeeId;
            const matchingRow = companyEmpId
              ? deletionRows.find(
                  (r) => String(r.companyEmployee.companyEmployeeId) === String(companyEmpId)
                )
              : undefined;
            if (matchingRow) {
              bypassByEmployeeId.set(map.employeeId, {
                premiumAmount: (matchingRow as any).bypassPremiumAmount ?? null,
                sumInsured: (matchingRow as any).bypassSumInsured ?? null,
              });
            }
          }
        }

        await this.handleMapDeletions(
          mapsToDelete,
          upload,
          effectiveDateByEmployeeId,
          claimStatusByEmployeeId,
          bypassByEmployeeId.size ? bypassByEmployeeId : undefined
        );

        const successfulDeletionIds = new Set(
          mapsToDelete.map((map) => map.employee?.companyEmployeeId)
        );

        for (const row of deletionRows) {
          const rowEmpId = row.companyEmployee.companyEmployeeId;
          if (
            !row.hasError &&
            rowEmpId &&
            successfulDeletionIds.has(rowEmpId)
          ) {
            row.rowObj["Remarks"] = "Deleted";
            successRows.push(row.rowObj, ...(row.dependentRows || []));
          }
        }
      }

      if (dependentDeletionRows.length) {
        // Employees whose dependent(s) were actually deleted in the loop below — used
        // after the loop to refund each employee's enrollment exactly once (a batch can
        // list several dependents for the same employee across multiple rows).
        const employeesWithDeletedDependents = new Map<number, PolicyEnrollmentEmployee>();
        const depEmpIds = Array.from(
          new Set(
            dependentDeletionRows
              .map((d) => d.companyEmployee.companyEmployeeId)
              .filter(Boolean)
          )
        );

        const depEmployees = depEmpIds.length
          ? await this.companyEmployeeRepo
              .createQueryBuilder("emp")
              .where("emp.company_employee_id = ANY(:ids)", {
                ids: depEmpIds.map((id) => String(id)),
              })
              .andWhere("emp.company_id = :companyId", {
                companyId: policyCompanyId,
              })
              .getMany()
          : [];

        const depEmployeeByKey: Record<string, PolicyEnrollmentEmployee> = {};
        for (const emp of depEmployees) {
          if (emp.companyEmployeeId) {
            depEmployeeByKey[String(emp.companyEmployeeId)] = emp;
          }
        }

        for (const row of dependentDeletionRows) {
          const key = row.companyEmployee.companyEmployeeId
            ? String(row.companyEmployee.companyEmployeeId)
            : "";
          const emp = depEmployeeByKey[key];
          if (emp) {
            const dependentName = row.companyEmployee.employeeName?.trim();
            if (!dependentName) {
              row.rowObj["Remarks"] = endorsementFileUploadMessages.ER0028;
              errors.push(row.rowObj);
              continue;
            }

            const nameWithoutSpaces = dependentName.replace(/\s+/g, "");
            const lowerDependentName = dependentName.toLowerCase();
            const lowerNameWithoutSpaces = nameWithoutSpaces.toLowerCase();

            const endorsementReadyDep = await this.dependentRepo
              .createQueryBuilder("dep")
              .where("dep.employee_id = :employeeId", { employeeId: emp.id })
              .andWhere("dep.policy_id = :policyId", { policyId: upload.entityId })
              .andWhere("dep.endorsement_status_key = :statusKey", { statusKey: EMPLOYEE_ENDORSEMENT_READY })
              .andWhere("LOWER(dep.relation) = :relation", { relation: row.relation })
              .andWhere(
                new Brackets((qb2) => {
                  qb2.where("dep.name = :name", { name: dependentName });
                  if (nameWithoutSpaces) {
                    // Strip both regular spaces and non-breaking spaces (chr(160)) —
                    // some legacy-loaded names carry a leading U+00A0 that JS's
                    // .trim()/\s already strips from the incoming file value, but
                    // SQL REPLACE(name, ' ', '') alone would leave untouched.
                    qb2.orWhere("REPLACE(REPLACE(dep.name, chr(160), ''), ' ', '') = :nameNoSpaces", { nameNoSpaces: nameWithoutSpaces });
                  }
                  qb2.orWhere("LOWER(dep.name) = :lowerName", { lowerName: lowerDependentName });
                  if (lowerNameWithoutSpaces) {
                    qb2.orWhere("LOWER(REPLACE(REPLACE(dep.name, chr(160), ''), ' ', '')) = :lowerNameNoSpaces", { lowerNameNoSpaces: lowerNameWithoutSpaces });
                  }
                })
              )
              .getOne();

            if (endorsementReadyDep) {
              row.rowObj["Remarks"] = `Unable to delete dependent with ID ${endorsementReadyDep.id} as he is endorsement ready in EndorsementID ${endorsementReadyDep.additionEndorsementId}`;
              errors.push(row.rowObj);
              continue;
            }

            const updateResult = await this.dependentRepo
              .createQueryBuilder()
              .update(PolicyEnrollmentDependent)
              .set({
                deletedAt: effectiveDateByEmployeeId.get(emp.id) ?? resolveDeletionEffectiveDate(row, effectiveDateHeaderName) ?? new Date(),
                deletionEndorsementId: upload.endorsementId,
                enrollmentDeletionBatchId: upload.documentId,
                endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                claimStatus: this.normalizeClaimStatusValue(row.claimStatus),
                ...(bypassMode && {
                  bypassPremiumAmount: (row as any).bypassPremiumAmount ?? null,
                  bypassSumInsured: (row as any).bypassSumInsured ?? null,
                }),
              })
              .where("employee_id = :employeeId", { employeeId: emp.id })
              .andWhere("policy_id = :policyId", { policyId: upload.entityId })
              .andWhere("LOWER(relation) = :relation", { relation: row.relation })
              .andWhere(
                new Brackets((qb2) => {
                  qb2.where("name = :name", { name: dependentName });
                  if (nameWithoutSpaces) {
                    qb2.orWhere("REPLACE(name, ' ', '') = :nameNoSpaces", {
                      nameNoSpaces: nameWithoutSpaces,
                    });
                  }
                  qb2.orWhere("LOWER(name) = :lowerName", {
                    lowerName: lowerDependentName,
                  });
                  if (lowerNameWithoutSpaces) {
                    qb2.orWhere(
                      "LOWER(REPLACE(name, ' ', '')) = :lowerNameNoSpaces",
                      {
                        lowerNameNoSpaces: lowerNameWithoutSpaces,
                      }
                    );
                  }
                })
              )
              .returning("id")
              .execute();

            if ((updateResult.affected ?? 0) > 0) {
              row.rowObj["Remarks"] = "Deleted";
              successRows.push(row.rowObj);
              employeesWithDeletedDependents.set(emp.id, emp);
            } else {
              // The update above only matches active (non-deleted) rows — if
              // nothing matched, distinguish "never existed" from "already
              // removed from this policy" so the remark tells the uploader
              // which one actually happened, rather than a misleading
              // "does not exist" for a dependent that's already gone.
              const alreadyDeletedDep = await this.dependentRepo
                .createQueryBuilder("dep")
                .withDeleted()
                .where("dep.employee_id = :employeeId", { employeeId: emp.id })
                .andWhere("dep.policy_id = :policyId", { policyId: upload.entityId })
                .andWhere("LOWER(dep.relation) = :relation", { relation: row.relation })
                .andWhere("dep.deleted_at IS NOT NULL")
                .andWhere(
                  new Brackets((qb2) => {
                    qb2.where("dep.name = :name", { name: dependentName });
                    if (nameWithoutSpaces) {
                      qb2.orWhere("REPLACE(dep.name, ' ', '') = :nameNoSpaces", { nameNoSpaces: nameWithoutSpaces });
                    }
                    qb2.orWhere("LOWER(dep.name) = :lowerName", { lowerName: lowerDependentName });
                    if (lowerNameWithoutSpaces) {
                      qb2.orWhere("LOWER(REPLACE(dep.name, ' ', '')) = :lowerNameNoSpaces", { lowerNameNoSpaces: lowerNameWithoutSpaces });
                    }
                  })
                )
                .getOne();

              row.rowObj["Remarks"] = alreadyDeletedDep
                ? endorsementFileUploadMessages.ER0074
                : endorsementFileUploadMessages.ER0029;
              errors.push(row.rowObj);
            }
          } else {
            row.rowObj["Remarks"] = endorsementFileUploadMessages.ER0030;
            errors.push(row.rowObj);
          }
        }

        // Refund each affected employee's enrollment for the dependent(s) just deleted
        // above — nothing else on this independent (file-upload) dependent-deletion path
        // ever calls updateEnrollmentStatus, so sumInsured/totalPremium/etc. on
        // policy_employee_enrollment would otherwise stay frozen at their pre-deletion
        // values (mirrors the same fix applied to handleMapDeletions for whole-employee
        // deletions).
        for (const [depEmployeeId, depEmp] of employeesWithDeletedDependents) {
          const currentEnrollment = await this.employeeEnrollmentRepo.findOne({
            where: { employeeId: depEmployeeId, policyId: upload.entityId },
            select: ["employeeEnrollmentStatusKey"],
          });
          if (!currentEnrollment) continue;

          const deletedDependentIdsForEmployee = (
            await this.dependentRepo.find({
              where: {
                employeeId: depEmployeeId,
                policyId: upload.entityId,
                deletionEndorsementId: upload.endorsementId,
              },
              withDeleted: true,
              select: ["id"],
            })
          ).map((dep) => dep.id);

          await this.enrollmentRepoAdapter.updateEnrollmentStatus(
            this.dataSource.manager,
            upload.entityId,
            depEmployeeId,
            depEmp.companyId ?? 0,
            currentEnrollment.employeeEnrollmentStatusKey,
            upload.endorsementId,
            true,
            [],
            deletedDependentIdsForEmployee
          );
        }
      }

      const addEmpIds = Array.from(
        new Set(
          additionRows
            .map((a) => a.companyEmployee.companyEmployeeId)
            .filter(Boolean)
        )
      );

      const existingByIds = addEmpIds.length
        ? await this.companyEmployeeRepo
            .createQueryBuilder("emp")
            .where("emp.company_employee_id = ANY(:ids)", {
              ids: addEmpIds,
            })
            .andWhere("emp.company_id = :companyId", {
              companyId: policyCompanyId,
            })
            .getMany()
        : [];

      // Also fetch employees matching by email or phone so that cross-ID duplicates
      const fetchedIdSet = new Set(existingByIds.map((e) => e.id));

      const addEmails = [
        ...new Set(
          additionRows
            .map((r) => r.companyEmployee.email?.trim())
            .filter((v): v is string => !!v)
        ),
      ];
      const addPhones = [
        ...new Set(
          additionRows
            .map((r) => {
              if (!r.companyEmployee.phoneNumber) return undefined;
              const rowCountryCode =
                (r.companyEmployee.policyConfigLocationId != null
                  ? phoneCodeByCpclId.get(r.companyEmployee.policyConfigLocationId)
                  : undefined) ??
                defaultCountryCallingCode ??
                "91";
              return `+${rowCountryCode}${String(r.companyEmployee.phoneNumber).trim()}`;
            })
            .filter((v): v is string => !!v)
        ),
      ];

      const emailPhoneConditions = [
        ...addEmails.map((email) => ({ email, companyId: policyCompanyId })),
        ...addPhones.map((phoneNumber) => ({
          phoneNumber,
          companyId: policyCompanyId,
        })),
      ];
      const existingByEmailPhone = emailPhoneConditions.length
        ? (
            await this.companyEmployeeRepo.find({ where: emailPhoneConditions })
          ).filter((e) => !fetchedIdSet.has(e.id))
        : [];

      const existingEmployees = [...existingByIds, ...existingByEmailPhone];

      const employeeById: Record<string, PolicyEnrollmentEmployee> = {};
      for (const emp of existingEmployees) {
        if (emp.companyEmployeeId) {
          employeeById[String(emp.companyEmployeeId)] = emp;
        }
        if (emp.phoneNumber) {
          employeeById[`ph_${emp.phoneNumber}`] = emp;
        }
        if (emp.email) {
          employeeById[`em_${emp.email}`] = emp;
        }
      }

      const existingMaps = existingEmployees.length
        ? await this.employeePolicyMapRepo
            .createQueryBuilder("m")
            .withDeleted()
            .innerJoin(
              PolicyEnrollmentEmployee,
              "emp",
              "emp.id = m.employee_id"
            )
            .where("m.policy_id = :pid", { pid: upload.entityId })
            .andWhere("emp.company_id = :companyId", {
              companyId: policyCompanyId,
            })
            .andWhere("m.employee_id = ANY(:empIds)", {
              empIds: existingEmployees.map((e) => e.id),
            })
            .getMany()
        : [];

      const mappedEmployeeIds = new Set(existingMaps.map((m) => m.employeeId));

      totalRecords = additionRows.length;
      const submissionStart = Date.now();
      this.logInfo(
        "processEnrollmentUpload",
        `Submitting enrollment for ${totalRecords} employees (start: ${new Date(
          submissionStart
        ).toISOString()})`
      );
      for (const row of additionRows) {
        const keyId =
          row.companyEmployee.companyEmployeeId !== undefined
            ? String(row.companyEmployee.companyEmployeeId)
            : undefined;

        const existingEmp = keyId && employeeById[keyId];

        const email = row.companyEmployee.email
          ? String(row.companyEmployee.email).trim()
          : undefined;
        const rowCountryCode =
          (row.companyEmployee.policyConfigLocationId != null
            ? phoneCodeByCpclId.get(row.companyEmployee.policyConfigLocationId)
            : undefined) ??
          defaultCountryCallingCode ??
          "91";
        const phone = row.companyEmployee.phoneNumber
          ? `+${rowCountryCode}${String(row.companyEmployee.phoneNumber).trim()}`
          : undefined;

        if (email) {
          row.companyEmployee.email = email;
        }
        if (phone) {
          row.companyEmployee.phoneNumber = phone;
        }

        const existingEmpByEmail = email && employeeById[`em_${email}`];
        const existingEmpByPhone = phone && employeeById[`ph_${phone}`];
        const matchedExistingEmp = existingEmp || existingEmpByEmail || existingEmpByPhone;

        if (
          matchedExistingEmp &&
          mappedEmployeeIds.has(matchedExistingEmp.id) &&
          !(row.skipExistingEmployeeCheck ?? false)
        ) {
          row.rowObj["Remarks"] =
            endorsementFileUploadMessages.ER0031;
          errors.push(row.rowObj, ...row.dependentRows);
          continue;
        }

        // IBP-detach: enrollment uploads never look employees up against the
        // `users` table (no email/phone matching, no IIRM-employee
        // promotion) — employees are identified purely by
        // policy_enrollment_employee, and IBP login lives entirely on that
        // row. userId stays null for every employee created/updated here.
        const userId: number | null = null;

        let employeeId: number | null = null;
        try {
          await this.userRepo.manager.transaction(async (manager) => {
            const transactionalUser: User | null = null;
            let ibpCredentials: { loginName: string; password: string } | null = null;

            if (!transactionalUser) {
              const [firstName, ...rest] = (
                row.companyEmployee.employeeName ?? "Company-user"
              ).split(" ");
              const trimmedCompanyIdentifier =
                policyCompanyId !== undefined && policyCompanyId !== null
                  ? String(policyCompanyId).trim()
                  : file.entityId !== undefined && file.entityId !== null
                  ? String(file.entityId).trim()
                  : row.companyEmployee.employeeCompanyId !== undefined &&
                    row.companyEmployee.employeeCompanyId !== null
                  ? String(row.companyEmployee.employeeCompanyId).trim()
                  : "company";
              const trimmedEmployeeIdentifier =
                row.companyEmployee.companyEmployeeId !== undefined &&
                row.companyEmployee.companyEmployeeId !== null
                  ? String(row.companyEmployee.companyEmployeeId).trim()
                  : "";
              const fallbackEmployeeIdentifier =
                trimmedEmployeeIdentifier ||
                (row.companyEmployee.employeeCompanyId !== undefined &&
                row.companyEmployee.employeeCompanyId !== null
                  ? String(row.companyEmployee.employeeCompanyId).trim()
                  : String(phone).trim() || "employee");
              const sanitizedEmployeeIdentifier =
                fallbackEmployeeIdentifier &&
                fallbackEmployeeIdentifier.trim() !== ""
                  ? fallbackEmployeeIdentifier.trim()
                  : "employee";
              const passwordSource =
                this.toDateOnlyString(
                  row.companyEmployee.dateOfBirth as Date
                ) ?? sanitizedEmployeeIdentifier;
              const loginName = sanitizedEmployeeIdentifier;
              const password = await bcrypt.hash(passwordSource, 10);
              // IBP-only employee: store credentials in pee, not users table
              ibpCredentials = { loginName, password };
              // transactionalUser and userId stay null
            }

            if (!existingEmp) {
              const initialAdditional =
                row.additionalParams ??
                row.companyEmployee.additionalParams ??
                {};
              row.additionalParams = initialAdditional;
              row.companyEmployee.additionalParams = initialAdditional;

              const newEmployee = this.companyEmployeeRepo.create({
                ...row.companyEmployee,
                userId,
                companyId: policyCompanyId,
                companyType: file.entityType,
                createdBy: 0,
                updatedBy: 0,
                ...(bypassMode && {
                  bypassPremiumAmount: row.bypassPremiumAmount ?? null,
                  bypassSumInsured: row.bypassSumInsured ?? null,
                }),
              });
              const savedEmp = await manager.save(newEmployee);
              const emp = Array.isArray(savedEmp) ? savedEmp[0] : savedEmp;
              employeeId = emp.id;
            } else {
              const incomingAdditional =
                row.additionalParams ??
                row.companyEmployee.additionalParams ??
                {};
              const { merged, hasChanges } = this.mergeAdditionalParams(
                existingEmp.additionalParams as Record<string, any> | undefined,
                incomingAdditional
              );
              row.additionalParams = merged;
              row.companyEmployee.additionalParams = merged;
              existingEmp.additionalParams = merged as any;

              if (hasChanges || bypassMode) {
                await manager.update(PolicyEnrollmentEmployee, existingEmp.id, {
                  additionalParams: merged,
                  ...(bypassMode && {
                    bypassPremiumAmount: row.bypassPremiumAmount ?? null,
                    bypassSumInsured: row.bypassSumInsured ?? null,
                  }),
                });
              }

              employeeId = existingEmp.id;
            }

            // Write credentials to pee for new IBP-only employees (no users record)
            if (ibpCredentials && employeeId) {
              await manager.update(PolicyEnrollmentEmployee, { id: employeeId }, {
                loginName: ibpCredentials.loginName,
                password: ibpCredentials.password,
                isPasswordSet: false,
                authVersion: 1,
                userStatusKey: USER_STATUS_ACTIVE,
              });
              const ibpRoleRepo = manager.getRepository(Role);
              const ibpUserRoleRepo = manager.getRepository(UserRole);
              let ibpRole = await ibpRoleRepo.findOne({ where: { roleKey: COMPANY_EMPLOYEE_ROLE_KEY } });
              if (!ibpRole) {
                ibpRole = await ibpRoleRepo.save(ibpRoleRepo.create({ name: "Company Employee", description: "Company Employee", createdBy: "system", updatedBy: "system", roleKey: COMPANY_EMPLOYEE_ROLE_KEY }));
              }
              if (ibpRole?.id) {
                const existingIbpRole = await ibpUserRoleRepo.findOne({ where: { ibpEmployeeId: employeeId, roleId: ibpRole.id } });
                if (!existingIbpRole) {
                  await ibpUserRoleRepo.save(ibpUserRoleRepo.create({ ibpEmployeeId: employeeId, roleId: ibpRole.id }));
                }
              }
            }

            const mapKey =
              row.companyEmployee.companyEmployeeId?.toString() ||
              row.companyEmployee.email ||
              row.companyEmployee.phoneNumber ||
              "";

            if (!mappedEmployeeIds.has(employeeId!)) {
              const existingMap = await manager.findOne(
                PolicyEnrollmentEmployeePolicyMap,
                {
                  where: { employeeId: employeeId!, policyId: upload.entityId },
                  withDeleted: true,
                }
              );
              const claimStatusValue = this.normalizeClaimStatusValue(
                row.claimStatus ??
                  row.additionalParams?.["Claim Status"] ??
                  row.additionalParams?.["claimStatus"]
              );
              const hasParentalLock = (constraints?.parentalLockInPeriod ?? 0) > 0;
              const parentalLockValue = hasParentalLock
                ? String(row.rowObj?.["Parental Lock"] ?? "").toLowerCase() === "yes"
                : null;
              if (existingMap) {
                const updates: Partial<PolicyEnrollmentEmployeePolicyMap> = {
                  enrollmentStartDate:
                    row.enrollmentStartDate ??
                    upload.enrollmentStartDate ??
                    existingMap.enrollmentStartDate,
                  enrollmentEndDate:
                    row.enrollmentEndDate ??
                    upload.enrollmentEndDate ??
                    existingMap.enrollmentEndDate,
                  effectiveDate:
                    (this.toDateOnlyString(row.effectiveDate) as any) ||
                    existingMap.effectiveDate ||
                    null,
                  enrollmentAdditionBatchId:
                    existingMap.enrollmentAdditionBatchId ?? upload.documentId,
                  additionalParams:
                    row.additionalParams ?? existingMap.additionalParams ?? {},
                  claimStatus:
                    claimStatusValue ?? existingMap.claimStatus ?? null,
                  isParentalLockEnabled: parentalLockValue,
                };
                await manager.update(
                  PolicyEnrollmentEmployeePolicyMap,
                  { id: existingMap.id },
                  updates
                );
              } else {
                await manager.save(
                  this.employeePolicyMapRepo.create({
                    employeeId: employeeId!,
                    policyId: upload.entityId,
                    enrollmentStartDate:
                      row.enrollmentStartDate ??
                      upload.enrollmentStartDate ??
                      null,
                    enrollmentEndDate:
                      row.enrollmentEndDate ?? upload.enrollmentEndDate ?? null,
                    effectiveDate: (this.toDateOnlyString(row.effectiveDate) ??
                      null) as any,
                    enrollmentAdditionBatchId: upload.documentId,
                    additionalParams: row.additionalParams ?? {},
                    claimStatus: claimStatusValue,
                    isParentalLockEnabled: parentalLockValue,
                  })
                );
              }
              mappedEmployeeIds.add(employeeId!);
            }

            if (employeeChoiceMap[mapKey]) {
              employeeComponentsMap[employeeId!] = employeeChoiceMap[mapKey];
            }

            if (row.dependents.length) {
              employeeDependentsMap[employeeId!] = row.dependents.map((d, i) =>
                this.mapDependentEntity(
                  { ...d, enrollmentAdditionBatchId: upload.documentId },
                  row.dependentRows[i]
                )
              );
            }
          });
        } catch (err) {
          if (err instanceof QueryFailedError && err.code === "23505") {
            row.rowObj["Remarks"] = endorsementFileUploadMessages.ER0032;
            console.log(`Error during the db data upload: ${err}`);
            this.logger.error({
              level: "error",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "failure",
                location: "scheduler-service EnrollmentUploadScheduler",
                method: "processEnrollmentUpload",
                messageData:
                  err instanceof Error
                    ? { message: err.message, stack: err.stack }
                    : err,
              }),
            });
            errors.push(row.rowObj, ...row.dependentRows);
            continue;
          }
          throw err;
        }

        const existingDependentCount = row.databaseDependentCount ?? 0;
        const totalDependents = row.dependents?.length ?? 0;
        const newDependentCount = Math.max(
          totalDependents - existingDependentCount,
          0
        );

        if (bypassMode && employeeId) {
          // In bypass mode: directly save dependents (no policy choices, no batch API).
          // Only save NEW dependents (those beyond databaseDependentCount) — old ones from
          // previous endorsements must not be re-saved with the current endorsement's ID.
          const newDependents = row.dependents.slice(existingDependentCount);

          if (newDependents.length) {
            const depsToSave = newDependents.map((d) =>
              this.dependentRepo.create({
                ...d,
                employeeId: employeeId!,
                policyId: upload.entityId,
                enrollmentAdditionBatchId: upload.documentId,
                endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                additionEndorsementId: upload.endorsementId,
                bypassPremiumAmount: d.bypassPremiumAmount ?? null,
                bypassSumInsured: d.bypassSumInsured ?? null,
              })
            );
            await this.dependentRepo.save(depsToSave);
          }

          const depBypassPremium = newDependents.reduce(
            (sum, d) => sum + (Number(d.bypassPremiumAmount ?? 0) || 0),
            0
          );
          const bypassPremium = (Number(row.bypassPremiumAmount ?? 0) || 0) + depBypassPremium;
          const existingEnrollment = await this.employeeEnrollmentRepo.findOne({
            where: {
              employeeId,
              policyId: upload.entityId,
            },
          });
          if (existingEnrollment) {
            await this.employeeEnrollmentRepo.update(
              { id: existingEnrollment.id },
              {
                employeeEnrollmentStatusKey:
                  EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
                totalPremium: bypassPremium,
                lastPaidNetPremium: bypassPremium,
                lastPaidGrossPremium: bypassPremium,
                endorsementUpdationFileId: upload.documentId,
                endorsementUpdationCreatedAt: new Date(),
              }
            );
          } else {
            await this.employeeEnrollmentRepo.save(
              this.employeeEnrollmentRepo.create({
                policyId: upload.entityId,
                employeeId,
                companyId: policy.companyId ?? 0,
                sumInsured: Number(row.bypassSumInsured ?? 0) || 0,
                balance: 0,
                totalPremium: bypassPremium,
                totalCompanyPay: 0,
                totalEmployeePay: 0,
                lastPaidGrossPremium: bypassPremium,
                lastPaidNetPremium: bypassPremium,
                employeeEnrollmentStatusKey:
                  EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
                endorsementUpdationFileId: upload.documentId,
                endorsementUpdationCreatedAt: new Date(),
              })
            );
          }

          // Skip PEE creation when only new dependents are being added for an already-enrolled
          // employee — the employee belongs to a prior endorsement, not this one.
          const isDependentOnlyAddition = row.isFetchedFromDatabase && newDependentCount > 0;
          if (!isDependentOnlyAddition) {
            const existingEmpEndorsement =
              await this.policyEmployeeEndorsementRepo.findOne({
                where: {
                  employeeId,
                  policyId: upload.entityId,
                  endorsementId: upload.endorsementId,
                },
              });
            if (existingEmpEndorsement) {
              await this.policyEmployeeEndorsementRepo.update(
                { id: existingEmpEndorsement.id },
                {
                  employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                  endorsementUpdationFileId: upload.documentId,
                  endorsementUpdationCreatedAt: new Date(),
                }
              );
            } else {
              await this.policyEmployeeEndorsementRepo.insert({
                employeeId,
                policyId: upload.entityId,
                companyId: policy.companyId,
                employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                endorsementId: upload.endorsementId,
                createdAt: new Date(),
                endorsementUpdationFileId: upload.documentId,
                endorsementUpdationCreatedAt: new Date(),
              });
            }
          }

          const bypassPayload: any = {
            employeeId: Number(employeeId),
            policyId: upload.entityId,
            choices: [],
            action: "submit",
            dependents: [],
            companyId: policy.companyId!,
          };
          if (isDependentOnlyAddition) {
            bypassPayload.isDependentOnly = true;
            bypassPayload.statusUpdateForNewDependentsOnly = true;
          }
          payloads.push(bypassPayload);
        } else if (employeeId && config?.companyId) {
          const payload: any = {
            employeeId: Number(employeeId),
            policyId: upload.entityId,
            choices: employeeComponentsMap[Number(employeeId)] ?? [],
            action: "submit",
            dependents: employeeDependentsMap[Number(employeeId)] ?? [],
            companyId: config.companyId!,
          };
          if (row.isFetchedFromDatabase && newDependentCount > 0) {
            payload.isDependentOnly = true;
            payload.statusUpdateForNewDependentsOnly = true;
          }

          payloads.push(payload);
        }
        if (row.isFetchedFromDatabase) {
          successRows.push(...row.dependentRows);
        } else {
          successRows.push(row.rowObj, ...row.dependentRows);
          successEmployeeCount++;
        }

        successDependentCount += newDependentCount;
      }
      const payloadPrepEnd = Date.now();
      this.logInfo("processEnrollmentUpload", {
        phase: "payload-preparation",
        startTime: new Date(payloadPrepStart).toISOString(),
        endTime: new Date(payloadPrepEnd).toISOString(),
        duration: `${payloadPrepEnd - payloadPrepStart}ms`,
      });
      if (payloads.length) {
        const enrollmentBatchKey = `policy-enrollment:${
          upload.id
        }:${Date.now()}`;
        await this.storeEnrollmentData(enrollmentBatchKey, payloads);
        const enrollmentSubmitStartTime = Date.now();
        try {
          await this.submitEnrollmentBatch(
            enrollmentBatchKey,
            login.accessToken.accessToken,
            userDetails.userId,
            upload.endorsementId
          );
          const enrollmentSubmitEndTime = Date.now();
          this.logInfo("submitEnrollmentBatch", {
            enrollmentSubmitStartTime: new Date(
              enrollmentSubmitStartTime
            ).toISOString(),
            enrollmentSubmitEndTime: new Date(
              enrollmentSubmitEndTime
            ).toISOString(),
            duration: `${
              enrollmentSubmitEndTime - enrollmentSubmitStartTime
            }ms`,
          });
        } catch (err) {
          const errorData =
            err instanceof AxiosError ? err.response?.data ?? err.message : err;
          this.logError("processEnrollmentUpload", { error: errorData });
          // keep data for inspection on failure
        }
      }

      let errorFileId: number | null = null;
      let successFileId: number | null = null;
      if (errors.length) {
        const errorBuffer = await generateExcel(errors);
        const errorFileSizeBytes = errorBuffer.length;
        const errorFileSizeFormatted = formatSize(errorFileSizeBytes);

        const sanitizedName = `policy-${
          upload.entityId
        }-errorfile${Date.now()}.xlsx`;
        const key = `uploads/company/${file.entityType}/errorfiles/${sanitizedName}`;

        try {
          await uploadToS3(
            errorBuffer,
            key,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          const savedErrorFile = await this.fileRepo.save(
            this.fileRepo.create({
              fileKey: key,
              entityType: file.entityType,
              entityId: file.entityId,
              uploadType: "AWS",
              documentTypeLid: file.documentTypeLid,
              createdBy: 0,
              updatedBy: 0,
              fileSize: errorFileSizeFormatted
            })
          );
          errorFileId = savedErrorFile.id;
        } catch (uploadErr) {
          this.logError(
            "processEnrollmentUpload",
            `Failed to upload error file for upload ${upload.id}: ${uploadErr}`
          );
        }
      }

      // Success file generation temporarily disabled as we are not using this any where as per requirements
      // Uncomment the block below if success file tracking is needed in future

      //  if (successRows.length) {
      //    const successBuffer = await generateExcel(successRows);
      //    const sanitizedName = `policy-${
      //      upload.entityId
      //    }-successfile${Date.now()}.xlsx`;
      //    const key = `uploads/company/${file.companyType}/successfiles/${sanitizedName}`;

      //    try {
      //      await uploadToS3(
      //        successBuffer,
      //        key,
      //        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      //      );
      //      const savedSuccessFile = await this.fileRepo.save(
      //        this.fileRepo.create({
      //          fileKey: key,
      //          companyType: file.companyType,
      //          companyId: file.companyId,
      //          uploadType: "AWS",
      //          documentTypeLid: file.documentTypeLid,
      //          createdBy: 0,
      //          updatedBy: 0,
      //        })
      //      );
      //      successFileId = savedSuccessFile.id;
      //    } catch (uploadErr) {
      //      this.logError(
      //        "processEnrollmentUpload",
      //        `Failed to upload success file for upload ${upload.id}: ${uploadErr}`
      //      );
      //    }
      //  }

      const processCount = successRows.length + errors.length;

      const summary = await this.summaryRepo.save(
        this.summaryRepo.create({
          documentProcessingFileId: upload.id,
          policyId: upload.entityId,
          sourceFileUploadId: file.id,
          errorFileUploadId: errorFileId,
          successFileUploadId: successFileId,
          successCount: successRows.length,
          errorCount: errors.length,
          processCount,
          batchId: upload.id,
          endorsementId: upload.endorsementId,
          premiumCalculated: !bypassMode,
        })
      );

      const endTime = Date.now();
      const duration = intervalToDuration({
        start: overallStartTime,
        end: endTime,
      });
      const humanDuration = formatDuration(duration);
      this.logInfo(
        "processEnrollmentUpload",
        [
          "Enrollment API submissions completed:",
          `total xl records - ${processCount}`,
          `correct records - ${successRows.length}`,
          `error records - ${errors.length}`,
          `processed employee records - ${successEmployeeCount}`,
          `processed dependent records - ${successDependentCount}`,
          `overall processed records (employee + dependents) - ${
            successEmployeeCount + successDependentCount
          }`,
          `start time - ${new Date(overallStartTime).toISOString()}`,
          `end time - ${new Date(endTime).toISOString()}`,
          `duration - ${humanDuration}`,
        ].join("\n")
      );

      if (!payloads.length) {
        if (additionRows.length === 0 && (deletionRows.length > 0 || dependentDeletionRows.length > 0)) {
          await this.updateEndorsementSummaryAfterEnrollment(upload.endorsementId!);
        }
        // Write to premium calculator excel - all enrolled employees
        try {
          await premiumCalculator(
              upload.entityId,
              upload.endorsementId,
              {
                    endorsementRepo: this.endorsementRepo,
                    policyRepo: this.policyRepo,
                    policyConfigRepo: this.policyConfigRepo,
                    employeePolicyMapRepo: this.employeePolicyMapRepo,
                    fileRepo: this.fileRepo,
                    employeeEnrollmentRepo: this.employeeEnrollmentRepo,
                    lookUpRepository: this.lookUpRepository,
                    dependentRepo: this.dependentRepo,
              },
              this.logger,
              this.traceIdService.traceId
            );
        }
        catch(err) {
          this.logError(
            "processEnrollmentUpload",
            `Failed to process premium calculator for upload ${upload.id}: ${err}`
          );
        }

        await this.uploadRepo.update(upload.id, {
          processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
        });
        this.logInfo(
          "processEnrollmentUpload",
          `Upload ${upload.id} had no valid records; marked as COMPLETED.`
        );
      }
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "scheduler-service EnrollmentUploadScheduler",
          method: "processEnrollmentUpload",
          messageData:
            err instanceof Error
              ? { message: err.message, stack: err.stack }
              : err,
        }),
      });
      await this.uploadRepo.update(upload.id, {
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      });
    }
  }

  /**
   * Processes enrollment uploads with optimized memory management for large datasets.
   * 
   * Memory Optimizations Implemented:
   * - Uses Redis for bucket storage instead of keeping all data in memory
   * - Processes data in phases with explicit cleanup between phases
   * - Adds frequent GC pauses (every 2-3 buckets, 15-20 records) to allow V8 garbage collection
   * - Clears bucket references after processing to free memory
   * - Reduces parallel processing limits (PHASE3_CONCURRENCY_LIMIT: 15)
   * - Explicitly clears Maps, Sets, and Arrays after use
   * - Streams Excel file processing to avoid loading entire file in memory
   * 
   * Processing Phases:
   * 1. File Processing & Bucket Creation
   * 2. Phase 1 - Validation (business rules, relationships)
   * 3. Phase 2 - Policy Choices & Data Transformation
   * 4. Phase 3 - Payload Creation & Submission
   * 5. Phase 4 - Enrollment Processing
   * 6. Deletion Processing
   * 7. Error File Generation
   */
  private async updatedProcessEnrollmentUpload(upload: DocumentProcessingFile, endorsement: Endorsement) {
    const processingStartTime = Date.now();
    this.logInfo(
      "updatedProcessEnrollmentUpload",
      `Processing enrollment upload with ID: ${upload.id} - Started at ${new Date(processingStartTime).toISOString()}`
    );
    try {
      // Constants for bucket management
      const MAX_BUCKET_SIZE = 50;
      const INCEPTION_KEY = `inception_${upload.documentId}`;

      const liveStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
      });
      if (!liveStatus) {
        throw new NotFoundException(
          `Status lookup not found for key ${POLICY_CONFIGURATION_STATUS_LIVE}`
        );
      }

      const config = await this.policyConfigRepo.findOne({
        where: {
          policyId: upload.entityId,
          policyConfiguartionStatusLid: liveStatus.id,
        },
      });
      if (!config) {
        throw new NotFoundException(
          `Approved policy configuration not found for policy ID ${upload.entityId}`
        );
      }

      // Get relationships configuration for dynamic relationship type determination
      const relationships: any[] =
        (config?.policyConfiguration as any)?.relationships
          ?.enabledPolicyRelations || [];

      const constraints = (config?.policyConfiguration as any)?.constraints;

      const effectiveEnablePolicyLocations =
        (config?.policyConfiguration as any)?.enablePolicyLocations === true;

      // Pre-fetch valid policy locations when the feature is enabled
      let validPolicyLocations: Set<string> | null = null;
      let locationAddressIdMap: Map<string, number> = new Map();
      let phoneCodeByCpclId: Map<number, string> = new Map();
      if (effectiveEnablePolicyLocations) {
        const result = await fetchValidPolicyLocations(
          this.policyConfigRepo.manager,
          upload.entityId,
        );
        validPolicyLocations = result.validCodes;
        locationAddressIdMap = result.addressIdMap;
        phoneCodeByCpclId = result.phoneCodeByCpclId;
        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "[PolicyLocation] Valid address codes fetched",
          policyId: upload.entityId,
          rawRows: result.rawRows.map((r) => r.location_code),
          normalizedSet: Array.from(validPolicyLocations),
        });
      }

      // Get policy start and end dates for effective date validation
      const policy = await this.policyRepo.findOne({
        where: { id: upload.entityId },
        select: ["policyFrom", "policyTo", "id", "companyId"],
      });

      if (!policy) {
        throw new NotFoundException(
          `Policy not found for policy ID ${upload.entityId}`
        );
      }
      const defaultCountryCallingCode = await fetchDefaultCountryCallingCode(
        this.policyConfigRepo.manager,
        upload.entityId,
        this.redis,
      );
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "[PhoneCountryCode] Default calling code resolved",
        policyId: upload.entityId,
        defaultCountryCallingCode,
        locationSpecificCodes: Array.from(phoneCodeByCpclId.entries()),
      });

      const policyCompanyId = policy.companyId;

      const file = await this.fileRepo.findOne({
        where: { id: upload.documentId },
      });
      if (!file) {
        throw new Error("File not found");
      }

      // Get the mappings here
      const mappings = await this.fetchMappingTemplates(
        upload.entityId,
        UTILITY_UPLOAD_ENTITY.UPLOAD_INCEPTION,
      );

      const policyStartDate = policy.policyFrom
        ? new Date(policy.policyFrom)
        : null;
      const policyEndDate = policy.policyTo ? new Date(policy.policyTo) : null;

      // Bucket structures
      interface SelfBucket {
        bucketId: string;
        records: any[];
        size: number;
      }
      const isValidEmail = (email?: string) =>
        !!email && /^\S+@\S+\.\S+$/.test(email);

      const toDate = (val: any): Date | null => {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };

      const calculateAge = (dob: Date): number => {
        const diff = Date.now() - dob.getTime();
        return new Date(diff).getUTCFullYear() - 1970;
      };

      interface DependentFoundBucket {
        bucketId: string;
        records: Array<{
          dependent: any;
          dependentRowObj?: any;
          selfBucketId: string;
          selfIndex: number;
          employeeId: string;
        }>;
        size: number;
      }

      interface DependentNotFoundBucket {
        bucketId: string;
        records: Array<{
          dependent: any;
          dependentRowObj?: any;
          employeeId: string;
          dependentRows?: any[];
        }>;
        size: number;
      }

      // Redis storage instead of in-memory lists

      // Error bucket interface
      interface ErrorBucket {
        bucketId: string;
        records: any[];
        size: number;
      }

      interface DeletionSelfBucket {
        bucketId: string;
        records: any[];
        size: number;
      }

      interface DeletionDependentBucket {
        bucketId: string;
        records: any[];
        size: number;
      }

      // Phase 2 validation buckets
      interface ValidAdditionBucket {
        bucketId: string;
        records: any[];
        size: number;
      }

      // Bucket ID tracking arrays (keep these for iteration)
      const selfBucketIds: string[] = [];
      const dependentFoundBucketIds: string[] = [];
      const dependentNotFoundBucketIds: string[] = [];
      const deletionSelfBucketIds: string[] = [];
      const deletionDependentBucketIds: string[] = [];
      const errorBucketIds: string[] = [];
      const validAdditionBucketIds: string[] = [];

      // Current working buckets
      let currentSelfBucket: SelfBucket = {
        bucketId: `${INCEPTION_KEY}_self_1`,
        records: [],
        size: 0,
      };
      let currentDependentFoundBucket: DependentFoundBucket = {
        bucketId: `${INCEPTION_KEY}_dep_found_1`,
        records: [],
        size: 0,
      };
      let currentDependentNotFoundBucket: DependentNotFoundBucket = {
        bucketId: `${INCEPTION_KEY}_dep_not_found_1`,
        records: [],
        size: 0,
      };
      let currentDeletionSelfBucket: DeletionSelfBucket = {
        bucketId: `${INCEPTION_KEY}_deletion_self_1`,
        records: [],
        size: 0,
      };
      let currentDeletionDependentBucket: DeletionDependentBucket = {
        bucketId: `${INCEPTION_KEY}_deletion_dependent_1`,
        records: [],
        size: 0,
      };
      let currentErrorBucket: ErrorBucket = {
        bucketId: `${INCEPTION_KEY}_error_1`,
        records: [],
        size: 0,
      };
      let currentValidAdditionBucket: ValidAdditionBucket = {
        bucketId: `${INCEPTION_KEY}_valid_addition_1`,
        records: [],
        size: 0,
      };

      // Maps and counters
      const selfRecordMap = new Map<
        string,
        { bucketId: string; index: number }
      >();
      let selfBucketCounter = 1;
      let dependentFoundBucketCounter = 1;
      let dependentNotFoundBucketCounter = 1;
      let deletionSelfBucketCounter = 1;
      let deletionDependentBucketCounter = 1;
      let errorBucketCounter = 1;
      let validAdditionBucketCounter = 1;

      // Helper functions for bucket management
      const createNewSelfBucket = async (): Promise<SelfBucket> => {
        if (currentSelfBucket.size > 0) {
          // Store current bucket in Redis
          await this.redis.set(
            currentSelfBucket.bucketId,
            this.safeDateStringify(currentSelfBucket)
          );
          selfBucketIds.push(currentSelfBucket.bucketId);
        }
        selfBucketCounter++;
        return {
          bucketId: `${INCEPTION_KEY}_self_${selfBucketCounter}`,
          records: [],
          size: 0,
        };
      };

      const createNewDependentFoundBucket =
        async (): Promise<DependentFoundBucket> => {
          if (currentDependentFoundBucket.size > 0) {
            // Store current bucket in Redis
            await this.redis.set(
              currentDependentFoundBucket.bucketId,
              this.safeDateStringify(currentDependentFoundBucket)
            );
            dependentFoundBucketIds.push(currentDependentFoundBucket.bucketId);
          }
          dependentFoundBucketCounter++;
          return {
            bucketId: `${INCEPTION_KEY}_dep_found_${dependentFoundBucketCounter}`,
            records: [],
            size: 0,
          };
        };

      const createNewDependentNotFoundBucket =
        async (): Promise<DependentNotFoundBucket> => {
          if (currentDependentNotFoundBucket.size > 0) {
            // Store current bucket in Redis
            await this.redis.set(
              currentDependentNotFoundBucket.bucketId,
              this.safeDateStringify(currentDependentNotFoundBucket)
            );
            dependentNotFoundBucketIds.push(
              currentDependentNotFoundBucket.bucketId
            );
          }
          dependentNotFoundBucketCounter++;
          return {
            bucketId: `${INCEPTION_KEY}_dep_not_found_${dependentNotFoundBucketCounter}`,
            records: [],
            size: 0,
          };
        };

      const createNewDeletionSelfBucket =
        async (): Promise<DeletionSelfBucket> => {
          if (currentDeletionSelfBucket.size > 0) {
            await this.redis.set(
              currentDeletionSelfBucket.bucketId,
              this.safeDateStringify(currentDeletionSelfBucket)
            );
            deletionSelfBucketIds.push(currentDeletionSelfBucket.bucketId);
          }
          deletionSelfBucketCounter++;
          return {
            bucketId: `${INCEPTION_KEY}_deletion_self_${deletionSelfBucketCounter}`,
            records: [],
            size: 0,
          };
        };

      const createNewDeletionDependentBucket =
        async (): Promise<DeletionDependentBucket> => {
          if (currentDeletionDependentBucket.size > 0) {
            await this.redis.set(
              currentDeletionDependentBucket.bucketId,
              this.safeDateStringify(currentDeletionDependentBucket)
            );
            deletionDependentBucketIds.push(
              currentDeletionDependentBucket.bucketId
            );
          }
          deletionDependentBucketCounter++;
          return {
            bucketId: `${INCEPTION_KEY}_deletion_dependent_${deletionDependentBucketCounter}`,
            records: [],
            size: 0,
          };
        };

      const createNewErrorBucket = async (): Promise<ErrorBucket> => {
        if (currentErrorBucket.size > 0) {
          // Store current bucket in Redis
          await this.redis.set(
            currentErrorBucket.bucketId,
            this.safeDateStringify(currentErrorBucket)
          );
          errorBucketIds.push(currentErrorBucket.bucketId);
        }
        errorBucketCounter++;
        return {
          bucketId: `${INCEPTION_KEY}_error_${errorBucketCounter}`,
          records: [],
          size: 0,
        };
      };

      const pushToCurrentErrorBucket = async (record: any) => {
        // Wrap flat rowObj so the Phase 5 collection (which checks record.rowObj) can find it.
        const wrapped = record?.rowObj !== undefined ? record : { rowObj: record, isFetchedFromDatabase: false };
        currentErrorBucket.records.push(wrapped);
        currentErrorBucket.size++;
        if (currentErrorBucket.size >= MAX_BUCKET_SIZE) {
          currentErrorBucket = await createNewErrorBucket();
        }
      };

      const createNewValidAdditionBucket =
        async (): Promise<ValidAdditionBucket> => {
          if (currentValidAdditionBucket.size > 0) {
            // Store current bucket in Redis
            await this.redis.set(
              currentValidAdditionBucket.bucketId,
              this.safeDateStringify(currentValidAdditionBucket)
            );
            validAdditionBucketIds.push(currentValidAdditionBucket.bucketId);
          }
          validAdditionBucketCounter++;
          return {
            bucketId: `${INCEPTION_KEY}_valid_addition_${validAdditionBucketCounter}`,
            records: [],
            size: 0,
          };
        };

      // Extract plain text from ExcelJS cell values, handling rich text, hyperlinks, and formula results
      const extractExcelCellText = (v: any): string => {
        if (v === undefined || v === null) return "";
        if (typeof v === "string") return v.trim();
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        if (v instanceof Date) return v.toISOString().split("T")[0];
        if (typeof v === "object") {
          // ExcelJS rich text: { richText: [{ text: "..." }, ...] }
          if (Array.isArray(v.richText)) {
            return v.richText.map((r: any) => String(r.text ?? "")).join("").trim();
          }
          // ExcelJS hyperlink: { text: "...", hyperlink: "..." }
          if (typeof v.text === "string") return v.text.trim();
          // ExcelJS formula result: { formula: "...", result: value }
          if (v.result !== undefined) {
            const resultText = extractExcelCellText(v.result);
            return resultText;
          }
          // Unrecognized object type — return empty string rather than "[object Object]"
          return "";
        }
        return String(v).trim();
      };

      // Stream and process the Excel file to avoid large in-memory buffers
      const bucket = ENV.S3_AWS_BUCKET || "default-bucket";
      const s3Client = new S3({
        region: ENV.S3_AWS_REGION,
        accessKeyId: ENV.S3_AWS_ACCESS_KEY_ID,
        secretAccessKey: ENV.S3_AWS_SECRET_ACCESS_KEY,
      });

      const objectStream = s3Client
        .getObject({
          Bucket: bucket,
          Key: file.fileKey,
        })
        .createReadStream();

      const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
        objectStream,
        {
          worksheets: "emit",
          sharedStrings: "cache",
          hyperlinks: "ignore",
          styles: "ignore",
          entries: "emit",
        }
      );

      // Normalize header function (same as processEnrollmentUpload)
      const normalizeHeader = (h: string) =>
        h.toLowerCase().replace(/[\s_]+/g, "");

      const staticMap: Record<string, keyof PolicyEnrollmentEmployee> = {
        employeeid: "companyEmployeeId",
        fullname: "employeeName",
        dateofbirth: "dateOfBirth",
        gender: "gender",
        email: "email",
        mobilenumber: "phoneNumber",
        relationshipgroup: "relationGroup",
        maritalStatus: 'maritalStatus',
        policylocation: "policyLocation",
      };
      const normalizedMap: Record<string, keyof PolicyEnrollmentEmployee> =
        Object.fromEntries(
          Object.entries(staticMap).map(([k, v]) => [normalizeHeader(k), v]),
        );

      // Build mapping lookup from database mappings
      const mappingByNormalizedSource = new Map<
        string,
        { source_column_name: string; target_column_name: string }
      >();
      for (const mapping of mappings) {
        const normalizedSource = normalizeHeader(mapping.source_column_name);
        mappingByNormalizedSource.set(normalizedSource, mapping);
      }

      const targetToPropertyMap: Record<string, string> = {
        employee_id: "companyEmployeeId",
        full_name: "employeeName",
        date_of_birth: "dateOfBirth",
        gender: "gender",
        email: "email",
        mobile_number: "phoneNumber",
        relationship_group: "relationGroup",
        marital_status: 'maritalStatus',
        policy_location: "policyLocation",
      }

      // Only these fields are considered static (matching staticMap)
      const staticTargetColumns = new Set([
        "employee_id",
        "full_name",
        "date_of_birth",
        "gender",
        "email",
        "mobile_number",
        "relationship_group",
        "marital_status",
        "policy_location",
      ]);

      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Database mappings loaded",
        mappingCount: mappings.length,
        mappedFields: Array.from(mappingByNormalizedSource.keys()),
        mappingDetails: Array.from(mappingByNormalizedSource.entries()).map(
          ([key, value]) => ({
            normalizedSource: key,
            originalSource: value.source_column_name,
            targetColumn: value.target_column_name,
          }),
        ),
      });

      let headerValues: string[] | null = null;
      let headerIndexToTarget: Map<
        number,
        { targetColumn: string; isStatic: boolean }
      > | null = null;

      for await (const worksheet of workbookReader) {
        // Skip the "Template Helper" sheet — only process the primary data sheet
        if (worksheet.name?.toLowerCase() === "template helper") {
          continue;
        }
        for await (const row of worksheet) {
          const rowValues = Array.isArray(row.values)
            ? (row.values as any[]).slice(1)
            : [];

          if (!headerValues) {
            headerValues = rowValues.map((h: any) => extractExcelCellText(h));

            // Build header index to target column mapping
            headerIndexToTarget = new Map();
            const headerDebugInfo: any[] = [];
            // Map {sourceColumn: mapping}
            headerValues.forEach((header, index) => {
              const normalizedHeader = normalizeHeader(header);
              const mapping = mappingByNormalizedSource.get(normalizedHeader);

              headerDebugInfo.push({
                index,
                original: header,
                normalized: normalizedHeader,
                matched: !!mapping,
                targetColumn: mapping?.target_column_name,
              });

              if (mapping) {
                const targetColumn = mapping.target_column_name;
                // Only treat as static if in staticTargetColumns
                const isStatic = staticTargetColumns.has(targetColumn);
                headerIndexToTarget!.set(index, { targetColumn, isStatic });
              }
            });

            this.logInfo("updatedProcessEnrollmentUpload", {
              message: "Header mapping built",
              totalHeaders: headerValues.length,
              mappedHeaders: headerIndexToTarget.size,
              headerDetails: headerDebugInfo,
            });
            
            continue;
          }

          // Extract plain text from each cell before further processing
          const extractedRowValues = rowValues.map((v: any) => extractExcelCellText(v));

          // Skip empty rows
          const isRowEmpty = extractedRowValues.every(
            (v: string) => v === ""
          );
          if (isRowEmpty) {
            continue;
          }

          const rowObj: Record<string, any> = {};
          const mappedData: Record<string, any> = {}; // Mapped values using target column names
          const additional: Record<string, any> = {};

          headerValues.forEach((header, index) => {
            const value = extractedRowValues[index] ?? "";
            const normalizedHeader = normalizeHeader(header);
            rowObj[header] = value;

            const mappingInfo = headerIndexToTarget?.get(index);
            if (mappingInfo) {
              // Mapped template: static/dynamic split
              if (value !== undefined && value !== null && value !== "") {
                if (mappingInfo.isStatic) {
                  mappedData[mappingInfo.targetColumn] = value;
                } else {
                  additional[mappingInfo.targetColumn] = value;
                }
              }
            } else {
              // Default template: only non-static fields go to additional
              const isStaticField = staticMap.hasOwnProperty(normalizedHeader);
              if (
                !isStaticField &&
                value !== undefined &&
                value !== null &&
                value !== ""
              ) {
                additional[header] = value;
              }
            }
          });

          // Access values using mapped data with fallback to original rowObj for backward compatibility.
          // Also do a case-insensitive key search in additional for robustness (e.g. "Relation" vs "relation").
          const findAdditional = (key: string) => {
            const norm = key.toLowerCase();
            const found = Object.entries(additional).find(([k]) => k.toLowerCase() === norm);
            return found?.[1];
          };
          const employeeId = mappedData.employee_id || rowObj["Employee ID"];
          const fullName = mappedData.full_name || rowObj["Full Name"];
          const relation = findAdditional("relation") || rowObj["Relation"];
          const isSelf = relation?.toLowerCase() === "self";
          const intakeType =
            (additional.intake_type || rowObj["Intake Type"])?.toLowerCase() ||
            "addition";

          const dateOfBirth = parseDateValue(
            mappedData.date_of_birth || rowObj["Date of Birth"],
          );
          const rawEffectiveDateInput =
            additional.effective_date || rowObj["Effective Date"];
          const { parsedDate: effectiveDate, hasFormatError } =
            this.parseSupportedEffectiveDate(rawEffectiveDateInput);

          if (hasFormatError) {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0001;
            await pushToCurrentErrorBucket(rowObj);
            continue;
          }

          // Convert dates to date-only strings to avoid timezone issues
          // Find the actual header names for date fields (handles both mapped and default templates)
          if (dateOfBirth) {
            // Find header that maps to date_of_birth
            const dobHeaderIndex = Array.from(
              headerIndexToTarget?.entries() || [],
            ).find(([_, info]) => info.targetColumn === "date_of_birth")?.[0];
            const dobHeaderName =
              dobHeaderIndex !== undefined
                ? headerValues[dobHeaderIndex]
                : "Date of Birth";
            rowObj[dobHeaderName] = this.toDateOnlyString(dateOfBirth);
          }
          // Keep effective date as uploaded in rowObj for error-file fidelity.

          if (isSelf) {
            // Process self record
            const email =
              mappedData.email || rowObj["email"] || rowObj["Email"];
            const emailVal = email?.trim()
              ? email.trim().toLowerCase()
              : this.generateEmail(
                  policyCompanyId,
                  employeeId,
                  fullName,
                  (dateOfBirth ?? new Date()).toString(),
                );

            const gender = mappedData.gender || rowObj["Gender"];
            const phoneNumber =
              mappedData.mobile_number || rowObj["Mobile Number"];
            const claimStatus =
              additional.claim_status || rowObj["Claim Status"];
              
            // Validate policy location for self rows when the feature is enabled
            let matchedLocationAddressId: number | null = null;
            if (validPolicyLocations !== null) {
              const policyLocationValue = normalizePolicyLocationCode(
                rowObj[POLICY_LOCATION_FIELD_NAME] ||
                  rowObj[POLICY_LOCATION_COLUMN_NAME],
              );
              if (!policyLocationValue) {
                rowObj["Remarks"] = POLICY_LOCATION_REQUIRED_ERROR;
                await pushToCurrentErrorBucket(rowObj);
                continue;
              }
              if (!validPolicyLocations.has(policyLocationValue)) {
                rowObj["Remarks"] = POLICY_LOCATION_MISMATCH_ERROR;
                await pushToCurrentErrorBucket(rowObj);
                continue;
              }
              matchedLocationAddressId = locationAddressIdMap.get(policyLocationValue) ?? null;
            }

            const { headers: policyHeaders, rowObj: updatedRowObj } = this.extractPolicyHeadersAndValues(mappings, headerValues, rowObj);
            const policyChoosenArray = this.extractPolicyChoices(policyHeaders, updatedRowObj);
            const selfRecord = {
              companyEmployee: {
                employeeCompanyId: String(policyCompanyId),
                companyEmployeeId: employeeId,
                employeeName: fullName,
                dateOfBirth: dateOfBirth,
                gender: gender,
                email: emailVal,
                phoneNumber: phoneNumber,
                additionalParams: additional,
                policyConfigLocationId: matchedLocationAddressId,
              },
              dependents: [],
              intakeType: intakeType,
              rowObj: rowObj,
              dependentRows: [],
              enrollmentStartDate: null,
              enrollmentEndDate: null,
              effectiveDate: effectiveDate,
              choices: policyChoosenArray,
              additionalParams: additional,
              claimStatus: claimStatus,
            };
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "SchedulerService",
                method: "updatedProcessEnrollmentUpload",
                payload: { },
                messageData: "Processed self record for employee ID: " + selfRecord,
              }),
            });
            if (intakeType === "deletion") {
              currentDeletionSelfBucket.records.push(selfRecord);
              currentDeletionSelfBucket.size++;

              if (currentDeletionSelfBucket.size >= MAX_BUCKET_SIZE) {
                currentDeletionSelfBucket = await createNewDeletionSelfBucket();
              }
            } else {
              // Add to current self bucket
              currentSelfBucket.records.push(selfRecord);
              currentSelfBucket.size++;

              // Update mapping
              selfRecordMap.set(employeeId, {
                bucketId: currentSelfBucket.bucketId,
                index: currentSelfBucket.size - 1,
              });

              // Check if bucket is full
              if (currentSelfBucket.size >= MAX_BUCKET_SIZE) {
                currentSelfBucket = await createNewSelfBucket();
              }
            }
          } else {
            // Process dependent record - determine relationship type dynamically
            const relationNorm = normalizeValue(relation);
            let relTypeRaw = "Self";
            let cfg: any = undefined;
            let option: any = undefined;

            // Find matching relationship configuration
            for (const r of relationships) {
              const match = (r.configuredOptions || []).find(
                (o: any) => normalizeValue(o.name) === relationNorm
              );
              if (match) {
                relTypeRaw = r.type;
                cfg = r;
                option = match;
                break;
              }
            }
            const relType = relTypeRaw.toLowerCase();

            const gender = mappedData.gender || rowObj["Gender"];
            const claimStatus =
              additional.claim_status || rowObj["Claim Status"];

            const dependentRecord = {
              policyId: upload.entityId,
              name: fullName,
              relation: relation?.toLowerCase(),
              relationshipType: relType,
              gender: gender,
              dateOfBirth: dateOfBirth,
              effectiveDate: effectiveDate,
              enrollmentAdditionBatchId: upload.documentId,
              claimStatus: claimStatus,
            };

            const dependentRowObj: Record<string, any> = {};

            // Create dependentRowObj dynamically using headerValues
            headerValues.forEach((header, index) => {
              const mappingInfo = headerIndexToTarget?.get(index);
              const targetColumn = mappingInfo?.targetColumn;
              const normalizedHeader = normalizeHeader(header);

              // Check target column name (for mapped headers) or normalized header (for default headers)
              if (
                targetColumn === "employee_id" ||
                normalizedHeader === "employeeid"
              ) {
                dependentRowObj[header] = employeeId; // Employee ID should match the parent
              } else if (
                targetColumn === "full_name" ||
                normalizedHeader === "fullname"
              ) {
                dependentRowObj[header] = fullName;
              } else if (
                targetColumn === "relation" ||
                normalizedHeader === "relation"
              ) {
                dependentRowObj[header] = relation;
              } else if (
                targetColumn === "base_policy" ||
                targetColumn === "base_policy_sum_insured" ||
                normalizedHeader === "basepolicy" ||
                normalizedHeader === "basepolicysuminsured"
              ) {
                dependentRowObj[header] = ""; // Dependents typically don't have base policy
              } else {
                // For other fields, use the current row value or empty string
                dependentRowObj[header] = rowObj[header] || "";
              }
            });

            if (intakeType === "deletion") {
              const email =
                mappedData.email || rowObj["email"] || rowObj["Email"];
              const phoneNumber =
                mappedData.mobile_number || rowObj["Mobile Number"];
              const gender = mappedData.gender || rowObj["Gender"];
              const claimStatus =
                additional.claim_status || rowObj["Claim Status"];

              const deletionDependentRecord = {
                name: fullName, // Store dependent's name here
                companyEmployee: {
                  employeeCompanyId: String(policyCompanyId),
                  companyEmployeeId: employeeId,
                  employeeName: fullName, // This will be matched against employee in DB
                  dateOfBirth: dateOfBirth,
                  gender: gender,
                  email: email?.trim()?.toLowerCase(),
                  phoneNumber: phoneNumber,
                  additionalParams: additional,
                },
                dependentRelation: relation?.toLowerCase(),
                intakeType: "deletion",
                rowObj: rowObj,
                additionalParams: additional,
                effectiveDate: effectiveDate,
                claimStatus: claimStatus,
              };

              currentDeletionDependentBucket.records.push(
                deletionDependentRecord
              );
              currentDeletionDependentBucket.size++;

              if (currentDeletionDependentBucket.size >= MAX_BUCKET_SIZE) {
                currentDeletionDependentBucket =
                  await createNewDeletionDependentBucket();
              }
              continue;
            }

            // Look for employee in self record map
            const selfMapping = selfRecordMap.get(employeeId);

            if (selfMapping) {
              if (selfMapping.bucketId === currentSelfBucket.bucketId) {
                // Employee is in current bucket - add dependent directly
                currentSelfBucket.records[selfMapping.index].dependents.push(
                  dependentRecord
                );
                currentSelfBucket.records[selfMapping.index].dependentRows.push(
                  dependentRowObj
                );
              } else {
                // Employee is in cached bucket - add to found bucket
                currentDependentFoundBucket.records.push({
                  dependent: dependentRecord,
                  dependentRowObj: dependentRowObj,
                  selfBucketId: selfMapping.bucketId,
                  selfIndex: selfMapping.index,
                  employeeId: employeeId,
                });
                currentDependentFoundBucket.size++;

                if (currentDependentFoundBucket.size >= MAX_BUCKET_SIZE) {
                  currentDependentFoundBucket =
                    await createNewDependentFoundBucket();
                }
              }
            } else {
              // Employee not found - add to not found bucket
              dependentRowObj['Remarks'] = !employeeId || employeeId === null || employeeId === undefined 
                ? endorsementFileUploadMessages.ER0004 
                : endorsementFileUploadMessages.ER0015;
              currentDependentNotFoundBucket.records.push({
                dependent: dependentRecord,
                dependentRowObj: dependentRowObj,
                employeeId: employeeId,
                dependentRows: [dependentRowObj],
              });
              currentDependentNotFoundBucket.size++;

              if (currentDependentNotFoundBucket.size >= MAX_BUCKET_SIZE) {
                currentDependentNotFoundBucket =
                  await createNewDependentNotFoundBucket();
              }
            }
          }
        }

        // Only the first worksheet is relevant for enrollment uploads
        break;
      }

      // Store remaining buckets in Redis
      if (currentSelfBucket.size > 0) {
        await this.redis.set(
          currentSelfBucket.bucketId,
          this.safeDateStringify(currentSelfBucket)
        );
        selfBucketIds.push(currentSelfBucket.bucketId);
      }
      if (currentDependentFoundBucket.size > 0) {
        await this.redis.set(
          currentDependentFoundBucket.bucketId,
          this.safeDateStringify(currentDependentFoundBucket)
        );
        dependentFoundBucketIds.push(currentDependentFoundBucket.bucketId);
      }
      if (currentDependentNotFoundBucket.size > 0) {
        await this.redis.set(
          currentDependentNotFoundBucket.bucketId,
          this.safeDateStringify(currentDependentNotFoundBucket)
        );
        dependentNotFoundBucketIds.push(
          currentDependentNotFoundBucket.bucketId
        );
      }
      if (currentErrorBucket.size > 0) {
        await this.redis.set(
          currentErrorBucket.bucketId,
          this.safeDateStringify(currentErrorBucket)
        );
        errorBucketIds.push(currentErrorBucket.bucketId);
      }
      if (currentDeletionSelfBucket.size > 0) {
        await this.redis.set(
          currentDeletionSelfBucket.bucketId,
          this.safeDateStringify(currentDeletionSelfBucket)
        );
        deletionSelfBucketIds.push(currentDeletionSelfBucket.bucketId);
      }
      if (currentDeletionDependentBucket.size > 0) {
        await this.redis.set(
          currentDeletionDependentBucket.bucketId,
          this.safeDateStringify(currentDeletionDependentBucket)
        );
        deletionDependentBucketIds.push(
          currentDeletionDependentBucket.bucketId
        );
      }

      // Process dependent not found buckets - search for matching self buckets
      // Use dedicated bucket ID array for iteration
      for (let bucketIndex = 0; bucketIndex < dependentNotFoundBucketIds.length; bucketIndex++) {
        const bucketId = dependentNotFoundBucketIds[bucketIndex];
        
        // Add small pause every 3 buckets for natural garbage collection
        if (bucketIndex > 0 && bucketIndex % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 25));
        }
        
        // Fetch bucket from Redis
        const bucketData = await this.redis.get(bucketId);
        if (!bucketData) continue;

        const notFoundBucket: DependentNotFoundBucket = JSON.parse(bucketData);
        const recordsToRemove: number[] = [];

        for (let i = 0; i < notFoundBucket.records.length; i++) {
          // Add small pause every 15 records for natural garbage collection
          if (i > 0 && i % 15 === 0) {
            await new Promise(resolve => setTimeout(resolve, 15));
          }
          
          const depRecord = notFoundBucket.records[i];
          const employeeId = depRecord.employeeId;

          // Use selfRecordMap to find the employee efficiently
          const selfMapping = selfRecordMap.get(employeeId);

          if (selfMapping) {
            // Fetch target self bucket from Redis using the mapping
            const selfBucketData = await this.redis.get(selfMapping.bucketId);

            if (selfBucketData) {
              const targetSelfBucket: SelfBucket = JSON.parse(selfBucketData);

              if (targetSelfBucket.records[selfMapping.index]) {
                // Attach dependent to the specific self record
                targetSelfBucket.records[selfMapping.index].dependents.push(
                  depRecord.dependent
                );
                recordsToRemove.push(i);

                // Update the self bucket in Redis
                await this.redis.set(
                  selfMapping.bucketId,
                  this.safeDateStringify(targetSelfBucket)
                );

                // If this is the current in-memory bucket, keep it in sync so
                // the post-loop flush doesn't overwrite Redis with a stale copy
                // that is missing this newly appended dependent.
                if (selfMapping.bucketId === currentSelfBucket.bucketId) {
                  currentSelfBucket = targetSelfBucket;
                }

                this.logInfo("updatedProcessEnrollmentUpload", {
                  message:
                    "Attached dependent from not found bucket to self record",
                  employeeId,
                  dependentName: depRecord.dependent.name,
                  selfBucketId: selfMapping.bucketId,
                  selfIndex: selfMapping.index,
                });
              }
            }
          } else {
            // Employee not found in selfRecordMap - check database
            try {
              const existingEmployeeWithDependents =
                await this.getEmployeeDetailsWithDependentsIfExists(
                  employeeId,
                  policy.companyId,
                  policy.id
                );

              if (existingEmployeeWithDependents?.employee) {
                // Create a new self record from database employee
                const selfRecord = {
                  companyEmployee: {
                    employeeCompanyId: String(policy.companyId),
                    companyEmployeeId:
                      existingEmployeeWithDependents.employee.companyEmployeeId,
                    employeeName:
                      existingEmployeeWithDependents.employee.employeeName,
                    dateOfBirth:
                      existingEmployeeWithDependents.employee.dateOfBirth,
                    gender: existingEmployeeWithDependents.employee.gender,
                    email:
                      existingEmployeeWithDependents.employee.email ||
                      this.generateEmail(
                        policy.companyId,
                        employeeId,
                        existingEmployeeWithDependents.employee.employeeName,
                        (existingEmployeeWithDependents.employee.dateOfBirth
                          ? new Date(
                              existingEmployeeWithDependents.employee.dateOfBirth
                            )
                          : new Date()
                        ).toString()
                      ),
                    phoneNumber:
                      existingEmployeeWithDependents.employee.phoneNumber,
                    additionalParams:
                      (existingEmployeeWithDependents.employee as any)
                        ?.additionalParams || {},
                  },
                  dependents: [
                    // Only include the newly uploaded dependent — existing DB dependents belong to
                    // their original endorsement and must NOT be re-submitted against this endorsement.
                    {
                      policyId: policy.id,
                      name: depRecord.dependent.name,
                      relation: depRecord.dependent.relation,
                      relationshipType: depRecord.dependent.relationshipType,
                      gender: depRecord.dependent.gender,
                      dateOfBirth: depRecord.dependent.dateOfBirth,
                      effectiveDate: depRecord.dependent.effectiveDate ?? null,
                      enrollmentAdditionBatchId: upload.documentId,
                      claimStatus: depRecord.dependent.claimStatus ?? null,
                    },
                  ],
                  intakeType: "addition",
                  isFetchedFromDatabase: true,
                  databaseDependentCount:
                    existingEmployeeWithDependents.dependents.length,
                  skipExistingEmployeeCheck: true,
                  additionalParams:
                    (existingEmployeeWithDependents.employee as any)
                      ?.additionalParams || {},
                  rowObj: depRecord.dependentRowObj ?? {},
                  dependentRows: depRecord.dependentRows ?? [],
                  enrollmentStartDate: null,
                  enrollmentEndDate: null,
                  effectiveDate: depRecord.dependent.effectiveDate ?? null,
                  choices: [],
                  claimStatus: depRecord.dependent.claimStatus ?? null,
                };

                // Add to current self bucket if there's space, otherwise create new bucket
                if (currentSelfBucket.size < MAX_BUCKET_SIZE) {
                  currentSelfBucket.records.push(selfRecord);
                  currentSelfBucket.size++;

                  // Update mapping for future lookups
                  selfRecordMap.set(employeeId, {
                    bucketId: currentSelfBucket.bucketId,
                    index: currentSelfBucket.size - 1,
                  });

                  // Update current bucket in Redis
                  await this.redis.set(
                    currentSelfBucket.bucketId,
                    JSON.stringify(currentSelfBucket)
                  );
                } else {
                  // Store current bucket in Redis first
                  await this.redis.set(
                    currentSelfBucket.bucketId,
                    JSON.stringify(currentSelfBucket)
                  );
                  selfBucketIds.push(currentSelfBucket.bucketId);

                  // Create new bucket for this employee
                  currentSelfBucket = await createNewSelfBucket();
                  currentSelfBucket.records.push(selfRecord);
                  currentSelfBucket.size++;

                  // Update mapping
                  selfRecordMap.set(employeeId, {
                    bucketId: currentSelfBucket.bucketId,
                    index: currentSelfBucket.size - 1,
                  });

                  // Store new bucket in Redis (it's not empty anymore)
                  await this.redis.set(
                    currentSelfBucket.bucketId,
                    JSON.stringify(currentSelfBucket)
                  );
                }

                recordsToRemove.push(i);
                this.logInfo("updatedProcessEnrollmentUpload", {
                  message:
                    "Created self record from database and attached dependent from not found bucket",
                  employeeId,
                  dependentName: depRecord.dependent.name,
                  selfBucketId: currentSelfBucket.bucketId,
                  isFetchedFromDatabase: true,
                  databaseDependentCount:
                    existingEmployeeWithDependents.dependents.length,
                });
              } else {
              // Push error to error bucket and log details, matching error file construction pattern
              if (depRecord && depRecord.dependentRows) {
                currentErrorBucket.records.push({...depRecord, isFetchedFromDatabase: false});
                currentErrorBucket.size++;
              } 
              this.logError("updatedProcessEnrollmentUpload", {
                message: "Employee not found in database while attaching dependent from not found bucket.",
                employeeId,
                dependent: depRecord.dependent,
                context: "dependentNotFoundBucket",
              });
              }
            } catch (error) {
              this.logError("updatedProcessEnrollmentUpload", {
                message: "Error fetching employee from database",
                employeeId,
                error: error instanceof Error ? error.message : error,
              });
            }
          }
        }

        // Remove processed records (reverse order to maintain indices) and update Redis
        if (recordsToRemove.length > 0) {
          // Sort in descending order to remove from end first (prevents index issues)
          recordsToRemove.sort((a, b) => b - a);

          recordsToRemove.forEach((index) => {
            if (index >= 0 && index < notFoundBucket.records.length) {
              notFoundBucket.records.splice(index, 1);
              notFoundBucket.size--;
            }
          });

          // Update the modified bucket back to Redis
          await this.redis.set(bucketId, this.safeDateStringify(notFoundBucket));

          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Updated dependent not found bucket after processing",
            bucketId,
            recordsProcessed: recordsToRemove.length,
            remainingRecords: notFoundBucket.records.length,
            remainingSize: notFoundBucket.size,
          });
        }
        
        // Clear bucket reference to allow garbage collection
        (notFoundBucket as any).records = null;
      }
      
      // Clear the dependent not found bucket IDs array after processing
      dependentNotFoundBucketIds.length = 0;

      // Flush currentSelfBucket to Redis and register in selfBucketIds if DB lookups added records to it.
      // This handles the case where the "store remaining buckets" step ran before the dep-not-found loop,
      // so any self records created from database during that loop would be missed otherwise.
      if (currentSelfBucket.size > 0 && !selfBucketIds.includes(currentSelfBucket.bucketId)) {
        await this.redis.set(
          currentSelfBucket.bucketId,
          this.safeDateStringify(currentSelfBucket)
        );
        selfBucketIds.push(currentSelfBucket.bucketId);
        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "Flushed DB-fetched self records into selfBucketIds after dependent-not-found processing",
          bucketId: currentSelfBucket.bucketId,
          recordCount: currentSelfBucket.size,
        });
      }

      // Process dependent found buckets - attach dependent records to respective self buckets
      // Use dedicated bucket ID array for iteration
      for (let bucketIndex = 0; bucketIndex < dependentFoundBucketIds.length; bucketIndex++) {
        const bucketId = dependentFoundBucketIds[bucketIndex];
        
        // Add small pause every 3 buckets for natural garbage collection
        if (bucketIndex > 0 && bucketIndex % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 25));
        }
        
        // Fetch bucket from Redis
        const bucketData = await this.redis.get(bucketId);
        if (!bucketData) {
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Dependent found bucket not found in Redis",
            bucketId,
          });
          continue;
        }

        const foundBucket: DependentFoundBucket = JSON.parse(bucketData);
        const recordsToRemove: number[] = [];

        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "Processing dependent found bucket",
          bucketId,
          recordCount: foundBucket.records.length,
        });

        for (let i = 0; i < foundBucket.records.length; i++) {
          // Add small pause every 15 records for natural garbage collection
          if (i > 0 && i % 15 === 0) {
            await new Promise(resolve => setTimeout(resolve, 15));
          }
          
          const depRecord = foundBucket.records[i];
          const targetSelfBucketId = depRecord.selfBucketId;
          const targetSelfIndex = depRecord.selfIndex;

          // Fetch the corresponding self bucket from Redis
          const selfBucketData = await this.redis.get(targetSelfBucketId);

          if (selfBucketData) {
            const targetSelfBucket: SelfBucket = JSON.parse(selfBucketData);

            if (targetSelfBucket.records[targetSelfIndex]) {
              // Attach dependent to the specific self record
              targetSelfBucket.records[targetSelfIndex].dependents.push(
                depRecord.dependent
              );
              if (depRecord.dependentRowObj) {
                targetSelfBucket.records[targetSelfIndex].dependentRows.push(
                  depRecord.dependentRowObj
                );
              }
              recordsToRemove.push(i);

              // Update the self bucket in Redis
              await this.redis.set(
                targetSelfBucketId,
                this.safeDateStringify(targetSelfBucket)
              );

              this.logInfo("updatedProcessEnrollmentUpload", {
                message: "Attached dependent from found bucket to self record",
                employeeId: depRecord.employeeId,
                dependentName: depRecord.dependent.name,
                selfBucketId: targetSelfBucketId,
                selfIndex: targetSelfIndex,
              });
            } else {
              this.logError("updatedProcessEnrollmentUpload", {
                message: "Target self record not found at expected index",
                employeeId: depRecord.employeeId,
                selfBucketId: targetSelfBucketId,
                selfIndex: targetSelfIndex,
              });
            }
          } else {
            this.logError("updatedProcessEnrollmentUpload", {
              message: "Target self bucket not found in Redis",
              employeeId: depRecord.employeeId,
              selfBucketId: targetSelfBucketId,
            });
          }
        }

        // Remove processed records and update Redis
        if (recordsToRemove.length > 0) {
          // Sort in descending order to remove from end first
          recordsToRemove.sort((a, b) => b - a);

          recordsToRemove.forEach((index) => {
            if (index >= 0 && index < foundBucket.records.length) {
              foundBucket.records.splice(index, 1);
              foundBucket.size--;
            }
          });

          // Update the modified bucket back to Redis
          await this.redis.set(bucketId, this.safeDateStringify(foundBucket));

          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Updated dependent found bucket after processing",
            bucketId,
            recordsProcessed: recordsToRemove.length,
            remainingRecords: foundBucket.records.length,
            remainingSize: foundBucket.size,
          });
        } else {
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "No records processed in dependent found bucket",
            bucketId,
            totalRecords: foundBucket.records.length,
          });
        }
        
        // Clear bucket reference to allow garbage collection
        (foundBucket as any).records = null;
      }
      
      // Clear the dependent found bucket IDs array after processing
      dependentFoundBucketIds.length = 0;

      // Final logging with Redis bucket counts
      const fileProcessingEndTime = Date.now();
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Enrollment data processing completed with Redis storage",
        selfBucketsCreated: selfBucketIds.length,
        dependentFoundBucketsCreated: dependentFoundBucketIds.length,
        dependentNotFoundBucketsCreated: dependentNotFoundBucketIds.length,
        errorBucketsCreated: errorBucketIds.length,
        bucketStorage: "Redis storage",
        fileProcessingDuration: this.formatDuration(
          fileProcessingEndTime - processingStartTime
        ),
        phase: "File Processing and Bucket Creation"
      });

      // Validation Phase 1 : Validate all self records and dependents based on configuration rules

      const seenEmails = new Set<string>();
      const seenEmployeeIds = new Set<string>();

      // Process all self buckets from Redis for validation
      for (let bucketIndex = 0; bucketIndex < selfBucketIds.length; bucketIndex++) {
        const bucketId = selfBucketIds[bucketIndex];
        
        // Add small pause every 3 buckets for natural garbage collection
        if (bucketIndex > 0 && bucketIndex % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        // Fetch bucket from Redis
        const bucketData = await this.redis.get(bucketId);
        if (!bucketData) {
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Self bucket not found in Redis during validation",
            bucketId,
          });
          continue;
        }

        const selfBucket: SelfBucket = JSON.parse(bucketData);
        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "Processing self bucket for validation",
          bucketId,
          recordCount: selfBucket.records?.length || 0,
        });

        const recordsToRemove: number[] = [];
        for (let i = 0; i < (selfBucket.records || []).length; i++) {
          // Add small pause every 20 records for natural garbage collection
          if (i > 0 && i % 20 === 0) {
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          
          const record = selfBucket.records[i];
          const emp = record.companyEmployee;
          const errorMessages: string[] = [];

          // =====================
          // EMPLOYEE VALIDATIONS
          // =====================

          const isMockId =
            emp.companyEmployeeId &&
            String(emp.companyEmployeeId).toLowerCase().includes("fake");

          if (isMockId) {
            errorMessages.push(endorsementFileUploadMessages.ER0033);
          }

          if (!emp.companyEmployeeId) {
            errorMessages.push(endorsementFileUploadMessages.ER0003);
          }

          if (!emp.employeeName) {
            errorMessages.push(endorsementFileUploadMessages.ER0034);
          }

          const empDob = toDate(emp.dateOfBirth);
          if (!empDob) {
            errorMessages.push(endorsementFileUploadMessages.ER0035);
          }

          if (!isValidEmail(emp.email)) {
            errorMessages.push(endorsementFileUploadMessages.ER0036);
          }

          // Validate employee effective date against policy dates
          if (record.effectiveDate && policyStartDate && policyEndDate) {
            const effectiveDate = new Date(record.effectiveDate);
            if (
              effectiveDate < policyStartDate ||
              effectiveDate > policyEndDate
            ) {
              errorMessages.push(
                endorsementFileUploadMessages.ER0037
              );
            }
          }

          // Check for duplicate employee IDs
          if (emp.companyEmployeeId) {
            if (seenEmployeeIds.has(String(emp.companyEmployeeId))) {
              errorMessages.push(endorsementFileUploadMessages.ER0038);
            } else {
              seenEmployeeIds.add(String(emp.companyEmployeeId));
            }
          }

          // Check for duplicate emails
          if (emp.email) {
            if (seenEmails.has(emp.email)) {
              errorMessages.push(endorsementFileUploadMessages.ER0039);
            } else {
              seenEmails.add(emp.email);
            }
          }

          // =====================
          // DEPENDENT VALIDATIONS
          // =====================

          const dependentCountMap: Record<string, number> = {};
          const childOverrideValidCache: Record<string, boolean> = {};
          const employeeGender = emp.gender?.toLowerCase();

          // Track selected relations info for cross parenting and same gender validation
          const selectedRelationsInfo: Array<{
            sanitized: string;
            type: string;
            gender?: string;
          }> = [];

          for (const dep of record.dependents || []) {
            // Basic field validations
            if (!dep.name) {
              errorMessages.push(endorsementFileUploadMessages.ER0040);
              continue;
            }

            if (!dep.relation) {
              errorMessages.push(endorsementFileUploadMessages.ER0041);
              continue;
            }

            if (!dep.gender) {
              errorMessages.push(endorsementFileUploadMessages.ER0042);
            }

            const depDob = toDate(dep.dateOfBirth);
            if (!depDob) {
              errorMessages.push(
                endorsementFileUploadMessages.ER0043
              );
              continue;
            }

            // Validate dependent effective date against policy dates
            if (dep.effectiveDate && policyStartDate && policyEndDate) {
              const depEffectiveDate = new Date(dep.effectiveDate);
              if (
                depEffectiveDate < policyStartDate ||
                depEffectiveDate > policyEndDate
              ) {
                errorMessages.push(
                  endorsementFileUploadMessages.ER0044
                );
              }
            }

            const relKey = dep.relation.toLowerCase().trim();
            const relTypeNorm = normalizeValue(
              dep.relationshipType || dep.relation || ""
            );
            const sanitizedRelation = relKey
              .replace(/[-_\s]+/g, "")
              .toLowerCase();
            const sanitizedType = (dep.relationshipType || "")
              .replace(/[-_\s]+/g, "")
              .toLowerCase();

            // Count relationships
            dependentCountMap[relKey] = (dependentCountMap[relKey] || 0) + 1;

            // =====================
            // RELATIONSHIP DETECTION AND TRACKING
            // =====================

            const isParentRelation =
              sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.PARENT) ||
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.FATHER) ||
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.MOTHER) ||
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.PARENTS);

            const isInLawRelation = sanitizedRelation.includes(
              PARENT_RELATIONSHIP_TYPES.IN_LAW
            );

            // Track relation info for validation
            let relationGender: string | undefined;
            if (
              sanitizedRelation === PARENT_RELATIONSHIP_TYPES.FATHER ||
              sanitizedRelation === PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW
            ) {
              relationGender = GENDER_VALUES.MALE;
            } else if (
              sanitizedRelation === PARENT_RELATIONSHIP_TYPES.MOTHER ||
              sanitizedRelation === PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW
            ) {
              relationGender = GENDER_VALUES.FEMALE;
            } else if (isParentRelation) {
              // For generic parent relations, use dependent's gender
              const depGender = dep.gender?.toLowerCase();
              if (depGender === GENDER_VALUES.MALE || depGender === "m") {
                relationGender = GENDER_VALUES.MALE;
              } else if (
                depGender === GENDER_VALUES.FEMALE ||
                depGender === "f"
              ) {
                relationGender = GENDER_VALUES.FEMALE;
              }
            }

            if (sanitizedRelation) {
              selectedRelationsInfo.push({
                sanitized: sanitizedRelation,
                type: isInLawRelation
                  ? PARENT_RELATIONSHIP_TYPES.IN_LAW
                  : isParentRelation
                  ? PARENT_RELATIONSHIP_TYPES.PARENT
                  : "OTHER",
                gender: relationGender,
              });
            }

            // =====================
            // GENDER-BASED PARENT/IN-LAW COVERAGE VALIDATIONS
            // =====================

            if (isParentRelation && !isInLawRelation) {
              // Male employees covering parents
              if (
                employeeGender === GENDER_VALUES.MALE ||
                employeeGender === "m"
              ) {
                if (
                  this.isTruthyConstraint(
                    constraints.maleEmployeesCoverParents
                  ) === false
                ) {
                  errorMessages.push(
                    endorsementFileUploadMessages.ER0045
                  );
                }
              }

              // Female employees covering parents
              if (
                employeeGender === GENDER_VALUES.FEMALE ||
                employeeGender === "f"
              ) {
                if (
                  this.isTruthyConstraint(
                    constraints.femaleEmployeesCoverParents
                  ) === false
                ) {
                  errorMessages.push(
                    endorsementFileUploadMessages.ER0046
                  );
                }
              }
            }

            if (isParentRelation && isInLawRelation) {
              // Male employees covering in-laws
              if (
                employeeGender === GENDER_VALUES.MALE ||
                employeeGender === "m"
              ) {
                if (
                  this.isTruthyConstraint(
                    constraints.maleEmployeesCoverInLaws
                  ) === false
                ) {
                  errorMessages.push(
                    endorsementFileUploadMessages.ER0047
                  );
                }
              }

              // Female employees covering in-laws
              if (
                employeeGender === GENDER_VALUES.FEMALE ||
                employeeGender === "f"
              ) {
                if (
                  this.isTruthyConstraint(
                    constraints.femaleEmployeesCoverInLaws
                  ) === false
                ) {
                  errorMessages.push(
                    endorsementFileUploadMessages.ER0048
                  );
                }
              }
            }

            // =====================
            // CHILD RELATIONSHIP DETECTION
            // =====================

            const isChildRelation =
              sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.CHILD) ||
              (!isInLawRelation &&
                sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.SON)) ||
              (!isInLawRelation &&
                sanitizedRelation.includes(
                  PARENT_RELATIONSHIP_TYPES.DAUGHTER
                )) ||
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.CHILD);

            // =====================
            // AGE GAP VALIDATIONS
            // =====================

            if (empDob) {
              const empAge = calculateAge(empDob);
              const depAge = calculateAge(depDob);

              // Parent age gap validation
              if (isParentRelation && !isInLawRelation) {
                const parentGapThreshold = Number(
                  constraints.ageGapBetweenParentAndEmployee ?? 0
                );

                if (parentGapThreshold > 0) {
                  const actualGap = depAge - empAge;
                  if (actualGap < parentGapThreshold) {
                    errorMessages.push(
                      endorsementFileUploadMessages.ER0049
                    );
                  }
                }
              }

              // Child age gap validation
              if (isChildRelation) {
                const childGapConstraint =
                  constraints.ageGapBetweenChildrenAndEmployee ??
                  constraints.ageGapBetweenParentAndEmployee ??
                  0;
                const childGapThreshold = Number(childGapConstraint);

                if (childGapThreshold > 0) {
                  const actualGap = empAge - depAge;
                  if (actualGap < childGapThreshold) {
                    errorMessages.push(
                      endorsementFileUploadMessages.ER0050
                    );
                  }
                }
              }
            }

            // =====================
            // RELATIONSHIP CONFIG VALIDATIONS (maxCount with extensions and twin override)
            // =====================

            const relationshipConfig = relationships.find((r: any) => {
              const options = r.configuredOptions || [];
              return options.some(
                (opt: any) => normalizeValue(opt.name) === relTypeNorm
              );
            });

            if (relationshipConfig) {
              const option = relationshipConfig.configuredOptions?.find(
                (opt: any) => normalizeValue(opt.name) === relTypeNorm
              );

              if (option) {
                const depAge = calculateAge(depDob);

                // Min age validation
                if (option.minAge) {
                  const minAge = Number(option.minAge);
                  if (!isNaN(minAge) && depAge < minAge) {
                    errorMessages.push(
                      endorsementFileUploadMessages.ER0051
                    );
                  }
                }

                // Max age validation with extensions
                if (option.maxAge) {
                  let effectiveMaxAge = Number(option.maxAge);

                  if (!isNaN(effectiveMaxAge)) {
                    // Apply studying son extension
                    const studyingSonExtension = Number(
                      constraints.studyingSonAgeExtension ?? 0
                    );
                    if (
                      studyingSonExtension > 0 &&
                      sanitizedRelation.includes(
                        PARENT_RELATIONSHIP_TYPES.SON
                      ) &&
                      !isInLawRelation
                    ) {
                      effectiveMaxAge += studyingSonExtension;
                    }

                    // Apply unmarried daughter extension
                    const unmarriedDaughterExtension = Number(
                      constraints.unmarriedDaughterAgeExtension ?? 0
                    );
                    if (
                      unmarriedDaughterExtension > 0 &&
                      sanitizedRelation.includes(
                        PARENT_RELATIONSHIP_TYPES.DAUGHTER
                      ) &&
                      !isInLawRelation
                    ) {
                      effectiveMaxAge += unmarriedDaughterExtension;
                    }

                    if (depAge > effectiveMaxAge) {
                      errorMessages.push(
                        endorsementFileUploadMessages.ER0052
                      );
                    }
                  }
                }

                // Max count validation with twin/triplet override
                if (relationshipConfig.maxCount) {
                  const maxCountValue = Number(relationshipConfig.maxCount);
                  const currentCount = dependentCountMap[relKey] || 0;

                  if (!isNaN(maxCountValue) && currentCount > maxCountValue) {
                    if (!(relTypeNorm in childOverrideValidCache)) {
                      const twinsSecondChildAllowed = this.isTruthyConstraint(constraints.twinsSecondChildAllowed);
                      const tripletsSecondChildAllowed = this.isTruthyConstraint(constraints.tripletsSecondChildAllowed);
                      const allowFirstChildAsTwin = this.isTruthyConstraint(constraints.allowFirstChildAsTwin);
                      const childrenOfType = (record.dependents || []).filter((d: any) => {
                        const dRelTypeNorm = normalizeValue(
                          String(d.relationshipType ?? d.relation ?? "")
                        );
                        return dRelTypeNorm === relTypeNorm;
                      });
                      childOverrideValidCache[relTypeNorm] = isChildRelation
                        ? this.isChildGroupValidForOverride(
                            childrenOfType,
                            maxCountValue,
                            twinsSecondChildAllowed,
                            tripletsSecondChildAllowed,
                            allowFirstChildAsTwin
                          )
                        : false;
                    }

                    if (!childOverrideValidCache[relTypeNorm]) {
                      errorMessages.push(endorsementFileUploadMessages.ER0053);
                    }
                  }
                }
              }
            }
          }

          // =====================
          // CROSS PARENTS AND SAME GENDER PARENTS VALIDATION
          // =====================

          // Check for all cross parent relationship types availability
          const hasAllCrossParentRelations = [
            PARENT_RELATIONSHIP_TYPES.FATHER,
            PARENT_RELATIONSHIP_TYPES.MOTHER,
            PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW,
            PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW,
          ].every((relation) => {
            // Check if this relation type exists in policy configuration
            return relationships.some((r: any) =>
              (r.configuredOptions || []).some((opt: any) =>
                normalizeValue(opt.name).includes(relation)
              )
            );
          });

          // Cross parents validation
          if (
            this.isTruthyConstraint(constraints.crossParentsAllowed) ===
              false &&
            hasAllCrossParentRelations
          ) {
            const selectedRelations = new Set(
              selectedRelationsInfo.map((info) => info.sanitized)
            );

            const hasFatherWithMotherInLaw =
              selectedRelations.has(PARENT_RELATIONSHIP_TYPES.FATHER) &&
              selectedRelations.has(PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW);
            const hasMotherWithFatherInLaw =
              selectedRelations.has(PARENT_RELATIONSHIP_TYPES.MOTHER) &&
              selectedRelations.has(PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW);

            if (hasFatherWithMotherInLaw || hasMotherWithFatherInLaw) {
              errorMessages.push(
                endorsementFileUploadMessages.ER0054
              );
            }
          }

          // Same gender parents validation
          if (
            this.isTruthyConstraint(constraints.sameGenderParentsAllowed) ===
              false &&
            hasAllCrossParentRelations
          ) {
            const parentGenders = new Set<string>();
            const inLawGenders = new Set<string>();

            selectedRelationsInfo.forEach((info) => {
              if (
                info.type === PARENT_RELATIONSHIP_TYPES.PARENT &&
                info.gender
              ) {
                parentGenders.add(info.gender);
              }
              if (
                info.type === PARENT_RELATIONSHIP_TYPES.IN_LAW &&
                info.gender
              ) {
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
              errorMessages.push(
                endorsementFileUploadMessages.ER0055
              );
            }
          }

          // =====================
          // FINALIZE RECORD
          // =====================

          if (errorMessages.length) {
            record.hasError = true;
            record.rowObj = {
              ...(record.rowObj || {}),
              Remarks: errorMessages.join("; "),
            };

            // Add to error bucket
            await pushToCurrentErrorBucket(record);

            // Mark record for removal from self bucket
            recordsToRemove.push(i);
          }
        }

        // Remove error records from self bucket (reverse order to maintain indices)
        if (recordsToRemove.length > 0) {
          recordsToRemove.sort((a, b) => b - a);
          recordsToRemove.forEach((index) => {
            if (index >= 0 && index < selfBucket.records.length) {
              selfBucket.records.splice(index, 1);
              selfBucket.size--;
            }
          });

          // Update the modified self bucket back to Redis
          await this.redis.set(bucketId, JSON.stringify(selfBucket));

          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Removed error records from self bucket",
            bucketId,
            recordsRemoved: recordsToRemove.length,
            remainingRecords: selfBucket.records.length,
            remainingSize: selfBucket.size,
          });
        }
        
        // Clear bucket reference to allow garbage collection
        (selfBucket as any).records = null;
      }
      
      // Clear validation tracking sets to free memory
      seenEmails.clear();
      seenEmployeeIds.clear();

      // Store final error bucket if it has records
      if (currentErrorBucket.size > 0) {
        await this.redis.set(
          currentErrorBucket.bucketId,
          JSON.stringify(currentErrorBucket)
        );
        errorBucketIds.push(currentErrorBucket.bucketId);
      }
      const phase1EndTime = Date.now();
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Phase 1 validation completed - Final error bucket stored in Redis",
        errorBucketsCreated: errorBucketIds.length,
        phase1ValidationDuration: this.formatDuration(
          phase1EndTime - fileProcessingEndTime
        ),
        phase: "Phase 1 - Validation"
      });

      // =====================
      // PHASE 2 VALIDATION: Policy Choices and Data Transformation
      // =====================

      this.logInfo("updatedProcessEnrollmentUpload", {
        message:
          "Starting Phase 2 validation for policy choices and data transformation",
        selfBucketsToProcess: selfBucketIds.length,
      });
    
      const phase2LogInterval = 500;
      let phase2Processed = 0;
      let phase2ValidCount = 0;
      let phase2ErrorCount = 0;
      let phase2IntervalStartMs = Date.now();

      // Process all self buckets that passed Phase 1 validations
      for (let bucketIndex = 0; bucketIndex < selfBucketIds.length; bucketIndex++) {
        const bucketId = selfBucketIds[bucketIndex];
        
        // Add small pause every 3 buckets for natural garbage collection
        if (bucketIndex > 0 && bucketIndex % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        // Fetch bucket from Redis
        const bucketData = await this.redis.get(bucketId);
        if (!bucketData) {
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Self bucket not found in Redis during Phase 2 validation",
            bucketId,
          });
          continue;
        }

        const selfBucket: SelfBucket = JSON.parse(bucketData);
        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "Processing self bucket for Phase 2 validation",
          bucketId,
          recordCount: selfBucket.records?.length || 0,
        });

        const recordsToRemove: number[] = [];
        for (let i = 0; i < (selfBucket.records || []).length; i++) {
          // Add small pause every 20 records for natural garbage collection
          if (i > 0 && i % 20 === 0) {
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          
          const record = selfBucket.records[i];
          try {
            const errorMessages: string[] = [];

            // =====================
            // POLICY CHOICES VALIDATION
            // =====================

            const employeeChoices = record.choices || [];
            const dependents = record.dependents || [];
            // Carry the dependents' additional (non-policy) upload columns into
            // choice validation so filterPolicyOptions can read them
            const dependentRowsForRecord = record.dependentRows || [];
            const dependentsForChoiceValidation = dependents.map(
              (dependent: any, dependentIndex: number) => ({
                ...dependent,
                additionalAttributes:
                  dependent?.additionalAttributes ??
                  this.extractDependentAdditionalAttributes(
                    dependentRowsForRecord[dependentIndex] ?? {}
                  ),
              })
            );

            // Transform employee details using existing methods for consistency
            const additionRowsForTransform = [
              {
                companyEmployee: record.companyEmployee,
                dependents: dependents,
                intakeType: record.intakeType,
                rowObj: record.rowObj,
                dependentRows: record.dependentRows || [],
                enrollmentStartDate: record.enrollmentStartDate,
                enrollmentEndDate: record.enrollmentEndDate,
                effectiveDate: record.effectiveDate,
                choices: employeeChoices,
                additionalParams: record.additionalParams,
              },
            ];
            
            // Build dynamic map from mappings (if any), using the same normalization logic
            const dynamicMap: Record<string, keyof PolicyEnrollmentEmployee> =
              {};


            for (const key in targetToPropertyMap) {
              if (!Object.prototype.hasOwnProperty.call(targetToPropertyMap, key)) continue;
              const foundMapping = mappings.find((m: any) => normalizeHeader(m.target_column_name) === normalizeHeader(key));
              if (foundMapping) {
                dynamicMap[normalizeHeader(foundMapping.source_column_name)] =
                  targetToPropertyMap[key] as keyof PolicyEnrollmentEmployee;
              }
            }

            // Merge dynamicMap into normalizedMap, dynamicMap takes precedence
            const mergedMap: Record<string, keyof PolicyEnrollmentEmployee> = {
              ...normalizedMap,
              ...dynamicMap,
            };
            const employeeDetailsArray =
              this.transformToPolicyEnrollmentEmployees(
                additionRowsForTransform,
                mergedMap,
              );
            const transformedEmployeeDetailsArray = employeeDetailsArray.map(
              (employee) => this.mapCompanyEmployeeDetails(employee),
            );

            const employeeDetails = transformedEmployeeDetailsArray[0];
            
            // Include effective date in employee details for age calculation
            const employeeDetailsWithEffectiveDate = {
              ...employeeDetails,
              effectiveDate: record.effectiveDate || null
            };
            
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "SchedulerService",
                method: "updatedProcessEnrollmentUpload",
                payload: { },
                messageData: "At choice validation, transformed employee details: " + employeeDetails,
              }),
            });
            // Validate policy choices if any are provided
            if (employeeChoices.length > 0) {
              try {
                const choiceValidation = await this.processEnrollmentChoices(
                  dependentsForChoiceValidation,
                  employeeChoices,
                  employeeDetailsWithEffectiveDate,
                  config.policyConfiguration
                );
                this.logger.log({
                  level: "info",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "SchedulerService",
                    method: "updatedProcessEnrollmentUpload",
                    payload: { },
                    messageData: "Choice validation result: " + JSON.stringify(choiceValidation),
                  }),
                });
                // Check for invalid choices
                if (choiceValidation.invalidComponents?.length > 0) {
                  const invalidChoicesDetails =
                    choiceValidation.invalidComponents
                      .map(
                        (choice) =>
                          `${choice.policyLabel} (${choice.sumInsuredValue})`
                      )
                      .join(", ");
                  errorMessages.push(
                    `Invalid policy choices are mapped for employee: ${employeeDetails.employeeName}. Please review the choices and ensure they match the available policies.`
                  );
                }

                // Update record with validated choices
                if (choiceValidation.matchedComponents?.length > 0) {
                  record.validatedChoices = choiceValidation.matchedComponents;
                }
              } catch (choiceError) {
                errorMessages.push(
                  `Policy choice validation failed: ${
                    choiceError instanceof Error
                      ? choiceError.message
                      : "Unknown error"
                  }`
                );
              }
            }

            // =====================
            // DATA TRANSFORMATION
            // =====================

            // Transform employee data for API submission
            const transformedEmployee = {
              ...record.companyEmployee,
              userId: null, // Will be set during user creation
              companyId: policy.companyId,
              effectiveDate: record.effectiveDate,
              enrollmentStartDate: record.enrollmentStartDate,
              enrollmentEndDate: record.enrollmentEndDate,
              claimStatus: record.claimStatus,
            };

            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "SchedulerService",
                method: "updatedProcessEnrollmentUpload",
                payload: { },
                messageData: "Transformed employee data:" + JSON.stringify(transformedEmployee),
              }),
            });
            
            // Transform dependent data
            const transformedDependents = dependents.map((dep: any) => ({
              ...dep,
              employeeCompanyId: record.companyEmployee?.companyEmployeeId,
              transformedAt: new Date().toISOString(),
            }));

            // Update record with transformations
            record.transformedEmployee = transformedEmployee;
            record.transformedDependents = transformedDependents;
            record.phase2ValidationTimestamp = new Date().toISOString();

            // =====================
            // FINALIZE PHASE 2 RECORD
            // =====================

            if (errorMessages.length > 0) {
              record.hasError = true;
              record.phase2Errors = errorMessages;
              record.rowObj = {
                ...(record.rowObj || {}),
                Phase2Remarks: errorMessages.join("; "),
              };

              // Add to error bucket
              await pushToCurrentErrorBucket(record);

              recordsToRemove.push(i);

              phase2ErrorCount += 1;
            } else {
              // Record passed Phase 2 validation, add to valid addition bucket
              currentValidAdditionBucket.records.push(record);
              currentValidAdditionBucket.size++;

              // Check if addition bucket is full
              if (currentValidAdditionBucket.size >= MAX_BUCKET_SIZE) {
                currentValidAdditionBucket =
                  await createNewValidAdditionBucket();
              }

              recordsToRemove.push(i);
              phase2ValidCount += 1;
            }

            phase2Processed += 1;
            if (phase2Processed % phase2LogInterval === 0) {
              const phase2IntervalEndMs = Date.now();
              this.logInfo("updatedProcessEnrollmentUpload", {
                message: "Phase 2 progress checkpoint",
                processedCount: phase2Processed,
                validCount: phase2ValidCount,
                errorCount: phase2ErrorCount,
                intervalStartTime: new Date(phase2IntervalStartMs).toISOString(),
                intervalEndTime: new Date(phase2IntervalEndMs).toISOString(),
                intervalDurationMs: phase2IntervalEndMs - phase2IntervalStartMs,
              });
              phase2IntervalStartMs = phase2IntervalEndMs;
            }
          } catch (processingError) {
            // Handle unexpected errors during Phase 2 processing
            const errorMessage = `Phase 2 processing failed: ${
              processingError instanceof Error
                ? processingError.message
                : "Unknown error"
            }`;

            record.hasError = true;
            record.phase2Errors = [errorMessage];
            record.rowObj = {
              ...(record.rowObj || {}),
              Phase2Remarks: errorMessage,
            };

            // Add to error bucket
            await pushToCurrentErrorBucket(record);

            recordsToRemove.push(i);

            this.logError("updatedProcessEnrollmentUpload", {
              message: "Unexpected error during Phase 2 processing",
              employeeId: record.companyEmployee?.companyEmployeeId,
              error: errorMessage,
            });
          }
        }

        // Remove processed records from self bucket (reverse order to maintain indices)
        if (recordsToRemove.length > 0) {
          recordsToRemove.sort((a, b) => b - a);
          recordsToRemove.forEach((index) => {
            if (index >= 0 && index < selfBucket.records.length) {
              selfBucket.records.splice(index, 1);
              selfBucket.size--;
            }
          });

          // Update the modified self bucket back to Redis
          await this.redis.set(bucketId, JSON.stringify(selfBucket));

          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Completed Phase 2 processing for self bucket",
            bucketId,
            recordsProcessed: recordsToRemove.length,
            remainingRecords: selfBucket.records.length,
          });
        }
        
        // Clear bucket reference to allow garbage collection
        (selfBucket as any).records = null;
      }

      // Store final Phase 2 validation buckets
      if (currentValidAdditionBucket.size > 0) {
        await this.redis.set(
          currentValidAdditionBucket.bucketId,
          JSON.stringify(currentValidAdditionBucket)
        );
        validAdditionBucketIds.push(currentValidAdditionBucket.bucketId);
      }

      if (currentErrorBucket.size > 0) {
        await this.redis.set(
          currentErrorBucket.bucketId,
          JSON.stringify(currentErrorBucket)
        );
        errorBucketIds.push(currentErrorBucket.bucketId);
      }
      // Final Phase 2 logging
      const phase2EndTime = Date.now();
      
      // Clear selfBucketIds array after Phase 2 to free memory
      // (buckets are already persisted in Redis)
      selfBucketIds.length = 0;
      
      // Allow garbage collection between phases
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Phase 2 validation completed",
        validAdditionBucketsCreated: validAdditionBucketIds.length,
        totalErrorBucketsCreated: errorBucketIds.length,
        phase2ValidationDuration: this.formatDuration(
          phase2EndTime - phase1EndTime
        ),
        phase: "Phase 2 - Policy Choices and Data Transformation",
      });
      // =====================
      // PHASE 3: PAYLOAD CREATION AND SUBMISSION
      // =====================

      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Starting Phase 3 - Payload creation and submission",
        validAdditionBucketsToProcess: validAdditionBucketIds.length,
      });

      // Payload bucket interface and management
      interface PayloadBucket {
        bucketId: string;
        payloads: any[];
        size: number;
      }

      const payloadBucketIds: string[] = [];
      let payloadBucketCounter = 1;
      let currentPayloadBucket: PayloadBucket = {
        bucketId: `${INCEPTION_KEY}_payload_1`,
        payloads: [],
        size: 0,
      };

      const createNewPayloadBucket = async (): Promise<PayloadBucket> => {
        if (currentPayloadBucket.size > 0) {
          // Store current payload bucket in Redis
          await this.redis.set(
            currentPayloadBucket.bucketId,
            JSON.stringify(currentPayloadBucket)
          );
          payloadBucketIds.push(currentPayloadBucket.bucketId);
          await registerPayloadBucket(currentPayloadBucket.bucketId);
        }
        payloadBucketCounter++;
        return {
          bucketId: `${INCEPTION_KEY}_payload_${payloadBucketCounter}`,
          payloads: [],
          size: 0,
        };
      };

      // Collections for tracking processed records
      let totalRecordsProcessed = 0;
      let successEmployeeCount = 0;
      let successDependentCount = 0;
      let phase3ProcessedCount = 0;
      let phase3SuccessCount = 0;
      let phase3ErrorCount = 0;
      let phase3CheckpointStart = Date.now();
      const employeeComponentsMap: Record<number, any[]> = {};
      const employeeDependentsMap: Record<
        number,
        UpsertEnrollmentDependentDto[]
      > = {};
      const logPhase3CheckpointIfNeeded = (bucketId: string) => {
        if (phase3ProcessedCount > 0 && phase3ProcessedCount % 500 === 0) {
          const checkpointEnd = Date.now();
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Phase 3 progress checkpoint",
            processedCount: phase3ProcessedCount,
            successCount: phase3SuccessCount,
            errorCount: phase3ErrorCount,
            bucketId,
            intervalStartTime: new Date(phase3CheckpointStart).toISOString(),
            intervalEndTime: new Date(checkpointEnd).toISOString(),
            intervalDurationMs: checkpointEnd - phase3CheckpointStart,
          });
          phase3CheckpointStart = checkpointEnd;
        }
      };

      // Collect all employee IDs from valid addition buckets for database queries
      const allAdditionEmployeeIds = new Set<string>();

      for (const bucketId of validAdditionBucketIds) {
        const bucketData = await this.redis.get(bucketId);
        if (bucketData) {
          const validAdditionBucket: ValidAdditionBucket =
            JSON.parse(bucketData);
          for (const record of validAdditionBucket.records) {
            if (record.companyEmployee?.companyEmployeeId) {
              allAdditionEmployeeIds.add(
                String(record.companyEmployee.companyEmployeeId)
              );
            }
          }
        }
      }

      const addEmpIds = Array.from(allAdditionEmployeeIds);
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Collected employee IDs for database validation",
        totalUniqueEmployeeIds: addEmpIds.length,
      });

      // Query existing employees and policy mappings
      const existingEmployees = addEmpIds.length
        ? await this.companyEmployeeRepo
            .createQueryBuilder("emp")
            .where("emp.company_employee_id = ANY(:ids)", {
              ids: addEmpIds,
            })
            .andWhere("emp.company_id = :companyId", {
              companyId: policy.companyId,
            })
            .getMany()
        : [];

      let employeeById: Record<string, PolicyEnrollmentEmployee> = {};
      for (const emp of existingEmployees) {
        if (emp.companyEmployeeId) {
          employeeById[String(emp.companyEmployeeId)] = emp;
        }
        if (emp.phoneNumber) {
          employeeById[`ph_${emp.phoneNumber}`] = emp;
        }
        if (emp.email) {
          employeeById[`em_${emp.email}`] = emp;
        }
      }

      // IBP-detach: enrollment uploads never look employees up against the
      // `users` table, so there's no user prefetch here anymore — this map
      // stays empty (kept only so the `.clear()` call further down and any
      // lookups against it remain valid no-ops).
      const userByEmployeeCompanyId = new Map<string, User>();

      const existingMaps = existingEmployees.length
        ? await this.employeePolicyMapRepo
            .createQueryBuilder("m")
            .withDeleted()
            .innerJoin(
              PolicyEnrollmentEmployee,
              "emp",
              "emp.id = m.employee_id"
            )
            .where("m.policy_id = :pid", { pid: policy.id })
            .andWhere("emp.company_id = :companyId", {
              companyId: policy.companyId,
            })
            .andWhere("m.employee_id = ANY(:empIds)", {
              empIds: existingEmployees.map((e) => e.id),
            })
            .getMany()
        : [];

      const mappedEmployeeIds = new Set(existingMaps.map((m) => m.employeeId));

      // Get user details for enrollment submission
      const userDetails = await this.userRepo.findOne({
        where: { loginName: ENV.SCHEDULER_LOGIN_USERNAME },
      });

      if (!userDetails) {
        this.logError("updatedProcessEnrollmentUpload", {
          message: `No user found with user name: ${ENV.SCHEDULER_LOGIN_USERNAME}`,
        });
        return;
      }

      const statusMapKey = `${INCEPTION_KEY}_payload_status_map`;
      const payloadGenerationCompletedKey = `${statusMapKey}_generation_completed`;
      let enrollmentProcessorStarted = false;
      const overallStartKey = `${statusMapKey}_overall_start`;
      await this.redis.del(statusMapKey);
      await this.redis.set(payloadGenerationCompletedKey, "false");
      try {
        await this.redis.set(overallStartKey, new Date().toISOString(), "NX");
      } catch (error) {
        this.logError("updatedProcessEnrollmentUpload", {
          message: "Failed to set overall start time for enrollment processing",
          statusMapKey,
          error: error instanceof Error ? error.message : error,
        });
      }

      const registerPayloadBucket = async (bucketId: string) => {
        const timestamp = new Date().toISOString();
        await this.redis.hsetnx(
          statusMapKey,
          bucketId,
          JSON.stringify({
            payloadBucketId: bucketId,
            validationStatus: "completed",
            enrollmentStatus: "not-started",
            createdAt: timestamp,
            updatedAt: timestamp,
          })
        );

        if (!enrollmentProcessorStarted) {
          enrollmentProcessorStarted = true;
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Enrollment processor started asynchronously",
            statusMapKey,
            firstPayloadBucketId: bucketId,
          });
          void this.startEnrollmentProcessor(
            statusMapKey,
            [bucketId],
            userDetails.userId!,
            upload.id,
            upload.entityId,
            upload.endorsementId,
            payloadGenerationCompletedKey
          ).catch((error) => {
            this.logError("updatedProcessEnrollmentUpload", {
              message: "Enrollment processor failed to start asynchronously",
              statusMapKey,
              error: error instanceof Error ? error.message : error,
            });
          });
        }
      };

      const submissionStart = Date.now();
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: `Starting payload creation for valid addition records`,
        startTime: new Date(submissionStart).toISOString(),
        validAdditionBuckets: validAdditionBucketIds.length,
      });

      // Process each valid addition bucket
      for (let bucketIndex = 0; bucketIndex < validAdditionBucketIds.length; bucketIndex++) {
        const bucketId = validAdditionBucketIds[bucketIndex];
        
        // Add small pause every 2 buckets for natural garbage collection
        if (bucketIndex > 0 && bucketIndex % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 40));
        }
        
        const bucketData = await this.redis.get(bucketId);
        if (!bucketData) {
          this.logInfo("updatedProcessEnrollmentUpload", {
            message:
              "Valid addition bucket not found in Redis during payload creation",
            bucketId,
          });
          continue;
        }

        const validAdditionBucket: ValidAdditionBucket = JSON.parse(bucketData);
        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "Processing valid addition bucket for payload creation",
          bucketId,
          recordCount: validAdditionBucket.records?.length || 0,
        });

        const recordsToRemove: number[] = [];
        const records = validAdditionBucket.records || [];
        const PHASE3_CONCURRENCY_LIMIT = 15; // Reduced from 30 to minimize memory pressure
        totalRecordsProcessed += records.length;

        type Phase3Result =
          | {
              status: "success";
              record: any;
              recordIndex: number;
              employeeId: number | null;
              mappedDependents: UpsertEnrollmentDependentDto[];
              choices: any[];
            }
          | {
              status: "error";
              record: any;
              recordIndex: number;
              errorMessage: string;
            };

        const processRecord = async (
          record: any,
          recordIndex: number
        ): Promise<Phase3Result> => {
          try {
            const keyId =
              record.companyEmployee?.companyEmployeeId !== undefined
                ? String(record.companyEmployee.companyEmployeeId)
                : undefined;

            const existingEmp = keyId && employeeById[keyId];

            // Check for existing employee mapping (skip if already exists and not from database)
            if (
              existingEmp &&
              mappedEmployeeIds.has(existingEmp.id) &&
              !(record.skipExistingEmployeeCheck ?? false)
            ) {
              record.hasError = true;
              record.rowObj = {
                ...(record.rowObj || {}),
                Remarks:
                  endorsementFileUploadMessages.ER0031,
              };
              return {
                status: "error",
                record,
                recordIndex,
                errorMessage: endorsementFileUploadMessages.ER0031,
              };
            }

            // Sanitize email and phone
            const email = record.companyEmployee?.email
              ? String(record.companyEmployee.email).trim()
              : undefined;
            const phone = record.companyEmployee?.phoneNumber
              ? String(record.companyEmployee.phoneNumber).trim()
              : undefined;

            if (email) {
              record.companyEmployee.email = email;
            }
            if (phone) {
              record.companyEmployee.phoneNumber = phone;
            }

            // IBP-detach: enrollment uploads never look employees up against
            // the `users` table (no email/phone/companyEmployeeId matching,
            // no IIRM-employee promotion) — userId stays null throughout.
            const userId: number | null = null;

            let employeeId: number | null = null;
            let mappedDependents: UpsertEnrollmentDependentDto[] = [];

            // Database transaction for user and employee creation/update
            await this.userRepo.manager.transaction(async (manager) => {
              const transactionalUser: User | null = null;
              let ibpCredentials: { loginName: string; password: string } | null = null;

              // Create user if doesn't exist
              if (!transactionalUser) {
                const [firstName, ...rest] = (
                  record.companyEmployee?.employeeName ?? "Company-user"
                ).split(" ");
                const trimmedCompanyIdentifier = String(
                  policy.companyId
                ).trim();
                const trimmedEmployeeIdentifier =
                  record.companyEmployee?.companyEmployeeId !== undefined &&
                  record.companyEmployee?.companyEmployeeId !== null
                    ? String(record.companyEmployee.companyEmployeeId).trim()
                    : "";
                const fallbackEmployeeIdentifier =
                  trimmedEmployeeIdentifier ||
                  String(phone).trim() ||
                  "employee";
                const loginName = fallbackEmployeeIdentifier;
                const passwordSource =
                  this.toDateOnlyString(
                    record.companyEmployee?.dateOfBirth as Date
                  ) ?? fallbackEmployeeIdentifier;
                const password = String(passwordSource ?? "");

                // IBP-only employee: store credentials in pee, not users table
                ibpCredentials = { loginName, password };
                // transactionalUser and userId stay null
              }

              // Create or update employee record
              if (!existingEmp) {
                const employee = this.companyEmployeeRepo.create({
                  ...record.companyEmployee,
                  userId: userId ?? null,
                  companyId: policy.companyId,
                  createdBy: 0,
                  updatedBy: 0,
                });

                const savedEmployee = await manager.save(employee);
                employeeId = savedEmployee.id;
              } else {
                await manager.update(
                  PolicyEnrollmentEmployee,
                  { id: existingEmp.id },
                  {
                    ...record.companyEmployee,
                    ...(userId ? { userId } : {}),
                    updatedBy: 0,
                  }
                );
                employeeId = existingEmp.id;
              }

              // Write credentials to pee for new IBP-only employees (no users record)
              if (ibpCredentials && employeeId) {
                await manager.update(PolicyEnrollmentEmployee, { id: employeeId }, {
                  loginName: ibpCredentials.loginName,
                  password: ibpCredentials.password,
                  isPasswordSet: false,
                  authVersion: 1,
                  userStatusKey: USER_STATUS_ACTIVE,
                });
                const ibpRoleRepo = manager.getRepository(Role);
                const ibpUserRoleRepo = manager.getRepository(UserRole);
                let ibpRole = await ibpRoleRepo.findOne({ where: { roleKey: COMPANY_EMPLOYEE_ROLE_KEY } });
                if (!ibpRole) {
                  ibpRole = await ibpRoleRepo.save(ibpRoleRepo.create({ name: "Company Employee", description: "Company Employee", createdBy: "system", updatedBy: "system", roleKey: COMPANY_EMPLOYEE_ROLE_KEY }));
                }
                if (ibpRole?.id) {
                  const existingIbpRole = await ibpUserRoleRepo.findOne({ where: { ibpEmployeeId: employeeId, roleId: ibpRole.id } });
                  if (!existingIbpRole) {
                    await ibpUserRoleRepo.save(ibpUserRoleRepo.create({ ibpEmployeeId: employeeId, roleId: ibpRole.id }));
                  }
                }
              }

              // Create policy mapping if not exists
              if (!mappedEmployeeIds.has(employeeId!)) {
                const hasParentalLockUpdated = (constraints?.parentalLockInPeriod ?? 0) > 0;
                const parentalLockValueUpdated = hasParentalLockUpdated
                  ? String(record.rowObj?.["Parental Lock"] ?? "").toLowerCase() === "yes"
                  : null;
                const mapRecord = this.employeePolicyMapRepo.create({
                  policyId: policy.id,
                  employeeId: employeeId!,
                  enrollmentAdditionBatchId: upload.documentId,
                  endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                  effectiveDate: record.effectiveDate || new Date(),
                  enrollmentStartDate:
                    record.enrollmentStartDate ?? upload.enrollmentStartDate,
                  enrollmentEndDate:
                    record.enrollmentEndDate ?? upload.enrollmentEndDate,
                  createdBy: 0,
                  updatedBy: 0,
                  isParentalLockEnabled: parentalLockValueUpdated,
                });

                await manager.save(mapRecord);
              }

              // Handle dependents.
              if (record.dependents && record.dependents.length > 0) {
                // For DB-fetched records, record.dependents contains ONLY the newly uploaded
                // dependents (existing DB dependents were stripped during dep-not-found processing).
                mappedDependents = record.dependents.map((dep: any) =>
                  this.mapDependentEntity({
                    ...dep,
                    enrollmentAdditionBatchId: upload.documentId,
                  })
                );
              }
            });

            return {
              status: "success",
              record,
              recordIndex,
              employeeId,
              mappedDependents,
              choices: record.validatedChoices ?? [],
            };
          } catch (processingError) {
            const errorMessage = `Payload creation failed: ${
              processingError instanceof Error
                ? processingError.message
                : "Unknown error"
            }`;

            record.hasError = true;
            record.payloadCreationErrors = [errorMessage];
            record.rowObj = {
              ...(record.rowObj || {}),
              Phase3Remarks: errorMessage,
            };

            return {
              status: "error",
              record,
              recordIndex,
              errorMessage,
            };
          }
        };

        for (let start = 0; start < records.length; start += PHASE3_CONCURRENCY_LIMIT) {
          const batch = records.slice(start, start + PHASE3_CONCURRENCY_LIMIT);
          const batchStartTime = Date.now();
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Phase 3 batch processing started",
            bucketId,
            batchStartIndex: start,
            batchSize: batch.length,
          });
          const batchResults = await Promise.all(
            batch.map((record, offset) =>
              processRecord(record, start + offset)
            )
          );
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Phase 3 batch processing completed",
            bucketId,
            batchStartIndex: start,
            batchSize: batch.length,
            durationMs: this.formatDuration(Date.now() - batchStartTime),
          });

          for (const result of batchResults) {
            const { record, recordIndex } = result;
            recordsToRemove.push(recordIndex);

            if (result.status === "error") {
              // Add to error bucket
              await pushToCurrentErrorBucket(record);

              this.logError("updatedProcessEnrollmentUpload", {
                message: "Error during payload creation",
                employeeId: record.companyEmployee?.companyEmployeeId,
                error: result.errorMessage,
              });
              phase3ProcessedCount += 1;
              phase3ErrorCount += 1;
              logPhase3CheckpointIfNeeded(bucketId);
              continue;
            }

            const { employeeId } = result;
            if (employeeId && policy.companyId) {
              if (result.choices.length > 0) {
                employeeComponentsMap[employeeId] = result.choices;
              }
              if (result.mappedDependents.length > 0) {
                employeeDependentsMap[employeeId] = result.mappedDependents;
              }

              const payload: any = {
                employeeId: Number(employeeId),
                policyId: policy.id,
                choices: employeeComponentsMap[Number(employeeId)] ?? [],
                action: "submit",
                dependents: employeeDependentsMap[Number(employeeId)] ?? [],
                companyId: policy.companyId,
              };

              if (record.isFetchedFromDatabase) {
                // Employee already exists in DB — only add the new dependent(s) from this
                // upload without disturbing existing dependents
                payload.isDependentOnly = true;
              }

              // Add to current payload bucket
              currentPayloadBucket.payloads.push(payload);
              currentPayloadBucket.size++;

              // Check if payload bucket is full
              if (currentPayloadBucket.size >= MAX_BUCKET_SIZE) {
                currentPayloadBucket = await createNewPayloadBucket();
              }
            }

            // Update success counters
            if (record.isFetchedFromDatabase) {
              // For database-fetched records, only count new dependents as success
              const newDependentCount = Math.max(
                (record.dependents?.length ?? 0) -
                  (record.databaseDependentCount ?? 0),
                0
              );
              successDependentCount += newDependentCount;
            } else {
              // For new employee records
              successEmployeeCount++;
              successDependentCount += record.dependents?.length ?? 0;
            }
            phase3ProcessedCount += 1;
            phase3SuccessCount += 1;
            logPhase3CheckpointIfNeeded(bucketId);
          }
        }

        // Remove processed records from valid addition bucket
        if (recordsToRemove.length > 0) {
          recordsToRemove.sort((a, b) => b - a);
          recordsToRemove.forEach((index) => {
            if (index >= 0 && index < validAdditionBucket.records.length) {
              validAdditionBucket.records.splice(index, 1);
              validAdditionBucket.size--;
            }
          });

          // Update the modified bucket back to Redis
          await this.redis.set(bucketId, JSON.stringify(validAdditionBucket));

          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Completed payload creation for valid addition bucket",
            bucketId,
            recordsProcessed: recordsToRemove.length,
            remainingRecords: validAdditionBucket.records.length,
          });
        }
        
        // Clear bucket reference to allow garbage collection
        (validAdditionBucket as any).records = null;
      }
      
      // Clear large data structures after Phase 3 processing to free memory
      employeeById = {};
      userByEmployeeCompanyId.clear();
      selfRecordMap.clear();
      allAdditionEmployeeIds.clear();
      validAdditionBucketIds.length = 0;

      // Store final payload bucket if it has records
      if (currentPayloadBucket.size > 0) {
        await this.redis.set(
          currentPayloadBucket.bucketId,
          JSON.stringify(currentPayloadBucket)
        );
        payloadBucketIds.push(currentPayloadBucket.bucketId);
        await registerPayloadBucket(currentPayloadBucket.bucketId);
      }

      // Store final error bucket if it has records
      if (currentErrorBucket.size > 0) {
        await this.redis.set(
          currentErrorBucket.bucketId,
          JSON.stringify(currentErrorBucket)
        );
        errorBucketIds.push(currentErrorBucket.bucketId);
      }

      // Mark payload generation complete
      await this.redis.set(payloadGenerationCompletedKey, "true");

      // Phase 3 completion logging
      const submissionEnd = Date.now();
      const phase3EndTime = submissionEnd;
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Phase 3 payload creation completed",
        payloadBucketsCreated: payloadBucketIds.length,
        totalRecordsProcessed,
        successEmployeeCount,
        successDependentCount,
        totalErrorBucketsCreated: errorBucketIds.length,
        startTime: new Date(submissionStart).toISOString(),
        endTime: new Date(submissionEnd).toISOString(),
        phase3PayloadDuration: this.formatDuration(
          phase3EndTime - phase2EndTime
        ),
        duration: this.formatDuration(submissionEnd - submissionStart),
        phase: "Phase 3 - Payload Creation and Submission",
      });

      // =====================
      // PHASE 4: PAYLOAD STATUS TRACKING AND ENROLLMENT PROCESSING
      // =====================

      this.logInfo("updatedProcessEnrollmentUpload", {
        message:
          "Starting Phase 4 - Payload status tracking and enrollment processing",
        payloadBucketsToTrack: payloadBucketIds.length,
      });

      const statusMapEntries = await this.redis.hgetall(statusMapKey);
      const statusMap = Object.fromEntries(
        Object.entries(statusMapEntries).map(([key, value]) => [
          key,
          JSON.parse(value),
        ])
      );
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Payload status map initialized and stored in Redis",
        statusMapKey,
        totalEntries: Object.keys(statusMap).length,
        payloadBucketIds: payloadBucketIds,
      });

      // Start the enrollment processor timer
      const phase4SetupEndTime = Date.now();
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Phase 4 setup completed - Starting enrollment processor",
        phase4SetupDuration: this.formatDuration(
          phase4SetupEndTime - phase3EndTime
        ),
        phase: "Phase 4 - Payload Status Tracking Setup"
      });
      if (!enrollmentProcessorStarted) {
        if (payloadBucketIds.length === 0) {
          this.logInfo("updatedProcessEnrollmentUpload", {
            message:
              "Phase 4 skipped: no payload buckets generated for enrollment processing",
            statusMapKey,
            payloadBucketsCreated: payloadBucketIds.length,
            phase: "Phase 4 - Payload Status Tracking Setup",
          });
        } else {
          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Enrollment processor started asynchronously (Phase 4)",
            statusMapKey,
            payloadBucketsToTrack: payloadBucketIds.length,
            phase: "Phase 4 - Payload Status Tracking Setup",
          });
          void this.startEnrollmentProcessor(
            statusMapKey,
            payloadBucketIds,
            userDetails.userId!,
            upload.id,
            upload.entityId,
            upload.endorsementId,
            payloadGenerationCompletedKey
          ).catch((error) => {
            this.logError("updatedProcessEnrollmentUpload", {
              message: "Enrollment processor failed to start asynchronously (Phase 4)",
              statusMapKey,
              error: error instanceof Error ? error.message : error,
            });
          });
        }
      }

      // =====================
      // DELETION PROCESSING PHASE
      // =====================

      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Starting Deletion Processing Phase",
        deletionSelfBucketsToProcess: deletionSelfBucketIds.length,
        deletionDependentBucketsToProcess: deletionDependentBucketIds.length,
      });

      const deletionSuccessRows: any[] = [];
      const deletionProcessingStartTime = Date.now();
      const deletionErrors: any[] = [];
      let mapsToDelete: PolicyEnrollmentEmployeePolicyMap[] = [];
      const effectiveDateByEmployeeId = new Map<number, Date>();
      const claimStatusByEmployeeKey = new Map<string, string | null>();
      const claimStatusByEmployeeId = new Map<number, string | null>();
      const deletionEffectiveDateLookup = new Map<string, Date>();
      
      // Add periodic GC pause in deletion phase
      await new Promise(resolve => setTimeout(resolve, 50));

      const policyTermStart = policyStartDate
        ? this.normalizeToStartOfDay(policyStartDate)
        : null;
      const policyTermEnd = policyEndDate
        ? this.normalizeToStartOfDay(policyEndDate)
        : null;
      const policyTermStartLabel = policyTermStart
        ? formatDateForDisplay(policyTermStart)
        : "";
      const policyTermEndLabel = policyTermEnd
        ? formatDateForDisplay(policyTermEnd)
        : "";

      for (const bucketId of deletionDependentBucketIds) {
        const bucketData = await this.redis.get(bucketId);
        if (!bucketData) {
          this.logError("updatedProcessEnrollmentUpload", {
            message: "Failed to retrieve deletion dependent bucket from Redis",
            bucketId,
          });
          continue;
        }

        const deletionBucket: DeletionDependentBucket = JSON.parse(bucketData);
        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "Validating deletion dependent bucket",
          bucketId,
          recordCount: deletionBucket.records.length,
        });

        const recordsToRemove: number[] = [];

        for (let i = 0; i < deletionBucket.records.length; i++) {
          const record = deletionBucket.records[i];
          const resolvedEffectiveDate = resolveDeletionEffectiveDate(record);

          if (resolvedEffectiveDate) {
            record.effectiveDate = resolvedEffectiveDate;
          }

          if (
            resolvedEffectiveDate &&
            policyTermStart &&
            policyTermEnd &&
            !this.isDateWithinRange(
              resolvedEffectiveDate,
              policyTermStart,
              policyTermEnd
            )
          ) {
            record.hasError = true;
            record.rowObj[
              "Remarks"
            ] = endorsementFileUploadMessages.ER0014;
            deletionErrors.push(record.rowObj);
            recordsToRemove.push(i);
          }
        }

        if (recordsToRemove.length > 0) {
          recordsToRemove.sort((a, b) => b - a);
          recordsToRemove.forEach((index) => {
            if (index >= 0 && index < deletionBucket.records.length) {
              deletionBucket.records.splice(index, 1);
              deletionBucket.size--;
            }
          });

          await this.redis.set(bucketId, JSON.stringify(deletionBucket));
        }
      }

      const deletionSelfIds = new Set<string>();

      for (const bucketId of deletionSelfBucketIds) {
        const bucketData = await this.redis.get(bucketId);
        if (!bucketData) {
          this.logError("updatedProcessEnrollmentUpload", {
            message: "Failed to retrieve deletion self bucket from Redis",
            bucketId,
          });
          continue;
        }

        const deletionBucket: DeletionSelfBucket = JSON.parse(bucketData);
        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "Validating deletion self bucket",
          bucketId,
          recordCount: deletionBucket.records.length,
        });

        const recordsToRemove: number[] = [];

        for (let i = 0; i < deletionBucket.records.length; i++) {
          const record = deletionBucket.records[i];
          const resolvedEffectiveDate = resolveDeletionEffectiveDate(record);

          if (resolvedEffectiveDate) {
            record.effectiveDate = resolvedEffectiveDate;
          }

          if (
            resolvedEffectiveDate &&
            policyTermStart &&
            policyTermEnd &&
            !this.isDateWithinRange(
              resolvedEffectiveDate,
              policyTermStart,
              policyTermEnd
            )
          ) {
            record.hasError = true;
            record.rowObj[
              "Remarks"
            ] = endorsementFileUploadMessages.ER0014;
            deletionErrors.push(record.rowObj);
            recordsToRemove.push(i);
            continue;
          }

          const empId = record.companyEmployee?.companyEmployeeId;
          if (empId) {
            deletionSelfIds.add(String(empId));
          }

          const claimStatus = this.normalizeClaimStatusValue(
            record.claimStatus ??
              record.additionalParams?.["Claim Status"] ??
              record.additionalParams?.["claimStatus"]
          );
          if (claimStatus !== null && empId) {
            claimStatusByEmployeeKey.set(String(empId), claimStatus);
          }

          if (resolvedEffectiveDate) {
            const keys = [
              ...buildDeletionLookupKeys("id", empId),
              ...buildDeletionLookupKeys(
                "phone",
                record.companyEmployee?.phoneNumber
              ),
              ...buildDeletionLookupKeys(
                "email",
                record.companyEmployee?.email
              ),
            ];
            for (const key of keys) {
              if (!deletionEffectiveDateLookup.has(key)) {
                deletionEffectiveDateLookup.set(key, resolvedEffectiveDate);
              }
            }
          }
        }

        if (recordsToRemove.length > 0) {
          recordsToRemove.sort((a, b) => b - a);
          recordsToRemove.forEach((index) => {
            if (index >= 0 && index < deletionBucket.records.length) {
              deletionBucket.records.splice(index, 1);
              deletionBucket.size--;
            }
          });

          await this.redis.set(bucketId, JSON.stringify(deletionBucket));
        }
      }

      // Process dependent deletions first
      for (const bucketId of deletionDependentBucketIds) {
        const bucketData = await this.redis.get(bucketId);
        if (!bucketData) {
          this.logError("updatedProcessEnrollmentUpload", {
            message: "Failed to retrieve deletion dependent bucket from Redis",
            bucketId,
          });
          continue;
        }

        const deletionBucket: DeletionDependentBucket = JSON.parse(bucketData);
        if (!deletionBucket.records.length) {
          continue;
        }

        const depEmpIds = Array.from(
          new Set(
            deletionBucket.records
              .map((d) => d.companyEmployee?.companyEmployeeId)
              .filter(Boolean)
          )
        );

        const depEmployees = depEmpIds.length
          ? await this.companyEmployeeRepo
              .createQueryBuilder("emp")
              .where("emp.company_employee_id = ANY(:ids)", {
                ids: depEmpIds.map((id) => String(id)),
              })
              .andWhere("emp.company_id = :companyId", {
                companyId: policyCompanyId,
              })
              .getMany()
          : [];

        const depEmployeeByKey: Record<string, PolicyEnrollmentEmployee> = {};
        for (const emp of depEmployees) {
          if (emp.companyEmployeeId) {
            depEmployeeByKey[String(emp.companyEmployeeId)] = emp;
          }
        }

        for (const record of deletionBucket.records) {
          const key = record.companyEmployee?.companyEmployeeId
            ? String(record.companyEmployee.companyEmployeeId)
            : "";
          const emp = depEmployeeByKey[key];

          if (emp) {
            // Check for name in record.name first (from mapped data), then fallback to rowObj with dynamic header lookup
            let dependentName = record.name?.trim();
            if (!dependentName) {
              // Fallback: try to find "Full Name" or any header containing "fullname" (case-insensitive, no spaces)
              const fullNameKey = Object.keys(record.rowObj || {}).find(
                (k) =>
                  k.toLowerCase().replace(/[\s_]+/g, "") === "fullname" ||
                  k
                    .toLowerCase()
                    .replace(/[\s_]+/g, "")
                    .startsWith("fullname"),
              );
              dependentName = fullNameKey
                ? record.rowObj[fullNameKey]?.trim()
                : undefined;
            }
            if (!dependentName) {
              record.rowObj["Remarks"] =
                endorsementFileUploadMessages.ER0028;
              deletionErrors.push(record.rowObj);
              continue;
            }

            const relation =
              record.dependentRelation ??
              record.rowObj?.["Relation"]?.toLowerCase();

            if (!relation) {
              record.rowObj["Remarks"] = endorsementFileUploadMessages.ER0056;
              deletionErrors.push(record.rowObj);
              continue;
            }

            const nameWithoutSpaces = dependentName.replace(/\s+/g, "");
            const lowerDependentName = dependentName.toLowerCase();
            const lowerNameWithoutSpaces = nameWithoutSpaces.toLowerCase();

            const updateResult = await this.dependentRepo
              .createQueryBuilder()
              .update(PolicyEnrollmentDependent)
              .set({
                deletedAt: record.effectiveDate ?? new Date(),
                deletionEndorsementId: upload.endorsementId,
                enrollmentDeletionBatchId: upload.documentId,
                endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                claimStatus: this.normalizeClaimStatusValue(record.claimStatus),
              })
              .where("employee_id = :employeeId", { employeeId: emp.id })
              .andWhere("policy_id = :policyId", {
                policyId: upload.entityId,
              })
              .andWhere("LOWER(relation) = :relation", { relation })
              .andWhere(
                new Brackets((qb2) => {
                  qb2.where("name = :name", { name: dependentName });
                  if (nameWithoutSpaces) {
                    qb2.orWhere("REPLACE(REPLACE(name, chr(160), ''), ' ', '') = :nameNoSpaces", {
                      nameNoSpaces: nameWithoutSpaces,
                    });
                  }
                  qb2.orWhere("LOWER(name) = :lowerName", {
                    lowerName: lowerDependentName,
                  });
                  if (lowerNameWithoutSpaces) {
                    qb2.orWhere(
                      "LOWER(REPLACE(REPLACE(name, chr(160), ''), ' ', '')) = :lowerNameNoSpaces",
                      {
                        lowerNameNoSpaces: lowerNameWithoutSpaces,
                      }
                    );
                  }
                })
              )
              .returning("id")
              .execute();

            if ((updateResult.affected ?? 0) > 0) {
              record.rowObj["Remarks"] = "Deleted";
              deletionSuccessRows.push(record.rowObj);
            } else {
              record.rowObj["Remarks"] = endorsementFileUploadMessages.ER0029;
              deletionErrors.push(record.rowObj);
            }
          } else {
            record.rowObj["Remarks"] = endorsementFileUploadMessages.ER0030;
            deletionErrors.push(record.rowObj);
          }
        }
      }

      // Process employee deletions after dependents
      const delEmpIds: string[] = Array.from(deletionSelfIds);

      if (delEmpIds.length) {
        const employeesToDelete = await this.companyEmployeeRepo
          .createQueryBuilder("emp")
          .where("emp.company_employee_id = ANY(:ids)", {
            ids: delEmpIds.map((id) => String(id)),
          })
          .andWhere("emp.company_id = :companyId", {
            companyId: policyCompanyId,
          })
          .getMany();

        const employeesFoundByCompanyEmployeeId = new Set(
          employeesToDelete.map((emp) => emp.companyEmployeeId)
        );

        const mappedEmployeeIds = employeesToDelete.map((emp) => emp.id);

        mapsToDelete = mappedEmployeeIds.length
          ? await this.employeePolicyMapRepo
              .createQueryBuilder("map")
              .innerJoinAndSelect("map.employee", "emp")
              .where("map.policy_id = :pid", { pid: upload.entityId })
              .andWhere("map.employee_id = ANY(:employeeIds)", {
                employeeIds: mappedEmployeeIds,
              })
              .getMany()
          : [];

        const mappedCompanyEmployeeIds = new Set(
          mapsToDelete.map((map) => map.employee?.companyEmployeeId)
        );

        for (const bucketId of deletionSelfBucketIds) {
          const bucketData = await this.redis.get(bucketId);
          if (!bucketData) {
            this.logError("updatedProcessEnrollmentUpload", {
              message: "Failed to retrieve deletion self bucket from Redis",
              bucketId,
            });
            continue;
          }

          const deletionBucket: DeletionSelfBucket = JSON.parse(bucketData);
          let bucketUpdated = false;

          for (const record of deletionBucket.records) {
            const empId = record.companyEmployee?.companyEmployeeId;
            if (!empId) {
              record.rowObj["Remarks"] = endorsementFileUploadMessages.ER0057;
              record.hasError = true;
              deletionErrors.push(record.rowObj);
              bucketUpdated = true;
              continue;
            }

            if (!employeesFoundByCompanyEmployeeId.has(empId)) {
              record.rowObj[
                "Remarks"
              ] = endorsementFileUploadMessages.ER0058;
              record.hasError = true;
              deletionErrors.push(record.rowObj);
              bucketUpdated = true;
              continue;
            }

            if (!mappedCompanyEmployeeIds.has(empId)) {
              record.rowObj[
                "Remarks"
              ] = endorsementFileUploadMessages.ER0059;
              record.hasError = true;
              deletionErrors.push(record.rowObj);
              bucketUpdated = true;
            }
          }

          if (bucketUpdated) {
            await this.redis.set(bucketId, JSON.stringify(deletionBucket));
          }
        }
      }

      for (const map of mapsToDelete) {
        const keys = [
          ...buildDeletionLookupKeys("id", map.employee?.companyEmployeeId),
          ...buildDeletionLookupKeys("phone", map.employee?.phoneNumber),
          ...buildDeletionLookupKeys("email", map.employee?.email),
        ];

        for (const key of keys) {
          const match = deletionEffectiveDateLookup.get(key);
          if (match) {
            effectiveDateByEmployeeId.set(map.employeeId, match);
            this.logInfo("updatedProcessEnrollmentUpload", {
              stage: "deletionEffectiveDateMatched",
              employeeId: map.employeeId,
              mapId: map.id,
              matchedKey: key,
              matchedEffectiveDate: match.toISOString(),
            });
            break;
          }
        }

        if (map.employee?.companyEmployeeId) {
          const claimStatus = claimStatusByEmployeeKey.get(
            String(map.employee.companyEmployeeId)
          );
          if (claimStatus !== undefined) {
            claimStatusByEmployeeId.set(map.employeeId, claimStatus);
          }
        }

        if (!effectiveDateByEmployeeId.has(map.employeeId)) {
          this.logInfo("updatedProcessEnrollmentUpload", {
            stage: "deletionEffectiveDateMissing",
            employeeId: map.employeeId,
            mapId: map.id,
            attemptedKeys: keys,
          });
        }
      }

      if (mapsToDelete.length) {
        const endorsementReadyMap = await this.getEndorsementReadyEmployeeIds(
          mapsToDelete.map((m) => m.employeeId),
          upload.entityId
        );

        if (endorsementReadyMap.size) {
          const skipped = mapsToDelete.filter((m) => endorsementReadyMap.has(m.employeeId));
          mapsToDelete = mapsToDelete.filter((m) => !endorsementReadyMap.has(m.employeeId));

          const skippedCompanyEmpIds = new Set(
            skipped.map((m) => m.employee?.companyEmployeeId).filter(Boolean)
          );
          const endorsementIdByCompanyEmpId = new Map<string, number | undefined>();
          for (const m of skipped) {
            const companyEmpId = m.employee?.companyEmployeeId;
            if (companyEmpId) {
              endorsementIdByCompanyEmpId.set(companyEmpId, endorsementReadyMap.get(m.employeeId));
            }
          }

          for (const bucketId of deletionSelfBucketIds) {
            const bucketData = await this.redis.get(bucketId);
            if (!bucketData) continue;
            const deletionBucket: DeletionSelfBucket = JSON.parse(bucketData);
            let bucketUpdated = false;
            for (const record of deletionBucket.records) {
              const empId = record.companyEmployee?.companyEmployeeId;
              if (empId && !record.hasError && skippedCompanyEmpIds.has(empId)) {
                const endorsementRecordId = endorsementIdByCompanyEmpId.get(empId);
                record.rowObj["Remarks"] = `Unable to delete employee with ID ${empId} as he is endorsement ready in EndorsementID ${endorsementRecordId}`;
                record.hasError = true;
                deletionErrors.push(record.rowObj);
                bucketUpdated = true;
              }
            }
            if (bucketUpdated) {
              await this.redis.set(bucketId, JSON.stringify(deletionBucket));
            }
          }
        }
      }

      if (mapsToDelete.length) {
        await this.handleMapDeletions(
          mapsToDelete,
          upload,
          effectiveDateByEmployeeId,
          claimStatusByEmployeeId
        );

        const successfulDeletionIds = new Set(
          mapsToDelete.map((map) => map.employee?.companyEmployeeId)
        );

        for (const bucketId of deletionSelfBucketIds) {
          const bucketData = await this.redis.get(bucketId);
          if (!bucketData) {
            continue;
          }

          const deletionBucket: DeletionSelfBucket = JSON.parse(bucketData);
          for (const record of deletionBucket.records) {
            const empId = record.companyEmployee?.companyEmployeeId;
            if (
              empId &&
              !record.hasError &&
              successfulDeletionIds.has(empId)
            ) {
              record.rowObj["Remarks"] = "Deleted";
              deletionSuccessRows.push(record.rowObj);
            }
          }
        }
      }

      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Deletion processing completed",
        employeeDeletionsProcessed: mapsToDelete.length,
        deletionSuccessCount: deletionSuccessRows.length,
        deletionErrorCount: deletionErrors.length,
      });

      if (payloadBucketIds.length === 0 && upload.endorsementId) {
        await this.updateEndorsementSummaryAfterEnrollment(upload.endorsementId);
      }

      // =====================
      // PHASE 5: SUMMARY AND REPORTING
      // =====================

      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Starting Phase 5 - Summary creation and error reporting",
        errorBucketsToProcess: errorBucketIds.length,
        payloadBucketsCreated: payloadBucketIds.length,
      });

      // Collect all error records from error buckets
      const allErrorRecords: any[] = [];
      let totalRowsProcessed = 0;

      // Process error buckets to collect all error records
      for (const bucketId of errorBucketIds) {
        const bucketData = await this.redis.get(bucketId);
        if (bucketData) {
          const errorBucket: ErrorBucket = JSON.parse(bucketData);
          for (const record of errorBucket.records) {
            // Add main record error
            if (record.rowObj && !record.isFetchedFromDatabase) {
              allErrorRecords.push(record.rowObj);
              totalRowsProcessed++;
            }

            // Add dependent errors if they exist
            if (record.dependentRows && Array.isArray(record.dependentRows)) {
              for (const depRow of record.dependentRows) {
                allErrorRecords.push(depRow);
                if (!record.isFetchedFromDatabase) {
                  totalRowsProcessed++;
                }
              }
            }
          }
        }
      }

      // Add deletion errors to allErrorRecords
      allErrorRecords.push(...deletionErrors);

      // Deduplicate error records before generating error file
      const dedupedErrorRecords = [];
      const seen = new Set();
      for (const rec of allErrorRecords) {
        // Create a unique key based on all field values (stringified)
        const key = JSON.stringify(rec);
        if (!seen.has(key)) {
          seen.add(key);
          dedupedErrorRecords.push(rec);
        }
      }

      // Calculate total records from original data (excluding header)
      // const originalDataRows = rowsData.slice(1);
      // const totalOriginalRows = originalDataRows.length;

      // Success count = success employees/dependents + successful deletions
      const successCount = Math.max(
        successEmployeeCount +
          successDependentCount +
          deletionSuccessRows.length,
        0
      );
      // Use dedupedErrorRecords for errorCount and processCount
      const errorCount = dedupedErrorRecords.length;
      const processCount = successCount + errorCount;


      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Processing summary calculated",
        totalOriginalRows: processCount,
        successCount,
        errorCount,
        processCount,
        payloadBucketsCreated: payloadBucketIds.length,
        errorBucketsProcessed: errorBucketIds.length,
      });
      
      // Clear deletion-related maps to free memory after deletion processing
      effectiveDateByEmployeeId.clear();
      claimStatusByEmployeeKey.clear();
      claimStatusByEmployeeId.clear();
      deletionEffectiveDateLookup.clear();
      mapsToDelete = [];
      deletionSuccessRows.length = 0;
      deletionErrors.length = 0;
      
      // Allow garbage collection before error file generation
      await new Promise(resolve => setTimeout(resolve, 50));

      // Generate error file if there are errors
      let errorFileId: number | null = null;
      if (dedupedErrorRecords.length > 0) {
        try {
          const sanitizedName = `policy-${policy.id}-errorfile-${upload.documentId}-${Date.now()}.xlsx`;
          const key = `uploads/enrollment/errorfiles/${sanitizedName}`;

          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Starting error file generation",
            errorRecordCount: dedupedErrorRecords.length,
          });

          // ---------- LARGE DATASET HANDLING ----------
          if (dedupedErrorRecords.length > 100000) {
            this.logInfo("updatedProcessEnrollmentUpload", {
              message:
                "Large dataset detected, generating Excel using streaming",
              errorRecordCount: dedupedErrorRecords.length,
            });

            const chunkSize = 50000;

            const excelOptions = {
              batchSize: 2000,
              maxMemoryUsage: 300 * 1024 * 1024, // 300MB
              timeout: 60 * 60 * 1000, // 1 hour
            };

            const uploadOptions = {
              timeout: 60 * 60 * 1000,
              partSize: 25 * 1024 * 1024, // 25MB
              queueSize: 8,
            };

            // Create a single Excel stream using chunked processing
            const excelStream = await generateExcelStream(
              processChunksAsStream(dedupedErrorRecords, chunkSize),
              excelOptions
            );

            await uploadToS3(
              excelStream,
              key,
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              uploadOptions
            );
          }
          // ---------- SMALL / MEDIUM DATASET ----------
          else {
            const streamOptions = {
              chunkSize: dedupedErrorRecords.length > 10000 ? 500 : 100,
            };

            const excelOptions = {
              batchSize: dedupedErrorRecords.length > 50000 ? 2000 : 1000,
              maxMemoryUsage: 200 * 1024 * 1024, // 200MB
              timeout:
                dedupedErrorRecords.length > 100000
                  ? 60 * 60 * 1000
                  : 30 * 60 * 1000,
            };

            const uploadOptions = {
              timeout:
                dedupedErrorRecords.length > 100000
                  ? 60 * 60 * 1000
                  : 30 * 60 * 1000,
              partSize: 20 * 1024 * 1024,
              queueSize: 6,
            };

            const excelStream = await generateExcelStream(
              errorStream(dedupedErrorRecords, streamOptions),
              excelOptions
            );

            await uploadToS3(
              excelStream,
              key,
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              uploadOptions
            );
          }

          // ---------- SAVE FILE METADATA ----------
          const savedErrorFile = await this.fileRepo.save(
            this.fileRepo.create({
              fileKey: key,
              entityType: "POLICY",
              entityId: policy.companyId,
              uploadType: "AWS",
              documentTypeLid: 1,
              createdBy: userDetails.userId!,
              updatedBy: userDetails.userId!,
            })
          );

          errorFileId = savedErrorFile.id;

          this.logInfo("updatedProcessEnrollmentUpload", {
            message: "Error file generated successfully",
            errorFileId,
            errorRecordCount: dedupedErrorRecords.length,
            fileName: sanitizedName,
          });
        } catch (uploadErr) {
          this.logError("updatedProcessEnrollmentUpload", {
            message: "Failed to generate/upload error file",
            error: uploadErr instanceof Error ? uploadErr.message : uploadErr,
            errorRecordCount: dedupedErrorRecords.length,
          });

          if (
            uploadErr instanceof Error &&
            uploadErr.message?.includes("timeout")
          ) {
            this.logError("updatedProcessEnrollmentUpload", {
              message:
                "Timeout occurred. Consider reducing batch size or increasing timeout.",
            });
          }

          throw uploadErr;
        }
      }
      // Create and save summary record
      try {
        const summary = await this.summaryRepo.save(
          this.summaryRepo.create({
            documentProcessingFileId: upload.id,
            policyId: policy.id,
            sourceFileUploadId: file.id, // Using documentUploadId as source file ID
            errorFileUploadId: errorFileId,
            successFileUploadId: null, // Not generating success file for now
            successCount,
            errorCount,
            processCount: successCount + errorCount,
            batchId: upload.id,
            endorsementId: upload.endorsementId, // Using documentUploadId as endorsement ID
          })
        );

        this.logInfo("updatedProcessEnrollmentUpload", {
          message: "Summary record created successfully",
          summaryId: summary.id,
          successCount,
          errorCount,
          processCount,
          errorFileId,
          phase: "Phase 5 - Summary and Reporting",
        });
        if (payloadBucketIds.length === 0) {
          // Write the enrollments into premium calculator file (deletion-only path)
          try {
            await premiumCalculator(
              upload.entityId, 
              upload.endorsementId,
              {
                    endorsementRepo: this.endorsementRepo,
                    policyRepo: this.policyRepo,
                    policyConfigRepo: this.policyConfigRepo,
                    employeePolicyMapRepo: this.employeePolicyMapRepo,
                    fileRepo: this.fileRepo,
                    employeeEnrollmentRepo: this.employeeEnrollmentRepo,
                    lookUpRepository: this.lookUpRepository,
                    dependentRepo: this.dependentRepo,
              },
              this.logger,
              this.traceIdService.traceId
            );
          }
          catch(err) {
            this.logError("updatedProcessEnrollmentUpload", {
              message: "Failed to update premium calculator after deletion-only processing",
              error: err instanceof Error ? err.message : err,
            });
          }
          await this.uploadRepo.update(upload.id, {
            processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
          });
        } else {
          this.logInfo("updatedProcessEnrollmentUpload", {
            message:
              "Deferring upload completion status update until payload processing completes",
            uploadId: upload.id,
            payloadBucketsCreated: payloadBucketIds.length,
            phase: "Phase 5 - Summary and Reporting",
          });
        }
      } catch (summaryErr) {
        this.logError("updatedProcessEnrollmentUpload", {
          message: "Failed to create summary record",
          error: summaryErr instanceof Error ? summaryErr.message : summaryErr,
          successCount,
          errorCount,
          processCount,
        });
      }

      // Final completion logging
      const processingEndTime = Date.now();
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Updated enrollment upload processing completed successfully",
        totalPhasesCompleted: 6, // Updated to include deletion phase
        finalSummary: {
          totalRecordsProcessed: successCount + errorCount,
          successCount,
          errorCount,
          processCount,
          payloadBucketsCreated: payloadBucketIds.length,
          errorBucketsProcessed: errorBucketIds.length,
          deletionSummary: {
            employeeDeletionsProcessed: mapsToDelete.length,
            deletionSuccessCount: deletionSuccessRows.length,
            deletionErrorCount: deletionErrors.length,
            deletionSelfBucketsProcessed: deletionSelfBucketIds.length,
            deletionDependentBucketsProcessed: deletionDependentBucketIds.length,
          },
          errorFileGenerated: errorFileId ? true : false,
          processingDuration: this.formatDuration(
            processingEndTime - processingStartTime
          ),
        },
      });

      // Final processing completion logging
      const FinalprocessingEndTime = Date.now();
      const deletionProcessingDuration = processingEndTime - deletionProcessingStartTime;
      const totalProcessingDuration = processingEndTime - processingStartTime;
      
      // Final memory cleanup - clear all bucket ID arrays
      payloadBucketIds.length = 0;
      errorBucketIds.length = 0;
      deletionSelfBucketIds.length = 0;
      deletionDependentBucketIds.length = 0;
      // Note: selfBucketIds and validAdditionBucketIds already cleared after their respective phases
      
      this.logInfo("updatedProcessEnrollmentUpload", {
        message: "Complete enrollment upload processing finished",
        uploadId: upload.id,
        totalProcessingDuration: this.formatDuration(totalProcessingDuration),
        deletionProcessingDuration: this.formatDuration(
          deletionProcessingDuration
        ),
        completedAt: new Date(processingEndTime).toISOString(),
        phaseSummary: {
          fileProcessing: `${fileProcessingEndTime - processingStartTime}ms`,
          phase1Validation: `${phase1EndTime - fileProcessingEndTime}ms`,
          phase2Validation: `${phase2EndTime - phase1EndTime}ms`,
          phase3Payload: `${phase3EndTime - phase2EndTime}ms`,
          phase4Setup: `${phase4SetupEndTime - phase3EndTime}ms`,
          deletionProcessing: this.formatDuration(deletionProcessingDuration)
        }
      });
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "scheduler-service EnrollmentUploadScheduler",
          method: "updatedProcessEnrollmentUpload",
          messageData:
            err instanceof Error
              ? { message: err.message, stack: err.stack }
              : err,
        }),
      });
      await this.uploadRepo.update(upload.id, {
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      });
    }
  }


  private formatDuration(durationMs: number): string {
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
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


  private enrollmentProcessorActive: Map<string, boolean> = new Map();

  private async startEnrollmentProcessor(
    statusMapKey: string,
    payloadBucketIds: string[],
    userId: number,
    documentUploadId: number,
    policyId: number,
    endorsementId?: number,
    payloadGenerationCompletedKey?: string
  ): Promise<void> {
    const processorKey = `${statusMapKey}_processor`;
    const processingStartTime = Date.now();
    if (this.enrollmentProcessorActive.get(processorKey)) {
      this.logInfo("startEnrollmentProcessor", {
        message: "Enrollment processor already active for this status map",
        processorKey,
      });
      return;
    }

    this.enrollmentProcessorActive.set(processorKey, true);

    this.logInfo("startEnrollmentProcessor", {
      message: "Starting enrollment processor (continuous mode)",
      statusMapKey,
      documentUploadId,
      processorKey,
      payloadBuckets: payloadBucketIds.length,
    });

    try {
      while (true) {
        const statusMapEntries = await this.redis.hgetall(statusMapKey);
        if (!statusMapEntries || Object.keys(statusMapEntries).length === 0) {
          const generationCompleted = payloadGenerationCompletedKey
            ? (await this.redis.get(payloadGenerationCompletedKey)) === "true"
            : false;
          if (generationCompleted) {
            this.logInfo("startEnrollmentProcessor", {
              message:
                "Status map empty and payload generation completed; stopping processor",
              statusMapKey,
            });
            return;
          }
          this.logInfo("startEnrollmentProcessor", {
            message: "Status map not found in Redis",
            statusMapKey,
          });
          await this.sleep(1000);
          continue;
        }

        const currentStatusMap = Object.fromEntries(
          Object.entries(statusMapEntries).map(([key, value]) => [
            key,
            JSON.parse(value),
          ])
        ) as Record<
          string,
          {
            payloadBucketId: string;
            validationStatus: "completed" | "in-progress";
            enrollmentStatus:
              | "not-started"
              | "in-progress"
              | "completed"
              | "failed";
            createdAt: string;
            updatedAt: string;
          }
        >;

        const bucketIdsToProcess = Object.values(currentStatusMap)
          .filter((entry) => entry.enrollmentStatus === "not-started")
          .map((entry) => entry.payloadBucketId);

        for (const payloadBucketId of bucketIdsToProcess) {
          const bucketStartTime = Date.now();
          try {
            await this.enrollmentProcessing.processEnrollmentPayload(
              payloadBucketId,
              statusMapKey,
              userId,
              endorsementId
            );
            this.logInfo("startEnrollmentProcessor", {
              message: "Processed payload bucket",
              payloadBucketId,
              statusMapKey,
              durationMs: this.formatDuration(Date.now() - bucketStartTime),
            });
          } catch (processingError) {
            this.logError("startEnrollmentProcessor", {
              message: "Failed to process payload bucket",
              payloadBucketId,
              statusMapKey,
              durationMs: this.formatDuration(Date.now() - bucketStartTime),
              error:
                processingError instanceof Error
                  ? processingError.message
                  : processingError,
            });
          }
        }

        const finalStatusMapEntries = await this.redis.hgetall(statusMapKey);
        if (!finalStatusMapEntries) {
          this.logInfo("startEnrollmentProcessor", {
            message: "Status map missing after processing",
            statusMapKey,
          });
          return;
        }

        const finalStatusMap = Object.fromEntries(
          Object.entries(finalStatusMapEntries).map(([key, value]) => [
            key,
            JSON.parse(value),
          ])
        );
        const allEntries = Object.values(finalStatusMap);
        const completedEntries = allEntries.filter(
          (entry) => entry.enrollmentStatus === "completed"
        );
        const failedEntries = allEntries.filter(
          (entry) => entry.enrollmentStatus === "failed"
        );
        const finalStateEntries = [...completedEntries, ...failedEntries];
        const generationCompleted = payloadGenerationCompletedKey
          ? (await this.redis.get(payloadGenerationCompletedKey)) === "true"
          : true;

        if (
          generationCompleted &&
          finalStateEntries.length === allEntries.length
        ) {
          if (endorsementId) {
            await this.updateEndorsementSummaryAfterEnrollment(endorsementId);
          }
          try {
            await premiumCalculator(
              policyId,
              endorsementId,
              {
                endorsementRepo: this.endorsementRepo,
                policyRepo: this.policyRepo,
                policyConfigRepo: this.policyConfigRepo,
                employeePolicyMapRepo: this.employeePolicyMapRepo,
                fileRepo: this.fileRepo,
                employeeEnrollmentRepo: this.employeeEnrollmentRepo,
                lookUpRepository: this.lookUpRepository,
              },
              this.logger,
              this.traceIdService.traceId
            );
          } catch (error) {
            this.logError("startEnrollmentProcessor", {
              message: "Failed to calculate premium",
              documentUploadId,
              error: error instanceof Error ? error.message : error,
            });
          }
          await this.uploadRepo.update(documentUploadId, {
            processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
          });
          this.logInfo("startEnrollmentProcessor", {
            message: `Upload ${documentUploadId} processing completed successfully`,
            documentUploadId,
            completedCount: completedEntries.length,
            failedCount: failedEntries.length,
            durationMs: this.formatDuration(Date.now() - processingStartTime),
          });
          try {
            const overallStartKey = `${statusMapKey}_overall_start`;
            const overallStart = await this.redis.get(overallStartKey);
            if (overallStart) {
              const overallStartMs = Date.parse(overallStart);
              if (!Number.isNaN(overallStartMs)) {
                const overallEndMs = Date.now();
                this.logInfo("startEnrollmentProcessor", {
                  message: "Overall end-to-end processing completed",
                  documentUploadId,
                  overallStartTime: new Date(overallStartMs).toISOString(),
                  overallEndTime: new Date(overallEndMs).toISOString(),
                  overallDuration: this.formatDuration(
                    overallEndMs - overallStartMs
                  ),
                });
              }
            }
            const cleanupResult = await this.cleanupEnrollmentRedis(
              statusMapKey,
              payloadGenerationCompletedKey,
              documentUploadId
            );
            if (cleanupResult) {
              this.logInfo("startEnrollmentProcessor", {
                message: "Enrollment redis cleanup completed",
                documentUploadId,
                statusMapKey,
                matchPattern: cleanupResult.matchPattern,
                deletedKeys: cleanupResult.deletedKeys,
                durationMs: this.formatDuration(cleanupResult.durationMs),
              });
            }
          } catch (error) {
            this.logError("startEnrollmentProcessor", {
              message: "Failed to log overall end-to-end duration or cleanup",
              documentUploadId,
              error: error instanceof Error ? error.message : error,
            });
          }
          return;
        }

        if (bucketIdsToProcess.length === 0) {
          const statusCounts = allEntries.reduce(
            (acc, entry) => {
              acc.total += 1;
              acc[entry.enrollmentStatus] =
                (acc[entry.enrollmentStatus] ?? 0) + 1;
              return acc;
            },
            {
              total: 0,
              "not-started": 0,
              "in-progress": 0,
              completed: 0,
              failed: 0,
            } as Record<string, number>
          );
          this.logInfo("startEnrollmentProcessor", {
            message: "No payload buckets ready; sleeping",
            statusMapKey,
            statusCounts,
          });
          await this.sleep(1000);
        }
      }
    } catch (error) {
      this.logError("startEnrollmentProcessor", {
        message: "Error during continuous enrollment processing",
        error: error instanceof Error ? error.message : error,
        statusMapKey,
        durationMs: Date.now() - processingStartTime,
      });
      try {
        const cleanupResult = await this.cleanupEnrollmentRedis(
          statusMapKey,
          payloadGenerationCompletedKey,
          documentUploadId
        );
        if (cleanupResult) {
          this.logInfo("startEnrollmentProcessor", {
            message: "Enrollment redis cleanup after failure completed",
            documentUploadId,
            statusMapKey,
            matchPattern: cleanupResult.matchPattern,
            deletedKeys: cleanupResult.deletedKeys,
            durationMs: this.formatDuration(cleanupResult.durationMs),
          });
        }
      } catch (cleanupError) {
        this.logError("startEnrollmentProcessor", {
          message: "Failed to cleanup enrollment redis after failure",
          documentUploadId,
          statusMapKey,
          error: cleanupError instanceof Error ? cleanupError.message : cleanupError,
        });
      }
    } finally {
      this.enrollmentProcessorActive.set(processorKey, false);
    }
  }

  private async cleanupEnrollmentRedis(
    statusMapKey: string,
    payloadGenerationCompletedKey: string | undefined,
    documentUploadId: number
  ): Promise<{ matchPattern: string; deletedKeys: number; durationMs: number } | null> {
    const cleanupStart = Date.now();
    const overallStartKey = `${statusMapKey}_overall_start`;
    const payloadGenerationCompletedKeyFinal = payloadGenerationCompletedKey
      ? payloadGenerationCompletedKey
      : `${statusMapKey}_generation_completed`;
    const inceptionPrefix = statusMapKey.replace(/_payload_status_map$/, "");
    const matchPattern = `${inceptionPrefix}_*`;
    let cursor = "0";
    let deletedKeys = 0;
    do {
      const [nextCursor, keys] = (await this.redis.scan(
        cursor,
        "MATCH",
        matchPattern,
        "COUNT",
        1000
      )) as [string, string[]];
      cursor = nextCursor;
      if (keys.length > 0) {
        deletedKeys += keys.length;
        await this.redis.del(...keys);
      }
    } while (cursor !== "0");
    await this.redis.del(
      statusMapKey,
      payloadGenerationCompletedKeyFinal,
      overallStartKey
    );
    return {
      matchPattern,
      deletedKeys,
      durationMs: Date.now() - cleanupStart,
    };
  }


   private async updateEndorsementSummaryAfterEnrollment(
    endorsementId: number
  ): Promise<void> {
    const calculationStart = Date.now();
    try {
      const endorsement = await this.endorsementRepo.findOne({
        where: { id: endorsementId },
      });
      if (!endorsement?.policyId) {
        this.logInfo("updateEndorsementSummaryAfterEnrollment", {
          message: "Endorsement not found or missing policyId",
          endorsementId,
        });
        return;
      }

      const policyId = endorsement.policyId;
      const policy = await this.policyRepo.findOne({
        where: { id: policyId },
      });

      // Fetch policy configuration for age band calculations
      let policyConfig: any = null;
      try {
        const liveStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
        });
        if (liveStatus) {
          const configEntity = await this.policyConfigRepo.findOne({
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
        this.logInfo("updateEndorsementSummaryAfterEnrollment", {
          message: "Could not fetch policy configuration, using fallback logic",
          policyId,
          error: error instanceof Error ? error.message : error,
        });
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
        this.policyEmployeeEndorsementRepo
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
        this.policyEmployeeEndorsementRepo
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
        this.dependentRepo.count({
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
        this.dependentRepo.count({
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

      const documentRecords = await this.uploadRepo.find({
        where: { endorsementId: endorsement.id },
        select: ["documentId"],
      });

      let totalEmployeesInEndorsement = 0;
      let updateOnlyEmployeeIds: number[] = [];
      if (documentRecords.length > 0) {
        const documentIds = documentRecords.map((doc) => doc.documentId);
        totalEmployeesInEndorsement = await this.employeePolicyMapRepo.count({
          where: [
            { enrollmentAdditionBatchId: In(documentIds) },
            { enrollmentDeletionBatchId: In(documentIds) },
          ],
          withDeleted: true,
        });
      }

      if (endorsement.id && totalEmployeesInEndorsement === 0) {
        const updateOnlyEmployees = await this.policyEmployeeEndorsementRepo
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
        await this.policyDependentEndorsementRepo.count({
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

          let additionPremiumTotal = 0;
          let deletionPremiumTotal = 0;

          const batchSize = 1000;
          let lastEnrollmentId = 0;

          const peeEndorsementEmployeeIds = new Set<number>();
          if (endorsement.id) {
            const peeRaw = await this.policyEmployeeEndorsementRepo
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
            const enrollmentBatch =
              await this.listEndorsementReadyEnrollmentsBatch(
                policyId,
                lastEnrollmentId,
                batchSize,
                endorsement.id
              );

            if (!enrollmentBatch.length) {
              break;
            }

            lastEnrollmentId = enrollmentBatch[enrollmentBatch.length - 1].id;

            const batchEmployeeIds = enrollmentBatch.map(
              (enroll) => enroll.employeeId
            );

            const activeDependentsByEmployee = needsFullFamilyForBand
              ? await this.fetchActiveDependentsMapByEmployeeIds(
                  policyId,
                  batchEmployeeIds,
                )
              : new Map<number, PolicyEnrollmentDependent[]>();

            coverageByEmployee.clear();
            if (batchEmployeeIds.length) {
              const coverageRows = await this.employeePolicyMapRepo.find({
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
                this.resolveDeletionEligibleLivesCount(
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
              const mapPremiumOverride = this.resolveMapAdditionalParamValue(
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
                } else if (!endorsement.id || peeEndorsementEmployeeIds.has(enrollment.employeeId)) {
                  additionPremiumTotal += totalBypass;
                }
              } else {
                const { additionPremiumPortion, deletionPremiumPortion } =
                  this.calculateProratedPremiumsForEnrollment(
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
              }
            }
          }

          netPremium = roundToTwo(additionPremiumTotal - deletionPremiumTotal);
          grossPremium = roundToTwo(
            netPremium + (netPremium * gstPercentage) / 100
          );
        }
      }

      await this.endorsementRepo.update(endorsement.id, {
        endorsmentCount: endorsementReadyEmployees,
        endorsmentDependentCount: endorsementReadyDependents,
        employeeEndorsementAdditionCount: additionCount,
        employeeEndorsementDeletionCount: deletionCount,
        netPremium,
        grossPremium,
        gstAmount: roundToTwo(grossPremium - netPremium),
      });

      try {
        const roLookup = await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.RO },
        });
        if (roLookup) {
          const roOpportunity = await this.opportunityRepo.findOne({
            where: { opportunityTypeLid: roLookup.id, refPolicyId: policyId },
            select: ["opportunityId"],
          });
          if (roOpportunity) {
            const premiumRow = await this.endorsementRepo
              .createQueryBuilder("e")
              .select("SUM(e.grossPremium)", "total")
              .where("e.policyId = :policyId", { policyId })
              .getRawOne<{ total: string }>();
            const totalEndorsementPremium = parseFloat(premiumRow?.total ?? "0") || 0;
            const policyGrossPremium = Number(policy?.grossPremium ?? 0);
            const newPremiumPaid = policyGrossPremium + totalEndorsementPremium;
            await this.opportunityRepo.update(roOpportunity.opportunityId, {
              premiumPaid: newPremiumPaid,
            });
            this.logInfo("updateEndorsementSummaryAfterEnrollment", {
              message: "Updated RO premiumPaid after endorsement update",
              opportunityId: roOpportunity.opportunityId,
              policyId,
              newPremiumPaid,
            });
          }
        }
      } catch (roError) {
        this.logError("updateEndorsementSummaryAfterEnrollment", {
          message: "Failed to update RO premiumPaid",
          policyId,
          error: roError instanceof Error ? roError.message : roError,
        });
      }

      this.logInfo("updateEndorsementSummaryAfterEnrollment", {
        message: "Updated endorsement summary after enrollment processing",
        endorsementId: endorsement.id,
        endorsmentCount: endorsementReadyEmployees,
        endorsmentDependentCount: endorsementReadyDependents,
        employeeEndorsementAdditionCount: additionCount,
        employeeEndorsementDeletionCount: deletionCount,
        netPremium,
        grossPremium,
        durationMs: this.formatDuration(Date.now() - calculationStart),
      });
    } catch (error) {
      this.logError("updateEndorsementSummaryAfterEnrollment", {
        message: "Failed to update endorsement summary after enrollment",
        endorsementId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  private async listEndorsementReadyEnrollmentsBatch(
    policyId: number,
    lastEnrollmentId: number,
    batchSize: number,
    endorsementId?: number
  ): Promise<PolicyEmployeeEnrollment[]> {
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

    let qb = this.employeeEnrollmentRepo
      .createQueryBuilder("enroll")
      .withDeleted()
      .leftJoinAndSelect("enroll.employee", "employee")
      .leftJoinAndSelect(
        "employee.dependents",
        "dependents",
        depJoinCondition,
        depJoinParams,
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

    return qb.getMany();
  }

  // Full active family for an employee, independent of any specific endorsement —
  // used ONLY for Dependent Count+Age band matching (resolveDependentCountOptionId
  // needs the whole family to determine the correct SI-enhancement band), never for
  // deciding which dependent's own row/premium gets computed (that stays scoped to
  // listEndorsementReadyEnrollmentsBatch's per-endorsement dependents).
  private async fetchActiveDependentsMapByEmployeeIds(
    policyId: number,
    employeeIds: number[]
  ): Promise<Map<number, PolicyEnrollmentDependent[]>> {
    const map = new Map<number, PolicyEnrollmentDependent[]>();
    if (!employeeIds.length) return map;
    const rows = await this.dependentRepo.find({
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
  }

  private hasReportedClaim(value: unknown): boolean {
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
  }

  private resolveDeletionEligibleLivesCount(
    employeeClaimStatus: unknown,
    dependents: PolicyEnrollmentDependent[]
  ): number {
    const hasEmployeeClaim = this.hasReportedClaim(employeeClaimStatus);
    const eligibleDependents = dependents.filter(
      (dep) =>
        !this.hasReportedClaim(
          dep.additionalParams?.claimStatus ?? dep.claimStatus
        )
    ).length;
    return hasEmployeeClaim ? 0 : (1 + eligibleDependents);
  }

  private calculateProratedPremiumsForEnrollment(
    enrollment: PolicyEmployeeEnrollment,
    livesCount: number,
    policyFrom: Date,
    policyTo: Date,
    additionEffectiveDate: Date,
    deletionEffectiveDate: Date,
    isEmployeeDeleted: boolean = false,
    eligibleDeletionLivesCount?: number,
    dependents?: PolicyEnrollmentDependent[] | UpsertEnrollmentDependentDto[],
    policyConfig?: any,
    isEmployeeInThisEndorsement: boolean = true,
    currentEndorsementId?: number,
    allActiveDependentsForBand?: PolicyEnrollmentDependent[],
    mapAdditionalParams?: Record<string, any> | null
  ): {
    totalPremium: number;
    additionPremiumPortion: number;
    deletionPremiumPortion: number;
  } {
    const totalPremium = this.calculateTotalPremiumFromChoices(
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
    // Clamp effectiveDate to [normalizedPolicyFrom, normalizedPolicyTo] then calculate applicable days to policyTo
    const applicableDaysFor = (effectiveDate: Date): number => {
      const clampedStart = new Date(Math.max(toMidnight(new Date(effectiveDate)).getTime(), normalizedPolicyFrom.getTime()));
      return calculateApplicableDays(clampedStart, normalizedPolicyTo);
    };

    if (!enrollment.components?.length) {
      // ADDITIONS are done via backend - data migration, so they don't possess choices.
      // Hence, to calculate deletion refund checking last paid premium by employee.
      const lastPaidNetPremium = this.parseNumericValue(enrollment.lastPaidNetPremium) ?? 0;
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
      let choicePremium = this.parseNumericValue(choice.premium) ?? 0;

      const sumInsuredModel = choice.sumInsuredModel
        ? String(choice.sumInsuredModel).trim().toUpperCase()
        : undefined;

      // Handle multiple sum insured model calculations
      if (sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE && enrollment) {
        const multiplier = this.resolveEmployeeMultiplierValue(
          enrollment,
          choice.sumInsuredModelProperty,
          mapAdditionalParams
        );
        const sumInsured =
          Number(multiplier ?? DEFAULT_PAGE) *
          Number(this.parseNumericValue(choice.sumInsured) ?? DEFAULT_PAGE);
        const applicableSumInsured = this.resolveApplicableSumInsuredValue(
          choice,
          sumInsured
        );
        const companyContribution =
          this.parseNumericValue(choice.companyPay) ?? 0;
        const employeeContribution =
          this.parseNumericValue(choice.employeePay) ?? 0;

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
      const isPPL = this.parsePremiumPerLife(choice.premiumPerLife);

      const applyToDependentsParams: any[] = policyConfig
        ? (policyConfig.parameters ?? []).filter((p: any) => p.applyToDependents)
        : [];
      const useConfigForDependents = applyToDependentsParams.length > 0 && !!policyConfig;

      if (isPPL) {
        const endorsementDependents = (enrollment.employee?.dependents ?? []) as PolicyEnrollmentDependent[];

        // "Dependent Count" parameters aren't applyToDependents (they describe the whole
        // family, not one life) but they can still be part of a policyOption's optionMeta
        // alongside Age etc. — matching empBaseOption on applyToDependentsParams alone would
        // pick the first policyOption with the right Age regardless of dependent count, so
        // depBaseOptionMeta's "Dependent Count" entry must also be constrained to the
        // CURRENT total dependent count, not left arbitrary.
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
                  (m: OptionMetaEntry) => m.parameterId === param.id && m.parameterOptionId === empId,
                );
              } catch { return true; }
            });
            const dependentCountMatches = dependentCountParams.every((param: any) => {
              const matchedId = resolveDependentCountOptionId(param, dependentsForBand);
              return !matchedId || (opt.optionMeta ?? []).some(
                (m: OptionMetaEntry) => m.parameterId === param.id && m.parameterOptionId === matchedId,
              );
            });
            return ageAndAttributesMatch && dependentCountMatches;
          });
          return empBaseOption?.optionMeta ?? [];
        };

        // Not a resubmission of the employee's own choices — a dependent was added
        // and/or deleted independently in THIS endorsement. Per the business Premium
        // Rater Table: previously-known dependents are frozen (already billed under
        // an earlier endorsement), a newly added dependent is priced at the family band
        // as it stood BEFORE this endorsement, a deleted dependent is refunded at that
        // same pre-endorsement band, and the employee's line only picks up the prorated
        // difference between the pre- and post-endorsement bands.
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
          dep: PolicyEnrollmentDependent | UpsertEnrollmentDependentDto,
          depEffectiveDate: Date,
          baseOptionMeta: OptionMetaEntry[],
        ): number => {
          const componentId = choice.policyComponentActionTypeId ?? 0;
          const depLifeRecord = {
            ...dep,
            additionalDetails: (dep as any).additionalAttributes,
            effectiveDate: depEffectiveDate,
          };
          let totalDepPremium = 0;
          for (const param of applyToDependentsParams) {
            try {
              const result = resolveDependentOnlyPremiumByConfiguration({
                parameter: param,
                dependent: depLifeRecord,
                employee: empRecord,
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
            // deleted dependent's own premium is refunded at the band they were
            // actually being charged under (family as it stood right before this
            // endorsement's change), and the employee's own line picks up a symmetric
            // refund delta (see below) — the enhancement/refund diff only applies on
            // deletion, never on addition.
            for (const dep of newlyAddedDependents) {
              const depAddDate = dep.effectiveDate
                ? new Date(dep.effectiveDate as any)
                : additionEffectiveDate;
              const depPremium = resolveDepPremiumFromConfig(dep, depAddDate, depBaseOptionMeta);
              additionPremiumPortion += totalPolicyDays > 0
                ? Math.round(depPremium * applicableDaysFor(depAddDate) / totalPolicyDays * 100) / 100
                : 0;
            }

            // Employee's own line is frozen on both addition and deletion here —
            // it's not the subject of this endorsement, only the dependent is.
            for (const dep of deletedDependents) {
              const depHasClaim = this.hasReportedClaim(
                (dep as any).additionalParams?.claimStatus ?? (dep as any).claimStatus
              );
              if (adjustedDeletionLivesCount > 0 && !depHasClaim) {
                const depDelDate = new Date(dep.deletedAt as any);
                // Refund their own premium resolved at the enhanced band they were
                // actually active under (bandIncludingDeleted) — no diff/subtraction,
                // just resolve-and-prorate by their own applicable days.
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
              const depHasClaim = this.hasReportedClaim(
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
          if (isIndependentDependentChange) {
            // Employee's own line is frozen — no diff. No proration on this choice, so
            // a deletion isn't refunded either — mirrors the pre-existing
            // "deletionPremiumPortion += 0" behavior below.
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
        // Same append-only rule as the PPL branch: when only a dependent changed
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
              const depHasClaim = this.hasReportedClaim(
                (dep as any).additionalParams?.claimStatus ?? (dep as any).claimStatus,
              );

              if (!dep.deletedAt) {
                const depAddDate = dep.effectiveDate
                  ? new Date(dep.effectiveDate as any)
                  : additionEffectiveDate;
                additionPremiumPortion += totalPolicyDays > 0
                  ? Math.round(daTotal * applicableDaysFor(depAddDate) / totalPolicyDays * 100) / 100
                  : daTotal;
              } else if (isProratedChoice && adjustedDeletionLivesCount > 0 && !depHasClaim && dep.deletedAt) {
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

  private parseNumericValue(value: unknown): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(
      typeof value === DATA_TYPES.STRING
        ? (value as string).replace(/,/g, "")
        : value
    );
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  // Normalized-key lookup into a PolicyEnrollmentEmployeePolicyMap.additionalParams
  // blob — the raw upload row's "Premium"/etc. cell lands here under whatever key
  // its column mapping or literal header text produced, not a fixed constant.
  private resolveMapAdditionalParamValue(
    mapAdditionalParams: Record<string, any> | null | undefined,
    propertyKey: string
  ): number | undefined {
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
      const numericValue = this.parseNumericValue(rawValue);
      if (numericValue !== undefined) {
        return numericValue;
      }
    }
    return undefined;
  }

  private resolveEmployeeMultiplierValue(
    enrollment: PolicyEmployeeEnrollment | undefined,
    propertyKey?: string,
    mapAdditionalParams?: Record<string, any> | null
  ): number | undefined {
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
        const numericValue = this.parseNumericValue(rawValue);
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
  }

  private resolveApplicableSumInsuredValue(
    choice: PolicyEmployeeEnrollmentChoice,
    sumInsured?: number
  ): number | undefined {
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
  }

  private calculateTotalPremiumFromChoices(
    choices: PolicyEmployeeEnrollmentChoice[] | undefined,
    livesCount: number,
    enrollment?: PolicyEmployeeEnrollment,
    dependents?: PolicyEnrollmentDependent[] | UpsertEnrollmentDependentDto[],
    policyConfig?: any,
    effectiveDate?: Date,
    mapAdditionalParams?: Record<string, any> | null
  ): number {
    if (!choices?.length) {
      return 0;
    }
    // Calculate employee age once if we have the enrollment data
    const employeeAge = (enrollment && enrollment.employee.dateOfBirth) 
      ? (typeof enrollment?.employee?.dateOfBirth === DATA_TYPES.STRING ? 
        this.calculateAgeAtEffectiveDate(new Date(enrollment.employee.dateOfBirth), effectiveDate ?? new Date()) :
        this.calculateAgeAtEffectiveDate(enrollment.employee.dateOfBirth, effectiveDate ?? new Date()))
      : null;
    
    return choices.reduce((total, choice) => {
      let premium = this.parseNumericValue(choice.premium) ?? 0;

      const sumInsuredModel = choice.sumInsuredModel
        ? String(choice.sumInsuredModel).trim().toUpperCase()
        : undefined;

      if (sumInsuredModel === SUM_INSURED_MODELS.MULTIPLE && enrollment) {
        const multiplier = this.resolveEmployeeMultiplierValue(
          enrollment,
          choice.sumInsuredModelProperty,
          mapAdditionalParams
        );
        const sumInsured =
          Number(multiplier ?? DEFAULT_PAGE) *
          Number(this.parseNumericValue(choice.sumInsured) ?? DEFAULT_PAGE);
        const applicableSumInsured = this.resolveApplicableSumInsuredValue(
          choice,
          sumInsured
        );
        const companyContribution =
          this.parseNumericValue(choice.companyPay) ?? 0;
        const employeeContribution =
          this.parseNumericValue(choice.employeePay) ?? 0;

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
      if (this.parsePremiumPerLife(choice.premiumPerLife)) {
        let isDependentAgeBasedCalculationEnabled =  (
          ENV.ENABLE_DEPENDENT_AGE_BASED_PREMIUM_CALCULATION ?? BOOLEAN_VALUES.FALSE).toLocaleLowerCase() === BOOLEAN_VALUES.TRUE;
        // Use age band-based calculation if we have policy config and dependents
        if (policyConfig && dependents && enrollment && isDependentAgeBasedCalculationEnabled) {
          choicePremium = this.calculateAgeBandBasedPremium(
            choice,
            premium,
            enrollment,
            dependents,
            policyConfig,
            employeeAge,
            effectiveDate ?? new Date()
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
  }

  private parsePremiumPerLife(value: unknown): boolean {
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
  }

   private findAgeBandPremium = (
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
    ;
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
    ;
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
    const choiceSumInsured = this.parseNumericValue(choice.sumInsured);
    let matchingSumInsuredId: number | null = null;
    
    for (const siOption of component.sumInsuredOptions) {
      const optionValue = this.parseNumericValue(siOption.value);
      if (optionValue === choiceSumInsured) {
        matchingSumInsuredId = siOption.id;
        break;
      }
    }
    ;
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
    const companyContribution = this.parseNumericValue(premiumChoice.companyContribution) || 0;
    const employeeContribution = this.parseNumericValue(premiumChoice.employeeContribution) || 0;
    const totalPremium = companyContribution + employeeContribution;
    ;
    return totalPremium > 0 ? totalPremium : basePremium;
  };

  private calculateAgeBandBasedPremium(
    choice: PolicyEmployeeEnrollmentChoice,
    basePremium: number,
    enrollment: PolicyEmployeeEnrollment,
    dependents: PolicyEnrollmentDependent[] | UpsertEnrollmentDependentDto[],
    policyConfig: any,
    employeeAge: number | null,
    effectiveDate: Date
  ): number {

    if (!policyConfig) {
      // Fallback to old logic if no policy config
      return basePremium * (1 + dependents.length);
    }

    let totalPremium = 0;
    
    // Calculate premium for employee based on their age band
    const employeePremium = this.findAgeBandPremium(employeeAge, basePremium, policyConfig, choice);
    totalPremium += employeePremium ;  // TODO here calculate the per day premium of employee
    
    // Calculate premium for each dependent based on their age band
    for (const dependent of dependents) {
      const dependentAge = 
        dependent.dateOfBirth ?  (typeof dependent.dateOfBirth === DATA_TYPES.STRING 
          ? this.calculateAgeAtEffectiveDate(new Date(dependent.dateOfBirth), new Date(dependent?.effectiveDate ?? new Date())) :
            this.calculateAgeAtEffectiveDate(dependent.dateOfBirth as Date, new Date(dependent?.effectiveDate ?? new Date()))) : null;
      let dependentPremium: number;
      
      if (dependentAge !== null) {
        // Try to find premium for dependent's age band
        dependentPremium = this.findAgeBandPremium(dependentAge, basePremium, policyConfig, choice);

      } else {
        // If we can't determine dependent's age, use employee's age band as fallback
        dependentPremium = employeePremium;
      }
      // here calculate the per day premium of dependent
      totalPremium += dependentPremium;
    }
    
    return totalPremium;
  }
  // End : Updated flow for the enrollment upload function

  private async processNonFinancialEnrollmentUpload(
    upload: DocumentProcessingFile
  ) {
    this.logInfo(
      "processNonFinancialEnrollmentUpload",
      `Processing enrollment upload with ID: ${upload.id}`
    );
    try {
      // Step 1: Find file, download, parse Excel
      const file = await this.fileRepo.findOne({
        where: { id: upload.documentId },
      });
      if (!file) throw new Error("File not found");
      const buffer = await downloadFromS3(file.fileKey);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rowsData: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
        dateNF: "yyyy-mm-dd",
      });
      if (!rowsData.length) return;
      const headerValues = rowsData[0].map((h: any) => String(h).trim());

      // Step 2: Fetch policy configuration and check restrictions
      const config = await this.policyConfigRepo.findOne({
        where: { policyId: upload.entityId },
      });
      let restrictions: string[] = [];
      if (
        config &&
        config.policyConfiguration &&
        typeof config.policyConfiguration === "object" &&
        "parameters" in config.policyConfiguration &&
        Array.isArray((config.policyConfiguration as any).parameters)
      ) {
        const parameters = config.policyConfiguration.parameters as any[];
        restrictions = parameters.map((param: any) =>
          String(param.parameterMasterName).toLowerCase(),
        );
      }
      const restrictAge = restrictions.includes(NON_FINANCIAL_CONSTANTS.AGE);
      const restrictGender = restrictions.includes(NON_FINANCIAL_CONSTANTS.GENDER);

      const policy = await this.policyRepo.findOne({
        where: { id: upload.entityId },
      });
      if (!policy) {
        throw new NotFoundException(
          `Policy not found for policy ID ${upload.entityId}`
        );
      }

      const defaultCountryCallingCode = await fetchDefaultCountryCallingCode(
        this.policyConfigRepo.manager,
        upload.entityId,
        this.redis,
      );
      this.logInfo("processNonFinancialEnrollmentUpload", {
        message: "[PhoneCountryCode] Default calling code resolved",
        policyId: upload.entityId,
        defaultCountryCallingCode
      });

      // Fetch dynamic mappings for the company
      const mappings = await this.fetchMappingTemplates(
        upload.entityId,
        UTILITY_UPLOAD_ENTITY.UPLOAD_INCEPTION,
      );

      this.logInfo("processNonFinancialEnrollmentUpload", {
        message: "Fetched column mappings",
        mappingsCount: mappings?.length || 0,
        hasDynamicMappings: mappings && mappings.length > 0,
      });

      const errors: any[] = [];
      const successRows: any[] = [];
      let errorFileId: number | null = null;
      let successFileId: number | null = null;

      // Get column indices using dynamic mappings with static fallbacks
      const idxIntakeType = this.getColumnIndex(mappings, headerValues, "intake_type", ["intaketype"]);
      const idxEmployeeId = this.getColumnIndex(mappings, headerValues, "employee_id", ["employeeid"]);
      const idxRelation = this.getColumnIndex(mappings, headerValues, "relation", ["relation"]);
      const idxDob = this.getColumnIndex(mappings, headerValues, "date_of_birth", ["dateofbirth"]);
      const idxGender = this.getColumnIndex(mappings, headerValues, "gender", [NON_FINANCIAL_CONSTANTS.GENDER]);
      const idxName = this.getColumnIndex(mappings, headerValues, "full_name", [NON_FINANCIAL_CONSTANTS.FULL_NAME, "employeename"]);
      const idxIIRMId = this.getColumnIndex(mappings, headerValues, "iirm_id", ["iirmid"]);
      const idxTpaID = this.getColumnIndex(mappings, headerValues, "tpa_id", ["tpaid"]);
      // Contact details — update-if-provided, self only (dependents don't have
      // their own login/contact record, so they're intentionally excluded below).
      const idxEmail = this.getColumnIndex(mappings, headerValues, "email", ["email"]);
      const idxMobile = this.getColumnIndex(mappings, headerValues, "mobile_number", ["mobilenumber"]);

      // Email/mobile are unique per company and double as login identifiers —
      // collect every self-row's contact value up front and batch-check them
      // against the company's other employees in one query, rather than one
      // query per row. Also tracks in-sheet collisions (two rows claiming the
      // same email/mobile for two different employees).
      const candidateEmails = new Set<string>();
      const candidateMobiles = new Set<string>();
      const emailOwnerInSheet = new Map<string, string>();
      const mobileOwnerInSheet = new Map<string, string>();
      for (const preRow of rowsData.slice(1)) {
        const preIntakeType =
          idxIntakeType !== -1
            ? preRow[idxIntakeType]?.toString().trim().toUpperCase()
            : undefined;
        if (preIntakeType !== "UPDATION") continue;
        const preRelation =
          idxRelation !== -1
            ? preRow[idxRelation]?.toString().trim().toLowerCase()
            : undefined;
        if (preRelation !== "self") continue;
        const preCompanyEmployeeId =
          idxEmployeeId !== -1
            ? preRow[idxEmployeeId]?.toString().trim()
            : undefined;
        if (!preCompanyEmployeeId) continue;

        const preEmail =
          idxEmail !== -1 ? preRow[idxEmail]?.toString().trim() : undefined;
        if (preEmail) {
          candidateEmails.add(preEmail);
          if (!emailOwnerInSheet.has(preEmail)) {
            emailOwnerInSheet.set(preEmail, preCompanyEmployeeId);
          }
        }

        const preMobileRaw =
          idxMobile !== -1 ? preRow[idxMobile]?.toString().trim() : undefined;
        if (preMobileRaw) {
          const preMobileValidation = this.validateAndFormatMobileNumber(
            preMobileRaw,
            defaultCountryCallingCode ?? "91",
          );
          if (preMobileValidation.isValid && preMobileValidation.value) {
            candidateMobiles.add(preMobileValidation.value);
            if (!mobileOwnerInSheet.has(preMobileValidation.value)) {
              mobileOwnerInSheet.set(
                preMobileValidation.value,
                preCompanyEmployeeId,
              );
            }
          }
        }
      }
      const contactConflictConditions = [
        ...(candidateEmails.size
          ? [{ email: In([...candidateEmails]), companyId: policy.companyId }]
          : []),
        ...(candidateMobiles.size
          ? [
              {
                phoneNumber: In([...candidateMobiles]),
                companyId: policy.companyId,
              },
            ]
          : []),
      ];
      const existingByContact = contactConflictConditions.length
        ? await this.companyEmployeeRepo.find({
            where: contactConflictConditions,
          })
        : [];
      const employeeByEmail = new Map(
        existingByContact
          .filter((e) => e.email)
          .map((e) => [e.email as string, e]),
      );
      const employeeByMobile = new Map(
        existingByContact
          .filter((e) => e.phoneNumber)
          .map((e) => [e.phoneNumber as string, e]),
      );

      const payloads = []; // To submit for batch processing in Redis
      for (const row of rowsData.slice(1)) {
        const rowObj: any = {};
        headerValues.forEach((h, idx) => {
          rowObj[h] = row[idx];
        });

        const isRowEmpty = Object.values(row).every(
          (v) =>
            v === "" ||
            v === undefined ||
            v === null ||
            (typeof v === "string" && v.trim() === ""),
        );
        if (isRowEmpty) {
          continue;
        }

        // Check intake type - only process 'UPDATION' rows
        if (idxIntakeType === -1) {
          rowObj["Remarks"] = endorsementFileUploadMessages.ER0060;
          errors.push(rowObj);
          continue;
        }
        
        const intakeType = row[idxIntakeType]?.toString().trim().toUpperCase();
        if (intakeType !== "UPDATION") {
          rowObj["Remarks"] = endorsementFileUploadMessages.ER0061;
          errors.push(rowObj);
          continue;
        }
        
        const companyEmployeeId = row[idxEmployeeId]?.toString().trim();
        const relation = row[idxRelation]?.toString().trim().toLowerCase();
        const dob = row[idxDob]?.trim?.() ?? row[idxDob];
        const gender = row[idxGender]?.toString().trim();
        const name =
          idxName !== -1 ? row[idxName]?.toString().trim() : undefined;
        const iirmid =
          idxIIRMId !== -1 ? row[idxIIRMId]?.toString().trim() : undefined;
        const tpaID = idxTpaID !== -1 ? row[idxTpaID]?.toString().trim() : undefined;
        const email =
          idxEmail !== -1 ? row[idxEmail]?.toString().trim() : undefined;
        const mobileNumber =
          idxMobile !== -1 ? row[idxMobile]?.toString().trim() : undefined;

        const isMockId =
          companyEmployeeId &&
          String(companyEmployeeId).toLowerCase().includes("fake");
        // Only missing/required field errors are tracked in errors[]
        if (!companyEmployeeId) {
          rowObj["Remarks"] = endorsementFileUploadMessages.ER0062;
          errors.push(rowObj);
          continue;
        }

        if (isMockId) {
          rowObj["Remarks"] = endorsementFileUploadMessages.ER0002;
          errors.push(rowObj);
          continue;
        }
        let errorMsg = "";
        let canUpdate = true;
        // Always fetch employee by both companyEmployeeId and companyId
        const employee = await this.companyEmployeeRepo.findOne({
          where: {
            companyEmployeeId: companyEmployeeId,
            companyId: policy.companyId,
          },
        });
        if (relation === "self") {
          if (employee) {
            if (!name || !dob || !gender) {
              if (!name) errorMsg += "ER0007 - Full Name missing. Please provide employee’s full name; ";
              if (!dob) errorMsg += "ER0008 - Date of Birth missing. Enter a valid DOB; ";
              if (!gender) errorMsg += "Gender is required; ";
              canUpdate = false;
            }

            if (name) employee.employeeName = name;

            const dobValidation = this.validateDobUpdate(
              dob,
              employee.dateOfBirth,
              restrictAge,
              config?.policyConfiguration,
              relation,
            );

            if (!dobValidation.isValid) {
              errorMsg += dobValidation.errorMsg + "; ";
              canUpdate = false;
            }

            // If gender is in policy parameter and user is attempting to change gender
            if (gender && restrictGender && gender.toLowerCase() !== employee.gender?.toLowerCase()) {
              errorMsg += "ER0063 - Gender field cannot be updated; ";
              canUpdate = false;
            }

            // Contact details are optional on this upload — only validate/apply
            // when a value is actually provided in the sheet, self only. Email/
            // mobile are unique per company (they're used to log the employee
            // in), so a value already claimed by a DIFFERENT employee — either
            // already in the DB or elsewhere in this same sheet — is rejected.
            if (email) {
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errorMsg += "Invalid email format; ";
                canUpdate = false;
              } else {
                const emailOwner = employeeByEmail.get(email);
                if (emailOwner && emailOwner.companyEmployeeId !== companyEmployeeId) {
                  errorMsg += "Email already exists for another employee; ";
                  canUpdate = false;
                }
                const emailOwnerInThisSheet = emailOwnerInSheet.get(email);
                if (emailOwnerInThisSheet && emailOwnerInThisSheet !== companyEmployeeId) {
                  errorMsg += endorsementFileUploadMessages.ER0013 + "; ";
                  canUpdate = false;
                }
              }
            }

            let formattedMobileNumber: string | undefined;
            if (mobileNumber) {
              const mobileValidation = this.validateAndFormatMobileNumber(
                mobileNumber,
                defaultCountryCallingCode ?? "91",
              );
              if (!mobileValidation.isValid) {
                errorMsg += mobileValidation.errorMsg + "; ";
                canUpdate = false;
              } else {
                formattedMobileNumber = mobileValidation.value;
                const mobileOwner = employeeByMobile.get(formattedMobileNumber!);
                if (mobileOwner && mobileOwner.companyEmployeeId !== companyEmployeeId) {
                  errorMsg += "Mobile number already exists for another employee; ";
                  canUpdate = false;
                }
                const mobileOwnerInThisSheet = mobileOwnerInSheet.get(formattedMobileNumber!);
                if (mobileOwnerInThisSheet && mobileOwnerInThisSheet !== companyEmployeeId) {
                  errorMsg += endorsementFileUploadMessages.ER0070 + "; ";
                  canUpdate = false;
                }
              }
            }

            if (!canUpdate) {
              rowObj["Remarks"] = errorMsg.trim();
              errors.push(rowObj);
            } else {
              if (dob) employee.dateOfBirth = dob;
              if (gender) employee.gender = gender;
              if (email) employee.email = email;
              if (formattedMobileNumber) employee.phoneNumber = formattedMobileNumber;
              payloads.push({
                type: "employee",
                id: employee.id,
                data: { name, dob, gender, email, mobileNumber: formattedMobileNumber },
              });
              successRows.push(rowObj);
            }
          } else {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0030;
            errors.push(rowObj);
          }
        } else {
          if (!employee) {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0064;
            errors.push(rowObj);
            continue;
          }
          
          // Query dependent based on available identifier
          const employeeIdNum = employee?.id ? Number(employee.id) : undefined;
          let dependent: PolicyEnrollmentDependent | null = null;
          
          if (iirmid) {
            const dependentId = Number(iirmid);
            dependent = await this.dependentRepo.findOne({
              where: { id: dependentId, employeeId: employeeIdNum },
            });
          } else if (tpaID) {
            dependent = await this.dependentRepo.findOne({
              where: { dependentTpaId: tpaID, employeeId: employeeIdNum },
            });
          } else {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0065;
            errors.push(rowObj);
            continue;
          }
          
          if (dependent) {
            canUpdate = true;

            if (!name || !dob || !gender) {
              if (!name) errorMsg += endorsementFileUploadMessages.ER0007;
              if (!dob) errorMsg += "ER0008 - Date of Birth missing. Enter a valid DOB; ";
              if (!gender) errorMsg += "Gender is required; ";
              canUpdate = false;
            }
            if (name) dependent.name = name;
            errorMsg = "";

            const dobValidation = this.validateDobUpdate(
              dob,
              dependent.dateOfBirth,
              restrictAge,
              config?.policyConfiguration,
              relation,
            );

            if (!dobValidation.isValid) {
              errorMsg += dobValidation.errorMsg + "; ";
              canUpdate = false;
            }
            // If gender is in policy parameter and user is attempting to change gender
            if (gender && restrictGender && gender.toLowerCase() !== dependent.gender?.toLowerCase()) {
              errorMsg += "ER0063 - Gender field cannot be updated; ";
              canUpdate = false;
            }
            if (!canUpdate) {
              rowObj["Remarks"] = errorMsg.trim();
              errors.push(rowObj);
            } else {
              if (dob) dependent.dateOfBirth = dob;
              if (gender) dependent.gender = gender;
              payloads.push({
                type: "dependent",
                id: dependent.id,
                employeeId: employeeIdNum,
                data: { name, dob, gender },
              });
              successRows.push(rowObj);
            }
          } else {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0029;
            errors.push(rowObj);
          }
        }
      }

      // Step 3: Write to Redis for batch processing in 1000-record buckets
      if (payloads.length) {
        const inceptionKey = `policy-non-financial-enrollment:${
          upload.id
        }:${Date.now()}`;
        const bucketIds = await this.storeRecordsInRedisBuckets(
          payloads,
          inceptionKey,
          "payload"
        );
        const enrollmentSubmitStartTime = Date.now();
        try {
          // Retrieve and process each bucket from Redis
          for (const bucketId of bucketIds) {
            const batchDataRaw = await this.redis.get(bucketId);
            if (batchDataRaw) {
              const batchData = JSON.parse(batchDataRaw);
              for (const item of batchData.records) {
                if (item.type === "employee") {
                  await this.companyEmployeeRepo.update(
                    { id: item.id },
                    {
                      employeeName: item.data.name,
                      dateOfBirth: item.data.dob,
                      gender: item.data.gender,
                      // Optional, self only — key is omitted entirely (not just
                      // set to undefined) when not provided in the sheet, so
                      // the existing value is left untouched.
                      ...(item.data.email ? { email: item.data.email } : {}),
                      ...(item.data.mobileNumber
                        ? { phoneNumber: item.data.mobileNumber }
                        : {}),
                    }
                  );
                  this.logInfo(
                    "processNonFinancialEnrollmentUpload",
                    `Updated employee ${item.id} from Redis batch`
                  );
                  const existingEnrollment =
                    await this.employeeEnrollmentRepo.findOne({
                      where: {
                        employeeId: item.id,
                        policyId: upload.entityId,
                      },
                    });
                  //Enrollment will be always present
                  if (existingEnrollment) {
                    await this.employeeEnrollmentRepo.update(
                      { id: existingEnrollment.id },
                      {
                        endorsementUpdationFileId: upload.id,
                        endorsementUpdationCreatedAt: new Date(),
                      }
                    );
                  }
                  // After employee update, update policy_employee_endorsement status
                  const existingEmpEndorsement = await this.policyEmployeeEndorsementRepo.findOne({
                    where: {
                      employeeId: item.id,
                      endorsementId: upload.endorsementId,
                    },
                  });
                  if (existingEmpEndorsement) {
                    await this.policyEmployeeEndorsementRepo.update(
                      { id: existingEmpEndorsement.id },
                      {
                        endorsementUpdationFileId: upload.id,
                        endorsementUpdationCreatedAt: new Date(),
                      }
                    );
                  } else {
                    await this.policyEmployeeEndorsementRepo.insert({
                      employeeId: item.id,
                      policyId: policy.id,
                      companyId: policy.companyId,
                      employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                      endorsementId: upload.endorsementId,
                      createdAt: new Date(),
                      endorsementUpdationFileId: upload.id,
                      endorsementUpdationCreatedAt: new Date(),
                    });
                  }
                } else if (item.type === "dependent") {
                  await this.dependentRepo.update(
                    { id: item.id },
                    {
                      name: item.data.name,
                      dateOfBirth: item.data.dob,
                      gender: item.data.gender,
                    }
                  );
                  this.logInfo(
                    "processNonFinancialEnrollmentUpload",
                    `Updated dependent ${item.id} from Redis batch`
                  );
                  
                  const existingDependent = await this.dependentRepo.findOne({
                    where: { id: item.id, employeeId: item.employeeId },
                  });
                  // Dependent will be always present after update
                  if (existingDependent) {
                    await this.dependentRepo.update(
                      { id: existingDependent.id },
                      {
                        endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                        endorsementUpdationFileId: upload.id,
                        endorsementUpdationCreatedAt: new Date(),
                      }
                    );
                  }
                  const existingDepEndorsement = await this.policyDependentEndorsementRepo.findOne({
                    where: {
                      dependentId: item.id,
                      employeeId: item.employeeId,
                      endorsementId: upload.endorsementId,
                    },
                  });
                  if (existingDepEndorsement) {
                    await this.policyDependentEndorsementRepo.update(
                      { id: existingDepEndorsement.id },
                      {
                        endorsementUpdationFileId: upload.id,
                        endorsementUpdationCreatedAt: new Date(),
                      }
                    );
                  } else {
                    await this.policyDependentEndorsementRepo.insert({
                      dependentId: item.id,
                      employeeId: item.employeeId,
                      policyId: policy.id,
                      companyId: policy.companyId,
                      employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                      endorsementId: upload.endorsementId,
                      createdAt: new Date(),
                      endorsementUpdationFileId: upload.id,
                      endorsementUpdationCreatedAt: new Date(),
                    });
                  }
                }
              }
            }
          }
          const enrollmentSubmitEndTime = Date.now();
          this.logInfo("submitNonFinancialEnrollmentBatch", {
            enrollmentSubmitStartTime: new Date(
              enrollmentSubmitStartTime
            ).toISOString(),
            enrollmentSubmitEndTime: new Date(
              enrollmentSubmitEndTime
            ).toISOString(),
            duration: `${
              enrollmentSubmitEndTime - enrollmentSubmitStartTime
            }ms`,
          });
        } catch (err) {
          const errorData =
            err instanceof AxiosError ? err.response?.data ?? err.message : err;
          this.logError("processNonFinancialEnrollmentUpload", {
            error: errorData,
          });
          throw err;
        }
      }

      // Step 3: If errors, generate Excel and upload to S3
      if (errors.length) {
        const errorBuffer = await generateExcel(errors);
        const errorFileSizeBytes = errorBuffer.length;
        const errorFileSizeFormatted = formatSize(errorFileSizeBytes);
        const sanitizedName = `policy-${
          upload.entityId
        }-nonfinancial-errorfile-${Date.now()}.xlsx`;
        const key = `uploads/company/${file.entityType}/errorfiles/${sanitizedName}`;
        await uploadToS3(
          errorBuffer,
          key,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        const savedErrorFile = await this.fileRepo.save(
          this.fileRepo.create({
            fileKey: key,
            entityType: file.entityType,
            entityId: file.entityId,
            uploadType: "AWS",
            documentTypeLid: file.documentTypeLid,
            createdBy: 0,
            updatedBy: 0,
            fileSize: errorFileSizeFormatted,
          })
        );
        errorFileId = savedErrorFile.id;
        this.logInfo("processNonFinancialEnrollmentUpload", {
          uploadId: upload.id,
          errorCount: errors.length,
          errorFileKey: key,
        });
      } else {
        this.logInfo("processNonFinancialEnrollmentUpload", {
          uploadId: upload.id,
          errorCount: 0,
        });
      }

      const processCount = successRows.length + errors.length;

      await this.summaryRepo.save(
        this.summaryRepo.create({
          documentProcessingFileId: upload.id,
          policyId: upload.entityId,
          sourceFileUploadId: file.id,
          errorFileUploadId: errorFileId,
          successFileUploadId: successFileId,
          successCount: successRows.length,
          errorCount: errors.length,
          processCount,
          batchId: upload.id,
          endorsementId: upload.endorsementId,
        })
      );
      await this.uploadRepo.update(upload.id, {
        processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
      });
      this.logInfo(
        "processNonFinancialEnrollmentUpload",
        `Upload ${upload.id} had no valid records; marked as COMPLETED.`
      );
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "scheduler-service EnrollmentUploadScheduler",
          method: "processNonFinancialEnrollmentUpload",
          messageData:
            err instanceof Error
              ? { message: err.message, stack: err.stack }
              : err,
        }),
      });
      await this.uploadRepo.update(upload.id, {
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      });
    }
  }

   async fetchMappingTemplates(
    companyId: number | undefined,
    entityName: string,
    fileDirection: string = "INBOUND",
    status: string = "ALL",
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SchedulerService",
          method: "fetchMappingTemplates",
          payload: { companyId, entityName, fileDirection, status },
          messageData: "method invoked",
        }),
      });

      const repository = this.dataSource.getRepository(MappingTemplateVersion);
      const whereClause: any = {
        companyId,
        entityName,
        fileDirection,
      };

      if (status !== "ALL") {
        whereClause.isActive = true;
      }

      const versions = await repository.find({
        where: whereClause,
        relations: ["columns"],
        order: {
          templateVersionNo: "DESC",
        },
      });

      if (!versions || versions.length === 0) {
        return [];
      }

      const templates = versions.map((version) => ({
        id: version.id,
        company_id: version.companyId,
        entity_name: version.entityName,
        file_direction: version.fileDirection,
        template_version_no: version.templateVersionNo,
        change_note: version.changeNote,
        mappings:
          version.columns?.map((col) => ({
            source_column_id: col.sourceColumnId,
            source_column_name: col.sourceColumnName,
            target_table_name: col.targetTableName,
            target_column_name: col.targetColumnName,
            transformation_config: col.transformationConfig,
          })) || [],
        createdAt: version.createdAt,
        status: version.isActive ? "ACTIVE" : "INACTIVE",
      }));

      // Find the active template (note: data is an array of template objects)
      const activeTemplate = templates.find(
        (template: any) => template.status === "ACTIVE",
      );

      if (activeTemplate) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "SchedulerService",
            method: "buildCreateEndorsementDataUpdate",
            payload: {
              companyId,
              entityName,
            },
            messageData: "mapping templates fetched",
          }),
        });
      }
      return activeTemplate?.mappings || [];
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "SchedulerService",
          method: "fetchMappingTemplates",
          payload: { companyId, entityName, fileDirection, status },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : `Failed to fetch active mapping templates for insurer ${companyId}`,
      );
    }
  }

  // Strictly numeric — rejects anything like "647383abc12". A bare 10-digit
  // number is assumed local and gets the resolved default country calling
  // code prefixed; a 12-digit number already starting with "91" just gets
  // "+" prefixed. Anything else is invalid.
  private validateAndFormatMobileNumber(
    raw: string,
    countryCallingCode: string,
  ): { isValid: boolean; value?: string; errorMsg?: string } {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) {
      return {
        isValid: false,
        errorMsg:
          "Invalid Mobile Number. Only digits are allowed (no letters/symbols)",
      };
    }
    if (trimmed.length === 10) {
      return { isValid: true, value: `+${countryCallingCode}${trimmed}` };
    }
    if (trimmed.length === 12 && trimmed.startsWith("91")) {
      return { isValid: true, value: `+${trimmed}` };
    }
    return {
      isValid: false,
      errorMsg:
        "Invalid Mobile Number. Provide a 10-digit number, or 91 followed by a 10-digit number",
    };
  }

  private validateDobUpdate(
    newDob: any, // coming from excel row
    existingDob: any, // coming from db
    restrictAge: boolean,
    policyConfig: any,
    relation: string,
  ): { isValid: boolean; errorMsg: string } {
    // If age is restricted and DOB has changed, reject update
    if (restrictAge && this.areDatesDifferent(newDob, existingDob)) {
      return {
        isValid: false,
        errorMsg: endorsementFileUploadMessages.ER0066,
      };
    }

    // If age is not restricted, validate against relationship age limits
    if (!restrictAge) {
      const relationAgeLimit = this.getAgeLimitFromRelationship(
        policyConfig,
        relation,
      );

      if (relationAgeLimit) {
        let age: number | null = null;
        try {
          age = this.calculateAgeAtEffectiveDate(new Date(newDob), new Date());
        } catch (e) {
          return {
            isValid: false,
            errorMsg: endorsementFileUploadMessages.ER0043,
          };
        }

        if (age !== null) {
          const isOutOfRange =
            (relationAgeLimit.minAge !== null &&
              age < relationAgeLimit.minAge) ||
            (relationAgeLimit.maxAge !== null && age > relationAgeLimit.maxAge);

          if (isOutOfRange) {
            return {
              isValid: false,
              errorMsg: endorsementFileUploadMessages.ER0068,
            };
          }
        }
      }
    }

    return { isValid: true, errorMsg: "" };
  }

  private getAgeLimitFromRelationship(
    config: any,
    relation: string,
  ): { minAge: number | null; maxAge: number | null } | null {
    if (!config?.relationships?.enabledPolicyRelations) {
      return null;
    }

    for (const group of config.relationships.enabledPolicyRelations) {
      if (!group.enabled) continue;

      const option = group.configuredOptions?.find(
        (opt: any) =>
          opt.name?.toLowerCase() === relation?.toLowerCase() && opt.enabled,
      );

      if (option) {
        return {
          minAge: option.minAge ? Number(option.minAge) : null,
          maxAge: option.maxAge ? Number(option.maxAge) : null,
        };
      }
    }

    return null;
  }

  private areDatesDifferent = (dob: any, existingDob: string): boolean => {
    // parse excel / input date
    const parsedDob = this.parseExcelDate(dob);
    if (!parsedDob || !existingDob) return false;

    const formattedDob = this.formatToYYYYMMDD(parsedDob);    
    return formattedDob !== existingDob;
  };

  private formatToYYYYMMDD = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

    // Helper function to find column index using mappings (with fallback to static)
  private getColumnIndex = (mappings: any, headerValues: string[], targetColumnName: string, staticFallback?: string[]): number => {
    const normalizeHeader = (h: string) => h.toLowerCase().replace(/[\s_]+/g, "");
    // First try to find using mappings
    const mapping = mappings?.find((m: any) => m.target_column_name === targetColumnName);
    if (mapping?.source_column_name) {
      const idx = headerValues.findIndex((h) => h === mapping.source_column_name);
      if (idx !== -1) {
        return idx;
      }
    }
    
    // Fallback to static normalized header matching
    if (staticFallback && staticFallback.length > 0) {
      const idx = headerValues.findIndex((h) => 
        staticFallback.some(fb => normalizeHeader(h) === fb)
      );
      return idx;
    }
    
    return -1;
  };

  
  private async storeRecordsInRedisBuckets(
    records: any[],
    inceptionKey: string,
    bucketType: string = "self"
  ): Promise<string[]> {
    const MAX_BUCKET_SIZE = 1000;
    let bucketCounter = 1;
    let currentBucket: { bucketId: string; records: any[]; size: number } = {
      bucketId: `${inceptionKey}_${bucketType}_${bucketCounter}`,
      records: [],
      size: 0,
    };
    const bucketIds: string[] = [];

    for (const record of records) {
      currentBucket.records.push(record);
      currentBucket.size++;

      if (currentBucket.size >= MAX_BUCKET_SIZE) {
        await this.redis.set(
          currentBucket.bucketId,
          this.safeDateStringify(currentBucket)
        );
        bucketIds.push(currentBucket.bucketId);
        bucketCounter++;
        currentBucket = {
          bucketId: `${inceptionKey}_${bucketType}_${bucketCounter}`,
          records: [],
          size: 0,
        };
      }
    }

    // Store the last bucket if it has records
    if (currentBucket.size > 0) {
      await this.redis.set(
        currentBucket.bucketId,
        this.safeDateStringify(currentBucket)
      );
      bucketIds.push(currentBucket.bucketId);
    }

    return bucketIds;
  }

  private safeDateStringify(obj: any): string {
    const convertDatesToStrings = (obj: any): any => {
      if (obj instanceof Date) {
        return this.toDateOnlyString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(convertDatesToStrings);
      }
      if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = convertDatesToStrings(value);
        }
        return result;
      }
      return obj;
    };

    return JSON.stringify(convertDatesToStrings(obj));
  }

  private async handleMapDeletions(
    maps: PolicyEnrollmentEmployeePolicyMap[],
    upload: DocumentProcessingFile,
    effectiveDateByEmployeeId?: Map<number, Date | null>,
    claimStatusByEmployeeId?: Map<number, string | null>,
    bypassByEmployeeId?: Map<number, { premiumAmount: number | null; sumInsured: number | null }>
  ): Promise<void> {
    const deletedIds = maps.map((m) => m.employeeId);

    for (const map of maps) {
      const rawEffectiveDate = effectiveDateByEmployeeId?.get(map.employeeId);
      const effectiveDate =
        rawEffectiveDate instanceof Date &&
        !Number.isNaN(rawEffectiveDate.getTime())
          ? rawEffectiveDate
          : new Date();

      await this.employeePolicyMapRepo.update(
        { id: map.id },
        {
          deletedAt: effectiveDate,
          enrollmentDeletionBatchId: upload.documentId,
          claimStatus:
            claimStatusByEmployeeId?.get(map.employeeId) ??
            map.claimStatus ??
            null,
        }
      );

      const bypass = bypassByEmployeeId?.get(map.employeeId);

      if (bypass !== undefined) {
        await this.companyEmployeeRepo.update(map.employeeId, {
          bypassPremiumAmount: bypass.premiumAmount,
          bypassSumInsured: bypass.sumInsured,
        });

        // Update the map table with refund amount for that employee
        const existingParams = (map.additionalParams as Record<string, any>) ?? {};
        const existingPremiumKey = Object.keys(existingParams).find(
          (k) => k.replace(/[\s_-]+/g, "").toLowerCase() === "premium"
        );
        const existingIntakeTypeKey = Object.keys(existingParams).find(
          (k) => k.replace(/[\s_-]+/g, "").toLowerCase() === "intaketype"
        );

        await this.employeePolicyMapRepo.update(
          { id: map.id },
          {
            additionalParams: {
              ...existingParams,
              [existingPremiumKey ?? "Premium"]: bypass.premiumAmount,
              [existingIntakeTypeKey ?? "Intake Type"] : "DELETION"
            },
          }
        );
      }

      // Only touch dependents that aren't already deleted — a dependent removed
      // in an earlier endorsement must keep their own deletedAt/batch/endorsement
      // linkage, not get overwritten with this employee-deletion's effective date.
      await this.dependentRepo.update(
        { employeeId: map.employeeId, policyId: upload.entityId, deletedAt: IsNull() },
        {
          deletedAt: effectiveDate,
          enrollmentDeletionBatchId: upload.documentId,
          deletionEndorsementId: upload.endorsementId,
          endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
          ...(bypass !== undefined && { bypassPremiumAmount: 0, bypassSumInsured: 0 }),
        }
      );

      // Refund the employee's own + all their dependents' premium/SI BEFORE the
      // enrollment row itself is soft-deleted below — updateEnrollmentStatus's fetch
      // (deletedAt: IsNull(), no withDeleted) would otherwise never see this row again.
      // newDependentsOnly:true + newlyAddedDependentIds:[] makes every addition-side
      // branch in updateEnrollmentStatus a no-op — only the deletion refund runs.
      const currentEnrollment = await this.employeeEnrollmentRepo.findOne({
        where: { employeeId: map.employeeId, policyId: upload.entityId },
        select: ["employeeEnrollmentStatusKey"],
      });
      if (currentEnrollment) {
        const deletedDependentIdsForEmployee = (
          await this.dependentRepo.find({
            where: {
              employeeId: map.employeeId,
              policyId: upload.entityId,
              deletionEndorsementId: upload.endorsementId,
            },
            withDeleted: true,
            select: ["id"],
          })
        ).map((dep) => dep.id);

        // Update the deleted premium in PolicyEnrollmentEmployee
        await this.enrollmentRepoAdapter.updateEnrollmentStatus(
          this.dataSource.manager,
          upload.entityId,
          map.employeeId,
          map.employee?.companyId ?? 0,
          currentEnrollment.employeeEnrollmentStatusKey,
          upload.endorsementId,
          true,
          [],
          deletedDependentIdsForEmployee,
          effectiveDate
        );
      }

      await this.employeeEnrollmentRepo.update(
        { employeeId: map.employeeId, policyId: upload.entityId },
        { deletedAt: effectiveDate }
      );
    }

    await this.policyEmployeeEndorsementRepo.update(
      { employeeId: In(deletedIds), policyId: upload.entityId },
      {
        employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
        deletionEndorsementId: upload.endorsementId,
      }
    );

    const userIdsToRevert = Array.from(
      new Set(
        maps
          .map((map) => map.employee?.userId)
          .filter((id): id is number => typeof id === "number")
      )
    );

    for (const userId of userIdsToRevert) {
      await this.revertCompanyAndIirmAssociation(userId);
    }
  }

  private async getEndorsementReadyEmployeeIds(
    employeeIds: number[],
    policyId: number
  ): Promise<Map<number, number>> {
    if (!employeeIds.length) return new Map();
    const endorsements = await this.policyEmployeeEndorsementRepo.find({
      where: {
        employeeId: In(employeeIds),
        policyId,
        employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
      },
    });
    const result = new Map<number, number>();
    for (const e of endorsements) {
      if (!result.has(e.employeeId)) {
        result.set(e.employeeId, e.endorsementId!);
      }
    }
    return result;
  }

  // IBP-detach: findUserByEmailOrPhone / findUserByCompanyAndEmployee /
  // ensureCompanyAndIirmAssociation were removed — enrollment uploads no
  // longer look employees up against the `users` table at all.

  private async revertCompanyAndIirmAssociation(
    userId: number,
    manager?: EntityManager
  ): Promise<void> {
    const userRepository = manager?.getRepository(User) ?? this.userRepo;
    const roleRepository = manager?.getRepository(Role) ?? this.roleRepo;
    const userRoleRepository =
      manager?.getRepository(UserRole) ?? this.userRoleRepo;

    const user = await userRepository.findOne({
      where: { userId, deletedAt: IsNull() },
    });

    if (!user) {
      return;
    }

    const role = await roleRepository.findOne({
      where: { roleKey: USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE },
    });

    if (
      user.userTypeKey?.trim() === USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE
    ) {
      const updatedBy = user.updatedBy ?? 0;
      await userRepository.update(
        { userId: user.userId },
        {
          userTypeKey: USER_TYPE_IIRM_EMPLOYEE,
          updatedBy,
        }
      );
      user.userTypeKey = USER_TYPE_IIRM_EMPLOYEE;
      user.updatedBy = updatedBy;
    }

    if (role) {
      await userRoleRepository.delete({ userId, roleId: role.id });
    }
  }

  //Cron job to run the password reset emails for the selected users
  // Runs every day at 07:30 PM UTC (01:00 am IST)
  @Cron("30 19 * * *")
  async handleEnrollmentActivation() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    try {
      this.logInfo(
        "handleEnrollmentActivation",
        "Checking enrollments starting within 24hrs"
      );
      const now = new Date();
      const prev = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const maps = await this.employeePolicyMapRepo.find({
        where: { enrollmentStartDate: Between(prev, next) },
        relations: ["employee"],
      });

      const employees = maps
        .map((employees) => employees.employee)
        .filter(
          (e): e is PolicyEnrollmentEmployee =>
            !!e && !e.deletedAt && !!e.userId && !!e.email
        );

      const uniqueEmployees = Array.from(
        employees
          .reduce(
            (acc, emp) => acc.set(emp.id, emp),
            new Map<number, PolicyEnrollmentEmployee>()
          )
          .values()
      );

      if (!uniqueEmployees.length) {
        return;
      }

      const activeLookup = await this.lookUpRepository.findOne({
        where: { lookUpKey: USER_STATUS_ACTIVE },
      });

      const userIds = uniqueEmployees.map((e) => e.userId!);
      const users = await this.userRepo.find({
        where: { userId: In(userIds), deletedAt: IsNull() },
        select: ["userId", "userStatusKey"],
      });

      const activeUserIds: number[] = [];
      const toActivateUserIds: number[] = [];
      users.forEach((u) => {
        if (u.userStatusKey === USER_STATUS_ACTIVE) {
          activeUserIds.push(u.userId);
        } else {
          toActivateUserIds.push(u.userId);
        }
      });

      if (toActivateUserIds.length) {
        await this.userRepo.update(
          { userId: In(toActivateUserIds), deletedAt: IsNull() },
          {
            userStatusKey: USER_STATUS_ACTIVE,
            ...(activeLookup ? { statusLid: activeLookup.id } : {}),
          }
        );
      }

      const activatedEmployees = uniqueEmployees.filter((e) =>
        toActivateUserIds.includes(e.userId!)
      );

      await Promise.all(
        activatedEmployees.map((e) =>
          axios.post(
            `${ENV.URL_ORG_SERVICE}/employee/company-employee-password-reset-mail/${e.email}`,
            {},
            {
              headers: { 'x-bypass-timeout': 'true' },
            }
          )
        )
      );
    } catch (error) {
      this.logError("handleEnrollmentActivation", error);
    }
  }
  async processEnrollmentChoices(
    dependents: UpsertEnrollmentDependentDto[] = [],
    choosedPolicies: EnrollmentEmployeePolicyDto[] = [],
    employeeDetails: Partial<GetEmployeeDetails>,
    policyConfig: any
  ): Promise<{
    matchedComponents: any[];
    invalidComponents: EnrollmentEmployeePolicyDto[];
  }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "SchedulerService",
          method: "processEnrollmentChoices",
          payload: { },
          messageData: "Employee choices are: " + JSON.stringify(choosedPolicies),
        }),
      });
      const policyChoicesApplicable = this.filterPolicyOptions(
        employeeDetails,
        policyConfig,
        dependents
      );
      const data = {
        enrollmentChoicesMade: [],
        policyComponentsConfiguration: {
          components: policyConfig.components,
          parameters: policyConfig.parameters,
          availablePolicyChoices: policyChoicesApplicable,
        },
      };

      const config = data?.policyComponentsConfiguration as any;
      const availableChoices = config?.availablePolicyChoices;
      const components = config?.components || [];

      if (!availableChoices || Object.keys(availableChoices).length === 0) {
        return { matchedComponents: [], invalidComponents: choosedPolicies };
      }

      const componentById = new Map<number, any>();
      for (const component of components) {
        componentById.set(component.id, component);
      }

      const availableComponentMap = new Map<string, Map<number, any>>();
      const parentLabelToId: Record<string, number> = {};
      const collect = (section: any, parentId?: number) => {
        if (!section || !section.choices) return;
        const policyComponent = componentById.get(section.policyId);
        if (!policyComponent) return;
        const label = (policyComponent.label as string).toLowerCase();
        if (parentId === undefined) {
          parentLabelToId[label] = section.policyId;
        }
        const key = `${label}_${parentId ?? ""}`;
        let mapBySi = availableComponentMap.get(key);
        if (!mapBySi) {
          mapBySi = new Map<number, any>();
          availableComponentMap.set(key, mapBySi);
        }
        for (const choice of section.choices) {
          if (!choice.isAvailable) continue;
          const si = policyComponent.sumInsuredOptions?.find(
            (opt: any) => opt.id === choice.sumInsuredId
          );
          if (si) {
            mapBySi.set(Number(si.value), {
              component: policyComponent,
              choice,
              parentId,
            });
          }
        }
      };

      if (availableChoices.basePolicyChoices) {
        const baseMain = availableChoices.basePolicyChoices.mainPolicyChoices;
        collect(baseMain);
        for (const addon of availableChoices.basePolicyChoices.addonChoices ||
          []) {
          collect(addon, baseMain.policyId);
        }
      }
      if (availableChoices.parentalPolicyChoices) {
        const parentMain =
          availableChoices.parentalPolicyChoices.mainPolicyChoices;
        collect(parentMain);
        for (const addon of availableChoices.parentalPolicyChoices
          .addonChoices || []) {
          collect(addon, parentMain.policyId);
        }
      }

      const matchedComponents: Array<
        ReturnType<typeof this.mapAvailableChoice>
      > = [];
      const invalidComponents: EnrollmentEmployeePolicyDto[] = [];

      // Dependent-count SI enhancement is NOT baked into the persisted choice here
      // — it's computed fresh in updateEnrollmentStatus (via resolveDependentCountSiEnhancement)
      // from the current active dependents, same as validateComponentChoices
      // (enrollment-processing.util.ts). Baking it in here as well would double it,
      // since updateEnrollmentStatus always adds it on top of the raw choice sumInsured.
      for (const choice of choosedPolicies) {

        const parentIdLookup = choice.parentpolicyLabel
          ? parentLabelToId[choice.parentpolicyLabel.toLowerCase()]
          : undefined;
        const key = `${choice.policyLabel.toLowerCase()}_${
          parentIdLookup ?? ""
        }`;
        const mapBySi = availableComponentMap.get(key);
        const matched = mapBySi?.get(choice.sumInsuredValue);
        if (matched) {
          const mappedChoice = this.mapAvailableChoice(
            matched.component,
            matched.choice,
            matched.parentId
          );
          matchedComponents.push(mappedChoice);
        } else {
          invalidComponents.push(choice);
        }
      }

      return { matchedComponents, invalidComponents };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "scheduler-service EnrollmentUploadScheduler",
          method: "processEnrollmentChoices",
          payload: { dependents, choosedPolicies, employeeDetails },
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to process enrollment choices"
      );
    }
  }

  filterPolicyOptions(
    employeeDetails: Partial<GetEmployeeDetails>,
    policyConfig: any,
    dependents: UpsertEnrollmentDependentDto[] = []
  ) {
    // Check the existing dependents (not earlier saved dependents)
    const newDependentsForCountCheck = dependents.filter((dep) => !dep.id);

    for (let option of policyConfig.policyOptions) {
      let matchesAllConditions = true;

      for (let meta of option.optionMeta) {
        const paramDetails = policyConfig.parameters.find(
          (parameter: any) => parameter.id === meta.parameterId
        );

        const paramName = paramDetails.displayName;
        const employeeKey = this.convertToCamelCase(paramName.toLowerCase());
        const employeeValue = this.getEmployeeDetailsBasedOnProperties(
          employeeDetails,
          employeeKey,
          dependents
        );

        let isMatch = false;

        // 1. Handle relationship group details
        if (
          paramDetails.type?.toLocaleLowerCase() ===
            POLICY_RELATIONSHIP_TYPE_PARAMETER.toLocaleLowerCase() &&
          paramDetails.relationGroupDetails &&
          paramDetails.relationGroupDetails.length > 0
        ) {
          const relationGroupSelection =
            typeof employeeValue === DATA_TYPES.STRING
              ? employeeValue
              : undefined;
          const matchedGroup = paramDetails.relationGroupDetails.find(
            (relationGroupDetail: any) =>
              relationGroupDetail.id === meta.parameterOptionId
          );
          if (matchedGroup) {
            const { hasDisallowedRelation } = this.getEmployeeRelationTypes(
              dependents,
              policyConfig.relationships,
              policyConfig.constraints,
              employeeDetails.gender,
              relationGroupSelection,
              paramDetails.relationGroupDetails
            );
            const groupRelations = (matchedGroup.selectedRelations ?? [])
              .filter((selectedReation: any) => selectedReation.selected)
              .map((selectedReation: any) => selectedReation.name)
              .filter((name: any) => typeof name === DATA_TYPES.STRING)
              .map((name: string) => name.toLowerCase())
              .sort();
            if (!hasDisallowedRelation) {
              const selectionMatches =
                relationGroupSelection &&
                this.matchesRelationGroupSelection(
                  relationGroupSelection,
                  matchedGroup
                );
              if (selectionMatches) {
                isMatch = true;
              } else if (!relationGroupSelection) {
                const dependentRelations = dependents
                  .map(
                    (dependent) =>
                      dependent.relation ?? dependent.relationshipType ?? ""
                  )
                  .map((relation) => String(relation).toLowerCase().trim())
                  .filter((relation) => relation.length > 0);
                const employeeRelationSource = Array.from(
                  new Set(["self", ...dependentRelations])
                ).sort();
                const normalizedGroupRelations = new Set([
                  "self",
                  ...groupRelations,
                ]);

                isMatch = employeeRelationSource.every(
                  (employeeRelation: string) =>
                    normalizedGroupRelations.has(employeeRelation.toLowerCase())
                );
              }
            }
          }
        }
        // 2. Handle lovDetails (list of values)
        else if (
          paramDetails.lovDetails &&
          paramDetails.lovDetails.length > 0
        ) {
          const matchedLov = paramDetails.lovDetails.find(
            (lovDetail: any) => lovDetail.id === meta.parameterOptionId
          );
          const expectedValue = matchedLov?.value;

          if (
            String(employeeValue ?? "").toLowerCase() ===
            String(expectedValue ?? "").toLowerCase()
          ) {
            isMatch = true;
          }
        }

        // 2. Handle rangeDetails (min/max numeric or comparable values)
        else if (
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
                ? convertSafeStringToInteger(matchedRange?.min) ?? 0
                : matchedRange?.min) &&
            value <=
              (typeof matchedRange?.max === "string"
                ? convertSafeStringToInteger(matchedRange?.max) ?? 0
                : matchedRange?.max);
        }

        // 4. Handle dependent-count parameters (e.g. "Dependent Count" bands
        // like P1/P2 scoped to a relation category such as "Parents") — count
        // enrolled dependents of the target category and match against the
        // configured count bands. Without this branch, any policy with a
        // dependent-count parameter has no matching optionMeta condition, so
        // isMatch stays false and every policyOption (and therefore every
        // enrollment choice) is rejected regardless of actual dependent counts.
        else if (
          paramDetails.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
          paramDetails.internalType === DEPENDENT_COUNT_INTERNAL_TYPE
        ) {
          const dcConfig = paramDetails.dependentCountConfig;
          if (dcConfig?.countBands?.length) {
            const targetNorm = (dcConfig.targetRelationCategory ?? "")
              .toLowerCase()
              .trim()
              .replace(/[^a-z]/g, "");
            // "All" counts dependents only — the employee is never part of this count.
            const enrolledCount =
              targetNorm === DEPENDENT_COUNT_ALL_CATEGORY.toLowerCase()
                ? newDependentsForCountCheck.length
                : newDependentsForCountCheck.filter((dep: any) => {
                    const relNorm = String(dep.relation ?? dep.relationshipType ?? "")
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

  convertToCamelCase(str: string) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
        index === 0 ? match.toLowerCase() : match.toUpperCase()
      )
      .replace(/\s+/g, "") // Remove spaces
      .replace(/_/g, ""); // Remove underscores if any
  }

  private matchesRelationGroupSelection(
    selection: string,
    group: any
  ): boolean {
    const normalizedSelection = normalizeValue(String(selection ?? ""));
    const candidates = [
      group?.groupDisplayName,
      group?.name,
      group?.type,
      group?.relationGroupName,
    ];
    return candidates.some(
      (candidate) =>
        candidate && normalizeValue(String(candidate)) === normalizedSelection
    );
  }

  getEmployeeDetailsBasedOnProperties(
    employeeDetails: any,
    employeeKey: string,
    dependents: UpsertEnrollmentDependentDto[] = []
  ) {
    let normalizedAdditionalDetails: any = {};
    // prepare normalized map of the additional parameters;
    for (let key in employeeDetails.additionalDetails) {
      if (!Object.prototype.hasOwnProperty.call(employeeDetails.additionalDetails, key)) continue;
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      normalizedAdditionalDetails[key.replace(/[\s_]+/g, "").toLowerCase()] =
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
      Object.prototype.hasOwnProperty.call(
        normalizedAdditionalDetails,
        employeeKey.toLowerCase()
      ) &&
      !this.isEmptyAdditionalDetailValue(
        normalizedAdditionalDetails[employeeKey.toLowerCase()]
      )
    ) {
      return normalizedAdditionalDetails[employeeKey.toLowerCase()];
    } // Step 3: Handling the age property with the special case as we only have Date of birth
    else if (
      employeeKey.toLowerCase() === "age" &&
      employeeDetails.dateOfBirth
    ) {
      const dob = new Date(employeeDetails.dateOfBirth);
      const today = new Date(employeeDetails.effectiveDate) ?? new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    }
    // Step 4: employee carries no such additional property, fall back to the
    // additional details captured for the dependents from the upload row
    return this.getDependentAdditionalDetailValue(dependents, employeeKey);
  }

  private isEmptyAdditionalDetailValue(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      (typeof value === DATA_TYPES.STRING && value.trim() === "")
    );
  }

  // Employee additional details win; this is only consulted when the employee
  // has no usable value for the key. First dependent with a non-empty value wins.
  private getDependentAdditionalDetailValue(
    dependents: UpsertEnrollmentDependentDto[],
    employeeKey: string
  ) {
    const normalizedKey = employeeKey.replace(/[\s_]+/g, "").toLowerCase();
    for (const dependent of dependents) {
      const additionalAttributes = (dependent as any)?.additionalAttributes;
      if (!additionalAttributes) continue;
      for (const key in additionalAttributes) {
        if (!Object.prototype.hasOwnProperty.call(additionalAttributes, key)) continue;
        if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
        if (key.replace(/[\s_]+/g, "").toLowerCase() !== normalizedKey) continue;
        const value = additionalAttributes[key];
        if (!this.isEmptyAdditionalDetailValue(value)) {
          return value;
        }
      }
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
        hasDisallowedRelation,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "scheduler-service EnrollmentUploadScheduler",
          method: "getEmployeeRelationTypes",
          payload: { dependents, relationships },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to get employee relation types"
      );
    }
  }

  private mapAvailableChoice(component: any, choice: any, parentId?: number) {
    const sumInsured = component.sumInsuredOptions?.find(
      (opt: any) => opt.id === choice.sumInsuredId
    )?.value;
    return {
      sumInsured: Number(sumInsured),
      premium:
        Number(choice.companyContribution) +
        Number(choice.employeeContribution),
      companyPay: Number(choice.companyContribution),
      employeePay: Number(choice.employeeContribution),
      policyComponentActionType: component.type,
      policyComponentActionTypeId: component.id,
      policyComponentActionLabel: component.label,
      parentpolicyComponentActionTypeId: parentId ?? null,
      premiumPerLife: Boolean(component?.premiumPerLife),
      sumInsuredPerLife: Boolean(component?.sumInsuredPerLife),
      sumInsuredModel: component?.sumInsuredModel,
      sumInsuredModelProperty: component?.siMultipleLabel,
      minSumInsuredValue: component?.siMultipleMin,
      maxSumInsuredValue: component?.siMultipleMax,
      proRationEnabled: component?.proRationEnabled ?? true,
    };
  }

  private extractPolicyHeadersAndValues(
    mappings: any[] | undefined,
    headerValues: string[],
    rowObj: Record<string, string>
  ): { headers: string[], rowObj: Record<string, string> } {
    if (Array.isArray(mappings) && mappings.length > 0) {
      const transformedHeaders = [];
      const transformedRowObj: Record<string, string> = {};
      for (const header of headerValues) {
        const foundMapping = mappings.find((m: any) => normalizeHeader(m.source_column_name) === normalizeHeader(header));
        if (foundMapping) {
          const targetColumn = foundMapping.target_column_name;
          transformedHeaders.push(snakeToTitle(targetColumn));
          transformedRowObj[snakeToTitle(targetColumn)] = rowObj[header];
        }
        else {
          transformedHeaders.push(header);
          transformedRowObj[header] = rowObj[header];
        }
      }

      return { headers: transformedHeaders, rowObj: transformedRowObj };
    } else {
      // Default: headerValues and rowValues are the same
      return { headers: headerValues, rowObj: rowObj };
    }
  }

  private extractPolicies(
    headers: string[],
    row: (string | number)[],
  ): EnrollmentEmployeePolicyDto[] {
    const policies: EnrollmentEmployeePolicyDto[] = [];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = row[i];

      // Skip if not a policy flag (e.g., not "yes" or "yes ")
      if (
        typeof value !== "string" ||
        value.toLowerCase().trim() !== "yes" ||
        !header.toLowerCase().includes("policy")
      ) {
        continue;
      }

      // Extract policy and parent labels
      let policyLabel = header.trim();
      let parentpolicyLabel: string | undefined;
      const addonMatch = header.match(/^(.*)Addon\s*-\s*(.*)$/i);
      if (addonMatch) {
        parentpolicyLabel = addonMatch[1].replace(/[-\s]+$/, "").trim();
        policyLabel = addonMatch[2].trim();
      }

      // Find matching sum insured in next column
      const sumInsured = row[i + 1];
      const sumInsuredValue = convertSafeStringToInteger(sumInsured);
      if (sumInsuredValue) {
        policies.push({
          policyLabel,
          sumInsuredValue,
          parentpolicyLabel,
        });
      }
    }

    return policies;
  }

  private extractPolicyChoices(headers: any, rowObj: any) {
    const policiesMap = new Map();

    for (const header of headers) {
      const lowerHeader = header.toLowerCase();

     // Header must contain both "policy" and "sum insured"
      // if (!lowerHeader.includes("policy") || !lowerHeader.includes("sum insured")) {
      //   continue;
      // }
      if (!lowerHeader.includes("sum insured")) {
        continue;
      }

      let sumInsuredValue = rowObj[header];

      // Convert empty or undefined values to 0
      if (sumInsuredValue === "" || sumInsuredValue === undefined || sumInsuredValue === null) {
        // sumInsuredValue = 0;
        continue; // Skip policies without a valid sum insured value
      }

      if (isNaN(Number(sumInsuredValue))) continue;

      let policyLabel = header.trim();
      let parentpolicyLabel: string | undefined;

      const addonMatch = header.match(/^(.*)Addon\s*-\s*(.*)$/i);

      if (addonMatch) {
        parentpolicyLabel = addonMatch[1].replace(/[-\s]+$/, "").trim();
        policyLabel = addonMatch[2].trim();
      }

      policyLabel = policyLabel.replace(/sum insured/i, "").trim();

      const key = `${parentpolicyLabel || ""}_${policyLabel}`;

      if (!policiesMap.has(key)) {
        policiesMap.set(key, {
          policyLabel,
          sumInsuredValue: Number(sumInsuredValue),
          parentpolicyLabel,
        });
      }
    }

    return Array.from(policiesMap.values());
  }

  private transformToPolicyEnrollmentEmployees(
    employeeDetails: any[],
    normalizedMap: Record<string, keyof PolicyEnrollmentEmployee>
  ): Partial<PolicyEnrollmentEmployee>[] {
    const normalizeHeader = (h: string) => h.toLowerCase().replace(/[\s_-]+/g, "");
    return employeeDetails.map((detail) => {
      const rowObj = detail.rowObj;
      const result: Partial<PolicyEnrollmentEmployee> = {
        additionalParams: {},
      };

      // Populate fields using normalized map
      for (const [headerKey, objectKey] of Object.entries(normalizedMap)) {
        for (const rowKey in rowObj) {
          if (!Object.prototype.hasOwnProperty.call(rowObj, rowKey)) continue;
          if (
            normalizeHeader(rowKey) === headerKey
          ) {
            result[objectKey] = rowObj[rowKey];
          }
        }
      }

      // Add additionalParams
      if (detail.companyEmployee?.additionalParams) {
        result.additionalParams = detail.companyEmployee.additionalParams;
      }
      return result;
    });
  }

  private mapCompanyEmployeeDetails(
    employeeDetails: Partial<PolicyEnrollmentEmployee>
  ): Partial<GetEmployeeDetails> {
    return {
      additionalDetails: employeeDetails.additionalParams || {},
      employeeName: employeeDetails.employeeName ?? "",
      dateOfBirth: employeeDetails.dateOfBirth
        ? typeof employeeDetails.dateOfBirth === "string"
          ? employeeDetails.dateOfBirth
          : new Date(employeeDetails.dateOfBirth)
              .toLocaleDateString()
              .split("T")[0]
        : undefined,
      designation: employeeDetails.designation ?? "",
      email: employeeDetails.email ?? "",
      phone: employeeDetails.phoneNumber ?? "",
      maritalStatus: employeeDetails.maritalStatus ?? "",
      fullName: employeeDetails.employeeName,
      gender: employeeDetails.gender ?? "",
      relationGroup:
        employeeDetails.relationGroup ??
        (employeeDetails.additionalParams as any)?.["Relationship Group"] ??
        (employeeDetails.additionalParams as any)?.["relationshipgroup"],
    };
  }

  private normalizeClaimStatusValue(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (typeof value === "number") {
      return value === 1 ? "Yes" : "No";
    }
    const trimmed = String(value).trim();
    if (!trimmed) {
      return null;
    }
    const lowered = trimmed.toLowerCase();
    if (["yes", "y", "true", "1"].includes(lowered)) {
      return "Yes";
    }
    if (["no", "n", "false", "0"].includes(lowered)) {
      return "No";
    }
    return trimmed;
  }

  private isPhoneAuthMethod(method: string | null): boolean {
    return ["PHONE_OTP", "PHONE_PASSWORD"].includes(method ?? "");
  }

  private isEmailAuthMethod(method: string | null): boolean {
    return ["EMAIL_OTP", "EMAIL_PASSWORD"].includes(method ?? "");
  }

  private async getCompanyAuthenticationMethod(
    companyId: number
  ): Promise<string | null> {
    const mapping = await this.companyAuthenticationMapRepo.findOne({
      where: { companyId, configId: IsNull(), isEnabled: true },
      relations: { authenticationMethod: true },
      order: { displayOrder: "ASC" },
    });

    if (mapping?.authenticationMethod?.methodCode) {
      return mapping.authenticationMethod.methodCode;
    }

    if (mapping?.authenticationMethodId) {
      const authMethod = await this.authenticationMethodRepo.findOne({
        where: { id: mapping.authenticationMethodId },
      });

      if (authMethod?.methodCode) {
        return authMethod.methodCode;
      }
    }

    return null;
  }

  private readonly DEPENDENT_STANDARD_KEYS = new Set([
    'employeeid', 'fullname', 'employeename', 'dateofbirth',
    'gender', 'email', 'mobilenumber', 'phonenumber',
    'relation', 'relationshiptype', 'relationshipgroup', 'relationgroup',
    'effectivedate', 'claimstatus', 'intaketype', 'policylocation',
    'remarks', 'bypasspremiumamount', 'bypasssuminsured',
  ]);

  private extractDependentAdditionalAttributes(
    rowObj: Record<string, any>
  ): Record<string, any> | undefined {
    const attrs: Record<string, any> = {};
    for (const [key, val] of Object.entries(rowObj)) {
      if (val === null || val === undefined || val === '') continue;
      const norm = key.toLowerCase().replace(/[\s_-]+/g, '');
      if (this.DEPENDENT_STANDARD_KEYS.has(norm)) continue;
      if (norm.includes('policy')) continue;
      attrs[key] = val;
    }
    return Object.keys(attrs).length > 0 ? attrs : undefined;
  }

  private mapDependentEntity(
    dep: Partial<PolicyEnrollmentDependent>,
    rowObj?: Record<string, any>
  ): UpsertEnrollmentDependentDto {
    return {
      id: dep.id,
      name: dep.name ?? "",
      relation: dep.relation ?? "",
      relationshipType: dep.relationshipType,
      dateOfBirth: this.toDateOnlyString(
        typeof dep.dateOfBirth === "string"
          ? this.parseExcelDate(dep.dateOfBirth)
          : dep.dateOfBirth
      ),
      gender: dep.gender,
      effectiveDate: this.toDateOnlyString(
        typeof dep.effectiveDate === "string"
          ? this.parseExcelDate(dep.effectiveDate)
          : dep.effectiveDate
      ),
      enrollmentAdditionBatchId: dep.enrollmentAdditionBatchId ?? undefined,
      claimStatus: this.normalizeClaimStatusValue(dep.claimStatus),
      // Prefer the additional details from the upload row; keep whatever the
      // dependent already carries when no row is available for it
      additionalAttributes:
        (rowObj ? this.extractDependentAdditionalAttributes(rowObj) : undefined) ??
        dep.additionalAttributes,
    };
  }

  private normalizeToStartOfDay(value: Date | string): Date {
    const date =
      value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private isDateWithinRange(
    target: Date,
    rangeStart: Date,
    rangeEnd: Date
  ): boolean {
    const normalizedTarget = this.normalizeToStartOfDay(target);
    return (
      normalizedTarget.getTime() >= rangeStart.getTime() &&
      normalizedTarget.getTime() <= rangeEnd.getTime()
    );
  }

  private toDateOnlyString(
    value: Date | string | null | undefined
  ): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  }

  async login(loginName: string, password: string) {
    try {
      const user = await this.findByLoginNameOrEmail(loginName);
      if (user && (await this.isPasswordMatch(password, user.password ?? ""))) {
        const accessToken = await this.getTokens(user as User);
        return { accessToken };
      }
      throw new ForbiddenException("Invalid credentials or user not found.");
    } catch (error) {
      this.logError("login", error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error("Invalid credentials or user not found.");
    }
  }

  async findByLoginNameOrEmail(loginName: string) {
    try {
      const user = await this.userRepo.findOne({
        where: [{ emailId: loginName }, { loginName: loginName }],
        relations: ["userRoles", "userRoles.role"],
      });
      if (user) {
        const roles = (user.userRoles || [])
          .filter((userRole) => userRole?.role)
          .map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
          }));
        return {
          userId: user.userId,
          salutation: user.salutation,
          firstName: user.firstName,
          lastName: user.lastName,
          emailId: user.emailId,
          mobile: user.mobile,
          password: user.password,
          roles,
        };
      }
      throw new BadRequestException(
        "User not found with the provided login name or email."
      );
    } catch (error) {
      this.logError("findByLoginNameOrEmail", error);
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "An error occurred while fetching user details."
      );
    }
  }

  async isPasswordMatch(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async getTokens(
    userDetails: User
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      if (!userDetails) {
        throw new ForbiddenException(
          "User details are required to generate tokens."
        );
      }

      if (!userDetails.userId) {
        throw new ForbiddenException("User ID is missing in user details.");
      }

      const payload = {
        userDetails: {
          departmentId: userDetails.departmentId,
          emailId: userDetails.emailId,
          userId: userDetails.userId,
          iirmId: userDetails.iirmEmpId,
          roles: (userDetails as any).roles,
        },
      };

      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: ENV.JWT_EXPIRATION,
      });

      const refreshToken = await this.jwtService.signAsync(payload, {
        expiresIn: ENV.JWT_REFRESH_EXPIRATION,
      });

      return { accessToken, refreshToken };
    } catch (error) {
      this.logError("getTokens", error);
      throw new ForbiddenException(
        error instanceof Error
          ? error.message
          : "An error occurred while generating tokens."
      );
    }
  }

  private async processAssetEnrollmentUpload(upload: DocumentProcessingFile) {
    this.logInfo(
      "processAssetEnrollmentUpload",
      `Processing asset enrollment upload with ID: ${upload.id}`
    );
    await this.uploadRepo.update(upload.id, {
      processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
    });
    try {
      if (!upload.endorsementId) {
        throw new BadRequestException(
          "Endorsement ID is required for asset enrollment uploads"
        );
      }

      const file = await this.fileRepo.findOne({
        where: { id: upload.documentId },
      });

      if (!file) {
        throw new NotFoundException(
          `File not found for document ID: ${upload.documentId}`
        );
      }

      const policy = await this.policyRepo.findOne({
        where: { id: upload.entityId },
      });

      if (!policy) {
        throw new NotFoundException(
          `Policy not found for ID ${upload.entityId}`
        );
      }

      const endorsementRecord = await this.policyAssetEndorsementRepo.findOne({
        where: { id: upload.endorsementId },
      });

      if (!endorsementRecord) {
        throw new NotFoundException(
          `Asset endorsement not found for ID ${upload.endorsementId}`
        );
      }

      const buffer = await downloadFromS3(file.fileKey);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rowsData: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
        dateNF: "yyyy-mm-dd",
      });

      const headers: string[] =
        rowsData[0]?.map((h: any) => String(h).trim()) ?? [];
      const normalizeHeader = (h: string) =>
        h.toLowerCase().replace(/[\s_]+/g, "");

      const intakeIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.INTAKE_TYPE
      );
      const coverCodeIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.COVER_CODE
      );
      const riskLocationTypeIdx = headers.findIndex(
        (h) =>
          normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.RISK_LOCATION_TYPE
      );
      const riskLocationDetailIdx = headers.findIndex(
        (h) =>
          normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.RISK_LOCATION_DETAIL
      );
      const categoryIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.CATEGORY
      );
      const coverageTypeIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.COVERAGE_TYPE
      );
      const quantityIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.QUANTITY
      );
      const uomIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.UOM
      );
      const rateIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.RATE
      );
      const sumInsuredIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.SUM_INSURED
      );
      const premiumIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.PREMIUM
      );
      const isMainAssetIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.IS_MAIN_ASSET
      );
      const subLimitIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.SUB_LIMIT_AMOUNT
      );
      const effectiveDateIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.EFFECTIVE_DATE
      );

      const subLimitDescriptionIdx = headers.findIndex(
        (h) =>
          normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.SUB_LIMIT_DESCRIPTION
      );

      const subLimitTypeIdx = headers.findIndex(
        (h) => normalizeHeader(h) === ASSET_ENDORSEMENT_HEADERS.SUB_LIMIT_TYPE
      );

      type AssetUploadRow = {
        coverCode: string;
        // intakeType: "addition" | "deletion" | "inception";
        intakeType: string;
        isMainAsset: boolean;
        riskLocationType?: string;
        riskLocationDetail?: string;
        category?: string;
        coverageType?: string;
        quantity?: number;
        uom?: string;
        rate?: string | null;
        sumInsured?: number | null;
        premium?: number | null;
        subLimitAmount?: number | null;
        subLimitDescription?: string;
        subLimitType?: string;
        effectiveDate?: Date | null;
        rawRow: Record<string, any>;
      };

      const parseNumeric = (value: any): number | null => {
        if (value === null || value === undefined || value === "") {
          return null;
        }
        const normalized = String(value).replace(/,/g, "").trim();
        if (!normalized) {
          return null;
        }
        const num = Number(normalized);
        return Number.isFinite(num) ? num : null;
      };

      const parseBoolean = (value: any): boolean => {
        if (typeof value === DATA_TYPES.BOOLEAN) {
          return value;
        }
        const normalized = String(value ?? "")
          .trim()
          .toLowerCase();
        return ["true", "yes", "1"].includes(normalized);
      };

      const rows: AssetUploadRow[] = [];
      const errors: Record<string, any>[] = [];
      const successRows: Record<string, any>[] = [];

      for (let i = 1; i < rowsData.length; i++) {
        const values = rowsData[i];
        if (
          !values.some((cell) => {
            if (cell === null || cell === undefined) return false;
            if (typeof cell === DATA_TYPES.STRING) {
              return cell.trim().length > 0;
            }
            return true;
          })
        ) {
          continue;
        }

        const rowObj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx];
        });

        const rawCoverCode =
          coverCodeIdx !== -1 ? values[coverCodeIdx] ?? "" : "";
        const coverCode = String(rawCoverCode).trim();
        if (!coverCode) {
          errors.push({ ...rowObj, Remarks: "Cover code is required" });
          continue;
        }

        const rawIntake =
          intakeIdx !== -1 ? String(values[intakeIdx] ?? "").trim() : "";
        const normalizedIntake = rawIntake.toLowerCase();
        let intakeType: string;
        if (
          !normalizedIntake ||
          normalizedIntake === DATA_INTAKE_TYPE.ADDITION
        ) {
          intakeType = DATA_INTAKE_TYPE.ADDITION;
        } else if (normalizedIntake === DATA_INTAKE_TYPE.INCEPTION) {
          intakeType = DATA_INTAKE_TYPE.INCEPTION;
        } else if (
          normalizedIntake === DATA_INTAKE_TYPE.DELETION ||
          normalizedIntake === "delete"
        ) {
          intakeType = DATA_INTAKE_TYPE.DELETION;
        } else {
          errors.push({
            ...rowObj,
            Remarks: `Invalid intake type '${rawIntake}'`,
          });
          continue;
        }

        const isMainAsset =
          isMainAssetIdx !== -1 ? parseBoolean(values[isMainAssetIdx]) : false;

        const riskLocationType =
          riskLocationTypeIdx !== -1
            ? String(values[riskLocationTypeIdx] ?? "").trim() || undefined
            : undefined;
        const riskLocationDetail =
          riskLocationDetailIdx !== -1
            ? String(values[riskLocationDetailIdx] ?? "").trim() || undefined
            : undefined;
        const category =
          categoryIdx !== -1
            ? String(values[categoryIdx] ?? "").trim() || undefined
            : undefined;
        const coverageType =
          coverageTypeIdx !== -1
            ? String(values[coverageTypeIdx] ?? "").trim() || undefined
            : undefined;
        const uom =
          uomIdx !== -1
            ? String(values[uomIdx] ?? "").trim() || undefined
            : undefined;
        const rate =
          rateIdx !== -1 ? String(values[rateIdx] ?? "").trim() || null : null;
        const quantityNumeric =
          quantityIdx !== -1 ? parseNumeric(values[quantityIdx]) : null;
        const sumInsured =
          sumInsuredIdx !== -1 ? parseNumeric(values[sumInsuredIdx]) : null;
        const premium =
          premiumIdx !== -1 ? parseNumeric(values[premiumIdx]) : null;
        const subLimitAmount =
          subLimitIdx !== -1 ? parseNumeric(values[subLimitIdx]) : null;
        const subLimitDescription =
          subLimitDescriptionIdx !== -1
            ? String(values[subLimitDescriptionIdx] ?? "").trim() || undefined
            : undefined;
        const subLimitType =
          subLimitTypeIdx !== -1
            ? String(values[subLimitTypeIdx] ?? "").trim() || undefined
            : undefined;
        const effectiveDateValue =
          effectiveDateIdx !== -1 ? values[effectiveDateIdx] : undefined;
        const effectiveDate = this.parseExcelDate(effectiveDateValue);

        rows.push({
          coverCode,
          intakeType,
          isMainAsset,
          riskLocationType,
          riskLocationDetail,
          category,
          coverageType,
          quantity:
            quantityNumeric !== null && Number.isFinite(quantityNumeric)
              ? quantityNumeric
              : undefined,
          uom,
          rate,
          sumInsured,
          premium,
          subLimitAmount,
          subLimitDescription,
          subLimitType,
          effectiveDate,
          rawRow: rowObj,
        });
      }

      if (!rows.length) {
        this.logInfo("processAssetEnrollmentUpload", {
          message: "No valid rows found in asset enrollment file",
          uploadId: upload.id,
        });
      }

      const mainAssetRows = rows.filter((r) => r.isMainAsset);
      const subAssetRows = rows.filter((r) => !r.isMainAsset);
      const mainAssetCoverCodes = new Set(
        mainAssetRows.map((assetRow) => assetRow.coverCode)
      );
      const existingActiveAssetMaps =
        await this.policyAssetEndorsementMapRepo.find({
          where: {
            policyId: upload.entityId,
            endorsementDeletionId: IsNull(),
          },
          select: ["coverCode"],
        });
      for (const m of existingActiveAssetMaps) {
        if (m.coverCode) {
          mainAssetCoverCodes.add(m.coverCode);
        }
      }
      const policyFrom = new Date(policy.policyFrom as any);
      const policyTo = new Date(policy.policyTo as any);
      if (
        Number.isNaN(policyFrom.getTime()) ||
        Number.isNaN(policyTo.getTime())
      ) {
        throw new BadRequestException(
          "Invalid policy period configured for asset endorsement processing"
        );
      }
      policyFrom.setHours(0, 0, 0, 0);
      policyTo.setHours(0, 0, 0, 0);

      const msPerDay = 24 * 60 * 60 * 1000;
      const totalPolicyDays = Math.max(
        0,
        Math.floor((policyTo.getTime() - policyFrom.getTime()) / msPerDay) + 1
      );

      const resolveAdditionEffectiveDate = (value?: Date | null): Date => {
        if (!value) {
          return new Date(policyFrom);
        }
        const normalized = new Date(value);
        normalized.setHours(0, 0, 0, 0);
        if (normalized < policyFrom) {
          return new Date(policyFrom);
        }
        if (normalized > policyTo) {
          return new Date(policyTo);
        }
        return normalized;
      };

      const resolveDeletionEffectiveDate = (value?: Date | null): Date => {
        if (!value) {
          return new Date(policyTo);
        }
        const normalized = new Date(value);
        normalized.setHours(0, 0, 0, 0);
        if (normalized < policyFrom) {
          return new Date(policyFrom);
        }
        if (normalized > policyTo) {
          return new Date(policyTo);
        }
        return normalized;
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

      const calculatePremiumPortion = (
        premiumAmount: number | null | undefined,
        effective: Date
      ): number => {
        if (!premiumAmount || totalPolicyDays <= 0) {
          return 0;
        }
        const perDay = premiumAmount / totalPolicyDays;
        return perDay * calculateRemainingDays(effective);
      };

      const assetCache = new Map<string, PolicyAsset>();
      const subAssetCache = new Map<string, PolicySubAsset>();

      const hasMatchingMainAssetForSubAsset = (
        row: AssetUploadRow
      ): boolean => {
        if (!mainAssetCoverCodes.has(row.coverCode)) {
          errors.push({
            ...row.rawRow,
            Remarks:
              "No active main asset mapping found for the sub-asset cover code",
          });
          return false;
        }
        return true;
      };

      let assetAdditionCount = 0;
      let assetDeletionCount = 0;
      let subAssetAdditionCount = 0;
      let subAssetDeletionCount = 0;
      let additionPremiumTotal = 0;
      let deletionPremiumTotal = 0;

      const ensurePolicyAsset = async (
        row: AssetUploadRow
      ): Promise<PolicyAsset | null> => {
        const cached = assetCache.get(row.coverCode);
        if (cached) {
          return cached;
        }
        let asset = await this.policyAssetRepo.findOne({
          where: { coverCode: row.coverCode },
        });
        if (!asset) {
          const missingFields: string[] = [];
          if (!row.riskLocationType) {
            missingFields.push("Risk Location Type");
          }
          if (!row.category) {
            missingFields.push("Category");
          }
          if (!row.coverageType) {
            missingFields.push("Coverage Type");
          }
          if (!row.uom) {
            missingFields.push("UOM");
          }
          if (missingFields.length) {
            errors.push({
              ...row.rawRow,
              Remarks: `Missing required value(s): ${missingFields.join(", ")}`,
            });
            return null;
          }
          asset = await this.policyAssetRepo.save(
            this.policyAssetRepo.create({
              coverCode: row.coverCode,
              riskLocationType: row.riskLocationType!,
              riskLocationDetails: row.riskLocationDetail ?? null,
              category: row.category!,
              coverageType: row.coverageType!,
              quantity: Number(row.quantity ?? 0),
              uom: row.uom!,
            })
          );
        }
        assetCache.set(row.coverCode, asset);
        return asset;
      };

      const buildSubAssetDescription = (row: AssetUploadRow): string | null => {
        const parts = [row.riskLocationDetail, row.category, row.coverageType]
          .map((part) => (part ? String(part).trim() : ""))
          .filter((part) => part.length > 0);
        if (!parts.length) {
          return null;
        }
        return parts.join(" | ");
      };

      const resolveSubAssetDescription = (
        row: AssetUploadRow
      ): string | null => {
        const provided = row.subLimitDescription;
        if (provided !== undefined && provided !== null) {
          const normalized = String(provided).trim();
          if (normalized.length > 0) {
            return normalized;
          }
        }
        const built = buildSubAssetDescription(row);
        if (built) {
          const normalizedBuilt = built.trim();
          if (normalizedBuilt.length > 0) {
            return normalizedBuilt;
          }
        }
        return null;
      };

      const ensurePolicySubAsset = async (
        row: AssetUploadRow
      ): Promise<{
        entity: PolicySubAsset | null;
        description: string | null;
      }> => {
        const description = resolveSubAssetDescription(row);
        if (!description) {
          errors.push({
            ...row.rawRow,
            Remarks: infoMessages.missingSubassetDescription,
          });
          return { entity: null, description: null };
        }

        const cacheKey = `${row.coverCode}::${description.toLowerCase()}`;
        const cached = subAssetCache.get(cacheKey);
        if (cached) {
          return { entity: cached, description };
        }
        let subAsset = await this.policySubAssetRepo.findOne({
          where: {
            mainCoverCode: row.coverCode,
            subCoverDescription: description,
          },
        });
        if (!subAsset) {
          subAsset = await this.policySubAssetRepo.save(
            this.policySubAssetRepo.create({
              mainCoverCode: row.coverCode,
              subCoverDescription: description,
              subLimitType: row.subLimitType,
            })
          );
        }
        subAssetCache.set(cacheKey, subAsset);
        return { entity: subAsset, description };
      };

      const processAssetAddition = async (row: AssetUploadRow) => {
        const asset = await ensurePolicyAsset(row);
        if (!asset) {
          return;
        }
        const existingMap = await this.policyAssetEndorsementMapRepo.findOne({
          where: {
            policyId: upload.entityId,
            coverCode: row.coverCode,
            endorsementDeletionId: IsNull(),
          },
        });
        if (existingMap) {
          errors.push({
            ...row.rawRow,
            Remarks: "Asset already mapped to this policy",
          });
          return;
        }

        const effectiveDate = resolveAdditionEffectiveDate(row.effectiveDate);
        additionPremiumTotal += calculatePremiumPortion(
          row.premium,
          effectiveDate
        );

        await this.policyAssetEndorsementMapRepo.save(
          this.policyAssetEndorsementMapRepo.create({
            policyId: Number(upload.entityId ?? 0),
            coverCode: row.coverCode,
            endorsementAdditionBatchId: upload.documentId,
            endorsementDeletionBatchId: 0,
            endorsementStatus: ASSET_ENDORSEMENT_READY,
            effectiveDate,
            deletionEffectiveDate: new Date(policyTo),
            rate: row.rate ?? null,
            sumInsured: row.sumInsured ?? null,
            premium: row.premium ?? null,
            endorsementAdditionId: upload.endorsementId,
            endorsementDeletionId: null,
          })
        );

        successRows.push({
          ...row.rawRow,
          Remarks: "Processed",
        });
        assetAdditionCount += 1;
      };

      const processAssetDeletion = async (row: AssetUploadRow) => {
        let existingAsset = assetCache.get(row.coverCode);
        if (!existingAsset) {
          existingAsset =
            (await this.policyAssetRepo.findOne({
              where: { coverCode: row.coverCode },
            })) ?? undefined;
          if (existingAsset) {
            assetCache.set(row.coverCode, existingAsset);
          }
        }

        if (!existingAsset) {
          errors.push({
            ...row.rawRow,
            Remarks: "Invalid cover code: asset not present in policy records",
          });
          return;
        }

        const activeMap = await this.policyAssetEndorsementMapRepo.findOne({
          where: {
            policyId: Number(upload.entityId ?? 0),
            coverCode: row.coverCode,
            endorsementDeletionId: IsNull(),
          },
        });

        if (!activeMap) {
          const existing = await this.policyAssetEndorsementMapRepo.findOne({
            where: {
              policyId: upload.entityId,
              coverCode: row.coverCode,
            },
          });
          if (existing?.endorsementDeletionId) {
            errors.push({
              ...row.rawRow,
              Remarks: "Asset already marked as deleted",
            });
          } else {
            errors.push({
              ...row.rawRow,
              Remarks:
                "Asset not added earlier as part of addition/inception endorsement process",
            });
          }
          return;
        }

        if (!activeMap.endorsementAdditionId) {
          errors.push({
            ...row.rawRow,
            Remarks:
              "Asset not added earlier as part of addition/inception endorsement process",
          });
          return;
        }

        const deletionDate = resolveDeletionEffectiveDate(row.effectiveDate);
        deletionPremiumTotal += calculatePremiumPortion(
          row.premium,
          deletionDate
        );

        await this.policyAssetEndorsementMapRepo.update(activeMap.id, {
          endorsementDeletionBatchId: upload.documentId,
          endorsementDeletionId: upload.endorsementId,
          deletionEffectiveDate: deletionDate,
          endorsementStatus: ASSET_ENDORSEMENT_READY,
          rate: row.rate ?? activeMap.rate ?? "",
          sumInsured: row.sumInsured ?? activeMap.sumInsured ?? 0,
          premium: row.premium ?? activeMap.premium ?? 0,
        });

        successRows.push({
          ...row.rawRow,
          Remarks: "Marked for deletion",
        });
        assetDeletionCount += 1;
      };

      const processSubAssetAddition = async (row: AssetUploadRow) => {
        if (!hasMatchingMainAssetForSubAsset(row)) {
          return;
        }
        const { entity: subAsset, description } = await ensurePolicySubAsset(
          row
        );
        if (!subAsset || !description) {
          return;
        }

        const existingMap = await this.policySubAssetEndorsementMapRepo.findOne(
          {
            where: {
              policyId: upload.entityId,
              coverCode: row.coverCode,
              subAssetId: subAsset.id,
              endorsementDeletionId: IsNull(),
            },
          }
        );
        if (existingMap) {
          errors.push({
            ...row.rawRow,
            Remarks: "Sub-asset already mapped to this policy",
          });
          return;
        }

        const effectiveDate = resolveAdditionEffectiveDate(row.effectiveDate);
        additionPremiumTotal += calculatePremiumPortion(
          row.premium,
          effectiveDate
        );

        await this.policySubAssetEndorsementMapRepo.save(
          this.policySubAssetEndorsementMapRepo.create({
            policyId: Number(upload.entityId ?? 0) ?? 0,
            coverCode: row.coverCode,
            subAssetId: subAsset.id,
            endorsementAdditionBatchId: upload.documentId,
            endorsementDeletionBatchId: 0,
            endorsementStatus: ASSET_ENDORSEMENT_READY,
            effectiveDate,
            deletionEffectiveDate: new Date(policyTo),
            subLimitAmount: row.subLimitAmount ?? 0,
            endorsementAdditionId: upload.endorsementId,
            endorsementDeletionId: null,
          })
        );

        successRows.push({
          ...row.rawRow,
          Remarks: "Processed",
        });
        subAssetAdditionCount += 1;
      };

      const processSubAssetDeletion = async (row: AssetUploadRow) => {
        if (!hasMatchingMainAssetForSubAsset(row)) {
          return;
        }
        const description = resolveSubAssetDescription(row);
        if (!description) {
          errors.push({
            ...row.rawRow,
            Remarks: "Unable to determine sub-asset description",
          });
          return;
        }
        const subAsset = await this.policySubAssetRepo.findOne({
          where: {
            mainCoverCode: row.coverCode,
            subCoverDescription: description,
          },
        });
        if (!subAsset) {
          errors.push({
            ...row.rawRow,
            Remarks:
              "Invalid cover code: sub-asset not present in policy records",
          });
          return;
        }

        const activeMap = await this.policySubAssetEndorsementMapRepo.findOne({
          where: {
            policyId: upload.entityId,
            coverCode: row.coverCode,
            subAssetId: subAsset.id,
            endorsementDeletionId: IsNull(),
          },
        });

        if (!activeMap) {
          const existing = await this.policySubAssetEndorsementMapRepo.findOne({
            where: {
              policyId: upload.entityId,
              coverCode: row.coverCode,
              subAssetId: subAsset.id,
            },
          });
          if (existing && existing.endorsementDeletionId) {
            errors.push({
              ...row.rawRow,
              Remarks: "Sub-asset already marked as deleted",
            });
          } else {
            errors.push({
              ...row.rawRow,
              Remarks:
                "Sub-asset not added earlier as part of addition/inception endorsement process",
            });
          }
          return;
        }

        if (!activeMap.endorsementAdditionId) {
          errors.push({
            ...row.rawRow,
            Remarks:
              "Sub-asset not added earlier as part of addition/inception endorsement process",
          });
          return;
        }

        const deletionDate = resolveDeletionEffectiveDate(row.effectiveDate);
        deletionPremiumTotal += calculatePremiumPortion(
          row.premium,
          deletionDate
        );

        const updateResult = await this.policySubAssetEndorsementMapRepo.update(
          activeMap.id,
          {
            endorsementDeletionBatchId: upload.documentId,
            endorsementDeletionId: upload.endorsementId,
            deletionEffectiveDate: deletionDate,
            endorsementStatus: ASSET_ENDORSEMENT_READY,
            subLimitAmount: row.subLimitAmount ?? activeMap.subLimitAmount ?? 0,
          }
        );

        if (!updateResult.affected) {
          errors.push({
            ...row.rawRow,
            Remarks: infoMessages.subAssetDeletionMarkFailed,
          });
          return;
        }

        successRows.push({
          ...row.rawRow,
          Remarks: "Marked for deletion",
        });
        subAssetDeletionCount += 1;
      };
      const isAdditionIntake = (intakeType: string) =>
        intakeType === DATA_INTAKE_TYPE.ADDITION ||
        intakeType === DATA_INTAKE_TYPE.INCEPTION;
      for (const row of mainAssetRows) {
        if (isAdditionIntake(row.intakeType)) {
          await processAssetAddition(row);
        } else {
          await processAssetDeletion(row);
        }
      }

      for (const row of subAssetRows) {
        if (isAdditionIntake(row.intakeType)) {
          await processSubAssetAddition(row);
        } else {
          await processSubAssetDeletion(row);
        }
      }

      const assetCount = assetAdditionCount + assetDeletionCount;
      const subAssetCount = subAssetAdditionCount + subAssetDeletionCount;
      const totalAdditionCount = assetAdditionCount + subAssetAdditionCount;
      const totalDeletionCount = assetDeletionCount + subAssetDeletionCount;
      const netPremium = Number(
        (additionPremiumTotal - deletionPremiumTotal).toFixed(2)
      );

      let errorFileId: number | null = null;
      if (errors.length) {
        const errorBuffer = await generateExcel(errors);
        const errorFileSizeBytes = errorBuffer.length;
        const errorFileSizeFormatted = formatSize(errorFileSizeBytes);

        const errorKey = `uploads/company/${
          file.entityType
        }/errorfiles/policy-${upload.entityId}-asset-errors-${Date.now()}.xlsx`;
        try {
          await uploadToS3(
            errorBuffer,
            errorKey,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          const savedErrorFile = await this.fileRepo.save(
            this.fileRepo.create({
              fileKey: errorKey,
              entityType: file.entityType,
              entityId: file.entityId,
              uploadType: "AWS",
              documentTypeLid: file.documentTypeLid,
              fileSize: errorFileSizeFormatted,
              createdBy: 0,
              updatedBy: 0,
            })
          );
          errorFileId = savedErrorFile.id;
        } catch (err) {
          this.logError("processAssetEnrollmentUpload", {
            message: "Failed to upload asset enrollment error file",
            error: err,
            uploadId: upload.id,
          });
        }
      }

      let successFileId: number | null = null;
      if (successRows.length) {
        const successBuffer = await generateExcel(successRows);
        const successFileSizeBytes = successBuffer.length;
        const successFileSizeFormatted = formatSize(successFileSizeBytes);

        const successKey = `uploads/company/${
          file.entityType
        }/successfiles/policy-${
          upload.entityId
        }-asset-success-${Date.now()}.xlsx`;
        try {
          await uploadToS3(
            successBuffer,
            successKey,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          const savedSuccessFile = await this.fileRepo.save(
            this.fileRepo.create({
              fileKey: successKey,
              entityType: file.entityType,
              entityId: file.entityId,
              uploadType: "AWS",
              documentTypeLid: file.documentTypeLid,
              createdBy: 0,
              updatedBy: 0,
              fileSize: successFileSizeFormatted,
            })
          );
          successFileId = savedSuccessFile.id;
        } catch (err) {
          this.logError("processAssetEnrollmentUpload", {
            message: "Failed to upload asset enrollment success file",
            error: err,
            uploadId: upload.id,
          });
        }
      }

      const processCount = successRows.length + errors.length;

      await this.summaryRepo.save(
        this.summaryRepo.create({
          documentProcessingFileId: upload.id,
          policyId: upload.entityId,
          sourceFileUploadId: file.id,
          errorFileUploadId: errorFileId,
          successFileUploadId: successFileId,
          successCount: successRows.length,
          errorCount: errors.length,
          processCount,
          batchId: upload.id,
          endorsementId: upload.endorsementId,
        })
      );

      const updateResult = await this.policyAssetEndorsementRepo.update(
        upload.endorsementId,
        {
          endorsmentAssetCount: assetCount,
          endorsmentSubAssetCount: subAssetCount,
          endorsementAdditionCount: totalAdditionCount,
          endorsementDeletionCount: totalDeletionCount,
          grossPremium: netPremium,
          netPremium: netPremium,
          endorsementStatus: ASSET_ENDORSEMENT_READY,
        }
      );

      if (!updateResult.affected) {
        this.logError("processAssetEnrollmentUpload", {
          message: "Failed to update policy asset endorsement record",
          endorsementId: upload.endorsementId,
        });
      }

      const policyId = upload.entityId;
      try {
        const roLookup = await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.RO },
        });
        if (roLookup) {
          const roOpportunity = await this.opportunityRepo.findOne({
            where: { opportunityTypeLid: roLookup.id, refPolicyId: policyId },
            select: ["opportunityId"],
          });
          if (roOpportunity) {
            const policy = await this.policyRepo.findOne({
              where: { id: policyId },
              select: ["grossPremium"],
            });
            const premiumRow = await this.endorsementRepo
              .createQueryBuilder("e")
              .select("SUM(e.grossPremium)", "total")
              .where("e.policyId = :policyId", { policyId })
              .getRawOne<{ total: string }>();
            const endorsementTotal = parseFloat(premiumRow?.total ?? "0") || 0;
            const assetPremiumRow = await this.policyAssetEndorsementRepo
              .createQueryBuilder("ae")
              .select("SUM(ae.grossPremium)", "total")
              .where("ae.policyId = :policyId", { policyId })
              .getRawOne<{ total: string }>();
            const assetEndorsementTotal = parseFloat(assetPremiumRow?.total ?? "0") || 0;
            const policyGrossPremium = Number(policy?.grossPremium ?? 0);
            const newPremiumPaid = policyGrossPremium + endorsementTotal + assetEndorsementTotal;
            await this.opportunityRepo.update(roOpportunity.opportunityId, {
              premiumPaid: newPremiumPaid,
            });
            this.logInfo("processAssetEnrollmentUpload", {
              message: "Updated RO premiumPaid after asset endorsement update",
              opportunityId: roOpportunity.opportunityId,
              policyId,
              newPremiumPaid,
            });
          }
        }
      } catch (roError) {
        this.logError("processAssetEnrollmentUpload", {
          message: "Failed to update RO premiumPaid",
          policyId,
          error: roError instanceof Error ? roError.message : roError,
        });
      }

      await this.uploadRepo.update(upload.id, {
        processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
      });

      this.logInfo("processAssetEnrollmentUpload", {
        uploadId: upload.id,
        successCount: successRows.length,
        errorCount: errors.length,
        assetAdditionCount,
        assetDeletionCount,
        subAssetAdditionCount,
        subAssetDeletionCount,
        netPremium,
      });
    } catch (err) {
      this.logError("processAssetEnrollmentUpload", err);
      await this.uploadRepo.update(upload.id, {
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      });
    }
  }

  private isTruthyConstraint(value: any): boolean {
    if (typeof value === DATA_TYPES.BOOLEAN) {
      return value;
    }
    if (typeof value === DATA_TYPES.STRING) {
      const normalized = value.trim().toLowerCase();
      return (
        normalized === BOOLEAN_VALUES.TRUE ||
        normalized === "1" ||
        normalized === IS_EDITABLE
      );
    }
    if (typeof value === DATA_TYPES.NUMBER) {
      return value === 1;
    }
    return false;
  }

  private normalizeDateInput(value: any): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (
      typeof value === DATA_TYPES.STRING ||
      typeof value === DATA_TYPES.NUMBER
    ) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  private isChildRelationshipType(
    relationshipTypeNorm: string,
    configuredType?: any
  ): boolean {
    const CHILD_RELATIONSHIP_TYPE_KEYS = new Set<string>([
      CHILD_RELATIONSHIP_TYPES.CHILD,
      CHILD_RELATIONSHIP_TYPES.SON,
      CHILD_RELATIONSHIP_TYPES.DAUGHTER,
      normalizeValue(CHILD_RELATIONSHIP_TYPES.CHILDREN),
    ]);
    const candidates: string[] = [relationshipTypeNorm];
    if (typeof configuredType === DATA_TYPES.STRING && configuredType) {
      candidates.push(normalizeValue(configuredType));
    }
    return candidates.some((candidate) =>
      CHILD_RELATIONSHIP_TYPE_KEYS.has(candidate)
    );
  }

  private isChildGroupValidForOverride(
    children: Partial<PolicyEnrollmentDependent>[],
    maxCount: number,
    twinsAllowed: boolean,
    tripletsAllowed: boolean,
    allowFirstChildAsTwin: boolean
  ): boolean {
    const ctx = "isChildGroupValidForOverride";
    const total = children.length;

    this.logInfo(ctx, {
      stage: "input",
      total,
      maxCount,
      twinsAllowed,
      tripletsAllowed,
      allowFirstChildAsTwin,
      children: children.map((c) => ({
        id: (c as any).id ?? (c as any).policyEnrollmentDependentId ?? undefined,
        name: (c as any).name ?? undefined,
        relation: (c as any).relation ?? (c as any).relationshipType ?? undefined,
        dateOfBirth: c.dateOfBirth instanceof Date
          ? c.dateOfBirth.toISOString().slice(0, 10)
          : c.dateOfBirth ?? undefined,
      })),
    });

    if (total <= maxCount) {
      this.logInfo(ctx, { stage: "earlyPass", reason: "total<=maxCount", total, maxCount });
      return true;
    }

    const dobCounts = new Map<number, number>();
    for (const child of children) {
      const dob = this.normalizeDateInput(child.dateOfBirth);
      if (!dob) {
        this.logInfo(ctx, {
          stage: "invalidDob",
          childName: (child as any)?.name,
          rawDob: child.dateOfBirth,
        });
        return false;
      }
      const ts = dob.getTime();
      dobCounts.set(ts, (dobCounts.get(ts) || 0) + 1);
    }

    const groupEntries = [...dobCounts.entries()].sort(([a], [b]) => a - b);
    const groups = groupEntries.map(([, count]) => count);
    const dobGroupsSummary = groupEntries.map(([ts, count]) => ({
      dob: new Date(ts).toISOString().slice(0, 10),
      count,
    }));

    const numGroups = groups.length;
    this.logInfo(ctx, { stage: "dobGroups", numGroups, maxCount, dobGroupsSummary });

    if (numGroups > maxCount) {
      this.logInfo(ctx, { stage: "fail", reason: "tooManyDobGroups", numGroups, maxCount });
      return false;
    }

    for (let i = 0; i < numGroups; i++) {
      const count = groups[i];
      if (count === 1) continue;

      const isFirst = i === 0;
      const isLast = i === numGroups - 1;
      const groupDob = dobGroupsSummary[i].dob;

      if (isFirst && !isLast) {
        if (count === 2 && allowFirstChildAsTwin) continue;
        this.logInfo(ctx, {
          stage: "fail",
          reason: "firstGroupMultiChildNotAllowed",
          groupDob,
          count,
          allowFirstChildAsTwin,
        });
        return false;
      }

      if (!isFirst && !isLast) {
        this.logInfo(ctx, { stage: "fail", reason: "middleGroupMultiChild", groupIndex: i, groupDob, count });
        return false;
      }

      // Last group (or only group — treated as the "second child" slot)
      if (count === 2 && twinsAllowed) continue;
      if (count === 3 && tripletsAllowed) continue;
      this.logInfo(ctx, {
        stage: "fail",
        reason: "lastGroupCountNotAllowed",
        groupDob,
        count,
        twinsAllowed,
        tripletsAllowed,
      });
      return false;
    }

    this.logInfo(ctx, { stage: "pass", dobGroupsSummary });
    return true;
  }

  private canAddChildWithTwinOverride(
    existingDependents: Partial<PolicyEnrollmentDependent>[],
    newDob: Date | null | undefined,
    relationshipTypeNorm: string,
    maxCount: number
  ): boolean {
    const normalizedNewDob = this.normalizeDateInput(newDob);
    if (!normalizedNewDob) {
      return false;
    }

    const dobValues: number[] = [];

    for (const dep of existingDependents) {
      if (!dep) {
        continue;
      }
      const depTypeNorm = normalizeValue(
        String(dep.relationshipType ?? dep.relation ?? "")
      );
      if (depTypeNorm !== relationshipTypeNorm) {
        continue;
      }
      const normalizedExistingDob = this.normalizeDateInput(dep.dateOfBirth);
      if (!normalizedExistingDob) {
        return false;
      }
      dobValues.push(normalizedExistingDob.getTime());
    }

    dobValues.push(normalizedNewDob.getTime());

    if (dobValues.length <= maxCount) {
      return true;
    }

    if (dobValues.length > maxCount + 1) {
      return false;
    }

    dobValues.sort((a, b) => a - b);
    const youngestDob = dobValues[dobValues.length - 1];
    const secondYoungestDob = dobValues[dobValues.length - 2];

    if (youngestDob !== secondYoungestDob) {
      return false;
    }

    const youngestCount = dobValues.filter((val) => val === youngestDob).length;
    return youngestCount <= 2;
  }

  private canAddChildWithTripletOverride(
    existingDependents: Partial<PolicyEnrollmentDependent>[],
    newDob: Date | null | undefined,
    relationshipTypeNorm: string,
    maxCount: number
  ): boolean {
    const normalizedNewDob = this.normalizeDateInput(newDob);
    if (!normalizedNewDob) {
      return false;
    }

    const dobValues: number[] = [];

    for (const dep of existingDependents) {
      if (!dep) {
        continue;
      }
      const depTypeNorm = normalizeValue(
        String(dep.relationshipType ?? dep.relation ?? "")
      );
      if (depTypeNorm !== relationshipTypeNorm) {
        continue;
      }
      const normalizedExistingDob = this.normalizeDateInput(dep.dateOfBirth);
      if (!normalizedExistingDob) {
        return false;
      }
      dobValues.push(normalizedExistingDob.getTime());
    }

    dobValues.push(normalizedNewDob.getTime());

    if (dobValues.length <= maxCount) {
      return true;
    }

    // Triplets allow up to maxCount + 2 children (3 sharing the same DOB)
    if (dobValues.length > maxCount + 2) {
      return false;
    }

    dobValues.sort((a, b) => a - b);
    const youngestDob = dobValues[dobValues.length - 1];
    const youngestCount = dobValues.filter((val) => val === youngestDob).length;

    if (dobValues.length === maxCount + 1) {
      // 2nd or 3rd child in triplet set: 2 youngest must share same DOB (youngestCount can be 2 or 3)
      const secondYoungestDob = dobValues[dobValues.length - 2];
      return youngestDob === secondYoungestDob && youngestCount >= 2 && youngestCount <= 3;
    }

    // dobValues.length === maxCount + 2 — 3rd triplet being added: 3 youngest must share same DOB
    const thirdYoungestDob = dobValues[dobValues.length - 3];
    return youngestDob === thirdYoungestDob && youngestCount === 3;
  }

  private canAddFirstChildAsTwinOverride(
    existingDependents: Partial<PolicyEnrollmentDependent>[],
    newDob: Date | null | undefined,
    relationshipTypeNorm: string,
    maxCount: number
  ): boolean {
    const normalizedNewDob = this.normalizeDateInput(newDob);
    if (!normalizedNewDob) {
      return false;
    }

    const dobValues: number[] = [];

    for (const dep of existingDependents) {
      if (!dep) {
        continue;
      }
      const depTypeNorm = normalizeValue(
        String(dep.relationshipType ?? dep.relation ?? "")
      );
      if (depTypeNorm !== relationshipTypeNorm) {
        continue;
      }
      const normalizedExistingDob = this.normalizeDateInput(dep.dateOfBirth);
      if (!normalizedExistingDob) {
        return false;
      }
      dobValues.push(normalizedExistingDob.getTime());
    }

    dobValues.push(normalizedNewDob.getTime());

    if (dobValues.length <= maxCount) {
      return true;
    }

    // Only allows 1 extra child (Twin slot + 1 independent child)
    if (dobValues.length > maxCount + 1) {
      return false;
    }

    // The 2 OLDEST children must share the same DOB (first twin slot)
    dobValues.sort((a, b) => a - b);
    const oldestDob = dobValues[0];
    const secondOldestDob = dobValues[1];

    if (oldestDob !== secondOldestDob) {
      return false;
    }

    // Exactly 2 in the twin slot — the 3rd must be a different (younger) child
    const oldestCount = dobValues.filter((val) => val === oldestDob).length;
    return oldestCount === 2;
  }

  private canAddDoubleTwinOverride(
    existingDependents: Partial<PolicyEnrollmentDependent>[],
    newDob: Date | null | undefined,
    relationshipTypeNorm: string,
    maxCount: number
  ): boolean {
    const normalizedNewDob = this.normalizeDateInput(newDob);
    if (!normalizedNewDob) {
      return false;
    }

    const dobValues: number[] = [];

    for (const dep of existingDependents) {
      if (!dep) {
        continue;
      }
      const depTypeNorm = normalizeValue(
        String(dep.relationshipType ?? dep.relation ?? "")
      );
      if (depTypeNorm !== relationshipTypeNorm) {
        continue;
      }
      const normalizedExistingDob = this.normalizeDateInput(dep.dateOfBirth);
      if (!normalizedExistingDob) {
        return false;
      }
      dobValues.push(normalizedExistingDob.getTime());
    }

    dobValues.push(normalizedNewDob.getTime());

    if (dobValues.length <= maxCount) {
      return true;
    }

    // Two twin pairs allow up to maxCount + 2 total
    if (dobValues.length > maxCount + 2) {
      return false;
    }

    dobValues.sort((a, b) => a - b);

    if (dobValues.length === maxCount + 1) {
      // Either the 2 oldest or the 2 youngest share DOB (first twin pair being formed)
      const oldest = dobValues[0];
      const secondOldest = dobValues[1];
      const youngest = dobValues[dobValues.length - 1];
      const secondYoungest = dobValues[dobValues.length - 2];

      if (oldest === secondOldest) {
        return dobValues.filter((v) => v === oldest).length === 2;
      }
      if (youngest === secondYoungest) {
        return dobValues.filter((v) => v === youngest).length === 2;
      }
      return false;
    }

    // dobValues.length === maxCount + 2: oldest 2 share one DOB, youngest 2 share a different DOB
    const oldest = dobValues[0];
    const secondOldest = dobValues[1];
    const youngest = dobValues[dobValues.length - 1];
    const secondYoungest = dobValues[dobValues.length - 2];

    if (oldest !== secondOldest || youngest !== secondYoungest) {
      return false;
    }
    if (oldest === youngest) {
      // All same DOB — not two distinct twin pairs
      return false;
    }

    const oldestCount = dobValues.filter((v) => v === oldest).length;
    const youngestCount = dobValues.filter((v) => v === youngest).length;
    return oldestCount === 2 && youngestCount === 2;
  }

  private canAddTwinPlusTripletOverride(
    existingDependents: Partial<PolicyEnrollmentDependent>[],
    newDob: Date | null | undefined,
    relationshipTypeNorm: string,
    maxCount: number
  ): boolean {
    const normalizedNewDob = this.normalizeDateInput(newDob);
    if (!normalizedNewDob) {
      return false;
    }

    const dobValues: number[] = [];

    for (const dep of existingDependents) {
      if (!dep) {
        continue;
      }
      const depTypeNorm = normalizeValue(
        String(dep.relationshipType ?? dep.relation ?? "")
      );
      if (depTypeNorm !== relationshipTypeNorm) {
        continue;
      }
      const normalizedExistingDob = this.normalizeDateInput(dep.dateOfBirth);
      if (!normalizedExistingDob) {
        return false;
      }
      dobValues.push(normalizedExistingDob.getTime());
    }

    dobValues.push(normalizedNewDob.getTime());

    if (dobValues.length <= maxCount) {
      return true;
    }

    // Twin pair (2) + triplet group (3) = maxCount + 3 total
    if (dobValues.length > maxCount + 3) {
      return false;
    }

    dobValues.sort((a, b) => a - b);

    // The 2 oldest must be the twin pair (same DOB)
    const twinDob = dobValues[0];
    if (dobValues[1] !== twinDob) {
      return false;
    }

    // Exactly 2 children in the twin slot
    const twinCount = dobValues.filter((v) => v === twinDob).length;
    if (twinCount !== 2) {
      return false;
    }

    if (dobValues.length < 3) {
      return true;
    }

    // All children after the twin pair must share a single different DOB (triplet group)
    const tripletDob = dobValues[2];
    if (tripletDob === twinDob) {
      return false;
    }

    return dobValues.slice(2).every((v) => v === tripletDob);
  }

  private async processTpaIdUpload(upload: DocumentProcessingFile) {
    const { id: uploadId, entityId: policyId, endorsementId } = upload;
    this.logInfo("processTpaIdUpload initial entry in processing file ", {
      uploadId,
      policyId,
      endorsementId,
    });

    const useRedisRowStore = Boolean(this.redis);
    const redisRowStorageKey = useRedisRowStore
      ? `tpa-upload-rows:${uploadId}:${Date.now()}`
      : undefined;
    const processStart = new Date();
    const describeProcessTiming = () => {
      const processEnd = new Date();
      return {
        processStartTime: processStart.toISOString(),
        processEndTime: processEnd.toISOString(),
        processDurationMs: processEnd.getTime() - processStart.getTime(),
      };
    };

    try {
    const policy = await this.policyRepo.findOne({
      where: { id: upload.entityId },
    });
    if (!policy) {
      throw new NotFoundException(
        `Policy not found for policy ID ${upload.entityId}`
      );
    }

    const policyCompanyId = policy.companyId;

    // Bypass uploads skip policy config lookup entirely; non-bypass requires a live config
    let tpaIdForFamily = false;
    if (!upload.bypassPolicyConfiguration) {
      const liveStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
      });
      if (!liveStatus) {
        throw new NotFoundException(
          `Status lookup not found for key ${POLICY_CONFIGURATION_STATUS_LIVE}`
        );
      }

      const policyConfig = await this.policyConfigRepo.findOne({
        where: {
          policyId: upload.entityId,
          policyConfiguartionStatusLid: liveStatus.id,
        },
      });
      if (!policyConfig) {
        throw new NotFoundException(
          `Approved policy configuration not found for policy ID ${upload.entityId}`
        );
      }

      const constraints = (policyConfig?.policyConfiguration as any)?.constraints;
      tpaIdForFamily = Boolean(constraints?.tpaIdForFamily);
    }

    this.logInfo("processTpaIdUpload", {
      uploadId,
      policyId,
      endorsementId,
      tpaIdForFamily,
      message: "TPA ID family sharing setting",
    });

    if (!endorsementId) {
      this.logError("processTpaIdUpload", {
        uploadId,
        message: "Missing endorsement identifier",
      });
      await this.uploadRepo.update(uploadId, {
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      });
      return;
    }

    await this.uploadRepo.update(uploadId, {
      processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
    });

    const errors: any[] = [];
    const processedCounts = new Map<number, number>();
    let processedRowsTotal = 0;
    let errorFileId: number | null = null;
    const ackSeconds = Number(upload.expectedDependentsCount ?? 0);
    const tpaAcknowledgedDate = ackSeconds
      ? new Date(ackSeconds * 1000)
      : undefined;

    const REDIS_ROW_PIPELINE_LIMIT = 500;
    const REDIS_ROW_BATCH_SIZE = 1000;

    if (useRedisRowStore && redisRowStorageKey) {
      this.logInfo("processTpaIdUpload", {
        uploadId,
        policyId,
        endorsementId,
        action: "redisRowStoreEnabled",
        redisRowStorageKey,
      });
    }

    const file = await this.fileRepo.findOne({
      where: { id: upload.documentId },
    });
      if (!file) {
        throw new NotFoundException(
          `File with ID ${upload.documentId} not found.`
        );
      }

      const buffer = await downloadFromS3(file.fileKey);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        throw new BadRequestException("TPA ID upload sheet is empty");
      }
      const rangeRef = sheet["!ref"];
      if (!rangeRef) {
        throw new BadRequestException("TPA ID upload sheet is empty");
      }
      const range = XLSX.utils.decode_range(rangeRef);
      const headerRowIndex = range.s.r;
      const headerColumns: {
        header: string;
        normalized: string;
        col: number;
      }[] = [];
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        const rawHeader = this.getRawCellValue(sheet, headerRowIndex, col);
        const header = rawHeader ? String(rawHeader).trim() : "";
        if (!header) {
          continue;
        }
        headerColumns.push({
          header,
          normalized: header.replace(/[\s_]+/g, "").toLowerCase(),
          col,
        });
      }
      if (!headerColumns.length) {
        throw new BadRequestException("TPA ID upload sheet is missing headers");
      }
      this.logInfo("processTpaIdUpload", {
        uploadId,
        policyId,
        endorsementId,
        action: "parsedHeaders",
        headers: headerColumns.map(h => ({ header: h.header, normalized: h.normalized })),
      });

      const policyTpaMapRepo =
        this.employeePolicyMapRepo.manager.getRepository(PolicyTpaMap);
      const policyTpaMap = await policyTpaMapRepo.findOne({
        where: { policyId },
      });
      const policyTpaId = policyTpaMap?.tpaId;

      let mappingTemplateId =
        (upload as any).mappingTemplateId ??
        (upload as any).mappingTemplateVersionId ??
        (upload as any).mappingTemplateVersion?.id;
      
      let shouldFallback = false;
      
      if (!mappingTemplateId) {
        const mappingTemplateVersionRepo =
          this.employeePolicyMapRepo.manager.getRepository(
            MappingTemplateVersion
          );
        if (policyTpaId) {
          const activeTemplate = await mappingTemplateVersionRepo.findOne({
            where: {
              companyId: policyTpaId,
              entityName: UTILITY_UPLOAD_ENTITY_TPA,
              fileDirection: FILE_DIRECTION_INBOUND,
              isActive: true,
            },
            order: { templateVersionNo: "DESC" },
          });
          mappingTemplateId = activeTemplate?.id;
        }
      }

      // If no mapping template found, use fallback mode
      if (!mappingTemplateId) {
        this.logInfo("processTpaIdUpload", {
          uploadId,
          policyId,
          endorsementId,
          message: "No mapping template configured, using fallback mode",
        });
        shouldFallback = true;
      }

      // Define helper functions for mapping template processing
      const seedTargetsRepo =
        this.employeePolicyMapRepo.manager.getRepository(
          MstrEntityFieldsUtilityRef
        );
      const seedTargets = await seedTargetsRepo.find({
        where: { entityName: UTILITY_UPLOAD_ENTITY_TPA },
      });

      const mappingRowsRepo =
        this.employeePolicyMapRepo.manager.getRepository(MappingTemplateColumn);
      const mappingRows = await mappingRowsRepo.find({
        where: { mappingTemplateVersionId: mappingTemplateId },
        select: [
          "sourceColumnName",
          "targetTableName",
          "targetColumnName",
          "transformationConfig",
        ],
      });

      const requiredTargets = seedTargets.filter((target) =>
        Boolean(target.is_required ?? target.isRequired)
      );

      const normalizePipeList = (val?: string) =>
        (val ?? "")
          .split("|")
          .map((v) => v.trim())
          .filter(Boolean);

      const getSourceColumn = (
        targetTable: string,
        targetColumn: string
      ): string | undefined => {
        const matches = mappingRows.filter((row) => {
          const targetColumnName =
            row.target_column_name ?? row.targetColumnName;
          const targetTableName = row.target_table_name ?? row.targetTableName;
          const targetColumnTokens = normalizePipeList(targetColumnName);
          if (!targetColumnTokens.includes(targetColumn)) {
            return false;
          }
          const targetTableTokens = normalizePipeList(targetTableName);
          if (!targetTableTokens.length) {
            return true;
          }
          return targetTableTokens.includes(targetTable);
        });

        if (!matches.length) {
          return undefined;
        }

        const preferredMatch = matches.find((row) => {
          const targetTableName = row.target_table_name ?? row.targetTableName;
          const targetTableTokens = normalizePipeList(targetTableName);
          return targetTableTokens.includes(targetTable);
        });

        const selected = preferredMatch ?? matches[0];
        const sourceColumnName =
          selected.source_column_name ?? selected.sourceColumnName;
        return sourceColumnName ? String(sourceColumnName).trim() : undefined;
      };

      const requireSourceColumn = (
        targetTable: string,
        targetColumn: string
      ): string => {
        const src = getSourceColumn(targetTable, targetColumn);
        if (!src) {
          throw new BadRequestException(
            `${ERROR_MISSING_MAPPING_FOR_TARGET_PREFIX}: ${targetTable}.${targetColumn}`
          );
        }
        return src;
      };

      // Validate mapping template if one exists
      if (mappingTemplateId && !shouldFallback) {
        try {
          // Validate all Excel headers are mapped in configuration
          const mappedSourceColumns = new Set<string>();
          for (const mappingRow of mappingRows) {
            const sourceColumnName = mappingRow.source_column_name ?? mappingRow.sourceColumnName;
            if (sourceColumnName) {
              mappedSourceColumns.add(String(sourceColumnName).trim());
            }
          }

          // First check if required targets are mapped (incomplete template check)
          let hasIncompleteMapping = false;
          for (const target of requiredTargets) {
            const targetTable = target.table_name ?? target.tableName ?? "";
            const targetColumn = target.column_name ?? target.columnName ?? "";
            if (!targetTable || !targetColumn) {
              continue;
            }
            
            try {
              const source = requireSourceColumn(targetTable, targetColumn);
              if (!headerColumns.some((column) => column.header === source)) {
                hasIncompleteMapping = true;
                break;
              }
            } catch (error) {
              hasIncompleteMapping = true;
              break;
            }
          }

          if (hasIncompleteMapping) {
            // Template exists but is incomplete - use fallback
            this.logInfo("processTpaIdUpload", {
              uploadId,
              policyId,
              endorsementId,
              message: "Mapping template incomplete, using fallback mode",
            });
            shouldFallback = true;
          } else {
            // Template is complete - check for unmapped headers (strict validation)
            const unmappedHeaders = headerColumns.filter(
              (col) => !mappedSourceColumns.has(col.header)
            );

            if (unmappedHeaders.length > 0) {
              throw new BadRequestException(
                `Please re-check the configuration. Found unmapped headers in Excel: ${unmappedHeaders.map(h => h.header).join(', ')}. All Excel headers must be configured in the mapping template.`
              );
            }
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error; // Re-throw validation errors for complete templates
          }
          // Other errors - fallback
          this.logError("processTpaIdUpload", {
            uploadId,
            policyId,
            endorsementId,
            error: error,
            message: "Mapping template validation failed, using fallback mode",
          });
          shouldFallback = true;
        }
      }

      if (shouldFallback) {
        // Switch to fallback mode for incomplete/missing templates
        mappingTemplateId = null;
        
        // Use fallback mode 
        this.logInfo("processTpaIdUpload", {
          uploadId,
          policyId,
          endorsementId,
          policyTpaId,
          message: "Using fallback mode - validating required headers",
        });

        // Validate only expected fallback headers exist
        const hasEmployeeId = headerColumns.some(h => 
          POSSIBLE_EMPLOYEE_ID_HEADERS_FOR_TPA_FILE.some(possible => 
            h.normalized === possible.toLowerCase().replace(/[\s_]+/g, "")
          )
        );

        const hasTpaId = headerColumns.some(h =>
          ENROLLMENT_TPA_ID_HEADERS.some(possible =>
            h.normalized === possible.toLowerCase().replace(/[\s_]+/g, "")
          )
        );

        const hasRelation = headerColumns.some(h => h.normalized === POLICY_RELATIONSHIP_TYPE_PARAMETER);

        const missingHeaders: string[] = [];
        if (!hasEmployeeId) {
          missingHeaders.push(`employee_id (one of: ${POSSIBLE_EMPLOYEE_ID_HEADERS_FOR_TPA_FILE.join(', ')})`);
        }
        if (!hasTpaId) {
          missingHeaders.push(`tpa_id (one of: ${ENROLLMENT_TPA_ID_HEADERS.join(', ')})`);
        }
        if (!hasRelation) {
          missingHeaders.push(`relation`);
        }

        if (missingHeaders.length > 0) {
          throw new BadRequestException(`Missing required header(s): ${missingHeaders.join('; ')}`);
        }

        this.logInfo("processTpaIdUpload", {
          uploadId,
          policyId,
          endorsementId,
          message: "Processing TPA IDs in fallback mode",
        });
      }

      const sourceDateColumns = new Set<string>();
      for (const target of seedTargets) {
        const targetTable = target.table_name ?? target.tableName ?? "";
        const targetColumn = target.column_name ?? target.columnName ?? "";
        const dataType = target.data_type ?? target.dataType ?? "";
        if (!targetTable || !targetColumn) {
          continue;
        }
        if (!String(dataType).toLowerCase().includes("date")) {
          continue;
        }
        const source = getSourceColumn(targetTable, targetColumn);
        if (source) {
          sourceDateColumns.add(source);
        }
      }

      await this.employeePolicyMapRepo.manager.transaction(async (manager) => {
        const employeeRepo = manager.getRepository(PolicyEnrollmentEmployee);
        const dependentRepo = manager.getRepository(PolicyEnrollmentDependent);
        const endorsementRepo = manager.getRepository(Endorsement);
        const policyEmployeeEndorsementRepo = manager.getRepository(
          PolicyEmployeeEndorsement
        );
        const employeePolicyMapRepo = manager.getRepository(
          PolicyEnrollmentEmployeePolicyMap
        );
        const fileUploadRepo = manager.getRepository(FileUpload);
        const markError = (
          row: Record<string, any>,
          remarks: string,
          rowNumber: number
        ) => {
          errors.push({
            ...row,
            Remarks: remarks,
          });
          processedRowsTotal += 1;
        };

        type NormalizedRow = {
          row: Record<string, any>;
          rowNumber: number;
          normalizedEmployeeId: string;
          companyEmployeeName: string;
          companyEmployeeGender: string;
          tpaIdStr: string;
          relation: string;
        };

        const rowBuffer: NormalizedRow[] = [];
        let redisPipeline: Redis.Pipeline | undefined;
        let pipelineCount = 0;

        if (useRedisRowStore && redisRowStorageKey) {
          await this.redis.del(redisRowStorageKey);
          redisPipeline = this.redis.pipeline();
        }

        const flushRedisPipeline = async () => {
          if (!redisPipeline || pipelineCount === 0) {
            return;
          }

          const rowsFlushed = pipelineCount;
          try {
            await redisPipeline.exec();
            this.logInfo("processTpaIdUpload", {
              uploadId,
              policyId,
              endorsementId,
              action: "redisPipelineFlushed",
              redisRowStorageKey,
              rowsFlushed,
            });
          } catch (flushError) {
            this.logError("processTpaIdUpload", {
              uploadId,
              policyId,
              endorsementId,
              action: "redisPipelineFlushFailed",
              redisRowStorageKey,
              rowsFlushed,
              error: flushError,
            });
            throw flushError;
          } finally {
            pipelineCount = 0;
            redisPipeline = this.redis.pipeline();
          }
        };

        const dependentKey = (
          employeeId: number,
          relation: string,
          name: string,
          gender: string
        ) =>
          `${employeeId}|${relation.toLowerCase().trim()}|${name
            .toLowerCase()
            .trim()}|${gender.toLowerCase().trim()}`;

        const existingEmployeeTpas = await employeePolicyMapRepo.find({
          select: ["employeeTpaId"],
          where: {
            policyId,
            employeeTpaId: Not(IsNull()),
          },
          withDeleted: true,
        });

        const existingDependentTpas = await dependentRepo.find({
          select: ["dependentTpaId"],
          where: {
            policyId,
            dependentTpaId: Not(IsNull()),
          },
          withDeleted: true,
        });

        const existingTpaIds = new Set<string>(
          [
            ...(existingEmployeeTpas
              .map((record) => record.employeeTpaId)
              .filter(Boolean) as string[]),
            ...(existingDependentTpas
              .map((record) => record.dependentTpaId)
              .filter(Boolean) as string[]),
          ].map((value) => String(value))
        );

        const pendingTpaIds = new Set<string>();

        const fetchInChunks = async <T>(
          values: (string | number)[],
          fetcher: (chunk: (string | number)[]) => Promise<T[]>,
          chunkSize = 1000
        ) => {
          const results: T[] = [];
          for (let index = 0; index < values.length; index += chunkSize) {
            const chunk = values.slice(index, index + chunkSize);
            const chunkResult = await fetcher(chunk);
            results.push(...chunkResult);
          }
          return results;
        };

        const processChunk = async (chunk: NormalizedRow[]) => {
          if (!chunk.length) {
            return;
          }

          const chunkEmployeeIds = Array.from(
            new Set(chunk.map((entry) => entry.normalizedEmployeeId))
          );

          const employees = chunkEmployeeIds.length
            ? await fetchInChunks(chunkEmployeeIds, (employeeIds) =>
                employeeRepo.find({
                  where: {
                    companyEmployeeId: In(employeeIds),
                    companyId: policyCompanyId,
                  },
                  withDeleted: true,
                })
              )
            : [];

          const employeeByCompanyId = new Map(
            employees.map((employee) => [employee.companyEmployeeId, employee])
          );
          const employeeIds = employees.map((employee) => employee.id);

          const employeePolicyMaps = employeeIds.length
            ? await fetchInChunks(employeeIds, (ids) =>
                employeePolicyMapRepo.find({
                  where: { employeeId: In(ids), policyId },
                  withDeleted: true,
                })
              )
            : [];
          const policyMapByEmployeeId = new Map(
            employeePolicyMaps.map((map) => [map.employeeId, map])
          );

          const endorsementMappings = employeeIds.length
            ? await fetchInChunks(employeeIds, (ids) =>
                policyEmployeeEndorsementRepo.find({
                  where: { employeeId: In(ids), endorsementId },
                  withDeleted: true,
                })
              )
            : [];
          const endorsementByEmployeeId = new Map(
            endorsementMappings.map((endorsement) => [
              endorsement.employeeId,
              endorsement,
            ])
          );

          const dependents = employeeIds.length
            ? await fetchInChunks(employeeIds, (ids) =>
                dependentRepo.find({
                  where: { policyId, employeeId: In(ids) },
                  withDeleted: true,
                })
              )
            : [];
          const dependentsByKey = new Map(
            dependents.map((dependent) => [
              dependentKey(
                dependent.employeeId,
                dependent.relation ?? "",
                dependent.name ?? "",
                dependent.gender ?? ""
              ),
              dependent,
            ])
          );

          const policyMapUpdates: PolicyEnrollmentEmployeePolicyMap[] = [];
          const dependentUpdates: PolicyEnrollmentDependent[] = [];
          const endorsementStatusUpdates: number[] = [];
          
          // Track TPA IDs assigned to families in this chunk (for tpaIdForFamily constraint)
          const pendingFamilyTpaIds = new Map<string, number>(); // tpaId -> employeeId

          const applyRowData = async (rowData: NormalizedRow) => {
            const {
              row,
              rowNumber,
              normalizedEmployeeId,
              companyEmployeeName,
              companyEmployeeGender,
              tpaIdStr,
              relation,
            } = rowData;

            const employee = employeeByCompanyId.get(normalizedEmployeeId);
            if (!employee) {
              markError(row, endorsementFileUploadMessages.ER0030, rowNumber);
              return;
            }

            // Check for duplicate TPA IDs - handle family sharing when tpaIdForFamily is enabled
            let isDuplicateError = false;
            
            // For family sharing, track this TPA ID immediately if it's new
            if (tpaIdForFamily && !existingTpaIds.has(tpaIdStr) && !pendingTpaIds.has(tpaIdStr)) {
              pendingFamilyTpaIds.set(tpaIdStr, employee.id);
            }
            
            if (tpaIdForFamily) {
              // When family sharing is enabled, only check for duplicates outside the current family
              
              // Check existing TPA IDs from database
              if (existingTpaIds.has(tpaIdStr)) {
                // Query to check if existing TPA ID belongs to same employee family
                const existingEmployeeWithTpa = await employeePolicyMapRepo.findOne({
                  where: {
                    policyId,
                    employeeTpaId: tpaIdStr,
                  },
                  withDeleted: true,
                });
                
                // Also check dependents with same TPA ID
                const existingDependentWithTpa = await dependentRepo.findOne({
                  where: {
                    dependentTpaId: tpaIdStr,
                    policyId: policyId,
                  },
                  withDeleted: true,
                  select: ["employeeId"],
                });
                
                const existingOwnerEmployeeId = existingEmployeeWithTpa?.employeeId || 
                                                existingDependentWithTpa?.employeeId;
                
                if (existingOwnerEmployeeId && existingOwnerEmployeeId !== employee.id) {
                  isDuplicateError = true;
                }
              }
              
              // Check pending TPA IDs in current batch
              if (!isDuplicateError && pendingTpaIds.has(tpaIdStr)) {
                const pendingFamilyOwner = pendingFamilyTpaIds.get(tpaIdStr);
                if (pendingFamilyOwner && pendingFamilyOwner !== employee.id) {
                  isDuplicateError = true;
                }
              }
            } else {
              // Original logic: no family sharing allowed
              isDuplicateError = existingTpaIds.has(tpaIdStr) || pendingTpaIds.has(tpaIdStr);
            }
            
            if (isDuplicateError) {
              markError(row, `duplicate ${TPA_ID_HEADER_LABEL}`, rowNumber);
              return;
            }

            const endorsement = endorsementByEmployeeId.get(employee.id);
            const employeePolicyMap = policyMapByEmployeeId.get(employee.id);
            const hasLivePolicyMap = Boolean(
              employeePolicyMap && !employeePolicyMap.deletedAt
            );
            if (!endorsement && !hasLivePolicyMap) {
              markError(row, "endorsement mapping not found", rowNumber);
              return;
            }

            if (relation.toLowerCase() === "self") {
              if (!hasLivePolicyMap || !employeePolicyMap) {
                markError(row, "employee not linked to policy", rowNumber);
                return;
              }
              
              // Check if TPA ID already exists for this employee
              if (employeePolicyMap.employeeTpaId) {
                markError(row, `duplicate ${TPA_ID_HEADER_LABEL}`, rowNumber);
                return;
              }
              
              // Check for duplicate TPA ID in pending batch
              if (pendingTpaIds.has(tpaIdStr)) {
                markError(row, `duplicate ${TPA_ID_HEADER_LABEL}`, rowNumber);
                return;
              }

              employeePolicyMap.employeeTpaId = tpaIdStr;
              policyMapUpdates.push(employeePolicyMap);
              pendingTpaIds.add(tpaIdStr);

              if (
                endorsement?.employeeEndorsementStatusKey ===
                EMPLOYEE_ENDORSEMENT_READY
              ) {
                endorsementStatusUpdates.push(endorsement.id);
              }

              const endorsementKey =
                endorsement?.endorsementId ?? endorsementId;
              processedCounts.set(
                endorsementKey,
                (processedCounts.get(endorsementKey) ?? 0) + 1
              );
              processedRowsTotal += 1;
            } else {
              const dependent = dependentsByKey.get(
                dependentKey(
                  employee.id,
                  relation,
                  companyEmployeeName,
                  companyEmployeeGender
                )
              );
              if (!dependent || dependent.deletedAt) {
                markError(row, endorsementFileUploadMessages.ER0029, rowNumber);
                return;
              }
              
              // Check if TPA ID already exists for this dependent
              if (dependent.dependentTpaId) {
                markError(row, `duplicate ${TPA_ID_HEADER_LABEL}`, rowNumber);
                return;
              }
              
              // Check for duplicate TPA ID in pending batch
              if (pendingTpaIds.has(tpaIdStr)) {
                markError(row, `duplicate ${TPA_ID_HEADER_LABEL}`, rowNumber);
                return;
              }

              // Check if tpaIdForFamily is enabled and validate family TPA ID consistency
              if (tpaIdForFamily) {
                // First check if employee TPA ID was updated in current batch
                let employeeTpaId: string | null = null;

                // Check if employee TPA ID is in current batch updates
                const updatedEmployeeMap = policyMapUpdates.find(map => map.employeeId === employee.id);
                if (updatedEmployeeMap?.employeeTpaId) {
                  employeeTpaId = updatedEmployeeMap.employeeTpaId;
                } else if (employeePolicyMap?.employeeTpaId) {
                  // Get existing TPA ID from database
                  employeeTpaId = employeePolicyMap.employeeTpaId;
                } else {
                  //fetch from DB as last resort
                  const freshEmployeeMap = await employeePolicyMapRepo.findOne({
                    where: {
                      employeeId: employee.id,
                      policyId,
                    },
                    withDeleted: true,
                  });
                  employeeTpaId = freshEmployeeMap?.employeeTpaId || null;
                }
                
                if (!employeeTpaId) {
                  markError(row, "employee TPA ID not found - dependent requires same TPA ID as employee", rowNumber);
                  return;
                }
                
                if (tpaIdStr !== employeeTpaId) {
                  markError(row, `dependent TPA ID (${tpaIdStr}) should be same as employee TPA ID (${employeeTpaId})`, rowNumber);
                  return;
                }
              }

              dependent.dependentTpaId = tpaIdStr;
              dependentUpdates.push(dependent);
              pendingTpaIds.add(tpaIdStr);

              const endorsementKey =
                endorsement?.endorsementId ?? endorsementId;
              processedCounts.set(
                endorsementKey,
                (processedCounts.get(endorsementKey) ?? 0) + 1
              );
              processedRowsTotal += 1;
            }
          };

          for (const row of chunk) {
            await applyRowData(row);
          }

          if (policyMapUpdates.length) {
            await employeePolicyMapRepo.save(policyMapUpdates);
          }

          if (endorsementStatusUpdates.length) {
            const uniqueStatusUpdates = Array.from(
              new Set(endorsementStatusUpdates)
            );
            await policyEmployeeEndorsementRepo.update(
              { id: In(uniqueStatusUpdates) },
              {
                employeeEndorsementStatusKey:
                  EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED,
              }
            );
          }

          if (dependentUpdates.length) {
            await dependentRepo.save(dependentUpdates);
          }
        };

        const processBufferedChunk = async () => {
          if (!rowBuffer.length) {
            return;
          }

          const chunk = rowBuffer.splice(0);
          await processChunk(chunk);
        };

        const dataRowStart = headerRowIndex + 1;
        const dataRowEnd = range.e.r;
        
        // Determine column sources - use mapping template if available, otherwise use fallback detection
        let employeeIdSource: string;
        let tpaIdSource: string;
        let relationSource: string;
        let employeeNameSource: string;
        let genderSource: string;
        
        if (mappingTemplateId) {
          // Use mapping template
          employeeIdSource = requireSourceColumn(
            "policy_enrollment_employee",
            "company_employee_id"
          );
          tpaIdSource = requireSourceColumn(
            "policy_enrollment_employee_policy_map",
            "employee_tpa_id"
          );
          relationSource =
            getSourceColumn("policy_enrollment_employee", "relation") ??
            getSourceColumn("policy_enrollment_dependent", "relation") ??
            requireSourceColumn("policy_enrollment_employee", "relation");
          employeeNameSource = requireSourceColumn(
            "policy_enrollment_employee",
            "employee_name"
          );
          genderSource = requireSourceColumn(
            "policy_enrollment_employee",
            "gender"
          );
        } else {
          // Fallback mode: detect columns by matching header names
          const findHeaderColumn = (possibleHeaders: string[]): string => {
            const normalized = possibleHeaders.map(h => h.toLowerCase().replace(/[\s_]+/g, ""));
            const found = headerColumns.find(col => normalized.includes(col.normalized));
            return found?.header || "";
          };
          
          employeeIdSource = findHeaderColumn(POSSIBLE_EMPLOYEE_ID_HEADERS_FOR_TPA_FILE);
          tpaIdSource = findHeaderColumn(ENROLLMENT_TPA_ID_HEADERS);
          relationSource = findHeaderColumn([POLICY_RELATIONSHIP_TYPE_PARAMETER]);
          employeeNameSource = findHeaderColumn(POSSIBLE_EMPLOYEE_NAME_HEADERS_FOR_TPA_FILE);
          genderSource = findHeaderColumn(POSSIBLE_EMPLOYEE_GENDER_HEADERS_FOR_TPA_FILE);
        }
        
        const buildRowObject = (rowIndex: number) => {
          const row: Record<string, any> = {};
          for (const column of headerColumns) {
            const address = XLSX.utils.encode_cell({
              c: column.col,
              r: rowIndex,
            });
            const cell = sheet[address];
            const rawValue = this.getRawCellValue(
              sheet,
              rowIndex,
              column.col
            );
            if (sourceDateColumns.has(column.header)) {
              const normalizedRaw =
                typeof rawValue === "string" &&
                rawValue.trim() !== "" &&
                !Number.isNaN(Number(rawValue))
                  ? Number(rawValue)
                  : rawValue;
              row[column.header] =
                cell?.w ??
                formatDateForDisplay(normalizedRaw) ??
                rawValue;
              continue;
            }
            row[column.header] = rawValue;
          }
          return row;
        };
        const dropRowFromSheet = (rowIndex: number) => {
          for (const column of headerColumns) {
            const address = XLSX.utils.encode_cell({
              c: column.col,
              r: rowIndex,
            });
            delete sheet[address];
          }
        };
        for (
          let rowIndex = dataRowStart;
          rowIndex <= dataRowEnd;
          rowIndex += 1
        ) {
          const row = buildRowObject(rowIndex);
          
          // Check for empty rows to exclude them from processing
          const rowValues = Object.values(row);
          const isRowEmpty = rowValues.every(
            (v) =>
              v === "" ||
              v === undefined ||
              v === null ||
              (typeof v === "string" && v.trim() === "")
          );
          if (isRowEmpty) {
            continue;
          }
          
          const companyEmployeeId = this.getCellValue(row, employeeIdSource);
          const companyEmployeeName = this.getCellValue(
            row,
            employeeNameSource
          );
          const companyEmployeeGender = this.getCellValue(row, genderSource);
          const tpaId = this.getCellValue(row, tpaIdSource);
          const relationRaw = this.getCellValue(row, relationSource);

          const normalizedEmployeeId = companyEmployeeId
            ? String(companyEmployeeId).trim()
            : "";
          const tpaIdStr = tpaId ? String(tpaId).trim() : "";
          const relation = String(relationRaw ?? "").trim();
          const remarks: string[] = [];

          if (!normalizedEmployeeId) {
            remarks.push(`missing ${EMPLOYEE_ID_HEADER_LABEL}`);
          }
          if (!tpaIdStr) {
            remarks.push(`missing ${tpaIdSource}`);
          }
          if (!relation) {
            remarks.push(`missing ${POLICY_RELATIONSHIP_TYPE_PARAMETER}`);
          }

          if (remarks.length) {
            markError(row, remarks.join(", "), rowIndex + 1);
            continue;
          }

          const entry: NormalizedRow = {
            row,
            rowNumber: rowIndex + 1,
            normalizedEmployeeId,
            companyEmployeeName: String(companyEmployeeName ?? ""),
            companyEmployeeGender: String(companyEmployeeGender ?? ""),
            tpaIdStr,
            relation,
          };

          if (useRedisRowStore && redisRowStorageKey && redisPipeline) {
            redisPipeline.rpush(redisRowStorageKey, JSON.stringify(entry));
            pipelineCount += 1;
            if (pipelineCount >= REDIS_ROW_PIPELINE_LIMIT) {
              await flushRedisPipeline();
            }
          } else {
            rowBuffer.push(entry);
            if (rowBuffer.length >= REDIS_ROW_BATCH_SIZE) {
              await processBufferedChunk();
            }
          }
          dropRowFromSheet(rowIndex);
        }

        if (!useRedisRowStore) {
          await processBufferedChunk();
        }

        if (redisPipeline && pipelineCount > 0) {
          await flushRedisPipeline();
        }

        const fetchRowsBatchFromRedis = async (): Promise<NormalizedRow[]> => {
          if (!useRedisRowStore || !redisRowStorageKey) {
            return [];
          }
          let batchEntries: string[];
          try {
            batchEntries = await this.redis.lrange(
              redisRowStorageKey,
              0,
              REDIS_ROW_BATCH_SIZE - 1
            );
          } catch (readError) {
            this.logError("processTpaIdUpload", {
              uploadId,
              policyId,
              endorsementId,
              action: "redisBatchReadFailed",
              redisRowStorageKey,
              error: readError,
            });
            throw readError;
          }

          if (!batchEntries.length) {
            return [];
          }

          try {
            await this.redis.ltrim(redisRowStorageKey, batchEntries.length, -1);
          } catch (trimError) {
            this.logError("processTpaIdUpload", {
              uploadId,
              policyId,
              endorsementId,
              action: "redisBatchTrimFailed",
              redisRowStorageKey,
              error: trimError,
            });
            throw trimError;
          }

          this.logInfo("processTpaIdUpload", {
            uploadId,
            policyId,
            endorsementId,
            action: "redisBatchFetched",
            redisRowStorageKey,
            batchSize: batchEntries.length,
          });

          return batchEntries.map(
            (entry) => JSON.parse(entry) as NormalizedRow
          );
        };

        const processRowBatches = async () => {
          if (!useRedisRowStore || !redisRowStorageKey) {
            return;
          }
          while (true) {
            const batch = await fetchRowsBatchFromRedis();
            if (!batch.length) {
              break;
            }
            await processChunk(batch);
          }
        };

        await processRowBatches();

        if (errors.length) {
          const errorBuffer = await generateExcel(errors);
          const sanitizedName = `endorsement-${endorsementId}-tpa-errors-${Date.now()}.xlsx`;
          const key = `uploads/endorsement/${endorsementId}/tpa-errors/${sanitizedName}`;
          await uploadToS3(
            errorBuffer,
            key,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          const savedErrorFile = await fileUploadRepo.save(
            fileUploadRepo.create({
              fileKey: key,
              entityType: file.entityType,
              entityId: file.entityId,
              uploadType: "AWS",
              documentTypeLid: file.documentTypeLid,
              createdBy: 0,
              updatedBy: 0,
            })
          );
          errorFileId = savedErrorFile.id;
        }

        for (const [eId, count] of processedCounts.entries()) {
          const totalEmployees = await policyEmployeeEndorsementRepo.count({
            where: { endorsementId: eId },
            withDeleted: true,
          });
          const acknowledgedEmployees =
            await policyEmployeeEndorsementRepo.count({
              where: {
                endorsementId: eId,
                employeeEndorsementStatusKey:
                  EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED,
              },
              withDeleted: true,
            });

          const completionPayload =
            eId === endorsementId && acknowledgedEmployees === totalEmployees
              ? {
                  tpaDocumentId: upload.documentId,
                  tpaProcessedCount: count,
                  tpaAcknowledgedDate,
                  tpaErrorFileId: errorFileId,
                  tpaErrorCount: errors.length,
                  updatedAt: new Date(),
                }
              : eId === endorsementId
              ? {
                  tpaProcessedCount: count,
                  tpaErrorFileId: errorFileId,
                  tpaErrorCount: errors.length,
                }
              : { tpaProcessedCount: count };

          await endorsementRepo.update({ id: eId }, completionPayload);
        }

        if (!processedCounts.has(endorsementId) && errors.length) {
          await endorsementRepo.update(
            { id: endorsementId },
            {
              tpaProcessedCount: 0,
              tpaErrorFileId: errorFileId,
              tpaErrorCount: errors.length,
            }
          );
        }
        for (const name of workbook.SheetNames) {
          delete workbook.Sheets[name];
        }
      });

      const successCount = processedCounts.get(endorsementId) ?? 0;
      const failureCount = errors.length;
      const processCount = processedRowsTotal;

      const existingSummary = await this.summaryRepo.findOne({
        where: { documentProcessingFileId: uploadId },
      });
      const summaryPayload = {
        policyId,
        documentProcessingFileId: uploadId,
        sourceFileUploadId: file.id,
        errorFileUploadId: errorFileId,
        successFileUploadId: null,
        successCount,
        errorCount: failureCount,
        processCount,
        batchId: existingSummary?.batchId ?? uploadId,
        endorsementId,
      };

      if (existingSummary) {
        await this.summaryRepo.update(existingSummary.id, summaryPayload);
      } else {
        await this.summaryRepo.save(this.summaryRepo.create(summaryPayload));
      }

      await this.uploadRepo.update(uploadId, {
        processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
      });

      this.logInfo("processTpaIdUpload", {
        uploadId,
        successCount,
        failureCount,
        ...describeProcessTiming(),
      });
    } catch (error) {
      await this.uploadRepo.update(uploadId, {
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      });
      this.logError("processTpaIdUpload", {
        uploadId,
        policyId,
        endorsementId,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
        errorString: String(error),
        ...describeProcessTiming(),
      });
    } finally {
      if (useRedisRowStore && redisRowStorageKey) {
        this.logInfo("processTpaIdUpload", {
          uploadId,
          policyId,
          endorsementId,
          action: "redisRowsCleanupStarting",
          redisRowStorageKey,
        });
        try {
          await this.redis.del(redisRowStorageKey);
          this.logInfo("processTpaIdUpload", {
            uploadId,
            policyId,
            endorsementId,
            action: "redisRowsCleanupCompleted",
            redisRowStorageKey,
            phase: "final",
          });
        } catch (cleanupError) {
          this.logError("processTpaIdUpload", {
            uploadId,
            policyId,
            endorsementId,
            message: "failed to clear temp redis rows",
            error: cleanupError,
          });
        }
      }
    }
  }

  private generateEmail(
    policyCompanyId: string | number | null | undefined,
    companyEmployeeId: string,
    employeeName: string,
    dateOfBirth: string
  ): string {
    const sanitizeAlphaNumeric = (value: string | number | null | undefined) =>
      `${value ?? ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
    const sanitizeNumeric = (value: string | number | null | undefined) =>
      `${value ?? ""}`.replace(/\D/g, "");

    const policyCompanyPart = sanitizeAlphaNumeric(policyCompanyId);

    const companyPart = sanitizeAlphaNumeric(companyEmployeeId);
    const namePart = sanitizeAlphaNumeric(employeeName);

    let dobPart = sanitizeNumeric(dateOfBirth);
    if (!dobPart) {
      const parsed = new Date(dateOfBirth);
      if (!Number.isNaN(parsed.getTime())) {
        const year = parsed.getUTCFullYear();
        const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
        const day = String(parsed.getUTCDate()).padStart(2, "0");
        dobPart = `${year}${month}${day}`;
      }
    }
    return `${policyCompanyPart}${companyPart}${namePart}${dobPart}@gmail.com`;
  }

  // ─── Policy Extension Upload Processing ───────────────────────────────────

  private static readonly EXCEL_TO_UNIX_EPOCH_DAYS = 25569;
  private static readonly MS_PER_DAY = 86400 * 1000;

  private async getPendingPolicyExtensionUpload(): Promise<DocumentProcessingFile | null> {
    const unprocessedFile = await this.uploadRepo.findOne({
      where: {
        documentType: DOCUMENT_ENTITY_TYPE_POLICY_EXTENSION,
        processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
      },
      order: { createdAt: "ASC" },
    });
    if (!unprocessedFile) return null;

    const updateFileStatus = await this.uploadRepo
      .createQueryBuilder()
      .update(DocumentProcessingFile)
      .set({ processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING })
      .where("id = :id and process_status != :processStatus", {
        id: unprocessedFile.id,
        processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
      })
      .execute();
    if ((updateFileStatus.affected ?? 0) !== 1) return null;

    return unprocessedFile;
  }

  @Cron("*/2 * * * *")
  async handlePolicyExtensionUploads(): Promise<void> {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logInfo("handlePolicyExtensionUploads", "Policy extension upload scheduler running");
    const upload = await this.getPendingPolicyExtensionUpload();
    if (!upload) {
      this.logInfo("handlePolicyExtensionUploads", "No policy extension uploads pending");
      return;
    }
    this.logInfo("handlePolicyExtensionUploads", {
      uploadId: upload.id,
      policyId: upload.entityId,
      message: "Policy extension upload claimed for processing",
    });
    await this.processPolicyExtensionUpload(upload);
  }

  private parseCellDate(cell: any): string {
    if (!cell) return "";

    // Numeric cell = Excel serial date — convert via UTC arithmetic, fully timezone-safe.
    if (cell.t === "n" && typeof cell.v === "number") {
      const utcMs = (cell.v - EnrollmentUploadScheduler.EXCEL_TO_UNIX_EPOCH_DAYS) * EnrollmentUploadScheduler.MS_PER_DAY;
      const d = new Date(utcMs);
      return [
        d.getUTCFullYear(),
        String(d.getUTCMonth() + 1).padStart(2, "0"),
        String(d.getUTCDate()).padStart(2, "0"),
      ].join("-");
    }

    // String/text cell — handle YYYY-MM-DD or DD/MM/YYYY with 4-digit year
    if (cell.t === "s" && typeof cell.v === "string") {
      const str = cell.v.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
      const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
      }
      return str;
    }

    return "";
  }

  private async processPolicyExtensionUpload(upload: DocumentProcessingFile): Promise<void> {
    this.logInfo("processPolicyExtensionUpload", `Processing extension upload ID: ${upload.id}`);

    try {
      // Phase 1 — Setup
      const fileRecord = await this.fileRepo.findOne({ where: { id: upload.documentId } });
      if (!fileRecord) throw new Error("Source file not found");

      const buffer = await downloadFromS3(fileRecord.fileKey);

      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error("No worksheet found in uploaded file");
      const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

      const policy = await this.policyRepo.findOne({
        where: { id: upload.entityId },
        relations: ["policyType"],
      });
      if (!policy) throw new Error(`Policy ${upload.entityId} not found`);

      const uploader = await this.userRepo.findOne({ where: { userId: upload.createdBy } });
      const userId = uploader?.userId ?? upload.createdBy;

      // Phase 2 — Row validation
      const errorRecords: Record<string, any>[] = [];
      const validRecords: Record<string, any>[] = [];

      const sheet = wb.Sheets[sheetName];

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const endorsementType    = String(row?.[0] ?? "").trim();
        const iiirmPolicyNumber  = String(row?.[1] ?? "").trim();
        const insurerPolicyNum   = String(row?.[2] ?? "").trim();

        // Read date via cell.w (formatted display value) to avoid timezone shifts
        const dateCellRef        = XLSX.utils.encode_cell({ r: rowIndex, c: 3 });
        const dateCell           = sheet[dateCellRef];
        const extensionDateRaw   = this.parseCellDate(dateCell);

        const remarks            = String(row?.[4] ?? "").trim();

        const rowErrors: string[] = [];

        // a. Validate IIRM Policy Number
        const rowPolicyId = parseInt(iiirmPolicyNumber, 10);
        if (!rowPolicyId || rowPolicyId !== policy.id) {
          rowErrors.push("IIRM Policy Number is invalid or not found");
        }

        // b. Validate Endorsement Type
        if (endorsementType.toLowerCase() !== "extension") {
          rowErrors.push("Endorsement Type must be 'Extension'");
        }

        // c. Validate Insurer Policy Number
        if (insurerPolicyNum !== policy.insurerPolicyNumber) {
          rowErrors.push("Insurer Policy Number does not match the policy record");
        }

        // d. Validate Extension Date
        let extensionDate: Date | null = null;
        if (!extensionDateRaw) {
          rowErrors.push("Extension Date is not a valid date");
        } else {
          extensionDate = new Date(extensionDateRaw + "T00:00:00");
          if (isNaN(extensionDate.getTime())) {
            rowErrors.push("Extension Date is not a valid date");
          } else if (policy.policyTo) {
            const policyToStr = String(policy.policyTo).split("T")[0];
            if (extensionDateRaw <= policyToStr) {
              rowErrors.push(
                `Extension Date must be after the current policy end date (current: ${policyToStr})`
              );
            }
          }
        }

        const rowObj = {
          "Endorsement Type": endorsementType,
          "IIRM Policy Number": iiirmPolicyNumber,
          "Insurer Policy Number": insurerPolicyNum,
          "Extension Date": extensionDateRaw,
          "Remarks": remarks,
        };

        if (rowErrors.length > 0) {
          errorRecords.push({ ...rowObj, "Error Remarks": rowErrors.join("; ") });
        } else {
          validRecords.push({ ...rowObj, extensionDate: extensionDateRaw });
        }
      }

      // Phase 3a — Error path
      if (errorRecords.length > 0) {
        let errorFileId: number | null = null;
        try {
          const errorBuffer = await generateExcel(errorRecords);
          const errorKey = `uploads/policy-extension/errorfiles/policy-${policy.id}-extension-errorfile-${Date.now()}.xlsx`;
          await uploadToS3(errorBuffer, errorKey, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          const savedErrorFile = await this.fileRepo.save(
            this.fileRepo.create({
              fileKey: errorKey,
              entityType: DOCUMENT_ENTITY_TYPE_POLICY_EXTENSION,
              entityId: policy.id,
              uploadType: "AWS",
              createdBy: userId,
              updatedBy: userId,
            })
          );
          errorFileId = savedErrorFile.id;
        } catch (err) {
          this.logError("processPolicyExtensionUpload", `Failed to upload error file: ${err}`);
        }

        await this.summaryRepo.save(
          this.summaryRepo.create({
            documentProcessingFileId: upload.id,
            policyId: policy.id,
            sourceFileUploadId: fileRecord.id,
            errorFileUploadId: errorFileId,
            successCount: 0,
            errorCount: errorRecords.length,
            processCount: errorRecords.length,
            batchId: upload.id,
          })
        );
        await this.uploadRepo.update(upload.id, { processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED });
        return;
      }

      // Phase 3b — Success path
      await this.dataSource.transaction(async (manager) => {
        const policyManager = manager.getRepository(Policy);
        const auditManager  = manager.getRepository(PolicyExtensionAudit);

        for (const record of validRecords) {
          const livePolicy = await policyManager.findOne({ where: { id: policy.id }, select: ["id", "policyTo"] });
          const previousPolicyTo = livePolicy!.policyTo
            ? String(livePolicy!.policyTo).split("T")[0]
            : "";

          await policyManager.update(policy.id, { policyTo: record.extensionDate as any });

          await auditManager.save(
            auditManager.create({
              policyId: policy.id,
              insurerPolicyNumber: record["Insurer Policy Number"],
              endorsementType: ENDORSEMENT_TYPE_EXTENSION,
              previousPolicyToDate: previousPolicyTo,
              extensionDate: record.extensionDate,
              remarks: record["Remarks"] ?? "",
              sourceFileUploadId: fileRecord.id,
              processedBy: userId,
              isReverted: false,
            })
          );
        }
      });

      await this.summaryRepo.save(
        this.summaryRepo.create({
          documentProcessingFileId: upload.id,
          policyId: policy.id,
          sourceFileUploadId: fileRecord.id,
          errorFileUploadId: null,
          successCount: validRecords.length,
          errorCount: 0,
          processCount: validRecords.length,
          batchId: upload.id,
        })
      );
      await this.uploadRepo.update(upload.id, { processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED });
      this.logInfo("processPolicyExtensionUpload", `Extension upload ${upload.id} processed successfully`);
    } catch (error) {
      this.logError("processPolicyExtensionUpload", `Upload ${upload.id} failed: ${error}`);
      await this.uploadRepo.update(upload.id, { processStatus: DOCUMENT_PROCESS_STATUS.FAILED });
    }
  }
}

export function filterRowsByValuesIgnoreCase(
  rows: any[][],
  searchValues: string[],
  headers: string[]
): Record<string, any>[] {
  const lowerSearchValues = searchValues.map((val) => val.toLowerCase());
  const matches: Record<string, any>[] = [];

  rows.slice(1).forEach((row) => {
    const normalizedRow = row.map((cell) =>
      typeof cell === "string"
        ? cell.toLowerCase()
        : cell?.toString().toLowerCase()
    );

    if (lowerSearchValues.every((val) => normalizedRow.includes(val))) {
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      matches.push(obj);
    }
  });

  return matches;
}
