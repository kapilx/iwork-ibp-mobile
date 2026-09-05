import { Module, OnModuleInit } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeOrmConfig } from "../../../service-lib/src/lib/database/typeorm.config";
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { OpportunityModule } from "./opportunity/opportunity.module";
import { MeetingModule } from "./meeting/meeting.module";
import { ENV } from "../../../service-lib/src/lib/environment";
import { TaskModule } from "./task/task.module";
import { NoteModule } from "./note/note.module";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    OpportunityModule,
    InsuranceWellnessHubServiceLibModule,
    MeetingModule,
    TaskModule,
    NoteModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, ServiceRegistrationService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly serviceRegistrationService: ServiceRegistrationService
  ) {}
  async onModuleInit() {
    const serviceInfo = {
      name: "opportunity-service",
      url: `${ENV.URL_OPPORTUNITY_SERVICE}`,
      port: ENV.PORT_OPPORTUNITY_SERVICE,
      healthCheck: "/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
