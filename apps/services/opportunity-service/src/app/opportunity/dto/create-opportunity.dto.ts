import {
  IsNotEmpty,
  IsString,
  IsNumber,
  MaxLength,
  IsOptional,
  Matches,
  IsInt,
  IsBoolean,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OpportunityDocumentDto } from "./opportunity-document.dto";
import { OpportunityClaimExperienceDto } from "./opportunity-claim-experience.dto";
import { OpportunityPreviousPlacementDetailsDto } from "./opportunity-previous-placement-details.dto";
import { OpportunityPreviousMediatorDetailsDto } from "./opportunity-previous-mediator-details.dto";
import { OpportunityContactMapDto } from "./opportunity-contact-map.dto";
import { OpportunityRiskLocationDto } from "./opportunity-risk-locations.dto";

export class CreateOpportunityDto {
  @ApiProperty({ description: "Company ID", example: 434 })
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
  @IsNotEmpty({ message: "Company ID is required" })
  @IsNumber({}, { message: "Company ID must be a valid number" })
  companyId: number;

  @ApiPropertyOptional({ description: "Estimated brokerage", example: 1000 })
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
  @IsNumber({}, { message: "Estimated brokerage must be a valid number" })
  estimatedBrokerage: number;

  @ApiPropertyOptional({
    description: "Estimated brokerage percentage",
    example: 10,
  })
  @IsOptional()
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
  @IsNumber(
    {},
    { message: "Estimated brokerage percentage must be a valid number" }
  )
  estimatedBrokeragePercentage: number;

  @ApiProperty({ description: "Policy type ID", example: 255 })
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
  @IsNotEmpty({ message: "Policy type is required" })
  @IsNumber({}, { message: "Policy type ID must be a valid number" })
  policyTypeLid: number;

  @ApiProperty({ description: "Policy status ID", example: 257 })
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
  @IsNotEmpty({ message: "Policy status is required" })
  @IsNumber({}, { message: "Policy status ID must be a valid number" })
  policyStatusLid: number;

  @ApiProperty({ description: "Service level ID", example: 259 })
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
  @IsNotEmpty({ message: "Service level is required" })
  @IsNumber({}, { message: "Service level ID must be a valid number" })
  serviceLevelLid: number;

