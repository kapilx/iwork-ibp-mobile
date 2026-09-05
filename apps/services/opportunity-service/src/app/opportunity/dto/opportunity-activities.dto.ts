import { ApiProperty } from "@nestjs/swagger";

// Participant DTO
export class ParticipantDto {
  @ApiProperty({ example: 1, description: "The ID of the participant (user)." })
  userId: number;

  @ApiProperty({
    example: "testing1",
    description: "The name of the participant.",
  })
  userName: string;
}

// Activity DTO
export class ActivityDto {
  @ApiProperty({ example: 15 })
  opportunityActivityId: number;

  @ApiProperty({ example: 3 })
  activityId: number;

  @ApiProperty({ example: "Mandate Details Entry" })
  activityName: string;

  @ApiProperty({ example: "true" })
  activityApproval: string;

  @ApiProperty({ example: "true" })
  activityMandatory: string;

  @ApiProperty({ example: "2025-05-10", nullable: true })
  dueDate: string | null;

  @ApiProperty({ type: [ParticipantDto] })
  participants: ParticipantDto[];
}

// Stage DTO
export class StageDto {
  @ApiProperty({ example: 1 })
  stageId: number;

  @ApiProperty({ example: "Initial Contact" })
  stageName: string;

  @ApiProperty({ type: [ActivityDto] })
  activities: ActivityDto[];
}

// Inner data wrapper
export class InnerDataWrapperDto {
  @ApiProperty({ type: [StageDto] })
  data: StageDto[];
}

// Final response DTO
export class GetOpportunityActivitiesResponseDto {
  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({
    example: "Opportunity Activities retrieved successfully",
  })
  message: string;

  @ApiProperty({ type: InnerDataWrapperDto })
  data: InnerDataWrapperDto;
}
