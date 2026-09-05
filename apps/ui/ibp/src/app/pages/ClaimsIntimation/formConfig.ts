import dayjs from "dayjs";

export const CLAIMS_INTIMATION_FORM_CONFIG = (
  dependents,
  policyIds,
  showMedicalFields,
  companyId,
  selectedPolicyId
)=> [
  {
    key: "policyId",
    name: "policyId",
    label: "Policy",
    type: "select",
    gridColumn: 5.5,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select",
    // Sort policies by priority: GMC, GPA, GTL, then others
    options: policyIds
      .slice() // avoid mutating original
      .sort((a, b) => {
        const POLICY_PRIORITY: Record<string, number> = {
          POLICY_TYPE_GMC: 1,
          POLICY_TYPE_GPA: 2,
          POLICY_TYPE_GTL: 3,
        };
        const priorityA = POLICY_PRIORITY[a.policyTypeKey] ?? 999;
        const priorityB = POLICY_PRIORITY[b.policyTypeKey] ?? 999;
        return priorityA - priorityB;
      })
      .map((policy) => ({ value: policy.policyId, label: `${policy.policyName}` })),
    rules: {
      required: {
        value: true,
        message: "Policy number is required",
      },
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
      required: {
        value: true,
        message: "Employee ID is required",
      },
    },
  },
  {
    key: "dependentId",
    name: "dependentId",
    label: "Intimate for",
    type: "radiogroup",
    gridColumn: 5.5,
       componentProps: {
          fullWidth: true,
        },
    options: dependents.length > 0
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
  {
    key: "claimType",
    name: "claimType",
    label: "Claim Type",
    type: "radiogroup",
    gridColumn:5.5,
    componentProps: {
      fullWidth: true,
    },
    options: [
      { value: "CASHLESS", label: "CASHLESS" },
      { value: "REIMBURSEMENT", label: "REIMBURSEMENT" },
    ],
    rules: {
      required: {
        value: true,
        message: "Please select a claim type",
      },
    },
  },
  {
    key: "diagnosis",
    name: "diagnosis",
    label: "Diagnosis",
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
    componentProps: {
      placeholder: "Enter the Amount",
      fullWidth: true,
      enableCopyPaste: true,
    },
    rules: {
      required: {
        value: true,
        message: "Estimated claim amount is required",
      },
    },
  },
  
  ...(showMedicalFields
    ? [
        {
          key: "hospitalName",
          name: "hospitalName",
          label: "Hospital Name",
          type: "text",
          gridColumn: 5.5,
          componentProps: {
            placeholder: "Enter the Hospital name",
            fullWidth: true,
            enableCopyPaste: true,
          },
        },
        {
          key: "hospitalLocation",
          name: "hospitalLocation",
          label: "Hospital Location",
          type: "text",
          gridColumn: 5.5,
          componentProps: {
              fullWidth: true,
              placeholder: "Enter the Hospital location",
              enableCopyPaste: true,
          },
        },
        {
          key: "state",
          name: "state",
          label: "State",
          type: "text",
          gridColumn: 5.5,
          componentProps: {
              fullWidth: true,
              placeholder: "Enter the State",
              enableCopyPaste: true,
          },
        },
        {
          key: "city",
          name: "city",
          label: "City",
          type: "text",
          gridColumn: 5.5,
          componentProps: {
              fullWidth: true,
              placeholder: "Enter the City",
              enableCopyPaste: true,
          },
        },
        {
          key: "emailOrPhoneNumber",
          name: "emailOrPhoneNumber",
          label: "Email / Phone number",
          type: "text",
          gridColumn: 5.5,
          componentProps: {
              fullWidth: true,
              placeholder: "Enter the Email or Phone number",
              enableCopyPaste: true,
          },
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
        {
          key: "proposedDischargeDate",
          name: "proposedDischargeDate",
          label: "Proposed Discharge Date",
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
              message: "Proposed Discharge Date is required",
            },
            validate: (value: string, formValues: any) => {
              if (!value || !formValues?.dateOfAdmission) return true;
              return dayjs(value).isAfter(dayjs(formValues.dateOfAdmission))
                ? true
                : "Proposed Discharge Date must be after Date of Admission";
            },
          },
        },
      ]
    : []),
    {
    key: "documents",
    name: "documents",
    type: "documentupload",
    label: "Documents",
    hideDropdown: true,
    companyId: companyId ?? -1,
    policyId: selectedPolicyId ?? "",
    gridColumn: 9,
    // apiDependencies: {
    //   endPoint: 
    // },

    componentProps: {
      fullWidth: true,
      companyType: "company",
      multiple: true,
      accept: ".pdf",
      useIbpFileEndpoints: true,
      supportedFormatsMessage:
        "Supported formats: pdf only",
      formFieldName: "documents",
    },
  },
];

export const initialClaimsIntimationData = (employeeId: number, policyIds: number[])=> ({
  policyId:
    policyIds.find((policy: any) => policy.policyTypeKey?.includes("POLICY_TYPE_GMC"))
      ?.policyId ?? "",
  employeeId: employeeId,
  documents: [],
  diagnosis: "",
  estimatedClaimAmount: "",
  dateOfAdmission: "",
  hospitalName: "",
  hospitalLocation: "",
  state: "",
  city: "",
  emailOrPhoneNumber: "",
  proposedDischargeDate: "",
});
