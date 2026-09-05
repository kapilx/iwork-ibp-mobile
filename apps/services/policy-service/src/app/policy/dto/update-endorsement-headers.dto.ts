import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class UpdateEndorsementHeadersDto {
  @ApiProperty({
    description: "Net premium for the endorsement",
    type: Number,
  })
  @IsNumber()
  netPremium!: number;
}
