import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

class DocumentDto {
  @IsOptional()
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
  @IsNumber({}, { message: "Document ID must be a number." })
  documentId?: number;

  @IsOptional()
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
  @IsNumber({}, { message: "Document type must be a number." })
  documentTypeLid?: number;
}

class UpdateQuoteDocumentsDto {
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

  @IsOptional()
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
  @IsNumber({}, { message: "Document ID must be a number." })
  documentId?: number;

  @IsOptional()
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
  @IsNumber({}, { message: "Document type must be a number." })
  documentTypeLid?: number;
}

class QuoteTaxDetailDto {
  @IsNotEmpty({ message: "Tax is required" })
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
  @IsNumber({}, { message: "Tax must be a number." })
  tax!: number;

  @IsNotEmpty({ message: "Tax value is required" })
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
  @IsNumber({}, { message: "Tax Value must be a number." })
  taxValue!: number;
}

class RemarksSectionDto {
  @IsOptional()
  @IsString({ message: "Remarks must be a string." })
  remarks?: string;
}

class QuoteDetailsDto {
  @IsNotEmpty({ message: "Insurer ID is required." })
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
  @IsNumber({}, { message: "Insurer ID must be a number." })
  insurerId!: number;

  @IsOptional()
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
  @IsNumber({}, { message: "Insurer Location ID must be a number." })
  insurerLocationId?: number;

  @IsOptional()
  @IsDateString(
    {},
    { message: "Quote Received On must be a valid date string." }
  )
  quoteReceivedOn?: string;

  @IsOptional()
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
  @IsNumber({}, { message: "Basic Premium must be a number." })
  basicPremium?: number;

  @IsOptional()
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
  @IsNumber({}, { message: "Terrorism Cover must be a number." })
  terrorism?: number;

  @ApiPropertyOptional({
    example: 11800.0,
    description: "Net Premium amount (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Net Premium must be a number." })
  @Min(0, { message: "Net Premium must be a non-negative number." })
  netPremium?: number;

  // @ApiPropertyOptional({
  //   example: 12.5,
  //   description: "Brokerage Percentage (optional).",
  // })
  // @IsOptional()
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
  // @IsNumber({}, { message: "Brokerage Percent must be a number." })
  // @Min(0, {
  //   message: "Brokerage Percent must be a non-negative number.",
  // })
  // @Max(100, {
  //   message: "Brokerage Percent cannot exceed 100.",
  // })
  // brokeragePercent?: number;

  // @ApiPropertyOptional({
  //   example: 5,
  //   description: "Basic Premium Percentage (optional).",
  // })
  // @IsOptional()
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
  // @IsNumber({}, { message: "Basic Premium Percentage must be a number." })
  // basicPremiumPercentage?: number;

