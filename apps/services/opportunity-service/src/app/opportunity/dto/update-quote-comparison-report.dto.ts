import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { PlacementDynamicsSectionDto } from "./create-quote-comparison-report.dto";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";

export class UpdateQuoteComparisonReportDto {
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
  @IsOptional()
  opportunityActivityId?: number;

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
  statusLid?: number;

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
