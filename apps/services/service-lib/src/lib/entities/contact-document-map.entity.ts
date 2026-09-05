import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from "typeorm";
import { Contact } from "./contact.entity";
import { FileUpload } from "./file-upload.entity";
import type { Relation } from "typeorm";
@Entity("contact_doc_map")
export class ContactDocMap {
  @PrimaryGeneratedColumn()
  id!: number | undefined;

  @Column({ name: "contact_id" })
  contactId?: number;

  @Column({ name: "doc_id" })
  documentId?: number;

  @ManyToOne(() => Contact, (contact) => contact.contactDocMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contact_id" })
  contact?: Relation<Contact>;

  @ManyToOne(() => FileUpload, (fileupload) => fileupload.contactDocMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "doc_id" })
  document?: Relation<FileUpload>;

  constructor(contactId: number, documentId: number) {
    this.contactId = contactId;
    this.documentId = documentId;
  }
}
