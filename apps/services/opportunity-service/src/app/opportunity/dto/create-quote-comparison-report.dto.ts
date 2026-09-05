import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";

export class PlacementDynamicsSectionDto {
  @ApiPropertyOptional({
    example: "Competitive rates observed in the market.",
    description: "Insurance market overview",
    required: true,
  })
  @IsOptional()
  @IsString()
  insuranceMarket?: string;

  @ApiPropertyOptional({
    example: "Client requested additional coverage.",
    description: "Client specific details",
    required: true,
  })
  @IsOptional()
  @IsString()
  clientSpecific?: string;

  @ApiPropertyOptional({
    example: "Delay in receiving quotes from insurer.",
    description: "Issues faced during placement",
    required: true,
  })
  @IsOptional()
  @IsString()
  issuesFaced?: string;

  @ApiPropertyOptional({
    example: "Rates are in line with industry standards.",
    description: "Industry benchmarking comments",
    required: true,
  })
  @IsOptional()
  @IsString()
  industryBenchmarkingComments?: string;

  @ApiPropertyOptional({
    example: "Recommend proceeding with Insurer A.",
    description: "Analysis and recommendation",
    required: true,
  })
  @IsOptional()
  @IsString()
  analysisRecommendation?: string;

  @ApiPropertyOptional({
    example: "All quotes reviewed and compared.",
    description: "Overall comments",
    required: true,
  })
  @IsOptional()
  @IsString()
  overallComments?: string;

  @ApiPropertyOptional({
    example: "This is my insurer data",
    description: "Additional remarks",
    required: true,
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateQuoteComparisonReportDto {
  @ApiProperty({
    example: 789,
    description: "Opportunity Activity ID",
    required: true,
  })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @IsNotEmpty({ message: "Opportunity Activity ID is required." })
  opportunityActivityId!: number;

  @ApiProperty({
    example: 403,
    description: "Status LID",
    required: true,
  })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @IsNotEmpty({ message: "Activity Status Lid is required." })
  statusLid!: number;

  @ApiProperty({
    description: "Activity Status Key of the activity (0-20 characters).",
    example: "SAVE_ACTIVITY",
  })
  @IsNotEmpty({ message: "Activity Status Key is required." })
  @IsEnum(["SAVE_ACTIVITY", "COMPLETE_ACTIVITY"], {
    message:
      "Activity Status Key must be either 'SAVE_ACTIVITY' or 'COMPLETE_ACTIVITY'.",
  })
  activityStatusKey!: "SAVE_ACTIVITY" | "COMPLETE_ACTIVITY";

  @ApiProperty({
    type: PlacementDynamicsSectionDto,
    required: true,
    description: "Placement Dynamics Section",
  })
  @ValidateNested()
  @Type(() => PlacementDynamicsSectionDto)
  placementDynamicsSetion!: PlacementDynamicsSectionDto;

  @ApiProperty({
    type: [OpportunityActivityDocumentDto],
    description: "Array of documents",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  documents?: OpportunityActivityDocumentDto[];
}

export class UpdateQuoteComparisonReportDto extends PartialType(
  CreateQuoteComparisonReportDto
) {}
