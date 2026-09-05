import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  ValidateNested,
} from "class-validator";
import {
  CDDetailDto,
  FeeDetailsDto,
  InstallmentDateDto,
  InstallmentDetailDto,
  InsurerMapDto,
  PlacementSlipDocumentDto,
  PolicyDetailsDto,
  RemarksDto,
  TPAMapDto,
} from "./create-placement-slip.dto";

export class UpdatePlacementSlipDocumentDto extends PlacementSlipDocumentDto {
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
}

export class UpdateInstallmentDateDto extends InstallmentDateDto {
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
  placementSlipId?: number;
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
  placementSlipId?: number;

}

export class UpdateInsurerMapDto extends InsurerMapDto {
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
  placementSlipId?: number;
}

export class UpdateTPAMapDto extends TPAMapDto {
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
  placementSlipId?: number;
}

export class UpdateCDDetailDto extends CDDetailDto {
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
  placementSlipId?: number;
}

export class UpdatePlacementSlipDto {
  @ApiProperty({ example: 391, required: false })
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
  opportunityActivityId?: number;

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
  statusLid?: number;

  @ApiProperty({ type: PolicyDetailsDto, required: false })
  @ValidateNested()
  @Type(() => PolicyDetailsDto)
  @IsOptional()
  policyDetails?: PolicyDetailsDto;

  @ApiProperty({ type: [UpdateInstallmentDateDto], required: false })
  @ValidateNested({ each: true })
  @Type(() => UpdateInstallmentDateDto)
  @IsArray()
  @IsOptional()
  installmentDates?: UpdateInstallmentDateDto[];

  @ApiProperty({ type: [UpdateInstallmentDetailDto], required: false })
  @ValidateNested({ each: true })
  @Type(() => UpdateInstallmentDetailDto)
  @IsArray()
  @IsOptional()
  installmentDetails?: UpdateInstallmentDetailDto[];

  @ApiProperty({ type: FeeDetailsDto, required: false })
  @ValidateNested()
  @Type(() => FeeDetailsDto)
  @IsOptional()
  feeDetails?: FeeDetailsDto;

  @ApiProperty({ type: [UpdateInsurerMapDto], required: false })
  @ValidateNested({ each: true })
  @Type(() => UpdateInsurerMapDto)
  @IsArray()
  @IsOptional()
  insurerDetails?: UpdateInsurerMapDto[];

  @ApiProperty({ type: [UpdateTPAMapDto], required: false })
  @ValidateNested({ each: true })
  @Type(() => UpdateTPAMapDto)
  @IsArray()
  @IsOptional()
  tpaDetails?: UpdateTPAMapDto[];

  @ApiProperty({ type: UpdateCDDetailDto, required: false })
  @ValidateNested()
  @Type(() => UpdateCDDetailDto)
  @IsOptional()
  cdAccountDetails?: UpdateCDDetailDto;

  @ApiProperty({ example: { "101": "value" }, required: false })
  @IsObject()
  @IsOptional()
  coverDetails?: Record<string, string>;

  @ApiProperty({ type: RemarksDto, required: false })
  @ValidateNested()
  @Type(() => RemarksDto)
  @IsOptional()
  remarks?: RemarksDto;

  @ApiProperty({ type: [UpdatePlacementSlipDocumentDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlacementSlipDocumentDto)
  documents?: UpdatePlacementSlipDocumentDto[];

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
