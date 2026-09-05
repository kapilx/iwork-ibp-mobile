import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  OWNER_TYPES,
} from "../../../../../../../libs/service-lib/src/lib/constants";

export class CompanyHierarchyQueryDto {
  @ApiPropertyOptional({
    description: "Page number for pagination.",
    example: DEFAULT_PAGE,
  })
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== ""
      ? parseInt(value, 10)
      : DEFAULT_PAGE
  )
  @IsNumber()
  @Min(1, { message: "Page must be atleast 1" })
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: "Number of records per page.",
    example: DEFAULT_LIMIT,
  })
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== ""
      ? parseInt(value, 10)
      : DEFAULT_LIMIT
  )
  @IsNumber()
  @Min(1, { message: "Limit must be atleast 1" })
  limit: number = DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: "Search term to filter companies by name.",
    example: "Acme Corporation",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Override user to fetch companies for",
    example: 42,
  })
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsOptional()
  @IsNumber()
  ownerId?: number;

  @ApiPropertyOptional({
    description:
      "Determines whether to fetch only the manager's companies or the entire team",
    enum: Object.values(OWNER_TYPES),
    example: OWNER_TYPES.TEAM,
  })
  @IsOptional()
  @IsIn(Object.values(OWNER_TYPES))
  viewBy?: (typeof OWNER_TYPES)[keyof typeof OWNER_TYPES];
}
