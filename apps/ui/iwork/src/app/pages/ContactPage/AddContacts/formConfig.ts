import dayjs from "dayjs";
import {
  FormFieldConfig,
  Step,
  endPoints,
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors as uiLibValidationErrors,
  REGEX_PATTERNS,
  DynamicObject,
  getTextFromHtml,
  companyUtilityFunction,
} from "@ui/ui-lib";
import {
  EMAIL_OPTION,
  PHONE_OPTION,
  RICH_TEXT_LIMIT,
  RICH_TEXT_LIMIT_ERROR,
} from "../../../constants";
import { ValidationErrors } from "../../../constants/errors";
import { Address, Company, Contact } from "./types";

export const contactUtilityFunction = (data: DynamicObject) => {
  return data?.data?.data?.map((contact: Contact) => ({
    value: contact.id,
    label: contact.contactName,
  }));
};

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

const companyBranchUtilityFunction = (data: DynamicObject, field?: number) => {
  if (field === undefined) return [];

  const filteredData = data.data.companyAddresses.filter(
    (address: Address) => address.cityId.id === field
  );

  return filteredData.map((address: Address) => ({
    value: address.id,
    label: address.address1,
  }));
};

// to get the contact id
const getContactIdFromUrl = (): string | null => {
  const pathParts = window.location.pathname.split("/");
  const contactIndex = pathParts.indexOf("contact");
  return contactIndex !== -1 && pathParts.length > contactIndex + 1
    ? pathParts[contactIndex + 1]
    : null;
};

const reportingToUtilityFunction = (data: DynamicObject) => {
  const contactIdFromUrl = getContactIdFromUrl();
  const contactId = contactIdFromUrl ? Number(contactIdFromUrl) : null;

  return data?.data?.data
    ?.filter((contact: Contact) => contact.id !== contactId)
    .map((contact: Contact) => ({
      value: contact.id,
      label: contact.displayName,
    }));
};

