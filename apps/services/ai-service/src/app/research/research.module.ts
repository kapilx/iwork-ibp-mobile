import { Module } from "@nestjs/common";
import { ResearchService } from "./research.service";
import { ResearchController } from "./research.controller";
import { PerplexityModule } from "../perplexity/perplexity.module";
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';

@Module({
  imports: [PerplexityModule, InsuranceWellnessHubServiceLibModule],
  controllers: [ResearchController],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
