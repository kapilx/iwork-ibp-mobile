import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";

import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";
import { OWNER_TYPES, MONTHS_WITH_QUARTERS_ENUM } from "../../../../../../../libs/service-lib/src/lib/constants";

export class GetTatSummaryQueryDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page.",
    example: DEFAULT_VALUES.LIMIT,
  })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ownerId?: number;

  @ApiPropertyOptional({ enum: Object.values(OWNER_TYPES) })
  @IsOptional()
  @IsIn(Object.values(OWNER_TYPES))
  viewBy?: (typeof OWNER_TYPES)[keyof typeof OWNER_TYPES];

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orgId?: number;

  // Additional parameters sent by frontend
  @ApiPropertyOptional({ 
    type: String,
    enum: Object.values(OWNER_TYPES),
    description: "Filter by ownership type (manager or team)."
  })
  @IsOptional()
  @IsIn(Object.values(OWNER_TYPES))
  owner?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  financialYear?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  organisationId?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sbuId?: number;

  @ApiPropertyOptional({ type: Number })
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

  @ApiPropertyOptional({ type: Number })
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

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({
    description: "Filter data by month (January, February, etc.).",
    type: String,
    enum: Object.values(MONTHS_WITH_QUARTERS_ENUM),
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
    description: "Filter TAT data by insurer ID.",
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insurerId?: number;
}
