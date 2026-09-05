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
import { MstrMirSection } from "./mstr-mir-section.entity";

@Entity("mir_report_section")
export class MirReportSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "report_id", type: "int" })
  reportId: number;

  @Column({ name: "section_id", type: "int" })
  sectionId: number;

  @Column({ name: "section_summary", type: "text", nullable: true })
  sectionSummary?: string;

  @Column({ name: "cell_data", type: "jsonb", nullable: true })
  cellData?: Record<string, string | boolean>;

  @Column({ name: "approved_data", type: "jsonb", nullable: true })
  approvedData?: Record<string, (string | boolean)[][]>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => MstrMirSection)
  @JoinColumn({ name: "section_id" })
  section: Relation<MstrMirSection>;
}
