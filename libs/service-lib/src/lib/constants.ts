import { COVER_TYPE } from "node_modules/@insurance-wellness-hub/service-lib/src/lib/constants";

export const ADMIN = "admin";
export const iirm = "iirm"; // API Gateway base path
export const TPA_CREATED_BY = "tpa";
export const TPA_UPDATED_BY = "update tpa";
export const TPA_ADDRESS_ID = 1;
export const TPA_DEFAULT_PAGE = 1;
export const TPA_DEFAULT_PAGE_LIMIT = 10;
export const DEFAULT_USER_ROLE_ID = 1;
export const DEFAULT_USER_PASSWORD = "password";
export const DEFAULT_EMPLOYEE_CREATED_BY = 1;
export const DEFAULT_EMPLOYEE_UPDATED_BY = 1;
export const DEFAULT_EMPLOYEE_PAGE = 1;
export const DEFAULT_EMPLOYEE_PAGE_LIMIT = 10;
export const DEFAULT_ADMIN = "admin";
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_SORT_ORDER = "DESC";
export const DEFAULT_DESC_SORT_ORDER = "DESC";
export const DEFAULT_ASC_SORT_ORDER = "ASC";
export const DEFAULT_SORT_FIELD = "id";
export const DEFAULT_EMPLOYEE_SORT_FIELD = "employeeId";
export const DEFAULT_TPA_SORT_FIELD = "id";
export const DEFAULT_USER_IIRM_EMP_ID = 1;
export const USER_TYPE_IIRM_EMPLOYEE = "USER_TYPE_IIRM_EMPLOYEE";
export const USER_TYPE_COMPANY_EMPLOYEE = "USER_TYPE_COMPANY_EMPLOYEE";
export const USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE =
  "USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE";
export const COMPANY_EMPLOYEE_ROLE_KEY = "ROLE_COMPANY_EMPLOYEE";
export const JWT_SECRET = "ThisIsSecretVeda";
export const JWT_EXPIRES_IN = "1h";
export const JWT_REFRESH_EXPIRES_IN = "7d";
export const DEFAULT_ADMIN_ID = 1;
export const DEFAULT_RO_CRON_BATCH_SIZE = 100;
export const DEFAULT_ENROLLMENT_UPLOAD_BATCH_SIZE = 50;
export const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  TPA: "tpa",
  BD: "BD",
  LEADERSHIP: "LeaderShip",
  AM: "AM",
  ISG: "ISG",
};
export const IS_EDITABLE = "yes";
export const IS_NOT_EDITABLE = "no";
export const DEFAULT_TASK_STATUS = "TASK_STATUS_ACTIVE";
export const DEFAULT_ACTIVE_LOOKUP_STATUS = 1;
export const MEETING_TYPE_KEY = {
  KDM: "MEETING_TYPE_KDM",
  FINAL_NEGOTIATION: "MEETING_TYPE_FINAL_NEGOTIATION",
  HANDOVER: "MEETING_TYPE_HANDOVER",
};
export const MEETING_NAME = {
  KDM: "KDM Meeting",
  FINAL_NEGOTIATION: "Final Negotiation Meeting",
  HANDOVER: "Handover Meeting",
};
export const OPPORTUNITY_POLICY_STATUS_CREATED =
  "OPPORTUNITY_POLICY_STATUS_CREATED";
export const POLICY_CONFIG_STATUS_IN_PROGRESS =
  "POLICY_CONFIG_STATUS_IN_PROGRESS";
export const POLICY_CONFIGURATION_STATUS_WIP =
  "POLICY_CONFIGURATION_STATUS_WIP";
export const POLICY_CONFIGURATION_STATUS_DRAFT =
  "POLICY_CONFIGURATION_STATUS_DRAFT";
export const POLICY_CONFIGURATION_STATUS_COMPLETE =
  "POLICY_CONFIGURATION_STATUS_COMPLETE";
export const POLICY_CONFIGURATION_STATUS_LIVE =
  "POLICY_CONFIGURATION_STATUS_LIVE";
export const POLICY_CONFIGURATION_STATUS_REJECTED =
  "POLICY_CONFIGURATION_STATUS_REJECTED";
export const POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL =
  "POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL";
export const ENROLLMENT_STATUS_NOT_READY = "ENROLLMENT_STATUS_NOT_READY";
export const POLICY_CONFIGURATION_STATUS_SUBMITTED =
  "POLICY_CONFIGURATION_STATUS_SUBMITTED";
export const POLICY_CONFIGURATION_STATUS_LIVE_EDIT_SUBMIT =
  "POLICY_CONFIGURATION_STATUS_LIVE_EDIT_SUBMIT";

export const POLICY_GROUP_IIRM = "POLICY_GROUP_IIRM";
export const POLICY_SECTION_APPROVAL_STATUS_LOOKUP_NAME =
  "POLICY_SECTION_APPROVAL_STATUS";

export const POLICY_SECTION_APPROVAL_STATUS_VALUE = {
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const POLICY_SECTION_APPROVAL_STATUS_KEY = {
  SUBMITTED: "POLICY_SECTION_APPROVAL_STATUS_SUBMITTED",
  APPROVED: "POLICY_SECTION_APPROVAL_STATUS_APPROVED",
  REJECTED: "POLICY_SECTION_APPROVAL_STATUS_REJECTED",
} as const;

export const POLICY_SECTION_APPROVAL_SECTIONS = {
  POLICY_DETAILS: "POLICY_DETAILS",
  POLICY_COVERS: "POLICY_COVERS",
  POLICY_CD: "POLICY_CD",
} as const;

export const POLICY_SECTION_APPROVAL_DECISION_STATUS = {
  APPROVED: POLICY_SECTION_APPROVAL_STATUS_VALUE.APPROVED,
  REJECTED: POLICY_SECTION_APPROVAL_STATUS_VALUE.REJECTED,
} as const;

export const POLICY_SECTION_APPROVAL_COMMENT_MAX_LENGTH = 1000;

export const POLICY_SECTION_APPROVAL_AUDIT_ENTITY_TYPE =
  "POLICY_SECTION_APPROVAL";
export const POLICY_SECTION_APPROVAL_AUDIT_ENTITY_NAME =
  "Policy Section Approval";
export const POLICY_SECTION_APPROVAL_AUDIT_SECTION_FIELD = "section";
export const POLICY_SECTION_APPROVAL_AUDIT_STATUS_KEY_FIELD = "statusKey";
export const POLICY_SECTION_APPROVAL_AUDIT_STATUS_LABEL_FIELD = "statusLabel";
export const POLICY_SECTION_APPROVAL_AUDIT_COMMENTS_FIELD = "comments";

export const EMPLOYEE_ENROLLMENT_STATUS_ENROLLED =
  "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";

export const EMPLOYEE_ENDORSEMENT_READY = "EMPLOYEE_ENDORSEMENT_READY";
export const ASSET_ENDORSEMENT_READY = "ASSET_ENDORSEMENT_READY";
export const ASSET_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING =
  "ASSET_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING";
export const ASSET_ENDORSEMENT_PROCESSED = "ASSET_ENDORSEMENT_PROCESSED";
export const EMPLOYEE_ENDORSEMENT_PROCESSED = "EMPLOYEE_ENDORSEMENT_PROCESSED";
export const EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT =
  "EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT";
export const EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING =
  "EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING";
export const EMPLOYEE_ENDORSEMENT_ACKNOWLEDGED =
  "EMPLOYEE_ENDORSEMENT_ACKNOWLEDGED";
export const EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED =
  "EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED";
export const EMPLOYEE_ENDORSEMENT_DOWNLOADED =
  "EMPLOYEE_ENDORSEMENT_DOWNLOADED";

export const POLICY_AUDIT_ACTION_APPROVED = "POLICY_AUDIT_APPROVED";
export const POLICY_AUDIT_ACTION_REJECTED = "POLICY_AUDIT_REJECTED";
export const POLICY_AUDIT_ACTION_CONFIGURATION_LIVE =
  "POLICY_AUDIT_CONFIGURATION_LIVE";
export const POLICY_AUDIT_ACTION_POLICY_ACTIVATED =
  "POLICY_AUDIT_POLICY_ACTIVATED";
export const POLICY_AUDIT_ACTION_CAUTION_DEPOSIT_ACCOUNT_NUMBER_UPDATED =
  "POLICY_AUDIT_CAUTION_DEPOSIT_ACCOUNT_NUMBER_UPDATED";
export const POLICY_AUDIT_ENTITY_POLICY = "POLICY";
export const POLICY_AUDIT_ENTITY_POLICY_CONFIGURATION = "POLICY_CONFIGURATION";
export const POLICY_AUDIT_ENTITY_CAUTION_DEPOSIT = "CAUTION_DEPOSIT";
export const DOCUMENT_ENTITY_TYPE_POLICY_EXTENSION = "POLICY_EXTENSION";

export const ASSET_ENDORSEMENT_STATUS_LABELS: Record<string, string> = {
  [ASSET_ENDORSEMENT_PROCESSED]: "Processed",
  [ASSET_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING]: "Acknowledgement pending",
  [ASSET_ENDORSEMENT_READY]: "Endorsement ready",
};

// pending acknowledgement
export const ENDORSEMENT_STATUS = {
  ENDORSEMENT_STATUS_PENDING: "Pending Acknowledgement",
  ENDORSMENT_STATUS_ACKNOWLEDGED: "Acknowledged",
  ENDORSMENT_STATUS_PROCESSED: "Processed",
  ENDORSEMENT_STATUS_TPA_UPLOAD_PENDING: "Pending TPA Upload",
  ENDORSEMENT_REQUEST_RECEIVED: "ENDORSEMENT_REQUEST_RECEIVED",
  ENDORSEMENT_CREATED: "ENDORSEMENT_CREATED",
  ENDORSEMENT_SENT_TO_INSURER: "ENDORSEMENT_SENT_TO_INSURER",
  ENDORSEMENT_ACKNOWLEDGEMENT_RECEIVED: "ENDORSEMENT_ACKNOWLEDGEMENT_RECEIVED",
  ENDORSEMENT_CLIENT_CONFIRMATION_SENT: "ENDORSEMENT_CLIENT_CONFIRMATION_SENT",
  ENDORSEMENT_TPA_UPLOAD_RECEIVED: "ENDORSEMENT_TPA_UPLOAD_RECEIVED",

  TPA_ID_UPLOAD: "TPA_ID_UPLOAD",
  CLIENT_CONFIRMATION: "CLIENT_CONFIRMATION",
  RECEIVE_INSURER_ACKNOWLEDGEMENT: "RECEIVE_INSURER_ACKNOWLEDGEMENT",
  SEND_ENDORSEMENT_TO_INSURER: "SEND_ENDORSEMENT_TO_INSURER",
  CREATE_ENDORSEMENT: "CREATE_ENDORSEMENT",
  SHOW_ENDORSEMENT_UPLOADS: "SHOW_ENDORSEMENT_UPLOADS",

  TPA_ID_UPLOADED: "TPA_ID_UPLOADED",
  CLIENT_CONFIRMED: "CLIENT_CONFIRMED",
  INSURER_ACKNOWLEDGED: "INSURER_ACKNOWLEDGED",
};

export const CLAIM_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  OPEN: "OPEN",
  SETTLED: "SETTLED",
  REPUDIATED: "REPUDIATED",
  WITHDRAWN: "WITHDRAWN",
  IIRM_CANCEL: "IIRM_CANCEL",
} as const;

export const CLAIM_STATUS_FILTER = {
  NO: "no",
  NONE: "none",
  YES: "yes",
  ACTIVE: "active",
} as const;

export const POLICY_EMPLOYEE_INSURED_FIELDS = {
  INSURED_NAME: "insuredName",
  EMPLOYEE_ID: "employeeId",
  DATE_OF_BIRTH: "dateOfBirth",
  GENDER: "gender",
  EFFECTIVE_FROM: "effectiveFrom",
  EFFECTIVE_TO: "effectiveTo",
  CLAIM_STATUS: "claimStatus",
  RELATIONSHIP_GROUP: "relationshipGroup",
  RELATIONSHIP_TYPE: "relationshipType",
} as const;

export const POLICY_EMPLOYEE_INSURED_DB_FIELD_MAP = {
  [POLICY_EMPLOYEE_INSURED_FIELDS.INSURED_NAME]: "dependent.name",
  [POLICY_EMPLOYEE_INSURED_FIELDS.EMPLOYEE_ID]: "dependent.employeeId",
  [POLICY_EMPLOYEE_INSURED_FIELDS.DATE_OF_BIRTH]: "dependent.dateOfBirth",
  [POLICY_EMPLOYEE_INSURED_FIELDS.GENDER]: "dependent.gender",
  [POLICY_EMPLOYEE_INSURED_FIELDS.EFFECTIVE_FROM]:
    "dependent.endorsementAdditionCreatedAt",
  [POLICY_EMPLOYEE_INSURED_FIELDS.EFFECTIVE_TO]:
    "dependent.endorsementDeletionCreatedAt",
  [POLICY_EMPLOYEE_INSURED_FIELDS.CLAIM_STATUS]: "dependent.claimStatus",
  [POLICY_EMPLOYEE_INSURED_FIELDS.RELATIONSHIP_GROUP]:
    "dependent.relationshipType",
  [POLICY_EMPLOYEE_INSURED_FIELDS.RELATIONSHIP_TYPE]:
    "dependent.relationshipType",
} as const;

export const EMPLOYEE_INSURED_EMPTY_RESULT = { data: [], count: 0 };

export const EMPLOYEE_INSURED_QUERY_CONSTANTS = {
  POLICY_RELATIONS: ["policyStatus", "opportunity"] as const,
  ENDORSEMENT_ORDER: { createdAt: "DESC" as const },
  DEFAULT_SORT_FIELDS: [
    { field: "employeeId", order: "ASC" as const },
    { field: "insuredName", order: "ASC" as const },
  ],
  ORDER_ASC: "ASC" as const,
  EMPLOYEE_MAP_ALIAS: "map",
  EMPLOYEE_ALIAS: "employee",
  DEPENDENT_ALIAS: "dependent",
  MAP_POLICY_WHERE: "map.policyId = :policyId",
  SEARCH_BY_LIKE: "LOWER(dependent.name) LIKE LOWER(:searchBy)",
  EMPLOYEE_ID_IN: "employee.id IN (:...employeeIds)",
  EMPLOYEE_COMPANY_ID_LIKE:
    "LOWER(employee.companyEmployeeId) LIKE LOWER(:companyEmployeeId)",
  DEPENDENT_DEFAULT_ORDER_FIELD: "dependent.id",
} as const;

