import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { PolicyEnrollmentParameter } from "./policy-enrollment-parameter.entity";

@Entity("policy_enrollment_parameter_options")
@Index("idx_pepo_parameter_id", ["parameterId"])
export class PolicyEnrollmentParameterOption {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "parameter_id", type: "int" })
  parameterId!: number;

  @Column({ name: "value", type: "varchar", length: 100 })
  value!: string;

  @Column({ name: "min_value", type: "numeric", nullable: true })
  minValue?: number;

  @Column({ name: "max_value", type: "numeric", nullable: true })
  maxValue?: number;

  @Column({ name: "created_by", type: "int", default: 0 })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  updatedBy!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => PolicyEnrollmentParameter, { onDelete: "CASCADE" })
  @JoinColumn({ name: "parameter_id" })
  parameter!: PolicyEnrollmentParameter;
}
