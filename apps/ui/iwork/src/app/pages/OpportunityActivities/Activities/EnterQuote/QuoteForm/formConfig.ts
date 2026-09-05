import {
  endPoints,
  getTextFromHtml,
  limitPercentageDecimals,
  prefferredInsurersListUtilityFunction,
  prefferredInsurersLocationsUtilityFunction,
  REGEX_PATTERNS,
} from "@ui/ui-lib";
import { getCountrySpecificConfig } from "../Constants/countryConfigUtils";
import { makeEnterQuoteChangeSets } from "../../LocalizationConfigs/EnterQuoteChangeSetGenerator.js";
import { buildConfigV2 } from "../../ActivitiesConfigs/LocalizationConfigParser";

type QuoteConfigParams = {
  companyId?: string;
  opportunityId?: string | number;
};

export const displayBasicDetails = [
  { label: "Created on", key: "createdOn" },
  { label: "Sum insured", key: "sumInsured" },
  { label: "Policy From & To", key: "policyFromTo" },
];

export const quoteDetailsConfig = [
  { label: "Selected insurer", key: "insurerName" },
  { label: "Quote received on", key: "formData.quoteDetails.quoteReceivedOn" },
  { label: "Basic premium", key: "formData.quoteDetails.basicPremium" },
  { label: "Terrorism", key: "formData.quoteDetails.terrorism" },
  { label: "Net premium", key: "formData.quoteDetails.netPremium" },
  { label: "Brokerage", key: "formData.quoteDetails.basicBrokeragePercentage" },
];

const percentageFieldComponentProps = {
  fullWidth: true,
  type: "number",
  inputProps: {
    onInput: limitPercentageDecimals,
  },
};

//Duplicating the config for sri lankan users and need to refactor in the future