export const EMPLOYEE_INSURED_EXCEL_LABELS = {
  EMPLOYEE_COMPANY_ID: "Employee Company ID",
  INSURED_NAME: "Insured Name",
  INC_END_ID: "Inc/End ID",
  DOB: "DOB",
  GENDER: "Gender",
  EFFECTIVE_FROM: "Effective from",
  EFFECTIVE_TO: "Effective to",
  RELATIONSHIP_GROUP: "Relationship group",
  RELATION: "Relation",
  SI_TOTAL: "SI Total",
  SI_UTILIZED: "SI Utilized",
  SI_BALANCE: "SI Balance",
  CLAIMS_STATUS: "Claims Status",
  IIRM_POLICY_ID: "IIRM Policy ID",
  INSURER_POLICY_NUMBER: "Insurer Policy Number",
  INSURER_ENDORSEMENT_NUMBER: "Insurer Endorsement Number",
  INSURER_ENDORSEMENT_DATE: "Ack date from insurer",
  TPA_ID: "TPA ID",
  MOBILE_NUMBER: "Mobile Number",
  EMAIL: "Email",
  ENDORSEMENT_EFFECTIVE_DATE: "Endorsement Effective Date",
  ADDITION_PRORATA_DAYS: "Addition Prorata Days",
  ADDITION_PREMIUM_EXCL_GST: "Addition Premium (Excl. GST)",
  DELETION_PRORATA_DAYS: "Deletion Prorata Days",
  DELETION_PREMIUM_EXCL_GST: "Deletion Premium (Excl. GST)",
  NET_PREMIUM_EXCL_GST: "Net Premium (Excl. GST)",
  IIRM_EMP_ID: "IIRM Emp ID",
  EMP_ID: "Emp ID",
  STATUS: "Status",
} as const;

export const EMPLOYEE_INSURED_EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const EMPLOYEE_INSURED_EXCEL_STORAGE_PREFIX =
  "document-generation/policy";

export const EMPLOYEE_INSURED_EXCEL_METHOD_NAME =
  "getEmployeeInsuredExcelDownload";
export const EMPLOYEE_INSURED_EXCEL_SUCCESS_MESSAGE =
  "Employee insured Excel data generated successfully";
export const EMPLOYEE_INSURED_EXCEL_ERROR_MESSAGE =
  "Failed to export employee insured details.";

export const EMPLOYEE_INSURED_ENDORSEMENT_SELECT_FIELDS = [
  "employeeId",
  "endorsementId",
] as const;
export const EMPLOYEE_INSURED_ENDORSEMENT_ORDER = {
  endorsementId: "DESC" as const,
};

export const EMPLOYEE_INSURED_OPTIMIZED_SORT_FIELDS = [
  "insurerEndorsementNumber",
  "insurerEndorsementDate",
  "employeeId",
  "insuredName",
  "status",
  "relation",
  "relationshipGroup",
  "claimStatus",
  "effectiveFrom",
  "effectiveTo",
  "endorsementId",
  "sumInsuredTotal",
  "iirmEmpId",
  "employeeCompanyId",
  "dateOfBirth",
  "gender",
  "tpaId",
  "mobileNumber",
  "email",
  "sumInsuredBalance",
  "sumInsuredUtilized",
  "endorsementEffectiveDate",
] as const;

export const EMPLOYEE_INSURED_SOURCE_TYPE = {
  EMPLOYEE: "EMPLOYEE",
  DEPENDENT: "DEPENDENT",
} as const;

export const EMPLOYEE_INSURED_WORKSHEET_NAME = "Employee Insured";

export const EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS =
  "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS";
export const EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT =
  "EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT";
export const PREFERENCE_STATUS_PREFERRED = "PREFERENCE_STATUS_PREFERRED";
export const PREFERENCE_STATUS_EXCLUDED = "PREFERENCE_STATUS_EXCLUDED";
export const DUPLICATE_CONSTRAINT = {
  duplicatePanEntry: "unique_pan_card_number", // Legacy constraint
  duplicatePanHashEntry: "unique_pan_card_hash", // New hash-based constraint for encrypted PANs
  duplicateTanEntry: "unique_tan_number",
  duplicateGstinEntry: "company_gst_detail_gst_number_key",
};
export const SENSITIVE_FIELD_NAMES = {
  PAN_CARD_NUMBER: "panCardNumber",
  PAN_CARD_NUMBER_HASH: "panCardNumberHash",
};
export const SUCCESS_MESSAGE = "SUCCESS";
export const DEFAULT_ACTIVE_STATUS = "Active";
export const DEFAULT_INACTIVE_STATUS = "Inactive";
export const DEFAULT_COMPANY_STATUS_ACTIVE = "COMPANY_STATUS_ACTIVE";
export const DEFAULT_COMPANY_STATUS_INACTIVE = "COMPANY_STATUS_INACTIVE";
export const OPPORTUNITY_STATUS_OPEN = "OPPORTUNITY_STATUS_OPEN";
export const OPPORTUNITY_STATUS_LOST = "OPPORTUNITY_STATUS_LOST";
export const OPPORTUNITY_STATUS_WORK_IN_PROGRESS =
  "OPPORTUNITY_STATUS_WORK_IN_PROGRESS";
export const OPPORTUNITY_STATUS_BD_PLANNING =
  "OPPORTUNITY_STATUS_BD_PLANNING";
export const OPPORTUNITY_STATUS_WON = "OPPORTUNITY_STATUS_WON";
export const OPPORTUNITY_ACTIVITY_STATUS_CLOSED =
  "OPPORTUNITY_ACTIVITY_STATUS_CLOSED";
export const OPPORTUNITY_POLICY_STATUS_ACTIVE =
  "OPPORTUNITY_POLICY_STATUS_ACTIVE";
export const QCR_GENERATION_KEY = "quote_comparison_report_activity";
export const DEFAULT_CONTACT_STATUS_ACTIVE_KEY = "CONTACT_STATUS_ACTIVE";
export const DEFAULT_CONTACT_STATUS_INACTIVE_KEY = "CONTACT_STATUS_INACTIVE";
export const DEFAULT_BROKER_STATUS_ACTIVE = "BROKER_ACTIVE";
export const NATURE_OF_BROKING_BUSSINESS = "NATURE_OF_BROKING_BUSSINESS";
export const NATURE_OF_BROKING_BUSSINESS_RE_INSURENSE =
  "NATURE_OF_BROKING_BUSSINESS_RE_INSURENSE";
export const NATURE_OF_BROKING_BUSSINESS_INSURENCE_ONLY =
  "NATURE_OF_BROKING_BUSSINESS_INSURENCE_ONLY";
export const DEFAULT_INSURER_STATUS_ACTIVE_KEY = "INSURER_STATUS_ACTIVE";
export const DEFAULT_RESIDENTIAL_ADDRESS_TYPE_KEY = "Residential";
export const DEFAULT_TPA_STATUS_ACTIVE_KEY_ID = 80;
export const DEFAULT_CONTACT_STATUS_ACTIVE_KEY_ID = 29;
export const DEFAULT_CONTACT_STATUS_INACTIVE_KEY_ID = 30;
export const DEFAULT_COMPANY_STATUS_UNDER_REVIEW_KEY_ID = 33;
export const DEFAULT_INSURER_STATUS_ACTIVE_KEY_ID = 85;
export const DEFAULT_BROKER_STATUS_ACTIVE_KEY_ID = 274;
export const companyNonEditableFields = ["companyName"];
export const EMPLOYEE_STATUS_ACTIVE = "EMPLOYEE_STATUS_ACTIVE";
export const EMPLOYEE_STATUS_INACTIVE = "EMPLOYEE_STATUS_INACTIVE";
export const EMPLOYEE_STATUS_LEAVE = "EMPLOYEE_STATUS_LEAVE";
export const USER_STATUS_ACTIVE = "USER_STATUS_ACTIVE";
export const USER_STATUS_INACTIVE = "USER_STATUS_INACTIVE";
export const USER_STATUS_DELETED = "USER_STATUS_INACTIVE";
export const OPTY_STAGE_WIP = "OPTY_STAGE_WIP";
export const OPTY_STAGE_OPEN = "OPTY_STAGE_OPEN";
export const OPTY_STAGE_LOST = "OPTY_STAGE_LOST";
export const OPTY_STAGE_WON = "OPTY_STAGE_WON";
export const ACTIVITY_STATUS_COMPLETED = "ACTIVITY_STATUS_COMPLETED";
export const EMPLOYEE_REPORTEE_ACTION_REASSIGN =
  "EMPLOYEE_REPORTEE_ACTION_REASSIGN";
export const EMPLOYEE_REPORTEE_ACTION_IGNORE =
  "EMPLOYEE_REPORTEE_ACTION_IGNORE";
export const EMPLOYEE_REPORTEE_ACTION_UPDATE =
  "EMPLOYEE_REPORTEE_ACTION_UPDATE";
export const DEFAULT_PHONE_KEY = "phone";
export const DEFAULT_EMAIL_KEY = "email";
export const COMPANY_DISPLAY_NAME = "displayName";
export const DEFAULT_COMPANY_ENTITY_NAME = "Company";
export const DEFAULT_CONTACT_ENTITY_NAME = "Contact";
export const DEFAULT_INSURER_ENTITY_NAME = "Insurer";
export const DEFAULT_INSURER_ADDRESS_ENTITY_NAME = "InsurerAddress";
export const DEFAULT_OPPORTUNITY_ENTITY_NAME = "Opportunity";
export const DEFAULT_TPA_ENTITY_NAME = "Tpa";
export const DEFAULT_BROKER_ENTITY_NAME = "Broker";
export const DEFAULT_OPPORTUNITY_ACTIVITY_MAP_ENTITY_NAME =
  "OpportunityActivityMap";
export const UPLOAD_CLAIM_ENTITY_NAME = "UPLOAD_CLAIM";
export const UTILITY_UPLOAD_ENTITY_CLAIMS = "UPLOAD_CLAIM";
export const ENABLE_DYNAMIC_CLAIMS_MAPPING = true;
export const TPA_STATUS_ACTIVE = "TPA_STATUS_ACTIVE";
export const KNOWLEDGE_STATUS_ACTIVE = "KNOWLEDGE_STATUS_ACTIVE";
export const KNOWLEDGE_STATUS_DELETED = "KNOWLEDGE_STATUS_DELETED";
export const MEETING_SUB_TYPE_LID = "MEETING_SUBTYPE_HANDOVER";
export const UPDATE = "update";
export const IGNORE = "ignore";
export const REASSIGN = "reassign";
export const DEFAULT_APPROVAL_REQUIRED = "No";
export const POLICY_RELATIONSHIP_TYPE_PARAMETER = "relation";
export const SEZ_APPLICABLE_FIELD_NAME = "isSEZApplicable";
export const EMPLOYEE_FIELDS = {
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
  CREATED_BY: "createdBy",
  UPDATED_BY: "updatedBy",
  STATUS_LID: "statusLid",
  ORGANIZATION_LID: "organizationLid",
  BRANCH_LID: "branchLid",
  DEPARTMENT_ID: "departmentId",
  DESIGNATION_ID: "designationId",
  SBU_ID: "sbuId",
  VERTICAL_ID: "verticalId",
  IWORK_ROLE_ID: "iworkRoleId",
  REPORTING_USER_ID: "reportingUserId",
  REPORTING_MANAGER_EMPLOYEE_ID: "reportingManagerEmployeeId",
  STATUS_LOOKUP: "statusLookup",
  SALUTATION_LID: "salutationLid",
  ROLE_ID: "roleId",
  DELETED_AT: "deletedAt",
};
export const COMPANY_CONTACT_RECORD_TYPE = 88;
export const INSURER_CONTACT_RECORD_TYPE = 89;
export const TPA_CONTACT_RECORD_TYPE = 90;
export const BROKER_CONTACT_RECORD_TYPE = 91;
export enum enumRecordType {
  COMPANY = "company",
  TPA = "tpa",
  INSURER = "insurer",
  BROKER = "broker",
}
export const DEFAULT_PHONE_NUMBER = 9000000001;
export const CREATED_AT = "createdAt";
export const DEFAULT_TOTAL_KPI_COUNT = 0;

