import { ClaimFormExtraction } from "./claim-form-extraction.entity";
import { AclAction } from "./acl-actions.entity";
import { AclCategory } from "./acl-categories.entity";
import { AclCategoryActionApiMap } from "./acl-category-action-api-map.entity";
import { AclCategoryActionMap } from "./acl-category-action-map.entity";
import { Address } from "./address.entity";
import { MappingTemplateVersion } from "./mapping-template-version.entity";
import { MappingTemplateColumn } from "./mapping-template-column.entity";
import { Announcement } from "./announcement.entity";
import { ArchivedFileUpload } from "./archived-file-upload.entity";
import { AuthenticationFailureAudit } from "./authentication-audit-log.entity";
import { AccountLockState } from "./user-account-security-status.entity";
import { BrokerAddress } from "./broker-address.entity";
import { BrokerContact } from "./broker-contact.entity";
import { Broker } from "./broker.entity";
import { BusinessTarget } from "./business-target.entity";
import { PerformanceOutput } from "./performance-output.entity";
import { CautionDeposit } from "./caution-deposit.entity";
import { CautionDepositPolicyMapping } from "./caution-deposit-policy-mapping.entity";
import { CautionDepositTransaction } from "./caution-deposit-transaction.entity";
import { PolicyEnrollmentSteps } from "./policy-enrollment-steps.entity";
import { PolicyEnrollmentStepMapping } from "./policy-enrollment-step-mapping.entity";
import { ChildDetails } from "./child-details.entity";
import { City } from "./city.entity";
import { CompanyContactMap } from "./company-contact.entity";
import { CompanyZohoIntegration } from "./company-zoho-integration.entity";
import { CompanyDetail } from "./company-detail.entity";
import { CompanyDocMap } from "./company-document-map.entity";
import { StateGstDetail } from "./company-gst-detail.entity";
import { CompanyPolicyConfigurationLocation } from "./company-policy-configuration-location.entity";
import { CompanyAddress } from "./company.address.entity";
import { Company } from "./company.entity";
import { ContactAddress } from "./contact-address.entity";
import { ContactCommunicationDetails } from "./contact-communication-details.entity";
import { ContactDetails } from "./contact-details.entity";
import { ContactDocMap } from "./contact-document-map.entity";
import { Contact } from "./contact.entity";
import { Country } from "./country.entity";
import { Currency } from "./currency.entity";
import { OpportunityDataValidation } from "./data-validation.entity";
import { OrgDepartment } from "./org-department.entity";
import { OrgDesignation } from "./org-designation.entity";
import { Employee } from "./employee.entity";
import { EmployeeHierarchy } from "./employee_hierarchy.entity";
import { FileUpload } from "./file-upload.entity";
import { FilterPreference } from "./filter-preference.entity";
import { FinalNegotiationMeetingSummary } from "./final-negotiation-meeting-summary.entity";
import { FinalNegotiationParticipant } from "./final-negotiation-participants.entity";
import { GroupCompanyMap } from "./group-comapny-map.entity";
import { OpportunityHandOverMeet } from "./hand-over-meet.entity";
import { HospitalFileUploadTracking } from "./hospital-file-upload-tracking.entity";
import { MstrHospital } from "./mstr-hospital.entity";
import { MstrHospitalAddress } from "./mstr-hospital-address.entity";
import { MstrPolicyHospitalMap } from "./mstr-policy-hospital-map.entity";
import { OpportunityHeldCoverNoteDocumentMap } from "./held-cover-note-document-map.entity";
import { IndustrySegment } from "./industry-segment.entity";
import { InsurerAddress } from "./insurer-address.entity";
import { InsureContact } from "./insurer-contact.entity";
import { InsurerParticipants } from "./insurer-participation.entity";
import { Insurer } from "./insurer.entity";
import { Reward } from "./reward.entity";
import { RewardBusinessMonth } from "./reward-business-month.entity";
import { RewardDocMap } from "./reward-doc-map.entity";
import { KdmMeetingDocumentMap } from "./kdm-meeting-document-map.entity";
import { OpportunityKdmMeeting } from "./kdm-meeting.entity";
import { KnowledgeCentral } from "./knowledge-central.entity";
import { MeetingChallengesMap } from "./meeting-challenges-map.entity";
import { MeetingNextStepsMap } from "./meeting-next-steps-map.entity";
import { MeetingOutcomesMap } from "./meeting-outcomes-map.entity";
import { LocalizationCompanyRegulatoryFields } from "./localization-company-regulatory-field.entity";
import { LocalizationCountry } from "./localization-country.entity";
import { LocalizationRegulatoryFieldsCountryMap } from "./localization-regulatory-fields-country-map.entity";
import { LookUp } from "./look-up.entity";
import { MeetingDocumentMap } from "./meeting-document-map.entity";
import { MeetingParticipantMap } from "./meeting-participants.entity";
import { Meeting } from "./meeting.entity";
import { MstrActivity } from "./mstr-activity.entity";
import { MstrCoverTemplate } from "./mstr-cover-template.entity";
import { MstrCover } from "./mstr-cover.entity";
import { MstrCoverSection } from "./mstr-cover-section.entity";
import { MstrStageActivityTemplate } from "./mstr-stage-activity-template.entity";
import { MstrStage } from "./mstr-stage.entity";
import { MstrPolicyConstraint } from "./mstr-policy-constraint.entity";
import { MstrClaimStage } from "./mstr-claim-stage.entity";
import { MstrClaimActivity } from "./mstr-claim-activity.entity";
import { MstrClaimStageActivityTemplate } from "./mstr-claim-stage-activity-template.entity";
import { MstrServicePolicyTemplateField } from "./mstr-service-policy-template-field.entity";
import { MstrExtApplicationRef } from "./mstr-ext-application-ref.entity";
import { MstrEntityFieldsUtilityRef } from "./mstr-entity-fields-utility-ref.entity";
import { ServiceMaster } from "./service-master.entity";
import { OrgServiceWeightage } from "./org-service-weightage.entity";
import { TatBucket } from "./tat-bucket.entity";
import { ServiceTatScoreMap } from "./service-tat-score-map.entity";
import { OrgServiceTatSummary } from "./org-service-tat-summary.entity";
import { NoteDocumentMap } from "./note-document-map.entity";
import { Note } from "./note.entity";
import { NotificationEventParameterMapping } from "./notification-event-parameter-mapping.entity";
import { NotificationEventTemplateMapping } from "./notification-event-template-mapping.entity";
import { NotificationEventType } from "./notification-event-type.entity";
import { NotificationInApp } from "./notification-in-app.entity";
import { NotificationLog } from "./notification-log.entity";
import { NotificationTemplate } from "./notification-template.entity";
import { NotificationParameter } from "./notification_parameter.entity";
import { NotificationLogReceiverRecord } from "./notififcation-log-receiver-record.entity";
import { NotificationInfo } from "./notification-info.entity";
import { MstrEmailTemplate } from "./mstr-email-template.entity";
import { CompanyEmailTemplateMap } from "./company-email-template-map.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { OpportunityActivityParticipants } from "./opportunity-activity-participants.entity";
import { OpportunityBrokingSlipActivityDocumentMap } from "./opportunity-broking-slip-activity-document-map.entity";
import { BrokingSlipVersionCoverDetails } from "./opportunity-broking-slip-version-cover-map-details.entity";
import { BrokingSlipVersionDetails } from "./opportunity-broking-slip-version.entity";
import { OpportunityChallenges } from "./opportunity-challenges.entity";
import { OpportunityClaimExperiences } from "./opportunity-claim-experience.entity";
import { OpportunityCompetitors } from "./opportunity-competitor.entity";
import { OpportunityContactMap } from "./opportunity-contact-map.entity";
import { OpportunityCoverMap } from "./opportunity-cover.entity";
import { OpportunityDataValidationDocumentMap } from "./opportunity-data-validation-document-map.entity";
import { OpportunityDocuments } from "./opportunity-document.entity";
import { OpportunityFinalNegotiationQcrVariation } from "./opportunity-final-negotiation-qcr-variation.entity";
import { OpportunityFinalNegotiationQuoteCoverDetail } from "./opportunity-final-negotiation-quote-cover-detail.entity";
import { OpportunityFinalNegotiationQuoteDocuments } from "./opportunity-final-negotiation-quote-documents.entity";
import { OpportunityFinalNegotiationServiceLevelAgreement } from "./opportunity-final-negotiation-service-level-agreement.entity";
import { OpportunityFinalNegotiationSharingDetail } from "./opportunity-final-negotiation-sharing-detail.entity";
import { OpportunityFinalNegotiationTaxMap } from "./opportunity-final-negotiation-tax-map.entity";
import { OpportunityFinalNegotiation } from "./opportunity-final-negotiation.entity";
import { OpportunityHeldCoverNote } from "./opportunity-held-cover-note.entity";
import { OpportunityHeldCoverNoteInsurerMap } from "./opportunity-held-cover-note-insurer-details.entity";
import { OpportunityHeldCoverNoteCoverDetail } from "./opportunity-held-cover-note-cover-details.entity";
import { OpportunityHeldCoverNoteInstallments } from "./opportunity-held-cover-note-installments.entity";
import { OpportunityLost } from "./opportunity-lost.entity";
import { OpportunityMandateDetailsContactMap } from "./opportunity-mandate-details-contact-map.entity";
import { OpportunityMandateDetailsDocumentMap } from "./opportunity-mandate-details-document-map.entity";
import { OpportunityMandateDetailsEntry } from "./opportunity-mandate-details-entry.entity";
import { OpportunityPlacementSlipCDDetail } from "./opportunity-placement-slip-cd-detail.entity";
import { OpportunityPlacementSlipCoverDetail } from "./opportunity-placement-slip-cover-detail.entity";
import { OpportunityPlacementSlipGeneration } from "./opportunity-placement-slip-generation.entity";
import { OpportunityPlacementSlipInstallementDetail } from "./opportunity-placement-slip-installment-detail.entity";
import { OpportunityPlacementSlipInstallments } from "./opportunity-placement-slip-installments.entity";
import { OpportunityPlacementSlipInsurerMap } from "./opportunity-placement-slip-insurer-map.entity";
import { OpportunityPlacementSlipSharingDetail } from "./opportunity-placement-slip-sharing-detail.entity";
import { OpportunityPlacementSlipTpaMap } from "./opportunity-placement-slip-tpa-map.entity";
import { OpportunityPolicyConfirmation } from "./opportunity-policy-confirmation.entity";
import { OpportunityPolicyConfirmationInsurerMap } from "./opportunity-policy-confirmation-insurer-details.entity";
import { OpportunityPolicyConfirmationInstallments } from "./opportunity-policy-confirmation-installments.entity";
import { OpportunityPolicyDocket } from "./opportunity-policy-docket.entity";
import { OpportunityPolicyHardCopy } from "./opportunity-policy-hard-copy.entity";
import { OpportunityPolicyHardCopyInsurerMap } from "./opportunity-policy-hard-copy-insurer-details.entity";
import { OpportunityPolicyHardCopyCoverDetail } from "./opportunity-policy-hard-copy-cover-details.entity";
import { OpportunityPolicyHardCopyInstallments } from "./opportunity-policy-hard-copy-installments.entity";
import { OpportunityPremiumCoverDetail } from "./opportunity-premium-calculation-cover-details.entity";
import { OpportunityPremiumCalculation } from "./opportunity-premium-calculation.entity";
import { OpportunityPreviousMediatorDetails } from "./opportunity-previous-mediator-details.entity";
import { OpportunityPreviousPlacementDetails } from "./opportunity-previous-placement-details.entity";
import { OpportunityQuoteComparisonReportDocumentMap } from "./opportunity-quote-comparison-report-document-map.entity";
import { OpportunityQuoteComparisonReport } from "./opportunity-quote-comparison-report.entity";
import { OpportunityQuoteDocumentMap } from "./opportunity-quote-document-map.entity";
import { OpportunityQuoteCoverDetail } from "./opportunity-quote-entry-cover-detail.entity";
import { OpportunityQuoteEntryDocumentMap } from "./opportunity-quote-entry-document-map.entity";
import { OpportunityQuoteTaxMap } from "./opportunity-quote-entry-tax-map.entity";
import { OpportunityQuoteEntry } from "./opportunity-quote-entry.entity";
import { OpportunityQuote } from "./opportunity-quote.entity";
import { OpportunityRfpActivityDocumentMap } from "./opportunity-rfp-activity-document-map.entity";
import { OpportunityRfpClientContactDetail } from "./opportunity-rfp-client-contact-details.entity";
import { OpportunityRfpClientContactInfluencers } from "./opportunity-rfp-client-contact-influencers.entity";
import { OpportunityRfpCoverDetail } from "./opportunity-rfp-cover-detail.entity";
import { OpportunityRfpCreditSharing } from "./opportunity-rfp-credit-sharing.entity";
import { OpportunityRfpDetail } from "./opportunity-rfp-detail.entity";
import { OpportunityRfpDetailsEntryDocumentMap } from "./opportunity-rfp-details-entry-doument-map.entity";
import { OpportunityRfpDetailsEntry } from "./opportunity-rfp-details-entry.entity";
import { OpportunityRfpInsurerDetail } from "./opportunity-rfp-insurer-detail.entity";
import { OpportunityRfpTpaDetail } from "./opportunity-rfp-tpa-detail.entity";
import { OpportunityRiskLocations } from "./opportunity-risk-locations.entity";
import { Opportunity } from "./opportunity.entity";
import { OrgBranch } from "./org-branch.entity";
import { OrgSbu } from "./org-sbu.entity";
import { OrgVertical } from "./org-vertical.entity";
import { Organisation } from "./organisation.entity";
import { OpportunityPlacementSlipDocumentMap } from "./placement-slip-document-map.entity";
import { OpportunityPolicyConfirmationDocumentMap } from "./policy-confirmation-document-map.entity";
import { OpportunityPolicyDocketDocumentMap } from "./policy-docket-document-map.entity";
import { OpportunityPolicyHardCopyDocumentMap } from "./policy-hard-copy-document-map.entity";
import { PasswordHistory } from "./password-history.entity";
import { Policy } from "./policy.entity";
import { PolicyParticipantMap } from "./policy-participant-map.entity";
import { PolicyInstallments } from "./policy-installments.entity";
import { PolicyBrokerageDetails } from "./policy-brokerage-details.entity";
import { PolicyBrokeragePremiumReceipt } from "./policy-brokerage-premium-receipts.entity";
import { PolicyBrokerageCommissionStatement } from "./policy-brokerage-commission-statements.entity";
import { PolicyBrokerageInvoice } from "./policy-brokerage-invoices.entity";
import { PolicyBrokerageCollection } from "./policy-brokerage-collections.entity";
import { PreferredInsurerDetails } from "./preferred-insurer-details.entity";
import { PreferredTpaDetails } from "./preferred-tpa-details.entity";
import { OpportunityPremiumCalculationDocumentMap } from "./premium-calculation-document-map.entity";
import { ProfessionalExperience } from "./professional-experience.entity";
import { QualificationExperience } from "./qualification-experience.entity";
import { RaiseTicket } from "./raise-ticket.entity";
import { Region } from "./region.entity";
import { RoleAclCategoryActionMap } from "./role-acl-category-action-map.entity";
import { Role } from "./roles.entity";
import { State } from "./state.entity";
import { TaskDocumentMap } from "./task-document-map.entity";
import { Task } from "./task.entity";
import { TpaAddress } from "./tpa-address.entity";
import { TpaContact } from "./tpa-contact.entity";
import { Tpa } from "./tpa.entity";
import { User } from "./user";
import { HrUserManagement } from "./hr-user-management.entity";
import { UsedResetToken } from "./used-reset-token.entity";
import { UserRole } from "./user-role.entity";
import { PolicyCdNumberMap } from "./policy-cd-number-map.entity";
import { PolicyInsurerMap } from "./policy-insurer-map.entity";
import { PolicyTpaMap } from "./policy-tpa-map.entity";
import { PolicyCoverMap } from "./policy-covers-map.entity";
import { PolicyRiskLocationMap } from "./policy-risk-location-map.entity";
import { PolicyPremiumInstallmentSchedule } from "./policy-premium-installment-schedules.entity";
import { PolicyConfiguration } from "./policy-configuration.entity";
import { PolicyAuditLog } from "./policy-audit-log.entity";
import { PolicyConfigurationTemplateDocMap } from "./policy-template-doc-map.entity";
import { PolicyEndorsementTemplateDocMap } from "./policy-endorsement-template-doc-map.entity";
import { PolicyEnrollmentTemplateDocMap } from "./policy-enrollment-template-doc-map.entity";
import { PolicyFaq } from "./policy-faq.entity";
import { PolicyFaqUpload } from "./policy-faq-upload.entity";
import { EndorsementFieldMapping } from "./endorsement-field-mapping.entity";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";
import { DocumentProcessingFile } from "./document-processing-file.entity";
import { PolicyEnrollmentDependent } from "./policy-enrollment-dependent.entity";
import { PolicyEnrollmentUploadSummary } from "./policy-enrollment-upload-summary.entity";
import { PolicyExtensionAudit } from "./policy-extension-audit.entity";
import { PolicyExtensionDocument } from "./policy-extension-document.entity";
import { PolicyEnrollmentEmployeePolicyMap } from "./policy-enrollment-employee-policy-map.entity";
import { EmployeeEnrollmentSubmission } from "./employee-enrollment-submission.entity";
import { PolicyClaim } from "./policy-employee-claim.entity";
import { PolicyClaimSettlement } from "./policy-employee-claim-settlement.entity";
import { PolicyClaimStatus } from "./policy-claim-status.entity";
import { PolicyClaimAudit } from "./policy-claim-audit.entity";
import { PolicyEmployeeEnrollmentChoice } from "./policy-employee-enrollment-choice.entity";
import { PolicyEmployeeEnrollmentChoiceDependent } from "./policy-employee-enrollment-choice-dependent.entity";
import { PolicyEmployeeEnrollment } from "./policy-employee-enrollment.entity";
import { AuditHistoryLog } from "./audit-history-log.entity";
import { AuditHistoryLogDetail } from "./audit-history-log-detail.entity";
import { NotificationChannelEventTemplateMapping } from "./notification-channel-event-template-mapping.entity";
import { NotificationChannelType } from "./notification-channel-type.entity";
import { NotificationTemplateApprovalHistory } from "./notification-template-approval-history.entity";
import { NotificationTemplateChangeLog } from "./notification-template-change-log.entity";
import { AdminReport } from "./admin-report.entity";
import { AdminReportParameter } from "./admin-report-parameter.entity";
import { AdminReportsResultsMappings } from "./admin-report-results-mapping.entitys";
import { PolicyComponentsConfigurationDetail } from "./policy-components-configuration-detail.entity";
import { PolicyEnrollmentParameter } from "./policy-enrollment-parameter.entity";
import { PolicyConfigurationComponentRelationMap } from "./policy-configuration-component-relation-map.entity";
import { Endorsement } from "./endorsement.entity";
import { PolicyEmployeeEndorsement } from "./policy-employee-endorsement.entity";
import { PolicyDependentEndorsement } from "./policy-dependent-endorsement.entity";
import { PolicyTypeSegregation } from "./policy-type-segregation.entity";
import { PolicySetForRoCreation } from "./policy-set-for-ro-creation.entity";
import { PolicyAsset } from "./policy-asset.entity";
import { PolicySubAsset } from "./policy-sub-asset.entity";
import { PolicySubAssetEndorsementMap } from "./policy-sub-asset-endorsement-map.entity";
import { PolicyAssetEndorsement } from "./policy-asset-endorsement.entity";
import { PolicyAssetEndorsementMap } from "./policy-asset-endorsement-map.entity";
import { PolicyContactMetric } from "./policy-contact-metric.entity";
import { ClaimActivityMap } from "./claim-activity-map.entity";
import { ClaimActivityDocumentMap } from "./claim-activity-document-map.entity";
import { ClaimInformed } from "./claim-informed.entity";
import { ClaimFnolDetails } from "./claim-fnol-details.entity";
import { ClaimLossAdjusterDetails } from "./claim-loss-adjuster-details.entity";
import { ClaimSurveyCompleted } from "./claim-survey-completed.entity";
import { ClaimDocumentsCollected } from "./claim-documents-collected.entity";
import { ClaimJointInspectionReport } from "./claim-joint-inspection-report.entity";
import { ClaimLorDetails } from "./claim-lor-details.entity";
import { ClaimDocumentSubmissionTracker } from "./claim-document-submission-tracker.entity";
import { ClaimAssessmentReport } from "./claim-assessment-report.entity";
import { ClaimValidationReport } from "./claim-validation-report.entity";
import { ClaimSettlement } from "./claim-settlement.entity";
import { ClaimDischargeVoucher } from "./claim-discharge-voucher.entity";
import { ClaimCustomerAgreement } from "./claim-customer-agreement.entity";
import { ClaimVoucherToInsurer } from "./claim-voucher-to-insurer.entity";
import { ClaimPayment } from "./claim-payment.entity";
import { NonGroupClaim } from "./non-group-claim.entity";
import { ConfigCompany } from "./config-company.entity";
import { DatabaseConnect } from "./database-connect.entity";
import { AuthenticationMethod } from "./authentication-method.entity";
import { CompanyAuthenticationMapping } from "./company-authentication-mapping.entity";
import { CompanyAuthenticationConfig } from "./company-authentication-config.entity";
import { CompanyPortalConfigScope } from "./company-portal-config-scope.entity";
import { CompanyPortalConfigurationDetail } from "./company-portal-configuration-detail.entity";
import { PolicyFeatureDocument } from "./policy-feature-document.entity";
import { OpportunityMeetingDocumentMap } from "./opportunity-meeting-document-map.entity";
import { OpportunityMeetingParticipantMap } from "./opportunity-meeting-participant-map.entity";
import { LocalizationReportFieldsCountryMap } from "./localization-report-fields-country-map.entity";
import { LocalizationReportFields } from "./localization-report-fields.entity";
import { NudgeParameter } from "./master-nudge-parameters.entity";
import { Nudge } from "./master-nudge.entity";
import { NudgeAction } from "./master-nudge-action.entity";
import { CronJobConfiguration } from "./cron-job-configuration.entity";
import { SchedulerAuditLog } from "./scheduler-audit-log.entity";
import { ApplicationSchedulerConfiguration } from "./application-scheduler-configuration.entity";
import { PasswordProtectionConfig } from "./password-protection-config.entity";
import { NudgeScope } from "./master-nudge-scope.entity";
import { NudgeScopeRoleMapping } from "./master-nudge-scope-role-mapping.entity";
import { AiConversation } from "./ai-conversation.entity";
import { AiConversationMessage } from "./ai-conversation-message.entity";
import { AiPromptFavourite } from "./ai-prompt-favourite.entity";
import { AiUserFeedback } from "./ai-user-feedback.entity";
import { AiExtractedPolicyConfigurationRecord } from "./ai-extracted-policy-configuration-record.entity";
import { SbuRoPolicyTypeSuppression } from "./sbu-ro-policy-type-suppression.entity";
import { UserActivityLog } from "./user-activity-log.entity";
import { ExternalHrLocationMap } from "./external-hr-location-map.entity";
import { TpaClaimData } from "./tpa-claim-data.entity";
import { ExternalHrPolicyMap } from "./external-hr-policy-map.entity";
import { MstrTpaFeatureType } from "./mstr-tpa-feature-type.entity";
import { TpaExternalFeatureConfig } from "./tpa-external-feature-config.entity";
import { TpaPayloadFieldMapping } from "./tpa-payload-field-mapping.entity";
import { MstrExtAppResponseMapping } from "./mstr-ext-app-response-mapping.entity";
import { ClaimSyncJob } from "./claim-sync-job.entity";
import { RawTpaClaimResponse } from "./raw-tpa-claim-response.entity";
import { ClaimTpaSubmissionJob } from "./claim-tpa-submission-job.entity";
import { MstrTpaClaimApiConfig } from "./mstr-tpa-claim-api-config.entity";
import { SyncJob } from "./sync-job.entity";
import { RawSyncResponse } from "./raw-sync-response.entity";
import { UserBizdoneReport } from "./user-bizdone-report.entity";
import { MirReport } from "./mir-report.entity";
import { MstrMirSection } from "./mstr-mir-section.entity";
import { MirReportSection } from "./mir-report-section.entity";
import { TpaSsoConfig } from "./tpa-sso-config.entity";
import { TpaSsoFieldMapping } from "./tpa-sso-field-mapping.entity";
import { HclEmployeeIntake } from "./hcl-employee-intake.entity";
import { HclApiRequestLog } from "./hcl-api-request-log.entity";

