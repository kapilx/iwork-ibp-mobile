import { Column, Entity, ManyToOne, PrimaryGeneratedColumn,JoinColumn } from 'typeorm';
import { NotificationEventType } from './notification-event-type.entity';
import { NotificationTemplate } from './notification-template.entity';

@Entity('notification_event_template_mapping')
export class NotificationEventTemplateMapping {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id!: number;

  @Column({ name: "event_type_id", type: "int" })
  eventTypeId!: number;

  @Column({ name: "template_id", type: "int" })
  templateId!: number;

  @Column()
  channel!: string;

  @ManyToOne(() => NotificationEventType)
  @JoinColumn({ name: 'event_type_id' })
  eventType!: NotificationEventType;

  @ManyToOne(() => NotificationTemplate)
  @JoinColumn({ name: 'template_id' })
  template!: NotificationTemplate;
}
