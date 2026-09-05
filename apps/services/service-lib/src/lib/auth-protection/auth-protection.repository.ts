import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticationFailureAudit } from '../entities/authentication-audit-log.entity';
import { AccountLockState } from '../entities/user-account-security-status.entity';
import { User } from '../entities/user';
import { USER_STATUS_DELETED } from '../../../../../../libs/service-lib/src/lib/constants';

/**
 * Repository for authentication attempt tracking database operations
 */
@Injectable()
export class AuthProtectionRepository {
    constructor(
        @InjectRepository(AuthenticationFailureAudit)
        private readonly auditRepository: Repository<AuthenticationFailureAudit>,
        @InjectRepository(AccountLockState)
        private readonly lockStateRepository: Repository<AccountLockState>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findLockStateByUserId(userId: number): Promise<AccountLockState | null> {
        return this.lockStateRepository.findOne({
            where: { userId },
        });
    }

    async saveLockState(lockState: AccountLockState): Promise<AccountLockState> {
        return this.lockStateRepository.save(lockState);
    }

    createLockState(data: Partial<AccountLockState>): AccountLockState {
        return this.lockStateRepository.create(data);
    }

    async createAuditLog(auditData: {
        identifier: string;
        userId?: number;
        authEndpoint: string;
        sourceIp: string;
        userAgent: string;
        failureCategory: string | null;
        featureContext: string;
        createdBy?: number;
        updatedBy?: number;
    }): Promise<AuthenticationFailureAudit> {
        const audit = this.auditRepository.create(auditData);
        return this.auditRepository.save(audit);
    }

    /**
     * Finds user by username, email, or phone number
     */
    async findUserIdByIdentifier(identifier: string): Promise<number | undefined> {
        try {
            if (!identifier || identifier === 'unknown') {
                return undefined;
            }

            const userName = identifier.trim().toLowerCase();

            const user = await this.userRepository
                .createQueryBuilder('user')
                .select(['user.userId'])
                .where(
                    '(LOWER(TRIM(user.emailId)) = :loginName OR LOWER(TRIM(user.loginName)) = :loginName)',
                    { loginName: userName }
                )
                .andWhere('user.userStatusKey != :deletedStatus', {
                    deletedStatus: USER_STATUS_DELETED,
                })
                .getOne();

            return user?.userId;
        } catch (error) {
            return undefined;
        }
    }
}
