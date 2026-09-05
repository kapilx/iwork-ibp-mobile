import {
  EMAIL_OPTION,
  PHONE_OPTION,
  RICH_TEXT_LIMIT,
  RICH_TEXT_LIMIT_ERROR,
} from "../../../constants";
import { LookUpValues } from "../../../constants/lookupValues";
import {
  endPoints,
  FormFieldConfig,
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors,
  REGEX_PATTERNS,
  DynamicObject,
  masterDataUtilityFunction,
  getTextFromHtml,
  addressesUtilityFunction,
  companyUtilityFunction,
} from "@ui/ui-lib";
import {
  Address,
  Company,
  Contact,
  Data,
  IAddress,
  IContactFieldData,
} from "./types";

// Gets unique cities from address data
const getLocationOptionsByEntity = (
  data: Data,
  entityType?: "insurer" | "broker" | "tpa"
): { value: number; label: string }[] => {
  if (!entityType) return [];

  const addressKey =
    entityType === "insurer"
      ? "insurerAddresses"
      : entityType === "broker"
      ? "brokerAddresses"
      : "tpaAddresses";

  const addresses = data?.data?.[addressKey];
  if (!Array.isArray(addresses)) return [];

  const cityMap = new Map();
  addresses.forEach((address: Address) => {
    if (address.city?.id && !cityMap.has(address.city.id)) {
      cityMap.set(address.city.id, address);
    }
  });

  return Array.from(cityMap.values()).map((address: Address) => ({
    value: address.city.id,
    label: address.city.name,
  }));
};

const reportingToUtilityFunction = (data: DynamicObject) => {
  return data.data.contacts.map((contact: Contact) => ({
    value: contact.id,
    label: contact.displayName,
  }));
};

// Gets branches based on city selection
const getBranchOptionsByEntity = (
  data: Data,
  cityId?: number,
  entityType?: "insurer" | "broker" | "tpa"
): { value: number; label: string }[] => {
  if (!entityType || cityId === undefined) return [];

  const addressKey =
    entityType === "insurer"
      ? "insurerAddresses"
      : entityType === "broker"
      ? "brokerAddresses"
      : "tpaAddresses";

  const addresses = data?.data?.[addressKey];
  if (!Array.isArray(addresses)) return [];

  const filtered = addresses.filter(
    (address: Address) => address.city?.id === cityId
  );

  return filtered.map((address: Address) => ({
    value: address.id,
    label: address.address1,
  }));
};

// Wrapper functions to provide correctly typed utilityFunction for config
const getLocationUtilityFunctionFor = (
  entityType: "insurer" | "broker" | "tpa"
) => {
  return (data: Data) => getLocationOptionsByEntity(data, entityType);
};

const getBranchUtilityFunctionFor = (
  entityType: "insurer" | "broker" | "tpa"
) => {
  return (data: Data, cityId?: number) =>
    getBranchOptionsByEntity(data, cityId, entityType);
};

export const getContactFieldsByRecordTypeId = (
  contactRecordTypeLid: number | undefined,
  resolvedLookupIds: Record<string, number>
): FormFieldConfig[] => {
  if (!contactRecordTypeLid) return [];

  switch (contactRecordTypeLid) {
    case resolvedLookupIds[LookUpValues.INSURER_CONTACT]:
      return insurerContactInfoConfig;
    case resolvedLookupIds[LookUpValues.TPA_CONTACT]:
      return tpaContactInfoConfig;
    case resolvedLookupIds[LookUpValues.BROKER_CONTACT]:
      return brokerContactInfoConfig;
    default:
      return [];
  }
};

