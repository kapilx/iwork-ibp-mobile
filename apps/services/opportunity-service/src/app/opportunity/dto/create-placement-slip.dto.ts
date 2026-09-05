import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
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

export class PlacementSlipDocumentDto {
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
export class InstallmentDateDto {
  @IsOptional()
  id?: number;

  @ApiProperty({ example: "2025-06-06" })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsNotEmpty({ message: "First installment date is required." })
  firstInstallmentDate!: string;

  @ApiProperty({ example: 2000.12 })
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
  @IsNumber()
  @IsNotEmpty({ message: "Installment amount is required." })
  installmentAmount!: number;
}

export class InstallmentDetailDto {
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 12345 })
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
  opportunityActivityId?: number;

  @ApiProperty({ example: "2025-06-06" })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsNotEmpty({ message: "Installment date is required." })
  installmentDate!: string;

  @ApiProperty({ example: 2000.12 })
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
  @IsNumber()
  @IsNotEmpty({ message: "Installment net amount is required." })
  installmentNetAmount!: number;

  @ApiPropertyOptional({ example: "1" })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @IsOptional()
  @IsString()
  installmentNo?: string;

  @ApiPropertyOptional({ example: 1 })
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
  installmentSequence?: number;

  @ApiProperty({ example: 25 })
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
  @IsNumber()
  @IsNotEmpty({ message: "Installment percentage is required." })
  installmentPercentage!: number;

  @ApiPropertyOptional({ example: 18 })
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
  @IsNumber()
  taxPercentage?: number;

  @ApiPropertyOptional({ example: 360 })
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
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional({ example: 2360.12 })
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
  @IsNumber()
  installmentGrossAmount?: number;

  @ApiPropertyOptional({ example: 8401 })
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
  modeOfPayment?: number;
}

export class TPAMapDto {
  @IsOptional()
  id?: number;

  @IsOptional()
  placementSlipId?: number;

  @ApiProperty({ example: 101, description: "Unique identifier for the TPA." })
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
  @IsInt()
  @IsNotEmpty({ message: "TPA ID is required." })
  tpaId!: number;