export const contactInformationFields: FormFieldConfig[] = [
  {
    key: "salutationLid",
    name: "salutationLid",
    label: "Salutation",
    type: "select",
    // lookUpEndPoint: endPoints.lookUpByName("SALUTATION"),
    apiDependencies: {
      endPoint: endPoints.lookUpByName("SALUTATION"),
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
    componentProps: {
      fullWidth: true,
      disabled: true, // The company name field is disabled because it is auto-populated based on other selections
    },
    apiDependencies: {
      endPoint: endPoints.companiesListInSelectField,
      clearFieldsOnChange: [
        "companyLocationId",
        "companyBranchId",
        "reportingToId",
        "assistantId",
      ],
      utilityFunction: companyUtilityFunction,
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
    // lookUpEndPoint: endPoints.lookUpByName("DEPARTMENT"),
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Department"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Department", 100),
      },
    },
    // apiDependencies: {
    //   endPoint: endPoints.masterDataByName("department"),
    //   utilityFunction: masterDataUtilityFunction,
    // },
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
    // lookUpEndPoint: endPoints.lookUpByName("DESIGNATION"),
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Designation"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Designation", 100),
      },
    },
    // apiDependencies: {
    //   endPoint: endPoints.masterDataByName("designation"),
    //   utilityFunction: masterDataUtilityFunction,
    // },
  },
  {
    key: "reportingToId",
    name: "reportingToId",
    label: "Reporting to",
    type: "selectFieldByApi",
    gridColumn: 5,

    apiDependencies: {
      endPoint: endPoints.companyContacts,
      showCondition: (watch) => !!watch("companyId"),
      dependentField: "companyId",
      utilityFunction: reportingToUtilityFunction,
      customParams: { status: "ACTIVE" },
    },
  },
  {
    key: "linkedInUrl",
    name: "linkedInUrl",
    label: "Linkedin URL",
    type: "text",
    gridColumn: 5,

    componentProps: {
      fullWidth: true,
      placeholder: "Enter your linkedIn URL",
      type: "url",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.LINKEDINURL,
        message: ValidationErrors.LINKEDINURL,
      },
    },
  },
  {
    key: "companyLocationId",
    name: "companyLocationId",
    label: "Company location",
    type: "select",
    gridColumn: 5,

    apiDependencies: {
      endPoint: endPoints.companyDetailsById,
      showCondition: (watch) => !!watch("companyId"),
      clearFieldsOnChange: ["companyBranchId"],
      dependentField: "companyId",
      utilityFunction: companyLocationUtilityFunction,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company Location"),
      },
    },
  },
  {
    key: "relationshipTypeLid",
    name: "relationshipTypeLid",
    label: "Relation type",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("RELATIONSHIP_TYPE"),
    },
  },
  // {
  //   key: "companyBranchId",
  //   name: "companyBranchId",
  //   label: "Company branch",
  //   type: "select",
  //   gridColumn: 5,

  //   apiDependencies: {
  //     endPoint: endPoints.companyDetailsById,
  //     showCondition: (watch) => !!watch("companyLocationId"),
  //     dependentField: "companyId", //keeping companyId as dependent field, bcz we are using companyId data to show branches
  //     utilityFunction: (data, utilityDependent) =>
  //       companyBranchUtilityFunction(data, utilityDependent),
  //     utilityDependent: "companyLocationId",
  //   },
  // },
  // {
  //   key: "tagLid",
  //   name: "tagLid",
  //   label: "Tag",
  //   type: "select",
  //   gridColumn: 5,

  //   apiDependencies: {
  //     endPoint: endPoints.lookUpByName("CONTACT_TAG"),
  //   },
  // },
  {
    key: "contactTypeLid",
    name: "contactTypeLid",
    label: "Contact type",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CONTACT_TYPE"),
    },
  },
  {
    key: "status",
    name: "status",
    label: "Status",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CONTACT_STATUS"),
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

export const defaultContactInformationFieldData = {
  salutationLid: "",
  firstName: "",
  middleName: "",
  lastName: "",
  displayName: "",
  companyId: "",
  companyLocationId: "",
  companyBranchId: "",
  relationshipTypeLid: "",
  tagLid: "",
  contactTypeLid: "",
  department: "",
  designation: "",
  reportingToId: "",
  linkedInUrl: "",
  remarks: "",
  status: "",
};

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
  },
  {
    key: "communicationDetails",
    name: "communicationDetails",
    label: "Communication details",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your communication details",
    },
    rules: {
      validate: (value: string, formValues: DynamicObject) => {
        const communicationType =
          formValues?.retArray?.[index]?.communicationType;
        if (communicationType === EMAIL_OPTION) {
          // If Email, not required, but if provided, must be valid
          if (value && !value.match(REGEX_PATTERNS.EMAIL)) {
            return uiLibValidationErrors.EMAIL;
          }
          return true;
        } else if (communicationType === PHONE_OPTION) {
          // If Phone, required and must be valid
          if (!value?.trim()) {
            return requiredErrorMessage("Communication details");
          }
          if (!value.match(REGEX_PATTERNS.PHONE)) {
            return uiLibValidationErrors.PHONE;
          }
          return true;
        }
        // If neither, just pass
        return true;
      },
    },
  },
];

export const defaultCommunicationDetailsFieldData = {
  communicationType: "",
  communicationDetails: "",
};

