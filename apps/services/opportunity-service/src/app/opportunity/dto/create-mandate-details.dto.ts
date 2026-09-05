import { PartialType } from "@nestjs/mapped-types";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";

export class MandateDetailsFromFieldsDto {
  @ApiProperty({
    example: 330,
    description: "The ID of the mandate type",
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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: "mandateTypeLid must be an integer" })
  @IsNotEmpty({ message: "mandateTypeLid is required" })
  mandateTypeLid!: number;

  @ApiProperty({
    description: "List of contact ids associated with the mandate",
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNotEmpty({ message: "Contact is required" })
  mandateDetailsContacts!: number[];

  @ApiProperty({
    example: "2025-01-16",
    description: "The start date of the mandate validity in ISO format",
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString({}, { message: "validFrom must be a valid ISO date string" })
  @IsNotEmpty({ message: "validFrom is required" })
  validFrom!: Date;

  @ApiProperty({
    example: "2025-12-31",
    description: "The end date of the mandate validity in ISO format",
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString({}, { message: "validTo must be a valid ISO date string" })
  @IsNotEmpty({ message: "validTo is required" })
  validTo!: Date;

  @ApiProperty({
    example: 1000,
    description: "The compensation payable for the mandate",
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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber({}, { message: "compensationPayable must be a number" })
  @Min(0, { message: "compensationPayable must be greater than 0" })
  compensationPayable!: number;

  @ApiProperty({
    example: 401,
    description: "The ID of the compensation type",
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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: "compensationTypeLid must be an integer" })
  @IsNotEmpty({ message: "compensationTypeLid is required" })
  compensationTypeLid!: number;

  @ApiProperty({
    example: "2025-05-19",
    description: "The date the mandate was issued in ISO format",
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString({}, { message: "issuedOn must be a valid ISO date string" })
  @IsNotEmpty({ message: "issuedOn is required" })
  issuedOn!: Date;

  @ApiProperty({
    example: "This is a sample remark for the mandate.",
    description: "Additional remarks about the mandate",
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: "remarks must be a string" })
  @MaxLength(1000, { message: "remarks must be at most 1000 characters" })
  remarks?: string;
}

export class CreateMandateDto {
  @ApiProperty({
    example: 181,
    description: "ID of the opportunity activity",
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
  @IsInt({ message: "opportunityActivityId must be an integer" })
  @IsNotEmpty({ message: "opportunityActivityId is required" })
  opportunityActivityId!: number;

  @ApiProperty({
    type: MandateDetailsFromFieldsDto,
    description: "The details of the mandate from fields",
  })
  @IsNotEmpty({ message: "Mandate details are required" })
  @Type(() => MandateDetailsFromFieldsDto)
  @ValidateNested()
  mandateDetailsFromFields!: MandateDetailsFromFieldsDto;

  @ApiProperty({
    type: [OpportunityActivityDocumentDto],
    description: "List of documents associated with the mandate",
    required: false,
  })
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  @IsOptional()
  documents?: OpportunityActivityDocumentDto[];

  @ApiProperty({
    example: 404,
    description: "The statusLid of the LookUp",
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
  @IsInt({ message: "statusLid must be an integer" })
  @IsNotEmpty({ message: "statusLid is required" })
  statusLid!: number;

  @IsOptional()
  createdBy?: number;

  @IsOptional()
  updatedBy?: number;

  @IsOptional()
  opportunityId?: number;

  @IsOptional()
  activityId?: number;

  @IsOptional()
  planDate?: Date;

  @ApiProperty({
    example: "COMPLETE_ACTIVITY",
    description: "Activity Status Key of the activity (0-20 characters).",
  })
  @IsNotEmpty({ message: "Activity Status Key is required." })
  @IsEnum(["SAVE_ACTIVITY", "COMPLETE_ACTIVITY"], {
    message:
      "Activity Status Key must be either 'SAVE_ACTIVITY' or 'COMPLETE_ACTIVITY'.",
  })
  activityStatusKey!: "SAVE_ACTIVITY" | "COMPLETE_ACTIVITY";
}

export class UpdateMandateDto extends PartialType(CreateMandateDto) {}
