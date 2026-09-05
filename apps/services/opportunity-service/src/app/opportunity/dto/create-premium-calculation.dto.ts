import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsString,
  IsObject,
  MaxLength,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class RemarksSectionDto {
  @ApiProperty({
    description: "Remarks for the calculation",
    example: "This is my remarks data",
  })
  @IsString({ message: "Remarks must be a string" })
  @IsOptional()
  remarks?: string;
}

export class PremiumCalculationDocumentDto {
  @ApiProperty({
    description: "Document Type ID",
    example: 237,
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
  @IsInt({ message: "Document Type ID must be a number." })
  @IsNotEmpty({ message: "Document Type ID is required." })
  documentTypeLid!: number;

  @ApiProperty({
    description: "Document ID",
    example: 35,
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
  @IsInt({ message: "Document ID must be a number." })
  @IsNotEmpty({ message: "Document ID is required." })
  documentId!: number;
}

export class CreatePremiumCalculationDto {
  @ApiProperty({
    description: "Opportunity Activity ID",
    example: 750,
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
  opportunityActivityId!: number;

  @ApiProperty({
    description: "Status Lookup ID",
    example: 403,
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
  @IsInt({ message: "Status Lookup ID must be an integer" })
  @IsNotEmpty({ message: "Status Lookup ID is required" })
  statusLid!: number;

  // REMOVED remarks property as per instruction

  @ApiProperty({
    description: "Premium calculation details as key-value pairs",
    example: {
      "101": "This is my Commercial vessels data",
      "102": "This is my ships",
      "103": "This is my data",
    },
  })
  @IsObject({ message: "premiumCalculationDetails must be an object" })
  premiumCalculationDetails!: Record<string, string>;

  @ApiProperty({
    description: "Remarks section object",
    type: RemarksSectionDto,
  })
  @ValidateNested()
  @Type(() => RemarksSectionDto)
  remarksSection!: RemarksSectionDto;

  @ApiProperty({
    description: "Array of document objects",
    type: [PremiumCalculationDocumentDto],
  })
  @IsOptional()
  @IsArray({ message: "Documents must be an array" })
  @ValidateNested({ each: true })
  @Type(() => PremiumCalculationDocumentDto)
  documents?: PremiumCalculationDocumentDto[];

  @ApiProperty({
    example:
      "This is a sample activity status key. (SAVE_ACTIVITY, COMPLETE_ACTIVITY)",
    description: "Activity Status Key of the activity (0-20 characters).",
  })
  @IsNotEmpty({ message: "Activity Status Key is required." })
  @IsString({ message: "Activity Status Key must be a string." })
  @MaxLength(20, {
    message: "Activity Status Key must be between 0 and 20 characters.",
  })
  activityStatusKey!: "SAVE_ACTIVITY" | "COMPLETE_ACTIVITY";
}
