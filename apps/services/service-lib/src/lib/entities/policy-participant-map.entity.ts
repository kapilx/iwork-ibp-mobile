import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Policy } from "./policy.entity";
import { User } from "./user";

@Entity("policy_participant_map")
export class PolicyParticipantMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({ name: "participant_id", type: "int", nullable: false })
  participantId: number;

  @Column({
    name: "participant_type",
    type: "varchar",
    length: 100,
    nullable: false,
  })
  participantType: string;

  // Relationships
  @ManyToOne(() => Policy, (policy) => policy.policyParticipants)
  @JoinColumn({ name: "policy_id" })
  policy: Relation<Policy>;

  @ManyToOne(() => User, (participant) => participant.id)
  @JoinColumn({ name: "participant_id" })
  participant: Relation<User>;
}
