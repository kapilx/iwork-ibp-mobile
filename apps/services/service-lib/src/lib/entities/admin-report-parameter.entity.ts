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

@Entity('admin_reports_parameters')
export class AdminReportParameter {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @Column({ name: 'admin_report_id', type: 'int' })
  adminReportId!: number;

  @Column({ name: 'parameter_name', type: 'varchar' })
  parameterName!: string;

  @Column({ name: 'label', type: 'varchar' })
  label!: string;

  @Column({ name: 'query_parameter', type: 'varchar' })
  queryParameter!: string;

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

  @Column({ name: 'input_field_type', type: 'varchar' })
  inputFieldType!: string;
  
  @Column({ name: 'option_type', type: 'varchar' })
  optionType!: string;
  
  @Column({ name: 'option', type: 'jsonb' })
  option!: any;

  @Column({ name: 'order_no' })
  orderNo!: number;

  @ManyToOne(() => AdminReport, (report) => report.parameters)
  @JoinColumn({ name: 'admin_report_id' })
  adminReport!: AdminReport;
}
