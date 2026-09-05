import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import {
  ClaimActivityDocumentMap,
  ClaimActivityMap,
  ClaimAssessmentReport,
  ClaimCustomerAgreement,
  ClaimDischargeVoucher,
  ClaimDocumentsCollected,
  ClaimDocumentSubmissionTracker,
  ClaimFnolDetails,
  ClaimInformed,
  ClaimJointInspectionReport,
  ClaimLorDetails,
  ClaimLossAdjusterDetails,
  ClaimPayment,
  ClaimSurveyCompleted,
  ClaimValidationReport,
  ClaimVoucherToInsurer,
  FileUpload,
  LookUp,
  MstrClaimStageActivityTemplate,
  Policy,
  PolicyClaim,
  PolicyClaimSettlement,
} from "../../../../service-lib/src/lib/entities";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { NonGroupClaimController } from "./non-group-claim.controller";
import { NonGroupClaimRepository } from "./non-group-claim.repository";
import { NonGroupClaimService } from "./non-group-claim.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PolicyClaim,
      ClaimActivityMap,
      ClaimActivityDocumentMap,
      ClaimInformed,
      ClaimFnolDetails,
      ClaimLossAdjusterDetails,
      ClaimSurveyCompleted,
      ClaimDocumentsCollected,
      ClaimJointInspectionReport,
      ClaimLorDetails,
      ClaimDocumentSubmissionTracker,
      ClaimAssessmentReport,
      ClaimValidationReport,
      PolicyClaimSettlement,
      ClaimDischargeVoucher,
      ClaimCustomerAgreement,
      ClaimVoucherToInsurer,
      ClaimPayment,
      FileUpload,
      LookUp,
      Policy,
      MstrClaimStageActivityTemplate,
    ]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [NonGroupClaimController],
  providers: [
    NonGroupClaimService,
    NonGroupClaimRepository,
    EntityService,
    LookUpValidationService,
    ScopeService,
  ],
  exports: [NonGroupClaimService, NonGroupClaimRepository],
})
export class NonGroupClaimModule {}