export const personalDetailsFields: FormFieldConfig[] = [
  {
    key: "gender",
    name: "gender",
    label: "Gender",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("GENDER_TYPE"),
    },
  },
  {
    key: "dateOfBirth",
    name: "dateOfBirth",
    label: "Date of birth",
    type: "date",
    gridColumn: 5,

    componentProps: {
      maxDate: dayjs().subtract(1, "day"), // Disables today and future dates
    },
    rules: {
      validate: (value: string) => {
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate > today) {
          return "Date of Birth cannot be a future date.";
        }
        return true;
      },
    },
  },
  {
    key: "favouriteFood",
    name: "favouriteFood",
    label: "Favourite food",
    type: "text",
    gridColumn: 5,

    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Favourite Food", 100),
      },
    },
  },
  {
    key: "favouriteRestaurant",
    name: "favouriteRestaurant",
    label: "Favourite restaurant",
    type: "text",
    gridColumn: 5,

    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Favourite Restaurant", 100),
      },
    },
  },
  {
    key: "maritalStatus",
    name: "maritalStatus",
    label: "Marriage status",
    type: "segmentedcontrol",
    gridColumn: 5,

    apiDependencies: {
      endPoint: endPoints.lookUpByName("MARTIAL_STATUS"),
      clearFieldsOnChange: [
        "dateOfWedding",
        "spouseName",
        "spouseDateOfBirth",
        "spouseWorkingStatus",
        "workingCompany",
      ],
    },
  },
  {
    key: "dateOfWedding",
    name: "dateOfWedding",
    label: "Date of wedding",
    type: "date",
    gridColumn: 5,

    componentProps: {
      maxDate: dayjs().subtract(1, "day"), // Disables today and future dates
    },
    rules: {
      validate: (value: string) => {
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate > today) {
          return "Date of Wedding cannot be a future date.";
        }
        return true;
      },
    },
  },
  {
    key: "spouseName",
    name: "spouseName",
    label: "Spouse / partner's name",
    type: "text",
    gridColumn: 5,

    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Spouse same", 100),
      },
    },
  },
  {
    key: "spouseDateOfBirth",
    name: "spouseDateOfBirth",
    label: "Spouse / partner's date of birth",
    type: "date",
    gridColumn: 5,

    componentProps: {
      maxDate: dayjs().subtract(1, "day"), // Disables today and future dates
    },
    rules: {
      validate: (value: string) => {
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate > today) {
          return "Spouse date of birth cannot be a future date.";
        }
        return true;
      },
    },
  },
  {
    key: "spouseWorkingStatus",
    name: "spouseWorkingStatus",
    label: "Spouse / partner's working status",
    type: "select",
    gridColumn: 5,

    apiDependencies: {
      endPoint: endPoints.lookUpByName("SPOUSE_WORKING_STATUS"),
    },
  },
  {
    key: "workingCompany",
    name: "workingCompany",
    label: "Spouse / partner's working company",
    type: "text",
    gridColumn: 5,

    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Working Company", 100),
      },
    },
  },
  {
    key: "personalHistory",
    name: "personalHistory",
    label: "Personal history",
    type: "richtext",
    gridColumn: 9,

    componentProps: {
      fullWidth: true,
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
    key: "majorAchievements",
    name: "majorAchievements",
    label: "Major achievements and relation info",
    type: "richtext",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      multiline: true,
      rows: 3,
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

export const defaultPersonalDetailsFieldData = {
  gender: "",
  dateOfBirth: null,
  favouriteFood: "",
  favouriteRestaurant: "",
  maritalStatus: "",
  dateOfWedding: null,
  spouseName: "",
  spouseDateOfBirth: null,
  spouseWorkingStatus: "",
  workingCompany: "",
  personalHistory: "",
  majorAchievements: "",
};

export const childresnDetailsFields: FormFieldConfig[] = [
  {
    key: "childGender",
    name: "childGender",
    label: "Gender",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("GENDER_TYPE"),
    },
  },
  {
    key: "childName",
    name: "childName",
    label: "Name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Child Name", 100),
      },
    },
  },
  {
    key: "childDob",
    name: "childDob",
    label: "Date of birth",
    type: "date",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      maxDate: dayjs().subtract(1, "day"), // Disables today and future dates
    },
    rules: {
      validate: (value: string) => {
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate > today) {
          return "Date of birth cannot be a future date.";
        }
        return true;
      },
    },
  },
];

export const defaultChildrenDetailsFieldData = {
  childGender: "",
  childName: "",
  childDob: null,
};

