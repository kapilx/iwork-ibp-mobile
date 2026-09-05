import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Insurer } from "./insurer.entity";
import { FinalNegotiationMeetingSummary } from "./final-negotiation-meeting-summary.entity";
import type { Relation } from "typeorm";
@Entity("insurer_participant_map")
export class InsurerParticipants {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "meeting_summary_id", type: "int" })
  meetingSummaryId: number;

  @Column({ name: "insurer_id", type: "int" })
  insurerId: number;

  @Column({ name: "share_percentage", type: "decimal", precision: 5, scale: 2 })
  sharePercentage: number;

  @Column({
    name: "brokerage_percentage",
    type: "decimal",
    precision: 5,
    scale: 2,
  })
  brokeragePercentage: number;

  @Column({
    name: "brokerage_amount",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  brokerageAmount: number;

  @ManyToOne(
    () => FinalNegotiationMeetingSummary,
    (meeting) => meeting.insurerShares
  )
  @JoinColumn({ name: "meeting_summary_id" })
  meetingSummary: Relation<FinalNegotiationMeetingSummary>;

  @ManyToOne(() => Insurer)
  @JoinColumn({ name: "insurer_id" })
  insurer: Relation<Insurer>;
  constructor(
    id: number,
    meetingSummaryId: number,
    insurerId: number,
    sharePercentage: number,
    brokeragePercentage: number,
    brokerageAmount: number
  ) {
    this.id = id;
    this.meetingSummaryId = meetingSummaryId;
    this.insurerId = insurerId;
    this.sharePercentage = sharePercentage;
    this.brokeragePercentage = brokeragePercentage;
    this.brokerageAmount = brokerageAmount;
  }
}
