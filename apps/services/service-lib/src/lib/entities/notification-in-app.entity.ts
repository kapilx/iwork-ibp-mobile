import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  DeleteDateColumn,
  UpdateDateColumn
} from "typeorm";
import { NotificationEventType } from "./notification-event-type.entity";
import { LookUp } from "./look-up.entity";

@Entity("notification_in_app")
export class NotificationInApp {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id!: number;

  @Column({ name: "event_type_id", type: "int" })
  eventTypeId!: number;

  @Column({name: "user_id", type: "int" })
  userId!: number;

  @Column()
  subject!: string;

  @Column("text")
  body!: string;

  @Column({name: "status_lid", default: 451 })
  statusLid!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date;

  @ManyToOne(() => NotificationEventType)
  @JoinColumn({ name: 'event_type_id' })
  eventType!: NotificationEventType;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: 'status_lid' })
  status!: LookUp;
}
