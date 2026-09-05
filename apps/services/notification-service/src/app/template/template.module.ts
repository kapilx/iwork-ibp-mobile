import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { TemplateController } from "./template.controller";
import { TemplateRepository } from "./template.repository";
import { TemplateService } from "./template.service";
import { TemplateVariableService } from "./template-variable.service";
import { TemplateApprovalWorkflowService } from "./template-approval-workflow.service";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";
import { RolesGuard } from "../../../../auth-service/src/guards/role.guard";

// Import existing entities from service-lib
import {
  LookUp,
  NotificationChannelEventTemplateMapping,
  NotificationChannelType,
  NotificationEventType,
  NotificationEventParameterMapping,
  NotificationTemplateApprovalHistory,
  NotificationTemplateChangeLog,
  NotificationParameter,
  ConfigCompany,
  Company,
  Employee,
  User,
} from "../../../../service-lib";

// Import service-lib module for common services
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib";

// Import NotificationModule for NotificationService
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEventType,
      NotificationChannelType,
      NotificationChannelEventTemplateMapping,
      NotificationEventParameterMapping,
      NotificationTemplateApprovalHistory,
      NotificationTemplateChangeLog,
      NotificationParameter,
      LookUp,
      ConfigCompany,
      Company,
      Employee,
      User,
    ]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
    NotificationModule,
  ],
  controllers: [TemplateController],
  providers: [
    TemplateService,
    TemplateRepository,
    TemplateVariableService,
    TemplateApprovalWorkflowService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [
    TemplateService,
    TemplateRepository,
    TemplateVariableService,
    TemplateApprovalWorkflowService,
  ],
})
export class TemplateModule {}
