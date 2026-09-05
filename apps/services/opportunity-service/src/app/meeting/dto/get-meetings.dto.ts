import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, IsNumber, Min, IsBoolean } from "class-validator";

export enum MeetingViewBy {
  SELF = "self",
  SELF_TEAM = "self_team",
  SELF_ORG = "self_org",
}
import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export class GetMeetingsDto {
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
    description: "Filter meetings by company id.",
    example: 1,
  })
  @Transform(({ value }) =>
    value !== undefined && value !== null ? parseInt(value, 10) : undefined
  )
  @IsOptional()
  @IsNumber()
  companyId?: number;

  @ApiPropertyOptional({
    description: "Filter meetings by opportunity id.",
    example: 1,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsNumber()
  opportunityId?: number;

  @ApiPropertyOptional({
    description: "Filter meetings strictly by opportunity ID when true, otherwise sort by opportunity ID",
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  filterByOpportunity?: boolean;

  @ApiPropertyOptional({
    description: "Scope of meetings to return: self, self_team, or self_org.",
    enum: MeetingViewBy,
    example: MeetingViewBy.SELF,
  })
  @IsOptional()
  @IsEnum(MeetingViewBy)
  viewBy?: MeetingViewBy;
}