export const getDefaultContactFieldDataByRecordTypeId = (
  contactRecordTypeLid: number | undefined,
  resolvedLookupIds: Record<string, number>
): IContactFieldData => {
  const defaultData: IContactFieldData = {
    salutationLid: "",
    firstName: "",
    middleName: "",
    lastName: "",
    displayName: "",
    companyId: "",
    companyLocationId: "",
    companyBranchId: "",
    tagLid: "",
    contactTypeLid: "",
    department: "",
    designation: "",
    remarks: "",
  };

  switch (contactRecordTypeLid) {
    case resolvedLookupIds[LookUpValues.INSURER_CONTACT]:
    case resolvedLookupIds[LookUpValues.TPA_CONTACT]:
    case resolvedLookupIds[LookUpValues.BROKER_CONTACT]:
      return defaultData;
    default:
      return defaultData;
  }
};

/**
 * Utility function to generate conditional validation rules for address fields.
 * If `mandatory` is true, field is required.
 * If `mandatory` is false, field is required only if any address field in the row is filled.
 */
const getAddressFieldRules = (
  fieldKey: string,
  label: string,
  mandatory: boolean,
  index?: number
) => {
  const requiredFields = [
    "address1",
    "countryId",
    "stateId",
    "cityId",
    "pinCode",
    "phoneNumber",
  ];

  // If field is in required list, use dynamic validation only
  if (requiredFields.includes(fieldKey)) {
    return {
      validate: (value: any, formValues: any) => {
        const row = formValues?.retArray?.[index ?? 0] || formValues;
        const hasAddress1 = !!row?.address1 && row.address1.trim() !== "";

        // If address1 has value, make these fields required
        if (hasAddress1 && !value) {
          return `${label} is required`;
        }
        return true;
      },
    };
  }

  // For other fields, no validation needed
  return {};
};


