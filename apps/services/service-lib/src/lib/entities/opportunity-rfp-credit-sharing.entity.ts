import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { OpportunityRfpDetailsEntry } from "./opportunity-rfp-details-entry.entity";

@Entity({ name: "opportunity_rfp_credit_sharing" })
export class OpportunityRfpCreditSharing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "opportunity_rfp_details_entry_id",
    type: "integer",
    nullable: false,
  })
  opportunityRfpDetailsEntryId: number;

  @Column({ name: "executive_id", type: "integer", nullable: false })
  executiveId: number;

  @Column({
    name: "credit_sharing_percentage",
    type: "integer",
    nullable: false,
  })
  percentage: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
  deletedAt: Date;

  @Column({ name: "created_by", type: "integer", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "integer", nullable: false })
  updatedBy: number;

  @ManyToOne(() => OpportunityRfpDetailsEntry)
  @JoinColumn({ name: "opportunity_rfp_details_entry_id" })
  opportunityRfpDetailsEntry: OpportunityRfpDetailsEntry;
}
