import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";

export class PlacementSlipDetailsDto {
  @ApiProperty({
    example: "2025-10-15",
    description: "Date of Issuance",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString({ message: "Date of Issuance must be a string." })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date of Issuance must be in the format YYYY-MM-DD.",
  })
  issuanceDate!: string;
}

export class ServiceLevelAgreementDto {
  @ApiProperty({
    example: 101,
    description: "Held cover note",
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
  heldCoverNote?: number;

  @ApiProperty({
    example: 102,
    description: "Policy document",
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
  policyDocument?: number;

  @ApiProperty({
    example: 103,
    description: "Policy docket reference",
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
  policyDocket?: number;

  @ApiProperty({
    example: 104,
    description: "Endorsement reference",
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
  endorsement?: number;

  @ApiProperty({
    example: 105,
    description: "Health claims reference",
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
  healthClaims?: number;

  @ApiProperty({
    example: 106,
    description: "Non-health claims reference",
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
  nonHealthClaims?: number;

  @ApiProperty({
    example: 107,
    description: "MIR reference",
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
  mir?: number;

  @ApiProperty({
    example: 108,
    description: "Monthly meeting reference",
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
  monthlyMeeting?: number;

  @ApiProperty({
    example: 109,
    description: "Quarterly meeting reference",
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
  quarterlyMeeting?: number;

  @ApiProperty({
    example: "Renewal Notice",
    description: "Renewal Notice",
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
  renewalNotice?: number;

  @ApiProperty({
    example: "Data Collection",
    description: "Data Collection",
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
  dataCollection?: number;

  @ApiProperty({
    example: "Additional remarks about the policy docket",
    description: "Remarks",
    required: false,
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreatePolicyDocketDto {
  @ApiProperty({
    example: 789,
    description: "Opportunity Activity ID",
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
  opportunityActivityId!: number;

  @ApiProperty({
    example: 1,
    description: "Status ID",
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
  statusLid!: number;

  @ValidateNested()
  @Type(() => PlacementSlipDetailsDto)
  placementSlipDetailsSection!: PlacementSlipDetailsDto;

  @ValidateNested()
  @Type(() => ServiceLevelAgreementDto)
  serviceLevelAgreementSection!: ServiceLevelAgreementDto;

  @IsOptional()
  @IsArray({ message: "Documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  documents?: OpportunityActivityDocumentDto[];

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

export class SavePolicyDocketDto extends PartialType(CreatePolicyDocketDto) {}
