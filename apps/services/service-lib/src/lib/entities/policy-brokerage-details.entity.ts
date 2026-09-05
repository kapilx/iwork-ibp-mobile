import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from "typeorm";

/**
 * Entity for policy_brokerage_details table.
 * entity_id stores the policy id this record belongs to.
 */
@Entity("policy_brokerage_details")
export class PolicyBrokerageDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "entity_type", type: "varchar", length: 20, nullable: false })
  entityType: string;

  @Column({ name: "entity_id", type: "int", nullable: false })
  entityId: number;

  @Column({ name: "date_of_income", type: "date", nullable: true })
  dateOfIncome: Date | null;

  @Column({ name: "endorsement_frequency", type: "varchar", length: 50, nullable: true })
  endorsementFrequency: string | null;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  @OneToMany(
    () => require("./policy-brokerage-premium-receipts.entity").PolicyBrokeragePremiumReceipt,
    (pr: any) => pr.policyBrokerageDetails,
  )
  premiumReceipts: any[];

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  @OneToMany(
    () => require("./policy-brokerage-commission-statements.entity").PolicyBrokerageCommissionStatement,
    (cs: any) => cs.policyBrokerageDetails,
  )
  commissionStatements: any[];

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  @OneToMany(
    () => require("./policy-brokerage-invoices.entity").PolicyBrokerageInvoice,
    (inv: any) => inv.policyBrokerageDetails,
  )
  invoices: any[];
}

