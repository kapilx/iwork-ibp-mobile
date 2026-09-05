import { Transform, Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Org-hierarchy drilldown aggregate for Biz Done Report Enhanced: one row per
// child node at the requested level, each with policy count / premium /
// brokerage. Mirrors opportunity-service's GetScopeSummaryDto so the shared
// OrgFinancialFilter component talks to both services the same way.
export class GetPolicyScopeSummaryDto {
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
    description:
      "Aggregate type — unused for policy data, accepted for parity with the shared OrgFinancialFilter query shape.",
    example: "POLICY",
  })
  @IsOptional()
  @IsString()
  type?: string;

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
    description: "Income-date range start (resolved from FY/quarter on the client).",
    example: "2026-04-01",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "from must be a valid date" })
  from?: Date;

  @ApiPropertyOptional({ description: "Income-date range end.", example: "2026-06-30" })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "to must be a valid date" })
  to?: Date;

  @ApiPropertyOptional({
    description:
      "FY start year for a whole-financial-year selection. Resolved server-side via getDateRange, matching the policy-report-list's financialYear handling; explicit from/to take precedence.",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "financialYear must be an integer" })
  financialYear?: number;

  @ApiPropertyOptional({ description: "User ID to scope to — the report's Owner selection, not necessarily the requesting user.", example: 101 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "userId must be an integer" })
  userId?: number;

  @ApiPropertyOptional({
    description: "View-by scope: manager (self only) or team (full reporting hierarchy). Matches the report's own Owner view-by toggle.",
    example: "team",
  })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({
    description:
      "\"true\" filters on dateOfBusiness instead of dateOfIncome — Biz Done Enhanced's Business Month mode. Same flag name and semantics the policy-report-list already accepts, so the org cards and the report agree on which date column they count.",
    example: "true",
  })
  @IsOptional()
  @IsString()
  filterByBusinessDate?: string;
}
