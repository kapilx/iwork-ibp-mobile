import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExcelController } from "./excel.controller";
import { ExcelService } from "./excel.service";
import { ExcelRepository } from "./excel.repository";
import { PolicyReportService } from "../../../../service-lib/src/lib/utils/policy-report";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { OpportunityActivityMap } from "../../../../service-lib/src/lib/entities/opportunity-activity-map.entity";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import { Address } from "../../../../service-lib/src/lib/entities/address.entity";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { OpportunityActivityParticipants } from "../../../../service-lib/src/lib/entities/opportunity-activity-participants.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { City } from "../../../../service-lib/src/lib/entities/city.entity";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { OpportunityPlacementSlipGeneration } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-generation.entity";
import { OpportunityPlacementSlipCDDetail } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-cd-detail.entity";
import { OpportunityPlacementSlipSharingDetail } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-sharing-detail.entity";
import { OpportunityPlacementSlipInsurerMap } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-insurer-map.entity";
import { OpportunityPlacementSlipTpaMap } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-tpa-map.entity";
import { CautionDepositPolicyMapping } from "../../../../service-lib/src/lib/entities/caution-deposit-policy-mapping.entity";
import { CautionDeposit } from "../../../../service-lib/src/lib/entities/caution-deposit.entity";
import { OpportunityPlacementSlipCoverDetail } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-cover-detail.entity.ts";
import { OpportunityCoverMap } from "../../../../service-lib/src/lib/entities/opportunity-cover.entity";
import { OpportunityFinalNegotiation } from "../../../../service-lib/src/lib/entities/opportunity-final-negotiation.entity";
import { Meeting } from "../../../../service-lib/src/lib/entities/meeting.entity";
import { OpportunityQuoteEntry } from "../../../../service-lib/src/lib/entities/opportunity-quote-entry.entity";
import { OrgBranch } from "../../../../service-lib/src/lib/entities/org-branch.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Task } from "../../../../service-lib/src/lib/entities/task.entity";
import { Tpa } from "../../../../service-lib/src/lib/entities/tpa.entity";
import { Organisation } from "../../../../service-lib/src/lib/entities/organisation.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Policy,
      OpportunityActivityMap,
      OpportunityActivityParticipants,
      OpportunityPlacementSlipGeneration,
      OpportunityPlacementSlipCDDetail,
      OpportunityPlacementSlipSharingDetail,
      OpportunityPlacementSlipInsurerMap,
      OpportunityPlacementSlipTpaMap,
      OpportunityFinalNegotiation,
      OpportunityQuoteEntry,
      CautionDepositPolicyMapping,
      CautionDeposit,
      OpportunityPlacementSlipCoverDetail,
      OpportunityCoverMap,
      Insurer,
      Address,
      User,
      Meeting,
      OrgBranch,
      LookUp,
      Task,
      Company,
      Opportunity,
      City,
      Tpa,
      Organisation,
    ]),
  ],
  controllers: [ExcelController],
  providers: [ExcelService, ExcelRepository, PolicyReportService],
  exports: [ExcelService, ExcelRepository],
})
export class ExcelModule {}
