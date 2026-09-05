import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from "class-validator";

export class PolicyTpaDto {
  @ApiProperty({
    description: "TPA ID",
    example: 11,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: "tpaId is required" })
  tpaId!: number;

  @ApiProperty({
    description: "TPA Branch ID",
    example: 274423,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: "tpaBranchId is required" })
  tpaBranchId!: number;

  @ApiPropertyOptional({
    description: "TPA Contact ID",
    example: 101667,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  tpaContactId?: number;
}

export class PolicyInsurerDto {
  @ApiProperty({
    description: "Insurer Participation Type Lookup ID",
    example: 486,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: "insurerParticipationTypeLid is required" })
  insurerParticipationTypeLid!: number;

  @ApiProperty({
    description: "Insurer ID",
    example: 31398,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: "insurerId is required" })
  insurerId!: number;

  @ApiPropertyOptional({
    description: "Insurer Branch ID",
    example: 277253,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  insurerBranchId?: number;

  @ApiPropertyOptional({
    description: "Insurer Contact ID",
    example: 102869,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  insurerContactId?: number;
}

export class CreatePolicyDto {
  @ApiProperty({
    description: "Name of the policy",
    example: "PL Health",
  })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  @MaxLength(255, { message: "policyName must be at most 255 characters" })
  @IsNotEmpty({ message: "policyName is required" })
  policyName!: string;

  @ApiProperty({
    description: "Lookup ID for the policy type (e.g., GMC, GPA, GTL)",
    example: 15087,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: "policyTypeLid is required" })
  policyTypeLid!: number;

  @ApiProperty({
    description: "ID of the company associated with the policy",
    example: 266144,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: "companyId must be an integer" })
  companyId!: number;

  @ApiProperty({
    description: "Start date of the policy (YYYY-MM-DD)",
    example: "2025-10-10",
  })
  @IsNotEmpty({ message: "policyFrom is required" })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "policyFrom must be in the format YYYY-MM-DD.",
  })
  policyFrom!: string;

  @ApiProperty({
    description: "End date of the policy (YYYY-MM-DD)",
    example: "2028-10-10",
  })
  @IsNotEmpty({ message: "policyTo is required" })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "policyTo must be in the format YYYY-MM-DD.",
  })
  policyTo!: string;

  @ApiPropertyOptional({
    description: "ID of the opportunity associated with the policy",
    example: 123,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  opportunityId?: number;

  @ApiPropertyOptional({
    description: "Provisional policy number",
    example: "PP-123456",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "provisionalPolicyNo must be at most 255 characters",
  })
  @IsOptional()
  provisionalPolicyNo?: string;

  @ApiPropertyOptional({
    description: "Sum insured amount",
    example: 100000,
  })
  @IsOptional()
  sumInsured?: number;

  @ApiPropertyOptional({
    description: "Premium at inception",
    example: 1000,
  })
  @IsOptional()
  premiumAtInception?: number;

  @ApiPropertyOptional({
    description: "GST Percentage",
    example: 18,
  })
  @IsOptional()
  gstPercentage?: number;

  @ApiPropertyOptional({
    description: "GST amount",
    example: 180,
  })
  @IsOptional()
  gst?: number;

  @ApiPropertyOptional({
    description: "Insurer policy number",
    example: "IP-123456",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "insurerPolicyNumber must be at most 255 characters",
  })
  @IsOptional()
  insurerPolicyNumber?: string;

  @ApiPropertyOptional({
    description: "Basic brokerage percentage",
    example: 15,
  })
  @IsOptional()
  basicBrokeragePercentage?: number;

  @ApiPropertyOptional({
    description: "Commission for terrorism coverage",
    example: 5,
  })
  @IsOptional()
  commissionTerrorism?: number;

  @ApiPropertyOptional({
    description: "Lookup ID representing whether the policy is mined",
    example: 310,
  })
  @IsOptional()
  isPolicyMinedLid?: number;

  @ApiPropertyOptional({
    description: "Opportunity type",
    example: "SO",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(2, { message: "opportunityType must be at most 2 characters" })
  @IsOptional()
  opportunityType?: string;

  @ApiPropertyOptional({
    description: "Basic brokerage amount",
    example: 100,
  })
  @IsOptional()
  basicBrokerageAmount?: number;

  @ApiPropertyOptional({
    description: "Policy status ID",
    example: 1,
  })
  @IsOptional()
  policyStatusLid?: number;

  @ApiPropertyOptional({
    description: "Country ID",
    example: 1,
  })
  @IsOptional()
  countryId?: number;

  @ApiPropertyOptional({
    description: "Insurer endorsement number",
    example: "IEN-123456",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @MaxLength(255, {
    message: "insurerEndorsementNumber must be at most 255 characters",
  })
  @IsOptional()
  insurerEndorsementNumber?: string;

  @ApiPropertyOptional({
    description: "Income month",
    example: "2024-01-01",
  })
  @IsOptional()
  incomeMonth?: Date;

  @ApiPropertyOptional({
    description: "Date of income",
    example: "2024-01-01",
  })
  @IsOptional()
  dateOfIncome?: Date;

  @ApiPropertyOptional({
    description: "GST amount",
    example: 100,
  })
  @IsOptional()
  gstAmount?: number;

  @ApiPropertyOptional({
    description: "Net premium amount",
    example: 900,
  })
  @IsOptional()
  netPremium?: number;

  @ApiPropertyOptional({
    description: "Terrorism amount",
    example: 50,
  })
  @IsOptional()
  terrorismAmount?: number;

  @ApiPropertyOptional({
    description: "Other amount",
    example: 100,
  })
  @IsOptional()
  otherAmount?: number;

  @ApiPropertyOptional({
    description: "Gross premium amount",
    example: 1000,
  })
  @IsOptional()
  grossPremium?: number;

  @ApiPropertyOptional({
    description: "Brokerage amount as per Iwork",
    example: 100,
  })
  @IsOptional()
  brokerageAmountAsperIwork?: number;

  @ApiPropertyOptional({
    description: "Brokerage amount as per Isg",
    example: 100,
  })
  @IsOptional()
  brokerageAmountAsperIsg?: number;

  @ApiPropertyOptional({
    description: "Fee amount",
    example: 100,
  })
  @IsOptional()
  feeAmount?: number;

  @ApiPropertyOptional({
    description: "RCON status",
    example: "Mapped",
  })
  @IsOptional()
  rconStatus?: string;

  @ApiPropertyOptional({
    description: "RCON brokerage amount",
    example: 0,
  })
  @IsOptional()
  rconBrokerage?: number;

  @ApiPropertyOptional({
    description: "RCON outcome",
    example: "Exact Match",
  })
  @IsOptional()
  rconOutcome?: string;

  @ApiPropertyOptional({
    description: "Pending brokerage amount",
    example: 0,
  })
  @IsOptional()
  pendingBrokerage?: number;

  @ApiPropertyOptional({
    description: "OD percentage",
    example: 5,
  })
  @IsOptional()
  odPercentage?: number;

  @ApiPropertyOptional({
    description: "TP percentage",
    example: 5,
  })
  @IsOptional()
  tpPercentage?: number;

  @ApiPropertyOptional({
    description: "Net percentage",
    example: 5,
  })
  @IsOptional()
  netPercentage?: number;

  @ApiPropertyOptional({
    description: "Share percentage",
    example: 5,
  })
  @IsOptional()
  sharePercentage?: number;

  @ApiPropertyOptional({
    description: "Terrorism percentage",
    example: 5,
  })
  @IsOptional()
  terrorismBrokeragePercentage?: number;

  @ApiPropertyOptional({
    description: "Income type ID",
    example: 18112,
  })
  @IsOptional()
  incomeTypeLid?: number;

  @ApiPropertyOptional({
    description: "Deal confirmed ID",
    example: 17101,
  })
  @IsOptional()
  dealConfirmedLid?: number;

  @ApiPropertyOptional({
    description: "Policy group type ID",
    example: 0,
  })
  @IsOptional()
  policyGroupTypeLid?: number;

  @ApiPropertyOptional({
    description: "Policy TPA",
    type: [PolicyTpaDto],
  })
  @IsOptional()
  @Type(() => PolicyTpaDto)
  policyTpas?: PolicyTpaDto[];

  @ApiPropertyOptional({
    description: "Policy Insurers",
    type: [PolicyInsurerDto],
  })
  @IsOptional()
  @Type(() => PolicyInsurerDto)
  policyInsurers?: PolicyInsurerDto[];
}

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {}