export * from "./user-activity-log.entity";
export * from "./acl-actions.entity";
export * from "./acl-categories.entity";
export * from "./acl-category-action-api-map.entity";
export * from "./acl-category-action-map.entity";
export * from "./address.entity";
export * from "./announcement.entity";
export * from "./broker-address.entity";
export * from "./broker-contact.entity";
export * from "./broker.entity";
export * from "./business-target.entity";
export * from "./child-details.entity";
export * from "./city.entity";
export * from "./company-contact.entity";
export * from "./company-detail.entity";
export * from "./company-document-map.entity";
export * from "./company-gst-detail.entity";
export * from "./company-policy-configuration-location.entity";
export * from "./company.address.entity";
export * from "./company.entity";
export * from "./contact-address.entity";
export * from "./contact-communication-details.entity";
export * from "./contact-details.entity";
export * from "./contact-document-map.entity";
export * from "./contact.entity";
export * from "./country.entity";
export * from "./currency.entity";
export * from "./claim-activity-map.entity";
export * from "./claim-activity-document-map.entity";
export * from "./claim-informed.entity";
export * from "./claim-fnol-details.entity";
export * from "./claim-loss-adjuster-details.entity";
export * from "./claim-survey-completed.entity";
export * from "./claim-documents-collected.entity";
export * from "./claim-joint-inspection-report.entity";
export * from "./claim-lor-details.entity";
export * from "./claim-document-submission-tracker.entity";
export * from "./claim-assessment-report.entity";
export * from "./claim-validation-report.entity";
export * from "./claim-settlement.entity";
export * from "./claim-discharge-voucher.entity";
export * from "./claim-customer-agreement.entity";
export * from "./claim-voucher-to-insurer.entity";
export * from "./claim-payment.entity";
export * from "./company-portal-configuration-detail.entity";
export * from "./company-authentication-config.entity";
export * from "./data-validation.entity";
export * from "./org-department.entity";
export * from "./org-designation.entity";
export * from "./employee.entity";
export * from "./employee_hierarchy.entity";
export * from "./file-upload.entity";
export * from "./filter-preference.entity";
export * from "./final-negotiation-meeting-summary.entity";
export * from "./final-negotiation-participants.entity";
export * from "./group-comapny-map.entity";
export * from "./hand-over-meet.entity";
export * from "./hospital-file-upload-tracking.entity";
export * from "./mstr-hospital.entity";
export * from "./mstr-hospital-address.entity";
export * from "./mstr-policy-hospital-map.entity";
export * from "./held-cover-note-document-map.entity";
export * from "./industry-segment.entity";
export * from "./insurer-address.entity";
export * from "./insurer-contact.entity";
export * from "./insurer-participation.entity";
export * from "./insurer.entity";
export * from "./reward.entity";
export * from "./reward-business-month.entity";
export * from "./reward-doc-map.entity";
export * from "./kdm-meeting.entity";
export * from "./knowledge-central.entity";
export * from "./look-up.entity";
export * from "./meeting-challenges-map.entity";
export * from "./meeting-document-map.entity";
export * from "./meeting-next-steps-map.entity";
export * from "./meeting-outcomes-map.entity";
export * from "./meeting-document-map.entity";
export * from "./meeting-participants.entity";
export * from "./meeting.entity";
export * from "./mstr-activity.entity";
export * from "./mstr-cover-template.entity";
export * from "./mstr-cover.entity";
export * from "./mstr-cover-section.entity";
export * from "./mstr-stage-activity-template.entity";
export * from "./mstr-stage.entity";
export * from "./mstr-policy-constraint.entity";
export * from "./mstr-claim-stage.entity";
export * from "./mstr-claim-activity.entity";
export * from "./mstr-claim-stage-activity-template.entity";
export * from "./mstr-service-policy-template-field.entity";
export * from "./note-document-map.entity";
export * from "./note.entity";
export * from "./non-group-claim.entity";
export * from "./notification-event-parameter-mapping.entity";
export * from "./notification-event-template-mapping.entity";
export * from "./notification-event-type.entity";
export * from "./notification-in-app.entity";
export * from "./notification-log.entity";
export * from "./notification-template.entity";
export * from "./notification-template-approval-history.entity";
export * from "./notification_parameter.entity";
export * from "./notififcation-log-receiver-record.entity";
export * from "./notification-info.entity";
export * from "./notification-channel-type.entity";
export * from "./notification-channel-event-template-mapping.entity";
export * from "./notification-template-change-log.entity";
export * from "./mstr-email-template.entity";
export * from "./company-email-template-map.entity";
export * from "./opportunity-activity-map.entity";
export * from "./opportunity-activity-participants.entity";
export * from "./opportunity-broking-slip-activity-document-map.entity";
export * from "./opportunity-broking-slip-version-cover-map-details.entity";
export * from "./opportunity-broking-slip-version.entity";
export * from "./opportunity-challenges.entity";
export * from "./opportunity-claim-experience.entity";
export * from "./opportunity-competitor.entity";
export * from "./opportunity-contact-map.entity";
export * from "./opportunity-cover.entity";
export * from "./opportunity-data-validation-document-map.entity";
export * from "./opportunity-document.entity";
export * from "./opportunity-final-negotiation-qcr-variation.entity";
export * from "./opportunity-final-negotiation-quote-cover-detail.entity";
export * from "./opportunity-final-negotiation-quote-documents.entity";
export * from "./opportunity-final-negotiation-service-level-agreement.entity";
export * from "./opportunity-final-negotiation-sharing-detail.entity";
export * from "./opportunity-final-negotiation-tax-map.entity";
export * from "./opportunity-final-negotiation.entity";
export * from "./opportunity-held-cover-note.entity";
export * from "./opportunity-held-cover-note-insurer-details.entity";
export * from "./opportunity-held-cover-note-cover-details.entity";
export * from "./opportunity-held-cover-note-installments.entity";
export * from "./opportunity-lost.entity";
export * from "./opportunity-mandate-details-contact-map.entity";
export * from "./opportunity-mandate-details-document-map.entity";
export * from "./opportunity-mandate-details-entry.entity";
export * from "./opportunity-meeting-document-map.entity";
export * from "./opportunity-meeting-participant-map.entity";
export * from "./opportunity-placement-slip-cd-detail.entity";
export * from "./opportunity-placement-slip-cover-detail.entity";
export * from "./opportunity-placement-slip-generation.entity";
export * from "./opportunity-placement-slip-installment-detail.entity";
export * from "./opportunity-placement-slip-insurer-map.entity";
export * from "./opportunity-placement-slip-sharing-detail.entity";
export * from "./opportunity-placement-slip-tpa-map.entity";
export * from "./opportunity-policy-confirmation.entity";
export * from "./opportunity-policy-confirmation-insurer-details.entity";
export * from "./opportunity-policy-confirmation-installments.entity";
export * from "./opportunity-policy-docket.entity";
export * from "./opportunity-policy-hard-copy.entity";
export * from "./opportunity-policy-hard-copy-insurer-details.entity";
export * from "./opportunity-policy-hard-copy-installments.entity";
export * from "./opportunity-policy-hard-copy-cover-details.entity";
export * from "./opportunity-premium-calculation-cover-details.entity";
export * from "./opportunity-premium-calculation.entity";
export * from "./opportunity-previous-mediator-details.entity";
export * from "./opportunity-previous-placement-details.entity";
export * from "./opportunity-quote-comparison-report-document-map.entity";
export * from "./opportunity-quote-comparison-report.entity";
export * from "./opportunity-quote-entry-cover-detail.entity";
export * from "./opportunity-quote-entry-document-map.entity";
export * from "./opportunity-quote-entry.entity";
export * from "./opportunity-rfp-activity-document-map.entity";
export * from "./opportunity-rfp-client-contact-details.entity";
export * from "./opportunity-rfp-client-contact-influencers.entity";
export * from "./opportunity-rfp-cover-detail.entity";
export * from "./opportunity-rfp-credit-sharing.entity";
export * from "./opportunity-rfp-detail.entity";
export * from "./opportunity-rfp-details-entry-doument-map.entity";
export * from "./opportunity-rfp-details-entry.entity";
export * from "./opportunity-rfp-insurer-detail.entity";
export * from "./opportunity-rfp-tpa-detail.entity";
export * from "./opportunity-risk-locations.entity";
export * from "./opportunity.entity";
export * from "./org-branch.entity";
export * from "./org-sbu.entity";
export * from "./org-vertical.entity";
export * from "./organisation.entity";
export * from "./placement-slip-document-map.entity";
export * from "./policy-confirmation-document-map.entity";
export * from "./policy-docket-document-map.entity";
export * from "./policy-hard-copy-document-map.entity";
export * from "./policy-template-doc-map.entity";
export * from "./policy-endorsement-template-doc-map.entity";
export * from "./policy-enrollment-template-doc-map.entity";
export * from "./endorsement-field-mapping.entity";
export * from "./password-history.entity";
export * from "./policy.entity";
export * from "./policy-participant-map.entity";
export * from "./preferred-insurer-details.entity";
export * from "./preferred-tpa-details.entity";
export * from "./premium-calculation-document-map.entity";
export * from "./professional-experience.entity";
export * from "./qualification-experience.entity";
export * from "./raise-ticket.entity";
export * from "./region.entity";
export * from "./role-acl-category-action-map.entity";
export * from "./roles.entity";
export * from "./state.entity";
export * from "./task-document-map.entity";
export * from "./task.entity";
export * from "./tpa-address.entity";
export * from "./tpa-contact.entity";
export * from "./tpa.entity";
export * from "./user";
export * from "./used-reset-token.entity";
export * from "./user-role.entity";
export * from "./localization-company-regulatory-field.entity";
export * from "./localization-country.entity";
export * from "./localization-regulatory-fields-country-map.entity";
export * from "./opportunity-quote-document-map.entity";
export * from "./opportunity-quote-entry-document-map.entity";
export * from "./opportunity-quote-entry-tax-map.entity";
export * from "./opportunity-quote.entity";
export * from "./archived-file-upload.entity";
export * from "./authentication-audit-log.entity";
export * from "./user-account-security-status.entity";
export * from "./policy-cd-number-map.entity";
export * from "./policy-insurer-map.entity";
export * from "./policy-risk-location-map.entity";
export * from "./policy-tpa-map.entity";
export * from "./policy-covers-map.entity";
export * from "./policy-premium-installment-schedules.entity";
export * from "./policy-configuration.entity";
export * from "./policy-audit-log.entity";
export * from "./policy-enrollment-employee.entity";
export * from "./document-processing-file.entity";
export * from "./policy-enrollment-dependent.entity";
export * from "./policy-enrollment-upload-summary.entity";
export * from "./policy-extension-audit.entity";
export * from "./policy-extension-document.entity";
export * from "./policy-enrollment-employee-policy-map.entity";
export * from "./employee-enrollment-submission.entity";
export * from "./policy-employee-claim.entity";
export * from "./policy-employee-claim-settlement.entity";
export * from "./policy-claim-status.entity";
export * from "./policy-claim-audit.entity";
export * from "./policy-employee-enrollment-choice-dependent.entity";
export * from "./policy-employee-enrollment-choice.entity";
export * from "./policy-employee-enrollment.entity";
export * from "./audit-history-log.entity";
export * from "./audit-history-log-detail.entity";
export * from "./admin-report.entity";
export * from "./admin-report-parameter.entity";
export * from "./admin-report-results-mapping.entitys";
export * from "./policy-components-configuration-detail.entity";
export * from "./policy-configuration-component-relation-map.entity";
export * from "./policy-endorsement-template-doc-map.entity";
export * from "./endorsement-field-mapping.entity";
export * from "./endorsement.entity";
export * from "./performance-output.entity";
export * from "./caution-deposit.entity";
export * from "./caution-deposit-transaction.entity";
export * from "./caution-deposit-policy-mapping.entity";
export * from "./policy-employee-endorsement.entity";
export * from "./policy-type-segregation.entity";
export * from "./policy-set-for-ro-creation.entity";
export * from "./policy-enrollment-steps.entity";
export * from "./policy-enrollment-step-mapping.entity";
export * from "./service-master.entity";
export * from "./org-service-weightage.entity";
export * from "./tat-bucket.entity";
export * from "./service-tat-score-map.entity";
export * from "./org-service-tat-summary.entity";

