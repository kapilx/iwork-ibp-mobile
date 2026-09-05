import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AclGuard } from "./acl.guard";
import { AclService } from "./acl.service";
import { AuditHistoryModule } from "./audit-history";
import { AuthSessionService } from "./auth-session/auth-session.service";
import { AuthVersionService } from "./auth-version/auth-version.service";
import { UserActivityLogService } from "./company-employee-activity-log.service";
import { DynamicDatasourceModule } from "./datasource";
import {
  AclCategoryActionApiMap,
  AclCategoryActionMap,
  RoleAclCategoryActionMap,
  User,
  UserActivityLog,
  UserRole,
} from "./entities";
import { FieldEncryptionModule } from "./field-encryption";
import { HealthController } from "./health/health.controller";
import { HealthService } from "./health/health.service";
import { TraceHttpService } from "./trace-http.service";
import { TraceIdService } from "./trace-id.service";
import { NotificationUtils } from "./utils/notification.utils";
import { FieldMaskingModule } from "./field-masking";
import { FilePasswordConfigClient } from "./service-communication/file-password-config-client";
import { MigrationDataSourceService } from "./migration-datasource.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AclCategoryActionApiMap,
      AclCategoryActionMap,
      RoleAclCategoryActionMap,
      User,
      UserRole,
      UserActivityLog
    ]),
    HttpModule,
    AuditHistoryModule,
    FieldEncryptionModule,
    FieldMaskingModule,
    DynamicDatasourceModule,
  ],
  controllers: [HealthController],
  providers: [
    AclService,
    AclGuard,
    HealthService,
    TraceIdService,
    TraceHttpService,
    NotificationUtils,
    TraceHttpService,  
    UserActivityLogService,
    AuthSessionService,
    AuthVersionService,
    FilePasswordConfigClient,
    MigrationDataSourceService
  ],
  exports: [
    TypeOrmModule,
    AclService,
    AclGuard,
    TraceIdService,
    TraceHttpService,
    AuditHistoryModule,
    FieldEncryptionModule,
    FieldMaskingModule,
    DynamicDatasourceModule,
    AuthSessionService,
    AuthVersionService,
    NotificationUtils,
    UserActivityLogService,
    FilePasswordConfigClient,
    MigrationDataSourceService
  ],
})
export class InsuranceWellnessHubServiceLibModule {}
