import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";
import { REGEX_PATTERNS } from "@ui/ui-lib/constants/regex";

export const PASSWORD_RESET_FORM_CONFIG: FormFieldConfig[] = [
  {
    key: "companyEmployeeEmail",
    name: "companyEmployeeEmail",
    label: "Email",
    type: "text",
    rules: {
      required: { value: true, message: "Email is required" },
      pattern: { value: REGEX_PATTERNS.EMAIL, message: "Invalid email" },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter email",
         enableCopyPaste: true,
      // autoComplete: "off",
      // preventAutocomplete: true,
      // inputProps: {
      //   autoComplete: "off",
      // },
    },
  },
];

export const initialPasswordResetData = {
  companyEmployeeEmail: "",
};
