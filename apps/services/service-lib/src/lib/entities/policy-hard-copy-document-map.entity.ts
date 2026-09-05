import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityPolicyHardCopy } from "./opportunity-policy-hard-copy.entity";
import { LookUp } from "./look-up.entity";

@Entity("opportunity_policy_hard_copy_document_map")
export class OpportunityPolicyHardCopyDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_hard_copy_id", type: "int", nullable: false })
  policyHardCopyId: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId: number;

  @Column({ name: "document_type_lid", type: "int", nullable: false })
  documentTypeLid: number;

  @ManyToOne(
    () => OpportunityPolicyHardCopy,
    (policyHardCopy) => policyHardCopy.id,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "policy_hard_copy_id" })
  policyHardCopy: Relation<OpportunityPolicyHardCopy>;

  @ManyToOne(() => LookUp, (lookup) => lookup.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_type_lid" })
  documentType: Relation<LookUp>;
}
