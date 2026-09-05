import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetPolicyAssetsDto {
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
    description:
      "Search term applied to Cover Code or Risk Location Details columns.",
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class GetPolicySubAssetsDto {
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
    description:
      "Search term applied to Cover Code or Sub Limit Description columns.",
  })
  @IsOptional()
  @IsString()
  search?: string;
}