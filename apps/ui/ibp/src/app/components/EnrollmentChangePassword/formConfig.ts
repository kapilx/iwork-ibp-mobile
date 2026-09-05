import { FormFieldConfig } from "@ui/ui-lib";
import { PasswordRule } from "../../types";

const commonComponentProps = {
  fullWidth: true,
  placeholder: "Enter your password",
  type: "password",
  disableBrowserPasswordManager: true,
  autoComplete: "off",
  preventAutocomplete: true,
  enableCopyPaste: true,
  iconStyles: { color: "#187fe3" },
  inputProps: { autoComplete: "off" },
};

const validateAgainstRules = (
  value: string,
  rules: PasswordRule[]
): string | true => {
  for (const rule of rules) {
    let passing: boolean;
    if (rule.minChars !== undefined) {
      passing = value.length >= rule.minChars;
    } else if (rule.regex) {
      passing = new RegExp(rule.regex).test(value);
    } else {
      passing = true;
    }
    if (!passing) return rule.errorMessage;
  }
  return true;
};

const STATIC_RULES = {
  minLength: { value: 8, message: "Password must be at least 8 characters long." },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: "Password must contain uppercase, lowercase, number, and special character.",
  },
};

export const buildPasswordResetFormConfig = (
  passwordRules: PasswordRule[] = []
): FormFieldConfig[] => {
  const newPasswordRules =
    passwordRules.length > 0
      ? { validate: (value: string) => validateAgainstRules(value, passwordRules) }
      : STATIC_RULES;

  const reNewPasswordRules =
    passwordRules.length > 0
      ? {
          validate: (value: string, formValues: Record<string, any>) => {
            if (value !== formValues?.newPassword) return "Passwords do not match.";
            return validateAgainstRules(value, passwordRules);
          },
        }
      : STATIC_RULES;

  return [
    {
      key: "currentPassword",
      name: "currentPassword",
      label: "Current password",
      type: "text",
      gridColumn: 9,
      componentProps: commonComponentProps,
    },
    {
      key: "newPassword",
      name: "newPassword",
      label: "New password",
      type: "text",
      gridColumn: 9,
      rules: newPasswordRules,
      componentProps: commonComponentProps,
    },
    {
      key: "reNewPassword",
      name: "reNewPassword",
      label: "Re-enter New password",
      type: "text",
      gridColumn: 9,
      rules: reNewPasswordRules,
      componentProps: commonComponentProps,
    },
  ];
};

export const PASSWORD_RESET_FORM_CONFIG = buildPasswordResetFormConfig();

export const initialPasswordResetData = {
  currentPassword: "",
  newPassword: "",
  reNewPassword: "",
};
