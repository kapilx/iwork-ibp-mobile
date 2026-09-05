import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("policy_type_and_endorsement_steps_mapping")
export class PolicyEnrollmentStepMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_type_id", type: "int", nullable: false })
  policyTypeId: number;

  @Column({ name: "endorsement_step_id", type: "int", nullable: false })
  endorsementStepId: number;

  @Column({ name: "endorsement_step_order", type: "int", nullable: false })
  endorsementStepOrder: number;
}
