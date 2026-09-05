import dayjs from "dayjs";
import websiteIcon from "../../../assets/svgs/Website.svg";
import rupeeIcon from "../../../assets/svgs/rupee-icon.svg";
import {
  GROUP_COMPANY_NO_ID,
  RICH_TEXT_LIMIT,
  RICH_TEXT_LIMIT_ERROR,
} from "../../../constants";
import {
  endPoints,
  FormFieldConfig,
  Step,
  textErrorMessage,
  REGEX_PATTERNS,
  validateRichTextLimit,
  DynamicObject,
  masterCurrencyDataUtilityFunction,
} from "@ui/ui-lib";
import { Company } from "../../ContactPage/AddContacts/types";

const companyUtilityFunction = (
  data: DynamicObject,
  globalState: DynamicObject
) => {
  let companyData = data.data.data || [];
  const companyId = globalState?.companyId;
  if (companyId) {
    //in edit mode we have to filter the current company options
    companyData = companyData.filter(
      (company: Company) => company.id !== companyId
    );
  }

  return companyData.map((company: Company) => ({
    value: company.id,
    label: company.companyName,
  }));
};

const accountManagerUtilityFunc = (
  data: DynamicObject,
  param: DynamicObject
) => {
  let accManagerData = data.data.data || [];
  if (param) {
    accManagerData = accManagerData.filter(
      (item: DynamicObject) => item.userId !== param
    );
  }
  return accManagerData.map((accMan: DynamicObject) => ({
    value: accMan.userId,
    label: `${accMan.firstName} ${accMan.lastName}, ${
      accMan.branch?.name ?? ""
    }`,
  }));
};

const leadCrmUtilityFunc = (data: DynamicObject, param: DynamicObject) => {
  let leadCrmData = data.data.data || [];
  if (param) {
    leadCrmData = leadCrmData.filter(
      (item: DynamicObject) => item.userId !== param
    );
  }
  return leadCrmData.map((accMan: DynamicObject) => ({
    value: accMan.userId,
    label: accMan.firstName + " " + accMan.lastName,
  }));
};

const addressesUtilityFunction = (data: DynamicObject) => {
  return data.data.map((item: { id: string; name: string }) => ({
    value: item.id,
    label: item.name,
  }));
};

export const gstDetailsFields = (
  index?: number,
  userData?: any
): FormFieldConfig[] => [
  {
    key: "stateId",
    name: "stateId",
    label: "State",
    type: "select",
    localizationKey: "gst_state",
    apiDependencies: {
      endPoint: userData?.country?.id
        ? endPoints.stateGstListById(userData.country.id)
        : undefined,
      utilityFunction: (data) => addressesUtilityFunction(data),
    },
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    rules: {
      validate: (value, formValues) => {
        const row = formValues.retArray?.[index];
        const { gstCategoryLid, gstNumber } = row || {};
        const anyFilled = value || gstCategoryLid || gstNumber;
        if (anyFilled && !value) return "State is required";
        return true;
      },
    },
  },
  {
    key: "gstCategoryLid",
    name: "gstCategoryLid",
    label: "Category",
    type: "segmentedcontrol",
    localizationKey: "gst_category",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("TAX"),
    },
    componentProps: {
      fullWidth: true,
    },
    rules: {
      validate: (value, formValues) => {
        const row = formValues?.retArray?.[index];
        const { stateId, gstNumber } = row || {};
        const anyFilled = value || stateId || gstNumber;
        if (anyFilled && !value) return "GST Category is required";
        return true;
      },
    },
  },
  {
    key: "gstNumber",
    name: "gstNumber",
    label: "GST number",
    localizationKey: "gst_number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    textTransform: "uppercase",
    rules: {
      validate: (value, formValues) => {
        const row = formValues?.retArray?.[index];
        const { stateId, gstCategoryLid } = row || {};
        const anyFilled = value || stateId || gstCategoryLid;
        if (anyFilled && !value) return "GST Number is required";
        return true;
      },
      pattern: {
        value: REGEX_PATTERNS.GST_NUMBER,
        message: "Invalid GST Number format (e.g., 27ABCDE1234F1Z5)",
      },
    },
  },
];

export const initialGstDetails = {
  stateId: "",
  gstNumber: "",
  gstCategoryLid: "",
  entityType: "COMPANY",
};

