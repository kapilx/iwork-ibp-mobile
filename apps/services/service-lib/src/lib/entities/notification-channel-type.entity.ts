import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

@Entity('notification_channel_type')
export class NotificationChannelType {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "channel_type_key", type: "varchar", length: 50, nullable: false })
  channelTypeKey!: string;

  @Column({ name: "channel_type", type: "text", nullable: false })
  channelType!: string;

  @Column({ name: "created_by", type: "int", nullable: false, default: () => "0" })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", nullable: false, default: () => "0" })
  updatedBy!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
