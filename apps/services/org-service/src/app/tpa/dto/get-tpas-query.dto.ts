import { Transform } from "class-transformer";
import { IsOptional, IsString, IsNumber, IsIn, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetTpasDto {
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
    description: "Search term to filter Tpa.",
    example: "tpaName:test",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      "Sort order in the format field:order (e.g., tpaName:ASC,createdAt:DESC).",
    example: "tpaName:ASC,createdAt:DESC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Field to search by (e.g., tpaName).",
    example: "test",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;
}
