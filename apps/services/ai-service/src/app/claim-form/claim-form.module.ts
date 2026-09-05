import { Module } from '@nestjs/common';
import { ClaimFormController } from './claim-form.controller';
import { ClaimFormService } from './claim-form.service';
import { OpenAiModule } from '../open-ai/open-ai.module';
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';

@Module({
  imports: [OpenAiModule, InsuranceWellnessHubServiceLibModule],
  controllers: [ClaimFormController],
  providers: [ClaimFormService],
})
export class ClaimFormModule {}
