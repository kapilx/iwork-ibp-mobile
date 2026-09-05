export const MAPPING_MESSAGES = {
  CLEAR_ALL_CONFIRM: "Are you sure you want to clear all mappings?",
  REMAINING_FIELDS: (displayed: string, count: number) => 
    `Remaining: ${displayed}${count > 0 ? ` and ${count} more` : ""}`,
  DRAG_TO_MAP: (count: number) => `Drag To Map Fields (${count} columns)`,
  NOT_MAPPED: "Not Mapped",
  DROP_HERE: "Drop Here",
  MAPPED_COUNT: (mapped: number, total: number) => `${mapped} of ${total} required fields mapped`,
};

export const MAPPING_UI_TEXT = {
  SOURCE_PANEL_TITLE_INBOUND: "Client Columns",
  SOURCE_PANEL_TITLE_OUTBOUND: "System Fields",
  EMPTY_STATE_TITLE: "Start Building Your Table",
  EMPTY_STATE_SUBTITLE: "Drag client columns into system fields above",
  CLEAR_ALL: "Clear All",
  SAVE_CONFIG: "Save & Preview",
  DATE_FIELD: "Date Field",
  GENDER_FIELD: "Gender Field",
  NUMBER_FIELD: "Number Field",
  CLEAR_MAPPING_HEADING: "Clear Mapping",
  NO_CANCEL: "No, Cancel",
  YES_CLEAR: "Yes, Clear",
  UNMAPPED_WARNING: (count: number) => `${count} source columns will be ignored.`,
  CANCEL: "Cancel",
  EXPORT_ERRORS: "Export Errors",
  MANAGE_TEMPLATES: "Manage Templates",
};

export const CONFIG_DIALOG_TEXT = {
  SUBTITLE: "Configure Data Transformation",
  SOURCE_COLUMN_LABEL: "Source Column",
  SOURCE_FORMAT_LABEL: "Source Format",
  TARGET_FORMAT_LABEL: "Format",
  PREVIEW_TRANSFORMATION_LABEL: "Preview Transformation",
  DECIMAL_SEPARATOR_LABEL: "Decimal Separator",
  THOUSAND_SEPARATOR_LABEL: "Thousand Separator",
  VALUE_MAPPING_LABEL: "Value Mapping",
  CANCEL: "Cancel",
  APPLY: "Apply Configuration",
};

export const WARNING_MESSAGES = {
  GENDER_MISMATCH: (sample: string, allowed: string) => 
    `Source value (e.g., '${sample}') does not match allowed target values (${allowed})`,
  DATE_MISMATCH: (sample: string, format: string) => 
    `Source date format (e.g., '${sample}') may not match required format (${format})`,
  NUMBER_MISMATCH: (sample: string) => 
    `Source value (e.g., '${sample}') is not a valid number`,
};

export const CONFIG_OPTIONS = {
  NUMBER_SEPARATORS: [
    { value: ",", label: ", (Comma)" },
    { value: ".", label: ". (Dot)" },
    { value: " ", label: "Space" },
    { value: "", label: "None" },
  ],
  GENDER_SOURCES: ["Male", "Female"],
  GENDER_MAPPING_OPTIONS: {
    Male: ["M", "Male", "0", "1", "Other"],
    Female: ["F", "Female", "0", "1", "Other"],
  },
  DATE_FORMATS: [
    "DD/MM/YYYY",
    "MM/DD/YYYY",
    "YYYY/MM/DD",
    "DD-MM-YYYY",
    "MM-DD-YYYY",
    "YYYY-MM-DD"
  ],
  DEFAULT_DATE_FORMATS: {
      SOURCE: "DD/MM/YYYY",
      TARGET: "YYYY/MM/DD"
  },
  DEFAULT_NUMBER_CONFIG: {
      DECIMAL: ".",
      THOUSAND: ","
  },
  DEFAULT_GENDER_MAPPING: {
      MALE_KEY: "M",
      FEMALE_KEY: "F"
  },
  SAMPLE_DATA_DEFAULTS: {
      DATE: ["15/03/1990", "22/07/1985", "10/11/1992"]
  }
};

export const CONFIG_TYPES = {
  DATE: 'date',
  NUMBER: 'number',
  GENDER: 'gender',
} as const;

export const DEFAULT_LEGACY_REQUIRED_FIELDS = ["FullName", "DateOfBirth", "EmailAddress", "MobileNumber"];

export const NUMBER_KEYWORDS = ["salary"];

export const EMPTY_VALUE_PLACEHOLDER = "—";

export const DRAG_ID_PREFIXES = {
  HEADER: "header-",
  DRAG: "drag-",
};
