import {
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { PolicyContactMatrixResponseDto } from "./policy-contact-matrix.dto";

export class EmployeePolicyContactMatrixResponseDto {
  @ApiProperty({
    description: "Employee identifier",
    example: 9876,
  })
  employeeId!: number;

  @ApiProperty({
    type: [PolicyContactMatrixResponseDto],
    description: "Contact matrix information for each policy mapped to the employee",
  })
  policies!: PolicyContactMatrixResponseDto[];

  @ApiPropertyOptional({
    description: "Flag indicating whether the employee has at least one policy mapped",
    example: true,
  })
  hasPolicies?: boolean;
}
