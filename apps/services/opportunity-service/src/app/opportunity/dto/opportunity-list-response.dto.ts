import { ApiProperty } from "@nestjs/swagger";
import { successMessage } from "../../../../../../../libs/service-lib/src/lib/messages";

class ContactsDto {
  @ApiProperty({ example: 272 })
  contactId!: number;

  @ApiProperty({ example: "John Doe" })
  displayName!: string;
}

class OpportunityDataDto {
  @ApiProperty({ example: 28 })
  opportunityId!: number;

  @ApiProperty({ example: 434, nullable: true })
  companyId!: number | null;

  @ApiProperty({ example: "Viacom18 Media Private Limited", nullable: true })
  companyName!: string | null;

  @ApiProperty({ example: "Ghmc", nullable: true })
  policyType!: string | null;

  @ApiProperty({ example: null, nullable: true })
  activityName!: string | null;

  @ApiProperty({ example: "Under Review", nullable: true })
  stage!: string | null;

  @ApiProperty({ example: 53, nullable: true })
  priority!: number | null;

  @ApiProperty({ example: null, nullable: true })
  opportunityCreationDate!: string | null;

  @ApiProperty({ example: null, nullable: true })
  assignedTo!: string | null;

  @ApiProperty({ example: null, nullable: true })
  branch!: string | null;

  @ApiProperty({ example: "2025-10-31" })
  expectedCloseDate!: string;

  @ApiProperty({ example: 1000 })
  premium!: number;

  @ApiProperty({ example: 1000 })
  sumInsured!: number;

  @ApiProperty({ example: 272, nullable: true })
  contactId!: number | null;

  @ApiProperty({ type: [ContactsDto] })
  contact!: ContactsDto[];

  @ApiProperty({ example: "SO", enum: ["SO", "RO"] })
  opportunityType!: "SO" | "RO";
}

class OpportunityResponseDto {
  @ApiProperty({ type: [OpportunityDataDto] })
  data!: OpportunityDataDto[];

  @ApiProperty({ example: 17 })
  count!: number;

  @ApiProperty({ example: 0 })
  opportunityLeads!: number;

  @ApiProperty({ example: 0 })
  opportunityProspects!: number;

  @ApiProperty({ example: 0 })
  opportunityQcr!: number;

  @ApiProperty({ example: 0 })
  opportunityClients!: number;
}

export class OpportunityListResponseDto {
  @ApiProperty({ example: 200 })
  status!: number;

  @ApiProperty({ example: successMessage.opportunityListRetrieved })
  message!: string;

  @ApiProperty({ type: OpportunityResponseDto })
  data!: OpportunityResponseDto;
}
