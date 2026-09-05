import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("mstr_cover_section")
export class MstrCoverSection {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "name", type: "varchar", length: 150, nullable: false })
  name: string;

  @Column({ name: "key", type: "varchar", length: 100, nullable: false })
  key: string;

  @Column({ name: "display_sequence", type: "int", default: 0 })
  displaySequence: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt?: Date;

  @Column({ name: "created_by", type: "int", default: 0 })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  updatedBy: number;
}
