import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("external_hr_location_map")
export class ExternalHrLocationMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", nullable: true, type: "int" })
  userId?: number;

  @Column({ name: "hr_management_id", nullable: true, type: "int" })
  hrManagementId?: number;

  @Column({ name: "address_id" })
  addressId: number;

  @Column({ name: "company_id" })
  companyId: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
