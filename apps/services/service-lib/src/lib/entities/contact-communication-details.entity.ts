import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Contact } from "./contact.entity";
import type { Relation } from "typeorm";
import { SensitiveField } from "../field-encryption/decorators/sensitive-field.decorator";
@Entity("contact_communication_details")
export class ContactCommunicationDetails {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "contact_id", type: "int", nullable: false })
  contactId!: number;

  @Column({
    name: "communication_type",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  communicationType!: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "communication_details_enc", type: "text", nullable: true })
  communicationDetails!: string;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean; // New field with default value

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy!: number;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Contact, (contact) => contact.communicationDetails, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contact_id" })
  contact!: Relation<Contact>;
}
