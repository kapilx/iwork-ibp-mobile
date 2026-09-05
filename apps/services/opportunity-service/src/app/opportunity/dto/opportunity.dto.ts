import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OpportunityCompetitorDto } from "./opportunity-competitor.dto";
import { OpportunityDocumentDto } from "./opportunity-document.dto";
import { OpportunityChallengeDto } from "./opportunity-challenges.dto";
import { OpportunityClaimExperienceDto } from "./opportunity-claim-experience.dto";
import { CreateAddressDto } from "../../../../../org-service/src/app/address/dto/create-address.dto";

export class OpportunityDto {
  @ApiProperty({ example: 1, description: "The ID of the company" })
  companyId!: number;

  @ApiProperty({ example: 1000, description: "Estimated brokerage amount" })
  estimatedBrokerage!: number;

  @ApiProperty({ example: 101, description: "Policy type ID" })
  policyTypeLid!: number;

  @ApiProperty({ example: 201, description: "Policy status ID" })
  policyStatusLid!: number;

  @ApiProperty({ example: 301, description: "Service level ID" })
  serviceLevelLid!: number;

  @ApiProperty({ example: "2023-12-31", description: "SO expiration date" })
  expiryDate!: Date;

  @ApiProperty({ example: 1000000, description: "Sum insured amount" })
  sumInsured!: number;

  @ApiPropertyOptional({ example: 50000, description: "Premium paid amount" })
  premiumPaid?: number;

  @ApiPropertyOptional({ example: 5000, description: "Estimated fee" })
  estimatedFee?: number;

  @ApiPropertyOptional({
    type: [OpportunityChallengeDto],
    description: "List of opportunity challenges",
  })
  opportunityChallenges?: OpportunityChallengeDto[];

  @ApiPropertyOptional({
    type: [OpportunityClaimExperienceDto],
    description: "List of opportunity claim experiences",
  })
  opportunityClaimExperiences?: OpportunityClaimExperienceDto[];

  @ApiPropertyOptional({
    type: [OpportunityCompetitorDto],
    description: "List of opportunity competitors",
  })
  opportunityCompetitors?: OpportunityCompetitorDto[];

  @ApiPropertyOptional({
    type: [OpportunityDocumentDto],
    description: "List of opportunity documents",
  })
  opportunityDocuments?: OpportunityDocumentDto[];

  @ApiPropertyOptional({
    type: [CreateAddressDto],
    description: "List of opportunity risk locations",
  })
  opportunityRiskLocations?: CreateAddressDto[];
}

export class OpportunityDataDto extends OpportunityDto {
  @ApiProperty({ example: 1, description: "The ID of the opportunity" })
  opportunityId!: number;
}