export const getQuoteVersionConfig = ({
  companyId,
  opportunityId,
}: QuoteConfigParams = {}) => [
  {
    key: "quoteDetails",
    config: [
      {
        key: "insurerId",
        name: "insurerId",
        label: "Select Insurer",
        type: "selectFieldByApi",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Select Insurer",
        },
        rules: {
          required: { value: true, message: "Insurer type is required" },
        },
        apiDependencies: {
          endPoint: "#endPoints.insurersList",
          utilityFunction: "#insurerListUtilityFunction",
          customParams: { searchBy: "insurerName" },
          clearFieldsOnChange: ["insurerLocationId"],
        },
        activityOrder: 1,
      },
      {
        key: "insurerLocationId",
        name: "insurerLocationId",
        label: "Select Insurer Location",
        type: "selectFieldByApi",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Select Insurer Location",
        },
        rules: {
          required: { value: true, message: "Insurer location is required" },
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerLocationsById",
          utilityFunction: "#getLocationOptionsByEntityName",
          dependentField: "insurerId",
        },
        activityOrder: 2,
      },
      {
        key: "quoteReceivedOn",
        name: "quoteReceivedOn",
        label: "Quote Received On",
        type: "date",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        rules: {
          required: { value: true, message: "Quote received date is required" },
        },
        activityOrder: 3,
      },
      {
        key: "basicPremium",
        name: "basicPremium",
        label: "Basic premium",
        isDecimal: true,
        type: "number",
        formatNumber: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          pattern: {
            value: REGEX_PATTERNS.NUMERIC,
            message: "Basic premium must be a positive numeric value",
          },
          required: {
            value: true,
            message: "Basic premium is required",
          },
        },
        activityOrder: 4,
      },
      {
        key: "terrorism",
        name: "terrorism",
        label: "Terrorism",
        type: "number",
        isDecimal: true,
        formatNumber: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        activityOrder: 5,
      },
      {
        key: "netPremium",
        name: "netPremium",
        label: "Net premium",
        isDecimal: true,
        type: "number",
        formatNumber: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          pattern: {
            value: REGEX_PATTERNS.NUMERIC,
            message: "Net premium must be a positive numeric value",
          },
        },
        activityOrder: 6,
      },
      {
        key: "basicBrokeragePercentage",
        name: "basicBrokeragePercentage",
        label: "Brokerage percentage",
        type: "number",
        isDecimal: true,
        gridColumn: 5,
        componentProps: percentageFieldComponentProps,
        rules: {
          required: {
            value: true,
            message: "Brokerage percentage is required",
          },
          min: {
            value: 0,
            message: "Brokerage percentage cannot be negative",
          },
          max: {
            value: 100,
            message: "Brokerage percentage cannot exceed 100",
          },
        },
        activityOrder: 7,
      },
      {
        key: "basicBrokerageAmount",
        name: "basicBrokerageAmount",
        type: "number",
        isDecimal: true,
        label: "Brokerage amount",
        rules: {
          required: {
            value: true,
            message: "Brokerage amount is required",
          },
        },
        gridColumn: 5,
        formatNumber: true,
        componentProps: {
          type: "number",
          fullWidth: true,
        },
        activityOrder: 8,
      },
      {
        key: "gstPercentage",
        name: "gstPercentage",
        label: "GST percentage",
        type: "number",
        isDecimal: true,
        gridColumn: 5,
        componentProps: percentageFieldComponentProps,
        rules: {
          min: {
            value: 0,
            message: "GST percentage cannot be negative",
          },
          max: {
            value: 100,
            message: "GST percentage cannot exceed 100",
          },
          required: {
            value: true,
            message: "GST percentage is required",
          },
        },
        activityOrder: 9,
      },
      {
        key: "gstAmount",
        name: "gstAmount",
        label: "GST Amount",
        type: "number",
        isDecimal: true,
        formatNumber: true,
        gridColumn: 5,
        disable: true,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          pattern: {
            value: REGEX_PATTERNS.NUMERIC,
            message: "GST must be a positive numeric value",
          },
          required: {
            value: true,
            message: "GST is required",
          },
        },
        activityOrder: 10,
      },
    ],
    defaultValues: {
      totalBrokerageAmount: 0,
      srccPercentage: 0,
      srccBrokerageAmount: 0,
      terrorismBrokeragePercentage: 0,
      tcBrokerageAmount: 0,
      basicBrokerageAmount: 0,
      gstPercentage: 0,
      gstAmount: 0,
    },
  },
  {
    key: "netPremiumDetails",
    config: [
      {
        key: "insurerRemarks",
        name: "insurerRemarks",
        label: "Insurer's remarks",
        type: "textarea",
        rules: {
          validate: (value) => {
            const plainText = getTextFromHtml(value || "");
            return (
              plainText.length <= 1000 || "Text must be within 1000 characters."
            );
          },
        },
        componentProps: {
          fullWidth: true,
          placeholder: "",
          multiline: true,
          rows: 3,
        },
        gridColumn: 9,
        activityOrder: 10,
      },
    ],
  },
  // {
  //   key: "documents",
  //   title: "Document Upload",
  //   config: [
  //     {
  //       key: "documents",
  //       name: "documents",
  //       label: "Documents",
  //       type: "documentupload",
  //       companyId: "#${companyId}",
  //       gridColumn: 9,
  //       componentProps: {
  //         fullWidth: true,
  //         companyType: "opportunity",
  //       },
  //     },
  //   ],
  //   defaultValues: [
  //     {
  //       documentId: null,
  //       documentTypeLid: null,
  //     },
  //   ],
  // },
  {
    key: "covers",
    title: "Basic Covers",
    isCoversRequired: true,
    config: [],
    containerStyles: {
      backgroundColor: "#FAFAFA",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      padding: "16px",
      borderRadius: "8px",
      border: `1px solid #eaeaea`,
    },
    // renderActions: [
    //   {
    //     key: "refreshCovers",
    //     variant: "imageAndText",
    //     image: "#icons.refreshIcon",
    //     text: "Refresh",
    //     onClick: "handleRefresh",
    //   },
    //   {
    //     key: "compareCovers",
    //     variant: "imageAndText",
    //     image: "#icons.compareIcon",
    //     text: "Compare",
    //     onClick: "handleCompareCovers",
    //   },
    // ],
  },
];
export const getQuoteVersionConfigLanka = ({
  companyId,
  opportunityId,
}: QuoteConfigParams = {}) => [
  {
    key: "quoteDetails",
    config: [
      {
        key: "insurerId",
        name: "insurerId",
        label: "Select Insurer",
        type: "selectFieldByApi",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Select Insurer",
        },
        rules: {
          required: { value: true, message: "Insurer type is required" },
        },
        apiDependencies: {
          endPoint: "#endPoints.insurersList",
          utilityFunction: "#insurerListUtilityFunction",
          customParams: { searchBy: "insurerName" },
          clearFieldsOnChange: ["insurerLocationId"],
        },
        activityOrder: 1,
      },
      {
        key: "insurerLocationId",
        name: "insurerLocationId",
        label: "Select Insurer Location",
        type: "selectFieldByApi",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          placeholder: "Select Insurer Location",
        },
        rules: {
          required: { value: true, message: "Insurer location is required" },
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerLocationsById",
          utilityFunction: "#getLocationOptionsByEntityName",
          dependentField: "insurerId",
        },
        activityOrder: 2,
      },
      {
        key: "quoteReceivedOn",
        name: "quoteReceivedOn",
        label: "Quote Received On",
        type: "date",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        rules: {
          required: { value: true, message: "Quote received date is required" },
        },
        activityOrder: 3,
      },
      {
        key: "basicPremium",
        name: "basicPremium",
        label: "Basic premium",
        isDecimal: true,
        type: "number",
        formatNumber: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          pattern: {
            value: REGEX_PATTERNS.NUMERIC,
            message: "Basic premium amount must be a positive numeric value",
          },
          required: {
            value: true,
            message: "Basic premium amount is required",
          },
        },
        activityOrder: 4,
      },
      {
        key: "srccAmount",
        name: "srccAmount",
        label: "SRCC premium amount",
        isDecimal: true,
        type: "number",
        formatNumber: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          pattern: {
            value: REGEX_PATTERNS.NUMERIC,
            message: "SRCC premium amount must be a positive numeric value",
          },
          required: {
            value: true,
            message: "SRCC premium amount is required",
          },
        },
        activityOrder: 5,
      },
      {
        key: "terrorism",
        name: "terrorism",
        label: "TC premium amount",
        isDecimal: true,
        type: "number",
        formatNumber: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        activityOrder: 6,
      },
      {
        key: "netPremium",
        name: "netPremium",
        label: "Total Net Premium",
        isDecimal: true,
        type: "number",
        formatNumber: true,
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          pattern: {
            value: REGEX_PATTERNS.NUMERIC,
            message: "Total Net Premium must be a positive numeric value",
          },
        },
        activityOrder: 7,
      },
      {
        key: "adminCharges",
        name: "adminCharges",
        label: "Admin Charges",
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
            message: "Admin Charges must be a positive numeric value",
          },
          required: {
            value: true,
            message: "Admin Charges is required",
          },
        },
        activityOrder: 8,
      },
      {
        key: "other",
        name: "other",
        label: "Stamp duty",
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
            message: "Stamp duty must be a positive numeric value",
          },
          required: {
            value: true,
            message: "Stamp duty is required",
          },
        },
        activityOrder: 9,
      },
      {
        key: "cessAmount",
        name: "cessAmount",
        label: "cess",
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
            message: "cess amount must be a positive numeric value",
          },
          required: {
            value: true,
            message: "cess amount is required",
          },
        },
        activityOrder: 10,
      },
      {
        key: "fee",
        name: "fee",
        label: "Policy Fee",
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
            message: "Policy Fee must be a positive numeric value",
          },
          required: {
            value: true,
            message: "Policy Fee is required",
          },
        },
        activityOrder: 13,
      },
      {
        key: "gstPercentage",
        name: "gstPercentage",
        label: "VAT percentage",
        type: "number",
        isDecimal: true,
        gridColumn: 5,
        componentProps: percentageFieldComponentProps,
        rules: {
          min: {
            value: 0,
            message: "VAT percentage cannot be negative",
          },
          max: {
            value: 100,
            message: "VAT percentage cannot exceed 100",
          },
          required: {
            value: true,
            message: "VAT percentage is required",
          },
        },
        activityOrder: 11,
      },
      {
        key: "gstAmount",
        name: "gstAmount",
        label: "VAT",
        type: "number",
        isDecimal: true,
        formatNumber: true,
        gridColumn: 5,
        disable: true,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        rules: {
          pattern: {
            value: REGEX_PATTERNS.NUMERIC,
            message: "VAT must be a positive numeric value",
          },
          required: {
            value: true,
            message: "VAT is required",
          },
        },
        activityOrder: 12,
      },
      {
        key: "totalGrossPremiumIncTaxCharges",
        name: "totalGrossPremiumIncTaxCharges",
        label: "Total gross premium including tax & other charges",
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
            message:
              "Total gross premium including tax & other charges must be a positive numeric value",
          },
          required: {
            value: true,
            message:
              "Total gross premium including tax & other charges is required",
          },
        },
        activityOrder: 14,
      },
      {
        key: "basicBrokeragePercentage",
        name: "basicBrokeragePercentage",
        label: "Basic brokerage percentage",
        type: "number",
        isDecimal: true,
        gridColumn: 5,
        componentProps: percentageFieldComponentProps,
        rules: {
          min: {
            value: 0,
            message: "Basic brokerage percentage cannot be negative",
          },
          max: {
            value: 100,
            message: "Basic brokerage percentage cannot exceed 100",
          },
          required: {
            value: true,
            message: "Basic brokerage percentage is required",
          },
        },
        activityOrder: 15,
      },
      {
        key: "srccPercentage",
        name: "srccPercentage",
        label: "SRCC brokerage percentage",
        type: "number",
        isDecimal: true,
        gridColumn: 5,
        componentProps: percentageFieldComponentProps,
        rules: {
          min: {
            value: 0,
            message: "SRCC brokerage percentage cannot be negative",
          },
          max: {
            value: 100,
            message: "SRCC brokerage percentage cannot exceed 100",
          },
          required: {
            value: true,
            message: "SRCC brokerage percentage is required",
          },
        },
        activityOrder: 16,
      },
      {
        key: "terrorismBrokeragePercentage",
        name: "terrorismBrokeragePercentage",
        label: "TC brokerage percentage",
        type: "number",
        isDecimal: true,
        gridColumn: 5,
        componentProps: percentageFieldComponentProps,
        rules: {
          min: {
            value: 0,
            message: "TC brokerage percentage cannot be negative",
          },
          max: {
            value: 100,
            message: "TC brokerage percentage cannot exceed 100",
          },
          required: {
            value: true,
            message: "TC brokerage percentage is required",
          },
        },
        activityOrder: 17,
      },
      {
        key: "basicBrokerageAmount",
        name: "basicBrokerageAmount",
        type: "number",
        isDecimal: true,
        label: "Basic brokerage amount",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          type: "number",
        },
        formatNumber: true,
        disable: true,
        activityOrder: 18,
      },
      {
        key: "srccBrokerageAmount",
        name: "srccBrokerageAmount",
        type: "number",
        isDecimal: true,
        label: "SRCC brokerage amount",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        formatNumber: true,
        disable: true,
        activityOrder: 19,
      },
      {
        key: "tcBrokerageAmount",
        name: "tcBrokerageAmount",
        type: "number",
        isDecimal: true,
        label: "TC brokerage amount",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        formatNumber: true,
        disable: true,
        activityOrder: 20,
      },
      {
        key: "brokerageAmount",
        name: "brokerageAmount",
        type: "number",
        isDecimal: true,
        label: "Total brokerage amount",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        formatNumber: true,
        activityOrder: 21,
      },
      // {
      //   key: "totalNetPremium",
      //   name: "totalNetPremium",
      //   label: "Total Net Premium",
      //   type: "number",
      //   formatNumber: true,
      //   gridColumn: 5,
      //   componentProps: {
      //     fullWidth: true,
      //     type: "number",
      //   },
      //   rules: {
      //     pattern: {
      //       value: REGEX_PATTERNS.NUMERIC,
      //       message: "Total Net Premium must be a positive numeric value",
      //     },
      //     required: {
      //       value: true,
      //       message: "Total Net Premium is required",
      //     },
      //   },
      // },
      // {
      //   key: "totalGrossPremiumIncTax",
      //   name: "totalGrossPremiumIncTax",
      //   label: "Total Gross Premium Including Tax",
      //   type: "number",
      //   formatNumber: true,
      //   disabled: true,
      //   gridColumn: 5,
      //   componentProps: {
      //     fullWidth: true,
      //     type: "number",
      //   },
      //   rules: {
      //     pattern: {
      //       value: REGEX_PATTERNS.NUMERIC,
      //       message:
      //         "Total Gross Premium Including Tax must be a positive numeric value",
      //     },
      //     required: {
      //       value: true,
      //       message: "Total Gross Premium Including Tax is required",
      //     },
      //   },
      // },
      // {
      //   key: "feePercentage",
      //   name: "feePercentage",
      //   label: "Policy Fee percentage",
      //   type: "number",
      //   isDecimal: true,
      //   gridColumn: 5,
      //   componentProps: {
      //     fullWidth: true,
      //     type: "number",
      //   },
      //   rules: {
      //     min: {
      //       value: 0,
      //       message: "Policy Fee percentage cannot be negative",
      //     },
      //     max: {
      //       value: 100,
      //       message: "Policy Fee percentage cannot exceed 100",
      //     },
      //     required: {
      //       value: true,
      //       message: "Policy Fee percentage is required",
      //     },
      //   },
      // },
      // {
      //   key: "otherPercentage",
      //   name: "otherPercentage",
      //   label: "Stamp Duty percentage",
      //   type: "number",
      //   isDecimal: true,
      //   gridColumn: 5,
      //   componentProps: {
      //     fullWidth: true,
      //     type: "number",
      //   },
      //   rules: {
      //     min: {
      //       value: 0,
      //       message: "Other percentage cannot be negative",
      //     },
      //     max: {
      //       value: 100,
      //       message: "Other percentage cannot exceed 100",
      //     },
      //     required: {
      //       value: true,
      //       message: "Other percentage is required",
      //     },
      //   },
      // },
      // {
      //   key: "adminChargesPercentage",
      //   name: "adminChargesPercentage",
      //   label: "Admin Charges percentage",
      //   type: "number",
      //   isDecimal: true,
      //   gridColumn: 5,
      //   componentProps: {
      //     fullWidth: true,
      //     type: "number",
      //   },
      //   rules: {
      //     min: {
      //       value: 0,
      //       message: "Admin Charges percentage cannot be negative",
      //     },
      //     max: {
      //       value: 100,
      //       message: "Admin Charges percentage cannot exceed 100",
      //     },
      //     required: {
      //       value: true,
      //       message: "Admin Charges percentage is required",
      //     },
      //   },
      // },
      // {
      //   key: "cessPercentage",
      //   name: "cessPercentage",
      //   label: "cess percentage",
      //   type: "number",
      //   isDecimal: true,
      //   gridColumn: 5,
      //   componentProps: {
      //     fullWidth: true,
      //     type: "number",
      //   },
      //   rules: {
      //     min: {
      //       value: 0,
      //       message: "cess percentage cannot be negative",
      //     },
      //     max: {
      //       value: 100,
      //       message: "cess percentage cannot exceed 100",
      //     },
      //     required: {
      //       value: true,
      //       message: "cess percentage is required",
      //     },
      //   },
      // },
      // {
      //   key: "brokeragePercent",
      //   name: "brokeragePercent",
      //   label: "Brokerage Percentage",
      //   type: "number",
      //   isDecimal: true,
      //   gridColumn: 5,
      //   componentProps: {
      //     fullWidth: true,
      //     type: "number",
      //   },
      //   rules: {
      //     required: {
      //       value: true,
      //       message: "Brokerage percentage is required",
      //     },
      //     min: {
      //       value: 0,
      //       message: "Brokerage percentage cannot be negative",
      //     },
      //     max: {
      //       value: 100,
      //       message: "Brokerage percentage cannot exceed 100",
      //     },
      //   },
      // },
      // {
      //   key: "terrorismCover",
      //   name: "terrorismCover",
      //   label: "TC Amount",
      //   type: "number",
      //   gridColumn: 5,
      //   componentProps: {
      //     fullWidth: true,
      //     type: "number",
      //   },
      // },
    ],
  },
  // {
  //   key: "taxDetails",
  //   title: "Tax Details",
  //   isMultiple: true,
  //   config: [
  //     {
  //       key: "tax",
  //       name: "tax",
  //       label: "Tax",
  //       type: "select",
  //       gridColumn: 5,
  //       componentProps: {
  //         fullWidth: true,
  //       },
  //       apiDependencies: {
  //         endPoint: endPoints.lookUpByName("SL_TAX"),
  //       },
  //       rules: {
  //         required: { value: true, message: "Tax is required" },
  //       },
  //     },
  //     {
  //       key: "taxValue",
  //       name: "taxValue",
  //       label: "Tax Value",
  //       type: "number",
  //       formatNumber: true,
  //       gridColumn: 5,
  //       componentProps: {
  //         fullWidth: true,
  //         type: "number",
  //       },
  //       rules: {
  //         pattern: {
  //           value: REGEX_PATTERNS.NUMERIC,
  //           message: "Tax value must be a positive numeric value",
  //         },
  //         required: { value: true, message: "Tax value is required" },
  //       },
  //     },
  //   ],
  //   defaultValues: [
  //     {
  //       tax: null,
  //       taxValue: null,
  //     },
  //   ],
  // },
  {
    key: "netPremiumDetails",
    config: [
      {
        key: "insurerRemarks",
        name: "insurerRemarks",
        label: "Insurer's remarks",
        type: "textarea",
        rules: {
          validate: (value) => {
            const plainText = getTextFromHtml(value || "");
            return (
              plainText.length <= 1000 || "Text must be within 1000 characters."
            );
          },
        },
        componentProps: {
          fullWidth: true,
          placeholder: "",
          multiline: true,
          rows: 3,
        },
        gridColumn: 9,
        activityOrder: 22,
      },
    ],
  },
  // {
  //   key: "documents",
  //   title: "Document Upload",
  //   config: [
  //     {
  //       key: "documents",
  //       name: "documents",
  //       label: "Documents",
  //       type: "documentupload",
  //       companyId: "#${companyId}",
  //       gridColumn: 9,
  //       componentProps: {
  //         fullWidth: true,
  //         companyType: "opportunity",
  //       },
  //     },
  //   ],
  //   defaultValues: [
  //     {
  //       documentId: null,
  //       documentTypeLid: null,
  //     },
  //   ],
  // },
  {
    key: "covers",
    title: "Basic Covers",
    isCoversRequired: true,
    config: [],
    containerStyles: {
      backgroundColor: "#FAFAFA",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      padding: "16px",
      borderRadius: "8px",
      border: `1px solid #eaeaea`,
    },
    // renderActions: [
    //   {
    //     key: "refreshCovers",
    //     variant: "imageAndText",
    //     image: "#icons.refreshIcon",
    //     text: "Refresh",
    //     onClick: "handleRefresh",
    //   },
    //   {
    //     key: "compareCovers",
    //     variant: "imageAndText",
    //     image: "#icons.compareIcon",
    //     text: "Compare",
    //     onClick: "handleCompareCovers",
    //   },
    // ],
  },
];
// export const getQuoteVersionConfigLanka = (companyId?: string) => [
//   {
//     key: "quoteDetails",
//     config: [
//       {
//         key: "insurerId",
//         name: "insurerId",
//         label: "Select Insurer",
//         type: "selectFieldByApi",
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           placeholder: "Select Insurer",
//         },
//         rules: {
//           required: { value: true, message: "Insurer type is required" },
//         },
//         apiDependencies: {
//           endPoint: "#endPoints.insurersList",
//           utilityFunction: "#insurerListUtilityFunction",
//           customParams: { searchBy: "insurerName" },
//           clearFieldsOnChange: ["insurerLocationId"],
//         },
//       },
//       {
//         key: "insurerLocationId",
//         name: "insurerLocationId",
//         label: "Select Insurer Location",
//         type: "selectFieldByApi",
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           placeholder: "Select Insurer Location",
//         },
//         rules: {
//           required: { value: true, message: "Insurer location is required" },
//         },
//         apiDependencies: {
//           endPoint: "#endPoints.insurerLocationsById",
//           utilityFunction: "#getLocationOptionsByEntityName",
//           dependentField: "insurerId",
//         },
//       },
//       {
//         key: "quoteReceivedOn",
//         name: "quoteReceivedOn",
//         label: "Quote Received On",
//         type: "date",
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//         },
//         rules: {
//           required: { value: true, message: "Quote received date is required" },
//         },
//       },
//       {
//         key: "basicPremium",
//         name: "basicPremium",
//         label: "Basic premium",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "Basic premium amount must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message: "Basic premium amount is required",
//           },
//         },
//       },
//       {
//         key: "basicPremiumPercentage",
//         name: "basicPremiumPercentage",
//         label: "Basic brokerage percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           min: {
//             value: 0,
//             message: "Basic brokerage percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "Basic brokerage percentage cannot exceed 100",
//           },
//           required: {
//             value: true,
//             message: "Basic brokerage percentage is required",
//           },
//         },
//       },
//       {
//         key: "srccAmount",
//         name: "srccAmount",
//         label: "SRCC premium amount",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "SRCC premium amount must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message: "SRCC premium amount is required",
//           },
//         },
//       },
//       {
//         key: "srccPercentage",
//         name: "srccPercentage",
//         label: "SRCC brokerage percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           min: {
//             value: 0,
//             message: "SRCC brokerage percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "SRCC brokerage percentage cannot exceed 100",
//           },
//           required: {
//             value: true,
//             message: "SRCC brokerage percentage is required",
//           },
//         },
//       },
//       {
//         key: "terrorismCover",
//         name: "terrorismCover",
//         label: "TC premium amount",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//       },
//       {
//         key: "terrorismCoverPercentage",
//         name: "terrorismCoverPercentage",
//         label: "TC brokerage percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           min: {
//             value: 0,
//             message: "TC brokerage percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "TC brokerage percentage cannot exceed 100",
//           },
//           required: {
//             value: true,
//             message: "TC brokerage percentage is required",
//           },
//         },
//       },
//       {
//         key: "tcBrokerageAmount",
//         name: "tcBrokerageAmount",
//         type: "number",
//         label: "TC brokerage amount",
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//         },
//         formatNumber: true,
//       },
//       {
//         key: "basicBrokerageAmount",
//         name: "basicBrokerageAmount",
//         type: "number",
//         label: "Basic brokerage amount",
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//         },
//         formatNumber: true,
//       },
//       {
//         key: "serviceTaxAmount",
//         name: "serviceTaxAmount",
//         label: "Tax",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "Tax must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message: "Tax is required",
//           },
//         },
//       },
//       {
//         key: "serviceTaxPercentage",
//         name: "serviceTaxPercentage",
//         label: "Tax percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           min: {
//             value: 0,
//             message: "Tax percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "Tax percentage cannot exceed 100",
//           },
//           required: {
//             value: true,
//             message: "Tax percentage is required",
//           },
//         },
//       },
//       // {
//       //   key: "totalNetPremium",
//       //   name: "totalNetPremium",
//       //   label: "Total Net Premium",
//       //   type: "number",
//       //   formatNumber: true,
//       //   gridColumn: 5,
//       //   componentProps: {
//       //     fullWidth: true,
//       //     type: "number",
//       //   },
//       //   rules: {
//       //     pattern: {
//       //       value: REGEX_PATTERNS.NUMERIC,
//       //       message: "Total Net Premium must be a positive numeric value",
//       //     },
//       //     required: {
//       //       value: true,
//       //       message: "Total Net Premium is required",
//       //     },
//       //   },
//       // },
//       {
//         key: "totalGrossPremiumIncTax",
//         name: "totalGrossPremiumIncTax",
//         label: "Total Gross Premium Including Tax",
//         type: "number",
//         formatNumber: true,
//         disabled: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message:
//               "Total Gross Premium Including Tax must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message: "Total Gross Premium Including Tax is required",
//           },
//         },
//       },
//       {
//         key: "fee",
//         name: "fee",
//         label: "Policy Fee",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "Policy Fee must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message: "Policy Fee is required",
//           },
//         },
//       },
//       {
//         key: "feePercentage",
//         name: "feePercentage",
//         label: "Policy Fee percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           min: {
//             value: 0,
//             message: "Policy Fee percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "Policy Fee percentage cannot exceed 100",
//           },
//           required: {
//             value: true,
//             message: "Policy Fee percentage is required",
//           },
//         },
//       },
//       {
//         key: "other",
//         name: "other",
//         label: "Stamp duty",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "Stamp duty must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message: "Stamp duty is required",
//           },
//         },
//       },
//       {
//         key: "otherPercentage",
//         name: "otherPercentage",
//         label: "Stamp Duty percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           min: {
//             value: 0,
//             message: "Other percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "Other percentage cannot exceed 100",
//           },
//           required: {
//             value: true,
//             message: "Other percentage is required",
//           },
//         },
//       },
//       {
//         key: "adminCharges",
//         name: "adminCharges",
//         label: "Admin Charges",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "Admin Charges must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message: "Admin Charges is required",
//           },
//         },
//       },
//       {
//         key: "adminChargesPercentage",
//         name: "adminChargesPercentage",
//         label: "Admin Charges percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           min: {
//             value: 0,
//             message: "Admin Charges percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "Admin Charges percentage cannot exceed 100",
//           },
//           required: {
//             value: true,
//             message: "Admin Charges percentage is required",
//           },
//         },
//       },
//       {
//         key: "cessAmount",
//         name: "cessAmount",
//         label: "CESS",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "CESS amount must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message: "CESS amount is required",
//           },
//         },
//       },
//       {
//         key: "cessPercentage",
//         name: "cessPercentage",
//         label: "CESS percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           min: {
//             value: 0,
//             message: "CESS percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "CESS percentage cannot exceed 100",
//           },
//           required: {
//             value: true,
//             message: "CESS percentage is required",
//           },
//         },
//       },
//       {
//         key: "totalGrossPremiumIncTaxCharges",
//         name: "totalGrossPremiumIncTaxCharges",
//         label: "Total gross premium including tax & other charges",
//         type: "number",
//         disabled: true,
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message:
//               "Total gross premium including tax & other charges must be a positive numeric value",
//           },
//           required: {
//             value: true,
//             message:
//               "Total gross premium including tax & other charges is required",
//           },
//         },
//       },
//       // {
//       //   key: "terrorismCover",
//       //   name: "terrorismCover",
//       //   label: "TC Amount",
//       //   type: "number",
//       //   gridColumn: 5,
//       //   componentProps: {
//       //     fullWidth: true,
//       //     type: "number",
//       //   },
//       // },
//     ],
//   },
//   {
//     key: "taxDetails",
//     title: "Tax Details",
//     isMultiple: true,
//     config: [
//       {
//         key: "tax",
//         name: "tax",
//         label: "Tax",
//         type: "select",
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//         },
//         apiDependencies: {
//           endPoint: endPoints.lookUpByName("SL_TAX"),
//         },
//         rules: {
//           required: { value: true, message: "Tax is required" },
//         },
//       },
//       {
//         key: "taxValue",
//         name: "taxValue",
//         label: "Tax Value",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "Tax value must be a positive numeric value",
//           },
//           required: { value: true, message: "Tax value is required" },
//         },
//       },
//     ],
//     defaultValues: [
//       {
//         tax: null,
//         taxValue: null,
//       },
//     ],
//   },
//   {
//     key: "netPremiumDetails",
//     config: [
//       {
//         key: "netPremium",
//         name: "netPremium",
//         label: "Total Net Premium",
//         type: "number",
//         formatNumber: true,
//         gridColumn: 5,
//         disabled: true,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           pattern: {
//             value: REGEX_PATTERNS.NUMERIC,
//             message: "Total Net Premium must be a positive numeric value",
//           },
//         },
//       },
//       {
//         key: "brokeragePercent",
//         name: "brokeragePercent",
//         label: "Brokerage Percentage",
//         type: "number",
//         isDecimal: true,
//         gridColumn: 5,
//         componentProps: {
//           fullWidth: true,
//           type: "number",
//         },
//         rules: {
//           required: {
//             value: true,
//             message: "Brokerage percentage is required",
//           },
//           min: {
//             value: 0,
//             message: "Brokerage percentage cannot be negative",
//           },
//           max: {
//             value: 100,
//             message: "Brokerage percentage cannot exceed 100",
//           },
//         },
//       },
//       {
//         key: "insurerRemarks",
//         name: "insurerRemarks",
//         label: "Insurer's remarks",
//         type: "textarea",
//         rules: {
//           validate: (value) => {
//             const plainText = getTextFromHtml(value || "");
//             return (
//               plainText.length <= 1000 || "Text must be within 1000 characters."
//             );
//           },
//         },
//         componentProps: {
//           fullWidth: true,
//           placeholder: "",
//           multiline: true,
//           rows: 3,
//         },
//         gridColumn: 9,
//       },
//     ],
//   },
//   // {
//   //   key: "documents",
//   //   title: "Document Upload",
//   //   config: [
//   //     {
//   //       key: "documents",
//   //       name: "documents",
//   //       label: "Documents",
//   //       type: "documentupload",
//   //       companyId: "#${companyId}",
//   //       gridColumn: 9,
//   //       componentProps: {
//   //         fullWidth: true,
//   //         companyType: "opportunity",
//   //       },
//   //     },
//   //   ],
//   //   defaultValues: [
//   //     {
//   //       documentId: null,
//   //       documentTypeLid: null,
//   //     },
//   //   ],
//   // },
//   {
//     key: "covers",
//     title: "Basic Covers",
//     isCoversRequired: true,
//     config: [],
//     containerStyles: {
//       backgroundColor: "#FAFAFA",
//       display: "flex",
//       flexDirection: "column",
//       gap: "24px",
//       padding: "16px",
//       borderRadius: "8px",
//       border: `1px solid #eaeaea`,
//     },
//     // renderActions: [
//     //   {
//     //     key: "refreshCovers",
//     //     variant: "imageAndText",
//     //     image: "#icons.refreshIcon",
//     //     text: "Refresh",
//     //     onClick: "handleRefresh",
//     //   },
//     //   {
//     //     key: "compareCovers",
//     //     variant: "imageAndText",
//     //     image: "#icons.compareIcon",
//     //     text: "Compare",
//     //     onClick: "handleCompareCovers",
//     //   },
//     // ],
//   },
// ];

