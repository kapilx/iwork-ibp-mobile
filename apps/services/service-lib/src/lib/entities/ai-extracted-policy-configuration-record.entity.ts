import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'ai_extracted_policy_configuration_record' })
export class AiExtractedPolicyConfigurationRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'document_id' })
  documentId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'policy_id', nullable: true })
  policyId: number;

  @Column({ name: 'extraction_status' })
  extractionStatus: string; // 'SUCCESS' | 'PARTIAL' | 'FAILED'

  @Column({ name: 'extracted_configuration', type: 'jsonb', nullable: true })
  extractedConfiguration: object;

  @Column({ name: 'stage_results', type: 'jsonb', nullable: true })
  stageResults: object;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  @Column({ name: 'warnings', type: 'jsonb', nullable: true })
  warnings: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
