import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class CompanyInsurerQueryDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== ""
      ? parseInt(value, 10)
      : DEFAULT_VALUES.PAGE
  )
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page.",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== ""
      ? parseInt(value, 10)
      : DEFAULT_VALUES.LIMIT
  )
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_VALUES.LIMIT;

  @ApiPropertyOptional({
    description: "Search term to filter insurers by name.",
    example: "ABC Insurance",
  })
  @IsOptional()
  @IsString()
  search?: string;
}