// export const getQuoteVersionConfigByCountry = (companyId?: string) =>
//   getCountrySpecificConfig(getQuoteVersionConfigLanka(companyId), {
//     India: getQuoteVersionConfig(companyId),
//   });

export const getQuoteVersionConfigByCountry = (
  organisationKey: string,
  companyId?: string,
  opportunityId?: string
) => {
  const configV1 = getQuoteVersionConfig(companyId, opportunityId); // ensure this is defined
  const { removedFields, replacedFields, newlyAddedFields } =
    makeEnterQuoteChangeSets(organisationKey);

  const configs = buildConfigV2({
    configV1,
    replacedFields,
    newlyAddedFields,
    removedFields,
  });
  console.log("Quote Version Config V2: ", configs);
  return configs;
};

export const getQuoteActivityConfig = (
  companyId: string,
  opportunityId?: string,
  opportunityActivityId?: string
) => [
  {
    key: "remarksSection",
    config: [
      {
        key: "remarks",
        name: "remarks",
        label: "Remarks",
        type: "textarea",
        gridColumn: 9,
        componentProps: {
          fullWidth: true,
          placeholder: "Remarks...",
          multiline: true,
          rows: 3,
        },
      },
    ],
  },
  {
    key: "mainDocuments",
    config: [
      {
        key: "mainDocuments",
        name: "mainDocuments",
        type: "documentupload",
        label: "Documents",
        companyId: companyId,
        opportunityId,
        opportunityActivityId,
        gridColumn: 9,
        componentProps: {
          isDocumentTypeRequired: true,
          isDocumentRequired: true,
          fullWidth: true,
          companyType: "opportunity",
          formFieldName: "mainDocuments",
        },
      },
    ],
    defaultValues: [{ documentId: null, documentTypeLid: null }],
  },
];
