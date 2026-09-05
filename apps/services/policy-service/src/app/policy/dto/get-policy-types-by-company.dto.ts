import { IsOptional, IsString, IsNumber, Min } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetPolicyTypesByCompanyDto {
  @ApiPropertyOptional({
    description: "Search term to filter policy types by name.",
    example: "GMC",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_VALUES.PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page?: number = DEFAULT_VALUES.PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page (by default limit is 10 records).",
    example: DEFAULT_VALUES.LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit?: number = DEFAULT_VALUES.LIMIT;
}
