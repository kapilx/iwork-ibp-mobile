import { Transform } from "class-transformer";
import { IsOptional, IsString, IsNumber, Min, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../../services/service-lib/src/lib/constants";

export enum NoteViewBy {
  SELF = "self",
  SELF_TEAM = "self_team",
  SELF_ORG = "self_org",
}

export class GetNotesDto {
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
    description: "Search term to filter notes.",
    example: "description:Example",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      "Sort order in the format field:order (e.g., description:ASC,createdAt:DESC).",
    example: "createdAt:DESC",
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: "Field to search by (e.g., description).",
    example: "Example",
  })
  @IsOptional()
  @IsString()
  searchBy?: string;

  @ApiPropertyOptional({
    description: "Company id to filter notes",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null ? parseInt(value, 10) : undefined
  )
  @IsNumber()
  companyId?: number;

  @ApiPropertyOptional({
    description: "Opportunity id to filter notes",
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null ? parseInt(value, 10) : undefined
  )
  @IsNumber()
  opportunityId?: number;

  @ApiPropertyOptional({
    description: "Filter notes by scope: self, self_team (direct reportees), or self_org (full hierarchy).",
    enum: NoteViewBy,
    example: NoteViewBy.SELF_ORG,
  })
  @IsOptional()
  @IsEnum(NoteViewBy)
  viewBy?: NoteViewBy;
}

export class NoteDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Note title" })
  title: string;

  @ApiProperty({ example: "Note description" })
  description: string;
}
