import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notification_event_type')
export class NotificationEventType {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;
}
