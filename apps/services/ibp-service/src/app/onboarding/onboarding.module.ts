import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Company,
  CompanyAuthenticationConfig,
  CompanyAuthenticationMapping,
  CompanyPortalConfigScope,
  ConfigCompany,
  PolicyComponentsConfigurationDetail,
  PolicyConfiguration,
  Policy,
  PolicyEmployeeEnrollment,
  PolicyEmployeeEnrollmentChoice,
  PolicyEmployeeEnrollmentChoiceDependent,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
  EmployeeEnrollmentSubmission,
  UserActivityLog,
  User,
  CompanyPolicyConfigurationLocation,
  LocalizationCountry,
} from "../../../../service-lib/src/lib/entities";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { UserActivityLogService } from "../../../../service-lib/src/lib/company-employee-activity-log.service";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingRepository } from "./onboarding.repository";
import { OnboardingService } from "./onboarding.service";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      CompanyAuthenticationConfig,
      CompanyAuthenticationMapping,
      Company,
      CompanyPortalConfigScope,
      ConfigCompany,
      LookUp,
      Policy,
      PolicyComponentsConfigurationDetail,
      PolicyConfiguration,
      PolicyEmployeeEnrollment,
      PolicyEmployeeEnrollmentChoice,
      PolicyEmployeeEnrollmentChoiceDependent,
      PolicyEnrollmentDependent,
      PolicyEnrollmentEmployee,
      PolicyEnrollmentEmployeePolicyMap,
      EmployeeEnrollmentSubmission,
      UserActivityLog,
      User,
      CompanyPolicyConfigurationLocation,
      LocalizationCountry,
    ]),
  ],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    OnboardingRepository,
    TraceIdService,
    UserActivityLogService,
  ],
  exports: [OnboardingService, OnboardingRepository],
})
export class OnboardingModule {}
