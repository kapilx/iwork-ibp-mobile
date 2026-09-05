import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreatePolicyEmployeeEnrollmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  policyId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  employeeId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  companyId!: number;

  @ApiProperty({ example: "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS" })
  @IsString()
  @IsNotEmpty()
  employeeEnrollmentStatusKey!: string;
}
