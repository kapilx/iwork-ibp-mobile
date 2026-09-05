import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from './notification/notification.module';
import { TemplateModule } from './template/template.module';
import { typeOrmConfig } from '../../../service-lib/src/lib/database/typeorm.config';
import { InsuranceWellnessHubServiceLibModule } from '../../../service-lib/src/lib/service-lib.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceRegistrationService } from '../../../service-lib/src/lib/service-communication';
import { ENV } from  '../../../service-lib/src/lib/environment';
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    InsuranceWellnessHubServiceLibModule,
    NotificationModule,
    TemplateModule,
  ],
  controllers: [AppController],
  providers: [AppService, ServiceRegistrationService],
})
export class AppModule {
  constructor(private readonly serviceRegistrationService: ServiceRegistrationService){}
  async onModuleInit() {
    const serviceInfo = {
          name: 'notification-service',
          url: `${ENV.URL_NOTIFICATION_SERVICE}`,
          port: ENV.PORT_NOTIFICATION_SERVICE,
          healthCheck: '/api/health',
          status: 'active'
        };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}
