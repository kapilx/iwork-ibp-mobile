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
 * Entity representing the mapping between meetings and challenges.
 */
@Entity("meeting_challenges_map")
export class MeetingChallengesMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "meeting_id", type: "int", nullable: false })
  meetingId!: number;

  @Column({ name: "challenge_id", type: "int", nullable: false })
  challengeId!: number;

  @ManyToOne(() => Meeting, { onDelete: "CASCADE" })
  @JoinColumn({ name: "meeting_id" })
  meeting?: Relation<Meeting>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "challenge_id" })
  challenge?: Relation<LookUp>;

  constructor(meetingId: number, challengeId: number) {
    this.meetingId = meetingId;
    this.challengeId = challengeId;
  }
}
