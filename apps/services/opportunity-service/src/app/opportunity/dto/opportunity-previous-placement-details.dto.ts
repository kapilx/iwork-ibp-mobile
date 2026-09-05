import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class OpportunityPreviousPlacementDetailsDto {
  @ApiProperty({
    description: "Details about challenges and mitigation strategies",
    example: "High competition mitigated by offering better pricing.",
  })
  @IsOptional()
  @IsString({ message: "Challenges and Mitigation must be a valid string" })
  challengesAndMitigation?: string;

  @ApiProperty({
    description: "Details about existing competition",
    example: "Competitor A and Competitor B are active in this region.",
  })
  @IsOptional()
  @IsString({ message: "Existing Competition must be a valid string" })
  existingCompetition?: string;

  @ApiProperty({
    description: "Additional remarks or comments",
    example: "Client prefers a long-term policy.",
  })
  @IsOptional()
  @IsString({ message: "Remarks must be a valid string" })
  remarks?: string;
}
