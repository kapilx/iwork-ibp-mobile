import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("policy_claim_status")
@Index(["status"], { unique: true })
export class PolicyClaimStatus {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "status", type: "varchar", length: 50 })
  status!: string;

  @Column({ name: "iirm_status", type: "varchar", length: 50 })
  iirmStatus!: string;

  @Column({ name: "created_by", type: "int", default: 0 })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  updatedBy!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
