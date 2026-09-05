import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationSchedulerConfiguration } from "../../../../service-lib/src/lib/entities/application-scheduler-configuration.entity";
import { SchedulerAuditLog } from "../../../../service-lib/src/lib/entities/scheduler-audit-log.entity";
import { CronConfigurationController } from "./cron-configuration.controller";
import { CronConfigurationService } from "./cron-configuration.service";
import { CronConfigurationRepository } from "./cron-configuration.repository";
import { DynamicCronService } from "./dynamic-cron.service";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationSchedulerConfiguration,
      SchedulerAuditLog,
    ]),
  ],
  controllers: [CronConfigurationController],
  providers: [
    CronConfigurationService,
    CronConfigurationRepository,
    DynamicCronService,
    EntityService,
  ],
  exports: [DynamicCronService, CronConfigurationService],
})
export class CronConfigurationModule {}
