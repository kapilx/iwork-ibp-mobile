import { BadRequestException } from "@nestjs/common";
import { PartialType } from "@nestjs/mapped-types";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";
import {
  InsurerParticipantsDto,
  ParticipantsDto,
  TpaParticipantsDto,
} from "./opportunity-meeting.dto";
export class MeetingDetailsDto {
  @ApiProperty({
    description: "Final Negotiation Meeting Type ID",
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
  @IsInt({ message: "Final Negotiation Meeting type must be a number." })
  @IsNotEmpty({ message: "Final Negotiation Meeting type is required." })
  @Min(1, {
    message: "Final Negotiation Meeting type must be positive number.",
  })
  isFinalNegotiationTypeLid!: number;

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
  @IsOptional()
  @IsInt({ message: "Selected Meeting id must be a number." })
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

export class PolicyDetailsDto {
  @ApiProperty({ example: 310, description: "Policy placed type ID." })
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
  @IsInt({ message: "Policy placed type ID must be an integer." })
  @IsNotEmpty({ message: "Policy placed type ID is required." })
  @Min(1, {
    message: "Policy placed type ID must be a positive number.",
  })
  policyPlacedTypeLid!: number;

  @ApiProperty({ example: 248, description: "Lead insurer ID." })
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
  @IsInt({ message: "Lead insurer ID must be an integer." })
  @IsNotEmpty({ message: "Lead insurer ID is required." })
  @Min(1, {
    message: "Lead insurer ID must be a positive number.",
  })
  leadInsurerId!: number;

  @ApiProperty({
    example: true,
    description: "Indicates if only the lead pays commission.",
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
  @IsInt({ message: "Lead pays commission must be an integer" })
  @IsNotEmpty({ message: "Lead pays commission is required." })
  @Min(1, {
    message: "Lead pays commission must be a positive number.",
  })
  isLeadInsurerPayCommissionLid!: number;
}

export class selectFinalisedQuoteDto {
  @ApiProperty({ example: 19, description: "Finalized version ID." })
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
  @IsNotEmpty({ message: "Finalized version ID is required." })
  @IsInt({ message: "Finalized version ID must be an integer." })
  @Min(1, {
    message: "Finalized version ID must be a positive number.",
  })
  finalizedVersionId!: number;

  @ApiProperty({ example: 19, description: "Finalized quote ID." })
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
  @IsNotEmpty({ message: "Finalized quote ID is required." })
  @IsInt({ message: "Finalized quote ID must be an integer." })
  @Min(1, {
    message: "Finalized quote ID must be a positive number.",
  })
  finalizedQuoteId!: number;

  @ApiProperty({
    example: false,
    description: "Indicates if the quote is edited (optional).",
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
  @IsOptional() // need to change
  @IsInt({ message: "Is quote edited must be an integer." })
  @Min(1, {
    message: "Is quote edited must be a positive number.",
  })
  isQuoteEdited?: number;

  @ApiProperty({
    example: 248,
    description: "Unique identifier for the insurer.",
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
  @IsInt({ message: "Insurer ID must be an integer." })
  @IsNotEmpty({ message: "Insurer ID is required." })
  @Min(1, {
    message: "Insurer ID must be a positive number.",
  })
  insurerId: number;

  @ApiPropertyOptional({
    example: 248,
    description: "Insurer Location ID must be a number.",
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
  @IsOptional()
  @IsInt({ message: "Insurer Location ID must be an integer." })
  insurerLocationId?: number;

  @ApiProperty({
    description: "Quote Received Date",
    example: "2025-12-10",
  })
  @IsDate({ message: "Quote Received Date must be a valid date." })
  @Type(() => Date) // Transform string to Date
  @IsOptional() // need to change
  quoteReceivedOn?: Date;

  @ApiProperty({
    example: 10000.0,
    description: "Basic premium amount (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Basic premium must be a number." })
  basicPremium?: number;

  @ApiProperty({
    example: 500.0,
    description: "Terrorism premium amount (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Terrorism must be a number." })
  terrorism?: number;

  // @ApiProperty({
  //   example: 5,
  //   description: "Basic Premium Percentage (optional).",
  // })
  // @Transform(({ value }) => {
  //   if (value === null) return null;
  //   if (
  //     value === undefined ||
  //     (typeof value === "string" && value.trim() === "")
  //   ) {
  //     return undefined;
  //   }
  //   const num = Number(value);
  //   return isNaN(num) ? value : num;
  // })
  // @IsOptional()
  // @IsNumber({}, { message: "Basic Premium Percentage must be a number." })
  // basicPremiumPercentage?: number;

  @ApiProperty({
    example: 5,
    description: "SRCC Percentage (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "SRCC Percentage must be a number." })
  srccPercentage?: number;

  @ApiProperty({
    example: 500,
    description: "SRCC Amount (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "SRCC Amount must be a number." })
  srccAmount?: number;

  @ApiProperty({
    example: 500,
    description: "SRCC Brokerage Amount (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "SRCC Brokerage Amount must be a number." })
  srccBrokerageAmount?: number;

  @ApiProperty({
    example: 5,
    description: "Terrorism Commission Percentage (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Terrorism Brokerage Percentage must be a number." })
  terrorismBrokeragePercentage?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "TC Brokerage Amount (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "TC Brokerage Amount must be a number." })
  tcBrokerageAmount?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Basic Brokerage Amount (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Basic Brokerage Amount must be a number." })
  basicBrokerageAmount?: number;

  // @ApiPropertyOptional({
  //   example: 1500,
  //   description: "Total Brokerage Amount (optional).",
  // })
  // @Transform(({ value }) => {
  //   if (value === null) return null;
  //   if (
  //     value === undefined ||
  //     (typeof value === "string" && value.trim() === "")
  //   ) {
  //     return undefined;
  //   }
  //   const num = Number(value);
  //   return isNaN(num) ? value : num;
  // })
  // @IsOptional()
  // @IsNumber({}, { message: "Brokerage Amount must be a number." })
  // brokerageAmount?: number;

  @ApiProperty({
    example: 5,
    description: "GST Percentage.",
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
  @IsOptional()
  @IsNumber({}, { message: "GST Percentage must be a number." })
  gstPercentage?: number;

  @ApiProperty({
    example: 500,
    description: "GST amount.",
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
  @IsOptional()
  @IsNumber({}, { message: "GST Amount must be a number." })
  gstAmount?: number;

  // @ApiProperty({
  //   example: 500,
  //   description: "Total Gross Premium Inc Tax (optional).",
  // })
  // @Transform(({ value }) => {
  //   if (value === null) return null;
  //   if (
  //     value === undefined ||
  //     (typeof value === "string" && value.trim() === "")
  //   ) {
  //     return undefined;
  //   }
  //   const num = Number(value);
  //   return isNaN(num) ? value : num;
  // })
  // @IsOptional()
  // @IsNumber({}, { message: "Total Gross Premium Inc Tax must be a number." })
  // totalGrossPremiumIncTax?: number;

  @ApiProperty({
    example: 5,
    description: "Fee Percentage (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Fee Percentage must be a number." })
  feePercentage?: number;

  @ApiProperty({
    example: 500,
    description: "Fee (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Fee must be a number." })
  fee?: number;

  @ApiProperty({
    example: 5,
    description: "Other Percentage (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Other Percentage must be a number." })
  otherPercentage?: number;

  @ApiProperty({
    example: 500,
    description: "Other (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Other must be a number." })
  other?: number;

  @ApiProperty({
    example: 5,
    description: "Admin Charges Percentage (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Admin Charges Percentage must be a number." })
  adminChargesPercentage?: number;

  @ApiProperty({
    example: 500,
    description: "Admin Charges (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Admin Charges must be a number." })
  adminCharges?: number;

  @ApiProperty({
    example: 5,
    description: "Cess Percentage (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Cess Percentage must be a number." })
  cessPercentage?: number;

  @ApiProperty({
    example: 500,
    description: "Cess Amount (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Cess Amount must be a number." })
  cessAmount?: number;

  // @ApiProperty({
  //   example: 500,
  //   description: "Total Gross Premium Inc Tax Charges (optional).",
  // })
  // @Transform(({ value }) => {
  //   if (value === null) return null;
  //   if (
  //     value === undefined ||
  //     (typeof value === "string" && value.trim() === "")
  //   ) {
  //     return undefined;
  //   }
  //   const num = Number(value);
  //   return isNaN(num) ? value : num;
  // })
  // @IsOptional()
  // @IsNumber(
  //   {},
  //   { message: "Total Gross Premium Inc Tax Charges must be a number." }
  // )
  // totalGrossPremiumIncTaxCharges?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Gross Premium (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Gross Premium must be a number." })
  grossPremium?: number;

  @ApiProperty({
    example: 11800.0,
    description: "Net premium amount (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Net premium must be a number." })
  netPremium?: number;

  @ApiProperty({
    example: 10.0,
    description: "Basic brokerage percentage (optional).",
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
  @IsOptional()
  @IsNumber({}, { message: "Basic brokerage percentage must be a number." })
  basicBrokeragePercentage?: number;

  @ApiProperty({
    example: 10.0,
    description: "Total brokerage amount.",
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
  @IsOptional()
  @IsNumber({}, { message: "Total brokerage amount must be a number." })
  totalBrokerageAmount?: number;
}

export class netPremiumDetailsDto {
  @ApiProperty({
    example: "Insurer remarks",
    description: "Remarks from the insurer (optional).",
  })
  @IsOptional()
  @IsString({ message: "Insurer remarks must be a string." })
  insurerRemarks?: string;
}

export class CreateQuoteTaxDetailsDto {
  @ApiProperty({ example: 18.0, description: "Tax percentage (optional)." })
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
  @IsNotEmpty({ message: "Tax is required" })
  @IsNumber({}, { message: "Tax must be a number." })
  tax?: number;

  @ApiProperty({ example: 1800.0, description: "Tax value amount (optional)." })
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
  @IsNotEmpty({ message: "Tax value is required." })
  @IsNumber({}, { message: "Tax value must be a number." })
  taxValue?: number;
}
export class OtherCommentsFromInsurerDto {
  @ApiProperty({
    example: "General remarks",
    description: "Additional remarks (optional).",
  })
  @IsOptional()
  @IsString({ message: "Remarks must be a string." })
  remarks?: string;
}

export class CreateMeetingSummarytDto {
  @ApiProperty({
    example: "Summary of the meeting",
    description: "Summary of the meeting.",
  })
  @IsOptional()
  @IsString({ message: "Min of meeting must be a string." })
  mom?: string;
}
export class CreateFinalNegotiationSharingDetailDto {
  @ApiProperty({
    example: 248,
    description: "Unique identifier for the insurer.",
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
  @IsInt({ message: "Insurer ID must be an integer." })
  @IsOptional()
  @Min(1, {
    message: "Insurer ID must be a positive number.",
  })
  insurerId?: number;

  @ApiProperty({
    example: 25.5,
    description: "Percentage of share allocated to the insurer.",
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
  @IsNumber({}, { message: "Share percentage must be a number." })
  @IsOptional()
  @Min(0, {
    message: "Share percentage must be a non-negative number.",
  })
  @Max(100, {
    message: "Share percentage must not exceed 100.",
  })
  sharePercentage?: number;

  @ApiProperty({
    example: 5000.0,
    description: "Share amount for the insurer.",
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
  @IsNumber({}, { message: "Share amount must be a number." })
  @IsOptional()
  @Min(0, {
    message: "Share amount must be a non-negative number.",
  })
  shareAmount?: number;

  @ApiProperty({
    example: 10.0,
    description: "Brokerage percentage for the insurer.",
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
  @IsNumber({}, { message: "Brokerage percentage must be a number." })
  @IsOptional()
  @Min(0, {
    message: "Brokerage percentage must be a non-negative number.",
  })
  @Max(100, {
    message: "Brokerage percentage must not exceed 100.",
  })
  brokeragePercentage?: number;

  @ApiProperty({
    example: 5000.0,
    description: "Brokerage amount for the insurer.",
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
  @IsNumber({}, { message: "Brokerage amount must be a number." })
  @IsOptional()
  @Min(0, {
    message: "Brokerage amount must be a non-negative number.",
  })
  brokerageAmount?: number;

  @ApiProperty({
    example: 25.5,
    description:
      "Terrorism premium share percentage for the insurer. Defaults to the premium share percentage when not supplied.",
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
  @IsNumber({}, { message: "Terrorism share percentage must be a number." })
  @IsOptional()
  @Min(0, {
    message: "Terrorism share percentage must be a non-negative number.",
  })
  @Max(100, {
    message: "Terrorism share percentage must not exceed 100.",
  })
  terrorismSharePercentage?: number;

  @ApiProperty({
    example: 5000.0,
    description:
      "Terrorism premium share amount (terrorism premium x terrorism share percentage).",
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
  @IsNumber({}, { message: "Terrorism share amount must be a number." })
  @IsOptional()
  terrorismShareAmount?: number;

  @ApiProperty({
    example: 10.0,
    description: "Terrorism brokerage percentage for the insurer.",
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
  @IsNumber({}, { message: "Terrorism brokerage percentage must be a number." })
  @IsOptional()
  @Min(0, {
    message: "Terrorism brokerage percentage must be a non-negative number.",
  })
  @Max(100, {
    message: "Terrorism brokerage percentage must not exceed 100.",
  })
  terrorismBrokeragePercentage?: number;

  @ApiProperty({
    example: 5000.0,
    description: "Terrorism brokerage amount for the insurer.",
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
  @IsNumber({}, { message: "Terrorism brokerage amount must be a number." })
  @IsOptional()
  @Min(0, {
    message: "Terrorism brokerage amount must be a non-negative number.",
  })
  terrorismBrokerageAmount?: number;

  @ApiProperty({
    example: 1500.0,
    description: "Total brokerage amount for the insurer.",
    required: false,
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
  @IsNumber({}, { message: "Total brokerage amount must be a number." })
  @IsOptional()
  @Min(0, {
    message: "Total brokerage amount must be a non-negative number.",
  })
  totalBrokerageAmount?: number;

  @ApiProperty({
    example: 248,
    description: "Unique identifier for the location.",
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
  @IsOptional()
  @IsInt({ message: "Location ID must be an integer." })
  @Min(1, {
    message: "Location ID must be a positive number.",
  })
  insurerLocationId?: number;

  @ApiProperty({
    example: 248,
    description: "Unique identifier for the branch.",
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
  @IsOptional()
  @IsInt({ message: "Branch ID must be an integer." })
  @Min(1, {
    message: "Branch ID must be a positive number.",
  })
  insurerBranchId?: number;

  @ApiProperty({
    example: 248,
    description: "Unique identifier for the insurer contact.",
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
  @IsOptional()
  @IsInt({ message: "Contact ID must be an integer." })
  @Min(1, {
    message: "Contact ID must be a positive number.",
  })
  insurerContactId?: number;

  @ApiProperty({
    example: 501,
    description: "Insurer type Lead insurer or Co-insurer.",
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
  @IsOptional()
  @IsInt()
  isLeadInsurer?: number;
}

export class CreateFinalNegotiationQcrVariationDto {
  @ApiProperty({
    example: "Variation A",
    description: "Issue of the QCR variation.",
  })
  @IsString({ message: "Issue must be a string." })
  @IsOptional()
  issue: string;
}

export class CreateFinalNegotiationSlaDto {
  @ApiProperty({ example: 259, description: "Service type ID for the SLA." })
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
  @IsInt({ message: "Service type ID must be an integer." })
  @IsOptional()
  @Min(1, {
    message: "Service type ID must be a positive number.",
  })
  serviceTypeId: number;

  @ApiProperty({ example: 30, description: "Number of days for the SLA." })
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
  @IsOptional()
  @IsInt({ message: "Number of days must be an integer." })
  @Min(1, {
    message: "Number of days must be a positive number.",
  })
  numberOfDays: number;
}

export class CreateFinalNegotiationActivityDto {
  @ApiProperty({
    description: "Opportunity Activity ID",
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
  @IsInt({ message: "Opportunity Activity id must be a number." })
  @IsNotEmpty({ message: "Opportunity Activity id is required." })
  @Min(1, {
    message: "Opportunity Activity id must be positive number.",
  })
  opportunityActivityId!: number;

  @ApiProperty({
    description: "Final Negotiation Meeting status ID",
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
    description: "Details of the meeting.",
    type: MeetingDetailsDto,
  })
  @IsNotEmpty({ message: "Meeting details are required." })
  @ValidateNested()
  @Type(() => MeetingDetailsDto)
  meetingDetails!: MeetingDetailsDto;

  @ApiProperty({
    type: PolicyDetailsDto,
    description: "Policy placement details.",
  })
  @IsNotEmpty({ message: "Policy details are required." })
  @ValidateNested()
  @Type(() => PolicyDetailsDto)
  policyDetails!: PolicyDetailsDto;

  @ApiProperty({
    type: selectFinalisedQuoteDto,
    description: "Finalised quote details.",
  })
  @ValidateNested()
  @Type(() => selectFinalisedQuoteDto)
  @IsNotEmpty({ message: "Finalised quote details are required" })
  selectFinalisedQuote!: selectFinalisedQuoteDto;

  @ApiProperty({
    type: netPremiumDetailsDto,
    description: "Finalised quote details.",
  })
  @ValidateNested()
  @Type(() => netPremiumDetailsDto)
  @IsNotEmpty({ message: "Finalised quote details are required" })
  netPremiumDetails!: netPremiumDetailsDto;

  @ApiProperty({
    type: [CreateQuoteTaxDetailsDto],
    description: "Finalised quote tax details.",
  })
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteTaxDetailsDto)
  @IsOptional() // need to change
  // @IsNotEmpty({ message: "Finalised quote tax details are required" })
  quoteTaxDetails?: CreateQuoteTaxDetailsDto[];

  @ApiProperty({
    type: [CreateFinalNegotiationSharingDetailDto],
    description: "Details of sharing (optional).",
  })
  @IsOptional()
  @IsArray({ message: "Sharing details must be an array." })
  @ValidateNested({ each: true })
  @Type(() => CreateFinalNegotiationSharingDetailDto)
  insurerDetails?: CreateFinalNegotiationSharingDetailDto[];

  @ApiProperty({
    type: [CreateFinalNegotiationQcrVariationDto],
    description: "Details of QCR variations (optional).",
  })
  @IsOptional()
  @IsArray({ message: "QCR variations must be an array." })
  @ValidateNested({ each: true })
  @Type(() => CreateFinalNegotiationQcrVariationDto)
  variationIssuesFromQCR?: CreateFinalNegotiationQcrVariationDto[];

  @ApiProperty({
    type: OtherCommentsFromInsurerDto,
    description: "Other comments from insurer.",
  })
  @ValidateNested()
  @Type(() => OtherCommentsFromInsurerDto)
  @IsOptional()
  otherCommentsFromInsurer?: OtherCommentsFromInsurerDto;

  @ApiProperty({
    type: OtherCommentsFromInsurerDto,
    description: "remarks",
  })
  @ValidateNested()
  @Type(() => OtherCommentsFromInsurerDto)
  @IsOptional()
  remarks?: OtherCommentsFromInsurerDto;

  @ApiProperty({
    type: CreateMeetingSummarytDto,
    description: "meeting summary",
  })
  @ValidateNested()
  @Type(() => CreateMeetingSummarytDto)
  @IsOptional()
  meetingSummary?: CreateMeetingSummarytDto;

  @ApiProperty({
    type: [CreateFinalNegotiationSlaDto],
    description: "Details of SLA (optional).",
  })
  @IsOptional()
  @IsArray({ message: "SLA details must be an array." })
  @ValidateNested({ each: true })
  @Type(() => CreateFinalNegotiationSlaDto)
  insurerServiceLevelAgreement?: CreateFinalNegotiationSlaDto[];

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

  @ApiProperty({
    description: "Final Negotiation meeting Participants",
    type: ParticipantsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ParticipantsDto)
  participants?: ParticipantsDto;

  @ApiPropertyOptional({
    description: "Covers mapping (cover ID to description).",
  })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  covers?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Finalised quote documents",
  })
  @IsOptional()
  @IsArray({ message: "Finalised quote documents must be an object." })
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  quoteDocuments?: OpportunityActivityDocumentDto[];

  @ApiPropertyOptional({
    description: "Final Negotiation Meeting documents",
    type: [OpportunityActivityDocumentDto],
  })
  @IsOptional()
  @IsArray({ message: "Final Negotiation Meeting documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  documents?: OpportunityActivityDocumentDto[];

  @IsOptional()
  createdBy?: number;

  @IsOptional()
  updatedBy?: number;

  @IsEnum(
    [
      "SAVE_ACTIVITY",
      "COMPLETE_ACTIVITY",
      "SUBMIT_ACTIVITY",
      "APPROVE_ACTIVITY",
      "REJECT_ACTIVITY",
    ],
    {
      message: `Activity Status Key must be either "SAVE_ACTIVITY"
      | "COMPLETE_ACTIVITY"
      | "SUBMIT_ACTIVITY"
      | "APPROVE_ACTIVITY"
      | "REJECT_ACTIVITY".`,
    }
  )
  activityStatusKey!:
    | "SAVE_ACTIVITY"
    | "COMPLETE_ACTIVITY"
    | "SUBMIT_ACTIVITY"
    | "APPROVE_ACTIVITY"
    | "REJECT_ACTIVITY";
}

export class UpdateFinalNegotiationActivityDto extends PartialType(
  CreateFinalNegotiationActivityDto
) {}
