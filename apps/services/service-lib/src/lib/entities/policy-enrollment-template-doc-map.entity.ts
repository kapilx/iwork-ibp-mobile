import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Policy } from './policy.entity';
import { FileUpload } from './file-upload.entity';

@Entity('policy_enrollment_template_doc_map')
export class PolicyEnrollmentTemplateDocMap {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'policy_id', type: 'int' })
  policyId!: number;

  @Column({ name: 'document_id', type: 'int' })
  documentId!: number;

  @Column({ name: 'mapped_document_id', type: 'int', nullable: true, default: null })
  mappedDocumentId?: number | null;

  @ManyToOne(() => Policy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy?: Relation<Policy>;

  @ManyToOne(() => FileUpload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document?: Relation<FileUpload>;

  constructor(policyId: number, documentId: number) {
    this.policyId = policyId;
    this.documentId = documentId;
  }
}
