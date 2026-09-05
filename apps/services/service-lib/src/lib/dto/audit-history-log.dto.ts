import { ApiProperty } from '@nestjs/swagger';
import { AuditHistoryAction } from '../audit-history/audit-history.constants';

export class AuditHistoryLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityName: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty({ enum: AuditHistoryAction })
  action: AuditHistoryAction;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  ipAddress?: string;

  @ApiProperty({ required: false })
  userAgent?: string;

  @ApiProperty({ required: false })
  requestId?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => [AuditHistoryLogDetailDto], required: false })
  details?: AuditHistoryLogDetailDto[];
}

export class AuditHistoryLogDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fieldName: string;

  @ApiProperty({ required: false })
  oldValue?: any;

  @ApiProperty({ required: false })
  newValue?: any;

  @ApiProperty()
  fieldType: string;
}