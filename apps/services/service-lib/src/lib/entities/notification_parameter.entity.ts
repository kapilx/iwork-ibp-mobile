import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('notification_parameter')
export class NotificationParameter {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id!: number;

  @Column({ unique: true })
  key!: string;

  @Column({ nullable: true })
  description?: string;
}
