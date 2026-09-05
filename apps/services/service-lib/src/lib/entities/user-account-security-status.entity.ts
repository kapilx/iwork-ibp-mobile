import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * User Account Security Status Entity
 * 
 * Tracks account security status including failed login attempts and lockout state.
 * Mutable - updated with each authentication attempt.
 * 
 * Purpose:
 * - Prevent brute force attacks
 * - Track failed login attempts
 * - Manage temporary account lockouts
 * - Automatic unlock after timeout
 * 
 * Lifecycle:
 * 1. Created on first failed login (if tracking enabled)
 * 2. Incremented on subsequent failures
 * 3. Locked when threshold exceeded
 * 4. Reset to 0 on successful login
 * 5. Auto-unlocked when lockedUntil expires
 */
@Entity('user_account_security_status')
@Index(['userId'], { unique: true })
@Index(['lockedUntil'])
export class AccountLockState {
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * User ID - unique per user
   * Only one lock state record per user
   */
  @Column({ name: 'user_id', type: 'int', unique: true })
  userId!: number;

  /**
   * Count of consecutive failed login attempts
   * Reset to 0 on successful login
   */
  @Column({ name: 'failed_attempt_count', type: 'int', default: 0 })
  failedAttemptCount!: number;

  /**
   * Timestamp until which the account is locked
   * Null if not locked
   * Account can login again after this time expires
   */
  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil?: Date | null;

  /**
   * Timestamp of the most recent failed login attempt
   */
  @Column({ name: 'last_failure_at', type: 'timestamp', nullable: true })
  lastFailureAt?: Date | null;

  /**
   * Timestamp when this record was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /**
   * User ID who created this lock state record
   */
  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy?: number;

  /**
   * Timestamp when this record was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  /**
   * User ID who last updated this lock state record
   */
  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy?: number;
}