  @ApiProperty({
    description: "ExpireDate in YYYY-MM-DD format",
    example: "2026-12-31",
  })
  @IsNotEmpty({ message: "ExpireDate is required" })
  @IsString({ message: "ExpireDate must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "ExpireDate must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string }) => {
    const date = new Date(value);
    if (date < new Date()) {
      throw new BadRequestException("ExpireDate cannot be a past date.");
    }
    return value;
  })
  expiryDate: string;

  @ApiProperty({ description: "Sum insured", example: 500000 })
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
  @IsNumber({}, { message: "Sum insured must be a valid number" })
  sumInsured?: number;

  @ApiPropertyOptional({ description: "Premium paid", example: 20000 })
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
  @IsNotEmpty({ message: "Premium paid is required" })
  @IsNumber({}, { message: "Premium paid must be a valid number" })
  premiumPaid: number;

  @ApiPropertyOptional({ description: "Estimated fee", example: 500 })
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
  @IsNumber({}, { message: "Estimated fee must be a valid number" })
  estimatedFee: number;

  @ApiPropertyOptional({
    description: "Opportunity type ID",
    example: 312,
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
  @IsNumber({}, { message: "Opportunity type ID must be a valid number" })
  opportunityTypeLid: number;

  @ApiProperty({
    description: "Is policy mined ID",
    example: 310,
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
  @IsNotEmpty({ message: "Is policy mined ID is required" })
  @IsNumber({}, { message: "Is policy mined ID must be a valid number" })
  isPolicyMinedLid: number;

  @ApiPropertyOptional({
    description: "Source Type ID",
    example: 303,
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
  @IsNumber({}, { message: "Source Type ID must be a valid number" })
  opportunitySourceTypeLid: number;

  @ApiPropertyOptional({
    description: "Source",
    example: "Some source",
  })
  @IsOptional()
  @IsString({ message: "Source must be a string" })
  @MaxLength(255, { message: "Source must be atmost 255 characters" })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  source: string;

  @ApiPropertyOptional({
    description: "Sales pitch",
    example: "This is a sales pitch",
  })
  @IsOptional()
  @IsString({ message: "Sales pitch must be a string" })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  salesPitch?: string;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @IsOptional()
  @IsInt()
  ownerId?: number;

  @IsOptional()
  @IsInt()
  amId?: number;

  @IsOptional()
  @IsInt()
  isgId?: number;

  @ApiPropertyOptional({
    type: [OpportunityClaimExperienceDto],
    description: "List of opportunity claim experiences",
  })
  @IsOptional()
  claimExperiences?: OpportunityClaimExperienceDto[];

  @ApiPropertyOptional({
    type: [OpportunityDocumentDto],
    description: "List of opportunity documents",
  })
  @IsOptional()
  documents?: OpportunityDocumentDto[];

  @ApiPropertyOptional({
    type: [OpportunityRiskLocationDto],
    description: "List of opportunity risk locations",
  })
  @IsNotEmpty({ message: "Risk locations are required" })
  riskLocations!: OpportunityRiskLocationDto[];

  @ApiPropertyOptional({
    type: [OpportunityPreviousPlacementDetailsDto],
    description: "List of previous placement details",
  })
  @IsOptional()
  previousPlacementDetails?: OpportunityPreviousPlacementDetailsDto[];

  @ApiPropertyOptional({
    type: [OpportunityPreviousMediatorDetailsDto],
    description: "List of opportunity previous insurer details",
  })
  @IsOptional()
  previousInsurer?: OpportunityPreviousMediatorDetailsDto[];

  @ApiPropertyOptional({
    type: [OpportunityPreviousMediatorDetailsDto],
    description: "List of opportunity previous tpa details",
  })
  @IsOptional()
  previousTPA?: OpportunityPreviousMediatorDetailsDto[];

  @ApiPropertyOptional({
    type: [OpportunityPreviousMediatorDetailsDto],
    description: "List of opportunity previous broker details",
  })
  @IsOptional()
  previousBroker?: OpportunityPreviousMediatorDetailsDto[];

  @ApiProperty({
    type: [OpportunityContactMapDto],
    description: "List of contacts related to that company",
  })
  @IsNotEmpty({ message: "Contacts are required" })
  contacts!: OpportunityContactMapDto[];

  @ApiPropertyOptional({ description: "Policy_number", example: 20000 })
  @IsOptional()
  @IsInt({ message: "Reference Policy ID must be a valid number" })
  refPolicyId: number;

  @ApiPropertyOptional({
    description: "Reference Opportunity ID",
    example: 20000,
  })
  @IsOptional()
  @IsInt({ message: "Reference Opportunity ID must be a valid number" })
  refOpportunityId: number;

  constructor(
    companyId: number,
    estimatedBrokerage: number,
    estimatedBrokeragePercentage: number,
    policyTypeLid: number,
    policyStatusLid: number,
    serviceLevelLid: number,
    expiryDate: string,
    sumInsured: number,
    premiumPaid: number,
    estimatedFee: number,
    opportunityTypeLid: number,
    isPolicyMinedLid: number,
    source: string,
    opportunitySourceTypeLid: number,
    refPolicyId: number,
    refOpportunityId: number
  ) {
    this.companyId = companyId;
    this.estimatedBrokerage = estimatedBrokerage;
    this.estimatedBrokeragePercentage = estimatedBrokeragePercentage;
    this.policyTypeLid = policyTypeLid;
    this.policyStatusLid = policyStatusLid;
    this.serviceLevelLid = serviceLevelLid;
    this.expiryDate = expiryDate;
    this.sumInsured = sumInsured;
    this.premiumPaid = premiumPaid;
    this.refPolicyId = refPolicyId;
    this.refOpportunityId = refOpportunityId;
    this.estimatedFee = estimatedFee;
    this.opportunityTypeLid = opportunityTypeLid;
    this.isPolicyMinedLid = isPolicyMinedLid;
    this.source = source;
    this.opportunitySourceTypeLid = opportunitySourceTypeLid;
  }
}

export class RenewalOpportunityDto {
  @ApiProperty({
    description: "From Date in YYYY-MM-DD format",
    example: "2026-12-31",
  })
  @IsOptional()
  @IsString({ message: "FromDate must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "From Date must be in the format YYYY-MM-DD.",
  })
  fromDate?: string;

  @ApiPropertyOptional({
    description: "Duration in number of days",
    example: 365,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: "Duration must be an integer(number of days)." })
  duration?: number;

  @ApiPropertyOptional({
    description: "If true, creates RO for policies in the defined policy set (policies_set_for_ro_creation table)",
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: "ROForDefinedPolicySetFlag must be a boolean." })
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  ROForDefinedPolicySetFlag?: boolean;
}