export const LOOK_UP_DATA = {
  addressTypeLid: ["ADDRESS_TYPE", "AGENT_ADDRESS_TYPE"],
  isLifeLid: "INSURANCE_TYPE",
  companyTagLid: "COMPANY_TAG",
  companyTypeLid: "COMPANY_TYPE",
  insuranceCompanyTypeLid: "INSURANCE_COMPANY_TYPE",
  industrySegmentLid: "INDUSTRY_SEGMENT",
  priorityLid: "PRIORITY",
  statusLid: [
    "COMPANY_STATUS",
    "USER_STATUS",
    "EMPLOYEE_STATUS",
    "TPA_STATUS",
    "INSURER_STATUS",
    "CONTACT_STATUS",
    "OPPORTUNITY_STATUS",
    "OPPORTUNITY_ACTIVITY_STATUS",
    "BROKER_STATUS",
    "TOGGLE_TYPE",
    "ACTIVITY_SUBMISSION_STATUS",
    "MEETING_STATUS",
    "MASTER_STATUS",
  ],
  quoteStatusLid: "OPPORTUNITY_ACTIVITY_STATUS",
  reasonForLossLid: "REASON_FOR_OPPORTUNITY_LOSS",
  kdmMeetingTypeLid: "SELECT_MEETING",
  handOverMeetingTypeLid: "SELECT_MEETING",
  isFinalNegotiationTypeLid: "SELECT_MEETING",
  sentimentLid: "SENTIMENT_TYPE",
  sourceTypeLid: "COMPANY_SOURCE_TYPE",
  groupCompanyLid: "GROUP_COMPANY",
  gstCategoryLid: "TAX",
  salutation: "SALUTATION",
  iworkRole: "IIRM_ROLE",
  addressType: "ADDRESS_TYPE",
  contactRecordTypeLid: "CONTACT_RECORD_TYPE",
  salutationLid: "SALUTATION",
  tagLid: ["CONTACT_TAG", "AGENT_CONTACT_TAG"],
  contactTypeLid: ["CONTACT_TYPE", "AGENT_CONTACT_TYPE"],
  gender: "GENDER_TYPE",
  spouseWorkingStatus: "SPOUSE_WORKING_STATUS",
  maritalStatus: "MARTIAL_STATUS",
  policyTypeLid: "POLICY_TYPE",
  policyStatusLid: ["POLICY_STATUS_MIG", "POLICY_STATUS"],
  stageLid: "STAGE",
  serviceLevelLid: "SERVICE_LEVEL",
  challengeTypeLid: "CHALLENGE_TYPE",
  mitigationTypeLid: "MITIGATION_TYPE",
  relationshipTypeLid: "RELATIONSHIP_TYPE",
  childGender: "GENDER_TYPE",
  opportunityTypeLid: "OPPORTUNITY_TYPE",
  isPolicyMinedLid: "IS_POLICY_MINED",
  opportunitySourceTypeLid: "OPPORTUNITY_SOURCE_TYPE",
  iworkRoleId: "IWORK_ROLE",
  policyPlacedTypeLid: "POLICY_PLACED_TYPE",
  serviceLevelAgreementDaysLid: "SERVICE_NO_OF_DAYS",
  onlyLeadPaysCommissionLid: "ONLY_LEAD_PAYS_COMMISSION",
  wouldChangeQuoteValuesLid: "WOULD_YOU_LIKE_TO_CHANGE_VALUES",
  activityTypeLid: "ACTIVITY_TYPE",
  meetingTypeLid: "MEETING_TYPE",
  meetingStatusLid: "MEETING_STATUS",
  locationTypeLid: "MEETING_LOCATION",
  meetingOutcomes: "MEETING_OUTCOME",
  meetingChallenges: "MEETING_CHALLENGE",
  meetingNextSteps: "MEETING_NEXT_STEP",
  mandateTypeLid: "MANDATE_TYPE",
  documentTypeLid: "DOCUMENT_TYPE",
  policyDataWrongLid: "TOGGLE_TYPE",
  deviationResolvedLid: "TOGGLE_TYPE",
  isLeadInsurerPayCommissionLid: "TOGGLE_TYPE",
  resolutionLid: "RESOLUTION_TYPE",
  policyDataRectifiedLid: "TOGGLE_TYPE",
  placementSlipDeviationsLid: "TOGGLE_TYPE",
  deviationsAddressedLid: "TOGGLE_TYPE",
  revisedHeldCoverNoteLid: "TOGGLE_TYPE",
  compensationTypeLid: "COMPENSATION_TYPE",
  deviationsLid: "TOGGLE_TYPE",
  deviationCoveragesLid: "TOGGLE_TYPE",
  policyHardCopyReceivedLid: "TOGGLE_TYPE",
  isQuoteEdited: "TOGGLE_TYPE",
  multipleBrokerInvolved: "TOGGLE_TYPE",
  isMarketAllocationDone: "TOGGLE_TYPE",
  isPremiumInstallmentBased: "TOGGLE_TYPE",
  isFeeInInstallment: "TOGGLE_TYPE",
  isLeadInsurerPayCommission: "TOGGLE_TYPE",
  taskStatusLid: "TASK_STATUS",
  taskTypeLid: ["TASK_TYPE", "TASK_TYPE_SELECTION"],
  preferenceTypeLid: "PREFERENCE_STATUS",
  paymentTypeLid: "PAYMENT_TOGGLE",
  cdAccountTypeLid: "CD_ACCOUNT_TOGGLE",
  transactionTypeLid: "TRANSACTION_TYPE",
};

export const MASTER_DATA = {
  leadCrm: "user",
  accountManager: "user",
  cityId: "city",
  stateId: "state",
  countryId: "country",
  currencyId: "currency",
  designationId: "org_designation",
  verticalId: "org_vertical",
  sbuId: "org_sbu",
  organisationId: "organisation",
};
export const OPPORTUNITY_STAGES = [
  "STAGE_CREATED",
  "STAGE_LOST",
  "STAGE_MOVE_ON",
  "STAGE_UNDER_REVIEW",
];
export const OPPORTUNITY_TYPES = ["OPPORTUNITY_TYPE_SO", "OPPORTUNITY_TYPE_RO"];
export const TPA_MEDIATOR_TYPE = 100;
export const INSURER_MEDIATOR_TYPE = 101;
export const OPPORTUNITY_TYPE = {
  SO: "OPPORTUNITY_TYPE_FRESH",
  RO: "OPPORTUNITY_TYPE_RENEWAL",
};
export const ORGANISATION = {
  HOLDINGS: "IIRM Holdings",
  INDIA: "IIRM India",
  SRI_LANKA: "IIRM Sri Lanka",
  SAFERISK: "Saferisk",
  MALDIVES: "IIRM Maldives",
  KENYA: "IIRM Kenya",
};
export const MINED_POLICY = "IS_POLICY_MINED_YES";
export const RO_POLICY_STATUS = "POLICY_STATUS_RENEWAL";
export const RO_SERVICE_LEVEL = "SERVICE_LEVEL_FULL_SERVICE";
export const ONE_YEAR_IN_DAYS = 365;
export const MEDIATOR_TYPES = {
  [TPA_MEDIATOR_TYPE]: "TPA",
  [INSURER_MEDIATOR_TYPE]: "INSURER",
};
export const MEDIATOR_DETAILS = {
  TPA_MEDIATOR_TYPE: "TPA",
  INSURER_MEDIATOR_TYPE: "INSURER",
  BROKER_MEDIATOR_TYPE: "BROKER",
};
export const POLICY_PARTICIPANT = {
  PARTICIPANT: "PARTICIPANT",
  AM: "AM",
  BD: "BD_OWNER",
  ISG: "ISG_OWNER",
};
export const THREE_MONTHS = "3 Months";
export const SIX_MONTHS = "6 Months";
export const ONE_YEAR = "1 Year";
export const TWO_YEARS = "2 Year";
export const FIVE_YEARS = "5 Year";

export const THIRTY_DAYS = "30days";
export const SIXTY_DAYS = "60days";
export const NINETY_DAYS = "90days";
export const ONE_HUNDRED_EIGHTY_DAYS = "180days";
export const THREE_SIXTY_DAYS = "360days";

export const AccessControlMap = {
  getOpportunities: [
    { categoryKey: "OPTY_TPA_001", actionKey: "READ_001" },
    { categoryKey: "CMP_TPA_001", actionKey: "WRITE_001" },
  ],
  updateOpportunity: [
    { categoryKey: "OPY_TPA_001", actionKey: "UPDATE_001" },
    { categoryKey: "CMP_TPA_001", actionKey: "WRITE_001" },
  ],
};
export const TABLE_NAMES = {
  STAGE_ACTIVITY_TEMPLATE: "mstr_stage_activity_template",
  MSTR_ACTIVITY: "mstr_activity",
  MSTR_STAGE: "mstr_stage",
  OPPORTUNITY_ACTIVITY_MAP: "opportunity_activity_map",
  LOOKUP_DATA: "lookup_data",
  OPPORTUNITY_ACTIVITY_PARTICIPANTS: "opportunity_activity_participants",
  OPPORTUNITY_PREMIUM_CALCULATION: "OpportunityPremiumCalculation",
  OPPORTUNITY_RFP_DETAILS_ENTRY: "opportunity_rfp_details_entry",
  USER: "users",
  EMPLOYEE: "employee",
};
export const MAPPED_DATA_DELETION = {
  MAP_REMOVED: "mapping_removed",
  SOFT_DELETE: "deleted_at",
};
export const PARTICIPANT_TYPE = {
  TPA_CONTACT: "TPA_CONTACT",
  INSURER_CONTACT: "INSURER_CONTACT",
  BROKER_CONTACT: "BROKER_CONTACT",
  COMPANY_CONTACT: "COMPANY_CONTACT",
  EMPLOYEE: "EMPLOYEE",
};
export const PARTICIPANT_EMPLOYEE_COMPANY_ID = 0;
export const COVERS_REQUIRED_ACTIVITIES = [
  "Renewal RFP Data Collection",
  "RFP Data Collection",
  "Broking Slip Generation",
  "Enter Quote",
  "QCR Generation",
  "Placement Slip Generation",
  "Meeting for Final Negotiation",
  "Held Cover Note",
  "Premium Calculation",
  "Policy Hard Copy Receipt",
];
export const SALES_OPPORTUNITY = "SO";
export const RENEWAL_OPPORTUNITY = "RO";
export const DEFAULT_COMPANY_CONTACT_RECORD_TYPE = -1;
export const DEFAULT_COMPANY_CONTACT_RECORD_TYPE_KEY =
  "COMPANY_CONTACT_RECORD_TYPE";
export const DEFAULT_PLANNING = {
  PLANNED: "Planned",
  NOT_PLANNED: "Not Planned",
};
export const USER_EMAIL = "emailId";
export const ORGANISATION_ID = "organisationId";
export const EMPLOYEE_USER_ID = "userId";
export const OPPORTUNITY_ID = "opportunityId";

export const ACTIVITY_KEY = {
  POLICY_CONFIRMATION_ACTIVITY: "policy_confirmation_activity",
  OPPORTUNITY_LOST_ACTIVITY: "opportunity_lost_activity",
  HAND_OVER_MEET_ACTIVITY: "hand_over_meet_activity",
  POLICY_DOCKET_ACTIVITY: "policy_docket_activity",
  POLICY_HARD_COPY_ACTIVITY: "policy_hard_copy_activity",
  HELD_COVER_NOTE_ACTIVITY: "held_cover_note_activity",
  PREMIUM_CALCULATION_ACTIVITY: "premium_calculation_activity",
  PLACEMENT_SLIP_GENERATION_ACTIVITY: "placement_slip_generation_activity",
  FINAL_NEGOTIATION_ACTIVITY: "final_negotiation_activity",
  QUOTE_COMPARISON_REPORT_ACTIVITY: "quote_comparison_report_activity",
  QUOTE_ENTRY_ACTIVITY: "quote_entry_activity",
  BROKING_SLIP_ACTIVITY: "broking_slip_activity",
  RFP_DETAILS_ENTRY_ACTIVITY: "rfp_details_entry_activity",
  RFP_COVER_DETAIL_ACTIVITY: "rfp_cover_detail_activity",
  MANDATE_DETAILS_ENTRY_ACTIVITY: "mandate_details_entry_activity",
  KDM_MEETING_ACTIVITY: "kdm_meeting_activity",
  DATA_VALIDATION_ACTIVITY: "data_validation_activity",
};

// Activities whose document upload is mandatory at opportunity creation.
// Every other activity's document is optional. Used to set
// opportunity_activity_map.is_document_mandatory when activities are mapped.
export const MANDATORY_DOCUMENT_ACTIVITY_KEYS: string[] = [
  ACTIVITY_KEY.MANDATE_DETAILS_ENTRY_ACTIVITY,
  ACTIVITY_KEY.RFP_COVER_DETAIL_ACTIVITY,
  ACTIVITY_KEY.RFP_DETAILS_ENTRY_ACTIVITY,
  ACTIVITY_KEY.BROKING_SLIP_ACTIVITY,
  ACTIVITY_KEY.QUOTE_ENTRY_ACTIVITY,
  ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY,
  ACTIVITY_KEY.HELD_COVER_NOTE_ACTIVITY,
  ACTIVITY_KEY.POLICY_HARD_COPY_ACTIVITY,
  ACTIVITY_KEY.POLICY_CONFIRMATION_ACTIVITY,
];

// Cover-bearing activities in pipeline order. The index IS the order and is the
// single source of truth for the per-cover "show until activity" cutoff: a cover
// is visible up to and including its cutoff activity, hidden in every activity
// after it. The policy mirrors the Placement Slip position (policy is generated
// at PSG), so Premium Calculation (after PSG) and PSG-cutoff covers reach it.
export const COVER_BEARING_ACTIVITY_ORDER: string[] = [
  ACTIVITY_KEY.RFP_COVER_DETAIL_ACTIVITY, // "RFP Data Collection" - covers first enter here
  ACTIVITY_KEY.BROKING_SLIP_ACTIVITY,
  ACTIVITY_KEY.QUOTE_ENTRY_ACTIVITY,
  ACTIVITY_KEY.QUOTE_COMPARISON_REPORT_ACTIVITY,
  ACTIVITY_KEY.FINAL_NEGOTIATION_ACTIVITY,
  ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY,
  ACTIVITY_KEY.PREMIUM_CALCULATION_ACTIVITY,
];

export const ROLE_KEY = {
  ROLE_ISG_EXECUTIVE: "ROLE_ISG_EXECUTIVE",
  ROLE_ISG_MANAGER: "ROLE_ISG_MANAGER",
  ROLE_BD_EXECUTIVE: "ROLE_BD_EXECUTIVE",
  ROLE_BD_MANAGER: "ROLE_BD_MANAGER",
  ROLE_LEADERSHIP: "ROLE_LEADERSHIP",
  ROLE_CS_MANAGER: "ROLE_CS_MANAGER",
  ROLE_CS_EXECUTIVE: "ROLE_CS_EXECUTIVE",
  ROLE_SUPER_USER: "ROLE_SUPER_USER",
  ROLE_SUPER_USER_READ_ONLY: "ROLE_SUPER_USER_READ_ONLY",
};
export const OPPORTUNITY_ACTIVITY = {
  DATA_VALIDATION: "opportunity_data_validation",
  KDM_MEETING: "opportunity_kdm_meeting",
  MANDATE_DETAILS_ENTRY: "opportunity_mandate_details_entry",
  RFP_COVER_DETAIL: "opportunity_rfp_cover_detail",
  RFP_DETAILS_ENTRY: "opportunity_rfp_details_entry",
  BROKING_SLIP: "opportunity_broking_slip_version_details",
  QUOTE_ENTRY: "opportunity_quote_entry",
  QUOTE_COMPARISON_REPORT: "opportunity_quote_comparison_report",
  FINAL_NEGOTIATION: "opportunity_final_negotiation",
  PLACEMENT_SLIP: "opportunity_placement_slip_generation",
  PREMIUM_CALCULATION: "opportunity_premium_calculation",
  HELD_COVER_NOTE: "opportunity_held_cover_note",
  POLICY_HARD_COPY: "opportunity_policy_hard_copy",
  POLICY_CONFIRMATION: "opportunity_policy_confirmation",
  POLICY_DOCKET: "opportunity_policy_docket",
  HAND_OVER_MEET: "opportunity_hand_over_meet",
};
// Smart Search - Employee Hierarchy regex
export const EMPLOYEE_ID_FOR_HIERARCHY_TREE_REGEX = /ownedBy:\[(\d+)\]/;
export const SEARCH_STRING_FOR_OPPORTUNITIES_FETCH_REGEX = /,?ownedBy:\[\d+\]/;

