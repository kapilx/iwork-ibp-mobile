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
import { Policy } from "./policy.entity";
import { Address } from "./address.entity";
import { Tpa } from "./tpa.entity";

@Entity("policy_tpa_map")
export class PolicyTpaMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({ name: "tpa_id", type: "int", nullable: false })
  tpaId: number;

  @Column({ name: "tpa_branch_id", type: "int", nullable: false })
  tpaBranchId: number;

  @Column({ name: "tpa_contact_id", type: "int", nullable: false })
  tpaContactId: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Policy, (policy) => policy.tpaMappings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "policy_id" })
  policy: Relation<Policy>;

  @ManyToOne(() => Tpa, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tpa_id" })
  tpa: Relation<Tpa>;

  @ManyToOne(() => Address, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tpa_branch_id" })
  tpaBranch: Relation<Address>;
}
