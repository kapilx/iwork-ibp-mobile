import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePolicyEmployeeEnrollmentStatusDto {
  @ApiProperty({ example: 'enrolled' })
  @IsString()
  @IsNotEmpty()
  employeeEnrollmentStatusKey!: string;
}
