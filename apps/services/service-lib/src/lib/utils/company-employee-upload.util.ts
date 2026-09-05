import * as ExcelJS from "exceljs"
import * as XLSX from "xlsx";
import axios from "axios";
import type Redis from "ioredis";
import { ENV } from "../environment";
import {
  fetchValidPolicyLocations,
  fetchDefaultCountryCallingCode,
  normalizePolicyLocationCode,
} from "./policy-location.util";
import {
  DataSource,
  Repository,
  Brackets,
  EntityManager,
  In,
  IsNull,
  Not,
  QueryFailedError,
} from "typeorm";
import {
  DocumentProcessingFile,
  FileUpload,
  Policy,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEnrollmentUploadSummary,
  PolicyEmployeeEnrollment,
  PolicyEmployeeEndorsement,
  PolicyDependentEndorsement,
  Endorsement,
  Role,
  User,
  UserRole,
  LookUp,
  PolicyConfiguration,
  AuthenticationMethod,
  CompanyAuthenticationMapping,
} from "../entities";
import { updateEndorsementSummaryAfterEnrollment } from "./enrollment-processing.util";
import {
  COMPANY_EMPLOYEE_ROLE_KEY,
  DOCUMENT_PROCESS_STATUS,
  EMPLOYEE_ENDORSEMENT_READY,
  POLICY_CONFIGURATION_STATUS_LIVE,
  POLICY_CONFIGURATION_STATUS_REJECTED,
  PARENT_RELATIONSHIP_TYPES,
  USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
  USER_TYPE_IIRM_EMPLOYEE,
  POLICY_LOCATION_FIELD_NAME,
  POLICY_LOCATION_COLUMN_NAME,
  POLICY_LOCATION_REQUIRED_ERROR,
  POLICY_LOCATION_MISMATCH_ERROR,
  DATA_INTAKE_TYPE,
  GENDER_VALUES,
  ENROLLMENT_FIELD_HEADERS,
  POSSIBLE_EMPLOYEE_ID_HEADERS_FOR_TPA_FILE,
  POSSIBLE_EMPLOYEE_NAME_HEADERS_FOR_TPA_FILE,
  POSSIBLE_EMPLOYEE_GENDER_HEADERS_FOR_TPA_FILE,
  POLICY_RELATIONSHIP_TYPE_PARAMETER,
} from "../../../../../../libs/service-lib/src/lib/constants";
// NOTIFICATION_EVENT_TYPES/NOTIFICATION_EMAIL/NOTIFICATION_IN_APP live only
// in this app's own constants.ts, not the older libs/service-lib copy this
// file otherwise imports constants from (confirmed via `tsc -b`: that copy
// has no NOTIFICATION_EVENT_TYPES export at all) — imported separately here
// rather than duplicating them into the legacy file.
import { NOTIFICATION_EVENT_TYPES, NOTIFICATION_EMAIL, NOTIFICATION_IN_APP } from "../constants";
import {
  errorStream,
  generateExcel,
  generateExcelStream,
  getS3ReadStream,
  processChunksAsStream,
  uploadToS3,
  downloadFromS3,
} from "./file-management.utils";
import { endorsementFileUploadMessages, errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";

export interface ProcessEmployeeUploadDependencies {
  logInfo(method: string, messageData: unknown): void;
  logError(method: string, messageData: unknown): void;
  redis?: Redis | null;
  uploadRepo: Repository<DocumentProcessingFile>;
  fileRepo: Repository<FileUpload>;
  policyRepo: Repository<Policy>;
  endorsementRepo: Repository<Endorsement>;
  companyEmployeeRepo: Repository<PolicyEnrollmentEmployee>;
  dependentRepo: Repository<PolicyEnrollmentDependent>;
  summaryRepo: Repository<PolicyEnrollmentUploadSummary>;
  employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>;
  employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>;
  policyEmployeeEndorsementRepo: Repository<PolicyEmployeeEndorsement>;
  policyDependentEndorsementRepo: Repository<PolicyDependentEndorsement>;
  userRepo: Repository<User>;
  roleRepo: Repository<Role>;
  userRoleRepo: Repository<UserRole>;
  lookUpRepository: Repository<LookUp>;
  policyConfigRepo: Repository<PolicyConfiguration>;
  authenticationMethodRepo: Repository<AuthenticationMethod>;
  companyAuthenticationMapRepo: Repository<CompanyAuthenticationMapping>;
}

interface RowCollect {
  companyEmployee: Partial<PolicyEnrollmentEmployee>;
  dependents: Partial<PolicyEnrollmentDependent>[];
  intakeType: string;
  rowObj: any;
  enrollmentStartDate?: Date | null;
  enrollmentEndDate?: Date | null;
  effectiveDate?: Date | null;
  additionalParams?: Record<string, any>;
  hasError?: boolean;
  dependentRows?: any[];
}

export interface EnsureAssociationDependencies {
  user: User;
  manager?: EntityManager;
  userRepo: Repository<User>;
  roleRepo: Repository<Role>;
  userRoleRepo: Repository<UserRole>;
}

export interface FindUserByEmailOrPhoneDependencies {
  email?: string;
  phone?: string;
  userRepo: Repository<User>;
}

export interface HandleMapDeletionsDependencies {
  maps: PolicyEnrollmentEmployeePolicyMap[];
  upload: DocumentProcessingFile;
  employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>;
  dependentRepo: Repository<PolicyEnrollmentDependent>;
  employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>;
  policyEmployeeEndorsementRepo: Repository<PolicyEmployeeEndorsement>;
  userRepo: Repository<User>;
  roleRepo: Repository<Role>;
  userRoleRepo: Repository<UserRole>;
  effectiveDateByEmployeeId?: Map<number, Date | null>;
}

export interface GetSelfAgeLimitsDependencies {
  policyId: number;
  lookUpRepository: Repository<LookUp>;
  policyConfigRepo: Repository<PolicyConfiguration>;
  logError?: (method: string, messageData: unknown) => void;
}

export interface RevertAssociationDependencies {
  userId: number;
  manager?: EntityManager;
  userRepo: Repository<User>;
  roleRepo: Repository<Role>;
  userRoleRepo: Repository<UserRole>;
}

export const toDateOnlyString = (value?: Date | null): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split("T")[0];
};

