import { FormFieldConfig, REGEX_PATTERNS } from "@ui/ui-lib";

export const PASSWORD_RESET_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "newPassword",
    name: "newPassword",
    label: "Enter new password",
    type: "text",
    rules: {
      required: { value: true, message: "Password is required" },
      pattern: {
        value: REGEX_PATTERNS.PASSWORD,
        message: "Password requirements not met",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter new password",
      type: "password",
      disableBrowserPasswordManager: true,
      // autoComplete: "off",
      // preventAutocomplete: true,
      // inputProps: {
      //   autoComplete: "off",
      // },
    },
  },
  {
    key: "confirmPassword",
    name: "confirmPassword",
    label: "Re-Enter new password",
    type: "text",
    rules: {
      required: { value: true, message: "Please re-enter password" },
      pattern: {
        value: REGEX_PATTERNS.PASSWORD,
        message: "Password requirements not met",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Re-enter new password",
      type: "password",
      disableBrowserPasswordManager: true,
      // autoComplete: "off",
      // preventAutocomplete: true,
      // inputProps: {
      //   autoComplete: "off",
      // },
    },
  },
];

export const initialPasswordResetData = {
  newPassword: "",
  confirmPassword: "",
};