export const VALID_POLICY_TYPES = ["GMC", "GPA", "GTL"];
export const INSURER_PARTICIPANT_TYPE = {
  INSURER_PARTICIPATION_TYPE_LEAD: "INSURER_PARTICIPATION_TYPE_LEAD",
  INSURER_PARTICIPATION_TYPE_CO: "INSURER_PARTICIPATION_TYPE_CO",
};
export const SINGLE_INSURER = "SINGLE_INSURER";
export const MULTIPLE_INSURER = "MULTIPLE_INSURER";
export const DEFAULT_INSURER_DISPLAY_NAME = "Insurer Contacts";
export const DEFAULT_CO_INSURER_DISPLAY_NAME = "Co - insurer contacts";
export const DEFAULT_COMMUNICATION_TYPE_PHONE = "phone";
export const DEFAULT_COMMUNICATION_TYPE_MAP = "map";
export const DEFAULT_COMMUNICATION_DETAILS = "--";
export const DEFAULT_LOCATION = "--";
export const DEFAULT_CONTACT_NAME = "--";
export const DEFAULT_TPA_DISPLAY_NAME = "TPA Contacts";
export const REPLACED_KEYS: Record<string, string> = {
  sumInsured: "Sum Insured",
  brokeragePercentage: "Brokerage Percentage",
  policyFrom: "Policy From",
  policyTo: "Policy To",
  renewalDate: "Renewal Date",
  quoteReceiptTimeline: "Timeline for Quote Receipt",
  businessActivity: "Business Activities of Company",
  riskMitigationFeatures: "Other Risk Mitigation Features",
  clauses: "Other Clauses",
  insurerRemarks: "Insurer Remarks",
  remarks: "Remarks",
};
export const POLICY_DEFINITIONS_RELATIONSHIP = {
  RELATIONSHIP_DISPLAY_NAME: "Relationship",
  AGE_BAND_DISPLAY_NAME: "Age Band",
  MIN_AGE: 18,
  AVERAGE_AGE: 40,
  MAX_AGE: 85,
  CONFIGURATION_RELATIONSHIP: "Relationship",
  CONFIGURATION_FATHER: "Father",
  CONFIGURATION_AGE_LESS: "Less than 40",
  CONFIGURATION_AGE_MORE: "More than 40",
  MIN_RANGE: [1, 3],
  MAX_RANGE: [5, 10],
  TOTAL: [6, 13],
  MIN_COUNT: 2,
};

export const RELATIONSHIP_GROUP = {
  SELF: "self",
  DEPENDENT: "dependent",
} as const;

export const BUSINESS_TARGET_ENTITY_TYPE = {
  SO: "SO_POLICY",
  RO: "RO_POLICY",
  MINED: "MINED_POLICY",
  TOTAL: "TOTAL_POLICY",
  POLICY_PREMIUM: "POLICY_PREMIUM",
  BROKERAGE_COLLECTED: "BROKERAGE_COLLECTED",
  POLICY_PREMIUM_POLICY: "POLICY_PREMIUM_POLICY",
  POLICY_PREMIUM_ENDORSEMENT: "POLICY_PREMIUM_ENDORSEMENT",
  BROKERAGE_COLLECTED_POLICY: "BROKERAGE_COLLECTED_POLICY",
  BROKERAGE_COLLECTED_ENDORSEMENT: "BROKERAGE_COLLECTED_ENDORSEMENT",
  SO_ENDORSEMENT: "SO_ENDORSEMENT",
  RO_ENDORSEMENT: "RO_ENDORSEMENT",
  MINED_ENDORSEMENT: "MINED_ENDORSEMENT",
  TOTAL_ENDORSEMENT: "TOTAL_ENDORSEMENT",
  TOTAL_REWARD: "TOTAL_REWARD",
};
export const DEFAULT_EXCEL_FILE_NAME = {
  BROKING_SLIP: "Broking_Slip_Generation",
  QUOTE_COMPARISON_REPORT: "Quote_Comparison_Report",
  PLACEMENT_SLIP: "Placement_Slip_Generation",
  PLACEMENT_SLIP_FILE_NAME: "Placementslip",
};
export const DEFAULT_QUERY_TABLE = "main";
export const ENTITY_NAME = {
  OPPORTUNITY: "opportunity",
  CONTACT: "contact",
  COMPANY: "company",
  TPA: "tpa",
  INSURER: "insurer",
  BROKER: "broker",
  POLICY: "policy",
  EMPLOYEE: "employee",
  ENDORSEMENT: "endorsement",
  APPLICATION_SCHEDULER_CONFIGURATION: "application_scheduler_configuration",
  NOTIFICATION_INFO: "notification_info",
  CLAIM: "claim",
  CAUTION_DEPOSIT_TRANSACTION: "caution_deposit_transaction",
  REWARD: "reward",
  ENDORSEMENT_BATCH: "endorsement_batch",
  ENROLLMENT_UPLOAD_SUMMARY: "enrollment_upload_summary",
  CLAIM_UPLOAD_BATCH: "claim_upload_batch",
  POLICY_EXTENSION_AUDIT: "policy_extension_audit",
  POLICY_DOCUMENT: "policy_document",
  POLICY_INSTALLMENT: "policy_installment",
  POLICY_PREMIUM_RECEIPT: "policy_premium_receipt",
  POLICY_COMMISSION_STATEMENT: "policy_commission_statement",
  POLICY_INVOICE: "policy_invoice",
  POLICY_COLLECTION: "policy_collection",
};
export const ENTITY_SORT_FIELDS = {
  OPPORTUNITY: {
    policyType: "policyType.lookUpValue",
    opportunityType: "opportunityType.lookUpValue",
    companyName: "company.companyName",
    contacts: "opportunityContactMap.contact.displayName",
    priority: "company.priority.lookUpOrder",
    premium: "premiumPaid",
    estimatedBrokerage: "estimatedBrokerage",
    stageName: "opportunityActivityMap.stageName",
    activityName: "opportunityActivityMap.activityName",
    state: "status.lookUpValue",
    branch: "owner.branch.name",
    assignedTo: "owner.firstName",
    opportunityCreationDate: "createdAt",
    expectedCloseDate: "expiryDate",
    expiryDate: "expiryDate",
    industrySegment: "company.industrySegment.lookUpValue",
    sumInsured: "sumInsured",
    policyId: "refPolicy.insurerPolicyNumber",
    opportunityId: "opportunityId",
    isgManager: "isgId",
  },
  COMPANY: {
    displayName: "displayName",
    priority: "priority.lookUpOrder",
    policyPremium: "policyTotalPremium",
    soPremium: "soTotalPremium",
    roPremium: "roTotalPremium",
    brokerage: "brokerage",
    leadCRM: "owner.firstName",
    associateCrm: "associateCrmInfo.firstName",
    status: "status.lookUpValue",
    currency: "currency.value",
    sumInsured: "totalSumInsured",
    city: "companyAddresses.address.cityId.name",
    companyType: "companyType.lookUpValue",
    sentiment: "sentiment.lookUpValue",
    country: "country.name",
    companyName: "companyName",
    industrySegment: "industrySegment.lookUpValue",
    accountManager: "accountManager",
  },
  CONTACT: {
    contactName: "firstName",
    companyName: "company.companyName",
    email: "communicationDetails.communicationDetails",
    phone: "communicationDetails.communicationDetails",
    department: "department",
    designation: "designation",
    owner: "owner.firstName",
    status: "status.lookUpValue",
  },
  INSURER: {
    insurerName: "insurerName",
    insurerAddresses: "insurerAddresses.address.address1",
    cityId: "insurerAddresses.address.cityId.name",
    stateId: "insurerAddresses.address.stateId.name",
    phoneNumber: "insurerAddresses.address.phoneNumber",
    branchName: "insurerAddresses.address.branchName",
    branchCode: "insurerAddresses.address.branchCode",
    branchType: "insurerAddresses.address.branchType.lookUpValue",
  },
  TPA: {
    tpaName: "tpaName",
    tpaAddresses: "tpaAddresses.address.address1",
    cityId: "tpaAddresses.address.cityId.name",
    stateId: "tpaAddresses.address.stateId.name",
    phoneNumber: "tpaAddresses.address.phoneNumber",
  },
  BROKER: {
    brokerName: "brokerName",
    brokerAddresses: "brokerAddresses.address.address1",
    cityId: "brokerAddresses.address.cityId.name",
    stateId: "brokerAddresses.address.stateId.name",
    phoneNumber: "brokerAddresses.address.phoneNumber",
  },
  POLICY: {
    insurerPolicyNumber: "insurerPolicyNumber",
    companyName: "company.companyName",
    policyType: "policyType.lookUpValue",
    policyStatus: "policyStatus.lookUpValue",
    sumInsured: "sumInsured",
    premium: "premiumAtInception",
    policyFrom: "policyFrom",
    policyTo: "policyTo",
    startDate: "policyFrom",
    endDate: "policyTo",
    brokerage: "basicBrokerageAmount",
    bdOwner: "opportunity.owner.firstName",
    accountManager: "company.accountManagerInfo.firstName",
    policyStep: "policyConfigurations.policyStatus.lookUpValue",
    currency: "company.currency.name",
    brokerageAmount: "brokerageAmount",
    contacts: "opportunity.opportunityContactMap.contact.displayName",
    isgManager: "isgId",
    priority: "company.priority.lookUpOrder",
    industry: "company.industrySegment.lookUpValue",
    insurer: "insurerMappings.insurer.insurerName",
    businessMonth: "businessMonth",
    dateOfBusiness: "dateOfBusiness",
    opportunityId: "opportunityId",
    policyId: "id",
    // Aliases so ClientPortfolio/CompanyPolicies's column names (which
    // differ slightly from PolicyListing's) resolve to the same real paths.
    policyNumber: "insurerPolicyNumber",
    contact: "opportunity.opportunityContactMap.contact.displayName",
    status: "policyStatus.lookUpValue",
    // iirmPolicyType intentionally omitted: resolved via a two-hop batched
    // lookup outside the main query (policyTypeLid -> PolicyTypeSegregation
    // -> LookUp), not expressible as a relation path without restructuring
    // the query — see policy.repository.ts getAllPolicies/transformAllPoliciesResponse.
  },
  ENDORSEMENT: {
    companyName: "policy.company.companyName",
    policyNumber: "policy.insurerPolicyNumber",
    policyType: "policy.policyType.lookUpValue",
    companyPriority: "policy.company.priority.lookUpOrder",
    endorsementDate: "endorsement.endorsementDate",
    endorsementEntryDate: "endorsement.endorsementEntryDate",
    status: "endorsement.endorsementStatus",
    endorsementId: "endorsement.id",
    // TATDate, branchName, insurer, coInsurers, executive intentionally
    // omitted: TATDate is computed at request time (calcTatDays), and the
    // other four are populated in a post-fetch enrichment step after
    // pagination/sorting already ran on the base query (which only joins
    // endorsement+policy) — not sortable without restructuring that query.
    // See policy.repository.ts searchEndorsementManagementBatches.
  },
  EMPLOYEE: {
    iirmEmpId: "iirmEmpId",
    userId: "userId",
    firstName: "firstName",
    lastName: "lastName",
    emailId: "emailId",
    mobile: "mobile",
    designation: "designation.name",
    organisation: "organisation.name",
    vertical: "vertical.name",
    department: "department.name",
    branch: "branch.name",
    status: "statusLookup.lookUpValue",
    roles: "userRoles.role.name",
    sbu: "sbu.name",
  },
  APPLICATION_SCHEDULER_CONFIGURATION: {
    id: "id",
    schedulerName: "schedulerName",
    status: "status",
    lastSuccessfulRunAt: "lastSuccessfulRunAt",
    lastFailedRunAt: "lastFailedRunAt",
    lastRunStatus: "lastRunStatus",
    isEnabled: "isEnabled",
  },
  NOTIFICATION_INFO: {
    subject: "subject",
    createdAt: "createdAt",
  },
  // claim.list()'s query builder (claim.repository.ts findAllClaims) only
  // joins claim/policy/company/companyPriority/policyType — branchName,
  // insurer, coInsurers, and tpaName are attached in a separate post-fetch
  // enrichment step after pagination, so they aren't sortable at the DB
  // level without restructuring that query; intentionally left out here.
  CLAIM: {
    companyName: "company.companyName",
    // Displayed "claim number" isn't always claimInsuredId — ClaimListItemDto
    // falls back to claim.claimNumber, then claim.id, whenever
    // claimInsuredId is null (common). Sorting on claimInsuredId alone left
    // every null-claimInsuredId row with no real order. claimnumbersort is a
    // computed SELECT alias (see findAllClaims) mirroring that same fallback
    // chain — must be a bare, all-lowercase alias: a dotted expression fails
    // TypeORM's alias-prefix check (it looks up the text before the first
    // "." as a join alias), and an unquoted mixed-case alias gets folded to
    // lowercase in the generated SQL, so a case-preserved reference here
    // would no longer match it.
    claimNumber: "claimnumbersort",
    policyNumber: "policy.insurerPolicyNumber",
    policyType: "policyType.lookUpValue",
    companyPriority: "companyPriority.lookUpValue",
    claimDate: "claim.claimDate",
    status: "claim.claimStatus",
    claimAmount: "claim.claimAmount",
    // Used by findClaimsByPolicyId (PolicyDashboard's Track Claims table,
    // group-policy variant) — same joins as findAllClaims.
    employeeName: "employee.employeeName",
    claimType: "claim.claimType",
  },
  // getCautionDepositTransactionsByCautionDepositId's query builder selects
  // plain raw columns/aliases (not TypeORM entity relations), so every value
  // here must be a real join alias.column from that query, or a quoted
  // SELECT-list alias for computed expressions. creditAmount/debitAmount/
  // createdBy aren't selected as their own columns there (transactionAmount
  // is split into credit/debit and createdBy is assembled from first+last
  // name later), so they're intentionally left unsortable for now.
  CAUTION_DEPOSIT_TRANSACTION: {
    transactionDate: "cdt.transaction_date",
    description: "ld.value",
    type: "lt.value",
    balance: "cdt.cd_balance_amount",
    policyInsurerNumber: "policy.insurer_policy_number",
    policyType: "pt.value",
    endorsementNumber: "e.insurer_endorsement_number",
    endorsementType: "e.endorsement_type",
    neftRtgsRemark: "cdt.remarks",
    policyId: "policy.id",
    createdAt: "cdt.created_at",
  },
  // reward.repository.ts's findAll() query builder aliases the root as "r"
  // and joins insurer/rewardCategory/rewardType — values below match those
  // aliases. businessMonths/docMaps intentionally omitted: one-to-many
  // relations, no single orderable value.
  REWARD: {
    rewardCategory: "rewardCategory.lookUpValue",
    // Insurer entity's TypeORM property is `insurerName` (mapped from db
    // column "name") — TypeORM's alias-column lookup resolves by property
    // path, not raw column name, so "insurer.name" throws ("Cannot read
    // properties of undefined (reading 'databaseName')") despite "name"
    // being the real column.
    insurer: "insurer.insurerName",
    dateOfIncome: "r.dateOfIncome",
    // Hidden "Date of income" column (dateOfIncomeRaw) — same underlying
    // column as dateOfIncome, just a different display format.
    dateOfIncomeRaw: "r.dateOfIncome",
    rewardAmount: "r.rewardAmount",
    remarks: "r.remarks",
    createdAt: "r.createdAt",
  },
  // policy.repository.ts's listEndorsementBatches() query only has an
  // "endorsement" alias (no joins) — status/totalCount/uploadedBy/fileName
  // are all computed in a post-fetch loop over the paginated page, so they
  // aren't sortable here without restructuring that query.
  ENDORSEMENT_BATCH: {
    endorsementSentDate: "endorsement.endorsementDate",
    endorsementId: "endorsement.id",
    endorsementType: "endorsement.endorsementType",
    addition: "endorsement.employeeEndorsementAdditionCount",
    deletion: "endorsement.employeeEndorsementDeletionCount",
    remarks: "endorsement.remarks",
    netPremium: "endorsement.netPremium",
    grossPremium: "endorsement.grossPremium",
    brokerage: "endorsement.basicBrokerageAmount",
    confirmationId: "endorsement.insurerEndorsementNumber",
    tpaErrorCount: "endorsement.tpaErrorCount",
    acknowledgementRecievedDate: "endorsement.insurerEndorsementDate",
  },
  // policy.repository.ts's listEnrollmentUploadSummary() query — shared by
  // EmployeeBatch and PolicyEmployeeDataTab's tables. sourceFile.fileName is
  // derived via path.basename(item.document.fileKey) (a transform, not a
  // plain column) and batchId falls back to documentProcessingFileId when
  // null — both intentionally omitted; disableSort on those two frontend
  // columns instead.
  ENROLLMENT_UPLOAD_SUMMARY: {
    createdAt: "sourceFile.createdAt",
    "documentProcessingFile.enrollmentStartDate": "upload.enrollmentStartDate",
    "documentProcessingFile.enrollmentEndDate": "upload.enrollmentEndDate",
    "documentProcessingFile.processStatus": "upload.processStatus",
    "documentProcessingFile.updatedAt": "upload.updatedAt",
    "sourceFile.fileSize": "sourceFile.fileSize",
    processCount: "summary.processCount",
    successCount: "summary.successCount",
    errorCount: "summary.errorCount",
    // PolicyEmployeeDataTab renders the same endpoint under different
    // column names (via valueGetter, not field-path access) — aliases so
    // its "Success"/"Reject"/"Status" headers resolve to the same columns.
    success: "summary.successCount",
    reject: "summary.errorCount",
    status: "upload.processStatus",
  },
  // claim.repository.ts's findTpaUploadBatches() — totalClaimRecords/
  // processedClaims display COALESCE(summary.X, 0) but ordering by the
  // underlying column directly is an acceptable approximation (same
  // relative order except at the null boundary). totalPendingClaims/
  // totalSettledClaims aren't real frontend columns on this table.
  CLAIM_UPLOAD_BATCH: {
    claimBatchId: "doc.id",
    claimCreatedDate: "doc.createdAt",
    totalClaimRecords: "summary.processCount",
    processedClaims: "summary.successCount",
    status: "doc.processStatus",
    // Also used by ClaimsDataUpload/ClaimsUploadBatchTable, which render a
    // wider slice of the same ClaimBatchItemDto response. fileName is
    // path.basename(fileKey) (a transform, not a plain column) and
    // totalPendingClaims/totalSettledClaims are COUNT(CASE...) aggregates —
    // none of the three have a single sortable column; disableSort on the
    // frontend instead.
    totalSuccess: "summary.successCount",
    totalFail: "summary.errorCount",
    processingCompletedAt: "doc.updatedAt",
  },
  // PolicyExtensionAudit — every rendered column is a plain column, no joins.
  POLICY_EXTENSION_AUDIT: {
    createdAt: "createdAt",
    policyId: "policyId",
    endorsementType: "endorsementType",
    previousPolicyToDate: "previousPolicyToDate",
    extensionDate: "extensionDate",
    status: "status",
    remarks: "remarks",
  },
  // getDocumentsByPolicyId's final query is raw SQL (a UNION ALL of several
  // subqueries aliased as "allFiles"); values here are the raw, lower-cased
  // quoted column names as they exist after Postgres's UNION-driven
  // identifier folding, used directly in an ORDER BY string (not via
  // buildOrderCondition, which assumes a TypeORM Repository).
  POLICY_DOCUMENT: {
    osTicketNumber: `allFiles."osticketnumber"`,
    fileName: `allFiles."filekey"`,
    documentName: `allFiles."documentname"`,
    activityName: `allFiles."activityname"`,
    subActivityName: `allFiles."subactivityname"`,
    uploadedBy: `allFiles."uploadername"`,
    uploadedAt: `allFiles."uploadedat"`,
  },
  // getPolicyInstallmentDetailsById loads all of a policy's installments
  // (a small in-memory array, not a paginated query) and sorts/paginates in
  // JS — these values are self-referential; they only serve mapSortParams's
  // whitelist check, the actual field->value lookup happens in a small
  // accessor map in policy.repository.ts. sourceFile.fileName (a
  // path.basename transform) is intentionally omitted.
  POLICY_INSTALLMENT: {
    installmentSequence: "installmentSequence",
    insurerEndorsementNumber: "insurerEndorsementNumber",
    installmentDate: "installmentDate",
    installmentPercentage: "installmentPercentage",
    installmentNetAmount: "installmentNetAmount",
    premiumCollectionDate: "premiumCollectionDate",
    premiumCollectedAmount: "premiumCollectedAmount",
    taxPercentage: "taxPercentage",
    taxAmount: "taxAmount",
    collectedGrossAmount: "collectedGrossAmount",
    transactionMode: "transactionMode",
    invoiceNo: "invoiceNo",
    transactionChequeNumber: "transactionChequeNumber",
    bankName: "bankName",
    status: "status",
  },
  // PolicyDetails' BrokerageInfoTable sub-tables — each is a plain
  // unpaginated query builder over a small per-policy dataset.
  POLICY_PREMIUM_RECEIPT: {
    prMapped: "pr.prMapped",
    prId: "pr.prId",
    prName: "pr.prName",
    prBrokerage: "pr.prBrokerage",
    prPremium: "pr.prPremium",
  },
  POLICY_COMMISSION_STATEMENT: {
    commissionStatementMapped: "cs.commissionStatementMapped",
    commissionStatementId: "cs.commissionStatementId",
    commissionStatementName: "cs.commissionStatementName",
    commissionStatementBrokerage: "cs.commissionStatementBrokerage",
    commissionStatementPremium: "cs.commissionStatementPremium",
  },
  POLICY_INVOICE: {
    invoiced: "inv.invoiced",
    invoiceNumber: "inv.invoiceNumber",
    invoiceDate: "inv.invoiceDate",
    invoicedBrokerage: "inv.invoicedBrokerage",
  },
  POLICY_COLLECTION: {
    collected: "col.collected",
    utrNumber: "col.utrNumber",
    utrDate: "col.utrDate",
    collectedAmount: "col.collectedAmount",
  },
};
export const REQUEST_ACCESS = {
  VIEW: "view",
  EDIT: "edit",
};

