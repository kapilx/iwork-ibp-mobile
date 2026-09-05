export const ValidationErrors = {
  NON_EMPTY: "This field is required",
  MAX_LENGTH: "Maximum 50 characters allowed",
  MIN_LENGTH: "Minimum 3 characters required",
  EMAIL: "Please enter a valid email address",
  PHONE: "Please enter a valid phone number",
  MOBILE: "Please enter a valid mobile number",
  FAX: "Please enter a valid fax number",
  PIN_CODE: "Please enter a valid PIN code",
  FIRST_NAME: "First name is required and must be at least 2 characters",
  LAST_NAME: "Last name is required and must be at least 2 characters",
  DISPLAY_NAME: "Display name must be between 3 and 50 characters",
  ADDRESS_LINE: "Address line cannot be empty",
  AREA: "Area/Locality is required",
  DEPARTMENT: "Department name is required",
  DESIGNATION: "Designation is required",
  NUMERIC: "Please enter numbers only",
  ALPHANUMERIC: "Please enter letters and numbers only",
  ALPHANUMERIC_WITH_SPECIALS:
    "Please enter letters, numbers, and special characters only",
  INVALID_FORMAT: "Invalid format",
  URL: "Please enter a valid URL",
  DATE: "Please enter a valid date",
  PASSWORD:
    "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
  REQUIRED_SELECTION: "Please make a selection",
  INVALID_INPUT: "Please enter valid input",
  SUPPORT_NUMBER:
    "Please enter a valid support number (landline, mobile, or phone number)",
};
export const textErrorMessage = (label: string, maxLength: number) =>
  `${label} cannot exceed ${maxLength} characters`;

export const requiredErrorMessage = (label: string) => `${label} is required`;