  @ApiPropertyOptional({
    example: 12.5,
    description: "Basic Brokerage Percentage (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Basic Brokerage Percentage must be a number." })
  @Min(0, {
    message: "Basic Brokerage Percentage must be a non-negative number.",
  })
  @Max(100, {
    message: "Basic Brokerage Percentage cannot exceed 100.",
  })
  basicBrokeragePercentage?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "SRCC Percentage (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "SRCC Percentage must be a number." })
  srccPercentage?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "SRCC Amount (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "SRCC Amount must be a number." })
  srccAmount?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "SRCC Brokerage Amount (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "SRCC Brokerage Amount must be a number." })
  srccBrokerageAmount?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Terrorism Brokerage Percentage (optional).",
  })
  @IsOptional()
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

  @ApiPropertyOptional({
    example: 1500,
    description: "Total Brokerage Amount (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Brokerage Amount must be a number." })
  @Min(0, { message: "Brokerage Amount must be a non-negative number." })
  brokerageAmount?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "GST Percentage (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "GST Percentage must be a number." })
  gstPercentage?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "GST Amount (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "GST Amount must be a number." })
  gstAmount?: number;

  // @ApiPropertyOptional({
  //   example: 500,
  //   description: "Total Gross Premium Inc Tax (optional).",
  // })
  // @IsOptional()
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
  // @IsNumber({}, { message: "Total Gross Premium Inc Tax must be a number." })
  // totalGrossPremiumIncTax?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Fee Percentage (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Fee Percentage must be a number." })
  feePercentage?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Fee (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Fee must be a number." })
  fee?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Other Percentage (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Other Percentage must be a number." })
  otherPercentage?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Other (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Other must be a number." })
  other?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Admin Charges Percentage (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Admin Charges Percentage must be a number." })
  adminChargesPercentage?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Admin Charges (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Admin Charges must be a number." })
  adminCharges?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Cess Percentage (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Cess Percentage must be a number." })
  cessPercentage?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Cess Amount (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Cess Amount must be a number." })
  cessAmount?: number;

  // @ApiPropertyOptional({
  //   example: 500,
  //   description: "Total Gross Premium Inc Tax Charges (optional).",
  // })
  // @IsOptional()
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
  // @IsNumber(
  //   {},
  //   { message: "Total Gross Premium Inc Tax Charges must be a number." }
  // )
  // totalGrossPremiumIncTaxCharges?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Gross Premium (optional).",
  })
  @IsOptional()
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
  @IsNumber({}, { message: "Gross Premium must be a number." })
  grossPremium?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Total Brokerage Amount (optional).",
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
  @IsNumber({}, { message: "Total Brokerage Amount must be a number." })
  totalBrokerageAmount?: number;
}

export class NetPremiumDetailsDto {
  @IsOptional()
  @IsString({ message: "Insurer Remarks must be a string." })
  insurerRemarks?: string;
}

export class CreateQuoteDto {
  @IsNotEmpty({ message: "Opportunity ID is required." })
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
  @IsNumber({}, { message: "Opportunity ID must be a number." })
  opportunityId?: number;

  @IsNotEmpty({ message: "Opportunity Activity ID is required." })
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
  @IsNumber({}, { message: "Opportunity Activity ID must be a number." })
  opportunityActivityId?: number;

  @IsOptional()
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
  @IsNumber({}, { message: "Broking Slip ID must be a number." })
  brokingSlipId?: number;

  @ValidateNested()
  @Type(() => QuoteDetailsDto)
  quoteDetails!: QuoteDetailsDto;

  @IsOptional()
  @IsArray({ message: "Tax details must be an array." })
  @ValidateNested({ each: true })
  @Type(() => QuoteTaxDetailDto)
  taxDetails?: QuoteTaxDetailDto[];

  @ValidateNested()
  @Type(() => NetPremiumDetailsDto)
  netPremiumDetails!: NetPremiumDetailsDto;

  @IsOptional()
  @IsString({ message: "Attachment URL must be a string." })
  attachmentUrl?: string;

  @IsOptional()
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
  @IsNumber({}, { message: "Status ID must be a number." })
  statusId?: number;

  @IsOptional()
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
  @IsNumber({}, { message: "Created By must be a number." })
  createdBy?: number;

  @IsOptional()
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
  @IsNumber({}, { message: "Updated By must be a number." })
  updatedBy?: number;

  @IsOptional()
  @IsArray({ message: "Documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents?: DocumentDto[];

  @IsOptional()
  @IsObject({ message: "Covers must be an object." })
  covers?: Record<string, string>;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  mainDocuments?: DocumentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RemarksSectionDto)
  remarksSection?: RemarksSectionDto;

  @IsOptional()
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
  @IsNumber({}, { message: "Quote status must be a number." })
  quoteStatusLid?: number;

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

export interface QuoteInput {
  id: number | string;
  opportunityId: number | string;
  opportunityActivityId: number | string;
  brokingSlipId: number | string;
  insurer?: { insurerName?: string };
  insurerId: number | string;
  insurerLocationId?: number;
  quoteReceivedOn: string | Date;
  basicPremium: number | string;
  terrorism: number | string;
  basicBrokeragePercentage: number | null;
  srccPercentage: number | null;
  srccAmount: number | null;
  srccBrokerageAmount: number | null;
  terrorismBrokeragePercentage: number | null;
  tcBrokerageAmount: number | null;
  basicBrokerageAmount: number | null;
  totalBrokerageAmount: number | null;
  gstPercentage: number | null;
  gstAmount: number | null;
  // totalGrossPremiumIncTax: number | null;
  feePercentage: number | null;
  fee: number | null;
  otherPercentage: number | null;
  other: number | null;
  adminChargesPercentage: number | null;
  adminCharges: number | null;
  cessPercentage: number | null;
  cessAmount: number | null;
  grossPremium: number | null;
  taxDetails?: Array<{ taxLid: number | string; taxValue: number | string }>;
  netPremium?: number | string;
  insurerRemarks?: string;
  documentMappings?: Array<{ documentId: number | string }>;
  coverDetails?: Array<{
    coverMapId: number | string;
    insurerCoverResponse: string;
  }>;
}

export interface TransformedQuote {
  id: number;
  opportunityId: number;
  opportunityActivityId: number;
  brokingSlipId: number;
  insurerName: string | null;
  formData: {
    quoteDetails: {
      insurerId: number;
      insurerLocationId: number;
      quoteReceivedOn: Date;
      basicPremium: number;
      terrorism: number;
      netPremium: number | null;
      basicBrokeragePercentage: number | null;
    };
    taxDetails: Array<{ tax: number; taxValue: number }>;
    netPremiumDetails: {
      insurerRemarks: string | undefined;
    };
    documents: Array<{ documentId: number }>;
    covers: Record<string | number, string>;
  };
}

export class UpdateQuoteDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuoteDocumentsDto)
  mainDocuments?: UpdateQuoteDocumentsDto[];

  @ValidateNested()
  @Type(() => RemarksSectionDto)
  remarksSection!: RemarksSectionDto;

  @IsNotEmpty({ message: "Quote status is required." })
  @IsNumber({}, { message: "Quote status must be a number." })
  quoteStatusLid!: number;
}
