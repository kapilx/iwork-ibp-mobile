export const DEFAULT_VALUES = {
  CREATED_BY: "SYSTEM",
  UPDATED_BY: "SYSTEM",
  ADDRESS_ID: 1, // Default address ID for InsurerAddress
  PAGE: 1, // Default page number for pagination
  LIMIT: 10, // Default number of records per page
  MAX_LIMIT: 100,
  SORT_BY: "id", // Default field to sort by
  SORT_ORDER: "DESC", // Default sort order
  ACTIVE_USER_STATUS: "USER_STATUS_ACTIVE", // Default status for active users
  USER_ENTITY: "user",
  ORGANISATION_ENTITY: "organisation",
  ORG_DEPARTMENT_ENTITY: "org_department",
  ORG_DESIGNATION_ENTITY: "org_designation",
  ORG_SBU_ENTITY: "org_sbu",
  ORG_VERTICAL_ENTITY: "org_vertical",
  ORG_BRANCH_ENTITY: "org_branch",
  COUNTRY_ENTITY: "country",
  STATE_ENTITY: "state",
  CITY_ENTITY: "city",
  REGION_ENTITY: "region",
  CURRENCY_ENTITY: "currency",
  COVER_ENTITY: "cover",
  STATUS_LOOKUP: "statusLid",
  USER_STATUS_KEY: "userStatusKey",
  USER_TYPE_KEY: "userTypeKey",
  USER_TYPE_IIRM_EMPLOYEE: "USER_TYPE_IIRM_EMPLOYEE",
  USER_TYPE_COMPANY_EMPLOYEE: "USER_TYPE_COMPANY_EMPLOYEE",
  DEFAULT_USER_PASSWORD: "password123", // Default password for new users
  OPPORTUNITY_TYPE: "SO",
  RENEWAL_OPPORTUNITY_TYPE: "RO",
  GROUP_COMPANY: "GROUP_COMPANY_NO",
  PRIORITY: "PRIORITY_MEDIUM",
  ACTUAL: "ACTUAL",
  DEFAULT_LOALIZATION_COUNTRY: 1, // India as default country for localization
  NOTIFICATION_SENDER: "noreply@insurance-wellness-hub.com",
  NOTIFICATION_PROVIDER: "SES",
  NOTIFICATION_SENT: "SENT",
  NOTIFICATION_FAILED: "FAILED",
  POLICY_TYPE: "POLICY_TYPE",
  IRDAI_POLICY_TYPE: "IRDAI_POLICY_TYPE",
  IIRM_POLICY_TYPE: "IIRM_POLICY_TYPE",
  IIRM_POLICY_TYPES: "IIRM_POLICY_TYPES",
  IRDAI_POLICY_TYPES: "IRDAI_POLICY_TYPES",
  LOOKUP_DATA_ENTITY: "lookup_data",
  ROLE_ENTITY: "role",
};
export const DEFAULT_ACTIVE_STATUS = {
  MASTER: "MASTER_STATUS_ACTIVE",
  LOOK_UP: 1,
};
export const FILTER_TYPE = {
  SYSTEM: "FILTER_TYPE_SYSTEM",
  USER: "FILTER_TYPE_USER",
};
export const FILTER_STATUS = {
  ACTIVE: "FILTER_STATUS_ACTIVE",
  INACTIVE: "FILTER_STATUS_INACTIVE",
};
export const DEFAULT_FILTER = {
  YES: "IS_DEFAULT_YES",
  NO: "IS_DEFAULT_NO",
};
export const DEFAULT_MESSAGES = {
  INSURER_CREATED: "Insurer successfully created.",
  INSURERS_RETRIEVED: "Insurers successfully retrieved.",
  INSURER_RETRIEVED: "Insurer successfully retrieved.",
  INSURER_UPDATED: "Insurer successfully updated.",
  INSURER_DELETED: "Insurer successfully deleted.",
  INSURER_NOT_FOUND: "Insurer not found.",
  INTERNAL_SERVER_ERROR: "Internal server error.",
  INVALID_INPUT: "Invalid input provided.",
  ADDRESSES_RETRIEVED: "Addresses with insurers successfully retrieved.",
};

export const COMPANY_STATUS_KEY = {
  ACTIVE: "COMPANY_STATUS_ACTIVE",
  DELETED: "COMPANY_STATUS_DELETED",
  UNDER_REVIEW: "COMPANY_STATUS_UNDER_REVIEW",
};

export const GROUP_COMPANY = {
  Name: "GROUP_COMPANY",
  keyValue: "NO",
};

export const ATTRIBUTE_FIELD_MAP: Record<string, string> = {
  companyType: "companyType.lookUpValue",
  industrySegment: "industrySegment.lookUpValue",
  city: "companyAddresses.address.cityId.id",
  country: "companyAddresses.address.countryId.name",
  cityId: "insurerAddresses.address.cityId.name",
  priority: "priority.lookUpValue",
  companyPriority: "companyPriority.lookUpValue",
  policyCompanyPriority: "company.priority.lookUpValue",
  policyCompanyType: "company.companyType.lookUpValue",
  sentiment: "sentiment.lookUpValue",
  companyTag: "companyTag.lookUpValue",
  department: "department",
  owner: "owner.firstName",
  ownerId: "owner.userId",
  designation: "designation",
  email: "communicationDetails.communicationDetails",
  phone: "communicationDetails.communicationDetails",
  contactName: "firstName",
  organisationName: "companyContactMaps.company.id",
  status: "status.lookUpValue",
  state: "status.lookUpValue",
  // branch: "companyContactMaps.company.companyAddress.address.cityId.name",
  leadCrm: "owner.firstName",
  branch: "companyContactMaps.company.companyAddresses.address.cityId.id",
  opportunityIndustrySegmentId: "company.industrySegment.id",
  opportunityIndustrySegment: "company.industrySegment.lookUpValue",
  opportunityContact: "opportunityContactMap.contact.id",
  opportunityPriority: "company.priority.lookUpValue",
  opportunityBranch: "owner.branchId",
  opportunityCreationDate: "createdAt",
  opportunityStage: "stage.lookUpValue",
  opportunityPolicyType: "policyType.lookUpValue",
  policyType: "policyType.lookUpValue",
  policyPriority: "company.lookUpValue",
  opportunityAssignedTo: "createdBy",
  employeeFirstName: "firstName",
  employeeDesignation: "designation.name",
  employeeDepartment: "department.name",
  employeeOrganisation: "organisation.name",
  employeeStatus: "employeeStatus",
  companyName: "company.id",
  displayName: "company.displayName",
  industry: "company.industrySegment.lookUpValue",
  employeeRole: "role.name",
  employeeLocation: "location.name",
  employeeVertical: "vertical.name",
  employeeBranch: "branch.name",
  employeeIworkRole: "iworkRole.lookUpValue",
  insurerAddresses: "insurerAddresses.address.address1",
  stateId: "insurerAddresses.address.stateId.name",
  contact: "opportunityContactMap.contact.displayName",
  tpaAddresses: "tpaAddresses.address.address1",
  phoneNumber: "tpaAddresses.address.phoneNumber",
  opportunityType: "opportunityType.lookUpValue",
  meetingType: "meetingType.lookUpValue",
  taskType: "taskType.lookUpValue",
  ownedBy: "createdBy",
  activityName: "opportunityActivityMap.activityName",
  stageName: "opportunityActivityMap.stageName",
  organisationId: "owner.organisationId",
  branchId: "owner.branchId",
  sbuId: "owner.sbuId",
  verticalId: "owner.verticalId",
  departmentId: "owner.departmentId",
  insurerName: "insurername",
  currentMonth: "currentmonth",
  lastMonth: "lastmonth",
  priorToThat: "priortothat",
  lastWeek: "lastweek",
  oneWeek: "oneweek",
  twoWeek: "twoweek",
  thirtyDays: "thirtydays",
  fortyFiveDays: "fortyfivedays",
  total: "total",
  claimStatus: "claim.claimStatus",
  priorityLid: "company.priorityLid",
  documentTypeId: "documentType.id",
  policyId: "id",
  isgManager: "isgId",
  accountManager: "accountManager",
  relationshipGroup: "relationshipGroup",
  claimStatusFilter: "claimStatus",
  effectiveFrom: "effectiveFrom",
  effectiveTo: "effectiveTo",
  insuredName: "insuredName",
  employeeId: "employeeId",
  iirmPolicyId: "iirmPolicyId",
  insurerEndorsementNumber: "insurerEndorsementNumber",
  insurerEndorsementDate: "insurerEndorsementDate",
  tpaId: "tpaId",
  insuredStatus: "status",
  endorsementId: "endorsementId",
  dueDate: "dueDate",
  createdAt: "createdAt",
};

export const PRIORITY_LOOK_UP = {
  value: "priority.lookUpValue",
  order: "priority.lookUpOrder",
};
export const DEFAULT_DATE_FILTER_FIELD = "createdAt";
// Grace window (in days) applied on each side of the selected expiry range for
// the expiry-driven opportunity listings (Manage SO, My RO, Manage Quote). The
// boundary days are exclusive (see applyExpiry buffer in opportunity.repository).
// Business disabled the grace window; flip EXPIRY_BUFFER_ENABLED back to true to
// restore the ±5-day behaviour across listings, funnel, dashboard and Enhanced.
export const EXPIRY_BUFFER_ENABLED = false;
export const EXPIRY_BUFFER_DAYS = EXPIRY_BUFFER_ENABLED ? 5 : 0;
export const companySearchObject: string[] = [
  "displayName",
  "companyName",
  "companyAddresses.address.cityId.name",
  "companyAddresses.address.countryId.name",
  "companyType.lookUpValue",
  "priority.lookUpValue",
  "industrySegment.lookUpValue",
];
export const TpaSearchObject: string[] = [
  "tpaName",
  "tpaAddresses.address.cityId.name",
];
export const InsurerSearchObject: string[] = [
  "insurerName",
  "companyTag.lookUpValue",
  "insurerAddresses.address.cityId.name",
  "insurerAddresses.address.branchCode",
  "insurerAddresses.address.branchType.lookUpValue",
];
export const BrokerSearchObject: string[] = [
  "brokerName",
  "brokerAddresses.address.cityId.name",
];
export const opportunitySearchObject: string[] = ["company.companyName"];
export const policySearchObject: string[] = [
  ...opportunitySearchObject,
  "insurerPolicyNumber",
];
// Client portfolio: maps an incoming sort field to the grouped company-row
// property it should sort by (the portfolio table is grouped/aggregated in
// application code, so its derived columns are sorted in memory).
//
// The `sort` array reaching aggregateActiveCompaniesByPolicies() has already
// been through mapSortParams(sort, "POLICY") one layer up in
// PolicyService.getAllPolicies, which translates frontend column names into
// ENTITY_SORT_FIELDS.POLICY's real SQL paths (companyName -> "company.companyName",
// priority -> "company.priority.lookUpOrder"). Those are the values that
// actually arrive here as `sortSpec.field` -- keying this map by the
// pre-translation frontend names (as it previously was) meant every lookup
// missed, sortKey stayed undefined, and the code silently fell back to its
// default (highest policy count) regardless of what the user clicked.
// policyCount/count/premium/premiumAtInception/policyPremium/roPremium/
// soPremium/roBrokerage/claimAmount are left as bare self-referential
// entries: none of them have a matching ENTITY_SORT_FIELDS.POLICY entry
// (they're company-level aggregates computed in aggregateActiveCompaniesByPolicies,
// with no per-policy column to translate from), so mapSortParams would
// normally filter them out before a sort request for them could ever reach
// this map. PolicyService.getAllPolicies now bypasses mapSortParams for
// exactly these keys (PORTFOLIO_COMPANY_AGGREGATE_SORT_KEYS below) when
// groupByCompany is set, so the raw frontend field name reaches this map
// unmodified.
export const PORTFOLIO_COMPANY_SORT_FIELD_MAP: Record<string, string> = {
  "company.companyName": "companyName",
  policyCount: "policyCount",
  count: "policyCount",
  policyPremium: "policyPremium",
  premium: "policyPremium",
  premiumAtInception: "policyPremium",
  roPremium: "roPremium",
  soPremium: "soPremium",
  roBrokerage: "roBrokerage",
  // Quarterly breakdown of roBrokerage — computed alongside it in the same
  // aggregation pass (policy.repository.ts), same no-per-policy-column shape.
  roBrokerageQ1: "roBrokerageQ1",
  roBrokerageQ2: "roBrokerageQ2",
  roBrokerageQ3: "roBrokerageQ3",
  roBrokerageQ4: "roBrokerageQ4",
  claimAmount: "claimAmount",
  "company.priority.lookUpOrder": "priorityOrder",
};
// Client Portfolio's company-grain columns with no per-policy relation path
// -- see the comment above PORTFOLIO_COMPANY_SORT_FIELD_MAP. Frontend field
// names, matched against the raw (pre-mapSortParams) sort key.
export const PORTFOLIO_COMPANY_AGGREGATE_SORT_KEYS = new Set([
  "policyPremium",
  "roPremium",
  "soPremium",
  "roBrokerage",
  "roBrokerageQ1",
  "roBrokerageQ2",
  "roBrokerageQ3",
  "roBrokerageQ4",
  "claimAmount",
]);
export const nonGroupClaimSearchObject: string[] = ["claimNumber"];
export const contactSearchObject: string[] = [
  "firstName",
  "middleName",
  "lastName",
  "companyContactMaps.company.companyName",
  "communicationDetails.communicationDetails",
  "status.lookUpValue",
  "tag.lookUpValue",
  "department",
  "designation",
];
export const fileSearchObject: string[] = [
  "fileKey",
  "documentType.lookUpValue",
];
export const companyLocationSearchObject: string[] = ["address.address1"];
export const employeeSearchObject: string[] = ["firstName", "lastName"];
export const taskSearchObject: string[] = ["taskName"];
export const noteSearchObject: string[] = ["title", "description"];
export const meetingSearchObject: string[] = [
  "meetingSubject",
  "meetingAgenda",
];
export const hospitalSearchObject: string[] = [
  "name",
  "code",
  "addresses.addressLine1",
  "addresses.addressLine2",
  "addresses.cityId.name",
  "addresses.stateId.name",
  "addresses.countryId.name",
  "addresses.pinCode",
  "addresses.landmark",
];

