import { environment } from "../environment";

export * from "./errors";
export * from "./lookupValues";
export * from "./endPoints";
export * from "./regex";
export * from "./styleMap";
export * from "./types";
export * from "./currencyDisplayMode";
export * from "./hospital";
export type { DynamicObject } from "./types";

export const TOAST_DEFAULT_AUTO_HIDE_DURATION = 4000;
export const PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20];
export const NOT_AVAILABLE = "N/A";
export const ADD_ADDRESS = "Add Address";
export const NO_DATA_AVAILABLE = "No data available";
export const NO_DATA_FOUND = "No data found";
export const ADD_FIRST_ADDRESS = "Add first address";
export const SUBMIT = "Submit";
export const RESET = "Reset";
export const ADD = "Add";
export const EDIT_ADDRESS = "Edit Address";
export const CANCEL = "Cancel";
export const CANCEL_BUTTON = "Cancel";
export const UPDATE = "Update";
export const ADD_THREE_ADDRESS = "Add up to three address for this contact";
export const NO_ADDRESSES_ADDED = "No address added yet";
export const ADDRESSES = "Address";
export const SMART_SEARCH = "Smart search";
export const ERROR_MESSAGE = "Error occurred while setting data";
export const SUCCESS_MESSAGE = "Data set successfully";
export const PASSWORD = "password";
export const TEXT = "text";
export const ACTIVE = "active";
export const IS_SELECTED = "isSelected";
export const HOME = "Home";
export const DIVIDER = "divider";
export const TABLE_HEIGHT = 471;
export const GOOGLE_MAPS = "Google maps";
export const SEARCH = "Search";
export const SEARCH_EMPLOYEE_INSURED_NAME = "Search by employee name";
export const CLICK_TO_UPLOAD = "Click to upload";
export const DRAG_AND_DROP = "or drag & drop";
export const TRACXN = "Tracxn";
export const INVALID_DATE = "Invalid date";
export const NEXT = "Next";
export const GOOGLE_MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=";
export const CHIP_IMAGE = "Chip Image";
export const UPLOADED_FILE = "Uploaded File:";
export const MAX_FILE_SIZE_MB = 25;
export const UPLOAD_INSTRUCTION = `File size should be less than ${MAX_FILE_SIZE_MB} MB`;

// Scope IDs for nudge API
export const SCOPE_ID = {
  DASHBOARD: 1,
  COMPANY: 2,
  CONTACT: 3,
  SALES_OPPORTUNITY: 4,
  RENEWAL_OPPORTUNITY: 5,
  POLICY: 6,
  MEETING: 7,
  TASK: 8,
} as const;
export const DISCARD = "Discard";
export const SAVE = "Save";
export const MEETING_ATTACHMENTS = "Meeting Attachments";
export const MEETING_LINKS = "Meeting Links";
export const MEETING_PARTICIPANTS = "Meeting Participants";
export const PRIORITY_TYPE = "Priority & Type";
export const PRIORITY_STATUS = "Priority & status";
export const LINK_TO_OPPORTUNITY = "Link to Opportunity";
export const UNAUTHORIZED_ERROR =
  "You don’t have the required permissions to access this resource.";

export const UNAUTHORIZED = "Unauthorized";
export const FEEDBACK = "Feedback";
export const MEETING_DETAILS = "Meeting details";
export const DELETE = "Delete";
export const VALIDATION_ERROR_MESSAGE =
  "Please fill all the required fields in the form before proceeding";
export const VALIDATION_ERROR_MESSAGE_FOR_NON_GMC =
  "Ensure all fields are filled and valid before submitting";
export const RICH_TEXT_LIMIT_ERROR = "Maximum character limit exceeded.";
export const DISABLED = "Disabled";
export const TPA_CONTACT_PERSON_ERROR =
  "Please select at least one TPA contact person.";
export const INSURER_CONTACT_PERSON_ERROR =
  "Please select at least one Insurer contact person.";
export const COMPANY_OVERVIEW = "Companies overview";
export const COMPANY_OVERVIEW_SUBTITLE =
  "Select a company to view policy details";
