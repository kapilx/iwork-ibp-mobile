import dayjs from "dayjs";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import {
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors,
} from "../../constants/errors";
import { REGEX_PATTERNS } from "../../constants/regex";
import { FormFieldConfig } from "../FormComponent/types";
import { getAddressFieldRules } from "../formConfig/sharedFormConfig";
import { MEETING_FORM_ERROR_MESSAGE } from "../../constants";
import { masterDataUtilitySearchWithIdFunction } from "@ui/ui-lib/utils/index";

export const companyFormFields = (
  mandatory = true,
  isCompanyExists: boolean = false,
  addressOptions: Array<any> = []
): FormFieldConfig[] => {
  const fields: FormFieldConfig[] = [
  {
    key: "companyName",
    name: "companyName",
    label: "Company name",
    type: "text",
    gridColumn: 5,
    rules: {
      required: { value: true, message: "Company name is required" },
      maxLength: {
        value: 200,
        message: "Company Name cannot exceed 200 characters",
      },
    },
    componentProps: { fullWidth: true },
    disabled: isCompanyExists,
  },
  ];

const options = addressOptions.reduce((acc, addr) => {
  const city = addr.address?.cityId;
  if (city?.id && city?.name) {
    acc.push({
      label: `${city.name}- ${addr.address?.address1 || ""}`,
      value: city.id,
    });
  }
  return acc;
}, []);

  if (isCompanyExists) {
  fields.push({
    key: "cityId",
    name: "cityId",
    label: "City",
    type: "select",
    gridColumn: 5,
    options: options,
    rules: {
      required: { value: true, message: "City is required" },
    },
    disabled: addressOptions.length == 1,
  });
  } else {
    fields.push({
      key: "cityId",
      name: "cityId",
      label: "City",
      type: "selectFieldByApi",
      gridColumn: 5,
      apiDependencies: {
        endPoint: endPoints.masterDataByName("city"),
        utilityFunction: masterDataUtilitySearchWithIdFunction,
        defaultValue: "",
        customParams: { searchBy: "name" },
        valueField: "id",
        labelField: "name",
      },
      rules: {
        required: { value: true, message: "City is required" },
      },
      disabled: isCompanyExists,
    });
  }

  return fields;
};

export const initialCompanyDetails = (data) => {
  return {
    companyName: data?.companyName ?? data?.label ?? "",
    cityId: "",
  };
};

export const contactInformationFields = (
  mandatory = true
): FormFieldConfig[] => [
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
    key: "contactTypeLid",
    name: "contactTypeLid",
    label: "Contact type",
    type: "select",
    gridColumn: 5,

    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Contact type"),
      },
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CONTACT_TYPE"),
    },
  },
  {
    key: "phoneNumber",
    name: "phoneNumber",
    label: "Phone number",
    type: "text",
    gridColumn: 5,
    rules: {
      ...getAddressFieldRules("phoneNumber", "Phone number", mandatory),
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
      required: {
        value: true,
        message: requiredErrorMessage("Email address"),
      },
      pattern: {
        value: REGEX_PATTERNS.EMAIL,
        message: ValidationErrors.EMAIL,
      },
    },
  },
];

export const defaultContactInformationFieldData = {
  firstName: "",
  lastName: "",
  contactTypeLid: "",
  phoneNumber: "",
  email: "",
};

export const opportunityFormConfig: FormFieldConfig[] = [
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
    key: "expiryDate",
    name: "expiryDate",
    label: "Expiry date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      // minDate: dayjs(),
      minDate: dayjs().add(1, "day"),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("SO expiry date"), //todo
      },
      validate: (value) => {
        const date = new Date(value);
        const today = new Date();
        return date > today || "SO expiry date should be greater than today";
      },
    },
  },
  {
    key: "premiumPaid",
    name: "premiumPaid",
    label: "Expected premium(or Premium Paid on Current Policy)",
    type: "number",
    formatNumber: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Expected Premium"),
      },
    },
  },
  {
    key: "estimatedBrokeragePercentage",
    name: "estimatedBrokeragePercentage",
    label: "Estimated brokerage percentage",
    type: "number",
    gridColumn: 5,
    isDecimal: true,
    calculations: {
      calculateAmount: ["premiumPaid"],
    },
    componentProps: {
      fullWidth: true,
      type: "number",
      inputProps: { max: 100, min: 0 },
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Estimated brokerage percentage"),
      },
    },
  },
  {
    key: "sourceTypeLid", //todo not there in swagger
    name: "sourceTypeLid",
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
];

export const defaultopportunityFormValues = {
  policyTypeLid: "",
  policyStatusLid: "",
  expiryDate: "",
  premiumPaid: "",
  estimatedBrokeragePercentage: 1,
};

export const meetingsFormConfig: FormFieldConfig[] = [
  {
    key: "meetingDate",
    name: "meetingDate",
    label: "Meeting Date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      minDate: dayjs(),
      onChange: (value: any) => {
        return value;
      },
      // sx: (theme) => dateField(theme), // Add this if you have a dateField style
    },
    rules: {
      required: {
        value: true,
        message: MEETING_FORM_ERROR_MESSAGE.DATE_REQUIRED_MESSAGE,
      },
    },
  },
  {
    key: "meetingTime",
    name: "meetingTime",
    label: "Meeting time",
    type: "timerange",
    fromName: "startTime",
    toName: "endTime",
    fromLabel: "Start time",
    toLabel: "End time",
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: MEETING_FORM_ERROR_MESSAGE.MEETING_TIME_REQUIRED,
      },
    },
    gridColumn: 5,
  },
  {
    key: "meetingAgenda",
    name: "meetingAgenda",
    label: "Meeting Agenda",
    type: "text",
    gridColumn: 12,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter agenda content ...",
      multiline: true,
      rows: 4,
      sx: {
        "& .MuiInputBase-root.MuiOutlinedInput-root": {
          padding: "0px",
        },
      },
    },
    rules: {
      required: {
        value: true,
        message: MEETING_FORM_ERROR_MESSAGE.AGENDA_REQUIRED_MESSAGE,
      },
    },
  },
];

export const initialMeetingDetails = () => ({
  Date: "",
  meetingTime: "",
  meetingAgenda: "",
});