export const basicFormFields = (
  userData: any,
  groupCompanyIdNo?: number,
  isCompanyStatusDisabled?: boolean
): FormFieldConfig[] => [
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
    componentProps: { fullWidth: true, disabled: true },
    dependentFieldsOnBlur: "displayName",
  },
  {
    key: "displayName",
    name: "displayName",
    label: "Display name",
    type: "text",
    gridColumn: 5,
    rules: {
      maxLength: {
        value: 100,
        message: textErrorMessage("Display Name", 100),
      },
    },
    componentProps: { fullWidth: true },
    inputDependentField: ["companyName"],
    // disabledInEditMode: true,
  },
  {
    key: "companyTypeLid",
    name: "companyTypeLid",
    label: "Type of company",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("COMPANY_TYPE"),
    },
  },
  {
    key: "industrySegmentLid",
    name: "industrySegmentLid",
    label: "Industry segment",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("INDUSTRY_SEGMENT"),
    },
    // disabledInEditMode: true,
  },
  {
    key: "priorityLid",
    name: "priorityLid",
    label: "Priority",
    type: "select",
    gridColumn: 5,
    // rules: { required: { value: true, message: "Priority is required" } },
    apiDependencies: {
      // Priority's lookup_order now reads Low..VIMP ascending (fixed to match
      // standard severity-word ordering for table sort); request DESC here so
      // this dropdown keeps showing VIMP first, matching existing user expectation.
      endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
    },
    // disabledInEditMode: true,
  },
  {
    key: "groupCompanyLid",
    name: "groupCompanyLid",
    label: "Is part of group company",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("GROUP_COMPANY"),
      clearFieldsOnChange: ["parentCompanyLid"],
    },
  },

  {
    label: "Group company name",
    key: "parentCompanyLid",
    name: "parentCompanyLid",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.parentCompaniesList,
      dependentField: "groupCompanyLid",
      showCondition: (watch) =>
        !!watch("groupCompanyLid") &&
        watch("groupCompanyLid") !== groupCompanyIdNo,
      utilityFunction: companyUtilityFunction,
    },
    componentProps: {
      fullWidth: true,
    },
    requiredWhenVisible: true,
    rules: {
      validate: (value, formValues) => {
        if (
          groupCompanyIdNo !== undefined &&
          formValues.groupCompanyLid !== groupCompanyIdNo
        ) {
          if (value === null || value === undefined || value === "") {
            return "Group company name is mandatory when the company is part of a group company";
          }
        }
        return true;
      },
    },
  },

  {
    key: "noOfEmployees",
    name: "noOfEmployees",
    label: "Number of employees",
    type: "number",
    gridColumn: 5,
    formatNumber: true,
    componentProps: {
      fullWidth: true,
      type: "number",
    },
    rules: {
      pattern: {
        value: REGEX_PATTERNS.NUMERIC, // Allows only positive numbers (non-negative integers)
        message: "Number of employees must be a positive numeric value",
      },
    },
  },
  {
    key: "website",
    name: "website",
    label: "Company website",
    type: "text",
    gridColumn: 5,
    rules: {
      pattern: {
        value: REGEX_PATTERNS.URL,
        message: "Invalid website URL",
      },
    },
    componentProps: {
      fullWidth: true,
      type: "url",
      leftIconUrl: websiteIcon,
    },
    // disabledInEditMode: true,
  },
  {
    key: "sourceTypeLid",
    name: "sourceTypeLid",
    label: "Source type",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("COMPANY_SOURCE_TYPE"),
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
    key: "sentimentLid",
    name: "sentimentLid",
    label: "Sentiment",
    type: "select",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("SENTIMENT_TYPE"),
    },
  },
  {
    key: "leadCrm",
    name: "leadCrm",
    label: "Lead CRM",
    type: "selectFieldByApi",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.usersListInEmployee,
      utilityFunction: leadCrmUtilityFunc,
      utilityDependent: "accountManager",
      customParams: {
        searchBy: "firstName",
        sortBy: "firstName",
        sortOrder: "ASC",
      },
    },
    rules: {
      required: { value: true, message: "Lead CRM is required" },
    },
  },
  {
    key: "accountManager",
    name: "accountManager",
    label: "Account manager",
    type: "selectFieldByApi",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.usersListInEmployee,
      utilityFunction: accountManagerUtilityFunc,
      utilityDependent: "leadCrm",
      customParams: {
        searchBy: "firstName",
        sortBy: "firstName",
        sortOrder: "ASC",
      },
    },
  },
  {
    key: "associateCrmId",
    name: "associateCrmId",
    label: "Associate",
    type: "selectFieldByApi",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.usersListInEmployee,
      utilityFunction: accountManagerUtilityFunc,
      customParams: {
        searchBy: "firstName",
        sortBy: "firstName",
        sortOrder: "ASC",
      },
    },
  },
  {
    key: "countryId",
    name: "countryId",
    label: "Country",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.countriesList,
      utilityFunction: (data) => addressesUtilityFunction(data),
    },
    disabled: userData?.country?.id ? true : false,
  },
  {
    key: "status",
    name: "status",
    label: "Status",
    type: "select",
    gridColumn: 5,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("COMPANY_STATUS"),
    },
    disabled: isCompanyStatusDisabled ?? false,
  },
];

