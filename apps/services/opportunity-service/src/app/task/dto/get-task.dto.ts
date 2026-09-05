import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsBoolean,
  IsEnum,
} from "class-validator";

export enum TaskViewBy {
  SELF = "self",
  SELF_TEAM = "self_team",
  SELF_ORG = "self_org",
}
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetTasksDto {
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
    description: "Search term to filter meetings.",
    example: "companyName:Example",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      "Sort order in the format field:order (e.g., companyName:ASC,createdAt:DESC).",
    example: "createdAt:DESC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Field to search by (e.g., companyName).",
    example: "Example",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiPropertyOptional({
    description: "Flag to include completed tasks as well",
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  showCompleted?: boolean;

  @ApiPropertyOptional({
    description: "Company id to filter tasks",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && !isNaN(value) ? parseInt(value, 10) : undefined
  )
  @IsNumber()
  companyId?: number;

  @ApiPropertyOptional({
    description: "Opportunity id to filter tasks",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  opportunityId?: number;

  @ApiPropertyOptional({
    description: "Filter tasks strictly by opportunity ID when true, otherwise sort by opportunity ID",
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  filterByOpportunity?: boolean;

  @ApiPropertyOptional({
    description: "Filter tasks by scope: self, self_team (direct reportees), or self_org (full hierarchy).",
    enum: TaskViewBy,
    example: TaskViewBy.SELF_ORG,
  })
  @IsOptional()
  @IsEnum(TaskViewBy)
  viewBy?: TaskViewBy;
}
