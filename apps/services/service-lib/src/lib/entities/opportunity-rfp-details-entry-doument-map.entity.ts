import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
  OneToOne,
} from "typeorm";
import { OpportunityRfpDetailsEntry } from "./opportunity-rfp-details-entry.entity";
import { LookUp } from "./look-up.entity";

@Entity({ name: "opportunity_rfp_details_entry_document_map" })
export class OpportunityRfpDetailsEntryDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "opportunity_rfp_details_entry_id",
    type: "integer",
    nullable: false,
  })
  opportunityRfpDetailsEntryId: number;

  @Column({ name: "document_id", type: "integer", nullable: false })
  documentId: number;

  @Column({ name: "document_type_lid", type: "integer", nullable: false })
  documentTypeLid: number;

  @ManyToOne(() => OpportunityRfpDetailsEntry)
  @JoinColumn({ name: "opportunity_rfp_details_entry_id" })
  opportunityRfpDetailsEntry: OpportunityRfpDetailsEntry;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "document_type_lid", referencedColumnName: "id" })
  documentType?: Relation<LookUp>;
}
