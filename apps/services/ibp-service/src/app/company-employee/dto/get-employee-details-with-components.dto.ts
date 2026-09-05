import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UpsertEnrollmentDependentDto } from "./upsert-enrollment-dependent.dto";
import { Type } from "class-transformer";

export class GetEmployeeDetails {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  policyId!: number;

  @ApiProperty({ example: 1 })
  employeeCompanyId!: number;

  @ApiProperty({ example: "Employee" })
  employeeName!: string;

  @ApiProperty({ example: "2026-12-31" })
  dateOfBirth!: string;

  @ApiProperty({ example: "Male" })
  gender!: string;

  @ApiProperty({ example: "test@gmail.com" })
  email!: string;

  @ApiProperty({ example: "9999999999" })
  phone!: string;

  @ApiProperty({ example: "manager" })
  designation!: string;
  @ApiProperty({ example: "Single" })
  maritalStatus!: string;

  @ApiPropertyOptional({
    description: "Full name of the employee",
    example: "Employee-full-name",
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: "Additional template details for the employee",
    example: {
      IntakeType: 69640,
    },
  })
  @IsOptional()
  additionalDetails?: unknown;
}
export class GetEmployeeDetailsWithPolicyComponents {
  @ApiProperty({
    description: "Additional configuration details for the policy",
    example: {
      coverage: "Full",
      premium: 10000,
      deductible: 500,
    },
    required: false,
  })
  @IsOptional()
  policyComponentsConfiguration?: unknown;

  @ApiPropertyOptional({
    description: "Already enrolled choices made by employee",
  })
  @IsOptional()
  @IsArray()
  enrollmentChoicesMade?: unknown[];
}

export class GetCompanyEmployeePolicyDetails {
@ApiProperty({ example: 1 })
  policyId!: number;

  @ApiProperty({ example: 1 })
  employeeId!: number;

  @ApiPropertyOptional({
    description: "Already enrolled choices made by employee",
    type: [UpsertEnrollmentDependentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertEnrollmentDependentDto)
  dependents?: UpsertEnrollmentDependentDto[];
}