export const initialCompanyDetails = (
  userData: any,
  groupCompanyIdNo: number,
  companyStatusActive: number
) => ({
  companyName: "",
  displayName: "",
  companyTypeLid: "",
  industrySegmentLid: "",
  groupCompanyLid: groupCompanyIdNo,
  noOfEmployees: "",
  website: "",
  priorityLid: "",
  remarks: "",
  source: "",
  leadCrm: userData?.userId || "",
  accountManager: "",
  associateCrmId: "",
  countryId: userData?.country?.id || "",
  parentCompanyLid: "",
  status: companyStatusActive,
});

export const regulatoryFields: FormFieldConfig[] = [
  {
    key: "registrationNo",
    name: "registrationNo",
    label: "Registration number",
    localizationKey: "registration_number",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    // rules: {
    //   pattern: {
    //     value: REGEX_PATTERNS.REGISTRATION_NUMBER,
    //     message:
    //       "Accepted format for this field is:(e.g., U12345AB1234PLC123456)",
    //   },
    // },
    textTransform: "uppercase",
  },
  {
    key: "tanNumber",
    name: "tanNumber",
    label: "TAN number",
    localizationKey: "tan_number",
    type: "text",
    gridColumn: 5,
    // rules: {
    //   pattern: {
    //     value: REGEX_PATTERNS.TAN_NUMBER,
    //     message: "Accepted format for this field is:(e.g., ABCD12345E)",
    //   },
    // },
    componentProps: { fullWidth: true },
    textTransform: "uppercase",
  },

  {
    key: "panCardNumber",
    name: "panCardNumber",
    label: "PAN card number",
    localizationKey: "pan_number",
    type: "text",
    gridColumn: 5,
    // rules: {
    //   pattern: {
    //     value: REGEX_PATTERNS.PAN_CARD,
    //     message: "Accepted format for this field is:(e.g., ABCDE1234F)",
    //   },
    // },
    componentProps: {
      fullWidth: true,
      inputProps: {
        maxLength: 10,
      },
    },
    textTransform: "uppercase",
  },
  {
    key: "serviceTax",
    name: "serviceTax",
    label: "Service tax",
    localizationKey: "service_tax",
    type: "text",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    textTransform: "uppercase",
  },
  {
    key: "dateOfIncorporation",
    name: "dateOfIncorporation",
    label: "Date of incorporation",
    localizationKey: "incorporation_date",
    type: "date",
    gridColumn: 5,
    rules: {
      validate: {
        notFutureDate: (value: string) => {
          if (!value) return true;

          const selectedDate = new Date(value);
          const today = new Date();
          today.setDate(today.getDate() - 1);

          return selectedDate <= today
            ? true
            : "Date of Incorporation cannot be in the future";
        },
      },
    },
    componentProps: {
      maxDate: dayjs().subtract(1, "day"), // Disables today and future dates
    },
  },
  {
    key: "currencyId",
    name: "currencyId",
    label: "Currency",
    localizationKey: "currency",
    type: "select",
    gridColumn: 5,
    disabled: true,
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.masterDataByName("currency"),
      utilityFunction: masterCurrencyDataUtilityFunction,
    },
  },
  {
    key: "annualPremium",
    name: "annualPremium",
    label: "Annual premium",
    localizationKey: "annual_premium",
    type: "currency",
    formatNumber: true,
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
      type: "number",
      leftIconUrl: rupeeIcon,
    },
    apiDependencies: {
      dependentField: "currencyId",
      endPoint: endPoints.masterDataByName("currency"),
      utilityFunction: masterCurrencyDataUtilityFunction,
    },
  },
];

export const initialRegulatoryDetails = (
  userData: any,
  aiGenCompanyDetails: any = {}
) => ({
  dateOfIncorporation: "",
  panCardNumber: aiGenCompanyDetails?.financialInfo?.financialInfo?.pan ?? "",
  registrationNo: "",
  annualPremium: "",
  tanNumber: aiGenCompanyDetails?.financialInfo?.financialInfo?.tan ?? "",
  currencyId: userData?.currency?.id || "",
  serviceTax: "",
});