export * from "./policy-asset.entity";
export * from "./policy-sub-asset.entity";
export * from "./policy-sub-asset-endorsement-map.entity";
export * from "./policy-asset-endorsement.entity";
export * from "./policy-asset-endorsement-map.entity";

export * from "./policy-faq.entity";
export * from "./policy-faq-upload.entity";
export * from "./config-company.entity";
export * from "./database-connect.entity";
export * from "./authentication-method.entity";
export * from "./company-authentication-mapping.entity";

export * from "./policy-feature-document.entity";
export * from "./policy-contact-metric.entity";
export * from "./policy-installments.entity";
export * from "./policy-brokerage-details.entity";
export * from "./policy-brokerage-premium-receipts.entity";
export * from "./policy-brokerage-commission-statements.entity";
export * from "./policy-brokerage-invoices.entity";
export * from "./policy-brokerage-collections.entity";

export * from "./localization-report-fields-country-map.entity";
export * from "./localization-report-fields.entity";

export * from "./master-nudge-action.entity";
export * from "./master-nudge-parameters.entity";
export * from "./master-nudge-scope-role-mapping.entity";
export * from "./master-nudge-scope.entity";
export * from "./master-nudge.entity";
export * from "./ai-conversation.entity";
export * from "./ai-conversation-message.entity";
export * from "./ai-prompt-favourite.entity";
export * from "./ai-user-feedback.entity";
export * from "./ai-extracted-policy-configuration-record.entity";
export * from "./cron-job-configuration.entity";
export * from "./password-protection-config.entity";
export * from "./mapping-template-version.entity";
export * from "./mstr-entity-fields-utility-ref.entity";
export * from "./scheduler-audit-log.entity";
export * from "./application-scheduler-configuration.entity";
export * from "./mapping-template-version.entity";
export * from "./mstr-entity-fields-utility-ref.entity";
export * from "./policy-dependent-endorsement.entity";
export * from "./hr-user-management.entity";
export * from "./policy-enrollment-parameter.entity";
export * from "./sbu-ro-policy-type-suppression.entity";
export * from "./tpa-claim-data.entity";
export * from "./external-hr-location-map.entity";
export * from "./external-hr-policy-map.entity";
export * from "./claim-form-extraction.entity";
export * from "./company-zoho-integration.entity";
export * from "./mstr-tpa-feature-type.entity";
export * from "./tpa-external-feature-config.entity";
export * from "./tpa-payload-field-mapping.entity";
export * from "./mstr-ext-app-response-mapping.entity";
export * from "./claim-sync-job.entity";
export * from "./raw-tpa-claim-response.entity";
export * from "./claim-tpa-submission-job.entity";
export * from "./mstr-tpa-claim-api-config.entity";
export * from "./sync-job.entity";
export * from "./user-bizdone-report.entity";
export * from "./raw-sync-response.entity";
export * from "./mstr-ext-application-ref.entity";
export * from "./mir-report.entity";
export * from "./mstr-mir-section.entity";
export * from "./mir-report-section.entity";
export * from "./tpa-sso-config.entity";
export * from "./tpa-sso-field-mapping.entity";
export * from "./company-portal-config-scope.entity";
export * from "./hcl-employee-intake.entity";
export * from "./hcl-api-request-log.entity";


