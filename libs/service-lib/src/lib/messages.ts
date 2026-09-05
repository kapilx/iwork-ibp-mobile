//messages.ts

/**
 * Error Messages
 */
export const errorMessages = {
  unknownError: "An unknown error occurred",
  contactCreationFailed: "Contact creation failed",
  contactFetchFailed: "Contact retrieve failed",
  contactUpdationFailed: "Contact updation failed",
  contactDeletionFailed: "Contact deletion failed",
  contactQueryCreationFailed: "Contact Query creation failed",
  childQueryCreationFailed: "Child Query creation failed",
  childQueryUpdationFailed: "Error while updating child details",
  contactQueryFetchFailed: "contacts Query retrieve failed",
  contactDataNotFound: "Contact data not found",
  contactQueryUpdationFailed: "Contact Query updation failed",
  contactQueryDeletionFailed: "Contact Query deletion failed",
  contactAddressMappingCreationFailed: "Contact Address creation failed",
  companyAddressMappingCreationFailed: "Company Address creation failed",
  addressCreationFailed: "Address creation failed",
  addressFetchFailed: "Address retrieve failed",
  addressUpdationFailed: "Address updation failed",
  addressDeletionFailed: "Address deletion failed",
  addressQueryCreationFailed: "Address Query creation failed",
  addressQueryFetchFailed: "Address Query retrieve failed",
  addressQueryUpdationFailed: "Address Query updation failed",
  addressQueryDeletionFailed: "Address Query deletion failed",
  countryQueryFetchFailed: "Country Query retrieve failed",
  countryFecthFailed: "Country retrieve failed",
  stateQueryFetchFailed: "State Query retrieve failed",
  stateFecthFailed: "State retrieve failed",
  cityFetchFailed: "City retrieve failed",
  cityQueryFetchFailed: "City Query retrieve failed",
  regionFetchFailed: "Region retrieve failed",
  regionQueryFetchFailed: "Region Query retrieve failed",
  contactAddressMappingDeletionFailed: "Contact Address deletion failed",
  policyCreationFailed: "Policy creation failed",
  employeeCreationFailed: "Employee creation failed",
  companyCreationFailed: "Company creation failed",
  companyFetchFailed: "Company retrieve failed",
  errorinCompanyCreation: "Error in company creation",
  companyUpdationFailed: "Company updation failed",
  companyDeletionFailed: "Company deletion failed",
  companyQueryCreationFailed: "Company Query creation failed",
  companyQueryFetchFailed: "Company Query retrieve failed",
  companyQueryUpdationFailed: "Company Query updation failed",
  companyQueryDeletionFailed: "Company Query deletion failed",
  userNotFound: "User not found",
  companyEmployeeNotFound: "Company employee not found",
  emailIdNotEditable: "Email ID cannot be editable",
  invalidCredentials: "Invalid credentials",
  unauthorizedUser: "Unauthorized user",
  internalServerError: "Internal server error",
  failedToFindUser: "Failed to find user",
  companyNotfound: "Company not found",
  insurerNotFound: "Insurer with the specified ID not found",
  policyNotFound: "Policy not found",
  policyMustBeActiveToReconfigure:
    "This policy can be sent for reconfiguration only while it is active",
  policyExpired: "Policy enrollment period has expired",
  failedToAddInsurer: "Failed to add insurer",
  failedToModifyInsurer: "Failed to modify insurer",
  failedToDeleteInsurer: "Failed to delete insurer",
  failedToSaveAddressMapping: "Failed to save insurer-company address mapping",
  failedToSaveContactMapping: "Failed to save insurer-company contact mapping",
  failedToSaveTpaAddressMapping: "Failed to save tpa-company address mapping",
  failedToSaveBrokerAddressMapping:
    "Failed to save broker-company address mapping",
  failedToSaveBrokerContactMapping:
    "Failed to save broker-company contact mapping",
  contactNotFound: "Contact not found",
  failedToFetchInsurers: "Failed to fetch insurers",
  failedToFetchInsurer: "Failed to fetch insurer details",
  failedToAddContact: "Failed to add contact",
  failedToFetchContacts: "Failed to fetch contacts",
  failedToFetchContact: "Failed to fetch contact details",
  failedToModifyBroker: "Failed to modify broker",
  addressIdNotfound: "Address ID not found",
  companyNotFound: "Company not found",
  tpaCompanyNotFound: "Tpa company not found",
  errorInCompanyUpdate: "Error in company updation",
  companyUpdateFailed: "Company updation failed",
  companyCreationForbidden: "Company creation forbidden",
  companyUpdateForbidden: "Company updation forbidden",
  companyDeletionForbidden: "Company deletion forbidden",
  DulicateRegulatoryFields:
    "Duplicate entry: A company with the same regulatory field number already exists.",
  DulicatePanEntry:
    "Duplicate entry: A company with the same PAN card number already exists.",
  DuplicateTanEntry:
    "Duplicate entry: A company with the same TAN number already exists.",
  DuplicateGstinEntry:
    "Duplicate entry: A company with the same GSTIN number already exists.",
  contactCreationForbidden: "Contact creation forbidden",
  contactUpdateForbidden: "Contact updation forbidden",
  companyDetailsNotFound: "Company details not found",
  companyOverallAnalyticsNotFound:
    "An error occurred while fetching overall company analytics",
  companyAnalyticsNotFound:
    "An error occurred while fetching company analytics",
  companyAnalyticsRefreshForbidden: "Company analytics refresh forbidden",
  companyAnalyticsRefreshFailed: "Failed to refresh company analytics",
  companyIdInvalid: "Invalid company ID",
  contactDocumentMappingCreationFailed: "Error while creating contact document",
  companyListNotFound: "Companies list not found",
  companyContactsListNotFound: "Company contacts list not found",
  companyListRetrievalFailed: "Companies list retrieval failed",
  companyContactsRetrievalFailed: "Company contacts retrieval failed",
  insurerCompanyListNotFound: "Insurer company list not found",
  tpaCompanyListNotFound: "Tpa company list not found",
  brokerCompanyListNotFound: "Broker company list not found",
  companyContactMappingCreationFailed: "Error while creating company contact",
  companyContactMappingDeletionFailed:
    "Error while deletion of company contact",
  insurerContactMappingDeletionFailed:
    "Error while deletion of insurer company contact",
  tpaContactMappingDeletionFailed:
    "Error while deletion of tpa company contact",
  brokerContactMappingDeletionFailed:
    "Error while deletion of broker company contact",
  communicationEmailError:
    "An error occurred while checking communication email.",
  communicationPhoneError:
    "An error occurred while checking communication phone number.",
  insurerCreationForbidden: "Insurer creation forbidden",
  brokerNotFound: "Broker not found",
  brokerCreationForbidden: "Broker creation forbidden",
  brokerCreationFailed: "Broker creation failed",
  failedToAddBroker: "Failed to add broker",
  failedToFetchBrokers: "Failed to fetch brokers",
  failedToUpdateBroker: "Failed to update broker",
  failedToDeleteBroker: "Failed to delete broker",
  tpaAddressIdNotFound: "TPA address ID not found",
  tpaAddressForbidden: "TPA address deletion forbidden",
  opportunityCreationFailed: "Opportunity creation failed",
  opportunityActivityCreationFailed: "Opportunity activity creation failed",
  opportunityUpdateFailed: "Opportunity update failed",
  pendingActivitiesSummaryFailed: "Failed to fetch pending activities summary",
  opportunityDetailsRetrievalFailed: "Opportunity details retrieval failed",
  opportunityListRetrievalFailed: "Opportunity list retrieval failed",
  opportunityNotFound: "Opportunity not found",
  opportunityWithIdNotFound: (id: number) =>
    `Opportunity with ID ${id} not found`,
  opportunityActivityNotFound: (id: number) =>
    `Opportunity activity with ID ${id} not found`,
  failedToUpdateOpportunityExpiryDate:
    "Failed to update opportunity expiry date",
  opportunityDeletionFailed: "Opportunity deletion failed",
  opportunityActivityUpdateFailed: "Opportunity activity update failed",
  enrollmentProcessingFailed: "Processing failed for upload",
  employeeAgeBelowMinimum: (age: number, min: number) =>
    `Employee age ${age} is below the minimum allowed age of ${min}`,
  employeeAgeExceedsMaximum: (age: number, max: number) =>
    `Employee age ${age} exceeds the maximum allowed age of ${max}`,
  companyDocumentError: "Each companyDocMap must have a documentId",
  companyListFailed: "Failed to fetch companies",
  companyAddressFailed: "Failed to update or create address details",
  groupComanyNotFound: "Group company not found",
  groupCompanyCreationFailed: "Group company map creation failed",
  companyDocCreationFailed: "Company document map creation failed",
  companyAddressRequired: "Company address is required",
  fileUploadFailed: "Error at Uploading File",
  fileDeleteFailed: "Error at deleting file",
  fileReplaceFailed: "Error at replacing file",
  fileNotFound: "File not found",
  fileIdRequired: "File ID is required",
  fileRequired: "File is required",
  fileIdNotFound: "File ID not found",
  companyTypeRequired: "Company type is required",
  fileForbidden: "File deletion forbidden",
  groupCompanyListNotFound: "Group company list not found",
  groupCompanyListRetrievalFailed: "Group company list retrieval failed",
  taskCreationFailed: "Task creation failed",
  taskUpdateFailed: "Task update failed",
  taskDetailsRetrievalFailed: "Task details retrieval failed",
  taskNotFound: "Task not found",
  notesNotFound: "Notes not found",
  taskWithIdNotFound: (id: number) => `Task with id ${id} not found`,
  taskDeletionFailed: "Task deletion failed",
  taskCompletionFailed: "Task completion failed",
  invalidTaskType: "Only sub-tasks can be marked complete",
  documentWithIdNotFound: (id: number) => `Document with id ${id} not found`,
  meetingCreationFailed: "Meeting creation failed",
  taskListRetrievalFailed: "Task list retrieval failed",
  noteCreationFailed: "Failed to create note",
  noteUpdateFailed: "Failed to update note",
  noteDetailsRetrievalFailed: "Failed to retrieve note details",
  noteNotFound: "Note not found",
  noteDeletionFailed: "Failed to delete note",
  noteListRetrievalFailed: "Failed to retrieve note list",
  announcementCreationFailed: "Announcement creation failed",
  announcementUpdateFailed: "Announcement update failed",
  announcementNotFound: "Announcement not found",
  announcementDeletionFailed: "Announcement deletion failed",
  announcementListRetrievalFailed: "Announcement list retrieval failed",
  celebrationsListRetrievalFailed: "Celebrations list retrieval failed",
  announcementDetailsRetrievalFailed: "Announcement details retrieval failed",
  announcementNotFoundWithId: (id: number) =>
    `Announcement with ID ${id} not found`,
  policyConfigurationCreationFailed: "Failed to create policy configuration",
  policyConfigurationUpdateFailed: "Failed to update policy configuration",
  policyComponentsConfigurationDetailCreationFailed:
    "Failed to created policy components configuration details",
  policyConfigurationNotFound: "Policy configuration not found",
  policyCoverNotFound: "Policy cover not found",
  policyCoverUpdateFailed: "Failed to update policy cover",
  policyCoverUpdatesRequired: "At least one policy cover update is required",
  policyApprovalInvalidSection:
    "Invalid policy section provided for approval or submission",
  policyApprovalInvalidStatus:
    "Invalid status provided for policy section approval",
  policyApprovalLookupNotFound:
    "Approval status configuration missing for policy section",
  policyApprovalCommentsRequired:
    "Comments are required when rejecting a policy section",
  policyApprovalUserIdRequired:
    "A valid user id is required to perform approval actions",
  policyApprovalStatusUpdateFailed:
    "Failed to update policy section approval status",
  policyApprovalStatusFetchFailed:
    "Failed to fetch policy section approval statuses",
  invalidPolicyCoverTemplateId: (templateId: string | number) =>
    `Invalid cover template identifier ${templateId} provided for policy cover update`,
  invalidPolicyCoverResponse: (templateId: string | number) =>
    `Policy cover response must be provided for template ${templateId}`,
  policyCoverNotFoundForTemplate: (templateId: number) =>
    `Policy cover not found for template ${templateId}`,
  cautionDepositNotFound: "Caution deposit not found",
  cautionDepositAccountNumberRequired:
    "Caution deposit account number is required",
  cautionDepositAccountNameRequired: "Caution deposit account name is required",
  cautionDepositAccountNumberTooLong:
    "Caution deposit account number must be 50 characters or fewer",
  cautionDepositAccountNameTooLong:
    "Caution deposit account name must be 100 characters or fewer",
  cautionDepositAccountNumberDuplicate:
    "Caution deposit account number already exists for this company",
  cautionDepositAccountNumberUpdateFailed:
    "Failed to update caution deposit account number",
  cautionDepositInvalidIdentifier:
    "No caution deposit account found for this policy",
  policyConfigurationDeletionFailed: "Failed to delete policy configuration",
  policyConfigurationListRetrievalFailed:
    "Failed to retrieve policy configuration list",
  policyConfigurationInProgress:
    "A policy configuration is already in progress for this policy",
  policyConfigurationApprovalUserIdRequired:
    "A valid user id is required for approval.",
  policyConfigurationApproverNotFound:
    "No approver found with the required privilege for policy configuration.",
  policyConfigurationAlreadyComplete:
    "Policy configuration is already completed.",
  policyConfigurationAlreadyLive: "Policy configuration is already live.",
  policyConfigurationNotInLiveStatus:
    "No live policy configuration found for this policy.",
  policyConfigurationEditVersionExists:
    "An edit version for this policy configuration is already pending approval.",
  policyConfigurationEditVersionCreationFailed:
    "Failed to create policy configuration edit version.",
  policyAuditLogCreationFailed: "Failed to create policy audit log entry.",
  policyActivationUserIdRequired:
    "A valid user id is required for policy activation.",
  policyActivationFlagRequired:
    "Policy activation request must set isActivate to true.",
  policyActivationConfigurationMissing:
    "A completed policy configuration is required before policy activation.",
  policyAlreadyActive: "Policy is already active.",
  policyActivationFailed: "Failed to activate policy.",
  meetingUpdateFailed: "Meeting update failed",
  meetingFeedbackSubmissionFailed: "Meeting feedback submission failed",
  meetingDetailsRetrievalFailed: "Meeting details retrieval failed",
  meetingListRetrievalFailed: "Meeting list retrieval failed",
  meetingNotFound: "Meeting not found",
  meetingDeletionFailed: "Meeting deletion failed",
  opportunityActivityMetaNotFound: "Opportunity activity meta not found",
  brokingSlipActivityMetaNotFound: "Broking slip Activity not found",
  brokingSlipVersionsNotFound: "Broking slip versions not found",
  tokenNotFound: "Authorization header is missing",
  noTemplateFound: (policyTypeId: number) =>
    `No stage-activity templates found for policyTypeId ${policyTypeId}`,
  stageNotFound: (stageId: number) =>
    `Stage ID ${stageId} not found in stageMap`,
  activityNotFound: (activityId: number) =>
    `Activity ID ${activityId} not found in activityMap`,
  badRequestWhileActivityMapping: "Bad Request while mapping activities",
  opportunityActivityMetaUpdateFailed:
    "Opportunity activity meta update failed",
  opportunityNotPresent: (opportunityId: number) =>
    `Opportunity ID ${opportunityId} not found in opportunityMap`,
  rfpCoverDetailsNotFound: (opportunityId: number) =>
    `RFP cover details for Opportunity ID ${opportunityId} not found`,
  opportunityActivityNotFound: (opportunityId: number) =>
    `Opportunity activity for Opportunity ID ${opportunityId} not found`,
  noCoversFoundForOpportunity: (opportunityId: number) =>
    `No covers found for Opportunity ID ${opportunityId}`,
  premiumCalculationError: "Failed to save premium calculation",
  premiumCalculationDocumentsError:
    "Failed to save premium calculation documents",
  premiumCalculationRetrieveFailed:
    "Error retrieving premium calculation details",
  heldCoverNoteError: "Failed to save Held cover note",
  heldCoverNoteDocumentsError: "Failed to save Held cover note documents",
  opportunityHeldCoverNoteRetrieveFailed:
    "Failed to retrieve Held Cover Note details",
  rfpActivityDetailsNotFound: (opportunityId: number) =>
    `RFP activity details for Opportunity ID ${opportunityId} not found`,
  rfpActivityDocumentsNotFound: (opportunityId: number) =>
    `RFP activity documents for Opportunity ID ${opportunityId} not found`,
  policyConfirmationDataFailed:
    "Failed to create policy confirmation in the database.",
  failedToFetchTasks: "Failed to fetch the Tasks",
  failedToFetchNotes: "Failed to fetch the Notes",
  failedToFetchMeetings: "Failed to fetch the Meetings",
  quoteRetrievalFailed: "Quote retrieval failed",
  quoteUpdateFailed: "Quote update failed",
  quoteDeletionFailed: "Quote deletion failed",
  opportunityQuoteNotFound: "Opportunity quote not found",
  policyDocketDataFailed: "Failed to create policy docket",
  policyDocketNotFound: "Policy docket not found",
  policyDocketRetrievalFailed: "Policy docket retrieval failed",
  policyDocketUpdateFailed: "Policy docket update failed",
  opportunityActivitiesRetrieveFailed:
    "Failed to retrieve opportunity activity details",
  opportunityPolicyConfirmationRetrieveFailed:
    "Failed to retrieve Policy Confirmation details",
  opportunityPolicyHardCopyRetrieveFailed:
    "Failed to retrieve opportunity policy hard copy details",
  opportunityPremiumCalculationRetrieveFailed:
    "Failed to retrieve opportunity premium calculation details",
  heldCoverNoteNotFound: "Held cover note not found",
  heldCoverNoteUpdateFailed: "Held cover note update failed",
  policyConfirmationNotFound: "Policy confirmation not found",
  policyConfirmationUpdateFailed: "Policy confirmation update failed",
  policyHardCopyNotFound: "Policy hard copy not found",
  policyHardCopyUpdateFailed: "Policy hard copy update failed",
  insurerContactsNotFound: "Insurer contacts not found",
  failedToFetchInsurerContacts: "Failed to fetch insurer contacts",
  failedToFetchInsurerBranches: "Failed to fetch insurer branches",
  tpaContactsNotFound: "TPA contacts not found",
  failedToFetchTpaContacts: "Failed to fetch TPA contacts",
  brokerContactsNotFound: "Broker contacts not found",
  failedToFetchBrokerContacts: "Failed to fetch broker contacts",
  brokingSlipDetailsRetrievalFailed:
    "Broking Slip Version Details retrieval failed",
  brokingSlipVersionDetailsRetrieveFailed:
    "Error retrieving broking slip version details by opportunity activity ID",
  finalNegotiationActivityCreationFailed:
    "Failed to create final negotiation activity",
  finalNegotiationActivityUpdateFailed:
    "Failed to update final negotiation activity",
  finalNegotiationActivityRetrievalFailed:
    "Failed to retrieve final negotiation activity",
  placementSlipCreationFailed: "Failed to create placement slip",
  placementSlipUpdateFailed: "Failed to update placement slip",
  placementSlipRetrievalFailed: "Failed to retrieve placement slip",
  placementSlipDeletionFailed: "Failed to delete placement slip",
  notificationCreationFailed: "Failed to create notification",
  notificationUpdateFailed: "Failed to update notification",
  notificationRetrievalFailed: "Failed to retrieve notification",
  notificationDeletionFailed: "Failed to delete notification",
  meetingParticipantsRequired: "Meeting participants are required",
  notificationUserRequired: "user_id or email_id is required",
  notificationSendFailed: "failed to send notification",
  quoteComparisonReportCreationFailed:
    "Failed to create Quote Comparison report in the database.",
  quoteComparisonReportRetrieveFailed:
    "Failed to retrieve Quote Comparison report",
  quoteComparisonReportUpdateFailed: "Quote Comparison Report update failed",
  quoteComparisonReportNotFound: "Quote Comparison Report not found",
  opportunityCoverNotFound: "Opportunity Cover not found",
  failedToFetchOpportunityContacts: "Failed to fetch opportunity contacts",
  opportunityContactsNotFound: "Opportunity contacts not found",
  issuanceDateBeforeOppportunityCreationDate:
    "The given issuance date cannot be before or equal to the opportunity creation date.",
  issuanceDateAfterOppportunityExpiryDate:
    "The given issuance date cannot be after or equal to the opportunity SO expiry date.",
  issuanceDateFormatError: "Invalid issuance date format.",
  premiumCalculationNotFound: "Premium calculation not found.",
  premiumCalculationUpdateFailed: "Failed to update premium calculation.",
  quoteComparisonReportGenerationFailed:
    "Failed to generate Quote Comparison Report.",
  stageOwnerUpdationFailed: "Failed to update stage owner.",
  stageOwnerRetrieveFailed: "Failed to retrieve stage owner.",
  reportUserActivityGenerationFailed: "Failed to generate user activity report",
  invalidFetchEntityData: "Invalid fetch entity data",
  failedToFetchEntity: "Failed to fetch entity data.",
  failedToFetchEntityById: "Failed to fetch entity data by ID.",
  failedToFetchEntityList: "Failed to fetch entity list.",
  lookUpKeysRequired: "Keys array is required.",
  userKeysRequired: "User Keys array is required.",
  invalidDurationKey: "Invalid duration key",
  meetingUpdateError:
    "Cannot update this meeting as it is already completed or cancelled.",
  tpaParticipantsRequired: "TPA participants are required and must be valid.",
  insurerParticipantsRequired:
    "Insurer participants are required and must be valid.",
  companyParticipantsRequired:
    "Company participants are required and must be valid.",
  employeeParticipantsRequired:
    "Employee participants are required and must be valid.",
  documentIdRequired: "Document ID is required for each document.",
  lookupValuesNotFound: "Failed to fetch lookup values",
  lookupKeyNotFound: (key: string) => `Lookup with key ${key} not found`,
  lookupWithIdNotFound: (id: number) => `Lookup with ID ${id} not found`,
  meetingDataNotFoundForOpportunityActivity:
    "Failed to fetch meetings for the given opportunity and activity.",
  meetingTransformError: "Failed to transform meeting response.",
  noMeetingFoundForOpportunity:
    "No activities found for the given opportunity ID",
  invalidActivityId:
    "Activity ID provided without an associated Opportunity ID",
  invalidDateTimeFormat: "Invalid start or end time format",
  meetingStartTimeError: "Meeting start time must be before end time.",
  meetingStartEndTimeValidation:
    "Meeting start and end times must be in the future.",
  failedToFetchTaskList:
    "Failed to fetch tasks for the given opportunity and activity.",
  failedToFetchOpportunityTaskList:
    "Failed to fetch task for the given opportunity, status, and type.",
  reportUserActivityAggregatedGenerationFailed:
    "Failed to generate user activity aggregated report",
  countryNotFoundForPolicy: (policyId: number) =>
    `Country not found for policy ID: ${policyId}.`,
  policyConstraintsNotFound: (countryId: number) =>
    `Policy constraints not found for country ID: ${countryId}.`,
  failedToFetchPolicyRelations: "Failed to fetch policy relations",
  failedToFetchDependents: "Failed to fetch dependents",
  failedToFetchRelationsDependents:
    "Failed to fetch policy relationships and dependents",
  failedToSaveDependents: "Failed to save dependents",
  failedToFetchEmployeeDetails: "Failed to fetch employee details",
  failedToFetchEmployeePolicyComponents:
    "Failed to fetch employee related policy components",
  failedToFetchRelationsAndDependents:
    "Failed to fetch relations and dependents",
  endorsementTemplateUploadFailed: "Failed to upload endorsement template",
  endorsementExcelGenerationFailed: "Failed to generate endorsement Excel",
  endorsementFieldMappingFailed: "Failed to save endorsement field mapping",
  excelGenerationError:
    "An unexpected error occurred while generating the Excel file",
  placementSlipPdfGenerationError:
    "An unexpected error occurred while generating the placement slip PDF",
  pdfGenerationError:
    "An unexpected error occurred while generating the PDF file",
  claimFileNotFound: "File not found for the provided ID",
  claimUploadFailed: "Failed to process claim upload",
  employeeClaimFetchFailed: "Failed to fetch employee claims",
  policyClaimFetchFailed: "Failed to fetch policy claims",
  claimTemplateGenerationFailedErrorForRequiredFields: "Either tpaId or policyId is required to generate template",
  failedToGenerateClaimTemplate: "Failed to generate claim template",
  failedToUploadClaimsTemplateToS3: "Failed to upload claims template to S3",
  tatBucketListFetchFailed: "Failed to fetch TAT buckets",
  noTpaMappingsFoundForPolicyId: "No TPA mappings found for the given Policy ID.",
  noActiveClaimsTemplateFieldsOrTpaMappingsFound: "No active claim template fields or TPA mappings found.",
  noActiveClaimsTemplateFieldsFound: "No active claim template fields found.",
  tatSummaryFetchFailed: "Failed to fetch TAT summary",
  claimEmployeeNotFound: "Employee not found for provided policy and TPA ID",
  claimPolicyNotFound: "Policy not found for provided ID",
  claimPolicyIdMissing: "Policy ID not provided in the uploaded file",
  claimEmployeeIdMissing: "Employee ID not provided in the uploaded file",
  claimInvalidPolicyId:
    "Invalid Policy ID: Policy does not exist in the system.",
  claimInactivePolicy: (policyId: string | number) =>
    `Policy ID ${policyId} is not active. Claims can only be uploaded for active policies.`,
  claimMappingTemplateMissing: () =>
    "TPA or policy does not have any active template mapping.",
  claimPolicyTpaMappingMissing: (policyId: number) =>
    `TPA mapping not found for policy ID ${policyId}.`,
  claimInvalidEmployeeId: (employeeId: string | number) =>
    `Invalid Employee ID: ${employeeId} does not exist in the system.`,
  claimInvalidEmployeeTpaId: (tpaId: string | number) =>
    `Invalid Employee TPA ID: ${tpaId} does not exist in the system.`,
  claimInvalidDependentTpaId: (tpaId: string | number) =>
    `Invalid Patient TPA ID: ${tpaId} does not exist in the system.`,
  claimEmployeeNotAssociated: (employeeId: string | number, policyId: number) =>
    `Employee ID ${employeeId} is not associated with Policy ID ${policyId}.`,
  claimDependentNotAssociated: (dependentId: string | number, policyId: number) =>
    `Patient TPA ID ${dependentId} is not associated with Policy ID ${policyId}.`,
  claimEmployeeNotAssociatedWithTpa: (
    employeeId: string | number,
    tpaId: number
  ) =>
    `Employee ID ${employeeId} is not associated with the selected TPA (${tpaId}).`,
  claimPolicyNotLinkedToTpa: (policyId: number) =>
    `Policy ID ${policyId} is not linked to the selected TPA. Please upload claims under the correct TPA.`,
  claimInvalidStatus: (status?: string | null, allowedStatuses?: string) =>
    `Invalid Claim Status${status ? `: ${status}` : ""}. Allowed values are ${
      allowedStatuses && allowedStatuses.length > 0
        ? allowedStatuses
        : "configured claim statuses"
    }.`,
  claimMappingTemplateIdRequired: "Mapping template id is required for claim upload.",
  claimMappingTemplateEmpty: "Mapping template does not contain any column mappings.",
  claimMappingMissingTarget: (target: string) =>
    `Missing mapping for target: ${target}.`,
  claimMappingSourceColumnNotFound: (source: string) =>
    `Mapped source column not found in upload: ${source}.`,
  claimDuplicateRecord: (claimId: string | number) =>
    `Duplicate Claim detected for Claim ID ${claimId}. Record already exists in the system.`,
  claimNumberEmployeeMismatch: (claimId: string | number) =>
    `Claim ID ${claimId} is already associated with a different employee. Please verify the claim number.`,
  claimStatusUpdateNotAllowed: (
    claimId: string | number,
    fromStatus?: string | null,
    toStatus?: string | null
  ) =>
    `Claim ID ${claimId} status cannot be updated from ${fromStatus ?? "unknown"} to ${toStatus ?? "unknown"}.`,
  claimPolicyNumberMismatch:
    "Policy number does not match the selected policy.",
  claimMandatoryFieldsMissing:
    "One or more mandatory fields required by the standard template are missing. Please review the file and re-upload",
  cautionDepositsFetchFailed: "Failed to fetch CD",
  claimBatchFetchFailed: "Failed to fetch claim batches",
  claimBatchFilterMissing:
    "Either policyId or tpaId is required to fetch claim batches.",
  pdfUrlFetchError: "Error while fetching PDF URL",
  placementSlipTemplateNotFound:
    "Placement slip template not found for the given organization",
  // Bulk Edit Error Messages
  bulkEditValidationFailed: "Validation failed",
  bulkEditExecutionFailed: "Bulk edit execution failed",
  bulkEditValidationRequestFailed: "Bulk edit request validation failed",
  bulkEditInternalServerError:
    "Internal server error during bulk edit execution",
  bulkEditUnknownError: "Unknown error",
  bulkEditInvalidEntityType: (entityType: string) =>
    `Invalid entity type: ${entityType}. Must be one of: company, opportunity, policy`,
  bulkEditFieldNotBulkEditable: (
    fieldName: string,
    entityType: string,
    allowedFields: string
  ) =>
    `Field '${fieldName}' is not bulk editable for entity type '${entityType}'. Allowed fields: ${allowedFields}`,
  bulkEditUnsupportedEntityType: (entityType: string) =>
    `Unsupported entity type: ${entityType}`,
  bulkEditValidationErrorsBeforeExecution:
    "Please fix validation errors before executing bulk edit",
  roleNotFound: () => `Role not found`,
  failedToFetchUsersByRole: (roleName: string) =>
    `Failed to fetch users for role: ${roleName}`,
  bulkAssignmentRoleFetchFailed: "Failed to fetch roles for bulk assignment",
  bulkEditFieldNotEditable: (
    fieldName: string,
    entityType: string,
    allowedFields: string
  ) =>
    `Field '${fieldName}' is not editable for ${entityType}. Allowed fields: ${allowedFields}`,

  // New error message for handling the inception / endorsement insurer file creation
  failedToResetSendToInsurerDocumentStatus:
    "Only failed send to insurer document processing records can be reset",
  noSendToInsurerDocumentProcessingRecordFound:
    "No send to insurer document processing record found for this endorsement",

  // Mapping Template Errors
  failedToSaveMappingTemplate: "Failed to save mapping template. Please try again.",
  duplicateTargetColumn: (targetTableName: string, targetColumnName: string) =>
    `Duplicate target column found: ${targetTableName}.${targetColumnName}`,
  failedToDeleteMappingTemplate: "Failed to delete mapping template",
  authorizationTokenRequired: "Authorization token is required",
  invalidUserCredentials: "Invalid user credentials",
  userEmailNotFoundInToken: "User email not found in token",
  entityNameRequired: "Entity name is required",
  failedToRetrieveMappingTemplate: "Failed to retrieve mapping template",
  providerMissing:
    'CAPTCHA is enabled but CAPTCHA_PROVIDER is not configured.',
  secretKeyMissing:
    'CAPTCHA is enabled but CAPTCHA_SECRET_KEY is not configured.',
  invalidProvider: (providers: string) =>
    `CAPTCHA_PROVIDER is invalid. Supported providers: ${providers}.`,
  policyMustBeActivatedForBypassInception:
    "Policy must be activated before inception can be processed in bypass mode.",
  inceptionMustBeCompletedForBypassEndorsement:
    "Inception must be completed before processing endorsements in bypass mode.",
  policyLocationsRequireAddress:
    "Cannot enable Associated Locations: no company address of type 'Associated Location' exists.",
  policyLocationLookupMissing: (key: string) =>
    `Lookup not found for key ${key}`,
  policyLocationRemovalBlockedByEnabledToggle:
    "Cannot remove an 'Associated Location' address while 'Enable Associated Locations' is turned on for one or more policies of this company.",
  policyLocationAddressCodeRequired:
    "Location Code is required for Associated Location addresses.",
  policyLocationAddressCodeDuplicate: (codes: string) =>
    `Duplicate Location Code(s) for Associated Location: ${codes}.`,
};

