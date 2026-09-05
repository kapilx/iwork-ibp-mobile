import dayjs from "dayjs";
import { policyTypeKeys } from "../../../components/WelllnessBenefitSection/constants";
import { ClaimsIntimationFormValues } from "./types";
import cashlessIcon from "../../../assets/svgs/cashless-icon.svg";
import reimbursementIcon from "../../../assets/svgs/reimbursement-icon.svg";
import {
  addressesUtilityFunction,
  endPoints,
  formatAmountWithCurrency,
  getCurrencySymbolPrefix,
  LocalizationConfig,
} from "@ui/ui-lib";

export const buildInitialClaimsIntimationValues = (
  employeeId: number,
  policyIds: any[]
): ClaimsIntimationFormValues => ({
  policyId:
    policyIds.find((policy: any) => policy.policyTypeKey?.includes("POLICY_TYPE_GMC"))
      ?.policyId ?? "",
  employeeId,
  dependentId: "",
  claimType: "",
  benefitType: "",
  documents: [],
  diagnosis: "",
  estimatedClaimAmount: "",
  dateOfAdmission: "",
  proposedDischargeDate: "",
  placeOfAccident: "",
  hospitalId: "",
  hospitalName: "",
  hospitalLocation: "",
  state: "",
  city: "",
  pincode: "",
  country: "",
  emailOrPhoneNumber: "",
  hospitalEmail: "",
  hospitalPhoneNumber: "",
  documentTypes: [],
  documentsByType: {},
  dateOfDischargeActual: "",
  finalClaimedAmount: "",
  payeeName: "",
  bankAccountNo: "",
  accountType: "",
  ifscCode: "",
  submissionDocumentsByType: {},
  submissionDocumentTypes: [],
  intimateExtraFields: {},
  submitExtraFields: {},
});

// Step 4 (MULTI-flow TPAs only) — bank/discharge details for the Submit Claim call.
// Document upload for this step reuses ClaimDocumentsSection (same CASHLESS/
// REIMBURSEMENT matrix + rich upload UX as the intimation Hospital step), rendered
// separately against submissionDocumentsByType instead of a plain field here.
export const getSubmitClaimConfig = (
  dateOfAdmission?: string,
  // Purely data-driven, same as requiresDischargeAtIntimation — true when this TPA's
  // configured SUBMIT_CLAIM payload template references {{dateOfDischarge}} (e.g.
  // FHPL's DateofDischarge). Health India's current submit endpoint doesn't reference
  // it at all, so this correctly hides the field there too, no hardcoding involved.
  requiresDischargeAtSubmission: boolean = true,
  localization?: LocalizationConfig
) => [
  ...(requiresDischargeAtSubmission ? [{
    key: "dateOfDischargeActual",
    name: "dateOfDischargeActual",
    label: "Final Discharge Date",
    type: "date",
    gridColumn: 5.5,
    componentProps: {
      fullWidth: true,
      placeholder: "Select date",
      ...(dateOfAdmission ? { minDate: dayjs(dateOfAdmission) } : {}),
    },
    rules: {
      required: { value: true, message: "Final discharge date is required" },
    },
  }] : []),
  {
    key: "finalClaimedAmount",
    name: "finalClaimedAmount",
    label: "Final Claimed Amount",
    type: "number",
    gridColumn: 5.5,
    formatNumber: true,
    componentProps: {
      placeholder: "Enter the Amount",
      fullWidth: true,
      enableCopyPaste: true,
      InputProps: { startAdornment: getCurrencySymbolPrefix(localization) },
    },
    rules: {
      required: { value: true, message: "Final claimed amount is required" },
    },
  },
  {
    key: "payeeName",
    name: "payeeName",
    label: "Payee Name",
    type: "text",
    gridColumn: 5.5,
    componentProps: { placeholder: "Bank account holder name", fullWidth: true, enableCopyPaste: true },
    rules: { required: { value: true, message: "Payee name is required" } },
  },
  {
    key: "bankAccountNo",
    name: "bankAccountNo",
    label: "Bank Account Number",
    type: "text",
    gridColumn: 5.5,
    componentProps: { placeholder: "Enter bank account number", fullWidth: true, enableCopyPaste: true },
    rules: { required: { value: true, message: "Bank account number is required" } },
  },
  {
    key: "accountType",
    name: "accountType",
    label: "Account Type",
    type: "select",
    gridColumn: 5.5,
    componentProps: { fullWidth: true },
    placeholder: "Select",
    options: [
      { value: "Savings", label: "Savings" },
      { value: "Current", label: "Current" },
    ],
    rules: { required: { value: true, message: "Account type is required" } },
  },
  {
    key: "ifscCode",
    name: "ifscCode",
    label: "IFSC Code",
    type: "text",
    gridColumn: 5.5,
    componentProps: { placeholder: "Enter IFSC code", fullWidth: true, enableCopyPaste: true },
    rules: { required: { value: true, message: "IFSC code is required" } },
  },
];

