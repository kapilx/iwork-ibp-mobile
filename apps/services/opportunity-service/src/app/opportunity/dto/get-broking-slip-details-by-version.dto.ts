import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class PreferredInsurerDetailsDto {
  @ApiProperty({ description: "Location Id of Insurer", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "Location Id must be a integer." })
  insurerLocationId: number;

  @ApiProperty({ description: "Branch Id of the Insurer", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "Branch Id must be a integer." })
  insurerBranchId: number;

  @ApiProperty({ description: "Insurer Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Insurer Id must be a integer." })
  insurerId: number;

  @ApiProperty({ description: "Contact id of Insurer", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "Contact Id must be a integer." })
  insurerContactId: number;
}

export class OptionalPreferredInsurerDetailsDto {
  @ApiProperty({ description: "Location Id of Insurer", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "Location Id must be a integer." })
  insurerLocationId?: number;

  @ApiProperty({ description: "Branch Id of the Insurer", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "Branch Id must be a integer." })
  insurerBranchId?: number;

  @ApiProperty({ description: "Insurer Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "Insurer Id must be a integer." })
  insurerId?: number;

  @ApiProperty({ description: "Contact id of Insurer", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "Contact Id must be a integer." })
  insurerContactId?: number;
}

export class PreferredTpaDetailsDto {
  @ApiProperty({ description: "Location Id of TPA", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "location Id must be a integer." })
  locationId?: number;

  @ApiProperty({ description: "Branch Id of the TPA", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "branch Id must be a integer." })
  branchId?: number;

  @ApiProperty({ description: "TPA Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "tpa Id must be a integer." })
  tpaId?: number;

  @ApiPropertyOptional({ description: "Contact id of TPA", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsInt({ message: "contact Id must be a integer." })
  contactId?: number;
}

export class BrokingSlipVersionMappedCoverDto {
  @ApiProperty({ description: "Cover Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "id must be a integer." })
  id: number;

  @ApiProperty({ description: "Opportunity Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "opportunity Id must be a integer." })
  opportunityId: number;

  @ApiProperty({ description: "Cover Map Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "cover map Id must be a integer." })
  coverMapId: number;

  @ApiProperty({ description: "Policy Type Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "policy type Id must be a integer." })
  policyTypeId: number;

  @ApiProperty({ description: "Broking Slip version Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "broking slip version id must be a integer." })
  brokingSlipVersionId: number;

  @ApiProperty({
    description: "Name of the cover mapped.",
    example: "Name of the cover",
  })
  @IsString({ message: "cover name must be a string." })
  coverName!: string;

  @ApiProperty({
    description: "Response of the cover mapped.",
    example: "Response of the cover",
  })
  @IsString({ message: "cover response must be a string." })
  coverResponse!: string;
}

export class BrokingSlipVersionData {
  @ApiProperty({ description: "Sum insured", example: 100000 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: "sum insured must be a number." })
  sumInsured: number;

  @ApiProperty({ description: "Basic premium", example: 1000 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsNumber({}, { message: "basic premium must be a number." })
  basicPremium?: number;

  @ApiProperty({ description: "Brokerage precentage", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsNumber({}, { message: "brokerage percentage must be a number." })
  brokeragePercentage?: number;

  @ApiProperty({ description: "Brokerage amount", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  @IsNumber({}, { message: "brokerage amount must be a number." })
  brokerageAmount?: number;

  @ApiProperty({ description: "policy start date", example: "2025-12-10" })
  @IsString({ message: "policy from must be a string." })
  policyFrom: string;

  @ApiProperty({ description: "policy end date", example: "2025-12-10" })
  @IsString({ message: "policy to must be a string." })
  policyTo: string;

  @ApiProperty({ description: "policy renewal date", example: "2025-12-10" })
  @IsString({ message: "policy renewal date must be a string." })
  renewalDate: string;

  @ApiProperty({ description: "Quote receipt timeline", example: "2025-12-10" })
  @IsString({ message: "quote receipt timeline must be a string." })
  quoteReceiptTimeline: string;

  @ApiProperty({ description: "Business Activity", example: "Manufacturing" })
  @IsString({ message: "business activity must be a string." })
  businessActivity: string;
}

export class BrokingSlipVersionFormData {
  @ApiProperty({
    description: "Broking slip version data",
    type: BrokingSlipVersionData,
  })
  @ValidateNested()
  @Type(() => BrokingSlipVersionData)
  versionDetails!: BrokingSlipVersionData;

  @ApiProperty({
    description: "Covers details",
  })
  @IsObject({
    message: "CoversConfig must be an object with cover IDs as keys",
  })
  coversConfig: Record<string, string>;
}
export class BrokingSlipVersionDetailsDto {
  @ApiProperty({ description: "Version Name", example: "Version 1" })
  @IsNotEmpty({ message: "Version name is required." })
  @IsString({ message: "Version name must be a string." })
  versionName: string;

  @ApiProperty({
    description: "Broking slip version form data",
    type: BrokingSlipVersionFormData,
  })
  @ValidateNested()
  @Type(() => BrokingSlipVersionFormData)
  formData!: BrokingSlipVersionFormData;
}

export class BrokingSlipVersionDetailsDtoWithId extends BrokingSlipVersionDetailsDto {
  @ApiProperty({ description: "version Id", example: 100000 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "version Id must be a integer." })
  versionId: number;
}

export class BrokingSlipDocumentsDto {
  @ApiProperty({ description: "Document Type Lid", example: 100000 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Document Type Lid must be a integer." })
  documentTypeLid: number;

  @ApiProperty({ description: "Document Id", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Document Id must be an integer." })
  documentId: number;
}

export class BrokingSlipFormDataCommentsDto {
  @ApiProperty({
    description: "Risk Mitigation Features",
    example: "Fire alarm system",
  })
  @IsNotEmpty({ message: "risk mitigation feature is required." })
  @IsString({ message: "risk mitigation feature must be a string." })
  riskMitigationFeatures!: string;

  @ApiProperty({ description: "Clauses", example: "Standard clauses apply" })
  @IsString({ message: "clause must be a string." })
  @IsNotEmpty({ message: "clauses is required." })
  clauses!: string;

  @ApiProperty({ description: "Insurer Remarks", example: "Insurer approved" })
  @IsString({ message: "Insurer remarks must be a string." })
  @IsNotEmpty({ message: "insurer remarks is required." })
  insurerRemarks!: string;

  @ApiProperty({ description: "Remarks", example: "No additonal remarks" })
  @IsString({ message: "remarks must be a string." })
  @IsOptional({ message: "remarks is optional." })
  remarks?: string;
}

export class OptionalBrokingSlipFormDataCommentsDto {
  @ApiProperty({
    description: "Risk Mitigation Features",
    example: "Fire alarm system",
  })
  @IsOptional()
  riskMitigationFeatures?: string | null;

  @ApiProperty({ description: "Clauses", example: "Standard clauses apply" })
  @IsOptional()
  clauses?: string | null;

  @ApiProperty({ description: "Insurer Remarks", example: "Insurer approved" })
  @IsOptional()
  insurerRemarks?: string | null;

  @ApiProperty({ description: "Remarks", example: "No additonal remarks" })
  @IsOptional({ message: "remarks is optional." })
  remarks?: string | null;
}

export class BrokingSlipFormDataDto {
  @ApiProperty({
    description: "preferred TPA details",
    type: [PreferredTpaDetailsDto],
  })
  @IsArray({ message: "preferred TPA details must be an array" })
  @ValidateNested({ each: true })
  @Type(() => PreferredTpaDetailsDto)
  preferredTPADetails: PreferredTpaDetailsDto[];

  @ApiProperty({
    description: "Covers details",
    type: [PreferredInsurerDetailsDto],
  })
  @IsArray({ message: "preferred Insurer details must be an array" })
  @ValidateNested({ each: true })
  @Type(() => PreferredInsurerDetailsDto)
  preferredInsurerDetails: PreferredInsurerDetailsDto[];

  @ApiProperty({
    description: "Broking slip version form data",
    type: BrokingSlipFormDataCommentsDto,
  })
  @ValidateNested()
  @Type(() => BrokingSlipFormDataCommentsDto)
  others!: BrokingSlipFormDataCommentsDto;

  @ApiProperty({
    description: "preferred TPA details",
    type: [BrokingSlipDocumentsDto],
  })
  @IsArray({ message: "preferred TPA details must be an array" })
  @ValidateNested({ each: true })
  @Type(() => BrokingSlipDocumentsDto)
  documents: BrokingSlipDocumentsDto[];
}
export class SaveBrokingSlipFormDataDto {
  @ApiProperty({
    description: "preferred TPA details",
    type: [PreferredTpaDetailsDto],
  })
  @IsArray({ message: "preferred TPA details must be an array" })
  @ValidateNested({ each: true })
  @Type(() => PreferredTpaDetailsDto)
  preferredTPADetails!: PreferredTpaDetailsDto[];

  @ApiProperty({
    description: "Covers details",
    type: [PreferredInsurerDetailsDto],
  })
  @IsArray({ message: "preferred Insurer details must be an array" })
  @ValidateNested({ each: true })
  @Type(() => OptionalPreferredInsurerDetailsDto)
  preferredInsurerDetails!: OptionalPreferredInsurerDetailsDto[];

  @ApiProperty({
    description: "Broking slip version form data",
    type: OptionalBrokingSlipFormDataCommentsDto,
  })
  @ValidateNested()
  @Type(() => OptionalBrokingSlipFormDataCommentsDto)
  others!: OptionalBrokingSlipFormDataCommentsDto;

  @ApiProperty({
    description: "preferred TPA details",
    type: [BrokingSlipDocumentsDto],
  })
  @IsArray({ message: "preferred TPA details must be an array" })
  @ValidateNested({ each: true })
  @Type(() => BrokingSlipDocumentsDto)
  documents!: BrokingSlipDocumentsDto[];
}
export class BrokingSlipDataDto {
  @ApiProperty({ description: "Opportunity activity Id", example: 100000 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Document Type Lid must be a integer." })
  opportunityActivityId: number;

  @ApiProperty({ description: "Status Lid", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Status Lid Id must be an integer." })
  statusLid: number;

  @IsObject({
    message: "default covers must be an object with cover IDs as keys",
  })
  @ValidateNested({ each: true })
  defaultCovers: Record<string, string>;

  @ApiProperty({
    description: "Broking slip version form data",
    type: BrokingSlipFormDataDto,
  })
  @ValidateNested()
  @Type(() => BrokingSlipFormDataDto)
  formData!: BrokingSlipFormDataDto;

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

export class SaveBrokingSlipDataDto {
  @ApiProperty({ description: "Opportunity activity Id", example: 100000 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Document Type Lid must be a integer." })
  opportunityActivityId!: number;

  @ApiProperty({ description: "Status Lid", example: 1 })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt({ message: "Status Lid Id must be an integer." })
  statusLid!: number;

  @IsObject({
    message: "default covers must be an object with cover IDs as keys",
  })
  @ValidateNested({ each: true })
  defaultCovers!: Record<string, string>;

  @ApiProperty({
    description: "Broking slip version form data",
    type: SaveBrokingSlipFormDataDto,
  })
  @ValidateNested()
  @Type(() => SaveBrokingSlipFormDataDto)
  formData!: SaveBrokingSlipFormDataDto;

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

export interface VersionDetails {
  sumInsured?: number;
  basicPremium?: number;
  brokeragePercentage?: number;
  brokerageAmount?: number;
  policyFrom?: string;
  policyTo?: string;
  renewalDate?: string;
  quoteReceiptTimeline?: string;
  businessActivity?: string;
  riskMitigationFeatures?: string;
  clauses?: string;
  insurerRemarks?: string;
  remarks?: string;
  [key: string]: any;
}

export type MappedVersionDetails = Record<string, string | number | undefined>;
