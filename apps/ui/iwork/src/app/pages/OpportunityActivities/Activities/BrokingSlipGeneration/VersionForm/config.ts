import {
  endPoints,
  getTextFromHtml,
  FormFieldConfig,
  REGEX_PATTERNS,
} from "@ui/ui-lib";
import { getCountrySpecificConfig } from "../Constants/countryConfigUtils";
import { makeBrokingSlipGenerationChangeSets } from "../../LocalizationConfigs/BrokingSlipGenerationChangeSetGenerator";
import { buildConfigV2 } from "../../ActivitiesConfigs/LocalizationConfigParser";
import { validateDateRange } from "@ui/ui-lib/utils/masterUserDataUtility";

export const fileUploadConfig: FormFieldConfig[] = [
  {
    key: "fileUpload",
    name: "fileUpload",
    type: "file",
    label: "RFP data Collection Document",
    gridColumn: 9,
  },
];

export const section4Config: FormFieldConfig[] = [
  {
    key: "documentType",
    name: "documentType",
    label: "Document type",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("DOCUMENT_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "fileUpload",
    name: "fileUpload",
    label: "File upload",
    type: "file",
    gridColumn: 6,
    componentProps: {
      fullWidth: true,
      customVariant: "primary",
    },
  },
];

export const section4DefaultValues = {
  documentType: "",
  fileUpload: "",
};

export const coverDetailsConfig: FormFieldConfig[] = [
  {
    key: "newBornBabyCover",
    name: "newBornBabyCover",
    label: "New Born baby Cover from day 1",
    type: "textarea",
    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return (
          plainText.length <= 1000 || "Text must be within 1000 characters."
        );
      },
      required: "This field is required",
    },
    componentProps: {
      fullWidth: true,
      placeholder: "",
      multiline: true,
      rows: 3,
    },
    gridColumn: 8,
  },
  {
    key: "bufferCoverLimit",
    name: "bufferCoverLimit",
    label: "Buffer cover limit",
    type: "textarea",
    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return (
          plainText.length <= 1000 || "Text must be within 1000 characters."
        );
      },
      required: "This field is required",
    },
    componentProps: {
      fullWidth: true,
      placeholder: "",
      multiline: true,
      rows: 3,
    },
    gridColumn: 8,
  },

  {
    key: "roomRentCap",
    name: "roomRentCap",
    label: "Room Rent Cap",
    type: "textarea",
    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return (
          plainText.length <= 1000 || "Text must be within 1000 characters."
        );
      },
      required: "This field is required",
    },
    componentProps: {
      fullWidth: true,
      placeholder: "",
      multiline: true,
      rows: 3,
    },
    gridColumn: 8,
  },

  {
    key: "perFamilyMaxSI",
    name: "perFamilyMaxSI",
    label: "Per family Max SI for corporate Buffer",
    type: "textarea",
    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return (
          plainText.length <= 1000 || "Text must be within 1000 characters."
        );
      },
      required: "This field is required",
    },
    componentProps: {
      fullWidth: true,
      placeholder: "",
      multiline: true,
      rows: 3,
    },
    gridColumn: 8,
  },
];

export const waiverConfig: FormFieldConfig[] = [
  {
    key: "waiverOfFirstYearExclusion",
    name: "waiverOfFirstYearExclusion",
    label: "Waiver of first year exclusion",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("MARTIAL_STATUS"),
    },
  },
  {
    key: "waiverOfPreexisting",
    name: "waiverOfPreexisting",
    label: "Waiver of Pre existing",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("MARTIAL_STATUS"),
    },
  },
];

export const brokingSlipGenerationConfig: FormFieldConfig[] = [
  {
    key: "sumInsured",
    name: "sumInsured",
    label: "Sum Insured",
    type: "number",
    isDecimal: true,
    formatNumber: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.NUMERIC,
        message: "Sum Insured must be a positive value",
      },
      required: "Sum Insured is required",
    },
  },
  {
    key: "brokeragePercentage",
    name: "brokeragePercentage",
    label: "Brokerage Percentage",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.NUMERIC,
        message: "Brokerage Percentage must be a positive value",
      },
      required: "Brokerage Percentage is required",
    },
  },
  {
    key: "from",
    name: "from",
    label: "From",
    type: "date",
    syncFieldName: "renewalDate",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "date",
    },
    rules: {
      required: "From date is required",
    },
  },
  {
    key: "to",
    name: "to",
    label: "To",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "date",
    },
  },
  {
    key: "renewalDate",
    name: "renewalDate",
    label: "Renewal Date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "date",
    },
    rules: {
      required: "Renewal date is required",
    },
  },
  {
    key: "timeineForQuoteReceipt",
    name: "timeineForQuoteReceipt",
    label: "Timeline for Quote Receipt",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "date",
    },
    rules: {
      required: "Timeline for Quote Receipt is required",
    },
  },
  {
    key: "businessActivitiesOfCompany",
    name: "businessActivitiesOfCompany",
    label: "Business Activities of Company",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      type: "text",
      multiline: true,
      rows: 3,
    },
    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return (
          plainText.length <= 1000 || "Text must be within 1000 characters."
        );
      },
    },
  },
];

