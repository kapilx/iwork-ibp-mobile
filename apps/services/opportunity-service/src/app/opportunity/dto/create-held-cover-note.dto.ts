import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
  IsArray,
  IsObject,
  IsNumber,
  Max,
  IsEnum,
  ValidateIf,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { InstallmentDetailDto } from "./create-placement-slip.dto";

export class PlacementSlipDeviationsDto {
  @ApiProperty({
    example: 1,
    description: "Placement Slip Deviations",
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
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsInt({ message: "Placement Slip Deviations must be an integer" })
  placementSlipDeviationsLid!: number;
}

export class DeviationsDto {
  @ApiProperty({
    example: "Policy Data amount is incorrect",
    description: "Enter Deviations",
  })
  @IsString({ message: "Enter Deviations must be a string" })
  @IsOptional()
  deviations?: string;
}

export class DeviationsAddressedDto {
  @ApiProperty({
    example: 1,
    description: "Deviations Addressed",
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
  @IsInt({ message: "Deviations Addressed must be an integer" })
  deviationsAddressedLid?: number;

  @ApiProperty({
    example: 1,
    description: "Resolution ID",
    nullable: true,
    required: false,
    type: Number,
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
  @IsInt({ message: "Resolution ID must be an integer" })
  resolutionLid?: number | null;

  @ApiProperty({
    example: 0,
    description: "Revised Held Cover Note",
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
  @IsInt({ message: "Revised Held Cover Note must be an integer" })
  revisedHeldCoverNoteLid?: number;
}

export class PremiumReceiptDetailsDto {
  @ApiProperty({
    example: 12,
    description: "Acknowledged By",
  })
  @IsOptional()
  @IsInt({ message: "Acknowledged By must be an integer" })
  acknowledgedBy?: number | null;

  @ApiProperty({
    example: "PO-1000",
    description: "Receipt No",
  })
  @IsOptional()
  @IsString({ message: "Receipt No must be a string" })
  receiptNo?: string;

  @ApiProperty({
    example: "2025-10-15",
    description: "Receipt Date",
  })
  @IsOptional()
  @IsString({ message: "Receipt date must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Receipt date must be in the format YYYY-MM-DD.",
  })
  receiptDate?: string;

  @ApiProperty({
    example: "2025-10-25",
    description: "All Documents Received Date",
  })
  @IsOptional()
  @IsString({ message: "All Documents Received Date must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "All Documents Received Date must be in the format YYYY-MM-DD.",
  })
  allDocumentsReceivedDate?: string;

  @ApiProperty({
    example: 12.5,
    description: "Basic brokerage percentage allocated to the office.",
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
  @IsNumber()
  basicBrokeragePercentage?: number;

  // @ApiProperty({
  //   example: 1000,
  //   description: "Brokerage amount allocated to the office.",
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
  // @IsNumber()
  // brokerageAmount?: number;

  @ApiProperty({
    example: 1000,
    description: "Total brokerage amount allocated to the office.",
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
  @IsNumber()
  totalBrokerageAmount?: number;

  @ApiPropertyOptional({
    example: 9401,
    description: "Premium is installment based lookup id.",
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
  @IsNumber()
  isPremiumInstallmentBased?: number | null;

  @ApiPropertyOptional({
    example: 120000.0,
    description: "Total installment amount (Net premium + other amount).",
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
  @IsNumber()
  totalInstallmentAmount?: number | null;

  @ApiPropertyOptional({
    example: 10000.0,
    description: "Basic premium amount (optional).",
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
  @IsNumber({}, { message: "Basic Premium must be a number." })
  basicPremium?: number;

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
  // @IsNumber({}, { message: "Basic brokerage Percentage must be a number." })
  // basicBrokeragePercentage?: number;

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
    description: "Terrorism Commission Percentage (optional).",
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
    description: "Terrorism premium (optional).",
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
  @IsNumber({}, { message: "Terrorism premium must be a number." })
  terrorism?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "TC Brokerage Amount (optional).",
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
  @IsNumber({}, { message: "TC Brokerage Amount must be a number." })
  tcBrokerageAmount?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Basic Brokerage Amount (optional).",
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
  @IsNumber({}, { message: "Basic Brokerage Amount must be a number." })
  basicBrokerageAmount?: number;

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
  //   description: "Total Net premium (optional).",
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
  // @IsNumber({}, { message: "Total Net Premium must be a number." })
  // totalNetPremium?: number;

  @ApiProperty({
    example: 1000,
    description: "Net premium allocated to the office.",
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
  @IsNumber()
  netPremium?: number;

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
  @ApiPropertyOptional({ example: 50000, description: "Gross premium." })
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
  @IsNumber({}, { message: "Gross premium must be a number." })
  grossPremium?: number;

  @ApiPropertyOptional({ example: 1000000, description: "Sum insured." })
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
  @IsNumber({}, { message: "Sum Insured must be a number." })
  sumInsured?: number;

  @ApiPropertyOptional({
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
  @IsInt()
  @IsOptional()
  policyPlacedTypeLid?: number;

  @ApiPropertyOptional({
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
  @IsInt()
  @IsOptional()
  leadInsurerId?: number;

  @ApiPropertyOptional({
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
  @IsInt()
  @IsOptional()
  isLeadInsurerPayCommission?: number;
}

export class InsurerDetailssDto {
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
  @ValidateIf((_, value) => value !== undefined && value !== null)
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
  @ValidateIf((_, value) => value !== undefined && value !== null)
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
  @ValidateIf((_, value) => value !== undefined && value !== null)
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
  @ValidateIf((_, value) => value !== undefined && value !== null)
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
  @IsOptional()
  @IsInt()
  isLeadInsurer?: number;

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
  @IsOptional()
  @IsNumber()
  @Max(100, { message: "Share percentage cannot exceed 100." })
  sharePercentage?: number;

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
  @IsOptional()
  @IsNumber()
  shareAmount?: number;

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
  @IsOptional()
  @IsNumber()
  // @Max(100, { message: "Brokerage percentage cannot exceed 100." })
  brokeragePercentage?: number;

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
  @IsOptional()
  @IsNumber()
  brokerageAmount?: number;

  @ApiProperty({
    example: 25.5,
    description:
      "Terrorism premium share percentage allocated to the office. Defaults to the premium share percentage when not supplied.",
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
  @Max(100, { message: "Terrorism share percentage cannot exceed 100." })
  terrorismSharePercentage?: number;

  @ApiProperty({
    example: 1000,
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
  @IsOptional()
  @IsNumber()
  terrorismShareAmount?: number;

  @ApiProperty({
    example: 1000,
    description: "Terrorism brokerage percentage allocated to the office.",
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
  terrorismBrokeragePercentage?: number;

  @ApiProperty({
    example: 1000,
    description: "Terrorism brokerage amount allocated to the office.",
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
  terrorismBrokerageAmount?: number;

  @ApiProperty({
    example: 1000,
    description: "Total brokerage amount allocated to the office.",
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
  totalBrokerageAmount?: number;
}

export class RemarksDto {
  @ApiProperty({
    example: "Key products",
    description: "Remarks",
  })
  @IsString({ message: "Remarks must be a string" })
  @IsOptional()
  remarks?: string;
}

export class HeldCoverNoteDocumentDto {
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
    example: 25,
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

export class CreateOpportunityHeldCoverNoteDto {
  @ApiProperty({
    example: 1,
    description: "Opportunity Activity ID(mandatory field)",
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
  opportunityActivityId!: number;

  @ApiProperty({
    example: 1,
    description: "Status",
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
  @IsInt({ message: "Status must be an integer" })
  statusLid!: number;

  @ApiProperty({
    description: "Activity Status Key",
    example: "SAVE_ACTIVITY",
  })
  @IsNotEmpty({ message: "Activity Status Key is required." })
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

  @ApiProperty({ type: PlacementSlipDeviationsDto })
  @ValidateNested()
  @Type(() => PlacementSlipDeviationsDto)
  placementSlipDeviationsSection!: PlacementSlipDeviationsDto;

  @ApiProperty({ type: DeviationsDto })
  @ValidateNested()
  @Type(() => DeviationsDto)
  deviationSection!: DeviationsDto;

  @ApiProperty({ type: DeviationsAddressedDto })
  @ValidateNested()
  @Type(() => DeviationsAddressedDto)
  deviationsAddressedSection!: DeviationsAddressedDto;

  @ApiProperty({ type: PremiumReceiptDetailsDto })
  @ValidateNested()
  @Type(() => PremiumReceiptDetailsDto)
  premiumReceiptDetailsSection!: PremiumReceiptDetailsDto;

  @ApiPropertyOptional({ type: [InstallmentDetailDto] })
  @ValidateNested({ each: true })
  @Type(() => InstallmentDetailDto)
  @IsArray()
  @IsOptional()
  installmentDetails?: InstallmentDetailDto[];

  @ApiPropertyOptional({ type: [InsurerDetailssDto] })
  @ValidateNested({ each: true })
  @Type(() => InsurerDetailssDto)
  @IsOptional()
  insurerDetails?: InsurerDetailssDto[];

  @ApiProperty({
    example: { "101": "value" },
    description: "Basic cover responses keyed by cover template ID",
    required: false,
  })
  @IsObject()
  @IsOptional()
  basicCovers?: Record<string, string>;

  @ApiProperty({ type: RemarksDto })
  @ValidateNested()
  @Type(() => RemarksDto)
  remarksSection!: RemarksDto;

  @ApiProperty({
    description: "Array of documents",
    type: [HeldCoverNoteDocumentDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "Documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => HeldCoverNoteDocumentDto)
  documents?: HeldCoverNoteDocumentDto[];

  @ApiProperty({
    example: 1,
    description: "Created By",
  })
  @IsOptional()
  @IsInt({ message: "Created By must be an integer" })
  createdBy?: number;

  @ApiProperty({
    example: 2,
    description: "Updated By",
  })
  @IsOptional()
  @IsInt({ message: "Updated By must be an integer" })
  updatedBy?: number;
}
