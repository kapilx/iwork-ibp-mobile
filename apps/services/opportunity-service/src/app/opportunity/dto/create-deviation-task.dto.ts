import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateDeviationTaskDto {
  @ApiProperty({
    example: 76,
    description: "The ID of the opportunity activity.",
  })
  @Type(() => Number)
  @IsInt({ message: "Opportunity activity ID must be an integer." })
  @IsNotEmpty({ message: "Opportunity activity ID is required." })
  opportunityActivityId!: number;

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
  taskName!: string;

  @ApiProperty({
    example: "Deviation in underwriting process",
    description: "Description of the deviation task",
  })
  @IsOptional()
  @IsString({ message: "Description must be a string." })
  description!: string;
}
