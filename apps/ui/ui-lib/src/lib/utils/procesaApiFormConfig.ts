type AnyObject = Record<string, any>;

import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { REGEX_PATTERNS } from "../constants/regex.js";
// import { ApiResponse } from "../pages/EmployeePage/EmployeeForm/types.js";
import { masterUserDataUtilityFunction } from "./masterUserDataUtility.js";
import currencyIcon from "../assets/svgs/currency.svg";
import addIcon from "../assets/svgs/add-icon.svg";
import refreshIcon from "../assets/svgs/refresh-icon.svg";
import compareIcon from "../assets/svgs/compare-logo.svg";
import dayjs from "dayjs";
import {
  DynamicObject,
  INSURER_CONTACT_PERSON_ERROR,
  TPA_CONTACT_PERSON_ERROR,
} from "../constants/index.js";
import { formConditions } from "../utils/formFieldsConditions.js";

export const icons = {
  currencyIcon,
  addIcon,
  refreshIcon,
  compareIcon,
};

const DEFERRED_EVALUATION_KEYS = [
  "showField",
  "showCondition",
  "showAddButton",
];

export const addressesUtilityFunction = (data: any) => {
  return data.data.map((item: { id: string; name: string }) => ({
    value: item.id,
    label: item.name,
  }));
};

const meetingUtilityFunction = (data: any) => {
  if (!data?.data || data.data.length === 0) {
    return [{ value: null, label: "No meetings available" }];
  }
  return data?.data?.map((item: any) => ({
    value: item?.id,
    label: item?.meetingAgenda,
  }));
};

const employeeReportingManagerUtilityFunction = (response: ApiResponse) => {
  const employees = response?.data?.data ?? [];
  return employees.map(({ employeeId, firstName }) => ({
    value: employeeId,
    label: firstName,
  }));
};

export const companyUtilityFunction = (data: any) => {
  return data.data.data.map((company: any) => ({
    value: company.id,
    label: company.displayName,
  }));
};

export const brokerUtilityFunction = (data: any) => {
  return data?.data?.data?.map((item: { id: string; brokerName: string }) => ({
    value: item.id,
    label: item.brokerName,
  }));
};

export const brokerLocationListUtilityFunction = (data: any) => {
  const seenCityIds = new Set<string>();
  return (
    data?.data?.brokerAddresses
      ?.filter((address: any) => {
        const cityId = address?.cityId?.id || null;
        if (!cityId || seenCityIds.has(cityId)) {
          return false;
        }
        seenCityIds.add(cityId);
        return true;
      })
      .map((address: any) => ({
        value: address?.cityId?.id || null, // Extract city ID
        label: address?.cityId?.name || "Unknown City", // Extract city name
      })) || []
  );
};

export const brokerLocationAddressUtilityFunction = (
  data: any,
  utilityDependent?: any
) => {
  const addresses = data?.data?.brokerAddresses;
  if (!Array.isArray(addresses)) return [];

  const shouldFilter = typeof utilityDependent === "number";

  const filteredAddresses = shouldFilter
    ? addresses.filter((addr) => addr?.cityId?.id === utilityDependent)
    : addresses;

  return filteredAddresses?.map((address: any) => ({
    value: address?.id || null, // Extract address ID
    label: address?.address1 || "Unknown Address", // Extract full address
  }));
};

export const tpaUtilityFunction = (data: any) => {
  return data?.data?.data?.map((item: { id: string; tpaName: string }) => ({
    value: item.id,
    label: item.tpaName,
  }));
};

const companyContactsUtilityFunction = (data: any) => {
  let companyData = data?.data?.data || [];

  return companyData?.map((contact: any) => ({
    value: contact.id,
    label: contact.firstName + " " + contact.lastName,
  }));
};

export const insurerUtilityFunction = (data: any) => {
  return data?.data?.data?.map((item: { id: string; insurerName: string }) => ({
    value: item.id,
    label: item.insurerName,
  }));
};

export const insurerListUtilityFunction = (data: any) => {
  return data?.data?.data?.map((item: { id: string; insurerName: string }) => ({
    value: item.id,
    label: item.insurerName,
  }));
};

