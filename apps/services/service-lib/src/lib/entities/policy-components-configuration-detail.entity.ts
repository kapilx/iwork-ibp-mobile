import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { Company } from "./company.entity";
import { Policy } from "./policy.entity";
import { PolicyConfigurationComponentRelationMap } from "./policy-configuration-component-relation-map.entity";

@Entity("policy_configuration_components_detail")
export class PolicyComponentsConfigurationDetail {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "company_id", type: "int" })
  companyId!: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId!: number;

  @Column({ name: "type", type: "varchar" })
  type!: string;

  @Column({ name: "label", type: "varchar" })
  label!: string;

  @Column({ name: "premium_per_life", type: "boolean" })
  premiumPerLife!: boolean;

  @Column({ name: "multiple_sum_insured_label", type: "varchar" })
  multipleSumInsuredLabel!: string;

  @Column({ name: "sum_insured_model", type: "varchar" })
  sumInsuredModel!: string;

  @Column({ name: "show_company_contribution", type: "boolean" })
  showCompanyContribution!: boolean;

  @Column({ name: "pro_ration_enabled", type: "boolean", default: true })
  proRationEnabled!: boolean;

  @Column({ name: "is_benefit_component", type: "boolean", default: false })
  isBenefitComponent!: boolean;

  @Column({ name: "accept_relations_from_parent", type: "boolean", default: false })
  acceptRelationsFromParent!: boolean;

  @Column({ name: "is_optional", type: "boolean", default: false })
  isOptional!: boolean;

  @Column({ name: "sum_insured_per_life", type: "boolean", default: false })
  sumInsuredPerLife!: boolean;

  @Column({
    name: "provisional_policy_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  provisionalPolicyNumber?: string | null;

  @Column({
    name: "insurer_policy_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  insurerPolicyNumber?: string | null;

  @Column({
    name: "iirm_policy_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  iirmPolicyNumber?: string | null;

  @Column({ name: "club_sum_insured_lid", type: "int", nullable: true })
  clubSumInsuredLid?: number | null;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt!: Date;

  @ManyToOne(() => Company, (company) => company.policyConfigurations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @ManyToOne(() => Policy, (policy) => policy.policyConfigurations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "policy_id" })
  policy!: Policy;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "club_sum_insured_lid" })
  clubSumInsured?: Relation<LookUp>;

  @OneToMany(
    () => PolicyConfigurationComponentRelationMap,
    (relationMap) => relationMap.componentDetail
  )
  relationMappings?: Relation<PolicyConfigurationComponentRelationMap[]>;
}
