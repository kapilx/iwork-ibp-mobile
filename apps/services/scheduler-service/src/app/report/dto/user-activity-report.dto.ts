import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class UserActivityReportDto {
  @ApiProperty({ example: '2024-01-01' })
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate!: string;

  @ApiProperty({ example: '2024-01-31' })
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate!: string;
}
