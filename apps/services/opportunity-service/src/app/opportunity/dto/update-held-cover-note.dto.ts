import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
  IsEnum,
} from "class-validator";
import {
  DeviationsAddressedDto,
  DeviationsDto,
  InsurerDetailssDto,
  PlacementSlipDeviationsDto,
  PremiumReceiptDetailsDto,
  RemarksDto,
} from "./create-held-cover-note.dto";
import { InstallmentDetailDto } from "./create-placement-slip.dto";
export class HeldCoverNoteDocumentDto {
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
  heldCoverNoteId?: number;
}

export class UpdateHeldCoverNoteDto {
  @ApiProperty({
    example: 479,
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
  @IsOptional()
  opportunityActivityId?: number;

  @ApiProperty({
    example: 404,
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

  @ApiPropertyOptional({ type: [UpdateInstallmentDetailDto] })
  @ValidateNested({ each: true })
  @Type(() => UpdateInstallmentDetailDto)
  @IsArray()
  @IsOptional()
  installmentDetails?: UpdateInstallmentDetailDto[];

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
