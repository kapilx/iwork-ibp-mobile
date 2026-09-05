import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Company } from "./company.entity";
import { FileUpload } from "./file-upload.entity";
@Entity("company_doc_map")
export class CompanyDocMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "company_id", type: "int" })
  companyId?: number;

  @Column({ name: "doc_id", type: "int" })
  documentId?: number;

  @ManyToOne(() => Company, (company) => company.companyDocMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "company_id" })
  company?: Relation<Company>;

  @ManyToOne(() => FileUpload, (fileupload) => fileupload.companyDocMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "doc_id" })
  document?: Relation<FileUpload>;

  constructor(companyId: number, documentId: number) {
    this.companyId = companyId;
    this.documentId = documentId;
  }
}
