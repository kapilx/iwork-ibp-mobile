import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityPolicyConfirmation } from "./opportunity-policy-confirmation.entity";
import { FileUpload } from "./file-upload.entity";

@Entity({ name: "opportunity_policy_confirmation_document_map" })
export class OpportunityPolicyConfirmationDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_confirmation_id", type: "int", nullable: false })
  policyConfirmationId: number;

  @Column({ name: "document_type_lid", type: "int", nullable: false })
  documentTypeLid: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId: number;

  @ManyToOne(
    () => OpportunityPolicyConfirmation,
    (policyConfirmation) => policyConfirmation.documents,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "policy_confirmation_id" })
  policyConfirmation: Relation<OpportunityPolicyConfirmation>;

  @ManyToOne(() => FileUpload, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;
}
