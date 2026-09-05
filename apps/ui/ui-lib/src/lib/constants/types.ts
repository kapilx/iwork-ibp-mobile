type AllowedTypes = string | number | boolean | object | null | undefined | any;

export interface DynamicObject {
  [key: string]: AllowedTypes;
}

// Data Types
export const DATA_TYPES = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  NULL: "null",
  UNDEFINED: "undefined",
  OBJECT: "object",
  ARRAY: "array",
  DATE: "date",
  FUNCTION: "function",
  SYMBOL: "symbol",
  BIGINT: "bigint",
} as const;

// Field Types
export const FIELD_TYPES = {
  TEXT: "text",
  NUMBER: "number",
  EMAIL: "email",
  PASSWORD: "password",
  TEXTAREA: "textarea",
  SELECT: "select",
  MULTISELECT: "multiselect",
  CHECKBOX: "checkbox",
  RADIO: "radio",
  DATE: "date",
  TIME: "time",
  DATETIME: "datetime",
  FILE: "file",
  PHONE: "tel",
  URL: "url",
  SEARCH: "search",
  HIDDEN: "hidden",
  COLOR: "color",
  RANGE: "range",
  SWITCH: "switch",
  SLIDER: "slider",
  AUTOCOMPLETE: "autocomplete",
  RICHTEXT: "richtext",
  DROPDOWN: "dropdown",
} as const;

// Input Types
export const INPUT_TYPES = {
  TEXT: "text",
  NUMBER: "number",
  EMAIL: "email",
  PASSWORD: "password",
  TEL: "tel",
  URL: "url",
  SEARCH: "search",
  HIDDEN: "hidden",
  FILE: "file",
  COLOR: "color",
  DATE: "date",
  TIME: "time",
  DATETIME_LOCAL: "datetime-local",
  MONTH: "month",
  WEEK: "week",
  RANGE: "range",
} as const;

// Value Types
export const VALUE_TYPES = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  ARRAY: "array",
  OBJECT: "object",
  NULL: null,
  UNDEFINED: undefined,
} as const;

// Validation Types
export const VALIDATION_TYPES = {
  REQUIRED: "required",
  MIN_LENGTH: "minLength",
  MAX_LENGTH: "maxLength",
  MIN: "min",
  MAX: "max",
  PATTERN: "pattern",
  EMAIL: "email",
  URL: "url",
  MATCH: "match",
  CUSTOM: "custom",
} as const;

// Response Types
export const RESPONSE_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

// Content Types
export const CONTENT_TYPES = {
  JSON: "application/json",
  FORM_DATA: "multipart/form-data",
  TEXT: "text/plain",
  HTML: "text/html",
} as const;

// Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

export interface LookupRecord {
  id: number;
  lookUpName: string;
  lookUpKey: string;
  lookUpValueKey: string;
  lookUpValue: string;
  description: string;
  lookUpOrder: number;
}

