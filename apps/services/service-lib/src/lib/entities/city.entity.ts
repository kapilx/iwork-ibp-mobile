import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { State } from "./state.entity";

@Entity("city")
export class City {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: "name", type: "varchar", length: 100 })
  name: string;

  @Column({ name: "state_id", type: "int" })
  stateId: number;

  @ManyToOne(() => State, (state) => state.id)
  @JoinColumn({ name: "state_id" }) // Ensure the correct column name is used
  state: State;

  constructor(name: string, stateId: number, state: State) {
    this.name = name;
    this.stateId = stateId;
    this.state = state;
  }
}
