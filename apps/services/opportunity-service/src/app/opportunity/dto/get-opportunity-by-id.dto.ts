import { ApiProperty } from "@nestjs/swagger";

class CountryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "India" })
  name!: string;

  @ApiProperty({ example: null, nullable: true })
  isoCode!: string | null;
}

class StateDto {
  @ApiProperty({ example: 11 })
  id!: number;

  @ApiProperty({ example: "Karnataka" })
  name!: string;

  @ApiProperty({ example: "KA" })
  stateCode!: string;
}

class CityDto {
  @ApiProperty({ example: 23 })
  id!: number;

  @ApiProperty({ example: "Bengaluru" })
  name!: string;
}

class AddressDto {
  @ApiProperty({ example: 1001 })
  id!: number;

  @ApiProperty({ example: "Nope" })
  address1!: string;

  @ApiProperty({ example: "Nope" })
  address2!: string;

  @ApiProperty({ type: CityDto })
  city!: CityDto;

  @ApiProperty({ type: StateDto })
  state!: StateDto;

  @ApiProperty({ type: CountryDto })
  country!: CountryDto;

  @ApiProperty({ example: "999999" })
  pinCode!: string;
}

class RiskLocationDto {
  @ApiProperty({ example: 231 })
  id!: number;

  @ApiProperty({ example: 247 })
  opportunityId!: number;

  @ApiProperty({ example: 1001 })
  addressId!: number;

  @ApiProperty({ type: AddressDto })
  address!: AddressDto;
}

class DocumentDto {
  @ApiProperty({ example: 141 })
  id!: number;

  @ApiProperty({ example: 247 })
  opportunityId!: number;

  @ApiProperty({ example: 102 })
  documentId!: number;
}

class ClaimExperienceDto {
  @ApiProperty({ example: 190 })
  id!: number;

  @ApiProperty({ example: 247 })
  opportunityId!: number;

  @ApiProperty({ example: "2023-01-01" })
  policyFrom!: string;

  @ApiProperty({ example: "2023-12-31" })
  policyTo!: string;

  @ApiProperty({ example: "Fire" })
  natureOfLoss!: string;

  @ApiProperty({ example: 1000 })
  premium!: number;

  @ApiProperty({ example: 5000 })
  claimAmount!: number;

  @ApiProperty({ example: 20 })
  claimPercentage!: number;

  @ApiProperty({ example: "No major issues" })
  remarks!: string;
}

class MediatorCompanyDto {
  @ApiProperty({ example: 434 })
  id!: number;

  @ApiProperty({ example: "IT solutions" })
  companyName!: string;
}

class MediatorDetailsDto {
  @ApiProperty({ example: 83 })
  id!: number;

  @ApiProperty({ example: 247 })
  opportunityId!: number;

  @ApiProperty({ type: MediatorCompanyDto, nullable: true })
  company!: MediatorCompanyDto | null;

  @ApiProperty({ example: null, nullable: true })
  location!: any | null;

  @ApiProperty({ example: null, nullable: true })
  branch!: any | null;
}

class PlacementDetailsDto {
  @ApiProperty({ example: 180 })
  id!: number;

  @ApiProperty({ example: 247 })
  opportunityId!: number;

  @ApiProperty({
    example: "High competition mitigated by offering better pricing.",
  })
  challengesAndMitigation!: string;

  @ApiProperty({
    example: "Competitor A and Competitor B are active in this region.",
  })
  existingCompetition!: string;

  @ApiProperty({ example: "Client prefers a long-term policy." })
  remarks!: string;
}

class CommunicationDetailsDto {
  @ApiProperty({ example: 397 })
  id!: number;

  @ApiProperty({ example: "email" })
  communicationType!: string;

  @ApiProperty({ example: "mannam12340987@gmail.com" })
  communicationDetails!: string;
}

class ContactDto {
  @ApiProperty({ example: 268 })
  id!: number;

  @ApiProperty({ example: "Mannam dept Lakshmi Narayana test" })
  displayName!: string;

  @ApiProperty({ type: [CommunicationDetailsDto] })
  communicationDetails!: CommunicationDetailsDto[];
}

class OpportunityContactDto {
  @ApiProperty({ example: 71 })
  id!: number;

  @ApiProperty({ type: ContactDto })
  contact!: ContactDto;
}

class CompanyDto {
  @ApiProperty({ example: 434 })
  id!: number;

  @ApiProperty({ example: "IT solutions" })
  companyName!: string;

  @ApiProperty({ type: CountryDto })
  country!: CountryDto;
}

class LookupDto {
  @ApiProperty({ example: 255 })
  id!: number;

  @ApiProperty({ example: "Fire" })
  lookUpValue!: string;
}

class OpportunityDataDto {
  @ApiProperty({ example: 247 })
  opportunityId!: number;

  @ApiProperty({ example: 1000 })
  estimatedBrokerage!: number;

  @ApiProperty({ example: "2026-12-31" })
  expiryDate!: string;

  @ApiProperty({ example: 500000 })
  sumInsured!: number;

  @ApiProperty({ example: 20000 })
  premiumPaid!: number;

  @ApiProperty({ example: 500 })
  estimatedFee!: number;

  @ApiProperty({ example: "Some source" })
  source!: string;

  @ApiProperty({ example: "Some salesPitch" })
  salesPitch!: string;

  @ApiProperty({ type: CompanyDto })
  company!: CompanyDto;

  @ApiProperty({ type: LookupDto })
  policyType!: LookupDto;

  @ApiProperty({ type: LookupDto })
  policyStatus!: LookupDto;

  @ApiProperty({ type: LookupDto })
  serviceLevel!: LookupDto;

  @ApiProperty({ type: LookupDto })
  opportunityType!: LookupDto;

  @ApiProperty({ type: LookupDto })
  opportunitySource!: LookupDto;

  @ApiProperty({ type: LookupDto })
  isPolicyMined!: LookupDto;

  @ApiProperty({ type: [RiskLocationDto] })
  riskLocations!: RiskLocationDto[];

  @ApiProperty({ type: [DocumentDto] })
  documents!: DocumentDto[];

  @ApiProperty({ type: [ClaimExperienceDto] })
  claimExperiences!: ClaimExperienceDto[];

  @ApiProperty({ type: [MediatorDetailsDto] })
  previousMediatorDetails!: MediatorDetailsDto[];

  @ApiProperty({ type: [PlacementDetailsDto] })
  previousPlacementDetails!: PlacementDetailsDto[];

  @ApiProperty({ type: [OpportunityContactDto] })
  contacts!: OpportunityContactDto[];
}

export class OpportunityGetResponseDto {
  @ApiProperty({ example: 201 })
  status!: number;

  @ApiProperty({ example: "Opportunity created successfully" })
  message!: string;

  @ApiProperty({ type: OpportunityDataDto })
  data!: OpportunityDataDto;
}
