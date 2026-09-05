import { environment, FormFieldConfig } from "@ui/ui-lib";

export const LOGIN_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "userName",
    name: "userName",
    label: "User Name (Email)",
    type: "text",
    rules: {
      required: {
        value: true,
        message: "User Name is required",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your user name",
      enableCopyPaste: true,
      // autoComplete: "off",
      // preventAutocomplete: true,
      // inputProps: {
      //   autoComplete: "off",
      // },
    },
  },
  {
    key: "password",
    name: "password",
    label: "Password",
    type: "text",
    rules: {
      required: { value: true, message: "Password is required" },
      // pattern: {
      //   value: REGEX_PATTERNS.PASSWORD,
      //   message:
      //     "Password must be at least 8 characters long, include uppercase and lowercase letters, a number, a special character, and must not contain consecutive numbers.",
      // },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your password",
      type: "password",
      disableBrowserPasswordManager:
        environment.featureFlag.FF_IWORK_LOGIN_AUTOFILL,
      enableCopyPaste: true,
      // autoComplete: "off",
      // preventAutocomplete: true,
      // inputProps: {
      //   autoComplete: "off",
      // },
    },
  },
];

export const initialSignInData = {
  userName: "",
  password: "",
};
