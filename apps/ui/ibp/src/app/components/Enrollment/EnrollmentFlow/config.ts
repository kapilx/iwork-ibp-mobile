import {
  DynamicObject,
  endPoints,
  FormFieldConfig,
  REGEX_PATTERNS,
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors,
} from "@ui/ui-lib";
import { NestedFormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";

export const lookupKeyUtilityFunction = (data: DynamicObject) => {
  return data?.data?.map((lookUpObjectData: any) => ({
    value: lookUpObjectData.lookUpKey,
    label: lookUpObjectData.lookUpValue,
  }));
};

export const userDetailsFormConfig: FormFieldConfig = [
  {
    key: "employeeDetails",
    title: "",
    config: [
      {
        key: "employeeName",
        name: "employeeName",
        label: "Name",
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
        gridColumn: 3,

        componentProps: {
          fullWidth: true,
        },
      },
      {
        key: "age",
        name: "age",
        label: "Age",
        type: "text",
        componentProps: {
          fullWidth: true,
          disabled: true, // Disable editing for now
        },

        gridColumn: 3,
      },
      {
        key: "dateOfBirth",
        name: "dateOfBirth",
        label: "Date of birth",
        type: "date",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
          disabled: true, // Disable editing for now
        },
      },
      {
        key: "gender",
        name: "gender",
        label: "Gender",
        type: "select",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
          disabled: true, // Disable editing for now
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("GENDER_TYPE"),
          utilityFunction: lookupKeyUtilityFunction,
        },
      },
      {
        key: "maritalStatus",
        name: "maritalStatus",
        label: "Marriage status",
        type: "select",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
          disabled: true, // Disable editing for now
        },
        apiDependencies: {
          endPoint: endPoints.lookUpByName("MARTIAL_STATUS"),
          utilityFunction: lookupKeyUtilityFunction,
        },
      },
      {
        key: "companyEmployeeId",
        name: "companyEmployeeId",
        label: "Employee ID",
        type: "text",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
          disabled: true, // Disable editing for now
        },
      },
      // {
      //   key: "employeeCompanyId",
      //   name: "employeeCompanyId",
      //   label: "Company ID",
      //   type: "text",
      //   gridColumn: 3,
      //   componentProps: {
      //     fullWidth: true,
      //     disabled: true, // Disable editing for now
      //   },
      // },
      {
        key: "designation",
        name: "designation",
        label: "Designation",
        type: "text",
        gridColumn: 3,
        componentProps: {
          fullWidth: true,
          disabled: true, // Disable editing for now
        },
        // rules: {
        //   maxLength: {
        //     value: 100,
        //     message: textErrorMessage("Designation", 100),
        //   },
        // },
      },
      {
        key: "phone",
        name: "phone",
        label: "Phone number",
        type: "text",
        gridColumn: 3,
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
        gridColumn: 3,
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
    ],
  },
];


export const alternatePhoneFormConfig: NestedFormFieldConfig = {
  key: "alternateContactDetails",
  title: "",
  enableSmartSearch: false,
  config: [
    {
      key: "alternatePhone",
      name: "alternatePhone",
      label: "Alternate Phone Number",
      type: "text",
      gridColumn: 9,
      componentProps: {
        fullWidth: true,
        type: "number",
      },
      rules: {
        pattern: {
          value: REGEX_PATTERNS.PHONE,
          message: ValidationErrors.PHONE,
        },
        maxLength: {
          value: 10,
          message: textErrorMessage("Alternate phone number", 10),
        },
      },
    },
  ],
};

export const alternateEmailFormConfig: NestedFormFieldConfig = {
  key: "alternateContactDetails",
  title: "",
  enableSmartSearch: false,
  config: [
    {
      key: "alternateEmail",
      name: "alternateEmail",
      label: "Alternate Email",
      type: "text",
      gridColumn: 9,
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
  ],
};
