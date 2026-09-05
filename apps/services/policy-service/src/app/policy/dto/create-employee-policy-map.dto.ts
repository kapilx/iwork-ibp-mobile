import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateEmployeePolicyMapDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  employeeId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  policyId!: number;
}