export const brokingTabsConfig = [
  {
    key: "preferredInsurers",
    title: "Preferred Insurers",
    config: brokingSlipGenerationConfig,
    // isMultiple: true, // Allow multiple entries for preferred insurers
    defaultValues: {},
  },
  {
    key: "coversDetails",
    title: "Covers Details",
    config: coverDetailsConfig,
    defaultValues: {},
  },
];

export const insurerFields: FormFieldConfig[] = [
  {
    key: "insurerName",
    name: "insurerName",
    label: "Insurer Name",
    type: "select",
    gridColumn: 5,
    rules: {
      required: "Insurer Name is required",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "location",
    name: "location",
    label: "Location",
    type: "text",
    gridColumn: 5,
    rules: {
      required: "Location is required",
      maxLength: {
        value: 255,
        message: "Location is required",
      },
    },
    componentProps: {
      fullWidth: true,
      type: "text",
      multiple: true,
    },
  },
  {
    key: "branch",
    name: "branch",
    label: "Branch",
    type: "select",
    gridColumn: 5,
    rules: {
      required: "branch is required",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "contact",
    name: "contact",
    label: "Contact",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
];
export const addressFields: FormFieldConfig[] = [
  {
    key: "insurerName",
    name: "insurerName",
    label: "Insurer Name",
    type: "select",
    gridColumn: 5,
    rules: {
      required: "insurerName is required",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "location",
    name: "location",
    label: "Location",
    type: "text",
    gridColumn: 5,
    rules: {
      required: "Address Line 1 is required",
      maxLength: {
        value: 255,
        message: "Address Line 1",
      },
    },
    componentProps: {
      fullWidth: true,
      type: "text",
      multiple: true,
    },
  },
  {
    key: "branch",
    name: "branch",
    label: "Branch",
    type: "select",
    gridColumn: 5,
    rules: {
      required: "branch is required",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "contact",
    name: "contact",
    label: "Contact",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
];
export const tpaFields: FormFieldConfig[] = [
  {
    key: "tpaName",
    name: "tpaName",
    label: "TPA Name",
    type: "select",
    gridColumn: 5,
    rules: {
      required: "TPA name is required",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "location",
    name: "location",
    label: "Location",
    type: "text",
    gridColumn: 5,
    rules: {
      required: "Location is required",
      maxLength: {
        value: 255,
        message: "Location is required",
      },
    },
    componentProps: {
      fullWidth: true,
      type: "text",
      multiple: true,
    },
  },
  {
    key: "branch",
    name: "branch",
    label: "Branch",
    type: "select",
    gridColumn: 5,
    rules: {
      required: "Branch is required",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "contact",
    name: "contact",
    label: "Contact",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("ADDRESS_TYPE"),
    },
    componentProps: {
      fullWidth: true,
    },
  },
];

export const riskMitigationConfig: FormFieldConfig[] = [
  {
    key: "otherRiskMitigationFeatures",
    name: "otherRiskMitigationFeatures",
    label: "Other Risk Mitigation Features",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "",
      multiline: true,
      rows: 3,
    },
    rules: {
      validate: (value) => {
        return value.length <= 1000 || "Text must be within 1000 characters.";
      },
      required: "This field is required",
    },
  },
];

export const otherClausesConfig: FormFieldConfig[] = [
  {
    key: "otherClauses",
    name: "otherClauses",
    label: "Other Clauses",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "",
      multiline: true,
      rows: 3,
    },
    rules: {
      validate: (value) => {
        return value.length <= 1000 || "Text must be within 1000 characters.";
      },
      required: "This field is required",
    },
  },
];

export const insurerRemarksConfig: FormFieldConfig[] = [
  {
    key: "insurerRemarks",
    name: "insurerRemarks",
    label: "Insurer Remarks",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "",
      multiline: true,
      rows: 3,
    },
    rules: {
      validate: (value) => {
        return value.length <= 1000 || "Text must be within 1000 characters.";
      },
      required: "This field is required",
    },
  },
];

export const remarksConfig: FormFieldConfig[] = [
  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    type: "textarea",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "",
      multiline: true,
      rows: 3,
    },
    rules: {
      validate: (value) => {
        return value.length <= 1000 || "Text must be within 1000 characters.";
      },
      required: "This field is required",
    },
  },
];

export const versionsPrimaryConfig = (dynamicValues: any) => [
  {
    key: "versionDetails",
    config: [
      {
        key: "sumInsured",
        name: "sumInsured",
        label: "Sum insured",
        isDecimal: true,
        formatNumber: true,
        type: "number",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          required: "Sum insured is required",
        },
        activityOrder: 1,
      },
      {
        key: "basicPremium",
        name: "basicPremium",
        type: "number",
        isDecimal: true,
        label: "Basic premium",
        rules: {
          required: {
            value: true,
            message: "Basic premium is required",
          },
        },
        activityOrder: 2,
        gridColumn: 5,
        formatNumber: true,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "brokeragePercentage",
        name: "brokeragePercentage",
        label: "Brokerage percentage",
        type: "number",
        isDecimal: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        rules: {
          // pattern: {
          //   value: REGEX_PATTERNS.NUMERIC,
          //   message: "Brokerage Percentage must be a positive value",
          // },
          required: "Brokerage percentage is required",
          max: {
            value: 100,
            message: "Brokerage percentage cannot exceed 100%",
          },
          min: {
            value: 0,
            message: "Brokerage percentage must be a positive value",
          },
        },
        activityOrder: 3,
      },
      {
        key: "brokerageAmount",
        name: "brokerageAmount",
        type: "number",
        label: "Brokerage amount",
        rules: {
          required: {
            value: true,
            message: "Brokerage amount is required",
          },
        },
        gridColumn: 5,
        formatNumber: true,
        isDecimal: true,
        componentProps: {
          type: "number",
          fullWidth: true,
        },
        activityOrder: 4,
      },
      {
        key: "policyFrom",
        name: "policyFrom",
        label: "Policy from",
        type: "date",
        syncFieldName: "renewalDate",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "date",
        },
        rules: {
          required: "Policy from date is required",
        },
        activityOrder: 5,
      },
      {
        key: "policyTo",
        name: "policyTo",
        label: "Policy to",
        type: "date",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "date",
        },
        rules: {
          required: "Policy to date is required",
          validate: validateDateRange(
            "policyFrom",
            "policyTo",
            "Policy from",
            "Policy to"
          ),
        },
        activityOrder: 6,
      },
      {
        key: "renewalDate",
        name: "renewalDate",
        label: "Renewal Date",
        type: "date",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "date",
        },
        rules: {
          required: "Renewal date is required",
        },
        activityOrder: 7,
      },

      {
        key: "quoteReceiptTimeline",
        name: "quoteReceiptTimeline",
        label: "Timeline for Quote Receipt",
        type: "date",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "date",
        },
        rules: {
          required: "Timeline for Quote Receipt is required",
        },
        activityOrder: 8,
      },
      {
        name: "businessActivity",
        label: "Business Activities of Company",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "",
          multiline: true,
          rows: 3,
        },
        rules: {
          validate:
            "#(value) => { return (value.length <= 1000 || 'Business Activities of Company should not exceed 1000 characters.')}",
          required: "Business Activities of Company is required",
        },
        activityOrder: 9,
      },
    ],
    defaultValues: {
      sumInsured: dynamicValues?.sumInsured || 0,
    },
  },
  {
    key: "coversConfig",
    title: "Basic Covers",
    containerStyles: {
      backgroundColor: "#FAFAFA",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      padding: "16px",
      borderRadius: "8px",
      border: `1px solid #eaeaea`,
    },
    isCoversRequired: true,
    config: [],
  },
];