/**
 * Hospital template constants for Excel generation
 * Based on MstrHospital, MstrHospitalAddress, and MstrPolicyHospitalMap entity columns
 */
export const HOSPITAL_TEMPLATE_HEADERS = [
  "Hospital Name", // MstrHospital.name
  "Hospital Code", // MstrHospital.code
  "Address", // MstrHospitalAddress.address_line_1
  "City", // MstrHospitalAddress.city
  "State", // MstrHospitalAddress.state
  "Pin Code", // MstrHospitalAddress.pinCode
  "Email", // MstrHospitalAddress.email
  "Phone", // MstrHospitalAddress.phone
  "Classification", // MstrPolicyHospitalMap.isNetworkHospital (Network/Excluded)
];

/**
 * Hospital search sorting field mappings
 * Maps frontend field names to database column names for sorting
 */
export const HOSPITAL_SORT_FIELDS = {
  name: "hospital.name",
  hospitalName: "hospital.name",
  code: "hospital.code",
  hospitalCode: "hospital.code",
  address: "addresses.addressLine1",
  city: "addresses.cityName",
  cityName: "addresses.cityName",
  state: "addresses.stateName",
  stateName: "addresses.stateName",
  pinCode: "addresses.pinCode",
  pincode: "addresses.pinCode",
  email: "addresses.email",
  phone: "addresses.phoneNumber",
  phoneNumber: "addresses.phoneNumber",
  classification: "policyMappings.isNetworkHospital",
  hospitalType: "policyMappings.isNetworkHospital",
  isNetworkHospital: "policyMappings.isNetworkHospital",
  createdAt: "hospital.createdAt",
  updatedAt: "hospital.updatedAt",
} as const;

/**
 * Valid sort field names that frontend can use
 */
export const HOSPITAL_SORTABLE_FIELDS = Object.keys(
  HOSPITAL_SORT_FIELDS,
) as (keyof typeof HOSPITAL_SORT_FIELDS)[];

/**
 * Hospital boolean fields that require special sorting logic
 * These fields are boolean values that should be sorted differently
 */
export const HOSPITAL_BOOLEAN_SORT_FIELDS = [
  "classification",
  "hospitalType",
  "isNetworkHospital",
] as const;

/**
 * Mock hospital data for template generation
 * Includes 10 realistic records with validation scenarios
 */
export const MOCK_HOSPITAL_DATA = [
  {
    hospitalName: "Apollo Hospital",
    hospitalCode: "APL001",
    address: "123 Health Street, Medical District",
    city: "Hyderabad",
    state: "Telangana",
    pinCode: "500001",
    email: "info@apollohyd.com",
    phone: "040-12345678",
    classification: "Network",
  },
  {
    hospitalName: "Fortis Healthcare",
    hospitalCode: "FOR002",
    address: "456 Care Avenue, Healthcare Zone",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400001",
    email: "contact@fortismumbai.com",
    phone: "022-87654321",
    classification: "Excluded",
  },
  {
    hospitalName: "Max Super Speciality Hospital",
    hospitalCode: "MAX003",
    address: "789 Wellness Road, Medical Hub",
    city: "Delhi",
    state: "Delhi",
    pinCode: "110001",
    email: "info@maxdelhi.com",
    phone: "011-23456789",
    classification: "Network",
  },
  {
    hospitalName: "AIIMS Hospital",
    hospitalCode: "AII004",
    address: "321 Research Lane, Government Area",
    city: "Bengaluru",
    state: "Karnataka",
    pinCode: "560001",
    email: "admin@aiimsbangalore.edu.in",
    phone: "080-34567890",
    classification: "Network",
  },
  {
    hospitalName: "Manipal Hospital",
    hospitalCode: "MAN005",
    address: "654 Innovation Drive, Tech Park",
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411001",
    email: "enquiry@manipalpune.com",
    phone: "020-45678901",
    classification: "Excluded",
  },
  {
    hospitalName: "Narayana Health City",
    hospitalCode: "NAR006",
    address: "987 Cardiac Care Center, Health Complex",
    city: "Chennai",
    state: "Tamil Nadu",
    pinCode: "600001",
    email: "info@narayanachennai.com",
    phone: "044-56789012",
    classification: "Network",
  },
  {
    hospitalName: "Global Hospital",
    hospitalCode: "GLO007",
    address: "147 Multi Specialty Hub, Central District",
    city: "Ahmedabad",
    state: "Gujarat",
    pinCode: "380001",
    email: "contact@globalahmedabad.com",
    phone: "079-67890123",
    classification: "Network",
  },
  {
    hospitalName: "Ruby Hall Clinic",
    hospitalCode: "RUB008",
    address: "258 Premium Healthcare Avenue, Elite Area",
    city: "Kolkata",
    state: "West Bengal",
    pinCode: "700001",
    email: "info@rubyhallkolkata.com",
    phone: "033-78901234",
    classification: "Excluded",
  },
  {
    hospitalName: "Continental Hospital",
    hospitalCode: "CON009",
    address: "369 Advanced Medical Complex, IT Corridor",
    city: "Kochi",
    state: "Kerala",
    pinCode: "682001",
    email: "admin@continentalkochi.com",
    phone: "0484-89012345",
    classification: "Network",
  },
  {
    hospitalName: "Yashoda Hospital",
    hospitalCode: "YAS010",
    address: "741 Comprehensive Care Center, Medical City",
    city: "Jaipur",
    state: "Rajasthan",
    pinCode: "302001",
    email: "info@yashodajaipur.com",
    phone: "0141-90123456",
    classification: "Network",
  },
];

/**
 * Template configuration for Excel generation
 */
export const TEMPLATE_CONFIG = {
  sheetName: "Hospital Data",
  fileName: "hospital-upload-template.xlsx",
  instructions: [
    "1. Replace sample data with your hospital information",
    '2. Classification must be either "Network" or "Excluded"',
    "3. Pin Code must be exactly 6 digits",
    "4. All fields are mandatory except Address Line 2",
    "5. Duplicate hospitals will be skipped automatically",
    "6. Keep the header row unchanged",
  ],
};
export const announcementSearchObject: string[] = ["title", "description"];
export const bypassAclGuardApis: string[] = [
  "/login",
  "/logout",
  "/user-details",
  "/employee/my-profile",
  "/health",
  "/access-control-list/permissions",
  "/employee/password-reset/validate",
  "/employee/password-reset",
  "/employee/password-reset-mail",
  "/employee/company-employee-password-reset-mail",
  "/notifications",
  "/notifications/check-latest-notification",
  "/notifications/update-status",
  "/company-employee/company-employee-password-update",
  "/company-employee/refresh-token",
  "/company-employee/tickets",
  "/tickets",
  // "/onboarding",
];
export const bypassAuthGuardApis: string[] = [
  "/login",
  "/register",
  "/health",
  "/employee/password-reset/validate",
  "/employee/password-reset-mail",
  "/employee/company-employee-password-reset-mail",
  "/company-employee/company-employee-password-update",
  "/company-employee/refresh-token",
  "/company-employee/tickets",
  "/tickets",
];
export const sortRealtionsMapping = {
  PARENT_COMPANY_INDUSTRY_SORT: "company.industrySegment.lookUpValue",
  PARENT_COMPANY_INDUSTRY_SORT_KEY: "industrySegment.lookUpValue",
  PARENT_PRIORITY_SORT: "company.priority.lookUpOrder",
  PARENT_PRIORITY_SORT_KEY: "priority.lookUpValue",
  PARENT_BRANCH_SORT_KEY:
    "companyContactMaps.company.companyAddresses.address.cityId.name",
  PARENT_COMPANY_NAME_SORT: "companyName",
  PARENT_COMPANY_DISPLAY_NAME_SORT: "displayName",
  PARENT_COMPANY_NAME_SORT_KEY: "company.companyName",
  PARENT_COMPANY_DISPLAY_NAME_SORT_KEY: "company.displayName",
  PARENT_INSURER_CITY_SORT_KEY: "companyAddresses.address.cityId",
  PARENT_INSURER_CITY_SORT: "insurerAddress.address.cityId.name",
  PARENT_TPA_CITY_SORT_KEY: "insurerAddresses.address.cityId.name",
  PARENT_TPA_CITY_SORT: "tpaAddresses.address.cityId.name",
  PARENT_TPA_STATE_SORT_KEY: "insurerAddresses.address.stateId.name",
  PARENT_TPA_STATE_SORT: "tpaAddresses.address.stateId.name",
  PARENT_INSURER_PHONE_NUMBER_SORT_KEY: "tpaAddresses.address.phoneNumber",
  PARENT_INSURER_PHONE_NUMBER_SORT: "insurerAddresses.address.phoneNumber",
  PARENT_BROKER_CITY_SORT_KEY: "insurerAddresses.address.cityId.name",
  PARENT_BROKER_CITY_SORT: "brokerAddresses.address.cityId.name",
  PARENT_BROKER_STATE_SORT_KEY: "insurerAddresses.address.stateId.name",
  PARENT_BROKER_STATE_SORT: "brokerAddresses.address.stateId.name",
  PARENT_BROKER_PHONE_NUMBER_SORT_KEY: "tpaAddresses.address.phoneNumber",
  PARENT_BROKER_PHONE_NUMBER_SORT: "brokerAddresses.address.phoneNumber",
};

export const POLICY_PLACED_TYPE = {
  SINGLE_INSURER: "SINGLE_INSURER",
  MULTIPLE_INSURER: "MULTIPLE_INSURER",
};

export const DATA_VALIDATION_TASK_NAME = "Data Validation";
export const PRIORITY_LOOK_UP_MEDIUM_VALUE = "PRIORITY_MEDIUM";
export const PRIORITY_LOOK_UP_HIGH_VALUE = "PRIORITY_HIGH";
export const ACTIVITY_APPROVAL_YES = "YES";
export const MANDATE_TYPE_FULL_MANDATE = "MANDATE_TYPE_FULL_MANDATE";
export const OPPORTUNITY_STATUS_OPEN = "OPPORTUNITY_STATUS_OPEN";
export const OPPORTUNITY_STATUS_BD_PLANNING = "OPPORTUNITY_STATUS_BD_PLANNING";
export const OPPORTUNITY_STATUS_ISG_PLANNING =
  "OPPORTUNITY_STATUS_ISG_PLANNING";
export const OPPORTUNITY_STATUS_DEFAULT = "OPPORTUNITY_STATUS_DEFAULT";
export const OPPORTUNITY_STATUS_LOST = "OPPORTUNITY_STATUS_LOST";
export const OPPORTUNITY_STATUS_AUTO_CLOSE = "OPPORTUNITY_STATUS_AUTO_CLOSE";
export const OPPORTUNITY_STATUS_CLOSE = "OPPORTUNITY_STATUS_CLOSE";
export const SELECT_MEETING_EXISTING = "SELECT_MEETING_EXISTING";
export const OPPORTUNITY_STATUS_WORK_IN_PROGRESS =
  "OPPORTUNITY_STATUS_WORK_IN_PROGRESS";
