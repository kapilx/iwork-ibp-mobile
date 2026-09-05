export enum FeatureKey {
  VIEW_DASHBOARD = "VIEW_DASHBOARD",
  VIEW_CHATBOT = "VIEW_CHATBOT",

  // Company
  CREATE_COMPANY = "CREATE_COMPANY",
  EDIT_COMPANY = "EDIT_COMPANY",
  VIEW_COMPANY = "VIEW_COMPANY",
  VIEW_ALL_COMPANIES = "VIEW_ALL_COMPANIES",
  IMPORT_COMPANY = "IMPORT_COMPANY",
  EXPORT_COMPANY = "EXPORT_COMPANY",
  DELETE_COMPANY = "DELETE_COMPANY",

  // Download permissions
  EXPORT_HOSPITAL_NETWORK = "EXPORT_HOSPITAL_NETWORK",
  EXPORT_ENDORSEMENTS = "EXPORT_ENDORSEMENTS",
  EXPORT_INCEPTION = "EXPORT_INCEPTION",
  EXPORT_POLICIES = "EXPORT_POLICIES",
  EXPORT_KNOWLEDGE_DOCUMENT = "EXPORT_KNOWLEDGE_DOCUMENT",
  EXPORT_ILEARN_DOCUMENT = "EXPORT_ILEARN_DOCUMENT",
  EXPORT_DOCUMENT_PREVIEW = "EXPORT_DOCUMENT_PREVIEW",
  EXPORT_DOCUMENTS = "EXPORT_DOCUMENTS",
  EXPORT_UPLOADED_FILES = "EXPORT_UPLOADED_FILES",
  EXPORT_DOCUMENT_TABLE = "EXPORT_DOCUMENT_TABLE",
  EXPORT_UPLOAD_TEMPLATE = "EXPORT_UPLOAD_TEMPLATE",
  EXPORT_HOSPITAL_LISTING = "EXPORT_HOSPITAL_LISTING",
  EXPORT_CLAIMS = "EXPORT_CLAIMS",
  EXPORT_CD_MANAGEMENT = "EXPORT_CD_MANAGEMENT",

  // Contact
  CREATE_CONTACT = "CREATE_CONTACT",
  EDIT_CONTACT = "EDIT_CONTACT",
  VIEW_CONTACT = "VIEW_CONTACT",

  // Opportunity
  CREATE_OPPORTUNITY = "CREATE_OPPORTUNITY",
  EDIT_OPPORTUNITY = "EDIT_OPPORTUNITY",
  VIEW_OPPORTUNITY = "VIEW_OPPORTUNITY",
  SUBMIT_FOR_OPPORTUNITY_APPROVAL = "SUBMIT_FOR_OPPORTUNITY_APPROVAL",
  EXPORT_OPPORTUNITY = "EXPORT_OPPORTUNTIY",
  APPROVE_OPPORTUNITY = "APPROVE_OPPORTUNITY",
  APPROVE_ISG_OPPORTUNITY = "APPROVE_ISG_OPPORTUNITY",
  APPROVE_BD_OPPORTUNITY = "APPROVE_BD_OPPORTUNITY",
  ASSIGN_BD_OPPORTUNITY = "ASSIGN_BD_OPPORTUNITY",
  // TPA
  CREATE_TPA = "CREATE_TPA",
  EDIT_TPA = "EDIT_TPA",
  VIEW_TPA = "VIEW_TPA",

  // Broker
  CREATE_BROKER = "CREATE_BROKER",
  EDIT_BROKER = "EDIT_BROKER",
  VIEW_BROKER = "VIEW_BROKER",

  // Insurer
  CREATE_INSURER = "CREATE_INSURER",
  EDIT_INSURER = "EDIT_INSURER",
  VIEW_INSURER = "VIEW_INSURER",

  // Insurer Rewards
  CREATE_REWARD = "CREATE_REWARD",
  EDIT_REWARD = "EDIT_REWARD",
  VIEW_REWARD = "VIEW_REWARD",
  DELETE_REWARD = "DELETE_REWARD",
  EXPORT_REWARD = "EXPORT_REWARD",

  // TPA Contact
  CREATE_TPA_CONTACT = "CREATE_TPA_CONTACT",
  EDIT_TPA_CONTACT = "EDIT_TPA_CONTACT",
  VIEW_TPA_CONTACT = "VIEW_TPA_CONTACT",

  // Broker Contact
  CREATE_BROKER_CONTACT = "CREATE_BROKER_CONTACT",
  EDIT_BROKER_CONTACT = "EDIT_BROKER_CONTACT",
  VIEW_BROKER_CONTACT = "VIEW_BROKER_CONTACT",

  // Portal configuration
  VIEW_PORTAL_CONFIGURATION = "VIEW_PORTAL_CONFIGURATION",
  EDIT_PORTAL_CONFIGURATION = "EDIT_PORTAL_CONFIGURATION",
  APPROVE_PORTAL_CONFIGURATION = "APPROVE_PORTAL_CONFIGURATION",

  // Insurer Contact
  CREATE_INSURER_CONTACT = "CREATE_INSURER_CONTACT",
  EDIT_INSURER_CONTACT = "EDIT_INSURER_CONTACT",
  VIEW_INSURER_CONTACT = "VIEW_INSURER_CONTACT",

  // OPTY_ACTIVITY
  VIEW_OPTY_ACTIVITY = "VIEW_OPTY_ACTIVITY",
  CREATE_OPTY_ACTIVITY = "CREATE_OPTY_ACTIVITY",
  EXPORT_OPTY_ACTIVITY = "EXPORT_OPTY_ACTIVITY",
  EDIT_BD_OPTY_ACTIVITY = "EDIT_BD_OPTY_ACTIVITY",
  EDIT_ISG_OPTY_ACTIVITY = "EDIT_ISG_OPTY_ACTIVITY",
  VIEW_BD_ACTIVITY = "VIEW_BD_ACTIVITY",
  VIEW_ISG_ACTIVITY = "VIEW_ISG_ACTIVITY",
  ASSIGN_BD_ACTIVITY = "ASSIGN_BD_ACTIVITY",
  ASSIGN_ISG_ACTIVITY = "ASSIGN_ISG_ACTIVITY",
  PLAN_ISG_ACTIVITY = "PLAN_ISG_ACTIVITY",
  PLAN_BD_ACTIVITY = "PLAN_BD_ACTIVITY",
  ADD_QUOTATION = "ADD_QUOTATION",

  // RD_BD_001
  VIEW_RD_BD = "VIEW_RD_BD",
  CREATE_RD_BD = "CREATE_RD_BD",
  EDIT_RD_BD = "EDIT_RD_BD",

  // MEETING
  VIEW_MEETING = "VIEW_MEETING",
  CREATE_MEETING = "CREATE_MEETING",
  EDIT_MEETING = "EDIT_MEETING",
  EXPORT_MEETING = "EXPORT_MEETING",

  // TASK
  VIEW_TASK = "VIEW_TASK",
  CREATE_TASK = "CREATE_TASK",
  EDIT_TASK = "EDIT_TASK",

  // EMPLOYEE
  VIEW_EMPLOYEE = "VIEW_EMPLOYEE",
  CREATE_EMPLOYEE = "CREATE_EMPLOYEE",
  EDIT_EMPLOYEE = "EDIT_EMPLOYEE",

  // MASTER
  VIEW_MASTER = "VIEW_MASTER",
  CREATE_MASTER = "CREATE_MASTER",
  EDIT_MASTER = "EDIT_MASTER",

  // FILE_UPLOAD
  VIEW_FILE_UPLOAD = "VIEW_FILE_UPLOAD",
  CREATE_FILE_UPLOAD = "CREATE_FILE_UPLOAD",
  EDIT_FILE_UPLOAD = "EDIT_FILE_UPLOAD",

  // ADDRESS
  VIEW_ADDRESS = "VIEW_ADDRESS",
  CREATE_ADDRESS = "CREATE_ADDRESS",
  EDIT_ADDRESS = "EDIT_ADDRESS",

  // LOOK_UP
  VIEW_LOOK_UP = "VIEW_LOOK_UP",
  CREATE_LOOK_UP = "CREATE_LOOK_UP",
  EDIT_LOOK_UP = "EDIT_LOOK_UP",

  // NOTE
  VIEW_NOTE = "VIEW_NOTE",
  CREATE_NOTE = "CREATE_NOTE",
  EDIT_NOTE = "EDIT_NOTE",
  PERMISSION_MEETING = "PERMISSION_MEETING",
  APPROVE_MEETING = "APPROVE_MEETING",

  // Policy
  CONFIGURE_POLICY_APPROVAL = "CONFIGURE_POLICY_APPROVAL",
  VIEW_POLICY = "VIEW_POLICY",
  CREATE_POLICY = "CREATE_POLICY",
  EDIT_POLICY = "EDIT_POLICY",
  ACTIVATE_POLICY = "ACTIVATE_POLICY",
  RECONFIGURE_POLICY = "RECONFIGURE_POLICY",
  POLICY_APPROVAL = "POLICY_APPROVAL",
  EDIT_LIVE_POLICY_CONFIGURATION = "EDIT_LIVE_POLICY_CONFIGURATION",
  DOWNLOAD_EMPLOYEE_DETAILS = "DOWNLOAD_EMPLOYEE_DETAILS",
  FINANCIAL_INFORMATION = "FINANCIAL_INFORMATION",

  //Admin Module Reports
  VIEW_ADMIN_REPORTS = "VIEW_ADMIN_REPORTS",
  CREATE_ADMIN_REPORTS = "CREATE_ADMIN_REPORTS",
  EDIT_ADMIN_REPORTS = "EDIT_ADMIN_REPORTS",
  EXPORT_ADMIN_REPORTS = "EXPORT_ADMIN_REPORTS",

  //Admin Module Roles
  VIEW_ADMIN_ROLES = "VIEW_ADMIN_ROLES",
  CREATE_ADMIN_ROLES = "CREATE_ADMIN_ROLES",
  EDIT_ADMIN_ROLES = "EDIT_ADMIN_ROLES",

  //Admin Module Migration Log
  VIEW_MIGRATION_LOG = "VIEW_MIGRATION_LOG",

  EDIT_CRON_CONFIGURATION = "EDIT_CRON_CONFIGURATION",
  //Service Catalog
  VIEW_SERVICE_CATALOG = "VIEW_SERVICE_CATALOG",

  //Release Notes
  VIEW_RELEASE_NOTES = "VIEW_RELEASE_NOTES",
  CREATE_RELEASE_NOTES = "CREATE_RELEASAE_NOTES",
  EDIT_RELEASE_NOTES = "EDIT_RELEASE_NOTES",

  //Template Management
  VIEW_TEMPLATE_MANAGEMENT = "VIEW_TEMPLATE_MANAGEMENT",
  CREATE_TEMPLATE_MANAGEMENT = "CREATE_TEMPLATE_MANAGEMENT",
  EDIT_TEMPLATE_MANAGEMENT = "EDIT_TEMPLATE_MANAGEMENT",
  DELETE_TEMPLATE_MANAGEMENT= "DELETE_TEMPLATE_MANAGEMENT",
  APPROVE_TEMPLATE_MANAGEMENT= "APPROVE_TEMPLATE_MANAGEMENT",
  REJECT_TEMPLATE_MANAGEMENT= "REJECT_TEMPLATE_MANAGEMENT",

  //Download Biz Done Report
  DOWNLOAD_BUSINESS_PERFORMANCE_REPORT = "DOWNLOAD_BUSINESS_PERFORMANCE_REPORT",
  VIEW_BUSINESS_PERFORMANCE_REPORT = "VIEW_BUSINESS_PERFORMANCE_REPORT",

  VIEW_BUSINESS_TARGET = "VIEW_BUSINESS_TARGET",
  MANAGE_BUSINESS_TARGET = "MANAGE_BUSINESS_TARGET",
  EXPORT_BUSINESS_TARGET = "EXPORT_BUSINESS_TARGET",

  //Endorsements
  VIEW_ENDORSEMENT = "VIEW_ENDORSEMENT",
  CREATE_ENDORSEMENT = "CREATE_ENDORSEMENT",
  EDIT_ENDORSEMENT = "EDIT_ENDORSEMENT",

  //Claims
  VIEW_CLAIMS = "VIEW_CLAIMS",
  CREATE_CLAIMS = "CREATE_CLAIMS",
  EDIT_CLAIMS = "EDIT_CLAIMS",
  EXTEND_OPPORTUNITY_EXPIRY = "EXTEND_OPPORTUNITY_EXPIRY",
  // Bulk Assignment
  BULK_EDIT_READ = "BULK_EDIT_READ",
  BULK_EDIT_WRITE = "BULK_EDIT_WRITE",
  BULK_DOWNLOAD_ENABLE = "BULK_DOWNLOAD_ENABLE",
  FILE_PASSWORD_CONFIGURATION_ENABLE = "FILE_PASSWORD_CONFIGURATION_ENABLE",
  MANAGE_DOCUMENTS = "MANAGE_DOCUMENTS",

  // AI Nudge Access
  VIEW_AI_NUDGE_ACCESS = "VIEW_AI_NUDGE_ACCESS",

  //CD Management
  EXPORT_CD_DETAILS = "EXPORT_CD_DETAILS",
  MERGE_CD_ACCOUNTS = "MERGE_CD_ACCOUNTS",
  // PII Reveal
  REVEAL_PII = "REVEAL_PII",
}

