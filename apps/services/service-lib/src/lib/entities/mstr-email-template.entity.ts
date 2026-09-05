import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';

@Entity('mstr_email_template')
export class MstrEmailTemplate {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
    name: string;

    @Column({ name: 'type', type: 'varchar', length: 100, nullable: false })
    type: string;

    @Column({ name: 'subject', type: 'varchar', length: 255, nullable: false })
    subject: string;

    @Column({ name: 'body', type: 'text', nullable: false })
    body: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt: Date;

    @Column({ name: 'created_by', type: 'integer', nullable: false, default: 0 })
    createdBy: number;

    @Column({ name: 'updated_by', type: 'integer', nullable: false, default: 0 })
    updatedBy: number;
}