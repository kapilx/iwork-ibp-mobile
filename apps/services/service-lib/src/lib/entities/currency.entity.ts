import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { Country } from "./country.entity";

@Entity("currency")
export class Currency {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "name", type: "varchar", length: 255, nullable: false })
  name: string;

  @Column({ name: "value", type: "varchar", length: 10, nullable: false })
  value: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "country_id", type: "int", nullable: true })
  countryId?: number;

  @ManyToOne(() => Country, (country) => country.currencies, { nullable: true })
  @JoinColumn({ name: "country_id" })
  country?: Country;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  constructor(
    id: number,
    name: string,
    value: string,
    description: string,
    countryId: number,
    createdBy: number,
    updatedBy: number
  ) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.description = description;
    this.countryId = countryId;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
