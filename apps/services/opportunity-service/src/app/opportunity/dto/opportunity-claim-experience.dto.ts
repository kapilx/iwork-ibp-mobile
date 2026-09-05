import { IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OpportunityClaimExperienceDto {
  @ApiProperty({
    description: "Start date of the policy",
    example: "2023-01-01",
  })
  @IsOptional()
  @IsString({ message: "Policy From date must be a valid date" })
  policyFrom!: Date;

  @ApiProperty({ description: "End date of the policy", example: "2023-12-31" })
  @IsOptional()
  @IsString({ message: "Policy To date must be a valid date" })
  policyTo!: Date;

  @ApiProperty({
    description: "Description of the nature of loss",
    example: "Fire",
  })
  @IsOptional()
  @IsString({ message: "Nature of Loss must be a valid string" })
  natureOfLoss!: string;

  @ApiProperty({ description: "Premium amount for the policy", example: 1000 })
  @IsOptional()
  @IsNumber({}, { message: "Premium must be a valid number" })
  premium!: number;

  @ApiProperty({ description: "Claim amount for the policy", example: 5000 })
  @IsOptional()
  @IsNumber({}, { message: "Claim Amount must be a valid number" })
  claimAmount!: number;

  @ApiProperty({ description: "Claim percentage for the policy", example: 20 })
  @IsOptional()
  @IsNumber({}, { message: "Claim Percentage must be a valid number" })
  claimPercentage!: number;

  @ApiProperty({
    description: "Remarks or comments about the claim experience",
    example: "No major issues",
  })
  @IsOptional()
  @IsString({ message: "Remarks must be a valid string" })
  remarks!: string;
}
