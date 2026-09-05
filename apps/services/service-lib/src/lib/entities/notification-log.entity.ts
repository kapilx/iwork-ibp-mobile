import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn
} from "typeorm";
import { NotificationEventType } from "./notification-event-type.entity";

@Entity("notification_log")
export class NotificationLog {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id!: number;

  @Column({ name: "event_type_id", type: "int" })
  eventTypeId!: number;

  @Column()
  channel!: string;

  @Column()
  status!: string;

  @Column({ nullable: true })
  error?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => NotificationEventType)
  @JoinColumn({ name: 'event_type_id' })
  eventType!: NotificationEventType;
}
