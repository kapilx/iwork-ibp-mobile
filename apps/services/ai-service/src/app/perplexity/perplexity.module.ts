import { Module } from '@nestjs/common';
import { PerplexityService } from './perplexity.service';
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';

@Module({
    imports: [InsuranceWellnessHubServiceLibModule],
    controllers: [],
    providers: [PerplexityService],
    exports: [PerplexityService],
})
export class PerplexityModule {}