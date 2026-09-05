import {
  REGEX_PATTERNS,
  ibpTheme as theme,
  ValidationErrors,
} from "@ui/ui-lib";
import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";

export const LOGIN_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "userName",
    name: "userName",
    label: "User Name / Email / Phone Number",
    type: "text",
    rules: {
      required: {
        value: true,
        message: "This field is required",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your user name",
      // autoComplete: "off",
      enableCopyPaste: true,
      // // preventAutocomplete: true,
      // inputProps: {
      //   autoComplete: "off",
      // },
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
          border: `1px solid ${theme.palette.border.lightBlack}`,
        },
      },
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
      autoComplete: "off",
      enableCopyPaste: true,
      preventAutocomplete: true,
      inputProps: {
        autoComplete: "off",
       
      },
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
          border: `1px solid ${theme.palette.border.lightBlack}`,
        },
      },
    },
  },
];

export const FORGOT_PASSWORD_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "email",
    name: "email",
    label: "Email address",
    type: "text",
    componentProps: {
      fullWidth: true,
      type: "email",
      placeholder: "Enter your Email",
      enableCopyPaste: true,
      // preventAutocomplete: true,
      // autoComplete: "off",
      // inputProps: {
      //   autoComplete: "off",
      // },
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
          border: `1px solid ${theme.palette.border.lightBlack}`,
        },
      },
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.EMAIL,
        message: ValidationErrors.EMAIL,
      },
      required: { value: true, message: "Email is required" },
    },
  },
];

export const RESET_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "newPassword",
    name: "newPassword",
    label: "New Password",
    type: "text",
    rules: {
      required: {
        value: true,
        message: "New Password is required",
      },
      // pattern: {
      //   value: REGEX_PATTERNS.PASSWORD,
      //   message:
      //     "Password must be at least 8 characters long, include uppercase and lowercase letters, a number, a special character, and must not contain consecutive numbers.",
      // },
      validate: () => {
        throw new Error(
          "Dynamic password validation not initialized. Please fetch password rules and inject the validate function at runtime."
        );
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your new password",
      type: "password",
      autoComplete: "off",
      preventAutocomplete: true,
      enableCopyPaste: true,
      inputProps: {
        autoComplete: "off",
      },
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
          border: `1px solid ${theme.palette.border.lightBlack}`,
        },
      },
    },
  },
  {
    key: "confirmPassword",
    name: "confirmPassword",
    label: "Confirm Password",
    type: "text",
    rules: {
      required: { value: true, message: "Password is required" },
      // pattern: {
      //   value: REGEX_PATTERNS.PASSWORD,
      //   message:
      //     "Password must be at least 8 characters long, include uppercase and lowercase letters, a number, a special character, and must not contain consecutive numbers.",
      // },
      validate: (value: string, allValues?: any) => {
        if (
          value &&
          allValues?.newPassword &&
          value !== allValues.newPassword
        ) {
          return "Passwords do not match";
        }
        return true;
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your password",
      type: "password",
      enableCopyPaste: true,
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
          border: `1px solid ${theme.palette.border.lightBlack}`,
        },
      },
    },
  },
];

export const initialSignInData = {
  userName: "",
  password: "",
};
export const initialForgotPasswordData = {
  email: "",
};
export const initialResetData = {
  newPassword: "",
  confirmPassword: "",
};
