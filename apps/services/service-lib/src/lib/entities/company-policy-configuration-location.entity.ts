import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Address } from "./address.entity";
import { Company } from "./company.entity";

@Entity("company_policy_configuration_location")
export class CompanyPolicyConfigurationLocation {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  @Column({ name: "address_id", type: "int" })
  addressId: number;

  @Column({ name: "is_primary", type: "boolean", nullable: true, default: null })
  isPrimary: boolean | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Company, (company) => company.policyConfigurationLocations, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "company_id" })
  company: Relation<Company>;

  @ManyToOne(() => Address, { onDelete: "NO ACTION" })
  @JoinColumn({ name: "address_id" })
  address: Relation<Address>;
}
