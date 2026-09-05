import { PartialType, ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean } from "class-validator";
import { CreateTaskDto } from "./create-task.dto";

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class updateTaskCompleteDto {
  @ApiProperty({ example: "This task is completed" })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiProperty({ 
    example: false, 
    description: "Set to true to bypass task type validation for approval tasks",
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  isTemplateApprovalTask?: boolean;
}
