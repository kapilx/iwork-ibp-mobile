import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { UpsertEnrollmentDependentDto } from "./upsert-enrollment-dependent.dto";

export class UpsertProfileDependentsDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  employeeId!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  policyId?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  companyId!: number;

  @ApiPropertyOptional({
    description:
      "When true, treat as update request context (no deletion is performed in dependent-only mode).",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isUpdate?: boolean;

  @ApiProperty({ type: [UpsertEnrollmentDependentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertEnrollmentDependentDto)
  dependents!: UpsertEnrollmentDependentDto[];
}
