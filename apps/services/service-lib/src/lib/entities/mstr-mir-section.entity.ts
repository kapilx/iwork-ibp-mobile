import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("mstr_mir_section")
export class MstrMirSection {
  @PrimaryGeneratedColumn()
  id: number;

  // Short machine-readable key matching frontend section IDs: 's1'..'s13'
  @Column({ name: "section_key", type: "varchar", length: 10, unique: true })
  sectionKey: string;

  @Column({ name: "section_name", type: "varchar", length: 200 })
  sectionName: string;

  @Column({ name: "display_order", type: "int" })
  displayOrder: number;
}
