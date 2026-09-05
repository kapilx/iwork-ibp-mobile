import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdminReport } from './admin-report.entity';

@Entity('admin_reports_results_mappings')
export class AdminReportsResultsMappings {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @Column({ name: 'admin_report_id', type: 'int' })
  adminReportId!: number;

  @Column({ name: 'query_parameter_name', type: 'varchar' })
  queryParameterName!: string;

  @Column({ name: 'variable_name', type: 'varchar' })
  variableName!: string;
  
  @Column({ name: 'label', type: 'varchar' })
  label!: string;

  @Column({ name: 'data_type', type: 'varchar' })
  dataType!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'created_by', type: 'varchar' })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'varchar' })
  updatedBy!: string;

  @Column({ name: 'deleted_by', type: 'varchar', nullable: true })
  deletedBy?: string;

  @Column({ name: 'alignment', type: 'varchar' })
  alignment!: string;

  @ManyToOne(() => AdminReport, (report) => report.parameters)
  @JoinColumn({ name: 'admin_report_id' })
  adminReport!: AdminReport;
}
