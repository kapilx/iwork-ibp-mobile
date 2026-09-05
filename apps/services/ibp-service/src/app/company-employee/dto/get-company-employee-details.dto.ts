import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

class EmployeeLookupAttributeDto {
  @ApiProperty({ example: "GENDER_TYPE" })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiPropertyOptional({ example: "male" })
  @IsOptional()
  @IsString()
  value?: string | null;
}

class EmployeePolicyEnrollmentStatusDto {
  @ApiProperty({ example: 101 })
  @IsInt()
  @IsNotEmpty()
  policyId!: number;

  @ApiPropertyOptional({ example: "GMC Policy" })
  @IsOptional()
  @IsString()
  policyName?: string | null;

  @ApiProperty({ example: "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED" })
  @IsString()
  @IsNotEmpty()
  employeeEnrollmentStatusKey!: string;
}

class EmployeeDependentDto {
  @ApiProperty({ example: 201 })
  @IsInt()
  @IsNotEmpty()
  id!: number;

  @ApiProperty({ example: 101 })
  @IsInt()
  @IsNotEmpty()
  policyId!: number;

  @ApiProperty({ example: "Jane Doe" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Wife" })
  @IsString()
  @IsNotEmpty()
  relation!: string;

  @ApiPropertyOptional({ example: "Spouse/Partner" })
  @IsOptional()
  @IsString()
  relationshipType?: string;

  @ApiPropertyOptional({ example: "1992-05-20" })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: "female" })
  @IsOptional()
  @IsString()
  gender?: string;
}

export class EmployeeDetailsDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  id!: number;

  @ApiProperty({ example: "10345" })
  @IsString()
  @IsNotEmpty()
  employeeCompanyId!: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  companyId?: number;

  @ApiProperty({ example: "E-111" })
  @IsString()
  @IsNotEmpty()
  companyEmployeeId!: string;

  @ApiProperty({ example: "Employee" })
  @IsString()
  @IsNotEmpty()
  employeeName!: string;

  @ApiProperty({ example: "2026-12-31" })
  @IsNotEmpty({ message: "date of birth is required" })
  @IsString({ message: "date of birth must be a string." })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date of birth must be in the format YYYY-MM-DD.",
  })
  dateOfBirth!: string;

  @ApiProperty({
    example: {
      key: "GENDER_TYPE",
      value: "male",
    },
  })
  @ValidateNested()
  @IsNotEmptyObject()
  @Type(() => EmployeeLookupAttributeDto)
  gender!: EmployeeLookupAttributeDto;

  @ApiProperty({ example: "test@gmail.com" })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "9999999999" })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: "9999999998" })
  @IsOptional()
  @IsString()
  alternatePhoneNumber?: string;

  @ApiPropertyOptional({ example: "alternate@example.com" })
  @IsOptional()
  @IsString()
  alternateEmail?: string;

  @ApiProperty({ example: "manager" })
  @IsString()
  @IsNotEmpty()
  designation!: string;

  @ApiPropertyOptional({ example: "Employee" })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    example: {
      key: "MARTIAL_STATUS",
      value: "single",
    },
  })
  @ValidateNested()
  @IsNotEmptyObject()
  @Type(() => EmployeeLookupAttributeDto)
  maritalStatus!: EmployeeLookupAttributeDto;

  @ApiPropertyOptional({
    description: "Full name of the employee",
    example: "Employee-full-name",
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: "Employee company country name",
    example: "India",
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: "Additional template details for the employee",
    example: {
      IntakeType: 69640,
    },
  })
  @IsOptional()
  additionalDetails?: unknown;

  @ApiPropertyOptional({
    description: "Enrollment status for the first mapped policy.",
    type: [EmployeePolicyEnrollmentStatusDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeePolicyEnrollmentStatusDto)
  policyEnrollmentStatuses?: EmployeePolicyEnrollmentStatusDto[];

  @ApiPropertyOptional({
    description: "Whether the user has accepted Terms and Conditions.",
    example: false,
  })
  @IsOptional()
  isTCAccepted?: boolean;

  @ApiPropertyOptional({ description: "Whether this employee is allowed to reset their enrollment." })
  @IsOptional()
  allowEnrollmentReset?: boolean | null;

  @ApiPropertyOptional({
    description: "The version of Terms and Conditions accepted by the user.",
    example: "1.0",
  })
  @IsOptional()
  tcAcceptedVersion?: string | number | null;

  @ApiPropertyOptional({
    description: "Timestamp when the user accepted the Terms and Conditions.",
  })
  @IsOptional()
  tcAcceptedAt?: Date | null;

  @ApiPropertyOptional({
    description: "Timestamp when the user withdrew their consent.",
  })
  @IsOptional()
  tcWithdrawnAt?: Date | null;

  @ApiPropertyOptional({
    description: "Current TC consent status.",
    example: "accepted",
  })
  @IsOptional()
  @IsString()
  tcStatus?: string | null;

  @ApiPropertyOptional({
    description: "Dependents mapped to the employee.",
    type: [EmployeeDependentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeDependentDto)
  dependents?: EmployeeDependentDto[];

  @ApiPropertyOptional({
    description: "True when the user has an active record in policy_enrollment_employee.",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEmployee?: boolean;

  @ApiPropertyOptional({
    description: "True when the user has an active record in hr_user_management.",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isHR?: boolean;

  @ApiPropertyOptional({
    description: "ID from hr_user_management table — only present when isHR is true.",
    example: 7,
  })
  @IsOptional()
  hrManagementId?: number;

  @ApiPropertyOptional({
    description: "Company name from hr_user_management (HR-only users).",
    example: "Acme Corp",
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: "HR role key from hr_user_management.",
    example: "HR_ADMIN",
  })
  @IsOptional()
  @IsString()
  roleKey?: string;
}
