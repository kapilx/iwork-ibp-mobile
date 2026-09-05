import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export enum LifeEventDependentAction {
  ADD = "ADD",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

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

  @ApiPropertyOptional({ description: "Effective date", example: "2024-01-01" })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description: "Optional document IDs linked to this dependent",
    example: [101, 102, 103],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  documentIds?: number[];

  @ApiPropertyOptional({
    description:
      'Life event action for this dependent (only respected when "isLifeEvent" is true at request level).',
    enum: LifeEventDependentAction,
    example: LifeEventDependentAction.DELETE,
  })
  @IsOptional()
  @IsEnum(LifeEventDependentAction)
  lifeEventAction?: LifeEventDependentAction;

  @ApiPropertyOptional({
    description: "Enrollment addition batch id",
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  enrollmentAdditionBatchId?: number;

  @ApiPropertyOptional({
    description: "Claim status indicator for the dependent",
    example: "Yes",
  })
  @IsOptional()
  @IsString()
  claimStatus?: string;

  @ApiPropertyOptional({
    description: "Choice component action type",
    example: "base",
  })
  @IsOptional()
  @IsString()
  policyComponentActionType?: string | null;

  @ApiPropertyOptional({
    description: "Choice component action type id",
    example: 129,
  })
  @IsOptional()
  @IsNumber()
  policyComponentActionTypeId?: number | null;

  @ApiPropertyOptional({
    description: "Parent component action type id",
    example: null,
  })
  @IsOptional()
  @IsNumber()
  parentpolicyComponentActionTypeId?: number | null;

  @ApiPropertyOptional({
    description: "Choice component action label",
    example: "Base Policy",
  })
  @IsOptional()
  @IsString()
  policyComponentActionLabel?: string | null;

  @ApiPropertyOptional({
    description: "Mapped choices for the dependent",
    type: [Object],
    example: [
      {
        policyComponentActionTypeId: 129,
        policyComponentActionType: "base",
        parentpolicyComponentActionTypeId: null,
        policyComponentActionLabel: "Base Policy",
      },
    ],
  })
  @IsOptional()
  choices?: Array<{
    policyComponentActionTypeId?: number | null;
    policyComponentActionType?: string | null;
    parentpolicyComponentActionTypeId?: number | null;
    policyComponentActionLabel?: string | null;
  }>;

  @ApiPropertyOptional({
    description:
      "Client-side temporary key used to correlate unsaved dependents",
    example: "father_1965-03-23_male",
  })
  @IsOptional()
  @IsString()
  tempKey?: string;

  @ApiPropertyOptional({
    description: "Whether this dependent record is part of a Life Event change",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isLifeEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Additional non-policy attributes from the upload template (e.g. MaritalStatus, Grade, Designation)',
    type: Object,
  })
  @IsOptional()
  additionalAttributes?: Record<string, any>;
}