export enum ScopeKey {
  IWORK = "iWork",
  CONFIG_SERVICE = "config-service",
}

export enum CategoryKey {
  DASHBOARD = "DASHBOARD",
  COMPANY = "COMPANY",
  CONTACT = "CONTACT",
  OPPORTUNITY = "OPTY",
  TPA = "TPA",
  BROKER = "BROKER",
  INSURER = "INSURER",
  INSURER_REWARDS = "INSURER_REWARDS",
  TPA_CONTACT = "TPA_CONTACT_001",
  BROKER_CONTACT = "BROKER_CONTACT_001",
  INSURER_CONTACT = "INSURER_CONTACT_001",
  OPTY_ACTIVITY = "OPTY_ACTIVITY",
  RD_BD_001 = "RD_BD_001",
  MEETING = "MEETING",
  TASK = "TASK",
  EMPLOYEE = "EMPLOYEE",
  MASTER = "MASTER",
  FILE_UPLOAD = "FILE_UPLOAD",
  ADDRESS = "ADDRESS",
  LOOK_UP = "LOOK_UP",
  NOTE = "NOTE",
  POLICY = "POLICY_CONFIGURE",
  BD_ACTIVITY = "BD_ACTIVITY",
  ISG_ACTIVITY = "ISG_ACTIVITY",
  ADMIN_REPORTS = "ADMIN_REPORTS",
  ADMIN_ROLES = "ADMIN_ROLES",
  ADMIN_RELEASE_NOTES = "ADMIN_RELEASE_NOTES",
  MIGRATION_LOG = "MIGRATION_LOG",
  SERVICE_CATALOG = "SERVICE_CATALOG",
  TEMPLATE_MANAGEMENT = "TEMPLATE_MANAGEMENT",
  BUSINESS_PERFORMACE = "BUSINESS_PERFORMACE",
  BUSINESS_TARGET = "BUSINESS_TARGET",
  POLICIES = "POLICIES",
  CLAIMS = "CLAIMS",
  ENDORSEMENTS = "ENDORSEMENTS",
  INCEPTION = "INCEPTION",
  BULK_EDIT = "BULK_EDIT",
  BULK_DOWNLOAD = "BULK_DOWNLOAD",
  FILE_PASSWORD_CONFIGURATION = "FILE_PASSWORD_CONFIGURATION",
  DOCUMENT_MANAGEMENT = "DOCUMENT_MANAGEMENT",
  CHAT_BOT = "CHAT_BOT",
  AI_NUDGE_ACCESS = "AI_NUDGE_ACCESS",
  COMPANY_CONFIGURATION = "COMPANY_CONFIGURATION",
  PII_REVEAL = "PII_REVEAL",
  APPLICATION_SCHEDULER_CONFIGURATION = "APPLICATION_SCHEDULER_CONFIGURATION",
  HOSPITAL_NETWORK = "HOSPITAL_NETWORK",
  HOSPITAL_LISTING = "HOSPITAL_LISTING",
  UPLOAD_TEMPLATE = "UPLOAD_TEMPLATE",
  KNOWLEDGE_DOCUMENT = "KNOWLEDGE_DOCUMENT",
  ILEARN_DOCUMENT = "ILEARN_DOCUMENT",
  DOCUMENT_PREVIEW = "DOCUMENT_PREVIEW",
  DOCUMENTS = "DOCUMENTS",
  UPLOADED_FILES = "UPLOADED_FILES",
  DOCUMENT_TABLE = "DOCUMENT_TABLE",
  CD_MANAGEMENT = "CD_MANAGEMENT",
}

