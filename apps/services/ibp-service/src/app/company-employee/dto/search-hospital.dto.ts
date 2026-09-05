import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DEFAULT_VALUES } from "../../../../../service-lib/src/lib/constants";

export class SearchHospitalDto {
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
    description: "🔍 General search term to filter hospitals by name, address, or other text fields (partial match).",
    example: "Apollo",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  searchBy?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({
    description: "🗺️ State name to filter hospitals by location (partial match, case-insensitive).",
    example: "Maharashtra",
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: "🏙️ City name to filter hospitals by location (partial match, case-insensitive).",
    example: "Mumbai",
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: "📮 Pin code to filter hospitals by location. Supports exact match or 3-digit prefix (e.g., '400' matches all 400xxx codes).",
    example: "400001",
  })
  @IsOptional()
  @IsString()
  pinCode?: string;

  @ApiPropertyOptional({
    description: "🏥 Filter by hospital classification. true=Network hospitals only, false=Excluded hospitals only, undefined=All hospitals",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isNetworkHospital?: boolean;

  @IsOptional()
  @IsString()
  source?: string;
}
