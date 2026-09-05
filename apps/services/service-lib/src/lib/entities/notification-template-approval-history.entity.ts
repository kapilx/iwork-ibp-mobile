import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationChannelEventTemplateMapping } from './notification-channel-event-template-mapping.entity';

@Entity('notification_template_approval_history')
export class NotificationTemplateApprovalHistory {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', nullable: false })
  id!: number;

  @Column({ name: 'template_id', type: 'int', nullable: false })
  templateId!: number;

  @Column({ name: 'action_lid', type: 'int', nullable: false })
  actionLid!: number;

  @Column({ name: 'from_status_lid', type: 'int', nullable: true })
  fromStatusLid!: number;

  @Column({ name: 'to_status_lid', type: 'int', nullable: false })
  toStatusLid!: number;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ name: 'performed_by', type: 'int', nullable: false })
  performedBy!: number;

  @Column({
    name: 'performed_at',
    type: 'timestamptz',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  performedAt!: Date;

  @ManyToOne(() => NotificationChannelEventTemplateMapping, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template!: NotificationChannelEventTemplateMapping;
}