const normalizeToDateOnly = (
  value: Date | string | null | undefined
): Date | null => {
  if (!value) {
    return null;
  }
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const isDateWithinRange = (
  target: Date | null,
  start: Date | null,
  end: Date | null
): boolean => {
  if (!target || !start || !end) {
    return false;
  }
  return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
};

export const calculateAge = (dob: Date): number => {
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

  return fullYears + fractionOfYear;
};

const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes} min`);
  }
  if (hours === 0 && minutes === 0) {
    parts.push(`${seconds} sec`);
  }

  return parts.join(" ");
};

const normalizeExcelCellValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value;
  }
  if (value && typeof value === "object") {
    const record = value as {
      text?: unknown;
      richText?: Array<{ text?: unknown }>;
      result?: unknown;
    };
    if (typeof record.text === "string") {
      return record.text;
    }
    if (Array.isArray(record.richText)) {
      return record.richText
        .map((part) => String(part?.text ?? ""))
        .join("");
    }
    if (record.result !== undefined) {
      return record.result;
    }
  }
  return value;
};

const chunkArray = <T>(values: T[], size: number): T[][] => {
  if (size <= 0) {
    return [];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
};

interface RedisBucket<T> {
  bucketId: string;
  records: T[];
  size: number;
}

const createRedisBucket = <T>(bucketId: string): RedisBucket<T> => ({
  bucketId,
  records: [],
  size: 0,
});

const readRedisBucket = async <T>(
  redis: Redis,
  bucketId: string
): Promise<RedisBucket<T> | null> => {
  const raw = await redis.get(bucketId);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as RedisBucket<T>;
  } catch {
    return null;
  }
};

async function* streamRedisBucketRecords<T>(
  redis: Redis,
  bucketIds: string[]
): AsyncGenerator<T> {
  for (const bucketId of bucketIds) {
    const bucket = await readRedisBucket<T>(redis, bucketId);
    if (!bucket?.records?.length) {
      continue;
    }
    for (const record of bucket.records) {
      yield record;
    }
  }
}

const deleteRedisKeys = async (redis: Redis, keys: string[]) => {
  for (const chunk of chunkArray(keys, 500)) {
    if (!chunk.length) {
      continue;
    }
    await redis.del(...chunk);
  }
};

async function loadPolicyConfiguration({
  policyId,
  policyConfigRepo,
  lookUpRepository,
}: {
  policyId: number;
  policyConfigRepo: Repository<PolicyConfiguration>;
  lookUpRepository: Repository<LookUp>;
}): Promise<any | null> {
  const [liveStatus, rejectedStatus] = await Promise.all([
    lookUpRepository.findOne({ where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE } }),
    lookUpRepository.findOne({ where: { lookUpKey: POLICY_CONFIGURATION_STATUS_REJECTED } }),
  ]);

  // Try live config first
  if (liveStatus) {
    const liveConfig = await policyConfigRepo.findOne({
      where: { policyId, policyConfiguartionStatusLid: liveStatus.id },
    });
    if (liveConfig?.policyConfiguration) {
      return liveConfig.policyConfiguration as any;
    }
  }

  // Fall back to most recent non-rejected config — matches template generation behaviour
  const fallbackConfig = await policyConfigRepo.findOne({
    where: {
      policyId,
      ...(rejectedStatus ? { policyConfiguartionStatusLid: Not(rejectedStatus.id) } : {}),
    },
    order: { updatedAt: 'DESC' },
  });

  if (!fallbackConfig?.policyConfiguration) {
    return null;
  }

  return fallbackConfig.policyConfiguration as any;
}

function deriveSelfAgeLimitsFromPolicyConfig(
  policyConfig: any
): { min?: number; max?: number } | null {
  const relationships =
    policyConfig?.relationships?.enabledPolicyRelations ?? [];

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
}

function buildPolicyParameterLookup(policyConfig: any): Map<string, any> {
  const map = new Map<string, any>();
  const parameters: any[] = Array.isArray(policyConfig?.parameters)
    ? policyConfig.parameters
    : [];

  for (const parameter of parameters) {
    if (!parameter) {
      continue;
    }

    const normalizedName = normalizeValue(
      String(parameter.parameterMasterName ?? "")
    );

    if (normalizedName) {
      map.set(normalizedName, parameter);
    }

    const aliases: string[] = Array.isArray(parameter.aliasNames)
      ? parameter.aliasNames
      : [];
    for (const alias of aliases) {
      const normalizedAlias = normalizeValue(String(alias ?? ""));
      if (normalizedAlias) {
        map.set(normalizedAlias, parameter);
      }
    }
  }

  return map;
}

const isValueProvided = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return true;
};

const PHONE_AUTH_METHODS = new Set(["PHONE_OTP", "PHONE_PASSWORD"]);
const EMAIL_AUTH_METHODS = new Set(["EMAIL_OTP", "EMAIL_PASSWORD"]);

async function getCompanyAuthenticationMethod(
  companyId: number,
  deps: Pick<
    ProcessEmployeeUploadDependencies,
    "companyAuthenticationMapRepo" | "authenticationMethodRepo"
  >
): Promise<string | null> {
  const mapping = await deps.companyAuthenticationMapRepo.findOne({
    where: { companyId, configId: IsNull(), isEnabled: true },
    relations: { authenticationMethod: true },
    order: { displayOrder: "ASC" },
  });

  if (mapping?.authenticationMethod?.methodCode) {
    return mapping.authenticationMethod.methodCode;
  }

  if (mapping?.authenticationMethodId) {
    const authMethod = await deps.authenticationMethodRepo.findOne({
      where: { id: mapping.authenticationMethodId },
    });

    if (authMethod?.methodCode) {
      return authMethod.methodCode;
    }
  }

  return null;
}

function formatRangeBoundary(boundary: any): string | undefined {
  if (boundary === undefined || boundary === null || boundary === "") {
    return undefined;
  }

  return String(boundary);
}

function validateParameterValue(
  parameter: any,
  headerLabel: string,
  rawValue: unknown
): string | null {
  if (!isValueProvided(rawValue)) {
    return null;
  }

  const displayName = String(parameter?.parameterMasterName ?? headerLabel);
  const normalizedValue = normalizeValue(String(rawValue));

  if (Array.isArray(parameter?.lovDetails) && parameter.lovDetails.length > 0) {
    const allowedValues = parameter.lovDetails
      .map((lov: any) =>
        normalizeValue(String(lov?.value ?? lov?.name ?? "")).trim()
      )
      .filter((val: string) => val.length > 0);

    if (allowedValues.length > 0 && !allowedValues.includes(normalizedValue)) {
      const humanReadableValues = parameter.lovDetails
        .map((lov: any) => String(lov?.value ?? lov?.name ?? ""))
        .filter((val: string) => val.trim().length > 0)
        .join(", ");

      return humanReadableValues
        ? `${displayName} must match one of the configured values (${humanReadableValues})`
        : `${displayName} has an invalid value`;
    }

    return null;
  }

  if (
    Array.isArray(parameter?.relationGroupDetails) &&
    parameter.relationGroupDetails.length > 0
  ) {
    const allowedRelations = parameter.relationGroupDetails.flatMap(
      (group: any) =>
        Array.isArray(group?.selectedRelations)
          ? group.selectedRelations
              .filter((relation: any) => relation?.selected)
              .map((relation: any) => normalizeValue(String(relation?.name ?? "")))
              .filter((val: string) => val.length > 0)
          : []
    );

    if (allowedRelations.length > 0 && !allowedRelations.includes(normalizedValue)) {
      const humanReadableRelations = parameter.relationGroupDetails
        .flatMap((group: any) =>
          Array.isArray(group?.selectedRelations)
            ? group.selectedRelations
                .filter((relation: any) => relation?.selected)
                .map((relation: any) => String(relation?.name ?? ""))
            : []
        )
        .filter((val: string) => val.trim().length > 0)
        .join(", ");

      return humanReadableRelations
        ? `${displayName} must match one of the configured values (${humanReadableRelations})`
        : `${displayName} has an invalid value`;
    }

    return null;
  }

  if (Array.isArray(parameter?.rangeDetails) && parameter.rangeDetails.length > 0) {
    const numericValue = Number(
      String(rawValue)
        .replace(/[^0-9.-]/g, "")
        .trim()
    );

    if (Number.isNaN(numericValue)) {
      return `${displayName} must be a valid number`;
    }

    const isWithinAnyRange = parameter.rangeDetails.some((range: any) => {
      const minRaw = range?.min;
      const maxRaw = range?.max;
      const min =
        typeof minRaw === "string" && minRaw.trim().length > 0
          ? Number(minRaw)
          : typeof minRaw === "number"
          ? minRaw
          : undefined;
      const max =
        typeof maxRaw === "string" && maxRaw.trim().length > 0
          ? Number(maxRaw)
          : typeof maxRaw === "number"
          ? maxRaw
          : undefined;

      const minOk = min === undefined || numericValue >= min;
      const maxOk = max === undefined || numericValue <= max;
      return minOk && maxOk;
    });

    if (!isWithinAnyRange) {
      const firstRange = parameter.rangeDetails[0];
      const minText = formatRangeBoundary(firstRange?.min);
      const maxText = formatRangeBoundary(firstRange?.max);

      if (minText && maxText) {
        return `${displayName} must be between ${minText} and ${maxText}`;
      }

      if (minText) {
        return `${displayName} must be greater than or equal to ${minText}`;
      }

      if (maxText) {
        return `${displayName} must be less than or equal to ${maxText}`;
      }

      return `${displayName} is outside the configured range`;
    }

    return null;
  }

  return null;
}

export async function getSelfAgeLimits({
  policyId,
  lookUpRepository,
  policyConfigRepo,
  logError,
}: GetSelfAgeLimitsDependencies): Promise<{
  min?: number;
  max?: number;
} | null> {
  try {
    const policyConfig = await loadPolicyConfiguration({
      policyId,
      policyConfigRepo,
      lookUpRepository,
    });

    if (!policyConfig) {
      return null;
    }

    return deriveSelfAgeLimitsFromPolicyConfig(policyConfig);
  } catch (error) {
    logError?.("getSelfAgeLimits", { error, policyId });
    return null;
  }
}

export async function findUserByEmailOrPhone({
  email,
  phone,
  userRepo,
}: FindUserByEmailOrPhoneDependencies): Promise<User | null> {
  if (email) {
    const user = await userRepo.findOne({
      where: { emailId: email, deletedAt: IsNull() },
    });
    if (user) {
      return user;
    }
  }

  if (phone) {
    const user = await userRepo.findOne({
      where: { mobile: phone, deletedAt: IsNull() },
    });
    if (user) {
      return user;
    }
  }

  return null;
}

export async function ensureCompanyAndIirmAssociation({
  user,
  manager,
  userRepo,
  roleRepo,
  userRoleRepo,
}: EnsureAssociationDependencies): Promise<boolean> {
  if (!user?.userId) {
    return false;
  }

  const userRepository = manager?.getRepository(User) ?? userRepo;
  const roleRepository = manager?.getRepository(Role) ?? roleRepo;
  const userRoleRepository = manager?.getRepository(UserRole) ?? userRoleRepo;

  const persistedUser = await userRepository.findOne({
    where: { userId: user.userId, deletedAt: IsNull() },
    ...(manager ? { lock: { mode: "pessimistic_write" as const } } : {}),
  });
  if (!persistedUser) {
    return false;
  }

  const currentType = persistedUser.userTypeKey?.trim();
  const shouldPromote = currentType == USER_TYPE_IIRM_EMPLOYEE;
  const alreadyCombined =
    currentType == USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE;
  if (!shouldPromote && !alreadyCombined) {
    return false;
  }

  if (!alreadyCombined) {
    persistedUser.userTypeKey = USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE;
    const updatedBy =
      persistedUser.updatedBy !== undefined
        ? persistedUser.updatedBy
        : user.updatedBy ?? 0;
    await userRepository.update(
      { userId: persistedUser.userId },
      {
        userTypeKey: USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
        updatedBy,
      }
    );
    persistedUser.updatedBy = updatedBy;
  }

  let role = await roleRepository.findOne({
    where: { roleKey: USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE },
    ...(manager ? { lock: { mode: "pessimistic_read" as const } } : {}),
  });
  if (!role) {
    const roleEntity = roleRepository.create({
      name: "Company & IIRM Employee",
      description: "Company & IIRM Employee",
      createdBy: "system",
      updatedBy: "system",
      roleKey: USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
    });
    role = await roleRepository.save(roleEntity);
  }

  const existingMapping = await userRoleRepository.findOne({
    where: { userId: persistedUser.userId, roleId: role.id },
  });
  if (!existingMapping) {
    const mapping = userRoleRepository.create({
      userId: persistedUser.userId,
      roleId: role.id,
    });
    try {
      await userRoleRepository.insert(mapping);
    } catch (err) {
      if (
        !(err instanceof QueryFailedError) ||
        err.driverError?.code !== "23505"
      ) {
        throw err;
      }
    }
  }

  if (user.userTypeKey !== persistedUser.userTypeKey) {
    user.userTypeKey = persistedUser.userTypeKey;
  }
  return true;
}

export async function revertCompanyAndIirmAssociation({
  userId,
  manager,
  userRepo,
  roleRepo,
  userRoleRepo,
}: RevertAssociationDependencies): Promise<void> {
  const userRepository = manager?.getRepository(User) ?? userRepo;
  const roleRepository = manager?.getRepository(Role) ?? roleRepo;
  const userRoleRepository = manager?.getRepository(UserRole) ?? userRoleRepo;

  const persistedUser = await userRepository.findOne({
    where: { userId, deletedAt: IsNull() },
    ...(manager ? { lock: { mode: "pessimistic_write" as const } } : {}),
  });

  if (!persistedUser) {
    return;
  }

  if (
    persistedUser.userTypeKey !== USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE
  ) {
    return;
  }

  const roles = await roleRepository.find({
    where: {
      roleKey: In([
        USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
        USER_TYPE_IIRM_EMPLOYEE,
      ]),
    },
  });
  const roleIds = roles.map((role) => role.id);

  await userRoleRepository.delete({ userId, roleId: In(roleIds) });

  await userRepository.update(
    { userId },
    { userTypeKey: USER_TYPE_IIRM_EMPLOYEE }
  );
}

export async function handleMapDeletions({
  maps,
  upload,
  employeePolicyMapRepo,
  dependentRepo,
  employeeEnrollmentRepo,
  policyEmployeeEndorsementRepo,
  userRepo,
  roleRepo,
  userRoleRepo,
  effectiveDateByEmployeeId,
}: HandleMapDeletionsDependencies): Promise<void> {
  const deletedIds = maps.map((m) => m.employeeId);

  for (const map of maps) {
    const rawEffectiveDate = effectiveDateByEmployeeId?.get(map.employeeId);
    const effectiveDate =
      rawEffectiveDate instanceof Date && !Number.isNaN(rawEffectiveDate.getTime())
        ? rawEffectiveDate
        : new Date();

    await employeePolicyMapRepo.update(
      { id: map.id },
      {
        deletedAt: effectiveDate,
        enrollmentDeletionBatchId: upload.documentId,
      }
    );

    // Only touch dependents that aren't already deleted — a dependent removed
    // in an earlier endorsement must keep their own deletedAt/batch/endorsement
    // linkage, not get overwritten with this employee-deletion's effective date.
    await dependentRepo.update(
      { employeeId: map.employeeId, policyId: upload.entityId, deletedAt: IsNull() },
      {
        deletedAt: effectiveDate,
        enrollmentDeletionBatchId: upload.documentId,
        deletionEndorsementId: upload.endorsementId,
        endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
      }
    );

    await employeeEnrollmentRepo.update(
      { employeeId: map.employeeId, policyId: upload.entityId },
      { deletedAt: effectiveDate }
    );
  }

  await policyEmployeeEndorsementRepo.update(
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
    await revertCompanyAndIirmAssociation({
      userId,
      userRepo,
      roleRepo,
      userRoleRepo,
    });
  }
}

export type DeletionLookupKeyType = "id" | "phone" | "email";

export const buildDeletionLookupKeys = (
  type: DeletionLookupKeyType,
  value: unknown
): string[] => {
  if (value === undefined || value === null) {
    return [];
  }

  const raw = String(value).trim();
  if (!raw) {
    return [];
  }

  if (type === "phone") {
    const digitsOnly = raw.replace(/\D+/g, "");
    if (!digitsOnly) {
      return [];
    }

    const keys = new Set<string>();
    keys.add(`phone:${digitsOnly}`);
    if (digitsOnly.length > 10) {
      keys.add(`phone:${digitsOnly.slice(-10)}`);
    }
    return Array.from(keys);
  }

  if (type === "id") {
    const lowered = raw.toLowerCase();
    const compact = lowered.replace(/[^a-z0-9]/g, "");
    const keys = new Set<string>();
    keys.add(`id:${lowered}`);
    if (compact && compact !== lowered) {
      keys.add(`id:${compact}`);
    }
    return Array.from(keys);
  }

  return [`email:${raw.toLowerCase()}`];
};

export const normalizeValue = (val: string): string =>
  String(val ?? "").toLowerCase().replace(/[^a-z0-9]/gi, "");

export const findRelationIndex = (headers: string[]): number => {
  const normalizeHeader = (h: string) =>
    h.toLowerCase().replace(/[\\s_]+/g, "");
  return headers.findIndex((h) => {
    const norm = normalizeHeader(h);
    return norm === "relationship" || norm === "relation";
  });
};

export const findRelationshipTypeIndex = (headers: string[]): number => {
  const normalizeHeader = (h: string) =>
    h.toLowerCase().replace(/[\\s_]+/g, "");
  return headers.findIndex((h) => {
    const norm = normalizeHeader(h);
    return (
      norm === "relationshiptype" ||
      norm === "relationtype" ||
      norm === "dependenttype"
    );
  });
};

const CHILD_RELATIONSHIP_TYPE_KEYS = new Set<string>([
  PARENT_RELATIONSHIP_TYPES.CHILD,
  normalizeValue("Children"),
]);

const hasCompleteDate = (val: string): boolean => {
  if (!val) return false;
  const normalized = String(val).trim();
  const patterns = [
    /^\d{4}[-/\. ]\d{1,2}[-/\. ]\d{1,2}$/,
    /^\d{1,2}[-/\. ]\d{1,2}[-/\. ]\d{4}$/,
  ];
  return patterns.some((p) => p.test(normalized));
};

export const parseDateValue = (val: unknown): Date | null => {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === "number") {
    const p = XLSX.SSF.parse_date_code(val);
    return p ? new Date(p.y, p.m - 1, p.d) : null;
  }
  const str = String(val).trim();
  let m: RegExpMatchArray | null;
  if ((m = str.match(/^(\d{4})[-\/\. ](\d{1,2})[-\/\. ](\d{1,2})$/))) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  if ((m = str.match(/^(\d{1,2})[-\/\. ](\d{1,2})[-\/\. ](\d{4})$/))) {
    const d1 = Number(m[1]);
    const d2 = Number(m[2]);
    if (d2 > 12) {
      return null;
    }
    const y = Number(m[3]);
    return new Date(y, d2 - 1, d1);
  }
  if ((m = str.match(/^(\d{1,2})[-\/\. ](\d{1,2})[-\/\. ](\d{2})$/))) {
    const first = Number(m[1]);
    const second = Number(m[2]);
    const y = Number(m[3]);
    const year = y >= 70 ? 1900 + y : 2000 + y;

    if (first > 12 && second <= 12) {
      return new Date(year, second - 1, first);
    }
    if (second > 12 && first <= 12) {
      return new Date(year, first - 1, second);
    }

    const fallbackString = `${String(first).padStart(2, "0")}/${String(
      second
    ).padStart(2, "0")}/${year}`;
    const fallbackDate = new Date(fallbackString);
    if (!Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }

    return new Date(year, second - 1, first);
  }
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;};

export function formatDateForDisplay(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  let parsed: Date | null = null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    parsed = value;
  } else {
    parsed = parseDateValue(value);
  }

  if (!parsed) {
    const str = String(value).trim();
    return str === "" ? null : str;
  }

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();

  return `${day}/${month}/${year}`;
}

const isValidDateInstance = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const normalizeHeaderKey = (header: string) =>
  header?.toLowerCase().replace(/[\s_]+/g, "");

const coerceDate = (value: unknown): Date | null => {
  if (isValidDateInstance(value)) {
    return value;
  }
  return parseDateValue(value);
};

const extractEffectiveDateFromAdditionalParams = (
  additional: Record<string, any> | undefined,
  effectiveDateHeaderName?: string | null
): Date | null => {
  if (!additional) {
    return null;
  }

  const candidates: unknown[] = [];
  if (
    effectiveDateHeaderName &&
    Object.prototype.hasOwnProperty.call(additional, effectiveDateHeaderName)
  ) {
    candidates.push(additional[effectiveDateHeaderName]);
  }

  for (const [key, value] of Object.entries(additional)) {
    if (normalizeHeaderKey(key) === "effectivedate") {
      candidates.push(value);
    }
  }

  for (const candidate of candidates) {
    const parsed = coerceDate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

export const resolveDeletionEffectiveDate = (
  row:
    | {
        effectiveDate?: Date | null;
        additionalParams?: Record<string, any>;
        rowObj?: Record<string, any>;
      }
    | undefined,
  effectiveDateHeaderName?: string | null
): Date | null => {
  if (!row) {
    return null;
  }

  const direct = coerceDate(row.effectiveDate);
  if (direct) {
    return direct;
  }

  const fromAdditional = extractEffectiveDateFromAdditionalParams(
    row.additionalParams,
    effectiveDateHeaderName
  );
  if (fromAdditional) {
    return fromAdditional;
  }

  if (effectiveDateHeaderName) {
    const fromRowObj = coerceDate(row.rowObj?.[effectiveDateHeaderName]);
    if (fromRowObj) {
      return fromRowObj;
    }
  }

  if (row.rowObj) {
    for (const [key, value] of Object.entries(row.rowObj)) {
      if (normalizeHeaderKey(key) === "effectivedate") {
        const parsed = coerceDate(value);
        if (parsed) {
          return parsed;
        }
      }
    }
  }

  return null;
};

export const isWithin24Hours = (
  date: Date,
  now: Date = new Date()
): boolean => {
  const diff = Math.abs(date.getTime() - now.getTime());
  return diff <= 24 * 60 * 60 * 1000;
};

const areAdditionalValuesEqual = (
  existingValue: any,
  incomingValue: any
): boolean => {
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
};

const mergeAdditionalParams = (
  existing: Record<string, any> | null | undefined,
  incoming: Record<string, any> | null | undefined
): {
  merged: Record<string, any>;
  hasChanges: boolean;
} => {
  const base =
    existing && typeof existing === "object" ? { ...existing } : {};
  const additions =
    incoming && typeof incoming === "object" ? incoming : {};

  let hasChanges = false;
  for (const [key, value] of Object.entries(additions)) {
    if (!Object.prototype.hasOwnProperty.call(base, key)) {
      base[key] = value;
      hasChanges = true;
    } else if (!areAdditionalValuesEqual(base[key], value)) {
      base[key] = value;
      hasChanges = true;
    }
  }

  return { merged: base, hasChanges };
};

// Fires the moment an Endorsement is created via the shared enrollment-
// upload pipeline (createEnrollmentUpload) — NOT when its background upload
// job later finishes. Explicit product decision: don't wait for
// COMPLETED/FAILED, notify as soon as the endorsement exists so reviewers
// aren't blocked on processing time. Closes a real gap confirmed by tracing
// this pipeline end-to-end: neither this util nor EnrollmentUploadScheduler
// ever write Endorsement.endorsementStatus, and nothing here ever creates a
// Task or notification, so a Zoho/HCL-originated endorsement could sit at
// ENDORSEMENT_REQUEST_RECEIVED indefinitely with nobody told to go look. See
// docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md §15.
//
// Notifies the company's CRM (Company.leadCrm, falling back to
// accountManager) and the RiskWatch admin who actually submitted this
// endorsement (Endorsement.createdBy — the "current HR"/submitting user).
// Best-effort only, mirrors ApprovalNotificationService/
// MirReportService.sendMirNotification's swallow-all-errors pattern
// elsewhere in this codebase: a notification-service outage, or this
// endorsement having no resolvable companyId, must never block whatever
// caller (createEnrollmentUpload, or this util's own callers) triggered it.
//
// Takes a plain DataSource (not ProcessEmployeeUploadDependencies) and
// optional log callbacks so it's callable from any service — not just this
// util's own scheduler-service/ibp-service consumers, but also
// PolicyRepository.createEnrollmentUpload in policy-service, which is where
// this now actually gets called from.
export async function notifyEndorsementReadyForReview(
  dataSource: DataSource,
  params: {
    endorsementId?: number | null;
    policyId: number;
  },
  log?: {
    info?: (method: string, messageData: unknown) => void;
    error?: (method: string, messageData: unknown) => void;
  }
): Promise<void> {
  if (!params.endorsementId) {
    // Not every policy_employee_data upload is endorsement-scoped in
    // principle (the field is nullable on DocumentProcessingFile) — nothing
    // meaningful to notify anyone about without one.
    return;
  }
  try {
    const endorsement = await dataSource.getRepository(Endorsement).findOne({
      where: { id: params.endorsementId },
      select: { id: true, companyId: true, createdBy: true },
    });
    if (!endorsement?.companyId) {
      return;
    }

    const rows = await dataSource.query(
      `SELECT
         c.company_name AS "companyName",
         COALESCE(c.lead_crm, c.account_manager) AS "crmUserId",
         COALESCE(cu.email_id_enc, cu.email_id) AS "crmEmail",
         cu.first_name AS "crmFirstName",
         cu.last_name AS "crmLastName",
         hu.id AS "hrUserId",
         COALESCE(hu.email_id_enc, hu.email_id) AS "hrEmail"
       FROM company c
       LEFT JOIN users cu ON cu.id = COALESCE(c.lead_crm, c.account_manager)
       LEFT JOIN users hu ON hu.id = $2
       WHERE c.id = $1`,
      [endorsement.companyId, endorsement.createdBy ?? null]
    );
    const companyName: string = rows?.[0]?.companyName ?? "";
    // Greets the CRM by name specifically (not a per-recipient personalization
    // — this same rendered email also goes to the submitting HR admin, who
    // will see the CRM's name too, since both recipients share one rendered
    // template in a single notification-service call). Falls back to a
    // generic greeting if the CRM's name isn't on file.
    const crmName = [rows?.[0]?.crmFirstName, rows?.[0]?.crmLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const emails: string[] = [rows?.[0]?.crmEmail, rows?.[0]?.hrEmail].filter(Boolean);
    if (!emails.length) {
      log?.info?.("notifyEndorsementReadyForReview", {
        message: "No CRM/submitting-HR email resolved — skipping notification",
        endorsementId: params.endorsementId,
        companyId: endorsement.companyId,
      });
      return;
    }
    // notification-service's NOTIFICATION_IN_APP handler does
    // `dto.userId.forEach(...)` completely unguarded (notification.service.ts
    // ~line 687) — omitting userId doesn't just skip in-app, it throws
    // "Cannot read properties of undefined (reading 'forEach')" and fails
    // that channel outright (confirmed against real notification_log rows:
    // email channel succeeded, in-app failed with exactly this error, both
    // from the same call, before this fix). Harmless to also send on the
    // email channel — it only reads `userId?.[0]` there, optionally.
    const userIds: number[] = [
      ...new Set(
        [rows?.[0]?.crmUserId, rows?.[0]?.hrUserId]
          .map((id) => (id != null ? Number(id) : null))
          .filter((id): id is number => id != null && Number.isFinite(id))
      ),
    ];

    const iworkUrl =
      `${ENV.FRONTEND_IWORK_URL || "https://newiwork.indiainsure.com"}` +
      `/${params.policyId}/create-endorsement/${params.endorsementId}`;

    // Same branding-asset pattern used by every other HTML email this
    // codebase sends (e.g. company-employee.service.ts's feedback-
    // confirmation email) — a static logo hosted off the IBP frontend build,
    // plus the current year for the footer.
    const iirmLogoUrl = `${(ENV.FRONTEND_IBP_URL || "http://localhost:4201").replace(/\/+$/, "")}/static-images/${ENV.IBP_EMAIL_IIRM_LOGO_FILE || "iirmLogoUrl.png"}`;

    const basePayload = {
      eventType: NOTIFICATION_EVENT_TYPES.ENDORSEMENT_UPLOAD_READY_FOR_REVIEW,
      emailId: emails,
      userId: userIds,
      companyId: endorsement.companyId,
      parameters: {
        companyName,
        recipientName: crmName || "there",
        endorsementId: String(params.endorsementId),
        policyId: String(params.policyId),
        iworkUrl,
        iirmLogoUrl,
        currentYear: String(new Date().getFullYear()),
      },
    };
    const url = `${ENV.URL_NOTIFICATION_SERVICE}/notifications`;
    const headers = { "x-bypass-timeout": "true" };
    await Promise.allSettled([
      axios.post(url, { ...basePayload, channel: NOTIFICATION_EMAIL }, { headers }),
      axios.post(url, { ...basePayload, channel: NOTIFICATION_IN_APP }, { headers }),
    ]);
  } catch (err) {
    log?.error?.(
      "notifyEndorsementReadyForReview",
      `Failed to send endorsement-ready-for-review notification for endorsement ${params.endorsementId}: ${err}`
    );
  }
}

async function processEmployeeUploadWithRedis(
  upload: DocumentProcessingFile,
  deps: ProcessEmployeeUploadDependencies,
  timing: { overallStartTime: number; phase1StartTime: number }
): Promise<void> {
  const redis = deps.redis;
  if (!redis) {
    throw new Error("Redis client not available");
  }

  const MAX_BUCKET_SIZE = 5000;
  const bucketPrefix = `employee_upload_${upload.id}`;

  let additionBucketCounter = 1;
  let deletionBucketCounter = 1;
  let errorBucketCounter = 1;
  let successBucketCounter = 1;

  const additionBucketIds: string[] = [];
  const deletionBucketIds: string[] = [];
  const errorBucketIds: string[] = [];
  const successBucketIds: string[] = [];

  let currentAdditionBucket = createRedisBucket<RowCollect>(
    `${bucketPrefix}_addition_${additionBucketCounter}`
  );
  let currentDeletionBucket = createRedisBucket<RowCollect>(
    `${bucketPrefix}_deletion_${deletionBucketCounter}`
  );
  let currentErrorBucket = createRedisBucket<any>(
    `${bucketPrefix}_error_${errorBucketCounter}`
  );
  let currentSuccessBucket = createRedisBucket<any>(
    `${bucketPrefix}_success_${successBucketCounter}`
  );

  const flushBucket = async <T>(
    bucket: RedisBucket<T>,
    bucketIds: string[]
  ) => {
    if (bucket.size > 0) {
      await redis.set(bucket.bucketId, JSON.stringify(bucket), "EX", 86400);
      bucketIds.push(bucket.bucketId);
    }
  };

  const rotateAdditionBucket = async () => {
    await flushBucket(currentAdditionBucket, additionBucketIds);
    additionBucketCounter += 1;
    currentAdditionBucket = createRedisBucket<RowCollect>(
      `${bucketPrefix}_addition_${additionBucketCounter}`
    );
  };

  const rotateDeletionBucket = async () => {
    await flushBucket(currentDeletionBucket, deletionBucketIds);
    deletionBucketCounter += 1;
    currentDeletionBucket = createRedisBucket<RowCollect>(
      `${bucketPrefix}_deletion_${deletionBucketCounter}`
    );
  };

  const rotateErrorBucket = async () => {
    await flushBucket(currentErrorBucket, errorBucketIds);
    errorBucketCounter += 1;
    currentErrorBucket = createRedisBucket<any>(
      `${bucketPrefix}_error_${errorBucketCounter}`
    );
  };

  const rotateSuccessBucket = async () => {
    await flushBucket(currentSuccessBucket, successBucketIds);
    successBucketCounter += 1;
    currentSuccessBucket = createRedisBucket<any>(
      `${bucketPrefix}_success_${successBucketCounter}`
    );
  };

  let errorCount = 0;
  let successCount = 0;
  let additionRowCount = 0;
  let deletionRowCount = 0;

  const pushErrorRow = async (rowObj: any) => {
    currentErrorBucket.records.push(rowObj);
    currentErrorBucket.size += 1;
    errorCount += 1;
    if (currentErrorBucket.size >= MAX_BUCKET_SIZE) {
      await rotateErrorBucket();
    }
  };

  const pushSuccessRow = async (rowObj: any) => {
    currentSuccessBucket.records.push(rowObj);
    currentSuccessBucket.size += 1;
    successCount += 1;
    if (currentSuccessBucket.size >= MAX_BUCKET_SIZE) {
      await rotateSuccessBucket();
    }
  };

  const pushAdditionRow = async (row: RowCollect) => {
    currentAdditionBucket.records.push(row);
    currentAdditionBucket.size += 1;
    additionRowCount += 1;
    if (currentAdditionBucket.size >= MAX_BUCKET_SIZE) {
      await rotateAdditionBucket();
    }
  };

  const pushDeletionRow = async (row: RowCollect) => {
    currentDeletionBucket.records.push(row);
    currentDeletionBucket.size += 1;
    deletionRowCount += 1;
    if (currentDeletionBucket.size >= MAX_BUCKET_SIZE) {
      await rotateDeletionBucket();
    }
  };

  const file = await deps.fileRepo.findOne({
    where: { id: upload.documentId },
  });

  if (!file) {
    deps.logError(
      "processUpload",
      `File not found for document ID: ${upload.documentId}`
    );
    throw new Error("File not found");
  }

  const policyDetails = await deps.policyRepo.findOne({
    where: { id: upload.entityId },
  });

  if (!policyDetails) {
    deps.logError(
      "processUpload",
      `Policy details not found for document ID: ${upload.documentId}`
    );
    throw new Error("Policy details not found");
  }

  const policyTermStart = normalizeToDateOnly(policyDetails.policyFrom);
  const policyTermEnd = normalizeToDateOnly(policyDetails.policyTo);


  deps.logInfo("processUpload - Policy Duration", {
    message: "processUpload - Policy Duration",
    phase: "processUpload - Policy Duration",
    policyStartDate: policyTermStart,
    policyEndDate: policyTermEnd,
  });

  if (!policyTermStart || !policyTermEnd) {
    deps.logError("processUpload", {
      message: "Invalid policy term dates",
      policyId: policyDetails.id,
    });
    throw new Error("Invalid policy term dates");
  }

  const today = normalizeToDateOnly(new Date());
  if (today && policyTermEnd < today) {
    deps.logError("processUpload", {
      message: "Policy has expired. Enrollment not allowed.",
      policyId: policyDetails.id,
      policyTermEnd,
      today,
    });
    throw new Error(`Policy has expired on ${policyTermEnd.toISOString().split("T")[0]}. Enrollment not allowed.`);
  }

  const policyTermStartLabel =
    formatDateForDisplay(policyTermStart) ??
    toDateOnlyString(policyTermStart) ??
    new Date(policyTermStart).toISOString().split("T")[0];
  const policyTermEndLabel =
    formatDateForDisplay(policyTermEnd) ??
    toDateOnlyString(policyTermEnd) ??
    new Date(policyTermEnd).toISOString().split("T")[0];

  let policyConfiguration: any | null = null;
  try {
    policyConfiguration = await loadPolicyConfiguration({
      policyId: policyDetails.id,
      policyConfigRepo: deps.policyConfigRepo,
      lookUpRepository: deps.lookUpRepository,
    });
  } catch (configError) {
    deps.logError("processUpload", {
      message: "Failed to load policy configuration",
      policyId: policyDetails.id,
      error: configError,
    });
  }

  const selfAgeLimits = policyConfiguration
    ? deriveSelfAgeLimitsFromPolicyConfig(policyConfiguration)
    : null;
  const policyParameterLookup = policyConfiguration
    ? buildPolicyParameterLookup(policyConfiguration)
    : new Map<string, any>();

  // Fetch valid policy location addresses once before processing rows
  let validPolicyLocations: Set<string> | null = null;
  let locationAddressIdMap: Map<string, number> = new Map();
  if (policyConfiguration?.enablePolicyLocations === true) {
    try {
      const result = await fetchValidPolicyLocations(
        deps.policyConfigRepo.manager,
        policyDetails.id
      );
      validPolicyLocations = result.validCodes;
      locationAddressIdMap = result.addressIdMap;
    } catch (locErr) {
      deps.logError("processUpload", {
        message: "Failed to fetch valid policy locations",
        policyId: policyDetails.id,
        error: locErr,
      });
    }
  }

  const companyAuthMethod = await getCompanyAuthenticationMethod(
    policyDetails.companyId,
    deps
  );

  const normalizeHeader = (h: string) =>
    h.toLowerCase().replace(/[\s_]+/g, "");

  deps.logInfo("processUpload", {
    message: "Starting file download from S3",
    fileKey: file.fileKey,
  });
  const buffer = await downloadFromS3(file.fileKey);
  deps.logInfo("processUpload", {
    message: "File downloaded successfully",
    bufferSize: buffer.length,
  });

  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames.filter((name) => name?.toLowerCase() !== 'template helper')[0];
  const sheet = workbook.Sheets[sheetName];
  const rowsData: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  deps.logInfo("processUpload", {
    message: "Workbook parsed successfully",
    sheetName,
    totalRows: rowsData.length,
  });

  let headerValues: string[] | null = null;
  let intakeTypeIdx = -1;
  let effectiveDateIdx = -1;
  let effectiveDateHeaderName: string | null = null;
  let relationshipIdx = -1;

  const addedEmployeeIds: number[] = [];
  const seenEmployeeIds = new Set<string>();
  const seenEmails = new Set<string>();
  const staticMap: Record<string, keyof PolicyEnrollmentEmployee> = {
    employeeid: "companyEmployeeId",
    fullname: "employeeName",
    dateofbirth: "dateOfBirth",
    gender: "gender",
    email: "email",
    mobilenumber: "phoneNumber",
    policylocation: "policyLocation",
  };
  const normalizedMap: Record<string, keyof PolicyEnrollmentEmployee> =
    Object.fromEntries(
      Object.entries(staticMap).map(([k, v]) => [normalizeHeader(k), v])
    );
  let currentEmployee: RowCollect | null = null;
  let skipCurrentEmployee = false;

  const flushCurrentEmployee = async () => {
    if (!currentEmployee) {
      return;
    }
    if (currentEmployee.intakeType === "deletion") {
      await pushDeletionRow(currentEmployee);
    } else {
      await pushAdditionRow(currentEmployee);
    }
    currentEmployee = null;
  };

  for (let rowIndex = 0; rowIndex < rowsData.length; rowIndex++) {
    const values = rowsData[rowIndex] || [];

    if (!headerValues) {
      headerValues = values.map((h: any) =>
        String(h ?? "").trim()
      );
      intakeTypeIdx = headerValues.findIndex(
        (h) => normalizeHeader(h) === "intaketype"
      );
      effectiveDateIdx = headerValues.findIndex(
        (h) => normalizeHeader(h) === "effectivedate"
      );
      effectiveDateHeaderName =
        effectiveDateIdx >= 0 ? headerValues[effectiveDateIdx] : null;
      relationshipIdx = findRelationIndex(headerValues);

      deps.logInfo("processUpload", {
        message: "Header row parsed",
        headerValues,
        intakeTypeIdx,
        effectiveDateIdx,
        effectiveDateHeaderName,
        relationshipIdx,
      });
      continue;
    }

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
      employeeCompanyId: policyDetails.companyId,
    };
    const additional: Record<string, any> = {};
    let enrollmentStartDate: Date | null = null;
    let enrollmentEndDate: Date | null = null;
    let dobRaw: string | null = null;
    let effectiveDate: Date | null = null;
    const missingColumns: string[] = [];
    headerValues.forEach((header, idx) => {
        if (!header || header.trim() === "") return;
        const norm = normalizeHeader(header);
        const val = values[idx];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === "" ||
          (typeof val === "string" && val.trim() === "");
        if (isEmpty) {
          // Only flag required static fields (name, dob, email, etc.) as missing.
          // Non-static columns (policy params, user detail labels) are either optional
          // or validated separately — flagging all empties causes false "cannot be empty" errors.
          if (normalizedMap[norm]) {
            missingColumns.push(header);
          }
          return;
        }
        const staticKey = normalizedMap[norm];
        if (staticKey) {
          if (staticKey === "dateOfBirth") {
            dobRaw = String(val);
            const parsedDob = parseDateValue(val);
            companyEmployee[staticKey] = parsedDob;
            deps.logInfo("processUpload", {
              stage: "dateOfBirthParsing",
              rowIndex,
              rawValue: val,
              parsedValue: parsedDob ? parsedDob.toISOString() : null,
              employeeId: companyEmployee.companyEmployeeId,
            });
          } else if (staticKey === "gender") {
            const g = String(val).trim().toLowerCase();
            if (["male", "m"].includes(g)) {
              companyEmployee.gender = "Male";
            } else if (["female", "f"].includes(g)) {
              companyEmployee.gender = "Female";
            } else {
              companyEmployee.gender = String(val);
            }
          } else if (staticKey === "email") {
            companyEmployee[staticKey] = String(val).trim().toLowerCase();
          } else {
            companyEmployee[staticKey] = String(val);
          }
        } else {
          if (norm !== "intaketype") {
            additional[header] = val;
          }
          if (norm === "enrollmentstartdate") {
            enrollmentStartDate = parseDateValue(val);
            deps.logInfo("processUpload", {
              stage: "enrollmentStartDateParsing",
              rowIndex,
              rawValue: val,
              parsedValue: enrollmentStartDate ? enrollmentStartDate.toISOString() : null,
            });
          } else if (norm === "enrollmentenddate") {
            enrollmentEndDate = parseDateValue(val);
            deps.logInfo("processUpload", {
              stage: "enrollmentEndDateParsing",
              rowIndex,
              rawValue: val,
              parsedValue: enrollmentEndDate ? enrollmentEndDate.toISOString() : null,
            });
          } else if (norm === "effectivedate") {
            effectiveDate = parseDateValue(val);
            deps.logInfo("processUpload", {
              stage: "effectiveDateParsing",
              rowIndex,
              rawValue: val,
              parsedValue: effectiveDate ? effectiveDate.toISOString() : null,
            });
          }
        }
      });

    const rowObj: any = {};
    headerValues.forEach((h, idx) => {
      const normalizedHeader = normalizeHeader(h);
      const rawValue = values[idx];
      if (normalizedHeader === "effectivedate") {
        const formatted = formatDateForDisplay(rawValue);
        rowObj[h] =
          formatted ??
          (rawValue !== undefined && rawValue !== null ? String(rawValue) : "");
        deps.logInfo("processUpload", {
          stage: "effectiveDateFormatting",
          rowIndex,
          rawValue,
          formattedValue: formatted,
        });
      } else {
        rowObj[h] = String(rawValue ?? "");
      }
    });

    const intakeRawValue =
      intakeTypeIdx !== -1
        ? values[intakeTypeIdx]
        : undefined;
    const rawIntakeType =
      intakeRawValue !== undefined && intakeRawValue !== null && intakeRawValue !== ""
        ? String(intakeRawValue).toLowerCase()
        : currentEmployee?.intakeType || "addition";
    const intakeType =
      rawIntakeType === "inception" ? "addition" : rawIntakeType;

    if (!["addition", "deletion", "inception"].includes(rawIntakeType)) {
      rowObj["Remarks"] = "Invalid intake type";
      await pushErrorRow(rowObj);
      currentEmployee = null;
      continue;
    }

    let relationship = "self";
    if (relationshipIdx !== -1) {
      relationship = String(
        values[relationshipIdx] ?? ""
      )
        .trim()
        .toLowerCase();
    }

    const isMockId =
      companyEmployee.companyEmployeeId &&
      String(companyEmployee.companyEmployeeId)
        .toLowerCase()
        .includes("fake");

    if (relationship === "self") {
      await flushCurrentEmployee();
      if (isMockId) {
        rowObj["Remarks"] = "Mock employee record ignored";
        await pushErrorRow(rowObj);
        skipCurrentEmployee = true;
        currentEmployee = null;
        continue;
      }
      skipCurrentEmployee = false;
    } else {
      if (skipCurrentEmployee) {
        continue;
      }
      if (isMockId) {
        rowObj["Remarks"] = "Mock employee record ignored";
        await pushErrorRow(rowObj);
        continue;
      }
    }

    if (missingColumns.length) {
      rowObj["Remarks"] = `${missingColumns.join(", ")} cannot be empty`;
      await pushErrorRow(rowObj);
      currentEmployee = relationship === "self" ? null : currentEmployee;
      continue;
    }

    // Validate Location Code column when enablePolicyLocations is on
    if (validPolicyLocations !== null) {
      const policyLocationValue = normalizePolicyLocationCode(
        rowObj[POLICY_LOCATION_FIELD_NAME] ||
          rowObj[POLICY_LOCATION_COLUMN_NAME]
      );
      if (!policyLocationValue) {
        rowObj["Remarks"] = POLICY_LOCATION_REQUIRED_ERROR;
        await pushErrorRow(rowObj);
        if (relationship === "self") currentEmployee = null;
        continue;
      }
      if (!validPolicyLocations.has(policyLocationValue)) {
        rowObj["Remarks"] = POLICY_LOCATION_MISMATCH_ERROR;
        await pushErrorRow(rowObj);
        if (relationship === "self") currentEmployee = null;
        continue;
      }
      companyEmployee.policyConfigLocationId = locationAddressIdMap.get(policyLocationValue) ?? null;
    }

    if (policyParameterLookup.size > 0) {
      const parameterValidationErrors: string[] = [];
      for (const [header, value] of Object.entries(additional)) {
        const normalizedHeader = normalizeValue(String(header));
        const parameter = policyParameterLookup.get(normalizedHeader);
        if (!parameter) {
          continue;
        }
        const validationMessage = validateParameterValue(
          parameter,
          header,
          value
        );
        if (validationMessage) {
          parameterValidationErrors.push(validationMessage);
        }
      }

      if (parameterValidationErrors.length) {
        rowObj["Remarks"] = `${parameterValidationErrors.join(
          "; "
        )}. Please verify.`;
        await pushErrorRow(rowObj);
        if (relationship === "self") {
          currentEmployee = null;
        }
        continue;
      }
    }

    if (relationship === "self") {
      const errorMsgs: string[] = [];
      if (!companyEmployee.employeeName) {
        errorMsgs.push("Full Name is required");
      }
      if (!dobRaw) {
        errorMsgs.push("DOB is required");
      } else if (!hasCompleteDate(dobRaw) && !parseDateValue(dobRaw)) {
        errorMsgs.push("DOB must include day, month and year");
      } else if ((parseDateValue(dobRaw)?.getTime() ?? 0) > Date.now()) {
        errorMsgs.push("DOB cannot be a future date");
      }
      if (companyEmployee.dateOfBirth && selfAgeLimits) {
        const age = calculateAge(companyEmployee.dateOfBirth as Date);
        const formattedAge = Number(age.toFixed(2));
        if (
          typeof selfAgeLimits.min === "number" &&
          !Number.isNaN(selfAgeLimits.min) &&
          age < selfAgeLimits.min
        ) {
          errorMsgs.push(
            errorMessages.employeeAgeBelowMinimum(
              formattedAge,
              selfAgeLimits.min
            )
          );
        }

        if (
          typeof selfAgeLimits.max === "number" &&
          !Number.isNaN(selfAgeLimits.max) &&
          age > selfAgeLimits.max
        ) {
          errorMsgs.push(
            errorMessages.employeeAgeExceedsMaximum(
              formattedAge,
              selfAgeLimits.max
            )
          );
        }
      }
      const emailVal = companyEmployee.email as string | undefined;
      if (!emailVal) {
        errorMsgs.push(
          EMAIL_AUTH_METHODS.has(companyAuthMethod ?? "")
            ? "Email is required for email-based authentication"
            : "Email is required"
        );
      } else if (!/^\S+@\S+\.\S+$/.test(emailVal)) {
        errorMsgs.push("Invalid email format");
      }

      if (
        PHONE_AUTH_METHODS.has(companyAuthMethod ?? "") &&
        !companyEmployee.phoneNumber
      ) {
        errorMsgs.push(
          "Phone number is required for phone-based authentication"
        );
      }

      if (
        companyEmployee.companyEmployeeId &&
        seenEmployeeIds.has(String(companyEmployee.companyEmployeeId))
      ) {
        errorMsgs.push("Duplicate employee ID in file");
      }
      if (companyEmployee.email && seenEmails.has(companyEmployee.email)) {
        errorMsgs.push("Duplicate email in file");
      }
        if (effectiveDate) {
          const normalizedEffectiveDate = normalizeToDateOnly(effectiveDate);
          deps.logInfo("processUpload", {
            stage: "effectiveDateValidation",
            rowIndex,
            employeeId: companyEmployee.companyEmployeeId,
            rawEffectiveDate: new Date(effectiveDate).toISOString(),
            normalizedEffectiveDate: normalizedEffectiveDate ? normalizedEffectiveDate.toISOString() : null,
            policyTermStart: new Date(policyTermStart).toISOString(),
            policyTermEnd: new Date(policyTermEnd).toISOString(),
            isWithinRange: normalizedEffectiveDate ? isDateWithinRange(
              normalizedEffectiveDate,
              policyTermStart,
              policyTermEnd
            ) : false,
          });
          if (
            !normalizedEffectiveDate ||
            !isDateWithinRange(
              normalizedEffectiveDate,
              policyTermStart,
              policyTermEnd
            )
          ) {
            errorMsgs.push(
              `Effective date must be between ${policyTermStartLabel} and ${policyTermEndLabel}`
            );
          }
        }

      if (errorMsgs.length) {
        rowObj["Remarks"] = `${errorMsgs.join("; ")}. Please verify.`;
        await pushErrorRow(rowObj);
        currentEmployee = null;
        continue;
      }

      if (companyEmployee.companyEmployeeId) {
        seenEmployeeIds.add(String(companyEmployee.companyEmployeeId));
      }
      if (companyEmployee.email) {
        seenEmails.add(companyEmployee.email);
      }

      await flushCurrentEmployee();

      companyEmployee.additionalParams = additional;
      currentEmployee = {
        companyEmployee,
        dependents: [],
        intakeType,
        rowObj,
        enrollmentStartDate,
        enrollmentEndDate,
        effectiveDate,
        additionalParams: additional,
      };
    } else {
      if (!currentEmployee) {
        let existingEmp: PolicyEnrollmentEmployee | null = null;
        const companyIdStr = String(policyDetails.companyId);
        if (companyEmployee.companyEmployeeId) {
          existingEmp = await deps.companyEmployeeRepo.findOne({
            where: {
              companyEmployeeId: String(companyEmployee.companyEmployeeId),
              employeeCompanyId: companyIdStr,
            },
          });
        }
        if (!existingEmp && companyEmployee.email) {
          existingEmp = await deps.companyEmployeeRepo.findOne({
            where: { email: companyEmployee.email, employeeCompanyId: companyIdStr },
          });
        }
        if (!existingEmp && companyEmployee.phoneNumber) {
          existingEmp = await deps.companyEmployeeRepo.findOne({
            where: { phoneNumber: companyEmployee.phoneNumber, employeeCompanyId: companyIdStr },
          });
        }
        if (existingEmp) {
          const enrollment = await deps.employeeEnrollmentRepo.findOne({
            where: {
              policyId: upload.entityId,
              employeeId: existingEmp.id,
            },
          });
          if (enrollment) {
            currentEmployee = {
              companyEmployee: existingEmp,
              dependents: [],
              intakeType,
              rowObj,
              enrollmentStartDate,
              enrollmentEndDate,
              effectiveDate,
            };
          } else {
            rowObj["Remarks"] = "Employee not enrolled in policy";
            await pushErrorRow(rowObj);
            continue;
          }
        } else {
          rowObj["Remarks"] = "Dependent row without matching employee";
          await pushErrorRow(rowObj);
          continue;
        }
      }
      if (
        companyEmployee.companyEmployeeId &&
        currentEmployee.companyEmployee.companyEmployeeId &&
        companyEmployee.companyEmployeeId !==
          currentEmployee.companyEmployee.companyEmployeeId
      ) {
        rowObj["Remarks"] = "Employee ID mismatch for dependent";
        await pushErrorRow(rowObj);
        continue;
      }
      if (!companyEmployee.employeeName) {
        rowObj["Remarks"] = "Dependent name is required";
        await pushErrorRow(rowObj);
        continue;
      }

      const dep: Partial<PolicyEnrollmentDependent> = {
        policyId: upload.entityId,
        name: companyEmployee.employeeName,
        relation: relationship,
        gender: companyEmployee.gender,
        dateOfBirth: companyEmployee.dateOfBirth,
        effectiveDate: currentEmployee.effectiveDate ?? undefined,
      };
      deps.logInfo("processUpload", {
        stage: "dependentDateOfBirth",
        rowIndex,
        dependentName: companyEmployee.employeeName,
        dateOfBirth: companyEmployee.dateOfBirth ? (companyEmployee.dateOfBirth as Date).toISOString() : null,
        effectiveDate: currentEmployee.effectiveDate ? currentEmployee.effectiveDate.toISOString() : null,
      });
      currentEmployee.dependents.push(dep);
    }
  }

  if (!headerValues) {
    deps.logError("processUpload", "File has no header row");
    throw new Error("File has no header row");
  }

  if (currentEmployee) {
    await flushCurrentEmployee();
  }

  await flushBucket(currentAdditionBucket, additionBucketIds);
  await flushBucket(currentDeletionBucket, deletionBucketIds);

  const phase1EndTime = Date.now();
  deps.logInfo("processUpload", {
    message: "Phase 1 completed - rows validated",
    phase: "Phase 1 - Load and validation",
    parsedRowCount: additionRowCount + deletionRowCount,
    errorCount,
    phase1Duration: formatDuration(phase1EndTime - timing.phase1StartTime),
  });

  const phase2StartTime = Date.now();
  deps.logInfo("processUpload", {
    message: "Phase 2 started - deletion handling",
    phase: "Phase 2 - Deletions",
    deletionRowCount,
  });
  deps.logInfo("processUpload", {
    stage: "deletionRowsSummary",
    deletionRowCount,
    effectiveDateHeaderName,
  });

  const deletionEffectiveDateLookup = new Map<string, Date>();
  const delEmpIds = new Set<string>();
  const delPhones = new Set<string>();
  const delEmails = new Set<string>();
  let validDeletionRowCount = 0;

  for (const bucketId of deletionBucketIds) {
    const bucket = await readRedisBucket<RowCollect>(redis, bucketId);
    if (!bucket?.records?.length) {
      continue;
    }
    for (const row of bucket.records) {
      const { companyEmployee } = row;
      const resolvedEffectiveDate = resolveDeletionEffectiveDate(
        row,
        effectiveDateHeaderName
      );

      deps.logInfo("processUpload", {
        stage: "deletionRowEffectiveDateCapture",
        identifiers: {
          employeeId: companyEmployee.companyEmployeeId ?? null,
          email: companyEmployee.email ?? null,
          phone: companyEmployee.phoneNumber ?? null,
        },
        rawEffectiveDate: effectiveDateHeaderName
          ? row.rowObj?.[effectiveDateHeaderName]
          : null,
        additionalEffectiveDate: effectiveDateHeaderName
          ? row.additionalParams?.[effectiveDateHeaderName]
          : null,
        resolvedEffectiveDate: resolvedEffectiveDate
          ? resolvedEffectiveDate.toISOString()
          : null,
        isValidDate: Boolean(resolvedEffectiveDate),
      });

      if (!resolvedEffectiveDate) {
        continue;
      }
      const normalizedDeletionDate = normalizeToDateOnly(resolvedEffectiveDate);
      deps.logInfo("processUpload", {
        stage: "deletionDateNormalization",
        identifiers: {
          employeeId: companyEmployee.companyEmployeeId ?? null,
          email: companyEmployee.email ?? null,
          phone: companyEmployee.phoneNumber ?? null,
        },
        resolvedEffectiveDate: resolvedEffectiveDate.toISOString(),
        normalizedDeletionDate: normalizedDeletionDate ? normalizedDeletionDate.toISOString() : null,
        policyTermStart: policyTermStart.toISOString(),
        policyTermEnd: policyTermEnd.toISOString(),
        isWithinRange: normalizedDeletionDate ? isDateWithinRange(
          normalizedDeletionDate,
          policyTermStart,
          policyTermEnd
        ) : false,
      });
      if (
        !normalizedDeletionDate ||
        !isDateWithinRange(
          normalizedDeletionDate,
          policyTermStart,
          policyTermEnd
        )
      ) {
        row.rowObj["Remarks"] =
          `Effective date must be between ${policyTermStartLabel} and ${policyTermEndLabel}`;
        await pushErrorRow(row.rowObj);
        continue;
      }

      validDeletionRowCount += 1;
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

      if (companyEmployee.companyEmployeeId) {
        delEmpIds.add(String(companyEmployee.companyEmployeeId));
      }
      if (companyEmployee.phoneNumber) {
        delPhones.add(String(companyEmployee.phoneNumber));
      }
      if (companyEmployee.email) {
        delEmails.add(String(companyEmployee.email));
      }
    }
  }

  const mapsById = new Map<number, PolicyEnrollmentEmployeePolicyMap>();
  const fetchDeletionMaps = async (
    clause: (qb: any) => any
  ) => {
    const qb = deps.employeePolicyMapRepo
      .createQueryBuilder("map")
      .innerJoinAndSelect("map.employee", "emp")
      .where("map.policy_id = :pid", { pid: upload.entityId });
    const maps = await clause(qb).getMany();
    for (const map of maps) {
      mapsById.set(map.id, map);
    }
  };

  const delEmpIdChunks = chunkArray(Array.from(delEmpIds), 25000);
  for (const ids of delEmpIdChunks) {
    if (!ids.length) {
      continue;
    }
    await fetchDeletionMaps((qb) =>
      qb.andWhere("emp.company_employee_id = ANY(:ids)", { ids })
    );
  }

  const delPhoneChunks = chunkArray(Array.from(delPhones), 25000);
  for (const phones of delPhoneChunks) {
    if (!phones.length) {
      continue;
    }
    await fetchDeletionMaps((qb) =>
      qb.andWhere("emp.phone_number = ANY(:phones)", { phones })
    );
  }

  const delEmailChunks = chunkArray(Array.from(delEmails), 25000);
  for (const emails of delEmailChunks) {
    if (!emails.length) {
      continue;
    }
    await fetchDeletionMaps((qb) =>
      qb.andWhere("emp.email = ANY(:emails)", { emails })
    );
  }

  const mapsToDelete = Array.from(mapsById.values());
  const effectiveDateByEmployeeId = new Map<number, Date>();
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
        deps.logInfo("processUpload", {
          stage: "deletionEffectiveDateMatched",
          employeeId: map.employeeId,
          mapId: map.id,
          matchedKey: key,
          matchedEffectiveDate: match.toISOString(),
        });
        break;
      }
    }

    if (!effectiveDateByEmployeeId.has(map.employeeId)) {
      deps.logInfo("processUpload", {
        stage: "deletionEffectiveDateMissing",
        employeeId: map.employeeId,
        mapId: map.id,
        attemptedKeys: keys,
      });
    }
  }

  if (mapsToDelete.length) {
    await handleMapDeletions({
      maps: mapsToDelete,
      upload,
      employeePolicyMapRepo: deps.employeePolicyMapRepo,
      dependentRepo: deps.dependentRepo,
      employeeEnrollmentRepo: deps.employeeEnrollmentRepo,
      policyEmployeeEndorsementRepo: deps.policyEmployeeEndorsementRepo,
      userRepo: deps.userRepo,
      roleRepo: deps.roleRepo,
      userRoleRepo: deps.userRoleRepo,
      effectiveDateByEmployeeId,
    });
  }

  const phase2EndTime = Date.now();
  deps.logInfo("processUpload", {
    message: "Phase 2 completed - deletions handled",
    phase: "Phase 2 - Deletions",
    deletionRowCount: validDeletionRowCount,
    deletionMapCount: mapsToDelete.length,
    phase2Duration: formatDuration(phase2EndTime - phase2StartTime),
  });

  deps.logInfo(
    "processUpload",
    `Processed ${successCount} rows successfully.`
  );
  deps.logInfo("processUpload", `Found ${errorCount} errors.`);

  if (additionRowCount === 0 && mapsToDelete.length > 0 && upload.endorsementId) {
    await updateEndorsementSummaryAfterEnrollment(
      upload.endorsementId,
      {
        endorsementRepo: deps.endorsementRepo,
        policyRepo: deps.policyRepo,
        policyEmployeeEndorsementRepo: deps.policyEmployeeEndorsementRepo,
        policyDependentEndorsementRepo: deps.policyDependentEndorsementRepo,
        dependentRepo: deps.dependentRepo,
        uploadRepo: deps.uploadRepo,
        employeePolicyMapRepo: deps.employeePolicyMapRepo,
        employeeEnrollmentRepo: deps.employeeEnrollmentRepo,
        policyConfigRepo: deps.policyConfigRepo,
        lookUpRepository: deps.lookUpRepository,
      },
    );
  }

  const phase3StartTime = Date.now();
  deps.logInfo("processUpload", {
    message: "Phase 3 started - additions and summary",
    phase: "Phase 3 - Additions and summary",
    additionRowCount,
  });

  const totalRecords = additionRowCount;
  const submissionStart = Date.now();
  deps.logInfo(
    "processEnrollmentUpload",
    `Submitting enrollment for ${totalRecords} employees (start: ${new Date(
      submissionStart
    ).toISOString()})`
  );

  // IBP-detach: uploads never look employees up against the `users` table
  // anymore (no email/phone matching, no IIRM-employee promotion) — new and
  // existing employees are identified purely by policy_enrollment_employee
  // (companyEmployeeId/email/phone), and IBP login lives entirely on that
  // row. `userByEmail`/`userByPhone` stay empty so downstream lookups always
  // resolve to null and `policy_enrollment_employee.userId` stays null.
  const userByEmail = new Map<string, User>();
  const userByPhone = new Map<string, User>();
  const batchSize = 10000;
  const prefetchChunkSize = 25000;

  const processAdditionRows = async (additionRows: RowCollect[]) => {
    const normalizedContactByRow = new Map<
      RowCollect,
      { email?: string; phone?: string }
    >();
    for (const row of additionRows) {
      const email = row.companyEmployee.email
        ? String(row.companyEmployee.email).trim().toLowerCase()
        : undefined;
      const phone = row.companyEmployee.phoneNumber
        ? `+91${String(row.companyEmployee.phoneNumber).trim()}`
        : undefined;

      normalizedContactByRow.set(row, { email, phone });
      if (email) {
        row.companyEmployee.email = email;
      }
      if (phone) {
        row.companyEmployee.phoneNumber = phone;
      }
    }

    const addEmpIds = Array.from(
      new Set(
        additionRows
          .map((a) => a.companyEmployee.companyEmployeeId)
          .filter(Boolean)
      )
    );
    const addPhones = Array.from(
      new Set(
        additionRows.map((a) => a.companyEmployee.phoneNumber).filter(Boolean)
      )
    );
    const addEmails = Array.from(
      new Set(additionRows.map((a) => a.companyEmployee.email).filter(Boolean))
    );

    const employeeById: Record<string, PolicyEnrollmentEmployee> = {};
    const existingEmployeeMap = new Map<number, PolicyEnrollmentEmployee>();
    const addEmployeeToLookup = (emp: PolicyEnrollmentEmployee) => {
      if (existingEmployeeMap.has(emp.id)) {
        return;
      }
      existingEmployeeMap.set(emp.id, emp);
      if (emp.companyEmployeeId) {
        employeeById[String(emp.companyEmployeeId)] = emp;
      }
      if (emp.phoneNumber) {
        employeeById[`ph_${emp.phoneNumber}`] = emp;
      }
      if (emp.email) {
        employeeById[`em_${emp.email}`] = emp;
      }
    };

    for (const ids of chunkArray(addEmpIds, prefetchChunkSize)) {
      if (!ids.length) {
        continue;
      }
      const found = await deps.companyEmployeeRepo
        .createQueryBuilder("emp")
        .where("emp.company_employee_id = ANY(:ids)", { ids })
        .andWhere("emp.company_id = :companyId", { companyId: policyDetails.companyId })
        .getMany();
      for (const emp of found) {
        addEmployeeToLookup(emp);
      }
    }

    for (const phones of chunkArray(addPhones, prefetchChunkSize)) {
      if (!phones.length) {
        continue;
      }
      const found = await deps.companyEmployeeRepo
        .createQueryBuilder("emp")
        .where("emp.phone_number = ANY(:phones)", { phones })
        .andWhere("emp.company_id = :companyId", { companyId: policyDetails.companyId })
        .getMany();
      for (const emp of found) {
        addEmployeeToLookup(emp);
      }
    }

    for (const emails of chunkArray(addEmails, prefetchChunkSize)) {
      if (!emails.length) {
        continue;
      }
      const found = await deps.companyEmployeeRepo
        .createQueryBuilder("emp")
        .where("emp.email = ANY(:emails)", { emails })
        .andWhere("emp.company_id = :companyId", { companyId: policyDetails.companyId })
        .getMany();
      for (const emp of found) {
        addEmployeeToLookup(emp);
      }
    }

    const existingEmployees = Array.from(existingEmployeeMap.values());
    const existingMaps: PolicyEnrollmentEmployeePolicyMap[] = [];
    if (existingEmployees.length) {
      const employeeIdChunks = chunkArray(
        existingEmployees.map((e) => e.id),
        prefetchChunkSize
      );
      for (const empIds of employeeIdChunks) {
        if (!empIds.length) {
          continue;
        }
        const maps = await deps.employeePolicyMapRepo
          .createQueryBuilder("m")
          .withDeleted()
          .where("m.policy_id = :pid", { pid: upload.entityId })
          .andWhere("m.employee_id = ANY(:empIds)", {
            empIds,
          })
          .getMany();
        existingMaps.push(...maps);
      }
    }

    const mappedEmployeeIds = new Set(existingMaps.map((m) => m.employeeId));
    const userCreations: {
      row: RowCollect;
      data: {
        email?: string;
        phone?: string;
        companyEmployeeName?: string;
        companyId?: number | null;
        fileCompanyId?: number | null;
        employeeCompanyId?: string | number | null;
        companyEmployeeId?: string | number | null;
        dateOfBirth?: Date | string | null;
      };
    }[] = [];
    const employeeUpdates: { employeeId: number; additionalParams: any }[] = [];
    const pendingEmployeeRows: RowCollect[] = [];

    for (const row of additionRows) {
      const keyId =
        row.companyEmployee.companyEmployeeId !== undefined
          ? String(row.companyEmployee.companyEmployeeId)
          : undefined;
      const keyPhone = row.companyEmployee.phoneNumber
        ? `ph_${row.companyEmployee.phoneNumber}`
        : undefined;
      const keyEmail = row.companyEmployee.email
        ? `em_${row.companyEmployee.email}`
        : undefined;

      const existingEmp =
        (keyId && employeeById[keyId]) ||
        (keyPhone && employeeById[keyPhone]) ||
        (keyEmail && employeeById[keyEmail]);

      if (existingEmp && mappedEmployeeIds.has(existingEmp.id)) {
        row.rowObj["Remarks"] =
          "Company employee already exists (duplicate id/email/phone)";
        await pushErrorRow(row.rowObj);
        continue;
      }

      const contact = normalizedContactByRow.get(row) ?? {};
      const email = contact.email;
      const phone = contact.phone;

      const incomingAdditional =
        row.additionalParams ??
        row.companyEmployee.additionalParams ??
        {};
      if (existingEmp) {
        const { merged, hasChanges } = mergeAdditionalParams(
          existingEmp.additionalParams as Record<string, any> | undefined,
          incomingAdditional
        );
        row.additionalParams = merged;
        row.companyEmployee.additionalParams = merged;
        existingEmp.additionalParams = merged as any;

        if (hasChanges) {
          employeeUpdates.push({
            employeeId: existingEmp.id,
            additionalParams: merged,
          });
        }
      } else {
        row.additionalParams = incomingAdditional;
        row.companyEmployee.additionalParams = incomingAdditional;
      }

      const existingUser =
        (email && userByEmail.get(email)) ||
        (phone && userByPhone.get(phone)) ||
        null;
      if (existingUser) {
        (row as any).resolvedUserId = existingUser.userId;
      } else if (phone) {
        userCreations.push({
          row,
          data: {
            email,
            phone,
            companyEmployeeName: row.companyEmployee.employeeName,
            companyId: policyDetails.companyId,
            fileEntityId: file.entityId,
            employeeCompanyId: row.companyEmployee.employeeCompanyId,
            companyEmployeeId: row.companyEmployee.companyEmployeeId,
            dateOfBirth: row.companyEmployee.dateOfBirth,
          },
        });
      }

      if (existingEmp) {
        (row as any).resolvedEmployeeId = existingEmp.id;
        addedEmployeeIds.push(existingEmp.id);
      } else {
        pendingEmployeeRows.push(row);
      }
    }

    if (userCreations.length) {
      deps.logInfo("processUpload", {
        message: "User creation batch started",
        batchSize: userCreations.length,
      });
    }

    const role =
      (await deps.roleRepo.findOne({
        where: { roleKey: COMPANY_EMPLOYEE_ROLE_KEY },
      })) ??
      (await deps.roleRepo.save(
        deps.roleRepo.create({
          name: "Company Employee",
          description: "Company Employee",
          createdBy: "system",
          updatedBy: "system",
          roleKey: COMPANY_EMPLOYEE_ROLE_KEY,
        })
      ));

    // IBP-detach: compute loginName for new employees; no users table records created
    const ibpCredsMap = new Map<RowCollect, { loginName: string }>();
    for (const item of userCreations) {
      const { row, data } = item;
      const trimmedEmployeeIdentifier =
        data.companyEmployeeId !== undefined && data.companyEmployeeId !== null
          ? String(data.companyEmployeeId).trim()
          : "";
      const fallbackEmployeeIdentifier =
        trimmedEmployeeIdentifier ||
        (data.employeeCompanyId !== undefined && data.employeeCompanyId !== null
          ? String(data.employeeCompanyId).trim()
          : data.phone ?? "");
      const loginName =
        fallbackEmployeeIdentifier && fallbackEmployeeIdentifier.trim() !== ""
          ? fallbackEmployeeIdentifier.trim()
          : "employee";
      ibpCredsMap.set(row, { loginName });
    }

    for (const chunk of chunkArray(employeeUpdates, batchSize)) {
      deps.logInfo("processUpload", {
        message: "Employee additional params batch started",
        batchSize: chunk.length,
      });
      const additionalParamsStartTime = Date.now();
      for (const update of chunk) {
        try {
          await deps.companyEmployeeRepo.update(update.employeeId, {
            additionalParams: update.additionalParams,
          });
        } catch (additionalErr) {
          deps.logError(
            "processUpload",
            `Failed to update employee additional params for employee ${update.employeeId}: ${additionalErr}`
          );
        }
      }
      deps.logInfo("processUpload", {
        message: "Employee additional params batch completed",
        batchSize: chunk.length,
      });
      deps.logInfo("processUpload", {
        message: "Employee additional params batch duration",
        batchSize: chunk.length,
        duration: formatDuration(Date.now() - additionalParamsStartTime),
        durationMs: Date.now() - additionalParamsStartTime,
      });
    }

    for (const chunk of chunkArray(pendingEmployeeRows, batchSize)) {
      deps.logInfo("processUpload", {
        message: "Employee insert batch started",
        batchSize: chunk.length,
      });
      const employeeInsertStartTime = Date.now();
      const newEmployees = [];
      for (const row of chunk) {
        const createdUserId = (row as any).createdUserId as number | undefined;
        const resolvedUserId = (row as any).resolvedUserId as number | undefined;
        const contact = normalizedContactByRow.get(row) ?? {};
        const email = contact.email;
        const phone = contact.phone;
        const existingUser =
          (email && userByEmail.get(email)) ||
          (phone && userByPhone.get(phone)) ||
          null;
        const userId =
          createdUserId ??
          resolvedUserId ??
          existingUser?.userId ??
          null;

        const entity = deps.companyEmployeeRepo.create({
          ...row.companyEmployee,
          companyId: policyDetails.companyId,
          userId,
        });
        newEmployees.push({ row, entity });
      }

      if (!newEmployees.length) {
        continue;
      }

      try {
        const savedEmployees = await deps.companyEmployeeRepo.save(
          newEmployees.map((item) => item.entity),
          { chunk: batchSize }
        );
        for (let i = 0; i < savedEmployees.length; i++) {
          const saved = savedEmployees[i];
          const associatedRow = newEmployees[i]?.row;
          if (associatedRow) {
            (associatedRow as any).resolvedEmployeeId = saved.id;
            addedEmployeeIds.push(saved.id);
          }
        }
        // IBP-detach: store loginName in pee and create UserRole with ibpEmployeeId
        const ibpCredItems = newEmployees
          .map((item, idx) => ({ row: item.row, saved: savedEmployees[idx] }))
          .filter(({ row }) => ibpCredsMap.has(row));
        for (const { row, saved } of ibpCredItems) {
          if (!saved?.id) continue;
          const creds = ibpCredsMap.get(row)!;
          try {
            await deps.companyEmployeeRepo.update(saved.id, {
              loginName: creds.loginName,
              isPasswordSet: false,
              authVersion: 1,
              userStatusKey: "USER_STATUS_ACTIVE",
            });
            const existingRole = await deps.userRoleRepo.findOne({
              where: { ibpEmployeeId: saved.id, roleId: role.id },
            });
            if (!existingRole) {
              await deps.userRoleRepo.save(
                deps.userRoleRepo.create({ ibpEmployeeId: saved.id, roleId: role.id })
              );
            }
          } catch (credErr) {
            deps.logError("processUpload", `Failed to set IBP credentials for employee ${saved.id}: ${credErr}`);
          }
        }
        deps.logInfo("processUpload", {
          message: "Employee insert batch completed",
          batchSize: savedEmployees.length,
        });
        deps.logInfo("processUpload", {
          message: "Employee insert batch duration",
          batchSize: savedEmployees.length,
          duration: formatDuration(Date.now() - employeeInsertStartTime),
          durationMs: Date.now() - employeeInsertStartTime,
        });
      } catch (dbErr) {
        deps.logError(
          "processUpload",
          `DB error while saving employees: ${dbErr}`
        );
        for (const item of newEmployees) {
          item.row.rowObj["Remarks"] = "Database error";
          await pushErrorRow(item.row.rowObj);
        }
      }
    }

    const policyMaps: PolicyEnrollmentEmployeePolicyMap[] = [];
    const dependentsToSave: PolicyEnrollmentDependent[] = [];
    for (const row of additionRows) {
      const employeeId = (row as any).resolvedEmployeeId as number | undefined;
      if (!employeeId) {
        continue;
      }

      const effectiveDateForMap = row.effectiveDate ?? null;
      const enrollmentStartDateForMap = row.enrollmentStartDate ?? upload.enrollmentStartDate ?? null;
      const enrollmentEndDateForMap = row.enrollmentEndDate ?? upload.enrollmentEndDate ?? null;

      deps.logInfo("processUpload", {
        stage: "policyMapCreation",
        employeeId,
        enrollmentStartDate: enrollmentStartDateForMap ? toDateOnlyString(enrollmentStartDateForMap) : null,
        enrollmentEndDate: enrollmentEndDateForMap ? toDateOnlyString(enrollmentEndDateForMap) : null,
        effectiveDate: effectiveDateForMap ? toDateOnlyString(effectiveDateForMap) : null,
      });

      policyMaps.push(
        deps.employeePolicyMapRepo.create({
          employeeId,
          policyId: upload.entityId,
          enrollmentStartDate: enrollmentStartDateForMap,
          enrollmentEndDate: enrollmentEndDateForMap,
          effectiveDate: effectiveDateForMap,
          enrollmentAdditionBatchId: upload.documentId,
          additionalParams: row.additionalParams ?? {},
          isOnBoradingMailSent: false,
        })
      );

      for (const d of row.dependents) {
        const dependentDob = toDateOnlyString(d.dateOfBirth) as any;
        const dependentEffectiveDate = toDateOnlyString(d.effectiveDate) as any;
        
        deps.logInfo("processUpload", {
          stage: "dependentEntityCreation",
          employeeId,
          dependentName: d.name,
          dateOfBirth: dependentDob,
          effectiveDate: dependentEffectiveDate,
        });

        dependentsToSave.push(
          deps.dependentRepo.create({
            ...d,
            employeeId,
            dateOfBirth: dependentDob,
            effectiveDate: dependentEffectiveDate,
            enrollmentAdditionBatchId: upload.documentId,
          })
        );
      }

      await pushSuccessRow(row.rowObj);
      if (row.dependentRows?.length) {
        for (const depRow of row.dependentRows) {
          await pushSuccessRow(depRow);
        }
      }
    }

    for (const chunk of chunkArray(policyMaps, batchSize)) {
      if (!chunk.length) {
        continue;
      }
      deps.logInfo("processUpload", {
        message: "Policy map batch started",
        batchSize: chunk.length,
      });
      const policyMapStartTime = Date.now();
      try {
        await deps.employeePolicyMapRepo.save(chunk, { chunk: batchSize });
        deps.logInfo("processUpload", {
          message: "Policy map batch completed",
          batchSize: chunk.length,
        });
        deps.logInfo("processUpload", {
          message: "Policy map batch duration",
          batchSize: chunk.length,
          duration: formatDuration(Date.now() - policyMapStartTime),
          durationMs: Date.now() - policyMapStartTime,
        });
      } catch (mapErr) {
        deps.logError(
          "processUpload",
          `DB error while saving employee maps: ${mapErr}`
        );
      }
    }

    for (const chunk of chunkArray(dependentsToSave, batchSize)) {
      if (!chunk.length) {
        continue;
      }
      deps.logInfo("processUpload", {
        message: "Dependent batch started",
        batchSize: chunk.length,
      });
      const dependentInsertStartTime = Date.now();
      await deps.dependentRepo.save(chunk, { chunk: batchSize });
      deps.logInfo("processUpload", {
        message: "Dependent batch completed",
        batchSize: chunk.length,
      });
      deps.logInfo("processUpload", {
        message: "Dependent batch duration",
        batchSize: chunk.length,
        duration: formatDuration(Date.now() - dependentInsertStartTime),
        durationMs: Date.now() - dependentInsertStartTime,
      });
    }
  };

  for (const bucketId of additionBucketIds) {
    const bucket = await readRedisBucket<RowCollect>(redis, bucketId);
    if (!bucket?.records?.length) {
      continue;
    }
    await processAdditionRows(bucket.records);
  }

  await flushBucket(currentSuccessBucket, successBucketIds);
  await flushBucket(currentErrorBucket, errorBucketIds);

  let errorFileId: number | null = null;
  let successFileId: number | null = null;
  if (errorCount) {
    const sanitizedName = `policy-${
      upload.entityId
    }-errorfile${Date.now()}.xlsx`;
    const key = `uploads/company/${file.entityType}/errorfiles/${sanitizedName}`;

    try {
      const excelOptions = {
        batchSize: errorCount > 50000 ? 2000 : 1000,
        maxMemoryUsage: 200 * 1024 * 1024,
        timeout: errorCount > 100000 ? 60 * 60 * 1000 : 30 * 60 * 1000,
      };
      const errorStreamData = await generateExcelStream(
        streamRedisBucketRecords<any>(redis, errorBucketIds),
        excelOptions
      );
      await uploadToS3(
        errorStreamData,
        key,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const savedErrorFile = await deps.fileRepo.save(
        deps.fileRepo.create({
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
    } catch (uploadErr) {
      deps.logError(
        "processUpload",
        `Failed to upload error file for upload ${upload.id}: ${uploadErr}`
      );
    }
  }

  if (successCount) {
    const sanitizedName = `policy-${
      upload.entityId
    }-successfile${Date.now()}.xlsx`;
    const key = `uploads/company/${file.entityType}/successfiles/${sanitizedName}`;

    try {
      const excelOptions = {
        batchSize: successCount > 50000 ? 2000 : 1000,
        maxMemoryUsage: 200 * 1024 * 1024,
        timeout: successCount > 100000 ? 60 * 60 * 1000 : 30 * 60 * 1000,
      };
      const successStream = await generateExcelStream(
        streamRedisBucketRecords<any>(redis, successBucketIds),
        excelOptions
      );
      await uploadToS3(
        successStream,
        key,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const savedSuccessFile = await deps.fileRepo.save(
        deps.fileRepo.create({
          fileKey: key,
          entityType: file.entityType,
          entityId: file.entityId,
          uploadType: "AWS",
          documentTypeLid: file.documentTypeLid,
          createdBy: 0,
          updatedBy: 0,
        })
      );
      successFileId = savedSuccessFile.id;
    } catch (uploadErr) {
      deps.logError(
        "processUpload",
        `Failed to upload success file for upload ${upload.id}: ${uploadErr}`
      );
    }
  }

  const totalSuccessCount = successCount + mapsToDelete.length;
  const processCount = totalSuccessCount + errorCount;
  const summary = await deps.summaryRepo.save(
    deps.summaryRepo.create({
      documentProcessingFileId: upload.id,
      policyId: upload.entityId,
      sourceFileUploadId: file.id,
      errorFileUploadId: errorFileId,
      successFileUploadId: successFileId,
      successCount: totalSuccessCount,
      errorCount: errorCount,
      processCount,
      batchId: upload.id,
      endorsementId: upload.endorsementId,
    })
  );

  await deps.uploadRepo.update(upload.id, {
    processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
  });
  deps.logInfo("processUpload", `Upload ${upload.id} marked as COMPLETED.`);
  // notifyEndorsementReadyForReview no longer fires here — moved to fire
  // immediately at endorsement creation (PolicyRepository.
  // createEnrollmentUpload) instead of waiting for this job to finish. See
  // that function's own comment for why.

  const phase3EndTime = Date.now();
  deps.logInfo("processUpload", {
    message: "Phase 3 completed - additions and summary",
    phase: "Phase 3 - Additions and summary",
    summaryId: summary.id,
    processCount,
    successCount,
    errorCount,
    phase3Duration: formatDuration(phase3EndTime - phase3StartTime),
  });

  const overallDurationMs = Date.now() - timing.overallStartTime;
  const recordsPerSecond =
    overallDurationMs > 0
      ? Number(((processCount / overallDurationMs) * 1000).toFixed(2))
      : null;
  deps.logInfo("processUpload", {
    message: "Employee upload processing completed",
    uploadId: upload.id,
    documentId: upload.documentId,
    totalDuration: formatDuration(overallDurationMs),
    totalDurationMs: overallDurationMs,
    phase1Duration: formatDuration(phase1EndTime - timing.phase1StartTime),
    phase2Duration: formatDuration(phase2EndTime - phase2StartTime),
    phase3Duration: formatDuration(phase3EndTime - phase3StartTime),
    recordsPerSecond,
    processCount,
    successCount,
    errorCount,
  });

  try {
    await deleteRedisKeys(redis, [
      ...additionBucketIds,
      ...deletionBucketIds,
      ...errorBucketIds,
      ...successBucketIds,
    ]);
  } catch (cleanupErr) {
    deps.logError("processUpload", {
      message: "Failed to cleanup redis buckets",
      uploadId: upload.id,
      error: cleanupErr,
    });
  }
}

export async function processEmployeeUpload(
  upload: DocumentProcessingFile,
  deps: ProcessEmployeeUploadDependencies
): Promise<void> {
  deps.logInfo("processUpload", `Processing upload with ID: ${upload.id}`);
  const overallStartTime = Date.now();
  const phase1StartTime = Date.now();
  let phase1EndTime = 0;
  let phase2StartTime = 0;
  let phase2EndTime = 0;
  let phase3StartTime = 0;
  let phase3EndTime = 0;

  deps.logInfo("processUpload", {
    message: "Starting employee upload processing",
    uploadId: upload.id,
    documentId: upload.documentId,
    startTime: new Date(overallStartTime).toISOString(),
  });
  deps.logInfo("processUpload", {
    message: "Phase 1 started - load, parse, validate",
    phase: "Phase 1 - Load and validation",
    uploadId: upload.id,
    documentId: upload.documentId,
  });
  deps.logInfo("processUpload", {
    message: "Employee upload path selected",
    usingRedis: Boolean(deps.redis),
  });

  try {
    if (deps.redis) {
      await processEmployeeUploadWithRedis(upload, deps, {
        overallStartTime,
        phase1StartTime,
      });
      return;
    }
    const file = await deps.fileRepo.findOne({
      where: { id: upload.documentId },
    });

    if (!file) {
      deps.logError(
        "processUpload",
        `File not found for document ID: ${upload.documentId}`
      );
      throw new Error("File not found");
    }

    const policyDetails = await deps.policyRepo.findOne({
      where: { id: upload.entityId },
    });

    if (!policyDetails) {
      deps.logError(
        "processUpload",
        `Policy details not found for document ID: ${upload.documentId}`
      );
      throw new Error("Policy details not found");
    }

    const policyTermStart = normalizeToDateOnly(policyDetails.policyFrom);
    const policyTermEnd = normalizeToDateOnly(policyDetails.policyTo);

    if (!policyTermStart || !policyTermEnd) {
      deps.logError("processUpload", {
        message: "Invalid policy term dates",
        policyId: policyDetails.id,
      });
      throw new Error("Invalid policy term dates");
    }

    const today = normalizeToDateOnly(new Date());
    if (today && policyTermEnd < today) {
      deps.logError("processUpload", {
        message: "Policy has expired. Enrollment not allowed.",
        policyId: policyDetails.id,
        policyTermEnd,
        today,
      });
      throw new Error(`Policy has expired on ${policyTermEnd.toISOString().split("T")[0]}. Enrollment not allowed.`);
    }

    const policyTermStartLabel =
      formatDateForDisplay(policyTermStart) ??
      toDateOnlyString(policyTermStart) ??
      new Date(policyTermStart).toISOString().split("T")[0];
    const policyTermEndLabel =
      formatDateForDisplay(policyTermEnd) ??
      toDateOnlyString(policyTermEnd) ??
      new Date(policyTermEnd).toISOString().split("T")[0];

    let policyConfiguration: any | null = null;
    try {
      policyConfiguration = await loadPolicyConfiguration({
        policyId: policyDetails.id,
        policyConfigRepo: deps.policyConfigRepo,
        lookUpRepository: deps.lookUpRepository,
      });
    } catch (configError) {
      deps.logError("processUpload", {
        message: "Failed to load policy configuration",
        policyId: policyDetails.id,
        error: configError,
      });
    }

    const selfAgeLimits = policyConfiguration
      ? deriveSelfAgeLimitsFromPolicyConfig(policyConfiguration)
      : null;
    const policyParameterLookup = policyConfiguration
      ? buildPolicyParameterLookup(policyConfiguration)
      : new Map<string, any>();

    let validPolicyLocations: Set<string> | null = null;
    let locationAddressIdMap: Map<string, number> = new Map();
    let phoneCodeByCpclId: Map<number, string> = new Map();
    if (policyConfiguration?.enablePolicyLocations === true) {
      try {
        const result = await fetchValidPolicyLocations(
          deps.policyConfigRepo.manager,
          policyDetails.id
        );
        validPolicyLocations = result.validCodes;
        locationAddressIdMap = result.addressIdMap;
        phoneCodeByCpclId = result.phoneCodeByCpclId;
      } catch (locErr) {
        deps.logError("processEmployeeUpload", {
          message: "Failed to fetch valid policy locations",
          policyId: policyDetails.id,
          error: locErr,
        });
      }
    }
    let defaultCountryCallingCode: string | null = null;
    try {
      defaultCountryCallingCode = await fetchDefaultCountryCallingCode(
        deps.policyConfigRepo.manager,
        policyDetails.id,
        deps.redis
      );
      deps.logInfo("processEmployeeUpload", {
        message: "[PhoneCountryCode] Default calling code resolved",
        policyId: policyDetails.id,
        companyId: policyDetails.companyId,
        defaultCountryCallingCode,
        locationSpecificCodes: Array.from(phoneCodeByCpclId.entries()),
      });
    } catch (codeErr) {
      deps.logError("processEmployeeUpload", {
        message: "Failed to fetch default country calling code",
        companyId: policyDetails.companyId,
        error: codeErr,
      });
    }

    const companyAuthMethod = await getCompanyAuthenticationMethod(
      policyDetails.companyId,
      deps
    );

    const normalizeHeader = (h: string) =>
      h.toLowerCase().replace(/[\s_]+/g, "");

    const objectStream = getS3ReadStream(file.fileKey);
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
    let headerValues: string[] | null = null;
    let intakeTypeIdx = -1;
    let effectiveDateIdx = -1;
    let effectiveDateHeaderName: string | null = null;
    const rows: RowCollect[] = [];
    const errors: any[] = [];
    const successRows: any[] = [];
    const addedEmployeeIds: number[] = [];
    const seenEmployeeIds = new Set<string>();
    const seenEmails = new Set<string>();
    let relationshipIdx = -1;
    const staticMap: Record<string, keyof PolicyEnrollmentEmployee> = {
      employeeid: "companyEmployeeId",
      fullname: "employeeName",
      dateofbirth: "dateOfBirth",
      gender: "gender",
      email: "email",
      mobilenumber: "phoneNumber",
      policylocation: "policyLocation",
    };
    const normalizedMap: Record<string, keyof PolicyEnrollmentEmployee> =
      Object.fromEntries(
        Object.entries(staticMap).map(([k, v]) => [normalizeHeader(k), v])
      );
    let currentEmployee: RowCollect | null = null;
    let skipCurrentEmployee = false;

    const flushCurrentEmployee = () => {
      if (currentEmployee) {
        rows.push(currentEmployee);
        currentEmployee = null;
      }
    };

    let processedWorksheet = false;
    for await (const worksheet of workbookReader) {
      if (processedWorksheet) {
        break;
      }
      for await (const row of worksheet) {
        const values = Array.isArray(row.values)
          ? (row.values as any[]).slice(1)
          : [];

        if (!headerValues) {
          headerValues = values.map((h: any) =>
            String(normalizeExcelCellValue(h) ?? "").trim()
          );
          intakeTypeIdx = headerValues.findIndex(
            (h) => normalizeHeader(h) === "intaketype"
          );
          effectiveDateIdx = headerValues.findIndex(
            (h) => normalizeHeader(h) === "effectivedate"
          );
          effectiveDateHeaderName =
            effectiveDateIdx >= 0 ? headerValues[effectiveDateIdx] : null;
          relationshipIdx = findRelationIndex(headerValues);
          continue;
        }

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
        employeeCompanyId: policyDetails.companyId,
      };
      const additional: Record<string, any> = {};
      let enrollmentStartDate: Date | null = null;
      let enrollmentEndDate: Date | null = null;
      let dobError: string | null = null;
      let dobRaw: string | null = null;
      let effectiveDate: Date | null = null;
      const missingColumns: string[] = [];
      headerValues.forEach((header, idx) => {
        if (!header || header.trim() === "") return;
        const norm = normalizeHeader(header);
        const val = normalizeExcelCellValue(values[idx]);
        const isEmpty =
          val === undefined ||
          val === null ||
          val === "" ||
          (typeof val === "string" && val.trim() === "");
        if (isEmpty) {
          if (normalizedMap[norm]) {
            missingColumns.push(header);
          }
          return;
        }
        const staticKey = normalizedMap[norm];
        if (staticKey) {
          if (staticKey === "dateOfBirth") {
            dobRaw = String(val);
            companyEmployee[staticKey] = parseDateValue(val);
          } else if (staticKey === "gender") {
            const g = String(val).trim().toLowerCase();
            if (["male", "m"].includes(g)) {
              companyEmployee.gender = "Male";
            } else if (["female", "f"].includes(g)) {
              companyEmployee.gender = "Female";
            } else {
              companyEmployee.gender = String(val);
            }
          } else if (staticKey === "email") {
            companyEmployee[staticKey] = String(val).trim().toLowerCase();
          } else {
            companyEmployee[staticKey] = String(val);
          }
        } else {
          if (norm !== "intaketype") {
            additional[header] = val;
          }
          if (norm === "enrollmentstartdate") {
            enrollmentStartDate = parseDateValue(val);
          } else if (norm === "enrollmentenddate") {
            enrollmentEndDate = parseDateValue(val);
          } else if (norm === "effectivedate") {
            effectiveDate = parseDateValue(val);
          }
        }
      });

      const rowObj: any = {};
      headerValues.forEach((h, idx) => {
        const normalizedHeader = normalizeHeader(h);
        const rawValue = normalizeExcelCellValue(values[idx]);
        if (normalizedHeader === "effectivedate") {
          const formatted = formatDateForDisplay(rawValue);
          rowObj[h] =
            formatted ??
            (rawValue !== undefined && rawValue !== null
              ? String(rawValue)
              : "");
        } else {
          rowObj[h] = String(rawValue ?? "");
        }
      });

      const intakeRawValue =
        intakeTypeIdx !== -1
          ? normalizeExcelCellValue(values[intakeTypeIdx])
          : undefined;
      const rawIntakeType =
        intakeRawValue !== undefined && intakeRawValue !== null && intakeRawValue !== ""
          ? String(intakeRawValue).toLowerCase()
          : currentEmployee?.intakeType || "addition";
      const intakeType =
        rawIntakeType === "inception" ? "addition" : rawIntakeType;

      if (!["addition", "deletion", "inception"].includes(rawIntakeType)) {
        rowObj["Remarks"] = "Invalid intake type";
        errors.push(rowObj);
        currentEmployee = null;
        continue;
      }

      let relationship = "self";
      if (relationshipIdx !== -1) {
        relationship = String(
          normalizeExcelCellValue(values[relationshipIdx]) ?? ""
        )
          .trim()
          .toLowerCase();
      }

      const isMockId =
        companyEmployee.companyEmployeeId &&
        String(companyEmployee.companyEmployeeId)
          .toLowerCase()
          .includes("fake");

      if (relationship === "self") {
        flushCurrentEmployee();
        if (isMockId) {
          rowObj["Remarks"] = endorsementFileUploadMessages.ER0002;
          errors.push(rowObj);
          skipCurrentEmployee = true;
          currentEmployee = null;
          continue;
        }
        skipCurrentEmployee = false;
      } else {
        if (skipCurrentEmployee) {
          continue;
        }
        if (isMockId) {
          rowObj["Remarks"] = endorsementFileUploadMessages.ER0002;
          errors.push(rowObj);
          continue;
        }
      }

      if (missingColumns.length) {
        rowObj["Remarks"] = `${missingColumns.join(", ")} cannot be empty`;
        errors.push(rowObj);
        currentEmployee = relationship === "self" ? null : currentEmployee;
        continue;
      }

      // Validate Location Code column when enablePolicyLocations is on
      if (validPolicyLocations !== null) {
        const policyLocationValue = normalizePolicyLocationCode(
          rowObj[POLICY_LOCATION_FIELD_NAME] ||
            rowObj[POLICY_LOCATION_COLUMN_NAME]
        );
        if (!policyLocationValue) {
          rowObj["Remarks"] = POLICY_LOCATION_REQUIRED_ERROR;
          errors.push(rowObj);
          if (relationship === "self") currentEmployee = null;
          continue;
        }
        if (!validPolicyLocations.has(policyLocationValue)) {
          rowObj["Remarks"] = POLICY_LOCATION_MISMATCH_ERROR;
          errors.push(rowObj);
          if (relationship === "self") currentEmployee = null;
          continue;
        }
        companyEmployee.policyConfigLocationId = locationAddressIdMap.get(policyLocationValue) ?? null;
      }

      if (policyParameterLookup.size > 0) {
        const parameterValidationErrors: string[] = [];
        for (const [header, value] of Object.entries(additional)) {
          const normalizedHeader = normalizeValue(String(header));
          const parameter = policyParameterLookup.get(normalizedHeader);
          if (!parameter) {
            continue;
          }
          const validationMessage = validateParameterValue(
            parameter,
            header,
            value
          );
          if (validationMessage) {
            parameterValidationErrors.push(validationMessage);
          }
        }

        if (parameterValidationErrors.length) {
          rowObj["Remarks"] = `${parameterValidationErrors.join(
            "; "
          )}. Please verify.`;
          errors.push(rowObj);
          if (relationship === "self") {
            currentEmployee = null;
          }
          continue;
        }
      }

      if (relationship === "self") {
        const errorMsgs: string[] = [];
        if (!companyEmployee.employeeName) {
          errorMsgs.push(endorsementFileUploadMessages.ER0007);
        }
        if (!dobRaw) {
          errorMsgs.push(endorsementFileUploadMessages.ER0008);
        } else if (!hasCompleteDate(dobRaw) && !parseDateValue(dobRaw)) {
          errorMsgs.push("DOB must include day, month and year");
        } else if ((parseDateValue(dobRaw)?.getTime() ?? 0) > Date.now()) {
          errorMsgs.push("DOB cannot be a future date");
        }
        if (companyEmployee.dateOfBirth && selfAgeLimits) {
          const age = calculateAge(companyEmployee.dateOfBirth as Date);
          const formattedAge = Number(age.toFixed(2));
          if (
            typeof selfAgeLimits.min === "number" &&
            !Number.isNaN(selfAgeLimits.min) &&
            age < selfAgeLimits.min
          ) {
            errorMsgs.push(
              errorMessages.employeeAgeBelowMinimum(
                formattedAge,
                selfAgeLimits.min
              )
            );
          }

          if (
            typeof selfAgeLimits.max === "number" &&
            !Number.isNaN(selfAgeLimits.max) &&
            age > selfAgeLimits.max
          ) {
            errorMsgs.push(
              errorMessages.employeeAgeExceedsMaximum(
                formattedAge,
                selfAgeLimits.max
              )
            );
          }
        }
        const emailVal = companyEmployee.email as string | undefined;
        if (!emailVal) {
          errorMsgs.push(
            EMAIL_AUTH_METHODS.has(companyAuthMethod ?? "")
              ? endorsementFileUploadMessages.ER0009
              : endorsementFileUploadMessages.ER0010
          );
        } else if (!/^\S+@\S+\.\S+$/.test(emailVal)) {
          errorMsgs.push(endorsementFileUploadMessages.ER0011);
        }

        if (
          PHONE_AUTH_METHODS.has(companyAuthMethod ?? "") &&
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
        if (companyEmployee.email && seenEmails.has(companyEmployee.email)) {
          errorMsgs.push(endorsementFileUploadMessages.ER0013);
        }

        if (effectiveDate) {
          const normalizedEffectiveDate = normalizeToDateOnly(effectiveDate);
          if (
            !normalizedEffectiveDate ||
            !isDateWithinRange(
              normalizedEffectiveDate,
              policyTermStart,
              policyTermEnd
            )
          ) {
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

        if (companyEmployee.companyEmployeeId) {
          seenEmployeeIds.add(String(companyEmployee.companyEmployeeId));
        }
        if (companyEmployee.email) {
          seenEmails.add(companyEmployee.email);
        }

        flushCurrentEmployee();

        companyEmployee.additionalParams = additional;
        currentEmployee = {
          companyEmployee,
          dependents: [],
          intakeType,
          rowObj,
          enrollmentStartDate,
          enrollmentEndDate,
          effectiveDate,
          additionalParams: additional,
        };
      } else {
        if (!currentEmployee) {
          let existingEmp: PolicyEnrollmentEmployee | null = null;
          const companyIdStr = String(policyDetails.companyId);
          if (companyEmployee.companyEmployeeId) {
            existingEmp = await deps.companyEmployeeRepo.findOne({
              where: {
                companyEmployeeId: String(companyEmployee.companyEmployeeId),
                employeeCompanyId: companyIdStr,
              },
            });
          }
          if (!existingEmp && companyEmployee.email) {
            existingEmp = await deps.companyEmployeeRepo.findOne({
              where: { email: companyEmployee.email, employeeCompanyId: companyIdStr },
            });
          }
          if (!existingEmp && companyEmployee.phoneNumber) {
            existingEmp = await deps.companyEmployeeRepo.findOne({
              where: { phoneNumber: companyEmployee.phoneNumber, employeeCompanyId: companyIdStr },
            });
          }
          if (existingEmp) {
            const enrollment = await deps.employeeEnrollmentRepo.findOne({
              where: {
                policyId: upload.entityId,
                employeeId: existingEmp.id,
              },
            });
            if (enrollment) {
              currentEmployee = {
                companyEmployee: existingEmp,
                dependents: [],
                intakeType,
                rowObj,
                enrollmentStartDate,
                enrollmentEndDate,
                effectiveDate,
              };
            } else {
              rowObj["Remarks"] = endorsementFileUploadMessages.ER0027;
              errors.push(rowObj);
              continue;
            }
          } else {
            rowObj["Remarks"] = endorsementFileUploadMessages.ER0016
            errors.push(rowObj);
            continue;
          }
        }
        if (
          companyEmployee.companyEmployeeId &&
          currentEmployee.companyEmployee.companyEmployeeId &&
          companyEmployee.companyEmployeeId !==
            currentEmployee.companyEmployee.companyEmployeeId
        ) {
          rowObj["Remarks"] = endorsementFileUploadMessages.ER0016;
          errors.push(rowObj);
          continue;
        }
        if (!companyEmployee.employeeName) {
          rowObj["Remarks"] = endorsementFileUploadMessages.ER0040;
          errors.push(rowObj);
          continue;
        }

        const dep: Partial<PolicyEnrollmentDependent> = {
          policyId: upload.entityId,
          name: companyEmployee.employeeName,
          relation: relationship,
          gender: companyEmployee.gender,
          dateOfBirth: companyEmployee.dateOfBirth,
          effectiveDate: currentEmployee.effectiveDate ?? undefined,
        };
        currentEmployee.dependents.push(dep);
      }
      }
      processedWorksheet = true;
    }

    if (!headerValues) {
      deps.logError("processUpload", "File has no header row");
      throw new Error("File has no header row");
    }

    if (currentEmployee) {
      rows.push(currentEmployee);
    }

    phase1EndTime = Date.now();
    deps.logInfo("processUpload", {
      message: "Phase 1 completed - rows validated",
      phase: "Phase 1 - Load and validation",
      parsedRowCount: rows.length,
      errorCount: errors.length,
      phase1Duration: formatDuration(phase1EndTime - phase1StartTime),
    });

    phase2StartTime = Date.now();
    let deletionRows = rows.filter((r) => r.intakeType === "deletion");
    const additionRows = rows.filter((r) => r.intakeType !== "deletion");

    deps.logInfo("processUpload", {
      message: "Phase 2 started - deletion handling",
      phase: "Phase 2 - Deletions",
      deletionRowCount: deletionRows.length,
    });
    deps.logInfo("processUpload", {
      stage: "deletionRowsSummary",
      deletionRowCount: deletionRows.length,
      effectiveDateHeaderName,
    });

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

      deps.logInfo("processUpload", {
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
      const normalizedDeletionDate = normalizeToDateOnly(resolvedEffectiveDate);
      if (
        !normalizedDeletionDate ||
        !isDateWithinRange(
          normalizedDeletionDate,
          policyTermStart,
          policyTermEnd
        )
      ) {
        row.hasError = true;
        row.rowObj["Remarks"] =
          endorsementFileUploadMessages.ER0014;
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

    const delEmpIds = Array.from(
      new Set(
        deletionRows
          .map((d) => d.companyEmployee.companyEmployeeId)
          .filter(Boolean)
      )
    );
    const delPhones = Array.from(
      new Set(
        deletionRows.map((d) => d.companyEmployee.phoneNumber).filter(Boolean)
      )
    );
    const delEmails = Array.from(
      new Set(deletionRows.map((d) => d.companyEmployee.email).filter(Boolean))
    );

    let mapsToDelete: PolicyEnrollmentEmployeePolicyMap[] = [];
    const effectiveDateByEmployeeId = new Map<number, Date>();
    if (delEmpIds.length || delPhones.length || delEmails.length) {
      const qb = deps.employeePolicyMapRepo
        .createQueryBuilder("map")
        .innerJoinAndSelect("map.employee", "emp")
        .where("map.policy_id = :pid", { pid: upload.entityId })
        .andWhere(
          new Brackets((qb2) => {
            if (delEmpIds.length) {
              qb2.where("emp.company_employee_id = ANY(:ids)", {
                ids: delEmpIds,
              });
            }
            if (delPhones.length) {
              qb2.orWhere("emp.phone_number = ANY(:phones)", {
                phones: delPhones,
              });
            }
            if (delEmails.length) {
              qb2.orWhere("emp.email = ANY(:emails)", {
                emails: delEmails,
              });
            }
          })
        );
      mapsToDelete = await qb.getMany();

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
            deps.logInfo("processUpload", {
              stage: "deletionEffectiveDateMatched",
              employeeId: map.employeeId,
              mapId: map.id,
              matchedKey: key,
              matchedEffectiveDate: match.toISOString(),
            });
            break;
          }
        }

        if (!effectiveDateByEmployeeId.has(map.employeeId)) {
          deps.logInfo("processUpload", {
            stage: "deletionEffectiveDateMissing",
            employeeId: map.employeeId,
            mapId: map.id,
            attemptedKeys: keys,
          });
        }
      }
    }

    if (mapsToDelete.length) {
      await handleMapDeletions({
        maps: mapsToDelete,
        upload,
        employeePolicyMapRepo: deps.employeePolicyMapRepo,
        dependentRepo: deps.dependentRepo,
        employeeEnrollmentRepo: deps.employeeEnrollmentRepo,
        policyEmployeeEndorsementRepo: deps.policyEmployeeEndorsementRepo,
        userRepo: deps.userRepo,
        roleRepo: deps.roleRepo,
        userRoleRepo: deps.userRoleRepo,
        effectiveDateByEmployeeId,
      });
    }

    phase2EndTime = Date.now();
    deps.logInfo("processUpload", {
      message: "Phase 2 completed - deletions handled",
      phase: "Phase 2 - Deletions",
      deletionRowCount: deletionRows.length,
      deletionMapCount: mapsToDelete.length,
      phase2Duration: formatDuration(phase2EndTime - phase2StartTime),
    });

    deps.logInfo(
      "processUpload",
      `Processed ${successRows.length} rows successfully.`
    );
    deps.logInfo("processUpload", `Found ${errors.length} errors.`);

    if (additionRows.length === 0 && mapsToDelete.length > 0 && upload.endorsementId) {
      await updateEndorsementSummaryAfterEnrollment(
        upload.endorsementId,
        {
          endorsementRepo: deps.endorsementRepo,
          policyRepo: deps.policyRepo,
          policyEmployeeEndorsementRepo: deps.policyEmployeeEndorsementRepo,
          policyDependentEndorsementRepo: deps.policyDependentEndorsementRepo,
          dependentRepo: deps.dependentRepo,
          uploadRepo: deps.uploadRepo,
          employeePolicyMapRepo: deps.employeePolicyMapRepo,
          employeeEnrollmentRepo: deps.employeeEnrollmentRepo,
          policyConfigRepo: deps.policyConfigRepo,
          lookUpRepository: deps.lookUpRepository,
        },
      );
    }

    phase3StartTime = Date.now();
    deps.logInfo("processUpload", {
      message: "Phase 3 started - additions and summary",
      phase: "Phase 3 - Additions and summary",
      additionRowCount: additionRows.length,
    });

    const addEmpIds = Array.from(
      new Set(
        additionRows
          .map((a) => a.companyEmployee.companyEmployeeId)
          .filter(Boolean)
      )
    );
    const addPhones = Array.from(
      new Set(
        additionRows.map((a) => a.companyEmployee.phoneNumber).filter(Boolean)
      )
    );
    const addEmails = Array.from(
      new Set(additionRows.map((a) => a.companyEmployee.email).filter(Boolean))
    );

    const prefetchChunkSize = 25000;
    const employeeById: Record<string, PolicyEnrollmentEmployee> = {};
    const existingEmployeeMap = new Map<number, PolicyEnrollmentEmployee>();
    const addEmployeeToLookup = (emp: PolicyEnrollmentEmployee) => {
      if (existingEmployeeMap.has(emp.id)) {
        return;
      }
      existingEmployeeMap.set(emp.id, emp);
      if (emp.companyEmployeeId) {
        employeeById[String(emp.companyEmployeeId)] = emp;
      }
      if (emp.phoneNumber) {
        employeeById[`ph_${emp.phoneNumber}`] = emp;
      }
      if (emp.email) {
        employeeById[`em_${emp.email}`] = emp;
      }
    };

    for (const ids of chunkArray(addEmpIds, prefetchChunkSize)) {
      if (!ids.length) {
        continue;
      }
      const found = await deps.companyEmployeeRepo
        .createQueryBuilder("emp")
        .where("emp.company_employee_id = ANY(:ids)", { ids })
        .andWhere("emp.company_id = :companyId", { companyId: policyDetails.companyId })
        .getMany();
      for (const emp of found) {
        addEmployeeToLookup(emp);
      }
    }

    for (const phones of chunkArray(addPhones, prefetchChunkSize)) {
      if (!phones.length) {
        continue;
      }
      const found = await deps.companyEmployeeRepo
        .createQueryBuilder("emp")
        .where("emp.phone_number = ANY(:phones)", { phones })
        .andWhere("emp.company_id = :companyId", { companyId: policyDetails.companyId })
        .getMany();
      for (const emp of found) {
        addEmployeeToLookup(emp);
      }
    }

    for (const emails of chunkArray(addEmails, prefetchChunkSize)) {
      if (!emails.length) {
        continue;
      }
      const found = await deps.companyEmployeeRepo
        .createQueryBuilder("emp")
        .where("emp.email = ANY(:emails)", { emails })
        .andWhere("emp.company_id = :companyId", { companyId: policyDetails.companyId })
        .getMany();
      for (const emp of found) {
        addEmployeeToLookup(emp);
      }
    }

    const existingEmployees = Array.from(existingEmployeeMap.values());
    const existingMaps: PolicyEnrollmentEmployeePolicyMap[] = [];
    if (existingEmployees.length) {
      const employeeIdChunks = chunkArray(
        existingEmployees.map((e) => e.id),
        prefetchChunkSize
      );
      for (const empIds of employeeIdChunks) {
        if (!empIds.length) {
          continue;
        }
        const maps = await deps.employeePolicyMapRepo
          .createQueryBuilder("m")
          .withDeleted()
          .where("m.policy_id = :pid", { pid: upload.entityId })
          .andWhere("m.employee_id = ANY(:empIds)", { empIds })
          .getMany();
        existingMaps.push(...maps);
      }
    }

    const mappedEmployeeIds = new Set(existingMaps.map((m) => m.employeeId));

    const totalRecords = additionRows.length;
    const submissionStart = Date.now();
    deps.logInfo(
      "processEnrollmentUpload",
      `Submitting enrollment for ${totalRecords} employees (start: ${new Date(
        submissionStart
      ).toISOString()})`
    );

    const normalizedContactByRow = new Map<
      RowCollect,
      { email?: string; phone?: string }
    >();
    const userEmails = new Set<string>();
    const userPhones = new Set<string>();
    for (const row of additionRows) {
      const email = row.companyEmployee.email
        ? String(row.companyEmployee.email).trim().toLowerCase()
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
        userEmails.add(email);
      }
      if (phone) {
        userPhones.add(phone);
      }
      normalizedContactByRow.set(row, { email, phone });
    }

    for (const row of additionRows) {
      const keyId =
        row.companyEmployee.companyEmployeeId !== undefined
          ? String(row.companyEmployee.companyEmployeeId)
          : undefined;
      const keyPhone = row.companyEmployee.phoneNumber
        ? `ph_${row.companyEmployee.phoneNumber}`
        : undefined;
      const keyEmail = row.companyEmployee.email
        ? `em_${row.companyEmployee.email}`
        : undefined;

      const existingEmp =
        (keyId && employeeById[keyId]) ||
        (keyPhone && employeeById[keyPhone]) ||
        (keyEmail && employeeById[keyEmail]);

      if (existingEmp && mappedEmployeeIds.has(existingEmp.id)) {
        row.rowObj["Remarks"] =
          endorsementFileUploadMessages.ER0031;
        errors.push(row.rowObj);
        continue;
      }

      const contact = normalizedContactByRow.get(row) ?? {};
      const email = contact.email;
      const phone = contact.phone;

      if (email) {
        row.companyEmployee.email = email;
      }
      if (phone) {
        row.companyEmployee.phoneNumber = phone;
      }

      const incomingAdditional =
        row.additionalParams ??
        row.companyEmployee.additionalParams ??
        {};
      if (existingEmp) {
        const { merged, hasChanges } = mergeAdditionalParams(
          existingEmp.additionalParams as Record<string, any> | undefined,
          incomingAdditional
        );
        row.additionalParams = merged;
        row.companyEmployee.additionalParams = merged;
        existingEmp.additionalParams = merged as any;

        if (hasChanges) {
          const pendingUpdates =
            (row as any).pendingEmployeeUpdate ??
            ((row as any).pendingEmployeeUpdate = {
              employeeId: existingEmp.id,
              additionalParams: merged,
            });
          pendingUpdates.employeeId = existingEmp.id;
          pendingUpdates.additionalParams = merged;
        }
      } else {
        row.additionalParams = incomingAdditional;
        row.companyEmployee.additionalParams = incomingAdditional;
      }

      let employeeId: number | null = null;
      if (existingEmp) {
        employeeId = existingEmp.id;
        addedEmployeeIds.push(existingEmp.id);
        (row as any).resolvedEmployeeId = employeeId;
      } else {
        (row as any).pendingEmployeeInsert = true;
      }
    }

    const batchSize = 10000;
    const employeeUpdates: { employeeId: number; additionalParams: any }[] = [];
    const pendingEmployeeRows: RowCollect[] = [];

    for (const row of additionRows) {
      const pendingUpdate = (row as any).pendingEmployeeUpdate;
      if (pendingUpdate?.employeeId) {
        employeeUpdates.push({
          employeeId: pendingUpdate.employeeId,
          additionalParams: pendingUpdate.additionalParams,
        });
      }
      if ((row as any).pendingEmployeeInsert) {
        pendingEmployeeRows.push(row);
      }
    }

    const role =
      (await deps.roleRepo.findOne({
        where: { roleKey: COMPANY_EMPLOYEE_ROLE_KEY },
      })) ??
      (await deps.roleRepo.save(
        deps.roleRepo.create({
          name: "Company Employee",
          description: "Company Employee",
          createdBy: "system",
          updatedBy: "system",
          roleKey: COMPANY_EMPLOYEE_ROLE_KEY,
        })
      ));

    for (const chunk of chunkArray(employeeUpdates, batchSize)) {
      deps.logInfo("processUpload", {
        message: "Employee additional params batch started",
        batchSize: chunk.length,
      });
      for (const update of chunk) {
        try {
          await deps.companyEmployeeRepo.update(update.employeeId, {
            additionalParams: update.additionalParams,
          });
        } catch (additionalErr) {
          deps.logError(
            "processUpload",
            `Failed to update employee additional params for employee ${update.employeeId}: ${additionalErr}`
          );
        }
      }
      deps.logInfo("processUpload", {
        message: "Employee additional params batch completed",
        batchSize: chunk.length,
      });
    }

    for (const chunk of chunkArray(pendingEmployeeRows, batchSize)) {
      deps.logInfo("processUpload", {
        message: "Employee insert batch started",
        batchSize: chunk.length,
      });
      const employeeInsertStartTime = Date.now();
      const newEmployees = [];
      for (const row of chunk) {
        // IBP-detach: policy_enrollment_employee never references the user table.
        const entity = deps.companyEmployeeRepo.create({
          ...row.companyEmployee,
          companyId: policyDetails.companyId,
        });
        newEmployees.push({ row, entity });
      }

      if (!newEmployees.length) {
        continue;
      }

      try {
        const savedEmployees = await deps.companyEmployeeRepo.save(
          newEmployees.map((item) => item.entity),
          { chunk: batchSize }
        );
        for (let i = 0; i < savedEmployees.length; i++) {
          const saved = savedEmployees[i];
          const associatedRow = newEmployees[i]?.row;
          if (associatedRow) {
            (associatedRow as any).resolvedEmployeeId = saved.id;
            addedEmployeeIds.push(saved.id);
          }
        }
        // IBP-detach: every new employee gets loginName = companyEmployeeId and a
        // UserRole keyed by ibpEmployeeId — regardless of any user-table match.
        for (let i = 0; i < savedEmployees.length; i++) {
          const saved = savedEmployees[i];
          const row = newEmployees[i]?.row;
          if (!saved?.id || !row) continue;
          const loginName = String(row.companyEmployee.companyEmployeeId ?? "").trim();
          try {
            await deps.companyEmployeeRepo.update(saved.id, {
              loginName,
              isPasswordSet: false,
              authVersion: 1,
              userStatusKey: "USER_STATUS_ACTIVE",
            });
            const existingRole = await deps.userRoleRepo.findOne({
              where: { ibpEmployeeId: saved.id, roleId: role.id },
            });
            if (!existingRole) {
              await deps.userRoleRepo.save(
                deps.userRoleRepo.create({ ibpEmployeeId: saved.id, roleId: role.id })
              );
            }
          } catch (credErr) {
            deps.logError("processUpload", `Failed to set IBP credentials for employee ${saved.id}: ${credErr}`);
          }
        }
        deps.logInfo("processUpload", {
          message: "Employee insert batch completed",
          batchSize: savedEmployees.length,
        });
        deps.logInfo("processUpload", {
          message: "Employee insert batch duration",
          batchSize: savedEmployees.length,
          duration: formatDuration(Date.now() - employeeInsertStartTime),
          durationMs: Date.now() - employeeInsertStartTime,
        });
      } catch (dbErr) {
        deps.logError(
          "processUpload",
          `DB error while saving employees: ${dbErr}`
        );
        for (const item of newEmployees) {
          item.row.rowObj["Remarks"] = "Database error";
          errors.push(item.row.rowObj);
        }
      }
    }

    const policyMaps: PolicyEnrollmentEmployeePolicyMap[] = [];
    const dependentsToSave: PolicyEnrollmentDependent[] = [];
    for (const row of additionRows) {
      const employeeId = (row as any).resolvedEmployeeId as number | undefined;
      if (!employeeId) {
        continue;
      }

      policyMaps.push(
        deps.employeePolicyMapRepo.create({
          employeeId,
          policyId: upload.entityId,
          enrollmentStartDate:
            row.enrollmentStartDate ??
            upload.enrollmentStartDate ??
            null,
          enrollmentEndDate:
            row.enrollmentEndDate ??
            upload.enrollmentEndDate ??
            null,
          effectiveDate: row.effectiveDate ?? null,
          enrollmentAdditionBatchId: upload.documentId,
          additionalParams: row.additionalParams ?? {},
          isOnBoradingMailSent: false,
        })
      );

      for (const d of row.dependents) {
        dependentsToSave.push(
          deps.dependentRepo.create({
            ...d,
            employeeId,
            dateOfBirth: toDateOnlyString(d.dateOfBirth) as any,
            effectiveDate: toDateOnlyString(d.effectiveDate) as any,
            enrollmentAdditionBatchId: upload.documentId,
          })
        );
      }

      successRows.push(row.rowObj, ...(row.dependentRows || []));
    }

    for (const chunk of chunkArray(policyMaps, batchSize)) {
      if (!chunk.length) {
        continue;
      }
      deps.logInfo("processUpload", {
        message: "Policy map batch started",
        batchSize: chunk.length,
      });
      const policyMapStartTime = Date.now();
      try {
        await deps.employeePolicyMapRepo.save(chunk, { chunk: batchSize });
        deps.logInfo("processUpload", {
          message: "Policy map batch completed",
          batchSize: chunk.length,
        });
        deps.logInfo("processUpload", {
          message: "Policy map batch duration",
          batchSize: chunk.length,
          duration: formatDuration(Date.now() - policyMapStartTime),
          durationMs: Date.now() - policyMapStartTime,
        });
      } catch (mapErr) {
        deps.logError(
          "processUpload",
          `DB error while saving employee maps: ${mapErr}`
        );
      }
    }

    for (const chunk of chunkArray(dependentsToSave, batchSize)) {
      if (!chunk.length) {
        continue;
      }
      deps.logInfo("processUpload", {
        message: "Dependent batch started",
        batchSize: chunk.length,
      });
      const dependentInsertStartTime = Date.now();
      await deps.dependentRepo.save(chunk, { chunk: batchSize });
      deps.logInfo("processUpload", {
        message: "Dependent batch completed",
        batchSize: chunk.length,
      });
      deps.logInfo("processUpload", {
        message: "Dependent batch duration",
        batchSize: chunk.length,
        duration: formatDuration(Date.now() - dependentInsertStartTime),
        durationMs: Date.now() - dependentInsertStartTime,
      });
    }

    const createExcelStream = async (records: any[]) => {
      if (records.length > 100000) {
        const chunkSize = 50000;
        const excelOptions = {
          batchSize: 2000,
          maxMemoryUsage: 300 * 1024 * 1024,
          timeout: 60 * 60 * 1000,
        };

        return generateExcelStream(
          processChunksAsStream(records, chunkSize),
          excelOptions
        );
      }

      const streamOptions = {
        chunkSize: records.length > 10000 ? 500 : 100,
      };
      const excelOptions = {
        batchSize: records.length > 50000 ? 2000 : 1000,
        maxMemoryUsage: 200 * 1024 * 1024,
        timeout: records.length > 100000 ? 60 * 60 * 1000 : 30 * 60 * 1000,
      };

      return generateExcelStream(errorStream(records, streamOptions), excelOptions);
    };

    let errorFileId: number | null = null;
    let successFileId: number | null = null;
    if (errors.length) {
      const sanitizedName = `policy-${
        upload.entityId
      }-errorfile${Date.now()}.xlsx`;
      const key = `uploads/company/${file.entityType}/errorfiles/${sanitizedName}`;

      try {
        const errorStreamData = await createExcelStream(errors);
        await uploadToS3(
          errorStreamData,
          key,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        const savedErrorFile = await deps.fileRepo.save(
          deps.fileRepo.create({
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
      } catch (uploadErr) {
        deps.logError(
          "processUpload",
          `Failed to upload error file for upload ${upload.id}: ${uploadErr}`
        );
      }
    }

    if (successRows.length) {
      const sanitizedName = `policy-${
        upload.entityId
      }-successfile${Date.now()}.xlsx`;
      const key = `uploads/company/${file.entityType}/successfiles/${sanitizedName}`;

      try {
        const successStream = await createExcelStream(successRows);
        await uploadToS3(
          successStream,
          key,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        const savedSuccessFile = await deps.fileRepo.save(
          deps.fileRepo.create({
            fileKey: key,
            entityType: file.entityType,
            entityId: file.entityId,
            uploadType: "AWS",
            documentTypeLid: file.documentTypeLid,
            createdBy: 0,
            updatedBy: 0,
          }),
        );
        successFileId = savedSuccessFile.id;
      } catch (uploadErr) {
        deps.logError(
          "processUpload",
          `Failed to upload success file for upload ${upload.id}: ${uploadErr}`
        );
      }
    }

    const totalSuccess = successRows.length + mapsToDelete.length;
    const processCount = totalSuccess + errors.length;
    const summary = await deps.summaryRepo.save(
      deps.summaryRepo.create({
        documentProcessingFileId: upload.id,
        policyId: upload.entityId,
        sourceFileUploadId: file.id,
        errorFileUploadId: errorFileId,
        successFileUploadId: successFileId,
        successCount: totalSuccess,
        errorCount: errors.length,
        processCount,
        batchId: upload.id,
        endorsementId: upload.endorsementId,
      })
    );

    await deps.uploadRepo.update(upload.id, {
      processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
    });
    deps.logInfo("processUpload", `Upload ${upload.id} marked as COMPLETED.`);
    // notifyEndorsementReadyForReview no longer fires here — see the
    // comment on that function; moved to endorsement-creation time instead.

    phase3EndTime = Date.now();
    deps.logInfo("processUpload", {
      message: "Phase 3 completed - additions and summary",
      phase: "Phase 3 - Additions and summary",
      summaryId: summary.id,
      processCount,
      successCount: totalSuccess,
      errorCount: errors.length,
      phase3Duration: formatDuration(phase3EndTime - phase3StartTime),
    });

    const overallDurationMs = Date.now() - overallStartTime;
    const recordsPerSecond =
      overallDurationMs > 0
        ? Number(((processCount / overallDurationMs) * 1000).toFixed(2))
        : null;
    deps.logInfo("processUpload", {
      message: "Employee upload processing completed",
      uploadId: upload.id,
      documentId: upload.documentId,
      totalDuration: formatDuration(overallDurationMs),
      totalDurationMs: overallDurationMs,
      phase1Duration: formatDuration(phase1EndTime - phase1StartTime),
      phase2Duration: formatDuration(phase2EndTime - phase2StartTime),
      phase3Duration: formatDuration(phase3EndTime - phase3StartTime),
      recordsPerSecond,
      processCount,
      successCount: totalSuccess,
      errorCount: errors.length,
    });
  } catch (err) {
    console.log(err, "error in processUpload");
    deps.logError("processUpload", {
      message: errorMessages.enrollmentProcessingFailed,
      uploadId: upload.id,
      error: err,
      documentId: upload.documentId,
      totalDuration: formatDuration(Date.now() - overallStartTime),
      phase1Duration: phase1EndTime
        ? formatDuration(phase1EndTime - phase1StartTime)
        : undefined,
      phase2Duration: phase2EndTime
        ? formatDuration(phase2EndTime - phase2StartTime)
        : undefined,
      phase3Duration: phase3EndTime
        ? formatDuration(phase3EndTime - phase3StartTime)
        : undefined,
    });
    await deps.summaryRepo.save(
      deps.summaryRepo.create({
        documentProcessingFileId: upload.id,
        policyId: upload.entityId,
        sourceFileUploadId: upload.documentId,
        successCount: 0,
        batchId: upload.id,
        errorCount: 0,
        processCount: 0,
        endorsementId: upload.endorsementId,
      })
    );
    await deps.uploadRepo.update(upload.id, {
      processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
    });
    // notifyEndorsementReadyForReview no longer fires here — see the
    // comment on that function; moved to endorsement-creation time instead.
  }
}

// ─── Member Data Upload (frozen-premium enrollment additions) ─────────────

export interface ProcessMemberDataUploadDependencies {
  logInfo(method: string, messageData: unknown): void;
  logError(method: string, messageData: unknown): void;
  uploadRepo: Repository<DocumentProcessingFile>;
  fileRepo: Repository<FileUpload>;
  policyRepo: Repository<Policy>;
  policyConfigRepo: Repository<PolicyConfiguration>;
  lookUpRepository: Repository<LookUp>;
  companyEmployeeRepo: Repository<PolicyEnrollmentEmployee>;
  dependentRepo: Repository<PolicyEnrollmentDependent>;
  employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>;
  summaryRepo: Repository<PolicyEnrollmentUploadSummary>;
}

const MEMBER_UPLOAD_ALLOWED_INTAKE_TYPES = new Set([
  DATA_INTAKE_TYPE.INCEPTION,
  DATA_INTAKE_TYPE.ADDITION,
  DATA_INTAKE_TYPE.DELETION,
]);

const MEMBER_UPLOAD_INTAKE_TYPE_HEADERS = ["Intake Type", "IntakeType", "intake_type"];
const MEMBER_UPLOAD_EFFECTIVE_DATE_HEADERS = ["Effective Date", "EffectiveDate", "effective_date"];

interface MemberUploadHeaderColumn {
  header: string;
  normalized: string;
  col: number;
}

const findMemberUploadColumn = (
  headerColumns: MemberUploadHeaderColumn[],
  aliases: string[]
): MemberUploadHeaderColumn | null => {
  const normalizedAliases = new Set(aliases.map((alias) => normalizeValue(alias)));
  return headerColumns.find((c) => normalizedAliases.has(c.normalized)) ?? null;
};

const readMemberUploadCell = (
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  columnIndex: number
): unknown => {
  const address = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
  const cell = sheet[address];
  if (!cell) return undefined;
  if (cell.v !== undefined && cell.v !== null) return cell.v;
  if (cell.w !== undefined && cell.w !== null) return cell.w;
  return undefined;
};

// Only a configuredOption whose OWN `enabled` flag is true, sitting under a
// relation type whose `enabled` flag is also true, counts as allowed —
// matching the same enabledPolicyRelations shape deriveSelfAgeLimitsFromPolicyConfig
// reads above (relationships.enabledPolicyRelations[].configuredOptions[]).
const buildEnabledRelationNames = (policyConfig: any): Set<string> => {
  const enabledNames = new Set<string>();
  const relationships = Array.isArray(policyConfig?.relationships?.enabledPolicyRelations)
    ? policyConfig.relationships.enabledPolicyRelations
    : [];
  for (const relationType of relationships) {
    if (!relationType?.enabled) continue;
    const configuredOptions = Array.isArray(relationType.configuredOptions)
      ? relationType.configuredOptions
      : [];
    for (const option of configuredOptions) {
      if (option?.enabled && option?.name) {
        enabledNames.add(normalizeValue(String(option.name)));
      }
    }
  }
  return enabledNames;
};

// Case-insensitive, whitespace/non-breaking-space-tolerant dependent lookup —
// an exact `{ relation, name }` match is too brittle: legacy-loaded dependent
// names can carry a leading U+00A0, and relation casing isn't guaranteed to
// match the exact casing used in a later upload file.
async function findMatchingDependent(
  dependentRepo: Repository<PolicyEnrollmentDependent>,
  employeeId: number,
  policyId: number,
  relation: string,
  name: string,
  options?: { onlyDeleted?: boolean }
): Promise<PolicyEnrollmentDependent | null> {
  const nameNoSpaces = name.replace(/\s+/g, "");
  const lowerName = name.toLowerCase();
  const lowerNameNoSpaces = nameNoSpaces.toLowerCase();

  const qb = dependentRepo
    .createQueryBuilder("dep")
    .where("dep.employee_id = :employeeId", { employeeId })
    .andWhere("dep.policy_id = :policyId", { policyId })
    .andWhere("LOWER(dep.relation) = :relation", { relation: relation.toLowerCase() });

  if (options?.onlyDeleted) {
    qb.withDeleted().andWhere("dep.deleted_at IS NOT NULL");
  }

  return qb
    .andWhere(
      new Brackets((qb) => {
        qb.where("dep.name = :name", { name });
        if (nameNoSpaces) {
          qb.orWhere("REPLACE(REPLACE(dep.name, chr(160), ''), ' ', '') = :nameNoSpaces", { nameNoSpaces });
        }
        qb.orWhere("LOWER(dep.name) = :lowerName", { lowerName });
        if (lowerNameNoSpaces) {
          qb.orWhere("LOWER(REPLACE(REPLACE(dep.name, chr(160), ''), ' ', '')) = :lowerNameNoSpaces", { lowerNameNoSpaces });
        }
      })
    )
    .getOne();
}

export async function processMemberDataUpload(
  upload: DocumentProcessingFile,
  deps: ProcessMemberDataUploadDependencies
): Promise<void> {
  const method = "processMemberDataUpload";
  deps.logInfo(method, {
    message: "Processing member data upload",
    uploadId: upload.id,
    documentId: upload.documentId,
  });

  try {
    const file = await deps.fileRepo.findOne({ where: { id: upload.documentId } });
    if (!file) {
      throw new Error(`File not found for document ID: ${upload.documentId}`);
    }

    const policy = await deps.policyRepo.findOne({ where: { id: upload.entityId } });
    if (!policy) {
      throw new Error(`Policy not found for policy ID: ${upload.entityId}`);
    }

    const policyTermStart = normalizeToDateOnly(policy.policyFrom);
    const policyTermEnd = normalizeToDateOnly(policy.policyTo);
    if (!policyTermStart || !policyTermEnd) {
      throw new Error("Invalid policy term dates");
    }

    // Premium-based (bypass) policies never get a policy_configuration row —
    // there's nothing to validate relationships against, so skip the
    // configuration load/enforcement entirely for them.
    const toggleYes = await deps.lookUpRepository.findOne({
      where: { lookUpKey: "TOGGLE_TYPE_YES" },
    });
    const isPremiumBased =
      policy.isEnrolmentPremiumBasedLid != null &&
      policy.isEnrolmentPremiumBasedLid === toggleYes?.id;

    // Relation enforcement is strict: a dependent's relation must match an
    // enabled configuredOption under an enabled relation type in the policy's
    // LIVE configuration — only applicable when the policy actually has one.
    let policyConfiguration: any = null;
    if (!isPremiumBased) {
      try {
        policyConfiguration = await loadPolicyConfiguration({
          policyId: policy.id,
          policyConfigRepo: deps.policyConfigRepo,
          lookUpRepository: deps.lookUpRepository,
        });
      } catch (configError) {
        deps.logError(method, {
          message: "Failed to load policy configuration",
          policyId: policy.id,
          error: configError,
        });
        throw new Error("Policy configuration could not be loaded — cannot validate relationships for member data upload");
      }
      if (!policyConfiguration) {
        throw new Error("Policy configuration not found — cannot validate relationships for member data upload");
      }
    }

    const selfAgeLimits = policyConfiguration
      ? deriveSelfAgeLimitsFromPolicyConfig(policyConfiguration)
      : null;
    const enabledRelationNames = policyConfiguration
      ? buildEnabledRelationNames(policyConfiguration)
      : null;
    if (enabledRelationNames && !enabledRelationNames.size) {
      throw new Error("Policy configuration has no enabled relationships configured");
    }

    const buffer = await downloadFromS3(file.fileKey);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet["!ref"]) {
      throw new Error("Member data upload sheet is empty");
    }
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const headerRowIndex = range.s.r;

    const headerColumns: MemberUploadHeaderColumn[] = [];
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const rawHeader = readMemberUploadCell(sheet, headerRowIndex, col);
      const header = rawHeader ? String(rawHeader).trim() : "";
      if (!header) continue;
      headerColumns.push({ header, normalized: normalizeValue(header), col });
    }
    if (!headerColumns.length) {
      throw new Error("Member data upload sheet is missing headers");
    }

    const employeeIdColumn = findMemberUploadColumn(headerColumns, [
      ...ENROLLMENT_FIELD_HEADERS.EMPLOYEE_ID,
      ...POSSIBLE_EMPLOYEE_ID_HEADERS_FOR_TPA_FILE,
    ]);
    const nameColumn = findMemberUploadColumn(headerColumns, [
      ...ENROLLMENT_FIELD_HEADERS.FULL_NAME,
      ...POSSIBLE_EMPLOYEE_NAME_HEADERS_FOR_TPA_FILE,
    ]);
    const dobColumn = findMemberUploadColumn(headerColumns, ENROLLMENT_FIELD_HEADERS.DATE_OF_BIRTH);
    const genderColumn = findMemberUploadColumn(headerColumns, POSSIBLE_EMPLOYEE_GENDER_HEADERS_FOR_TPA_FILE);
    const relationColumn = findMemberUploadColumn(headerColumns, [
      ...ENROLLMENT_FIELD_HEADERS.RELATION,
      POLICY_RELATIONSHIP_TYPE_PARAMETER,
    ]);
    const intakeTypeColumn = findMemberUploadColumn(headerColumns, MEMBER_UPLOAD_INTAKE_TYPE_HEADERS);
    const effectiveDateColumn = findMemberUploadColumn(headerColumns, MEMBER_UPLOAD_EFFECTIVE_DATE_HEADERS);

    const missingHeaders: string[] = [];
    if (!employeeIdColumn) missingHeaders.push("Employee ID");
    if (!nameColumn) missingHeaders.push("Full Name");
    if (!dobColumn) missingHeaders.push("Date of Birth");
    if (!genderColumn) missingHeaders.push("Gender");
    if (!relationColumn) missingHeaders.push("Relation");
    if (!intakeTypeColumn) missingHeaders.push("Intake Type");
    if (missingHeaders.length) {
      throw new Error(`Missing required header(s): ${missingHeaders.join(", ")}`);
    }

    const errors: any[] = [];
    let successCount = 0;

    // Raw file "Employee ID" -> resolved PolicyEnrollmentEmployee id, so a
    // dependent row below its "Self" row in the same file can resolve its
    // parent without an extra DB round-trip.
    const employeeIdByFileKey = new Map<string, number>();

    await deps.companyEmployeeRepo.manager.transaction(async (manager) => {
      const employeeRepo = manager.getRepository(PolicyEnrollmentEmployee);
      const dependentRepo = manager.getRepository(PolicyEnrollmentDependent);
      const mapRepo = manager.getRepository(PolicyEnrollmentEmployeePolicyMap);

      for (let rowIndex = headerRowIndex + 1; rowIndex <= range.e.r; rowIndex += 1) {
        const rowValues: Record<string, unknown> = {};
        for (const col of headerColumns) {
          rowValues[col.header] = readMemberUploadCell(sheet, rowIndex, col.col);
        }
        const isRowEmpty = Object.values(rowValues).every(
          (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "")
        );
        if (isRowEmpty) continue;

        const rowNumber = rowIndex + 1;
        const employeeIdRaw = rowValues[employeeIdColumn!.header];
        const nameRaw = rowValues[nameColumn!.header];
        const dobRaw = rowValues[dobColumn!.header];
        const genderRaw = rowValues[genderColumn!.header];
        const relationRaw = rowValues[relationColumn!.header];
        const intakeTypeRaw = rowValues[intakeTypeColumn!.header];
        const effectiveDateRaw = effectiveDateColumn ? rowValues[effectiveDateColumn.header] : undefined;

        const remarks: string[] = [];

        const employeeIdStr =
          employeeIdRaw !== undefined && employeeIdRaw !== null ? String(employeeIdRaw).trim() : "";
        const name = nameRaw !== undefined && nameRaw !== null ? String(nameRaw).trim() : "";
        const relation = relationRaw !== undefined && relationRaw !== null ? String(relationRaw).trim() : "";
        const isSelf = relation.toLowerCase() === "self";

        if (!employeeIdStr) remarks.push("missing Employee ID");
        if (!name) remarks.push("missing Full Name");
        if (!relation) {
          remarks.push("missing Relation");
        } else if (enabledRelationNames && !enabledRelationNames.has(normalizeValue(relation))) {
          remarks.push(`Relation "${relation}" is not configured/enabled for this policy`);
        }

        const dob = parseDateValue(dobRaw);
        if (!dob) remarks.push("invalid or missing Date of Birth");

        const genderNormalized = genderRaw ? String(genderRaw).trim().toLowerCase() : "";
        const validGenders = new Set(Object.values(GENDER_VALUES));
        if (!genderNormalized || !validGenders.has(genderNormalized)) {
          remarks.push(`invalid Gender (must be one of: ${Object.values(GENDER_VALUES).join(", ")})`);
        }

        const intakeTypeNormalized = intakeTypeRaw ? String(intakeTypeRaw).trim().toLowerCase() : "";
        const isDeletion = intakeTypeNormalized === DATA_INTAKE_TYPE.DELETION;
        if (!intakeTypeNormalized) {
          remarks.push("missing Intake Type");
        } else if (!MEMBER_UPLOAD_ALLOWED_INTAKE_TYPES.has(intakeTypeNormalized)) {
          remarks.push(
            `invalid Intake Type (must be one of: ${Array.from(MEMBER_UPLOAD_ALLOWED_INTAKE_TYPES).join(", ")})`
          );
        }

        const effectiveDateProvided =
          effectiveDateRaw !== undefined &&
          effectiveDateRaw !== null &&
          String(effectiveDateRaw).trim() !== "";
        let effectiveDate: Date | null = effectiveDateProvided
          ? parseDateValue(effectiveDateRaw)
          : policyTermStart;
        if (effectiveDateProvided && !effectiveDate) {
          remarks.push("invalid Effective Date");
        }
        const effectiveDateOnly = effectiveDate ? normalizeToDateOnly(effectiveDate) : null;
        if (effectiveDateOnly && !isDateWithinRange(effectiveDateOnly, policyTermStart, policyTermEnd)) {
          remarks.push(
            `Effective Date must fall within the policy duration (${toDateOnlyString(
              policyTermStart
            )} to ${toDateOnlyString(policyTermEnd)})`
          );
        }

        let age: number | null = null;
        if (dob) {
          try {
            age = calculateAge(dob);
          } catch {
            age = null;
          }
        }
        if (age === null || age < 0 || age > 100) {
          remarks.push("invalid Age derived from Date of Birth");
        } else if (isSelf && selfAgeLimits) {
          if (selfAgeLimits.min !== undefined && age < selfAgeLimits.min) {
            remarks.push(`Age ${age.toFixed(0)} is below the configured minimum (${selfAgeLimits.min}) for Self`);
          }
          if (selfAgeLimits.max !== undefined && age > selfAgeLimits.max) {
            remarks.push(`Age ${age.toFixed(0)} is above the configured maximum (${selfAgeLimits.max}) for Self`);
          }
        }

        if (remarks.length) {
          errors.push({ ...rowValues, Remarks: remarks.join(", ") });
          continue;
        }

        try {
          if (isDeletion) {
            if (isSelf) {
              const employee = await employeeRepo.findOne({
                where: { companyId: policy.companyId, companyEmployeeId: employeeIdStr },
              });
              if (!employee) {
                errors.push({
                  ...rowValues,
                  Remarks: "No matching Self/employee record found for this Employee ID — nothing to delete",
                });
                continue;
              }

              const existingMap = await mapRepo.findOne({
                where: { employeeId: employee.id, policyId: policy.id },
              });
              if (!existingMap) {
                const alreadyDeletedMap = await mapRepo.findOne({
                  where: { employeeId: employee.id, policyId: policy.id, deletedAt: Not(IsNull()) },
                  withDeleted: true,
                });
                errors.push({
                  ...rowValues,
                  Remarks: alreadyDeletedMap
                    ? "Employee is already deleted from this policy — nothing to delete"
                    : "No active enrollment found for this employee on this policy — nothing to delete",
                });
                continue;
              }

              await mapRepo.update(existingMap.id, {
                deletedAt: effectiveDateOnly ?? new Date(),
              } as any);
            } else {
              let employeeId = employeeIdByFileKey.get(employeeIdStr);
              if (!employeeId) {
                const existingEmployee = await employeeRepo.findOne({
                  where: { companyId: policy.companyId, companyEmployeeId: employeeIdStr },
                });
                employeeId = existingEmployee?.id;
              }

              if (!employeeId) {
                errors.push({
                  ...rowValues,
                  Remarks: "No matching Self/employee record found for this Employee ID — nothing to delete",
                });
                continue;
              }

              const existingDependent = await findMatchingDependent(
                dependentRepo,
                employeeId,
                policy.id,
                relation,
                name
              );
              if (!existingDependent) {
                const alreadyDeletedDependent = await findMatchingDependent(
                  dependentRepo,
                  employeeId,
                  policy.id,
                  relation,
                  name,
                  { onlyDeleted: true }
                );
                errors.push({
                  ...rowValues,
                  Remarks: alreadyDeletedDependent
                    ? "Dependent is already deleted for this Employee ID/Relation/Name — nothing to delete"
                    : "No matching dependent record found for this Employee ID/Relation/Name — nothing to delete",
                });
                continue;
              }

              await dependentRepo.update(existingDependent.id, {
                deletedAt: effectiveDateOnly ?? new Date(),
              } as any);
            }

            successCount += 1;
            continue;
          }

          if (isSelf) {
            let employee = await employeeRepo.findOne({
              where: { companyId: policy.companyId, companyEmployeeId: employeeIdStr },
              withDeleted: true,
            });

            if (employee) {
              await employeeRepo.update(employee.id, {
                employeeName: name,
                fullName: name,
                dateOfBirth: dob,
                gender: genderNormalized,
                deletedAt: null,
              } as any);
            } else {
              employee = await employeeRepo.save(
                employeeRepo.create({
                  companyEmployeeId: employeeIdStr,
                  employeeCompanyId: String(policy.companyId),
                  companyId: policy.companyId,
                  employeeName: name,
                  fullName: name,
                  dateOfBirth: dob as any,
                  gender: genderNormalized,
                  createdBy: 0,
                  updatedBy: 0,
                })
              );
            }

            employeeIdByFileKey.set(employeeIdStr, employee.id);

            const existingMap = await mapRepo.findOne({
              where: { employeeId: employee.id, policyId: policy.id },
              withDeleted: true,
            });

            if (existingMap) {
              await mapRepo.update(existingMap.id, {
                effectiveDate: effectiveDateOnly,
                enrollmentAdditionBatchId: upload.documentId,
                deletedAt: null,
              } as any);
            } else {
              await mapRepo.save(
                mapRepo.create({
                  employeeId: employee.id,
                  policyId: policy.id,
                  effectiveDate: effectiveDateOnly,
                  enrollmentAdditionBatchId: upload.documentId,
                  claimStatus: "No",
                })
              );
            }
          } else {
            let employeeId = employeeIdByFileKey.get(employeeIdStr);
            if (!employeeId) {
              const existingEmployee = await employeeRepo.findOne({
                where: { companyId: policy.companyId, companyEmployeeId: employeeIdStr },
              });
              employeeId = existingEmployee?.id;
            }

            if (!employeeId) {
              errors.push({
                ...rowValues,
                Remarks:
                  "No matching Self/employee record found for this Employee ID — add a Self row in this file or enroll the employee first",
              });
              continue;
            }

            const existingDependent = await findMatchingDependent(
              dependentRepo,
              employeeId,
              policy.id,
              relation,
              name
            );

            if (existingDependent) {
              await dependentRepo.update(existingDependent.id, {
                dateOfBirth: dob,
                gender: genderNormalized,
                effectiveDate: effectiveDateOnly,
              } as any);
            } else {
              await dependentRepo.save(
                dependentRepo.create({
                  policyId: policy.id,
                  employeeId,
                  name,
                  relation,
                  dateOfBirth: dob as any,
                  gender: genderNormalized,
                  effectiveDate: effectiveDateOnly,
                  enrollmentAdditionBatchId: upload.documentId,
                  createdBy: 0,
                  updatedBy: 0,
                })
              );
            }
          }

          successCount += 1;
        } catch (rowError) {
          deps.logError(method, {
            message: "Failed to save member data row",
            rowNumber,
            employeeIdStr,
            error: rowError instanceof Error ? rowError.message : rowError,
          });
          errors.push({
            ...rowValues,
            Remarks: rowError instanceof Error ? rowError.message : "Failed to save row",
          });
        }
      }
    });

    let errorFileId: number | null = null;
    if (errors.length) {
      const errorBuffer = await generateExcel(errors);
      const errorKey = `uploads/policy/${upload.entityId}/member-upload-errors/${upload.id}-${Date.now()}.xlsx`;
      await uploadToS3(
        errorBuffer,
        errorKey,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const savedErrorFile = await deps.fileRepo.save(
        deps.fileRepo.create({
          fileKey: errorKey,
          entityType: file.entityType,
          entityId: file.entityId,
          uploadType: "AWS",
          documentTypeLid: file.documentTypeLid,
          fileSize: `${(errorBuffer.length / 1024).toFixed(2)} KB`,
          createdBy: 0,
          updatedBy: 0,
        })
      );
      errorFileId = savedErrorFile.id;
    }

    await deps.summaryRepo.save(
      deps.summaryRepo.create({
        documentProcessingFileId: upload.id,
        policyId: upload.entityId,
        sourceFileUploadId: file.id,
        errorFileUploadId: errorFileId,
        successFileUploadId: null,
        successCount,
        errorCount: errors.length,
        processCount: successCount + errors.length,
        batchId: upload.id,
      })
    );

    await deps.uploadRepo.update(upload.id, {
      processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
    });

    deps.logInfo(method, {
      message: "Member data upload completed",
      uploadId: upload.id,
      successCount,
      errorCount: errors.length,
    });
  } catch (err) {
    deps.logError(method, {
      message: "Member data upload failed",
      uploadId: upload.id,
      error: err instanceof Error ? err.message : err,
    });
    await deps.uploadRepo.update(upload.id, {
      processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
    });
  }
}