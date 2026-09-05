import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Meeting } from "./meeting.entity";
import { FileUpload } from "./file-upload.entity";
import { LookUp } from "./look-up.entity";

@Entity("meeting_document_map")
export class MeetingDocumentMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "meeting_id", type: "int" })
  meetingId?: number;

  @Column({ name: "document_id", type: "int" })
  documentId?: number;

  @Column({ name: "document_type_lid", type: "int" })
  documentTypeLid?: number;

  @ManyToOne(() => Meeting, (meeting) => meeting.meetingDocs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meeting_id" })
  meeting?: Relation<Meeting>;

  @ManyToOne(() => FileUpload, (fileupload) => fileupload.meetingDocs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document?: Relation<FileUpload>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "document_type_lid" })
  documentType?: Relation<LookUp>;

  constructor(meetingId: number, documentId: number, documentTypeLid?: number) {
    this.meetingId = meetingId;
    this.documentId = documentId;
    this.documentTypeLid = documentTypeLid;
  }
}
