import { PartialType } from "@nestjs/mapped-types";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { OpportunityActivityDocumentDto } from "./opportunity-document.dto";

// Nested DTO for descriptionRequirements
class DescriptionRequirementsDto {
  @IsOptional()
  description: string;

  @IsOptional()
  requirements: string;
}

// Nested DTO for dynamicQuote
class DynamicQuoteDto {
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
  @IsInt({ message: "Multiple brokers involved must be an integer." })
  multipleBrokerInvolved?: number;

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
  @IsInt({ message: "Is market allocation done is required." })
  isMarketAllocationDone?: number;
}

// Nested DTO for targetQcrDate
class TargetQcrDateDto {
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNotEmpty({ message: "Receipt date is required." })
  @IsString({ message: "Receipt date must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Receipt date must be in the format YYYY-MM-DD.",
  })
  targetQcrDate?: string;
}

// Nested DTO for clientConsiderations
class ClientConsiderationsDto {
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNotEmpty({ message: "Client considerations are required." })
  @IsString({ message: "Client considerations must be a string." })
  clientConsiderations!: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNotEmpty({ message: "Threats from existing insurer are required." })
  @IsString({ message: "Threats from existing insurer must be a string." })
  threatsFromExistingInsurer!: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNotEmpty({ message: "Threats from existing broker are required." })
  @IsString({ message: "Threats from existing broker must be a string." })
  threatsFromExistingBroker!: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNotEmpty({ message: "Extraneous factors are required." })
  @IsString({ message: "Extraneous factors must be a string." })
  extraneousFactors!: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNotEmpty({ message: "Plan for closing deal is required." })
  @IsString({ message: "Plan for closing deal must be a string." })
  planForClosingDetail?: string;
}

// Nested DTO for remarks
class RemarksDto {
  @IsOptional()
  @IsString({ message: "Remarks must be a string." })
  remarks: string;
}

export class CreateRfpTpaDetailsDto {
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
  @IsInt({ message: "ID must be an integer." })
  id: number;

  @IsNotEmpty()
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
  @IsInt({ message: "TPA ID must be an integer." })
  tpaId!: number;

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
  @IsInt({ message: "Location ID must be an integer." })
  locationId?: number;

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
  @IsInt({ message: "Branch ID must be an integer." })
  branchId?: number;

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
  @IsInt({ message: "Contact ID must be an integer." })
  contactId?: number;
}

export class CreateRfpInsurerDetailsDto {
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
  @IsInt({ message: "ID must be an integer." })
  id: number;

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
  @IsNotEmpty({ message: "Insurer ID is required." })
  @IsInt({ message: "Insurer ID must be an integer." })
  insurerId!: number;

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
  @IsNotEmpty({ message: "Location ID is required." })
  @IsInt({ message: "Location ID must be an integer." })
  insurerLocationId?: number;

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
  @IsNotEmpty({ message: "Branch ID is required." })
  @IsInt({ message: "Branch ID must be an integer." })
  insurerBranchId?: number;

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
  @IsOptional()
  @IsInt({ message: "Contact ID must be an integer." })
  insurerContactId?: number;
}

export class CreateRfpClientContactDetailsDto {
  @ValidateIf((_, value) => value !== null && value !== undefined)
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
  @IsNotEmpty({ message: "Contact ID is required." })
  @IsInt({ message: "Contact ID must be an integer." })
  contactId: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  decisionInfluencers?: number[];

  @ValidateIf((_, value) => value !== null && value !== undefined)
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
  @IsNotEmpty({ message: "Expected premium is required." })
  @IsNumber({}, { message: "Expected premium must be a valid number." })
  @Min(0, { message: "Expected premium must be greater than or equal to 0." })
  expectedPremium?: number;
}

export class CreateRfpCreditSharingDto {
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
  @IsInt({ message: "ID must be an integer." })
  id: number;

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
  @IsInt({ message: "Executive ID must be an integer." })
  executiveId: number;

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
  @IsNumber({}, { message: "Percentage must be a valid number." })
  @Min(0, { message: "Percentage must be greater than or equal to 0." })
  @Max(100, { message: "Percentage must be less than or equal to 100." })
  percentage: number;
}

export class CreateOpportunityRfpDetailsEntryDto {
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
  @IsNotEmpty({ message: "Opportunity Activity ID is required." })
  @IsInt({ message: "Opportunity Activity ID must be an integer." })
  opportunityActivityId!: number;

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

  @IsNotEmpty({ message: "Description requirements are required" })
  @ValidateNested()
  @Type(() => DescriptionRequirementsDto)
  descriptionRequirements?: DescriptionRequirementsDto;

  @IsNotEmpty({ message: "Preferred Insurers are required." })
  @ValidateNested({ each: true })
  @Type(() => CreateRfpInsurerDetailsDto)
  preferredInsurers?: CreateRfpInsurerDetailsDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRfpInsurerDetailsDto)
  excludedInsurers?: CreateRfpInsurerDetailsDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRfpTpaDetailsDto)
  preferredTPA?: CreateRfpTpaDetailsDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRfpTpaDetailsDto)
  excludedTPA?: CreateRfpTpaDetailsDto[];

  @IsNotEmpty({ message: "Dynamic quote details are required." })
  @ValidateNested()
  @Type(() => DynamicQuoteDto)
  dynamicQuote?: DynamicQuoteDto;

  @IsNotEmpty({ message: "Target QCR date is required." })
  @ValidateNested()
  @Type(() => TargetQcrDateDto)
  targetQcrDate?: TargetQcrDateDto;

  @IsNotEmpty({ message: "Client considerations are required." })
  @ValidateNested()
  @Type(() => ClientConsiderationsDto)
  clientConsiderations?: ClientConsiderationsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RemarksDto)
  remarks?: RemarksDto;

  @IsNotEmpty({ message: "Client contact details are required." })
  @ValidateNested()
  @Type(() => CreateRfpClientContactDetailsDto)
  clientContactDetails?: CreateRfpClientContactDetailsDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRfpCreditSharingDto)
  creditSharing?: CreateRfpCreditSharingDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDocumentDto)
  documents?: OpportunityActivityDocumentDto[];

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
  @IsNotEmpty({ message: "StatusLid is required." })
  @IsInt({ message: "StatusLid must be an integer." })
  statusLid!: number;
}

export class UpdateRfpDetailsEntryDto extends PartialType(
  CreateOpportunityRfpDetailsEntryDto
) {}