export const getPolicyDetailsConfig = (policyIds: any[], dependents: any[]) => [
  {
    key: "policyId",
    name: "policyId",
    label: "Policy",
    type: "select",
    gridColumn: 5.5,
    componentProps: { fullWidth: true },
    placeholder: "Select",
    options: policyIds
      .slice()
      .sort((a, b) => {
        const priority: Record<string, number> = {
          POLICY_TYPE_GMC: 1,
          POLICY_TYPE_GPA: 2,
          POLICY_TYPE_GTL: 3,
        };
        return (
          (priority[a.policyTypeKey] ?? 999) -
          (priority[b.policyTypeKey] ?? 999)
        );
      })
      .map((policy) => ({
        value: policy.policyId,
        label: `${policy.policyName}`,
      })),
    rules: {
      required: { value: true, message: "Policy is required" },
    },
  },
  {
    key: "employeeId",
    name: "employeeId",
    label: "Employee ID",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      fullWidth: true,
      placeholder: "EMP-001234",
      disabled: true,
      enableCopyPaste: true,
    },
    rules: {
      required: { value: true, message: "Employee ID is required" },
    },
  },
  {
    key: "dependentId",
    name: "dependentId",
    label: "Intimate for",
    type: "radiogroup",
    gridColumn: 5.5,
    componentProps: { fullWidth: true },
    options:
      dependents.length > 0
        ? [
            { value: "self", label: "Self" },
            ...dependents.map((dependent: any) => ({
              value: dependent.id,
              label: dependent.name,
            })),
          ]
        : [{ value: "self", label: "Self" }],
    rules: {
      required: {
        value: true,
        message: "Please select who you are intimating for",
      },
    },
  },
];

// Only required by some TPAs at intimation (e.g. Health India's benefiT_TYPE) — shown
// only when the selected policy's TPA uses the MULTI-step (intimate + submit) flow.
const benefitTypeField = {
  key: "benefitType",
  name: "benefitType",
  label: "Benefit Type",
  type: "select",
  gridColumn: 5.5,
  componentProps: { fullWidth: true },
  placeholder: "Select",
  options: [
    { value: "IPD", label: "In-patient (IPD)" },
    { value: "OPD", label: "Out-patient (OPD)" },
  ],
  rules: {
    required: { value: true, message: "Benefit type is required" },
  },
};

