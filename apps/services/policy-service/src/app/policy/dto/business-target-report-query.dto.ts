import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class BusinessTargetReportQueryDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  // CSV of ids (multiselect) — parsed server-side, mirroring GetPolicyListDto.
  // Free-text search over the team member's name, mirroring the visible search
  // box on the other listings.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sbuId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  verticalId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  financialYear?: string;

  // 'YYYY-MM' or 'YYYY-MM-01'
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  to?: string;

  // Column sort as "field:asc|desc" (field ∈ sbu|vertical|teamMember|month|target).
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sort?: string;

  // Metric selectors that define what "Target" sums to. Default TOTAL_POLICY / BROKERAGE.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  kpi?: string;

  // Export-only passthroughs (mirror bizdone export).
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  columns?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appliedFilters?: string;
}
