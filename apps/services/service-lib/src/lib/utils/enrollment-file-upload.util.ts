import * as XLSX from "xlsx";
import {
  PolicyEnrollmentEmployee,
  PolicyEnrollmentDependent,
  PolicyConfiguration,
} from "../entities";
import {
  POLICY_RELATIONSHIP_TYPE_PARAMETER,
  DATA_TYPES,
  GENDER_VALUES,
  BOOLEAN_VALUES,
  PARENT_RELATIONSHIP_TYPES as GLOBAL_PARENT_RELATIONSHIP_TYPES,
  DATA_INTAKE_TYPE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { generateExcel, uploadToS3 } from "./file-management.utils";
import { endorsementFileUploadMessages } from "../../../../../../libs/service-lib/src/lib/messages";

const RELATIONSHIP_GROUP_FIELD_NAME = "Relationship Group";
const RELATIONSHIP_GROUP_MISMATCH_REMARK =
  "Dependents and self are not in same relationship group.";

export interface DependentRowData extends Partial<PolicyEnrollmentDependent> {
  relation: string;
  isValidDependent: boolean;
  rowIndex: number;
  rowObj: Record<string, any>;
}

export interface EnrollmentChoice {
  policyLabel: string;
  sumInsuredValue: number;
}

export interface EmployeeWithDependentsData {
  companyEmployee: Partial<PolicyEnrollmentEmployee>;
  dependents: DependentRowData[];
  intakeType: string;
  rowNumber: number;
  rowObj: Record<string, any>;
  dependentRows: Record<string, any>[];
  enrollmentStartDate?: Date | null;
  enrollmentEndDate?: Date | null;
  effectiveDate?: Date | null;
  additionalParams?: Record<string, any>;
  choices?: EnrollmentChoice[];
  isProcessed?: boolean;
  isDependentOnly?: boolean;
  rowIndex?: number;
  hasError?: boolean;
}

export interface EnrollmentProcessingResult {
  employees: EmployeeWithDependentsData[];
  dependentsWithoutEmployee: EmployeeWithDependentsData[];
}

export interface ValidatedEnrollmentProcessingResult
  extends EnrollmentProcessingResult {
  invalidEmployees: EmployeeWithDependentsData[];
}

export interface EnrollmentDeletionRecord {
  rowNumber: number;
  row: Record<string, any>;
  remarks: string;
}

export interface StartEnrollmentProcessResult {
  validatedEmployeeRecords: ValidatedEnrollmentProcessingResult;
  deletionRecords: EnrollmentDeletionRecord[];
}

export interface EnrollmentProcessingArtifactsSummary {
  successCount: number;
  errorCount: number;
  processCount: number;
}

export interface EnrollmentProcessingArtifactsResult {
  successFileKey: string | null;
  errorFileKey: string | null;
  summary: EnrollmentProcessingArtifactsSummary;
}

export interface EnrollmentProcessingArtifactsContext {
  policyId: number;
  companyType: string;
}

export interface ProcessEnrollmentFileOptions {
  fetchEmployeeByCompanyEmployeeId?: (
    employeeId: string
  ) => Promise<PolicyEnrollmentEmployee | null>;
  fetchDependentsByEmployeeId?: (
    employeeId: number,
    policyId?: number
  ) => Promise<PolicyEnrollmentDependent[]>;
}

const employeePropertiesMap: Record<string, keyof PolicyEnrollmentEmployee> = {
  employeeid: "companyEmployeeId",
  fullname: "employeeName",
  dateofbirth: "dateOfBirth",
  gender: "gender",
  email: "email",
  mobilenumber: "phoneNumber",
  relationshipgroup: "relationGroup",
};

const PARENT_RELATIONSHIP_TYPES = {
  FATHER: "father",
  MOTHER: "mother",
  FATHER_IN_LAW: "fatherinlaw",
  MOTHER_IN_LAW: "motherinlaw",
  IN_LAW: "inlaw",
  PARENT: "parent",
  PARENTS: "parents",
};

const CHILD_RELATIONSHIP_TYPES = {
  CHILD: "child",
  SON: "son",
  DAUGHTER: "daughter",
};

const CHILD_RELATIONSHIP_TYPE_KEYS = new Set<string>([
  CHILD_RELATIONSHIP_TYPES.CHILD,
  CHILD_RELATIONSHIP_TYPES.SON,
  CHILD_RELATIONSHIP_TYPES.DAUGHTER,
  normalizeValue("Children"),
]);

function normalizeValue(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

function sanitizeRelationValue(val: string): string {
  return val.toLowerCase().replace(/[-_\s]+/g, "");
}

function addRemark(
  rowObj: Record<string, any> | undefined,
  remark: string
): void {
  if (!rowObj) {
    return;
  }
  if (rowObj["Remarks"]) {
    rowObj["Remarks"] = `${rowObj["Remarks"]}; ${remark}`;
  } else {
    rowObj["Remarks"] = remark;
  }
}

function calculateAge(dob: Date): number {
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
}

function isTruthyConstraint(value: any): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "y"
    );
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
}

function normalizeDateInput(value: any): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function isChildRelationshipType(
  relationshipTypeNorm: string,
  configuredType?: any
): boolean {
  const candidates: string[] = [relationshipTypeNorm];
  if (typeof configuredType === "string" && configuredType) {
    candidates.push(normalizeValue(configuredType));
  }
  return candidates.some((candidate) =>
    CHILD_RELATIONSHIP_TYPE_KEYS.has(candidate)
  );
}

