import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";

export class PremiumAndBrokerageDetailsDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Premium at Inception must be a number." })
  premiumAtInception?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Net Premium must be a number." })
  netPremium?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Gross Premium must be a number." })
  grossPremium?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Premium Collected must be a number." })
  premiumCollected?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "GST Percentage must be a number." })
  gstPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "GST Amount must be a number." })
  gstAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "GST must be a number." })
  gst?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Terrorism Brokerage Percentage must be a number." })
  terrorismBrokeragePercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Terrorism Amount must be a number." })
  terrorismAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "TC Brokerage Amount must be a number." })
  tcBrokerageAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Basic Brokerage Amount must be a number." })
  basicBrokerageAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Other Amount must be a number." })
  otherAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Basic Brokerage Percentage must be a number." })
  basicBrokeragePercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Brokerage Collected must be a number." })
  brokerageCollected?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Brokerage Amount as per Iwork must be a number." })
  brokerageAmountAsperIwork?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Brokerage Amount as per Isg must be a number." })
  brokerageAmountAsperIsg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Fee Amount must be a number." })
  feeAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "OD Percentage must be a number." })
  odPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "TP Percentage must be a number." })
  tpPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Net Percentage must be a number." })
  netPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Share Percentage must be a number." })
  sharePercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "SRCC Percentage must be a number." })
  srccPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "SRCC Amount must be a number." })
  srccAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "SRCC Brokerage Amount must be a number." })
  srccBrokerageAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Fee Percentage must be a number." })
  feePercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Other Percentage must be a number." })
  otherPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Admin Charges Percentage must be a number." })
  adminChargesPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Admin Charges must be a number." })
  adminCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Cess Percentage must be a number." })
  cessPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Cess Amount must be a number." })
  cessAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Basic Premium must be a number." })
  basicPremium?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Total Brokerage Amount must be a number." })
  totalBrokerageAmount?: number;
}

export class EmployeeDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  empId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  branch?: string;
}

export class LookUpDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  lookUpValue?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  lookUpKey?: string | null;
}

export class CountryDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  code?: string | null;
}

export class BasicDetailsDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  policyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  policyType?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyType?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  policyFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  policyTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  dateOfBusiness?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  businessMonth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  provisionalPolicyNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sumInsured?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  endorsementFrequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isEnrolmentPremiumBased?: number;

  @ApiPropertyOptional({ type: () => EmployeeDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeDTO)
  owner?: EmployeeDTO;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  businessType?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  insurerPolicyNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  isMined?: number;

  @ApiPropertyOptional({ type: () => EmployeeDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeDTO)
  policyCreatedBy?: EmployeeDTO;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  policyCreatedAt?: string;

  @ApiPropertyOptional({ type: () => EmployeeDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeDTO)
  policyUpdatedBy?: EmployeeDTO;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  policyUpdatedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  incomeMonth?: string;

  @ApiPropertyOptional({ type: () => LookUpDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => LookUpDTO)
  incomeType?: LookUpDTO;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  dateOfIncome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  policyGroup?: number;

  @ApiPropertyOptional({ type: () => LookUpDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => LookUpDTO)
  policyStatus?: LookUpDTO;

  @ApiPropertyOptional({ type: () => LookUpDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => LookUpDTO)
  configurationStatus?: LookUpDTO;

  @ApiPropertyOptional({ type: () => CountryDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => CountryDTO)
  country?: CountryDTO;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  opportunityId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  companyId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  opportunityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  amId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isgId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  policyTypeLookUpValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  companyTypeLookUpValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  isPolicyMinedLookUpValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  businessTypeLookUpValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  policyGroupLookUpValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  ownerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  ownerMobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  updatedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  createdAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  updatedAt?: string;
}

export class RconDetailsDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  rconStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rconBrokerage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  rconOutcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pendingBrokerage?: number;
}

export class PremiumInstallmentDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in the format YYYY-MM-DD.",
  })
  installmentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  installmentAmount?: number;
}

export class UpdatePolicyDTO {
  @ApiPropertyOptional({ type: () => PremiumAndBrokerageDetailsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => PremiumAndBrokerageDetailsDTO)
  premiumAndBrokerageDetails?: PremiumAndBrokerageDetailsDTO;

  @ApiPropertyOptional({ type: () => BasicDetailsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => BasicDetailsDTO)
  basicDetails?: BasicDetailsDTO;

  @ApiPropertyOptional({ type: () => RconDetailsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => RconDetailsDTO)
  rconDetails?: RconDetailsDTO;

  @ApiPropertyOptional({ type: () => [PremiumInstallmentDTO] })
  @IsOptional()
  @IsArray({ message: "Premium Installments must be an array." })
  @ValidateNested({ each: true })
  @Type(() => PremiumInstallmentDTO)
  premiumInstallments?: PremiumInstallmentDTO[];
}
