import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'claim_form_extraction' })
export class ClaimFormExtraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'policy_id', type: 'int', nullable: true })
  policyId: number | null;

  @Column({ name: 'employee_id', type: 'int', nullable: true })
  employeeId: number | null;

  @Column({ name: 'file_name', type: 'text', nullable: true })
  fileName: string | null;

  @Column({ name: 'claim_data', type: 'jsonb', nullable: true })
  claimData: Record<string, any> | null;

  @Column({ name: 'ai_response_data', type: 'jsonb', nullable: true })
  aiResponseData: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;
}
