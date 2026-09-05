import { FormFieldConfig } from "@ui/ui-lib";
import { POLICY_EXTENSION_NUM, TEMP_NUM } from "../../../constants";
import { endorsementDocTypeMap } from "../utils/endorsementDocTypeMap";

export const getPolicyExtensionFormConfig = (
  currentPolicyTo?: string | null,
  isNonFinancial = false,
): FormFieldConfig[] => [
  {
    key: "iirnPolicyNumber",
    name: "iirnPolicyNumber",
    label: "IIRM Policy Number",
    type: "text",
    gridColumn: 5,
    disabled: true,
    componentProps: { fullWidth: true },
  },
  {
    key: "extensionDate",
    name: "extensionDate",
    label: "Extension Date",
    type: "date",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Extension Date is required" },
      validate: (value: string) => {
        if (!value) return true;
        if (currentPolicyTo) {
          const ext = new Date(value);
          const cur = new Date(currentPolicyTo);
          if (ext <= cur) {
            return `Extension Date must be after the current policy end date (current: ${currentPolicyTo})`;
          }
        }
        return true;
      },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "premiumFinancial",
    name: "premium",
    label: "Net Premium",
    type: "number",
    gridColumn: 5,
    isDecimal: true,
    showField: (watch) => watch("endorsementType") === "FINANCIAL_ENDORSEMENT",
    rules: { required: { value: true, message: "Net Premium is required for financial endorsements" } },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter net premium amount",
      inputMode: "decimal",
    },
  },
  {
    key: "premiumOptional",
    name: "premium",
    label: "Premium",
    type: "number",
    gridColumn: 5,
    isDecimal: true,
    disabled: isNonFinancial,
    showField: (watch) => watch("endorsementType") !== "FINANCIAL_ENDORSEMENT",
    componentProps: {
      fullWidth: true,
      placeholder: "Enter premium amount",
      inputMode: "decimal",
      disabled: isNonFinancial,
    },
  },
  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter remarks (optional)",
      rows: 3,
      multiline: true,
    },
  },
];

export const EndorsementDataUploadConfig: FormFieldConfig[] = [
  {
    key: "enrollmentStartDate",
    name: "enrollmentStartDate",
    label: "Enrollment Start Date",
    type: "date",
    gridColumn: 5,
    componentProps: { fullWidth: true },
  },
  {
    key: "enrollmentEndDate",
    name: "enrollmentEndDate",
    label: "Enrollment End Date",
    type: "date",
    gridColumn: 5,
    componentProps: { fullWidth: true },
  },
  {
    key: "noOfEmployees",
    name: "noOfEmployees",
    label: "Number of Assets",
    type: "number",
    gridColumn: 5,
    formatNumber: true,
    componentProps: { placeholder: "Enter asset count", fullWidth: true },
    rules: { required: { value: true, message: "Field is required" } },
  },
  {
    key: "noOfDependents",
    name: "noOfDependents",
    label: "Number of Sub Assets",
    type: "number",
    formatNumber: true,
    gridColumn: 5,
    rules: { required: { value: true, message: "Field is required" } },
    componentProps: { placeholder: "Enter sub asset count", fullWidth: true },
  },
  {
    key: "documentType",
    name: "documentType",
    label: "Data Type",
    type: "select",
    gridColumn: 9,
    componentProps: { fullWidth: true, placeholder: "Select Data Type" },
    options: [
      {
        value: TEMP_NUM,
        label: endorsementDocTypeMap.policy_asset_enrollment_data.label,
      },
      {
        value: POLICY_EXTENSION_NUM,
        label: endorsementDocTypeMap.policy_extension.label,
      },
    ],
    rules: { required: "Please select a data type" },
  },
  {
    key: "uploadEmployeeFile",
    name: "uploadEmployeeFile",
    label: "Upload File",
    type: "file",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      customVariant: "endorsementDoc",
      accept: ".xlsx,.xls",
      requireDocumentType: false,
    },
  },
];
