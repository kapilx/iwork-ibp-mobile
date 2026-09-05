import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { FileUpload } from "./file-upload.entity";

@Entity({ name: "opportunity_premium_calculation_document_map" })
export class OpportunityPremiumCalculationDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: false })
  opportunityActivityId: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId: number;

  @Column({ name: "document_type_lid", type: "int", nullable: false })
  documentTypeLid: number;

  @ManyToOne(() => OpportunityActivityMap, { onDelete: "CASCADE" })
  @JoinColumn({ name: "opportunity_activity_id" })
  opportunityActivity: OpportunityActivityMap;

  @ManyToOne(() => FileUpload, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document: FileUpload;
}
