import { ApiProperty } from "@nestjs/swagger";

class CompanyAddress {
  @ApiProperty({ example: 1 })
  addressTypeLid!: number;

  @ApiProperty({ example: "123 Main St" })
  address1!: string;

  @ApiProperty({ example: 1 })
  countryId!: number;

  @ApiProperty({ example: 1 })
  stateId!: number;

  @ApiProperty({ example: 1 })
  cityId!: number;

  @ApiProperty({ example: "" })
  address2!: string;

  @ApiProperty({ example: "Downtown" })
  area!: string;

  @ApiProperty({ example: "10001" })
  pinCode!: string;

  @ApiProperty({ example: "1234567890" })
  phoneNumber!: string;

  @ApiProperty({ example: "" })
  alternatePhoneNumber!: string;

  @ApiProperty({ example: "" })
  email!: string;

  @ApiProperty({ example: "" })
  supportNumber!: string;

  @ApiProperty({ example: 1 })
  id!: number;
}

class CompanyAddressDto {
  @ApiProperty({ type: CompanyAddress })
  address!: CompanyAddress;

  @ApiProperty({ example: false })
  isPrimary!: boolean;

  @ApiProperty({ example: 1 })
  id!: number;
}

class StateGstDetailDto {
  @ApiProperty({ example: 1 })
  stateId!: number;

  @ApiProperty({ example: "22ABCDE1234F1Z5" })
  gstNumber!: string;

  @ApiProperty({ example: 101 })
  gstCategoryLid!: number;

  @ApiProperty({ example: 1 })
  id!: number;
}

class GroupCompanyMapDto {
  @ApiProperty({ example: 114 })
  groupCompanyId!: number;

  @ApiProperty({ example: "Example Group" })
  groupCompanyName!: string;
}

class CompanyDocMapDto {
  @ApiProperty({ example: 25 })
  documentId!: number;

  @ApiProperty({ example: 1 })
  id!: number;
}

class CommunicationDetailDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "email" })
  communicationType!: string;

  @ApiProperty({ example: "email@gmail.com" })
  communicationDetails!: string;

  @ApiProperty({ example: true })
  isPrimary!: boolean;
}

class ContactOwnerDto {
  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: "testing1" })
  firstName!: string;

  @ApiProperty({ example: "testing" })
  lastName!: string;
}

class ContactDepartmentDto {
  @ApiProperty({ example: 6 })
  id!: number;

  @ApiProperty({ example: "Sales" })
  name!: string;

  @ApiProperty({ example: "Sales Department" })
  description!: string;
}

class ContactDesignationDto {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: "ENGINEER" })
  name!: string;

  @ApiProperty({ example: "Engineer" })
  description!: string;
}

class CompanyContactDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "John" })
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  lastName!: string;

  @ApiProperty({ example: "" })
  middleName!: string;

  @ApiProperty({ example: "John Doe" })
  displayName!: string;

  @ApiProperty({ type: [CommunicationDetailDto] })
  communicationDetails!: CommunicationDetailDto[];

  @ApiProperty({ type: ContactOwnerDto })
  owner!: ContactOwnerDto;

  @ApiProperty({ example: "Finance" })
  department!: string;

  @ApiProperty({ example: "Accountant" })
  designation!: string;
}

class CompanyDetailsDto {
  @ApiProperty({ example: 114 })
  companyId!: number;

  @ApiProperty({ example: "For Testing Purpose test" })
  companyHistory!: string;

  @ApiProperty({ example: "For Testing Purpose" })
  majorProducts!: string;

  @ApiProperty({ example: "Ver IT" })
  keyCustomers!: string;

  @ApiProperty({ example: "" })
  documentsUploaded!: string;

  @ApiProperty({ example: "For Testing Purpose" })
  businessProcesses!: string;

  @ApiProperty({ example: "For Testing Purpose" })
  accountStrategy!: string;

  @ApiProperty({ example: "For Testing Purpose" })
  targetingReason!: string;

  @ApiProperty({ example: "Ver IT" })
  competitor!: string;

  @ApiProperty({ example: "For Testing Purpose" })
  weakness!: string;

  @ApiProperty({ example: "For Testing Purpose" })
  actionPlan!: string;

  @ApiProperty({ example: "" })
  potentialOpportunity!: string;

  @ApiProperty({ example: "" })
  industryIntelligence!: string;

  @ApiProperty({ example: "" })
  servicePlan!: string;

  @ApiProperty({ example: "" })
  acquisitionHistory!: string;

  @ApiProperty({ example: "" })
  bizProfile!: string;

  @ApiProperty({ example: "" })
  servicePerformance!: string;

  @ApiProperty({ example: "" })
  salesPitch!: string;

  @ApiProperty({ example: 1 })
  id!: number;
}

export class CompanyResponseDto {
  @ApiProperty({ example: "Example Company" })
  companyName!: string;

  @ApiProperty({ example: "Example" })
  displayName!: string;

  @ApiProperty({ example: 500 })
  noOfEmployees!: number;

  @ApiProperty({ example: "https://example.com" })
  website!: string;

  @ApiProperty({ example: "2025-03-20" })
  dateOfIncorporation!: string;

  @ApiProperty({ example: "ABCDE1234F" })
  panCardNumber!: string;

  @ApiProperty({ example: "L98765DL1999PLC987654" })
  registrationNo!: string;

  @ApiProperty({ example: 1000000 })
  annualPremium!: number;

  @ApiProperty({ example: "ABCD12345E" })
  tanNumber!: string;

  @ApiProperty({ example: 114 })
  id!: number;

  @ApiProperty({ example: "For Testing Purpose" })
  remarks!: string;

  @ApiProperty({ example: "Internal" })
  source!: string;

  @ApiProperty({ type: CompanyDetailsDto })
  details!: CompanyDetailsDto;

  @ApiProperty({ type: [CompanyAddressDto] })
  companyAddresses!: CompanyAddressDto[];

  @ApiProperty({ type: [StateGstDetailDto] })
  stateGstDetails!: StateGstDetailDto[];

  @ApiProperty({ type: GroupCompanyMapDto })
  groupCompanyMap!: GroupCompanyMapDto;

  @ApiProperty({ type: [CompanyDocMapDto] })
  companyDocMaps!: CompanyDocMapDto[];

  @ApiProperty({ type: [CompanyContactDto] })
  contacts!: CompanyContactDto[];

  @ApiProperty({ example: 0 })
  salesOpportunityCount!: number;

  @ApiProperty({ example: 0 })
  renewalOpportunityCount!: number;

  @ApiProperty({ example: 0 })
  policyCount!: number;

  @ApiProperty({ example: 0 })
  sumInsured!: number;

  @ApiProperty({ example: "" })
  previousInsurer!: string;

  @ApiProperty({ example: "" })
  previousTpa!: string;

  @ApiProperty({ example: "" })
  previousBroker!: string;

  @ApiProperty({ example: 0 })
  salesOpportunityBeyondTheQuarterCount!: number;

  @ApiProperty({ example: 0 })
  renewalOpportunityBeyondTheQuarterCount!: number;
}
