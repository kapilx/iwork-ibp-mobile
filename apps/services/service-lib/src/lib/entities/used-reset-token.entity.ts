import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('used_reset_tokens')
@Index('IDX_USED_RESET_TOKENS_USER_ID', ['userId'])
export class UsedResetToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500, unique: true })
    token: string;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @CreateDateColumn({ name: 'used_at', type: 'timestamp' })
    usedAt: Date;

    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    ipAddress: string;
}
