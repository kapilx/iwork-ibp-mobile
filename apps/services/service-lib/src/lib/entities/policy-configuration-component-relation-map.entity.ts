import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { PolicyComponentsConfigurationDetail } from "./policy-components-configuration-detail.entity";

@Entity("policy_configuration_component_relation_map")
export class PolicyConfigurationComponentRelationMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "policy_configuration_component_detail_id",
    type: "int",
    nullable: false,
  })
  policyConfigurationComponentDetailId: number;

  @Column({ name: "relation_type", type: "varchar", length: 100 })
  relationType: string;

  @ManyToOne(
    () => PolicyComponentsConfigurationDetail,
    (detail) => detail.relationMappings,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "policy_configuration_component_detail_id" })
  componentDetail: Relation<PolicyComponentsConfigurationDetail>;
}
