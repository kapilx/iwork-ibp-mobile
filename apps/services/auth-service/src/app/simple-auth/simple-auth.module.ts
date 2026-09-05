import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SimpleAuthService } from "./simple-auth.service";
import { SimpleAuthController } from "./simple-auth.controller";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { UserRole } from "../../../../service-lib/src/lib/entities/user-role.entity";
import { Role } from "../../../../service-lib/src/lib/entities/roles.entity";

import { PolicyEnrollmentEmployee } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity";
import { ConfigCompany } from "../../../../service-lib/src/lib/entities/config-company.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { CompanyPortalConfigScope } from "../../../../service-lib/src/lib/entities/company-portal-config-scope.entity";
import { PolicyEmployeeEnrollment } from "../../../../service-lib/src/lib/entities/policy-employee-enrollment.entity";
import { UserRepository } from "./simple-auth.repository";
import { IbpEmployeeAuthRepository } from "../ibp-employee-auth/ibp-employee-auth.repository";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import {CaptchaConfig, CaptchaModule,  CaptchaProvider } from '@divami-labs/nestjs-captcha';
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { CaptchaProviders } from "../../../../service-lib/src/lib/constants";
import { AuthVersionService } from "../../../../service-lib/src/lib/auth-version/auth-version.service";
import { HrUserManagement } from "../../../../service-lib/src/lib/entities/hr-user-management.entity";
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, Role, PolicyEnrollmentEmployee, ConfigCompany, HrUserManagement, Company, CompanyPortalConfigScope, PolicyEmployeeEnrollment]),
    InsuranceWellnessHubServiceLibModule,
    CaptchaModule.registerAsync({
    useFactory: () => {
      const captchaEnabled = process.env.ENABLE_CAPTCHA === 'true';
      
      if (captchaEnabled) {
        // Validate captcha configuration when enabled
        if (!process.env.CAPTCHA_PROVIDER) {
          throw new Error(errorMessages.providerMissing);
        }
        if (!process.env.CAPTCHA_SECRET_KEY) {
          throw new Error(errorMessages.secretKeyMissing);
        }
        
        if (!CaptchaProviders.includes(process.env.CAPTCHA_PROVIDER)) {
          throw new Error(errorMessages.invalidProvider(CaptchaProviders.join(', ')));
        }
      }
      
      return {
        provider: process.env.CAPTCHA_PROVIDER as CaptchaProvider,
        secretKey: process.env.CAPTCHA_SECRET_KEY || '',
        minimumScore: parseFloat(process.env.CAPTCHA_MINIMUM_SCORE || '0.5'),
        enabled: captchaEnabled as CaptchaConfig['enabled'],
      };
    },
  }),
  ],
  controllers: [SimpleAuthController],
  providers: [SimpleAuthService, UserRepository, IbpEmployeeAuthRepository, AuthVersionService],
  exports: [UserRepository],
})
export class SimpleAuthModule {}