/**
 * Success Messages
 */
export const successMessage = {
  employeeCreation: "Employee created successfully",
  employeeUpdate: "Employee updated successfully",
  employeeDeletion: "Employee deleted successfully",
  employeeRetrieval: "Employee retrieved successfully",
  employeeListRetrieval: "Employees retrieved successfully",
  employeeHierarchyRetrieval: "Employee hierarchy retrieved successfully",
  employeesWithPrivilege: "Employees with privilege retrieved successfully",
  parentWithPrivilege:
    "User with privilege in hierarchy retrieved successfully",
  contactCreated: "Contact created successfully",
  contactListRetrieved: "Contact List retrieved successfully",
  contactDetails: "Contact retrieved successfully",
  insurerDetails: "Insurer retrieved successfully",
  contactUpdated: "Contact updated successfully",
  contactDeleted: "Contact deleted successfully",
  addressCreated: "Address created successfully",
  addressListRetrieved: "Address list retrieved successfully",
  insurerListRetrieved: "Insurer list retrieved successfully",
  addressDetails: "Address retrieved successfully",
  addressUpdated: "Address updated successfully",
  addressDeleted: "Address deleted successfully",
  countryFecthed: "Country fetched successfully",
  countryListFetched: "Country list fetched successfully",
  stateListFetched: "State list fetched successfully",
  cityListFetched: "City list fetched successfully",
  regionListFetched: "Region list fetched successfully",
  insurerCreated: "Insurer successfully created.",
  insurerListRetrived: "Insurer successfully retrieved.",
  insurerUpdated: "Insurer successfully updated.",
  tpaCreated: "TPA created successfully",
  tpasRetrieved: "TPAs retrieved successfully",
  tpaRetrieved: "TPA retrieved successfully",
  tpaUpdated: "TPA updated successfully",
  tpaDeleted: "TPA deleted successfully",
  companyCreated: "Company created successfully",
  companyAndContactCreated: "Company and Contact created successfully",
  companyListRetrieved: "Company list retrieved successfully",
  companyContactsRetrieved: "Company contacts retrieved successfully",
  companyDocumentsRetrieved: "Company documents retrieved successfully",
  companyLocationsRetrieved: "Company locations retrieved successfully",
  insurerCompanyListRetrieved: "Insurer company list retrieved successfully",
  tpaCompanyListRetrieved: "Tpa company list retrieved successfully",
  brokerCompanyListRetrieved: "Broker company list retrieved successfully",
  companyDetails: "Company retrieved successfully",
  companyUpdated: "Company updated successfully",
  companyDeleted: "Company deleted successfully",
  companyAddressCreated: "Company address created successfully",
  tatBucketListRetrieved: "TAT bucket list retrieved successfully",
  tatSummaryRetrieved: "TAT summary retrieved successfully",
  pendingActivitiesSummaryRetrieved:
    "Pending activities summary retrieved successfully",
  companyAddressListRetrieved: "Company address list retrieved successfully",
  companyAddressDetails: "Company address retrieved successfully",
  companyAddressUpdated: "Company address updated successfully",
  userLoggedIn: "User logged in successfully",
  userLoggedOut: "User logged out successfully",
  userDetailsRetrieved: "User details retrieved successfully",
  tpaContactCreated: "TPA Contact created successfully",
  tpaContactListRetrieved: "TPA Contact list retrieved successfully",
  tpaContactDetails: "TPA Contact retrieved successfully",
  tpaContactUpdated: "TPA Contact updated successfully",
  tpaContactDeleted: "TPA Contact deleted successfully",
  tpaDetailsRetrieved: "TPA details retrieved successfully",
  contactDetailsRetrieved:
    "Contact details retrieved successfully for the insurer",
  contactAdded: "Contact added to the insurer successfully",
  insurerRetrievedSuccesfully: "Insurer retrieved successfully",
  insurerDetailsRetrieved: "Insurer details retrieved successfully",
  insurerLocationsRetrieved: "Insurer locations retrieved successfully",
  insurerDeleted: "Insurer deleted successfully",
  companyOverallAnalytics: "Company overall analytics retrieved successfully",
  companyAnalyticsFetched: "Company analytics fetched successfully",
  companyAnalyticsRefreshed: "Company analytics refreshed successfully",
  tpaAddressDeleted: "TPA address deleted successfully",
  brokerCreated: "Broker created successfully",
  brokerListRetrieved: "Broker list retrieved successfully",
  brokerDetails: "Broker retrieved successfully",
  brokerUpdated: "Broker updated successfully",
  brokerDeleted: "Broker deleted successfully",
  brokerDetailsRetrieved: "Broker details retrieved successfully",
  opportunityCreated: "Opportunity created successfully",
  opportunityActivityCreated: "Opportunity activity saved successfully",
  opportunityUpdated: "Opportunity updated successfully",
  opportunityExpiryDateUpdated: "Opportunity expiry date updated successfully",
  opportunityDeleted: "Opportunity deleted successfully",
  opportunityDocumentsRetrieved: "Opportunity documents retrieved successfully",
  policyDocumentsRetrieved: "Policy documents retrieved successfully",
  policyDocumentUploaded: "Policy document uploaded successfully",
  brokingSlipVersionDeleted: "Broking Slip Version deleted successfully",
  opportunityListRetrieved: "Opportunities retrieved successfully",
  opportunityDetails: "Opportunity details retrieved successfully",
  opportunityActivityMetaRetrieved:
    "Opportunity activity meta retrieved successfully",
  opportunityActivityDataRetrieved:
    "Opportunity activity details retrieved successfully",
  opportunityActivityMetaRetrievalFailed:
    "Opportunity activity meta retrieval failed",
  tokenRefreshed: "Token refreshed successfully.",
  groupCompanyListRetrieved: "Group company list retrieved successfully",
  taskCreation: "Task created successfully",
  taskUpdation: "Task updated successfully",
  taskDetails: "Task details retrieval successfully",
  taskDeleted: "Task deleted successfully",
  taskCompleted: "Task marked completed successfully",
  taskClosed: "Task closed successfully",
  taskList: "Task list retrieval successfully",
  noteCreation: "Note created successfully",
  noteUpdate: "Note updated successfully",
  noteDetails: "Note details retrieval successfully",
  noteList: "Note list retrieval successfully",
  noteDeleted: "Note deleted successfully",
  announcementCreation: "Announcement created successfully",
  announcementUpdated: "Announcement updated successfully",
  announcementDetails: "Announcement retrieved successfully",
  announcementList: "Announcements retrieved successfully",
  announcementDeleted: "Announcement deleted successfully",
  celebrationsList: "Celebrations list retrieved successfully",
  cautionDepositAccountNumberUpdated:
    "Caution deposit account number updated successfully",
  policyConfigurationCreated: "Policy configuration created successfully",
  policyConfigurationUpdated: "Policy configuration updated successfully",
  policyConfigurationApprovalUpdated:
    "Policy configuration approval updated successfully",
  policyActivated: "Policy activated successfully",
  policyReconfigured: "Policy sent back for reconfiguration",
  policyConfigurationRetrieved: "Policy configuration retrieved successfully",
  policyConfigurationListRetrieved:
    "Policy configuration list retrieved successfully",
  policyConfigurationDeleted: "Policy configuration deleted successfully",
  policyConfigurationEditVersionCreated:
    "Policy configuration edit version created successfully",
  meetingCreation: "Meeting created successfully",
  meetingUpdated: "Meeting updated successfully",
  meetingFeedbackSubmitted: "Meeting feedback submitted successfully",
  meetingDetails: "Meeting details retrieval successfully",
  meetingList: "Meeting list retrieval successfully",
  meetingDeleted: "Meeting deleted successfully",
  opportunityActivityUpdatedSuccessfully:
    "Opportunity activities updated successfully",
  tasksFetched: "Tasks fetched successfully",
  notesFetched: "Notes fetched successfully",
  quoteRetrieved: "Quote retrieved successfully",
  quoteUpdated: "Quote updated successfully",
  quoteDeleted: "Quote deleted successfully",
  quoteActivitiesUpdated: "Quote activities updated successfully",
  policyDocketRetrieved: "Policy docket retrieved successfully",
  policyDocketUpdated: "Policy docket updated successfully",
  heldCoverNoteUpdated: "Held Cover Note updated successfully",
  policyConfirmationUpdated: "Policy Confirmation updated successfully",
  policyHardCopyUpdated: "Policy Hard Copy updated successfully",
  insurerContactsRetrieved: " Insurer contacts retrieved successfully",
  insurerBranchesRetrieved: "Insurer branches retrieved successfully",
  tpaContactsRetrieved: "TPA contacts retrieved successfully",
  brokerContactsRetrieved: "Broker contacts retrieved successfully",
  passwordResetMailSent:
    "Mail sent successfully. You may receive it in couple of minutes",
  passwordUpdated: "Password updated successfully",
  brokeingSlipVersionsRetrieved:
    "All Broking Slip Versions retrieved successfully",
  finalNegotiationActivityCreated:
    "Final negotiation activity created successfully",
  finalNegotiationActivityUpdated:
    "Final negotiation activity updated successfully",
  finalNegotiationActivityRetrieved:
    "Final negotiation activity retrieved successfully",
  placementSlipCreated: "Placement slip created successfully",
  placementSlipUpdated: "Placement slip updated successfully",
  placementSlipRetrieved: "Placement slip retrieved successfully",
  placementSlipDeleted: "Placement slip deleted successfully",
  notificationCreated: "Notification created successfully",
  notificationUpdated: "Notification updated successfully",
  notificationRetrieved: "Notification retrieved successfully",
  notificationDeleted: "Notification deleted successfully",
  quoteComparisonReportUpdated: "Quote Comparison Report updated successfully",
  mandateUpdated: "Mandate updated successfully",
  opportunityContactsRetrieved: "Opportunity contacts retrieved successfully",
  premiumCalculationUpdated: "Premium calculation updated successfully.",
  stageOwnerUpdated: "Stage owner updated successfully.",
  reportUserActivityGeneratedSuccessfully:
    "User activity report generated successfully",
  policyRelationsAndDependentsRetrieved:
    "Policy relationships and dependents retrieved successfully",
  reportUserActivityAggregatedGeneratedSuccessfully:
    "User activity aggregated report generated successfully",
  companyOpportunityCreated:
    "Company, Contact and Opportunity created successfully",
  dependentsSaved: "Dependents saved successfully",
  CompanyEmployeeDetailsUpdatedSuccessfully:
    "Employee details updated successfully",
  CompanyEmployeeDetailsRetrievedSuccessfully:
    "Employee details retrieved successfully",
  CompanyEmployeePolicyChoicesRetrievedSuccessfully:
    "Employee policy choices retrieved successfully",
  componentsCreated: "Components created successfully",
  componentsSaved: "Components saved successfully",
  policiesRetrieved: "Policies retrieved successfully",
  companyEmployeePasswordUpdatedSucccessfully:
    "Company employee password updated successfully",
  endorsementTemplateUploaded: "Template uploaded",
  endorsementExcelGenerated: "Successfully generated endorsement Excel",
  endorsementMappingCreated: "Mapping created",
  brokingSlipExcelGenerated: "Broking Slip Excel generated successfully",
  quoteComparisonReportExcelGenerated:
    "Quote Comparison Report Excel generated successfully",
  policyReportExcelGenerated: "Policy report Excel generated successfully",
  placementSlipPdfGenerated: "Placement slip PDF generated successfully",
  claimUploaded: "Claim uploaded successfully",
  employeeClaimRetrieved: "Employee claim retrieved successfully",
  policyClaimRetrieved: "Policy claim retrieved successfully",
  claimListRetrieved: "Claim list retrieved successfully",
  cautionDepositsRetrieved: "CD retrieved successfully",
  policyCreated: "Policy created successfully",
  claimBatchListRetrieved: "Claim batch list retrieved successfully",
  claimActivity: {
    claimInformed: {
      save: "Claim informed saved successfully",
      submit: "Claim informed submitted successfully",
    },
    fnolDetails: {
      save: "Claim FNOL details saved successfully",
      submit: "Claim FNOL details submitted successfully",
    },
    lossAdjusterDetails: {
      save: "Claim loss adjuster saved successfully",
      submit: "Claim loss adjuster submitted successfully",
    },
    surveyCompleted: {
      save: "Claim survey saved successfully",
      submit: "Claim survey submitted successfully",
    },
    documentsCollected: {
      save: "Claim documents collection saved successfully",
      submit: "Claim documents collection submitted successfully",
    },
    jointInspectionReport: {
      save: "Claim joint inspection report saved successfully",
      submit: "Claim joint inspection report submitted successfully",
    },
    lorDetails: {
      save: "Claim Letter of Requirements saved successfully",
      submit: "Claim Letter of Requirements submitted successfully",
    },
    documentSubmissionTracker: {
      save: "Claim document submission tracker saved successfully",
      submit: "Claim document submission tracker submitted successfully",
    },
    assessmentReport: {
      save: "Claim assessment report saved successfully",
      submit: "Claim assessment report submitted successfully",
    },
    validationReport: {
      save: "Claim validation report saved successfully",
      submit: "Claim validation report submitted successfully",
    },
    claimSettlement: {
      save: "Claim settlement saved successfully",
      submit: "Claim settlement submitted successfully",
    },
    dischargeVoucher: {
      save: "Claim discharge voucher saved successfully",
      submit: "Claim discharge voucher submitted successfully",
    },
    customerAgreement: {
      save: "Claim customer agreement saved successfully",
      submit: "Claim customer agreement submitted successfully",
    },
    voucherToInsurer: {
      save: "Claim voucher to insurer saved successfully",
      submit: "Claim voucher to insurer submitted successfully",
    },
    claimPayment: {
      save: "Claim payment saved successfully",
      submit: "Claim payment submitted successfully",
    },
  },
  placementSlipPdfUrlFetched: "Placement Slip PDF URL fetched successfully",
  policyCoverUpdated: "Policy cover updated successfully",
  policySectionSubmitted: "Policy section details submitted successfully",
  policySectionApprovalUpdated:
    "Policy section details approval updated successfully",
  cautionDepositSectionSubmitted: "CD details section submitted successfully",
  cautionDepositSectionApprovalUpdated:
    "CD details section approval updated successfully",
  coversSectionSubmitted: "Covers details section submitted successfully",
  coversSectionApprovalUpdated:
    "Covers details section approval updated successfully",
  policySectionStatusesRetrieved:
    "Policy section approval statuses retrieved successfully",
  enrollmentSummaryRetrieved: "Enrolment summary retrieved successfully",
  // Bulk Edit Success Messages
  bulkEditValidationSuccess: "Bulk edit request validated successfully",
  bulkEditExecutionSuccess: "Bulk edit operation completed successfully",
  bulkEditExecutionPartialSuccess: (
    failureCount: number,
    totalRecords: number
  ) =>
    `Bulk edit completed with ${failureCount} errors out of ${totalRecords} records`,
  companyBulkUpdateCompleted: "Company bulk update completed successfully",
  bulkAssignmentPeersRetrieved:
    "Peers with the same role retrieved successfully",
  usersByRoleRetrieved: "Users by role name retrieved successfully",
  mappingTemplateRetrieved: "Mapping template retrieved successfully",
  mappingTemplateDeleted: "Mapping template deleted successfully",
  entityFieldsRetrieved: "Entity fields retrieved successfully",
  mappingTemplateSaved: "Mapping template saved successfully",
};

