import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceRegistrationService } from '../../../service-lib/src/lib/service-communication';
import { ENV } from  '../../../service-lib/src/lib/environment';
import { ConfigModule } from '@nestjs/config';
import { BusinessCardModule } from './business-card/business-card.module';
import { ClaimFormModule } from './claim-form/claim-form.module';
import { OpenAiModule } from './open-ai/open-ai.module';
import { ImageHelperModule } from './image-helper/image-helper.module';
import configuration from './common/config/configuration';
import { PdfAnalyserModule } from './pdf-analyser/pdf-analyser.module';
import { ResearchModule } from './research/research.module';
import { PerplexityModule } from './perplexity/perplexity.module';
import { InsuranceWellnessHubServiceLibModule } from '../../../service-lib/src/lib/service-lib.module';
import { typeOrmConfig } from "../../../service-lib/src/lib/database/typeorm.config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NudgeDataModule } from './nudge-data/nudge-data.module';
 import { CacheModule } from '../../../service-lib/src/lib/cache/cache.module';
import { PromptFavouriteModule } from './prompt-favourite/prompt-favourite.module';
import { UserFeedbackModule } from './user-feedback/user-feedback.module';


@Module({
  imports: [
     // Load environment variables
     TypeOrmModule.forRoot(typeOrmConfig),
     ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BusinessCardModule,
    ClaimFormModule,
    OpenAiModule,
    ImageHelperModule,
    PdfAnalyserModule,
    ResearchModule,
    PerplexityModule,
    InsuranceWellnessHubServiceLibModule,
    NudgeDataModule,
    CacheModule.forRoot(),
    PromptFavouriteModule,
    UserFeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService, ServiceRegistrationService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly serviceRegistrationService: ServiceRegistrationService){}
  async onModuleInit() {
    const serviceInfo = {
          name: 'ai-service',
          url: `${ENV.URL_AI_SERVICE}`,
          port: ENV.PORT_AI_SERVICE,
          healthCheck: '/health',
          status: "active",
        };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }

}