export const TASK_CATEGORY_ACTIVITY = "TASK_CATEGORY_ACTIVITY";
export const TASK_TYPE = {
  ACTIVITY: "TASK_TYPE_ACTIVITY",
  TASK: "TASK_TYPE_SUB_TASK",
  ASSIGNED: "TASK_TYPE_ASSIGNED",
  APPROVAL: "TASK_TYPE_APPROVAL",
  PERSONAL: "TASK_TYPE_PERSONAL",
  NON_PERSONAL: "TASK_TYPE_NON_PERSONAL",
};
export const DEVIATION_TASK_DUE_DAYS = 7; // Default due days for deviation tasks
export const ACL_ACTIONS = {
  READ: "READ_001",
  WRITE: "WRITE_001",
  UPDATE: "UPDATE_001",
  APPROVE: "APPROVE_001",
  APPROVE_POLICY_CHANGES: "APPROVE_POLICY_CHANGES_001",
  REJECT: "REJECT_001",
  APPROVE_ISG: "APPROVE_ISG_001",
  REJECT_ISG: "REJECT_ISG_001",
  ISG_ASSIGN: "ISG_ASSIGN_001",
  APPROVE_BD: "APPROVE_BD_001",
  REJECT_BD: "REJECT_BD_001",
  BD_ASSIGN: "BD_ASSIGN_001",
};
export const ACL_CATEGORY = {
  OPPORTUNITY_ACTIVITY: "OPTY_ACTIVITY",
  BD_ACTIVITY: "BD_ACTIVITY",
  ISG_ACTIVITY: "ISG_ACTIVITY",
  POLICY_CONFIGURE: "POLICY_CONFIGURE",
  POLICY: "POLICIES",
  TEMPLATE_MANAGEMENT: "TEMPLATE_MANAGEMENT",
};

export const TASK_ORIGIN = {
  POLICY_SECTION_APPROVAL: "POLICY_SECTION_APPROVAL",
  POLICY_CONFIGURATION_APPROVAL: "POLICY_CONFIGURATION_APPROVAL",
  COMPANY_CONFIGURATION_APPROVAL: "COMPANY_CONFIGURATION_APPROVAL",
  TEMPLATE_APPROVAL: "TEMPLATE_APPROVAL",
} as const;

export const TASK_LABEL = {
  POLICY_SECTION_APPROVAL: "POLICY_APPROVAL",
  POLICY_SECTION_APPROVAL_POLICY_DETAILS: "POLICY_APPROVAL_POLICY_DETAILS",
  POLICY_SECTION_APPROVAL_POLICY_COVERS: "POLICY_APPROVAL_POLICY_COVERS",
  POLICY_SECTION_APPROVAL_POLICY_CD: "POLICY_APPROVAL_POLICY_CD",
  POLICY_CONFIGURATION_APPROVAL: "POLICY_CONFIGURATION_APPROVAL",
  COMPANY_CONFIGURATION_APPROVAL: "COMPANY_CONFIGURATION_APPROVAL",
} as const;

export const TASK_STATUS_ACTIVE = "TASK_STATUS_ACTIVE";
export const TASK_STATUS_CLOSED = "TASK_STATUS_CLOSED";
export const TASK_TYPE_APPROVAL = "TASK_TYPE_APPROVAL";
export const TASK_CLOSED = "TASK_CLOSED";
export const CONTACT_MAP_TABLE_DELETE_FIELDS = {
  CONTACT_ADDRESS: "ContactAddress",
  CHILD_DETAILS: "ChildDetails",
  QUALIFICATION_EXPERIENCE: "QualificationExperience",
  PROFESSIONAL_EXPERIENCE: "ProfessionalExperience",
  COMMUNICATION_DETAILS: "ContactCommunicationDetails",
  ADDRESS_ID: "addressId",
  CONTACT_ID: "contactId",
  ID: "id",
};
export const CONTACT_RECORD_TYPE_MAP = {
  COMPANY_CONTACT_RECORD_TYPE: "COMPANY_CONTACT",
  INSURER_CONTACT_RECORD_TYPE: "INSURER_CONTACT",
  TPA_CONTACT_RECORD_TYPE: "TPA_CONTACT",
  BROKER_CONTACT_RECORD_TYPE: "BROKER_CONTACT",
};
export const FILE_UPLOAD_TABLE_DELETE_FIELDS = {
  FILE_UPLOAD: "FileUpload",
  ID: "id",
  DOCUMENT_ID: "documentId",
};
export const COMPANY_MAP_TABLE_DELETE_FIELDS = {
  COMPANY_ADDRESS: "CompanyAddress",
  COMPANY_POLICY_CONFIG_LOCATION: "CompanyPolicyConfigurationLocation",
  STATE_GST_DETAILS: "StateGstDetail",
  ADDRESS_ID: "addressId",
  COMPANY_ID: "companyId",
  ID: "id",
};

export const BROKER_MAP_TABLE_DELETE_FIELDS = {
  BROKER_ADDRESS: "BrokerAddress",
  ADDRESS_ID: "addressId",
  BROKER_ID: "brokerId",
  ID: "id",
};

export const TPA_MAP_TABLE_DELETE_FIELDS = {
  TPA_ADDRESS: "TpaAddress",
  ADDRESS_ID: "addressId",
  TPA_ID: "id",
  ID: "id",
};

export const INSURER_MAP_TABLE_DELETE_FIELDS = {
  INSURER_ADDRESS: "InsurerAddress",
  ADDRESS_ID: "addressId",
  INSURER_ID: "insurerId",
  ID: "id",
};

export const OPPORTUNITY_MAP_TABLE_DELETE_FIELDS = {
  OPPORTUNITY_DATA_VALIDATION_DOCUMENT_MAP:
    "OpportunityDataValidationDocumentMap",
  OPPORTUNITY_DATA_VALIDATION_DOCUMENT_MAP_ID: "dataValidationId",
  OPPORTUNITY_MEETING_DOCUMENT_MAP: "OpportunityMeetingDocumentMap",
  OPPORTUNITY_MEETING_DOCUMENT_MAP_ID: "opportunityActivityId",
  RFP_DATA_COLLECTION_DOCUMENT_MAP: "OpportunityRfpActivityDocumentMap",
  RFP_DATA_COLLECTION_DOCUMENT_MAP_ID: "rfpDetailId",
  RFP_DETAILS_ENTRY_DOCUMENT_MAP: "OpportunityRfpDetailsEntryDocumentMap",
  RFP_DETAILS_ENTRY_DOCUMENT_MAP_ID: "opportunityRfpDetailsEntryId",
  POLICY_DOCKET_DOCUMENT_MAP: "OpportunityPolicyDocketDocumentMap",
  POLICY_DOCKET_ID: "policyDocketId",
  PLACEMENT_SLIP_DOCUMENT_MAP: "OpportunityPlacementSlipDocumentMap",
  PLACEMENT_SLIP_ID: "placementSlipId",
  DOCUMENT_ID: "documentId",
  ID: "id",
  HELD_COVER_NOTE_DOCUMENT_MAP: "OpportunityHeldCoverNoteDocumentMap",
  HELD_COVER_NOTE_ID: "heldCoverNoteId",
  POLICY_CONFIRMATION_DOCUMENT_MAP: "OpportunityPolicyConfirmationDocumentMap",
  POLICY_CONFIRMATION_ID: "policyConfirmationId",
  POLICY_HARD_COPY_DOCUMENT_MAP: "OpportunityPolicyHardCopyDocumentMap",
  POLICY_HARD_COPY_ID: "policyHardCopyId",
  QUOTE_COMPARISON_DOCUMENT_MAP: "OpportunityQuoteComparisonReportDocumentMap",
  QUOTE_COMPARISON_ID: "quoteComparisonReportId",
  PREMIUM_CALCULATION_DOCUMENT_MAP: "OpportunityPremiumCalculationDocumentMap",
  PREMIUM_CALCULATION_ID: "opportunityActivityId",
  OPPORTUNITY_QUOTE_ENTRY_DOCUMENT_MAP: "OpportunityQuoteDocumentMap",
  OPPORTUNITY_QUOTE_ENTRY_ID: "opportunityActivityId",
  PLACEMENT_SLIP_TPA_MAP: "OpportunityPlacementSlipTpaMap",
  PLACEMENT_SLIP_INSURER_MAP: "OpportunityPlacementSlipInsurerMap",
  PLACEMENT_SLIP_SHARING_MAP: "OpportunityPlacementSlipSharingDetail",
  PLACEMENT_SLIP_CD_MAP: "OpportunityPlacementSlipCDDetail",
  PLACEMENT_SLIP_INSTALLMENT_MAP: "OpportunityPlacementSlipInstallementDetail",
  PLACEMENT_SLIP_INSTALLMENTS_MAP: "OpportunityPlacementSlipInstallments",
  HELD_COVER_NOTE_INSTALLMENTS_MAP: "OpportunityHeldCoverNoteInstallments",
  POLICY_CONFIRMATION_INSTALLMENTS_MAP:
    "OpportunityPolicyConfirmationInstallments",
  POLICY_HARD_COPY_INSTALLMENTS_MAP: "OpportunityPolicyHardCopyInstallments",
  ORGANISATION: "Organisation",
  ORGANISATION_ID: "organisationId",
  USER: "User",
  POLICY: "Policy",
  COUNTRY_ID: "countryId",
  PARENT_ORGANISATION_ID: "parentOrganisationId",
};

export const OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS = {
  HELD_COVER_NOTE_INSURER_DETAILS: "OpportunityHeldCoverNoteInsurerMap",
  HELD_COVER_NOTE_ID: "heldCoverNoteId",
  POLICY_HARD_COPY_INSURER_DETAILS: "OpportunityPolicyHardCopyInsurerMap",
  POLICY_HARD_COPY_ID: "policyHardCopyId",
  POLICY_CONFIRMATION_INSURER_DETAILS:
    "OpportunityPolicyConfirmationInsurerMap",
  POLICY_CONFIRMATION_ID: "policyConfirmationId",
};
export const MEETING_SUBTYPE_KDM_KEY = "MEETING_SUBTYPE_KDM";
export const MEETING_STATUS = {
  SCHEDULED: "MEETING_STATUS_SCHEDULED",
  COMPLETED: "MEETING_STATUS_COMPLETED",
  CANCELLED: "MEETING_STATUS_CANCELLED",
};
export const MEETING_FEEDBACK_SUBMITTED = "MEETING_FEEDBACK_SUBMITTED";
export type LookupQueryType = "LOOK_UP_NAME" | "LOOK_UP_KEY" | "LOOK_UP_ID";
export const LOOK_UP_FIELD = {
  ID: "LOOK_UP_ID" as LookupQueryType,
  KEY: "LOOK_UP_KEY" as LookupQueryType,
  NAME: "LOOK_UP_NAME" as LookupQueryType,
};
export const DEFAULT_KDM_MEETING = "KDM Meeting";
export const DEFAULT_HAND_OVER_MEET = "Hand Over Meet";
export const DEFAULT_FINAL_NEGOTIATION_MEETING = "Final Negotiation Meeting";
export const DEFAULT_RFP_DATA_COLLECTION = "RFP Data Collection";
export const DEFAULT_HELD_COVER_APPROVAL_TASK_NAME =
  "Held cover note approval task";
export const DEFAULT_HAND_OVER_MEET_APPROVAL_TASK_NAME =
  "Hand over meet approval task";
export const DEFAULT_RFP_DETAILS_ENTRY = "RFP Details Entry";
export const DEFAULT_PLACEMENT_SLIP_GENERATION = "Placement Slip Generation";
export const ISG_ASSIGNMENT_TASK_NAME = "ISG Assignment Task";
export const ISG_PLANNING_TASK_NAME = "ISG Planning Task";
export const iirm = "iirm";
export const subPaths = [
  "extend-expiry",
  "reconfigure",
  "inception-create-company",
  "inception-create-contact",
  "inception-create-employee",
  "inception-create-policy",
  "add-final-negotiation-quote",
  "configure",
  "bulk-download",
  "business-target",
  "business-target-report-list",
  "business-target-report",
];

// Second path segments under /opportunity that represent "perform activity"
// mutations (planning, broking slip, quote, etc.) as opposed to opty CRUD
// (create/edit/delete/lost/renewal). For write methods these resolve to a
// dedicated ACL subPath so they can be authorized by the OPTY_ACTIVITY
// privilege instead of OPTY write/update. View (GET) routes are intentionally
// excluded by the method gate in AclGuard, so segments shared with read routes
// (e.g. "quote", "activities") keep resolving to the bare "opportunity" key.
export const opportunityActivityWriteSegments = [
  "activity",
  "assign-stage-owner",
  "activity-meta",
  "rfp-details-entry",
  "quote",
  "held-cover-note",
  "policy-confirmation",
  "activities",
  "policy-hard-copy",
  "placement-slip",
  "quote-comparison-report",
  "premium-calculation",
];

