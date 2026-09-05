import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityPolicyDocket } from "./opportunity-policy-docket.entity";
import { FileUpload } from "./file-upload.entity";
import { LookUp } from "./look-up.entity";
import type { Relation } from "typeorm";

@Entity("opportunity_policy_docket_document_map")
export class OpportunityPolicyDocketDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_docket_id", type: "int", nullable: false })
  policyDocketId: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId: number;

  @Column({ name: "document_type_lid", type: "int", nullable: false })
  documentTypeLid: number;

  @ManyToOne(() => OpportunityPolicyDocket, (policyDocket) => policyDocket.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "policy_docket_id" })
  policyDocket: Relation<OpportunityPolicyDocket>;

  @ManyToOne(() => FileUpload, (file) => file.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;

  @ManyToOne(() => LookUp, (lookup) => lookup.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_type_lid" })
  documentType: Relation<LookUp>;
}