export const addressFields = (
  mandatory = false,
  countryId: number,
  index: number,
  formValues: any
): FormFieldConfig[] => {
  // Check if address1 has value for this specific row
  const hasAddress1 = !!formValues?.retArray?.[index]?.address1 &&
    formValues?.retArray?.[index]?.address1.trim() !== "";

  return [
    {
      key: "addressTypeLid",
      name: "addressTypeLid",
      label: "Address type",
      type: "select",
      gridColumn: 5,
      rules: getAddressFieldRules("addressTypeLid", "Address type", mandatory),
      apiDependencies: {
        endPoint: endPoints.lookUpByName("AGENT_ADDRESS_TYPE"),
      },
      componentProps: {
        fullWidth: true,
        disabled: true,
      },
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
      label: hasAddress1 ? "Country*" : "Country",
      type: "select",
      gridColumn: 5,
      rules: getAddressFieldRules("countryId", "Country", mandatory, index),
      componentProps: { fullWidth: true, disabled: !!countryId },
      apiDependencies: {
        endPoint: endPoints.countriesList,
        clearFieldsOnChange: ["stateId", "cityId"],
        utilityFunction: (data) => addressesUtilityFunction(data),
      },
    },
    {
      key: "stateId",
      name: "stateId",
      label: hasAddress1 ? "State*" : "State",
      type: "select",
      gridColumn: 5,
      rules: getAddressFieldRules("stateId", "State", mandatory, index),
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
      label: hasAddress1 ? "City*" : "City",
      type: "select",
      gridColumn: 5,
      rules: getAddressFieldRules("cityId", "City", mandatory, index),
      apiDependencies: {
        endPoint: endPoints.cityListById,
        dependentField: "stateId",
        utilityFunction: (data) => addressesUtilityFunction(data),
      },
    },
    {
      key: "pinCode",
      name: "pinCode",
      label: hasAddress1 ? "Pin code*" : "Pin code",
      type: "text",
      gridColumn: 5,
      rules: {
        ...getAddressFieldRules("pinCode", "Pin code", mandatory, index),
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
      label: hasAddress1 ? "Phone number*" : "Phone number",
      type: "text",
      gridColumn: 5,
      rules: {
        ...getAddressFieldRules("phoneNumber", "Phone number", mandatory, index),
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
};

const insurerContactInfoConfig: FormFieldConfig[] = [
  {
    key: "salutationLid",
    name: "salutationLid",
    label: "Salutation",
    type: "select",
    apiDependencies: {
      endPoint: endPoints.lookUpByName("SALUTATION"),
    },
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "firstName",
    name: "firstName",
    label: "First name",
    type: "text",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("First Name"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("First Name", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("First Name");
        }
        return true;
      },
    },
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    dependentFieldsOnBlur: "displayName",
  },
  {
    key: "middleName",
    name: "middleName",
    label: "Middle name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Middle Name", 100),
      },
      validate: (value: string) => {
        if (value && value.trim() === "") {
          return "Middle name cannot contain only spaces";
        }
        return true;
      },
    },
  },
  {
    key: "lastName",
    name: "lastName",
    label: "Last name",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Last Name"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Last Name", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Last Name");
        }
        return true;
      },
    },
    componentProps: {
      fullWidth: true,
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
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Display Name", 100),
      },
    },
    inputDependentField: ["firstName", "lastName"],
  },
  {
    key: "companyId",
    name: "companyId",
    label: "Company name",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.insurersList,
      clearFieldsOnChange: ["companyLocationId", "companyBranchId"],
      utilityFunction: companyUtilityFunction,
      customParams: { searchBy: "firstName" },
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company"),
      },
    },
  },

  {
    key: "department",
    name: "department",
    label: "Department",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Department"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Department", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Department");
        }
        return true;
      },
    },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_department"),
      utilityFunction: masterDataUtilityFunction,
    },
  },
  {
    key: "designation",
    name: "designation",
    label: "Designation",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Designation"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Designation", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Designation");
        }
        return true;
      },
    },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_designation"),
      utilityFunction: masterDataUtilityFunction,
    },
  },

  {
    key: "companyLocationId",
    name: "companyLocationId",
    label: "Company location",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.insurerDetailsById,
      showCondition: (watch) => !!watch("companyId"),
      clearFieldsOnChange: ["companyBranchId"],
      dependentField: "companyId",
      utilityFunction: getLocationUtilityFunctionFor("insurer"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company Location"),
      },
    },
  },
  {
    key: "companyBranchId",
    name: "companyBranchId",
    label: "Company branch",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.insurerDetailsById,
      showCondition: (watch) => !!watch("companyLocationId"),
      dependentField: "companyId",
      utilityFunction: getBranchUtilityFunctionFor("insurer"),
      utilityDependent: "companyLocationId",
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company branch"),
      },
    },
  },
  {
    key: "tagLid",
    name: "tagLid",
    label: "Tag",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("AGENT_CONTACT_TAG"),
    },
    // rules: {
    //   required: {
    //     value: true,
    //     message: requiredErrorMessage("Contact Tag"),
    //   },
    // },
  },
  {
    key: "contactTypeLid",
    name: "contactTypeLid",
    label: "Contact type",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("AGENT_CONTACT_TYPE"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Contact type"),
      },
    },
  },
  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    type: "richtext",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your remarks",
      rows: 3,
      multiline: true,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return plainText.length <= RICH_TEXT_LIMIT || RICH_TEXT_LIMIT_ERROR;
      },
    },
  },
];
const tpaContactInfoConfig: FormFieldConfig[] = [
  {
    key: "salutationLid",
    name: "salutationLid",
    label: "Salutation",
    type: "select",
    apiDependencies: {
      endPoint: endPoints.lookUpByName("SALUTATION"),
    },
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "firstName",
    name: "firstName",
    label: "First name",
    type: "text",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("First Name"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("First Name", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("First Name");
        }
        return true;
      },
    },
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "middleName",
    name: "middleName",
    label: "Middle name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Middle Name", 100),
      },
      validate: (value: string) => {
        if (value && value.trim() === "") {
          return "Middle name cannot contain only spaces";
        }
        return true;
      },
    },
  },
  {
    key: "lastName",
    name: "lastName",
    label: "Last name",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Last Name"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Last Name", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Last Name");
        }
        return true;
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },

  {
    key: "displayName",
    name: "displayName",
    label: "Display name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Display Name", 100),
      },
    },
    inputDependentField: ["firstName", "lastName"],
  },
  {
    key: "companyId",
    name: "companyId",
    label: "Company name",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.tpasList,
      clearFieldsOnChange: ["companyLocationId", "companyBranchId"],
      utilityFunction: companyUtilityFunction,
      customParams: { searchBy: "firstName" },
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company"),
      },
    },
  },
  {
    key: "department",
    name: "department",
    label: "Department",
    type: "text",
    componentProps: {
      fullWidth: true,
    },
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Department"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Department", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Department");
        }
        return true;
      },
    },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_department"),
      utilityFunction: masterDataUtilityFunction,
    },
  },
  {
    key: "designation",
    name: "designation",
    label: "Designation",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Designation"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Designation", 100),
      },
        validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Designation");
        }
        return true;
      },
    },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_designation"),
      utilityFunction: masterDataUtilityFunction,
    },
  },
  {
    key: "companyLocationId",
    name: "companyLocationId",
    label: "Company location",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.tpaDetailsById,
      showCondition: (watch) => !!watch("companyId"),
      clearFieldsOnChange: ["companyBranchId"],
      dependentField: "companyId",
      utilityFunction: getLocationUtilityFunctionFor("tpa"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company Location"),
      },
    },
  },
  {
    key: "companyBranchId",
    name: "companyBranchId",
    label: "Company branch",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.tpaDetailsById,
      showCondition: (watch) => !!watch("companyLocationId"),
      dependentField: "companyId",
      utilityFunction: getBranchUtilityFunctionFor("tpa"),
      utilityDependent: "companyLocationId",
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company branch"),
      },
    },
  },
  {
    key: "tagLid",
    name: "tagLid",
    label: "Contact Tag",
    type: "select",
    gridColumn: 5,
    // lookUpEndPoint: endPoints.lookUpByName("CONTACT_TAG"),
    apiDependencies: {
      endPoint: endPoints.lookUpByName("AGENT_CONTACT_TAG"),
    },
    // rules: {
    //   required: {
    //     value: true,
    //     message: requiredErrorMessage("Contact Tag"),
    //   },
    // },
  },
  {
    key: "contactTypeLid",
    name: "contactTypeLid",
    label: "Contact Type",
    type: "segmentedcontrol",
    gridColumn: 4,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("AGENT_CONTACT_TYPE"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Contact type"),
      },
    },
  },
  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    type: "richtext",
    gridColumn: 9,

    componentProps: {
      fullWidth: true,
      rows: 3,
      multiline: true,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return plainText.length <= RICH_TEXT_LIMIT || RICH_TEXT_LIMIT_ERROR;
      },
    },
  },
];
const brokerContactInfoConfig: FormFieldConfig[] = [
  {
    key: "salutationLid",
    name: "salutationLid",
    label: "Salutation",
    type: "select",
    // lookUpEndPoint: endPoints.lookUpByName("SALUTATION"),
    apiDependencies: {
      endPoint: endPoints.lookUpByName("SALUTATION"),
    },
    componentProps: {
      fullWidth: true,
    },
    gridColumn: 5,
  },
  {
    key: "firstName",
    name: "firstName",
    label: "First name",
    type: "text",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("First Name"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("First Name", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("First Name");
        }
        return true;
      },
    },
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "middleName",
    name: "middleName",
    label: "Middle name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Middle Name", 100),
      },
      validate: (value: string) => {
        if (value && value.trim() === "") {
          return "Middle name cannot contain only spaces";
        }
        return true;
      },
    },
  },
  {
    key: "lastName",
    name: "lastName",
    label: "Last name",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Last Name"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Last Name", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Last Name");
        }
        return true;
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },

  {
    key: "displayName",
    name: "displayName",
    label: "Display name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Display Name", 100),
      },
    },
    inputDependentField: ["firstName", "lastName"],
  },
  {
    key: "companyId",
    name: "companyId",
    label: "Company name",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.brokersList,
      clearFieldsOnChange: ["companyLocationId", "companyBranchId"],
      utilityFunction: companyUtilityFunction,
      customParams: { searchBy: "firstName" },
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company"),
      },
    },
  },
  {
    key: "department",
    name: "department",
    label: "Department",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Department"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Department", 100),
      },
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Department");
        }
        return true;
      },
    },
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_department"),
      utilityFunction: masterDataUtilityFunction,
    },
  },
  {
    key: "designation",
    name: "designation",
    label: "Designation",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Designation"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Designation", 100),
      },
        validate: (value: string) => {
        if (!value || value.trim() === "") {
          return requiredErrorMessage("Designation");
        }
        return true;
      },
    },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_designation"),
      utilityFunction: masterDataUtilityFunction,
    },
  },
  {
    key: "companyLocationId",
    name: "companyLocationId",
    label: "Company location",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.brokerDetailsById,
      showCondition: (watch) => !!watch("companyId"),
      clearFieldsOnChange: ["companyBranchId"],
      dependentField: "companyId",
      utilityFunction: getLocationUtilityFunctionFor("broker"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company Location"),
      },
    },
  },
  {
    key: "companyBranchId",
    name: "companyBranchId",
    label: "Company branch",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.brokerDetailsById,
      showCondition: (watch) => !!watch("companyLocationId"),
      dependentField: "companyId",
      utilityFunction: getBranchUtilityFunctionFor("broker"),
      utilityDependent: "companyLocationId",
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company branch"),
      },
    },
  },
  {
    key: "tagLid",
    name: "tagLid",
    label: "Tag",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("AGENT_CONTACT_TAG"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Contact Tag"),
      },
    },
  },
  {
    key: "contactTypeLid",
    name: "contactTypeLid",
    label: "Contact type",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("AGENT_CONTACT_TYPE"),
    },
  },

  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    type: "richtext",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      rows: 3,
      multiline: true,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return plainText.length <= RICH_TEXT_LIMIT || RICH_TEXT_LIMIT_ERROR;
      },
    },
  },
];

