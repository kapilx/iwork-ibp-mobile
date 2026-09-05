import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    DeleteDateColumn
} from "typeorm";

@Entity({ name: "user_activity_log" })
export class UserActivityLog {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: number;

    @Column({ type: "bigint", name: "user_id", nullable: true })
    userId?: number | null;

    @Column({ type: "varchar", length: 50, name: "activity_key" })
    activityKey: string;

    @Column({ type: "varchar", length: 50, name: "activity_category" })
    activityCategory: string;

    @Column({ type: "timestamp", name: "action_date", default: () => "CURRENT_TIMESTAMP" })
    actionDate: Date;

    @Column({ type: "varchar", length: 100, name: "reference_id", nullable: true })
    referenceId?: string;

    @Column({ type: "varchar", length: 50, name: "reference_type", nullable: true })
    referenceType?: string;

    @Column({ type: "jsonb", name: "metadata", nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn({ type: "timestamp", name: "created_at", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @DeleteDateColumn({ type: "timestamp", name: "deleted_at", nullable: true })
    deletedAt?: Date;
}
