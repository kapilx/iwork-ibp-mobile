import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PolicyBrokerageInvoice } from "./policy-brokerage-invoices.entity";

/**
 * Entity for policy_brokerage_collections table.
 * Links to policy_brokerage_invoices via policy_brokerage_invoice_id.
 */
@Entity("policy_brokerage_collections")
export class PolicyBrokerageCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_brokerage_invoice_id", type: "int", nullable: false })
  policyBrokerageInvoiceId: number;

  @Column({ name: "collected", type: "boolean", nullable: false, default: false })
  collected: boolean;

  @Column({ name: "utr_number", type: "varchar", length: 100, nullable: true })
  utrNumber: string | null;

  @Column({ name: "utr_date", type: "timestamp", nullable: true })
  utrDate: Date | null;

  @Column({ name: "collected_amount", type: "decimal", precision: 15, scale: 2, nullable: true })
  collectedAmount: number | null;


  @ManyToOne(() => PolicyBrokerageInvoice, (invoice) => invoice.collections)
  @JoinColumn({ name: "policy_brokerage_invoice_id" })
  policyBrokerageInvoice: PolicyBrokerageInvoice;
}