export const CLIENT_PORTFOLIO = "My client portfolio";
export const POLICY_DETAILS_TITLE = "Policy details ";
export const POLICY_DETAILS_SUBTITLE =
  "Detailed policy information for the selected company";
export const SERVICE_SCORE_TITLE = "Service score";
export const SERVICE_SCORE_DETAILS = "Service score details";
export const SERVICE_SCORE_SUBTITLE = "Monthly service performance scores";
export const VIEW_DETAILS = "View details";
export const SAVE_VIEW = "Save view";
export const AI_CHAT_BOT = "Ask Echo";
export const NOT_APPLICABLE_NOTE =
  "indicates that the score is not applicable for this service.";
export const INACTIVE = "Inactive";

export const FILE_UPLOAD_SUCCESS_MESSAGE = (companyName: string): string =>
  `We have successfully captured the company name as ${companyName} from the document you have shared and we can use this to help you create the company and/or contact.`;

export enum httpMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export const INVALID_FILE_FORMAT = (accept: string): string =>
  `Invalid file format. Only ${accept
    .split(",")
    .map((ext) => ext.replace(".", "").toUpperCase())
    .join(", ")} files are supported.`;

export const PLEASE_SELECT_DOCUMENT_TYPE = "Please select Document Type";
export const FAILED_TO_DELETE_FILE = "Failed to delete file";
export const INVALID_BASE64_FILE_BUFFER = "Invalid base64 file buffer.";
export const UNSUPPORTED_FILE_BUFFER_TYPE = "Unsupported file buffer type.";
export const FILE_URL_OR_BUFFER_IS_MISSING =
  "File URL or buffer is missing. Cannot download.";
export const SELECT_DOCUMENT_TYPE = "Select document type";
export const CLAIMS_TITLE = "Claims management";
export const CLAIMS_SUBTITLE =
  "Track and manage all claims across your portfolio";
export const CLAIMS_CREATE_BUTTON = "Create new Claim";
export const CLAIMS_UPLOAD_BUTTON = "Upload Claim Data";
export const SELECT_NEW_FILE = "Select new file";

export const REMOVE_SECTION_CONFIRMATION_MESSAGE =
  "Are you sure you want to remove this section? This action cannot be undone.";

export const INVALID_DATA_MESSAGE = "Please fill valid data before proceeding.";

export const VALIDATION_MSG_POLICY_CHOICES_SECTION =
  "All policy choices must be configured before proceeding. Please ensure every option has its base policy and required addons set.";

export const BUTTON_LABELS = {
  NEXT: "Next",
  SUBMIT: "Submit",
  PREVIOUS: "Previous",
  SAVE_ACTIVITY: "Save activity",
  CREATE_TASK_MEETING: "Create task / Meeting for deviation",
  CANCEL: "Cancel",
  SAVE_AND_EXIT: "Save and Exit",
  PROCEED: "Proceed",
};

export const BUTTON_VARIANTS: Record<
  "PRIMARY" | "SECONDARY" | "LINK" | "ICON" | "ADD_BUTTON",
  "primary" | "secondary" | "link" | "icon" | "addButton"
> = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  LINK: "link",
  ICON: "icon",
  ADD_BUTTON: "addButton",
};

export const BUTTON_TYPE = {
  BUTTON: "button",
  SUBMIT: "submit",
  RESET: "reset",
} as const;

export const WORK_IN_PROGRESS = {
  TITLE: "Work in progress!",
  DESCRIPTION:
    "This page is currently under development. Please check back later.",
  IMAGE_ALT: "Work in Progress",
};

export const MORE = "more";

export const DATE_FORMATS = {
  DATE_MONTH_YEAR: "DD/MM/YYYY",
  YEAR_MONTH_DATE: "YYYY-MM-DD",
  YEAR: "YYYY",
  MONTH_YEAR: "MMM YYYY",
  DAY_SHORT_MONTH: "d MMM",
};
export const TIME_FORMATS = {
  HOUR_MINUTE_SECOND: "HH:mm:ss",
};

