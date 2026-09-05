import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsNumber,
  IsObject,
  IsString,
  MaxLength,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { RemarksSectionDto } from "./create-premium-calculation.dto";

export class UpdatePremiumCalculationDocumentDto {
  @ApiProperty({
    description: "Document Type ID",
    example: 237,
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
  id?: number;

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

export class UpdatePremiumCalculationDto {
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
    type: [UpdatePremiumCalculationDocumentDto],
  })
  @IsOptional()
  @IsArray({ message: "Documents must be an array" })
  @ValidateNested({ each: true })
  @Type(() => UpdatePremiumCalculationDocumentDto)
  documents?: UpdatePremiumCalculationDocumentDto[];

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
