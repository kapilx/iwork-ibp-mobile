import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Matches,
  IsArray,
  ValidateNested,
  MaxLength,
  IsBoolean,
} from "class-validator";

export class CreateTaskDocumentDto {
  @ApiProperty({
    description: "Document ID",
    example: 1,
  })
  @IsInt({ message: "Document ID must be a number." })
  @IsNotEmpty({ message: "Document ID is required." })
  @Min(1, {
    message: "Document ID must be positive number.",
  })
  documentId: number;
}

export class CreateTaskDto {
  @ApiProperty({
    description: "Task name",
    example: "test task",
  })
  @IsString({ message: "Task name must be a string." })
  @IsNotEmpty({ message: "Task name is required." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  @MaxLength(255, {
    message: "Task subject must not exceed 255 characters.",
  })
  taskName: string;

  @IsInt({ message: "Activity id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Activity id must be positive number.",
  })
  activityId: number;

  @IsInt({ message: "Company id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Company id must be positive number.",
  })
  companyId: number;

  @IsInt({ message: "Opportunity id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Opportunity id must be positive number.",
  })
  opportunityId: number;

  @ApiProperty({
    description: "Assignee ID",
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: "Assignee id must be a number." })
  @Min(1, {
    message: "Assignee id must be positive number.",
  })
  assigneeId?: number;

  @IsOptional()
  @IsInt({ message: "Policy id must be a number." })
  @Min(1, { message: "Policy id must be positive number." })
  policyId?: number;

  @IsOptional()
  @IsInt({ message: "Template id must be a number." })
  @Min(1, { message: "Template id must be positive number." })
  templateId?: number;

  @ApiProperty({
    description: "Task Date",
    type: String,
    example: "2025-06-20",
  })
  @IsString({ message: "Task date must be a string." })
  @Transform(({ value }: { value: string }) => (value ? value.trim() : value))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Task date must be in the format YYYY-MM-DD.",
  })
  @Transform(({ value }: { value: string }) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      throw new BadRequestException(
        "The task date cannot be past date. Please provide a valid date."
      );
    }
    return value;
  })
  dueDate: string;

  @IsOptional()
  @IsInt({ message: "Task status ID must be a number." })
  taskStatusLid?: number;

  @IsOptional()
  @IsInt({ message: "Task type ID must be a number." })
  taskTypeLid?: number;

  @IsOptional()
  @IsInt({ message: "Sub-task type ID must be a number." })
  subTaskTypeLid?: number;

  @IsOptional()
  @IsString({ message: "Task close must be a string." })
  taskClose?: string;

  @IsOptional()
  @IsString({ message: "Task is editable must be a string." })
  taskIsEditable?: string;

  @IsOptional()
  @IsString({ message: "Task origin must be a string." })
  taskOrigin?: string;

  @IsOptional()
  @IsString({ message: "Task label must be a string." })
  taskLabel?: string;

  @ApiProperty({ description: "Priority ID", example: 53 })
  @IsInt({ message: "Priority ID must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Priority ID must be positive number.",
  })
  priorityLid: number;

  @ApiPropertyOptional({
    description: "Description",
    type: String,
    example: "Task description",
  })
  @IsString({ message: "Description must be a string." })
  @IsOptional()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  description?: string;

  @ApiPropertyOptional({
    description: "Task documents",
    type: [CreateTaskDocumentDto],
  })
  @IsOptional()
  @IsArray({ message: "Task documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDocumentDto)
  documents?: CreateTaskDocumentDto[];

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;

  @ApiPropertyOptional({ 
    example: false, 
    description: "Set to true to identify this as a template approval task",
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isTemplateApprovalTask?: boolean;
}
