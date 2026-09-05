import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DocumentProcessingFile } from './document-processing-file.entity';
import { FileUpload } from './file-upload.entity';
import { Policy } from './policy.entity';

@Entity('policy_enrollment_upload_summary')
export class PolicyEnrollmentUploadSummary {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'document_processing_file_id', type: 'int' })
  documentProcessingFileId!: number;

  @Column({ name: 'policy_id', type: 'int' })
  policyId!: number;

  @Column({ name: 'source_file_upload_id', type: 'int' })
  sourceFileUploadId!: number;

  @Column({ name: 'error_file_upload_id', type: 'int', nullable: true })
  errorFileUploadId?: number | null;

  @Column({ name: 'success_file_upload_id', type: 'int', nullable: true })
  successFileUploadId?: number | null;

  @Column({ name: 'success_count', type: 'int' })
  successCount!: number;

  @Column({ name: 'error_count', type: 'int' })
  errorCount!: number;

  @Column({ name: 'process_count', type: 'int', default: 0 })
  processCount!: number;

  @Column({ name: 'batch_id', type: 'int', unique: true })
  batchId!: number;

  @Column({ name: 'endorsement_id', type: 'int', nullable: true })
  endorsementId?: number;

  @Column({ name: 'premium_calculated', type: 'boolean', default: true, nullable: false })
  premiumCalculated!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => DocumentProcessingFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_processing_file_id' })
  documentProcessingFile!: DocumentProcessingFile;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: 'source_file_upload_id' })
  sourceFile!: FileUpload;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: 'error_file_upload_id' })
  errorFile?: FileUpload | null;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: 'success_file_upload_id' })
  successFile?: FileUpload | null;

  @ManyToOne(() => Policy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy!: Policy;
}
