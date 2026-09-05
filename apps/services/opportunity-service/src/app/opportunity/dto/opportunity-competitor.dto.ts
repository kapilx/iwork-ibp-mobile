import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OpportunityCompetitorDto {
  @ApiProperty({
    description: "Name of the competitor",
    example: "Competitor A",
  })
  @IsNotEmpty({ message: "Competitor is required" })
  @IsString({ message: "Competitor must be a valid string" })
  competitor: string;

  @ApiProperty({
    description: "Unique identifier for the competitor",
    example: 201,
  })
  @IsNotEmpty({ message: "Competitor ID is required" })
  @IsNumber({}, { message: "Competitor ID must be a valid number" })
  competitorId: number;

  @ApiProperty({
    description: "Unique identifier for the competitor branch",
    example: 301,
  })
  @IsNotEmpty({ message: "Competitor Branch ID is required" })
  @IsNumber({}, { message: "Competitor Branch ID must be a valid number" })
  competitorBranchId: number;

  constructor(
    competitor: string,
    competitorId: number,
    competitorBranchId: number
  ) {
    this.competitor = competitor;
    this.competitorId = competitorId;
    this.competitorBranchId = competitorBranchId;
  }
}