// Dedicated ACL subPath key the activity-write routes above resolve to. A row
// in acl_category_action_api_map must map (POST|PUT|DELETE, this key) to the
// OPTY_ACTIVITY/WRITE category-action.
export const OPPORTUNITY_ACTIVITY_SUBPATH = "opportunity/activity";
export const EXPORT_MODULE_KEYS = {
  company_documents:"company/export",
  policies:"policy/export",
  opportunity:"opportunity/export",
  inception:"endorsement/export",
  endorsement:"endorsement/export",
  task_and_meetings:"meeting/export",
  caution_deposit:"caution-deposit/export",
  policy_report_excel:"business-performance/export",
  portal_configuration: 'portal-configuration/export',
  report: 'report/export',
  employee_insured_excel: 'policy/employee/export'
}
export const PREMIUM_CALCULATION = "Premium Calculation";
export const COVER_TYPE = {
  ASSET: "COVER_TYPE_ASSET",
  TOP_UP: "COVER_TYPE_TOP_UP",
  ADD_ON: "COVER_TYPE_ADD_ON",
  MAIN: "COVER_TYPE_MAIN",
};
export const NOTIFICATION_EMAIL = "NOTIFICATION_CHANNEL_EMAIL";
export const NOTIFICATION_SMS = "NOTIFICATION_CHANNEL_SMS";
export const NOTIFICATION_IN_APP = "NOTIFICATION_CHANNEL_IN_APP";
export const NOTIFICATION_SUCCESS = "NOTIFICATION_STATUS_SUCCESS";
export const NOTIFICATION_FAILED = "NOTIFICATION_STATUS_FAILED";
export const NOTIFICATION_STATUS_READ = "NOTIFICATION_READ";
export const NOTIFICATION_STATUS_UNREAD = "NOTIFICATION_UNREAD";
export const NOTIFICATION_STATUS_DELETE = "NOTIFICATION_DELETE";
export const NOTIFICATION_STATE_ON = "NOTIFICATION_ON";
export const TEMPLATE_ACTIVE_STATUS_ACTIVE = "TEMPLATE_ACTIVE_STATUS_ACTIVE";
export const TEMPLATE_ACTIVE_STATUS_INACTIVE = "TEMPLATE_ACTIVE_STATUS_INACTIVE";
export const APPROVAL_STATUS_DRAFT = "APPROVAL_STATUS_DRAFT";
export const APPROVAL_STATUS_APPROVED = "APPROVAL_STATUS_APPROVED";
export const APPROVAL_STATUS_REJECTED = "APPROVAL_STATUS_REJECTED";
export const APPROVAL_STATUS_PENDING_APPROVAL = "APPROVAL_STATUS_PENDING_APPROVAL";
export const APPROVAL_WORKFLOW_SUBMIT = "APPROVAL_WORKFLOW_SUBMIT";
export const APPROVAL_WORKFLOW_APPROVE = "APPROVAL_WORKFLOW_APPROVE";
export const APPROVAL_WORKFLOW_REJECT = "APPROVAL_WORKFLOW_REJECT";
export const APPROVAL_WORKFLOW_REVISE = "APPROVAL_WORKFLOW_REVISE";
export const APPROVAL_WORKFLOW_WITHDRAW = "APPROVAL_WORKFLOW_WITHDRAW";
export const PASSWORD_RESET_EVENT = "Password_Reset";
export const IBP_PASSWORD_RESET_EVENT = "Password_Reset_IBP";
export const OPPORTUNITY_PARTICIPANT_INVITE = "Opportunity_Participant_Invite";
export const BULK_EDIT_OWNERSHIP_RECEIVED = "Bulk_Edit_Ownership_Received";
export const BULK_EDIT_OWNERSHIP_TRANSFER = "Bulk_Edit_Ownership_Transfer";
export const BULK_EDIT_NOTIFICATIONS_FIELDS = {
  ENTITY_TYPE: "entityType",
  NO_OF_RECORDS: "noOfRecords",
  OWNER_NAME: "ownerName",
};
export const BULK_EDIT_MANAGER_NOTIFICATION = "Bulk_Edit_Manager_Notification";
export const PRIORITY_COMPANY_CREATION = "Priority_Company_Creation";
export const COMPANY_SUM_INSURED_NOTIFICATION_THRESHOLD = 1000000000;
export const OPTY_SUM_INSURED_NOTIFICATION_THRESHOLD = 100000000;
export const NOTIFICATION_OPPORTUNITY_ENTITY = "opportunities";
export const NOTIFICATION_COMPANY_ENTITY = "companies";
export const NOTIFICATION_TEMPLATE_ENTITY = "template-management";
export const NOTIFICATION_MIR_ENTITY = "mir-reports/view";
export const PRIORITY_IMP = "PRIORITY_IMP";
export const PRIORITY_HIGH = "PRIORITY_HIGH";
export const PRIORITY_VIMP = "PRIORITY_VIMP";
export const USER_EMAIL = "emailId";
export const EMPLOYEE_ENROLLMENT_STATUS_ENROLLED =
  "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";
export const EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS =
  "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS";

export const OPPORTUNITY_ACTIVITY_STATUS = {
  OPEN: "OPPORTUNITY_ACTIVITY_STATUS_OPEN",
  WORK_IN_PROGRESS: "OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS",
  SUBMITTED: "OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED",
  CLOSED: "OPPORTUNITY_ACTIVITY_STATUS_CLOSED",
  APPROVED: "OPPORTUNITY_ACTIVITY_STATUS_APPROVED",
  REJECTED: "OPPORTUNITY_ACTIVITY_STATUS_REJECTED",
};

export const ACTIVITY_STATUS = {
  SAVE: "SAVE_ACTIVITY",
  COMPLETE: "COMPLETE_ACTIVITY",
  SUBMIT: "SUBMIT_ACTIVITY",
  APPROVE: "APPROVE_ACTIVITY",
  REJECT: "REJECT_ACTIVITY",
};

// Token used in notification_channel_event_template_mapping.additional_user_emails
// (and other DB-stored recipient config) to mean "resolve to this company's CRM
// lead's email at send time" instead of a hardcoded address.
export const COMPANY_CRM_ID_PLACEHOLDER = "###companyCrmId###";

export const NOTIFICATION_EVENT_TYPES = {
  PRIORITY_COMPANY_CREATION: "Priority_Company_Creation",
  OPPORTUNITY_PARTICIPANT_INVITE: "Opportunity_Participant_Invite",
  PASSWORD_RESET_EVENT: "Password_Reset",
  IBP_PASSWORD_RESET_EVENT: "Password_Reset_IBP",
  EMAIL_OTP_LOGIN: "Email_OTP_Login",
  EMAIL_OTP_2FA: "Email_OTP_2FA_Verification",
  EMAIL_OTP_ENROLLMENT_VERIFICATION: "Email_OTP_Enrollment_Verification",
  SMS_OTP_LOGIN: "SMS_OTP_Login",
  HIGH_PREMIUM_COMPANY_CREATION: "High_Premium_Company_Creation",
  High_Value_Opportunity_Creation: "High_Value_Opportunity_Creation",
  OPPORTUNITY_CREATION: "Opportunity_Creation",
  OPPORTUNITY_LOST: "Opportunity_Lost",
  OPPORTUNITY_EXPIRATION: "Opportunity_Expiration",
  POLICY_CONFIRMATION_DEVIATION: "Policy_confirmation_deviation",
  HELD_COVER_NOTE_DEVIATION: "Held_cover_note_deviation",
  POLICY_HARD_COPY_RECEIPT_DEVIATION: "Policy_hard_copy_receipt_deviation",
  OPPORTUNITY_ACTIVITY_PLAN_DELAY: "Opportunity_Activity_Plan_Delay",
  INSTALLMENT_DUE_DATE: "INSTALLMENT_DUE_DATE",
  POLICY_DUE_DATE: "POLICY_DUE_DATE",
  OPPORTUNITY_ACTIVITY_APPROVAL: "Opportunity_Activity_Approval",
  OPPORTUNITY_ACTIVITY_REJECTION: "Opportunity_Activity_Reject",
  ENDORSEMENT_EMAIL_TO_INSURER: "Endorsement_Email_To_Insurer",
  CLIENT_CONFIRMATION_EMAIL: "Client_Confirmation_Email",
  INITIAL_ONBOARDING_EMAIL: "Initial_Onboarding_Email",
  INITIAL_ONBOARDING_MESSAGE: "Initial_Onboarding_Message",
  ENROLLMENT_START_EMAIL: "Enrollment_Start_Email",
  ENROLLMENT_START_MESSAGE: "Enrollment_Start_Message",
  ENROLLMENT_REMINDER_EMAIL: "Enrollment_Reminder_Email",
  ENROLLMENT_REMINDER_MESSAGE: "Enrollment_Reminder_Message",
  ENROLLMENT_CONFIRMATION_EMAIL: "Enrollment_Confirmation_Email",
  ENROLLMENT_CONFIRMATION_MESSAGE: "Enrollment_Confirmation_Message",
  BULK_ENROLLMENT_CONFIRMATION_EMAIL: "Bulk_Enrollment_Confirmation_Email",
  LIFE_EVENT_CONFIRMATION_EMAIL: "Life_Event_Confirmation_Email",
  ADDED_DEPENDENTS_EMAIL: "Added_Dependents_Email",
  CLAIM_INTIMATION_CONFIRMATION_EMAIL: "Claim_Intimation_Confirmation_Email",
  SUPPORT_TICKET_RAISED_EMAIL: "Support_Ticket_Raised_Email",
  SUPPORT_TICKET_STATUS_CHANGED_EMAIL: "Support_Ticket_Status_Changed_Email",
  PREVIOUS_WELCOME_EMAIL_APOLOGY: "Previous_Welcome_Email_Apology",

  // MIR Report — BR-MIR-019 notification matrix
  MIR_REPORT_SUBMITTED: "MIR_Report_Submitted",
  MIR_REPORT_APPROVED: "MIR_Report_Approved",
  MIR_REPORT_REJECTED: "MIR_Report_Rejected",
  MIR_REPORT_PUBLISHED: "MIR_Report_Published",
  MIR_REPORT_ACKNOWLEDGED: "MIR_Report_Acknowledged",

  // Dual Approval Framework — DA-106
  DUAL_APPROVAL_APPROVER_ASSIGNED: "Dual_Approval_Approver_Assigned",
  DUAL_APPROVAL_REQUEST_APPROVED: "Dual_Approval_Request_Approved",
  DUAL_APPROVAL_REQUEST_REJECTED: "Dual_Approval_Request_Rejected",

  // HCL Employee Interface Sync — fired once a policy_employee_data upload
  // batch tied to an Endorsement finishes (COMPLETED or FAILED), so the
  // company's CRM and the RiskWatch admin who submitted it (endorsement.
  // createdBy) both learn a new endorsement needs review in iWork instead of
  // it silently sitting at ENDORSEMENT_REQUEST_RECEIVED. See
  // docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md §15.
  ENDORSEMENT_UPLOAD_READY_FOR_REVIEW: "Endorsement_Upload_Ready_For_Review",
};

// Which NOTIFICATION_EVENT_TYPES are sent to IBP employee-portal users (and
// are therefore inherently domain/subdomain-scoped, like dependentRelationConfig
// -- one company can have several IBP domains, e.g. TeamLease has 6) versus
// iWork-internal CRM/ops notifications (company-wide, no domain concept).
// Traced each event type to its actual sendNotification() call site to build
// this list -- referenced by KEY (not by hardcoding the value strings) so it
// can never drift out of sync if a value above changes.
const IBP_NOTIFICATION_EVENT_KEYS: Array<keyof typeof NOTIFICATION_EVENT_TYPES> = [
  "IBP_PASSWORD_RESET_EVENT",
  "EMAIL_OTP_LOGIN",
  "EMAIL_OTP_2FA",
  "EMAIL_OTP_ENROLLMENT_VERIFICATION",
  "SMS_OTP_LOGIN",
  "CLIENT_CONFIRMATION_EMAIL",
  "INITIAL_ONBOARDING_EMAIL",
  "INITIAL_ONBOARDING_MESSAGE",
  "ENROLLMENT_START_EMAIL",
  "ENROLLMENT_START_MESSAGE",
  "ENROLLMENT_REMINDER_EMAIL",
  "ENROLLMENT_REMINDER_MESSAGE",
  "ENROLLMENT_CONFIRMATION_EMAIL",
  "ENROLLMENT_CONFIRMATION_MESSAGE",
  "BULK_ENROLLMENT_CONFIRMATION_EMAIL",
  "LIFE_EVENT_CONFIRMATION_EMAIL",
  "ADDED_DEPENDENTS_EMAIL",
  "CLAIM_INTIMATION_CONFIRMATION_EMAIL",
  "SUPPORT_TICKET_RAISED_EMAIL",
  "SUPPORT_TICKET_STATUS_CHANGED_EMAIL",
  "PREVIOUS_WELCOME_EMAIL_APOLOGY",
  // MIR_REPORT_PUBLISHED is intentionally NOT here -- its recipients (HR
  // managers, hr_user_management) have no domain concept, so it's classified
  // company-wide (iWork) alongside its MIR_REPORT_* siblings instead.
];

