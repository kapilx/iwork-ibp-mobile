import { endPoints, environment, FormFieldConfig, REGEX_PATTERNS } from "@ui/ui-lib";
import dayjs from "dayjs";
import {
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors,
} from "@ui/ui-lib/constants/errors";

export const policyDetailsFormConfig: FormFieldConfig[] = [
  {
    key: "policyName",
    name: "policyName",
    type: "text",
    label: "Policy name",
    gridColumn: 5,
    // rules: {
    //   required: {
    //     value: true,
    //     message: "Policy name is required.",
    //   },
    // },
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
  },
  {
    key: "policyType",
    name: "policyType",
    type: "select",
    label: "Policy type",
    gridColumn: 5,
    // rules: {
    //   required: {
    //     value: true,
    //     message: "Policy Type is required.",
    //   },
    // },
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_TYPE"),
      // isSmartSearch: true,
    },
  },
  {
    key: "companyName",
    name: "companyName",
    type: "text",
    label: "Company name",
    gridColumn: 5,
    // rules: {
    //   required: {
    //     value: true,
    //     message: "Company name is required.",
    //   },
    // },
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
  },
  {
    key: "companyType",
    name: "companyType",
    type: "select",
    label: "Company type",
    gridColumn: 5,
    // rules: {
    //   required: {
    //     value: true,
    //     message: "Company type is required.",
    //   },
    // },
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("COMPANY_TYPE"),
      // isSmartSearch: true,
      defaultValue: "",
    },
  },
  {
    key: "policyFrom",
    name: "policyFrom",
    type: "date",
    label: "Policy from",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Policy from is required." },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "policyTo",
    name: "policyTo",
    type: "date",
    label: "Policy to",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Policy to is required." },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "provisionalPolicyNo",
    name: "provisionalPolicyNo",
    type: "text",
    label: "Provisional policy no",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Provisional policy no is required." },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "sumInsured",
    name: "sumInsured",
    type: "number",
    label: "Sum insured",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Sum insured is required." },
    },
    componentProps: {
      fullWidth: true,
      inputMode: "numeric",
    },
    formatNumber: true,
  },
  ...(environment.featureFlag.FF_IWORK_ENROLMENT_PREMIUM_BASED ? [{
    key: "isEnrolmentPremiumBased",
    name: "isEnrolmentPremiumBased",
    type: "segmentedcontrol" as const,
    label: "Enrollment premium based",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("TOGGLE_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  }] : []),
  {
    key: "ownerName",
    name: "ownerName",
    type: "text",
    label: "Owner name",
    gridColumn: 5,
    // rules: {
    //   required: { value: true, message: "Owner name is required." },
    // },
    componentProps: { fullWidth: true, disabled: true },
  },
  {
    key: "ownerEmail",
    name: "ownerEmail",
    type: "text",
    label: "Owner email",
    gridColumn: 5,
    rules: {
      // required: { value: true, message: "Owner email is required." },
      // validate: (value: string) => {
      //   // If Email, not required, but if provided, must be valid
      //   if (value && !value.match(REGEX_PATTERNS.EMAIL)) {
      //     return ValidationErrors.EMAIL;
      //   }
      //   return true;
      // },
    },
    componentProps: { fullWidth: true, disabled: true },
  },
  {
    key: "ownerMobile",
    name: "ownerMobile",
    type: "number",
    label: "Owner mobile",
    gridColumn: 5,
    // rules: {
    //   required: { value: true, message: "Owner mobile is required." },
    // },
    componentProps: {
      fullWidth: true,
      disabled: true,
      inputMode: "numeric",
    },
  },

  // Business type (opportunity_type) — looks non-editable in sheet
  {
    key: "businessType",
    name: "businessType",
    type: "select",
    label: "Business type",
    gridColumn: 5,
    // rules: {
    //   required: { value: true, message: "Business type is required." },
    // },
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("OPPORTUNITY_TYPE"),
      defaultValue: "",
    },
  },

  {
    key: "insurerPolicyNumber",
    name: "insurerPolicyNumber",
    type: "text",
    label: "Insurer policy number",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Insurer policy number is required." },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "isMined",
    name: "isMined",
    type: "select", // or "checkbox" depending on your UI lib
    label: "Is Policy mined",
    gridColumn: 5,
    // usually booleans aren't "required", so skipping rules here
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("IS_POLICY_MINED"),
      defaultValue: "",
    },
  },
  // audit fields (read-only)
  {
    key: "createdBy",
    name: "createdBy",
    type: "text",
    label: "Policy created by",
    gridColumn: 5,
    componentProps: { fullWidth: true, disabled: true },
  },
  {
    key: "createdAt",
    name: "createdAt",
    type: "date",
    label: "Policy created at",
    gridColumn: 5,
    componentProps: { fullWidth: true, disabled: true },
  },
  {
    key: "updatedBy",
    name: "updatedBy",
    type: "text",
    label: "Policy updated by",
    gridColumn: 5,
    componentProps: { fullWidth: true, disabled: true },
  },
  {
    key: "updatedAt",
    name: "updatedAt",
    type: "date",
    label: "Policy updated at",
    gridColumn: 5,
    componentProps: { fullWidth: true, disabled: true },
  },

  {
    key: "incomeMonth",
    name: "incomeMonth",
    type: "date",
    label: "Income month",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Income month is required." },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "incomeType",
    name: "incomeType",
    type: "select",
    label: "Income type",
    gridColumn: 5,
    // rules: {
    //   required: { value: true, message: "Income type is required." },
    // },
    componentProps: { fullWidth: true, disabled: true },
  },
  {
    key: "dateOfIncome",
    name: "dateOfIncome",
    type: "date",
    label: "Date of income",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Date of income is required." },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "businessMonth",
    name: "businessMonth",
    type: "text",
    label: "Business month",
    gridColumn: 5,
    componentProps: { fullWidth: true, disabled: true },
    hide: true, // as per current understanding, this field is not required to be shown in the UI. Can remove this flag if it needs to be shown.
  },
  {
    key: "dateOfBusiness",
    name: "dateOfBusiness",
    type: "date",
    label: "Date of business",
    gridColumn: 5,
    componentProps: { fullWidth: true, disabled: true },
    hide: true, // as per current understanding, this field is not required to be shown in the UI. Can remove this flag if it needs to be shown.
  },
  {
    key: "policyGroup",
    name: "policyGroup",
    type: "select",
    label: "Policy group",
    gridColumn: 5,
    // rules: {
    //   required: { value: true, message: "Policy group is required." },
    // },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_GROUP"),
      defaultValue: "",
    },
    componentProps: { fullWidth: true, disabled: true },
  },
  {
    key: "endorsementFrequency",
    name: "endorsementFrequency",
    type: "text",
    label: "Endorsement frequency",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
  },

  // If you capture mined flag
  // {
  //   key: "isMined",
  //   name: "isMined",
  //   type: "segmentedcontrol", // or "checkbox" depending on your UI lib
  //   label: "Mined",
  //   gridColumn: 5,
  //   // usually booleans aren't "required", so skipping rules here
  //   componentProps: { fullWidth: true },
  //   apiDependencies: {
  //     endPoint: endPoints.lookUpByName("TOGGLE_TYPE"),
  //   },
  // },
];

