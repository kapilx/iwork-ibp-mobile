export const ENTITY_OPTIONS = [
  { value: "COMPANY", label: "Company" },
  { value: "TPA", label: "TPA (Third Party Administrator)" },
  { value: "INSURER", label: "Insurer" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "POLICY", label: "Policy" },
  { value: "ENDORSEMENT", label: "Endorsement" },
  { value: "CLAIMS", label: "Claims" },
];

// Direction constants
export const DIRECTION = {
  INBOUND: "INBOUND" as const,
  OUTBOUND: "OUTBOUND" as const,
};

export type DirectionType = typeof DIRECTION[keyof typeof DIRECTION];


export const TEMPLATE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ALL: "ALL",
};

export const API_CONFIG = {
  HEADERS: {
    AUTHORIZATION: 'Authorization',
    CONTENT_TYPE: 'Content-Type',
  },
  CONTENT_TYPES: {
    JSON: 'application/json',
  },
  PREFIX: {
    BEARER: 'Bearer ',
  },
  DEFAULTS: {
    COMPANY_ID: 10,
  }
};

export const UPLOAD_CONFIG = {
  STATES: {
    IDLE: 'idle' as const,
    VALIDATING: 'validating' as const,
    SUCCESS: 'success' as const,
    FILE_SELECTED: 'file-selected' as const,
  },
  MAX_SIZE_MB: 10,
  ALLOWED_EXTENSIONS: ['.xlsx'],
  INPUT_ID: 'upload-button',
  ANIMATION: {
    PROGRESS_INTERVAL: 100,
    SUCCESS_DELAY: 300,
    MAX_PROGRESS: 90,
  }
};

export const MESSAGES = {
  SAVE_SUCCESS: "Mapping configuration saved successfully",
  SAVE_ERROR: "Failed to save mapping configuration",
  RESTORE_SUCCESS: "Template version restored successfully",
  RESTORE_ERROR: "Failed to restore template version",
  FILE_TYPE_ERROR: "Only .xlsx file formats are supported. Please upload a valid Excel file.",
  FILE_SIZE_ERROR: "File size exceeds maximum limit of 10MB",
  FILE_UPLOAD_SUCCESS: "File uploaded successfully.",
  FILE_READ_ERROR: "Failed to read file. Please ensure it's a valid .xlsx Excel file.",
  TARGET_COLUMNS_MISSING: "Target columns are not available.",
  SELECT_FILE: "Please select a file first",
  SELECT_ENTITY: "Please select an entity type",
  ENTITY_CHANGED: "Entity type changed. Please upload file again.",
  NO_DATA_TO_EXPORT: "No data to export.",
  EXPORT_TABLE_SUCCESS: "Configured table exported as XLSX.",
  EXPORT_TEMPLATE_SUCCESS: "Mapping template exported successfully",
  CONFIG_DELETED: "Configuration deleted successfully",
  CONFIG_DELETE_ERROR: "Failed to delete mapping configuration",
  EXPORT_SUCCESS: "Mapping template exported successfully",
  NO_DATA_FOUND: "No data found in the file",
  FAILED_READ_FILE: "Failed to read file",
  VALIDATION_NO_ERRORS: "No validation errors found.",
  INVALID_DATA: "Invalid Data",
  TEMPLATE_RESTORE_SUCCESS: "Template version restored successfully",
  TEMPLATE_IMPORT_SUCCESS: "Template imported successfully",
  TEMPLATE_IMPORT_ERROR: "Failed to import template: Invalid JSON format",
  TEMPLATE_INVALID_FORMAT: "Invalid template format: Missing mappings array",
  TEMPLATE_ENTITY_MISMATCH: (templateEntity: string, currentEntity: string) => `Warning: Template is for entity '${templateEntity}' but current entity is '${currentEntity}'`,
  NO_HEADERS: "No headers found in Excel file.",
  NO_VALID_MAPPINGS_DETAILED: "No valid mappings found in the detailed report.",
  NO_MATCHING_COLUMNS: "No matching columns found in the uploaded Excel file.",
  AUTO_MAPPED_SUCCESS: (count: number) => `Auto-mapped ${count} columns from headers.`,
  RESTORED_SUCCESS: (count: number) => `Restored ${count} mappings from Detailed Report.`,
};

