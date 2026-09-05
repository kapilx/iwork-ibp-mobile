import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Policy } from "./policy.entity";
import { Contact } from "./contact.entity";
import { Tpa } from "./tpa.entity";
import { Insurer } from "./insurer.entity";

@Entity("policy_contact_metrics")
export class PolicyContactMetric {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "party_type", type: "varchar", length: 50 })
  partyType!: string;

  @Column({ name: "contact_level", type: "varchar", length: 20 })
  contactLevel!: string;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;

  @Column({ name: "contact_id", type: "int" })
  contactId!: number;

  @Column({ name: "tpa_id", type: "int", nullable: true })
  tpaId?: number;

  @Column({ name: "insurer_id", type: "int", nullable: true })
  insurerId?: number;

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

  @Column({ name: "created_by", type: "int" })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy!: number;

  @ManyToOne(() => Policy, (policy) => policy.id)
  @JoinColumn({ name: "policy_id" })
  policy!: Relation<Policy>;

  @ManyToOne(() => Contact, (contact) => contact.id)
  @JoinColumn({ name: "contact_id" })
  contact!: Relation<Contact>;

  @ManyToOne(() => Tpa, (tpa) => tpa.id, { nullable: true })
  @JoinColumn({ name: "tpa_id" })
  tpa?: Relation<Tpa>;

  @ManyToOne(() => Insurer, (insurer) => insurer.id, { nullable: true })
  @JoinColumn({ name: "insurer_id" })
  insurer?: Relation<Insurer>;

}
