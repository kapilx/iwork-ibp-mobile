import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { Company } from "./company.entity";
import { User } from "./user";

@Entity("mir_report")
export class MirReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  // Format: 'MM-YYYY', e.g. '06-2026'
  @Column({ name: "report_period", type: "varchar", length: 7 })
  reportPeriod: string;

  // Lifecycle: draft | submitted | approved | rejected | published | acknowledged
  @Column({ name: "status", type: "varchar", length: 50, default: "draft" })
  status: string;

  @Column({ name: "overall_comments", type: "text", nullable: true })
  overallComments?: string;

  @Column({ name: "rejection_comment", type: "text", nullable: true })
  rejectionComment?: string | null;

  @Column({ name: "organisation_id", type: "int", nullable: true })
  organisationId?: number | null;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => Company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company: Relation<Company>;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  createdByUser: Relation<User>;
}
