import { ApiProperty } from "@nestjs/swagger";
import {
  IsNumber,
  IsInt,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsEnum,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import {
  PolicyDataWrongSectionDto,
  DeviationSectionDto,
  PolicyDataRectifiedSectionDto,
  RemarksDto,
  InsurerDetailssDto,
} from "./create-policy-confirmation.dto";
import { InstallmentDetailDto } from "./create-placement-slip.dto";
export class UpdatePolicyConfirmationDocumentDto {
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
  @IsInt()
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
  @IsInt()
  @IsOptional()
  policyConfirmationId?: number;
}

export class UpdatePolicyConfirmationDto {
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
  @IsNumber()
  @IsOptional()
  opportunityActivityId?: number;

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
  @Type(() => PolicyDataWrongSectionDto)
  policyDataWrongSection!: PolicyDataWrongSectionDto;

  @ValidateNested()
  @Type(() => DeviationSectionDto)
  deviationSection!: DeviationSectionDto;

  @ValidateNested()
  @Type(() => PolicyDataRectifiedSectionDto)
  policyDataRectifiedSection!: PolicyDataRectifiedSectionDto;

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
  remarks!: RemarksDto;

  @ApiProperty({
    type: [UpdatePolicyConfirmationDocumentDto],
    description: "Array of documents",
    required: true,
  })
  @IsOptional()
  @IsArray({ message: "Documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => UpdatePolicyConfirmationDocumentDto)
  documents?: UpdatePolicyConfirmationDocumentDto[];
}