export const UI_TEXT = {
  UPLOAD_DESCRIPTION: "Upload a file to start mapping client data.",
  SELECT_ENTITY_LABEL: "Select Entity Type",
  SELECT_ENTITY_PLACEHOLDER: "Select an entity",
  UPLOAD_TITLE: "Upload Data File",
  UPLOAD_BOX_CLICK: "Click to upload sample data",
  VALIDATING_FILE: "Validating file...",
  UPLOAD_SUCCESS_TITLE: "File uploaded successfully",
  CONTINUE_TO_MAPPING: "Continue To Mapping",
  LOADING_TARGET_FIELDS: "Loading target fields...",
  CONFIG_BANNER_TITLE: "Template Configured",
  EDIT_CONFIG: "Edit Configuration",
  DELETE_CONFIG: "Delete Configuration",
  DELETE_MAPPING_CONFIRMATION_MESSAGE: "Are you sure you want to delete this mapping configuration? This action cannot be undone.",
  DOWNLOAD: "Download",
  OUTBOUND: "Outbound",
  INBOUND: "Inbound",
  EXPORT_TEMPLATE: "Export Template",
  EXPORT_ERRORS: "Export Errors",
  REPLACE_TEMPLATE: "Replace Template",
  SAVE_CONFIGURATION: "Save Configuration",
  SAVING: "Saving...",
  ROWS: "rows",
  COLUMNS: "columns",
  FIELDS_MAPPED: (count: number) => `${count} fields mapped • Ready to use`,
  EXPORT_HEADERS: ["Source Column", "Target Column", "Type", "Source Format/Data", "Target Format/Data"],
  DECIMAL_PREFIX: "Decimal: ",
  THOUSAND_PREFIX: "Thousand: ",
  SHEET_NAME: "Mapping Template",
  TEMPLATE_EXPORT_FILE_SUFFIX: "_mapping_template_",
  DELETE_TITLE: "Delete Configuration",
  CANCEL_BTN: "Cancel",
  DELETE_BTN: "Yes, Delete",
  SAVE_TITLE: "Save Configuration",
  SAVE_CONFIRMATION_MESSAGE: "Are you sure you want to save this mapping configuration? This will create a new version and set it as the active configuration.",
  SAVE_BTN: "Yes, Save",
  ENTITY_CHANGE_TITLE: "Change Entity Type",
  ENTITY_CHANGE_CONFIRMATION: "Changing entity type will clear current mappings. Continue?",
  CONTINUE_BTN: "Continue",
  EXPORT_REPORT: {
    ROW_NUMBER: "Row Number",
    COLUMN_NAME: "Column Name",
    INVALID_VALUE: "Invalid Value",
    ERROR_MESSAGE: "Error Message",
    SHEET_NAME: "Errors",
    FILE_NAME: "Validation_Errors_Report.xlsx",
  },
  TEMPLATE_MANAGEMENT: {
    DIALOG_TITLE: "Manage Mapping Templates",
    TAB_HISTORY: "Version History",
    TAB_IMPORT: "Import Template",
    VERSION_PREFIX: "Version",
    CURRENT_VERSION: "Current",
    USER_LABEL: "User:",
    DATE_LABEL: "Date:",
    NOTE_LABEL: "Note:",
    RESTORE_BTN: "Restore",
    NO_HISTORY: "No history available for this template.",
    UPLOAD_INSTRUCTION: "Click to upload or drag and drop",
    FILE_TYPE_HINT: 'Supported file type: .json, .xlsx, .xls',
    INVALID_FILE_TYPE: 'Invalid file type. Please upload  .xlsx, or .xls file.',
    IMPORT_BTN: "Import Template",
    RESTORE_CONFIRM_TITLE: 'Restore Template Version',
    CLOSE_BTN: "Close",
    MANAGE_BTN: "Manage Templates",
    UNKNOWN_DATE: "Unknown Date",
    UNKNOWN_USER: "Unknown",
    RESTORE_CONFIRM_MSG: (version: string) => `Are you sure you want to restore ${version}? This will replace your current configuration.`,
    CONFIRM_BTN: "Confirm",
    CANCEL_BTN: "Cancel",
    SUPPORTED_FORMATS: "Supported formats: .xlsx, .xls",
    MAX_SIZE_HINT: "Max file size: 10MB",
    PREVIEW: "Preview",
    DOWNLOAD: "Download",
    PREVIEW_HEADING: (version: string) => `Preview Template Version ${version}`,
    PREVIEW_SOURCE_COL: "Source Column",
    PREVIEW_TARGET_COL: "Target Column",
    PREVIEW_FORMAT: "Format/Config",
    FILE_DIRECTION_LABEL: "File Direction:",
    PREVIEW_COLUMN_NAME: "Column Name",
    PREVIEW_SYSTEM_FIELDS: "System Fields",
  }
};

