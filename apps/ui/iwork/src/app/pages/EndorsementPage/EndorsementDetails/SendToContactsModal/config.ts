import { FormFieldConfig, REGEX_PATTERNS, ValidationErrors } from "@ui/ui-lib";

export const ContactFormFields: FormFieldConfig[] = [
  {
    key: "firstName",
    name: "firstName",
    label: "First Name",
    type: "text",
    gridColumn: 6,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "First Name",
      fullWidth: true,
    },
  },
  {
    key: "lastName",
    name: "lastName",
    label: "Last Name",
    type: "text",
    gridColumn: 6,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "Last Name",
      fullWidth: true,
    },
  },
  {
    key: "displayName",
    name: "displayName",
    label: "Display Name",
    type: "text",
    gridColumn: 6,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "Display Name",
      fullWidth: true,
    },
    inputDependentField: ["firstName", "lastName"],
  },
  {
    key: "department",
    name: "department",
    label: "Department",
    type: "text",
    gridColumn: 6,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "Department",
      fullWidth: true,
    },
  },
  {
    key: "designation",
    name: "designation",
    label: "Designation",
    type: "text",
    gridColumn: 6,
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "Designation",
      fullWidth: true,
    },
  },
  {
    key: "location",
    name: "location",
    label: "Location",
    type: "select",
    gridColumn: 6,
    options: [],
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "Select Location",
      fullWidth: true,
    },
  },
  {
    key: "branch",
    name: "branch",
    label: "Branch",
    type: "select",
    gridColumn: 6,
    options: [],
    rules: {
      required: { value: true, message: "Field is required" },
    },
    componentProps: {
      placeholder: "Select Branch",
      fullWidth: true,
    },
  },
];

// Email field configuration for adding/editing contact emails
export const EmailFieldConfig: FormFieldConfig = {
  key: "email",
  name: "email",
  label: "Email Address",
  type: "text",
  gridColumn: 12,
  rules: {
    required: { value: true, message: "Email is required" },
    pattern: {
      value: REGEX_PATTERNS.EMAIL,
      message: ValidationErrors.EMAIL,
    },
  },
  componentProps: {
    placeholder: "email@example.com",
    fullWidth: true,
    type: "email",
  },
};

export interface ContactEmail {
  id?: number;
  email: string;
}

export interface Contact {
  id: number;
  displayName?: string;
  firstName: string;
  lastName?: string;
  department?: string;
  designation?: string;
  location?: string;
  branch?: string;
  emails: ContactEmail[];
  // API-required fields (preserved from API response)
  companyId?: number;
  companyLocationId?: number;
  companyBranchId?: number | null;
  contactTypeLid?: number;
  contactRecordTypeLid?: number;
  statusLid?: number;
}

// Email field configuration for Step 2 compose email
export const ComposeEmailFields = {
  FROM: {
    label: "From:",
    key: "from",
    readOnly: true,
  },
  TO: {
    label: "To:",
    key: "to",
    readOnly: true,
    helperText: "recipients selected from Step 1",
  },
  CC: {
    label: "CC:",
    key: "cc",
    type:"select",
    placeholder: "example@gmail.com",
    helperText: "Press Enter to add each email.",
  },
};
