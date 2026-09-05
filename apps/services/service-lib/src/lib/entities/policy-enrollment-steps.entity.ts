import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("mstr_policy_endorsement_steps")
export class PolicyEnrollmentSteps {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "label", type: "varchar", nullable: false })
  label: string;

  @Column({ name: "description", type: "varchar", nullable: false })
  description: string;

  @Column({ name: "endorsement_step_key", type: "varchar", nullable: false })
  endorsementStepKey: string;

  @Column({ name: "endorsement_step_value", type: "varchar", nullable: false })
  endorsementStepValue: string;
}
