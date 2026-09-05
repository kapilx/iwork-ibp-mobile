import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { FinalNegotiationMeetingSummary } from "./final-negotiation-meeting-summary.entity";
import { Employee } from "./employee.entity";
import type { Relation } from "typeorm";
@Entity({ name: "final_negotiation_participant_map" })
export class FinalNegotiationParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "meeting_summary_id", type: "int", nullable: false })
  meetingSummaryId: number;

  @ManyToOne(
    () => FinalNegotiationMeetingSummary,
    (meeting) => meeting.participants,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "meeting_summary_id" })
  meetingSummary: Relation<FinalNegotiationMeetingSummary>;

  @Column({ name: "participant_id", type: "int", nullable: false })
  participantId: number;

  @ManyToOne(() => Employee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "participant_id" })
  participant: Relation<Employee>;

  constructor(id: number, meetingSummaryId: number, participantId: number) {
    this.id = id;
    this.meetingSummaryId = meetingSummaryId;
    this.participantId = participantId;
  }
}