export const IBP_NOTIFICATION_EVENT_TYPES: Set<string> = new Set(
  IBP_NOTIFICATION_EVENT_KEYS.map((key) => NOTIFICATION_EVENT_TYPES[key])
);

// notification-service's sendNotification() returns one of these in its
// `status` field (nested under response.data.data.status for callers going
// through the HTTP layer) when a company/domain admin has disabled the event
// type -- callers that need to react differently for a suppressed send (throw
// a clear error for OTP/verification codes, or surface an informational
// message for confirmation emails) should compare against these instead of
// hardcoding the literal strings.
export const NOTIFICATION_SKIP_STATUS = {
  DISABLED_FOR_COMPANY: "SKIPPED_DISABLED_FOR_COMPANY",
  DISABLED_FOR_DOMAIN: "SKIPPED_DISABLED_FOR_DOMAIN",
  // The template itself (default or override) was disabled via Template
  // Management's Disable action — activeStatusLid, not the company/domain
  // notification-config toggles above. Distinct from those: this is set on
  // the template row, not a company or portal-config setting, but callers
  // should treat it the same way — a deliberate admin choice, not a failure.
  TEMPLATE_DISABLED: "SKIPPED_TEMPLATE_DISABLED",
} as const;

export const APPROVAL_TASK_NAMES = {
  RFP_DETAILS_ENTRY: "RFP details entry - Approval",
  BROKING_SLIP_ENTRY: "Broking slip generation - Approval",
  PLACEMENT_SLIP_TASK: "Placement slip generation - Approval",
  HELD_COVER_NOTE_TASK: "Held cover note - Approval",
  POLICY_DOCKET: "Policy docket - Approval",
  HAND_OVER_MEET: "Hand over meet - Approval",
};
export const PASSWORD_RESET_KEY_1 = "passwordResetUrl";
export const PASSWORD_RESET_KEY_2 = "passwordResetEmail";
export const PASSWORD_RESET_KEY_3 = "passwordResetFirstName";

export const EMAIL_OTP_KEY_1 = "otpCode";
export const EMAIL_OTP_KEY_2 = "expiryMinutes";

// Email OTP Scenarios
export const EMAIL_OTP_SCENARIOS = {
  LOGIN: "LOGIN",
  TWO_FACTOR_AUTH: "TWO_FACTOR_AUTH", 
  ENROLLMENT_VERIFICATION: "ENROLLMENT_VERIFICATION"
} as const;

export const SMS_OTP_KEY_1 = "otpCode";
export const SMS_OTP_KEY_2 = "expiryMinutes";
export const SMS_OTP_KEY_3 = "UserName";

export const ENDORSEMENT_NOTIFICATION_PARAMETERS = {
  ENDORSEMENT_URL: "endorsementURL",
  POLICY_NUMBER: "policyNumber",
  CUSTOMER_NAME: "customerName",
  CURRENT_MONTH: "currentMonth",
};

// End-User Onboarding Notification Parameters
export const ENROLLMENT_NOTIFICATION_PARAMETERS = {
  EMPLOYEE_NAME: "employeeName",
  EMPLOYEE_FULL_NAME: "employeeFullName",
  EMAIL_ID: "emailId",
  PHONE_NUMBER: "phoneNumber",
  POLICY_NAME: "policyName",
  POLICY_START_DATE: "policyStartDate",
  POLICY_END_DATE: "policyEndDate",
  COMPANY_NAME: "companyName",
  INSURER_NAME: "insurerName",
  TPA_NAME: "tpaName",
  BROKER_NAME: "brokerName",
  BROKER_COMPANY_NAME: "brokerCompanyName",
  SUPPORT_EMAIL: "supportEmail",
  SUPPORT_PHONE: "supportPhone",
  PORTAL_LINK: "portalLink",
  ENROLLMENT_START_DATE: "enrollmentStartDate",
  ENROLLMENT_END_DATE: "enrollmentEndDate",
  TOTAL_LIVES: "totalLives",
  DEPENDENT_DETAILS: "dependentDetails",
  DEPENDENT_NAME: "dependentName",
  DEPENDENT_RELATION: "dependentRelation",
  PREMIUM: "premium",
  SELF_PAID: "selfPaid",
  COMPANY_PAID: "companyPaid",
  SUM_INSURED: "sumInsured",
  SUBMISSION_DATE: "submissionDate",
  SUBMISSION_COUNT: "submissionCount",
  REFERENCE_NUMBER: "referenceNumber",
  POLICY_DETAILS: "policyDetails",
};

export const CLAIM_INTIMATION_NOTIFICATION_PARAMETERS = {
  EMPLOYEE_NAME: "employeeName",
  COMPANY_NAME: "companyName",
  POLICY_NAME: "policyName",
  CLAIM_NUMBER: "claimNumber",
  CLAIM_TYPE: "claimType",
  IS_CASHLESS: "isCashless",
  IS_ACCIDENT_CLAIM: "isAccidentClaim",
  PATIENT_NAME: "patientName",
  PATIENT_RELATION: "patientRelation",
  DIAGNOSIS: "diagnosis",
  ESTIMATED_CLAIM_AMOUNT: "estimatedClaimAmount",
  DATE_OF_ADMISSION: "dateOfAdmission",
  PROPOSED_DISCHARGE_DATE: "proposedDischargeDate",
  PLACE_OF_ACCIDENT: "placeOfAccident",
  HOSPITAL_NAME: "hospitalName",
  HOSPITAL_LOCATION: "hospitalLocation",
  SUBMISSION_DATE: "submissionDate",
  CURRENT_YEAR: "currentYear",
};

export const LIFE_EVENT_NOTIFICATION_PARAMETERS = {
  EMPLOYEE_NAME: "employeeName",
  COMPANY_NAME: "companyName",
  LIFE_EVENT_TITLE: "lifeEventTitle",
  LIFE_EVENT_TYPE: "lifeEventType",
  LIFE_EVENT_ACTION_LABEL: "lifeEventActionLabel",
  FLOW_TYPE: "flowType",
  ADDED_DEPENDENTS: "addedDependents",
  DELETED_DEPENDENTS: "deletedDependents",
  CHANGED_DEPENDENTS: "changedDependents",
  ADDED_COUNT: "addedCount",
  DELETED_COUNT: "deletedCount",
  CHANGED_COUNT: "changedCount",
  POLICY_DETAILS: "policyDetails",
  SUBMISSION_DATE: "submissionDate",
  SUBMISSION_COUNT: "submissionCount",
  REFERENCE_NUMBER: "referenceNumber",
  PORTAL_LINK: "portalLink",
  CURRENT_YEAR: "currentYear",
};

export const ADDED_DEPENDENTS_NOTIFICATION_PARAMETERS = {
  EMPLOYEE_NAME: "employeeName",
  DEPENDENT_DETAILS: "dependentDetails",
  SUBMISSION_DATE: "submissionDate",
  ENROLLMENT_START_DATE: "enrollmentStartDate",
  ENROLLMENT_END_DATE: "enrollmentEndDate",
  REFERENCE_NUMBER: "referenceNumber",
  PORTAL_LINK: "portalLink",
  CURRENT_YEAR: "currentYear",
};

export const serviceNames = {
  SERVICE_REGISTRY: "service-registry",
  API_GATEWAY: "api-gateway",
  AUTH_SERVICE: "auth-service",
  POLICY_SERVICE: "policy-service",
  ORG_SERVICE: "org-service",
  IBP_SERVICE: "ibp-service",
  OPPORTUNITY_SERVICE: "opportunity-service",
  KNOWLEDGE_SERVICE: "knowledge-service",
  NOTIFICATION_SERVICE: "notification-service",
  AI_SERVICE: "ai-service",
  SCHEDULER_SERVICE: "scheduler-service",
  REPORT_SERVICE: "report-service",
  DOCUMENT_SERVICE: "document-service",
  EXTERNAL_INTEGRATION_SERVICE: "external-integration-service",
};
export const PLANNING_STATE = "Planning";
export const OPPORTUNITY_WON = "Opportunity Won";
export const OPPORTUNITY_LOST = "Opportunity Lost";

export const DEFAULT_USER_PASSWORD = "password123"; // Default password for new users

