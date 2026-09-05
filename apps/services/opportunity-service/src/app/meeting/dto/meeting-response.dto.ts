import { ApiProperty } from "@nestjs/swagger";

export class MeetingDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 29 })
  opportunityId: number;

  @ApiProperty({ example: 1 })
  activityId: number;

  @ApiProperty({ example: 343 })
  meetingTypeLid: number;

  @ApiProperty({ example: 434 })
  companyId: number;

  @ApiProperty({ example: "2025-06-20" })
  meetingDate: string;

  @ApiProperty({ example: "2023-10-01T10:00:00.000Z" })
  startTime: string;

  @ApiProperty({ example: "2023-10-01T11:00:00.000Z" })
  endTime: string;
}
