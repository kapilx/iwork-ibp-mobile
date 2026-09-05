import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsArray,
  IsBoolean,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetOpportunityQueryDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search term to filter opportunities by company name.",
    example: "opportunityStage: Under Review, opportunityPriority: High",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort must be a string.",
    example: "opportunityId: ASC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Search by based on the property.",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiPropertyOptional({
    description:
      "JSON array of the applied filters already resolved to display labels " +
      "on the client ([{ filter, value }]). Written verbatim into the export's " +
      "Applied Filters summary.",
  })
  @IsOptional()
  @IsString()
  appliedFilters?: string;

  @ApiPropertyOptional({
    description:
      "JSON array of { key, label } pairs, in display order, scoping the " +
      "async export to exactly the columns visible in the requester's Table " +
      "Settings config, with the same header labels shown in the grid — " +
      "instead of every field on the row under a formatted-field-name header. " +
      "Omit to export every field (legacy behavior).",
    example: '[{"key":"opportunityId","label":"Opportunity ID"},{"key":"companyName","label":"Company name"}]',
  })
  @IsOptional()
  @IsString()
  columns?: string;

  @ApiPropertyOptional({
    description: "Field to filter by date (e.g., createdAt, updatedAt).",
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
    description: "Period of time in which the opportunity was created.",
    example: "3 Months",
  })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({
    description: "Financial year to filter.",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
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
    description:
      "Opportunity type to filter by. Use ALL for the combined SO + RO listing (Manage Quotes).",
    example: "SO",
  })
  @IsOptional()
  @IsEnum(["SO", "RO", "ALL"], {
    message:
      "Opportunity type must be SO (Sales Opportunity), RO (Renewal Opportunity) or ALL (combined)",
  })
  type?: "SO" | "RO" | "ALL";

  @ApiPropertyOptional({
    description:
      "Narrows the combined (type=ALL) listing to a single opportunity type. Backs the hidden Opty. Type toggle; ignored when type is SO or RO.",
    example: "SO",
  })
  @IsOptional()
  @IsEnum(["SO", "RO"], {
    message:
      "optyType must be either SO (Sales Opportunity) or RO (Renewal Opportunity)",
  })
  optyType?: "SO" | "RO";

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
    example: 3,
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
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "departmentId must be an integer" })
  departmentId?: number;

  @ApiPropertyOptional({
    description: "Branch ID to filter.",
    example: 5,
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
  branchId?: number | number[];

  @ApiPropertyOptional({
    description: "OwnerId to filter.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;

  @ApiPropertyOptional({
    description: "ViewBy to filter.",
    example: "me",
  })
  @IsOptional()
  @IsString()
  viewBy?: "manager" | "team";

  @ApiPropertyOptional({
    description: "Filter data by insurer ID.",
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insurerId?: number;

  @ApiPropertyOptional({
    description: "Filter ROs by the insurer branch (address) ID of their linked policy.",
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insurerBranchId?: number;

  @ApiPropertyOptional({
    description:
      "Branch view mode: 'branch' (only the selected branch) or 'branchWithSub' (selected branch plus descendant sub-branches).",
    type: String,
  })
  @IsOptional()
  @IsString()
  branchViewBy?: string;

  @ApiPropertyOptional({
    description: "Indicates if funnel data is requested.",
    example: false,
  })
  @IsOptional()
  funnel?: "true" | "false";

  @ApiPropertyOptional({
    description:
      "When true, returns per-company aggregates (companyId/companyName/totalRos/premium/brokerage) of the opportunities this listing query matches, instead of the opportunity rows. Used by SO/RO Enhanced's Companies table so it always reconciles with the records listing.",
    example: false,
  })
  @IsOptional()
  companyGrain?: "true" | "false";

  @ApiPropertyOptional({
    description:
      "When true, restricts opportunities to those with pending activities (completedAt is null).",
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value === 1;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") {
        return true;
      }
      if (normalized === "false" || normalized === "0") {
        return false;
      }
    }
    return Boolean(value);
  })
  @IsBoolean()
  isPendingActivity?: boolean;
}
export class ExcelGenerationDto {
  @ApiProperty({
    description: "Opportunity ID",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  opportunityId!: number;

  @ApiProperty({
    description: "Activity Key",
    example: "broking_slip_activity",
  })
  @IsString()
  activityKey!: string;

  @ApiProperty({
    description: "opportunityactivityId ID",
    example: 35,
  })
  @IsInt({ message: "opportunityactivityId must be an integer" })
  @IsOptional()
  opportunityActivityId?: number;

  @ApiProperty({
    description: "brokingSlipVersion ID",
    example: 35,
  })
  @IsInt({ message: "brokingSlipVersion must be an integer" })
  @IsOptional()
  brokingSlipVersion?: number;

  @ApiProperty({
    description: "quoteEntry Ids",
    example: [35, 36],
  })
  @IsArray({ message: "quoteEntry must be an array of integers" })
  @IsOptional()
  @Type(() => Number)
  quoteEntry?: number[];

  @ApiProperty({
    description: "Indicates if broking slip covers are included",
    example: true,
  })
  @IsBoolean({ message: "brokingSlipCovers must be a boolean" })
  @IsOptional()
  brokingSlipCovers?: boolean;

  @ApiProperty({
    description: "Indicates if RFP details covers are included",
    example: false,
  })
  @IsBoolean({ message: "rfpDetailsCovers must be a boolean" })
  @IsOptional()
  rfpDetailsCovers?: boolean;
}

export class GetOpportunityBrokerageSummaryDto {
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
  // Multiselect filter: one id or CSV ("3,7"). The transform is the validator
  // here — non-integer input is dropped rather than reaching the query.
  @Transform(({ value }) => {
    const ids = String(value)
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v));
    return ids.length > 1 ? ids : ids[0];
  })
  branchId?: number | number[];

  @ApiPropertyOptional({
    description: "Financial year to filter.",
    example: "2023",
  })
  @IsOptional()
  @Type(() => Number)
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Quarter Time filter to apply on financial year.",
    example: "Q1",
  })
  @IsOptional()
  quarter?: string;

  @ApiPropertyOptional({
    description: "Month Time filter to apply on financial year.",
    example: "January",
  })
  @IsOptional()
  month?: string;

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
    description: "User ID to filter.",
    example: 101,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: "userId must be an integer" })
  userId?: number;

  @ApiPropertyOptional({
    description: "Owner to filter.",
    example: "me",
  })
  @IsOptional()
  @IsString({ message: "Owner must be a string" })
  owner?: string;

  @ApiPropertyOptional({
    description:
      "Opportunity type to filter by. PLACEMENT is not a type but a view: " +
      "the combined SO+RO pipeline that has reached ISG Planning, used by the " +
      "dashboard Placement funnel (spec §12).",
    example: "SO",
  })
  @IsOptional()
  @IsEnum(["SO", "RO", "PLACEMENT"], {
    message:
      "Opportunity type must be SO (Sales Opportunity), RO (Renewal Opportunity) or PLACEMENT (combined ISG pipeline)",
  })
  type?: "SO" | "RO" | "PLACEMENT";

  @ApiPropertyOptional({
    description: "Filter sales funnel data by insurer ID (placement slip stage).",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "insurerId must be an integer" })
  insurerId?: number;

  @ApiPropertyOptional({
    description: "Flag to indicate if request is coming from dashboard (applies special insurer filtering logic).",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: "fromDashboard must be a boolean" })
  fromDashboard?: boolean;
}

export class GetRenewalScheduleBySbuDto {
  @ApiPropertyOptional({ description: "Organisation ID to filter.", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "organisationId must be an integer" })
  organisationId?: number;

  @ApiPropertyOptional({ description: "SBU ID to filter.", example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "sbuId must be an integer" })
  sbuId?: number;

  @ApiPropertyOptional({ description: "Vertical ID to filter.", example: 3 })
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

  @ApiPropertyOptional({ description: "Department ID to filter.", example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "departmentId must be an integer" })
  departmentId?: number;

  @ApiPropertyOptional({ description: "Branch ID to filter.", example: 5 })
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
  branchId?: number | number[];

  @ApiPropertyOptional({ description: "Financial year to filter.", example: 2025 })
  @IsOptional()
  @Type(() => Number)
  financialYear?: number;

  @ApiPropertyOptional({ description: "Quarter filter.", example: "Q1" })
  @IsOptional()
  quarter?: string;

  @ApiPropertyOptional({ description: "Month filter.", example: "January" })
  @IsOptional()
  month?: string;

  @ApiPropertyOptional({ description: "From date.", example: "2024-04-01" })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "from must be a valid date" })
  from?: Date;

  @ApiPropertyOptional({ description: "To date.", example: "2025-03-31" })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "to must be a valid date" })
  to?: Date;

  @ApiPropertyOptional({ description: "User ID to filter.", example: 101 })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: "userId must be an integer" })
  userId?: number;

  @ApiPropertyOptional({ description: "Owner scope: me / manager / team.", example: "me" })
  @IsOptional()
  @IsString({ message: "owner must be a string" })
  owner?: string;

  @ApiPropertyOptional({ description: "Insurer ID to filter.", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "insurerId must be an integer" })
  insurerId?: number;

  @ApiPropertyOptional({
    description:
      "PLACEMENT switches sales-schedule-by-sbu from the SO schedule to the " +
      "combined SO+RO pipeline past the ISG gate, for the dashboard Placement " +
      "Schedule by SBU (spec §12). Ignored by renewal-schedule-by-sbu.",
    enum: ["PLACEMENT"],
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value
  )
  @IsIn(["PLACEMENT"], { message: "scope must be PLACEMENT" })
  scope?: "PLACEMENT";
}