export const policyAdditionalDetailsFormConfig: FormFieldConfig[] = [
  {
    key: "createdBy",
    name: "createdBy",
    label: "Created by",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
  },
  {
    key: "lastModifiedBy",
    name: "lastModifiedBy",
    label: "Last modified by",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
  },
  {
    key: "createdOn",
    name: "createdOn",
    label: "Created on",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      disabled: true,
      type: "date",
    },
  },
  {
    key: "lastModifiedOn",
    name: "lastModifiedOn",
    label: "Last modified on",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      disabled: true,
      type: "date",
    },
  },
];

export const approvalModalConfig = {
  key: "comments",
  config: [
    {
      key: "comments",
      name: "comments",
      type: "textarea",
      label: "Comments",
      gridColumn: 9,
      componentProps: {
        rows: 3,
        fullWidth: true,
        multiline: true,
        placeholder: "Enter the text",
        style: { width: "500px" },
      },
    },
  ],
};
export const premiumAndBrokerageDetails: FormFieldConfig[] = [
  {
    key: "premiumAtInception",
    name: "premiumAtInception",
    type: "number",
    label: "Premium at Inception",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Premium at Inception is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "basicPremium",
    name: "basicPremium",
    type: "number",
    label: "Basic Premium",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Basic Premium is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "netPremium",
    name: "netPremium",
    type: "number",
    label: "Net premium amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Net premium amount is required." },
    },
    disabled: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "grossPremium",
    name: "grossPremium",
    type: "number",
    label: "Gross premium amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Gross premium amount is required." },
    },
    disabled: true,
    componentProps: { fullWidth: true },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "premiumCollected",
    name: "premiumCollected",
    type: "number",
    label: "Premium collected",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Premium collected is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  // {
  //   key: "gst",
  //   name: "gst",
  //   type: "number",
  //   label: "GST",
  //   gridColumn: 5,
  //   rules: {
  //     required: { value: true, message: "GST is required." },
  //     max: {
  //       value: 100,
  //       message: "GST cannot exceed 100",
  //     },
  //     min: {
  //       value: 0,
  //       message: "GST cannot be negative",
  //     },
  //   },
  //   componentProps: { fullWidth: true, inputMode: "numeric" },
  //   isDecimal: true,
  // },
  {
    key: "gstPercentage",
    name: "gstPercentage",
    type: "number",
    label: "GST percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "GST percentage is required." },
      max: {
        value: 100,
        message: "GST percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "GST percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "gstAmount",
    name: "gstAmount",
    type: "number",
    label: "GST amount",
    isDecimal: true,
    gridColumn: 5,
    rules: {
      required: { value: true, message: "GST amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  // {
  //   key: "gst",
  //   name: "gst",
  //   type: "number",
  //   label: "GST",
  //   gridColumn: 5,
  //   rules: { required: { value: true, message: "GST is required." } },
  //   componentProps: { fullWidth: true, inputMode: "numeric" },
  // },
  {
    key: "terrorismBrokeragePercentage",
    name: "terrorismBrokeragePercentage",
    type: "number",
    label: "Terrorism brokerage percentage",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "Terrorism brokerage percentage is required.",
      },
      max: {
        value: 100,
        message: "Terrorism brokerage percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Terrorism brokerage percentage cannot be negative",
      },
    },
    isDecimal: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
  },
  {
    key: "terrorismAmount",
    name: "terrorismAmount",
    type: "number",
    label: "Terrorism amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Terrorism amount is required." },
    },
    componentProps: { fullWidth: true },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "otherAmount",
    name: "otherAmount",
    type: "number",
    label: "Other amount",
    gridColumn: 5,
    rules: { required: { value: true, message: "Other amount is required." } },
    componentProps: { fullWidth: true },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "basicBrokeragePercentage",
    name: "basicBrokeragePercentage",
    type: "number",
    label: "Basic brokerage percentage",
    gridColumn: 5,
    isDecimal: true,
    rules: {
      required: {
        value: true,
        message: "Basic brokerage percentage is required.",
      },
      max: {
        value: 100,
        message: "Basic brokerage percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Basic brokerage percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "basicBrokerageAmount",
    name: "basicBrokerageAmount",
    type: "number",
    label: "Basic brokerage amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Basic brokerage amount is required." },
    },
    isDecimal: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "tcBrokerageAmount",
    name: "tcBrokerageAmount",
    type: "number",
    label: "Terrorism brokerage amount",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "Terrorism brokerage amount is required.",
      },
    },
    isDecimal: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "totalBrokerageAmount",
    name: "totalBrokerageAmount",
    type: "number",
    label: "Total brokerage amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Total brokerage amount is required." },
    },
    disabled: true,
    isDecimal: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "brokerageCollected",
    name: "brokerageCollected",
    type: "number",
    label: "Brokerage collected",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Brokerage collected is required." },
    },
    componentProps: { fullWidth: true, type: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "brokerageAmountAsperIwork",
    name: "brokerageAmountAsperIwork",
    type: "number",
    label: "Brokerage amount (as per iWork)",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Brokerage amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "brokerageAmountAsperIsg",
    name: "brokerageAmountAsperIsg",
    type: "number",
    label: "Brokerage amount (as per ISG)",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Brokerage amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "feeAmount",
    name: "feeAmount",
    type: "number",
    label: "Fee amount",
    gridColumn: 5,
    rules: { required: { value: true, message: "Fee amount is required." } },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "odPercentage",
    name: "odPercentage",
    type: "number",
    label: "OD percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "OD percentage is required." },
      max: {
        value: 100,
        message: "OD percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "OD percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "tpPercentage",
    name: "tpPercentage",
    type: "number",
    label: "TP percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "TP percentage is required." },
      max: {
        value: 100,
        message: "TP percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "TP percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "netPercentage",
    name: "netPercentage",
    type: "number",
    label: "Net percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Net percentage is required." },
      max: {
        value: 100,
        message: "Net percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Net percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "sharePercentage",
    name: "sharePercentage",
    type: "number",
    label: "Share percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Share percentage is required." },
      max: {
        value: 100,
        message: "Share percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Share percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
];

export const rconDetails: FormFieldConfig[] = [
  {
    key: "rconStatus",
    name: "rconStatus",
    type: "text", // switch to "select" if you have fixed options
    label: "RCON Status",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "RCON Status is required." },
      maxLength: {
        value: 50,
        message: textErrorMessage("RCON Status", 50),
      },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "rconBrokerage",
    name: "rconBrokerage",
    type: "number",
    label: "RCON Brokerage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "RCON Brokerage is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "rconOutcome",
    name: "rconOutcome",
    type: "text", // switch to "select" if you have fixed options
    label: "RCON Outcome",
    gridColumn: 5,
    rules: { required: { value: true, message: "RCON Outcome is required." } },
    componentProps: { fullWidth: true },
  },
  {
    key: "pendingBrokerage",
    name: "pendingBrokerage",
    type: "number",
    label: "Pending Brokerage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Pending Brokerage is required." },
    },
    formatNumber: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
  },
];

