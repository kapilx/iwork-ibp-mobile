import { REGEX_PATTERNS } from "@ui/ui-lib";
import { withPercentageClamp } from "@ui/ui-lib/utils";
import { buildInsurerSectionConfigs } from "./sharedInsurerConfig";
import { buildInstallmentSectionConfigs } from "./sharedInstallmentsConfig";

const isValueMissing = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

export const policyConfirmationConfig = (formValues, dyamicvalues) => {
  const isDeviationRequired =
    formValues?.policyDataWrongSection?.policyDataWrongLid ===
    dyamicvalues?.TOGGLE_YES;

  const isPolicyRectified =
    formValues?.policyDataRectifiedSection?.policyDataRectifiedLid ===
    dyamicvalues?.TOGGLE_YES;

  const installmentToggleValue =
    formValues?.installmentSummarySection?.isPremiumInstallmentBased ??
    formValues?.policyDataRectifiedSection?.isPremiumInstallmentBased;
  const isInstallmentRequired =
    String(installmentToggleValue) === String(dyamicvalues?.TOGGLE_YES);

  const { leadFields, leadDefaults, insurerDetailsSection } =
    buildInsurerSectionConfigs({
      formValues,
      dynamicValues: dyamicvalues,
      leadSectionKey: "policyDataRectifiedSection",
      basePremiumPath: "policyDataRectifiedSection.basicPremium",
      brokerageAmountPath: "policyDataRectifiedSection.brokerageAmount",
      totalBrokerageAmountPath: "deviationSection.totalBrokerageAmount",
      runExternalValidatorsOnChange: true,
      additionalCommissions: [
        {
          percentageKey: "terrorismBrokeragePercentage",
          amountKey: "terrorismBrokerageAmount",
          label: "Terrorism brokerage amount",
          sharePercentageKey: "terrorismSharePercentage",
          shareAmountKey: "terrorismShareAmount",
          shareLabel: "Terrorism",
          premiumBasePath: "policyDataRectifiedSection.terrorism",
          policyAmountPath: "deviationSection.tcBrokerageAmount",
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

  const rectifiedLeadFields = leadFields.map((field) => ({
    ...field,
    rules: isPolicyRectified ? field.rules : {},
    componentProps: {
      ...(field.componentProps || {}),
      disabled: field.key === "leadInsurerId" ? true : !isPolicyRectified,
    },
  }));

  const insurerDetailsSectionWithToggle = {
    ...insurerDetailsSection,
    disableAllFields: !isPolicyRectified,
  };

  const { installmentSection } = buildInstallmentSectionConfigs({
    formValues,
    isInstallmentRequired,
    sectionKey: "installmentDetails",
    sectionTitle: "Installment",
    grossPremiumPath: "policyDataRectifiedSection.grossPremium",
    totalInstallmentAmountPath:
      "installmentSummarySection.totalInstallmentAmount",
    runExternalValidatorsOnChange: false,
  });

  const installmentSectionWithToggle = {
    ...installmentSection,
    disableAllFields: !isPolicyRectified,
  };

  return [
    {
      key: "policyDataWrongSection",
      title: "Policy Confirmation",
      config: [
        {
          key: "policyDataWrongLid",
          name: "policyDataWrongLid",
          type: "segmentedcontrol",
          label: "Any deviations",
          rules: {
            required: {
              value: true,
              message: "Any deviations is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
          },
          isProcessRequired: true,
          activityOrder: 1,
        },
      ],
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
      defaultValues: {
        policyDataWrongLid: dyamicvalues?.TOGGLE_NO ?? null,
      },
    },
    {
      key: "deviationSection",
      title: "Enter deviations",
      config: [
        {
          key: "deviations",
          name: "deviations",
          type: "textarea",
          label: isDeviationRequired ? "Enter deviations*" : "Enter deviations",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },
          apiDependencies: {
            dependentField: "isPolicyDataWrong",
          },
          disabled: !isDeviationRequired,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Deviation is required";
              }
              return true;
            },
          },
          activityOrder: 2,
        },
        // As per the dicussion with team, currently hiding it
        // {
        //   key: "button",
        //   name: "button",
        //   type: "button",
        //   label: "Create task for deviation",
        //   onClick: "createTaskForDeviation",
        //   gridColumn: 9,
        //   componentProps: {
        //     variant: "primary",
        //     maxWidth: "180px",
        //   },
        // },
      ],
      defaultValues: {
        deviations: "",
      },
      containerStyles: {
        gap: "16px",
        border: "1px solid #E0E0E0",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
      },
      disableAllFields: !isDeviationRequired,
    },
    {
      key: "policyDataRectifiedSection",
      config: [
        {
          key: "policyDataRectifiedLid",
          name: "policyDataRectifiedLid",
          type: "segmentedcontrol",
          label: isDeviationRequired
            ? "Deviation addressed*"
            : "Deviation addressed",

          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Deviation addressed is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
            clearFieldsOnChange: ["resolutionLid"],
          },
          isProcessRequired: true,
          disabled: !isDeviationRequired,
          activityOrder: 3,
        },
        {
          key: "resolutionLid",
          name: "resolutionLid",
          type: "select",
          label: "Resolution",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("RESOLUTION_TYPE")',
          },
          isProcessRequired: true,
          disabled: !isPolicyRectified,
          activityOrder: 4,
        },
        {
          key: "sumInsured",
          name: "sumInsured",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired ? "Sum insured*" : "Sum insured",
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Sum insured is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 5,
        },
        {
          key: "basicPremium",
          name: "basicPremium",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired ? "Basic premium*" : "Basic premium",

          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Basic premium is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 6,
        },
        {
          key: "terrorism",
          name: "terrorism",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired
            ? "Terrorism commission*"
            : "Terrorism commission",

          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Terrorism commission is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 7,
        },
        {
          key: "netPremium",
          name: "netPremium",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired ? "Net premium*" : "Net premium",
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Net premium is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 8,
        },
        {
          key: "gstPercentage",
          name: "gstPercentage",
          type: "number",
          label: isDeviationRequired ? "GST percentage*" : "GST percentage",
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "GST percentage is required";
              }
              return true;
            },

            max: {
              value: 100,
              message: "GST percentage cannot be more than 100%",
            },
            min: {
              value: 0,
              message: "GST percentage cannot be less than 0%",
            },
          },
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
          }),
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 9,
        },
        {
          key: "gstAmount",
          name: "gstAmount",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired
            ? "GST (Amount calculated)*"
            : "GST (Amount calculated)",

          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "This field is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 10,
        },
        {
          key: "fee",
          name: "fee",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired ? "Fee*" : "Fee",

          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Fee is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 11,
        },

        {
          key: "other",
          name: "other",
          type: "number",
          label: isDeviationRequired ? "Other amount*" : "Other amount",
          isDecimal: true,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Other amount is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 12,
        },
        {
          key: "grossPremium",
          name: "grossPremium",
          type: "number",
          label: isDeviationRequired ? "Gross premium*" : "Gross premium",
          isDecimal: true,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Gross premium is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: true,
          activityOrder: 13,
        },
        {
          key: "basicBrokeragePercentage",
          name: "basicBrokeragePercentage",
          type: "number",
          label: isPolicyRectified
            ? "Basic brokerage percentage*"
            : "Basic brokerage percentage",
          rules: {
            validate: (value) => {
              if (isPolicyRectified && isValueMissing(value)) {
                return "Basic brokerage percentage is required";
              }
              return true;
            },

            max: {
              value: 100,
              message: "Basic brokerage percentage cannot be more than 100%",
            },
            min: {
              value: 0,
              message: "Basic brokerage percentage cannot be less than 0%",
            },
          },
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
          }),
          apiDependencies: {
            dependentField: "policyDataWrongLid",
          },
          disabled: !isPolicyRectified,
          activityOrder: 14,
        },

        {
          key: "terrorismBrokeragePercentage",
          name: "terrorismBrokeragePercentage",
          type: "number",
          label: isDeviationRequired
            ? "Terrorism brokerage percentage*"
            : "Terrorism brokerage percentage",
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Terrorism brokerage percentage is required";
              }
              return true;
            },

            max: {
              value: 100,
              message:
                "Terrorism brokerage percentage cannot be more than 100%",
            },
            min: {
              value: 0,
              message: "Terrorism brokerage percentage cannot be less than 0%",
            },
          },
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
          }),
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 15,
        },
        {
          key: "basicBrokerageAmount",
          name: "basicBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: isPolicyRectified
            ? "Basic brokerage amount*"
            : "Basic brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isPolicyRectified && isValueMissing(value)) {
                return "Basic brokerage amount is required";
              }
              return true;
            },
          },
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "policyDataWrongLid",
          },
          disabled: !isPolicyRectified,
          isProcessRequired: true,
          activityOrder: 16,
        },
        {
          key: "tcBrokerageAmount",
          name: "tcBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: isPolicyRectified
            ? "Terrorism brokerage amount*"
            : "Terrorism brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isPolicyRectified && isValueMissing(value)) {
                return "TC brokerage amount is required";
              }
              return true;
            },
          },
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "policyDataWrongLid",
          },
          disabled: !isPolicyRectified,
          isProcessRequired: true,
          activityOrder: 17,
        },
        {
          key: "totalBrokerageAmount",
          name: "totalBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: isPolicyRectified
            ? "Total brokerage amount*"
            : "Total brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isPolicyRectified && isValueMissing(value)) {
                return "Total brokerage amount is required";
              }
              return true;
            },
          },
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "policyDataWrongLid",
          },
          disabled: true,
          isProcessRequired: true,
          activityOrder: 18,
        },
        ...rectifiedLeadFields,
      ],
      defaultValues: {
        resolutionLid: null,
        ...leadDefaults,
      },
    },
    insurerDetailsSectionWithToggle,
    {
      key: "installmentSummarySection",
      config: [
        {
          key: "isPremiumInstallmentBased",
          name: "isPremiumInstallmentBased",
          type: "segmentedcontrol",
          label: isPolicyRectified
            ? "Premium is Installment Based*"
            : "Premium is Installment Based",
          rules: {
            validate: (value) => {
              if (isPolicyRectified && isValueMissing(value)) {
                return "Premium installment is required";
              }
              return true;
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
          disabled: !isPolicyRectified,
          isProcessRequired: true,
          activityOrder: 19,
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
          showField: () =>
            String(installmentToggleValue) === String(dyamicvalues?.TOGGLE_YES),
          disabled: !isPolicyRectified,
          isProcessRequired: true,
          activityOrder: 20,
        },
      ],
      defaultValues: {
        isPremiumInstallmentBased: dyamicvalues?.TOGGLE_NO ?? null,
        totalInstallmentAmount: null,
      },
    },
    installmentSectionWithToggle,
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
            rows: 4,
            fullWidth: true,
            multiline: true,
            placeholder: "Enter Text here...",
          },
          activityOrder: 19,
        },
      ],
      defaultValues: {
        remarks: "",
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
          activityOrder: 20,
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

//duplicating the config for sri lankan users

export const policyConfirmationConfigLanka = (formValues, dyamicvalues) => {
  const isDeviationRequired =
    formValues?.policyDataWrongSection?.policyDataWrongLid ===
    dyamicvalues?.TOGGLE_YES;

  const isPolicyRectified =
    formValues?.policyDataRectifiedSection?.policyDataRectifiedLid ===
    dyamicvalues?.TOGGLE_YES;

  const installmentToggleValue =
    formValues?.installmentSummarySection?.isPremiumInstallmentBased ??
    formValues?.policyDataRectifiedSection?.isPremiumInstallmentBased;
  const isInstallmentRequired =
    String(installmentToggleValue) === String(dyamicvalues?.TOGGLE_YES);

  const { leadFields, leadDefaults, insurerDetailsSection } =
    buildInsurerSectionConfigs({
      formValues,
      dynamicValues: dyamicvalues,
      leadSectionKey: "policyDataRectifiedSection",
      basePremiumPath: "policyDataRectifiedSection.basicPremium",
      brokerageAmountPath: "policyDataRectifiedSection.brokerageAmount",
    });

  const rectifiedLeadFields = leadFields.map((field) => ({
    ...field,
    rules: isPolicyRectified ? field.rules : {},
    componentProps: {
      ...(field.componentProps || {}),
      disabled: field.key === "leadInsurerId" ? true : !isPolicyRectified,
    },
  }));

  const insurerDetailsSectionWithToggle = {
    ...insurerDetailsSection,
    disableAllFields: !isPolicyRectified,
  };

  const { installmentSection } = buildInstallmentSectionConfigs({
    formValues,
    isInstallmentRequired,
    sectionKey: "installmentDetails",
    sectionTitle: "Installment",
    grossPremiumPath: "policyDataRectifiedSection.grossPremium",
    totalInstallmentAmountPath:
      "installmentSummarySection.totalInstallmentAmount",
    runExternalValidatorsOnChange: false,
  });

  const installmentSectionWithToggle = {
    ...installmentSection,
    disableAllFields: !isPolicyRectified,
  };

  return [
    {
      key: "policyDataWrongSection",
      title: "Policy Confirmation",
      config: [
        {
          key: "policyDataWrongLid",
          name: "policyDataWrongLid",
          type: "segmentedcontrol",
          label: "Any deviations",
          rules: {
            required: {
              value: true,
              message: "Any deviations is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
          },
          isProcessRequired: true,
          activityOrder: 1,
        },
      ],
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
      defaultValues: {
        policyDataWrongLid: dyamicvalues?.TOGGLE_NO ?? null,
      },
    },
    {
      key: "deviationSection",
      title: "Enter deviations",
      config: [
        {
          key: "deviations",
          name: "deviations",
          type: "textarea",
          label: isDeviationRequired ? "Enter deviations*" : "Enter deviations",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },
          apiDependencies: {
            dependentField: "isPolicyDataWrong",
          },
          disabled: !isDeviationRequired,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Deviation is required";
              }
              return true;
            },
          },
          activityOrder: 2,
        },
        // As per the dicussion with team, currently hiding it
        // {
        //   key: "button",
        //   name: "button",
        //   type: "button",
        //   label: "Create task for deviation",
        //   onClick: "createTaskForDeviation",
        //   gridColumn: 9,
        //   componentProps: {
        //     variant: "primary",
        //     maxWidth: "180px",
        //   },
        // },
      ],
      defaultValues: {
        deviations: "",
      },
      containerStyles: {
        gap: "16px",
        border: "1px solid #E0E0E0",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
      },
      disableAllFields: !isDeviationRequired,
    },
    {
      key: "policyDataRectifiedSection",
      config: [
        {
          key: "policyDataRectifiedLid",
          name: "policyDataRectifiedLid",
          type: "segmentedcontrol",
          label: isDeviationRequired
            ? "Deviation addressed*"
            : "Deviation addressed",

          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Deviation addressed is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
            clearFieldsOnChange: ["resolutionLid"],
          },
          isProcessRequired: true,
          disabled: !isDeviationRequired,
          activityOrder: 3,
        },
        {
          key: "resolutionLid",
          name: "resolutionLid",
          type: "select",
          label: "Resolution",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("RESOLUTION_TYPE")',
          },
          isProcessRequired: true,
          disabled: !isPolicyRectified,
          activityOrder: 4,
        },
        {
          key: "basicPremium",
          name: "basicPremium",
          label: isDeviationRequired ? "Basic Premium *" : "Basic Premium",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Basic Premium is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Basic premium amount must be a positive numeric value",
            },
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isPolicyRectified,
          activityOrder: 5,
        },
        {
          key: "srccAmount",
          name: "srccAmount",
          label: isDeviationRequired
            ? "SRCC premium amount *"
            : "SRCC premium amount",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "SRCC premium amount is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "SRCC premium amount must be a positive numeric value",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 6,
        },
        {
          key: "terrorismCommission",
          name: "terrorismCommission",
          label: isDeviationRequired
            ? "TC premium amount *"
            : "TC premium amount",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "TC premium amount is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "TC premium amount must be a positive numeric value",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 7,
        },
        {
          key: "totalNetPremium",
          name: "totalNetPremium",
          label: isDeviationRequired
            ? "Total Net Premium*"
            : "Total Net Premium",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          disabled: true,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Total Net Premium is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Total Net Premium must be a positive numeric value",
            },
          },
          activityOrder: 8,
        },

        {
          key: "adminCharges",
          name: "adminCharges",
          label: isDeviationRequired ? "Admin Charges*" : "Admin Charges",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Admin Charges is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Admin Charges must be a positive numeric value",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 9,
        },
        {
          key: "other",
          name: "other",
          label: isDeviationRequired ? "Stamp duty*" : "Stamp duty",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Stamp duty is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Stamp duty must be a positive numeric value",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 10,
        },
        {
          key: "cessAmount",
          name: "cessAmount",
          label: isDeviationRequired ? "cess*" : "cess",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "cess amount is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "cess amount must be a positive numeric value",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 11,
        },
        {
          key: "fee",
          name: "fee",
          label: isDeviationRequired ? "Policy fee*" : "Policy fee",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Policy fee is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Policy fee must be a positive numeric value",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 14,
        },
        {
          key: "serviceTaxPercentage",
          name: "serviceTaxPercentage",
          label: isDeviationRequired ? "VAT Percentage *" : "VAT Percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "VAT Percentage is required";
              }
              return true;
            },
            min: {
              value: 0,
              message: "VAT percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "VAT percentage cannot exceed 100",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 12,
        },
        {
          key: "serviceTaxAmount",
          name: "serviceTaxAmount",
          label: isDeviationRequired ? "VAT Amount *" : "VAT Amount",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "VAT is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "VAT must be a positive numeric value",
            },
          },
          disabled: !isPolicyRectified,
          // disable: true,
          activityOrder: 13,
        },
        {
          key: "totalGrossPremiumIncTaxCharges",
          name: "totalGrossPremiumIncTaxCharges",
          label: isDeviationRequired
            ? "Total gross premium including tax & other charges*"
            : "Total gross premium including tax & other charges",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          disabled: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Total gross premium including tax & other charges is required";
              }
              return true;
            },
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message:
                "Total gross premium including tax & other charges must be a positive numeric value",
            },
          },
          activityOrder: 15,
        },

        {
          key: "basicPremiumPercentage",
          name: "basicPremiumPercentage",
          label: isDeviationRequired
            ? "Basic brokerage percentage *"
            : "Basic brokerage percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Basic brokerage percentage is required";
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
          disabled: !isPolicyRectified,
          activityOrder: 16,
        },

        {
          key: "srccPercentage",
          name: "srccPercentage",
          label: isDeviationRequired
            ? "SRCC brokerage percentage *"
            : "SRCC brokerage percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "SRCC brokerage percentage is required";
              }
              return true;
            },
            min: {
              value: 0,
              message: "SRCC brokerage percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "SRCC brokerage percentage cannot exceed 100",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 17,
        },
        {
          key: "terrorismBrokeragePercentage",
          name: "terrorismBrokeragePercentage",
          label: isDeviationRequired
            ? "TC brokerage percentage *"
            : "TC brokerage percentage",
          type: "number",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            type: "number",
          }),
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "TC brokerage percentage is required";
              }
              return true;
            },
            min: {
              value: 0,
              message: "TC brokerage percentage cannot be negative",
            },
            max: {
              value: 100,
              message: "TC brokerage percentage cannot exceed 100",
            },
          },
          disabled: !isPolicyRectified,
          activityOrder: 18,
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
          // disabled: !isPolicyRectified,
          disable: true,
          activityOrder: 19,
        },
        {
          key: "srccBrokerageAmount",
          name: "srccBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: isPolicyRectified
            ? "SRCC brokerage amount*"
            : "SRCC brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isPolicyRectified && isValueMissing(value)) {
                return "SRCC brokerage amount is required";
              }
              return true;
            },
          },
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "policyDataWrongLid",
          },
          // disabled: !isPolicyRectified,
          disabled: true,

          isProcessRequired: true,
          activityOrder: 20,
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
          // disabled: !isPolicyRectified,
          disable: true,
          activityOrder: 21,
        },

        // {
        //   key: "totalGrossPremiumIncTax",
        //   name: "totalGrossPremiumIncTax",
        //   label: isDeviationRequired
        //     ? "Total Gross Premium Including Tax*"
        //     : "Total Gross Premium Including Tax",
        //   type: "number",
        //   formatNumber: true,
        //   gridColumn: 5,
        //   disabled: true,
        //   componentProps: {
        //     fullWidth: true,
        //     type: "number",
        //   },
        //   rules: {
        //     validate: (value) => {
        //       if (isDeviationRequired && isValueMissing(value)) {
        //         return "Total Gross Premium Including Tax is required";
        //       }
        //       return true;
        //     },
        //     pattern: {
        //       value: REGEX_PATTERNS.NUMERIC,
        //       message:
        //         "Total Gross Premium Including Tax must be a positive numeric value",
        //     },
        //   },
        // },

        // {
        //   key: "feePercentage",
        //   name: "feePercentage",
        //   label: isDeviationRequired
        //     ? "Policy Fee percentage*"
        //     : "Policy Fee percentage",
        //   type: "number",
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: {
        //     fullWidth: true,
        //     type: "number",
        //   },
        //   rules: {
        //     validate: (value) => {
        //       if (isDeviationRequired && isValueMissing(value)) {
        //         return "Policy Fee percentage is required";
        //       }
        //       return true;
        //     },
        //     min: {
        //       value: 0,
        //       message: "Policy Fee percentage cannot be negative",
        //     },
        //     max: {
        //       value: 100,
        //       message: "Policy Fee percentage cannot exceed 100",
        //     },
        //   },
        //   disabled: !isPolicyRectified,
        // },

        // {
        //   key: "otherPercentage",
        //   name: "otherPercentage",
        //   label: isDeviationRequired
        //     ? "Stamp Duty percentage*"
        //     : "Stamp Duty percentage",
        //   type: "number",
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: {
        //     fullWidth: true,
        //     type: "number",
        //   },
        //   rules: {
        //     validate: (value) => {
        //       if (isDeviationRequired && isValueMissing(value)) {
        //         return "Stamp Duty percentage is required";
        //       }
        //       return true;
        //     },
        //     min: {
        //       value: 0,
        //       message: "Other percentage cannot be negative",
        //     },
        //     max: {
        //       value: 100,
        //       message: "Other percentage cannot exceed 100",
        //     },
        //   },
        //   disabled: !isPolicyRectified,
        // },

        // {
        //   key: "adminChargesPercentage",
        //   name: "adminChargesPercentage",
        //   label: isDeviationRequired
        //     ? "Admin Charges percentage*"
        //     : "Admin Charges percentage",
        //   type: "number",
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: {
        //     fullWidth: true,
        //     type: "number",
        //   },
        //   rules: {
        //     validate: (value) => {
        //       if (isDeviationRequired && isValueMissing(value)) {
        //         return "Admin Charges percentage is required";
        //       }
        //       return true;
        //     },
        //     min: {
        //       value: 0,
        //       message: "Admin Charges percentage cannot be negative",
        //     },
        //     max: {
        //       value: 100,
        //       message: "Admin Charges percentage cannot exceed 100",
        //     },
        //   },
        //   disabled: !isPolicyRectified,
        // },

        // {
        //   key: "cessPercentage",
        //   name: "cessPercentage",
        //   label: isDeviationRequired ? "cess percentage*" : "cess percentage",
        //   type: "number",
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: {
        //     fullWidth: true,
        //     type: "number",
        //   },
        //   rules: {
        //     validate: (value) => {
        //       if (isDeviationRequired && isValueMissing(value)) {
        //         return "cess percentage is required";
        //       }
        //       return true;
        //     },
        //     min: {
        //       value: 0,
        //       message: "cess percentage cannot be negative",
        //     },
        //     max: {
        //       value: 100,
        //       message: "cess percentage cannot exceed 100",
        //     },
        //   },
        //   disabled: !isPolicyRectified,
        // },

        // {
        //   key: "brokeragePercentage",
        //   name: "brokeragePercentage",
        //   type: "number",
        //   label: isPolicyRectified
        //     ? "Brokerage percentage*"
        //     : "Brokerage percentage",
        //   rules: {
        //     validate: (value) => {
        //       if (isPolicyRectified && isValueMissing(value)) {
        //         return "Brokerage percentage is required";
        //       }
        //       return true;
        //     },

        //     max: {
        //       value: 100,
        //       message: "Brokerage percentage cannot be more than 100%",
        //     },
        //     min: {
        //       value: 0,
        //       message: "Brokerage percentage cannot be less than 0%",
        //     },
        //   },
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: {
        //     type: "number",
        //     fullWidth: true,
        //   },
        //   apiDependencies: {
        //     dependentField: "policyDataWrongLid",
        //   },
        //   disabled: !isPolicyRectified,
        // },
        {
          key: "brokerageAmount",
          name: "brokerageAmount",
          type: "number",
          isDecimal: true,
          label: isPolicyRectified
            ? "Total brokerage amount*"
            : "Total brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isPolicyRectified && isValueMissing(value)) {
                return "Total brokerage amount is required";
              }
              return true;
            },
          },
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "policyDataWrongLid",
          },
          // disabled: !isPolicyRectified,
          disabled: true,
          isProcessRequired: true,
          activityOrder: 22,
        },
        ...rectifiedLeadFields,
      ],
      defaultValues: {
        resolutionLid: null,
        ...leadDefaults,
      },
    },
    insurerDetailsSectionWithToggle,
    {
      key: "installmentSummarySection",
      config: [
        {
          key: "isPremiumInstallmentBased",
          name: "isPremiumInstallmentBased",
          type: "segmentedcontrol",
          label: isPolicyRectified
            ? "Premium is Installment Based*"
            : "Premium is Installment Based",
          rules: {
            validate: (value) => {
              if (isPolicyRectified && isValueMissing(value)) {
                return "Premium installment is required";
              }
              return true;
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
          disabled: !isPolicyRectified,
          isProcessRequired: true,
          activityOrder: 23,
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
          showField: () =>
            String(installmentToggleValue) === String(dyamicvalues?.TOGGLE_YES),
          disabled: !isPolicyRectified,
          isProcessRequired: true,
          activityOrder: 24,
        },
      ],
      defaultValues: {
        isPremiumInstallmentBased: dyamicvalues?.TOGGLE_NO ?? null,
        totalInstallmentAmount: null,
      },
    },
    installmentSectionWithToggle,
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
            rows: 4,
            fullWidth: true,
            multiline: true,
            placeholder: "Enter Text here...",
          },
          activityOrder: 23,
        },
      ],
      defaultValues: {
        remarks: "",
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
          activityOrder: 24,
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
