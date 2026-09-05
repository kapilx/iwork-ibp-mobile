import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { FileUpload } from "./file-upload.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity"; // Import OpportunityActivityMap
import type { Relation } from "typeorm";
import { LookUp } from "./look-up.entity";

@Entity("opportunity_quote_doc_map")
export class OpportunityQuoteDocumentMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId!: number;

  @Column({ name: "document_type_lid", type: "int", nullable: false })
  documentTypeLid!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "document_id" })
  document!: Relation<FileUpload>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "document_type_lid" })
  documentType?: Relation<LookUp>;

  // Add ManyToOne relationship with OpportunityActivityMap
  @ManyToOne(() => OpportunityActivityMap, (activityMap) => activityMap.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_activity_id" })
  opportunityActivity!: Relation<OpportunityActivityMap>;
}
