import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { AuthGuard } from "../../../../../services/auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../../services/auth-service/src/guards/role.guard";
import {
  Employee,
  FilterPreference,
  HrUserManagement,
  LookUp,
  Organisation,
  ConfigCompany,
  PolicyEnrollmentEmployee,
  User,
  PasswordHistory,
  UsedResetToken,
} from "../../../../service-lib/src/lib/entities";
import { HrUserManagement } from "../../../../service-lib/src/lib/entities/hr-user-management.entity";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils//masters-validation";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { NotificationUtils } from "../../../../service-lib/src/lib/utils/notification.utils";
import { EmployeeController } from "./employee.controller";
import { EmployeeRepository } from "./employee.repository";
import { EmployeeService } from "./employee.service";
import { CaptchaConfig, CaptchaModule, CaptchaProvider } from "@divami-labs/nestjs-captcha";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { CaptchaProviders } from "../../../../service-lib/src/lib/constants";


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      FilterPreference,
      HrUserManagement,
      LookUp,
      Organisation,
      ConfigCompany,
      PolicyEnrollmentEmployee,
      User,
      PasswordHistory,
      UsedResetToken,
      HrUserManagement,
    ]),
    JwtModule.register({ secret: ENV.JWT_SECRET }),
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
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeRepository,
    EntityService,
    AuthGuard,
    RolesGuard,
    LookUpValidationService,
    MasterValidationService,
    NotificationUtils,
  ],
  exports: [EmployeeService, EmployeeRepository],
})
export class EmployeeModule { }