export const DATA_TYPES = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  DATE: "date",
  ARRAY: "array",
  OBJECT: "object",
  VARCHAR: "varchar",
  TEXT: "text",
  INT: "int",
  INTEGER: "integer",
  BIGINT: "bigint",
  FLOAT: "float",
  DECIMAL: "decimal",
  TIMESTAMP: "timestamp",
  TIMESTAMPTZ: "timestamptz",
  DATETIME: "datetime",
  TIMESTAMP_WITH_TIMEZONE: "timestamptz",
};

export enum POLICY_FAQ_HEADERS {
  SNO = "S. No",
  CATEGORY = "category",
  FAQ_QUESTION = "Question",
  FAQ_ANSWER = "Answer",
}

export enum POLICY_FAQ_UPLOAD_STATUS {
  PROCESSING = "FAQ_UPLOAD_FILE_PROCESSING",
  COMPLETED = "FAQ_UPLOAD_COMPLETED",
  COMPLETED_WITH_ERRORS = "FAQ_UPLOAD_COMPLETED_WITH_ERRORS",
  FAILED = "FAQ_UPLOAD_FAILED",
}

export const FIELDS_TO_EXCLUDE = [
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
];
export const DEFAULT_SORT = "createdAt:DESC";
export const MEETING_FIELDS = {
  OUTCOME_ID: "outcomeId",
  CHALLENGE_ID: "challengeId",
  NEXT_STEP_ID: "nextStepId",
};
export const POLICY_STATUS_MIG_IN_ACTIVE = "POLICY_STATUS_MIG_IN_ACTIVE";
export const POLICY_STATUS_MIG_ACTIVE = "POLICY_STATUS_MIG_ACTIVE";
export const POLICY_STATUS_MIG_RENEWAL_ON = "POLICY_STATUS_MIG_RENEWAL_ON";
export const POLICY_STATUS_MIG_CANCELLED = "POLICY_STATUS_MIG_CANCELLED";
export const POLICY_STATUS_MIG_CLOSED_AT_EXPIRY =
  "POLICY_STATUS_MIG_CLOSED_AT_EXPIRY";
export const POLICY_STATUS_MIG_POLICY_CLOSED =
  "POLICY_STATUS_MIG_POLICY_CLOSED";
export const POLICY_STATUS_MIG_POLICY_CLOSED_FORM_RENEWAL_DATE_NOT_EXP_DATE =
  "POLICY_STATUS_MIG_POLICY_CLOSED_FORM_RENEWAL_DATE_NOT_EXP_DATE";
export const POLICY_STATUS_MIG_POLICY_CLOSED_BECAUSE_OF_REPERFORMING_PLACEMENT_SLIP =
  "POLICY_STATUS_MIG_POLICY_CLOSED_BECAUSE_OF_REPERFORMING_PLACEMENT_SLIP";
export const POLICY_STATUS_MIG_GENERATED = "POLICY_STATUS_MIG_GENERATED";
export const POLICY_CONFIGURATION_SEED_REMARKS =
  "Old Policy: configuration created during reconfiguration";
export const TOGGLE_TYPE = {
  TOGGLE_TYPE_YES: "TOGGLE_TYPE_YES",
  TOGGLE_TYPE_NO: "TOGGLE_TYPE_NO",
};
export const POLICY_COMPONENT_UPLOAD_DEFAULTS = {
  DRY_RUN: false,
  MIGRATION_USER_ID: 2,
  CLUB_SUM_INSURED_TRUE_LID: TOGGLE_TYPE.TOGGLE_TYPE_YES,
  CLUB_SUM_INSURED_FALSE_LID: TOGGLE_TYPE.TOGGLE_TYPE_NO,
} as const;
export const ACTIVITY_SEARCH_STATUS_KEY = "opportunityActivityMap.status_lid";

