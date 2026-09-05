import { PartialType } from "@nestjs/mapped-types";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";

export class CoverQuestionDto {
  @ApiProperty({
    description: "Question and its answer",
    example: {
      question1: "Answer for Accidental Death Benefit",
    },
  })
  @IsNotEmpty({ message: "Cover questions must not be empty" })
  @IsString({ each: true, message: "Each question must be a string" })
  question1: string;
}

export class CoversConfigDto {
  @ApiProperty({
    description: "Key-value pair of Cover ID and Questions",
    example: {
      "165": {
        question1: "Answer for Accidental Death Benefit",
      },
      "166": {
        question1: "Answer for Maturity Benefit",
      },
      "167": {
        question1: "Answer for Critical Illness Cover",
      },
    },
  })
  @IsObject({
    message: "CoversConfig must be an object with cover IDs as keys",
  })
  @ValidateNested({ each: true })
  @Type(() => CoverQuestionDto)
  coversConfig: Record<string, CoverQuestionDto>;
}

export class RemarksConfigDto {
  @ApiProperty({
    description: "Remarks for the submission",
    example: "Sample remarks for the submission",
  })
  @IsOptional()
  @IsString({ message: "Remarks must be a string" })
  remarks: string;
}

export class CreateOpportunityRfpCoverDetailDto {
  @ApiProperty({
    description: "Opportunity Activity ID",
    example: 573,
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
  @IsInt({ message: "Opportunity Activity ID must be an integer" })
  @IsNotEmpty({ message: "Opportunity Activity ID is required" })
  opportunityActivityId: number;

  @ApiProperty({
    description: "Opportunity Activity statusLid",
    example: 573,
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
  @IsInt({ message: "Opportunity statusLid must be an integer" })
  @IsNotEmpty({ message: "Opportunity statusLid is required" })
  statusLid: number;

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
    description: "Configuration for covers",
    example: {
      "165": {
        question1: "Answer for Accidental Death Benefit",
      },
      "166": {
        question1: "Answer for Maturity Benefit",
      },
      "167": {
        question1: "Answer for Critical Illness Cover",
      },
    },
  })
  @IsObject({
    message: "CoversConfig must be an object with cover IDs as keys",
  })
  coversConfig: Record<string, Record<string, string>>;

  @ApiProperty({
    description: "Configuration for remarks",
    type: RemarksConfigDto,
  })
  @ValidateNested()
  @Type(() => RemarksConfigDto)
  remarksSection: RemarksConfigDto;

  @ApiProperty({
    description: "Configuration for file uploads",
    type: [OpportunityActivityDocumentDto],
  })
  @IsArray({ message: "FileUploadConfig must be an array" })
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  documents: OpportunityActivityDocumentDto[];
}

export class UpdateOpportunityRfpCoverDetailDto extends PartialType(
  CreateOpportunityRfpCoverDetailDto
) {}
