import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Meeting } from "./meeting.entity";
import { FileUpload } from "./file-upload.entity";

@Entity({ name: "kdm_meeting_document_map" })
export class KdmMeetingDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "meeting_id", type: "int", nullable: false })
  meetingId: number;

  @Column({ name: "kdm_meeting_id", type: "int"})
  kdmMeetingId: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId: number;

  @ManyToOne(() => Meeting, { onDelete: "CASCADE" })
  @JoinColumn({ name: "meeting_id" })
  meeting: Meeting;

  @ManyToOne(() => FileUpload, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document: FileUpload;
}
