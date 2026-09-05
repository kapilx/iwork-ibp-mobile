import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { Company } from "./company.entity";
import { Policy } from "./policy.entity";

@Entity("policy_configuration")
export class PolicyConfiguration {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "company_id", type: "int" })
  companyId!: number;

  @Column({ name: "policy_type_lid", type: "int" })
  policyTypeLid!: number;


  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId!: number;

  @Column({ name: "policy_configuration_status_lid", type: "int" })
  policyConfiguartionStatusLid!: number;

  @Column({ name: "policy_step", type: "int" })
  policyStep!: number;

  @Column({ name: "policy_configuration", type: "jsonb" })
  policyConfiguration!: unknown;

  @Column({ name: "remarks", type: "text", nullable: true }) // New field
  remarks?: string;

  @Column({ name: "version", type: "int", default: 1 }) // New field
  version!: number;

  @Column({ name: "approver_id", type: "int", nullable: true })
  approverId?: number | null;

  @Column({ name: "rejected_by_id", type: "int", nullable: true })
  rejectedById?: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_type_lid", referencedColumnName: "id" })
  policyType!: LookUp;

  @ManyToOne(() => LookUp)
  @JoinColumn({
    name: "policy_configuration_status_lid",
    referencedColumnName: "id",
  })
  policyStatus!: LookUp;

  @ManyToOne(() => Company, (company) => company.policyConfigurations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @ManyToOne(() => Policy, (policy) => policy.policyConfigurations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "policy_id" })
  policy!: Policy;
}
