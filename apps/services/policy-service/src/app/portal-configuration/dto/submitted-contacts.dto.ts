import { ApiProperty } from "@nestjs/swagger";
import { PortalContactDto } from "./portal-contact.dto";

export class SubmittedPartyContactsDto {
  @ApiProperty({
    type: PortalContactDto,
    nullable: true,
    description: "Primary submitted contact for this party",
  })
  primary?: PortalContactDto;

  @ApiProperty({
    type: PortalContactDto,
    nullable: true,
    description: "Secondary submitted contact for this party",
  })
  secondary?: PortalContactDto;
}

export class SubmittedContactsDto {
  @ApiProperty({
    description: "Policy identifier",
    example: 555419,
  })
  policyId!: number;

  @ApiProperty({
    type: SubmittedPartyContactsDto,
    description: "Submitted contacts for TPA",
  })
  tpa!: SubmittedPartyContactsDto;

  @ApiProperty({
    type: SubmittedPartyContactsDto,
    description: "Submitted contacts for Insurer",
  })
  insurer!: SubmittedPartyContactsDto;
}
