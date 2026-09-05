import { REGEX_PATTERNS, ValidationErrors } from "@ui/ui-lib";
import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";

// Dynamic function to get user email from sessionStorage
const getUserEmailFromSession = () => {
  try {
    const userDataStr = sessionStorage.getItem("user");
    if (!userDataStr) return null;
    const userData = JSON.parse(userDataStr);
    return userData?.email || userData?.emailId || null;
  } catch (error) {
    console.warn("Error getting user email from sessionStorage:", error);
    return null;
  }
};

// Dynamic function to create form config based on user email
export const getTicketRaiseFormConfig = (): FormFieldConfig[] => {
  const userEmail = getUserEmailFromSession();
  const hasUserEmail = Boolean(userEmail);
  const isAuthenticated = Boolean(sessionStorage.getItem("user"));

  const getUserIdFromSession = (): string | null => {
    try {
      const userDataStr = sessionStorage.getItem("user");
      if (!userDataStr) return null;
      const userData = JSON.parse(userDataStr);
      return userData?.id || userData?.userId || userData?.employeeId || null;
    } catch {
      return null;
    }
  };

  const userId = getUserIdFromSession();
  console.log("User ID from session:", userId);

  return [
    {
      key: "category",
      name: "category",
      label: "Category",
      type: "select",
      gridColumn: 5,
      placeholder: "Select",
      options: [
            { value: "billing", label: "Billing" },
            { value: "claims", label: "Claims" },
            { value: "policy", label: "Policy" },
            { value: "enrollment", label: "Enrolment" },
            { value: "access_issues", label: "Access Issues" },
            { value: "other", label: "Other" },
          ],
      componentProps: {
        fullWidth: true,
      },
      rules: {
        required: {
          value: true,
          message: "Category is required",
        },
      },
    },
    {
      key: "mailId",
      name: "mailId",
      label: "Mail ID",
      type: "text",
      gridColumn: 5,
      componentProps: {
        fullWidth: true,
        placeholder: hasUserEmail ? userEmail : "Enter your email",
        type: "email",
        enableCopyPaste: true,
        disabled: hasUserEmail,
      },
      rules: {
        pattern: {
          value: REGEX_PATTERNS.EMAIL,
          message: ValidationErrors.EMAIL,
        },
      },
    },
    {
      key: "escalationDescription",
      name: "escalationDescription",
      label: "Escalation Description",
      type: "textarea",
      gridColumn: 12,
      componentProps: {
        fullWidth: true,
        multiline: true,
        rows: 6,
        placeholder: "Enter the text",
        enableCopyPaste: true,
      },
      rules: {
        required: {
          value: true,
          message: "Escalation description is required",
        },
        validate: (value: string) =>
          value.trim().length > 0 || "Escalation description is required",
      },
    },
    ...(userId
      ? [
          {
            key: "attachments",
            name: "attachments",
            label: "Attachments",
            type: "documentupload",
            hideDropdown: true,
            companyId: -1,
            gridColumn: 9,
            componentProps: {
              fullWidth: true,
              companyType: "meeting",
              placeholder: "Upload files...",
              multiple: true,
              accept: ".pdf, .jpeg, .jpg, .png, .xlsx",
              supportedFormatsMessage: "Supported Formats: pdf, jpeg, jpg, png, xlsx only",
              formFieldName: "attachments",
              downloadModuleKey: "task_and_meetings",
              useIbpFileEndpoints : true,
            },
          } as FormFieldConfig,
        ]
      : []),
  ];
};

// Legacy exports for backward compatibility
export const TICKET_RAISE_FORM_CONFIG = getTicketRaiseFormConfig();

// Dynamic function to get initial form data based on user session
export const getInitialTicketRaiseData = () => {
  const getUserEmailFromSession = () => {
    try {
      const userDataStr = sessionStorage.getItem("user");
      if (!userDataStr) return "";
      const userData = JSON.parse(userDataStr);
      return userData?.email || userData?.emailId || "";
    } catch (error) {
      console.warn("Error getting user email from sessionStorage:", error);
      return "";
    }
  };

  return {
    category: "",
    name: "",
    mailId: getUserEmailFromSession(),
    escalationDescription: "",
    attachments: [],
  };
};

export const initialTicketRaiseData = getInitialTicketRaiseData();

export const SCHEDULE_CALLBACK_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "category",
    name: "category",
    label: "Category",
    type: "select",
    gridColumn: 6,
    placeholder: "Select",
    options: [
      { value: "billing", label: "Billing" },
      { value: "claims", label: "Claims" },
      { value: "policy", label: "Policy" },
      { value: "enrollment", label: "Enrolment" },
      { value: "other", label: "Other" },
    ],
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: "Category is required",
      },
    },
  },
  {
    key: "policyNumber",
    name: "policyNumber",
    label: "Policy number",
    type: "text",
    gridColumn: 6,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter the text",
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Policy number is required",
      },
    },
  },
  {
    key: "name",
    name: "name",
    label: "Name",
    type: "text",
    gridColumn: 6,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter the text",
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Name is required",
      },
    },
  },
  {
    key: "phone",
    name: "phone",
    label: "Phone",
    type: "text",
    gridColumn: 6,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter phone number",
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Phone is required",
      },
    },
  },
  {
    key: "date",
    name: "date",
    label: "Date",
    type: "date",
    gridColumn: 6,
    componentProps: {
      fullWidth: true,
      placeholder: "DD/MM/YYYY",
    },
    rules: {
      required: {
        value: true,
        message: "Date is required",
      },
    },
  },
  {
    key: "timeFrom",
    name: "timeFrom",
    label: "Time",
    type: "select",
    gridColumn: 3,
    placeholder: "Select",
    componentProps: {
      fullWidth: true,
    },
    options: [
      { value: "09:00", label: "09:00 AM" },
      { value: "10:00", label: "10:00 AM" },
      { value: "11:00", label: "11:00 AM" },
      { value: "12:00", label: "12:00 PM" },
      { value: "13:00", label: "01:00 PM" },
      { value: "14:00", label: "02:00 PM" },
      { value: "15:00", label: "03:00 PM" },
      { value: "16:00", label: "04:00 PM" },
      { value: "17:00", label: "05:00 PM" },
    ],
    rules: {
      required: {
        value: true,
        message: "Start time is required",
      },
    },
  },
  {
    key: "timeTo",
    name: "timeTo",
    label: "To",
    type: "select",
    gridColumn: 3,
    placeholder: "Select",
    componentProps: {
      fullWidth: true,
    },
    options: [
      { value: "09:00", label: "09:00 AM" },
      { value: "10:00", label: "10:00 AM" },
      { value: "11:00", label: "11:00 AM" },
      { value: "12:00", label: "12:00 PM" },
      { value: "13:00", label: "01:00 PM" },
      { value: "14:00", label: "02:00 PM" },
      { value: "15:00", label: "03:00 PM" },
      { value: "16:00", label: "04:00 PM" },
      { value: "17:00", label: "05:00 PM" },
      { value: "18:00", label: "06:00 PM" },
    ],
    rules: {
      required: {
        value: true,
        message: "End time is required",
      },
    },
  },
  {
    key: "description",
    name: "description",
    label: "Description",
    type: "textarea",
    gridColumn: 12,
    componentProps: {
      fullWidth: true,
      multiline: true,
      rows: 4,
      placeholder: "Enter the text",
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Description is required",
      },
    },
  },
];

export const initialScheduleCallbackData = {
  policyNumber: "",
  category: "",
  name: "",
  phone: "",
  date: "",
  timeFrom: "",
  timeTo: "",
  description: "",
};
