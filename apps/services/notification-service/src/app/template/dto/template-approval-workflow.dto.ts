import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { ApprovalStatusEnum, WorkflowActionEnum } from '../../../../../service-lib/src/lib/constants';

export class TemplateApprovalWorkflowDto {
  @ApiProperty({
    description: "Workflow action to perform",
    enum: WorkflowActionEnum,
    example: WorkflowActionEnum.SUBMIT,
  })
  @IsEnum(WorkflowActionEnum)
  @IsNotEmpty()
  action!: WorkflowActionEnum;

  @ApiProperty({
    description: "User ID who is performing the action",
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  performedBy!: number;

  @ApiProperty({
    description: "Full name of the user performing the action",
    example: "John Doe",
  })
  @IsString()
  @IsNotEmpty()
  performedByName!: string;

  @ApiPropertyOptional({
    description: "Comments for the workflow action",
    example: "Template looks good, approved for production use",
    maxLength: 1000
  })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class WorkflowStatusResponseDto {
  @ApiProperty({
    description: "Template ID",
    example: 1,
  })
  templateId!: number;

  @ApiProperty({
    description: "Current approval status",
    enum: ApprovalStatusEnum,
    example: ApprovalStatusEnum.PENDING_APPROVAL,
  })
  currentStatus!: ApprovalStatusEnum;

  @ApiProperty({
    description: "Previous approval status",
    enum: ApprovalStatusEnum,
    example: ApprovalStatusEnum.DRAFT,
  })
  previousStatus!: ApprovalStatusEnum;

  @ApiProperty({
    description: "User ID who performed the last action",
    example: 1,
  })
  lastActionBy!: number;

  @ApiProperty({
    description: "Timestamp of the last action",
    example: "2024-01-15T10:30:00Z",
  })
  lastActionAt!: Date;

  @ApiPropertyOptional({
    description: "Comments from the last action",
    example: "Submitted for management review",
  })
  lastActionComment?: string;
}

export class ApprovalHistoryResponseDto {
  @ApiProperty({
    description: "History record ID",
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: "Template ID",
    example: 1,
  })
  templateId!: number;

  @ApiProperty({
    description: "Workflow action performed",
    enum: WorkflowActionEnum,
    example: WorkflowActionEnum.SUBMIT,
  })
  action!: WorkflowActionEnum;

  @ApiProperty({
    description: "Previous approval status",
    enum: ApprovalStatusEnum,
    example: ApprovalStatusEnum.DRAFT,
  })
  fromStatus!: ApprovalStatusEnum;

  @ApiProperty({
    description: "New approval status after action",
    enum: ApprovalStatusEnum,
    example: ApprovalStatusEnum.PENDING_APPROVAL,
  })
  toStatus!: ApprovalStatusEnum;

  @ApiProperty({
    description: "User ID who performed the action",
    example: 1,
  })
  performedBy!: number;

  @ApiPropertyOptional({
    description: "Comments for the action",
    example: "Template submitted for management review",
  })
  comment?: string;

  @ApiProperty({
    description: "Timestamp when the action was performed",
    example: "2024-01-15T10:30:00Z",
  })
  performedAt!: Date;

}
