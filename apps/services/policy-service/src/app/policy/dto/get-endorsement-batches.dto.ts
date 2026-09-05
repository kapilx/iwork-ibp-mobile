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
import { ENDORSEMENT_TAT_FILTER_LABELS } from "../../../../../../../libs/service-lib/src/lib/utils/tat.utils";
import { MONTHS_WITH_QUARTERS_ENUM, OWNER_TYPES } from "../../../../../../../libs/service-lib/src/lib/constants";

export class GetEndorsementBatchesDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page.",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search filters in key:value format.",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort parameters in field:order format.",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Free text search value.",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiPropertyOptional({
    description: "Field to filter by date (defaults to endorsementEntryDate).",
    example: "endorsementEntryDate",
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
    description: "Relative period filter (e.g., 3 Months, 6 Months).",
    example: "3 Months",
  })
  @IsOptional()
  @IsString()
  period?: string;

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
    description: "Financial year to filter.",
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  financialYear?: number;

  @ApiPropertyOptional({
    description: "SBU ID to filter.",
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sbuId?: number;

  @ApiPropertyOptional({
    description: "Vertical ID to filter.",
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  verticalId?: number;

  @ApiPropertyOptional({
    description: "Department ID to filter.",
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({
    description: "Branch ID to filter.",
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({
    description: "Owner ID to filter endorsements by owner.",
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ownerId?: number;

  @ApiPropertyOptional({
    description: "Filter by ownership type (manager or team).",
    type: String,
    enum: Object.values(OWNER_TYPES),
    example: "manager",
  })
  @IsOptional()
  @IsIn(Object.values(OWNER_TYPES))
  viewBy?: string;

  @ApiPropertyOptional({
    description:
      "Filter open endorsements by TAT bucket counted from the entry date.",
    enum: ENDORSEMENT_TAT_FILTER_LABELS,
    example: "0-5 days",
  })
  @IsOptional()
  @IsString()
  @IsIn([...ENDORSEMENT_TAT_FILTER_LABELS])
  tatRange?: string;

  @ApiPropertyOptional({
    description: "Filter endorsements by insurer ID.",
    example: 4913,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insurerId?: number;
}
