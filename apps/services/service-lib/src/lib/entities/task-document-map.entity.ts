import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Task } from "./task.entity";
import { FileUpload } from "./file-upload.entity";

@Entity("task_document_map")
export class TaskDocumentMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "task_id", type: "int" })
  taskId?: number;

  @Column({ name: "document_id", type: "int" })
  documentId?: number;

  @ManyToOne(() => Task, (task) => task.taskDocs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "task_id" })
  task?: Relation<Task>;

  @ManyToOne(() => FileUpload, (fileupload) => fileupload.taskDocs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document?: Relation<FileUpload>;

  constructor(taskId: number, documentId: number) {
    this.taskId = taskId;
    this.documentId = documentId;
  }
}