export const DOCUMENT_PROCESS_STATUS = {
  CREATED: "CREATED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export const DOCUMENT_TYPE_POLICY_EMPLOYEE_DATA = "policy_employee_data";
export const DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA =
  "policy_employee_enrollment_data";
export const DOCUMENT_TYPE_POLICY_EMPLOYEE_BYPASS_ENROLLMENT =
  "policy_employee_bypass_enrollment";
export const DOCUMENT_TYPE_POLICY_ASSET_ENROLLMENT_DATA =
  "policy_asset_enrollment_data";
export const DOCUMENT_TYPE_POLICY_ENDORSEMENT_CREATION =
  "policy_endorsement_creation";
export const FAKEEMPLOYEEID = "FAKEEMPID";

export const USER_TYPE_COMPANY_EMPLOYEE = "USER_TYPE_COMPANY_EMPLOYEE";
export const USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE =
  "USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE";
export const USER_TYPE_IIRM_EMPLOYEE = "USER_TYPE_IIRM_EMPLOYEE";
export const COMPANY_EMPLOYEE_ROLE_KEY = "ROLE_COMPANY_EMPLOYEE";
export const ROLE_EXTERNAL_HR = "ROLE_EXTERNAL_HR";
export const iirmLogo = "../../../ui/iwork/src/app/assets/pngs/iirm.png";
export const iirmIndiaLogo =
  "../../../ui/iwork/src/app/assets/jpgs/iirm_india_logo.jpg";
export const iirmSriLankaLogo =
  "../../../ui/iwork/src/app/assets/pngs/iirm_sriLanka_logo.png";
export const iirmKenyaLogo =
  "../../../ui/iwork/src/app/assets/pngs/iirm_kenya_logo.png";

export const DEFAULT_POLICY_REPORT_FIELDS = {
  COMPANY_SUMMARY_FIELDS: [
    "serialNumber",
    "customerName",
    "netPremium",
    "grossPremium",
    "premiumCollected",
    "brokerageAmount",
    "brokerageCollected",
    "terrorismCommissionAmount",
    "iirmOrganisation",
    "SBU",
    "vertical",
    // "department",
    // "branch",
  ],
  POLICY_SUMMARY_FIELDS: [
    "serialNumber",
    "policyCategory",
    "netPremium",
    "grossPremium",
    "premiumCollected",
    "brokerageAmount",
    "brokerageCollected",
    "terrorismCommissionAmount",
    "iirmOrganisation",
    "SBU",
    "vertical",
    // "department",
    // "branch",
  ],
  INSURER_SUMMARY_FIELDS: [
    "serialNumber",
    "insurer",
    "netPremium",
    "grossPremium",
    "premiumCollected",
    "brokerageAmount",
    "brokerageCollected",
    "terrorismCommissionAmount",
    "iirmOrganisation",
    "SBU",
    "vertical",
    // "department",
    // "branch",
  ],
  POLICY_DETAILS_FIELDS: [
    "serialNumber",
    "iirmPolNo",
    "iirmRefNo",
    "insPolNo",
    "insEndNo",
    "incomeType",
    "entryInIwork",
    "incomeMonth",
    "dateOfIncome",
    "policyFromDate",
    "businessMonth",
    "dateOfBusiness",
    "policyToDate",
    "custId",
    "customerName",
    "customerCategory",
    "policyName",
    "policyCategory",
    "insurer",
    "insBranch",
    "empName",
    "iirmBranch",
    "iirmOrganisation",
    "SBU",
    "vertical",
    "department",
    "status",
    "sharePercentage",
    "shareAmount",
    "netPremium",
    "terrorism",
    "other",
    "gstAmount",
    "grossPremium",
    "premiumCollected",
    "brokeragePercentage",
    "brokerageAmount",
    "brokerageCollected",
    "brokerageAmountAsEnteredByIsg",
    "brokerageAmountAsPerIwork",
    "fees",
    "dealConfirmed",
    "terrorismCommissionAmount",
    "terrorismCommissionPercentage",
    "policyStatus",
    "uniqueIworkedgeReference",
    "uniqueExternalReference",
    "parentCompanyName",
    "leadCrm",
    "accountManager",
    "policyOwnerReportingManager",
    "iworkUniqueId",
    "ingestedMode",
    "totalBrokerageAmount",
    "opportunityType",
    "brokerName",
  ],
  CO_INSURER_DEFAULT_FIELDS: [
    "serialNumber",
    "iirmPolNO",
    "iirmRefNo",
    "insPolNo",
    "insEndNo",
    "incomeType",
    "entryInWork",
    "incomeMonth",
    "dateOfIncome",
    "plcyFromDate",
    "plcyToDate",
    "custId",
    "customerName",
    "customerCategory",
    "policyName",
    "insurer",
    "insBranch",
    "empName",
    "iirmBranch",
    "iirmOrganisation",
    "SBU",
    "vertical",
    "department",
    "status",
    "sharePercentage",
    "shareAmount",
    "netPremium",
    "terrorism",
    "other",
    "gstAmount",
    "grossPremium",
    "premiumCollected",
    "brokeragePercentage",
    "brokerageAmount",
    "brokerageCollected",
    "brokerageAmountAsEnteredByIsg",
    "brokerageAmountAsPerIwork",
    "fees",
    "dealConfirmed",
    "terrorismCommissionAmount",
    "terrorismCommissionPercentage",
    "policyStatus",
    "ingestedMode",
    "totalBrokerageAmount",
  ],
  REWARDS_FIELDS: [
    "serialNumber",
    "insurer",
    "rewardCategory",
    "businessMonths",
    "incomeMonth",
    "dateOfIncome",
    "rewardAmount",
    "remarks",
  ],
};
export const DEFAULT_TAB_COLOR = "FF00FF00"; // Green tab color in ARGB format

export const DEFAULT_POLICY_REPORT_DATATYPE_FLOAT = [
  "netPremium",
  "totalNetPremium",
  "grossPremium",
  "premiumCollected",
  "brokerageAmount",
  "brokerageCollected",
  "terrorismCommissionAmount",
  "sharePercentage",
  "terrorism",
  "other",
  "gstAmount",
  "brokeragePercentage",
  "brokerageAmountAsEnteredByIsg",
  "brokerageAmountAsPerIwork",
  "fees",
  "terrorismCommissionPercentage",
  // Sri Lanka premium/brokerage block. Postgres returns numeric as a JS string,
  // and anything not listed here is written to Excel via String(value) -- i.e. a
  // text cell that Excel will not sum.
  "basicPremium",
  "srccPremiumAmount",
  "tcPremiumAmount",
  "netpremium",
  "adminCharges",
  "stampDuty",
  "cessAmount",
  "policyFee",
  "vatAmount",
  "serviceTax",
  "shareAmount",
  "gst",
  "basicBrokerageAmount",
  "srccBrokerageAmount",
  "tcBrokerageAmount",
  "totalBrokerageAmount",
  "vatPercentage",
  "srccbrokeragepercentage",
  "gstPercentage",
  "tcbrokerageAmount",
];

export const DEFAULT_POLICY_REPORT_DATATYPE_INTEGER = [
  "serialNumber",
  "iirmPolNo",
  "custId",
];

export const DEFAULT_POLICY_REPORT_DATATYPE_DATE = [
  "entryInIwork",
  "dateOfIncome",
  "policyFromDate",
  "policyToDate",
];

export const DEFAULT_POLICY_REPORT_TOTAL_FIELDS: { [key: string]: string } = {
  serialNumber: "Totals",
};
export const DEFAULT_POLICY_REPORT_TOTAL_FIELDS_VALUES: {
  [key: string]: string;
} = {
  netPremium: "Net Premium",
  totalNetPremium: "Total Net Premium",
  grossPremium: "Gross Premium",
  premiumCollected: "Premium Collected",
  brokerageAmount: "Brokerage Amount",
  brokerageCollected: "Brokerage Collected",
  terrorismCommissionAmount: "Terrorism Brokerage Amount",
  terrorism: "Terrorism",
  other: "Other",
  gstAmount: "GST Amount",
  brokerageAmountAsEnteredByIsg: "BrokerageAmtEnteredbyISG",
  brokerageAmountAsPerIwork: "BrokerageAmtAsperIwork",
  fees: "Fees",
  // gstAmount above matches no country's field_label -- India and Sri Lanka both
  // label the column "gst", so that total never rendered. Keeping the old key so
  // nothing that depends on it breaks.
  gst: "GST Amount",
  serviceTax: "Service Tax",
  shareAmount: "Share Amount",
  // Sri Lanka premium block.
  basicPremium: "Basic Premium",
  srccPremiumAmount: "SRCC Premium",
  tcPremiumAmount: "TC Premium",
  netpremium: "Lanka Net Premium",
  adminCharges: "Admin Charges",
  stampDuty: "Stamp Duty",
  cessAmount: "Cess Amount",
  policyFee: "Policy Fee",
  vatAmount: "VAT Amount",
  // Sri Lanka brokerage block.
  basicBrokerageAmount: "Basic Brokerage Amount",
  srccBrokerageAmount: "SRCC Brokerage Amount",
  tcBrokerageAmount: "TC Brokerage Amount",
  totalBrokerageAmount: "Total Brokerage Amount",
};

export enum ENDORSEMENT_HEADERS {
  SL_NO = "SL_NO",
  SERIAL_NO = "SERIAL_NO",
  FAMILY_NO = "FAMILY_NO",
  INSUREDNAME = "INSUREDNAME",
  RELATION = "RELATION",
  GENDER = "GENDER",
  DOB = "DOB",
  AGE = "AGE",
  BASE_SUM_INSURED = "BASE_SUM_INSURED",
  TOP_UP_SUM_INSURED = "TOP_UP_SUM_INSURED",
  TOTAL_SI = "TOTAL_SI",
  EMPLOYEE_NUMBER = "EMPLOYEE_NUMBER",
  DOJ = "DOJ",
  ENDORSEMENT_TYPE = "ENDORSEMENT_TYPE",
  ADDRESS_CODE = "ADDRESS_CODE",
}

export enum PREMIUM_CALCULATOR_HEADERS {
  SL_NO = "SL_NO",
  EMPLOYEE_ID = "EMPLOYEE_ID",
  EMPLOYEE_NAME = "EMPLOYEE_NAME",
  RELATION = "RELATION",
  DATE_OF_BIRTH = "DATE_OF_BIRTH",
  EFFECTIVE_FROM = 'EFFECTIVE_FROM',
  EFFECTIVE_TO = 'EFFECTIVE_TO',
  TOTAL_SI = "TOTAL_SI",
  TOTAL_PREMIUM = "TOTAL_PREMIUM",
  ENDORSEMENT_TYPE = "ENDORSEMENT_TYPE",
  APPLICABLE_DAYS = "APPLICABLE_DAYS",
}

export const POLICY_TEMPLATE_MOCK_NAMES = [
  "Liam Brown",
  "Olivia Smith",
  "Noah Wilson",
  "Ava Davis",
  "Mason Lee",
  "Sophia Taylor",
  "Lucas Harris",
  "Isabella Martin",
].map((n) => `${n} Fake`);

export const ENROLLMENT_EMPLOYEE_NAMES = [
  "Arjun Mehta",
  "Riya Singh",
  "Vikram Das",
  "Priya Nair",
  "Rahul Khanna",
  "Anita Roy",
  "Suresh Iyer",
  "Nisha Menon",
  "Karan Joshi",
  "Megha Gupta",
];

export const ENROLLMENT_SPOUSE_FEMALE_NAMES = [
  "Sonal Mehta",
  "Neha Singh",
  "Rekha Das",
  "Anjali Nair",
  "Pooja Khanna",
  "Kavya Roy",
  "Lakshmi Iyer",
  "Asha Menon",
  "Deepa Joshi",
  "Maya Gupta",
];

export const ENROLLMENT_SPOUSE_MALE_NAMES = [
  "Aman Singh",
  "Raj Nair",
  "Vikas Das",
  "Rohit Mehta",
  "Sanjay Khanna",
  "Tarun Roy",
  "Pranav Iyer",
  "Gaurav Menon",
  "Harish Joshi",
  "Nitin Gupta",
];

export const ENROLLMENT_SON_NAMES = [
  "Arnav Mehta",
  "Ishaan Singh",
  "Rohan Das",
  "Vivaan Nair",
  "Ayaan Khanna",
  "Dhruv Roy",
  "Aditya Iyer",
  "Krish Menon",
  "Parth Joshi",
  "Veer Gupta",
];

export const ENROLLMENT_DAUGHTER_NAMES = [
  "Anaya Mehta",
  "Kiara Singh",
  "Myra Das",
  "Aditi Nair",
  "Sara Khanna",
  "Tara Roy",
  "Aaradhya Iyer",
  "Diya Menon",
  "Ira Joshi",
  "Mira Gupta",
];

export const ENROLLMENT_FATHER_NAMES = [
  "Mahesh Mehta",
  "Rajesh Singh",
  "Suresh Das",
  "Raman Nair",
  "Pradeep Khanna",
  "Satish Roy",
  "Anand Iyer",
  "Gopal Menon",
  "Harish Joshi",
  "Narayan Gupta",
];

export const ENROLLMENT_MOTHER_NAMES = [
  "Kavita Mehta",
  "Sunita Singh",
  "Latha Das",
  "Indira Nair",
  "Shobha Khanna",
  "Uma Roy",
  "Lakshmi Iyer",
  "Shalini Menon",
  "Reena Joshi",
  "Aparna Gupta",
];

export const ENROLLMENT_RELATION_DATA: Record<string, any> = {
  Self: {
    names: ENROLLMENT_EMPLOYEE_NAMES,
    dob: "1990-01-31",
    gender: "Male",
    relation: "Self",
  },
  "Spouse/Partner": {
    names: ENROLLMENT_SPOUSE_FEMALE_NAMES,
    dob: "1992-02-28",
    gender: "Female",
    relation: "Spouse",
  },
  Husband: {
    names: ENROLLMENT_SPOUSE_MALE_NAMES,
    dob: "1988-05-31",
    gender: "Male",
    relation: "Husband",
  },
  Wife: {
    names: ENROLLMENT_SPOUSE_FEMALE_NAMES,
    dob: "1992-02-28",
    gender: "Female",
    relation: "Wife",
  },
  Spouse: {
    names: ENROLLMENT_SPOUSE_FEMALE_NAMES,
    dob: "1992-02-28",
    gender: "Female",
    relation: "Spouse",
  },
  Children: {
    names: ENROLLMENT_SON_NAMES,
    dob: "2015-03-31",
    gender: "Male",
    relation: "Son",
  },
  Son: {
    names: ENROLLMENT_SON_NAMES,
    dob: "2015-03-31",
    gender: "Male",
    relation: "Son",
  },
  Daughter: {
    names: ENROLLMENT_DAUGHTER_NAMES,
    dob: "2016-06-30",
    gender: "Female",
    relation: "Daughter",
  },
  Parents: {
    names: ENROLLMENT_FATHER_NAMES,
    dob: "1960-04-30",
    gender: "Male",
    relation: "Father",
  },
  Father: {
    names: ENROLLMENT_FATHER_NAMES,
    dob: "1960-04-30",
    gender: "Male",
    relation: "Father",
  },
  Mother: {
    names: ENROLLMENT_MOTHER_NAMES,
    dob: "1962-05-31",
    gender: "Female",
    relation: "Mother",
  },
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

export const ACTIVITY_NAME = {
  BD_PLANNING: "BD Planning",
  ISG_PLANNING: "ISG Planning",
  DATA_VALIDATION: "Data Validation",
  KDM_MEETING: "KDM Meeting",
  MANDATE_DETAILS_ENTRY: "Mandate Details Entry",
  RFP_DATA_COLLECTION: "RFP Data Collection",
  RFP_DETAILS_ENTRY: "RFP Details Entry",
  BROKING_SLIP_GENERATION: "Broking Slip Generation",
  ENTER_QUOTE: "Enter Quote",
  QCR_GENERATION: "QCR Generation",
  MEETING_FOR_FINAL_NEGOTIATION: "Meeting for Final Negotiation",
  PLACEMENT_SLIP_GENERATION: "Placement Slip",
  PREMIUM_CALCULATION: "Premium Calculation",
  HELD_COVER_NOTE: "Held Cover Note",
  POLICY_HARD_COPY_RECEIPT: "Policy Hard Copy Receipt",
  POLICY_DOCKET: "Policy Docket",
  HAND_OVER_MEET: "Hand over Meet",
  POLICY_CONFIRMATION: "Policy Confirmation",
};

// RO surfaces the "BD Planning" stage as "Renewal Planning" (the planning row is
// synthetic; the underlying status remains OPPORTUNITY_STATUS_BD_PLANNING).
export const RENEWAL_PLANNING_ACTIVITY_NAME = "Renewal Planning";

export const RO_ACTIVITY_NAME = {
  DATA_VALIDATION: "RSR Creation",
  KDM_MEETING: "Renewal KDM Meeting",
  MANDATE_DETAILS_ENTRY: "Renewal Mandate Details Entry",
  RFP_DATA_COLLECTION: "Renewal RFP Data Collection",
  RFP_DETAILS_ENTRY: "Renewal RFP Details Entry",
  BROKING_SLIP_GENERATION: "Broking Slip Generation",
  ENTER_QUOTE: "Enter Quote",
  QCR_GENERATION: "QCR Generation",
  MEETING_FOR_FINAL_NEGOTIATION: "Meeting for Final Negotiation",
  PLACEMENT_SLIP_GENERATION: "Placement Slip",
  PREMIUM_CALCULATION: "Premium Calculation",
  HELD_COVER_NOTE: "Held Cover Note",
  POLICY_HARD_COPY_RECEIPT: "Policy Hard Copy Receipt",
  POLICY_DOCKET: "Policy Docket",
  HAND_OVER_MEET: "Hand over Meet",
  POLICY_CONFIRMATION: "Policy Confirmation",
};

export const PENDING_ACTIVITIES_ALL_TYPE_LABELS: Record<string, string> = {
  opportunity_data_validation: "Data Validation / RSR Creation",
  opportunity_kdm_meeting: "Renewal / KDM Meeting",
  opportunity_mandate_details_entry: "Renewal / Mandate Details Entry",
  opportunity_rfp_cover_detail: "RFP Data Collection",
  opportunity_rfp_details_entry: "RFP Details Entry",
  opportunity_broking_slip_version_details: "Broking Slip Generation",
  opportunity_quote_entry: "Enter Quote",
  opportunity_quote_comparison_report: "QCR Generation",
  opportunity_final_negotiation: "Meeting for Final Negotiation",
  opportunity_placement_slip_generation: "Placement Slip Generation",
  opportunity_premium_calculation: "Premium Calculation",
  opportunity_held_cover_note: "Held Cover Note",
  opportunity_policy_hard_copy: "Policy Hard Copy Receipt",
  opportunity_policy_docket: "Policy Docket",
  opportunity_hand_over_meet: "Hand over Meet",
  opportunity_policy_confirmation: "Policy Confirmation",
};

export const RENEWAL_ACTIVITY_NAME_TABLE_MAP = {
  "RSR Creation": "opportunity_data_validation",
  "Renewal KDM Meeting": "opportunity_kdm_meeting",
  "Renewal Mandate Details Entry": "opportunity_mandate_details_entry",
  "Renewal RFP Data Collection": "opportunity_rfp_cover_detail",
  "Renewal RFP Details Entry": "opportunity_rfp_details_entry",
  "Broking Slip Generation": "opportunity_broking_slip_version_details",
  "Enter Quote": "opportunity_quote_entry",
  "QCR Generation": "opportunity_quote_comparison_report",
  "Meeting for Final Negotiation": "opportunity_final_negotiation",
  "Placement Slip Generation": "opportunity_placement_slip_generation",
  "Premium Calculation": "opportunity_premium_calculation",
  "Held Cover Note": "opportunity_held_cover_note",
  "Policy Hard Copy Receipt": "opportunity_policy_hard_copy",
  "Policy Confirmation": "opportunity_policy_confirmation",
  "Policy Docket": "opportunity_policy_docket",
  "Hand over Meet": "opportunity_hand_over_meet",
};

export const ACTIVITY_NAME_TABLE_MAP = {
  "Data Validation": "opportunity_data_validation",
  "KDM Meeting": "opportunity_kdm_meeting",
  "Mandate Details Entry": "opportunity_mandate_details_entry",
  "RFP Data Collection": "opportunity_rfp_cover_detail",
  "RFP Details Entry": "opportunity_rfp_details_entry",
  "Broking Slip Generation": "opportunity_broking_slip_version_details",
  "Enter Quote": "opportunity_quote_entry",
  "QCR Generation": "opportunity_quote_comparison_report",
  "Meeting for Final Negotiation": "opportunity_final_negotiation",
  "Placement Slip Generation": "opportunity_placement_slip_generation",
  "Premium Calculation": "opportunity_premium_calculation",
  "Held Cover Note": "opportunity_held_cover_note",
  "Policy Hard Copy Receipt": "opportunity_policy_hard_copy",
  "Policy Confirmation": "opportunity_policy_confirmation",
  "Policy Docket": "opportunity_policy_docket",
  "Hand over Meet": "opportunity_hand_over_meet",
};

export const SERVICE_TAT_SERVICE_NAMES = {
  ENDORSEMENT: "Endorsement",
  HEALTH_CLAIMS: "Health Claims",
  NON_HEALTH_CLAIMS: "Non Health Claims",
  MIR: "MIR",
  QUARTERLY_MEETING: "Quarterly Meeting",
  MONTHLY_MEETING: "Monthly Meeting",
  MULTILATERAL_MEETINGS: "Multilateral Meetings",
  RENEWAL_NOTICE: "Renewal Notice",
  RENEWAL_STRATEGY_REPORT: "Renewal Strategy Report",
  QCR_SUBMISSION: "QCR Submission",
  VALUE_ADDED_SERVICE: "Value Added Service",
} as const;

export const SERVICE_TAT_SERVICE_LIST = Object.values(
  SERVICE_TAT_SERVICE_NAMES,
);

export const EXCEL_TEMPLATE_FILE_NAMES = {
  ASSET_TEMPLATE_FILLED: "Assest-Template-Filled",
};

export const ORGANISATION_KEYS = {
  HOLDINGS: "iirm_holdings",
  SAFERISK: "saferisk",
  INDIA: "iirm_india",
  SRILANKA: "iirm_srilanka",
  KENYA: "iirm_kenya",
  MALDIVES: "iirm_maldives",
};

export const defaultFilter = (
  userId: number,
  firstName: string,
  lastName: string,
  organisationId: number,
  organisationName: string,
) => {
  return [
    {
      entity: "COMPANY",
      filterName: "SYSTEM_COMPANY",
      filterJson: {
        to: "",
        city: "",
        from: "",
        type: "",
        month: "",
        sbuId: "",
        period: "",
        status: { label: "Active", value: "Active" },
        viewBy: { label: "Manager + Team", value: "team" },
        ownerId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        branchId: "",
        priority: "",
        verticalId: "",
        companyType: "",
        financialYear: { label: "2025-2026", value: "2025" },
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
        industrySegment: "",
      },
      tableSettingJson: [
        { hide: false, name: "displayName", index: 0 },
        { hide: false, name: "leadCRM", index: 1 },
        { hide: false, name: "priority", index: 2 },
        { hide: false, name: "policyPremium", index: 3 },
        { hide: false, name: "roPremium", index: 4 },
        { hide: false, name: "soPremium", index: 5 },
        { hide: false, name: "status", index: 6 },
        { hide: true, name: "currency", index: 7 },
        { hide: true, name: "sumInsured", index: 8 },
        { hide: true, name: "city", index: 9 },
        { hide: true, name: "companyType", index: 10 },
        { hide: true, name: "sentiment", index: 11 },
        { hide: true, name: "country", index: 12 },
        { hide: true, name: "companyName", index: 13 },
        { hide: true, name: "industrySegment", index: 14 },
        { hide: true, name: "associateCrm", index: 15 },
      ],
    },
    {
      entity: "CONTACT",
      filterName: "SYSTEM_CONTACT",
      filterJson: {
        to: "2026-03-31",
        from: "2025-04-01",
        month: "",
        sbuId: "",
        branch: "",
        period: "",
        status: { label: "Active", value: "Active" },
        viewBy: { label: "Manager + Team", value: "team" },
        ownerId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        department: "",
        verticalId: "",
        financialYear: { label: "2025-2026", value: "2025" },
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
      },
      tableSettingJson: [
        { hide: false, name: "companyName", index: 0 },
        { hide: false, name: "contactName", index: 1 },
        { hide: false, name: "phone", index: 2 },
        { hide: false, name: "email", index: 3 },
        { hide: false, name: "department", index: 4 },
        { hide: false, name: "designation", index: 5 },
        { hide: false, name: "owner", index: 6 },
        { hide: false, name: "status", index: 7 },
      ],
    },
    {
      entity: "SALES_OPPORTUNITY",
      filterName: "SYSTEM_SALES_OPPORTUNITY",
      filterJson: {
        to: "",
        from: "",
        month: "",
        sbuId: "",
        state: null,
        period: "",
        viewBy: { label: "Manager + Team", value: "team" },
        ownerId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        branchId: "",
        verticalId: "",
        companyName: "",
        activityName: "",
        financialYear: "",
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
        opportunityContact: "",
        opportunityPriority: "",
        opportunityPolicyType: "",
        opportunityIndustrySegment: "",
      },
      tableSettingJson: [
        { hide: false, name: "companyName", index: 0 },
        { hide: false, name: "priority", index: 1 },
        { hide: false, name: "policyType", index: 2 },
        { hide: false, name: "expectedCloseDate", index: 3 },
        { hide: false, name: "activityName", index: 4 },
        { hide: false, name: "premium", index: 5 },
        { hide: false, name: "estimatedBrokerage", index: 6 },
        { hide: false, name: "assignedTo", index: 7 },
        { hide: false, name: "branch", index: 8 },
        { hide: true, name: "stageName", index: 9 },
        { hide: true, name: "opportunityCreationDate", index: 10 },
        { hide: true, name: "state", index: 11 },
        { hide: true, name: "industrySegment", index: 12 },
        { hide: true, name: "sumInsured", index: 13 },
      ],
    },
    {
      entity: "RENEWAL_OPPORTUNITY",
      filterName: "SYSTEM_RENEWAL_OPPORTUNITY",
      filterJson: {
        to: "",
        from: "",
        month: "",
        sbuId: "",
        state: null,
        period: "",
        viewBy: { label: "Manager + Team", value: "team" },
        ownerId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        branchId: "",
        verticalId: "",
        companyName: "",
        activityName: "",
        financialYear: "",
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
        opportunityContact: "",
        opportunityPriority: "",
        opportunityPolicyType: "",
        opportunityIndustrySegment: "",
      },
      tableSettingJson: [
        { hide: false, name: "companyName", index: 0 },
        { hide: false, name: "priority", index: 1 },
        { hide: false, name: "policyType", index: 2 },
        { hide: false, name: "expectedCloseDate", index: 3 },
        { hide: false, name: "premium", index: 4 },
        { hide: false, name: "activityName", index: 5 },
        { hide: false, name: "assignedTo", index: 6 },
        { hide: false, name: "branch", index: 7 },
        { hide: false, name: "policyId", index: 8 },
        { hide: true, name: "estimatedBrokerage", index: 9 },
        { hide: true, name: "stageName", index: 10 },
        { hide: true, name: "opportunityCreationDate", index: 11 },
        { hide: true, name: "state", index: 12 },
        { hide: true, name: "industrySegment", index: 13 },
        { hide: true, name: "sumInsured", index: 14 },
      ],
    },
    {
      entity: "POLICY",
      filterName: "SYSTEM_POLICY",
      filterJson: {
        to: "2026-03-31",
        from: "2025-04-01",
        month: "",
        sbuId: "",
        period: "",
        viewBy: { label: "Manager + Team", value: "team" },
        ownerId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        branchId: "",
        industry: "",
        policyType: "",
        verticalId: "",
        companyName: "",
        financialYear: { label: "2025-2026", value: "2025" },
        renewalPeriod: "",
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
        policyExpiryToDate: "",
        policyExpiryFromDate: "",
      },
      tableSettingJson: [
        { hide: false, name: "companyName", index: 0 },
        { hide: false, name: "policyType", index: 1 },
        { hide: false, name: "insurerPolicyNumber", index: 2 },
        { hide: false, name: "priority", index: 3 },
        { hide: false, name: "industry", index: 4 },
        { hide: false, name: "premium", index: 5 },
        { hide: false, name: "insurer", index: 6 },
        { hide: false, name: "policyFrom", index: 7 },
        { hide: false, name: "policyTo", index: 8 },
        { hide: false, name: "policyStatus", index: 9 },
        { hide: true, name: "sumInsured", index: 9 },
        { hide: true, name: "bdOwner", index: 10 },
        { hide: true, name: "accountManager", index: 11 },
        { hide: true, name: "policyStep", index: 12 },
        { hide: true, name: "currency", index: 13 },
        { hide: false, name: "brokerageAmount", index: 14 },
        { hide: false, name: "action", index: 15 },
        { hide: true, name: "contacts", index: 16 },
      ],
    },
    {
      entity: "DASHBOARD",
      filterName: "SYSTEM_DASHBOARD",
      filterJson: {
        month: { label: "All", value: "ALL" },
        owner: { label: "Manager + Team", value: "team" },
        sbuId: "",
        userId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        quarter: { label: "All", value: "ALL" },
        branchId: "",
        verticalId: "",
        departmentId: "",
        financialYear: { label: "2025-2026", value: "2025" },
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
      },
      tableSettingJson: [],
    },
    {
      entity: "BIZ_DONE_REPORT",
      filterName: "SYSTEM_BIZ_DONE_REPORT",
      filterJson: {
        month: { label: "All", value: "ALL" },
        owner: { label: "Manager + Team", value: "team" },
        sbuId: "",
        userId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        quarter: { label: "All", value: "ALL" },
        branchId: "",
        verticalId: "",
        departmentId: "",
        financialYear: { label: "2025-2026", value: "2025" },
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
      },
      tableSettingJson: [],
    },
    {
      entity: "CLAIMS",
      filterName: "SYSTEM_CLAIMS",
      filterJson: {
        to: "2026-03-31",
        from: "2025-04-01",
        month: "",
        sbuId: "",
        period: "",
        viewBy: { label: "Manager + Team", value: "team" },
        ownerId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        branchId: "",
        tatRange: "",
        verticalId: "",
        claimStatus: "",
        companyType: "",
        priorityLid: "",
        financialYear: { label: "2025-2026", value: "2025" },
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
        industrySegment: "",
        opportunityPolicyType: "",
      },
      tableSettingJson: [
        { hide: false, name: "companyName", index: 0 },
        { hide: false, name: "claimNumber", index: 1 },
        { hide: false, name: "policyType", index: 2 },
        { hide: false, name: "companyPriority", index: 3 },
        { hide: false, name: "claimDate", index: 4 },
        { hide: false, name: "status", index: 5 },
        { hide: false, name: "tatDays", index: 6 },
        { hide: false, name: "claimAmount", index: 7 },
      ],
    },
    {
      entity: "CLIENT_PORTFOLIO",
      filterName: "SYSTEM_CLIENT_PORTFOLIO",
      filterJson: {
        to: "2026-03-31",
        from: "2025-04-01",
        month: "",
        sbuId: "",
        period: { label: "3 Months", value: "3 Months" },
        status: { label: "Active", value: "Active" },
        viewBy: "",
        ownerId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        branchId: "",
        priority: "",
        verticalId: "",
        companyType: "",
        serviceScore: "",
        financialYear: { label: "2025-2026", value: "2025" },
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
      },
      tableSettingJson: [
        { hide: false, name: "companyName", index: 0 },
        { hide: true, name: "policyPremium", index: 1 },
        { hide: false, name: "roPremium", index: 2 },
        { hide: false, name: "roBrokerage", index: 3 },
        { hide: false, name: "roBrokerageQ1", index: 4 },
        { hide: false, name: "roBrokerageQ2", index: 5 },
        { hide: false, name: "roBrokerageQ3", index: 6 },
        { hide: false, name: "roBrokerageQ4", index: 7 },
        { hide: true, name: "soPremium", index: 8 },
        { hide: false, name: "priority", index: 9 },
        { hide: true, name: "claimAmount", index: 10 },
        { hide: false, name: "ServiceScore", index: 11 },
        { hide: false, name: "actions", index: 12 },
      ],
    },
    {
      entity: "ENDORSEMENT",
      filterName: "SYSTEM_ENDORSEMENT",
      filterJson: {
        to: "",
        from: "",
        month: "",
        sbuId: "",
        period: "",
        viewBy: { label: "Manager + Team", value: "team" },
        ownerId: {
          label: `${firstName} ${lastName}`,
          value: userId,
        },
        branchId: "",
        verticalId: "",
        financialYear: { label: "2025-2026", value: "2025" },
        organisationId: {
          label: organisationName,
          value: organisationId,
        },
        companyName: "",
        companyPriority: "",
        policyType: "",
        tatRange: "",
        status: "",
      },
      tableSettingJson: [
        { hide: false, name: "companyName", index: 0 },
        { hide: false, name: "endorsementId", index: 1 },
        { hide: false, name: "companyPriority", index: 2 },
        { hide: false, name: "policyNumber", index: 3 },
        { hide: false, name: "policyType", index: 4 },
        { hide: false, name: "endorsementDate", index: 5 },
        { hide: false, name: "TATDate", index: 6 },
        { hide: false, name: "status", index: 7 },
      ],
    },
  ];
};
/**
 * Hospital upload response messages for different scenarios
 * Used to provide consistent messaging based on upload results
 */
export const HOSPITAL_UPLOAD_MESSAGES = {
  ALL_SUCCESS: "All records were uploaded successfully.",
  PARTIAL_SUCCESS:
    "Upload completed successfully. ({errorCount}) records failed. Check 'Upload History' for details.",
  ALL_FAILED:
    "Upload completed successfully. None of the records were processed. Check 'Upload History' for details.",
} as const;

export const ROLE_SUPER_USER = "ROLE_SUPER_USER";
export * from "./constants";
export const ORG_SPECIFIC_LOOKUPS = ["POLICY_TYPE", "INDUSTRY_SEGMENT", "INSURER_BRANCH_TYPE","INSURANCE_TYPE"];

export const DEFAULT_SUB_DOMAIN = "default";

/**
 * Google OAuth related constants
 */
export const GOOGLE_OAUTH = {
  AUTH_BASE_URL: "https://accounts.google.com/o/oauth2/v2/auth",
  TOKEN_ENDPOINT: "https://oauth2.googleapis.com/token",
  USERINFO_ENDPOINT: "https://www.googleapis.com/oauth2/v2/userinfo",
  TOKENINFO_ENDPOINT: "https://www.googleapis.com/oauth2/v1/tokeninfo",
  SCOPE_ENCODED: encodeURIComponent("email profile"),
  RESPONSE_TYPE: "code",
  ACCESS_TYPE: "offline",
  PROMPT: "select_account",
  GRANT_TYPE: "authorization_code",
  CONTENT_TYPE_URLENCODED: "application/x-www-form-urlencoded",
  BEARER_PREFIX: "Bearer",
} as const;

/**
 * Encodes a value for safe embedding inside an inline <script> tag.
 * JSON.stringify escapes quotes/backslashes (producing a quoted JS string literal),
 * and escaping "<" prevents premature "</script>" tag termination / breakout.
 */
const encodeForInlineScript = (value: string): string =>
  JSON.stringify(String(value)).replace(/</g, "\\u003c");

/**
 * HTML template for successful OAuth redirect
 * @param redirectUrl - The URL to redirect to
 * @returns HTML string with JavaScript redirect
 */
export const getOAuthSuccessHtml = (redirectUrl: string): string => `
<!DOCTYPE html>
<html>
<head>
    <title>Redirecting...</title>
</head>
<body>
    <p>Authentication successful. Redirecting...</p>
    <script>
        window.location.href = ${encodeForInlineScript(redirectUrl)};
    </script>
</body>
</html>
`;

/**
 * HTML template for OAuth error redirect
 * @param errorRedirectUrl - The URL to redirect to with error
 * @returns HTML string with JavaScript redirect
 */
export const getOAuthErrorHtml = (errorRedirectUrl: string): string => `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Error</title>
</head>
<body>
    <p>Authentication failed. Redirecting...</p>
    <script>
        window.location.href = ${encodeForInlineScript(errorRedirectUrl)};
    </script>
</body>
</html>
`;

export const MICROSOFT_OAUTH = {
  AUTH_BASE_URL: (tenantId: string) =>
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
  TOKEN_ENDPOINT: (tenantId: string) =>
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
  USERINFO_ENDPOINT: "https://graph.microsoft.com/v1.0/me",
  SCOPE_ENCODED: encodeURIComponent("openid email profile User.Read"),
  RESPONSE_TYPE: "code",
  GRANT_TYPE: "authorization_code",
  CONTENT_TYPE_URLENCODED: "application/x-www-form-urlencoded",
  BEARER_PREFIX: "Bearer",
} as const;

export type LogStatus = "success" | "failure";
export const LOG_STATUS = {
  SUCCESS: "success" as LogStatus,
  FAILURE: "failure" as LogStatus,
};
export const DEFAULT_SET_DATE = {
  ZERO: 0,
  HOUR: 23,
  MINUTE: 59,
  SECOND: 59,
  MILLISECOND: 999,
};
export const DEFAULT_ENROLLMENT_TIME_OUT = 30000; // 30 second timeout

export type SearchArrayEntry = {
  searchBy: string;
  searchValue: string | number | Date | Array<string | number | Date>;
};

export const CaptchaProviders=['google-recaptcha-v3', 'cloudflare-turnstile'];

export const CONTACT_STATUS = {
  COMPANY: "company",
  INSURERS: "insurers",
};

export const UTILITY_UPLOAD_ENTITY = {
  TPA_UPLOAD: "TPA_UPLOAD",
  SEND_TO_INSURER: "SEND_TO_INSURER",
  SEND_TO_CLIENT: "SEND_TO_CLIENT",
  UPLOAD_INCEPTION: "UPLOAD_INCEPTION",
};

export const EMPLOYEE_INSURED_ENDORSEMENT_SELECT_FIELDS = [
  "employeeId",
  "endorsementId",
] as const;
export const EMPLOYEE_INSURED_ENDORSEMENT_ORDER = {
  endorsementId: "DESC" as const,
};

/**
 * Template Management System - Enums and Constants
 */

export enum ApprovalStatusEnum {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum WorkflowActionEnum {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  WITHDRAW = 'withdraw',
  REVISE = 'revise',
}

export enum TemplateStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export const TEMPLATE_NOTIFICATION_PARAMS = {
  SUBMITTER_USER_NAME: 'submitterUserName',
  APPROVER_USER_NAME: 'approverUserName',
  TEMPLATE_ID: 'templateId',
  TEMPLATE_NAME: 'templateName',
  COMMENTS: 'comments',
  URL: 'templateLink',
};

// Template workflow notification event type constants
export const TEMPLATE_NOTIFICATION_EVENTS = {
  TEMPLATE_SUBMIT: 'Template_Submit',
  TEMPLATE_APPROVE: 'Template_Approve',
  TEMPLATE_REJECT: 'Template_Reject',
}
export const TOGGLE_TYPE = {
  TOGGLE_TYPE_YES: "TOGGLE_TYPE_YES",
  TOGGLE_TYPE_NO: "TOGGLE_TYPE_NO",
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

export const EMPLOYEE_INSURED_RELATIONSHIP_GROUP = {
  SELF: "self",
  DEPENDENT: "dependent",
} as const;

export const EMPLOYEE_INSURED_CLAIM_STATUS_FILTER = {
  NO: "no",
  NONE: "none",
  YES: "yes",
  ACTIVE: "active",
} as const;

export const EMPLOYEE_INSURED_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
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

  export const ENTITY_TYPE_WITH_ORG_LINK = {
  POLICY: "policy",
  OPPORTUNITY: "opportunity",
  }

export const DEPENDENT_COUNT_INTERNAL_TYPE = "dependent-count";
export const MAX_DEPENDENT_COUNT_INTERNAL_TYPE = "max-dependent-count";
export const BENEFIT_COMPONENT_SI_VALUE = 0;
export const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Async BizDone report export (user_bizdone_report) lifecycle + type.
export enum UserBizdoneReportStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// Leaves room for other heavy exports to reuse the same table/worker later.
export enum UserBizdoneReportType {
  BIZDONE = "BIZDONE",
  SALES_OPPORTUNITY_LIST = "SALES_OPPORTUNITY_LIST",
  RENEWAL_OPPORTUNITY_LIST = "RENEWAL_OPPORTUNITY_LIST",
  POLICY_LIST = "POLICY_LIST",
  BUSINESS_TARGET = "BUSINESS_TARGET",
}