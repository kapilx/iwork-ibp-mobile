import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Broker } from "./broker.entity";
import { Contact } from "./contact.entity";
import type { Relation } from "typeorm";

@Entity({ name: "broker_contact" })
export class BrokerContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "broker_id" })
  brokerId!: number;

  @Column({ name: "contact_id" })
  contactId!: number;

  /** Relationship with the Broker entity. */
  @ManyToOne(() => Broker, (broker) => broker.brokerContacts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "broker_id" })
  broker!: Relation<Broker>;

  /** Relationship with the Contact entity. */
  @ManyToOne(() => Contact, (contact) => contact.brokerContacts, {
    eager: true,
  })
  @JoinColumn({ name: "contact_id" })
  contact!: Relation<Contact>;
}