export const MAPPING_TEXT = {
  CLIENT_COLUMNS: "Client Columns",
  SYSTEM_FIELDS: "System Fields",
  DRAG_TO_MAP: (count: number) => `Drag To Map Fields (${count} columns)`,
  START_BUILDING_TITLE: "Start Building Your Employee Table",
  START_BUILDING_SUBTITLE: "Drag client columns into system fields above",
  SAVE_CONFIGURATION: "Save Configuration",
  CANCEL: "Cancel",
  MAPPED: "Mapped",
  REQUIRED: "Required",
  UNMAPPED_WARNING: (count: number) => `${count} source columns will be ignored.`,
};

// Data type constants
export const DATA_TYPE = {
  GENDER: "GENDER" as const,
  DATE: "DATE" as const,
  NUMBER: "NUMBER" as const,
  STRING: "STRING" as const,
};

export type DataType = typeof DATA_TYPE[keyof typeof DATA_TYPE];

// Field type constants (frontend field types)
export const FIELD_TYPE = {
  DATE: "date" as const,
  GENDER: "gender" as const,
  NUMBER: "number" as const,
  TEXT: "text" as const,
  EMAIL: "email" as const,
};

export type FieldType = typeof FIELD_TYPE[keyof typeof FIELD_TYPE];

// Data type mapping from backend to frontend field types
export const DATA_TYPE_MAPPING: Record<string, string> = {
  [DATA_TYPE.GENDER]: FIELD_TYPE.GENDER,
  [DATA_TYPE.DATE]: FIELD_TYPE.DATE,
  [DATA_TYPE.NUMBER]: FIELD_TYPE.NUMBER,
  [DATA_TYPE.STRING]: FIELD_TYPE.TEXT,
};

export const DEFAULT_FIELD_TYPE = FIELD_TYPE.TEXT;

// Helper function to determine field type based on data type and display name
export const getFieldType = (dataType: string, displayName?: string): string => {
  // Check for email field based on display name
  if (dataType === DATA_TYPE.STRING && displayName) {
    const lowerName = displayName.toLowerCase();
    if (lowerName.includes(FIELD_TYPE.EMAIL)) {
      return FIELD_TYPE.EMAIL;
    }
    if (lowerName.includes(FIELD_TYPE.GENDER)) {
      return FIELD_TYPE.GENDER;
    }
  }
  
  // Return mapped type or default
  return DATA_TYPE_MAPPING[dataType] || DEFAULT_FIELD_TYPE;
};


// Date format constants
export const EXCEL_DATE_FORMATS = {
  DD_MM_YYYY: "DD/MM/YYYY",
  MM_DD_YYYY: "MM/DD/YYYY",
  YYYY_MM_DD: "YYYY-MM-DD",
  DD_MM_YYYY_DASH: "DD-MM-YYYY",
  MM_DD_YYYY_DASH: "MM-DD-YYYY",
  YYYY_SLASH_MM_SLASH_DD: "YYYY/MM/DD",
  YYYY_DASH_MM_DASH_DD: "YYYY-MM-DD", // Duplicate key for clear semantic usage if needed, or just use YYYY_MM_DD
};

export const VALIDATION_ERRORS = {
  INVALID_DATE_FORMAT: "Invalid date format",
  INVALID_NUMBER: "Invalid number format",
  INVALID_STRING: "Invalid string - numeric values not allowed",
  VALUE_NOT_ALLOWED: (value: string) => `Value '${value}' is not allowed`,
};

export const DEFAULT_GENDER_VALUES = ['Male', 'Female', 'M', 'F', 'Other', 'Transgender'];

export const DEFAULT_SEPARATORS = {
  DECIMAL: '.',
  THOUSAND: '',
};

export const REGEX_PATTERNS = {
  EXCEL_SERIAL_DATE: /^\d{4,5}$/,
  STRICT_DATE: /^\d{1,4}[/\-]\d{1,2}[/\-]\d{2,4}$/,
  DATE_CHARS: /[\d\/\-]/,
  CLEAN_NUMBER: /[^\d.-]/g,
  NON_DIGIT_DOT: /[^\d.]/g,
  THOUSAND_GROUP: /\B(?=(\d{3})+(?!\d))/g,
  NUMERIC_ONLY: /^\d+$/,
};

export const ALLOWED_TEMPLATE_EXTENSIONS = ['xlsx', 'xls'];
