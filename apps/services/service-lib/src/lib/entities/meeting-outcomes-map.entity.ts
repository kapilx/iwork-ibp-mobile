import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Meeting } from "./meeting.entity";
import { LookUp } from "./look-up.entity";

/**
 * Entity representing the mapping between meetings and outcomes.
 */
@Entity("meeting_outcomes_map")
export class MeetingOutcomesMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "meeting_id", type: "int", nullable: false })
  meetingId!: number;

  @Column({ name: "outcome_id", type: "int", nullable: false })
  outcomeId!: number;

  @ManyToOne(() => Meeting, { onDelete: "CASCADE" })
  @JoinColumn({ name: "meeting_id" })
  meeting?: Relation<Meeting>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "outcome_id" })
  outcome?: Relation<LookUp>;

  constructor(meetingId: number, outcomeId: number) {
    this.meetingId = meetingId;
    this.outcomeId = outcomeId;
  }
}
