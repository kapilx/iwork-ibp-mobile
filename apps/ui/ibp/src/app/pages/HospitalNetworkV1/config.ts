import { FormFieldConfig, theme } from "@ui/ui-lib";
import { KeyboardEvent } from "react";
import { REGEX_PATTERNS } from "@ui/ui-lib/constants/regex";
import { ValidationErrors } from "@ui/ui-lib/constants/errors";

type HospitalFilterFormOptions = {
  onPinCodeEnter?: () => void;
};

export const HOSPITAL_FILTER_FORM_CONFIG = (
  stateOptions: Array<{ value: string; label: string }> = [],
  cityOptions: Array<{ value: string; label: string }> = [],
  options?: HospitalFilterFormOptions
): FormFieldConfig[] => [
  {
    key: "isNetworkHospital",
    name: "isNetworkHospital",
    label: "Hospital Type",
    type: "segmentedcontrol",
    gridColumn: 5,
    componentProps: {
      variantType: "primary",
    },
    options: [
      { label: "Included", value: "true" },
      { label: "Excluded", value: "false" },
    ],
  },
  {
    key: "state",
    name: "state",
    label: "Search by State",
    type: "select",
    gridColumn: 5,
    placeholder: "Select state",
    componentProps: {
      fullWidth: true,
    },
    options: stateOptions,
  },
  {
    key: "city",
    name: "city",
    label: "City",
    type: "select",
    placeholder: "Select city",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    options: cityOptions,
  },
  {
    key: "pinCode",
    name: "pinCode",
    label: "Pincode",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
      enableCopyPaste: true,
      placeholder: "Enter PIN code",
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          options?.onPinCodeEnter?.();
        }
      },
      sx: {
        "& .MuiOutlinedInput-input": {
          padding: theme.spacing(2),
        },
      },
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.PIN_CODE,
        message: ValidationErrors.PIN_CODE,
      },
    },
  },
];

export const initialHospitalFilterValues = {
  isNetworkHospital: "true",
  state: "",
  city: "",
  pinCode: "",
};

export const ITEMS_PER_PAGE = 25;
