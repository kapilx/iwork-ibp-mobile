import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityRfpDetail } from "./opportunity-rfp-detail.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { FileUpload } from "./file-upload.entity";
import type { Relation } from "typeorm";
import { Opportunity } from "./opportunity.entity";

@Entity("opportunity_broking_slip_activity_document_map")
export class OpportunityBrokingSlipActivityDocumentMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_activity_map_id", type: "int", nullable: false })
  opportunityActivityMapId!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId!: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId!: number;

  @Column({ name: "document_type_lid", type: "int", nullable: false }) // Add the new column
  documentTypeLid: number;

  @ManyToOne(() => OpportunityActivityMap, (activityMap) => activityMap.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_activity_map_id" })
  opportunityActivityMap!: Relation<OpportunityActivityMap>;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportuniryDetail!: Relation<Opportunity>;

  @ManyToOne(() => FileUpload, (fileUpload) => fileUpload.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document!: Relation<FileUpload>;
}
