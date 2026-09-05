import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("cron_job_configuration")
export class CronJobConfiguration {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "job_key", type: "varchar", length: 100, unique: true })
  jobKey: string;

  @Column({ name: "job_name", type: "varchar", length: 255 })
  jobName: string;

  @Column({ name: "cron_expression", type: "varchar", length: 50 })
  cronExpression: string;

  @Column({ name: "is_enabled", type: "boolean", default: true })
  isEnabled: boolean;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "created_by", type: "integer" })
  createdBy: number;

  @Column({ name: "updated_by", type: "integer", nullable: true })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
