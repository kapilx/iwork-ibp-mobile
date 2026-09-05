import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("tpa_claim_data")
export class TpaClaimData {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: "policy_number", length: 100 })
  policyNumber!: string;

  @Index()
  @Column({ name: "tpa_claim_no", type: "varchar", length: 100, nullable: true })
  tpaClaimNo?: string;

  @Index()
  @Column({ name: "employee_tpa_id", type: "varchar", length: 100, nullable: true })
  employeeTpaId!: string;

  @Column({ name: "data_type", length: 20, default: "MIS" })
  dataType!: string;

  @Column({ name: "claim_data", type: "jsonb" })
  claimData!: Record<string, any>;

  @CreateDateColumn({ name: "fetched_at", type: "timestamptz" })
  fetchedAt!: Date;
}
