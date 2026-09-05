import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

/**
 * DTO for creating meeting feedback, including outcomes, challenges, and next steps.
 */
export class CreateMeetingFeedbackDto {
  @ApiProperty({
    description: "Rating of the meeting for which feedback is being provided",
    type: Number,
    example: 1,
  })
  @IsNotEmpty({ message: "Meeting rating is required." })
  @IsInt({ message: "Meeting rating must be an integer." })
  @Min(1, { message: "Meeting rating must be a positive integer." })
  @Max(5, { message: "Meeting rating must be less than or equal to 5." })
  meetingRating!: number;

  @ApiProperty({
    description: "Remarks of the meeting.",
    example: "Meeting remarks",
  })
  @IsOptional()
  @IsString({ message: "Meeting remarks must be string." })
  remarks?: string;

  @ApiProperty({
    description: "Array of outcome IDs associated with the meeting",
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty({ message: "Meeting outcomes are required." })
  @IsInt({ each: true, message: "Each outcomeId must be an integer." })
  @Min(1, { each: true, message: "Each outcomeId must be a positive integer." })
  meetingOutcomes!: number[];

  @ApiProperty({
    description: "Array of challenge IDs associated with the meeting",
    type: [Number],
    example: [4, 5],
  })
  @IsArray()
  @ArrayNotEmpty({ message: "Meeting challenges are required." })
  @IsInt({ each: true, message: "Each challengeId must be an integer." })
  @Min(1, {
    each: true,
    message: "Each challengeId must be a positive integer.",
  })
  meetingChallenges!: number[];

  @ApiProperty({
    description: "Array of next step IDs associated with the meeting",
    type: [Number],
    example: [6, 7, 8],
  })
  @IsArray()
  @ArrayNotEmpty({ message: "Meeting next steps are required." })
  @IsInt({ each: true, message: "Each nextStepId must be an integer." })
  @Min(1, {
    each: true,
    message: "Each nextStepId must be a positive integer.",
  })
  meetingNextSteps!: number[];

  @IsOptional()
  updatedBy?: number;
}
