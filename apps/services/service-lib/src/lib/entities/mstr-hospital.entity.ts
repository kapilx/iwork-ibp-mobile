import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
  Index,
} from "typeorm";
import { Exclude } from "class-transformer";
import { MstrHospitalAddress } from "./mstr-hospital-address.entity";
import { MstrPolicyHospitalMap } from "./mstr-policy-hospital-map.entity";

/**
 * Entity representing a master hospital record.
 * This entity stores core hospital information including name, code, and address reference.
 */
@Entity("mstr_hospital")
@Index("idx_mstr_hospital_code", ["code"])
@Index("idx_mstr_hospital_name", ["name"])
@Index("idx_mstr_hospital_tpa_id", ["tpaId"])
@Index("idx_mstr_hospital_ext_id_tpa", ["externalHospitalId", "tpaId"], { unique: true, where: "external_hospital_id IS NOT NULL AND tpa_id IS NOT NULL" })
export class MstrHospital {
  /**
   * Unique identifier for the hospital.
   */
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  /**
   * Hospital name.
   */
  @Column({
    name: "name",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  name!: string;

  /**
   * Reference to the hospital address.
   */
  @Column({
    name: "address_id",
    type: "int",
    nullable: false,
  })
  addressId!: number;

  /**
   * Hospital code for identification (optional).
   */
  @Column({
    name: "code",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  code?: string;

  /**
   * HOSPITALID from external TPA API (e.g. GoodHealth). Used for daily sync
   * deduplication — if this ID already exists the record is skipped.
   * NULL for hospitals created via file upload.
   */
  @Column({
    name: "external_hospital_id",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  externalHospitalId?: string;

  /**
   * TPA (insurer) this hospital belongs to — set during API sync.
   * NULL for manually uploaded hospitals (they use mstr_policy_hospital_map instead).
   * Indexed for fast TPA-based filtering on large hospital datasets.
   */
  @Column({ name: "tpa_id", type: "int", nullable: true })
  tpaId?: number | null;

  /**
   * Origin of this hospital record:
   *   FILE_UPLOAD — inserted via admin file upload (default)
   *   API_SYNC    — synced from external TPA API
   */
  @Column({
    name: "source",
    type: "varchar",
    length: 20,
    nullable: false,
    default: "FILE_UPLOAD",
  })
  source!: string;

  /**
   * Timestamp when the hospital record was created.
   */
  @Exclude()
  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  /**
   * Identifier of the user who created the hospital record.
   */
  @Exclude()
  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy!: number;

  /**
   * Timestamp when the hospital record was last updated.
   */
  @Exclude()
  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  /**
   * Identifier of the user who last updated the hospital record.
   */
  @Exclude()
  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy!: number;

  /**
   * Timestamp when the hospital record was soft deleted.
   */
  @Exclude()
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  /**
   * Identifier of the user who soft deleted the hospital record.
   */
  @Exclude()
  @Column({ name: "deleted_by", type: "int", nullable: true })
  deletedBy?: number;

  /**
   * Address information for this hospital.
   */
  @ManyToOne(() => MstrHospitalAddress, (address) => address.hospitals, {
    eager: true,
  })
  @JoinColumn({ name: "address_id" })
  addresses!: Relation<MstrHospitalAddress>;

  /**
   * Policy hospital mappings for this hospital.
   */
  @OneToMany(
    () => MstrPolicyHospitalMap,
    (policyHospitalMap) => policyHospitalMap.hospital,
    { cascade: true }
  )
  policyMappings!: Relation<MstrPolicyHospitalMap[]>;
}