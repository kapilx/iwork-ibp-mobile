import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  Company,
  CompanyEmailTemplateMap,
  ConfigCompany,
  FileUpload,
  LookUp,
  NotificationChannelEventTemplateMapping,
  NotificationChannelType,
  NotificationEventTemplateMapping,
  NotificationEventType,
  NotificationInApp,
  NotificationInfo,
  NotificationLog,
  NotificationLogReceiverRecord,
  NotificationTemplate,
  User,
} from "../../../../service-lib/src/lib/entities";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { EmailService } from "./email.service";
import { NotificationController } from "./notification.controller";
import { NotificationRepository } from "./notification.repository";
import { NotificationService } from "./notification.service";
import { SmsService } from "./sms.service";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyEmailTemplateMap,
      ConfigCompany,
      FileUpload,
      LookUp,
      NotificationChannelEventTemplateMapping,
      NotificationChannelType,
      NotificationEventTemplateMapping,
      NotificationEventType,
      NotificationInApp,
      NotificationInfo,
      NotificationLog,
      NotificationLogReceiverRecord,
      NotificationTemplate,
      User,
    ]),
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
    NotificationRepository,
    EntityService,
  ],
  exports: [
    NotificationService,
  ],
})
export class NotificationModule {}
