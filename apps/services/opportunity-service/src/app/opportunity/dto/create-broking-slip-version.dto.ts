import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, ValidateNested } from "class-validator";
import {
  BrokingSlipFormDataDto,
  BrokingSlipVersionDetailsDto,
} from "./get-broking-slip-details-by-version.dto";

// export class CreatePreferredInsurerDto {
//   @ApiProperty({
//     description: "The ID of the preferred insurer.",
//     example: 1,
//   })
//   @IsInt({ message: "Preferred insurer ID must be an integer." })
//   @IsNotEmpty({ message: "Preferred insurer ID is required." })
//   insurerId!: number;

//   @ApiProperty({
//     description: "Location Id of the preferred TPA.",
//     example: 1,
//   })
//   @IsInt({ message: "Preferred location ID must be an integer." })
//   @IsNotEmpty({ message: "Preferred location ID is required." })
//   locationId!: string;

//   @ApiProperty({
//     description: "Branch Id of the preferred TPA.",
//     example: 1681,
//   })
//   @IsInt({ message: "Preferred branch ID must be an integer." })
//   @IsNotEmpty({ message: "Preferred branch ID is required." })
//   branchId!: string;

//   @ApiProperty({
//     description: "The ID of the contact person.",
//     example: 1,
//   })
//   @IsInt({ message: "Contact ID must be an integer." })
//   @IsOptional()
//   contactId?: number;
// }

// export class CreatePreferredTpaDto {
//   @ApiProperty({
//     description: "The ID of the preferred TPA.",
//     example: 1,
//   })
//   @IsInt({ message: "Preferred TPA ID must be an integer." })
//   @IsNotEmpty({ message: "Preferred TPA ID is required." })
//   tpaId!: number;

//   @ApiProperty({
//     description: "Location Id of the preferred TPA.",
//     example: 1,
//   })
//   @IsInt({ message: "Preferred location ID must be an integer." })
//   @IsNotEmpty({ message: "Preferred location ID is required." })
//   locationId!: string;

//   @ApiProperty({
//     description: "Branch Id of the preferred TPA.",
//     example: 1681,
//   })
//   @IsInt({ message: "Preferred branch ID must be an integer." })
//   @IsNotEmpty({ message: "Preferred branch ID is required." })
//   branchId!: string;

//   @ApiProperty({
//     description: "The ID of the contact person.",
//     example: 1,
//   })
//   @IsInt({ message: "Contact ID must be an integer." })
//   @IsOptional()
//   contactId?: number;
// }

// export class CreateCoversDto {
//   @ApiProperty({
//     description: "The ID of the opportunity activity.",
//     example: 76,
//   })
//   @IsInt({ message: "Opportunity id must be an integer." })
//   opportunityId!: number;

//   @ApiProperty({
//     description: "The ID of the cover mapped to the opportunity.",
//     example: 76,
//   })
//   @IsInt({ message: "Cover map id must be an integer." })
//   coverMapId!: number;

//   @ApiProperty({
//     description: "The ID of the policy mapped to the opportunity.",
//     example: 76,
//   })
//   @IsInt({ message: "policy map id must be an integer." })
//   policyId!: number;

//   @ApiProperty({
//     description: "Name of the cover.",
//     example: "High class covers",
//   })
//   @IsString({ message: "Cover Name must be a string." })
//   @IsNotEmpty({ message: "Cover Name is required." })
//   coverName!: string;

//   @ApiProperty({
//     description: "Response of the cover.",
//     example: "Sample cover response",
//   })
//   @IsString({ message: "Cover Response must be a string." })
//   @IsNotEmpty({ message: "Cover Response is required." })
//   coverResponse!: string;
// }

// export class CreateBrokingSlipVersionDetailsDto {
//   @ApiProperty({
//     description: "The ID of the opportunity activity.",
//     example: 76,
//   })
//   @IsInt({ message: "Opportunity id must be an integer." })
//   opportunityId!: number;

//   @ApiProperty({
//     description: "The sum insured amount.",
//     example: 1000000,
//   })
//   @IsInt({ message: "Sum insured must be an integer." })
//   @Min(0, { message: "Sum insured must be a positive number." })
//   sumInsured!: number;

//   @ApiProperty({
//     description:
//       "It is the name of the  version of broking slip getting created",
//     example: "High class covers ",
//   })
//   @IsString({ message: "version name must be a string." })
//   versionName!: string;

//   @ApiPropertyOptional({
//     description: "The brokerage percentage.",
//     example: 2.5,
//   })
//   @IsNumber({}, { message: "Brokerage percentage must be a number." })
//   @Min(0, { message: "Brokerage percentage must be a positive number." })
//   @Max(100, {
//     message: "Brokerage percentage must be less than or equal to 100.",
//   })
//   @IsOptional()
//   brokeragePercentage!: number;

