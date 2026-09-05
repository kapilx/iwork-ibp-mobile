import { Module } from '@nestjs/common';
import { OpenAiService } from './open-ai.service';
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';

@Module({
  imports: [InsuranceWellnessHubServiceLibModule],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}