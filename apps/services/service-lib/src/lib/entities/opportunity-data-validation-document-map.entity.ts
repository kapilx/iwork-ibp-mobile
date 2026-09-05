import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { OpportunityDataValidation } from "./data-validation.entity";
import { FileUpload } from "./file-upload.entity";
import { LookUp } from "./look-up.entity";

@Entity("opportunity_data_validation_document_map")
export class OpportunityDataValidationDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "data_validation_id", type: "int" })
  dataValidationId: number;

  @Column({ name: "document_id", type: "int" })
  documentId: number;

  @Column({ name: "document_type_lid", type: "int" })
  documentTypeLid: number;

  @Column({ name: "task_id", type: "int", nullable: true })
  taskId: number | null;

  @ManyToOne(
    () => OpportunityDataValidation,
    (dataValidation) => dataValidation.id,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "data_validation_id" })
  dataValidation: Relation<OpportunityDataValidation>;

  @ManyToOne(() => FileUpload, (fileUpload) => fileUpload.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "document_type_lid" })
  documentType: Relation<LookUp>;

  constructor(
    id: number,
    dataValidationId: number,
    documentId: number,
    documentTypeLid: number,
    taskId: number | null
  ) {
    this.id = id;
    this.dataValidationId = dataValidationId;
    this.documentId = documentId;
    this.documentTypeLid = documentTypeLid;
    this.taskId = taskId;
  }
}
