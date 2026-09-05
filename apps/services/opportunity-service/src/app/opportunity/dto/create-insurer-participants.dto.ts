import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsInt, IsNumber } from "class-validator";

export class CreateInsurerParticipantDto {
  @ApiProperty({ example: 163, description: "Insurer ID" })
  @IsNotEmpty()
  @IsInt()
  insurerId: number;

  @ApiProperty({ example: 60.0, description: "Share percentage of insurer" })
  @IsNotEmpty({ message: "Share percentage is required" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: "Share percentage must be a number" }
  )
  sharePercentage: number;

  @ApiProperty({ example: 5.0, description: "Brokerage percentage" })
  @IsNotEmpty({ message: "Brokerage percentage is required" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: "Brokerage percentage must be a number" }
  )
  brokeragePercentage: number;

  @ApiProperty({ example: 1000.0, description: "Brokerage amount" })
  @IsNotEmpty({ message: "Brokerage amount is required" })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: "Brokerage amount must be a number" }
  )
  brokerageAmount: number;

  constructor(
    insurerId: number,
    sharePercentage: number,
    brokeragePercentage: number,
    brokerageAmount: number
  ) {
    this.insurerId = insurerId;
    this.sharePercentage = sharePercentage;
    this.brokeragePercentage = brokeragePercentage;
    this.brokerageAmount = brokerageAmount;
  }
}
