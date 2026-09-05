import { ApiProperty } from "@nestjs/swagger";

export class TaskDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Task name" })
  taskName: string;

  @ApiProperty({ example: 1, nullable: true, required: false })
  activityId: number | null;

  @ApiProperty({ example: 434 })
  companyId: number;

  @ApiProperty({ example: 536 })
  opportunityId: number;

  @ApiProperty({ example: 101, nullable: true, required: false })
  policyId: number | null;

  @ApiProperty({ example: 1 })
  assigneeId: number;

  @ApiProperty({ example: "2025-06-20" })
  dueDate: string;

  @ApiProperty({ example: 53 })
  priorityLid: number;

  @ApiProperty({ example: "Task description" })
  description: string;

  @ApiProperty({
    example: "POLICY_SECTION_APPROVAL",
    nullable: true,
    required: false,
  })
  taskOrigin: string | null;

  @ApiProperty({
    example: "POLICY_APPROVAL_POLICY_DETAILS",
    nullable: true,
    required: false,
  })
  taskLabel: string | null;
}
