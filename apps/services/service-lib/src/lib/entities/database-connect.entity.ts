import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

@Entity("database_connect")
export class DatabaseConnect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", nullable: true })
  name: string;

  @Column({ type: "varchar", nullable: true })
  host: string;

  @Column({ type: "varchar", nullable: true })
  username: string;

  @Column({ type: "varchar", nullable: true })
  password: string;

  @Column({ type: "integer", nullable: true })
  port: number;

  @Column({ type: "varchar", nullable: true })
  database: string;

  @Column({ name: "created_by", type: "integer", nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamp", nullable: true })
  createdAt: Date;

  @Column({ name: "updated_by", type: "integer", nullable: true })
  updatedBy: number;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt: Date;

  @Column({ name: "deleted_by", type: "integer", nullable: true })
  deletedBy: number;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
