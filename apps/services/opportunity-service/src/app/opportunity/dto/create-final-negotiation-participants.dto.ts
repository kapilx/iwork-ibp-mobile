import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsInt } from "class-validator";

export class CreateFinalNegotiationParticipantDto {
  @ApiProperty({
    example: 101,
    description: "ID of the participant (employee)",
  })
  @IsNotEmpty({ message: "Participant ID is required" })
  @IsInt({ message: "Participant ID must be an integer" })
  participantId: number;

  constructor(participantId: number) {
    this.participantId = participantId;
  }
}
