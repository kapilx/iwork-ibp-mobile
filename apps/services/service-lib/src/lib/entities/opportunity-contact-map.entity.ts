import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { Contact } from "./contact.entity";
import type { Relation } from "typeorm";

@Entity({ name: "opportunity_contact_map" })
@Unique(["opportunity", "contact"])
export class OpportunityContactMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id" })
  opportunityId: number;

  @Column({ name: "contact_id" })
  contactId: number;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @ManyToOne(() => Contact, (contact) => contact.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contact_id" })
  contact: Relation<Contact>;
}
