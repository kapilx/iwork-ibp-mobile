import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { OpportunityHeldCoverNote } from "./opportunity-held-cover-note.entity";
import { FileUpload } from "./file-upload.entity";

@Entity({ name: "opportunity_held_cover_note_document_map" })
export class OpportunityHeldCoverNoteDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "held_cover_note_id", type: "int", nullable: false })
  heldCoverNoteId: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId: number;

  @Column({ name: "document_type_lid", type: "int", nullable: false })
  documentTypeLid: number;

  @ManyToOne(
    () => OpportunityHeldCoverNote,
    (heldCoverNote) => heldCoverNote.documents,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "held_cover_note_id" })
  heldCoverNote: Relation<OpportunityHeldCoverNote>;

  @ManyToOne(() => FileUpload, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;
}
