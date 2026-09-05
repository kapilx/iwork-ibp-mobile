import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { LookUp } from "./look-up.entity";

@Entity("opportunity_quote")
export class OpportunityQuote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "existing_quote_info", type: "varchar", nullable: true })
  existingQuoteInfo: string | null;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string | null;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid: number | null;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId: number | null;

  @ManyToOne(() => LookUp, { nullable: true })
  @JoinColumn({ name: "status_lid" })
  status?: Relation<LookUp>;
}
