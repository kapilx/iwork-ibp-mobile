import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ProcessEnrollmentDto {
  @ApiProperty({ example: 123, required: true })
  @IsNumber()
  enrollmentFileId!: number;

  @ApiProperty({ example: 123, required: true })
  @IsNumber()
  policyId!: number;

  @ApiProperty({ example: 123, required: false })
  @IsNumber()
  @IsOptional()
  endorsementId?: number;
}
