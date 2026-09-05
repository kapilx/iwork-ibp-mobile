import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { FileUpload } from "./file-upload.entity";
import { LookUp } from "./look-up.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";

@Entity("opportunity_meeting_document_map")
export class OpportunityMeetingDocumentMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "opportunity_activity_id", type: "int" })
  opportunityActivityId?: number;

  @Column({ name: "document_id", type: "int" })
  documentId?: number;

  @Column({ name: "document_type_lid", type: "int" })
  documentTypeLid?: number;

  @ManyToOne(
    () => FileUpload,
    (fileupload) => fileupload.opportunityMeetingDocs,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "document_id" })
  document?: Relation<FileUpload>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "document_type_lid" })
  documentType?: Relation<LookUp>;

  @ManyToOne(() => OpportunityActivityMap, { onDelete: "CASCADE" })
  @JoinColumn({ name: "opportunity_activity_id" })
  opportunityActivity?: Relation<OpportunityActivityMap>;

  constructor(
    opportunityActivityId: number,
    documentId: number,
    documentTypeLid?: number
  ) {
    this.opportunityActivityId = opportunityActivityId;
    this.documentId = documentId;
    this.documentTypeLid = documentTypeLid;
  }
}