  @ApiProperty({
    example: 201,
    description: "Unique identifier for the TPA location.",
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
  @IsInt()
  @IsNotEmpty({ message: "TPA Location ID is required." })
  tpaLocationId!: number;

  @ApiProperty({
    example: 301,
    description: "Unique identifier for the TPA branch.",
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
  @IsInt()
  @IsNotEmpty({ message: "TPA Branch ID is required." })
  tpaBranchId!: number;

  @ApiProperty({
    example: 401,
    description: "Unique identifier for the TPA contact.",
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
  tpaContactId?: number;
}

export class InsurerMapDto {
  @IsOptional()
  id?: number;

  @IsOptional()
  placementSlipId?: number;

  @ApiProperty({
    example: 201,
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
  @IsInt()
  @IsNotEmpty({ message: "Insurer ID is required." })
  insurerId!: number;

  @ApiProperty({
    example: 301,
    description: "Unique identifier for the insurer location.",
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
  @IsInt()
  @IsNotEmpty({ message: "Insurer Location ID is required." })
  insurerLocationId!: number;

  @ApiProperty({
    example: 401,
    description: "Unique identifier for the insurer branch.",
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
  @IsInt()
  @IsNotEmpty({ message: "Insurer Branch ID is required." })
  insurerBranchId!: number;

  @ApiProperty({
    example: 501,
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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @IsNotEmpty({ message: "Insurer Contact ID is required." })
  insurerContactId!: number;

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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNotEmpty({ message: "Is Lead Insurer value is required." })
  @IsInt()
  isLeadInsurer!: number;

  @ApiProperty({
    example: 25.5,
    description: "Percentage of sharing allocated to the office.",
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
  @IsNotEmpty({ message: "Share Percentage is required." })
  @IsNumber()
  sharePercentage!: number;

  @ApiProperty({
    example: 1000,
    description: "Share amount allocated to the office.",
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
  @IsNotEmpty({ message: "Share Amount is required." })
  @IsNumber()
  shareAmount!: number;

  @ApiProperty({
    example: 12.5,
    description: "Brokerage percentage allocated to the office.",
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
  @IsNotEmpty({ message: "Brokerage Percentage is required." })
  @IsNumber()
  @Max(100, { message: "Brokerage percentage cannot exceed 100." })
  brokeragePercentage!: number;

  @ApiProperty({
    example: 1000,
    description: "Brokerage amount allocated to the office.",
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
  @IsNotEmpty({ message: "Brokerage Amount is required." })
  @IsNumber()
  brokerageAmount!: number;

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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber({}, { message: "Terrorism share percentage must be a number." })
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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber({}, { message: "Terrorism share amount must be a number." })
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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber({}, { message: "Terrorism brokerage percentage must be a number." })
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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber({}, { message: "Terrorism brokerage amount must be a number." })
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
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber({}, { message: "Total brokerage amount must be a number." })
  @Min(0, {
    message: "Total brokerage amount must be a non-negative number.",
  })
  totalBrokerageAmount?: number;
}

export class CDDetailDto {
  @IsOptional()
  id?: number;

  @ApiProperty({
    example: 1,
    description: "Type of payment type.",
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
  @IsInt()
  @IsNotEmpty({ message: "Payment Type ID is required." })
  paymentTypeLid!: number;

  @ApiProperty({
    example: 1,
    description: "Type of CD account.",
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
  @IsOptional({ message: "CD Account Type ID is required." })
  @IsInt()
  cdAccountTypeLid?: number;

  @ApiProperty({
    example: "Saving Account",
    description: "Type of Account name",
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({
    example: "0201 1001 0011 0923",
    description: "CD Account Number",
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ example: 78, description: "Open balance" })
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
  @IsNumber()
  openBalance?: number;

  @ApiProperty({ example: 10, description: "CD safe limit" })
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
  @IsNumber()
  cdSafeLimit?: number;

  @ApiProperty({ example: 78, description: "Selected CD Account" })
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
  @IsNumber()
  selectCdAccount?: number;

  @ApiProperty({ example: 440, description: "Transaction Type" })
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
  transactionTypeLid?: number;

  @ApiProperty({
    example: "2023-10-01",
    description: "Cheque Date",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsNotEmpty({ message: "Cheque Date is required." })
  chequeDate!: Date;

  @ApiProperty({
    example: 1000.5,
    description: "Amount associated with the cheque.",
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
  @IsNumber()
  @IsNotEmpty({ message: "Cheque Amount is required." })
  chequeAmount!: number;

  @ApiProperty({
    example: "123456",
    description: "Cheque number.",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @IsNotEmpty({ message: "Cheque Number is required." })
  chequeNumber!: string;

  @ApiProperty({
    example: "Bank of America",
    description: "Name of the bank.",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  @IsNotEmpty({ message: "Bank Name is required." })
  bankName!: string;

  @ApiProperty({
    example: "Cheque issued for premium adjustment",
    description: "Remarks for CD details.",
    required: false,
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class PolicyDetailsDto {
  @ApiProperty({
    example: "2025-06-01",
    description: "Start date of the policy.",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsNotEmpty({ message: "Policy start date is required." })
  policyFromDate!: string;

  @ApiProperty({
    example: "2026-05-31",
    description: "End date of the policy.",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsNotEmpty({ message: "Policy end date is required." })
  policyToDate!: string;

  @ApiProperty({ example: 1000000, description: "Total sum insured." })
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
  @IsNumber()
  @IsNotEmpty({ message: "Sum insured is required." })
  sumInsured!: number;

  @ApiProperty({ example: 50000, description: "Basic premium amount." })
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
  @IsNumber()
  @IsNotEmpty({ message: "Basic premium is required." })
  basicPremium!: number;

  @ApiProperty({
    example: "2025-05-29",
    description: "Date of the placement slip.",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsNotEmpty({ message: "Placement slip date is required." })
  placementSlipDate!: string;

  @ApiProperty({ example: 2000, description: "Fee amount." })
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
  @IsNumber()
  @IsNotEmpty({ message: "Fee amount is required." })
  fee!: number;

  @ApiPropertyOptional({ example: 20, description: "Fee percentage." })
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

  @ApiPropertyOptional({ example: 5, description: "Basic premium percentage." })
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
  basicPremiumPercentage?: number;

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
    example: 500,
    description: "Terrorism premium (optional).",
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
  @IsNumber({}, { message: "Terrorism premium must be a number." })
  terrorism?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Net premium (optional).",
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

  @ApiPropertyOptional({
    example: 5,
    description: "Percentage of terrorism commission.",
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
  @IsNumber({}, { message: "Terrorism brokerage percentage must be a number." })
  @Max(100, { message: "Terrorism brokerage percentage cannot exceed 100." })
  @IsOptional()
  terrorismBrokeragePercentage?: number | null;

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

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
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

  // @ApiPropertyOptional({
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
    example: 18,
    description: "GST tax percentage.",
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
  @IsNumber()
  @IsNotEmpty({ message: "GST tax percentage is required." })
  @Max(100, { message: "GST tax percentage cannot exceed 100." })
  gstPercentage!: number;

  @ApiProperty({
    example: 9000,
    description: "GST tax amount.",
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
  @IsNumber()
  @IsNotEmpty({ message: "GST tax amount is required." })
  gstAmount!: number;

  @ApiPropertyOptional({
    example: 1000,
    description: "Other amount (optional).",
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
  @IsNumber({}, { message: "Other amount must be a number." })
  other?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Other percentage (optional).",
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
  @IsNumber({}, { message: "Other percentage must be a number." })
  otherPercentage?: number;

  @ApiPropertyOptional({
    example: 105000,
    description: "Total installment amount (optional).",
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
  @IsNumber({}, { message: "Total installment amount must be a number." })
  totalInstallmentAmount?: number;

  // @ApiProperty({
  //   example: 59000,
  //   description: "Total premium amount.",
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
  // @ValidateIf((_, value) => value !== null && value !== undefined)
  // @IsNumber()
  // @IsNotEmpty({ message: "Total premium is required." })
  // totalPremium!: number;

  // @ApiProperty({
  //   example: 12.5,
  //   description: "Brokerage percentage.",
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
  // @IsNumber()
  // @Max(100, { message: "Brokerage percentage cannot exceed 100." })
  // brokeragePercentage?: number;

  @ApiProperty({
    example: 12.5,
    description: "Basic brokerage percentage.",
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
  @IsNumber()
  @Max(100, { message: "Basic brokerage percentage cannot exceed 100." })
  basicBrokeragePercentage?: number;

  // @ApiProperty({
  //   example: 1200,
  //   description: "Brokerage Amount.",
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
  // @ValidateIf((_, value) => value !== null && value !== undefined)
  // @IsNumber()
  // @IsNotEmpty({ message: "Brokerage amount is required." })
  // brokerageAmount!: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Total brokerage Amount (optional).",
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
  @IsNumber({}, { message: "Total brokerage Amount must be a number." })
  totalBrokerageAmount?: number | null;

  @ApiProperty({
    example: 1,
    description:
      "Indicates if premium is installment-based (1 for true, 0 for false).",
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
  @IsInt()
  @IsNotEmpty({ message: "Premium installment based is required." })
  isPremiumInstallmentBased!: number;
}

export class RemarksDto {
  @ApiProperty({
    example: "This is a sample placement slip.",
    description: "Additional remarks (optional).",
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
export class FeeDetailsDto {
  @ApiProperty({
    example: 0,
    description:
      "Indicates if fee is installment-based (1 for true, 0 for false).",
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
  @IsInt()
  @IsNotEmpty({ message: "Fee installment based is required." })
  isFeeInInstallment!: number;

  @ApiProperty({
    example: 999,
    description: "Unique identifier for the lead insurer.",
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
  leadInsurerId?: number;

  @ApiProperty({
    example: 1,
    description:
      "Indicates if the lead insurer pays commission (1 for true, 0 for false).",
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
  isLeadInsurerPayCommission?: number;

  @ApiProperty({
    example: 25,
    description: "Maximum age of dependents allowed.",
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
  maxAgeOfDependents?: number;

  @ApiProperty({
    example: 341,
    description: "Type of policy placement.(Single or multiple insurers)",
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
  policyPlacedTypeLid?: number;
}

export class CreatePlacementSlipDto {
  @ApiProperty({
    example: 391,
    description: "Unique identifier for the opportunity activity.",
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
  @IsInt({ message: "Opportunity Activity ID must be an integer." })
  @IsNotEmpty({ message: "Opportunity Activity ID is required." })
  opportunityActivityId!: number;

  @ApiProperty({
    example: 1,
    description: "Status (1 for submitted, 0 for not submitted).",
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
  @IsInt()
  @IsNotEmpty({ message: "Status is required." })
  statusLid!: number;

  @ApiProperty({ type: PolicyDetailsDto })
  @ValidateNested()
  @Type(() => PolicyDetailsDto)
  policyDetails!: PolicyDetailsDto;

  @ApiProperty({
    type: [InstallmentDateDto],
    description: "List of Installment Date.",
  })
  @ValidateNested({ each: true })
  @Type(() => InstallmentDateDto)
  @IsArray()
  @IsOptional()
  installmentDates?: InstallmentDateDto[];

  @ApiProperty({
    type: [InstallmentDetailDto],
    description: "List of Installment Details.",
  })
  @ValidateNested({ each: true })
  @Type(() => InstallmentDetailDto)
  @IsArray()
  @IsOptional()
  installmentDetails?: InstallmentDetailDto[];

  @ApiProperty({ type: FeeDetailsDto })
  @ValidateNested()
  @Type(() => FeeDetailsDto)
  feeDetails!: FeeDetailsDto;

  @ApiProperty({
    type: [InsurerMapDto],
    description: "List of insurer mappings.",
  })
  @ValidateNested({ each: true })
  @Type(() => InsurerMapDto)
  @IsArray()
  insurerDetails!: InsurerMapDto[];

  @ApiProperty({
    type: [TPAMapDto],
    description: "List of TPA mappings.",
  })
  @ValidateNested({ each: true })
  @Type(() => TPAMapDto)
  @IsArray()
  tpaDetails!: TPAMapDto[];

  @ApiProperty({
    type: CDDetailDto,
    description: "List of condition details.",
  })
  @ValidateNested()
  @Type(() => CDDetailDto)
  cdAccountDetails!: CDDetailDto;

  @ApiProperty({
    description: "Cover details as key-value pairs",
    example: {
      "101": "This is my policy data",
      "102": "This is my policy number",
      "103": "This is my policy name",
    },
  })
  @IsObject({ message: "coverDetails must be an object" })
  coverDetails!: Record<string, string>;

  @ApiProperty({ type: RemarksDto })
  @ValidateNested()
  @Type(() => RemarksDto)
  remarks!: RemarksDto;

  @ApiProperty({
    description: "Array of document objects",
    type: [PlacementSlipDocumentDto],
  })
  @IsOptional()
  @IsArray({ message: "Documents must be an array" })
  @ValidateNested({ each: true })
  @Type(() => PlacementSlipDocumentDto)
  documents?: PlacementSlipDocumentDto[];

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