export const companyProfileFields: FormFieldConfig[] = [
  {
    key: "companyHistory",
    name: "companyHistory",
    label: "Company's history",
    type: "richtext",
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Company History",
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
    gridColumn: 9,
    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
  },
  {
    key: "majorProducts",
    name: "majorProducts",
    label: "Major products",
    type: "richtext",
    componentProps: {
      fullWidth: true,
      placeholder: "Key products the company manufactures or offers",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
    gridColumn: 9,
    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
  },
  {
    key: "keyCustomers",
    name: "keyCustomers",
    label: "Key customers",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Major clients or customers of the company",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "businessProcesses",
    name: "businessProcesses",
    label: "Business processes",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Description of key business processes or operations",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "remarks",
    name: "remarks",
    label: "Remarks",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Additional comments",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
];

export const initialCompanyProfile = {
  companyHistory: "",
  majorProducts: "",
  keyCustomers: "",
  businessProcesses: "",
};

export const salesStrategyFields: FormFieldConfig[] = [
  {
    key: "accountStrategy",
    name: "accountStrategy",
    label: "Why this account?",
    type: "richtext",
    gridColumn: 9,
    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder:
        "Reasons for targeting this specific account, opportunities for business",
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "competitor",
    name: "competitor",
    label: "Our competition",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "For eg - Client. ins co, broker, agent etc",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "targetingReason",
    name: "targetingReason",
    label: "Targeting reason",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Targeting Reason",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },

  {
    key: "weakness",
    name: "weakness",
    label: "Our weaknesses",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "For eg - relationship, information, broker",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "actionPlan",
    name: "actionPlan",
    label: "Action plan",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "industryIntelligenceBtn",
    name: "industryIntelligenceBtn",
    type: "button",
    label: "Industry Intelligence",
    onClick: "fetchIndustryIntelligence",
    gridColumn: 9,
    componentProps: {
      variantType: "primary",
      maxWidth: "180px",
      sx: { ml: "auto", display: "block" },
    },
  },
  {
    key: "potentialOpportunity",
    name: "potentialOpportunity",
    label: "Potential opportunities",
    type: "richtext",
    gridColumn: 9,
    defaultValue: `
  <p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Employee Benefits Solutions </strong> &nbsp; </p>   
  <br>  
  <p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Cyber and Data Protection Insurance </strong> &nbsp;</p> 
  <br>
  <p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Liability Insurance </strong> &nbsp;</p>
`,

    componentProps: {
      fullWidth: true,
      multiline: true,
      rows: 3,
    },
    disabled: true,
    // disabledInEditMode: true, Todo
  },
  {
    key: "industryIntelligence",
    name: "industryIntelligence",
    label: "Industry intelligence",
    type: "richtext",
    gridColumn: 9,
    disabled: true,
    defaultValue: `<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Market Overview </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Key Growth Drivers </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Competitive Landscape </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Technology Trends </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Emerging Risks -</strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Risk Forecast (1-2 Years) </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Risk Forecast (3-5 Years) </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Mitigation Recommendations </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Regulatory Environment </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Risk Factors </strong>&nbsp; </p><p><br></p>
<p><strong style="color: rgb(0, 71, 178); font-size: 18px;">Future Outlook </strong>&nbsp; </p><p><br></p>`,
  },
  {
    key: "salesPitch",
    name: "salesPitch",
    label: "Sales pitch",
    type: "richtext",
    gridColumn: 9,
    defaultValue: `
  <p>
    <strong style="color: rgb(0, 71, 178); font-size: 18px;">Sales Pitch </strong> &nbsp; 
  </p><br>
    
  <p>
    <strong style="color: rgb(0, 71, 178); font-size: 18px;">Positioning </strong> &nbsp; 
  </p><br>
`,
    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
];

export const initialSalesStrategy = {
  accountStrategy: "",
  salesPitch: "",
  competitor: "",
  weakness: "",
  actionPlan: "",
  potentialOpportunity: "",
  industryIntelligence: "",
};

export const serviceStrategyFields: FormFieldConfig[] = [
  {
    key: "servicePlan",
    name: "servicePlan",
    label: "Our service plan",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
    // disabledInEditMode: true,
  },
  {
    key: "acquisitionHistory",
    name: "acquisitionHistory",
    label: "Client acquisition history and current dynamics",
    type: "richtext",
    gridColumn: 9,

    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "bizProfile",
    name: "bizProfile",
    label: "Current business profile",
    type: "richtext",
    gridColumn: 9,
    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Tracking-Clients-Biz-growth",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
  {
    key: "servicePerformance",
    name: "servicePerformance",
    label: "Our service performance",
    type: "richtext",
    gridColumn: 9,
    rules: {
      validate: (value) =>
        validateRichTextLimit(value, RICH_TEXT_LIMIT, RICH_TEXT_LIMIT_ERROR),
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter Service Performance",
      multiline: true,
      rows: 3,
      showCharCountLimit: RICH_TEXT_LIMIT,
    },
  },
];

export const initialServiceStrategy = {
  servicePlan: "",
  acquisitionHistory: "",
  bizProfile: "",
  servicePerformance: "",
};

const baseSteps: Step[] = [
  { id: "basic", label: "Basic", status: "default" },
  {
    id: "regulatory",
    label: "KYC",
    message: "Let’s build your profile",
    status: "default",
  },
  {
    id: "profile",
    label: "Profile",
    message: "You’re almost there! Great going!",
    status: "default",
  },
  {
    id: "strategy",
    label: "Strategy",
    message: "Last few to go!",
    status: "default",
  },
];

export const steps: Step[] = baseSteps;

export const getCompanyDetailsBreadcrumbs = (displayName?: string) => [
  { label: "Manage company", path: "/companies" },
  { label: displayName || "Add company details" },
];

const sectionMap: { [label: string]: any } = {
  "Market Overview": "marketOverview",
  "Key Growth Drivers": "keyGrowthDrivers",
  "Competitive Landscape": "competitiveLandscape",
  "Technology Trends": "technologyTrends",
  "Emerging Risks": "insurableRisksHighPriority",
  "Risk Forecast (1-2 Years)": "riskForecast1to2Years",
  "Risk Forecast (3-5 Years)": "riskForecast3to5Years",
  "Mitigation Recommendations": "riskMitigationRecommendations",
  "Regulatory Environment": "regulatoryEnvironment",
  "Risk Factors": "riskFactors",
  "Future Outlook": "futureOutlook",
};

export function generateIndustryIntelligenceHTML(
  industryData: Record<string, string | undefined>
) {
  let html = "";

  for (const [label, key] of Object.entries(sectionMap)) {
    const content = industryData?.[key] || "<br>";
    html += `
      <p>
        <strong style="color: rgb(0, 71, 178); font-size: 18px;">
          ${label} 
        </strong>
      </p>
      <p>${content}</p>
      <br>
    `;
  }

  return html;
}

export function generatePotentialOpportunitiesHTML(
  potentialOpportunities: any[] = []
) {
  if (!Array.isArray(potentialOpportunities)) return "";

  return potentialOpportunities
    ?.map((opportunity) => {
      const {
        opportunityType = "",
        description = "",
        recommendedInsurances = [],
        valueProposition = [],
      } = opportunity;

      return `
        <p>
        <strong style="color: rgb(0, 71, 178); font-size: 18px;">
         ${opportunityType} 
        </strong>
        </p>
        <p>${description}</p>
        ${
          recommendedInsurances.length
            ? `<p><strong>Recommended Insurances:</strong> ${recommendedInsurances.join(
                ", "
              )}</p>`
            : ""
        }
        ${
          valueProposition.length
            ? `<p><strong>Value Proposition:</strong> ${valueProposition.join(
                ", "
              )}</p>`
            : ""
        }
        <br>
      `;
    })
    .join("\n");
}

export function generateSalesPitchDataHTML(salesPitchData: {
  salesPitch?: string[];
  positioning?: string[];
}): string {
  if (!salesPitchData || typeof salesPitchData !== "object") {
    return `
      <p>
        <strong style="color: rgb(0, 71, 178); font-size: 18px;">Sales Pitch</strong>
      </p>
      <br>
      <p>
        <strong style="color: rgb(0, 71, 178); font-size: 18px;">Positioning</strong>
      </p>
      <br>
    `;
  }

  const { salesPitch = [], positioning = [] } = salesPitchData;

  // Generate Sales Pitch section
  const salesPitchContent =
    Array.isArray(salesPitch) && salesPitch.length > 0
      ? salesPitch.map((pitch) => `<p>• ${pitch?.trim() || ""}</p>`).join("\n")
      : "<p>No sales pitch data available</p>";

  // Generate Positioning section
  const positioningContent =
    Array.isArray(positioning) && positioning.length > 0
      ? positioning
          .map((position) => `<p>• ${position?.trim() || ""}</p>`)
          .join("\n")
      : "<p>No positioning data available</p>";

  return `
    <p>
      <strong style="color: rgb(0, 71, 178); font-size: 18px;">Sales Pitch</strong>
    </p>
    ${salesPitchContent}
    <br>
    <p>
      <strong style="color: rgb(0, 71, 178); font-size: 18px;">Positioning</strong>
    </p>
    ${positioningContent}
    <br>
  `;
}
