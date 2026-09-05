import dayjs from "dayjs";
import { RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR } from "../../../constants";
import {
  brokerLocationAddressUtilityFunction,
  brokerLocationListUtilityFunction,
  brokerUtilityFunction,
  insurerListUtilityFunction,
  insurerLocationAddressUtilityFunction,
  insurerLocationListUtilityFunction,
  tpaLocationAddressUtilityFunction,
  tpaLocationListUtilityFunction,
  tpaUtilityFunction,
  FormFieldConfig,
  Step,
  requiredErrorMessage,
  companyUtilityFunction,
  DynamicObject,
  getTextFromHtml,
  endPoints,
} from "@ui/ui-lib";

const companyContactUtilityFunction = (data: DynamicObject) => {
  return data.data.contacts.map((contact: DynamicObject) => ({
    value: contact.id,
    label: `${contact.firstName} ${contact.lastName}`,
  }));
};

export interface IAddress {
  id?: number;
  addressTypeLid: number;
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

// Default values for claimExperiencesFormFields
// export const defaultClaimExperiencesFormValues: ClaimExperiencesFormDefaultValues =
//   {
//     policyFrom: "",
//     policyTo: "",
//     natureOfLoss: "",
//     premium: "",
//     claimAmount: "",
//     claimPercentage: "",
//   };

// // Default values for competitorFormFields
// export const defaultCompetitorFormValues = {
//   competitor: "",
//   competitorId: "",
//   competitorBranchId: "",
// };

//file
export interface Address {
  id: number;
  address1: string;
  cityId: City;
}
export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  displayName: string;
}

export interface City {
  id: number;
  name: string;
}
const companyLocationUtilityFunction = (data: DynamicObject) => {
  const cityMap = new Map();
  data.data?.companyAddresses?.forEach((address: Address) => {
    if (!cityMap.has(address.cityId.id)) {
      cityMap.set(address.cityId.id, address);
    }
  });
  const uniqueCities = Array.from(cityMap.values());
  return uniqueCities.map((address: Address) => ({
    value: address.cityId.id,
    label: address.cityId.name,
  }));
};

const riskLocationUtilityFunction = (data: DynamicObject) => {
  const address = data?.data?.companyAddresses?.map((address: Address) => ({
    value: address?.id,
    label: `${address?.address1}, ${address?.cityId?.name}`,
  }));

  return address;
};

export const addSoFormConfig: FormFieldConfig[] = [
  {
    key: "companyId",
    name: "companyId",
    label: "Company name",
    type: "selectFieldByApi",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company"),
      },
    },
    apiDependencies: {
      endPoint: endPoints.companiesListInSelectField,
      utilityFunction: companyUtilityFunction,
      clearFieldsOnChange: ["contactId"],
    },
    componentProps: {
      disabled: true,
    },
  },
  {
    key: "policyTypeLid",
    name: "policyTypeLid",
    label: "Policy type",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_TYPE"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Policy Type"),
      },
    },
  },
  {
    key: "opportunityTypeLid",
    name: "opportunityTypeLid",
    label: "Opportunity Type",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("OPPORTUNITY_TYPE"), //Todo
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Opportunity Type"),
      },
    },
    disabled: true,
  },
  {
    key: "riskLocations",
    name: "riskLocations",
    label: "Risk location",
    type: "multiselect",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.companyDetailsById,
      dependentField: "companyId",
      utilityFunction: riskLocationUtilityFunction,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company Location"),
      },
    },
  },
];

export const defaultSoFormValues = {
  companyId: "",
  policyTypeLid: "",
  opportunityTypeLid: "",
  riskLocations: "", //Todo make it list
};

export const contactPersonFormConfig: FormFieldConfig[] = [
  {
    key: "contactId",
    name: "contactId",
    label: "Contact person",
    type: "selectFieldByApi",
    gridColumn: 4,
    apiDependencies: {
      endPoint: endPoints.companyContacts,
      // dependentField: "companyId",
      utilityFunction: companyContactUtilityFunction,
    },
    // apiEndPoint: endPoints.contactList,
    // rules: {
    //   required: {
    //     value: true,
    //     message: requiredErrorMessage("Contact person"),
    //   },
    // },
  },
  {
    key: "phoneNumber",
    name: "phoneNumber",
    label: "Phone number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Phone number"),
      },
    },
  },
];
export const defaultContactPersonFormConfig = {
  contactId: "",
  phoneNumber: "",
};

