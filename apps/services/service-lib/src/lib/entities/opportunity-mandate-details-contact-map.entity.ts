import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { OpportunityMandateDetailsEntry } from "./opportunity-mandate-details-entry.entity";
import { Contact } from "./contact.entity";

@Entity("opportunity_mandate_details_contact_map")
export class OpportunityMandateDetailsContactMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "mandate_id" })
  mandateId: number;

  @Column({ name: "contact_id" })
  contactId: number;

  @ManyToOne(
    () => OpportunityMandateDetailsEntry,
    (mandate) => mandate.mandateDetailsContacts,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "mandate_id" })
  mandate: Relation<OpportunityMandateDetailsEntry>;

  /**
   * Many-to-One relationship with Contact
   */
  @ManyToOne(() => Contact, (contact) => contact.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contact_id" })
  contact: Relation<Contact>;

  constructor(mandateId: number, contactId: number) {
    this.mandateId = mandateId;
    this.contactId = contactId;
  }
}
