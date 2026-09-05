import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { Company } from "./company.entity";
import type { Relation } from "typeorm";
@Entity("group_company_map")
export class GroupCompanyMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "company_id", type: "int" })
  companyId?: number;

  @Column({ name: "group_company_id", type: "int" })
  groupCompanyId?: number;

  @ManyToOne(() => Company, (company) => company.groupCompanyMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "company_id" })
  company?: Relation<Company>;

  @ManyToOne(() => Company, (company) => company.groupCompanyMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "group_company_id" })
  groupCompany?: Relation<Company>;

  constructor(companyId: number, groupCompanyId: number) {
    this.companyId = companyId;
    this.groupCompanyId = groupCompanyId;
  }
}