export const DATE_WITH_TIME_FORMATS = {
  DATE_MONTH_YEAR__TIME: "DD/MM/YYYY HH:mm",
  ISO_WITH_MILLISECONDS: "YYYY-MM-DDTHH:mm:ss+05:30",
  /* Lines 173-174 omitted */
};
export const DATE_FIELD_TYPES = {
  DATE: "date",
  YEAR: "year",
  MONTH_YEAR: "monthYear",
  DATE_TIME: "dateTime",
  TIME: "time",
};

export const TIME_TYPES = {
  HOURS: "hours",
  MINUTES: "minutes",
  SECONDS: "seconds",
};

export const RANGE_PICKER_TYPE = {
  DATE_RANGE: "daterange",
  TIME_RANGE: "timerange",
};

export const CREATE = "Create";
export const CLOSE_TASK = "Close task";

export const TaskMeetingNotesErrorMessages = {
  //common
  DATE_UPDATE_ERROR: "Date cannot be in the past. Please select a valid date.",
  DATE_UPDATE_SUCCESS: "Date updated successfully!",
  //task
  MY_TASKS: "My Tasks",
  TASK_UPDATED_SUCCESS: "Task updated successfully!",
  TASK_CLOSED_SUCCESS: "Task closed successfully!",
  TASK_CREATED_SUCCESS: "Task created successfully!",
  TASK_SAVE_ERROR: "An error occurred while saving the task.",
  TASK_DELETE_ERROR: "An error occurred while deleting the task.",
  TASK_NOT_FOUND: "Task not found.",
  TASK_FETCH_ERROR: "An error occurred while fetching the task.",
  TASK_ID_REQUIRED: "Task ID is required.",
  TASK_DELETE_SUCCESS: "Task deleted successfully!",
  TASK_COMPLETE_ERROR: "An error occurred while marking the task as completed.",
  TASK_DELETE_CONFIRMATION: "Are you sure you want to delete this task?",
  TASK_COMPLETED_CONFIRMATION:
    "Are you sure you want to mark this task as completed?",
  TASK_INCOMPLETE_CONFIRMATION:
    "Are you sure you want to mark this task as incomplete?",
  TASK_REQUIRED_FIELDS: "Please fill all the required fields in the task form.",
  TASK_DATE_UPDATE_ERROR:
    "Task Date cannot be in the past. Please select a valid date.",
  TASK_DATE_UPDATE_SUCCESS: "Task date updated successfully!",

  //for meeting
  MY_MEETINGS: "My Meetings",
  MY_APPROVALS: "My approvals",
  MY_ASSIGNMENTS: "My assignments",
  MEETING_UPDATED_SUCCESS: "Meeting updated successfully!",
  MEETING_CREATED_SUCCESS: "Meeting created successfully!",
  MEETING_SAVE_ERROR: "An error occurred while saving the meeting.",
  MEETING_DELETE_ERROR: "An error occurred while deleting the meeting.",
  MEETING_FETCH_ERROR: "An error occurred while fetching the meeting.",
  MEETING_NOT_FOUND: "Meeting not found.",
  MEETING_COMPLETED_CONFIRMATION:
    "Are you sure you want to mark this meeting as completed?",
  MEETING_INCOMPLETE_CONFIRMATION:
    "Are you sure you want to mark this meeting as incomplete?",
  MEETING_ID_REQUIRED: "Meeting ID is required.",
  MEETING_DELETE_CONFIRMATION: "Are you sure you want to delete this meeting?",
  MEETING_DELETE_SUCCESS: "Meeting deleted successfully!",
  MEETING_REQUIRED_FIELDS:
    "Please fill all the required fields in the meeting form.",
  MEETING_DATE_UPDATE_ERROR:
    "Meeting Date cannot be in the past. Please select a valid date.",
  MEETING_DATE_UPDATE_SUCCESS: "Meeting date updated successfully!",
  //Notes
  NOTES_DELETE_SUCCESS: "Notes deleted successfully!",
  NOTES_UPDATED_SUCCESS: "Notes updated successfully!",
  NOTES_CREATED_SUCCESS: "Notes created successfully!",
  NOTES_SAVE_ERROR: "An error occurred while saving the note.",
  NOTES_DELETE_ERROR: "An error occurred while deleting the note.",
  NOTES_FETCH_ERROR: "An error occurred while fetching the note.",
  NOTES_DELETE_CONFIRMATION: "Are you sure you want to delete this note?",
  NOTES_REQUIRED_FIELDS:
    "Please fill all the required fields in the note form.",
};
export const MeetingFeedBackForm = {
  TITLE: "Complete meeting",
  HOW_WAS_THE_MEETING: "How was the meeting?",
  CHALLENGES_FACED: "What are the challenges faced?",
  OUTCOMES: "What are the outcomes?",
  NEXT_STEPS: "What is the next step",
  REMARKS: "Any remarks?",
};
export const FEEDBACK_SUCCESS_MESSAGE = "Feedback submitted successfully!";
export const AI_CARD_TYPE =
  "Disclaimer: AI works best with common business card formats (may not support all).";

