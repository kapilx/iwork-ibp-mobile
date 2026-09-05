import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";

export class DataValidationRemarksDto {
  @ApiProperty({
    example: "This is a sample description for the activity.",
    description: "Description of the activity (10-1000 characters).",
  })
  @IsOptional()
  @IsString({ message: "Description must be a string." })
  @MaxLength(1000, {
    message: "Description must be between 10 and 1000 characters.",
  })
  description!: string;
}
export class CreateDataValidationDto {
  @ApiProperty({
    example: 76,
    description: "The ID of the opportunity.",
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
  @IsInt({ message: "Opportunity ID must be an integer." })
  @IsNotEmpty({ message: "Opportunity ID is required." })
  opportunityActivityId!: number;

  @ApiProperty({
    type: DataValidationRemarksDto,
    description: "Remarks for the data validation activity.",
  })
  @IsNotEmpty({ message: "Remarks is required." })
  @Type(() => DataValidationRemarksDto)
  @ValidateNested()
  remarks!: DataValidationRemarksDto;

  @ApiProperty({
    example: 101,
    description: "Status LID (lookup ID for the status of the activity).",
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
  @IsNotEmpty({ message: "Status Lid is required." })
  @IsInt({ message: "Status Lid must be an integer." })
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
    type: [OpportunityActivityDocumentDto],
    description:
      "List of document IDs to be associated with the data validation.",
  })
  @IsOptional()
  @IsArray({ message: "Documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  documents?: OpportunityActivityDocumentDto[];
}

export class UpdateDataValidationDto extends PartialType(
  CreateDataValidationDto
) {}
