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
 * Entity representing the mapping between meetings and next steps.
 */
@Entity("meeting_next_steps_map")
export class MeetingNextStepsMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "meeting_id", type: "int", nullable: false })
  meetingId!: number;

  @Column({ name: "next_step_id", type: "int", nullable: false })
  nextStepId!: number;

  @ManyToOne(() => Meeting, { onDelete: "CASCADE" })
  @JoinColumn({ name: "meeting_id" })
  meeting?: Relation<Meeting>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "next_step_id" })
  nextStep?: Relation<LookUp>;

  constructor(meetingId: number, nextStepId: number) {
    this.meetingId = meetingId;
    this.nextStepId = nextStepId;
  }
}
