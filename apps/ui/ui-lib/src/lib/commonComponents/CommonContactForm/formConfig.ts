import { endPoints } from "@ui/ui-lib/constants/endPoints";
import {
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors,
} from "../../constants/errors";
import { REGEX_PATTERNS } from "../../constants/regex";
import { masterDataUtilityFunction } from "@ui/ui-lib/utils/index";
import { FormFieldConfig } from "../FormComponent/types";
import { Address, Company, Contact, IContactFieldData } from "./types";
import { companyUtilityFunction } from "@ui/ui-lib/utils/procesaApiFormConfig";

const companyLocationUtilityFunction = (data: any) => {
  const cityMap = new Map();
  data.data[0].companyAddresses.forEach((address: Address) => {
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

const companyBranchUtilityFunction = (data: any, field?: number) => {
  if (field === undefined) return [];

  const filteredData = data.data[0].companyAddresses.filter(
    (address: Address) => address.cityId.id === field
  );

  return filteredData.map((address: Address) => ({
    value: address.id,
    label: address.address1,
  }));
};

const reportingToUtilityFunction = (data: any) => {
  return data.data[0].contacts.map((contact: Contact) => ({
    value: contact.id,
    label: contact.displayName,
  }));
};

export const contactFields: FormFieldConfig[] = [
  {
    key: "salutationLid",
    name: "salutationLid",
    label: "Salutation",
    type: "select",
    apiDependencies: {
      endPoint: endPoints.lookUpByName("SALUTATION"),
    },
  },
  {
    key: "firstName",
    name: "firstName",
    label: "First Name",
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
    gridColumn: 8,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your first name",
    },
  },
  {
    key: "middleName",
    name: "middleName",
    label: "Middle Name",
    type: "text",
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your middle name",
    },
  },
  {
    key: "lastName",
    name: "lastName",
    label: "Last Name",
    type: "text",
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
      placeholder: "Enter your last name",
    },
  },

  {
    key: "displayName",
    name: "displayName",
    label: "Display Name",
    type: "text",
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your display name",
    },
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Display Name", 100),
      },
    },
  },
  {
    key: "companyId",
    name: "companyId",
    label: "Company",
    type: "select",
    apiDependencies: {
      endPoint: endPoints.companiesList,
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
    key: "companyLocationId",
    name: "companyLocationId",
    label: "Company Location",
    type: "selectFieldByApi",
    apiDependencies: {
      endPoint: endPoints.companyContacts,
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
    key: "companyBranchId",
    name: "companyBranchId",
    label: "Company Branch",
    type: "selectFieldByApi",
    apiDependencies: {
      endPoint: endPoints.companyContacts,
      showCondition: (watch) => !!watch("companyLocationId"),
      dependentField: "companyId", //keeping companyId as dependent field, bcz we are using companyId data to show branches
      utilityFunction: (data, utilityDependent) =>
        companyBranchUtilityFunction(data, utilityDependent),
      utilityDependent: "companyLocationId",
    },
  },
  {
    key: "tagLid",
    name: "tagLid",
    label: "Tag",
    type: "select",
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CONTACT_TAG"),
    },
  },
  {
    key: "contactTypeLid",
    name: "contactTypeLid",
    label: "Contact Type",
    type: "select",
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CONTACT_TYPE"),
    },
  },
  {
    key: "departmentId",
    name: "departmentId",
    label: "Department",
    type: "select",
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Department", 100),
      },
    },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_department"),
      utilityFunction: masterDataUtilityFunction,
    },
  },
  {
    key: "designationId",
    name: "designationId",
    label: "Designation",
    type: "select",
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Designation", 100),
      },
    },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("org_designation"),
      utilityFunction: masterDataUtilityFunction,
    },
  },
  {
    key: "reportingToId",
    name: "reportingToId",
    label: "Reporting To",
    type: "selectFieldByApi",
    apiDependencies: {
      endPoint: endPoints.companyContacts,
      showCondition: (watch) => !!watch("companyId"),
      dependentField: "companyId",
      utilityFunction: reportingToUtilityFunction,
    },
  },
  {
    key: "assistantId",
    name: "assistantId",
    label: "Assistant Id",
    type: "selectFieldByApi",
    apiDependencies: {
      endPoint: endPoints.companyContacts,
      showCondition: (watch) => !!watch("companyId"),
      dependentField: "companyId",
      utilityFunction: reportingToUtilityFunction,
    },
  },
  {
    key: "emailId",
    name: "emailId",
    label: "Email",
    type: "text",
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Email"),
      },
      pattern: {
        value: REGEX_PATTERNS.EMAIL,
        message: ValidationErrors.EMAIL,
      },
    },
  },
  {
    key: "phone",
    name: "phone",
    label: "Phone",
    type: "text",
    componentProps: {
      fullWidth: true,
      type: "tel",
      placeholder: "Enter your phone number",
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Phone"),
      },
      maxLength: {
        value: 20,
        message: textErrorMessage("Phone number", 20),
      },
      pattern: {
        value: REGEX_PATTERNS.PHONE,
        message: ValidationErrors.PHONE,
      },
    },
  },
  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    type: "text",
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your remarks",
      rows: 3,
      multiline: true,
    },
    rules: {
      maxLength: {
        value: 1000,
        message: textErrorMessage("Remarks", 1000),
      },
    },
  },
];

export const defaultContactFieldData: IContactFieldData = {
  salutationLid: "",
  firstName: "",
  middleName: "",
  lastName: "",
  displayName: "",
  companyId: "",
  companyLocationId: "",
  companyBranchId: "",
  tagLid: 21,
  contactTypeLid: 20,
  departmentId: 63,
  designationId: 65,
  reportingToId: "",
  assistantId: "",
  emailId: "",
  phone: "",
  remarks: "",
};
