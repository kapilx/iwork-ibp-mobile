import { Transform, Type } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
  Max,
  IsInt,
  IsDate,
  IsBoolean,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";
import { OWNER_TYPES } from "../../../../../../../libs/service-lib/src/lib/constants";

export class GetPoliciesDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: 1,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page.",
    example: 10,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search term to filter policies.",
    example: "Example Policy",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort order in the format field:order (e.g., policyName:ASC).",
    example: "policyName:ASC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Field to search by (e.g., policyName, companyName).",
    example: "policyName",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;
}

export interface CommonAddress {
  address1?: string;
  area?: string;
  pinCode?: string;
  cityId?: { name?: string };
}

export interface CommonContactAddress {
  id?: number | null;
  address?: CommonAddress;
}

export interface CommonContact {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  contactAddresses?: CommonContactAddress[];
  id?: number | null;
}

export interface CommunicationDetail {
  communicationDetails: string;
  communicationType: string;
  id: number | null;
  isPrimary: boolean;
}

export interface ContactTransformed {
  communicationDetails: CommunicationDetail[];
  displayName: string;
  contactName: string;
  id: number | null;
  location: string;
}

export interface InsurerContact {
  contact?: CommonContact;
  contactId?: number | null;
}

export interface LeadInsurerMapping {
  id?: number;
  insurerName?: string;
  displayName?: string;
  insurerContacts?: InsurerContact[];
}

export interface InsurerContactsResponse {
  displayName: string;
  list: ContactTransformed[];
}

export interface TpaContact {
  tpaContactId?: number | null;
  id?: number | null;
  contactId?: number | null;
  linkedContact?: CommonContact;
}

export interface TpaMapping {
  id?: number;
  tpaName?: string;
  displayName?: string;
  contacts?: TpaContact[];
}

export interface TpaMappingsResponse {
  displayName: string;
  list: ContactTransformed[];
}

export class GetPolicyReportDto {
  @ApiPropertyOptional({
    description: "Time filter like FullYear, Q1, July",
    example: "FullYear",
  })
  @IsOptional()
  @IsString()
  timeFilter?: string;

  @ApiPropertyOptional({
    description: "Financial year start (e.g. 2024 for FY 2024-25)",
  })
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined
  )
  @IsOptional()
  @IsNumber()
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Owner ID of the policy.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;

  @ApiPropertyOptional({
    description: "Entity type to filter policies.",
    example: "companySummary",
  })
  @IsOptional()
  @IsString()
  @IsIn(
    [
      "companySummary",
      "policySummary",
      "insurerSummary",
      "policyDetails",
      "coInsurerDetails",
    ],
    {
      message:
        "Entity type must be one of: 'companySummary', 'policySummary', 'insurerSummary', 'policyDetails', or 'coInsurerDetails'.",
    }
  )
  entityType?: string;

  @ApiPropertyOptional({
    description: "Business performance Type: ACTUAL, NEW BIZ, RENEWALS",
    example: "ACTUAL",
  })
  @IsOptional()
  @IsString()
  businessPerformanceType?: string;
}

