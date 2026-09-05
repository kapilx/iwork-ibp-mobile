import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
@Entity("opportunity_meeting_participant_map")
export class OpportunityMeetingParticipantMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: false })
  opportunityActivityId: number;

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

  @ManyToOne(() => OpportunityActivityMap, { onDelete: "CASCADE" })
  @JoinColumn({ name: "opportunity_activity_id" })
  opportunityActivity?: Relation<OpportunityActivityMap>;

  constructor(
    opportunityActivityId: number,
    participantId: number,
    participantCompanyId: number,
    participantRecordType: string
  ) {
    this.opportunityActivityId = opportunityActivityId;
    this.participantId = participantId;
    this.participantCompanyId = participantCompanyId;
    this.participantRecordType = participantRecordType;
  }
}
