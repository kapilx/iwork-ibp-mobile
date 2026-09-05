import { IsArray, IsBoolean, IsInt, IsNotEmpty } from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class QuoteComparisonReportDto {
  @ApiProperty({
    description: "opportunityactivityId ID",
    example: 35,
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
  @IsInt({ message: "opportunityactivityId must be an integer" })
  @IsNotEmpty({ message: "opportunityactivityId is required" })
  opportunityActivityId!: number;

  @ApiProperty({
    description: "brokingSlipVersion ID",
    example: 35,
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
  @IsInt({ message: "brokingSlipVersion must be an integer" })
  @IsNotEmpty({ message: "brokingSlipVersion is required" })
  brokingSlipVersion!: number;

  @ApiProperty({
    description: "quoteEntry Ids",
    example: [35, 36],
  })
  @IsArray({ message: "quoteEntry must be an array of integers" })
  @IsNotEmpty({ message: "quoteEntry is required" })
  @Type(() => Number)
  quoteEntry!: number[];

  @ApiProperty({
    description: "Indicates if broking slip covers are included",
    example: true,
  })
  @IsBoolean({ message: "brokingSlipCovers must be a boolean" })
  @IsNotEmpty({ message: "brokingSlipCovers is required" })
  brokingSlipCovers!: boolean;

  @ApiProperty({
    description: "Indicates if RFP details covers are included",
    example: false,
  })
  @IsBoolean({ message: "rfpDetailsCovers must be a boolean" })
  @IsNotEmpty({ message: "rfpDetailsCovers is required" })
  rfpDetailsCovers!: boolean;
}

export interface QuoteEntryDetail {
  insurer?: { insurerName?: string };
  coverDetails?: Array<{ coverMapId: number; insurerCoverResponse: string }>;
  [key: string]: any;
}

export interface CoverDetail {
  id: number;
  coverName: string;
  sectionId?: number | null;
  displaySequence?: number | null;
}

export interface RfpCoverDetail {
  coverMapId: number;
  coverName: string;
  coverResponse: string;
}

export interface BrokingSlipDetail {
  coverMapId: number;
  coverName: string;
  coverResponse: string;
}

export interface TransformInput {
  quoteEntryDetails: QuoteEntryDetail[];
  CoverDetails: CoverDetail[];
  opportunityRfpCoverDetails?: RfpCoverDetail[];
  brokingSlipCoverDetails?: BrokingSlipDetail[];
  rfpDetailsCovers?: boolean;
  brokingSlipCovers?: boolean;
}
