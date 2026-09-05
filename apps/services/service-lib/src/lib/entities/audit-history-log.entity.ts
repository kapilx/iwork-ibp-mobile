import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { AuditHistoryLogDetail } from './audit-history-log-detail.entity';
import {
  AuditHistoryAction,
  AuditHistoryLogType,
} from '../audit-history/audit-history.constants';

@Entity('audit_history_log')
@Index(['entityType', 'entityId'])
@Index(['userId'])
@Index(['createdAt'])
export class AuditHistoryLog {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
entityType: string;

@Column({ name: 'entity_name', type: 'varchar', length: 100 })
entityName: string;

@Column({ name: 'entity_id', type: 'varchar', length: 100 })
entityId: string;

@Column({ name: 'action', type: 'varchar', length: 10 })
action: string;

@Column({ name: 'user_id', type: 'varchar', length: 100, nullable: true })
userId: string;

@Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
ipAddress: string;

@Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
userAgent: string;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string;

  @Column({
    name: 'type',
    type: 'varchar',
    length: 10,
    default: AuditHistoryLogType.AUDIT,
  })
  type: AuditHistoryLogType;

@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
createdAt: Date;


  // @OneToMany(() => AuditHistoryLogDetail, (detail) => detail.auditLog, {
  //   cascade: true,
  // })
  // details: AuditHistoryLogDetail[];
}