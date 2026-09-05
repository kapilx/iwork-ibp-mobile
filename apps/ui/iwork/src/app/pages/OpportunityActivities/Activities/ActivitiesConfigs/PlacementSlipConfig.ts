//Duplicating the config for sri lankan users and need to refactor in the future

import { REGEX_PATTERNS } from "@ui/ui-lib";
import { withPercentageClamp } from "@ui/ui-lib/utils";
import { buildInsurerSectionConfigs } from "./sharedInsurerConfig";
import { buildInstallmentSectionConfigs } from "./sharedInstallmentsConfig";
import { validateDateRange } from "@ui/ui-lib/utils/masterUserDataUtility";

const isValueMissing = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

export const placementSlipConfig = (formValues, dyamicvalues) => {
  const isInstallmentRequired =
    formValues?.policyDetails?.isPremiumInstallmentBased ===
    dyamicvalues?.TOGGLE_YES;
  const policyFromDate =
     dyamicvalues?.soCreatedDate;
  const policyToDate =
     dyamicvalues?.expiryDate;
  
  const { leadFields, leadDefaults, insurerDetailsSection } =
    buildInsurerSectionConfigs({
      formValues,
      dynamicValues: dyamicvalues,
      leadSectionKey: "feeDetails",
      detailsSectionKey: "insurerDetails",
      basePremiumPath: "policyDetails.basicPremium",
      brokerageAmountPath: "policyDetails.basicBrokerageAmount",
      totalBrokerageAmountPath: "policyDetails.totalBrokerageAmount",
      runExternalValidatorsOnChange: true,
      additionalCommissions: [
        {
          percentageKey: "terrorismBrokeragePercentage",
          amountKey: "terrorismBrokerageAmount",
          label: "Terrorism brokerage amount",
          sharePercentageKey: "terrorismSharePercentage",
          shareAmountKey: "terrorismShareAmount",
          shareLabel: "Terrorism",
          premiumBasePath: "policyDetails.terrorism",
          policyAmountPath: "policyDetails.tcBrokerageAmount",
          showField: () => {
            const storedUser = window.sessionStorage.getItem("user");
            if (!storedUser) return false;
            try {
              const parsed = JSON.parse(storedUser);
              return parsed?.organisationKey !== "iirm_srilanka";
            } catch (_err) {
              return false;
            }
          },
        },
      ],
    });
  const { installmentSection } = buildInstallmentSectionConfigs({
    formValues,
    isInstallmentRequired,
    policyFromDate,
    policyToDate,
    grossPremiumPath: "policyDetails.grossPremium",
    totalInstallmentAmountPath: "policyDetails.totalInstallmentAmount",
    runExternalValidatorsOnChange: false,
  });

  const isCdAccountRequired =
    formValues?.cdAccountDetails?.paymentTypeLid !==
    dyamicvalues?.PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY;

  const isCdAccountSelected = formValues?.cdAccountDetails?.selectCdAccount;

  return [
    {
      key: "policyDetails",
      title: "Policy details",
      config: [
        {
          key: "policyDates",
          name: "policyDates",
          type: "daterange",
          label: "Policy dates",
          toName: "policyToDate",
          toLabel: "To",
          fromName: "policyFromDate",
          fromLabel: "From",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 1,
          rules: {
            required: {
              value: true,
              message: "Policy dates are required",
            },
            validate: validateDateRange(
              "policyFromDate",
              "policyToDate",
              "From",
              "To"
            ),
          },
        },
        {
          key: "placementSlipDate",
          name: "placementSlipDate",
          type: "date",
          label: "Date of placement slip",
          rules: {
            required: {
              value: true,
              message: "Placement slip date is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 2,
        },
        {
          key: "sumInsured",
          name: "sumInsured",
          type: "number",
          isDecimal: true,
          label: "Sum insured",
          rules: {
            required: {
              value: true,
              message: "Sum insured is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 3,
        },
        {
          key: "basicPremium",
          name: "basicPremium",
          type: "number",
          isDecimal: true,
          label: " Basic premium",
          rules: {
            required: {
              value: true,
              message: "Basic premium is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
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
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Terrorism premium must be a positive numeric value",
            },
          },
          activityOrder: 5,
        },
        {
          key: "netPremium",
          name: "netPremium",
          type: "number",
          isDecimal: true,
          label: "Net premium",
          rules: {
            required: {
              value: true,
              message: "Net premium is required",
            },
          },
          disabled: true,
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 6,
        },
        {
          key: "gstPercentage",
          name: "gstPercentage",
          type: "number",
          label: "GST percentage",
          rules: {
            required: {
              value: true,
              message: "GST percentage is required",
            },
            max: {
              value: 100,
              message: "GST percentage cannot exceed 100",
            },
            min: {
              value: 0,
              message: "GST percentage cannot be negative",
            },
          },
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
          }),
          activityOrder: 7,
        },
        {
          key: "gstAmount",
          name: "gstAmount",
          type: "number",
          label: "GST amount",
          isDecimal: true,
          rules: {
            required: {
              value: true,
              message: "This field is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 8,
        },
        {
          key: "fee",
          name: "fee",
          type: "number",
          isDecimal: true,
          label: "Fee",
          rules: {
            required: {
              value: true,
              message: "Fee is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 9,
        },
        {
          key: "other",
          name: "other",
          type: "number",
          isDecimal: true,
          label: "Other amount",
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 10,
        },
        {
          key: "grossPremium",
          name: "grossPremium",
          type: "number",
          isDecimal: true,
          label: "Gross premium",
          rules: {
            required: {
              value: true,
              message: "Gross premium is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
            disabled: true,
          },
          activityOrder: 11,
        },
        {
          key: "basicBrokeragePercentage",
          name: "basicBrokeragePercentage",
          type: "number",
          label: "Basic brokerage percentage",
          rules: {
            max: {
              value: 100,
              message: "Basic brokerage percentage cannot exceed 100",
            },
            min: {
              value: 0,
              message: "Basic brokerage percentage cannot be negative",
            },
            required: {
              value: true,
              message: "Basic brokerage percentage is required",
            },
          },
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
          }),
          activityOrder: 12,
        },
        {
          key: "terrorismBrokeragePercentage",
          name: "terrorismBrokeragePercentage",
          type: "number",
          label: "Terrorism brokerage percentage",
          rules: {
            max: {
              value: 100,
              message: "Terrorism brokerage percentage cannot exceed 100",
            },
            min: {
              value: 0,
              message: "Terrorism brokerage percentage cannot be negative",
            },
            required: {
              value: true,
              message: "Terrorism brokerage percentage is required",
            },
          },
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
          }),
          activityOrder: 13,
        },
        {
          key: "basicBrokerageAmount",
          name: "basicBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Basic brokerage amount",
          rules: {
            required: {
              value: true,
              message: "Basic brokerage amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 14,
        },
        {
          key: "tcBrokerageAmount",
          name: "tcBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Terrorism brokerage amount",
          rules: {
            required: {
              value: true,
              message: "Terrorism brokerage amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 15,
        },
        {
          key: "totalBrokerageAmount",
          name: "totalBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Total brokerage amount",
          rules: {
            required: {
              value: true,
              message: "Total brokerage amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 16,
        },
        {
          key: "isPremiumInstallmentBased",
          name: "isPremiumInstallmentBased",
          type: "segmentedcontrol",
          label: "Premium is Installment Based",
          rules: {
            required: {
              value: true,
              message: "Premium installment is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            required: true,
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
          },
          activityOrder: 17,
        },
        {
          key: "totalInstallmentAmount",
          name: "totalInstallmentAmount",
          type: "number",
          isDecimal: true,
          label: "Total Installment Amount(Net premium + other amount)",
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
            disabled: true,
          },
          showField: (watch) => {
            const directValue = watch("isPremiumInstallmentBased");
            const nestedValue = watch("policyDetails.isPremiumInstallmentBased");
            return (
              String(directValue ?? nestedValue) ===
              String(dyamicvalues?.TOGGLE_YES)
            );
          },
          activityOrder: 18,
        },
      ],
      defaultValues: {
        sumInsured: null,
        basicPremium: null,
        policyToDate: null,
        policyFromDate: null,
        isPremiumInstallmentBased: dyamicvalues?.TOGGLE_NO ?? null,
        totalInstallmentAmount: null,
      },
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    installmentSection,
    {
      key: "feeDetails",
      config: [
        // {
        //   key: "isFeeInInstallment",
        //   name: "isFeeInInstallment",
        //   type: "segmentedcontrol",
        //   label: "Fee is installment",
        //   rules: {
        //     required: {
        //       value: true,
        //       message: "Fee installment is required",
        //     },
        //   },
        //   gridColumn: 5,
        //   componentProps: {
        //     required: true,
        //     fullWidth: true,
        //   },
        //   apiDependencies: {
        //     endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
        //   },
        //   activityOrder: 20,
        // },
        // {
        //   key: "maxAgeOfDependents",
        //   name: "maxAgeOfDependents",
        //   type: "number",
        //   label: "Max Age of Dependents",
        //   gridColumn: 5,
        //   componentProps: {
        //     fullWidth: true,
        //   },
        // },
        ...leadFields,
      ],
      defaultValues: {
        ...leadDefaults,
      },
    },
    insurerDetailsSection,
    {
      key: "tpaDetails",
      title: "TPA details",
      config: [
        {
          key: "tpaId",
          name: "tpaId",
          type: "selectFieldByApi",
          label: "TPA name",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpasList",
            utilityFunction: "#tpaUtilityFunction",
            clearFieldsOnChange: [
              "tpaLocationId",
              "tpaBranchId",
              "tpaContactId",
            ],
            customParams: { searchBy: "firstName" },
          },
          activityOrder: 21,
        },
        {
          key: "tpaLocationId",
          name: "tpaLocationId",
          type: "select",
          label: "Location",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpaByID",
            dependentField: "tpaId",
            utilityFunction: "#tpaLocationListUtilityFunction",
            clearFieldsOnChange: ["tpaBranchId", "tpaContactId"],
          },
          activityOrder: 22,
        },
        {
          key: "tpaBranchId",
          name: "tpaBranchId",
          type: "select",
          label: "Branch",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpaByID",
            dependentField: "tpaId",
            utilityFunction: "#tpaLocationAddressUtilityFunction",
            clearFieldsOnChange: ["tpaContactId"],
          },
          activityOrder: 23,
        },
        {
          key: "tpaContactId",
          name: "tpaContactId",
          type: "select",
          label: "Contact",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpaContactList",
            dependentField: "tpaId",
            utilityFunction: "#tpaContactPersonUtilityFunction",
          },
          activityOrder: 24,
        },
      ],
      isMultiple: true,
      defaultValues: [
        {
          tpaId: null,
          tpaBranchId: null,
          tpaContactId: null,
          tpaLocationId: null,
        },
      ],
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "cdAccountDetails",
      config: [
        {
          key: "cdAccountNumber",
          type: "title",
          label: "CD Account Details",
          activityOrder: 25,
        },
        {
          key: "paymentTypeLid",
          name: "paymentTypeLid",
          type: "select",
          label: "Payment Type",
          rules: {
            required: {
              value: true,
              message: "Payment type is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`PAYMENT_TOGGLE`)",
            clearFieldsOnChange: [
              "cdAccountTypeLid",
              "selectCdAccount",
              "accountName",
              "openBalance",
              "accountNumber",
              "openBalance",
            ],
          },
          activityOrder: 26,
        },
        {
          key: "transactionTypeLid",
          name: "transactionTypeLid",
          type: "select",
          label: "Transaction mode",
          // showField:
          //   '#(watch) => watch("paymentTypeLid") === ${PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD}',

          rules: {
            required: {
              value: true,
              message: "Transaction mode is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TRANSACTION_TYPE`)",
          },
          activityOrder: 27,
        },
        {
          key: "chequeDate",
          name: "chequeDate",
          type: "date",
          label: "Transaction Date",
          rules: {
            required: {
              value: true,
              message: "Transaction date is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 28,
        },
        {
          key: "chequeAmount",
          name: "chequeAmount",
          type: "number",
          isDecimal: true,
          label: "Transaction Amount",
          rules: {
            required: {
              value: true,
              message: "Transaction amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 29,
        },
        {
          key: "chequeNumber",
          name: "chequeNumber",
          type: "text",
          label: "Transaction/Cheque number",
          rules: {
            required: {
              value: true,
              message: "Transaction/Cheque number is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 30,
        },
        {
          key: "bankName",
          name: "bankName",
          type: "text",
          label: "Bank Name",
          rules: {
            required: "This field is required",
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 31,
        },
        {
          key: "cdAccountTypeLid",
          name: "cdAccountTypeLid",
          type: "segmentedcontrol",
          label: isCdAccountRequired ? "CD Account *" : "CD Account",
          // showField:
          //   '#(watch) => watch("paymentTypeLid") === ${PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD}',
          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "Please select account type.";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`CD_ACCOUNT_TOGGLE`)",
            clearFieldsOnChange: [
              "selectCdAccount",
              "accountName",
              "accountNumber",
              "openBalance",
            ],
          },
          activityOrder: 32,
        },
        {
          key: "selectCdAccount",
          name: "selectCdAccount",
          type: "selectFieldByApi",
          label: isCdAccountRequired
            ? "Select CD Account *"
            : "Select CD Account",
          showField:
            '#(watch) => watch("cdAccountTypeLid") === ${CD_ACCOUNT_TOGGLE_EXISTING}',
          rules: {
            validate:
              '#validateRequiredIfEqual("cdAccountTypeLid", ${CD_ACCOUNT_TOGGLE_EXISTING}, "Please select a CD account.")',
          },
          invokeFunction: "fetchCDDetails",
          apiDependencies: {
            endPoint: "#endPoints.getCdDetailsByCompanyId(companyId)",
            utilityFunction: "#cdDetailsUtilityFunction",
            clearFieldsOnChange: [
              "accountName",
              "accountNumber",
              "openBalance",
              "cdSafeLimit",
            ],
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 33,
        },
                {
          key: "accountNumber",
          name: "accountNumber",
          type: "text",
          label: isCdAccountRequired
            ? "CD Account Number *"
            : "CD Account Number",
          // showField:
          //   '#(watch) => watch("paymentTypeLid") === ${PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD}',

          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "CD account number is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          disabled: isCdAccountSelected,
          activityOrder: 34,
        },
        {
          key: "accountName",
          name: "accountName",
          type: "text",
          label: isCdAccountRequired ? "Account Name *" : "Account Name",
          // showField:
          //   '#(watch) => watch("paymentTypeLid") === ${PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD}',
          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "Account name is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          disabled: isCdAccountSelected,
          activityOrder: 35,
        },
        {
          key: "openBalance",
          name: "openBalance",
          type: "number",
          isDecimal: true,
          label: isCdAccountRequired ? "Open Balance *" : "Open Balance",
          // showField:
          //   '#(watch) => watch("cdAccountTypeLid") === ${CD_ACCOUNT_TOGGLE_EXISTING}',
          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "Balance is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          disabled: isCdAccountSelected,
          activityOrder: 36,
        },
        {
          key: "cdSafeLimit",
          name: "cdSafeLimit",
          type: "number",
          isDecimal: true,
          label: isCdAccountRequired ? "CD Safelimit *" : "CD Safelimit",
          // showField:
          //   '#(watch) => watch("cdAccountTypeLid") === ${CD_ACCOUNT_TOGGLE_EXISTING}',
          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "Safelimit is required";
              }
              return true;
            },
            min: {
              value: 0,
              message: "Basic brokerage percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "Basic brokerage percentage cannot exceed 100",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          disabled: isCdAccountSelected,
          activityOrder: 37,
        },
        {
          key: "cdRemarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 38,
        },
      ],
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "coverDetails",
      title: "Covers Details",
      config: [],
      containerStyles: {
        gap: "24px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
        backgroundColor: "rgb(250,250,250)",
      },
      isCoversRequired: true,
    },
    {
      key: "remarks",
      config: [
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 39,
        },
      ],
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "documents",
      config: [
        {
          key: "documents",
          name: "documents",
          type: "documentupload",
          label: "Documents",
          companyId: "#${companyId}",
          gridColumn: 9,
          componentProps: {
            isDocumentTypeRequired: true,
            isDocumentRequired: true,
            fullWidth: true,
            companyType: "opportunity",
          },
          activityOrder: 40,
        },
      ],
      defaultValues: [
        {
          documentId: null,
          documentTypeLid: null,
        },
      ],
    },
  ];
};

//Duplicating the config for sri lankan users

export const placementSlipConfigLanka = (formValues, dyamicvalues) => {
  const isInstallmentRequired =
    formValues?.policyDetails?.isPremiumInstallmentBased ===
    dyamicvalues?.TOGGLE_YES;
  // const initialSharePercentage =
  //   formValues?.insurerDetails?.[0]?.sharePercentage ??
  //   (isSingleInsurerPolicy ? 100 : null);
  // const initialBrokeragePercentage =
  //   formValues?.insurerDetails?.[0]?.brokeragePercentage ??
  //   (isSingleInsurerPolicy ? 100 : null);

  const {
    leadFields: leadFieldsLanka,
    leadDefaults: leadDefaultsLanka,
    insurerDetailsSection: insurerDetailsSectionLanka,
  } = buildInsurerSectionConfigs({
    formValues,
    dynamicValues: dyamicvalues,
    leadSectionKey: "feeDetails",
    detailsSectionKey: "insurerDetails",
    showLeadFieldsOnlyForMultiple: true,
    runExternalValidatorsOnChange: true,
  });

  const isCdAccountRequired =
    formValues?.cdAccountDetails?.paymentTypeLid !==
    dyamicvalues?.PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY;

  const isCdAccountSelected = formValues?.cdAccountDetails?.selectCdAccount;

  return [
    {
      key: "policyDetails",
      title: "Policy details",
      config: [
        {
          key: "policyDates",
          name: "policyDates",
          type: "daterange",
          label: "Policy dates",
          rules: {
            required: {
              value: true,
              message: "Policy dates are required",
            },
          },
          toName: "policyToDate",
          toLabel: "To",
          fromName: "policyFromDate",
          fromLabel: "From",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 1,
        },
        {
          key: "placementSlipDate",
          name: "placementSlipDate",
          type: "date",
          label: "Date of placement slip",
          rules: {
            required: {
              value: true,
              message: "Placement slip date is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 2,
        },
        {
          key: "sumInsured",
          name: "sumInsured",
          type: "number",
          label: "Sum Insured",
          isDecimal: true,
          rules: {
            required: {
              value: true,
              message: "Sum Insured is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 3,
        },
        {
          key: "basicPremium",
          name: "basicPremium",
          type: "number",
          isDecimal: true,
          label: "Basic premium",
          rules: {
            required: {
              value: true,
              message: "Basic premium is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 4,
        },
        {
          key: "srccAmount",
          name: "srccAmount",
          label: "SRCC premium amount",
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
          key: "terrorismCommission",
          name: "terrorismCommission",
          label: "TC premium amount",
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
              message: "TC premium amount must be a positive numeric value",
            },
            required: {
              value: true,
              message: "TC premium amount is required",
            },
          },
          activityOrder: 6,
        },
        {
          key: "totalPremium",
          name: "totalPremium",
          type: "number",
          isDecimal: true,
          label: "Total net premium",
          rules: {
            required: {
              value: true,
              message: "Total net premium is required",
            },
          },
          disabled: true,
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
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
          activityOrder: 11,
        },
        {
          key: "serviceTaxPercentage",
          name: "serviceTaxPercentage",
          label: "VAT percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            min: {
              value: 0,
              message: "Tax percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "Tax percentage cannot exceed 100",
            },
            required: {
              value: true,
              message: "Tax percentage is required",
            },
          },
          activityOrder: 12,
        },
        {
          key: "serviceTaxAmount",
          name: "serviceTaxAmount",
          label: "VAT amount",
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
              message: "Tax must be a positive numeric value",
            },
            required: {
              value: true,
              message: "Tax is required",
            },
          },
          // disabled: true,
          activityOrder: 13,
        },
        {
          key: "totalGrossPremiumIncTaxCharges",
          name: "totalGrossPremiumIncTaxCharges",
          label: "Total gross premium including tax & other charges",
          isDecimal: true,
          type: "number",
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          disabled: true,
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
          key: "basicPremiumPercentage",
          name: "basicPremiumPercentage",
          label: "Basic brokerage percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
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
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
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
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
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
          rules: {
            required: {
              value: true,
              message: "SRCC brokerage amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
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
        //   disabled: true,
        //   formatNumber: true,
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
        //   key: "brokeragePercentage",
        //   name: "brokeragePercentage",
        //   type: "number",
        //   label: "Brokerage Percentage",
        //   rules: {
        //     max: {
        //       value: 100,
        //       message: "Brokerage percentage cannot exceed 100",
        //     },
        //     min: {
        //       value: 0,
        //       message: "Brokerage percentage cannot be negative",
        //     },
        //     required: {
        //       value: true,
        //       message: "Brokerage percentage is required",
        //     },
        //   },
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: {
        //     type: "number",
        //     fullWidth: true,
        //   },
        // },
        {
          key: "brokerageAmount",
          name: "brokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Total brokerage amount",
          rules: {
            required: {
              value: true,
              message: "Total brokerage amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 21,
          disabled: true,
        },
        {
          key: "isPremiumInstallmentBased",
          name: "isPremiumInstallmentBased",
          type: "segmentedcontrol",
          label: "Premium is Installment Based",
          rules: {
            required: {
              value: true,
              message: "premium installment is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            required: true,
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
          },
          activityOrder: 22,
        },
        {
          key: "totalInstallmentAmount",
          name: "totalInstallmentAmount",
          type: "number",
          isDecimal: true,
          label: "Total Installment Amount",
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
            inputProps: { readOnly: true },
          },
          showField: (watch) => {
            const directValue = watch("isPremiumInstallmentBased");
            const nestedValue = watch("policyDetails.isPremiumInstallmentBased");
            return (
              String(directValue ?? nestedValue) ===
              String(dyamicvalues?.TOGGLE_YES)
            );
          },
          activityOrder: 23,
        },
      ],
      defaultValues: {
        sumInsured: "",
        basicPremium: "",
        policyToDate: "",
        policyFromDate: "",
        placementSlipDate: "",
        totalPremium: "",
        totalGrossPremiumIncTax: "",
        srccAmount: "",
        cessAmount: "",
        isPremiumInstallmentBased: dyamicvalues?.TOGGLE_NO ?? "",
        totalInstallmentAmount: "",
      },
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "installmentDates",
      title: "Installment",
      config: [
        {
          key: "firstInstallmentDate",
          name: "firstInstallmentDate",
          type: "date",
          label: isInstallmentRequired
            ? "Installment date*"
            : "Installment date",
          rules: {
            validate: (value) => {
              if (isInstallmentRequired && isValueMissing(value)) {
                return "Installment date is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "policyDetails?.isPremiumInstallmentBased",
          },
          activityOrder: 23,
        },
        {
          key: "installmentAmount",
          name: "installmentAmount",
          type: "number",
          formatNumber: true,
          label: isInstallmentRequired
            ? "Installment amount*"
            : "Installment amount",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "policyDetails?.isPremiumInstallmentBased",
          },
          rules: {
            validate: (value) => {
              if (isInstallmentRequired && isValueMissing(value)) {
                return "Installment amount is required";
              }
              const totalInstallmentAmount = formValues?.policyDetails
                ?.totalInstallmentAmount;
              if (
                isInstallmentRequired &&
                !isValueMissing(totalInstallmentAmount) &&
                Number(value) !== Number(totalInstallmentAmount)
              ) {
                return "Installment amount must equal total installment amount";
              }
              return true;
            },
          },
          activityOrder: 24,
        },
      ],
      isMultiple: true,
      defaultValues: [
        {
          installmentAmount: null,
          firstInstallmentDate: null,
        },
      ],
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "feeDetails",
      config: [
        {
          key: "isFeeInInstallment",
          name: "isFeeInInstallment",
          type: "segmentedcontrol",
          label: "Fee is installment",
          rules: {
            required: {
              value: true,
              message: "Fee installment is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            required: true,
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
          },
          activityOrder: 25,
        },
        // {
        //   key: "terrorismCommissionPercentage",
        //   name: "terrorismCommissionPercentage",
        //   type: "number",
        //   label: "Terrorism Brokerage Percentage",
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: {
        //     fullWidth: true,
        //   },
        // },
        // {
        //   key: "maxAgeOfDependents",
        //   name: "maxAgeOfDependents",
        //   type: "number",
        //   label: "Max Age of Dependents",
        //   gridColumn: 5,
        //   componentProps: {
        //     fullWidth: true,
        //   },
        // },
        ...leadFieldsLanka,
      ],
      defaultValues: {
        ...leadDefaultsLanka,
      },
    },
    insurerDetailsSectionLanka,
    {
      key: "tpaDetails",
      title: "TPA details",
      config: [
        {
          key: "tpaId",
          name: "tpaId",
          type: "selectFieldByApi",
          label: "TPA name",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpasList",
            utilityFunction: "#tpaUtilityFunction",
            clearFieldsOnChange: [
              "tpaLocationId",
              "tpaBranchId",
              "tpaContactId",
            ],
            customParams: { searchBy: "firstName" },
          },
          activityOrder: 26,
        },
        {
          key: "tpaLocationId",
          name: "tpaLocationId",
          type: "select",
          label: "Location",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpaByID",
            dependentField: "tpaId",
            utilityFunction: "#tpaLocationListUtilityFunction",
            clearFieldsOnChange: ["tpaBranchId", "tpaContactId"],
          },
          activityOrder: 27,
        },
        {
          key: "tpaBranchId",
          name: "tpaBranchId",
          type: "select",
          label: "Branch",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpaByID",
            dependentField: "tpaId",
            utilityFunction: "#tpaLocationAddressUtilityFunction",
            clearFieldsOnChange: ["tpaContactId"],
          },
          activityOrder: 28,
        },
        {
          key: "tpaContactId",
          name: "tpaContactId",
          type: "select",
          label: "Contact",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.tpaContactList",
            dependentField: "tpaId",
            utilityFunction: "#tpaContactPersonUtilityFunction",
          },
          activityOrder: 29,
        },
      ],
      isMultiple: true,
      defaultValues: [
        {
          tpaId: null,
          tpaBranchId: null,
          tpaContactId: null,
          tpaLocationId: null,
        },
      ],
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "cdAccountDetails",
      config: [
        {
          key: "cdAccountNumber",
          type: "title",
          label: "CD Account Details",
          activityOrder: 30,
        },
        {
          key: "paymentTypeLid",
          name: "paymentTypeLid",
          type: "select",
          label: "Payment Type",
          rules: {
            required: {
              value: true,
              message: "Payment type is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`PAYMENT_TOGGLE`)",
            clearFieldsOnChange: [
              "cdAccountTypeLid",
              "selectCdAccount",
              "accountName",
              "openBalance",
              "accountNumber",
            ],
          },
          activityOrder: 31,
        },
        {
          key: "transactionTypeLid",
          name: "transactionTypeLid",
          type: "select",
          label: "Transaction mode",
          // showField:
          //   '#(watch) => watch("paymentTypeLid") === ${PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD}',

          rules: {
            required: {
              value: true,
              message: "Transaction mode is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TRANSACTION_TYPE`)",
          },
          activityOrder: 32,
        },
        {
          key: "chequeDate",
          name: "chequeDate",
          type: "date",
          label: "Transaction Date",
          rules: {
            required: {
              value: true,
              message: "Transaction date is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 33,
        },
        {
          key: "chequeAmount",
          name: "chequeAmount",
          type: "number",
          label: "Transaction Amount",
          rules: {
            required: {
              value: true,
              message: "Transaction amount is required",
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 34,
        },
        {
          key: "chequeNumber",
          name: "chequeNumber",
          type: "text",
          label: "Cheque Number",
          rules: {
            required: {
              value: true,
              message: "This field is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          activityOrder: 35,
        },
        {
          key: "bankName",
          name: "bankName",
          type: "text",
          label: "Bank Name",
          rules: {
            required: "This field is required",
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 36,
        },
        {
          key: "cdAccountTypeLid",
          name: "cdAccountTypeLid",
          type: "segmentedcontrol",
          label: isCdAccountRequired ? "CD Account *" : "CD Account",
          // showField:
          //   '#(watch) => watch("paymentTypeLid") === ${PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD}',
          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "Please select account type.";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`CD_ACCOUNT_TOGGLE`)",
            clearFieldsOnChange: [
              "selectCdAccount",
              "accountName",
              "accountNumber",
              "openBalance",
            ],
          },
          activityOrder: 37,
        },
        {
          key: "selectCdAccount",
          name: "selectCdAccount",
          type: "selectFieldByApi",
          label: "Select CD Account",
          showField:
            '#(watch) => watch("cdAccountTypeLid") === ${CD_ACCOUNT_TOGGLE_EXISTING}',
          rules: {
            validate:
              '#validateRequiredIfEqual("cdAccountTypeLid", ${CD_ACCOUNT_TOGGLE_EXISTING}, "Please select a CD account.")',
          },
          invokeFunction: "fetchCDDetails",
          apiDependencies: {
            endPoint: "#endPoints.getCdDetailsByCompanyId(companyId)",
            utilityFunction: "#cdDetailsUtilityFunction",
            clearFieldsOnChange: [
              "accountName",
              "accountNumber",
              "openBalance",
              "cdSafeLimit",
            ],
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 38,
        },
        {
          key: "accountName",
          name: "accountName",
          type: "text",
          label: isCdAccountRequired ? "Account name *" : "Account name",
          // showField:
          //   '#(watch) => watch("paymentTypeLid") === ${PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD}',
          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "Account name is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          disabled: isCdAccountSelected,
          activityOrder: 39,
        },
        {
          key: "openBalance",
          name: "openBalance",
          type: "number",
          label: isCdAccountRequired ? "Open Balance *" : "Open Balance",
          // showField:
          //   '#(watch) => watch("cdAccountTypeLid") === ${CD_ACCOUNT_TOGGLE_EXISTING}',
          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "Balance is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            fullWidth: true,
          },
          disabled: isCdAccountSelected,
          activityOrder: 40,
        },
        {
          key: "accountNumber",
          name: "accountNumber",
          type: "text",
          label: isCdAccountRequired
            ? "CD Account Number *"
            : "CD Account Number",
          // showField:
          //   '#(watch) => watch("paymentTypeLid") === ${PAYMENT_TOGGLE_CHEQUE_PREMIUM_AND_CD}',

          rules: {
            validate: (value) => {
              if (isCdAccountRequired && isValueMissing(value)) {
                return "CD account number is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          disabled: isCdAccountSelected,
          activityOrder: 41,
        },
        {
          key: "cdRemarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 42,
        },
      ],
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "coverDetails",
      title: "Covers Details",
      config: [],
      containerStyles: {
        gap: "24px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
        backgroundColor: "rgb(250,250,250)",
      },
      isCoversRequired: true,
    },
    {
      key: "remarks",
      config: [
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9,
          componentProps: {
            rows: 3,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 43,
        },
      ],
      containerStyles: {
        gap: "8px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "documents",
      config: [
        {
          key: "documents",
          name: "documents",
          type: "documentupload",
          label: "Documents",
          companyId: "#${companyId}",
          gridColumn: 9,
          componentProps: {
            isDocumentTypeRequired: true,
            isDocumentRequired: true,
            fullWidth: true,
            companyType: "opportunity",
          },
          activityOrder: 44,
        },
      ],
      defaultValues: [
        {
          documentId: null,
          documentTypeLid: null,
        },
      ],
    },
  ];
};