export const installmentDates: FormFieldConfig[] = [
  {
    key: "installmentDate",
    name: "installmentDate",
    type: "date", // switch to "select" if you have fixed options
    label: "Installment Date",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Installment Date is required." },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "installmentAmount",
    name: "installmentAmount",
    type: "number",
    label: "Installment Amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Installment Amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
  },
];

//below configs are for the localization, need to refactor in the future

export const premiumAndBrokerageDetailsLanka: FormFieldConfig[] = [
  {
    key: "premiumAtInception",
    name: "premiumAtInception",
    type: "number",
    label: "Premium at Inception",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Premium at Inception is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "srccAmount",
    name: "srccAmount",
    type: "number",
    label: "SRCC premium amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "SRCC premium amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "terrorismAmount",
    name: "terrorismAmount",
    type: "number",
    label: "TC premium amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "TC premium amount is required." },
    },
    componentProps: { fullWidth: true },
    formatNumber: true,
  },
  {
    key: "netPremium",
    name: "netPremium",
    type: "number",
    label: "Total net premium",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Total net premium is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
    disabled: true,
  },
  {
    key: "adminCharges",
    name: "adminCharges",
    type: "number",
    label: "Admin Charges",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Admin Charges is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "otherAmount",
    name: "otherAmount",
    type: "number",
    label: "Stamp duty",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Stamp duty is required." },
    },
    componentProps: { fullWidth: true },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "cessAmount",
    name: "cessAmount",
    type: "number",
    label: "Cess Amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Cess Amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "gstPercentage",
    name: "gstPercentage",
    type: "number",
    label: "VAT percentage",
    isDecimal: true,
    gridColumn: 5,
    rules: {
      required: { value: true, message: "VAT percentage is required." },
      max: {
        value: 100,
        message: "VAT percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "VAT percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
  },
  {
    key: "gstAmount",
    name: "gstAmount",
    type: "number",
    label: "VAT amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "VAT amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    disable: true,
  },
  {
    key: "feeAmount",
    name: "feeAmount",
    type: "number",
    label: "Policy fee",
    gridColumn: 5,
    rules: { required: { value: true, message: "Policy fee is required." } },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "grossPremium",
    name: "grossPremium",
    type: "number",
    label: "Total gross premium including tax and other charges",
    gridColumn: 5,
    disabled: true,
    rules: {
      required: {
        value: true,
        message:
          "Total gross premium including tax and other charges is required.",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "basicBrokeragePercentage",
    name: "basicBrokeragePercentage",
    label: "Basic brokerage percentage",
    type: "number",
    isDecimal: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
    rules: {
      min: {
        value: 0,
        message: "Basic brokerage percentage cannot be negative",
      },
      max: {
        value: 100,
        message: "Basic brokerage percentage cannot exceed 100",
      },
      required: {
        value: true,
        message: "Basic brokerage percentage is required",
      },
    },
  },
  {
    key: "srccPercentage",
    name: "srccPercentage",
    type: "number",
    label: "SRCC brokerage percentage",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "SRCC brokerage percentage is required.",
      },
      max: {
        value: 100,
        message: "SRCC brokerage percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "SRCC brokerage percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "terrorismBrokeragePercentage",
    name: "terrorismBrokeragePercentage",
    type: "number",
    label: "TC brokerage percentage",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "TC brokerage percentage is required.",
      },
      max: {
        value: 100,
        message: "TC brokerage percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "TC brokerage percentage cannot be negative",
      },
    },
    isDecimal: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
  },
  {
    key: "basicBrokerageAmount",
    name: "basicBrokerageAmount",
    type: "number",
    label: "Basic brokerage amount",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    formatNumber: true,
  },
  {
    key: "srccBrokerageAmount",
    name: "srccBrokerageAmount",
    type: "number",
    label: "SRCC brokerage amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "SRCC brokerage amount is required." },
    },
    isDecimal: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  {
    key: "tcBrokerageAmount",
    name: "tcBrokerageAmount",
    type: "number",
    label: "TC brokerage amount",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    formatNumber: true,
  },
  {
    key: "totalBrokerageAmount",
    name: "totalBrokerageAmount",
    type: "number",
    label: "Total brokerage amount",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Brokerage amount is required." },
    },
    disabled: true,
    isDecimal: true,
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
  },
  // {
  //   key: "basicPremium",
  //   name: "basicPremium",
  //   type: "number",
  //   label: "Basic Premium",
  //   gridColumn: 5,
  //   rules: {
  //     required: { value: true, message: "Basic Premium is required." },
  //   },
  //   componentProps: { fullWidth: true, inputMode: "numeric" },
  //   formatNumber: true,
  // },
  // {
  //   key: "grossPremiumAmount",
  //   name: "grossPremiumAmount",
  //   type: "number",
  //   label: "Total gross premium including tax",
  //   gridColumn: 5,
  //   rules: {
  //     required: {
  //       value: true,
  //       message: "Total gross premium including tax charges is required.",
  //     },
  //   },
  //   disabled: true,
  //   componentProps: { fullWidth: true },
  //   formatNumber: true,
  //   isDecimal: true,
  // },
  {
    key: "premiumCollected",
    name: "premiumCollected",
    type: "number",
    label: "Premium collected",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Premium collected is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  // {
  //   key: "gst",
  //   name: "gst",
  //   type: "number",
  //   label: "GST",
  //   gridColumn: 5,
  //   rules: { required: { value: true, message: "GST is required." } },
  //   componentProps: { fullWidth: true, inputMode: "numeric" },
  // },
  {
    key: "otherPercentage",
    name: "otherPercentage",
    type: "number",
    label: "Stamp duty percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Stamp duty percentage is required." },
    },
    componentProps: { fullWidth: true },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "basicBrokeragePercentage",
    name: "basicBrokeragePercentage",
    type: "number",
    label: "Basic brokerage percentage",
    gridColumn: 5,
    isDecimal: true,
    rules: {
      required: {
        value: true,
        message: "Basic brokerage percentage is required.",
      },
      max: {
        value: 100,
        message: "Basic brokerage percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Basic brokerage percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "brokerageCollected",
    name: "brokerageCollected",
    type: "number",
    label: "Brokerage collected",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Brokerage collected is required." },
    },
    componentProps: { fullWidth: true, type: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "brokerageAmountAsperIwork",
    name: "brokerageAmountAsperIwork",
    type: "number",
    label: "Brokerage amount (as per iWork)",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Brokerage amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "brokerageAmountAsperIsg",
    name: "brokerageAmountAsperIsg",
    type: "number",
    label: "Brokerage amount (as per ISG)",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Brokerage amount is required." },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    formatNumber: true,
    isDecimal: true,
  },
  {
    key: "feePercentage",
    name: "feePercentage",
    type: "number",
    label: "Policy fee percentage",
    gridColumn: 5,
    isDecimal: true,
    rules: {
      required: { value: true, message: "Policy fee percentage is required." },
      max: {
        value: 100,
        message: "Policy fee percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Policy fee percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true },
  },
  {
    key: "odPercentage",
    name: "odPercentage",
    type: "number",
    label: "OD percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "OD percentage is required." },
      max: {
        value: 100,
        message: "OD percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "OD percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "tpPercentage",
    name: "tpPercentage",
    type: "number",
    label: "TP percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "TP percentage is required." },
      max: {
        value: 100,
        message: "TP percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "TP percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "netPercentage",
    name: "netPercentage",
    type: "number",
    label: "Net percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Net percentage is required." },
      max: {
        value: 100,
        message: "Net percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Net percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "sharePercentage",
    name: "sharePercentage",
    type: "number",
    label: "Share percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Share percentage is required." },
      max: {
        value: 100,
        message: "Share percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Share percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "adminChargesPercentage",
    name: "adminChargesPercentage",
    type: "number",
    label: "Admin Charges percentage",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "Admin Charges percentage is required.",
      },
      max: {
        value: 100,
        message: "Admin Charges percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Admin Charges percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
  {
    key: "cessPercentage",
    name: "cessPercentage",
    type: "number",
    label: "Cess percentage",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Cess percentage is required." },
      max: {
        value: 100,
        message: "Cess percentage cannot exceed 100",
      },
      min: {
        value: 0,
        message: "Cess percentage cannot be negative",
      },
    },
    componentProps: { fullWidth: true, inputMode: "numeric" },
    isDecimal: true,
  },
];

export const smartSearchConfig = [
  {
    key: "from",
    name: "from",
    label: "From date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select from date",
    },
  },
  {
    key: "to",
    name: "to",
    label: "To date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select to date",
    },
  },
];

export const insuredDetailsSmartSearchConfig = (
  policyFrom?: string | Date | null,
  policyTo?: string | Date | null,
  watch?: (name: string) => any
) => {
  const effectiveFromValue = watch?.("effectiveFrom");
  return [
  {
    key: "employeeId",
    name: "employeeId",
    label: "Search by Employee Company ID",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Employee Company ID",
    },
  },
  {
    key: "relationshipGroup",
    name: "relationshipGroup",
    label: "Relationship Group",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Relationship Group",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("RELATIONSHIP_GROUP"),
      isSmartSearch: true,
    },
  },
  {
    key: "claimStatusFilter",
    name: "claimStatusFilter",
    label: "Claims Status",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Claims Status",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("TOGGLE_TYPE"),
      isSmartSearch: true,
    },
  },
  {
    key: "effectiveFrom",
    name: "effectiveFrom",
    label: "Effective From",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Effective From",
      minDate: policyFrom ? dayjs(policyFrom) : undefined,
    },
  },
  {
    key: "effectiveTo",
    name: "effectiveTo",
    label: "Effective To",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Effective To",
      minDate: effectiveFromValue
        ? dayjs(effectiveFromValue)
        : policyFrom
          ? dayjs(policyFrom)
          : undefined,
      maxDate: policyTo ? dayjs(policyTo) : undefined,
    },
  },
  {
    key: "insurerEndorsementNumber",
    name: "insurerEndorsementNumber",
    label: "Insurer Endorsement Number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Insurer Endorsement Number",
    },
  },
  {
    key: "insurerEndorsementDate",
    name: "insurerEndorsementDate",
    label: "Ack date from insurer",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Ack date from insurer",
    },
  },
  {
    key: "tpaId",
    name: "tpaId",
    label: "TPA ID",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter TPA ID",
    },
  },
  {
    key: "endorsementId",
    name: "endorsementId",
    label: "Iwork Endorsement ID",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Endorsement ID",
    },
  },
  {
    key: "insuredStatus",
    name: "insuredStatus",
    label: "Status",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select Status",
    },
    options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
  },
];
};
