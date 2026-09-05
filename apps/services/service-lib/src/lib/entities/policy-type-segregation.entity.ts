import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("policy_type_segregation")
@Unique(["policyTypeLid"])
export class PolicyTypeSegregation {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "policy_type_lid", type: "int" })
  policyTypeLid: number;

  @Column({ name: "irdai_policy_type_lid", type: "int", nullable: true })
  irdaiPolicyTypeLid: number | null;

  @Column({ name: "iirm_policy_type_lid", type: "int", nullable: true })
  iirmPolicyTypeLid: number | null;

  @Column({ name: "assoc_active_policy_type_lid", type: "int", nullable: true })
  assocActivePolicyTypeLid: number | null;
}
