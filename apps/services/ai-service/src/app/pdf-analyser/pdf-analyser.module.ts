import { Module } from "@nestjs/common";
import { PdfAnalyserService } from "./pdf-analyser.service";
import { PdfAnalyserController } from "./pdf-analyser.controller";
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiExtractedPolicyConfigurationRecord } from "../../../../service-lib/src/lib/entities/ai-extracted-policy-configuration-record.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { PolicyConfiguration } from "../../../../service-lib/src/lib/entities/policy-configuration.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { OpportunityPlacementSlipGeneration } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-generation.entity";
import { OpportunityActivityMap } from "../../../../service-lib/src/lib/entities/opportunity-activity-map.entity";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { Organisation } from "../../../../service-lib/src/lib/entities/organisation.entity";

@Module({
  imports: [
    InsuranceWellnessHubServiceLibModule,
    TypeOrmModule.forFeature([
      AiExtractedPolicyConfigurationRecord,
      Policy,
      PolicyConfiguration,
      LookUp,
      OpportunityPlacementSlipGeneration,
      OpportunityActivityMap,
      Opportunity,
      Organisation,
    ]),
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination: "../uploads",
    //     filename: (req, file, cb) => {
    //       cb(null, `${Date.now()}-${file.originalname}`);
    //     },
    //   }),
    //   limits: {
    //     fileSize: 20 * 1024 * 1024,
    //   },
    // }),
  ],
  controllers: [PdfAnalyserController],
  providers: [PdfAnalyserService],
})
export class PdfAnalyserModule {}
