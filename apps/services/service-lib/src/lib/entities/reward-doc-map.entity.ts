import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Reward } from "./reward.entity";
import { FileUpload } from "./file-upload.entity";

// Links a reward to its uploaded documents (BR-008). Mirrors company_doc_map.
@Entity({ name: "reward_doc_map" })
export class RewardDocMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "reward_id", type: "int" })
  rewardId?: number;

  @Column({ name: "doc_id", type: "int" })
  documentId?: number;

  @ManyToOne(() => Reward, (reward) => reward.docMaps, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reward_id" })
  reward?: Relation<Reward>;

  @ManyToOne(() => FileUpload, (fileUpload) => fileUpload.rewardDocMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "doc_id" })
  document?: Relation<FileUpload>;

  constructor(rewardId?: number, documentId?: number) {
    this.rewardId = rewardId;
    this.documentId = documentId;
  }
}
