import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Note } from "./note.entity";
import { FileUpload } from "./file-upload.entity";

@Entity("note_document_map")
export class NoteDocumentMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "note_id", type: "int" })
  noteId?: number;

  @Column({ name: "document_id", type: "int" })
  documentId?: number;

  @ManyToOne(() => Note, (note) => note.noteDocs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "note_id" })
  note: Relation<Note>;

  @ManyToOne(() => FileUpload, (fileupload) => fileupload.noteDocs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;

  constructor(noteId: number, documentId: number) {
    this.noteId = noteId;
    this.documentId = documentId;
  }
}
