import {
  FormFieldConfig,
  REGEX_PATTERNS,
  addressesUtilityFunction,
  apiRequest,
  endPoints,
  getTextFromHtml,
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors,
} from "@ui/ui-lib";
import {
  ADD_INSURER,
  BROKER_TYPE,
  EDIT_INSURER,
  INSURER_TYPE,
  RICH_TEXT_LIMIT,
  RICH_TEXT_LIMIT_ERROR,
  TPA_TYPE,
} from "../../../constants";
import websiteIcon from "../../../assets/svgs/Website.svg";

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}

function stringSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const maxLen = Math.max(s1.length, s2.length);
  return (maxLen - levenshtein(s1, s2)) / maxLen;
}

const SIMILARITY_THRESHOLD = 0.8;

export interface IAddress {
  id?: number;
  addressTypeLid: number | string;
  address1: string;
  address2?: string;
  area?: string;
  countryId: number | string;
  stateId: number | string;
  cityId: number | string;
  pinCode: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  supportNumber?: string;
  email?: string;
}

export const ENTITY_CONFIG_MAP: Record<
  string,
  {
    label: string;
    editLabel: string;
    endpoint: {
      getById: (id: number) => string;
      all: string;
    };
    addressKey: string;
    isLifeKey: string;
  }
> = {
  insurer: {
    label: ADD_INSURER,
    editLabel: EDIT_INSURER,
    endpoint: {
      getById: endPoints.insurerById,
      all: endPoints.allInsurers,
    },
    addressKey: "insurerAddresses",
    isLifeKey: "isLife",
  },
  tpa: {
    label: "Add TPA",
    editLabel: "Edit TPA",
    endpoint: {
      getById: endPoints.tpaByID,
      all: endPoints.AllTpas,
    },
    addressKey: "tpaAddresses",
    isLifeKey: "isLife",
  },
  broker: {
    label: "Add broker",
    editLabel: "Edit broker",
    endpoint: {
      getById: endPoints.brokerByID,
      all: endPoints.allBrokers,
    },
    addressKey: "brokerAddresses",
    isLifeKey: "isLife",
  },
};
export const getFormFields = (
  entityType: string,
  userData: any,
  isEditMode = false
): FormFieldConfig[] => {
  switch (entityType) {
    case INSURER_TYPE:
      return [
        {
          key: "insurerName",
          name: "insurerName",
          label: "Insurer name",
          type: "text",
          rules: {
            required: { value: true, message: "Insurer name is required" },
            maxLength: {
              value: 200,
              message: textErrorMessage("Insurer Name", 200),
            },
            validate: isEditMode
              ? undefined
              : async (value: string) => {
                  if (!value?.trim()) return true;
                  try {
                    const searchParam = encodeURIComponent(value.trim());
                    const res = await apiRequest(`${endPoints.insurerSelectList}?search=${searchParam}&page=1&limit=10`, { method: "GET" });
                    const insurers: { id: number; insurerName: string }[] = Array.isArray(res?.data?.data)
                      ? res.data.data
                      : [];
                    const match = insurers.find(
                      (i) => stringSimilarity(value, i.insurerName) >= SIMILARITY_THRESHOLD
                    );
                    if (match) return `Insurer "${match.insurerName}" already exists`;
                  } catch {
                    // silently skip on network error — backend will catch exact duplicates
                  }
                  return true;
                },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter insurer name",
            disabled: isEditMode,
          },
        },
        {
          key: "displayName",
          name: "displayName",
          label: "Display name",
          type: "text",
          rules: {
            required: { value: true, message: "Display name is required" },
            maxLength: {
              value: 100,
              message: textErrorMessage("Display name", 100),
            },
          },
          inputDependentField: ["insurerName"],
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter display name",
          },
        },
        {
          key: "isLifeLid",
          name: "isLifeLid",
          label: "Insurance company type",
          type: "select",
          apiDependencies: {
            endPoint: endPoints.lookUpByName("INSURANCE_TYPE"),
          },
          rules: {
            required: {
              value: true,
              message: "Insurance company type is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select option",
          },
        },
        {
          key: "companyTypeLid",
          name: "companyTypeLid",
          label: "Type of company",
          type: "select",
          apiDependencies: {
            endPoint: endPoints.lookUpByName("INSURANCE_COMPANY_TYPE"),
          },
          rules: {
            required: { value: true, message: "Type of company is required" },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select type of company",
          },
        },
        {
          key: "companyTagLid",
          name: "companyTagLid",
          label: "Company tag",
          type: "select",
          apiDependencies: {
            endPoint: endPoints.lookUpByName("COMPANY_TAG"),
          },
          rules: {
            required: { value: true, message: "Company tag is required" },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            disabled: true,
          },
        },
        {
          key: "countryId",
          name: "countryId",
          label: "Country",
          type: "select",
          gridColumn: 5,
          rules: {
            required: {
              value: true,
              message: requiredErrorMessage("Country"),
            },
          },
          componentProps: {
            fullWidth: true,
            disabled: !!userData?.country?.id,
          },
          apiDependencies: {
            endPoint: endPoints.countriesList,
            clearFieldsOnChange: ["stateId", "cityId"],
            utilityFunction: (data) => addressesUtilityFunction(data),
          },
        },
        {
          key: "insureCode",
          name: "insureCode",
          label: "Insurer Code",
          type: "text",
          rules: {
            maxLength: {
              value: 100,
              message: textErrorMessage("Insurer Code", 100),
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter insurer code",
            type: "url",
          },
        },
        {
          key: "website",
          name: "website",
          label: "Website",
          type: "text",
          rules: {
            pattern: {
              value: REGEX_PATTERNS.URL,
              message: ValidationErrors.URL,
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter website URL",
            type: "url",
            leftIconUrl: websiteIcon,
          },
        },
        {
          key: "remarks",
          name: "remarks",
          label: "Remarks",
          type: "richtext",
          gridColumn: 9,
          componentProps: {
            showCharCountLimit: RICH_TEXT_LIMIT,
          },
          rules: {
            validate: (value) => {
              const plainText = getTextFromHtml(value || "");
              return (
                plainText.length <= RICH_TEXT_LIMIT || RICH_TEXT_LIMIT_ERROR
              );
            },
          },
        },
      ];
    case TPA_TYPE:
      return [
        {
          key: "tpaName",
          name: "tpaName",
          label: "TPA name",
          type: "text",
          rules: {
            required: { value: true, message: "TPA name is required" },
            maxLength: {
              value: 200,
              message: textErrorMessage("TPA name", 200),
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter TPA name",
            disabled: isEditMode,
          },
        },
        {
          key: "displayName",
          name: "displayName",
          label: "Display name",
          type: "text",
          rules: {
            required: { value: true, message: "Display name is required" },
            maxLength: {
              value: 100,
              message: textErrorMessage("Display name", 100),
            },
          },
          gridColumn: 5,
          inputDependentField: ["tpaName"],
          componentProps: {
            fullWidth: true,
            placeholder: "Enter display name",
          },
        },
        {
          key: "companyTypeLid",
          name: "companyTypeLid",
          label: "Type of company",
          type: "select",
          apiDependencies: {
            endPoint: endPoints.lookUpByName("COMPANY_TYPE"),
          },
          rules: {
            required: { value: true, message: "Type of company is required" },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select type of company",
          },
        },
        {
          key: "countryId",
          name: "countryId",
          label: "Country",
          type: "select",
          gridColumn: 5,
          rules: {
            required: {
              value: true,
              message: requiredErrorMessage("Country"),
            },
          },
          componentProps: {
            fullWidth: true,
            disabled: !!userData?.country?.id,
          },
          apiDependencies: {
            endPoint: endPoints.countriesList,
            clearFieldsOnChange: ["stateId", "cityId"],
            utilityFunction: (data) => addressesUtilityFunction(data),
          },
        },
        {
          key: "website",
          name: "website",
          label: "Website",
          type: "text",
          rules: {
            pattern: {
              value: REGEX_PATTERNS.URL,
              message: ValidationErrors.URL,
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter website URL",
            type: "url",
            leftIconUrl: websiteIcon,
          },
        },
        {
          key: "remarks",
          name: "remarks",
          label: "Remarks",
          type: "richtext",
          gridColumn: 9,
          rules: {
            validate: (value) => {
              const plainText = getTextFromHtml(value || "");
              return (
                plainText.length <= RICH_TEXT_LIMIT || RICH_TEXT_LIMIT_ERROR
              );
            },
          },
          componentProps: {
            showCharCountLimit: RICH_TEXT_LIMIT,
          },
        },
      ];
    case BROKER_TYPE:
      return [
        {
          key: "brokerName",
          name: "brokerName",
          label: "Broker name",
          type: "text",
          rules: {
            required: { value: true, message: "Broker name is required" },
            maxLength: {
              value: 200,
              message: textErrorMessage("Broker name", 200),
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter broker name",
            disabled: isEditMode,
          },
        },
        {
          key: "displayName",
          name: "displayName",
          label: "Display name",
          type: "text",
          rules: {
            required: { value: true, message: "Display name is required" },
            maxLength: {
              value: 100,
              message: textErrorMessage("Display name", 100),
            },
          },
          inputDependentField: ["brokerName"],
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter display name",
          },
        },
        {
          key: "companyTypeLid",
          name: "companyTypeLid",
          label: "Type of company",
          type: "select",
          apiDependencies: {
            endPoint: endPoints.lookUpByName("COMPANY_TYPE"),
          },
          rules: {
            required: { value: true, message: "Type of company is required" },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Select type of company",
          },
        },
        {
          key: "countryId",
          name: "countryId",
          label: "Country",
          type: "select",
          gridColumn: 5,
          rules: {
            required: {
              value: true,
              message: requiredErrorMessage("Country"),
            },
          },
          componentProps: {
            fullWidth: true,
            disabled: !!userData?.country?.id,
          },
          apiDependencies: {
            endPoint: endPoints.countriesList,
            clearFieldsOnChange: ["stateId", "cityId"],
            utilityFunction: (data) => addressesUtilityFunction(data),
          },
        },
        {
          key: "website",
          name: "website",
          label: "Website",
          type: "text",
          rules: {
            pattern: {
              value: REGEX_PATTERNS.URL,
              message: ValidationErrors.URL,
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            placeholder: "Enter website URL",
            type: "url",
            leftIconUrl: websiteIcon,
          },
        },
        {
          key: "remarks",
          name: "remarks",
          label: "Remarks",
          type: "richtext",
          gridColumn: 9,
          rules: {
            validate: (value) => {
              const plainText = getTextFromHtml(value || "");
              return (
                plainText.length <= RICH_TEXT_LIMIT || RICH_TEXT_LIMIT_ERROR
              );
            },
          },
          componentProps: {
            showCharCountLimit: RICH_TEXT_LIMIT,
          },
        },
      ];
    default:
      return [];
  }
};

export const getDefaultValues = (
  entityType: string,
  userData: any,
  companyTagCompanyId?: number
) => {
  switch (entityType) {
    case INSURER_TYPE:
      return {
        insurerName: "",
        displayName: "",
        companyTypeLid: "",
        website: "",
        isLifeLid: "",
        companyTagLid: companyTagCompanyId || "",
        countryId: userData?.country?.id || "",
        insureCode: "",
        remarks: "",
      };
    case TPA_TYPE:
      return {
        tpaName: "",
        displayName: "",
        companyTypeLid: "",
        countryId: userData?.country?.id || "",
        website: "",
        remarks: "",
      };
    case BROKER_TYPE:
      return {
        brokerName: "",
        displayName: "",
        companyTypeLid: "",
        countryId: userData?.country?.id || "",
        website: "",
        remarks: "",
      };
    default:
      return {};
  }
};

export const insurerBreadcrumbs = (isEditMode: boolean) => [
  { label: "Manage insurer", path: "/insurer" },
  { label: isEditMode ? "Edit insurer details" : "Add insurer details" },
];

export const tpaBreadcrumbs = (isEditMode: boolean) => [
  { label: "Manage TPA", path: "/tpa" },
  { label: isEditMode ? "Edit TPA details" : "Add TPA details" },
];

export const brokerBreadcrumbs = (isEditMode: boolean) => [
  { label: "Manage broker", path: "/broker" },
  { label: isEditMode ? "Edit broker details" : "Add broker details" },
];

