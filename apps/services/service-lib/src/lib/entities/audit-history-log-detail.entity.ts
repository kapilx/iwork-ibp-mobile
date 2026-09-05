import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuditHistoryLog } from './audit-history-log.entity';

@Entity('audit_history_log_detail')
@Index(['auditHistoryLog'])
export class AuditHistoryLogDetail {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => AuditHistoryLog, (auditHistoryLog) => auditHistoryLog.id)
  @JoinColumn({ name: 'audit_log_id' })
  auditHistoryLog: AuditHistoryLog;

  @Column({ name: "field_name",type: 'varchar', length: 100 })
  fieldName: string;

  @Column({ name: "old_value", type: 'jsonb', nullable: true })
  oldValue: any;

  @Column({ name: "new_value", type: 'jsonb', nullable: true })
  newValue: any;

  @Column({ name: "field_type", type: 'varchar', length: 50 })
  fieldType: string;
}