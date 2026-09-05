import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { FileUpload } from './file-upload.entity';
import { User } from './user';
import type { Relation } from 'typeorm';

@Entity('policy_feature_document_map')
@Index(['policyId', 'status'])
@Index(['policyId', 'createdAt'])
export class PolicyFeatureDocument {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'policy_id', type: 'int', nullable: false })
    @Index()
    policyId: number;

    @Column({ name: 'document_id', type: 'int', nullable: false })
    documentId: number;

    @Column({ name: 'document_type', type: 'varchar', length: 100, nullable: false })
    documentType: string;

    // @Column({ name: 'filename', type: 'varchar', length: 255, nullable: false })
    // filename: string;

    // @Column({ name: 'original_filename', type: 'varchar', length: 255, nullable: false })
    // originalFilename: string;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
        nullable: false,
    })
    @Index()
    status: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @Column({ name: 'created_by', type: 'int', nullable: false })
    createdBy: number;

    @Column({ name: 'updated_by', type: 'int', nullable: false })
    updatedBy: number;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt?: Date;

    @Column({ name: 'deleted_by', type: 'int', nullable: true })
    deletedBy?: number;

    // Relations
    @ManyToOne(() => FileUpload, (fileUpload) => fileUpload.id)
    @JoinColumn({ name: 'document_id' })
    fileUpload?: Relation<FileUpload>;

    @ManyToOne(() => User, (user) => user.userId)
    @JoinColumn({ name: 'created_by' })
    createdByUser?: Relation<User>;

    @ManyToOne(() => User, (user) => user.userId)
    @JoinColumn({ name: 'updated_by' })
    updatedByUser?: Relation<User>;
}