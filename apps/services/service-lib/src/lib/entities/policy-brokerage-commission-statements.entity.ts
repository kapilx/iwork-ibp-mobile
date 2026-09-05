import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PolicyBrokerageDetails } from "./policy-brokerage-details.entity";

/**
 * Entity for policy_brokerage_commission_statements table.
 */
@Entity("policy_brokerage_commission_statements")
export class PolicyBrokerageCommissionStatement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_brokerage_id", type: "int", nullable: false })
  policyBrokerageId: number;

  @Column({ name: "commission_statement_mapped", type: "boolean", nullable: false, default: false })
  commissionStatementMapped: boolean;

  @Column({ name: "commission_statement_id", type: "varchar", length: 100, nullable: true })
  commissionStatementId: string | null;

  @Column({ name: "commission_statement_name", type: "varchar", length: 255, nullable: true })
  commissionStatementName: string | null;

  @Column({ name: "commission_statement_brokerage", type: "decimal", precision: 15, scale: 2, nullable: true })
  commissionStatementBrokerage: number | null;

  @Column({ name: "commission_statement_premium", type: "decimal", precision: 15, scale: 2, nullable: true })
  commissionStatementPremium: number | null;

  @ManyToOne(() => PolicyBrokerageDetails, (details) => details.commissionStatements)
  @JoinColumn({ name: "policy_brokerage_id" })
  policyBrokerageDetails: PolicyBrokerageDetails;
}

