import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationFailureAudit } from '../entities/authentication-audit-log.entity';
import { AccountLockState } from '../entities/user-account-security-status.entity';
import { User } from '../entities/user';
import { AuthProtectionService } from './auth-protection.service';
import { AuthProtectionRepository } from './auth-protection.repository';
import { AuthProtectionInterceptor } from './auth-protection.interceptor';
import { FeatureFlagService } from '../config/feature-flag.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthenticationFailureAudit,
      AccountLockState,
      User,
    ]),
    JwtModule.register({}),
  ],
  providers: [
    FeatureFlagService,
    AuthProtectionRepository,
    AuthProtectionService,
    AuthProtectionInterceptor,
  ],
  exports: [
    AuthProtectionService,
    AuthProtectionInterceptor,
  ],
})
export class AuthProtectionModule { }

