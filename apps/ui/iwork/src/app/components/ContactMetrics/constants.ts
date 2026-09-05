// Modal titles
export const MODAL_TITLES = {
  CREATE: 'Configure Contact Matrix',
  EDIT: 'Edit Contact Matrix',
  VIEW: 'View Contact Matrix',
} as const;

// Section titles
export const SECTION_TITLES = {
  TPA: 'TPA',
  INSURER: 'Insurer',
} as const;

// Subsection titles
export const SUBSECTION_TITLES = {
  PRIMARY: 'Primary Support',
  SECONDARY: 'Escalation Support',
} as const;

// Required form fields
export const REQUIRED_FIELDS = [
  'tpaPrimaryContact',
  'insurerPrimaryContact',
] as const;

// Button labels
export const BUTTON_LABELS = {
  UPDATE: 'Update',
  CLOSE: 'Close',
} as const;

// Default display value
export const DEFAULT_DISPLAY_VALUE = '-';

// Modal dimensions
export const MODAL_WIDTH = '1000px';
export const MODAL_MAX_WIDTH = '95vw';
export const MODAL_PADDING = '24px';

// Dropdown width
export const DROPDOWN_WIDTH = '300px';
