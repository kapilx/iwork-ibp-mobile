import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Region } from "./region.entity";

@Entity("country")
export class Country {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: "name", type: "varchar", length: 100 })
  name: string;

  @Column({ name: "iso_code", type: "varchar", length: 10, nullable: true })
  isoCode: string;

  @ManyToOne(() => Region, (region) => region.id)
  @JoinColumn({ name: "region_id" }) // Ensure the correct column name is used
  region: Region;

  constructor(name: string, region: Region, isoCode?: string) {
    this.name = name;
    this.region = region;
    this.isoCode = isoCode ?? "";
  }
}
