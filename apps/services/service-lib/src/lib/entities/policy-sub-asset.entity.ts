import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("policy_sub_asset")
export class PolicySubAsset {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "main_cover_code", type: "varchar", length: 50 })
  mainCoverCode!: string;

  @Column({ name: "sub_cover_description", type: "text", nullable: true })
  subCoverDescription?: string | null;

  @Column({ name: "sub_limit_type", type: "varchar", length: 100, nullable: true })
  subLimitType?: string | null;
}
