import { Transform, Type } from "class-transformer";
import {
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";
import { OWNER_TYPES } from "../../../../../../../libs/service-lib/src/lib/constants";

export class GetPendingActivitiesSummaryDto {
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
    description:
      "Sorting field and order in the format field:order (e.g. next30:ASC).",
    example: "next30:ASC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

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
    description: "View by owner type (self, team, all)",
    enum: Object.values(OWNER_TYPES) 
  })
  @IsOptional()
  @IsIn(Object.values(OWNER_TYPES))
  viewBy?: (typeof OWNER_TYPES)[keyof typeof OWNER_TYPES];

  @ApiPropertyOptional({
    description: "Filter data by insurer ID.",
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insurerId?: number;

  @ApiPropertyOptional({
    description: "Time filter on month.",
    example: "July",
  })
  @IsOptional()
  @IsString()
  month?: string;

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
      "Filter by opportunity type (SO for Sales, RO for Renewal, ALL for both). " +
      "PLACEMENT is a view rather than a type: the ISG activity rows over the " +
      "combined SO+RO pipeline, for the dashboard Placement Follow-Up (spec §12).",
    enum: ["SO", "RO", "ALL", "PLACEMENT"],
    example: "SO",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value
  )
  @IsIn(["SO", "RO", "ALL", "PLACEMENT"], {
    message: "type must be SO, RO, ALL, or PLACEMENT",
  })
  type?: "SO" | "RO" | "ALL" | "PLACEMENT";

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
    description: "Flag to indicate if request is coming from dashboard (applies special insurer filtering logic).",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: "fromDashboard must be a boolean" })
  fromDashboard?: boolean;
}