export const DOCUMENT_PROCESS_STATUS = {
  CREATED: "CREATED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export const DOCUMENT_TYPE_POLICY_EMPLOYEE_DATA = "policy_employee_data";
export const DOCUMENT_TYPE_POLICY_TPA_ID_UPLOAD = "policy_tpa_id_upload";
export const DOCUMENT_TYPE_POLICY_ENDORSEMENT_CREATION =
  "policy_endorsement_creation";
export const DOCUMENT_TYPE_POLICY_ENDORSEMENT_MEMBER_UPLOAD =
  "policy_endorsement_member_upload";
export const COMPANY_LIST_COLOUR = {
  GREEN: "GREEN",
  AMBER: "AMBER",
  RED: "RED",
} as const;

export const POLICY_PERFORMANCE_FIELDS = {
  BROKERAGE: "BROKERAGE",
  AMOUNT: "AMOUNT",
  PERCENTAGE: "PERCENTAGE",
  TOTAL: "TOTAL",
  PREMIUM_COLLECTED: "PREMIUM_COLLECTED",
  BROKERAGE_COLLECTED: "BROKERAGE_COLLECTED",
  REWARD: "REWARD",
};

// TPA related constants
export const EMPLOYEE_ID_HEADERS_FOR_TPA_FILE = [
  "employeeid",
  "companyemployeeid",
  "employeenumber",
];
export const EMPLOYEE_ID_HEADER_LABEL = "employee_id";
export const TPA_ID_HEADER_LABEL = "tpa_id";
export const POSSIBLE_EMPLOYEE_ID_HEADERS_FOR_TPA_FILE: string[] = [
  "employee_id",
  "company_employee_id",
  "employeeid",
  "employee id",
  "companyemployeeid",
  "company employee id",
  "employee number",
  "employee_number",
];

export const POSSIBLE_EMPLOYEE_NAME_HEADERS_FOR_TPA_FILE: string[] = [
  "INSUREDNAME",
  "Name",
  "EMPLOYEENAME",
  "EmployeeName",
  "employee_name",
  "employee name",
];

export const POSSIBLE_EMPLOYEE_GENDER_HEADERS_FOR_TPA_FILE: string[] = [
  "Gender",
  "gender",
  "GENDER",
  "EMPLOYEEGENDER",
];

export const ENROLLMENT_TPA_ID_HEADERS = [
  "tpa_id",
  "tpaid",
  "employee_tpa_id",
  "employee tpa id",
  "tpa id"
];

export const UTILITY_UPLOAD_ENTITY_TPA = "TPA_UPLOAD";
export const FILE_DIRECTION_INBOUND = "INBOUND";
export const ERROR_TPA_ID_REQUIRED = "TPA ID is required";
export const ERROR_MAPPING_TEMPLATE_ID_REQUIRED =
  "Missing mapping template identifier";
export const ERROR_MAPPED_SOURCE_COLUMN_NOT_FOUND_PREFIX =
  "Mapped source column not found in Excel";
export const ERROR_MISSING_MAPPING_FOR_TARGET_PREFIX =
  "Missing mapping for target";

// ENROLLMENT FIELD HEADERS for error matching
export const ENROLLMENT_FIELD_HEADERS: Record<string, string[]> = {
  EMPLOYEE_ID: ["Employee ID", "Employee Id"],
  FULL_NAME: ["Full Name", "Full name"],
  RELATION: ["Relation", "Relationship", "Relationship Type"],
  DATE_OF_BIRTH: ["Date of Birth", "DOB", "Dob", "dob"],
  POLICY_LOCATION: ["Policy Location"],
} as const;

export const POLICY_LOCATION_FIELD_NAME = "Location Code";
export const POLICY_LOCATION_COLUMN_NAME = "location_code";
export const POLICY_LOCATION_REQUIRED_ERROR = "Location Code is required";
export const POLICY_LOCATION_MISMATCH_ERROR =
  "Location Code does not match any configured Associated Location address for this company";
export const ADDRESS_TYPE_POLICY_LOCATION = "ADDRESS_TYPE_ASSOCIATED_LOCATION";

export const DOCUMENT_TYPES = {
  MANDATE:"mandate",
  POLICY_FEATURE_DOCUMENT:"policy_feature_document"
}

// ENDORSEMENT TYPES related constants
export const ENDORSEMENT_TYPES = {
  FINANCIAL_ENDORSEMENT: "FINANCIAL_ENDORSEMENT",
  NON_FINANCIAL_ENDORSEMENT: "NON_FINANCIAL_ENDORSEMENT",
};

//NON_FINANCIAL_CONSTANTS
export const NON_FINANCIAL_CONSTANTS = {
  AGE: "age",
  GENDER: "gender",
  FULL_NAME: "fullname",
  MAX_AGE: 999,
  MIN_AGE: 0
}
//CD Details related constants
export const CD_ACCOUNT_STATUS_LOOKUP_NAME = "CD_ACCOUNT_STATUS";
export const CD_ACCOUNT_STATUS_ACTIVE = "CD_ACCOUNT_ACTIVE";
export const CD_ACCOUNT_STATUS_INACTIVE = "CD_ACCOUNT_INACTIVE";
export const CREDIT_BALANCE_TRANSACTION_KEY = "CREDIT_TRANSACTION";
export const DEBIT_BALANCE_TRANSACTION_KEY = "DEBIT_TRANSACTION";
export const CD_ACCOUNT_TOGGLE_NEW = "CD_ACCOUNT_TOGGLE_NEW";
export const TRANSACTION_TYPE_NEFT = "TRANSACTION_TYPE_NEFT";
export const ENDORSEMENT_TRANSACTION_REMARK =
  "This is a debit transaction recorded for the endorsement with ID:";
export const THE_CD_BALANCE_IS_BELOW_THE_THRESHHOLD_PLEASE_REFILL_ASAP =
  "The CD balance is below the threshold. Please refill ASAP";
export const CD_BALANCE_THRESHHOLD_PERCENTAGE_VALUE = 0.2;
export const ACCOUNT_NUMBER_PLACEHOLDER = "Account Number: ";

export const MONTHS_IN_YEAR_WITH_INDEX = [
  { name: "April", index: 4 },
  { name: "May", index: 5 },
  { name: "June", index: 6 },
  { name: "July", index: 7 },
  { name: "August", index: 8 },
  { name: "September", index: 9 },
  { name: "October", index: 10 },
  { name: "November", index: 11 },
  { name: "December", index: 12 },
  { name: "January", index: 1 },
  { name: "February", index: 2 },
  { name: "March", index: 3 },
];

export const MONTHS_WITH_QUARTERS = [
  "April",
  "May",
  "June",
  "Q1",
  "July",
  "August",
  "September",
  "Q2",
  "October",
  "November",
  "December",
  "Q3",
  "January",
  "February",
  "March",
  "Q4",
];

export const MONTHS_WITH_QUARTERS_ENUM = {
  APRIL: "April",
  MAY: "May",
  JUNE: "June",
  Q1: "Q1",
  JULY: "July",
  AUGUST: "August",
  SEPTEMBER: "September",
  Q2: "Q2",
  OCTOBER: "October",
  NOVEMBER: "November",
  DECEMBER: "December",
  Q3: "Q3",
  JANUARY: "January",
  FEBRUARY: "February",
  MARCH: "March",
  Q4: "Q4",
};

//Owner types for smart search
export const OWNER_TYPES = {
  MANAGER: "manager",
  TEAM: "team",
};

export const ACTION_TYPE = {
  SAVE: "save",
  SUBMIT: "submit",
};

export const NON_GROUP_CLAIM_STATUS = {
  CREATE: "NON_GROUP_CLAIM_STATUS_CREATED",
};

export const NON_GROUP_CLAIM_ACTIVITY_STATUS = {
  DRAFT: "NON_GROUP_CLAIM_ACTIVITY_DRAFT",
  SAVE: "NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS",
  SUBMIT: "NON_GROUP_CLAIM_ACTIVITY_SUBMIT",
};

export const VALIDATE_CLAIM_ACTIVITY_DATE: Record<
  string,
  { table: string; activityTable: string; column: string; columnName: string }
> = {
  claim_fnol_details: {
    table: "ClaimInformed",
    activityTable: "claim_informed",
    column: "intimationDatetime",
    columnName: "Intimation Date & Time",
  },
  claim_loss_adjuster_details: {
    table: "ClaimFnolDetails",
    activityTable: "claim_fnol_details",
    column: "fnolSentDate",
    columnName: "FNOL Sent Date",
  },
  claim_survey_completed: {
    table: "ClaimLossAdjusterDetails",
    activityTable: "claim_loss_adjuster_details",
    column: "adjusterAppointmentDate",
    columnName: "Adjuster Appointment Date",
  },
  claim_documents_collected: {
    table: "ClaimSurveyCompleted",
    activityTable: "claim_survey_completed",
    column: "surveyDate",
    columnName: "Survey Date",
  },
  claim_joint_inspection_report: {
    table: "ClaimSurveyCompleted",
    activityTable: "claim_survey_completed",
    column: "surveyDate",
    columnName: "Survey Date",
  },
  claim_lor_details: {
    table: "ClaimJointInspectionReport",
    activityTable: "claim_joint_inspection_report",
    column: "inspectionDate",
    columnName: "Inspection Date",
  },
  claim_document_submission_tracker: {
    table: "ClaimLorDetails",
    activityTable: "claim_lor_details",
    column: "lorIssuedDate",
    columnName: "LOR Issued Date",
  },
  claim_assessment_report: {
    table: "ClaimLorDetails",
    activityTable: "claim_lor_details",
    column: "lorIssuedDate",
    columnName: "LOR Issued Date",
  },
  claim_validation_report: {
    table: "ClaimAssessmentReport",
    activityTable: "claim_assessment_report",
    column: "reportDate",
    columnName: "Assessment Report Date",
  },
  claim_settlement: {
    table: "ClaimValidationReport",
    activityTable: "claim_validation_report",
    column: "validationDate",
    columnName: "Validation Report Date",
  },
  claim_discharge_voucher: {
    table: "PolicyClaimSettlement",
    activityTable: "claim_settlement",
    column: "settlementDate",
    columnName: "Settlement Date",
  },
  claim_customer_agreement: {
    table: "ClaimDischargeVoucher",
    activityTable: "claim_discharge_voucher",
    column: "dischargeVoucherDate",
    columnName: "Discharge Voucher Date",
  },
  claim_voucher_to_insurer: {
    table: "ClaimCustomerAgreement",
    activityTable: "claim_customer_agreement",
    column: "agreementDate",
    columnName: "Customer Agreement Date",
  },
  claim_payment: {
    table: "ClaimVoucherToInsurer",
    activityTable: "claim_voucher_to_insurer",
    column: "sentToInsurerDate",
    columnName: "Voucher Sent to Insurer Date",
  },
};

export const DOCUMENT_STATUS = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
};

// Endorsement new flow related constants
export const DEFAULT_ENDORSEMENT_STEP_DATA: Record<string, any> = {
  ENDORSEMENT_REQUEST_RECEIVED: {
    endorsementRequestReceived: {
      osTicketNumber: "",
      endorsementRequestReceivedDate: "",
      enrollmentStartDate: "",
      enrollmentEndDate: "",
      endorsementType: "",
    },
  },
  CREATE_ENDORSEMENT: {
    createEndorsement: {
      endorsementCreatedDate: "",
      provisionalEndorsementNumber: "",
    },
    premiumPaymentTerm: {
      paymentMethod: "",
      transactionOrChequeNumber: "",
      paymentDate: "",
      paymentAmount: null,
    },
    createEndorsementRemarks: {
      endorsementDetails: "",
    },
    endorsementSummary: {
      totalEmployees: null,
      totalDependents: null,
      totalLives: null,
      cdBalance: null,
    },
    inceptionBrokerageDetails: {
      basicBrokeragePercentage: null,
      basicBrokerageAmount: null,
    },
  },
  SEND_ENDORSEMENT_TO_INSURER: {
    sendEndorsementToInsurer: {
      insurerCommunicationDate: "",
    },
    endorsementDocumentContainer: {
      fileId: null,
      fileName: "",
      generatedDate: "",
    },
    communicationDetails: {
      communicationDetails: "",
    },
  },
  RECEIVE_INSURER_ACKNOWLEDGEMENT: {
    acknowledgementFromInsurer: {
      acknowdgementDate: "",
      insurerEndorsementNumber: null,
      noOfEmployees: null,
      noOfDependents: null,
      endorsementEffectiveDate: "",
      incomeEffectiveDate: "",
    },
    premiumDetails: {
      endorsementPremiumAmount: null,
      terrorismPremiumAmount: null,
      gstAmount: null,
      totalPremiumAmount: null,
    },
    endorsementPolicyDocumentId: null,
  },
  CLIENT_CONFIRMATION: {
    clientConfirmation: {
      clientConfirmationDate: "",
    },
    messageDetails: {
      messageDetails: "",
    },
    clientDocuments: {
      endorsementData: {
        endorsementFileId: null,
        endorsementCreatedDate: "",
        endorsementFileName: "",
      },
      insurerPolicyDocument: {
        insurerPolicyDocumentId: null,
        insurerPolicyCreatedDate: "",
        insurerPolicyFileName: "",
      },
    },
  },
};

export const DEFAULT_NON_GMC_ENDORSEMENT_STEP_DATA: Record<string, any> = {
  ENDORSEMENT_REQUEST_RECEIVED: {
    endorsementRequestReceived: {
      osTicketNumber: "",
      endorsementRequestReceivedDate: "",
      enrollmentStartDate: "",
      enrollmentEndDate: "",
      endorsementType: "",
    },
  },
  CREATE_ENDORSEMENT: {
    createEndorsement: {
      endorsementCreatedDate: "",
      provisionalEndorsementNumber: "",
    },
    premiumPaymentTerm: {
      paymentMethod: "",
      transactionOrChequeNumber: "",
      paymentDate: "",
      paymentAmount: null,
    },
    createEndorsementRemarks: {
      endorsementDetails: "",
    },
    endorsementSummary: {
      totalAssets: null,
      totalSubAssets: null,
      total: null,
      cdBalance: null,
    },
    inceptionBrokerageDetails: {
      basicBrokeragePercentage: null,
      basicBrokerageAmount: null,
    },
  },
  SEND_ENDORSEMENT_TO_INSURER: {
    sendEndorsementToInsurer: {
      insurerCommunicationDate: "",
    },
    endorsementDocumentContainer: {
      fileId: null,
      fileName: "",
      generatedDate: "",
    },
    communicationDetails: {
      communicationDetails: "",
    },
  },
  RECEIVE_INSURER_ACKNOWLEDGEMENT: {
    acknowledgementFromInsurer: {
      acknowdgementDate: "",
      insurerEndorsementNumber: null,
      noOfAssets: null,
      noOfSubAssets: null,
      endorsementEffectiveDate: "",
      incomeEffectiveDate: "",
    },
    premiumDetails: {
      endorsementPremiumAmount: null,
      terrorismPremiumAmount: null,
      gstAmount: null,
      totalPremiumAmount: null,
    },
    endorsementPolicyDocumentId: null,
  },
  CLIENT_CONFIRMATION: {
    clientConfirmation: {
      clientConfirmationDate: "",
    },
    messageDetails: {
      messageDetails: "",
    },
    clientDocuments: {
      endorsementData: {
        endorsementFileId: null,
        endorsementCreatedDate: "",
        endorsementFileName: "",
      },
      insurerPolicyDocument: {
        insurerPolicyDocumentId: null,
        insurerPolicyCreatedDate: "",
        insurerPolicyFileName: "",
      },
    },
  },
  TPA_ID_UPLOAD: {
    tpaIdUpload: {
      tpaFileId: null,
      tpaIdUploadDate: "",
      tpaUploadRemarks: "",
    },
  },
};

