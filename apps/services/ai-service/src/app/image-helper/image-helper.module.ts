import { Module } from '@nestjs/common';
import { ImageHelperService } from './image-helper.service';
import { OpenAiModule } from '../open-ai/open-ai.module';
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';

@Module({
  imports: [OpenAiModule, InsuranceWellnessHubServiceLibModule],
  providers: [ImageHelperService],
  exports: [ImageHelperService],
})
export class ImageHelperModule {}