export const getDiagnosisClaimConfig = (
  policyTypeKey?: string,
  sumInsured?: number,
  dateOfAdmission?: string,
  isMultiStepFlow?: boolean,
  // Purely data-driven — true when this TPA's OWN configured INTIMATE_CLAIM payload
  // template actually references {{dateOfDischarge}} (e.g. ISBS's clmHospTo), resolved
  // server-side (getClaimFlowMode) by checking the admin-configured template text, not
  // hardcoded per TPA here.
  requiresDischargeAtIntimation?: boolean,
  localization?: LocalizationConfig
) => {
  const isGpaPolicy = policyTypeKey === policyTypeKeys.GPA;

  const estimatedClaimAmountRules: Record<string, any> = {
    required: {
      value: true,
      message: "Estimated claim amount is required",
    },
  };

  if (sumInsured && sumInsured > 0) {
    estimatedClaimAmountRules["validate"] = (value: string) => {
      const amount = Number(value);
      if (!Number.isNaN(amount) && amount > sumInsured) {
        return `Amount should not exceed the sum insured of ${formatAmountWithCurrency(sumInsured, localization)}`;
      }
      return true;
    };
  }

  if (isGpaPolicy) {
    return [
      {
        key: "diagnosis",
        name: "diagnosis",
        label: "Accident Details",
        type: "text",
        gridColumn: 5.5,
        componentProps: {
          placeholder: "Enter the text",
          fullWidth: true,
          enableCopyPaste: true,
        },
        rules: {
          required: {
            value: true,
            message: "Accident details is required",
          },
        },
      },
      {
        key: "estimatedClaimAmount",
        name: "estimatedClaimAmount",
        label: "Estimated Claim Amount",
        type: "number",
        gridColumn: 5.5,
        formatNumber: true,
        componentProps: {
          placeholder: "Enter the Amount",
          fullWidth: true,
          enableCopyPaste: true,
          InputProps: {
            startAdornment: getCurrencySymbolPrefix(localization),
          },
        },
        rules: estimatedClaimAmountRules,
      },
      {
        key: "dateOfAdmission",
        name: "dateOfAdmission",
        label: "Date of accident",
        type: "date",
        gridColumn: 5.5,
        componentProps: {
          fullWidth: true,
          placeholder: "Select date",
          popperDetails: {
            placement: "top-start",
            modifiers: [
              {
                name: "flip",
                options: {
                  fallbackPlacements: [
                    "top-start",
                    "top-end",
                    "bottom-start",
                    "bottom-end",
                  ],
                },
              },
            ],
          },
          maxDate: dayjs(),
        },
        rules: {
          required: {
            value: true,
            message: "Date of accident is required",
          },
        },
      },
      {
      key: "placeOfAccident",
      name: "placeOfAccident",
      label: "Place of accident",
      type: "text",
        gridColumn: 5.5,
        componentProps: {
          placeholder: "Enter the text",
          fullWidth: true,
          enableCopyPaste: true,
        },
        rules: {
          required: {
            value: true,
          message: "Place of accident is required",
        },
      },
      },
      ...(isMultiStepFlow ? [benefitTypeField] : []),
    ];
  }

  return [
    {
      key: "diagnosis",
      name: "diagnosis",
      label: "Description",
      type: "text",
      gridColumn: 5.5,
      componentProps: {
        placeholder: "Enter the text",
        fullWidth: true,
        enableCopyPaste: true,
      },
      rules: {
        required: {
          value: true,
          message: "Diagnosis is required",
        },
      },
    },
    {
      key: "estimatedClaimAmount",
      name: "estimatedClaimAmount",
      label: "Estimated Claim Amount",
      type: "number",
      gridColumn: 5.5,
      formatNumber: true,
      componentProps: {
        placeholder: "Enter the Amount",
        fullWidth: true,
        enableCopyPaste: true,
        InputProps: {
          startAdornment: getCurrencySymbolPrefix(localization),
        },
      },
      rules: estimatedClaimAmountRules,
    },
    {
      key: "dateOfAdmission",
      name: "dateOfAdmission",
      label: "Date of Admission",
      type: "date",
      gridColumn: 5.5,
      componentProps: {
        fullWidth: true,
        placeholder: "Select date",
        popperDetails: {
          placement: "top-start",
          modifiers: [
            {
              name: "flip",
              options: {
                fallbackPlacements: [
                  "top-start",
                  "top-end",
                  "bottom-start",
                  "bottom-end",
                ],
              },
            },
          ],
        },
      },
       rules: {
        required: {
          value: true,
          message: "Date of Admission is required",
        },
      },
    },
    // Most MULTI-flow TPAs don't accept a discharge date at intimation (patient often
    // hasn't been discharged yet) — collected later in Step 4 (Submit Claim) instead, as
    // dateOfDischargeActual. SINGLE-flow always needs it here (no Step 4 at all). Some
    // MULTI TPAs (ISBS/GHPL) DO need it at intimation — requiresDischargeAtIntimation
    // covers that case without hardcoding which TPA.
    ...(!isMultiStepFlow || requiresDischargeAtIntimation ? [{
      key: "proposedDischargeDate",
      name: "proposedDischargeDate",
      label: "Proposed Discharge Date",
      type: "date",
      gridColumn: 5.5,
      componentProps: {
        fullWidth: true,
        placeholder: "Select date",
        ...(dateOfAdmission ? { minDate: dayjs(dateOfAdmission) } : {}),
        popperDetails: {
          placement: "top-start",
          modifiers: [
            {
              name: "flip",
              options: {
                fallbackPlacements: [
                  "top-start",
                  "top-end",
                  "bottom-start",
                  "bottom-end",
                ],
              },
            },
          ],
        },
      },
      rules: {
        required: {
          value: true,
          message: "Proposed Discharge Date is required",
        },
        validate: (value: string) => {
          if (!value || !dateOfAdmission) return true;
          const discharge = dayjs(value);
          const admission = dayjs(dateOfAdmission);
          if (!discharge.isValid() || !admission.isValid()) return true;
          if (!discharge.isAfter(admission)) {
            return "Proposed Discharge Date must be after Date of Admission";
          }
          return true;
        },
      },
    }] : []),
    ...(isMultiStepFlow ? [benefitTypeField] : []),
  ];
};


// Hospital step document UI is rendered via a custom component instead of DynamicForm config,
// because we need "document type -> show corresponding upload boxes" behavior.
export const getHospitalDetailsConfig = (_showMedicalFields: boolean) => [];