export class GetPolicyListDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Entity type to filter policies.",
    example: "companySummary",
  })
  @IsOptional()
  @IsString()
  @IsIn(
    [
      "companySummary",
      "policySummary",
      "insurerSummary",
      "policyDetails",
      "coInsurerDetails",
    ],
    {
      message:
        "Entity type must be one of: 'companySummary', 'policySummary', 'insurerSummary', 'policyDetails', or 'coInsurerDetails'.",
    }
  )
  entityType?: string;

  @ApiPropertyOptional({
    description: "Search based on financial year, userId.",
    example: "Example",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Search by based on customer name",
    example: "Example",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiPropertyOptional({
    description:
      "Comma-separated sheet types to include in the BizDone export " +
      "(e.g. policyDetails,companySummary,rewards)",
    example: "policyDetails",
  })
  @IsOptional()
  @IsString()
  sheets?: string;

  @ApiPropertyOptional({
    description:
      "Server-side sort as comma-separated <column>:<ASC|DESC> pairs, using the " +
      "table's UI column keys (e.g. customerName:ASC,netPremium:DESC). Unknown " +
      "columns are ignored and the entity's default ordering is used.",
    example: "customerName:ASC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description:
      "JSON array of the applied filters already resolved to display labels " +
      "on the client ([{ filter, value }]). Written verbatim into the export's " +
      "Applied Filters sheet.",
  })
  @IsOptional()
  @IsString()
  appliedFilters?: string;

  @ApiPropertyOptional({
    description: "Financial year for filtering policies (e.g. 2025)",
    example: "2025",
  })
  @IsOptional()
  @IsString()
  financialYear?: string;

  @ApiPropertyOptional({
    description:
      "Quarter of the financial year for filtering policies (e.g. Q1)",
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({
    description:
      "Month of the financial year for filtering policies (e.g. April)",
    example: "April",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: "Business month for filtering policies (e.g. April)",
    example: "April",
  })
  @IsOptional()
  @IsString()
  businessMonth?: string;

  @ApiPropertyOptional({
    description: "When 'true', filter date range by date_of_business instead of date_of_income.",
    example: "true",
  })
  @IsOptional()
  @IsString()
  filterByBusinessDate?: string;

  @ApiPropertyOptional({
    description: "Field to filter by date (e.g., dateOfIncome, createdAt, updatedAt).",
    example: "createdAt",
  })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({
    description: "Start date for the filter.",
    example: "2023-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @ApiPropertyOptional({
    description: "End date for the filter.",
    example: "2023-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @ApiPropertyOptional({
    description: "insurer Id",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsNumber()
  insurerId?: number;

  @ApiPropertyOptional({
    description: "Insurer branch (address) id to filter policies by branch.",
    example: 42,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsNumber()
  insurerBranchId?: number;

  @ApiPropertyOptional({
    description: "Branch view mode: 'branch' or 'branchWithSub'.",
    example: "branchWithSub",
  })
  @IsOptional()
  @IsString()
  branchViewBy?: string;

  @ApiPropertyOptional({
    description: "Business performance Type: ACTUAL, NEW BIZ, RENEWALS",
    example: "ACTUAL",
  })
  @IsOptional()
  @IsString()
  businessPerformanceType?: string;

  @ApiPropertyOptional({
    description: "All lead and Co Insurer Data.",
    example: "true",
  })
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  allowAllInsurer?: boolean = false;

  @ApiPropertyOptional({ 
    description: "View by owner type (self, team, all)",
    enum: Object.values(OWNER_TYPES) 
  })
  @IsOptional()
  @IsIn(Object.values(OWNER_TYPES))
  viewBy?: (typeof OWNER_TYPES)[keyof typeof OWNER_TYPES];
}

export interface DateRange {
  start: Date;
  end: Date;
  performanceMonth: Date;
}

export class GeneratePerformanceDto {
  @ApiPropertyOptional({
    description: "Month (1-12) to filter performance output.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "month must be an integer number" })
  @Min(1, { message: "month must not be less than 1" })
  @Max(12, { message: "month must not be greater than 12" })
  month?: number;

  @ApiPropertyOptional({
    description: "Year to filter performance output.",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "year must be an integer number" })
  year?: number;
}

export class GetInsurersBrokerageDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Organisation ID to filter.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "organisationId must be an integer" })
  organisationId?: number;

  @ApiPropertyOptional({
    description: "SBU ID to filter.",
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "sbuId must be an integer" })
  sbuId?: number;

  @ApiPropertyOptional({
    description: "Vertical ID to filter.",
    example: 2,
  })
  @IsOptional()
  // Multiselect filter: one id or CSV ("3,7"). The transform is the validator
  // here — non-integer input is dropped rather than reaching the query.
  @Transform(({ value }) => {
    const ids = String(value)
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v));
    return ids.length > 1 ? ids : ids[0];
  })
  verticalId?: number | number[];

  @ApiPropertyOptional({
    description: "Department ID to filter.",
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "departmentId must be an integer" })
  departmentId?: number;

  @ApiPropertyOptional({
    description: "Branch ID to filter.",
    example: 4,
  })
  @IsOptional()
  // Multiselect filter: one id or CSV ("3,7") — same shape as verticalId above.
  // The transform is the validator here; non-integer input is dropped rather
  // than reaching the query.
  @Transform(({ value }) => {
    const ids = String(value)
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v));
    return ids.length > 1 ? ids : ids[0];
  })
  branchId?: number | number[];

  @ApiPropertyOptional({
    description: "User ID to filter.",
    example: 101,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: "userId must be an integer" })
  userId?: number;

  @ApiPropertyOptional({
    description: "Financial year start (e.g. 2024 for FY 2024-25)",
  })
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined
  )
  @IsOptional()
  @IsNumber()
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Time filter on quarter.",
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({
    description: "Time filter on month.",
    example: "July",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: "Business month to filter (month-name string like January).",
    example: "January",
  })
  @IsOptional()
  @IsString()
  businessMonth?: string;

  @ApiPropertyOptional({
    description: "Owner to filter.",
    example: "me",
  })
  @IsOptional()
  @IsString({ message: "Owner must be a string" })
  owner?: string;

  @ApiPropertyOptional({
    description:
      "Sort order in the format field:order (e.g., insurerName:ASC).",
    example: "insurerName:ASC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "From date for custom date range filtering.",
    example: "2024-04-01",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "from must be a valid date" })
  from?: Date;

  @ApiPropertyOptional({
    description: "To date for custom date range filtering.",
    example: "2025-03-31",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "to must be a valid date" })
  to?: Date;

  @ApiPropertyOptional({
    description: "Insurer ID to filter brokerage data by insurer.",
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "insurerId must be an integer" })
  insurerId?: number;
}
