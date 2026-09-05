import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsArray,
  IsInt,
  Max,
  IsEnum,
  ValidateIf,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { InstallmentDetailDto } from "./create-placement-slip.dto";

export class PolicyDataWrongSectionDto {
  @ApiProperty({
    example: 0,
    description: "Flag indicating if policy data is wrong (1=Yes, 0=No)",
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
  @IsInt()
  policyDataWrongLid!: number;
}

export class DeviationSectionDto {
  @ApiProperty({
    example: "Policy amount discrepancy found",
    description: "Description of deviations",
    required: false,
  })
  @IsOptional()
  @IsString()
  deviations?: string;
}

export class PolicyDataRectifiedSectionDto {
  @ApiProperty({
    example: 1,
    description:
      "Flag indicating if policy data is reflected correctly (1=Yes, 0=No)",
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
  @IsOptional()
  @IsInt()
  policyDataRectifiedLid?: number;

  @ApiProperty({
    example: 3,
    description: "Resolution type ID",
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
  @IsOptional()
  @IsInt()
  resolutionLid?: number;

  // @ApiProperty({
  //   example: "15%",
  //   description: "Brokerage percentage",
  //   required: true,
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
  // @IsNumber({}, { message: "Brokerage percentage must be a number." })
  // brokeragePercentage?: number;

  // @ApiProperty({
  //   example: "100",
  //   description: "Brokerage amount",
  //   required: true,
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
  // @IsNumber({}, { message: "Brokerage amount must be a number." })
  // brokerageAmount?: number;

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
  @IsNumber({}, { message: "Basic premium must be a number." })
  basicPremium?: number;

  @ApiPropertyOptional({
    example: 9401,
    description: "Premium is installment based flag",
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
  @IsNumber({}, { message: "Premium installment flag must be a number." })
  isPremiumInstallmentBased?: number | null;

  @ApiPropertyOptional({
    example: 12345.67,
    description: "Total installment amount (net premium + other)",
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
  totalInstallmentAmount?: number | null;

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
    example: 5,
    description: "Basic brokerage percentage (optional).",
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
  @IsNumber({}, { message: "Basic brokerage percentage must be a number." })
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
    description: "Terrorism (optional).",
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
  @IsNumber({}, { message: "Terrorism must be a number." })
  terrorism?: number;

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
    description: "Total brokerage amount (optional).",
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
    example: 5,
    description: "GST percentage (optional).",
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
    description: "GST amount (optional).",
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
  @IsNumber({}, { message: "GST amount must be a number." })
  gstAmount?: number;

  @ApiPropertyOptional({
    example: 500,
    description: "Net premium (optional).",
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
  @IsNumber({}, { message: "Net premium must be a number." })
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

  @ApiPropertyOptional({
    example: 500,
    description: "Gross premium.",
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

  @ApiPropertyOptional({ example: 50000, description: "Total premium." })
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
  @IsNumber({}, { message: "Total Premium must be a number." })
  totalPremium?: number;

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
    example: "High priority case",
    description: "General remarks",
    required: false,
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class PolicyConfirmationDocumentDto {
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
  @IsInt()
  @IsNotEmpty()
  documentId!: number;
}

export class CreatePolicyConfirmationDto {
  @ApiProperty({
    example: 789,
    description: "Opportunity Activity ID",
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
  @IsInt()
  opportunityActivityId!: number;

  @ApiProperty({
    example: 789,
    description: "Status ID",
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
  @IsInt()
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

  @ValidateNested()
  @Type(() => PolicyDataWrongSectionDto)
  policyDataWrongSection!: PolicyDataWrongSectionDto;

  @ValidateNested()
  @Type(() => DeviationSectionDto)
  deviationSection!: DeviationSectionDto;

  @ValidateNested()
  @Type(() => PolicyDataRectifiedSectionDto)
  policyDataRectifiedSection!: PolicyDataRectifiedSectionDto;

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

  @ValidateNested()
  @Type(() => RemarksDto)
  remarks!: RemarksDto;

  @ApiProperty({
    type: [PolicyConfirmationDocumentDto],
    description: "Array of documents",
    required: false,
  })
  @IsOptional()
  @IsArray({ message: "Documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => PolicyConfirmationDocumentDto)
  documents?: PolicyConfirmationDocumentDto[];
}