export const versionsPrimaryConfigLanka = (dynamicValues) => [
  {
    key: "versionDetails",
    config: [
      {
        key: "sumInsured",
        name: "sumInsured",
        label: "Sum Insured",
        isDecimal: true,
        formatNumber: true,
        type: "number",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          required: "Sum Insured is required",
        },
        activityOrder: 1,
      },
      {
        key: "basicPremium",
        name: "basicPremium",
        type: "number",
        isDecimal: true,
        label: "Basic premium",
        rules: {
          required: {
            value: true,
            message: "Basic premium is required",
          },
        },
        activityOrder: 2,
        gridColumn: 5,
        formatNumber: true,
        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "policyFrom",
        name: "policyFrom",
        label: "Policy from",
        type: "date",
        syncFieldName: "renewalDate",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "date",
        },
        rules: {
          required: "Policy from date is required",
        },
        activityOrder: 3,
      },
      {
        key: "policyTo",
        name: "policyTo",
        label: "Policy to",
        type: "date",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "date",
        },
        rules: {
          required: "Policy to date is required",
        },
        activityOrder: 4,
      },
      {
        key: "renewalDate",
        name: "renewalDate",
        label: "Renewal Date",
        type: "date",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "date",
        },
        rules: {
          required: "Renewal date is required",
        },
        activityOrder: 5,
      },

      {
        key: "quoteReceiptTimeline",
        name: "quoteReceiptTimeline",
        label: "Timeline for Quote Receipt",
        type: "date",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "date",
        },
        rules: {
          required: "Timeline for Quote Receipt is required",
        },
        activityOrder: 6,
      },
      {
        name: "businessActivity",
        label: "Business Activities of Company",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "",
          multiline: true,
          rows: 3,
        },
        rules: {
          validate:
            "#(value) => { return (value.length <= 1000 || 'Business Activities of Company should not exceed 1000 characters.')}",
          required: "Business Activities of Company is required",
        },
        activityOrder: 7,
      },
    ],
    defaultValues: {
      sumInsured: dynamicValues?.sumInsured || 0,
    },
  },
  {
    key: "coversConfig",
    title: "Basic Covers",
    containerStyles: {
      backgroundColor: "#FAFAFA",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      padding: "16px",
      borderRadius: "8px",
      border: `1px solid #eaeaea`,
    },
    isCoversRequired: true,
    config: [],
  },
];