export const getHospitalManualFieldsConfig = () => [
  {
    key: "hospitalName",
    name: "hospitalName",
    label: "Hospital Name",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Enter hospital name",
      fullWidth: true,
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Hospital name is required",
      },
    },
  },
  {
    key: "country",
    name: "country",
    label: "Country",
    type: "select",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Enter country",
      fullWidth: true,
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Country is required",
      },
    },
    apiDependencies: {
        endPoint: endPoints.ibpCountriesList,
        clearFieldsOnChange: ["state", "city"],
        utilityFunction: (data) => addressesUtilityFunction(data),
    },
  },
  {
    key: "state",
    name: "state",
    label: "State",
    type: "select",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Enter state",
      fullWidth: true,
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "State is required",
      },
    },
    apiDependencies: {
      endPoint: endPoints.ibpStateListById,
      clearFieldsOnChange: ["city"],
      dependentField: "country",
      utilityFunction: (data) => addressesUtilityFunction(data),
    },
  },
  {
    key: "city",
    name: "city",
    label: "City",
    type: "select",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Enter city",
      fullWidth: true,
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "City is required",
      },
    },
    apiDependencies: {
      endPoint: endPoints.ibpCityListById,
      dependentField: "state",
      utilityFunction: (data) => addressesUtilityFunction(data),
    },
  },
  {
    key: "hospitalLocation",
    name: "hospitalLocation",
    label: "Location",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Enter hospital location",
      fullWidth: true,
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Location is required",
      },
    },
  },
  {
    key: "pincode",
    name: "pincode",
    label: "Pincode",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Enter pincode",
      fullWidth: true,
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Pincode is required",
      },
    },
  },
  {
    key: "hospitalEmail",
    name: "hospitalEmail",
    label: "Email",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Enter email",
      fullWidth: true,
      enableCopyPaste: true,
    },
  },
  {
    key: "hospitalPhoneNumber",
    name: "hospitalPhoneNumber",
    label: "Phone number",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Enter phone number",
      fullWidth: true,
      enableCopyPaste: true,
    },
  },
];

export const getHospitalReadonlyFieldsConfig = () => [
  {
    key: "hospitalNameReadonly",
    name: "hospitalName",
    label: "Hospital Name",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Hospital name",
      fullWidth: true,
      disabled: true,
      enableCopyPaste: true,
    },
  },
  {
    key: "hospitalLocationReadonly",
    name: "hospitalLocation",
    label: "Location",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Hospital location",
      fullWidth: true,
      disabled: true,
      enableCopyPaste: true,
    },
  },
  {
    key: "cityReadonly",
    name: "city",
    label: "City",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "City",
      fullWidth: true,
      disabled: true,
      enableCopyPaste: true,
    },
  },
  {
    key: "stateReadonly",
    name: "state",
    label: "State",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "State",
      fullWidth: true,
      disabled: true,
      enableCopyPaste: true,
    },
  },
  {
    key: "pincodeReadonly",
    name: "pincode",
    label: "Pincode",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Pincode",
      fullWidth: true,
      disabled: true,
      enableCopyPaste: true,
    },
  },
  {
    key: "countryReadonly",
    name: "country",
    label: "Country",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Country",
      fullWidth: true,
      disabled: true,
      enableCopyPaste: true,
    },
  },
  {
    key: "hospitalEmailReadonly",
    name: "hospitalEmail",
    label: "Email",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Email",
      fullWidth: true,
      disabled: true,
      enableCopyPaste: true,
    },
  },
  {
    key: "hospitalPhoneReadonly",
    name: "hospitalPhoneNumber",
    label: "Phone number",
    type: "text",
    gridColumn: 5.5,
    componentProps: {
      placeholder: "Phone number",
      fullWidth: true,
      disabled: true,
      enableCopyPaste: true,
    },
  },
];

export const claimTypeOptions = [
  {
    value: "CASHLESS",
    label: "Cashless",
    description: "Direct billing to hospital",
    icon: cashlessIcon,
  },
  {
    value: "REIMBURSEMENT",
    label: "Reimbursement",
    description: "Pay first, get refund later",
    icon: reimbursementIcon,
  },
];

export const getClaimTypeLabel = (value?: string | null) => {
  if (!value) return "Not Selected";
  return value === "CASHLESS" ? "Cashless" : "Reimbursement";
};

export const getPolicyTypeLabel = (policy?: any) =>
  policy?.policyName || policy?.policyTypeKey || "Not Selected";

export const normalizeSelectableDependentId = (value: unknown) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized || normalized === "self") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};
