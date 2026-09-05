import { REGEX_PATTERNS, ValidationErrors } from "@ui/ui-lib";
import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";

// Email Form Configuration
export const EMAIL_OTP_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "email",
    name: "email",
    label: "Email Id",
    type: "text",
    rules: {
      required: {
        value: true,
        message: "Email address is required",
      },
      pattern: {
        value: REGEX_PATTERNS.EMAIL,
        message: ValidationErrors.EMAIL,
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "user@example.com",
      enableCopyPaste: true,
      type: "email",
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
        },
      },
    },
  },
];

// OTP Form Configuration for Email
export const EMAIL_OTP_VERIFY_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "otp",
    name: "otp",
    label: "Enter OTP",
    type: "text",
    rules: {
      required: {
        value: true,
        message: "OTP is required",
      },
      minLength: {
        value: 6,
        message: "OTP must be 6 digits",
      },
      maxLength: {
        value: 6,
        message: "OTP must be 6 digits",
      },
      pattern: {
        value: /^[0-9]{6}$/,
        message: "OTP must be exactly 6 digits",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter 6-digit OTP",
      onInput: (e: any) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
      },
      enableCopyPaste: true,
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
        },
      },
    },
  },
];

// Initial data
export const initialEmailOTPData = {
  email: "",
};

export const initialEmailOTPVerifyData = {
  otp: "",
};