//meetings form

export const MEETING_FORM_ERROR_MESSAGE = {
  SUBJECT_REQUIRED_MESSAGE: "Meeting subject is required",
  AGENDA_REQUIRED_MESSAGE: "Meeting agenda is required",
  DATE_REQUIRED_MESSAGE: "Meeting date is required",
  MEETING_TYPE_REQUIRED: "Meeting type is required",
  MEETING_TIME_REQUIRED: "Meeting start and end time is required",
  COMPANY_CONTACTS_REQUIRED:
    "Company Contacts are required when a company is selected",
  INTERNAL_EMPLOYEES_REQUIRED:
    "Internal Employees are required if no Company, TPA, or Insurer is selected.",
  TPA_CONTACTS_REQUIRED: "TPA Contacts are required when a TPA is selected",
  INSURER_CONTACTS_REQUIRED:
    "Insurer Contacts are required when an Insurer is selected",
};

export const MEETING_FEEDBACK_DISPLAY_LABELS = {
  RATING: "Ratings",
  FEEDBACK: "Feedback",
  MEETING_OUTCOME: "Meeting Outcomes :",
  NEXT_STEPS: "Next Steps :",
  CHALLENGES_FACED: "Challenges Faced :",
  REMARKS: "Remarks :",
};

export const TPA = "tpa";
export const INSURER = "insurer";
export const TPA_CONTACT = "TPA contacts";
export const COMPANY_CONTACT = "Company contacts";
export const COMPANY = "company";
export const DOCUMENT_TYPE = "Document type";
export const REPORTEES = "Reportees";

export const ERROR_FILE = "Error file";

export const LESS = "less";
export const VIEW = "View";
export const CUSTOM_PAGE_SIZE = 20;

export const NO_DATA_TO_SHOW = "No data to show";

export const GENERIC_ERROR = "Something went wrong. Please try again.";

export const CUSTOMCOMPONENT = "customcomponent";
export const DRAG_AND_DROP_TEXT = "Drag and drop your file here, or";
export const CHOOSE_FILE = "Choose file";
export const SUPPORTED_FORMATS = "Supported formats: Excel (.xlsx, .xls)";
export const SUPPORTED_FORMATS_PDF_WORD =
  "Supported formats: PDF (.pdf), Word (.docx, .doc)";
export const DOWNLOAD_TEMPLATE = "Download template";
export const CD_ACCOUNT_DETAILS = "CD account details";
export const CREATE_CD_ACCOUNT = "Create CD account";
export const MANAGE_CD_ACCOUNT = "Manage CD account";
export const ADD_CD_BALANCE = "Add CD balance";
export const OVERVIEW_OF_ALL_CASH_DEPOSIT_ACCOUNTS =
  "Overview of all CD accounts";
export const EXPORT = "Export";

export const CD_BALANCE_INSUFFICIENT_TOOLTIP = {
  ENDORSEMENT: "CD balance is insufficient to process the endorsement.",
  INCEPTION: "CD balance is insufficient to process the inception.",
};