// export const getBrokingSlipVersionConfigByCountry = (dynamicValues: any) =>
//   getCountrySpecificConfig(versionsPrimaryConfigLanka(dynamicValues), {
//     India: versionsPrimaryConfig(dynamicValues),
//   });
export const getBrokingSlipVersionConfigByCountry = (
  dynamicValues: any,
  organisationKey: string
) => {
  const configV1 = versionsPrimaryConfig(dynamicValues); // ensure this is defined

  const { removedFields, replacedFields, newlyAddedFields } =
    makeBrokingSlipGenerationChangeSets({ dynamicValues, organisationKey });

  const configs = buildConfigV2({
    configV1,
    replacedFields,
    newlyAddedFields,
    removedFields,
  });
  console.log("Broking Slip Configs:", configs);
  return configs;
};

export const getBrokingSlipGenerationActivityConfig = (
  companyId: string,
  opportunityId?: string,
  opportunityActivityId?: string
): FormFieldConfig[] => [
  {
    key: "preferredTPADetails",
    config: [
      {
        key: "tpaId",
        name: "tpaId",
        label: "TPA name",
        type: "select",
        gridColumn: 5,
        componentProps: { fullWidth: true },
        apiDependencies: {
          endPoint: "#endPoints.AllTpas",
          utilityFunction: "#tpaUtilityFunction",
          clearFieldsOnChange: ["locationId", "branchId", "contactId"],
        },
      },
      {
        key: "locationId",
        name: "locationId",
        label: "Location",
        type: "select",
        gridColumn: 5,
        componentProps: { fullWidth: true },
        apiDependencies: {
          endPoint: "#endPoints.tpaByID",
          utilityFunction: "#tpaLocationListUtilityFunction",
          dependentField: "tpaId",
          clearFieldsOnChange: ["branchId", "contactId"],
        },
      },
      {
        key: "branchId",
        name: "branchId",
        label: "Branch",
        type: "select",
        gridColumn: 5,
        componentProps: { fullWidth: true },
        apiDependencies: {
          endPoint: "#endPoints.tpaByID",
          utilityFunction: "#tpaLocationAddressUtilityFunction",
          dependentField: "tpaId",
          clearFieldsOnChange: ["contactId"],
          utilityDependent: "locationId",
        },
      },
      {
        key: "contactId",
        name: "contactId",
        label: "Contact",
        type: "select",
        gridColumn: 5,
        componentProps: { fullWidth: true },
        apiDependencies: {
          endPoint: "#endPoints.tpaContactList",
          dependentField: "tpaId",
          utilityFunction: "#tpaContactPersonUtilityFunction",
        },
      },
    ],
    title: "Preferred TPAs",
    isMultiple: true,
    defaultValues: [
      { tpaId: null, locationId: null, branchId: null, contactId: [] },
    ],
  },
  {
    key: "preferredInsurerDetails",
    config: [
      {
        key: "insurerId",
        name: "insurerId",
        label: "Insurer name",
        type: "selectFieldByApi",
        gridColumn: 5,
        componentProps: { fullWidth: true, preventDuplicateSelections: true },
        apiDependencies: {
          endPoint: "#endPoints.insurersList",
          utilityFunction: "#insurerListUtilityFunction",
          clearFieldsOnChange: [
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
          ],
          customParams: { searchBy: "firstName" },
        },
        rules: {
          required: "Insurer name is required",
        },
      },
      {
        key: "insurerLocationId",
        name: "insurerLocationId",
        label: "Location",
        type: "select",
        gridColumn: 5,
        componentProps: { fullWidth: true },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          utilityFunction: "#insurerLocationListUtilityFunction",
          dependentField: "insurerId",
          clearFieldsOnChange: ["insurerBranchId", "insurerContactId"],
        },
        rules: {
          required: "Location is required",
        },
      },
      {
        key: "insurerBranchId",
        name: "insurerBranchId",
        label: "Branch (BranchType-Code-Address1)",
        type: "select",
        gridColumn: 5,
        componentProps: { fullWidth: true },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          utilityFunction: "#insurerLocationAddressUtilityFunction",
          dependentField: "insurerId",
          clearFieldsOnChange: ["insurerContactId"],
          utilityDependent: "insurerLocationId",
        },
        rules: {
          required: "Branch is required",
        },
      },
      {
        key: "insurerContactId",
        name: "insurerContactId",
        label: "Contact",
        type: "select",
        gridColumn: 5,
        componentProps: { fullWidth: true },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerBranchContactUtilityFunction",
          utilityDependent: "insurerBranchId",
        },
        rules: {
          required: "Contact is required",
        },
      },
    ],
    title: "Preferred Insurers",
    isMultiple: true, // Allow multiple entries for excluded insurers
    defaultValues: [
      {
        insurerId: null,
        insurerContactId: null,
        insurerLocationId: null,
        insurerBranchId: null,
      },
    ],
  },
  {
    key: "others",
    config: [
      {
        name: "riskMitigationFeatures",
        key: "riskMitigationFeatures",
        label: "Other Risk Mitigation Features",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "",
          multiline: true,
          rows: 3,
        },
        rules: {
          required: "Other Risk Mitigation Features is required",
        },
      },
      {
        name: "clauses",
        key: "clauses",
        label: "Other Clauses",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "",
          multiline: true,
          rows: 3,
        },
        rules: {
          required: "Other clauses are required",
          validate:
            "#(value) => { return (value.length <= 1000 || 'Other clauses should not exceed 1000 characters.')}",
        },
      },
      {
        name: "insurerRemarks",
        label: "Insurer Remarks",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "",
          multiline: true,
          rows: 3,
        },
        rules: {
          required: "Insurer remarks are required",
          validate:
            "#(value) => { return (value.length <= 1000 || 'Insurer remarks should not exceed 1000 characters.')}",
        },
      },
      {
        name: "remarks",
        label: "Remarks",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "",
          multiline: true,
          rows: 3,
        },
        rules: {
          validate:
            "#(value) => { return (value.length <= 1000 || 'Remarks should not exceed 1000 characters.')}",
        },
      },
    ],
  },
  {
    key: "documents",
    config: [
      {
        key: "documents",
        name: "documents",
        type: "documentupload",
        label: "Documents",
        companyId: companyId,
        opportunityId,
        opportunityActivityId,
        gridColumn: 9,
        componentProps: { isDocumentTypeRequired: true, isDocumentRequired: true, fullWidth: true, companyType: "opportunity" },
      },
    ],
    defaultValues: [{ documentId: null, documentTypeLid: null }],
  },
];
