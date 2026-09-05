import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityRfpClientContactDetail } from "./opportunity-rfp-client-contact-details.entity";

@Entity({ name: "opportunity_rfp_client_contact_influencers" })
export class OpportunityRfpClientContactInfluencers {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "client_contact_id", type: "integer", nullable: false })
  clientContactId: number;

  @Column({ name: "influencer_contact_id", type: "integer", nullable: false })
  influencerContactId: number;

  @ManyToOne(
    () => OpportunityRfpClientContactDetail,
    (contact) => contact.clientContactInfluencers
  )
  @JoinColumn({ name: "client_contact_id", referencedColumnName: "id" })
  clientContact: OpportunityRfpClientContactDetail;
}