export const DOCUMENT_NAME = {
  ENDORSEMENT: "Endorsement Document",
  INCEPTION: "Inception Document",
};
export const ENDORSEMENT_DOCUMENT_REPLACED =
  "The previously uploaded file has been replaced with the new file.";

export const INCEPTION_RESTRICTION_MESSAGE =
  "Inception cannot be created right now. This option is only available for Group policies (GMC, GPA, GTL) that are fully set up with a Live configuration.";

export const ENDORSEMENT_RESTRICTION_MESSAGE =
  "Endorsement cannot be created right now. This option is only available for Group policies (GMC, GPA, GTL) that are fully set up with a Live configuration.";
export const ENDORSEMENT_DOCUMENT = "Endorsement Document";

// Business Performance Dashboard Constants
export const BUSINESS_PERFORMANCE = {
  LABELS: {
    USER: "user",
    BUSINESS_PERFORMANCE: "bussinessPerformance",
    MY_BUSINESS_PERFORMANCE: "My Business Performance",
    MY_BUSINESS_PERFORMANCE_QUARTERLY:
      "My Business Performance - Quarterly View",
    MY_SALES_FUNNEL: "My Sales Funnel",
    MY_RENEWAL_FUNNEL: "My Renewal Funnel",
    MY_PLACEMENT_FUNNEL: "My Placement Funnel",
    BROKERAGE_TO_COLLECT: "Brokerage To Collect",
    BUSINESS_COLLECTION_SUMMARY: "Business Collection Summary",
    ENDORSEMENT_TAT_BY_SBU: "Endorsement TAT by SBU",
    CLAIMS_TAT_BY_SBU: "Claims TAT by SBU",
    RENEWAL_SCHEDULE_BY_SBU: "RO by SBU",
    SALES_SCHEDULE_BY_SBU: "SO by SBU",
    PLACEMENT_SCHEDULE_BY_SBU: "Placement by SBU",
    MY_FOLLOW_UP: "My Follow Up",
    SO_FOLLOW_UP: "Follow up by SO Activity",
    RO_FOLLOW_UP: "Follow up by RO Activity",
    PLACEMENT_FOLLOW_UP: "Follow up by Placement Activity",
    MY_SERVICE_FOLLOW_UP: "My Service Follow Up",
    CLAIMS_OVERVIEW: "Claims Overview",
    BUSINESS_OVERVIEW: "Business Overview",
    ENDORSEMENT_TAT: "Endorsement TAT",
    CLAIMS_TAT: "Claims TAT",
    POLICY_TYPE_DISTRIBUTION: "Policy Type Distribution",
    VIEW_PORTFOLIO: "My Portfolio",
    CLIENT_SERVICE_ANALYSIS: "Client Service Analysis",
    POLICY_EXPIRY_TIMELINE: "Policy Expiry Timeline",
    MANAGE_SERVICE_SCORE: "Manage Service Score",
    MANAGE_CLAIMS: "Manage Claims",
    MANAGE_BUSINESS: "Manage Business",
    TOTAL_CLAIM_AMOUNT: "Total Claim Amount",
    TOTAL_BUSINESS_AMOUNT: "Total Business Amount",
    CUSTOMER_COUNT: "Customer Count",
    POLICY_COUNT: "Policy Count",
    CLAIM_COUNT: "Claim Count",
    PENDING_CLAIMS: "Pending Claims",
    RENEWALS_DUE: "Renewals Due",
    TOTAL_CUSTOMERS: "Total Companies",
    POLICIES: "Policies",
    PREMIUM: "Premium",
    BROKERAGE: "Brokerage",
    VIEW_MY_PORTFOLIO: "My Portfolio",
  },
  DESCRIPTIONS: {
    COUNT_PREMIUM_BROKERAGE: "Count, Premium, and Brokerage",
    CLIENT_SERVICE_SCORES: "Client service scores vs brokerage value",
    POLICIES_EXPIRING: "Policies expiring by time period",
  },
  ERRORS: {
    BUSINESS_PERFORMANCE_DATA: "Failed to load business performance data.",
    ENDORSEMENT_TAT_DATA: "Failed to load endorsement TAT data.",
    CLAIMS_TAT_DATA: "Failed to load claims TAT data.",
    POLICY_EXPIRY_TIMELINE_DATA: "Failed to load policy expiry timeline data.",
  },

  QUERY_KEYS: {
    BUSINESS_PERFORMANCE_DATA: "businessPerformanceData",
    TAT_SUMMARY_DATA: "tatSummaryData",
    POLICY_SUMMARY_DATA: "policySummaryData",
    BUSINESS_PERFORMANCE_QUARTERLY_DATA: "businessPerformanceQuarterlyData",
    OVERVIEW_DATA: "overviewData",
  },

  DATA_TYPES: {
    ENDORSEMENT: "endorsement",
    CLAIMS: "claims",
    POLICIES: "policies",
  },

  OVERVIEW_CARD_TYPES: {
    CLAIMS: "claimsOverview",
    BUSINESS: "businessOverview",
  },
};
export const FAILED_TO_UPDATE_CONFIG = "Failed to update filter config";
export const PREFERENCE_SAVED_SUCCESSFULLY = "Preferences saved successfully";

