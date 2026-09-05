import { IAddress } from "../../pages/ContactPage/AddContacts/types";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import {
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors,
} from "../../constants/errors";
import { REGEX_PATTERNS } from "../../constants/regex";
import { FormFieldConfig } from "../FormComponent/types";
import { masterDataUtilitySearchWithIdFunction } from "../../utils";
import { addressesUtilityFunction } from "../../utils/procesaApiFormConfig";
/**
 * Utility function to generate conditional validation rules for address fields.
 * If `mandatory` is true, field is required.
 * If `mandatory` is false, field is required only if any address field in the row is filled.
 */

export const getAddressFieldRules = (
  fieldKey: string,
  label: string,
  mandatory: boolean,
  index?: number
) => {
  if (mandatory) {
    return {
      required: {
        value: true,
        message: requiredErrorMessage(label),
      },
    };
  }
  // Non-mandatory: If any field in the row is filled, all must be filled
  return {
    validate: (value: any, formValues: any) => {
      const row = formValues?.retArray?.[index ?? 0] || formValues;
      // List all address keys that should be checked together
      const addressKeys = [
        "addressTypeLid",
        "address1",
        "stateId",
        "cityId",
        "pinCode",
        "phoneNumber",
      ];
      const anyFilled = addressKeys.some((key) => !!row?.[key]);
      if (anyFilled && !value) {
        return `${label} is required`;
      }
      return true;
    },
  };
};

export const addressFields = (
  userData: any,
  mandatory = true,
  policyLocationLookupId?: number
): FormFieldConfig[] => [
  {
    key: "addressTypeLid",
    name: "addressTypeLid",
    label: "Address type",
    type: "select",
    gridColumn: 5,
    rules: getAddressFieldRules("addressTypeLid", "Address type", mandatory),
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "locationCode",
    name: "locationCode",
    label: "Location Code",
    type: "text",
    gridColumn: 5,
    // Hide the field unless this row's addressType is Associated Location.
    showField: (rowWatch: any) =>
      policyLocationLookupId != null &&
      Number(rowWatch("addressTypeLid")) === policyLocationLookupId,
    rules: {
      required: {
        value: true,
        message: "Location Code is required",
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Location Code", 100),
      },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "address1",
    name: "address1",
    label: "Address line",
    type: "text",
    gridColumn: 5,
    rules: {
      ...getAddressFieldRules("address1", "Address line", mandatory),
      maxLength: {
        value: 255,
        message: textErrorMessage("Address line", 255),
      },
    },
    componentProps: {
      fullWidth: true,
      type: "text",
      multiple: true,
    },
  },
  {
    key: "address2",
    name: "address2",
    label: "Address line 2",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "text",
      multiple: true,
    },
    rules: {
      maxLength: {
        value: 255,
        message: textErrorMessage("Address Line 2", 255),
      },
    },
  },
  {
    key: "area",
    name: "area",
    label: "Area",
    type: "text",
    gridColumn: 5,
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Area", 100),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "countryId",
    name: "countryId",
    label: "Country",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true, disabled: true },
    apiDependencies: {
      endPoint: endPoints.countriesList,
      clearFieldsOnChange: ["stateId", "cityId"],
      utilityFunction: (data) => addressesUtilityFunction(data),
    },
    disabled: userData?.country?.id ? true : false,
  },
  {
    key: "stateId",
    name: "stateId",
    label: "State",
    type: "select",
    gridColumn: 5,
    rules: getAddressFieldRules("stateId", "State", mandatory),
    apiDependencies: {
      endPoint: endPoints.stateListById,
      clearFieldsOnChange: ["cityId"],
      dependentField: "countryId",
      utilityFunction: (data) => addressesUtilityFunction(data),
    },
  },
  {
    key: "cityId",
    name: "cityId",
    label: "City",
    type: "selectFieldByApi",
    gridColumn: 5,
    rules: getAddressFieldRules("cityId", "City", mandatory),
    apiDependencies: {
      endPoint: endPoints.masterDataByName("city"),
      utilityFunction: (data) => masterDataUtilitySearchWithIdFunction(data),
      customParams: { searchBy: "name" },
      valueField: "id",
      labelField: "name",
    },
  },
  {
    key: "pinCode",
    name: "pinCode",
    label: "Pin code",
    type: "text",
    gridColumn: 5,
    rules: {
      pattern: {
        value: REGEX_PATTERNS.PIN_CODE,
        message: ValidationErrors.PIN_CODE,
      },
    },
    componentProps: {
      fullWidth: true,
      type: "number",
    },
  },
  {
    key: "phoneNumber",
    name: "phoneNumber",
    label: "Phone number",
    type: "text",
    gridColumn: 5,
    rules: {
      pattern: {
        value: REGEX_PATTERNS.PHONE,
        message: ValidationErrors.PHONE,
      },
      maxLength: {
        value: 20,
        message: textErrorMessage("Phone number", 20),
      },
    },
    componentProps: {
      fullWidth: true,
      type: "tel",
    },
  },
  {
    key: "email",
    name: "email",
    label: "Email address",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "email",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.EMAIL,
        message: ValidationErrors.EMAIL,
      },
    },
  },
  {
    key: "alternatePhoneNumber",
    name: "alternatePhoneNumber",
    label: "Alternate phone number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "tel",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.PHONE,
        message: ValidationErrors.PHONE,
      },
      maxLength: {
        value: 20,
        message: textErrorMessage("Phone number", 20),
      },
    },
  },
  {
    key: "supportNumber",
    name: "supportNumber",
    label: "Support number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "tel",
      autoComplete: "supportNumber",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.LANDLINE_PHONE_MOBILE,
        message: ValidationErrors.SUPPORT_NUMBER,
      },
      maxLength: {
        value: 20,
        message: textErrorMessage("Phone number", 20),
      },
    },
  },
];

export const defaultAddress = (userData: any): IAddress => ({
  addressTypeLid: "",
  address1: "",
  address2: "",
  area: "",
  countryId: userData?.country?.id || "",
  stateId: "",
  cityId: "",
  pinCode: "",
  phoneNumber: "",
  alternatePhoneNumber: "",
  supportNumber: "",
  email: "",
  locationCode: "",
});
