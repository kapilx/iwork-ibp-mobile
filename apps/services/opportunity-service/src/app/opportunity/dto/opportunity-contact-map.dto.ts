import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class OpportunityContactMapDto {
  @ApiProperty({
    description: "ID of the associated contact",
    example: 202,
  })
  @IsNotEmpty({ message: "Contact ID is required" })
  @IsInt({ message: "Contact ID must be a valid integer" })
  contactId: number;

  constructor(contactId: number) {
    this.contactId = contactId;
  }
}
