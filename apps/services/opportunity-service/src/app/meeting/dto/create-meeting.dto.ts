import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class TpaParticipantsDto {
  @ApiProperty({ description: "TPA ID", example: 211 })
  @IsInt({ message: "TPA ID must be a number." })
  @IsOptional()
  @Min(1, {
    message: "TPA ID must be a positive number.",
  })
  tpaId?: number;

  @ApiProperty({
    description: "TPA Contact Person IDs",
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: "TPA Contact Person must be an array." })
  @ArrayNotEmpty({ message: "At least one TPA Contact Person is required." })
  @IsInt({
    each: true,
    message: "Each TPA Contact Person ID must be a number.",
  })
  tpaContactPerson?: number[];
}
export class InsurerParticipantsDto {
  @ApiProperty({ description: "Insurer ID", example: 357 })
  @IsInt({ message: "Insurer ID must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Insurer ID must be a positive number.",
  })
  insurerId?: number;

  @ApiProperty({
    description: "Insurer Contact Person IDs",
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: "Insurer Contact Person must be an array." })
  @ArrayNotEmpty({
    message: "At least one Insurer Contact Person is required.",
  })
  @IsInt({
    each: true,
    message: "Each Insurer Contact Person ID must be a number.",
  })
  insurerContactPerson?: number[];
}
export class CompanyParticipantsDto {
  @ApiProperty({ description: "Company ID", example: 357 })
  @IsInt({ message: "Company ID must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Company ID must be a positive number.",
  })
  companyId?: number;

  @ApiProperty({
    description: "Company Contact Person IDs",
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: "Company Contact Person must be an array." })
  @ArrayNotEmpty({
    message: "At least one Company Contact Person is required.",
  })
  @IsInt({
    each: true,
    message: "Each Company Contact Person ID must be a number.",
  })
  companyContactPerson?: number[];
}
export class EmployeeParticipantsDto {
  @ApiProperty({ description: "Employee IDs", type: [Number] })
  @IsOptional()
  @IsArray({ message: "Employees must be an array." })
  @ArrayNotEmpty({ message: "At least one Employee is required." })
  @IsInt({ each: true, message: "Each Employee ID must be a number." })
  employees?: number[];
}
export class CreateMeetingDocumentDto {
  @ApiProperty({
    description: "Document ID",
    example: 1,
  })
  @IsInt({ message: "Document ID must be a number." })
  @IsNotEmpty({ message: "Document ID is required." })
  @Min(1, {
    message: "Document ID must be positive number.",
  })
  documentId!: number;

  @ApiProperty({
    example: 101,
    description: "The lookup ID for the document type.",
  })
  @IsInt({ message: "Document Type ID must be an integer." })
  @IsOptional()
  documentTypeLid?: number;
}
export class CreateMeetingDto {
  @IsInt({ message: "Activity id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Activity id must be positive number.",
  })
  activityId?: number;

  @IsInt({ message: "Opportunity id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Opportunity id must be positive number.",
  })
  opportunityId?: number;

  @ApiProperty({
    description: "Meeting Type ID",
    example: 343,
  })
  @IsInt({ message: "Meeting type must be a number." })
  @IsNotEmpty({ message: "Meeting type is required." })
  @Min(1, {
    message: "Meeting type must be positive number.",
  })
  meetingTypeLid!: number;

  @IsInt({ message: "Company id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Company id must be positive number.",
  })
  companyId?: number;

  @ApiProperty({
    description: "Meeting Date",
    type: String,
    example: "2025-06-20",
  })
  @IsDate({ message: "Meeting Date must be a valid date." })
  @Type(() => Date)
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
  startTime!: string;

  @IsOptional()
  @IsInt({ message: "Duration must be a number." })
  @Min(1, {
    message: "Duration must be a positive number.",
  })
  duration?: number;

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
  endTime!: string;

  @ApiPropertyOptional({
    description: "Location",
    type: Number,
    example: 300,
  })
  @IsInt({ message: "Location type must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Location type must be positive number.",
  })
  locationTypeLid?: number;

  @ApiProperty({
    description: "Meeting subject",
    type: String,
    example: "Discuss project updates",
  })
  @IsString({ message: "Meeting subject must be a string." })
  @IsNotEmpty({ message: "Meeting subject is required." })
  meetingSubject!: string;

  @ApiProperty({
    description: "Meeting Agenda",
    type: String,
    example: "Agenda for the meeting",
  })
  @IsString({ message: "Meeting agenda must be a string." })
  @IsNotEmpty({ message: "Meeting agenda is required." })
  meetingAgenda?: string;

  @IsInt({ message: "Meeting status must be a number." })
  @IsOptional()
  meetingStatusLid?: number;

  @ApiPropertyOptional({
    description: "TPA participants",
    type: TpaParticipantsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TpaParticipantsDto)
  tpaParticipants?: TpaParticipantsDto;

  @ApiPropertyOptional({
    description: "Insurer participants",
    type: InsurerParticipantsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsurerParticipantsDto)
  insurerParticipants?: InsurerParticipantsDto;

  @ApiPropertyOptional({
    description: "Company participants",
    type: CompanyParticipantsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyParticipantsDto)
  companyParticipants?: CompanyParticipantsDto;

  @ApiPropertyOptional({
    description: "Employee participants",
    type: EmployeeParticipantsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeParticipantsDto)
  employeeParticipants?: EmployeeParticipantsDto;

  @ApiPropertyOptional({
    description: "Meeting documents",
    type: [CreateMeetingDocumentDto],
  })
  @IsOptional()
  @IsArray({ message: "Meeting documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => CreateMeetingDocumentDto)
  documents?: CreateMeetingDocumentDto[];

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}