//   @ApiProperty({
//     description: "The date when the policy starts.",
//     example: "2025-12-10",
//   })
//   @IsDate({ message: "Policy from must be a valid date." })
//   @Type(() => Date)
//   @IsNotEmpty({ message: "Policy from is required." })
//   policyFrom!: Date;

//   @ApiProperty({
//     description: "The date when the policy ends.",
//     example: "2025-12-10",
//   })
//   @IsDate({ message: "Policy to must be a valid date." })
//   @Type(() => Date)
//   @IsNotEmpty({ message: "Policy to is required." })
//   policyTo!: Date;

//   @ApiProperty({
//     description: "The date when the renewal is due.",
//     example: "2025-12-10",
//   })
//   @IsDate({ message: "Renewal date must be a valid date." })
//   @Type(() => Date)
//   @IsNotEmpty({ message: "Renewal date is required." })
//   renewalDate!: Date;

//   @ApiProperty({
//     description: "The date when the quote receipt timeline is set.",
//     example: "2025-12-10",
//   })
//   @IsDate({ message: "Quote receipt timeline must be a valid date." })
//   @Type(() => Date)
//   @IsNotEmpty({ message: "Quote receipt timeline is required." })
//   quoteReceiptTimeline!: Date;

//   @ApiPropertyOptional({
//     description: "The business activity related to the opportunity.",
//     example: "Manufacturing",
//   })
//   @IsString({ message: "Business activity must be a string." })
//   @IsOptional()
//   businessActivity?: string;

//   @ApiProperty({
//     description: "The risk mitigation features related to the opportunity.",
//     example:
//       "The risk mitigation features include fire alarms, sprinklers, and security systems.",
//   })
//   @IsString({ message: "Risk mitigation features must be a string." })
//   riskMitigationFeatures!: string;

//   @ApiProperty({
//     description: "The clauses related to the opportunity.",
//     example: "No claims made in the last 5 years.",
//   })
//   @IsString({ message: "Clauses must be a string." })
//   clauses!: string;

//   @ApiProperty({
//     description: "The insurer remarks related to the opportunity.",
//     example: "The insurer has approved the risk assessment.",
//   })
//   @IsString({ message: "Insurer remarks must be a string." })
//   insurerRemarks!: string;

//   @ApiProperty({
//     description: "The remarks related to the opportunity.",
//     example: "This is a high-value opportunity.",
//   })
//   @IsString({ message: "remarks must be a string." })
//   remarks?: string;

//   @ApiProperty({
//     description: "Preferred insurer details",
//     type: [CreatePreferredInsurerDto],
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreatePreferredInsurerDto)
//   preferredInsurerDetails!: CreatePreferredInsurerDto[];

//   @ApiProperty({
//     description: "Preferred TPA details",
//     type: [CreatePreferredTpaDto],
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreatePreferredTpaDto)
//   preferredTpaDetails!: CreatePreferredTpaDto[];

//   @ApiProperty({
//     description: "Cover details",
//     type: [CreateCoversDto],
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreateCoversDto)
//   coverDetails!: CreateCoversDto[];
// }
export class CreateBrokingSlipVersionDto {
  @ApiProperty({
    description: "The ID of the opportunity activity.",
    example: 76,
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
  @IsInt({ message: "Opportunity id must be an integer." })
  opportunityActivityId!: number;

  @ApiProperty({
    description: "status id of the activity.",
    example: 76,
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
  @IsInt({ message: "Status id must be an integer." })
  statusLid!: number;

  @ApiProperty({
    description: "Broking slip version details",
    type: BrokingSlipVersionDetailsDto,
  })
  @ValidateNested()
  @Type(() => BrokingSlipVersionDetailsDto)
  brokingSlipVersionDetails!: BrokingSlipVersionDetailsDto;

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

export class CreateBrokingSlipDto {
  @ApiProperty({
    description: "The ID of the opportunity activity.",
    example: 76,
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
  @IsInt({ message: "Opportunity id must be an integer." })
  opportunityActivityId!: number;

  @ApiProperty({
    description: "status id of the activity.",
    example: 76,
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
  @IsInt({ message: "Status id must be an integer." })
  statusLid!: number;

  @ApiProperty({
    description: "Broking slip version details",
    type: BrokingSlipFormDataDto,
  })
  @ValidateNested()
  @Type(() => BrokingSlipFormDataDto)
  brokingSlipDetails!: BrokingSlipFormDataDto;
}
