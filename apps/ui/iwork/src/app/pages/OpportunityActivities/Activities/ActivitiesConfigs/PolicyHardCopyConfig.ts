//Duplicating the config for sri lankan users and need to refactor in the future

import { REGEX_PATTERNS, withPercentageClamp } from "@ui/ui-lib";
import { buildInsurerSectionConfigs } from "./sharedInsurerConfig";
import { buildInstallmentSectionConfigs } from "./sharedInstallmentsConfig";

const isValueMissing = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

export const policyHardCopyConfig = (formValues, dyamicvalues) => {
  const isYes = (value: unknown) =>
    String(value) === String(dyamicvalues?.TOGGLE_YES);
  const deviationCoverageValue =
    formValues?.deviationsAddressedSection?.deviationCoveragesLid;
  const hasAnyDeviation = isYes(deviationCoverageValue);

  const isDeviationAddressed =
    hasAnyDeviation &&
    isYes(formValues?.deviationsAddressedSection?.deviationsAddressedLid);

  const isDeviationRequired =
    isDeviationAddressed && isYes(formValues?.deviationSection?.deviationsLid);

  const installmentToggleValue =
    formValues?.installmentSummarySection?.isPremiumInstallmentBased ??
    formValues?.deviationSection?.isPremiumInstallmentBased;
  const isInstallmentRequired =
    isDeviationRequired &&
    String(installmentToggleValue) === String(dyamicvalues?.TOGGLE_YES);

  const { leadFields, leadDefaults, insurerDetailsSection } =
    buildInsurerSectionConfigs({
      formValues,
      dynamicValues: dyamicvalues,
      leadSectionKey: "deviationSection",
      basePremiumPath: "deviationSection.basicPremium",
      brokerageAmountPath: "deviationSection.brokerageAmount",
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
          premiumBasePath: "deviationSection.terrorism",
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

  const deviationLeadFields = leadFields.map((field) => ({
    ...field,
    rules: isDeviationRequired ? field.rules : {},
    componentProps: {
      ...(field.componentProps || {}),
      disabled: field.key === "leadInsurerId" ? true : !isDeviationRequired,
    },
  }));

  const insurerDetailsSectionWithToggle = {
    ...insurerDetailsSection,
    disableAllFields: !isDeviationRequired,
  };

  // const { installmentSection } = buildInstallmentSectionConfigs({
  //   formValues,
  //   isInstallmentRequired,
  //   sectionKey: "installmentDetails",
  //   sectionTitle: "Installment",
  //   grossPremiumPath: "deviationSection.grossPremium",
  //   totalInstallmentAmountPath: "deviationSection.totalInstallmentAmount",
  //   runExternalValidatorsOnChange: false,
  // });

  // const installmentSectionWithToggle = {
  //   ...installmentSection,
  //   disableAllFields: !isDeviationRequired,
  // };

  const { installmentSection } = buildInstallmentSectionConfigs({
    formValues,
    isInstallmentRequired,
    sectionKey: "installmentDetails",
    sectionTitle: "Installment",
    grossPremiumPath: "deviationSection.grossPremium",
    totalInstallmentAmountPath: "deviationSection.totalInstallmentAmount",
    runExternalValidatorsOnChange: false,
    dynamicValues: dyamicvalues,
  });

  const installmentSectionWithToggle = {
    ...installmentSection,
    disableAllFields: !isInstallmentRequired,
  };

  const installmentSummarySection = {
    key: "installmentSummarySection",
    config: [
      {
        key: "isPremiumInstallmentBased",
        name: "isPremiumInstallmentBased",
        type: "segmentedcontrol",
        label: isDeviationRequired
          ? "Premium is Installment Based*"
          : "Premium is Installment Based",
        rules: {
          validate: (value) => {
            if (isDeviationRequired && isValueMissing(value)) {
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
          clearFieldsOnChange: ["installmentDetails"],
        },
        disabled: !isDeviationRequired,
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
          const nestedValue = watch(
            "installmentSummarySection.isPremiumInstallmentBased"
          );
          const deviationValue = watch(
            "deviationSection.isPremiumInstallmentBased"
          );
          return (
            String(directValue ?? nestedValue ?? deviationValue) ===
            String(dyamicvalues?.TOGGLE_YES)
          );
        },
        disabled: !isDeviationRequired,
      },
    ],
    defaultValues: {
      isPremiumInstallmentBased: dyamicvalues?.TOGGLE_NO ?? null,
      totalInstallmentAmount: null,
    },
    disableAllFields: !isDeviationRequired,
  };

  return [
    {
      key: "insurerPolicyHardCopyDetails",
      config: [
        {
          key: "insurerPolicyNo",
          name: "insurerPolicyNo",
          type: "text",
          label: "Insurer policy no",
          rules: {
            required: {
              value: true,
              message: "Insurer policy no is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 1,
        },
        {
          key: "hardCopyReceivedOn",
          name: "hardCopyReceivedOn",
          type: "date",
          label: "Hard copy received on",
          rules: {
            required: {
              value: true,
              message: "Hard copy received date is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 2,
        },
      ],
    },
    {
      key: "deviationsAddressedSection",
      config: [
        {
          key: "deviationCoveragesLid",
          name: "deviationCoveragesLid",
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
            clearFieldsOnChange: [
              "deviationsAddressedLid",
              "resolutionLid",
              "policyHardCopyReceivedLid",
              "deviationsLid",
              "basicPremium",
              "brokeragePercentage",
              "brokerageAmount",
              "coverages",
              "exclusions",
              "deductibles",
            ],
          },
          activityOrder: 3,
        },
        {
          key: "deviationsAddressedLid",
          name: "deviationsAddressedLid",
          type: "segmentedcontrol",
          label: "Deviation addressed",
          rules: hasAnyDeviation
            ? {
                required: {
                  value: true,
                  message: "Deviation addressed is required",
                },
              }
            : {},

          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
            dependentField: "deviationCoverages",
            clearFieldsOnChange: ["resolutionLid", "policyHardCopyReceivedLid"],
          },
          disabled: !hasAnyDeviation,
          activityOrder: 4,
        },
        {
          key: "resolutionLid",
          name: "resolutionLid",
          type: "select",
          label: isDeviationAddressed ? "Resolution*" : "Resolution",
          rules: {
            validate: (value) => {
              if (isDeviationAddressed && isValueMissing(value)) {
                return "resolutionLid is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("RESOLUTION_TYPE")',
          },
          disabled: !isDeviationAddressed,
          activityOrder: 5,
        },
        {
          key: "policyHardCopyReceivedLid",
          name: "policyHardCopyReceivedLid",
          type: "segmentedcontrol",
          label: isDeviationAddressed
            ? "Revised policy hard copy Received*"
            : "Revised policy hard copy Received",
          rules: {
            validate: (value) => {
              if (isDeviationAddressed && isValueMissing(value)) {
                return "policyHardCopyReceivedLid is required";
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
            dependentField: "deviationCoverages",
          },
          disabled: !isDeviationAddressed,
          activityOrder: 6,
        },
      ],
      defaultValues: {
        deviationCoveragesLid: dyamicvalues?.TOGGLE_NO ?? null,
        deviationsAddressedLid: null,
        resolutionLid: null,
        policyHardCopyReceivedLid: null,
      },
    },

    {
      key: "deviationSection",
      title: "Enter Deviations",
      config: [
        {
          key: "deviationsLid",
          name: "deviationsLid",
          type: "segmentedcontrol",
          label: isDeviationAddressed
            ? "Any deviations from premium and brokerage*"
            : "Any deviations from premium and brokerage",
          rules: {
            validate: (value) => {
              if (isDeviationAddressed && isValueMissing(value)) {
                return "Any deviations from premium and brokerage is required";
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
            clearFieldsOnChange: [
              // "premium",
              // "brokeragePercentage",
              // "brokerageAmount",
              "coverages",
              "exclusions",
              "deductibles",
            ],
          },
          activityOrder: 7,
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
          disabled: !isDeviationRequired,
          activityOrder: 8,
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
          disabled: !isDeviationRequired,
          activityOrder: 9,
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
          disabled: !isDeviationRequired,
          activityOrder: 10,
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
          disabled: !isDeviationRequired,
          activityOrder: 11,
        },
        // {
        //   key: "terrorismBrokeragePercentage",
        //   name: "terrorismBrokeragePercentage",
        //   type: "number",
        //   label: isDeviationRequired
        //     ? "Terrorism brokerage percentage*"
        //     : "Terrorism brokerage percentage",
        //   rules: {
        //     validate: (value) => {
        //       if (isDeviationRequired && isValueMissing(value)) {
        //         return "Terrorism brokerage percentage is required";
        //       }
        //       return true;
        //     },

        //     max: {
        //       value: 100,
        //       message:
        //         "Terrorism brokerage percentage cannot be more than 100%",
        //     },
        //     min: {
        //       value: 0,
        //       message: "Terrorism brokerage percentage cannot be less than 0%",
        //     },
        //   },
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: withPercentageClamp({
        //     type: "number",
        //     fullWidth: true,
        //   }),
        //   apiDependencies: {
        //     dependentField: "anyDeviationsFromPremiumAndBrokerage",
        //   },
        //   disabled: !isDeviationRequired,
        //   activityOrder: 11,
        // },

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
          disabled: !isDeviationRequired,
          activityOrder: 12,
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
          disabled: !isDeviationRequired,
          activityOrder: 13,
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
          disabled: !isDeviationRequired,
          activityOrder: 14,
        },
        {
          key: "other",
          name: "other",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired ? "Other amount*" : "Other amount",

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
          disabled: !isDeviationRequired,
          activityOrder: 15,
        },
        {
          key: "grossPremium",
          name: "grossPremium",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired ? "Gross premium*" : "Gross premium",
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
          disabled: !isDeviationRequired,
          activityOrder: 16,
        },
        {
          key: "basicBrokeragePercentage",
          name: "basicBrokeragePercentage",
          type: "number",
          label: isDeviationRequired
            ? "Basic brokerage percentage*"
            : "Basic brokerage percentage",
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
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
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isDeviationRequired,
          activityOrder: 17,
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
          disabled: !isDeviationRequired,
          activityOrder: 18,
        },
        {
          key: "basicBrokerageAmount",
          name: "basicBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired
            ? "Basic brokerage amount*"
            : "Basic brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
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
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isDeviationRequired,
          activityOrder: 19,
        },
        {
          key: "tcBrokerageAmount",
          name: "tcBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired
            ? "Terrorism brokerage amount*"
            : "Terrorism brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
                return "Terrorism brokerage amount is required";
              }
              return true;
            },
          },
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          apiDependencies: {
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isDeviationRequired,
          activityOrder: 20,
        },
        {
          key: "totalBrokerageAmount",
          name: "totalBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired
            ? "Total brokerage amount*"
            : "Total brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
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
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: !isDeviationRequired,
          activityOrder: 21,
        },
        {
          key: "coverages",
          name: "coverages",
          type: "textarea",
          label: "Coverages",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },
          apiDependencies: {
            dependentField: "anyDeviations",
          },
          disabled: !isDeviationAddressed,
          activityOrder: 31,
        },
        {
          key: "exclusions",
          name: "exclusions",
          type: "textarea",
          label: "Exclusions",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },

          apiDependencies: {
            endPoint: "",
            dependentField: "anyDeviations",
          },
          disabled: !isDeviationAddressed,
          activityOrder: 32,
        },
        {
          key: "deductibles",
          name: "deductibles",
          type: "textarea",
          label: "Deductibles",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },

          apiDependencies: {
            dependentField: "anyDeviations",
          },
          disabled: !isDeviationAddressed,
          activityOrder: 33,
        },
        // As per the dicussion with team, currently hiding it
        // {
        //   key: "button",
        //   name: "button",
        //   type: "button",
        //   label: "Create task for deviation ",
        //   onClick: "createTaskForPolicyHardCopy",
        //   gridColumn: 9,
        //   disabled: !isDeviationRequired,
        //   componentProps: {
        //     variant: "primary",
        //     maxWidth: "180px",
        //   },
        // },
        ...deviationLeadFields,
      ],
      containerStyles: {
        gap: "16px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        boxShadow: "0px 0px 4px 0px #00000033",
        borderRadius: "8px",
        flexDirection: "column",
      },
      defaultValues: {
        basicPremium: null,
        basicBrokeragePercentage: null,
        basicBrokerageAmount: null,
        terrorismBrokeragePercentage: null,
        tcBrokerageAmount: null,
        totalBrokerageAmount: null,
        deductibles: null,
        exclusions: null,
        coverages: null,
        ...leadDefaults,
      },
      disableAllFields: !isDeviationAddressed,
    },
    insurerDetailsSectionWithToggle,
    installmentSummarySection,
    installmentSectionWithToggle,

    {
      key: "policyHardCopyCoversConfig",
      name: "policyHardCopyCoversConfig",
      title: "Basic Covers",
      config: [],
      containerStyles: {
        gap: "24px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
      },
      disableAllFields: !isDeviationAddressed,
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
            rows: 4,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 25,
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
            defaultDocumentTypeLookupKey: "DOCUMENT_TYPE_POLICY_DOCUMENT",
          },
          activityOrder: 26,
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

export const policyHardCopyConfigLanka = (formValues, dyamicvalues) => {
  const isYes = (value: unknown) =>
    String(value) === String(dyamicvalues?.TOGGLE_YES);
  const deviationCoverageValue =
    formValues?.deviationsAddressedSection?.deviationCoveragesLid;
  const hasAnyDeviation = isYes(deviationCoverageValue);

  const isDeviationAddressed =
    hasAnyDeviation &&
    isYes(formValues?.deviationsAddressedSection?.deviationsAddressedLid);

  const isDeviationRequired =
    isDeviationAddressed && isYes(formValues?.deviationSection?.deviationsLid);

  const installmentToggleValue =
    formValues?.installmentSummarySection?.isPremiumInstallmentBased ??
    formValues?.deviationSection?.isPremiumInstallmentBased;
  const isInstallmentRequired =
    String(installmentToggleValue) === String(dyamicvalues?.TOGGLE_YES);

  const { leadFields, leadDefaults, insurerDetailsSection } =
    buildInsurerSectionConfigs({
      formValues,
      dynamicValues: dyamicvalues,
      leadSectionKey: "deviationSection",
      basePremiumPath: "deviationSection.basicPremium",
      brokerageAmountPath: "deviationSection.brokerageAmount",
    });

  const deviationLeadFields = leadFields.map((field) => ({
    ...field,
    rules: isDeviationRequired ? field.rules : {},
    componentProps: {
      ...(field.componentProps || {}),
      disabled: field.key === "leadInsurerId" ? true : !isDeviationRequired,
    },
  }));

  const insurerDetailsSectionWithToggle = {
    ...insurerDetailsSection,
    disableAllFields: !isDeviationRequired,
  };

  const { installmentSection } = buildInstallmentSectionConfigs({
    formValues,
    isInstallmentRequired,
    sectionKey: "installmentDetails",
    sectionTitle: "Installment",
    grossPremiumPath: "deviationSection.grossPremium",
    totalInstallmentAmountPath: "deviationSection.totalInstallmentAmount",
    runExternalValidatorsOnChange: false,
    dynamicValues: dyamicvalues,
  });

  const installmentSectionWithToggle = {
    ...installmentSection,
    disableAllFields: !isInstallmentRequired,
  };

  const installmentSummarySection = {
    key: "installmentSummarySection",
    config: [
      {
        key: "isPremiumInstallmentBased",
        name: "isPremiumInstallmentBased",
        type: "segmentedcontrol",
        label: isDeviationRequired
          ? "Premium is Installment Based*"
          : "Premium is Installment Based",
        rules: {
          validate: (value) => {
            if (isDeviationRequired && isValueMissing(value)) {
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
          clearFieldsOnChange: ["installmentDetails"],
        },
        disabled: !isDeviationRequired,
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
        showField: (watch) =>
          String(
            watch("isPremiumInstallmentBased") ??
              watch("installmentSummarySection.isPremiumInstallmentBased") ??
              watch("deviationSection.isPremiumInstallmentBased")
          ) === String(dyamicvalues?.TOGGLE_YES),
        disabled: !isDeviationRequired,
      },
    ],
    defaultValues: {
      isPremiumInstallmentBased: dyamicvalues?.TOGGLE_NO ?? null,
      totalInstallmentAmount: null,
    },
    disableAllFields: !isDeviationRequired,
  };

  return [
    {
      key: "insurerPolicyHardCopyDetails",
      config: [
        {
          key: "insurerPolicyNo",
          name: "insurerPolicyNo",
          type: "text",
          label: "Insurer policy no",
          rules: {
            required: {
              value: true,
              message: "Insurer policy no is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 1,
        },
        {
          key: "hardCopyReceivedOn",
          name: "hardCopyReceivedOn",
          type: "date",
          label: "Hard copy received on",
          rules: {
            required: {
              value: true,
              message: "Hard copy received date is required",
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          activityOrder: 2,
        },
      ],
    },
    {
      key: "deviationsAddressedSection",
      config: [
        {
          key: "deviationCoveragesLid",
          name: "deviationCoveragesLid",
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
            clearFieldsOnChange: [
              "deviationsAddressedLid",
              "resolutionLid",
              "policyHardCopyReceivedLid",
              "deviationsLid",
              "basicPremium",
              "brokeragePercentage",
              "brokerageAmount",
              "coverages",
              "exclusions",
              "deductibles",
            ],
          },
          activityOrder: 3,
        },
        {
          key: "deviationsAddressedLid",
          name: "deviationsAddressedLid",
          type: "segmentedcontrol",
          label: "Deviation addressed",
          rules: hasAnyDeviation
            ? {
                required: {
                  value: true,
                  message: "Deviation addressed is required",
                },
              }
            : {},
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
            dependentField: "deviationCoverages",
            clearFieldsOnChange: ["resolutionLid", "policyHardCopyReceivedLid"],
          },
          disabled: !hasAnyDeviation,
          activityOrder: 4,
        },
        {
          key: "resolutionLid",
          name: "resolutionLid",
          type: "select",
          label: isDeviationAddressed ? "Resolution*" : "Resolution",
          rules: {
            validate: (value) => {
              if (isDeviationAddressed && isValueMissing(value)) {
                return "resolutionLid is required";
              }
              return true;
            },
          },
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("RESOLUTION_TYPE")',
          },
          disabled: !isDeviationAddressed,
          activityOrder: 5,
        },
        {
          key: "policyHardCopyReceivedLid",
          name: "policyHardCopyReceivedLid",
          type: "segmentedcontrol",
          label: isDeviationAddressed
            ? "Revised policy hard copy Received*"
            : "Revised policy hard copy Received",
          rules: {
            validate: (value) => {
              if (isDeviationAddressed && isValueMissing(value)) {
                return "policyHardCopyReceivedLid is required";
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
            dependentField: "deviationCoverages",
          },
          disabled: !isDeviationAddressed,
          activityOrder: 6,
        },
      ],
      defaultValues: {
        deviationCoveragesLid: dyamicvalues?.TOGGLE_NO ?? null,
        resolutionLid: null,
        policyHardCopyReceivedLid: null,
        insurerPolicyNo: null,
      },
    },

    {
      key: "deviationSection",
      title: "Enter Deviations",
      config: [
        {
          key: "deviationsLid",
          name: "deviationsLid",
          type: "segmentedcontrol",
          label: isDeviationAddressed
            ? "Any deviations from premium and brokerage*"
            : "Any deviations from premium and brokerage",
          rules: {
            validate: (value) => {
              if (isDeviationAddressed && isValueMissing(value)) {
                return "Any deviations from premium and brokerage is required";
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
            clearFieldsOnChange: [
              // "premium",
              // "brokeragePercentage",
              // "brokerageAmount",
              "coverages",
              "exclusions",
              "deductibles",
            ],
          },
          activityOrder: 7,
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
          disabled: !isDeviationRequired,
          activityOrder: 8,
        },
        {
          key: "srccAmount",
          name: "srccAmount",
          isDecimal: true,
          label: isDeviationRequired
            ? "SRCC premium amount *"
            : "SRCC premium amount",
          type: "number",
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
          disabled: !isDeviationRequired,
          activityOrder: 9,
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
          disabled: !isDeviationRequired,
          activityOrder: 10,
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
          disabled: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
          },
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
          activityOrder: 11,
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
          disabled: !isDeviationRequired,
          activityOrder: 12,
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
          disabled: !isDeviationRequired,
          activityOrder: 13,
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
          disabled: !isDeviationRequired,
          activityOrder: 14,
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
          disabled: !isDeviationRequired,
          activityOrder: 17,
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
          disabled: !isDeviationRequired,
          activityOrder: 15,
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
          disabled: !isDeviationRequired,
          // disable: true,
          activityOrder: 16,
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
          gridColumn: 5,
          disabled: true,
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
          activityOrder: 18,
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
          disabled: !isDeviationRequired,
          activityOrder: 19,
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
          disabled: !isDeviationRequired,
          activityOrder: 20,
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
          disabled: !isDeviationRequired,
          activityOrder: 21,
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
          // disabled: !isDeviationRequired,
          disable: true,
          activityOrder: 22,
        },
        {
          key: "srccBrokerageAmount",
          name: "srccBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired
            ? "SRCC brokerage amount*"
            : "SRCC brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
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
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          // disabled: !isDeviationRequired,
          disable: true,
          activityOrder: 23,
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
          // disabled: !isDeviationRequired,
          disable: true,
          activityOrder: 24,
        },

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
        //   disabled: !isDeviationRequired,
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
        //   disabled: !isDeviationRequired,
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
        //   disabled: !isDeviationRequired,
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
        //   disabled: !isDeviationRequired,
        // },

        // {
        //   key: "brokeragePercentage",
        //   name: "brokeragePercentage",
        //   type: "number",
        //   label: isDeviationRequired
        //     ? "Brokerage percentage*"
        //     : "Brokerage percentage",
        //   rules: {
        //     validate: (value) => {
        //       if (isDeviationRequired && isValueMissing(value)) {
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
        //     dependentField: "anyDeviationsFromPremiumAndBrokerage",
        //   },
        //   disabled: !isDeviationRequired,
        // },
        {
          key: "brokerageAmount",
          name: "brokerageAmount",
          type: "number",
          isDecimal: true,
          label: isDeviationRequired
            ? "Total brokerage amount*"
            : "Total brokerage amount",
          gridColumn: 5,
          formatNumber: true,
          rules: {
            validate: (value) => {
              if (isDeviationRequired && isValueMissing(value)) {
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
            dependentField: "anyDeviationsFromPremiumAndBrokerage",
          },
          disabled: true,
          activityOrder: 25,
        },
        // {
        //   key: "totalGrossPremiumIncTax",
        //   name: "totalGrossPremiumIncTax",
        //   label: isDeviationRequired
        //     ? "Total Gross Premium Including Tax*"
        //     : "Total Gross Premium Including Tax",
        //   type: "number",
        //   disabled: true,
        //   formatNumber: true,
        //   gridColumn: 5,
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
        {
          key: "coverages",
          name: "coverages",
          type: "textarea",
          label: "Coverages",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },
          apiDependencies: {
            dependentField: "anyDeviations",
          },
          disabled: !isDeviationAddressed,
          activityOrder: 31,
        },
        {
          key: "exclusions",
          name: "exclusions",
          type: "textarea",
          label: "Exclusions",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },

          apiDependencies: {
            endPoint: "",
            dependentField: "anyDeviations",
          },
          disabled: !isDeviationAddressed,
          activityOrder: 32,
        },
        {
          key: "deductibles",
          name: "deductibles",
          type: "textarea",
          label: "Deductibles",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
          },

          apiDependencies: {
            dependentField: "anyDeviations",
          },
          disabled: !isDeviationAddressed,
          activityOrder: 33,
        },
        ...deviationLeadFields,
        // As per the dicussion with team, currently hiding it
        // {
        //   key: "button",
        //   name: "button",
        //   type: "button",
        //   label: "Create task for deviation ",
        //   onClick: "createTaskForPolicyHardCopy",
        //   gridColumn: 9,
        //   disabled: !isDeviationRequired,
        //   componentProps: {
        //     variant: "primary",
        //     maxWidth: "180px",
        //   },
        // },
      ],
      containerStyles: {
        gap: "16px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        boxShadow: "0px 0px 4px 0px #00000033",
        borderRadius: "8px",
        flexDirection: "column",
      },
      defaultValues: {
        basicPremium: null,
        brokeragePercentage: null,
        brokerageAmount: null,
        deductibles: null,
        exclusions: null,
        coverages: null,
        ...leadDefaults,
      },
      disableAllFields: !isDeviationAddressed,
    },
    insurerDetailsSectionWithToggle,
    installmentSummarySection,
    installmentSectionWithToggle,
    {
      key: "policyHardCopyCoversConfig",
      name: "policyHardCopyCoversConfig",
      title: "Basic Covers",
      config: [],
      containerStyles: {
        gap: "24px",
        border: "1px solid #eaeaea",
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
      },
      disableAllFields: !isDeviationAddressed,
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
            rows: 4,
            fullWidth: true,
            multiline: true,
          },
          activityOrder: 29,
        },
      ],
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
            defaultDocumentTypeLookupKey: "DOCUMENT_TYPE_POLICY_DOCUMENT",
          },
          activityOrder: 30,
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
