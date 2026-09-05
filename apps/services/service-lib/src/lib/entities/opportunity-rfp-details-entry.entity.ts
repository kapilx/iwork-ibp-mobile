import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
  DeleteDateColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { OpportunityRfpTpaDetail } from "./opportunity-rfp-tpa-detail.entity";
import { OpportunityRfpInsurerDetail } from "./opportunity-rfp-insurer-detail.entity";
import { OpportunityRfpClientContactDetail } from "./opportunity-rfp-client-contact-details.entity";
import { OpportunityRfpCreditSharing } from "./opportunity-rfp-credit-sharing.entity";
import { OpportunityRfpDetailsEntryDocumentMap } from "./opportunity-rfp-details-entry-doument-map.entity";

@Entity({ name: "opportunity_rfp_details_entry" })
export class OpportunityRfpDetailsEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id", type: "integer", nullable: false })
  opportunityId: number;

  @Column({ name: "activity_id", type: "integer", nullable: false })
  activityId: number;

  @Column({ name: "opportunity_activity_id", type: "integer", nullable: false })
  opportunityActivityId: number;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "requirements", type: "text", nullable: true })
  requirements: string;

  @Column({ name: "target_qcr_date", type: "date", nullable: true })
  targetQcrDate: Date;

  @Column({
    name: "multiple_brokers_involved",
    type: "integer",
    nullable: true,
  })
  multipleBrokersInvolved: number;

  @Column({
    name: "is_market_allocation_done",
    type: "integer",
    nullable: true,
  })
  isMarketAllocationDone: number;

  @Column({ name: "client_expectations", type: "text", nullable: true })
  clientConsiderations: string;

  @Column({
    name: "threats_from_existing_insurer",
    type: "text",
    nullable: true,
  })
  threatsFromExistingInsurer: string;

  @Column({
    name: "threats_from_existing_tpa",
    type: "text",
    nullable: true,
  })
  threatsFromExistingBroker: string;

  @Column({ name: "extraneous_factors", type: "text", nullable: true })
  extraneousFactors: string;

  @Column({ name: "strategy_plan", type: "text", nullable: true })
  planForClosingDetail: string;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date;

  @Column({ name: "created_by", type: "integer", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "integer", nullable: false })
  updatedBy: number;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status?: Relation<LookUp>;

  @OneToMany(
    () => OpportunityRfpTpaDetail,
    (TpaDetails) => TpaDetails.opportunityRfpDetailsEntry
  )
  tpaDetails?: Relation<OpportunityRfpTpaDetail>[];

  @OneToMany(
    () => OpportunityRfpInsurerDetail,
    (insurerDetails) => insurerDetails.opportunityRfpDetailsEntry
  )
  insurerDetails?: Relation<OpportunityRfpInsurerDetail>[];

  @OneToMany(
    () => OpportunityRfpClientContactDetail,
    (clientContactDetails) => clientContactDetails.opportunityRfpDetailsEntry
  )
  clientContacts?: Relation<OpportunityRfpClientContactDetail>[];

  @OneToMany(
    () => OpportunityRfpCreditSharing,
    (creditSharaingDetails) => creditSharaingDetails.opportunityRfpDetailsEntry
  )
  creditSharing?: Relation<OpportunityRfpCreditSharing>[];

  @OneToMany(
    () => OpportunityRfpDetailsEntryDocumentMap,
    (Documets) => Documets.opportunityRfpDetailsEntry
  )
  documents?: Relation<OpportunityRfpDetailsEntryDocumentMap>[];
}