export class GetScopeSummaryDto {
  @ApiProperty({
    description:
      "Hierarchy level whose child nodes to aggregate: organisation | unit (SBU) | vertical | branch | owner (logged-in user + reporting downline, Enhanced pages' Owner accordion).",
    example: "unit",
    enum: ["organisation", "unit", "vertical", "branch", "owner"],
  })
  @IsEnum(["organisation", "unit", "vertical", "branch", "owner"], {
    message: "level must be one of organisation | unit | vertical | branch | owner",
  })
  level!: "organisation" | "unit" | "vertical" | "branch" | "owner";

  @ApiPropertyOptional({
    description: "Opportunity type to aggregate. Defaults to RO.",
    example: "RO",
    enum: ["SO", "RO"],
  })
  @IsOptional()
  @IsEnum(["SO", "RO"], { message: "type must be SO or RO" })
  type?: "SO" | "RO";

  @ApiPropertyOptional({ description: "Parent organisation ID.", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "organisationId must be an integer" })
  organisationId?: number;

  @ApiPropertyOptional({ description: "Parent SBU ID.", example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "sbuId must be an integer" })
  sbuId?: number;

  @ApiPropertyOptional({ description: "Parent vertical ID.", example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "verticalId must be an integer" })
  verticalId?: number;

  @ApiPropertyOptional({ description: "Parent department ID.", example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "departmentId must be an integer" })
  departmentId?: number;

