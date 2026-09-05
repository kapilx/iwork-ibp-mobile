import { Column, Entity, ManyToOne, PrimaryGeneratedColumn,JoinColumn } from 'typeorm';
import { NotificationEventType } from './notification-event-type.entity';
import { User } from './user';
@Entity('notification_log_receiver_record')
export class NotificationLogReceiverRecord {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id!: number;

  @Column({name:"log_id", type: "int"})
  logId!: number;

  @Column({name:"receiver_email_id", type: "varchar", nullable: true})
  receiverEmailId?: string;

  @Column({name:"receiver_user_id", type: "int", nullable: true})
  receiverUserId?: number;

  @Column({name:"receiver_phone_number", type: "varchar", length: 20, nullable: true})
  receiverPhoneNumber?: string;

  @ManyToOne(() => NotificationEventType)
  @JoinColumn({ name: 'log_id' })
  log!: NotificationEventType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_user_id' })
  receiverUser!: User;
}
