import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { ConfigCompany } from "./config-company.entity";

@Entity("company_portal_config_scope")
export class CompanyPortalConfigScope {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "config_id", type: "int" })
  configId: number;

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  /** NULL = ALL_POLICIES mode — all enrolled policies for this company are visible */
  @Column({ name: "policy_id", type: "int", nullable: true })
  policyId: number | null;

  /** NULL = all locations for this policy are visible */
  @Column({ name: "address_id", type: "int", nullable: true })
  addressId: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => ConfigCompany, { onDelete: "CASCADE" })
  @JoinColumn({ name: "config_id" })
  config: Relation<ConfigCompany>;
}