export const opportunityDetailsFormConfig: FormFieldConfig[] = [
  {
    key: "policyStatusLid",
    name: "policyStatusLid",
    label: "Policy status",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_STATUS"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Policy status"),
      },
    },
  },
  {
    key: "isPolicyMinedLid",
    name: "isPolicyMinedLid",
    label: "Is the policy mined?",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("IS_POLICY_MINED"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Policy mined"),
      },
    },
  },
  {
    key: "serviceLevelLid",
    name: "serviceLevelLid",
    label: "Service level",
    type: "segmentedcontrol",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("SERVICE_LEVEL"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Service level"),
      },
    },
  },
  {
    key: "expiryDate",
    name: "expiryDate",
    label: "Expiry date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      // minDate: dayjs(),
      minDate: dayjs().add(1, "day"),
      maxDate: dayjs().add(360, "day"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Opportunity expiry date"), //todo
      },
      validate: (value) => {
        const date = new Date(value);
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 360);
        if (date <= today) {
          return "Opportunity expiry date should be greater than today";
        }
        if (date > maxDate) {
          return "Opportunity expiry date cannot be more than 360 days from today";
        }
        return true;
      },
    },
  },
  {
    key: "sumInsured",
    name: "sumInsured",
    label: "Sum insured",
    type: "number",
    formatNumber: true,
    isDecimal: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
    // rules: {
    //   required: {
    //     value: true,
    //     message: requiredErrorMessage("Sum insured"),
    //   },
    // },
  },
  {
    key: "premiumPaid",
    name: "premiumPaid",
    label: "Expected premium (or Premium Paid on Current Policy)",
    type: "number",
    formatNumber: true,
    isDecimal: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage(
          "Expected premium (or Premium Paid on Current Policy)"
        ),
      },
    },
  },
  {
    key: "estimatedBrokerage",
    name: "estimatedBrokerage",
    label: "Estimated brokerage amount",
    type: "number",
    isDecimal: true,
    formatNumber: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
  },
  {
    key: "estimatedBrokeragePercentage",
    name: "estimatedBrokeragePercentage",
    label: "Estimated Brokerage Percentage",
    type: "percentage",
    formatNumber: true,
    gridColumn: 5,
    isDecimal: true,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
    rules: {
      required: "Estimated brokerage percentage is required",
      max: {
        value: 100,
        message: "Estimated brokerage percentage cannot exceed 100%",
      },
      min: {
        value: 0,
        message: "Estimated brokerage percentage must be a positive value",
      },
    },
    percentageFields: ["estimatedBrokerage", "premiumPaid"],
  },
  {
    key: "estimatedFee",
    name: "estimatedFee",
    label: "Estimated fees",
    type: "number",
    formatNumber: true,
    isDecimal: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
  },
  {
    key: "opportunitySourceTypeLid", //todo not there in swagger
    name: "opportunitySourceTypeLid",
    label: "Source type",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("OPPORTUNITY_SOURCE_TYPE"), //todo
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Source type"),
      },
    },
  },
  {
    key: "source",
    name: "source",
    label: "Source",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "salesPitch",
    name: "salesPitch",
    label: "Sales pitch",
    type: "richtext",
    componentProps: {
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

export const defaultOpportunityDetailsValues = {
  policyStatusLid: "",
  isPolicyMinedLid: "",
  serviceLevelLid: "",
  expiryDate: "",
  sumInsured: "",
  premiumPaid: "",
  estimatedBrokerage: "",
  estimatedFee: "",
  sourceTypeLid: "",
  source: "",
  salesPitch: "",
};

export const claimExperiencesFormConfig: FormFieldConfig[] = [
  {
    key: "policyFrom",
    name: "policyFrom",
    label: "Policy Start Date",
    type: "date",
    gridColumn: 5,
  },
  {
    key: "policyTo",
    name: "policyTo",
    label: "Policy End Date",
    type: "date",
    gridColumn: 5,
    // rules: {
    //   validate: (value, formValues) => {
    //     return (
    //       value > formValues.policyFrom ||
    //       "Policy to date should be greater than Policy from date"
    //     );
    //   },
    // },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Policy To",
    },
  },
  {
    key: "natureOfLoss",
    name: "natureOfLoss",
    label: "Nature of loss",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
  },

  {
    key: "premium",
    name: "premium",
    label: "Premium",
    type: "number",
    formatNumber: true,
    isDecimal: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Premium",
      type: "number",
    },
  },
  {
    key: "claimAmount",
    name: "claimAmount",
    label: "Claim amount",
    type: "number",
    isDecimal: true,
    formatNumber: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
  },
  {
    key: "claimPercentage",
    name: "claimPercentage",
    label: "Claim%",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Claim Percentage",
      type: "number",
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
      rows: 4,
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

export const defaultClaimExperiencesValues = {
  policyFrom: "",
  policyTo: "",
  natureOfLoss: "",
  premium: "",
  claimAmount: "",
  claimPercentage: "",
  remarks: "",
};

export const previousPlacementFormConfig: FormFieldConfig[] = [
  {
    key: "challengesAndMitigation",
    name: "challengesAndMitigation",
    label: "Challenges and mitigation",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) => {
        const plainText = getTextFromHtml(value || "");
        return plainText.length <= RICH_TEXT_LIMIT || RICH_TEXT_LIMIT_ERROR;
      },
    },
    componentProps: {
      fullWidth: true,
      rows: 4,
      multiline: true,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "existingCompetition",
    name: "existingCompetition",
    label: "Existing competition",
    type: "richtext",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      rows: 4,
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
  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    type: "richtext",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      rows: 4,
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

export const defaultPreviousPlacementValues = {
  challengesAndMitigation: "",
  existingCompetition: "",
  remarks: "",
};

export const opportunitiesDetailsBreadcrumbs = (
  isEditMode: boolean,
  opportunityType?: string
) => [
  { label: "Manage opportunities", path: "/opportunities" },
  {
    label: isEditMode
      ? `Edit ${opportunityType} details`
      : `Add ${opportunityType} details`,
  },
];

export const getOpportunitiesSteps = (opportunityType?: string): Step[] => {
  return [
    {
      id: "soBasicDetails",
      label: `${opportunityType} details`,
      status: "default",
    },
    {
      id: "claimExperience",
      label: "Claim experience",
      status: "default",
      message: "You're almost there! Great going!",
    },
    {
      id: "previousPlacementDetails",
      label: "Previous placement details",
      status: "default",
      message: "Last few to go!",
    },
  ];
};

export const previousInsurerTpaBrokersConfig = [
  {
    key: "previousInsurer",
    title: "Previous Insurance",
    config: [
      {
        key: "companyId",
        name: "companyId",
        type: "selectFieldByApi",
        label: "Company name",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.insurersList,
          utilityFunction: insurerListUtilityFunction,
          clearFieldsOnChange: ["locationId", "branchId"],
          customParams: { searchBy: "firstName" },
        },
      },
      {
        key: "locationId",
        name: "locationId",
        type: "select",
        label: "Location",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.insurerById,
          dependentField: "companyId",
          utilityFunction: insurerLocationListUtilityFunction,
          clearFieldsOnChange: ["branchId"],
        },
      },
      {
        key: "branchId",
        name: "branchId",
        type: "select",
        label: "Branch",

        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.insurerById,
          dependentField: "companyId",
          utilityFunction: insurerLocationAddressUtilityFunction,
          utilityDependent: "locationId",
        },
      },
    ],
    isMultiple: true,
    defaultValues: [
      {
        branchId: null,
        companyId: null,
        locationId: null,
      },
    ],
  },
  {
    key: "previousTPA",
    title: "Previous TPA",
    config: [
      {
        key: "companyId",
        name: "companyId",
        type: "selectFieldByApi",
        label: "Company name",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },

        apiDependencies: {
          endPoint: endPoints.tpasList,
          utilityFunction: tpaUtilityFunction,
          clearFieldsOnChange: ["locationId", "branchId"],
          customParams: { searchBy: "firstName" },
        },
      },
      {
        key: "locationId",
        name: "locationId",
        type: "select",
        label: "Location",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.tpaByID,
          dependentField: "companyId",
          utilityFunction: tpaLocationListUtilityFunction,
          clearFieldsOnChange: ["branchId"],
        },
      },
      {
        key: "branchId",
        name: "branchId",
        type: "select",
        label: "Branch",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.tpaByID,
          dependentField: "companyId",
          utilityFunction: tpaLocationAddressUtilityFunction,
          utilityDependent: "locationId",
        },
      },
    ],
    isMultiple: true,
    defaultValues: [
      {
        companyId: null,
        branchId: null,
        locationId: null,
      },
    ],
  },
  {
    key: "previousBroker",
    title: "Previous Broker",
    config: [
      {
        key: "companyId",
        name: "companyId",
        type: "selectFieldByApi",
        label: "Company name",

        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.brokersList,
          utilityFunction: brokerUtilityFunction,
          clearFieldsOnChange: ["locationId", "branchId"],
          customParams: { searchBy: "firstName" },
        },
      },
      {
        key: "locationId",
        name: "locationId",
        type: "select",
        label: "Location",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.brokerByID,
          dependentField: "companyId",
          utilityFunction: brokerLocationListUtilityFunction,
          clearFieldsOnChange: ["branchId"],
        },
      },
      {
        key: "branchId",
        name: "branchId",
        type: "select",
        label: "Branch",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: endPoints.brokerByID,
          dependentField: "companyId",
          utilityFunction: brokerLocationAddressUtilityFunction,
          utilityDependent: "locationId",
        },
      },
    ],
    isMultiple: true,
    defaultValues: [
      {
        companyId: null,
        branchId: null,
        locationId: null,
      },
    ],
  },
];
