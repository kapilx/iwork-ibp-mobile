import { ApiProperty } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsObject,
  IsEnum,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import {
  InsurerPolicyHardCopyDetailsDto,
  DeviationSectionDto,
  DeviationsAddressedSectionDto,
  RemarksDto,
  InsurerDetailssDto,
} from "./create-policy-hard-copy.dto";
import { InstallmentDetailDto } from "./create-placement-slip.dto";
export class UpdatePolicyHardCopyDocumentDto {
  @ApiProperty({
    description: "Id",
    example: 237,
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
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: "Document Type ID",
    example: 237,
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
  @IsNumber()
  @IsNotEmpty()
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
  @IsNumber()
  @IsNotEmpty()
  documentId!: number;
}

export class UpdateInstallmentDetailDto extends InstallmentDetailDto {
  @ApiProperty({ example: 1, required: false })
  @Transform(({ value }) => {
    if (value === null) return null;
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

  @ApiProperty({ example: 1, required: false })
  @Transform(({ value }) => {
    if (value === null) return null;
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
  policyHardCopyId?: number;
}

export class UpdatePolicyHardCopyDto {
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
  @IsNumber()
  @IsOptional()
  opportunityActivityId?: number;

  @ApiProperty({
    example: 403,
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
  @IsNumber()
  @IsOptional()
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
  @Type(() => InsurerPolicyHardCopyDetailsDto)
  insurerPolicyHardCopyDetails!: InsurerPolicyHardCopyDetailsDto;

  @ValidateNested()
  @Type(() => DeviationSectionDto)
  deviationSection!: DeviationSectionDto;

  @ValidateNested()
  @Type(() => DeviationsAddressedSectionDto)
  deviationsAddressedSection!: DeviationsAddressedSectionDto;

  @ApiProperty({ type: [UpdateInstallmentDetailDto], required: false })
  @ValidateNested({ each: true })
  @Type(() => UpdateInstallmentDetailDto)
  @IsArray()
  @IsOptional()
  installmentDetails?: UpdateInstallmentDetailDto[];

  @ValidateNested({ each: true })
  @Type(() => InsurerDetailssDto)
  @IsOptional()
  insurerDetails?: InsurerDetailssDto[];

  @ValidateNested()
  @Type(() => RemarksDto)
  remarks?: RemarksDto;

  @ApiProperty({
    example: { "101": "value" },
    description: "Policy hard copy cover responses keyed by cover template ID",
    required: false,
  })
  @IsObject()
  @IsOptional()
  policyHardCopyCoversConfig?: Record<string, string>;

  @ApiProperty({
    type: [UpdatePolicyHardCopyDocumentDto],
    description: "Array of documents",
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePolicyHardCopyDocumentDto)
  documents?: UpdatePolicyHardCopyDocumentDto[];
}
