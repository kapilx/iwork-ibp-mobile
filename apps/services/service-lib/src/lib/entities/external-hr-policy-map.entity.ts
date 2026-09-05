import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("external_hr_policy_map")
export class ExternalHrPolicyMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", type: "int", nullable: true })
  userId?: number | null;

  @Column({ name: "hr_management_id", type: "int", nullable: true })
  hrManagementId?: number | null;

  @Column({ name: "policy_id", type: "int" })
  policyId: number;

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}