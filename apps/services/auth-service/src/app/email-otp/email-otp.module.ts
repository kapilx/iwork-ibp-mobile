import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailOtpController } from './email-otp.controller';
import { EmailOtpService } from './email-otp.service';
import { IbpEmployeeAuthRepository } from '../ibp-employee-auth/ibp-employee-auth.repository';
import {
  PolicyEnrollmentEmployee,
  CompanyAuthenticationConfig,
  ConfigCompany,
  UserRole,
} from '../../../../service-lib/src/lib/entities';
import { CompanyPortalConfigScope } from '../../../../service-lib/src/lib/entities/company-portal-config-scope.entity';
import { PolicyEmployeeEnrollment } from '../../../../service-lib/src/lib/entities/policy-employee-enrollment.entity';
import { PolicyEnrollmentEmployeePolicyMap } from '../../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity';
import { HrUserManagement } from '../../../../service-lib/src/lib/entities/hr-user-management.entity';
import { Role } from '../../../../service-lib/src/lib/entities/roles.entity';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { getAccessTokenExpiry } from '../token.constants';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PolicyEnrollmentEmployee,
      UserRole,
      CompanyAuthenticationConfig,
      ConfigCompany,
      HrUserManagement,
      Role,
      CompanyPortalConfigScope,
      PolicyEmployeeEnrollment,
      PolicyEnrollmentEmployeePolicyMap,
    ]),
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: getAccessTokenExpiry() as any },
    }),
  ],
  controllers: [EmailOtpController],
  providers: [EmailOtpService, IbpEmployeeAuthRepository, TraceIdService],
  exports: [EmailOtpService],
})
export class EmailOtpModule {}
