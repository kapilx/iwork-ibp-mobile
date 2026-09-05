import { Entity, PrimaryGeneratedColumn, Column, JoinColumn,  OneToOne } from "typeorm";
import { Policy } from "./policy.entity";

@Entity("policies_set_for_ro_creation")
export class PolicySetForRoCreation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @OneToOne(() => Policy)
  @JoinColumn({ name: "policy_id" })
  policy?: Policy;
}