  @ApiPropertyOptional({ description: "Parent branch ID.", example: 5 })
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
  branchId?: number | number[];

  @ApiPropertyOptional({
    description: "Expiry-date range start (resolved from FY/quarter on the client).",
    example: "2026-07-01",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "from must be a valid date" })
  from?: Date;

  @ApiPropertyOptional({ description: "Expiry-date range end.", example: "2026-09-30" })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "to must be a valid date" })
  to?: Date;

  @ApiPropertyOptional({
    description:
      "FY start year for a whole-financial-year selection. Resolved server-side via getDateRange (no expiry buffer), matching the listing's financialYear handling; takes precedence over from/to.",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "financialYear must be an integer" })
  financialYear?: number;

  @ApiPropertyOptional({ description: "User ID to scope to.", example: 101 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "userId must be an integer" })
  userId?: number;

  @ApiPropertyOptional({ description: "Owner scope: me / manager / team.", example: "me" })
  @IsOptional()
  @IsString({ message: "owner must be a string" })
  owner?: string;
}

// Paginated company-grain companion to GetScopeSummaryDto (SO/RO Enhanced's
// portfolio-style Companies table): same scope/period/owner semantics, no
// `level`, plus page/limit and a company search (numeric = companyId, text =
// name ILIKE).
export class GetCompanySummaryDto {
  @ApiPropertyOptional({
    description: "Opportunity type to aggregate. Defaults to RO.",
    example: "SO",
    enum: ["SO", "RO"],
  })
  @IsOptional()
  @IsEnum(["SO", "RO"], { message: "type must be SO or RO" })
  type?: "SO" | "RO";

  @ApiPropertyOptional({ description: "Organisation ID.", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "organisationId must be an integer" })
  organisationId?: number;

  @ApiPropertyOptional({ description: "SBU ID.", example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "sbuId must be an integer" })
  sbuId?: number;

  @ApiPropertyOptional({ description: "Vertical ID.", example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "verticalId must be an integer" })
  verticalId?: number;

  @ApiPropertyOptional({ description: "Department ID.", example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "departmentId must be an integer" })
  departmentId?: number;

  @ApiPropertyOptional({ description: "Branch ID.", example: 5 })
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
  branchId?: number | number[];

  @ApiPropertyOptional({
    description: "Expiry-date range start (quarter/month/custom selections).",
    example: "2026-07-01",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "from must be a valid date" })
  from?: Date;

  @ApiPropertyOptional({ description: "Expiry-date range end.", example: "2026-09-30" })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "to must be a valid date" })
  to?: Date;

  @ApiPropertyOptional({
    description:
      "FY start year for a whole-financial-year selection; takes precedence over from/to (no expiry buffer), matching the listing.",
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "financialYear must be an integer" })
  financialYear?: number;

  @ApiPropertyOptional({ description: "Owner user ID to scope to (explicit selection always scopes).", example: 101 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "ownerId must be an integer" })
  ownerId?: number;

  @ApiPropertyOptional({ description: "Owner view-by: manager | team.", example: "team" })
  @IsOptional()
  @IsString({ message: "viewBy must be a string" })
  viewBy?: string;

  @ApiPropertyOptional({
    description: "Company search: numeric = companyId (exact), text = name ILIKE.",
    example: "NEOVEX",
  })
  @IsOptional()
  @IsString({ message: "searchBy must be a string" })
  searchBy?: string;

  @ApiPropertyOptional({ description: "Page number.", example: DEFAULT_VALUES.PAGE })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Records per page.",
    example: DEFAULT_VALUES.LIMIT,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;
}

export class GetOpportunityMonthlyBrokerageBreakdown extends GetOpportunityBrokerageSummaryDto {
  // "true" -> aggregate ACTUAL live from policy/endorsement/reward instead of
  // reading the pre-aggregated performance_output table.
  @IsOptional()
  @IsString()
  useLiveData?: string;

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
}
