import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
  OneToOne,
  DeleteDateColumn,
} from "typeorm";
import { Policy } from "./policy.entity";
import { Address } from "./address.entity";
import { Contact } from "./contact.entity";
import { Insurer } from "./insurer.entity";
import { LookUp } from "./look-up.entity";

@Entity("policy_insurer_map")
export class PolicyInsurerMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({
    name: "insurer_participation_type_lid",
    type: "int",
    nullable: false,
  })
  insurerParticipationTypeLid: number;

  @Column({ name: "insurer_id", type: "int", nullable: false })
  insurerId: number;

  @Column({ name: "insurer_branch_id", type: "int", nullable: false })
  insurerBranchId: number;

  @Column({ name: "insurer_contact_id", type: "int", nullable: false })
  insurerContactId: number;

  @Column({ name: "insurer_location_id", type: "int", nullable: false })
  insurerLocationId: number;

  @Column({
    name: "share_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
  })
  sharePercentage: number;

  @Column({
    name: "share_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
  })
  shareAmount: number;

  @Column({
    name: "brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
  })
  brokeragePercentage: number;

  @Column({
    name: "brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
  })
  brokerageAmount: number;

  @Column({
    name: "terrorism_share_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  terrorismSharePercentage: number;

  @Column({
    name: "terrorism_share_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  terrorismShareAmount: number;

  @Column({
    name: "terrorism_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  terrorismBrokeragePercentage: number;

  @Column({
    name: "terrorism_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  terrorismBrokerageAmount: number;

  @Column({
    name: "total_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  totalBrokerageAmount: number | null;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  // Relationships
  @ManyToOne(() => Policy, (policy) => policy.insurerMappings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "policy_id" })
  policy: Relation<Policy>;

  @ManyToOne(() => Insurer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "insurer_id" })
  insurer: Relation<Insurer>;

  @ManyToOne(() => Address, { onDelete: "CASCADE" })
  @JoinColumn({ name: "insurer_branch_id" })
  insurerBranch: Relation<Address>;

  @ManyToOne(() => Contact, { onDelete: "CASCADE" })
  @JoinColumn({ name: "insurer_contact_id" })
  insurerContact: Relation<Contact>;

  @OneToOne(() => LookUp)
  @JoinColumn({
    name: "insurer_participation_type_lid",
    referencedColumnName: "id",
  })
  insurerParticipationType: Relation<LookUp>;
}