export const prefferredInsurersListUtilityFunction = (data: any) => {
  const preferredList = Array.isArray(data?.data?.preferredInsurers?.data)
    ? data.data.preferredInsurers.data
    : Array.isArray(data?.preferredInsurers?.data)
    ? data.preferredInsurers.data
    : null;

  const insurerList = Array.isArray(data?.data?.data) ? data.data.data : null;

  const list = preferredList ?? insurerList ?? [];

  return list
    .map((item: any) => ({
      value: item?.insurerId ?? item?.id ?? null,
      label: item?.insurerName ?? item?.name ?? item?.displayName ?? "",
    }))
    .filter((option) => option.value !== null);
};

export const prefferredInsurersLocationsUtilityFunction = (data: any) => {
  const preferredList = Array.isArray(data?.data?.preferredInsurers?.data)
    ? data.data.preferredInsurers.data
    : Array.isArray(data?.preferredInsurers?.data)
    ? data.preferredInsurers.data
    : null;

  const insurerList = Array.isArray(data?.data?.data) ? data.data.data : null;

  const list = preferredList ?? insurerList ?? [];

  return list
    .map((item: any) => ({
      value: item?.insurerBranchId ?? item?.id ?? null,
      label: item?.insurerLocationName ?? item?.name ?? item?.displayName ?? "",
    }))
    .filter((option) => option.value !== null);
};

export const tpaContactPersonUtilityFunction = (data: any) => {
  return data?.data?.data?.map(
    (item: { id: string; firstName: string; lastName: string }) => ({
      value: item.id,
      label: item.firstName + " " + item.lastName,
    })
  );
};

export const insurerContactPersonUtilityFunction = (data: any) => {
  return data?.data?.data?.map(
    (item: { id: string; firstName: string; lastName: string }) => ({
      value: item.id,
      label: item.firstName + " " + item.lastName,
    })
  );
};

export const cityUtilityFunction = (data: any) => {
  return data?.data?.data?.map((item: { id: string; name: string }) => ({
    value: item.id,
    label: item.name,
  }));
};

export const contactsUtilityFunction = (data: any) => {
  return data?.data?.data?.map(
    (item: { id: string; firstName: string; lastName: string }) => ({
      value: item.id,
      label: item.firstName + " " + item.lastName,
    })
  );
};

export const locationUtilityFunction = (data: any) => {
  return data?.data?.data?.map((item: { id: string; name: string }) => ({
    value: item.id,
    label: item.name,
  }));
};

export const insurerLocationListUtilityFunction = (data: any) => {
  const seenCityIds = new Set<string>();
  return (
    data?.data?.insurerAddresses
      ?.filter((address: any) => {
        const cityId = address?.cityId?.id || null;
        if (!cityId || seenCityIds.has(cityId)) {
          return false;
        }
        seenCityIds.add(cityId);
        return true;
      })
      .map((address: any) => ({
        value: address?.cityId?.id || null, // Extract city ID
        label: address?.cityId?.name || "Unknown City", // Extract city name
      })) || []
  );
};

export const insurerLocationAddressUtilityFunction = (
  data: any,
  utilityDependent: any
) => {
  const addresses = data?.data?.insurerAddresses;
  if (!Array.isArray(addresses)) return [];

  const shouldFilter = typeof utilityDependent === "number";
  const filteredAddresses = shouldFilter
    ? addresses.filter((addr) => addr?.cityId?.id === utilityDependent)
    : addresses;

  return filteredAddresses?.map((address: any) => ({
    value: address?.id || null, // Extract address ID
    // Display as branchType-branchCode-address1 (same combination as the
    // parent branch dropdown in new branch creation). branchType is a lookup
    // object on the insurer-by-id response; use the short key (e.g. "HQ"),
    // not lookUpValue (e.g. "HQ - Head Quarters").
    label:
      `${address?.branchType?.lookUpValueKey ?? ""}-${
        address?.branchCode ?? ""
      }-${address?.address1 ?? ""}` || "Unknown Address",
  }));
};

