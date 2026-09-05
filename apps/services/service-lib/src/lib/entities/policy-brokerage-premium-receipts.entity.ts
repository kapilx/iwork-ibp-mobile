import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PolicyBrokerageDetails } from "./policy-brokerage-details.entity";

/**
 * Entity for policy_brokerage_premium_receipts table.
 */
@Entity("policy_brokerage_premium_receipts")
export class PolicyBrokeragePremiumReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_brokerage_id", type: "int", nullable: false })
  policyBrokerageId: number;

  @Column({ name: "pr_mapped", type: "boolean", nullable: false, default: false })
  prMapped: boolean;

  @Column({ name: "pr_id", type: "varchar", length: 100, nullable: true })
  prId: string | null;

  @Column({ name: "pr_name", type: "varchar", length: 255, nullable: true })
  prName: string | null;

  @Column({ name: "pr_brokerage", type: "decimal", precision: 15, scale: 2, nullable: true })
  prBrokerage: number | null;

  @Column({ name: "pr_premium", type: "decimal", precision: 15, scale: 2, nullable: true })
  prPremium: number | null;

  @ManyToOne(() => PolicyBrokerageDetails, (details) => details.premiumReceipts)
  @JoinColumn({ name: "policy_brokerage_id" })
  policyBrokerageDetails: PolicyBrokerageDetails;
}