export const entities = [
  Announcement,
  OpportunityFinalNegotiationQuoteDocuments,
  OpportunityFinalNegotiationQuoteCoverDetail,
  UserActivityLog,
  User,
  HrUserManagement,
  UsedResetToken,
  LookUp,
  Organisation,
  OrgDesignation,
  IndustrySegment,
  OrgSbu,
  OrgVertical,
  OrgBranch,
  OrgDepartment,
  Contact,
  Address,
  Region,
  Country,
  City,
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
  ClaimSettlement,
  ClaimDischargeVoucher,
  ClaimCustomerAgreement,
  ClaimVoucherToInsurer,
  ClaimPayment,
  State,
  Tpa,
  TpaAddress,
  TpaContact,
  ContactAddress,
  CompanyContactMap,
  CompanyZohoIntegration,
  Insurer,
  Reward,
  RewardBusinessMonth,
  RewardDocMap,
  InsurerAddress,
  InsureContact,
  Employee,
  Company,
  PasswordHistory,
  Policy,
  PolicyInstallments,
  PolicyBrokerageDetails,
  PolicyBrokeragePremiumReceipt,
  PolicyBrokerageCommissionStatement,
  PolicyBrokerageInvoice,
  PolicyBrokerageCollection,
  PolicyParticipantMap,
  ServiceMaster,
  OrgServiceWeightage,
  TatBucket,
  ServiceTatScoreMap,
  OrgServiceTatSummary,
  CompanyAddress,
  CompanyPolicyConfigurationLocation,
  CompanyDetail,
  ContactDetails,
  QualificationExperience,
  ProfessionalExperience,
  UserRole,
  Role,
  RoleAclCategoryActionMap,
  AclCategory,
  AclAction,
  AclCategoryActionMap,
  StateGstDetail,
  FileUpload,
  FilterPreference,
  CompanyDocMap,
  GroupCompanyMap,
  HospitalFileUploadTracking,
  MstrHospital,
  MstrHospitalAddress,
  MstrPolicyHospitalMap,
  ContactDocMap,
  ContactCommunicationDetails,
  Broker,
  BrokerAddress,
  BusinessTarget,
  CautionDeposit,
  CautionDepositPolicyMapping,
  CautionDepositTransaction,
  PolicyEnrollmentSteps,
  PolicyEnrollmentStepMapping,
  Opportunity,
  OpportunityDocuments,
  OpportunityRiskLocations,
  OpportunityChallenges,
  OpportunityCompetitors,
  OpportunityClaimExperiences,
  BrokerContact,
  ChildDetails,
  Currency,
  OpportunityPreviousPlacementDetails,
  OpportunityPreviousMediatorDetails,
  OpportunityContactMap,
  OpportunityLost,
  OpportunityMeetingDocumentMap,
  OpportunityMeetingParticipantMap,
  MstrCover,
  MstrCoverTemplate,
  MstrCoverSection,
  OpportunityCoverMap,
  FinalNegotiationMeetingSummary,
  InsurerParticipants,
  OpportunityQuote,
  MstrActivity,
  MstrStage,
  MstrStageActivityTemplate,
  MstrPolicyConstraint,
  MstrClaimStage,
  MstrClaimActivity,
  MstrClaimStageActivityTemplate,
  MstrServicePolicyTemplateField,
  OpportunityActivityMap,
  OpportunityActivityParticipants,
  Meeting,
  MeetingChallengesMap,
  MeetingOutcomesMap,
  MeetingNextStepsMap,
  Task,
  TaskDocumentMap,
  MeetingParticipantMap,
  Note,
  NoteDocumentMap,
  NonGroupClaim,
  MeetingDocumentMap,
  FinalNegotiationParticipant,
  OpportunityDataValidation,
  KdmMeetingDocumentMap,
  OpportunityKdmMeeting,
  OpportunityPremiumCalculation,
  OpportunityMandateDetailsDocumentMap,
  OpportunityMandateDetailsEntry,
  OpportunityMandateDetailsContactMap,
  OpportunityRfpCoverDetail,
  OpportunityPremiumCalculationDocumentMap,
  OpportunityHeldCoverNote,
  OpportunityHeldCoverNoteInsurerMap,
  OpportunityHeldCoverNoteCoverDetail,
  OpportunityHeldCoverNoteInstallments,
  OpportunityHeldCoverNoteDocumentMap,
  OpportunityDataValidationDocumentMap,
  OpportunityRfpDetail,
  OpportunityRfpActivityDocumentMap,
  OpportunityPolicyConfirmation,
  OpportunityPolicyConfirmationInsurerMap,
  OpportunityPolicyConfirmationInstallments,
  OpportunityPolicyConfirmationDocumentMap,
  OpportunityPolicyHardCopy,
  OpportunityPolicyHardCopyInsurerMap,
  OpportunityPolicyHardCopyCoverDetail,
  OpportunityPolicyHardCopyInstallments,
  OpportunityPolicyHardCopyDocumentMap,
  KnowledgeCentral,
  OpportunityQuoteEntry,
  OpportunityQuoteEntryDocumentMap,
  OpportunityPolicyDocket,
  OpportunityPolicyDocketDocumentMap,
  OpportunityPlacementSlipGeneration,
  OpportunityPlacementSlipTpaMap,
  OpportunityPlacementSlipInsurerMap,
  OpportunityPlacementSlipSharingDetail,
  OpportunityPlacementSlipCDDetail,
  OpportunityPlacementSlipCoverDetail,
  OpportunityPlacementSlipDocumentMap,
  OpportunityPlacementSlipInstallementDetail,
  OpportunityPlacementSlipInstallments,
  PreferredTpaDetails,
  PreferredInsurerDetails,
  BrokingSlipVersionDetails,
  BrokingSlipVersionCoverDetails,
  OpportunityQuoteCoverDetail,
  OpportunityQuoteTaxMap,
  OpportunityQuoteDocumentMap,
  OpportunityHandOverMeet,
  AclCategoryActionApiMap,
  EmployeeHierarchy,
  OpportunityRfpDetailsEntry,
  OpportunityRfpTpaDetail,
  OpportunityRfpInsurerDetail,
  OpportunityRfpClientContactDetail,
  OpportunityRfpClientContactInfluencers,
  OpportunityRfpCreditSharing,
  OpportunityRfpDetailsEntryDocumentMap,
  OpportunityFinalNegotiation,
  OpportunityFinalNegotiationSharingDetail,
  OpportunityFinalNegotiationQcrVariation,
  OpportunityFinalNegotiationServiceLevelAgreement,
  OpportunityFinalNegotiationTaxMap,
  NotificationEventType,
  NotificationChannelType,
  NotificationChannelEventTemplateMapping,
  NotificationTemplate,
  NotificationTemplateApprovalHistory,
  NotificationTemplateChangeLog,
  NotificationEventParameterMapping,
  NotificationParameter,
  NotificationEventTemplateMapping,
  NotificationLog,
  NotificationInApp,
  NotificationLogReceiverRecord,
  NotificationInfo,
  MstrEmailTemplate,
  CompanyEmailTemplateMap,
  OpportunityPremiumCoverDetail,
  OpportunityBrokingSlipActivityDocumentMap,
  OpportunityQuoteComparisonReport,
  OpportunityQuoteComparisonReportDocumentMap,
  LocalizationCompanyRegulatoryFields,
  LocalizationCountry,
  LocalizationRegulatoryFieldsCountryMap,
  ArchivedFileUpload,
  AuthenticationFailureAudit,
  AccountLockState,
  PolicyCdNumberMap,
  PolicyCoverMap,
  PolicyInsurerMap,
  PolicyTpaMap,
  PolicyRiskLocationMap,
  PolicyConfigurationTemplateDocMap,
  PolicyPremiumInstallmentSchedule,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
  EmployeeEnrollmentSubmission,
  DocumentProcessingFile,
  PolicyEnrollmentDependent,
  PolicyEnrollmentUploadSummary,
  PolicyExtensionAudit,
  PolicyExtensionDocument,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyClaim,
  PolicyClaimSettlement,
  PolicyClaimStatus,
  PolicyClaimAudit,
  PolicyEmployeeEnrollmentChoice,
  PolicyEmployeeEnrollmentChoiceDependent,
  PolicyEmployeeEnrollment,
  PolicyConfiguration,
  PolicyAuditLog,
  AuditHistoryLog,
  AuditHistoryLogDetail,
  AdminReport,
  AdminReportParameter,
  AdminReportsResultsMappings,
  PerformanceOutput,
  PolicyComponentsConfigurationDetail,
  PolicyEnrollmentParameter,
  PolicyConfigurationComponentRelationMap,
  PolicyEnrollmentTemplateDocMap,
  PolicyEndorsementTemplateDocMap,
  PolicyFaq,
  PolicyFaqUpload,
  EndorsementFieldMapping,
  Endorsement,
  PolicyEmployeeEndorsement,
  PolicyDependentEndorsement,
  PolicyTypeSegregation,
  PolicySetForRoCreation,
  PolicyAsset,
  PolicySubAsset,
  PolicySubAssetEndorsementMap,
  PolicyAssetEndorsement,
  PolicyAssetEndorsementMap,
  ConfigCompany,
  DatabaseConnect,
  AuthenticationMethod,
  CompanyAuthenticationMapping,
  CompanyAuthenticationConfig,
  CompanyPortalConfigScope,
  CompanyPortalConfigurationDetail,
  PolicyContactMetric,
  PolicyFeatureDocument,
  LocalizationReportFieldsCountryMap,
  LocalizationReportFields,
  NudgeParameter,
  Nudge,
  NudgeAction,
  NudgeScope,
  NudgeScopeRoleMapping,
  AiConversation,
  AiConversationMessage,
  AiPromptFavourite,
  AiUserFeedback,
  AiExtractedPolicyConfigurationRecord,
  MstrExtApplicationRef,
  MstrEntityFieldsUtilityRef,
  MappingTemplateVersion,
  MappingTemplateColumn,
  CronJobConfiguration,
  SchedulerAuditLog,
  ApplicationSchedulerConfiguration,
  PasswordProtectionConfig,
  RaiseTicket,
  SbuRoPolicyTypeSuppression,
  ExternalHrLocationMap,
  TpaClaimData,
  ExternalHrPolicyMap,
  ClaimFormExtraction,
  MstrTpaFeatureType,
  TpaExternalFeatureConfig,
  TpaPayloadFieldMapping,
  MstrExtAppResponseMapping,
  ClaimSyncJob,
  RawTpaClaimResponse,
  ClaimTpaSubmissionJob,
  MstrTpaClaimApiConfig,
  SyncJob,
  RawSyncResponse,
  UserBizdoneReport,
  MirReport,
  MstrMirSection,
  MirReportSection,
  TpaSsoConfig,
  TpaSsoFieldMapping,
  HclEmployeeIntake,
  HclApiRequestLog,
];
