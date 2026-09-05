import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class EnrollmentChoiceDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  sumInsured!: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  premium!: number;

  @ApiProperty({ example: 800 })
  @IsNumber()
  companyPay!: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  employeePay!: number;

  @ApiProperty({ example: "base" })
  @IsString()
  policyComponentActionType!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  policyComponentActionTypeId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  parentpolicyComponentActionTypeId?: number;

  @ApiPropertyOptional({ example: "Base label" })
  @IsOptional()
  @IsString()
  policyComponentActionLabel?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  premiumPerLife?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  proRationEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  sumInsuredPerLife?: boolean;

  @ApiPropertyOptional({ example: "MULTIPLE" })
  @IsOptional()
  @IsString()
  sumInsuredModel?: string;

  @ApiPropertyOptional({ example: "Salary Multiple" })
  @IsOptional()
  @IsString()
  sumInsuredModelProperty?: string;

  
  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  minSumInsuredValue?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  maxSumInsuredValue?: number;

  @ApiPropertyOptional({ type: [Number], example: [12, 13] })
  @IsOptional()
  @IsArray()
  coveredDependentIds?: number[];

  // Already prorated by the frontend (same per-life/self-only logic used for
  // every on-screen premium display) — the backend stores these as given
  // rather than recomputing, so the saved record can never disagree with
  // what the employee actually saw before confirming. Omitted (or equal to
  // premium/companyPay/employeePay) whenever proration doesn't apply.
  @ApiPropertyOptional({ example: 750 })
  @IsOptional()
  @IsNumber()
  proratedPremium?: number;

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @IsNumber()
  proratedCompanyPay?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  proratedEmployeePay?: number;
}

export class CombinedEnrollmentChoiceDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  policyId!: number;

  @ApiProperty({ example: "GMC policy" })
  @IsString()
  policyName!: string;

  @ApiPropertyOptional({ type: [EnrollmentChoiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnrollmentChoiceDto)
  choices?: EnrollmentChoiceDto[];
}
