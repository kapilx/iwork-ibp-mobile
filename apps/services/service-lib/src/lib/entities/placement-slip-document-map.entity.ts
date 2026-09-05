import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityPlacementSlipGeneration } from "./opportunity-placement-slip-generation.entity";
import { LookUp } from "./look-up.entity";
import type { Relation } from "typeorm";

/**
 * Entity for opportunity_placement_slip_document_map table.
 */
@Entity("opportunity_placement_slip_document_map")
export class OpportunityPlacementSlipDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "placement_slip_id", type: "int", nullable: false })
  placementSlipId: number;

  @Column({ name: "document_id", type: "int", nullable: true })
  documentId: number;

  @Column({ name: "document_type_lid", type: "int", nullable: true })
  documentTypeLid: number;

  @ManyToOne(
    () => OpportunityPlacementSlipGeneration,
    (placementSlip) => placementSlip.documents,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "placement_slip_id" })
  placementSlip: Relation<OpportunityPlacementSlipGeneration>;

  @ManyToOne(() => LookUp, (lookup) => lookup.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_type_lid" })
  documentType: Relation<LookUp>;

  constructor(
    placementSlipId: number,
    documentId: number,
    documentTypeLid: number
  ) {
    this.placementSlipId = placementSlipId;
    this.documentId = documentId;
    this.documentTypeLid = documentTypeLid;
  }
}