/**
 * Info Messages
 */
export const infoMessages = {
  noEmployees: "No employees found",
  employeeNotFound: "Employee not found",
  employeeHierarchyNotFound: "Unable to retrieve hierarchy for the user",
  employeePrivilegeNotFound: "No users with the given privilege found",
  userNotFound: "User not found",
  userNotFoundWithId: (userId: number) => `User with ID ${userId} not found`,
  emailNotFoundWithUserId: (userId: number) =>
    `Email details for the user with ID ${userId} not found`,
  unknownError: "An unknown error occurred",
  tpaNotFound: "TPA not found",
  contactNotFound: "Contact not found",
  insurerNotFound: "Insurer not found",
  noDataAvailable: "No data available",
  tpaAddressNotFound: "TPA address not found",
  forBidden: "Forbidden",
  employeeUpdateFailed: "Employee update data not found",
  employeeEmailIdAlreadyExists: "Employee email ID already exists",
  employeeIdAlreadyExists: "Employee ID already exists",
  loginNameAlreadyExists: "Login name already exists",
  invalidOrgBranch:
    "The selected Branch does not exist in the Organisation selected",
  invalidOrgSbu: "The selected SBU does not exist in the Organisation selected",
  invalidOrgVertical:
    "The selected Vertical does not exist in the SBU selected",
  invalidOrgDepartment:
    "The selected Department does not exist in the Vertical selected",
  invalidReportingManager: "Specified Reporting Manager is invalid",
  reportingMgrInReportees:
    "Reporting Manager can not also be selected as a Reportee",
  invalidRolesinCreate: "Specified User Roles do no exist",
  missingPrivilegeKeys:
    "Privilege Keys - Category Key and Action Key - missing in request",
  inactiveUsersInReportees: "Reportee list includes Deleted Users",
  cannotAddSelfOrManagerAsReportee:
    "Employee cannot be added as a Reportee to themselves or their Reporting Manager",
  reportingMgrSelf: "Employee can not report to themselves",
  userIdCantChange: "User Id cannot be changed during an update",
  cannotRemoveReportees: "Removing existing reportees is not permitted",
  reportingMgrMissingNotFound:
    "A valid Reporting Manager must be specified to move current reportees before deleting an employee",
  delegateUserNotFound:
    "Delegated User to transfer ownership of companies and opportunities not found",
  enrollmentSchedulerRunning: "Running enrollment upload scheduler...",
  missingSubassetDescription:
    "Missing sub-asset description details for addition/inception",
  subAssetDeletionMarkFailed: "Failed to mark sub-asset for deletion",
  // Bulk Edit Info Messages
  bulkEditLargeBatchWarning: (recordCount: number) =>
    `Large batch operation: ${recordCount} records. Consider breaking into smaller batches for better performance.`,
  bulkEditLargeBatchDetected:
    "Large batch detected. Processing may take longer than usual.",
  bulkEditValidationStarted: (userId: number, entityType: string) =>
    `BulkEditController.validateBulkEdit: User ${userId} validating bulk edit for ${entityType}`,
  bulkEditExecutionStarted: (
    userId: number,
    entityType: string,
    recordCount: number
  ) =>
    `BulkEditController.executeBulkEdit: User ${userId} executing bulk edit for ${entityType} with ${recordCount} records`,
  bulkEditValidationCompleted: (isValid: boolean, errorCount: number) =>
    `Validation completed for bulk edit request. Valid: ${isValid}, Errors: ${errorCount}`,
  bulkEditExecutionStartedInService: (
    entityType: string,
    recordCount: number
  ) => `Executing bulk edit for ${entityType} with ${recordCount} records`,
};

