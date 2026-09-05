import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { AdminReportParameter } from './admin-report-parameter.entity';
import { AdminReportsResultsMappings } from './admin-report-results-mapping.entitys';

@Entity('admin_reports')
export class AdminReport {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'label', type: 'varchar' })
  label!: string;

  @Column({ name: 'end_point', type: 'varchar' })
  endPoint!: string;

  @Column({ name: 'query', type: 'text' })
  query!: string;

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

  @Column({ name: 'order_no' })
  orderNo!: number;

  @OneToMany(() => AdminReportParameter, (param) => param.adminReport)
  parameters?: AdminReportParameter[];

  @OneToMany(() => AdminReportsResultsMappings, (param) => param.adminReport)
  results?: AdminReportsResultsMappings[];
}
