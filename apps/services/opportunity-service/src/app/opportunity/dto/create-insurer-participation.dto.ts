import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsInt, IsOptional } from "class-validator";

export class CreateInsurerParticipantDto {
  @ApiProperty({ example: 1, description: "Insurer ID" })
  @IsNotEmpty()
  @IsInt()
  insurerId: number;

  @ApiProperty({ example: 60.0, description: "Share percentage of insurer" })
  @IsOptional()
  sharePercentage: number;

  @ApiProperty({ example: 5.0, description: "Brokerage percentage" })
  @IsOptional()
  brokeragePercentage: number;

  @ApiProperty({ example: 1000.0, description: "Brokerage amount" })
  @IsOptional()
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
