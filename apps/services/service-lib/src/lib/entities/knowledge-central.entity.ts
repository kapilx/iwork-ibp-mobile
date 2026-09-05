import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
  Index,
} from 'typeorm';
import { LookUp } from './look-up.entity';

@Entity({ name: 'knowledge_central' })
@Index('idx_kc_doc_status', ['documentId', 'statusId'])
@Index('uq_kc_doc_version', ['documentId', 'version'], { unique: true })
export class KnowledgeCentral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'document_id', type: 'bigint' })
  documentId: bigint;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'doc_type_id', type: 'int' })
  docTypeId: number;

  @Column({ name: 'status_id', type: 'int' })
  statusId: number;

  @Column({ name: 'category_id', type: 'int' })
  categoryId: number;

  @Column({name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'relative_path', type: 'varchar', length: 255, nullable: true })
  relativePath: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  extension: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', array: true, nullable: true })
  tags: string[] | null;

  @Column({ name: 'access_count', type: 'int', default: 0 })
  accessCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @Column({ name: 'updated_by', type: 'int' })
  updatedBy: number;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: 'doc_type_id', referencedColumnName: 'id' })
  docType: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: 'status_id', referencedColumnName: 'id' })
  status: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: Relation<LookUp>;

  constructor(
    title: string,
    docTypeId: number,
    statusId: number,
    categoryId: number,
    fileName: string,
    documentId: bigint,
    relativePath?: string | null,
    extension?: string | null,
    summary?: string | null,
    tags?: string[] | null,
    accessCount: number = 0,
    createdBy: number = 0,
    updatedBy: number = 0,
    version: number = 1,
  ) {
    this.title = title;
    this.docTypeId = docTypeId;
    this.statusId = statusId;
    this.categoryId = categoryId;
    this.fileName = fileName;
    this.relativePath = relativePath || null;
    this.extension = extension || null;
    this.summary = summary || null;
    this.tags = tags || null;
    this.accessCount = accessCount;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.documentId = documentId; // Default to 0 if not provided
    this.version = version;
  }
}