export const ENDORSEMENT_STEP_FIELD_MAP: Record<
  string,
  Record<string, string>
> = {
  endorsementRequestReceived: {
    osTicketNumber: "osTicketNumber",
    endorsementRequestReceivedDate: "endorsementEntryDate",
    enrollmentStartDate: "enrollmentStartDate",
    enrollmentEndDate: "enrollmentEndDate",
    endorsementType: "endorsementType",
  },
  createEndorsement: {
    endorsementCreatedDate: "endorsementDate",
    provisionalEndorsementNumber: "provisionalEndorsementNumber",
    createEndorsementRemarks: "remarks",
    totalEmployees: "endorsmentCount",
    totalDependents: "endorsmentDependentCount",
    totalLives: "endorsmentCount",
    netPremium: "netPremium",
    grossPremium: "grossPremium",
    additionCount: "additionCount",
    deletionCount: "deletionCount",
  },
  sendEndorsementToInsurer: {
    insurerCommunicationDate: "insurerCommunicationDate",
    endorsementFileId: "endorsmentFileId",
    communicationDetails: "insurerCommunicationDetails",
  },
  receiveInsurerAcknowledgement: {
    acknowdgementDate: "insurerEndorsementDate",
    incomeEffectiveDate: "dateOfIncome",
    insurerEndorsementNumber: "insurerEndorsementNumber",
    endorsementEffectiveDate: "endorsementEffectiveDate",
    endorsementPolicyDocumentId: "ackFileId",
    noOfEmployees: "insurerEndorsedEmployeeCount",
    noOfDependents: "insurerEndorsedDependentCount",
    endorsementPremiumAmount: "netPremium",
    totalPremiumAmount: "grossPremium",
    gstAmount: "gstAmount",
    terrorismPremiumAmount: "terrorismAmount",
  },
  clientConfirmation: {
    clientConfirmationDate: "clientConfirmationDate",
    messageDetails: "clientConfirmationMessage",
  },
  tpaIdUpload: {
    tpaFileId: "tpaFileId",
    tpaIdUploadDate: "tpaIdUploadDate",
    tpaUploadRemarks: "tpaUploadRemarks",
  },
};

export const NON_GMC_ENDORSEMENT_STEP_FIELD_MAP: Record<
  string,
  Record<string, string>
> = {
  endorsementRequestReceived: {
    osTicketNumber: "osTicketNumber",
    endorsementRequestReceivedDate: "endorsementEntryDate",
    endorsementType: "endorsementType",
  },
  createEndorsement: {
    endorsementCreatedDate: "endorsementDate",
    provisionalEndorsementNumber: "provisionalEndorsementNumber",
    createEndorsementRemarks: "remarks",
    totalAssets: "endorsmentAssetCount",
    totalSubAssets: "endorsementSubAssetCount",
    total: "endorsmentAssetCount",
    netPremium: "netPremium",
    grossPremium: "grossPremium",
    additionCount: "additionCount",
    deletionCount: "deletionCount",
  },
  sendEndorsementToInsurer: {
    insurerCommunicationDate: "insurerCommunicationDate",
    endorsementFileId: "endorsmentFileId",
    communicationDetails: "insurerCommunicationDetails",
  },
  receiveInsurerAcknowledgement: {
    acknowdgementDate: "insurerEndorsementDate",
    incomeEffectiveDate: "dateOfIncome",
    insurerEndorsementNumber: "insurerEndorsementNumber",
    endorsementEffectiveDate: "endorsementEffectiveDate",
    endorsementPolicyDocumentId: "ackFileId",
    noOfAssets: "insurerEndorsedEmployeeCount",
    noOfSubAssets: "insurerEndorsedDependentCount",
    endorsementPremiumAmount: "netPremium",
    totalPremiumAmount: "grossPremium",
    gstAmount: "gstAmount",
    terrorismPremiumAmount: "terrorismAmount",
  },
  clientConfirmation: {
    clientConfirmationDate: "clientConfirmationDate",
    messageDetails: "clientConfirmationMessage",
  },
};

export const NON_GMC_ENDORSEMENT_TYPES = {
  ENDORSEMENT_REQUEST_RECEIVED: "ENDORSEMENT_REQUEST_RECEIVED",
  CLIENT_CONFIRMATION: "CLIENT_CONFIRMATION",
  CREATE_ENDORSEMENT: "CREATE_ENDORSEMENT",
  SEND_ENDORSEMENT_TO_INSURER: "SEND_ENDORSEMENT_TO_INSURER",
  RECEIVE_INSURER_ACKNOWLEDGEMENT: "RECEIVE_INSURER_ACKNOWLEDGEMENT",
};

export const ENDORSEMENT_STEPS = {
  ...NON_GMC_ENDORSEMENT_TYPES,
  TPA_ID_UPLOAD: "TPA_ID_UPLOAD",
};

export const ENDORSEMENT_PREMIUM_PAYMENT_TYPE = {
  DIRECT_BANK_TRANSFER: "DIRECT_BANK_TRANSFER",
  CD_BALANCE: "CD_BALANCE",
};

export const NON_GMC_ENDORSEMENT_UPDATE_KEYS = {
  ENDORSEMENT_REQUEST_RECEIVED: "endorsementRequestReceived",
  CREATE_ENDORSEMENT: "createEndorsement",
  SEND_ENDORSEMENT_TO_INSURER: "sendEndorsementToInsurer",
  RECEIVE_INSURER_ACKNOWLEDGEMENT: "receiveInsurerAcknowledgement",
  CLIENT_CONFIRMATION: "clientConfirmation",
};

export const ENDORSEMENT_UPDATE_KEYS = {
  ...NON_GMC_ENDORSEMENT_UPDATE_KEYS,
  TPA_ID_UPLOAD: "tpaIdUpload",
};

export const CREATE_ENDORSEMENT_UPDATE_KEYS = {
  ENDORSEMENT_FILE_ID: "endorsmentFileId",
  ENDORSEMENT_DATE: "endorsementDate",
  PROVISIONAL_ENDORSEMENT_NUMBER: "provisionalEndorsementNumber",
  INSURER_ENDORSEMENT_NUMBER: "insurerEndorsementNumber",
  REMARKS: "remarks",
  ENDORSEMENT_COUNT: "endorsmentCount",
  SUM_INSURED: "sumInsured",
  PREMIUM_AT_INCEPTION: "premiumAtInception",
  GROSS_PREMIUM_AMOUNT: "grossPremium",
  NET_PREMIUM_AMOUNT: "netPremium",
  GST_AMOUNT: "gstAmount",
  TERRORISM_AMOUNT: "terrorismAmount",
  BASIC_BROKERAGE_PERCENTAGE: "basicBrokeragePercentage",
  BASIC_BROKERAGE_AMOUNT: "basicBrokerageAmount",
  COMMISSION_TERRORISM_AMOUNT: "commissionTerrorismAmount",
  ENDORSEMENT_DEPENDENT_COUNT: "endorsmentDependentCount",
  EMPLOYEE_ENDORSEMENT_ADDITION_COUNT: "employeeEndorsementAdditionCount",
  EMPLOYEE_ENDORSEMENT_DELETION_COUNT: "employeeEndorsementDeletionCount",
  CLIENT_MAPPING_FILE_ID: "clientMappingFileId",
  CLIENT_MAPPING_FILE_ID_CREATED_AT: "clientMappingFileIdCreatedAt"
};

export const CREATE_NON_GMC_ENDORSEMENT_UPDATE_KEYS = {
  ENDORSEMENT_FILE_ID: "endorsmentFileId",
  ENDORSEMENT_DATE: "endorsementDate",
  PROVISIONAL_ENDORSEMENT_NUMBER: "provisionalEndorsementNumber",
  INSURER_ENDORSEMENT_NUMBER: "insurerEndorsementNumber",
  REMARKS: "remarks",
  ENDORSEMENT_ASSET_COUNT: "endorsmentAssetCount",
  ENDORSEMENT_SUB_ASSET_COUNT: "endorsmentSubAssetCount",
  SUM_INSURED: "sumInsured",
  PREMIUM_AT_INCEPTION: "premiumAtInception",
  GROSS_PREMIUM_AMOUNT: "grossPremium",
  NET_PREMIUM_AMOUNT: "netPremium",
  GST_AMOUNT: "gstAmount",
  TERRORISM_AMOUNT: "terrorismAmount",
  BASIC_BROKERAGE_PERCENTAGE: "basicBrokeragePercentage",
  BASIC_BROKERAGE_AMOUNT: "basicBrokerageAmount",
  COMMISSION_TERRORISM_AMOUNT: "commissionTerrorismAmount",
  ENDORSEMENT_ADDITION_COUNT: "endorsementAdditionCount",
  ENDORSEMENT_DELETION_COUNT: "endorsementDeletionCount",
};

export const SEND_ENDORSEMENT_TO_INSURER_UPDATE_KEYS = {
  INSURER_COMMUNICATION_DETAILS: "insurerCommunicationDetails",
  INSURER_COMMUNICATION_DATE: "insurerCommunicationDate",
};

export const RECEIVE_INSURER_ACKNOWLEDGEMENT_UPDATE_KEYS = {
  INSURER_ENDORSEMENT_DATE: "insurerEndorsementDate",
  INSURER_ACKNOWLEDGEMENT_NUMBER: "insurerAcknowledgementNumber",
  INSURER_ENDORSED_DEPENDENT_COUNT: "insurerEndorsedDependentCount",
  INSURER_ENDORSED_EMPLOYEE_COUNT: "insurerEndorsedEmployeeCount",
  INSURER_ENDORSED_ASSET_COUNT: "insurerEndorsedDependentCount",
  INSURER_ENDORSED_SUB_ASSET_COUNT: "insurerEndorsedEmployeeCount",
  ENDORSEMENT_EFFECTIVE_DATE: "endorsementEffectiveDate",
  DATE_OF_INCOME: "dateOfIncome",
  INCOME_MONTH: "incomeMonth",
  ACK_FILE_ID: "ackFileId",
};

export const CLIENT_CONFIRMATION_UPDATE_KEYS = {
  CLIENT_CONFIRMATION_MESSAGE: "clientConfirmationMessage",
  CLIENT_CONFIRMATION_DATE: "clientConfirmationDate",
};

export const TPA_UPLOAD_UPDATE_KEYS = {
  TPA_DOCUMENT_ID: "tpaDocumentId",
  TPA_ACKNOWLEDGED_DATE: "tpaAcknowledgedDate",
  TPA_UPLOAD_REMARKS: "tpaUploadRemarks",
};
export const COVERS_TABLE = {
  HELD_COVER_NOTE: "OpportunityHeldCoverNoteCoverDetail",
  POLICY_HARD_COPY: "OpportunityPolicyHardCopyCoverDetail",
};

export const DOCUMENT_ENTITY_TYPE = {
  POLICY_ENTITY: "policy",
  TPA_UPLOAD_ENTITY: "tpaUpload",
  CLAIM_UPLOAD_POLICY_ENTITY: "claimUploadPolicy",
  CLAIM_UPLOAD_TPA_ENTITY: "claimUploadTpa",
};

export const DOCUMENT_TYPE = {
  TPA_DOCUMENT: "TPA_document_upload",
  CLAIMS_DOCUMENT: "claims_document_upload",
};

export const ASSET_ENDORSEMENT_FILE_HEADERS = {
  INTAKE_TYPE: "INTAKE_TYPE",
  SERIAL_NO: "SERIAL_NO",
  COVER_CODE: "COVER_CODE",
  DESCRIPTION: "DESCRIPTION",
  EFFECTIVE_DATE: "EFFECTIVE_DATE",
  SUM_INSURED: "SUM_INSURED",
  PREMIUM: "PREMIUM",
};

export const ASSET_ENDORSEMENT_HEADERS = {
  INTAKE_TYPE: "intaketype",
  COVER_CODE: "covercode",
  RISK_LOCATION_TYPE: "risklocationtype",
  RISK_LOCATION_DETAIL: "risklocationdetail",
  CATEGORY: "category",
  COVERAGE_TYPE: "coveragetype",
  QUANTITY: "quantity",
  UOM: "uom",
  RATE: "rate",
  PREMIUM: "premium",
  SUM_INSURED: "suminsured",
  IS_MAIN_ASSET: "ismainasset",
  SUB_LIMIT_AMOUNT: "sublimitamount",
  SUB_LIMIT_DESCRIPTION: "sublimitdescription",
  SUB_LIMIT_TYPE: "sublimittype",
  EFFECTIVE_DATE: "effectivedate",
};

export const DATA_INTAKE_TYPE = {
  INCEPTION: "inception",
  ADDITION: "addition",
  DELETION: "deletion",
};

export const GENDER_VALUES = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};

export const BOOLEAN_VALUES = {
  TRUE: "true",
  FALSE: "false",
};

export const PARENT_RELATIONSHIP_TYPES = {
  FATHER: "father",
  MOTHER: "mother",
  FATHER_IN_LAW: "fatherinlaw",
  MOTHER_IN_LAW: "motherinlaw",
  IN_LAW: "inlaw",
  PARENT: "parent",
  PARENTS: "parents",
  CHILD: "child",
  SON: "son",
  DAUGHTER: "daughter",
};

