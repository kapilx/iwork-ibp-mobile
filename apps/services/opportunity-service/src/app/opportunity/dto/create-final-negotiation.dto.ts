import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  ValidateNested,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { CreateInsurerParticipantDto } from "./create-insurer-participants.dto";
import { BadRequestException } from "@nestjs/common";
import { CreateFinalNegotiationParticipantDto } from "./create-final-negotiation-participants.dto";

export class CreateFinalNegotiationDto {
  @ApiProperty({
    example: "2024-09-10",
    description: "Meeting date must be <= today",
  })
  @IsNotEmpty({ message: "Meeting date is required" })
  @IsDateString({}, { message: "Meeting date must be a valid date string" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Meeting Date must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string }) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of the day
    if (date >= today) {
      throw new BadRequestException(
        "The meeting date cannot be today or a future date. Please provide a valid past date."
      );
    }
    return value;
  })
  meetingDate: Date;

  @ApiProperty({ example: "2024-09-10T09:00:00Z", description: "Start time" })
  @IsNotEmpty({ message: "Start time is required" })
  @IsDateString({}, { message: "Start time must be a valid date string" })
  @Transform(({ value, obj }) => {
    obj.startTimeTemp = value;
    return value;
  })
  startTime: Date;

  @ApiProperty({ example: "2024-09-10T10:30:00Z", description: "End time" })
  @IsNotEmpty({ message: "End time is required" })
  @IsDateString({}, { message: "End time must be a valid date string" })
  @Transform(({ value, obj }) => {
    const start = new Date(obj.startTimeTemp);
    const end = new Date(value);
    if (start && end && end <= start) {
      throw new BadRequestException("End time must be after start time");
    }
    return value;
  })
  endTime: Date;

  @ApiProperty({
    example: "Conference Room A",
    description: "Where the meeting was held",
  })
  @IsNotEmpty({ message: "Meeting location is required" })
  @IsString({ message: "Meeting location must be a string" })
  @MinLength(10, {
    message: "Meeting location must be at least 10 characters long",
  })
  @MaxLength(100, {
    message: "Meeting location must be at most 100 characters long",
  })
  heldAt: string;

  @ApiProperty({
    example: "Discussed policy terms.",
    description: "Minutes of meeting",
  })
  @IsNotEmpty({ message: "Minutes of meeting is required" })
  @IsString({ message: "Minutes of meeting must be a string" })
  @MinLength(10, {
    message: "Minutes of meeting must be at least 10 characters long",
  })
  @MaxLength(1000, {
    message: "Minutes of meeting must be at most 1000 characters long",
  })
  minutesOfMeeting: string;

  @ApiProperty({
    example: 332,
    description: "Policy placed type (1=Single, 2=Multiple)",
  })
  @IsNotEmpty({ message: "Policy placed type is required" })
  @IsInt({ message: "Policy placed type must be an integer" })
  policyPlacedTypeLid: number;

  @ApiProperty({
    example: 163,
    description: "Lead insurer ID (if multiple insurers)",
  })
  @IsOptional()
  @IsInt({ message: "Lead insurer ID must be an integer" })
  leadInsurerId?: number;

  @ApiProperty({
    example: 338,
    description: "Only lead pays commission",
  })
  @IsNotEmpty({ message: "Only lead pays commission is required" })
  @IsInt({ message: "Only lead pays commission must be a number" })
  onlyLeadPaysCommissionLid: number;

  @ApiProperty({ example: 1, description: "Finalized quote ID" })
  @IsNotEmpty({ message: "Finalized quote ID is required" })
  @IsInt({ message: "Finalized quote ID must be an integer" })
  finalisedQuoteId: number;

  @ApiProperty({
    example: 340,
    description: "Would change quote values?",
  })
  @IsOptional()
  @IsInt({ message: "Would change quote values must be a integer" })
  wouldChangeQuoteValuesLid?: number;

  @ApiProperty({ example: "Good cooperation.", description: "Other comments" })
  @IsOptional()
  @IsString({ message: "Other comments must be a string" })
  otherComments?: string;

  @ApiProperty({
    example: "Increased deductible by $500.",
    description: "Variations from QCR",
  })
  @IsOptional()
  @IsString({ message: "Variations must be a string" })
  variations?: string;

  @ApiProperty({
    example: 334,
    description: "Service Level Agreement Days LID",
  })
  @IsOptional()
  @IsInt({ message: "Service Level Agreement Days LID must be an integer" })
  serviceLevelAgreementDaysLid?: number;

  @ApiProperty({ example: 35, description: "Document ID" })
  @IsOptional()
  @IsInt({ message: "Document ID must be an integer" })
  documentId?: number;

  @ApiProperty({
    type: [CreateInsurerParticipantDto],
    description: "List of insurer shares",
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateInsurerParticipantDto)
  insurerShares?: CreateInsurerParticipantDto[];

  @ApiProperty({
    type: [CreateFinalNegotiationParticipantDto],
    description: "List of participants",
  })
  @IsNotEmpty({ message: "Participants are required" })
  @ValidateNested({ each: true })
  @Type(() => CreateFinalNegotiationParticipantDto)
  participants: CreateFinalNegotiationParticipantDto[];

  constructor(
    meetingDate: Date,
    startTime: Date,
    endTime: Date,
    heldAt: string,
    minutesOfMeeting: string,
    policyPlacedTypeLid: number,
    finalisedQuoteId: number,
    participants: CreateFinalNegotiationParticipantDto[],
    onlyLeadPaysCommissionLid: number,
    leadInsurerId?: number,
    wouldChangeQuoteValuesLid?: number,
    otherComments?: string,
    variations?: string,
    serviceLevelAgreementDaysLid?: number,
    documentId?: number,
    insurerShares?: CreateInsurerParticipantDto[]
  ) {
    this.meetingDate = meetingDate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.heldAt = heldAt;
    this.minutesOfMeeting = minutesOfMeeting;
    this.policyPlacedTypeLid = policyPlacedTypeLid;
    this.finalisedQuoteId = finalisedQuoteId;
    this.participants = participants;
    this.leadInsurerId = leadInsurerId;
    this.onlyLeadPaysCommissionLid = onlyLeadPaysCommissionLid;
    this.wouldChangeQuoteValuesLid = wouldChangeQuoteValuesLid;
    this.otherComments = otherComments;
    this.variations = variations;
    this.serviceLevelAgreementDaysLid = serviceLevelAgreementDaysLid;
    this.documentId = documentId;
    this.insurerShares = insurerShares;
  }
}
