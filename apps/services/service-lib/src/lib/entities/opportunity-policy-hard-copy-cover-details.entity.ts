import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { OpportunityPolicyHardCopy } from "./opportunity-policy-hard-copy.entity";

@Entity("opportunity_policy_hard_copy_cover_detail")
export class OpportunityPolicyHardCopyCoverDetail {
  @PrimaryGeneratedColumn({name: "id", type: "int"})
  id: number;

  @Column({ name: "policy_hard_copy_id", type: "int" })
  policyHardCopyId: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "cover_template_id", type: "int" })
  coverTemplateId: number;

  @Column({ name: "cover_name", type: "varchar" })
  coverName: string;

  @Column({ name: "cover_response", type: "varchar" })
  coverResponse: string;

  @Column({ name: "covers_meta", type: "jsonb", nullable: true })
  coversMeta?: Record<string, any>;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(
    () => OpportunityPolicyHardCopy,
    (policyHardCopy) => policyHardCopy.coverDetails
  )
  @JoinColumn({ name: "policy_hard_copy_id" })
  policyHardCopy: OpportunityPolicyHardCopy;
}
