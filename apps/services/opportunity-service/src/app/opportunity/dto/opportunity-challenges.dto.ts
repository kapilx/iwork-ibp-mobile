import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class OpportunityChallengeDto {
  @ApiProperty({
    description: "Type of the Challenge",
    example: 270,
  })
  @IsNotEmpty({ message: "Challenge Type is required" })
  @IsNumber({}, { message: "Challenge Type ID must be a valid number" })
  challengeTypeLid: number;

  @ApiProperty({
    description: "Description of the Challenge",
    example: "This is a sample challenge description.",
  })
  @IsNotEmpty({ message: "Challenge Description is required" })
  @IsString({ message: "Challenge Description must be a valid string" })
  description: string;

  @ApiProperty({
    description: "Type of the Mitigation",
    example: 272,
  })
  @IsNotEmpty({ message: "Mitigation Type is required" })
  @IsNumber({}, { message: "Mitigation Type ID must be a valid number" })
  mitigationTypeLid: number;

  @ApiProperty({
    description: "Description of the Mitigation",
    example: "This is a sample mitigation description.",
  })
  @IsNotEmpty({ message: "Mitigation Description is required" })
  @IsString({ message: "Mitigation Description must be a valid string" })
  mitigationDescription: string;

  constructor(
    challengeTypeLid: number,
    description: string,
    mitigationTypeLid: number,
    mitigationDescription: string
  ) {
    this.challengeTypeLid = challengeTypeLid;
    this.description = description;
    this.mitigationTypeLid = mitigationTypeLid;
    this.mitigationDescription = mitigationDescription;
  }
}
