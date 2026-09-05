import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { FileUpload } from "./file-upload.entity";
import { LookUp } from "./look-up.entity";
import { OpportunityQuote } from "./opportunity-quote.entity";
import { InsurerParticipants } from "./insurer-participation.entity";
import { FinalNegotiationParticipant } from "./final-negotiation-participants.entity";
import type { Relation } from "typeorm";
@Entity("final_negotiation_meeting_summary")
export class FinalNegotiationMeetingSummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "meeting_date", type: "date" })
  meetingDate: Date;

  @Column({ name: "start_time", type: "timestamptz" })
  startTime: Date;

  @Column({ name: "end_time", type: "timestamptz" })
  endTime: Date;

  @Column({ name: "held_at", type: "varchar", length: 100 })
  heldAt: string;

  @Column({ name: "minutes_of_meeting", type: "text" })
  minutesOfMeeting: string;

  @Column({ name: "policy_placed_type_lid", type: "int" })
  policyPlacedTypeLid: number;

  @Column({ name: "lead_insurer_id", type: "int", nullable: true })
  leadInsurerId: number | null;

  @Column({
    name: "only_lead_pays_commission_lid",
    type: "int",
    nullable: true,
  })
  onlyLeadPaysCommissionLid: number;

  @Column({ name: "finalised_quote_id", type: "int" })
  finalisedQuoteId: number;

  @Column({
    name: "would_change_quote_values_lid",
    type: "int",
  })
  wouldChangeQuoteValuesLid: number;

  @Column({ name: "other_comments", type: "text", nullable: true })
  otherComments: string | null;

  @Column({ name: "variations", type: "text", nullable: true })
  variations: string | null;

  @Column({
    name: "service_level_agreement_days_lid",
    type: "int",
    nullable: true,
  })
  serviceLevelAgreementDaysLid: number | null;

  @Column({ name: "document_id", type: "int", nullable: true })
  documentId: number | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_placed_type_lid" })
  policyPlacedType: Relation<LookUp>;

  @ManyToOne(() => OpportunityQuote)
  @JoinColumn({ name: "finalised_quote_id" })
  finalisedQuote: Relation<OpportunityQuote>;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;

  @OneToMany(
    () => InsurerParticipants,
    (participation) => participation.meetingSummary
  )
  insurerShares: Relation<InsurerParticipants>[];

  @OneToMany(
    () => FinalNegotiationParticipant,
    (participant) => participant.meetingSummary
  )
  participants: Relation<FinalNegotiationParticipant>[];

  constructor(
    id: number,
    meetingDate: Date,
    startTime: Date,
    endTime: Date,
    heldAt: string,
    minutesOfMeeting: string,
    policyPlacedTypeLid: number,
    leadInsurerId: number | null,
    onlyLeadPaysCommissionLid: number,
    finalisedQuoteId: number,
    wouldChangeQuoteValuesLid: number,
    otherComments: string | null,
    variations: string | null,
    serviceLevelAgreementDaysLid: number | null,
    documentId: number | null,
    createdAt: Date,
    updatedAt: Date,
    createdBy: number,
    updatedBy: number
  ) {
    this.id = id;
    this.meetingDate = meetingDate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.heldAt = heldAt;
    this.minutesOfMeeting = minutesOfMeeting;
    this.policyPlacedTypeLid = policyPlacedTypeLid;
    this.leadInsurerId = leadInsurerId;
    this.onlyLeadPaysCommissionLid = onlyLeadPaysCommissionLid;
    this.finalisedQuoteId = finalisedQuoteId;
    this.wouldChangeQuoteValuesLid = wouldChangeQuoteValuesLid;
    this.otherComments = otherComments;
    this.variations = variations;
    this.serviceLevelAgreementDaysLid = serviceLevelAgreementDaysLid;
    this.documentId = documentId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
