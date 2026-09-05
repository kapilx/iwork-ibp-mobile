import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EnrollmentBatchKeyDto {
  @ApiProperty({ example: 'enrollment:123:1691234567890' })
  @IsString()
  enrollmentBatchKey!: string;

  @ApiProperty({ example: 123, required: false })
  @IsNumber()
  @IsOptional()
  endorsementId?: number;
}