// Returns the single contact linked to the selected branch (address) via the
// insurer_address.contact_id column. utilityDependent is the chosen
// insurerBranchId (= the address id). Mirrors the branch dropdown's pattern of
// reading the insurer-by-id response and filtering by the dependent field.
export const insurerBranchContactUtilityFunction = (
  data: any,
  utilityDependent: any
) => {
  const addresses = data?.data?.insurerAddresses;
  if (!Array.isArray(addresses)) return [];

  const match =
    typeof utilityDependent === "number"
      ? addresses.find((addr) => addr?.id === utilityDependent)
      : null;

  const contact = match?.contactDetails;
  if (!contact?.id) return [];

  const label =
    (contact.displayName && contact.displayName.trim()) ||
    [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() ||
    "Unknown Contact";

  return [{ value: contact.id, label }];
};

export const tpaLocationListUtilityFunction = (data: any) => {
  const seenCityIds = new Set<string>();
  return (
    data?.data?.tpaAddresses
      ?.filter((address: any) => {
        const cityId = address?.cityId?.id || null;
        if (!cityId || seenCityIds.has(cityId)) {
          return false;
        }
        seenCityIds.add(cityId);
        return true;
      })
      .map((address: any) => ({
        value: address?.cityId?.id || null, // Extract city ID
        label: address?.cityId?.name || "Unknown City", // Extract city name
      })) || []
  );
};

export const tpaLocationAddressUtilityFunction = (
  data: any,
  utilityDependent: any
) => {
  const addresses = data?.data?.tpaAddresses;
  if (!Array.isArray(addresses)) return [];

  const shouldFilter = typeof utilityDependent === "number";

  const filteredAddresses = shouldFilter
    ? addresses.filter((addr) => addr?.cityId?.id === utilityDependent)
    : addresses;

  return filteredAddresses?.map((address: any) => ({
    value: address?.id || null, // Extract address ID
    label: address?.address1 || "Unknown Address", // Extract full address
  }));
};

export const usersListUtilityFunction = (data: any) => {
  return data?.data?.data?.map((item: any) => ({
    value: item.userId,
    label: `${item.firstName}, ${item?.branch?.name ?? ""}`,
  }));
};

export const cdDetailsUtilityFunction = (data: any) => {
  return data?.data?.data?.map((item: any) => ({
    value: item.id,
    label: item.cdAccountNumber,
  }));
};

export const contactsByOpportunityIdUtilityFunction = (data: any) => {
  return data?.data?.map((item: any) => ({
    value: item.id,
    label: item.firstName + " " + item.lastName,
  }));
};

export const validateRequiredIfEqual = (
  fieldKey: string,
  expectedValue: string | number,
  errorMessage: string
) => {
  return (value: any, formValues: Record<string, any>) => {
    if (formValues[fieldKey] !== expectedValue) {
      return true; // Skip validation if the condition isn't met
    }

    if (!value) {
      return errorMessage;
    }

    return true;
  };
};

export const versionUtilityFunction = (data: any) => {
  return data?.data?.map((item: any) => ({
    value: item.id,
    label: item.name,
  }));
};

export const quoteUtilityFunction = (data: any) => {
  return data?.data?.quotes?.map((quote: any) => ({
    value: quote.id,
    label: quote.insurerName,
  }));
};

// Validation for TPA Contact Person
export const validateTpaContactPerson = (value: any, formValues: any) => {
  if (formValues.tpaId) {
    if (value && Array.isArray(value) && value.length > 0) {
      return true;
    }
    return TPA_CONTACT_PERSON_ERROR;
  }
  return true;
};

// Validation for Insurer Contact Person
export const validateInsurerContactPerson = (value: any, formValues: any) => {
  if (formValues.insurerId) {
    if (value && Array.isArray(value) && value.length > 0) {
      return true;
    }
    return INSURER_CONTACT_PERSON_ERROR;
  }
  return true;
};

export const validateMaxLength = (
  maxLength: number = 1000,
  message: string = `This field should not exceed ${maxLength} characters.`
) => {
  // This is the actual validation function that React Hook Form will call
  return (value: string | undefined | null) => {
    // Treat empty/null/undefined as valid if not explicitly required by another rule
    if (value === undefined || value === null || value === "") {
      return true;
    }
    if (typeof value === "string" && value.length <= maxLength) {
      return true; // Valid length
    }
    return message; // Return the configurable error message
  };
};

export const getPastDayjsDate = (days: number) => {
  // Returns a dayjs object representing the date 'days' days ago
  return dayjs().subtract(days, "day");
};

export const getLocationOptionsByEntityName = (data: DynamicObject) => {
  return data?.data?.data.map((address: any) => ({
    value: address.id,
    label: address.city,
  }));
};

const baseContext = {
  endPoints,
  REGEX_PATTERNS,
  companyUtilityFunction,
  tpaUtilityFunction,
  insurerUtilityFunction,
  tpaContactPersonUtilityFunction,
  insurerContactPersonUtilityFunction,
  masterUserDataUtilityFunction,
  addressesUtilityFunction,
  companyContactsUtilityFunction,
  employeeReportingManagerUtilityFunction,
  meetingUtilityFunction,
  icons,
  cityUtilityFunction,
  contactsUtilityFunction,
  insurerLocationListUtilityFunction,
  insurerLocationAddressUtilityFunction,
  insurerBranchContactUtilityFunction,
  tpaLocationListUtilityFunction,
  tpaLocationAddressUtilityFunction,
  usersListUtilityFunction,
  contactsByOpportunityIdUtilityFunction,
  validateRequiredIfEqual,
  versionUtilityFunction,
  quoteUtilityFunction,
  validateTpaContactPerson,
  validateInsurerContactPerson,
  insurerListUtilityFunction,
  dayjs,
  validateMaxLength,
  getPastDayjsDate,
  cdDetailsUtilityFunction,
  brokerUtilityFunction,
  getLocationOptionsByEntityName,
  ...formConditions,
};

const interpolateTemplate = (str: string, context: AnyObject) => {
  return str.replace(/\${(.*?)}/g, (_, expr) => {
    try {
      const fn = new Function(...Object.keys(context), `return ${expr}`);
      return fn(...Object.values(context));
    } catch (err) {
      console.warn("Interpolation failed for:", expr, err);
      return "";
    }
  });
};

// Utility function to handle immediate interpolation
const handleImmediateInterpolation = (
  key: string,
  expression: string,
  dependentFields: AnyObject
) => {
  try {
    const interpolatedExpression = interpolateTemplate(
      expression,
      dependentFields
    );
    const scopedEval = new Function(
      "context",
      `with (context) { return (${interpolatedExpression}) }`
    );
    return scopedEval({
      ...baseContext,
      ...dependentFields,
    });
  } catch (error) {
    console.warn(
      'Failed to parse expression for key "%s":',
      key,
      expression,
      error
    );
    return `#${expression}`; // Fallback to raw string
  }
};

// Utility function to handle deferred evaluation
const handleDeferredEvaluation = (
  key: string,
  expression: string,
  dependentFields: AnyObject
) => {
  try {
    // Check if the expression is a direct function name from formConditions
    if (expression in formConditions) {
      return (formWatch?: (path: string) => any, formValues?: AnyObject) => {
        return formConditions[expression as keyof typeof formConditions](
          formWatch,
          {
            ...baseContext,
            ...dependentFields,
            formValues,
          }
        );
      };
    }
    return handleImmediateInterpolation(key, expression, dependentFields); // For other expressions, evaluate immediately
  } catch (error) {
    console.warn(
      'Failed to create deferred evaluation function for key "%s" with expression "%s":',
      key,
      expression,
      error
    );
    return false; // Default to false/disabled if there's an error
  }
};

export function parseApiConfigToLocalFormConfig(
  obj: AnyObject,
  dependentFields: AnyObject = {}
): AnyObject {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      parseApiConfigToLocalFormConfig(item, dependentFields)
    );
  }

  if (typeof obj === "object" && obj !== null) {
    const result: AnyObject = {};

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      // Recursively handle 'config' arrays
      if (key === "config" && Array.isArray(value)) {
        result[key] = value.map((item) =>
          parseApiConfigToLocalFormConfig(item, dependentFields)
        );
        continue;
      }

      if (typeof value === "string" && value.startsWith("#")) {
        const expression = value.slice(1).trim();

        // These are the keys that need to return a FUNCTION for deferred evaluation

        if (DEFERRED_EVALUATION_KEYS.includes(key)) {
          result[key] = handleDeferredEvaluation(
            key,
            expression,
            dependentFields
          );
        } else {
          // For all other keys starting with '#': (e.g., apiDependencies.endPoint, defaultValues using dayjs)
          // Interpolate and evaluate immediately during config parsing.
          result[key] = handleImmediateInterpolation(
            key,
            expression,
            dependentFields
          );
        }
      } else if (typeof value === "object") {
        result[key] = parseApiConfigToLocalFormConfig(value, dependentFields);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return obj;
}

//reset to default state
export const normalizeUsingConfigForResetting = (config: AnyObject) => {
  const emptyResetData = {};

  // Fill it with each group's key from quoteVersionConfig
  config.forEach((group: any) => {
    if (group.isMultiple) {
      emptyResetData[group.key] = [{}]; // for arrays
    } else {
      emptyResetData[group.key] = {}; // for single sections
    }
  });

  return emptyResetData;
};
