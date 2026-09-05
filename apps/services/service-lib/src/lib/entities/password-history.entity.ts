import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('password_history')
@Index('IDX_PASSWORD_HISTORY_USER_CREATED', ['userId', 'createdAt'])
export class PasswordHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