export const GROUP_POLICY_TYPES = [
  "POLICY_TYPE_GTL",
  "POLICY_TYPE_GMC",
  "POLICY_TYPE_GPA",
  "POLICY_TYPE_OPD",
  "POLICY_TYPE_GMC_PARENTAL",
  "POLICY_TYPE_GMC_PARENTAL_TOP_UP",
  "POLICY_TYPE_GMC_TOP-UP",
  "POLICY_TYPE_2_SURGICAL_HOSPITAL_INSURANCE",
  "POLICY_TYPE_2_GROUP_LIFE_INSURANCE",
  "POLICY_TYPE_INDIVIDUAL_MEDICLAIM",
  "POLICY_TYPE_TERM_PLAN",
  "POLICY_TYPE_HEALTH_FAMILY_FLOATER_POLICY",
  "POLICY_TYPE_SUPER_TOP_UP_POLICY",
  "POLICY_TYPE_HEALTH_PROTECTOR_PLUS",
  "POLICY_TYPE_ACCIDENT_GUARD_PLUS-PROTECT",
  "POLICY_TYPE_GROUP_MEDICLAIM_POLICY",
  "POLICY_TYPE_GROUP_PERSONAL_ACCIDENT_POLICY",
  "POLICY_TYPE_TOP--UP_POLICY",
  "POLICY_TYPE_GROUP_TERM_LIFE_INSURANCE_GTL",
  "POLICY_TYPE_GROUP_TERM_INSURANCE",
  "POLICY_TYPE_GROUP_TERM_PLUS",
  "POLICY_TYPE_IPROTECT_SMART",
  "POLICY_TYPE_CLICK_2_PROTECT_LIFE",
  "POLICY_TYPE_HDFC_LIFE_CLICK_2_PROTECT_3D_PLUS",
  "POLICY_TYPE_LIFE_SANCHAY_PLUS",
  "POLICY_TYPE_MAX_LIFE_GUARANTEED_LIFETIME_INCOME_PLAN",
  "POLICY_TYPE_SENIOR_CITIZENS_HEALTH",
  "POLICY_TYPE_2_PERSONAL_ACCIDENT",
  "POLICY_TYPE_INDIVIDUAL_PERSONAL_ACCIDENT",
];

export const SUM_INSURED_MODELS = {
  FLAT: "FLAT",
  MULTIPLE: "MULTIPLE",
};

export const PER_MILLE_RATE = 1000;

export const POLICY_FEATURE_DOCUMENT_STATUS = {
  ACTIVE: "ACTIVE",
  REPLACED: "REPLACED",
  DELETED: "DELETED",
} as const;

/**
 * Entity types supported by bulk edit operations
 */
export const BULK_EDIT_ENTITY_TYPES = {
  COMPANY: "COMPANY",
  OPPORTUNITY: "OPPORTUNITY",
  POLICY: "POLICY",
  SALES_OPPORTUNITY: "SALES_OPPORTUNITY",
  RENEWAL_OPPORTUNITY: "RENEWAL_OPPORTUNITY",
} as const;

export type BulkEditEntityType =
  (typeof BULK_EDIT_ENTITY_TYPES)[keyof typeof BULK_EDIT_ENTITY_TYPES];

// Backward compatibility alias while clients migrate from entityKey to entityType
export const BULK_EDIT_ENTITY_KEYS = BULK_EDIT_ENTITY_TYPES;

/**
 * Entity field mapping - defines which fields are bulk editable for each entity type
 */
export const BULK_EDITABLE_FIELDS: Record<
  BulkEditEntityType,
  readonly string[]
> = {
  [BULK_EDIT_ENTITY_TYPES.COMPANY]: [
    "leadCrm",
    "accountManager",
    "statusLid",
    "priorityLid",
  ],
  [BULK_EDIT_ENTITY_TYPES.OPPORTUNITY]: [
    "ownerId",
    "isgId",
    "statusLid",
    "expiryDate",
  ],
  [BULK_EDIT_ENTITY_TYPES.POLICY]: [
    "ownerId",
    "isgId",
    "amId",
    "policyStatusLid",
  ],
  [BULK_EDIT_ENTITY_TYPES.SALES_OPPORTUNITY]: [
    "ownerId",
    "isgId",
    "statusLid",
    "expiryDate",
  ],
  [BULK_EDIT_ENTITY_TYPES.RENEWAL_OPPORTUNITY]: [
    "ownerId",
    "isgId",
    "statusLid",
    "expiryDate",
  ],
} as const;

/**
 * Bulk edit limits and thresholds - No restrictions on records or field updates
 */
export const BULK_EDIT_LIMITS = {
  LARGE_BATCH_WARNING_THRESHOLD: 500, // Only warn for large batches, no hard limits
} as const;

export const CONSTANT_DATE = "2000-01-01";
export const FAQ_TEMPLATE_DEFAULTS = {
  TEMPLATE_NAME: "FAQs",
  INSTRUCTIONS_SHEET_NAME: "Instructions",
  TEMPLATE_FONT_STYLES: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  },
  FAQ_TEMPLATE_INSTRUCTIONS: [
    "FAQ Template Instructions:",
    "1. Fill in the S. No column with sequential numbers (1, 2, 3, etc.)",
    "2. Enter the FAQ category in the Category column",
    "3. Enter the question in the Question column",
    "4. Enter the answer in the Answer column",
    "5. Do not modify the header row",
    "6. Save the file and upload it back to the system",
  ],
};
export const CHILD_RELATIONSHIP_TYPES = {
  CHILD: "child",
  SON: "son",
  DAUGHTER: "daughter",
  CHILDREN: "Children",
};

export const UTILITY_UPLOAD_ENTITY = {
  TPA_UPLOAD: "TPA_UPLOAD",
  SEND_TO_INSURER: "SEND_TO_INSURER",
  SEND_TO_CLIENT: "SEND_TO_CLIENT",
};

/**
 * Maps scheduler keys from database to their corresponding handler method names
 * Add new scheduler mappings here when adding new scheduled tasks
 */
export const SCHEDULER_HANDLERS: Record<string, string> = {
  HANDLE_EXPIRED_OPPORTUNITIES: "handleExpiredOpportunities",
  HANDLE_OPPORTUNITY_ACTIVITIES_CLOSE_TO_EXPIRY:
    "handleOpportunityActivitiesCloseToExpiry",
  HANDLE_OPPORTUNITIES_CLOSE_TO_EXPIRY: "handleOpportunitiesCloseToExpiry",
  GENERATE_PERFORMANCE_OUTPUT_FOR_ALL_USERS:
    "generatePerformanceOutputForAllUsers",
  HANDLE_POLICIES_CLOSE_TO_EXPIRY: "handlePoliciesCloseToExpiry",
  REFRESH_COMPANY_ANALYTICS: "refreshCompanyAnalytics",
  HANDLE_UPLOADS: "handleUploads",
  HANDLE_ENROLLMENT_UPLOADS: "handleEnrollmentUploads",
  HANDLE_ASSET_ENROLLMENT_UPLOADS: "handleAssetEnrollmentUploads",
  HANDLE_TPA_ID_UPLOADS: "handleTpaIdUploads",
  HANDLE_MEMBER_DATA_UPLOADS: "handleMemberDataUploads",
  HANDLE_ENROLLMENT_ACTIVATION: "handleEnrollmentActivation",
  HANDLE_PASSWORD_HASH_BACKFILL: "handlePasswordHashBackfill",
  HANDLE_INITIAL_ONBOARDING_NOTIFICATIONS:
    "sendPendingInitialOnboardingNotifications",
  HANDLE_ENROLLMENT_START_NOTIFICATIONS: "sendEnrollmentStartNotifications",
  HANDLE_ENROLLMENT_REMINDER_NOTIFICATIONS:
    "sendEnrollmentReminderNotifications",
  HANDLE_ENROLLMENT_CUTOFF_AUTO_SUBMIT: "autoSubmitEnrollmentsAfterCutoff",
  SERVICE_TAT_AGGREGATION: "handleDailyAggregation",
  GENERIC_TPA_SYNC_PRODUCER: "runProducer",
  GENERIC_TPA_SYNC_WORKER: "runWorker",
  GENERIC_TPA_SYNC_PARSER: "runParser",
  BACKFILL_MISSING_GEOCODE: "backfillMissingGeocode",
};
const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_COMPLEXITY_RULES = [
  {
    test: (pwd: string) => pwd.length >= PASSWORD_MIN_LENGTH,
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  },
  {
    test: (pwd: string) => /[A-Z]/.test(pwd),
    message: "Password must contain an uppercase letter",
  },
  {
    test: (pwd: string) => /[a-z]/.test(pwd),
    message: "Password must contain a lowercase letter",
  },
  {
    test: (pwd: string) => /[0-9]/.test(pwd),
    message: "Password must contain a number",
  },
  {
    test: (pwd: string) => /[!@#$%^&*(),.?\":{}|<>]/.test(pwd),
    message: "Password must contain a special character",
  },
];

export const MS_PER_DAY =  24 * 60 * 60 * 1000;

export const PASSWORD_PATTERNS = [
  {
    regex: /(012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh)/i,
    message:
      "Password must not contain sequential numbers or letters (e.g., 123, abc)",
  },
  {
    regex: /(qwerty|asdf|zxcv)/i,
    message: "Password must not contain keyboard patterns (e.g., qwerty, asdf)",
  },
  {
    regex:
      /(password|admin|welcome|letmein|login|secure|reset|default|access|portal)/i,
    message:
      "Password must not contain commonly used or easily guessable words",
  },
  {
    regex: /(system|manager|user|temp|change|app|core|control|gate|lock)/i,
    message:
      "Password must not contain commonly used or easily guessable words",
  },
  {
    regex: /(home|role|account|pass|test)/i,
    message:
      "Password must not contain commonly used or easily guessable words",
  },
  {
    regex: /(.)\1{2,}/,
    message: "Password must not contain repeated characters (e.g., aaa, 111)",
  },
];

const getBirthYear = (dob?: Date | string) => {
  if (!dob) return undefined;

  const date = dob instanceof Date ? dob : new Date(dob);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.getFullYear().toString();
};

export type UserPII = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dob?: Date;
};

export const buildPIIRules = (user: UserPII) => [
  { label: "first name", value: user.firstName },
  { label: "last name", value: user.lastName },
  { label: "email id", value: user.email?.split("@")[0] },
  { label: "phone number", value: user.phone },
  { label: "last 4 digits of phone number", value: user.phone?.slice(-4) },
  { label: "first 4 digits of phone number", value: user.phone?.slice(0, 4) },
  {
    label: "year of birth",
    value: user.dob ? getBirthYear(user.dob) : undefined,
  },

];

export const DEPENDENT_COUNT_INTERNAL_TYPE = "dependent-count";
export const DEPENDENT_ATTRIBUTE_INTERNAL_TYPE = "dependent-attribute";
export const MAX_DEPENDENT_COUNT_INTERNAL_TYPE = "max-dependent-count";
export const DEPENDENT_COUNT_ALL_CATEGORY = "All";
export const BENEFIT_COMPONENT_SI_VALUE = 0;


// Single source of truth for "brokerage" in aggregations.
//
//   basic + SRCC + terrorism + fee
//
// Terrorism lives in two columns. tc_brokerage_amount is what the app writes
// today (the placement-slip field labelled "Terrorism brokerage amount" maps to
// it); commission_terrorism holds amounts only on legacy rows -- its write path
// now receives terrorismBrokeragePercentage, the same value that goes to
// terrorism_brokerage_percentage. So a row is legacy iff those two columns
// DIFFER. Prefer tc, fall back to commission_terrorism only on legacy rows,
// never add both -- adding them double-counts terrorism on rows carrying both.
//
// Does NOT include rewards: a reward has no policy, so it cannot be expressed
// as a column on the policy/endorsement row. Add it as a separate SUM where the
// query can reach the reward table.
//
// Aggregations whose output is specifically "Basic Brokerage Amount" must keep
// using basicBrokerageAmount directly -- this is for the general brokerage figure.
export const brokerageAmountExpr = (
  alias: string,
  opts: {
    terrorismAmountColumn?: string;
    snakeCase?: boolean;
    // policy_asset_endorsement has no SRCC/TC brokerage columns -- referencing
    // them there is a SQL error, not a zero.
    hasSrcc?: boolean;
    hasTc?: boolean;
    // Fee is part of the general brokerage figure everywhere by default. Pass
    // false ONLY where the surface already shows fee as its own line and would
    // otherwise count it twice (Biz Done Enhanced scope-summary SO/RO cards).
    includeFee?: boolean;
  } = {}
): string => {
  const snake = opts.snakeCase === true;
  const col = (camel: string, snakeName: string) =>
    `${alias}.${snake ? snakeName : camel}`;
  const terrorism = opts.terrorismAmountColumn
    ? `${alias}.${opts.terrorismAmountColumn}`
    : col("commissionTerrorism", "commission_terrorism");
  const pct = col("terrorismBrokeragePercentage", "terrorism_brokerage_percentage");
  const srcc =
    opts.hasSrcc === false
      ? ""
      : ` + COALESCE(${col("srccBrokerageAmount", "srcc_brokerage_amount")}, 0)`;
  const legacyTerrorism = `CASE WHEN ${terrorism} IS DISTINCT FROM ${pct} THEN ${terrorism} END`;
  const terrorismTerm =
    opts.hasTc === false
      ? ` + COALESCE(${legacyTerrorism}, 0)`
      : ` + COALESCE(NULLIF(${col("tcBrokerageAmount", "tc_brokerage_amount")}, 0),` +
        ` ${legacyTerrorism}, 0)`;
  const feeTerm =
    opts.includeFee === false
      ? ""
      : ` + COALESCE(${col("feeAmount", "fee_amount")}, 0)`;
  return (
    `(COALESCE(${col("basicBrokerageAmount", "basic_brokerage_amount")}, 0)` +
    srcc +
    terrorismTerm +
    feeTerm +
    `)`
  );
};

// JS counterpart of brokerageAmountExpr, for code holding a loaded
// policy/endorsement row rather than building SQL. Same terrorism rule: prefer
// tc_brokerage_amount, fall back to commission_terrorism only when it differs
// from terrorism_brokerage_percentage (i.e. a legacy amount, not a percentage).
//
// Always includes fee, matching brokerageAmountExpr -- the two must not disagree.
export const brokerageAmountOf = (
  row: any,
  opts: { terrorismAmountField?: string } = {}
): number => {
  const num = (v: unknown): number => Number(v) || 0;
  const terrorismAmt = num(
    row?.[opts.terrorismAmountField ?? "commissionTerrorism"]
  );
  const tc = num(row?.tcBrokerageAmount);
  const legacy =
    terrorismAmt !== num(row?.terrorismBrokeragePercentage) ? terrorismAmt : 0;
  return (
    num(row?.basicBrokerageAmount) +
    num(row?.srccBrokerageAmount) +
    (tc !== 0 ? tc : legacy) +
    num(row?.feeAmount)
  );
};