export const OPPORTUNITIES = "Opportunities";
export const CONTACTS = "Contacts";
export const RENEWAL_OPPORTUNITIES = "Renewal Opportunities";
export const CD_DEPOSIT_STATEMENT = "Cash deposit statement";
export const MANAGE_ENDORSEMENT = "Manage endorsements";
export const MANAGE_CLAIMS = "Manage claims";

export const BREADCRUMB_KEYS = {
  DASHBOARD: "Dashboard",
  COMPANY: "manage-company",
  CONTACT: "manage-contacts",
  SALES_OPPORTUNITY: "manage-so",
  RENEWAL_OPPORTUNITY: "manage-ro",
  MANAGE_QUOTES: "manage-quotes",
  POLICY: "manage-policies",
  ENDORSEMENT: "manage-endorsements",
  EMPLOYEE: "manage-employee",
  CLAIMS: "manage-claims",
  COMPANY_DETAILS: "company-details",
  POLICY_DETAILS: "policy-details",
  BIZ_DONE_REPORT: "biz-done-report",
  CD_MANAGEMENT: "cd-management",
  CLIENT_PORTFOLIO: "client-portfolio",
  OPPORTUNITY_DETAILS: "opportunity-details",
  CONTACT_DETAILS: "contact-details",
  BUSINESS_PERFORMANCE: "business-performance",
};

export const DETAILS_KEYS = {
  DASHBOARD: "dashboard",
  COMPANY: "company-details",
  CONTACT: "contact-details",
  SALES_OPPORTUNITY: "so-details",
  RENEWAL_OPPORTUNITY: "ro-details",
  POLICY: "policy-details",
  ENDORSEMENT: "endorsement-details",
  CD_MANAGEMENT: "cd-management-details",
  EMPLOYEE: "employee-details",
  NETWORK_HOSPITAL: "network-hospital-management",
  HOSPITALS: "view-hospitals",
  BUSINESS_PERFORMANCE: "business-performance",
  BIZ_DONE_REPORT: "biz-done-report",
};

export const DETAILS_LABELS = {
  DASHBOARD: "Dashboard",
  COMPANY: "Company details",
  CONTACT: "Contact details",
  SALES_OPPORTUNITY: "SO details",
  RENEWAL_OPPORTUNITY: "RO details",
  POLICY: "Policy details",
  ENDORSEMENT: "Endorsement details",
  EMPLOYEE: "Employee details",
  NETWORK_HOSPITAL: "Network Hospital Management",
  HOSPITALS: "View Hospitals",
  BUSINESS_PERFORMANCE: "Business Performance",
  BIZ_DONE_REPORT: "Biz Done Report",
};

export const GET_ENTITY_LABEL = (entityKey: string, contact?: boolean) =>
  "Manage " + entityKey.toLowerCase() + (contact ? " contact" : "");
export const BALANCE_UPDATE_SUCCESS_MESSAGE =
  "CD account number updated successfully.";
