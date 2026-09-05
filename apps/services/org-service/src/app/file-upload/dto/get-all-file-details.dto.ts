import { Transform, Type } from "class-transformer";
import { IsNumber, Min, IsOptional, IsString, IsDate } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetAllFileDetailsDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page (default is 10).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Filter by organisation ID",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  organisationId?: number;

  @ApiPropertyOptional({
    description: "Filter by company ID",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  companyId?: number;

  @ApiPropertyOptional({
    description: "Filter by company name (case-insensitive)",
    example: "diva",
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: "Filter by company type LID",
    example: 1102,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  companyTypeLid?: number;

  @ApiPropertyOptional({
    description: "Filter by entity type (e.g., 'opportunity', 'policy')",
    example: "opportunity",
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: "Filter from date (ISO format)",
    example: "2024-01-01",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description: "Filter to date (ISO format)",
    example: "2024-12-31",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