function canAddChildWithTwinOverride(
  existingDependents: DependentRowData[],
  newDob: Date | null | undefined,
  relationshipTypeNorm: string,
  maxCount: number
): boolean {
  const normalizedNewDob = normalizeDateInput(newDob);
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
    const normalizedExistingDob = normalizeDateInput(dep.dateOfBirth);
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

function canAddChildWithTripletOverride(
  existingDependents: DependentRowData[],
  newDob: Date | null | undefined,
  relationshipTypeNorm: string,
  maxCount: number
): boolean {
  const normalizedNewDob = normalizeDateInput(newDob);
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
    const normalizedExistingDob = normalizeDateInput(dep.dateOfBirth);
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

function canAddFirstChildAsTwinOverride(
  existingDependents: DependentRowData[],
  newDob: Date | null | undefined,
  relationshipTypeNorm: string,
  maxCount: number
): boolean {
  const normalizedNewDob = normalizeDateInput(newDob);
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
    const normalizedExistingDob = normalizeDateInput(dep.dateOfBirth);
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

  // Exactly 2 children in the twin slot — the 3rd must be a different (younger) child
  const oldestCount = dobValues.filter((val) => val === oldestDob).length;
  return oldestCount === 2;
}

function canAddDoubleTwinOverride(
  existingDependents: DependentRowData[],
  newDob: Date | null | undefined,
  relationshipTypeNorm: string,
  maxCount: number
): boolean {
  const normalizedNewDob = normalizeDateInput(newDob);
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
    const normalizedExistingDob = normalizeDateInput(dep.dateOfBirth);
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

function canAddTwinPlusTripletOverride(
  existingDependents: DependentRowData[],
  newDob: Date | null | undefined,
  relationshipTypeNorm: string,
  maxCount: number
): boolean {
  const normalizedNewDob = normalizeDateInput(newDob);
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
    const normalizedExistingDob = normalizeDateInput(dep.dateOfBirth);
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

function cloneEmployeeRecord(
  record: EmployeeWithDependentsData
): EmployeeWithDependentsData {
  const dependentRows = (record.dependentRows ?? []).map((row) => ({ ...row }));
  const dependents = (record.dependents ?? []).map((dep, index) => {
    const rowClone = dependentRows[index]
      ? dependentRows[index]
      : { ...(dep.rowObj ?? {}) };
    const dependentClone: DependentRowData = {
      ...dep,
      rowObj: rowClone,
    };
    return dependentClone;
  });

  return {
    ...record,
    companyEmployee: { ...(record.companyEmployee ?? {}) },
    dependents,
    rowObj: { ...(record.rowObj ?? {}) },
    dependentRows,
    additionalParams: record.additionalParams
      ? { ...record.additionalParams }
      : undefined,
    choices: record.choices
      ? record.choices.map((choice) => ({ ...choice }))
      : undefined,
  };
}

function getRowValueCaseInsensitive(
  rowObj: Record<string, any> | undefined,
  ...keys: string[]
): any {
  if (!rowObj) {
    return undefined;
  }
  const normalizedTargets = keys.map((key) => normalizeValue(key));
  for (const [key, value] of Object.entries(rowObj)) {
    if (normalizedTargets.includes(normalizeValue(String(key)))) {
      return value;
    }
  }
  return undefined;
}

function normalizeRelationKey(value: string): string {
  return normalizeValue(value ?? "");
}

export function normalizeString(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function matchesRelationGroupSelection(
  selection: string,
  group: any
): boolean {
  const normalizedSelection = normalizeRelationKey(selection);
  const candidates = [
    group?.groupDisplayName,
    group?.name,
    group?.type,
    group?.relationGroupName,
  ];
  return candidates.some(
    (candidate) =>
      candidate && normalizeRelationKey(String(candidate)) === normalizedSelection
  );
}

function getSelectedRelationsFromGroup(group: any): string[] {
  return (group?.selectedRelations ?? [])
    .filter((relation: any) => relation?.selected)
    .map((relation: any) => relation?.name)
    .filter((name: any) => typeof name === DATA_TYPES.STRING)
    .map((name: string) => name.trim())
    .filter((name: string) => name.length > 0);
}

function getPolicyConfigurationObject(
  policyConfig: PolicyConfiguration
): Record<string, any> {
  if (!policyConfig) {
    return {};
  }
  const config = policyConfig as unknown as { policyConfiguration?: any };
  return config.policyConfiguration ?? policyConfig;
}

// function parseDate(value: any): Date | undefined {
//   if (!value) {
//     return undefined;
//   }
//   const parsed = new Date(value);
//   return Number.isNaN(parsed.getTime()) ? undefined : parsed;
// }

const parseDateValue = (val: unknown): Date | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") {
    const p = XLSX.SSF.parse_date_code(val);
    return p ? new Date(p.y, p.m - 1, p.d) : undefined;
  }
  const str = String(val).trim();
  let m: RegExpMatchArray | null;
  if ((m = str.match(/^(\d{4})[-\/\. ](\d{1,2})[-\/\. ](\d{1,2})$/))) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  if ((m = str.match(/^(\d{1,2})[-\/\. ](\d{1,2})[-\/\. ](\d{4})$/))) {
    const d1 = Number(m[1]);
    const d2 = Number(m[2]);
    const y = Number(m[3]);
    const day = d1 > 12 ? d1 : d2;
    const month = d1 > 12 ? d2 : d1;
    return new Date(y, month - 1, day);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
};

function createRowObject(
  headers: string[],
  row: any[],
  rowNumber: number
): Record<string, any> {
  return headers.reduce<Record<string, any>>(
    (acc, header, index) => {
      acc[header] = row[index];
      return acc;
    },
    { rowNumber }
  );
}

function buildAdditionalParams(
  row: any[],
  headers: string[],
  excludedKeys: Set<string>,
  rowNumber: number
): Record<string, any> {
  const params = headers.reduce<Record<string, any>>((acc, header, index) => {
    const normalizedHeader = normalizeString(header);
    if (!excludedKeys.has(normalizedHeader)) {
      acc[header] = row[index];
    }
    return acc;
  }, {});

  return { ...params, rowNumber };
}

function buildChoices(row: any[], headers: string[]): EnrollmentChoice[] {
  const suffix = "suminsured";
  const choices: EnrollmentChoice[] = [];

  headers.forEach((header, index) => {
    if (normalizeString(header).endsWith(suffix)) {
      const policyLabel = header
        .slice(0, header.length - "Sum Insured".length)
        .trim();
      const sumInsuredRaw = row[index];
      if (
        sumInsuredRaw !== undefined &&
        sumInsuredRaw !== null &&
        sumInsuredRaw !== ""
      ) {
        const numericValue = Number(
          String(sumInsuredRaw).replace(/[^0-9.]/g, "")
        );
        if (!Number.isNaN(numericValue)) {
          choices.push({ policyLabel, sumInsuredValue: numericValue });
        }
      }
    }
  });

  return choices;
}

function extractEmployeeCompanyId(employeeId: string): string {
  if (!employeeId) {
    return "";
  }
  const segments = employeeId.split("-");
  if (segments.length >= 3) {
    return segments[1];
  }
  return employeeId;
}

function buildDependentData(
  row: any[],
  headers: string[],
  rowNumber: number,
  relationValue: string,
  relationTypeMap: Map<string, string>,
  allowedRelations: Set<string>,
  policyId?: number
): DependentRowData {
  const headerIndex = (key: string): number =>
    headers.findIndex((header) => normalizeString(header) === key);

  const relationNormalized = normalizeString(relationValue);
  const dateOfBirthIdx = headerIndex("dateofbirth");
  const genderIdx = headerIndex("gender");
  const effectiveDateIdx = headerIndex("effectivedate");
  const fullNameIdx = headerIndex("fullname");

  const dependentRowObj = createRowObject(headers, row, rowNumber);

  const relationshipTypeRaw = relationTypeMap.get(relationNormalized);

  return {
    policyId,
    name: fullNameIdx >= 0 ? row[fullNameIdx] : undefined,
    relation: relationNormalized,
    relationshipType: relationshipTypeRaw
      ? relationshipTypeRaw.toLowerCase()
      : relationValue.toLowerCase(),
    gender: genderIdx >= 0 ? row[genderIdx] : undefined,
    dateOfBirth:
      dateOfBirthIdx >= 0 ? parseDateValue(row[dateOfBirthIdx]) : undefined,
    effectiveDate:
      effectiveDateIdx >= 0 ? parseDateValue(row[effectiveDateIdx]) : undefined,
    isValidDependent: allowedRelations.has(relationNormalized),
    rowIndex: rowNumber,
    rowObj: dependentRowObj,
  };
}

interface PendingDependentRecord {
  dependent: DependentRowData;
  rowObj: Record<string, any>;
  intakeType: string;
  employeeId: string;
  rawEmployeeId?: string | null;
}

interface ProcessPendingDependentsParams {
  pendingDependents: Map<string, PendingDependentRecord[]>;
  employeesMap: Map<string, EmployeeWithDependentsData>;
  dependentOnlyRecords: EmployeeWithDependentsData[];
  fetchEmployeeByCompanyEmployeeId?: (
    employeeId: string
  ) => Promise<PolicyEnrollmentEmployee | null>;
  fetchDependentsByEmployeeId?: (
    employeeId: number,
    policyId?: number
  ) => Promise<PolicyEnrollmentDependent[]>;
  policyId?: number;
}

function extractEmployeeIdFromPending(
  pending: PendingDependentRecord | undefined
): string | undefined {
  if (!pending) {
    return undefined;
  }
  if (pending.rawEmployeeId) {
    const raw = String(pending.rawEmployeeId).trim();
    return raw ? raw : undefined;
  }
  const value = getRowValueCaseInsensitive(
    pending.rowObj,
    "Employee Id",
    "EmployeeID",
    "Employee Code",
    "EmployeeCode",
    "Employee"
  );
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
}

function mapExistingEmployeeToPartial(
  employee: PolicyEnrollmentEmployee,
  fallbackEmployeeId?: string
): Partial<PolicyEnrollmentEmployee> {
  return {
    id: employee.id,
    companyEmployeeId:
      employee.companyEmployeeId ?? fallbackEmployeeId ?? undefined,
    employeeCompanyId: employee.employeeCompanyId,
    employeeName: employee.employeeName,
    fullName: employee.fullName,
    dateOfBirth: employee.dateOfBirth ?? undefined,
    gender: employee.gender ?? undefined,
    email: employee.email ?? undefined,
    phoneNumber: employee.phoneNumber ?? undefined,
    userId: employee.userId ?? undefined,
    additionalParams: employee.additionalParams ?? undefined,
    relationGroup: employee.relationGroup ?? undefined,
    maritalStatus: employee.maritalStatus ?? undefined,
    designation: employee.designation ?? undefined,
    employeeTpaId: employee.employeeTpaId ?? undefined,
  };
}

function mapExistingDependentToRowData(
  dependent: PolicyEnrollmentDependent,
  rowNumber: number
): DependentRowData {
  const relationValue = dependent.relation ?? dependent.relationshipType ?? "";
  const normalizedRelation = normalizeString(String(relationValue ?? ""));
  const rowObj: Record<string, any> = {
    rowNumber,
    Relation: dependent.relation ?? dependent.relationshipType ?? "",
    "Full Name": dependent.name ?? "",
    Name: dependent.name ?? "",
  };
  if (dependent.dateOfBirth) {
    rowObj["Date of Birth"] = dependent.dateOfBirth;
  }
  if (dependent.gender) {
    rowObj["Gender"] = dependent.gender;
  }

  return {
    id: dependent.id,
    policyId: dependent.policyId,
    employeeId: dependent.employeeId,
    name: dependent.name,
    relation: normalizedRelation,
    relationshipType: dependent.relationshipType,
    gender: dependent.gender,
    dateOfBirth: dependent.dateOfBirth ?? undefined,
    effectiveDate: dependent.effectiveDate ?? undefined,
    isValidDependent: true,
    rowIndex: rowNumber,
    rowObj,
  };
}

function buildEmployeeRowObject(
  employee: PolicyEnrollmentEmployee,
  baseRow: Record<string, any> | undefined,
  rowNumber: number
): Record<string, any> {
  const row: Record<string, any> = { ...(baseRow ?? {}) };
  row.rowNumber = rowNumber;
  if (employee.companyEmployeeId) {
    row["Employee Id"] = employee.companyEmployeeId;
    row["Employee ID"] = employee.companyEmployeeId;
  }
  if (employee.employeeName) {
    row["Employee Name"] = employee.employeeName;
  }
  if (employee.fullName) {
    row["Full Name"] = employee.fullName;
  }
  if (employee.email) {
    row["Email"] = employee.email;
  }
  if (employee.phoneNumber) {
    row["Mobile Number"] = employee.phoneNumber;
    row["Phone Number"] = employee.phoneNumber;
  }
  if (employee.gender) {
    row["Gender"] = employee.gender;
  }
  if (employee.dateOfBirth) {
    row["Date of Birth"] = employee.dateOfBirth;
  }
  return row;
}

async function processPendingDependents({
  pendingDependents,
  employeesMap,
  dependentOnlyRecords,
  fetchEmployeeByCompanyEmployeeId,
  fetchDependentsByEmployeeId,
  policyId,
}: ProcessPendingDependentsParams): Promise<void> {
  if (!pendingDependents || pendingDependents.size === 0) {
    return;
  }

  const groupedPendingDependents = new Map<
    string,
    { entries: PendingDependentRecord[]; rawEmployeeId?: string }
  >();

  pendingDependents.forEach((dependents, key) => {
    if (!dependents || dependents.length === 0) {
      return;
    }
    const normalizedKey = key ?? "";
    const rawEmployeeId = extractEmployeeIdFromPending(dependents[0]);
    const targetKey = rawEmployeeId
      ? normalizeString(String(rawEmployeeId))
      : normalizedKey;
    const group = groupedPendingDependents.get(targetKey) ?? {
      entries: [],
      rawEmployeeId: rawEmployeeId ?? undefined,
    };
    if (!group.rawEmployeeId && rawEmployeeId) {
      group.rawEmployeeId = rawEmployeeId;
    }
    group.entries.push(...dependents);
    groupedPendingDependents.set(targetKey, group);
  });

  for (const [groupKey, group] of groupedPendingDependents.entries()) {
    const dependents = group.entries;
    if (!dependents || dependents.length === 0) {
      continue;
    }

    const first = dependents[0];
    const rowNumber =
      first.dependent.rowIndex ??
      (typeof first.rowObj?.rowNumber === "number"
        ? first.rowObj.rowNumber
        : 0);
    const intakeType = first.intakeType;
    const rawEmployeeId =
      group.rawEmployeeId ??
      extractEmployeeIdFromPending(first) ??
      first.employeeId;

    let processed = false;

    if (
      rawEmployeeId &&
      typeof rawEmployeeId === "string" &&
      fetchEmployeeByCompanyEmployeeId
    ) {
      try {
        const existingEmployee = await fetchEmployeeByCompanyEmployeeId(
          rawEmployeeId
        );
        if (existingEmployee) {
          const employeeRelationGroupKey = existingEmployee.relationGroup
            ? normalizeRelationKey(existingEmployee.relationGroup)
            : undefined;
          const existingDependents = fetchDependentsByEmployeeId
            ? await fetchDependentsByEmployeeId(existingEmployee.id, policyId)
            : [];

          const activeExistingDependents = (existingDependents ?? []).filter(
            (dep) =>
              !dep.deletedAt &&
              (policyId === undefined || dep.policyId === policyId)
          );

          const existingDependentRows = activeExistingDependents.map((dep) =>
            mapExistingDependentToRowData(dep, rowNumber)
          );

          const pendingDependentsWithEmployee = dependents.map((item) => {
            const rowIndex = item.dependent.rowIndex ?? rowNumber;
            const pendingRowObj = {
              ...(item.dependent.rowObj ?? {}),
            };
            if (typeof rowIndex === "number") {
              pendingRowObj.rowNumber = rowIndex;
            }
            const dependentGroupValue = getRowValueCaseInsensitive(
              pendingRowObj,
              RELATIONSHIP_GROUP_FIELD_NAME,
              "relationshipgroup",
              "Relation Group"
            );
            const dependentGroupKey =
              typeof dependentGroupValue === DATA_TYPES.STRING
                ? normalizeRelationKey(dependentGroupValue)
                : undefined;
            const isGroupMismatch = Boolean(
              employeeRelationGroupKey &&
                dependentGroupKey &&
                dependentGroupKey !== employeeRelationGroupKey
            );
            if (isGroupMismatch) {
              addRemark(pendingRowObj, RELATIONSHIP_GROUP_MISMATCH_REMARK);
            }
            return {
              ...item.dependent,
              employeeId: existingEmployee.id,
              rowIndex,
              rowObj: pendingRowObj,
              isValidDependent: isGroupMismatch
                ? false
                : item.dependent.isValidDependent ?? true,
            };
          });

          const combinedDependentsMap = new Map<string, DependentRowData>();

          const registerDependent = (dependent: DependentRowData) => {
            const key = buildDependentAggregationKey(dependent);
            combinedDependentsMap.set(key, dependent);
          };

          existingDependentRows.forEach(registerDependent);
          pendingDependentsWithEmployee.forEach(registerDependent);

          const combinedDependents = Array.from(
            combinedDependentsMap.values()
          ).sort((a, b) => {
            const aIndex =
              typeof a.rowIndex === "number" ? a.rowIndex : rowNumber;
            const bIndex =
              typeof b.rowIndex === "number" ? b.rowIndex : rowNumber;
            if (aIndex === bIndex) {
              const aId = a.id
                ? `existing-${a.id}`
                : buildDependentAggregationKey(a);
              const bId = b.id
                ? `existing-${b.id}`
                : buildDependentAggregationKey(b);
              return aId.localeCompare(bId);
            }
            return aIndex - bIndex;
          });

          const combinedDependentRows = combinedDependents.map((dep) => {
            const dependentRow = { ...(dep.rowObj ?? {}) };
            if (typeof dep.rowIndex === "number") {
              dependentRow.rowNumber = dep.rowIndex;
            } else if (typeof rowNumber === "number") {
              dependentRow.rowNumber = rowNumber;
            }
            return dependentRow;
          });

          const employeeRowObj = buildEmployeeRowObject(
            existingEmployee,
            first.rowObj,
            rowNumber
          );

          const companyEmployeePartial = mapExistingEmployeeToPartial(
            existingEmployee,
            rawEmployeeId
          );
          companyEmployeePartial.additionalParams = {
            ...(existingEmployee.additionalParams ?? {}),
            rowNumber,
          };

          const employeeRecord: EmployeeWithDependentsData = {
            companyEmployee: companyEmployeePartial,
            dependents: combinedDependents,
            intakeType: intakeType,
            rowNumber,
            rowObj: employeeRowObj,
            dependentRows: combinedDependentRows,
            enrollmentStartDate: null,
            enrollmentEndDate: null,
            effectiveDate: undefined,
            additionalParams: {
              ...(existingEmployee.additionalParams ?? {}),
              rowNumber,
            },
            choices: [],
            isProcessed: false,
            isDependentOnly: true,
          };

          employeesMap.set(groupKey, employeeRecord);
          processed = true;
        }
      } catch (error) {
        processed = false;
      }
    }

    if (!processed) {
      const dependentRows = dependents.map((item) => ({
        ...(item.rowObj ?? {}),
      }));
      const firstRowObj = { ...(first.rowObj ?? {}), rowNumber };
      dependentOnlyRecords.push({
        companyEmployee: {
          companyEmployeeId: rawEmployeeId || "NOT Found",
          employeeCompanyId: "",
          additionalParams: { rowNumber },
        },
        dependents: dependents.map((item) => item.dependent),
        intakeType: intakeType,
        rowNumber,
        rowObj: firstRowObj,
        dependentRows,
        enrollmentStartDate: null,
        enrollmentEndDate: null,
        effectiveDate: undefined,
        additionalParams: { rowNumber },
        choices: [],
        isProcessed: false,
        isDependentOnly: true,
      });
    }
  }

  pendingDependents.clear();
}

function buildDependentAggregationKey(dep: DependentRowData): string {
  if (dep?.id) {
    return `existing-${dep.id}`;
  }

  const relationKey = normalizeRelationKey(
    String(dep?.relationshipType ?? dep?.relation ?? "")
  );

  const nameSource = dep?.name
    ? String(dep.name)
    : String(
        getRowValueCaseInsensitive(dep?.rowObj, "Full Name", "Name") ?? ""
      );
  const nameKey = normalizeValue(nameSource);

  const dobSource = dep?.dateOfBirth
    ? dep.dateOfBirth
    : getRowValueCaseInsensitive(dep?.rowObj, "Date of Birth", "DOB", "Dob");
  const normalizedDob = normalizeDateInput(dobSource);
  const dobKey = normalizedDob ? normalizedDob.getTime().toString() : "nodob";

  const genderSource = dep?.gender
    ? dep.gender
    : getRowValueCaseInsensitive(dep?.rowObj, "Gender");
  const genderKey = normalizeValue(String(genderSource ?? ""));

  return `pending-${relationKey}|${nameKey}|${dobKey}|${genderKey}`;
}

function convertToCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
      index === 0 ? match.toLowerCase() : match.toUpperCase()
    )
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function getEmployeeDetailsBasedOnPropertiesForChoices(
  employeeDetails: any,
  employeeKey: string
): any {
  if (!employeeDetails || !employeeKey) {
    return undefined;
  }

  const normalizedKey = employeeKey.toLowerCase();
  if (
    (normalizedKey === "relationshipgroup" ||
      normalizedKey === "relationgroup") &&
    employeeDetails.relationGroup
  ) {
    return employeeDetails.relationGroup;
  }

  const normalizedAdditionalDetails = Object.entries(
    employeeDetails.additionalDetails ?? {}
  ).reduce<Record<string, any>>((acc, [key, value]) => {
    if (typeof key === "string") {
      acc[key.replace(/\s+/g, "").toLowerCase()] = value;
    }
    return acc;
  }, {});

  if (Object.prototype.hasOwnProperty.call(employeeDetails, employeeKey)) {
    return employeeDetails[employeeKey];
  }

  if (normalizedAdditionalDetails.hasOwnProperty(normalizedKey)) {
    return normalizedAdditionalDetails[normalizedKey];
  }

  if (normalizedKey === "age" && employeeDetails.dateOfBirth) {
    const dob = new Date(employeeDetails.dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const today = new Date(employeeDetails?.effectiveDate) ?? new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age -= 1;
      }
      return age;
    }
  }

  return undefined;
}

function mapEmployeeDetailsForChoices(
  employee: EmployeeWithDependentsData
): Record<string, any> {
  const companyEmployee = employee.companyEmployee ?? {};
  const additionalParams =
    (companyEmployee as PolicyEnrollmentEmployee).additionalParams ?? {};
  const rowObj = employee.rowObj ?? {};
  const additionalDetails: Record<string, any> = { ...additionalParams };

  Object.entries(rowObj).forEach(([key, value]) => {
    if (key) {
      additionalDetails[key] = value;
    }
  });

  const resolvedDateOfBirth =
    companyEmployee.dateOfBirth ?? additionalDetails["Date of Birth"];

  return {
    additionalDetails,
    employeeName:
      companyEmployee.employeeName ??
      additionalDetails["Employee Name"] ??
      additionalDetails["Full Name"],
    fullName:
      companyEmployee.employeeName ??
      additionalDetails["Full Name"] ??
      additionalDetails["Employee Name"],
    dateOfBirth: resolvedDateOfBirth,
    designation:
      (companyEmployee as any)?.designation ?? additionalDetails["Designation"],
    email: companyEmployee.email ?? additionalDetails["Email"],
    phone:
      companyEmployee.phoneNumber ??
      additionalDetails["Phone"] ??
      additionalDetails["Mobile"],
    phoneNumber:
      companyEmployee.phoneNumber ??
      additionalDetails["Phone Number"] ??
      additionalDetails["Mobile Number"] ??
      additionalDetails["Phone"],
    maritalStatus:
      (companyEmployee as any)?.maritalStatus ??
      additionalDetails["Marital Status"],
    gender: companyEmployee.gender ?? additionalDetails["Gender"],
    relationGroup:
      companyEmployee.relationGroup ??
      additionalDetails[RELATIONSHIP_GROUP_FIELD_NAME] ??
      additionalDetails["relationshipgroup"] ??
      additionalDetails["Relation Group"],
    effectiveDate: employee?.effectiveDate ?? null,
  };
}

function mapDependentsForChoiceValidation(
  dependents: DependentRowData[]
): Array<{ relation?: string; relationshipType?: string; gender?: string }> {
  return dependents.map((dependent) => {
    const relationFromRow = getRowValueCaseInsensitive(
      dependent.rowObj,
      "Relation",
      "Relationship"
    );
    const genderFromRow = getRowValueCaseInsensitive(
      dependent.rowObj,
      "Gender"
    );
    const relationValue =
      (typeof relationFromRow === "string" && relationFromRow.trim().length > 0
        ? relationFromRow
        : dependent.relationshipType ?? dependent.relation) ?? "";
    return {
      relation: relationValue,
      relationshipType:
        (typeof dependent.relationshipType === "string"
          ? dependent.relationshipType
          : relationValue) ?? dependent.relation,
      gender:
        (typeof dependent.gender === "string" ? dependent.gender : undefined) ??
        (typeof genderFromRow === "string" ? genderFromRow : undefined),
    };
  });
}

function parseConstraintFlag(value: any, defaultValue = true): boolean {
  if (typeof value === DATA_TYPES.BOOLEAN) {
    return value as boolean;
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
}

function getEmployeeRelationTypesForChoices(
  dependents: Array<{
    relation?: string;
    relationshipType?: string;
    gender?: string;
  }> = [],
  relationships: any,
  constraints: Record<string, any> = {},
  employeeGender = "",
  relationGroupSelection?: string,
  relationGroupDetails?: any[]
): { relationTypes: string[]; hasDisallowedRelation: boolean } {
  const optionToType: Record<string, string> = {};
  const availableRelationNames = new Set<string>();

  if (relationships?.enabledPolicyRelations) {
    relationships.enabledPolicyRelations.forEach((relType: any) => {
      relType?.configuredOptions?.forEach((option: any) => {
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

  const normalizeGroupName = (value: any) =>
    normalizeRelationKey(String(value ?? ""));
  const matchedRelationGroup =
    relationGroupSelection && Array.isArray(relationGroupDetails)
      ? relationGroupDetails.find((group: any) => {
          const candidates = [
            group?.groupDisplayName,
            group?.name,
            group?.type,
            group?.relationGroupName,
          ];
          const selectionNorm = normalizeGroupName(relationGroupSelection);
          return candidates.some(
            (candidate) =>
              candidate && normalizeGroupName(candidate) === selectionNorm
          );
        })
      : undefined;

  const appendGroupRelations = (group: any) => {
    const selectedRelations = (group?.selectedRelations ?? [])
      .filter((relation: any) => relation?.selected)
      .map((relation: any) => relation?.name)
      .filter((name: any) => typeof name === DATA_TYPES.STRING)
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0);
    if (selectedRelations.length) {
      selectedRelations.forEach((name: string) => relationTypes.add(name));
    }
  };

  if (matchedRelationGroup) {
    appendGroupRelations(matchedRelationGroup);
  }

  const normalizedGender = (employeeGender ?? "").toLowerCase();
  const isMale = normalizedGender === GENDER_VALUES.MALE;
  const isFemale = normalizedGender === GENDER_VALUES.FEMALE;

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

  const crossParentRelations = [
    GLOBAL_PARENT_RELATIONSHIP_TYPES.FATHER,
    GLOBAL_PARENT_RELATIONSHIP_TYPES.MOTHER,
    GLOBAL_PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW,
    GLOBAL_PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW,
  ];
  const hasAllCrossParentRelations = crossParentRelations.every((relation) =>
    availableRelationNames.has(relation)
  );

  const selectedRelationsInfo: Array<{
    sanitized: string;
    type:
      | typeof GLOBAL_PARENT_RELATIONSHIP_TYPES.PARENT
      | typeof GLOBAL_PARENT_RELATIONSHIP_TYPES.IN_LAW
      | typeof GENDER_VALUES.OTHER;
    gender?: typeof GENDER_VALUES.MALE | typeof GENDER_VALUES.FEMALE;
  }> = [];

  dependents.forEach((dependent) => {
    const relationName =
      (typeof dependent.relation === DATA_TYPES.STRING
        ? dependent.relation
        : "") ||
      (typeof dependent.relationshipType === DATA_TYPES.STRING
        ? dependent.relationshipType
        : "");
    const trimmedRelation = relationName.trim();
    if (!trimmedRelation) {
      return;
    }

    const normalizedRelation = trimmedRelation.toLowerCase();
    const sanitizedRelation = normalizedRelation.replace(/[-_\s]+/g, "");

    const isInLaw = sanitizedRelation.includes(
      GLOBAL_PARENT_RELATIONSHIP_TYPES.IN_LAW
    );
    const parentLabels = [
      GLOBAL_PARENT_RELATIONSHIP_TYPES.FATHER,
      GLOBAL_PARENT_RELATIONSHIP_TYPES.MOTHER,
      GLOBAL_PARENT_RELATIONSHIP_TYPES.PARENT,
      GLOBAL_PARENT_RELATIONSHIP_TYPES.PARENTS,
    ];
    const isParent = parentLabels.includes(sanitizedRelation);

    const relationType = isInLaw
      ? GLOBAL_PARENT_RELATIONSHIP_TYPES.IN_LAW
      : isParent
      ? GLOBAL_PARENT_RELATIONSHIP_TYPES.PARENT
      : GENDER_VALUES.OTHER;

    let relationGender:
      | typeof GENDER_VALUES.MALE
      | typeof GENDER_VALUES.FEMALE
      | undefined;

    if (
      sanitizedRelation === GLOBAL_PARENT_RELATIONSHIP_TYPES.FATHER ||
      sanitizedRelation === GLOBAL_PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW
    ) {
      relationGender = (dependent.gender ?? GENDER_VALUES.MALE).toLowerCase();
    } else if (
      sanitizedRelation === GLOBAL_PARENT_RELATIONSHIP_TYPES.MOTHER ||
      sanitizedRelation === GLOBAL_PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW
    ) {
      relationGender = (dependent.gender ?? GENDER_VALUES.FEMALE).toLowerCase();
    } else if (relationType !== GENDER_VALUES.OTHER) {
      const dependentGender =
        typeof dependent?.gender === DATA_TYPES.STRING
          ? dependent.gender.toLowerCase().trim()
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
      optionToType[trimmedRelation] ??
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
              ? dependent.relation
              : typeof dependent?.relationshipType === DATA_TYPES.STRING
              ? dependent.relationshipType
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
        selectedRelations.has(GLOBAL_PARENT_RELATIONSHIP_TYPES.FATHER) &&
        selectedRelations.has(GLOBAL_PARENT_RELATIONSHIP_TYPES.MOTHER_IN_LAW);
      const hasMotherWithFatherInLaw =
        selectedRelations.has(GLOBAL_PARENT_RELATIONSHIP_TYPES.MOTHER) &&
        selectedRelations.has(GLOBAL_PARENT_RELATIONSHIP_TYPES.FATHER_IN_LAW);
      if (hasFatherWithMotherInLaw || hasMotherWithFatherInLaw) {
        hasDisallowedRelation = true;
      }
    }
  }

  if (!sameGenderParentsAllowed && hasAllCrossParentRelations) {
    const parentGenders = new Set<string>();
    const inLawGenders = new Set<string>();
    selectedRelationsInfo.forEach((info) => {
      if (
        info.type === GLOBAL_PARENT_RELATIONSHIP_TYPES.PARENT &&
        info.gender
      ) {
        parentGenders.add(info.gender);
      }
      if (
        info.type === GLOBAL_PARENT_RELATIONSHIP_TYPES.IN_LAW &&
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
      hasDisallowedRelation = true;
    }
  }

  return {
    relationTypes: Array.from(relationTypes).sort(),
    hasDisallowedRelation,
  };
}

function filterPolicyOptionsForChoices(
  employeeDetails: any,
  policyConfig: any,
  dependents: Array<{
    relation?: string;
    relationshipType?: string;
    gender?: string;
  }> = []
): any {
  if (!policyConfig?.policyOptions || !policyConfig?.parameters) {
    return {};
  }

  for (const option of policyConfig.policyOptions) {
    const optionMeta: any[] = Array.isArray(option?.optionMeta)
      ? option.optionMeta
      : [];

    let matchesAllConditions = true;

    for (const meta of optionMeta) {
      const paramDetails = policyConfig.parameters.find(
        (parameter: any) => parameter.id === meta?.parameterId
      );
      if (!paramDetails) {
        continue;
      }

      const paramName = paramDetails?.parameterMasterName ?? "";
      const employeeKey = convertToCamelCase(String(paramName).toLowerCase());
      const employeeValue = getEmployeeDetailsBasedOnPropertiesForChoices(
        employeeDetails,
        employeeKey
      );

      let isMatch = false;

      if (
        typeof paramDetails.type === DATA_TYPES.STRING &&
        paramDetails.type?.toLowerCase() ===
          POLICY_RELATIONSHIP_TYPE_PARAMETER.toLowerCase() &&
        Array.isArray(paramDetails.relationGroupDetails) &&
        paramDetails.relationGroupDetails.length > 0
      ) {
        const relationGroupSelection =
          typeof employeeValue === DATA_TYPES.STRING
            ? employeeValue
            : undefined;
        const matchedGroup = paramDetails.relationGroupDetails.find(
          (relationGroupDetail: any) =>
            relationGroupDetail?.id === meta?.parameterOptionId
        );
        if (matchedGroup) {
          const { hasDisallowedRelation } =
            getEmployeeRelationTypesForChoices(
              dependents,
              policyConfig.relationships,
              policyConfig.constraints,
              employeeDetails.gender,
              relationGroupSelection,
              paramDetails.relationGroupDetails
            );
          const groupRelations = getSelectedRelationsFromGroup(matchedGroup);
          const groupRelationsNormalized = groupRelations
            .map((name: string) => name.toLowerCase())
            .sort();
          const selectionMatches =
            relationGroupSelection &&
            matchesRelationGroupSelection(
              relationGroupSelection,
              matchedGroup
            );
          if (!hasDisallowedRelation) {
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
              const normalizedGroupRelations = [
                "self",
                ...groupRelationsNormalized,
              ];
              const isRelationSubset = employeeRelationSource.every((relation) =>
                normalizedGroupRelations.includes(relation)
              );
              if (isRelationSubset) {
                isMatch = true;
              }
            }
          }
        }
      } else if (
        Array.isArray(paramDetails.lovDetails) &&
        paramDetails.lovDetails.length > 0
      ) {
        const matchedLov = paramDetails.lovDetails.find(
          (lovDetail: any) => lovDetail?.id === meta?.parameterOptionId
        );
        const expectedValue = matchedLov?.value;
        if (expectedValue !== undefined && expectedValue !== null) {
          const employeeValueString =
            employeeValue !== undefined && employeeValue !== null
              ? String(employeeValue)
              : "";
          if (
            employeeValueString.toLowerCase() ===
            String(expectedValue).toLowerCase()
          ) {
            isMatch = true;
          }
        }
      } else if (
        Array.isArray(paramDetails.rangeDetails) &&
        paramDetails.rangeDetails.length > 0
      ) {
        const numericValue = Number.parseFloat(employeeValue);
        const matchedRange = paramDetails.rangeDetails.find(
          (rangeDetail: any) => rangeDetail?.id === meta?.parameterOptionId
        );
        if (matchedRange && !Number.isNaN(numericValue)) {
          const min =
            typeof matchedRange.min === DATA_TYPES.STRING
              ? Number.parseInt(matchedRange.min, 10)
              : matchedRange.min;
          const max =
            typeof matchedRange.max === DATA_TYPES.STRING
              ? Number.parseInt(matchedRange.max, 10)
              : matchedRange.max;
          const minCheck =
            typeof min === DATA_TYPES.NUMBER ? numericValue >= min : true;
          const maxCheck =
            typeof max === DATA_TYPES.NUMBER ? numericValue <= max : true;
          if (minCheck && maxCheck) {
            isMatch = true;
          }
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

function collectPolicyChoiceSections(applicable: any): any[] {
  if (!applicable || typeof applicable !== "object") {
    return [];
  }

  const sections: any[] = [];
  const pushSection = (section: any) => {
    if (section) {
      sections.push(section);
    }
  };

  const baseChoices = applicable.basePolicyChoices;
  if (baseChoices) {
    pushSection(baseChoices.mainPolicyChoices);
    if (Array.isArray(baseChoices.addonChoices)) {
      baseChoices.addonChoices.forEach(pushSection);
    }
  }

  const parentalChoices = applicable.parentalPolicyChoices;
  if (parentalChoices) {
    pushSection(parentalChoices.mainPolicyChoices);
    if (Array.isArray(parentalChoices.addonChoices)) {
      parentalChoices.addonChoices.forEach(pushSection);
    }
  }

  if (Array.isArray(applicable.otherPolicyChoices)) {
    applicable.otherPolicyChoices.forEach(pushSection);
  }

  if (Array.isArray(applicable.choices)) {
    sections.push({ choices: applicable.choices });
  }

  return sections;
}

function sectionHasAvailableChoices(section: any): boolean {
  if (!section || !Array.isArray(section.choices)) {
    return false;
  }
  return section.choices.some((choice: any) => {
    if (!choice) {
      return false;
    }
    if (typeof choice.isAvailable === "boolean") {
      return choice.isAvailable;
    }
    if (typeof choice.isAvailable === "string") {
      return isTruthyConstraint(choice.isAvailable);
    }
    return false;
  });
}

function hasAvailablePolicyChoices(applicable: any): boolean {
  const sections = collectPolicyChoiceSections(applicable);
  if (sections.length === 0) {
    return false;
  }
  return sections.some(sectionHasAvailableChoices);
}

function generateEnrollmentEmail(
    companyEmployeeId: string,
    employeeName: string,
    dateOfBirth: string
  ): string {
    const sanitizeAlphaNumeric = (value: string) =>
      (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const sanitizeNumeric = (value: string) =>
      (value || "").replace(/\D/g, "");

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
    return `${companyPart}${namePart}${dobPart}@gmail.com`;
  }

export async function processEnrollmentFile(
  enrollmentDataBuffer: Buffer<ArrayBufferLike>,
  policyConfig: PolicyConfiguration,
  options: ProcessEnrollmentFileOptions = {}
): Promise<ValidatedEnrollmentProcessingResult> {
  const { fetchEmployeeByCompanyEmployeeId, fetchDependentsByEmployeeId } =
    options;
  try {
    let parsedEmployeeDataFromExcel: EnrollmentProcessingResult = {
      employees: [] as EmployeeWithDependentsData[],
      dependentsWithoutEmployee: [] as EmployeeWithDependentsData[],
    };

    let validatedEmployeeDataFromExcel: ValidatedEnrollmentProcessingResult = {
      employees: [] as EmployeeWithDependentsData[],
      dependentsWithoutEmployee: [] as EmployeeWithDependentsData[],
      invalidEmployees: [] as EmployeeWithDependentsData[],
    };

    // Step 1: Read the Excel file from the buffer
    const workbook = XLSX.read(enrollmentDataBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Step 2: Extract the rows data from the sheet
    const rowsData: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      dateNF: "yyyy-mm-dd",
    });

    if (!rowsData || rowsData.length === 0) {
      parsedEmployeeDataFromExcel = {
        employees: [],
        dependentsWithoutEmployee: [],
      };
    }
    // Step 3: Get the header values
    const headerValues = rowsData[0].map((h: any) => String(h).trim());
    const normalizedHeaderValues = headerValues.map((h) => normalizeString(h));

    // Step 4: Get intake type & effective date index
    const intakeTypeIndex = headerValues.findIndex(
      (header) => normalizeString(header) === "intaketype"
    );
    const effectiveDateIndex = headerValues.findIndex(
      (header) => normalizeString(header) === "effectivedate"
    );

    // Step 5: Get the allowed relation types for the policy as per the configuration
    const configObject = getPolicyConfigurationObject(policyConfig);
    const configuredRelationShipGroups =
      configObject?.relationships?.enabledPolicyRelations ?? [];

    let configuredRelationShipTypes: string[] = [];
    const relationOptionTypeMap = new Map<string, string>();
    const relationOptionConfigMap = new Map<
      string,
      { option: any; group: any; groupTypeNorm: string }
    >();

    configuredRelationShipGroups.forEach((relationShipGroups: any) => {
      const relationshipType = relationShipGroups?.type ?? "";
      const configuredOptions = relationShipGroups?.configuredOptions ?? [];
      const normalizedGroupType = normalizeRelationKey(relationshipType ?? "");
      configuredOptions.forEach((configuredOption: any) => {
        const normalizedKey = normalizeRelationKey(configuredOption.name ?? "");
        if (normalizedKey) {
          relationOptionConfigMap.set(normalizedKey, {
            option: configuredOption,
            group: relationShipGroups,
            groupTypeNorm: normalizedGroupType,
          });
        }

        if (configuredOption.enabled) {
          const normalizedName = normalizeString(configuredOption.name ?? "");
          configuredRelationShipTypes = [
            ...configuredRelationShipTypes,
            configuredOption.name,
          ];
          if (normalizedName) {
            relationOptionTypeMap.set(normalizedName, relationshipType);
          }
        }
      });
    });

    const allowedRelations = new Set(
      configuredRelationShipTypes.map((relation) =>
        normalizeString(String(relation ?? ""))
      )
    );

    const constraintsConfig: Record<string, any> =
      configObject?.constraints ?? {};
    const employeesMap = new Map<string, EmployeeWithDependentsData>();
    const pendingDependents = new Map<
      string,
      {
        dependent: DependentRowData;
        rowObj: Record<string, any>;
        intakeType: string;
        employeeId: string;
        rawEmployeeId?: string | null;
      }[]
    >();
    const dependentOnlyRecords: EmployeeWithDependentsData[] = [];

  const headerIndexMap = headerValues.reduce<Record<string, number>>(
    (acc, header, index) => {
      acc[normalizeString(header)] = index;
      return acc;
    },
    {}
  );

  const relationIndex = headerIndexMap["relation"] ?? -1;
  const relationGroupIndex = headerIndexMap["relationshipgroup"] ?? -1;

    const excludedAdditionalParamKeys = new Set<string>([
      ...Object.keys(employeePropertiesMap),
      "employeeid",
      "intaketype",
    ]);

    // Step 6: Navigate through all the rows and construct the employee and dependent object
    for (let rowIdx = 1; rowIdx < rowsData.length; rowIdx += 1) {
      const row = rowsData[rowIdx];
      if (
        !row ||
        row.every((cell) => cell === undefined || cell === null || cell === "")
      ) {
        continue;
      }

      const rowNumber = rowIdx + 1;
      const rowObj = createRowObject(headerValues, row, rowNumber);

      const employeeIdIdx = headerIndexMap["employeeid"] ?? -1;
      const intakeTypeValue =
        intakeTypeIndex >= 0
          ? String(row[intakeTypeIndex] ?? "").toLowerCase()
          : "";
      const relationValue =
        relationIndex >= 0 ? String(row[relationIndex] ?? "") : "";
      const employeeId =
        employeeIdIdx >= 0 ? String(row[employeeIdIdx] ?? "").trim() : "";
      const employeeKey = normalizeString(employeeId);

      const effectiveDateValue =
        effectiveDateIndex >= 0
          ? parseDateValue(row[effectiveDateIndex])
          : undefined;

      const additionalParams = buildAdditionalParams(
        row,
        headerValues,
        excludedAdditionalParamKeys,
        rowNumber
      );

      const choices = buildChoices(row, headerValues);

      const employeeCompanyId = policyConfig.policyId;
      const policyIdNumeric = Number(employeeCompanyId);
      const policyId = Number.isNaN(policyIdNumeric)
        ? undefined
        : policyIdNumeric;
      const relationGroupValue =
        relationGroupIndex >= 0 ? row[relationGroupIndex] : undefined;

      const isSelfRelation = normalizeString(relationValue) === "self";

      if (isSelfRelation) {
        const companyEmployee: Partial<PolicyEnrollmentEmployee> = {
          companyEmployeeId: employeeId || undefined,
          employeeCompanyId: employeeCompanyId.toString(),
          additionalParams,
          relationGroup:
            typeof relationGroupValue === "string"
              ? relationGroupValue?.trim()
              : relationGroupValue ?? undefined,
        };

        Object.entries(employeePropertiesMap).forEach(
          ([normalizedHeader, property]) => {
            const index = headerIndexMap[normalizedHeader];
            if (index === undefined || index < 0) {
              return;
            }
            const value = row[index];
            if (property === "dateOfBirth") {
              const parsedDob = parseDateValue(value);
              if (parsedDob) {
                (companyEmployee as any)[property] = parsedDob;
              }
              return;
            }
            if (property === "email") {
              const emailValue =
                value !== undefined && value !== null
                  ? String(value).trim()
                  : "";
              if (emailValue) {
                (companyEmployee as any)[property] = emailValue;
                return;
              }

              const generatedEmail = generateEnrollmentEmail(
                companyEmployee.companyEmployeeId ?? "",
                companyEmployee.employeeName ?? companyEmployee.fullName,
                companyEmployee.dateOfBirth ?? new Date()
              );
              if (generatedEmail) {
                (companyEmployee as any)[property] = generatedEmail;
              }
              return;
            }

            if (value === undefined || value === null || value === "") {
              return;
            }
            (companyEmployee as any)[property] = value;
          }
        );

        const existingEmployee = employeesMap.get(employeeKey);
        const employeeData: EmployeeWithDependentsData = existingEmployee
          ? {
              ...existingEmployee,
              companyEmployee: {
                ...existingEmployee.companyEmployee,
                ...companyEmployee,
              },
              intakeType: intakeTypeValue || existingEmployee.intakeType,
              rowNumber,
              rowObj,
              effectiveDate:
                effectiveDateValue ?? existingEmployee.effectiveDate,
              additionalParams,
              choices:
                choices.length > 0
                  ? choices
                  : existingEmployee.choices ?? choices,
            }
          : {
              companyEmployee,
              dependents: [],
              intakeType: intakeTypeValue,
              rowNumber,
              rowObj,
              dependentRows: [],
              enrollmentStartDate: null,
              enrollmentEndDate: null,
              effectiveDate: effectiveDateValue ?? undefined,
              additionalParams,
              choices,
              isProcessed: false,
            };

        const pending = pendingDependents.get(employeeKey);
        if (pending && pending.length > 0) {
          pending.forEach(({ dependent, rowObj: depRowObj, intakeType }) => {
            employeeData.dependents.push(dependent);
            employeeData.dependentRows.push(depRowObj);
            if (!employeeData.intakeType && intakeType) {
              employeeData.intakeType = intakeType;
            }
          });
          pendingDependents.delete(employeeKey);
        }

        employeesMap.set(employeeKey, employeeData);
      } else {
        const dependent = buildDependentData(
          row,
          headerValues,
          rowNumber,
          relationValue,
          relationOptionTypeMap,
          allowedRelations,
          policyId
        );

        const employeeRecord = employeesMap.get(employeeKey);
        if (employeeRecord) {
          employeeRecord.dependents.push(dependent);
          employeeRecord.dependentRows.push(dependent.rowObj);
          if (!employeeRecord.intakeType) {
            employeeRecord.intakeType = intakeTypeValue;
          }
        } else {
          const pending = pendingDependents.get(employeeKey) ?? [];
          pending.push({
            dependent,
            rowObj: dependent.rowObj,
            intakeType: intakeTypeValue,
            employeeId: employeeKey,
            rawEmployeeId: employeeId,
          });
          pendingDependents.set(employeeKey, pending);
        }
      }
    }
    await processPendingDependents({
      pendingDependents,
      employeesMap,
      dependentOnlyRecords,
      fetchEmployeeByCompanyEmployeeId,
      fetchDependentsByEmployeeId,
      policyId: policyConfig.policyId,
    });
    parsedEmployeeDataFromExcel = {
      employees: Array.from(employeesMap.values()),
      dependentsWithoutEmployee: dependentOnlyRecords,
    };
    validatedEmployeeDataFromExcel = {
      ...parsedEmployeeDataFromExcel,
      invalidEmployees: [],
    };

    // Step 7: After constructing all the employee and dependent objects , make the necessary validations based on configuration
    const validEmployees: EmployeeWithDependentsData[] = [];
    const errorRecords: EmployeeWithDependentsData[] = [];
    const employeeRejectionRemark =
      endorsementFileUploadMessages.ER0024;
    const dependentRejectionRemark =
      endorsementFileUploadMessages.ER0025;
    const relationGroupParameter = (configObject?.parameters ?? []).find(
      (param: any) =>
        typeof param?.type === DATA_TYPES.STRING &&
        param.type.toLowerCase() === POLICY_RELATIONSHIP_TYPE_PARAMETER &&
        Array.isArray(param?.relationGroupDetails) &&
        param.relationGroupDetails.length > 0
    );
    const relationGroupDetails =
      relationGroupParameter?.relationGroupDetails ?? [];
    const hasRelationGroupColumn = relationGroupIndex >= 0;

    parsedEmployeeDataFromExcel.employees.forEach((employeeRecord) => {
      const clonedEmployee = cloneEmployeeRecord(employeeRecord);
      const counts: Record<string, number> = {};
      const acceptedDependents: DependentRowData[] = [];
      let hasError = false;
      let dependentsRejectedForGroupMismatch = false;

      const employeeDob = normalizeDateInput(
        clonedEmployee.companyEmployee?.dateOfBirth
      );
      const employeeAge = employeeDob ? calculateAge(employeeDob) : undefined;

      const selfOptionInfo = relationOptionConfigMap.get(
        normalizeRelationKey("self")
      );
      const selfOption = selfOptionInfo?.option;
      if (selfOption && employeeDob) {
        if (selfOption.minAge) {
          const minAge = Number(selfOption.minAge);
          if (!Number.isNaN(minAge) && employeeAge !== undefined) {
            if (employeeAge < minAge) {
              addRemark(
                clonedEmployee.rowObj,
                `Age ${employeeAge} below minimum ${selfOption.minAge}`
              );
              hasError = true;
            }
          }
        }
        if (selfOption.maxAge) {
          const maxAgeValue = Number(selfOption.maxAge);
          if (!Number.isNaN(maxAgeValue) && employeeAge !== undefined) {
            if (employeeAge > maxAgeValue) {
              addRemark(
                clonedEmployee.rowObj,
                `Age ${employeeAge} exceeds maximum ${selfOption.maxAge}`
              );
              hasError = true;
            }
          }
        }
      }

      // Relationship group validations
      let relationGroupSelection: string | undefined;
      let relationGroupSelectionKey: string | undefined;
      let relationGroupMeta:
        | {
            label: string;
            allowedRelations: string[];
            allowedRelationMap: Map<string, { maxCount?: number; label: string }>;
            familyMaxCount?: number;
          }
        | undefined;
      if (relationGroupParameter) {
        const relationGroupValue =
          getRowValueCaseInsensitive(
            clonedEmployee.rowObj,
            RELATIONSHIP_GROUP_FIELD_NAME,
            "relationshipgroup",
            "Relation Group"
          ) ??
          clonedEmployee.companyEmployee?.relationGroup;
        relationGroupSelection =
          typeof relationGroupValue === DATA_TYPES.STRING
            ? relationGroupValue.trim()
            : undefined;
        relationGroupSelectionKey = relationGroupSelection
          ? normalizeRelationKey(relationGroupSelection)
          : undefined;

        if (!hasRelationGroupColumn) {
          addRemark(
            clonedEmployee.rowObj,
            `${RELATIONSHIP_GROUP_FIELD_NAME} column is required.`
          );
          hasError = true;
        } else if (!relationGroupSelection) {
          addRemark(
            clonedEmployee.rowObj,
            `${RELATIONSHIP_GROUP_FIELD_NAME} is required.`
          );
          hasError = true;
        } else {
          const matchedGroup = relationGroupDetails.find((group: any) =>
            matchesRelationGroupSelection(relationGroupSelection as string, group)
          );
          if (!matchedGroup) {
            addRemark(
              clonedEmployee.rowObj,
              `Invalid ${RELATIONSHIP_GROUP_FIELD_NAME} '${relationGroupSelection}'.`
            );
            hasError = true;
          } else {
            const selectedRelations = getSelectedRelationsFromGroup(matchedGroup);
            const allowedRelationMap = new Map<
              string,
              { maxCount?: number; label: string }
            >();
            selectedRelations.forEach((rel: string) => {
              const normalized = normalizeRelationKey(rel);
              const relConfig = (matchedGroup.selectedRelations ?? []).find(
                (item: any) =>
                  item?.name &&
                  normalizeRelationKey(String(item.name)) === normalized
              );
              const maxCountRaw = relConfig?.maxCount;
              const maxCount =
                maxCountRaw !== undefined && maxCountRaw !== null
                  ? Number(maxCountRaw)
                  : undefined;
              allowedRelationMap.set(normalized, {
                maxCount: Number.isNaN(maxCount) ? undefined : maxCount,
                label: rel,
              });
            });
            relationGroupMeta = {
              label:
                matchedGroup?.groupDisplayName ||
                matchedGroup?.name ||
                matchedGroup?.type ||
                relationGroupSelection,
              allowedRelations: selectedRelations,
              allowedRelationMap,
              familyMaxCount:
                matchedGroup?.familyMaxCount !== undefined &&
                matchedGroup?.familyMaxCount !== null &&
                !Number.isNaN(Number(matchedGroup.familyMaxCount))
                  ? Number(matchedGroup.familyMaxCount)
                  : undefined,
            };
          }
        }
      }

      const relationGroupRelationCounts = new Map<string, number>();
      let relationGroupFamilyCount = 0;

      clonedEmployee.dependents.forEach((dependent, index) => {
        const dependentRow =
          clonedEmployee.dependentRows[index] ?? dependent.rowObj ?? {};
        const dependentGroupValue = getRowValueCaseInsensitive(
          dependentRow,
          RELATIONSHIP_GROUP_FIELD_NAME,
          "relationshipgroup",
          "Relation Group"
        );
        const dependentGroupKey =
          typeof dependentGroupValue === DATA_TYPES.STRING
            ? normalizeRelationKey(dependentGroupValue)
            : undefined;
        const relationLabel =
          getRowValueCaseInsensitive(
            dependentRow,
            "Relation",
            "Relationship"
          ) ??
          dependent.relationshipType ??
          dependent.relation ??
          "dependent";

        const normalizedRelationKey = normalizeRelationKey(
          String(dependent.relation ?? "")
        );
        const optionInfo = relationOptionConfigMap.get(normalizedRelationKey);
        const relationType =
          optionInfo?.group?.type ?? dependent.relationshipType;
        const relationTypeNorm = normalizeRelationKey(
          String(relationType ?? "")
        );

        if (
          relationGroupSelectionKey &&
          dependentGroupKey &&
          dependentGroupKey !== relationGroupSelectionKey
        ) {
          addRemark(dependentRow, RELATIONSHIP_GROUP_MISMATCH_REMARK);
          hasError = true;
          dependentsRejectedForGroupMismatch = true;
          return;
        }

        if (relationGroupMeta) {
          const normalizedRelation = normalizeRelationKey(relationLabel);
          const allowed = relationGroupMeta.allowedRelationMap.get(
            normalizedRelation
          );
          relationGroupFamilyCount += 1;
          const currentCount =
            (relationGroupRelationCounts.get(normalizedRelation) ?? 0) + 1;
          relationGroupRelationCounts.set(normalizedRelation, currentCount);
          if (!allowed) {
            addRemark(
              dependentRow,
              `Relation '${relationLabel}' not allowed for selected ${RELATIONSHIP_GROUP_FIELD_NAME} '${relationGroupMeta.label}'.`
            );
            hasError = true;
            return;
          }
          if (
            typeof allowed.maxCount === "number" &&
            currentCount > allowed.maxCount
          ) {
            addRemark(
              dependentRow,
              `Exceeded allowed count ${allowed.maxCount} for '${allowed.label}' in ${RELATIONSHIP_GROUP_FIELD_NAME} '${relationGroupMeta.label}'.`
            );
            hasError = true;
            return;
          }
          if (
            typeof relationGroupMeta.familyMaxCount === "number" &&
            relationGroupFamilyCount > relationGroupMeta.familyMaxCount
          ) {
            addRemark(
              dependentRow,
              `Exceeded ${RELATIONSHIP_GROUP_FIELD_NAME} limit ${relationGroupMeta.familyMaxCount}.`
            );
            hasError = true;
            return;
          }
        }

        if (!optionInfo || !optionInfo.group?.enabled) {
          addRemark(
            dependentRow,
            `Invalid relationship type '${relationType ?? relationLabel}'`
          );
          hasError = true;
          return;
        }

        const option = optionInfo.option;
        if (
          !option ||
          option.enabled === false ||
          !dependent.isValidDependent
        ) {
          const message =
            option?.enabled === false
              ? `Relationship option '${relationLabel}' disabled`
              : `Invalid relationship option '${relationLabel}'`;
          addRemark(dependentRow, message);
          hasError = true;
          return;
        }

        const updatedCount = (counts[relationTypeNorm] || 0) + 1;
        let exceedsMaxCount = false;
        const groupConfig = optionInfo.group;
        if (groupConfig?.maxCount) {
          const maxCountValue = Number(groupConfig.maxCount);
          if (!Number.isNaN(maxCountValue) && updatedCount > maxCountValue) {
            const isChildType = isChildRelationshipType(relationTypeNorm, groupConfig?.type);
            const twinsSecondChildAllowed = isTruthyConstraint(constraintsConfig?.twinsSecondChildAllowed);
            const tripletsSecondChildAllowed = isTruthyConstraint(constraintsConfig?.tripletsSecondChildAllowed);
            const allowFirstChildAsTwin = isTruthyConstraint(constraintsConfig?.allowFirstChildAsTwin);
            const canApplyOverride =
              isChildType &&
              (
                (twinsSecondChildAllowed && canAddChildWithTwinOverride(acceptedDependents, dependent.dateOfBirth, relationTypeNorm, maxCountValue)) ||
                (tripletsSecondChildAllowed && canAddChildWithTripletOverride(acceptedDependents, dependent.dateOfBirth, relationTypeNorm, maxCountValue)) ||
                (allowFirstChildAsTwin && canAddFirstChildAsTwinOverride(acceptedDependents, dependent.dateOfBirth, relationTypeNorm, maxCountValue)) ||
                (twinsSecondChildAllowed && allowFirstChildAsTwin && canAddDoubleTwinOverride(acceptedDependents, dependent.dateOfBirth, relationTypeNorm, maxCountValue)) ||
                (allowFirstChildAsTwin && tripletsSecondChildAllowed && canAddTwinPlusTripletOverride(acceptedDependents, dependent.dateOfBirth, relationTypeNorm, maxCountValue))
              );
            if (!canApplyOverride) {
              exceedsMaxCount = true;
            }
          }
        }

        if (exceedsMaxCount) {
          addRemark(
            dependentRow,
            `Exceeded max count ${groupConfig?.maxCount} for '${relationType}'`
          );
          hasError = true;
          return;
        }

        counts[relationTypeNorm] = updatedCount;

        const dependentDob = normalizeDateInput(dependent.dateOfBirth);
        const sanitizedRelation = sanitizeRelationValue(
          String(dependent.relation ?? "")
        );
        const sanitizedType = sanitizeRelationValue(String(relationType ?? ""));
        const isInLawRelation = sanitizedRelation.includes(
          PARENT_RELATIONSHIP_TYPES.IN_LAW
        );

        if (dependentDob) {
          const age = calculateAge(dependentDob);
          if (option.minAge) {
            const minAge = Number(option.minAge);
            if (!Number.isNaN(minAge) && age < minAge) {
              addRemark(
                dependentRow,
                `Age ${age} below minimum ${option.minAge}`
              );
              hasError = true;
              return;
            }
          }

          let effectiveMaxAge: number | undefined;
          if (option.maxAge) {
            const rawMaxAge = Number(option.maxAge);
            if (!Number.isNaN(rawMaxAge)) {
              effectiveMaxAge = rawMaxAge;
              const studyingSonExtension = Number(
                constraintsConfig?.studyingSonAgeExtension ?? 0
              );
              if (
                studyingSonExtension > 0 &&
                sanitizedRelation.includes(CHILD_RELATIONSHIP_TYPES.SON) &&
                !isInLawRelation
              ) {
                effectiveMaxAge += studyingSonExtension;
              }
              const unmarriedDaughterExtension = Number(
                constraintsConfig?.unmarriedDaughterAgeExtension ?? 0
              );
              if (
                unmarriedDaughterExtension > 0 &&
                sanitizedRelation.includes(CHILD_RELATIONSHIP_TYPES.DAUGHTER) &&
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
            addRemark(
              dependentRow,
              endorsementFileUploadMessages.ER0022
            );
            hasError = true;
            return;
          }

          if (employeeDob) {
            const employeeAgeValue = employeeAge ?? calculateAge(employeeDob);
            const isParentRelation =
              sanitizedType.includes(PARENT_RELATIONSHIP_TYPES.PARENT) ||
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.FATHER) ||
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.MOTHER) ||
              sanitizedRelation.includes(PARENT_RELATIONSHIP_TYPES.PARENTS);
            const isChildRelation =
              sanitizedType.includes(CHILD_RELATIONSHIP_TYPES.CHILD) ||
              (!isInLawRelation &&
                sanitizedRelation.includes(CHILD_RELATIONSHIP_TYPES.SON)) ||
              (!isInLawRelation &&
                sanitizedRelation.includes(
                  CHILD_RELATIONSHIP_TYPES.DAUGHTER
                )) ||
              sanitizedRelation.includes(CHILD_RELATIONSHIP_TYPES.CHILD);

            const parentGapThreshold = Number(
              constraintsConfig?.ageGapBetweenParentAndEmployee ?? 0
            );
            if (isParentRelation && parentGapThreshold > 0) {
              const actualGap = age - employeeAgeValue;
              if (actualGap < parentGapThreshold) {
                addRemark(
                  dependentRow,
                  `Age gap between employee and ${relationLabel} should be at least ${parentGapThreshold} years.`
                );
                hasError = true;
                return;
              }
            }

            const childGapConstraint =
              constraintsConfig?.ageGapBetweenChildrenAndEmployee ??
              constraintsConfig?.ageGapBetweenParentAndEmployee ??
              0;
            const childGapThreshold = Number(childGapConstraint);
            if (isChildRelation && childGapThreshold > 0) {
              const actualGap = employeeAgeValue - age;
              if (actualGap < childGapThreshold) {
                addRemark(
                  dependentRow,
                  `Age gap between employee and ${relationLabel} should be at least ${childGapThreshold} years.`
                );
                hasError = true;
                return;
              }
            }
          }
        }

        acceptedDependents.push(dependent);
      });

      if (hasError) {
        clonedEmployee.hasError = true;
        clonedEmployee.isProcessed = false;
        addRemark(clonedEmployee.rowObj, employeeRejectionRemark);
        clonedEmployee.dependents = clonedEmployee.dependents.map(
          (dependent, depIndex) => {
            const dependentRow =
              clonedEmployee.dependentRows[depIndex] ?? dependent.rowObj;
            if (dependentRow) {
              if (dependentsRejectedForGroupMismatch) {
                addRemark(dependentRow, RELATIONSHIP_GROUP_MISMATCH_REMARK);
              } else {
                addRemark(dependentRow, dependentRejectionRemark);
              }
            }
            return {
              ...dependent,
              isValidDependent: false,
            };
          }
        );
        errorRecords.push(clonedEmployee);
      } else {
        clonedEmployee.dependents = acceptedDependents;
        clonedEmployee.dependentRows = acceptedDependents.map(
          (dependent) => dependent.rowObj
        );
        validEmployees.push(clonedEmployee);
      }
    });

    const dependentOnlyRecordsWithRemarks =
      parsedEmployeeDataFromExcel.dependentsWithoutEmployee.map((record) => {
        const clonedRecord = cloneEmployeeRecord(record);
        const remark =
          endorsementFileUploadMessages.ER0015;
        addRemark(clonedRecord.rowObj, remark);
        clonedRecord.dependentRows.forEach((row) => addRemark(row, remark));
        clonedRecord.hasError = true;
        clonedRecord.isProcessed = false;
        clonedRecord.dependents = clonedRecord.dependents.map((dependent) => ({
          ...dependent,
          isValidDependent: false,
        }));
        errorRecords.push(clonedRecord);
        return clonedRecord;
      });

    validatedEmployeeDataFromExcel = {
      employees: validEmployees,
      dependentsWithoutEmployee: dependentOnlyRecordsWithRemarks,
      invalidEmployees: errorRecords,
    };

    // Step 8: From the validated employee and dependent objects, check the policy choices and mark the employees
    // as invalid when the policy choices are not matched accordingly
    const normalizedDeletionType = normalizeString(DATA_INTAKE_TYPE.DELETION);
    const validatedRows = validatedEmployeeDataFromExcel.employees ?? [];
    const deletionRows = validatedRows.filter((row) => {
      const intakeTypeNormalized = normalizeString(
        String(row.intakeType ?? "")
      );
      return intakeTypeNormalized === normalizedDeletionType;
    });
    const additionRows = validatedRows.filter((row) => {
      const intakeTypeNormalized = normalizeString(
        String(row.intakeType ?? "")
      );
      return intakeTypeNormalized !== normalizedDeletionType;
    });

    const validAdditionRows: EmployeeWithDependentsData[] = [];
    const invalidChoiceEmployees: EmployeeWithDependentsData[] = [];
    const noChoiceRemark =
      "No valid policy choice is applicable for this employee data.";

    additionRows.forEach((employeeRecord) => {
      const employeeDetails = mapEmployeeDetailsForChoices(employeeRecord);
      const dependentsForChoices = mapDependentsForChoiceValidation(
        employeeRecord.dependents ?? []
      );
      const applicableChoices = filterPolicyOptionsForChoices(
        employeeDetails,
        configObject,
        dependentsForChoices
      );

      if (hasAvailablePolicyChoices(applicableChoices)) {
        validAdditionRows.push(employeeRecord);
        return;
      }

      employeeRecord.hasError = true;
      employeeRecord.isProcessed = false;
      addRemark(employeeRecord.rowObj, noChoiceRemark);
      employeeRecord.dependentRows.forEach((row) =>
        addRemark(row, noChoiceRemark)
      );
      invalidChoiceEmployees.push(employeeRecord);
    });

    const updatedInvalidEmployees = [
      ...validatedEmployeeDataFromExcel.invalidEmployees,
      ...invalidChoiceEmployees,
    ];

    validatedEmployeeDataFromExcel = {
      ...validatedEmployeeDataFromExcel,
      employees: [...deletionRows, ...validAdditionRows],
      invalidEmployees: updatedInvalidEmployees,
    };
    return validatedEmployeeDataFromExcel;
  } catch (error) {
    throw new Error("Failed to process enrollment file");
  }
}

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function collectRowData(record?: EmployeeWithDependentsData | null) {
  const rows: Record<string, any>[] = [];
  if (!record) {
    return rows;
  }
  if (record.rowObj) {
    rows.push(record.rowObj);
  }
  if (Array.isArray(record.dependentRows)) {
    record.dependentRows
      .filter((row): row is Record<string, any> => Boolean(row))
      .forEach((row) => rows.push(row));
  }
  return rows;
}

export async function createEnrollmentProcessingFiles(
  processingResult: StartEnrollmentProcessResult,
  context: EnrollmentProcessingArtifactsContext
): Promise<EnrollmentProcessingArtifactsResult> {
  const errors: Record<string, any>[] = [];
  const successRows: Record<string, any>[] = [];

  const { validatedEmployeeRecords, deletionRecords = [] } = processingResult;

  const {
    employees = [],
    invalidEmployees = [],
    dependentsWithoutEmployee = [],
  } = validatedEmployeeRecords ?? {
    employees: [],
    invalidEmployees: [],
    dependentsWithoutEmployee: [],
  };

  let additionalSuccessCount = 0;

  employees.forEach((employee) => {
    const rows = collectRowData(employee);
    if (rows.length) {
      successRows.push(...rows);
    }
    if (employee?.isDependentOnly) {
      const dependents = Array.isArray(employee.dependents)
        ? employee.dependents
        : [];
      const newlyInsertedDependents = dependents.filter(
        (dependent) => !dependent?.id
      );
      additionalSuccessCount += newlyInsertedDependents.length;
    }
  });

  invalidEmployees.forEach((employee) => {
    const rows = collectRowData(employee);
    if (rows.length) {
      errors.push(...rows);
    }
  });

  dependentsWithoutEmployee.forEach((record) => {
    const rows = collectRowData(record);
    if (rows.length) {
      errors.push(...rows);
    }
  });

  deletionRecords.forEach((record) => {
    if (record?.row) {
      errors.push(record.row);
    }
  });
  const successCount = successRows.length + additionalSuccessCount;

  const summary: EnrollmentProcessingArtifactsSummary = {
    successCount,
    errorCount: errors.length,
    processCount: successCount + errors.length,
  };

  const companyType = context.companyType || "unknown";
  const policyId = context.policyId;

  let errorFileKey: string | null = null;
  if (errors.length) {
    const errorBuffer = await generateExcel(errors);
    const errorName = `policy-${policyId}-errorfile${Date.now()}.xlsx`;
    errorFileKey = `uploads/company/${companyType}/errorfiles/${errorName}`;
    await uploadToS3(errorBuffer, errorFileKey, EXCEL_MIME_TYPE);
  }

  let successFileKey: string | null = null;
  if (successRows.length) {
    const successBuffer = await generateExcel(successRows);
    const successName = `policy-${policyId}-successfile${Date.now()}.xlsx`;
    successFileKey = `uploads/company/${companyType}/successfiles/${successName}`;
    await uploadToS3(successBuffer, successFileKey, EXCEL_MIME_TYPE);
  }

  return {
    errorFileKey,
    successFileKey,
    summary,
  };
}
