import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";
import { ParticipantsDto } from "./opportunity-meeting.dto";
export class KDMMeetingFormFieldsDto {
  @ApiProperty({
    description: "KDM Meeting Type ID",
    example: 343,
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
  @IsInt({ message: "KDM Meeting type must be a number." })
  @IsNotEmpty({ message: "KDM Meeting type is required." })
  @Min(1, {
    message: "KDM Meeting type must be positive number.",
  })
  kdmMeetingTypeLid!: number;

  @ApiPropertyOptional({
    description: "Selected Meeting ID",
    example: 123,
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
  @IsInt({ message: "Selected Meeting id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Selected Meeting id must be positive number.",
  })
  selectMeeting?: number;

  @ApiProperty({
    description: "Meeting Date",
    example: "2025-12-10",
  })
  @IsDate({ message: "Meeting Date must be a valid date." })
  @Type(() => Date) // Transform string to Date
  @IsNotEmpty({ message: "Meeting Date is required." })
  @Transform(({ value }: { value: Date }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight
    return value;
  })
  meetingDate!: Date;

  @ApiProperty({
    description: "Start Time (time with time zone, ISO 8601 format)",
    type: String,
    example: "10:00:00+05:30",
  })
  @IsNotEmpty({ message: "Start time is required." })
  @IsString({
    message:
      "Start Time must be a string in time with time zone format (e.g., 10:00:00+05:30).",
  })
  @Transform(({ value }) => {
    // Validate ISO 8601 time with time zone (e.g., 10:00:00+05:30)
    const regex =
      /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)([+-][0-1]\d:[0-5]\d|Z)$/;
    if (!regex.test(value)) {
      throw new BadRequestException(
        "Start Time must be in 'HH:mm:ss±HH:mm' or 'HH:mm:ssZ' format."
      );
    }
    return value;
  })
  availableFrom!: string;

  @ApiProperty({
    description: "End Time (time with time zone, ISO 8601 format)",
    type: String,
    example: "11:00:00+05:30",
  })
  @IsNotEmpty({ message: "End time is required." })
  @IsString({
    message:
      "End Time must be a string in time with time zone format (e.g., 11:00:00+05:30).",
  })
  @Transform(({ value }) => {
    // Validate ISO 8601 time with time zone (e.g., 11:00:00+05:30)
    const regex =
      /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)([+-][0-1]\d:[0-5]\d|Z)$/;
    if (!regex.test(value)) {
      throw new BadRequestException(
        "End Time must be in 'HH:mm:ss±HH:mm' or 'HH:mm:ssZ' format."
      );
    }
    return value;
  })
  availableTo!: string;

  @ApiProperty({
    description: "Meeting Type ID",
    example: 343,
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
  @IsInt({ message: "Meeting type must be a number." })
  @IsNotEmpty({ message: "Meeting type is required." })
  @Min(1, {
    message: "Meeting type must be positive number.",
  })
  meetingTypeLid!: number;

  @ApiPropertyOptional({
    description: "KDM Meeting location",
    example: 300,
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
  @IsInt({ message: "Location type must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Location type must be positive number.",
  })
  locationTypeLid?: number;
}

export class RemarksMomSection {
  @ApiPropertyOptional({
    description: "Meeting minutes",
    example: "KDM Meeting minutes",
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  mom?: string;

  @ApiPropertyOptional({
    description: "KDM Meeting remarks",
    example: "Remarks about the KDM Meeting",
  })
  @IsString({ message: "KDM Meeting remarks must be a string." })
  @IsOptional()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  remarks?: string;
}
export class CreateKDMMeetingDto {
  @ApiProperty({
    description: "Activity ID",
    example: 123,
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
  @IsInt({ message: "Activity id must be a number." })
  @IsNotEmpty({ message: "Activity id is required." })
  @Min(1, {
    message: "Activity id must be positive number.",
  })
  opportunityActivityId!: number;

  @ApiProperty({
    description: "KDM Meeting status ID",
    example: 1,
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
  @IsInt({ message: "Status ID must be a number." })
  @IsNotEmpty({ message: "Status ID is required." })
  @Min(1, {
    message: "Status ID must be positive number.",
  })
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
    description: "KDM Meeting form fields",
    type: KDMMeetingFormFieldsDto,
  })
  @IsNotEmpty({ message: "KDM Meeting form fields are required." })
  @ValidateNested()
  @Type(() => KDMMeetingFormFieldsDto)
  kdmMeetingFormFields!: KDMMeetingFormFieldsDto;

  @ApiPropertyOptional({
    description: "Remarks and Minutes of Meeting section",
    type: RemarksMomSection,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RemarksMomSection)
  remarksMomSection?: RemarksMomSection;

  @ApiProperty({
    description: "Kdm meeting Participants",
    type: ParticipantsDto,
  })
  @IsNotEmpty({ message: "KDM Meeting participants are required." })
  @ValidateNested()
  @Type(() => ParticipantsDto)
  participants!: ParticipantsDto;

  @ApiPropertyOptional({
    description: "KDM Meeting documents",
    type: [OpportunityActivityDocumentDto],
  })
  @IsOptional()
  @IsArray({ message: "KDM Meeting documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  documents?: OpportunityActivityDocumentDto[];
}

export class UpdateKDMMeetingDto extends PartialType(CreateKDMMeetingDto) {}
