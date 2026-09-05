import { FormFieldConfig, REGEX_PATTERNS } from "@ui/ui-lib";

export const RESET_MAIL_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "email",
    name: "email",
    label: "Email",
    type: "text",
    rules: {
      required: { value: true, message: "Email is required" },
      pattern: {
        value: REGEX_PATTERNS.EMAIL,
        message: "Invalid email address",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your email address",
      // autoComplete: "off",
      // preventAutoComplete: true,
      // inputProps: {
      //   autoComplete: "off",
      // },
    },
  },
];

export const initialResetMailData = {
  email: "",
};
