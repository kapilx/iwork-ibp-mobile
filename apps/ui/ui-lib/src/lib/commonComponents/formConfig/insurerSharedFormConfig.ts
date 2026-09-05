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

export interface IBranchAddress {
  branchTypeLid?: number | string;
  parentBranchId?: number | string;
  branchCode?: string;
  branchName?: string;
  branchDisplayName?: string;
  addressTypeLid?: number | string;
  address1: string;
  address2?: string;
  area?: string;
  countryId: number | string;
  stateId: number | string;
  cityId: number | string;
  cityLabel?: string;
  pinCode: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  contactId?: number;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  supportNumber?: string;
  email?: string;
  panCardNo?: string;
  registrationNo?: string;
  tanNumber?: string;
  gstStateId?: number | string;
  gstCategoryLid?: number | string;
  gstNumber?: string;
}

export const addressFields = (
  userData: any,
  mandatory = true,
  index?: number
): FormFieldConfig[] => [
  {
    key: "branchTypeLid",
    name: "branchTypeLid",
    label: "Branch type",
    type: "select",
    gridColumn: 5,
    rules: {
      required: { value: mandatory, message: requiredErrorMessage("Branch type") },
    },
    placeholder: "Type to search branch type",
    apiDependencies: {
      endPoint: endPoints.lookUpByName("INSURER_BRANCH_TYPE"),
      utilityFunction: (data: any) => {
        const apiData = Array.isArray(data?.data) ? data.data : [];
        return apiData
          .filter((item: any) => item.lookUpKey !== "INSURER_BRANCH_TYPE_HQ")
          .map((item: any) => ({ label: item.lookUpValue, value: item.id }));
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
//   {
//     key: "parentBranchId",
//     name: "parentBranchId",
//     label: "Parent branch",
//     type: "select",
//     gridColumn: 5,
//     apiDependencies: {
//       endPoint: endPoints.lookUpByName("PARENT_BRANCH"),
//     },
//     componentProps: {
//       fullWidth: true,
//       placeholder: "Select parent branch",
//     },
//   },
  {
    key: "branchCode",
    name: "branchCode",
    label: "Branch Code",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter branch code",
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Branch Code", 100),
      },
    },
  },
  {
    key: "branchName",
    name: "branchName",
    label: "Branch name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter branch name",
    },
    rules: {
      maxLength: {
        value: 200,
        message: textErrorMessage("Branch name", 200),
      },
    },
  },
//   {
//     key: "branchDisplayName",
//     name: "branchDisplayName",
//     label: "Branch display name",
//     type: "text",
//     gridColumn: 5,
//     componentProps: {
//       fullWidth: true,
//       placeholder: "Branch display name",
//     },
//     rules: {
//       maxLength: {
//         value: 300,
//         message: textErrorMessage("Branch display name", 300),
//       },
//     },
//   },
  {
    key: "addressFieldsTitle",
    name: "addressFieldsTitle",
    label: "Address details",
    type: "title",
    gridColumn: 10,
    componentProps: { isBold: true,fontSize: "md" },
  },
  {
    key: "address1",
    name: "address1",
    label: "Address line",
    type: "text",
    gridColumn: 5,
    rules: {
      required: { value: mandatory, message: requiredErrorMessage("Address line") },
      maxLength: {
        value: 255,
        message: textErrorMessage("Address line", 255),
      },
    },
    componentProps: {
      fullWidth: true,
      type: "text",
      multiple: true,
      placeholder: "Enter address line",
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
      placeholder: "Enter address line 2",
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
      placeholder: "Enter area",
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
      clearFieldsOnChange: ["stateId", "cityId", "cityLabel"],
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
    rules: {
      required: { value: mandatory, message: requiredErrorMessage("State") },
    },
    placeholder: "Type to search state",
    apiDependencies: {
      endPoint: endPoints.stateListById,
      clearFieldsOnChange: ["cityId", "cityLabel"],
      dependentField: "countryId",
      utilityFunction: (data) => addressesUtilityFunction(data),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Select state",
    },
  },
  {
    key: "cityId",
    name: "cityId",
    label: "City",
    type: "selectFieldByApi",
    gridColumn: 5,
    rules: {
      required: { value: mandatory, message: requiredErrorMessage("City") },
    },
    placeholder: "Type to search city",
    apiDependencies: {
        endPoint: endPoints.cityListById,
        dependentField: "stateId",
        utilityFunction: (data) => addressesUtilityFunction(data),
    },
  },
  {
    key: "pinCode",
    name: "pinCode",
    label: "Pin code",
    type: "text",
    gridColumn: 5,
    rules: {
      required: { value: mandatory, message: requiredErrorMessage("Pin code") },
      pattern: {
        value: REGEX_PATTERNS.PIN_CODE,
        message: ValidationErrors.PIN_CODE,
      },
    },
    componentProps: {
      fullWidth: true,
      type: "number",
      placeholder: "Enter pin code",
    },
  },
  {
    key: "branchContactFieldsTitle",
    name: "branchContactFieldsTitle",
    label: "Contact details",
    type: "title",
    gridColumn: 10,
    componentProps: { isBold: true, fontSize: "md" },
  },
  {
    key: "firstName",
    name: "firstName",
    label: "First name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter first name",
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("First name", 100),
      },
    },
    dependentFieldsOnBlur: "displayName",
  },
  {
    key: "lastName",
    name: "lastName",
    label: "Last name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter last name",
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Last name", 100),
      },
      validate: (value: string, formValues: any) => {
        const firstName =
          index !== undefined
            ? formValues.retArray?.[index]?.firstName
            : formValues.firstName;
        if (firstName?.trim() && !value?.trim()) return "Last name is required";
        return true;
      },
    },
    dependentFieldsOnBlur: "displayName",
  },
  {
    key: "displayName",
    name: "displayName",
    label: "Display name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Auto-filled from first & last name",
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Display name", 100),
      },
    },
    inputDependentField: ["firstName", "lastName"],
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
        message: textErrorMessage("Branch phone number", 20),
      },
    },
    componentProps: {
      fullWidth: true,
      type: "tel",
      placeholder: "Enter phone number",
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
      placeholder: "Enter email address",
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
      placeholder: "Enter alternate phone number",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.PHONE,
        message: ValidationErrors.PHONE,
      },
      maxLength: {
        value: 20,
        message: textErrorMessage("Branch alternate phone number", 20),
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
      placeholder: "Enter support number",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.LANDLINE_PHONE_MOBILE,
        message: ValidationErrors.SUPPORT_NUMBER,
      },
      maxLength: {
        value: 20,
        message: textErrorMessage("Branch support number", 20),
      },
    },
  },
  {
    key: "kycFieldsTitle",
    name: "kycFieldsTitle",
    label: "KYC details",
    type: "title",
    gridColumn: 10,
    componentProps: { isBold: true, fontSize: "md" },
  },
  {
    key: "registrationNo",
    name: "registrationNo",
    label: "Registration number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter registration number",
    },
    textTransform: "uppercase",
  },
  {
    key: "tanNumber",
    name: "tanNumber",
    label: "TIN number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter TIN number",
    },
    textTransform: "uppercase",
  },
  {
    key: "panCardNo",
    name: "panCardNo",
    label: "PAN card number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      inputProps: { maxLength: 10 },
      placeholder: "Enter PAN card number",
    },
    textTransform: "uppercase",
  },
  {
    key: "gstFieldsTitle",
    name: "gstFieldsTitle",
    label: "GST details",
    type: "title",
    gridColumn: 10,
    componentProps: { isBold: true, fontSize: "md" },
  },
  {
    key: "gstStateId",
    name: "gstStateId",
    label: "State",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: userData?.country?.id
        ? endPoints.stateGstListById(userData.country.id)
        : undefined,
      utilityFunction: (data) => addressesUtilityFunction(data),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Select state",
    },
  },
  {
    key: "gstCategoryLid",
    name: "gstCategoryLid",
    label: "Category",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("TAX"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "gstNumber",
    name: "gstNumber",
    label: "GST number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter GST number",
    },
    textTransform: "uppercase",
    rules: {
      pattern: {
        value: REGEX_PATTERNS.GST_NUMBER,
        message: "Invalid GST Number format (e.g., 27ABCDE1234F1Z5)",
      },
    },
  },
];

