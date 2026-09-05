import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Meeting } from "./meeting.entity";

@Entity("meeting_participant_map")
export class MeetingParticipantMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id: number;

  @Column({ name: "meeting_id", type: "int", nullable: false })
  meetingId: number;

  @Column({ name: "participant_id", type: "int", nullable: false })
  participantId: number;

  @Column({
    name: "participant_record_type",
    type: "varchar",
    length: 25,
    nullable: false,
  })
  participantRecordType: string;

  @Column({ name: "participant_company_id", type: "int", nullable: false })
  participantCompanyId: number;

  @ManyToOne(() => Meeting, (meeting) => meeting.participants, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meeting_id" })
  meeting: Relation<Meeting>;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  constructor(
    meetingId: number,
    participantId: number,
    participantCompanyId: number,
    participantRecordType: string
  ) {
    this.meetingId = meetingId;
    this.participantId = participantId;
    this.participantCompanyId = participantCompanyId;
    this.participantRecordType = participantRecordType;
  }
}
