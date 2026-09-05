import { Column, Entity, ManyToOne, PrimaryGeneratedColumn,JoinColumn } from 'typeorm';
import { NotificationEventType } from './notification-event-type.entity';
@Entity('notification_template')
export class NotificationTemplate {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id!: number;

  @Column()
  subject!: string;

  @Column('text')
  body!: string;
}
