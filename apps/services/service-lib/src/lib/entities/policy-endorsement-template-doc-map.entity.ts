import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Policy } from './policy.entity';
import { Insurer } from './insurer.entity';
import { FileUpload } from './file-upload.entity';

@Entity('policy_endorsement_template_doc_map')
export class PolicyEndorsementTemplateDocMap {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'policy_id', type: 'int' })
  policyId!: number;

  @Column({ name: 'insurer_id', type: 'int' })
  insurerId!: number;

  @Column({ name: 'document_id', type: 'int' })
  documentId!: number;

  @ManyToOne(() => Policy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy?: Relation<Policy>;

  @ManyToOne(() => Insurer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'insurer_id' })
  insurer?: Relation<Insurer>;

  @ManyToOne(() => FileUpload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document?: Relation<FileUpload>;

  constructor(policyId: number, insurerId: number, documentId: number) {
    this.policyId = policyId;
    this.insurerId = insurerId;
    this.documentId = documentId;
  }
}
