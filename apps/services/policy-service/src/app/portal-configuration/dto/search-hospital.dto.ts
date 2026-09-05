import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsDate,
  IsBoolean,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

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
    description: "General search term to filter hospitals by name, address, or other text fields (partial match).",
    example: "Apollo",
  })
  @IsOptional()
  @IsString()
  search?: string;

  // Hidden from Swagger - internal use only
  @IsOptional()
  @IsString()
  sort?: string;

  // Hidden from Swagger - internal use only  
  @IsOptional()
  @IsString()
  searchBy?: string;

  // Hidden from Swagger - internal use only
  @IsOptional()
  @IsString()
  field?: string;

  // Hidden from Swagger - internal use only
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  // Hidden from Swagger - internal use only
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  // Hidden from Swagger - internal use only
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({
    description: "State name to filter hospitals by location (partial match, case-insensitive).",
    example: "Maharashtra",
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: "City name to filter hospitals by location (partial match, case-insensitive).",
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
    description: " Filter by hospital classification. true=Network hospitals only, false=Excluded hospitals only, undefined=All hospitals",
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

  @ApiPropertyOptional({
    description: " Latitude coordinate for geospatial search (decimal degrees, range: -90 to 90)",
    example: 19.0760,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: "Latitude must be a valid number" })
  @Min(-90, { message: "Latitude must be between -90 and 90 degrees" })
  latitude?: number;

  @ApiPropertyOptional({
    description: " Longitude coordinate for geospatial search (decimal degrees, range: -180 to 180)",
    example: 72.8777,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: "Longitude must be a valid number" })
  @Min(-180, { message: "Longitude must be between -180 and 180 degrees" })
  longitude?: number;

  @ApiPropertyOptional({
    description: " Search radius in meters for geospatial queries (default: 5000m = 5km, max: 50000m = 50km)",
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: "Radius must be a valid number" })
  @Min(1, { message: "Radius must be at least 1 kilo meter" })
  radius?: number;
}