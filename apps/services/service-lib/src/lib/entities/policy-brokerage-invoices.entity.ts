import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { PolicyBrokerageDetails } from "./policy-brokerage-details.entity";

/**
 * Entity for policy_brokerage_invoices table.
 */
@Entity("policy_brokerage_invoices")
export class PolicyBrokerageInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_brokerage_id", type: "int", nullable: false })
  policyBrokerageId: number;

  @Column({ name: "invoiced", type: "boolean", nullable: false, default: false })
  invoiced: boolean;

  @Column({ name: "invoice_number", type: "varchar", length: 100, nullable: true })
  invoiceNumber: string | null;

  @Column({ name: "invoice_date", type: "timestamp", nullable: true })
  invoiceDate: Date | null;

  @Column({ name: "invoiced_brokerage", type: "decimal", precision: 15, scale: 2, nullable: true })
  invoicedBrokerage: number | null;

  @ManyToOne(() => PolicyBrokerageDetails, (details: any) => details.invoices)
  @JoinColumn({ name: "policy_brokerage_id" })
  policyBrokerageDetails: PolicyBrokerageDetails;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  @OneToMany(
    () => require("./policy-brokerage-collections.entity").PolicyBrokerageCollection,
    (col: any) => col.policyBrokerageInvoice,
  )
  collections: any[];
}

