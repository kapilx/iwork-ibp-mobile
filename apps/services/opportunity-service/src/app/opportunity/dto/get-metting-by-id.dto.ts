import { ApiProperty } from "@nestjs/swagger";

class CompanyDto {
  @ApiProperty({ description: "Company ID", example: 1 })
  id: number;

  @ApiProperty({ description: "Company name", example: "ABC Corp" })
  name: string;
}

class OpportunityDto {
  @ApiProperty({ description: "Opportunity ID", example: 1 })
  id: number;

  @ApiProperty({
    description: "Opportunity name",
    example: "New Business Opportunity",
  })
  name: string;
}

class MeetingTypeDto {
  @ApiProperty({ description: "Meeting Type ID", example: 2 })
  id: number;

  @ApiProperty({ description: "Meeting Type name", example: "Client Meeting" })
  name: string;
}

class ParticipantDto {
  @ApiProperty({ description: "Participant name", example: "John Doe" })
  name: string;
}

export class GetMeetingByIdResponseDto {
  @ApiProperty({ description: "Meeting ID", example: 1 })
  id: number;

  @ApiProperty({ description: "Meeting Date", example: "2025-05-10" })
  meetingDate: string;

  @ApiProperty({ description: "Start Time", example: "2025-05-10T10:00:00Z" })
  startTime: string;

  @ApiProperty({ description: "End Time", example: "2025-05-10T11:00:00Z" })
  endTime: string;

  @ApiProperty({
    description: "Meeting location",
    example: "Conference Room A",
  })
  location: string;

  @ApiProperty({
    description: "Minutes of the meeting",
    example: "Discussed project timelines and deliverables.",
  })
  minutesOfMeeting: string;

  @ApiProperty({ description: "Company details", type: CompanyDto })
  company: CompanyDto;

  @ApiProperty({ description: "Opportunity details", type: OpportunityDto })
  opportunity: OpportunityDto;

  @ApiProperty({ description: "Meeting Type details", type: MeetingTypeDto })
  meetingTypeLid: MeetingTypeDto;

  @ApiProperty({
    description: "List of participants",
    type: [ParticipantDto],
  })
  participants: ParticipantDto[];
}
