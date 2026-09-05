import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsDate,
  IsInt,
  IsIn,
  IsBoolean,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";
import { MONTHS_WITH_QUARTERS_ENUM } from "../../../../../../../libs/service-lib/src/lib/constants";

export class GetPolicyQueryDto {
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
    description: "view by be a string.",
    example: "Manager",
  })
  @IsOptional()
  @IsString()
  viewBy?: string;

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
      "Applied Filters sheet.",
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
    example: '[{"key":"policyId","label":"Policy ID"},{"key":"companyName","label":"Company name"}]',
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
  field!: string;

  @ApiPropertyOptional({
    description: "Start date for the filter.",
    example: "2023-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from!: Date;

  @ApiPropertyOptional({
    description: "End date for the filter.",
    example: "2023-12-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to!: Date;

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
  @IsNumber()
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Filter data by month (January, February, etc.).",
    type: String,
    enum: Object.values(MONTHS_WITH_QUARTERS_ENUM),
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(MONTHS_WITH_QUARTERS_ENUM))
  month?: string;

  @ApiPropertyOptional({
    description: "Filter data by business month (January, February, etc.).",
    type: String,
  })
  @IsOptional()
  @IsString()
  businessMonth?: string;

  @ApiPropertyOptional({
    description: "Filter data by quarter (Q1, Q2, Q3, Q4).",
    type: String,
    enum: ["Q1", "Q2", "Q3", "Q4"],
  })
  @IsOptional()
  @IsString()
  @IsIn(["Q1", "Q2", "Q3", "Q4"])
  quarter?: string;

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
  @Type(() => Number)
  @IsInt({ message: "verticalId must be an integer" })
  verticalId?: number;

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
  @Type(() => Number)
  @IsInt({ message: "branchId must be an integer" })
  branchId?: number;

  @ApiPropertyOptional({
    description: "OwnerId to filter.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "ownerId must be an integer" })
  ownerId?: number;

  @ApiPropertyOptional({
    description: "Period of time in which the opportunity will be expired.",
    example: "30days",
  })
  @IsOptional()
  @IsString()
  renewalPeriod?: string;

  @ApiPropertyOptional({
    description: "Policy ID to filter by specific policy.",
    example: 12345,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "policyId must be an integer" })
  policyId?: number;

  @ApiPropertyOptional({
    description: "IIRM Policy Type LID to filter by IIRM policy type.",
    example: 101,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "iirmPolicyTypeLid must be an integer" })
  iirmPolicyTypeLid?: number;

  @ApiPropertyOptional({
    description: "Insurer ID to filter policies by insurer.",
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "insurerId must be an integer" })
  insurerId?: number;

  @ApiPropertyOptional({
    description: "Insurer branch (address) ID to filter policies by branch.",
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "insurerBranchId must be an integer" })
  insurerBranchId?: number;

  @ApiPropertyOptional({
    description:
      "Branch view mode: 'branch' (only the selected branch) or 'branchWithSub' (selected branch plus its descendant sub-branches).",
    example: "branchWithSub",
  })
  @IsOptional()
  @IsString()
  branchViewBy?: string;

  @ApiPropertyOptional({
    description:
      "When true, only Active policies are returned (used by the client portfolio drill-down).",
    example: "true",
  })
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean = false;

  @ApiPropertyOptional({
    description:
      "Client portfolio 'Past Companies' view — return companies with EXPIRED active-status policies (policyTo < today) instead of not-expired.",
    example: "true",
  })
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  pastCompanies?: boolean = false;

  @ApiPropertyOptional({
    description:
      "Client portfolio Service Score threshold filter. Applied against the current page's already-computed totalServiceScore, not the full candidate set.",
    enum: [">90", ">80", ">70", "<70"],
    example: ">90",
  })
  @IsOptional()
  @IsString()
  @IsIn([">90", ">80", ">70", "<70"])
  serviceScore?: string;

  @ApiPropertyOptional({
    description:
      "Client Portfolio ENHANCED only. Expands 'Manager + Team' owner scope to the whole reporting subtree instead of direct reports, so the listing matches that page's Owner cards. The ORIGINAL My Client Portfolio shares this endpoint and omits it, keeping the historical direct-reports-only behaviour.",
    example: "true",
  })
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  recursiveTeam?: boolean = false;
}
