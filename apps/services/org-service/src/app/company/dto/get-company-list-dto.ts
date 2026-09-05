import { Transform, Type } from "class-transformer";
import { IsOptional, IsString, IsNumber, Min, IsDate, IsInt } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetCompaniesDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search term to filter companies",
    example: "companyName:Example",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      "Sort order in the format field:order (e.g., companyName:ASC,createdAt:DESC).",
    example: "companyName:ASC,createdAt:DESC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Field to search by (e.g., companyName, city).",
    example: "Example",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiPropertyOptional({
    description: "Field to filter by date (e.g., createdAt, updatedAt).",
    example: "createdAt",
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
    description: "Period of time in which the company was created.",
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
  financialYear?: number;

  @ApiPropertyOptional({
    description: "Time filter on quarter.",
    example: "Q1",
  })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({
    description: "Time filter on month.",
    example: "July",
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: "OwnerId to filter.",
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;

  @ApiPropertyOptional({
    description: "ViewBy to filter.",
    example: "me",
  })
  @IsOptional()
  @IsString()
  viewBy?: "manager" | "team";

  @ApiPropertyOptional({
    description: "Filter data by insurer ID.",
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insurerId?: number;
}

export class GetCompanyListDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page(by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search based on company name.",
    example: "Example",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Comma separated company ids to append in response list",
    example: "1,2",
  })
  @IsOptional()
  @Transform(({ value }) =>
    value
      ? String(value)
          .split(",")
          .map((v) => parseInt(v, 10))
      : undefined
  )
  entityIds?: number[];
}
