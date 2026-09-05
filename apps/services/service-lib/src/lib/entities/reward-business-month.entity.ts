import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Reward } from "./reward.entity";

// One row per selected business month (BR-005, multi-select).
@Entity({ name: "reward_business_month" })
export class RewardBusinessMonth {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ name: "reward_id", type: "int" })
  rewardId!: number;

  // First-of-month date (e.g. 2026-05-01); range filters compare on this.
  @Column({ name: "business_month", type: "date" })
  businessMonth!: string;

  // Month bounds derived from businessMonth: first and last day of the month
  // (e.g. 2026-05-01 .. 2026-05-31). Nullable for rows created before this.
  @Column({ name: "start_date", type: "date", nullable: true })
  startDate?: string;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate?: string;

  @ManyToOne(() => Reward, (reward) => reward.businessMonths, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "reward_id" })
  reward?: Relation<Reward>;
}