export const BALANCE_UPDATE_ERROR_MESSAGE =
  "Failed to update CD account number.";

export const POLICY_DETAILS_TABS = {
  TEXT: "Please go through all the policy details before proceeding with verification",
  APPROVE_TEXT:
    "Please go through all the policy details before proceeding with approval",

  REJECT: "Reject",
  APPROVE: "Approve",
  CANCEL: "Cancel",
  SAVE: "Save",
  APPROVE_POLICY_DETAILS: "Approve policy details",
  REJECT_POLICY_DETAILS: "Reject policy details",
  APPROVE_COVERS: "Approve covers",
  REJECT_COVERS: "Reject covers",
  APPROVE_CD_DETAILS: "Approve CD details",
  REJECT_CD_DETAILS: "Reject CD details",
  SUBMIT_FOR_APPROVAL: "Submit for Approval",
  APPROVED: "Approved",
};

export const POLICY_ALERT_BOX_DETAILS = {
  TITLE: "Request rejected",
  POLICYDETAILS_MESSAGE:
    "Policy Details Information is incorrect. Please re-check.",
  COVERS_MESSAGE: "Policy Covers information is incorrect. Please re-check.",
  CDDETAILS_MESSAGE:
    "Cash Deposit Account details are incorrect. Please re-check.",
};

export const COMMENTS_REQUIRED_MESSAGE = "Comments are required for rejection";
export const UNDER_REVIEW_TEXT = "Policy details are under approval from";

export const APPROVED_MESSAGE_BY_SECTION: Record<string, string> = {
  POLICY_DETAILS: "These details were approved by",
  POLICY_COVERS: "These cover details were approved by",
  POLICY_CD: "These CD details were approved by",
};

export const UNDER_REVIEW_MESSAGE_BY_SECTION: Record<string, string> = {
  POLICY_DETAILS: "Policy details are under approval from",
  POLICY_COVERS: "Cover details are under approval from",
  POLICY_CD: "CD details are under approval from",
};

export const ALERT_MESSAGES = {
  GENERIC_ERROR: "Something went wrong. Please try again.",
};

export const EMPLOYEE_DETAILS_SECTION = "Employee Details";
export const EDIT = "Edit";

export const PortalConfigurationTitle = "Select Portal Configuration Option";
export const MOVE_TO_EXCLUSION = "Move to Exclusion List";
export const MOVE_TO_INCLUSION = "Move to Inclusion List";
export const ALL_HOSPITALS = "All Hospitals";
export const INCLUSIONS = "Hospital Network";
export const EXCLUSIONS = "Excluded Hospitals";
export const SEARCH_PLACEHOLDER = "Search by Hospital name, address...";

// Bulk Download and Document related constants
export const BULK_DOWNLOAD = "Bulk Download";
export const LIST_OF_DOCUMENTS = "List of documents";
export const CONFIRM_DOWNLOAD = "Confirm Download";

export const BULK_DOWNLOAD_MESSAGES = {
  SELECT_AT_LEAST_ONE: "Please select at least one document",
  DOWNLOAD_FAILED_HTML: "Bulk download failed — server returned an error page.",
  DOWNLOAD_FAILED: "Bulk download failed. Try again.",
  DOWNLOAD_SUCCESS: (count: number) =>
    `Downloaded ZIP file with ${count} document${count > 1 ? "s" : ""}`,
};

export const DOWNLOAD_MESSAGES = {
  FAILED_HTML: "Download failed — server returned an error page.",
  FAILED: "Download failed. Try again.",
  CONFIRM_MESSAGE: (fileName: string) => `Do you want to download ${fileName}?`,
};

export const opportunityStatusOptions = [
  { value: "BD Planning", label: "BD Planning" },
  { value: "Active", label: "Active" },
  { value: "ISG Planning", label: "ISG Planning" },
  { value: "Won", label: "Won" },
  { value: "Lost", label: "Lost" },
];

export const getCurrentFinancialYearDefault = (): { value: string; label: string } => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 = Jan, 3 = Apr
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  return {
    value: fyStartYear.toString(),
    label: `${fyStartYear}-${fyStartYear + 1}`,
  };
};