export const professionalExperienceFormFields = (
  watch?: any,
  index?: number
): FormFieldConfig[] => {
  const prefix = index !== undefined ? `retArray.${index}` : "";
  const fromDateValue = watch ? watch(`${prefix}.fromDate`) : "";
  const toDateValue = watch ? watch(`${prefix}.toDate`) : "";

  return [
    {
      key: "fromDate",
      name: "fromDate",
      label: "From date",
      type: "date",
      gridColumn: 5,
      rules: {
        validate: (value: string) => {
          const selectedDate = new Date(value);
          const today = new Date();
          if (selectedDate > today) {
            return "From Date cannot be a future date.";
          }
          return true;
        },
      },
      componentProps: {
        maxDate: toDateValue ? dayjs(toDateValue) : dayjs().subtract(1, "day"),
      },
    },
    {
      key: "toDate",
      name: "toDate",
      label: "To date",
      type: "date",
      gridColumn: 5,
      rules: {
        validate: (value: string, formValues: DynamicObject) => {
          const toDate = new Date(value);
          const fromDate = new Date(formValues?.fromDate);
          const today = new Date();
          if (toDate > today) {
            return "To Date cannot be a future date.";
          }
          if (toDate < fromDate) {
            return "To Date cannot be earlier than from date.";
          }
          return true;
        },
      },
      componentProps: {
        minDate: fromDateValue ? dayjs(fromDateValue) : undefined,
        maxDate: dayjs().subtract(1, "day"),
      },
    },

    {
      key: "company",
      name: "company",
      label: "Company",
      type: "text",
      gridColumn: 5,
      componentProps: {
        fullWidth: true,
      },
      rules: {
        maxLength: {
          value: 100,
          message: textErrorMessage("Company", 100),
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
        maxLength: {
          value: 100,
          message: textErrorMessage("Department", 100),
        },
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
        maxLength: {
          value: 100,
          message: textErrorMessage("Designation", 100),
        },
      },
    },
    {
      key: "details",
      name: "details",
      label: "Details",
      type: "richtext",
      gridColumn: 9,
      componentProps: {
        fullWidth: true,
        placeholder: "Enter your details",
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
};

export const defaultProfessionalExperienceFormFieldData = {
  fromDate: null,
  toDate: null,
  company: "",
  designation: "",
  department: "",
  details: "",
};

export const qualificationFormFields: FormFieldConfig[] = [
  {
    key: "nameOfQualification",
    name: "nameOfQualification",
    label: "Name of qualification",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Name of qualification", 100),
      },
    },
  },
  {
    key: "universityName",
    name: "universityName",
    label: "University name",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Name of Qualification", 100),
      },
    },
  },
  {
    key: "yearOfQualification",
    name: "yearOfQualification",
    label: "Year of qualification",
    type: "year",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your year of qualification",
      maxDate: dayjs(), // Disables future years
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.YEAR,
        message: ValidationErrors.YEAR,
      },
    },
  },
  {
    key: "details",
    name: "details",
    label: "Details",
    type: "richtext",
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
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

export const defaultQualificationFormFieldData = {
  nameOfQualification: "",
  universityName: "",
  yearOfQualification: null,
  details: "",
};

export const steps: Step[] = [
  { id: "basic", label: "Basic", status: "default" },
  {
    id: "address",
    label: "Address",
    message: "Let's get your address details",
    status: "default",
  },
  {
    id: "personalDetails",
    label: "Personal details",
    message: "You're almost there! Great going!",
    status: "default",
  },
  {
    id: "professionalExperience",
    label: "Professional experience",
    message: "Last few to go!",
    status: "default",
  },
];

export const getContactDetailsBreadcrumbs = (
  isEditMode: boolean,
  displayName?: string
) => [
  { label: "Manage contacts", path: "/contact" },
  { label: isEditMode ? `Edit ${displayName} details` : "Add contact details" },
];
