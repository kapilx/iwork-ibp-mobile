import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsNumberString } from 'class-validator';
import { AuditHistoryAction } from '../audit-history/audit-history.constants';

export class AuditHistoryQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  entityType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  entityId?: string;

  @ApiProperty({ required: false, enum: AuditHistoryAction })
  @IsOptional()
  @IsEnum(AuditHistoryAction)
  action?: AuditHistoryAction;

  @ApiProperty({ required: false })
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, default: '20' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiProperty({ required: false, default: '0' })
  @IsOptional()
  @IsNumberString()
  offset?: string;
}