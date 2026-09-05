import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  ValidateNested,
  ArrayUnique,
} from "class-validator";
import { Type } from "class-transformer";
import { UpsertEnrollmentDependentDto } from "./upsert-enrollment-dependent.dto";
import {
  CombinedEnrollmentChoiceDto,
  EnrollmentChoiceDto,
} from "./enrollment-choice.dto";

export enum EnrollmentAction {
  SAVE = "save",
  SUBMIT = "submit",
}

export class UpsertEnrollmentDataDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  employeeId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  policyId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  companyId!: number;

  @ApiProperty({ enum: EnrollmentAction })
  @IsEnum(EnrollmentAction)
  action!: EnrollmentAction;

  @ApiPropertyOptional({ type: [UpsertEnrollmentDependentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertEnrollmentDependentDto)
  dependents?: UpsertEnrollmentDependentDto[];

  @ApiPropertyOptional({ type: [EnrollmentChoiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnrollmentChoiceDto)
  choices?: EnrollmentChoiceDto[];

  @ApiPropertyOptional({
    description: "Flag indicating a dependent-only update",
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isDependentOnly?: boolean;

  @ApiPropertyOptional({
    description:
      'When true, only newly added dependents should move to endorsement ready status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  statusUpdateForNewDependentsOnly?: boolean;
}

export class UpsertCombinedEnrollmentDataDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  employeeId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  companyId!: number;

  @ApiProperty({ enum: EnrollmentAction })
  @IsEnum(EnrollmentAction)
  action!: EnrollmentAction;

  @ApiPropertyOptional({
    description:
      "When true, interpret dependent updates as Life Event changes (explicit delete/add/update).",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isLifeEvent?: boolean;

  @ApiPropertyOptional({ type: [UpsertEnrollmentDependentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertEnrollmentDependentDto)
  dependents?: UpsertEnrollmentDependentDto[];

  @ApiPropertyOptional({ type: [CombinedEnrollmentChoiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombinedEnrollmentChoiceDto)
  combinedChoices?: CombinedEnrollmentChoiceDto[];

  @ApiPropertyOptional({
    description: "IDs of dependents to explicitly soft-delete (used for profile-level dependents that have no policy mapping).",
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  deletedDependentIds?: number[];

  @ApiPropertyOptional({
    description: "Disclaimers accepted by the employee at submission time, stored per policy.",
    type: [Object],
    example: [{ policyId: 1, text: "I confirm the information is accurate.", isMandatory: true, acceptedAt: "2026-05-28T10:00:00.000Z" }],
  })
  @IsOptional()
  @IsArray()
  disclaimersAccepted?: Array<{ policyId: number; text: string; isMandatory: boolean; acceptedAt: string }>;
}
