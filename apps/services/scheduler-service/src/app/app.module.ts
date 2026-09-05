import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OpportunityModule } from "../../../../services/opportunity-service/src/app/opportunity/opportunity.module";
import {
  AdminReport,
  AdminReportParameter,
  AuthenticationMethod,
  ClaimSyncJob,
  Company,
  CompanyAuthenticationConfig,
  CompanyAuthenticationMapping,
  CompanyContactMap,
  ConfigCompany,
  Contact,
  ContactCommunicationDetails,
  DocumentProcessingFile,
  Endorsement,
  FileUpload,
  LookUp,
  Meeting,
  NotificationEventParameterMapping,
  Opportunity,
  OpportunityActivityMap,
  OrgServiceTatSummary,
  OrgSbu,
  Policy,
  PolicyAsset,
  PolicyAssetEndorsement,
  PolicyAssetEndorsementMap,
  PolicyClaim,
  PolicyClaimAudit,
  PolicyClaimSettlement,
  PolicyClaimStatus,
  PolicyConfiguration,
  PolicyEmployeeEndorsement,
  PolicyEmployeeEnrollment,
  PolicyEmployeeEnrollmentChoice,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentUploadSummary,
  PolicyExtensionAudit,
  PolicyInstallments,
  PolicySubAsset,
  PolicySubAssetEndorsementMap,
  PolicyTypeSegregation,
  Role,
  SbuRoPolicyTypeSuppression,
  ServiceMaster,
  ServiceTatScoreMap,
  TatBucket,
  TpaClaimData,
  User,
  UserRole,
  MstrHospital,
  MstrHospitalAddress,
  MstrPolicyHospitalMap,
  MstrExtApplicationRef,
  PolicyTpaMap,
  RawTpaClaimResponse,
  State,
} from "../../../../services/service-lib/src/lib/entities";
import { ReminderConfigService } from "../../../service-lib/src/lib/reminder-config.service";
import { CrmRecipientResolverService } from "../../../service-lib/src/lib/crm-recipient-resolver.service";
import { typeOrmConfig } from "../../../service-lib/src/lib/database/typeorm.config";
import { MappingTemplateColumn } from "../../../service-lib/src/lib/entities/mapping-template-column.entity";
import { MappingTemplateVersion } from "../../../service-lib/src/lib/entities/mapping-template-version.entity";
import { MstrEntityFieldsUtilityRef } from "../../../service-lib/src/lib/entities/mstr-entity-fields-utility-ref.entity";
import { PolicyDependentEndorsement } from "../../../service-lib/src/lib/entities/policy-dependent-endorsement.entity";
import { PolicyEnrollmentEmployeePolicyMap } from "../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity";
import { ENV } from "../../../service-lib/src/lib/environment";
import { ServiceRegistrationService as ServiceRegistration } from "../../../service-lib/src/lib/service-communication";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CronConfigurationModule } from "./cron-configuration/cron-configuration.module";
import { ReportController } from "./report/report.controller";
import { ClaimUploadScheduler } from "./scheduler/claim-upload.scheduler";
import { EndUserOnboardingScheduler } from "./scheduler/end-user-onboarding.scheduler";
import { EnrollmentUploadScheduler } from "./scheduler/enrollment-upload.scheduler";
import { InstallmentReminderRepository } from "./scheduler/installment-reminder.repository";
import { InstallmentReminderScheduler } from "./scheduler/installment-reminder.scheduler";
import { OpportunityStatusScheduler } from "./scheduler/opportunity-status.scheduler";
import { ServiceTatScheduler } from "./scheduler/service-tat.scheduler";
import { ReportService } from "./services/report.service";
import { ServiceRegistrationService } from "./services/service-registration.service";
import { ServiceTatAggregationService } from "./services/service-tat-aggregation.service";
import { PolicyReminderScheduler } from "./scheduler/policy-reminder.scheduler";
import { PolicyReminderRepository } from "./scheduler/policy-reminder.repository";
import { ExternalHospitalSyncScheduler } from "./scheduler/external-hospital-sync.scheduler";
import { TpaClaimsSyncScheduler } from "./scheduler/tpa-claims-sync.scheduler";
import { GenericTpaSyncScheduler } from "./scheduler/generic-tpa-sync.scheduler";
import { ClaimTpaSubmissionScheduler } from "./scheduler/claim-tpa-submission.scheduler";
import { MstrExtAppResponseMapping } from "../../../service-lib/src/lib/entities/mstr-ext-app-response-mapping.entity";
import { TpaExternalFeatureConfig } from "../../../service-lib/src/lib/entities/tpa-external-feature-config.entity";
import { SyncJob } from "../../../service-lib/src/lib/entities/sync-job.entity";
import { RawSyncResponse } from "../../../service-lib/src/lib/entities/raw-sync-response.entity";
import { TpaClaimsWorkerScheduler } from "./scheduler/tpa-claims-worker.scheduler";
import { TpaClaimsParserScheduler } from "./scheduler/tpa-claims-parser.scheduler";
import { PolicyMigrationScheduler } from "./scheduler/policy-migration.scheduler";
import { CompanyMigrationScheduler } from "./scheduler/company-migration.scheduler";
import { HclIntakeReconciliationScheduler } from "./scheduler/hcl-intake-reconciliation.scheduler";
import { EmployeeHierarchyRebuildScheduler } from "./scheduler/employee-hierarchy-rebuild.scheduler";

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([
      Opportunity,
      LookUp,
      User,
      Policy,
      NotificationEventParameterMapping,
      OpportunityActivityMap,
      DocumentProcessingFile,
      FileUpload,
      PolicyEnrollmentEmployee,
      PolicyEnrollmentDependent,
      PolicyEnrollmentUploadSummary,
      Role,
      UserRole,
      PolicyEnrollmentEmployeePolicyMap,
      PolicyConfiguration,
      AdminReport,
      AdminReportParameter,
      AuthenticationMethod,
      CompanyAuthenticationConfig,
      CompanyAuthenticationMapping,
      ConfigCompany,
      LookUp,
      OrgServiceTatSummary,
      PolicyEnrollmentEmployee,
      PolicyEnrollmentDependent,
      PolicyEnrollmentUploadSummary,
      PolicyExtensionAudit,
      Role,
      UserRole,
      PolicyEnrollmentEmployeePolicyMap,
      PolicyConfiguration,
      PolicyEmployeeEnrollment,
      PolicyEmployeeEndorsement,
      PolicyEmployeeEnrollmentChoice,
      PolicyDependentEndorsement,
      PolicyAsset,
      PolicySubAsset,
      PolicySubAssetEndorsementMap,
      PolicyAssetEndorsement,
      PolicyAssetEndorsementMap,
      Endorsement,
      Meeting,
      PolicyClaim,
      PolicyClaimSettlement,
      PolicyClaimStatus,
      PolicyClaimAudit,
      ServiceMaster,
      ServiceTatScoreMap,
      TatBucket,
      PolicyTypeSegregation,
      PolicyInstallments,
      MappingTemplateVersion,
      MappingTemplateColumn,
      MstrEntityFieldsUtilityRef,
      OrgSbu,
      SbuRoPolicyTypeSuppression,
      MstrHospital,
      MstrHospitalAddress,
      MstrPolicyHospitalMap,
      State,
      TpaClaimData,
      MstrExtAppResponseMapping,
      TpaExternalFeatureConfig,
      ClaimSyncJob,
      RawTpaClaimResponse,
      SyncJob,
      RawSyncResponse,
      MstrExtApplicationRef,
      PolicyTpaMap,
      Company,
      Contact,
      CompanyContactMap,
      ContactCommunicationDetails,
    ]),
    JwtModule.register({
      global: true,
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: ENV.JWT_EXPIRATION },
    }),
    OpportunityModule,
    InsuranceWellnessHubServiceLibModule,
    CronConfigurationModule,
  ],
  controllers: [AppController, ReportController],
  providers: [
    AppService,
    ServiceRegistrationService,
    OpportunityStatusScheduler,
    EnrollmentUploadScheduler,
    ClaimUploadScheduler,
    EndUserOnboardingScheduler,
    ReportService,
    ServiceRegistration,
    ServiceTatAggregationService,
    ServiceTatScheduler,
    InstallmentReminderScheduler,
    InstallmentReminderRepository,
    PolicyReminderScheduler,
    PolicyReminderRepository,
    ReminderConfigService,
    CrmRecipientResolverService,
    ExternalHospitalSyncScheduler,
    TpaClaimsSyncScheduler,
    GenericTpaSyncScheduler,
    ClaimTpaSubmissionScheduler,
    TpaClaimsWorkerScheduler,
    TpaClaimsParserScheduler,
    PolicyMigrationScheduler,
    CompanyMigrationScheduler,
    HclIntakeReconciliationScheduler,
    EmployeeHierarchyRebuildScheduler,
  ],
})
export class AppModule {
  constructor(
    private readonly serviceRegistrationService: ServiceRegistration
  ) {}
  async onModuleInit() {
    const serviceInfo = {
      name: "scheduler-service",
      url: `${ENV.URL_SCHEDULER_SERVICE}`,
      port: ENV.PORT_SCHEDULER_SERVICE,
      healthCheck: "/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
