import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from "typeorm";
import { OpportunityRfpDetailsEntry } from "./opportunity-rfp-details-entry.entity";
import { OpportunityRfpClientContactInfluencers } from "./opportunity-rfp-client-contact-influencers.entity";

@Entity({ name: "opportunity_rfp_client_contact_detail" })
export class OpportunityRfpClientContactDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "opportunity_rfp_details_entry_id",
    type: "integer",
    nullable: false,
  })
  opportunityRfpDetailsEntryId: number;

  @Column({ name: "contact_id", type: "integer", nullable: false })
  contactId: number;

  @Column({
    name: "expected_premium",
    type: "integer",
    nullable: false,
  })
  expectedPremium: number;

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

  @OneToMany(
    () => OpportunityRfpClientContactInfluencers,
    (influencer) => influencer.clientContact
  )
  clientContactInfluencers: OpportunityRfpClientContactInfluencers[];
}