export enum ActionKey {
  READ = "READ_001",
  WRITE = "WRITE_001",
  UPDATE = "UPDATE_001",
  IMPORT = "IMPORT_001",
  EXPORT = "EXPORT_001",
  DELETE = "DELETE_001",
  ENABLE = "ENABLE_001",
  REJECT = "REJECT_001",
  APPROVE = "APPROVE_001",
  APPROVE_ISG = "APPROVE_ISG_001",
  REJECT_ISG = "REJECT_ISG_001",
  ASSIGN_ISG = "ISG_ASSIGN_001",
  ISG_PLAN_001 = "ISG_PLAN_001",
  ISG_READ_001 = "ISG_READ_001",
  ISG_WRITE_001 = "ISG_WRITE_001",
  APPROVE_BD = "APPROVE_BD_001",
  REJECT_BD = "REJECT_BD_001",
  ASSIGN_BD = "BD_ASSIGN_001",
  BD_PLAN_001 = "BD_PLAN_001",
  BD_READ_001 = "BD_READ_001",
  BD_WRITE_001 = "BD_WRITE_001",
  EXTEND_OPPORTUNITY_EXPIRY = "EXTEND_OPTY_001",
  ACTIVATE = "ACTIVATE_POLICY_001",
  RECONFIGURE_POLICY = "RECONFIGURE_POLICY_001",
  APPROVE_POLICY = "APPROVE_POLICY_CHANGES_001",
  ADD_QUOTE = "ADD_QUOTE_001",
  POLICY_CONFIGURE_LIVE_EDIT = "POLICY_CONFIGURE_LIVE_EDIT_001",
  DOWNLOAD_EMPLOYEE_DETAILS = "DOWNLOAD_EMPLOYEE_DETAILS_001",
  FINANCIAL_INFORMATION = "FINANCIAL_INFORMATION_001",
  MERGE_CD_ACCOUNTS = "MERGE_CD_ACCOUNTS_001",
  VIEW_ALL = "VIEW_ALL_001",
}

