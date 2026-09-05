import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GetPolicyKpiDto {
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

  @ApiPropertyOptional({ description: "User identifier", example: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({
    description: "Quarter Time filter like Q1",
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  quarter?: string;


  @ApiPropertyOptional({
    description: "Month Time filter like July",
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
    description: "Financial year start (e.g. 2024 for FY 2024-25)",
  })
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined
  )
  @IsOptional()
  @IsNumber()
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Owner to filter.",
    example: "me",
  })
  @IsOptional()
  @IsString({ message: "Owner must be a string" })
  owner?: string;

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
    description: "Income type filter: 'policy' or 'endorsement'. Omit for all.",
    example: "policy",
    enum: ["policy", "endorsement"],
  })
  @IsOptional()
  @IsString()
  incomeType?: string;

  @ApiPropertyOptional({
    description: "Filter dashboard data by insurer ID.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "insurerId must be an integer" })
  insurerId?: number;

  @ApiPropertyOptional({
    description:
      "Business Performance widget only. When true, achieved values are aggregated live from policy/endorsement/reward (the same source the Biz Done report reads) instead of the hourly performance_output ETL table, so the widget cannot lag a policy edit. Targets are unaffected.",
    example: "true",
  })
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  useLiveData?: boolean = false;
}
