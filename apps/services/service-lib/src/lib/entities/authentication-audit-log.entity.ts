import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Authentication Audit Log Entity
 * 
 * Immutable audit log for ALL authentication attempts (success and failure).
 * Tracks login attempts across all portals (IBP, IWORK, future UIs).
 * 
 * Purpose:
 * - Security monitoring and forensics
 * - Compliance and audit trail
 * - Attack pattern detection
 * - User behavior analysis
 */
@Entity('authentication_audit_log')
@Index(['identifier'])
@Index(['userId'])
@Index(['authEndpoint'])
@Index(['sourceIp'])
@Index(['createdAt'])
@Index(['featureContext'])
export class AuthenticationFailureAudit {
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Generic identifier used in login attempt
   * Can be username, email, employee ID, etc.
   * Nullable to support anonymous/malformed attempts
   */
  @Column({ name: 'identifier', type: 'varchar', length: 255, nullable: true })
  identifier!: string;

  /**
   * User ID if authentication succeeded or user exists
   * Null for failed attempts where user doesn't exist
   */
  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId?: number;

  /**
   * The authentication endpoint that was called
   * Examples: '/iirm/ibp-service/company-employee/login', '/iirm/auth-service/login'
   */
  @Column({ name: 'auth_endpoint', type: 'varchar', length: 255 })
  authEndpoint!: string;

  /**
   * Source IP address of the request
   */
  @Column({ name: 'source_ip', type: 'varchar', length: 45 })
  sourceIp!: string;

  /**
   * User agent string from request headers
   */
  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string;

  /**
   * Authentication result category
   * - 'SUCCESS': Successful login
   * - 'INVALID_CREDENTIALS': Wrong password
   * - 'USER_NOT_FOUND': User doesn't exist
   * - 'ACCOUNT_LOCKED': Account is locked
   * - 'ACCOUNT_DISABLED': Account is disabled
   * - 'AUTHENTICATION_FAILURE': Other failures
   */
  @Column({ name: 'failure_category', type: 'varchar', length: 50, nullable: true })
  failureCategory?: string | null;

  /**
   * Feature context identifying the portal/UI
   * Examples: 'IBP', 'IWORK', 'MOBILE_APP'
   */
  @Column({ name: 'feature_context', type: 'varchar', length: 50 })
  featureContext!: string;

  /**
   * Timestamp when the authentication attempt occurred
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /**
   * User ID who created this audit record (system user for automated entries)
   */
  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy?: number;

  /**
   * Timestamp when the record was last updated (immutable, but included for consistency)
   */
  @CreateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  /**
   * User ID who last updated this record (immutable, typically same as created_by)
   */
  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy?: number;
}
