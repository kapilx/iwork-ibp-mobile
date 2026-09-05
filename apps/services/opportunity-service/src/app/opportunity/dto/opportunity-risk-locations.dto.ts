import { IsNotEmpty, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OpportunityRiskLocationDto {
  @ApiProperty({ description: "Address ID", example: 1001 })
  @IsNotEmpty({ message: "Address ID is required" })
  @IsNumber({}, { message: "Address ID must be a valid number" })
  addressId: number;

  constructor(addressId: number) {
    this.addressId = addressId;
  }
}
