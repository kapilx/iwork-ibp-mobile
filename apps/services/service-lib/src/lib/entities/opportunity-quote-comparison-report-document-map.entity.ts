import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityQuoteComparisonReport } from "./opportunity-quote-comparison-report.entity";
import { LookUp } from "./look-up.entity";
import type { Relation } from "typeorm";
import { FileUpload } from "./file-upload.entity";

@Entity("opportunity_quote_comparison_report_document_map")
export class OpportunityQuoteComparisonReportDocumentMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "quote_comparison_report_id", type: "int", nullable: false })
  quoteComparisonReportId!: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId!: number;

  @Column({ name: "document_type_lid", type: "int", nullable: true })
  documentTypeLid?: number;

  @ManyToOne(
    () => OpportunityQuoteComparisonReport,
    (report) => report.documents,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "quote_comparison_report_id" })
  quoteComparisonReport: Relation<OpportunityQuoteComparisonReport>;

  @ManyToOne(() => FileUpload, { onDelete: "SET NULL" })
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;

  @ManyToOne(() => LookUp, { onDelete: "SET NULL" })
  @JoinColumn({ name: "document_type_lid" })
  documentType: Relation<LookUp>;

  constructor(
    quoteComparisonReportId: number,
    documentId: number,
    documentTypeLid?: number
  ) {
    this.quoteComparisonReportId = quoteComparisonReportId;
    this.documentId = documentId;
    this.documentTypeLid = documentTypeLid;
  }
}
