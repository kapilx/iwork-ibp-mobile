import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class UpsertEnrollmentDependentDto {
  @ApiPropertyOptional({ description: "Existing dependent ID", example: 1 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: "Name of the dependent", example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "Relation of the dependent", example: "Spouse" })
  @IsString()
  @IsNotEmpty()
  relation!: string;

  @ApiPropertyOptional({ description: "Relationship type", example: "primary" })
  @IsOptional()
  @IsString()
  relationshipType?: string;

  @ApiPropertyOptional({
    description: "Date of birth of the dependent",
    example: "1990-01-01",
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: "Gender of the dependent",
    example: "Male",
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: "effectiveDate ", example: "2023-10-01" })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description: "Enrollment addition batch id",
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  enrollmentAdditionBatchId?: number;

  @ApiPropertyOptional({
    description:
      'When true, only newly added dependents should move to endorsement ready status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  statusUpdateForNewDependentsOnly?: boolean;

  @ApiPropertyOptional({
    description: "Claim status indicator for the dependent",
    example: "Yes",
  })
  @IsOptional()
  @IsString()
  claimStatus?: string | null;

  @ApiPropertyOptional({
    description: 'Additional non-policy attributes from the upload template (e.g. MaritalStatus, Grade, Designation)',
    type: Object,
  })
  @IsOptional()
  additionalAttributes?: Record<string, any>;
}
