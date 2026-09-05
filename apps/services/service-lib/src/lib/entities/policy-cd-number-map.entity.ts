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
import { OpportunityPlacementSlipCDDetail } from "./opportunity-placement-slip-cd-detail.entity";

@Entity("policy_cd_number_map")
export class PolicyCdNumberMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({ name: "cd_id", type: "int", nullable: false })
  cdId: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy: Relation<Policy>;

  @ManyToOne(() => OpportunityPlacementSlipCDDetail, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cd_id" })
  cdDetail: Relation<OpportunityPlacementSlipCDDetail>;
}
