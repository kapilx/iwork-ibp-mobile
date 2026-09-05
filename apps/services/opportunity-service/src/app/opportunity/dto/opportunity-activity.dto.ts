import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsJSON,
  IsArray,
  IsInt,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class OpportunityActivityDto {
  @ApiProperty({
    description: "Unique identifier for the opportunity activity",
    example: 101,
  })
  @IsNotEmpty({ message: "Opportunity activity ID is required" })
  @IsNumber({}, { message: "Opportunity activity ID must be a valid number" })
  opportunityActivityId!: number;

  @ApiProperty({
    description: "Due date for the activity",
    example: "2025-05-10",
  })
  @IsNotEmpty({ message: "Due Date is required" })
  @IsDateString({}, { message: "Due Date must be a valid ISO date" })
  dueDate!: string;

  @ApiProperty({
    description: "Participants of the given activity",
    example: [1, 2],
  })
  @IsArray({ message: "Participants must be an array of valid users" })
  participants!: number[];

  @ApiProperty({
    description: "Owner of the activity",
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Owner ID must be a valid number" })
  ownerId?: number;
}

export class OpportunityActivitiesDto {
  @ApiProperty({
    description: "List of opportunity activities",
    type: [OpportunityActivityDto],
  })
  @IsArray({ message: "Opportunity activities must be an array" })
  @ValidateNested({ each: true })
  @Type(() => OpportunityActivityDto)
  opportunityActivities!: OpportunityActivityDto[];

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}