// Canonical financial-year dropdown options: current FY down to
// environment.financialStartYear, newest first, labelled "2026-2027".
// Single source of truth for every FY selector in the app — smart-search
// fields, Business Performance, Rewards, Biz Done, and the Enhanced pages'
// period popover — so none of them can drift on how far back the list goes.
// Lives here rather than in iwork's businessPerformanceConfig (where it began)
// because ui-lib's OrgFinancialFilter needs it and ui-lib cannot import from
// iwork.
export const generateYearOptions = (): { value: string; label: string }[] => {
  try {
    const startYear = Number(environment.financialStartYear) || 2024;
    const currentFyStartYear = Number(getCurrentFinancialYearDefault().value);
    const years: { value: string; label: string }[] = [];
    for (let year = currentFyStartYear; year >= startYear; year--) {
      years.push({ value: year.toString(), label: `${year}-${year + 1}` });
    }
    return years;
  } catch (error) {
    console.error("generateYearOptions: Error generating year options", error);
    return [];
  }
};

// Canonical FY quarter → month mapping (FY runs Apr–Mar). Shared by every
// smart-search quarter/month field across the app plus the org-hierarchy
// period selector, so they never drift apart on "which months are in Q2".
export const getMonthsForQuarter = (
  quarter: "Q1" | "Q2" | "Q3" | "Q4"
): { value: string; label: string }[] => {
  const months: Record<"Q1" | "Q2" | "Q3" | "Q4", { value: string; label: string }[]> = {
    Q1: [
      { value: "April", label: "April" },
      { value: "May", label: "May" },
      { value: "June", label: "June" },
    ],
    Q2: [
      { value: "July", label: "July" },
      { value: "August", label: "August" },
      { value: "September", label: "September" },
    ],
    Q3: [
      { value: "October", label: "October" },
      { value: "November", label: "November" },
      { value: "December", label: "December" },
    ],
    Q4: [
      { value: "January", label: "January" },
      { value: "February", label: "February" },
      { value: "March", label: "March" },
    ],
  };
  return months[quarter] || [];
};

// Selectable BizDone export sheets (values match the backend sheet types).
export const REPORT_SHEET_OPTIONS: { value: string; label: string }[] = [
  { value: "policyDetails", label: "Policy Details wise Bizdone" },
  { value: "companySummary", label: "Company Summary wise Bizdone" },
  { value: "policySummary", label: "Policy Summary wise Bizdone" },
  { value: "insurerSummary", label: "Insurer Summary wise Bizdone" },
  { value: "coInsurerDetails", label: "Co-Insurer Details wise Bizdone" },
  { value: "rewards", label: "Rewards wise Bizdone" },
];

export const DEFAULT_REPORT_SHEETS = ["policyDetails"];

// Toast messages for the async BizDone report export flow (shared by the
// useReportExports hook and the Biz Done pages).
export const EXPORT_TOAST = {
  PREPARING:
    "Your report is being prepared. We'll notify you in Downloads when it's ready.",
  ALREADY_IN_PROGRESS: "Report is being generated, please wait.",
  START_FAILED: "Could not start the export. Please try again.",
  READY: "Your report is ready — open Downloads to get it.",
  FAILED: "A report export failed. Please try again.",
  DOWNLOAD_FAILED: "Could not download the report. Please try again.",
};

export const getAllMonths = (): { value: string; label: string; month: number }[] => [
  { value: "ALL", label: "All", month: 0 },
  { value: "January", label: "January", month: 1 },
  { value: "February", label: "February", month: 2 },
  { value: "March", label: "March", month: 3 },
  { value: "April", label: "April", month: 4 },
  { value: "May", label: "May", month: 5 },
  { value: "June", label: "June", month: 6 },
  { value: "July", label: "July", month: 7 },
  { value: "August", label: "August", month: 8 },
  { value: "September", label: "September", month: 9 },
  { value: "October", label: "October", month: 10 },
  { value: "November", label: "November", month: 11 },
  { value: "December", label: "December", month: 12 },
];
