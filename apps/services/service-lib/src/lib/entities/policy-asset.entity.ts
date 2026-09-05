import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("policy_asset")
export class PolicyAsset {
  @PrimaryGeneratedColumn()
  id!: number;

  // Identifier of the company owning the policy
  @Column({ name: "cover_code", type: "varchar", length: 50 })
  coverCode!: string;

  @Column({ name: "risk_location_type", type: "varchar", length: 100 })
  riskLocationType!: string;

  @Column({ name: "risk_location_details", type: "text", nullable: true })
  riskLocationDetails?: string | null;

  @Column({ name: "category", type: "varchar", length: 100 })
  category?: string;

  @Column({ name: "coverage_type", type: "varchar", length: 100 })
  coverageType?: string;

  @Column({ name: "quantity", type: "int", nullable: true })
  quantity?: number;

  @Column({ name: "uom", type: "varchar", length: 100 })
  uom?: string;
}