/**
 * Template Helper Messages
 */
export const templateHelperMessages = {
  enrollmentAdditionPremiumRows: [
    "Addition Premium Calculation:",
    "The system calculates prorated premiums for additions based on the effective date, which varies by employee type:",
    "For existing employees enrolled during policy inception: The policy start date serves as the effective date",
    "For new joiners added during the policy period: Their actual joining date serves as the effective date",
    "Formula:",
    "Prorated Premium = Annual Premium × (Policy End Date - Effective Date + 1) / 365",
    "Where the numerator represents the number of days of coverage (inclusive of start and end dates), and 365 represents the annual period.",
  ],
  enrollmentDeletionPremiumRows: [
    "Deletion Premium Calculation:",
    "The system calculates prorated refunds for deletions based on the effective date, which is determined by the type of exit date received:",
    "When Last Working Day (LWD) is provided by CRM/HR: The effective date is the day following the LWD (LWD + 1)",
    "When Date of Separation is provided by HR/CRM: The effective date is the same as the Date of Separation",
    "Formula:",
    "Refund Premium = Annual Premium × (Policy End Date - Effective Date + 1) / 365",
    "Where the numerator represents the number of days of remaining coverage (inclusive of start and end dates), and 365 represents the annual period.",
  ],
};

export const endorsementFileUploadMessages = {
ER0001: "ER0001 - Wrong date format. Please use DD/MM/YYYY or YYYY-MM-DD.",
ER0002: "ER0002 - This has fake or test data. Please provide real employee details only.",
ER0003: "ER0003 - Employee ID is missing. Please add a proper Employee ID.",
ER0004: "ER0004 - Dependent has no Employee ID. Please link dependent to an employee.",
ER0005: "ER0005 - Same Employee ID used in multiple rows. Each employee needs a different ID.",
ER0006: "ER0006 - Employee ID not found in this company/policy. Please check and upload again.",
ER0007: "ER0007 - Employee name is missing. Please add the full name.",
ER0008: "ER0008 - Date of birth is missing. Please add a correct date of birth.",
ER0009: "ER0009 - Email address needed for login and other communications. Please add a proper email address.",
ER0010: "ER0010 - Email address is missing. Please add a proper email address.",
ER0011: "ER0011 - Wrong email format. Please write email like: name@company.com.",
ER0012: "ER0012 - Mobile number needed for login. Please add a proper mobile number.",
ER0013: "ER0013 - Same email used in multiple rows. Each employee needs a different email.",
ER0014: "ER0014 - Wrong start date. Date must be between policy start and end dates.",
ER0015: "ER0015 - Dependent not linked to correct Employee ID. Please check Employee ID.",
ER0016: "ER0016 - Dependent's Employee ID does not match. Please check the Employee ID.",
ER0017: "ER0017 - Important dependent details are missing. Please fill all required fields.",
ER0018: "ER0018 - Wrong relationship type. Please use only allowed relationships.",
ER0019: "ER0019 - Too many dependents for this relationship. Please check the limit.",
ER0020: "ER0020 - This relationship is not allowed in your policy. Please check.",
ER0021: "ER0021 - Dependent is too young for this relationship type.",
ER0022: "ER0022 - Dependent is too old for this relationship type.",
ER0023: "ER0023 - Age gap between employee and dependent is not correct.",
ER0024: "ER0024 - One dependent failed validation, so employee enrollment is rejected.",
ER0025: "ER0025 - Dependent rejected because another dependent of same employee failed.",
ER0026: "ER0026 - Employee has chosen options not allowed in this policy.",
ER0027: "ER0027 - Employee exists but is not enrolled in this policy.",
ER0028: "ER0028 - Cannot delete. Dependent name not given.",
ER0029: "ER0029 - This dependent record does not exist in our system.",
ER0030: "ER0030 - This Employee ID does not exist.",
ER0031: "ER0031 - Employee already exists with same ID/email/mobile number.",
ER0032: "ER0032 - Employee is already enrolled in this same policy.",
ER0033: "ER0033 - Employee ID is wrong or fake.",
ER0034: "ER0034 - Employee name is missing. Please add full name.",
ER0035: "ER0035 - Date of birth is missing or wrong. Please add correct date of birth.",
ER0036: "ER0036 - Email is missing or wrong format. Please add a proper email address.",
ER0037: "ER0037 - Employee start date must be between policy start and end dates.",
ER0038: "ER0038 - More than one row has the same Employee ID.",
ER0039: "ER0039 - More than one row has the same Email ID.",
ER0040: "ER0040 - Dependent details are missing. Please add required dependent information.",
ER0041: "ER0041 - Relationship is missing for dependent.",
ER0042: "ER0042 - Gender is missing for dependent.",
ER0043: "ER0043 - Wrong date of birth format. Please use DD/MM/YYYY or YYYY-MM-DD.",
ER0044: "ER0044 - Dependent start date must be between policy start and end dates.",
ER0045: "ER0045 - Male employee cannot add parents under current policy rules.",
ER0046: "ER0046 - Female employee cannot add parents under current policy rules.",
ER0047: "ER0047 - Male employee cannot add in-laws under current policy rules.",
ER0048: "ER0048 - Female employee cannot add in-laws under current policy rules.",
ER0049: "ER0049 - Age gap between employee and parent is not correct.",
ER0050: "ER0050 - Age gap between employee and child is too small.",
ER0051: "ER0051 - Dependent is too young for this relationship.",
ER0052: "ER0052 - Dependent is too old for this relationship.",
ER0053: "ER0053 - Too many dependents for this relationship type (check this employee's rows).",
ER0054: "ER0054 - Policy does not allow mixing different parent types (check this employee's dependents).",
ER0055: "ER0055 - Both parents cannot have same gender under policy rules (check this employee's dependents).",
ER0056: "ER0056 - Cannot delete. Relationship type not given.",
ER0057: "ER0057 - Cannot delete. Employee ID not given.",
ER0058: "ER0058 - Employee does not exist in this company or policy.",
ER0059: "ER0059 - Employee exists but is not linked to this policy.",
ER0060: "ER0060 - \"Intake Type\" value is missing. Please add a valid intake type.",
ER0061: "ER0061 - For non-financial changes, only UPDATION is allowed.",
ER0062: "ER0062 - Employee ID is missing. Please add a proper Employee ID.",
ER0063: "ER0063 - Gender cannot be changed.",
ER0064: "ER0064 - Dependent uses Employee ID that does not exist.",
ER0065: "ER0065 - Dependent update failed. TPA ID/IIRM ID does not match existing records.",
ER0066: "ER0066 - Age cannot be changed.",
ER0067: "ER0067 - Wrong date of birth format. Please use DD/MM/YYYY or YYYY-MM-DD.",
ER0068: "ER0068 - Dependent age is outside allowed limits.",
ER0069: "ER0069 - TPA IDs given but no TPA is linked to this policy.",
ER0070: "ER0070 - Same mobile number used in multiple rows. Each employee needs a different mobile number.",
ER0071: "ER0071 - Total dependents added exceed the policy's configured Max Dependent Count limit for this family.",
ER0072: "ER0072 - Max Dependent Count value does not match any configured option label for this policy.",
ER0073: "ER0073 - Employee is already deleted from this policy.",
ER0074: "ER0074 - Dependent is already deleted from this policy."
}