export const hqAddressFields = (userData: any): FormFieldConfig[] =>
  addressFields(userData, false).map((field) =>
    field.key === "branchTypeLid"
      ? {
          ...field,
          componentProps: { ...field.componentProps, disabled: true },
          apiDependencies: {
            ...field.apiDependencies,
            utilityFunction: (data: any) => {
              const apiData = Array.isArray(data?.data) ? data.data : [];
              return apiData.map((item: any) => ({
                label: item.lookUpValue,
                value: item.id,
              }));
            },
          },
        }
      : field
  );

export const defaultHqAddress = (userData: any, hqBranchTypeLid?: number): IBranchAddress => ({
  ...defaultAddress(userData),
  branchTypeLid: hqBranchTypeLid ?? 30149,
});

export const defaultAddress = (userData: any): IBranchAddress => ({
  branchTypeLid: "",
  parentBranchId: "",
  branchCode: "",
  branchName: "",
  branchDisplayName: "",
  addressTypeLid: "",
  address1: "",
  address2: "",
  area: "",
  countryId: userData?.country?.id || "",
  stateId: "",
  cityId: "",
  cityLabel: "",
  pinCode: "",
  firstName: "",
  lastName: "",
  displayName: "",
  phoneNumber: "",
  email: "",
  alternatePhoneNumber: "",
  supportNumber: "",
  panCardNo: "",
  registrationNo: "",
  tanNumber: "",
  gstStateId: "",
  gstCategoryLid: "",
  gstNumber: "",
});