export const communicationDetailsFields = (
  index: number
): FormFieldConfig[] => [
  {
    key: "communicationType",
    name: "communicationType",
    label: "Communication type",
    type: "select",
    gridColumn: 5,

    options: [
      { value: "email", label: "Email" },
      { value: "phone", label: "Phone" },
    ],
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Communication type"),
      },
    },
  },
  {
    key: "communicationDetails",
    name: "communicationDetails",
    label: "Communication details",
    type: "text",
    gridColumn: 5,

    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Communication details"),
      },
      validate: (value: string, formValues: DynamicObject) => {
        const communicationType =
          formValues?.retArray?.[index]?.communicationType;
        if (communicationType === EMAIL_OPTION) {
          // Email validation
          if (!value.match(REGEX_PATTERNS.EMAIL)) {
            return ValidationErrors.EMAIL;
          }
        } else if (communicationType === PHONE_OPTION) {
          // Phone validation
          if (!value.match(REGEX_PATTERNS.PHONE)) {
            return ValidationErrors.PHONE;
          }
        }
        return true;
      },
    },
  },
];

export const defaultCommunicationDetailsFieldData = {
  communicationType: "",
  communicationDetails: "",
};

export const getContactDetailsBreadcrumbs = (
  entityType: string,
  isEditMode: boolean
) => {
  let managePath = "/insurer"; // Default path
  switch (entityType) {
    case "insurer":
      managePath = "/insurer?contacts=true";
      break;
    case "tpa":
      managePath = "/tpa?contacts=true";
      break;
    case "broker":
      managePath = "/broker?contacts=true";
      break;
    default:
      managePath = "/"; // Fallback path
  }

  return [
    { label: "Manage contacts", path: managePath },
    { label: isEditMode ? "Edit contact details" : "Add contact details" },
  ];
};

export const defaultAddress = (
  addressResidenceId: number,
  countryId: number
): IAddress => {
  return {
    addressTypeLid: addressResidenceId,
    address1: "",
    address2: "",
    area: "",
    countryId: countryId,
    stateId: "",
    cityId: "",
    pinCode: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    supportNumber: "",
    email: "",
  };
};
