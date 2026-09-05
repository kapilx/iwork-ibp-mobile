import { Transform } from "class-transformer";
import { IsOptional, IsString, IsNumber, Min, IsIn } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  DEFAULT_SORT_FIELD,
  DEFAULT_DESC_SORT_ORDER,
} from "../../../../../../libs/service-lib/src/lib/constants";

export class GetCronConfigurationsDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_PAGE,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Page must be at least 1" })
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page (default is 10 records).",
    example: DEFAULT_LIMIT,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: "Limit must be at least 1" })
  limit: number = DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description:
      "Sort order in the format field:order (e.g., companyName:ASC,createdAt:DESC).",
    example: "companyName:ASC,createdAt:DESC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description:
      "Search term to filter cron jobs (searches in jobName, jobKey, cronExpression, description).",
    example: "expired",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;
}
