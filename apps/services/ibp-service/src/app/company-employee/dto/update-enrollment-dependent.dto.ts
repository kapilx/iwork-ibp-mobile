import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEnrollmentDependentDto {
  @ApiPropertyOptional({ description: 'Name of the dependent', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Relation of the dependent', example: 'Spouse' })
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiPropertyOptional({ description: 'Date of birth of the dependent', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender of the dependent', example: 'Male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: 'Policy id to which dependent belongs', example: 1 })
  @IsOptional()
  @IsNumber()
  policyId?: number;

  @ApiPropertyOptional({ description: 'Employee id to which dependent belongs', example: 1 })
  @IsOptional()
  @IsNumber()
  employeeId?: number;
}