export interface FeaturePermission {
  scope: ScopeKey;
  category: CategoryKey;
  action: ActionKey;
}

export const featurePermissionMap: Record<FeatureKey, FeaturePermission> = {
  [FeatureKey.VIEW_DASHBOARD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.DASHBOARD,
    action: ActionKey.READ,
  },
  [FeatureKey.EDIT_CRON_CONFIGURATION]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.APPLICATION_SCHEDULER_CONFIGURATION,
    action: ActionKey.UPDATE,
  },

  [FeatureKey.VIEW_CHATBOT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CHAT_BOT,
    action: ActionKey.READ,
  },

  // COMPANY
  [FeatureKey.CREATE_COMPANY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.COMPANY,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_COMPANY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.COMPANY,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_COMPANY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.COMPANY,
    action: ActionKey.READ,
  },
  [FeatureKey.VIEW_ALL_COMPANIES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.COMPANY,
    action: ActionKey.VIEW_ALL,
  },
  [FeatureKey.IMPORT_COMPANY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.COMPANY,
    action: ActionKey.IMPORT,
  },
  [FeatureKey.EXPORT_COMPANY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.COMPANY,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.DELETE_COMPANY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.COMPANY,
    action: ActionKey.DELETE,
  },
  [FeatureKey.EXPORT_HOSPITAL_NETWORK]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.HOSPITAL_NETWORK,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_ENDORSEMENTS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ENDORSEMENTS,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_INCEPTION]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INCEPTION,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_POLICIES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_KNOWLEDGE_DOCUMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.KNOWLEDGE_DOCUMENT,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_ILEARN_DOCUMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ILEARN_DOCUMENT,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_DOCUMENT_PREVIEW]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_UPLOAD,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_DOCUMENTS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_UPLOAD,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_UPLOADED_FILES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_UPLOAD,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_DOCUMENT_TABLE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_UPLOAD,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_UPLOAD_TEMPLATE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_UPLOAD,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_HOSPITAL_LISTING]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.HOSPITAL_NETWORK,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_CLAIMS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CLAIMS,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.EXPORT_CD_MANAGEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CD_MANAGEMENT,
    action: ActionKey.EXPORT,
  },
  // BULK ASSIGNMENT / BULK EDIT
  [FeatureKey.BULK_EDIT_READ]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BULK_EDIT,
    action: ActionKey.READ,
  },
  [FeatureKey.BULK_EDIT_WRITE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BULK_EDIT,
    action: ActionKey.WRITE,
  },
  [FeatureKey.BULK_DOWNLOAD_ENABLE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BULK_DOWNLOAD,
    action: ActionKey.ENABLE,
  },
  [FeatureKey.FILE_PASSWORD_CONFIGURATION_ENABLE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_PASSWORD_CONFIGURATION,
    action: ActionKey.ENABLE,
  },
  [FeatureKey.MANAGE_DOCUMENTS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.DOCUMENT_MANAGEMENT,
    action: ActionKey.ENABLE,
  },

  // AI NUDGE ACCESS
  [FeatureKey.VIEW_AI_NUDGE_ACCESS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.AI_NUDGE_ACCESS,
    action: ActionKey.READ,
  },

  // CONTACT
  [FeatureKey.CREATE_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CONTACT,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CONTACT,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CONTACT,
    action: ActionKey.READ,
  },

  // OPPORTUNITY
  [FeatureKey.CREATE_OPPORTUNITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPPORTUNITY,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_OPPORTUNITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPPORTUNITY,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.EXPORT_OPPORTUNITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPPORTUNITY,
    action: ActionKey.EXPORT
  },
  [FeatureKey.VIEW_OPPORTUNITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPPORTUNITY,
    action: ActionKey.READ,
  },
  [FeatureKey.EXTEND_OPPORTUNITY_EXPIRY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPPORTUNITY,
    action: ActionKey.EXTEND_OPPORTUNITY_EXPIRY,
  },
  [FeatureKey.ADD_QUOTATION]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPPORTUNITY,
    action: ActionKey.ADD_QUOTE,
  },

  // TPA
  [FeatureKey.CREATE_TPA]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TPA,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_TPA]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TPA,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_TPA]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TPA,
    action: ActionKey.READ,
  },

  // BROKER
  [FeatureKey.CREATE_BROKER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BROKER,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_BROKER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BROKER,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_BROKER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BROKER,
    action: ActionKey.READ,
  },

  // INSURER
  [FeatureKey.CREATE_INSURER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_INSURER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_INSURER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER,
    action: ActionKey.READ,
  },

  // Insurer Rewards
  [FeatureKey.CREATE_REWARD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER_REWARDS,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_REWARD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER_REWARDS,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_REWARD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER_REWARDS,
    action: ActionKey.READ,
  },
  [FeatureKey.DELETE_REWARD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER_REWARDS,
    action: ActionKey.DELETE,
  },
  [FeatureKey.EXPORT_REWARD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER_REWARDS,
    action: ActionKey.EXPORT,
  },
  // TPA CONTACT
  [FeatureKey.CREATE_TPA_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TPA_CONTACT,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_TPA_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TPA_CONTACT,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_TPA_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TPA_CONTACT,
    action: ActionKey.READ,
  },
  // BROKER CONTACT
  [FeatureKey.CREATE_BROKER_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BROKER_CONTACT,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_BROKER_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BROKER_CONTACT,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_BROKER_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BROKER_CONTACT,
    action: ActionKey.READ,
  },

  // PORTAL CONFIGURATION
  [FeatureKey.VIEW_PORTAL_CONFIGURATION]: {
    scope: ScopeKey.CONFIG_SERVICE,
    category: CategoryKey.COMPANY_CONFIGURATION,
    action: ActionKey.READ,
  },
  [FeatureKey.EDIT_PORTAL_CONFIGURATION]: {
    scope: ScopeKey.CONFIG_SERVICE,
    category: CategoryKey.COMPANY_CONFIGURATION,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.APPROVE_PORTAL_CONFIGURATION]: {
    scope: ScopeKey.CONFIG_SERVICE,
    category: CategoryKey.COMPANY_CONFIGURATION,
    action: ActionKey.APPROVE,
  },
  // INSURER CONTACT
  [FeatureKey.CREATE_INSURER_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER_CONTACT,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_INSURER_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER_CONTACT,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.VIEW_INSURER_CONTACT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.INSURER_CONTACT,
    action: ActionKey.READ,
  },

  // OPTY_ACTIVITY
  [FeatureKey.VIEW_OPTY_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPTY_ACTIVITY,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_OPTY_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPTY_ACTIVITY,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EXPORT_OPTY_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPTY_ACTIVITY,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.SUBMIT_FOR_OPPORTUNITY_APPROVAL]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPTY_ACTIVITY,
    action: ActionKey.READ,
  },
  [FeatureKey.APPROVE_OPPORTUNITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPTY_ACTIVITY,
    action: ActionKey.APPROVE,
  },
  [FeatureKey.ASSIGN_BD_OPPORTUNITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.OPTY_ACTIVITY,
    action: ActionKey.ASSIGN_BD,
  },

  //ISG Activities
  [FeatureKey.EDIT_ISG_OPTY_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ISG_ACTIVITY,
    action: ActionKey.ISG_WRITE_001,
  },
  [FeatureKey.APPROVE_ISG_OPPORTUNITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ISG_ACTIVITY,
    action: ActionKey.APPROVE_ISG,
  },
  [FeatureKey.ASSIGN_ISG_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ISG_ACTIVITY,
    action: ActionKey.ASSIGN_ISG,
  },
  [FeatureKey.PLAN_ISG_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ISG_ACTIVITY,
    action: ActionKey.ISG_PLAN_001,
  },
  [FeatureKey.VIEW_ISG_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ISG_ACTIVITY,
    action: ActionKey.ISG_READ_001,
  },

  //BD Activities
  [FeatureKey.APPROVE_BD_OPPORTUNITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BD_ACTIVITY,
    action: ActionKey.APPROVE_BD,
  },
  [FeatureKey.EDIT_BD_OPTY_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BD_ACTIVITY,
    action: ActionKey.BD_WRITE_001,
  },
  [FeatureKey.ASSIGN_BD_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BD_ACTIVITY,
    action: ActionKey.ASSIGN_BD,
  },
  [FeatureKey.PLAN_BD_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BD_ACTIVITY,
    action: ActionKey.BD_PLAN_001,
  },
  [FeatureKey.VIEW_BD_ACTIVITY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BD_ACTIVITY,
    action: ActionKey.BD_READ_001,
  },

  // RD_BD_001
  [FeatureKey.VIEW_RD_BD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.RD_BD_001,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_RD_BD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.RD_BD_001,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_RD_BD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.RD_BD_001,
    action: ActionKey.UPDATE,
  },

  // MEETING
  [FeatureKey.VIEW_MEETING]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MEETING,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_MEETING]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MEETING,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_MEETING]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MEETING,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.EXPORT_MEETING]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MEETING,
    action: ActionKey.EXPORT,
  },

  [FeatureKey.PERMISSION_MEETING]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MEETING,
    action: ActionKey.REJECT,
  },
  [FeatureKey.APPROVE_MEETING]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MEETING,
    action: ActionKey.APPROVE,
  },

  // TASK
  [FeatureKey.VIEW_TASK]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TASK,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_TASK]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TASK,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_TASK]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TASK,
    action: ActionKey.UPDATE,
  },

  // EMPLOYEE
  [FeatureKey.VIEW_EMPLOYEE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.EMPLOYEE,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_EMPLOYEE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.EMPLOYEE,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_EMPLOYEE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.EMPLOYEE,
    action: ActionKey.UPDATE,
  },

  // MASTER
  [FeatureKey.VIEW_MASTER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MASTER,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_MASTER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MASTER,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_MASTER]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MASTER,
    action: ActionKey.UPDATE,
  },

  // FILE_UPLOAD
  [FeatureKey.VIEW_FILE_UPLOAD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_UPLOAD,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_FILE_UPLOAD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_UPLOAD,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_FILE_UPLOAD]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.FILE_UPLOAD,
    action: ActionKey.UPDATE,
  },

  // ADDRESS
  [FeatureKey.VIEW_ADDRESS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADDRESS,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_ADDRESS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADDRESS,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_ADDRESS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADDRESS,
    action: ActionKey.UPDATE,
  },
  // LOOK_UP
  [FeatureKey.VIEW_LOOK_UP]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.LOOK_UP,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_LOOK_UP]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.LOOK_UP,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_LOOK_UP]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.LOOK_UP,
    action: ActionKey.UPDATE,
  },

  // NOTE
  [FeatureKey.VIEW_NOTE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.NOTE,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_NOTE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.NOTE,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_NOTE]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.NOTE,
    action: ActionKey.UPDATE,
  },

  // Policy

  [FeatureKey.CONFIGURE_POLICY_APPROVAL]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICY,
    action: ActionKey.APPROVE,
  },

  [FeatureKey.EDIT_LIVE_POLICY_CONFIGURATION]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICY,
    action: ActionKey.POLICY_CONFIGURE_LIVE_EDIT,
  },

  [FeatureKey.ACTIVATE_POLICY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.ACTIVATE,
  },

  [FeatureKey.RECONFIGURE_POLICY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.RECONFIGURE_POLICY,
  },

  [FeatureKey.POLICY_APPROVAL]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.APPROVE_POLICY,
  },

  [FeatureKey.DOWNLOAD_EMPLOYEE_DETAILS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.DOWNLOAD_EMPLOYEE_DETAILS,
  },

  [FeatureKey.FINANCIAL_INFORMATION]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.FINANCIAL_INFORMATION,
  },

  //Admin Module Reports
  [FeatureKey.VIEW_ADMIN_REPORTS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_REPORTS,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_ADMIN_REPORTS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_REPORTS,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_ADMIN_REPORTS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_REPORTS,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.EXPORT_ADMIN_REPORTS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_REPORTS,
    action: ActionKey.EXPORT,
  },

  //ADMIN MODULE ROLES
  [FeatureKey.VIEW_ADMIN_ROLES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_ROLES,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_ADMIN_ROLES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_ROLES,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_ADMIN_ROLES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_ROLES,
    action: ActionKey.UPDATE,
  },

  //ADMIN MODULE MIGRATION LOG
  [FeatureKey.VIEW_MIGRATION_LOG]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.MIGRATION_LOG,
    action: ActionKey.READ,
  },

  //ADMIN MODULE RELEASE NOTES
  [FeatureKey.VIEW_RELEASE_NOTES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_RELEASE_NOTES,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_RELEASE_NOTES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_RELEASE_NOTES,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_RELEASE_NOTES]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ADMIN_RELEASE_NOTES,
    action: ActionKey.UPDATE,
  },

  //ADMIN MODULE SERVICE CATALOG
  [FeatureKey.VIEW_SERVICE_CATALOG]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.SERVICE_CATALOG,
    action: ActionKey.READ,
  },

  //ADMIN MODULE TEMPLATE MANAGEMENT
  [FeatureKey.VIEW_TEMPLATE_MANAGEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TEMPLATE_MANAGEMENT,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_TEMPLATE_MANAGEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TEMPLATE_MANAGEMENT,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_TEMPLATE_MANAGEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TEMPLATE_MANAGEMENT,
    action: ActionKey.UPDATE,
  },
  [FeatureKey.DELETE_TEMPLATE_MANAGEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TEMPLATE_MANAGEMENT,
    action: ActionKey.DELETE,
  },
  [FeatureKey.APPROVE_TEMPLATE_MANAGEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TEMPLATE_MANAGEMENT,
    action: ActionKey.APPROVE,
  },
  [FeatureKey.REJECT_TEMPLATE_MANAGEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.TEMPLATE_MANAGEMENT,
    action: ActionKey.REJECT,
  },

  //Download Biz Done Report
  [FeatureKey.DOWNLOAD_BUSINESS_PERFORMANCE_REPORT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BUSINESS_PERFORMACE,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.VIEW_BUSINESS_PERFORMANCE_REPORT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BUSINESS_PERFORMACE,
    action: ActionKey.READ,
  },
  //Business Targets (admin module)
  [FeatureKey.VIEW_BUSINESS_TARGET]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BUSINESS_TARGET,
    action: ActionKey.READ,
  },
  [FeatureKey.MANAGE_BUSINESS_TARGET]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BUSINESS_TARGET,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EXPORT_BUSINESS_TARGET]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.BUSINESS_TARGET,
    action: ActionKey.EXPORT,
  },
  //Policies
  [FeatureKey.VIEW_POLICY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_POLICY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_POLICY]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.POLICIES,
    action: ActionKey.UPDATE,
  },
  //Endorsements
  [FeatureKey.VIEW_ENDORSEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ENDORSEMENTS,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_ENDORSEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ENDORSEMENTS,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_ENDORSEMENT]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.ENDORSEMENTS,
    action: ActionKey.UPDATE,
  },
  //Claims
  [FeatureKey.VIEW_CLAIMS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CLAIMS,
    action: ActionKey.READ,
  },
  [FeatureKey.CREATE_CLAIMS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CLAIMS,
    action: ActionKey.WRITE,
  },
  [FeatureKey.EDIT_CLAIMS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CLAIMS,
    action: ActionKey.UPDATE,
  },

  // CD Management
  [FeatureKey.EXPORT_CD_DETAILS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CD_MANAGEMENT,
    action: ActionKey.EXPORT,
  },
  [FeatureKey.MERGE_CD_ACCOUNTS]: {
    scope: ScopeKey.IWORK,
    category: CategoryKey.CD_MANAGEMENT,
    action: ActionKey.MERGE_CD_ACCOUNTS,
  },
  // PII Reveal
  [FeatureKey.REVEAL_PII]: {
    scope: ScopeKey.CONFIG_SERVICE,
    category: CategoryKey.PII_REVEAL,
    action: ActionKey.READ,
  },
};
