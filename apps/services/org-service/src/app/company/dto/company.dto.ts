import { ApiProperty } from "@nestjs/swagger";
import { successMessage } from "../../../../../../../libs/service-lib/src/lib/messages";
import { CompanyDetailsDto } from "./company-detail.dto";

class CompanyDto extends CompanyDetailsDto {
  @ApiProperty({ example: "Example Company" })
  companyName!: string;

  @ApiProperty({ example: 461 })
  companyId!: number;

  @ApiProperty({ example: "Example" })
  displayName!: string;

  @ApiProperty({ example: 500 })
  noOfEmployees!: number;

  @ApiProperty({ example: "Visakhapatnam" })
  city!: string;

  @ApiProperty({ example: null, nullable: true })
  priority!: string | null;

  @ApiProperty({ example: null, nullable: true })
  industrySegment!: string | null;

  @ApiProperty({ example: null, nullable: true })
  companyType!: string | null;

  @ApiProperty({ example: "Positive feedback from clients." })
  sentiment!: string;

  @ApiProperty({ example: 0 })
  sumInsured!: number;

  @ApiProperty({ example: 0 })
  salesOpportunityCount!: number;

  @ApiProperty({ example: 0 })
  renewalOpportunityCount!: number;

  @ApiProperty({ example: 0 })
  policyCount!: number;

  @ApiProperty({ example: 0 })
  annualPremium!: number;

  @ApiProperty({ example: "testing1 testing" })
  leadCRM!: string;

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

class CompanyDataDto {
  @ApiProperty({ type: [CompanyDto] })
  data!: CompanyDto[];

  @ApiProperty({ example: 17 })
  count!: number;

  @ApiProperty({ example: 0 })
  totalRoCount!: number;

  @ApiProperty({ example: 0 })
  totalRoPremium!: number;

  @ApiProperty({ example: 0 })
  totalSoCount!: number;

  @ApiProperty({ example: 0 })
  totalSoPremium!: number;

  @ApiProperty({ example: 0 })
  untappedCompanies!: number;
}

export class CompanyListResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: successMessage.companyListRetrieved })
  message!: string;

  @ApiProperty({ type: CompanyDataDto })
  data!: CompanyDataDto;
}
