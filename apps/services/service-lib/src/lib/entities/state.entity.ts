import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Country } from "./country.entity";

@Entity("state")
export class State {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: "name", type: "varchar", length: 100 })
  name: string;

  @Column({ name: "state_code", type: "varchar", length: 10, nullable: true })
  stateCode?: string;

  @Column({ name: "country_id", type: "int" })
  countryId: number;

  @ManyToOne(() => Country, (country) => country.id)
  @JoinColumn({ name: "country_id" }) // Ensure the correct column name is used
  country: Country;

  constructor(
    name: string,
    countryId: number,
    country: Country,
    stateCode?: string
  ) {
    this.name = name;
    this.countryId = countryId;
    this.country = country;
    this.stateCode = stateCode;
  }
}
