import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { OpportunityHeldCoverNote } from "./opportunity-held-cover-note.entity";

@Entity("opportunity_held_cover_note_cover_detail")
export class OpportunityHeldCoverNoteCoverDetail {
  @PrimaryGeneratedColumn({name: "id", type: "int"})
  id: number;

  @Column({ name: "held_cover_note_id", type: "int" })
  heldCoverNoteId: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "cover_template_id", type: "int" })
  coverTemplateId: number;

  @Column({ name: "cover_name", type: "varchar" })
  coverName: string;

  @Column({ name: "cover_response", type: "varchar" })
  coverResponse: string;

  @Column({ name: "covers_meta", type: "jsonb", nullable: true })
  coversMeta?: Record<string, any>;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(
    () => OpportunityHeldCoverNote,
    (heldCoverNote) => heldCoverNote.coverDetails
  )
  @JoinColumn({ name: "held_cover_note_id" })
  heldCoverNote: OpportunityHeldCoverNote;
}
