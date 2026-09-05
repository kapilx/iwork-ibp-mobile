import { Transform } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// Generic reward (Phase 1). rewardTypeLid is resolved server-side to Fixed (BR-007).
export class CreateRewardDto {
  @ApiPropertyOptional({ description: "Reward category lookup id; defaults to Generic." })
  @IsOptional()
  @IsInt()
  rewardCategoryLid?: number;

  @ApiProperty({ description: "Insurer id (active or inactive)." })
  @IsInt()
  insurerId!: number;

  @ApiProperty({ description: "Date of income (YYYY-MM-DD); Income Month derives from this." })
  @IsDateString()
  dateOfIncome!: string;

  @ApiProperty({ description: "Cumulative reward amount; positive only." })
  @Transform(({ value }) => Number(value))
  @IsPositive({ message: "Reward Amount must be positive." })
  rewardAmount!: number;

  @ApiProperty({ description: "One or more business months as first-of-month dates (YYYY-MM-01).", type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: "Select at least one Business Month." })
  @IsDateString({}, { each: true })
  businessMonths!: string[];

  @ApiPropertyOptional({ description: "Optional remarks." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({ description: "Ids of already-uploaded documents to link.", type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  documentIds?: number[];

  @ApiPropertyOptional({ description: "Set true to override the soft duplicate warning (BR-018)." })
  @IsOptional()
  @IsBoolean()
  confirmDuplicate?: boolean;
}
