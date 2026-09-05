import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'performance_output' })
export class PerformanceOutput {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: string;

  @Column({ name: 'kpi', type: 'varchar', length: 50 })
  kpi: string;

  @Column({ name: 'type_of_target', type: 'varchar', length: 50 })
  typeOfTarget: string;

  @Column({ name: 'value_of_target', type: 'numeric', precision: 15, scale: 2, default: 0 })
  valueOfTarget: number;

  @Column({ name: 'entity_count', type: 'numeric', precision: 15, scale: 2, default: 0 })
  entityCount: number;

  @Column({ name: 'performance_month', type: 'date' })
  performanceMonth: Date;

  @Column({ name: 'organisation_id', type: 'int', nullable: true })
  organisationId: number | null;

  @Column({ name: 'sbu_id', type: 'int', nullable: true })
  sbuId: number | null;

  @Column({ name: 'vertical_id', type: 'int', nullable: true })
  verticalId: number | null;

  @Column({ name: 'department_id', type: 'int', nullable: true })
  departmentId: number | null;

  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date;
}
