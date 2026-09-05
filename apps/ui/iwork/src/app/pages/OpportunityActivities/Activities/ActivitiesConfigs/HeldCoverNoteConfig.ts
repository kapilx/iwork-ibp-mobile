import { REGEX_PATTERNS } from "@ui/ui-lib/constants";
import { withPercentageClamp } from "@ui/ui-lib/utils";
import { buildInsurerSectionConfigs } from "./sharedInsurerConfig";
import { buildInstallmentSectionConfigs } from "./sharedInstallmentsConfig";

export const heldCoverNoteConfig = (formValues, dyamicvalues) => {
  const YES = dyamicvalues?.TOGGLE_YES;
  const isSubmitForApproval = !!dyamicvalues?.isActivitySubmitForApprovalStatus;

  const isDeviationRequired =
    formValues?.placementSlipDeviationsSection?.placementSlipDeviationsLid ===
    YES;

  const isDeviationAddressed =
    formValues?.deviationsAddressedSection?.deviationsAddressedLid === YES;

  const isRevisedHeldCoverNoteYes =
    formValues?.deviationsAddressedSection?.revisedHeldCoverNoteLid === YES;

  const requireFollowups =
    isDeviationRequired && isDeviationAddressed && isRevisedHeldCoverNoteYes;
  const isInstallmentRequired =
    requireFollowups &&
    String(formValues?.premiumReceiptDetailsSection?.isPremiumInstallmentBased) ===
      String(YES);


  const { leadFields, leadDefaults, insurerDetailsSection } =
    buildInsurerSectionConfigs({
      formValues,
      dynamicValues: dyamicvalues,
      leadSectionKey: "premiumReceiptLeadSection",
      basePremiumPath: "premiumReceiptDetailsSection.basicPremium",
      brokerageAmountPath: "premiumReceiptDetailsSection.basicBrokerageAmount",
      totalBrokerageAmountPath:
        "premiumReceiptDetailsSection.totalBrokerageAmount",
      runExternalValidatorsOnChange: true,
      additionalCommissions: [
        {
          percentageKey: "terrorismBrokeragePercentage",
          amountKey: "terrorismBrokerageAmount",
          label: "Terrorism brokerage amount",
          sharePercentageKey: "terrorismSharePercentage",
          shareAmountKey: "terrorismShareAmount",
          shareLabel: "Terrorism",
          premiumBasePath: "premiumReceiptDetailsSection.terrorism",
          policyAmountPath: "premiumReceiptDetailsSection.tcBrokerageAmount",
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

  const premiumReceiptLeadFields = leadFields.map((fieldConfig) => ({
    ...fieldConfig,
    rules: requireFollowups ? fieldConfig.rules : {},
    componentProps: {
      ...(fieldConfig.componentProps || {}),
      disabled: fieldConfig.key === "leadInsurerId" ? true : !requireFollowups,
    },
  }));

  const insurerDetailsSectionWithToggle = {
    ...insurerDetailsSection,
    disableAllFields: !requireFollowups,
  };

  const { installmentSection } = buildInstallmentSectionConfigs({
    formValues,
    isInstallmentRequired,
    sectionKey: "installmentDetails",
    sectionTitle: "Installment",
    grossPremiumPath: "premiumReceiptDetailsSection.grossPremium",
    totalInstallmentAmountPath:
      "premiumReceiptDetailsSection.totalInstallmentAmount",
    runExternalValidatorsOnChange: false,
  });

  const installmentSectionWithToggle = {
    ...installmentSection,
    disableAllFields: !isInstallmentRequired,
  };

  return [
    {
      key: "placementSlipDeviationsSection",
      config: [
        {
          key: "placementSlipDeviationsLid",
          name: "placementSlipDeviationsLid",
          type: "segmentedcontrol",
          label: "Any deviations from placement slip",
          rules: {
            required: {
              value: true,
              message: "Placement slip deviation is required",
            },
          },
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: isSubmitForApproval },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
          },
          isProcessRequired: true,
          activityOrder: 1,
        },
      ],
      defaultValues: {
        placementSlipDeviationsLid: dyamicvalues?.TOGGLE_NO,
      },
    },
    {
      key: "deviationSection",
      title: "Enter deviations",
      config: [
        {
          key: "deviations",
          name: "deviations",
          type: "text",
          label: "Enter deviations",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
            disabled: isSubmitForApproval || !isDeviationRequired,
          },
          apiDependencies: {
            dependentField: "placementSlipDeviations",
          },
          rules: isDeviationRequired
            ? {
                required: {
                  value: true,
                  message: "Deviation is required",
                },
              }
            : {},
          activityOrder: 2,
        },
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
        //     disabled: isSubmitForApproval || !isDeviationRequired,
        //   },
        // },
      ],
      defaultValues: { deviations: "" },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "deviationsAddressedSection",
      config: [
        {
          key: "deviationsAddressedLid",
          name: "deviationsAddressedLid",
          type: "segmentedcontrol",
          label: "Deviation addressed",
          rules: isDeviationRequired
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
            disabled: isSubmitForApproval || !isDeviationRequired,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
            clearFieldsOnChange: ["resolutionLid", "revisedHeldCoverNoteLid"],
          },
          isProcessRequired: true,
          activityOrder: 3,
        },
        {
          key: "resolutionLid",
          name: "resolutionLid",
          type: "select",
          label: "Resolution",
          rules: isDeviationAddressed
            ? {
                value: true,
                message: "Resolution is required",
                required: { value: true, message: "Resolution is required" },
              }
            : {},
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: !isDeviationAddressed },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("RESOLUTION_TYPE")',
          },
          isProcessRequired: true,
          activityOrder: 4,
        },
        {
          key: "revisedHeldCoverNoteLid",
          name: "revisedHeldCoverNoteLid",
          type: "segmentedcontrol",
          label: "Revised held cover note received",
          rules: isDeviationAddressed
            ? {
                required: {
                  value: true,
                  message: "Revised held cover note received is required",
                },
              }
            : {},
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: !isDeviationAddressed },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
            dependentField: "placementSlipDeviations",
          },
          isProcessRequired: true,
          activityOrder: 5,
        },
      ],
      defaultValues: {
        deviationsAddressedLid: null,
        resolutionLid: null,
        revisedHeldCoverNoteLid: null,
      },
    },
    {
      key: "premiumReceiptDetailsSection",
      title: "Premium receipt details",
      config: [
        {
          key: "acknowledgedBy",
          name: "acknowledgedBy",
          type: "selectFieldByApi",
          label: "Acknowledgement by",
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: !requireFollowups },
          apiDependencies: {
            endPoint: "#endPoints.usersListInEmployee",
            utilityFunction: "#usersListUtilityFunction",
            customParams: {
              searchBy: "firstName",
              sortBy: "firstName",
              sortOrder: "ASC",
            },
          },
          isProcessRequired: true,
          activityOrder: 6,
        },
        {
          key: "receiptDate",
          name: "receiptDate",
          type: "date",
          label: "Receipt Date",
          rules: requireFollowups
            ? { required: { value: true, message: "Receipt date is required" } }
            : {},
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            maxDate: "#dayjs()",
            disabled: !requireFollowups,
          },
          activityOrder: 7,
        },
        {
          key: "receiptNo",
          name: "receiptNo",
          type: "text",
          label: "Receipt no",
          rules: requireFollowups
            ? { required: { value: true, message: "Receipt no is required" } }
            : {},
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: !requireFollowups },
          activityOrder: 8,
        },
        {
          key: "allDocumentsReceivedDate",
          name: "allDocumentsReceivedDate",
          type: "date",
          label: "All documents received on",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "All documents received date is required",
                },
              }
            : {},
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            maxDate: "#dayjs()",
            disabled: !requireFollowups,
          },
          activityOrder: 9,
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
            disabled: !requireFollowups,
          },
          activityOrder: 10,
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
            disabled: !requireFollowups,
          },
          activityOrder: 11,
        },
        {
          key: "terrorism",
          name: "terrorism",
          label: "Terrorism amount",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
            disabled: !requireFollowups,
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Terrorism amount must be a positive numeric value",
            },
          },
          activityOrder: 12,
        },
        {
          key: "netPremium",
          name: "netPremium",
          label: "Net premium",
          type: "number",
          isDecimal: true,
          formatNumber: true,
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            type: "number",
            disabled: true,
          },
          rules: {
            pattern: {
              value: REGEX_PATTERNS.NUMERIC,
              message: "Net premium must be a positive numeric value",
            },
          },
          activityOrder: 13,
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
          },
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            disabled: !requireFollowups,
          }),
          activityOrder: 14,
        },
        {
          key: "gstAmount",
          name: "gstAmount",
          type: "number",
          isDecimal: true,
          label: "GST (Amount calculated)",
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
            disabled: !requireFollowups,
          },
          activityOrder: 15,
        },
        {
          key: "fee",
          name: "fee",
          type: "number",
          label: "Fee",
          isDecimal: true,
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
            disabled: !requireFollowups,
          },
          activityOrder: 16,
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
            disabled: !requireFollowups,
          },
          activityOrder: 17,
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
          activityOrder: 18,
        },
        {
          key: "basicBrokeragePercentage",
          name: "basicBrokeragePercentage",
          type: "number",
          label: "Basic brokerage percentage",
          rules: requireFollowups
            ? {
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
              }
            : {},
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          }),
          activityOrder: 19,
        },
        {
          key: "terrorismBrokeragePercentage",
          name: "terrorismBrokeragePercentage",
          type: "number",
          label: "Terrorism brokerage percentage",
          isDecimal: true,
          gridColumn: 5,
          componentProps: withPercentageClamp({
            fullWidth: true,
            disabled: !requireFollowups,
          }),
          rules: {
            max: {
              value: 100,
              message: "Terrorism brokerage percentage cannot exceed 100",
            },
            min: {
              value: 0,
              message: "Terrorism brokerage percentage cannot be negative",
            },
          },
          activityOrder: 20,
        },

        {
          key: "basicBrokerageAmount",
          name: "basicBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Basic brokerage amount",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Basic brokerage amount is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
          activityOrder: 21,
        },
        {
          key: "tcBrokerageAmount",
          name: "tcBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Terrorism brokerage amount",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Terrorism brokerage amount is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
          activityOrder: 22,
        },
        {
          key: "totalBrokerageAmount",
          name: "totalBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Total brokerage amount",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Total brokerage amount is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: true,
          },
          activityOrder: 23,
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
            disabled: !requireFollowups,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
          },
          activityOrder: 24,
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
              "premiumReceiptDetailsSection.isPremiumInstallmentBased"
            );
            return (
              String(directValue ?? nestedValue) ===
              String(dyamicvalues?.TOGGLE_YES)
            );
          },
          activityOrder: 25,
        },
      ],
      defaultValues: {
        acknowledgedBy: null,
        isPremiumInstallmentBased: dyamicvalues?.TOGGLE_NO ?? null,
        totalInstallmentAmount: null,
      },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    installmentSectionWithToggle,
    {
      key: "premiumReceiptLeadSection",
      title: "Insurer details",
      config: premiumReceiptLeadFields,
      defaultValues: {
        ...leadDefaults,
      },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    insurerDetailsSectionWithToggle,
    {
      key: "basicCovers",
      title: "Basic covers",
      config: [],
      containerStyles: {
        gap: "24px",
        border: '1px solid "#eaeaea"',
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
      },
      disableAllFields: !requireFollowups,
      isCoversRequired: true,
      defaultValues: {
        acknowledgedBy: null,
        receiptDate: null,
        receiptNo: "",
        allDocumentsReceivedDate: null,
        basicBrokeragePercentage: null,
        basicBrokerageAmount: null,
      },
    },
    {
      key: "remarksSection",
      config: [
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9,
          componentProps: { rows: 3, fullWidth: true, multiline: true },
          activityOrder: 24,
        },
      ],
      defaultValues: { remarks: "" },
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
          componentProps: { isDocumentTypeRequired: true, isDocumentRequired: true, fullWidth: true, companyType: "opportunity" },
          activityOrder: 25,
        },
      ],
      defaultValues: [{ documentId: null, documentTypeLid: null }],
    },
  ];
};

//duplicating the config for sri lankan users

export const heldCoverNoteConfigLanka = (formValues, dyamicvalues) => {
  const YES = dyamicvalues?.TOGGLE_YES;
  const isSubmitForApproval = !!dyamicvalues?.isActivitySubmitForApprovalStatus;

  const isDeviationRequired =
    formValues?.placementSlipDeviationsSection?.placementSlipDeviationsLid ===
    YES;

  const isDeviationAddressed =
    formValues?.deviationsAddressedSection?.deviationsAddressedLid === YES;

  const isRevisedHeldCoverNoteYes =
    formValues?.deviationsAddressedSection?.revisedHeldCoverNoteLid === YES;

  const requireFollowups =
    isDeviationRequired && isDeviationAddressed && isRevisedHeldCoverNoteYes;
  const isInstallmentRequired =
    requireFollowups &&
    String(formValues?.premiumReceiptDetailsSection?.isPremiumInstallmentBased) ===
      String(YES);

  const {
    leadFields: leadFieldsLanka,
    leadDefaults: leadDefaultsLanka,
    insurerDetailsSection: insurerDetailsSectionLanka,
  } = buildInsurerSectionConfigs({
    formValues,
    dynamicValues: dyamicvalues,
    leadSectionKey: "premiumReceiptLeadSection",
    basePremiumPath: "premiumReceiptDetailsSection.basicPremium",
    brokerageAmountPath: "premiumReceiptDetailsSection.brokerageAmount",
  });

  const premiumReceiptLeadFieldsLanka = leadFieldsLanka.map((fieldConfig) => ({
    ...fieldConfig,
    rules: requireFollowups ? fieldConfig.rules : {},
    componentProps: {
      ...(fieldConfig.componentProps || {}),
      disabled: fieldConfig.key === "leadInsurerId" ? true : !requireFollowups,
    },
  }));

  const insurerDetailsSectionLankaWithToggle = {
    ...insurerDetailsSectionLanka,
    disableAllFields: !requireFollowups,
  };

  const { installmentSection: installmentSectionLanka } =
    buildInstallmentSectionConfigs({
      formValues,
      isInstallmentRequired,
      sectionKey: "installmentDetails",
      sectionTitle: "Installment",
      grossPremiumPath: "premiumReceiptDetailsSection.grossPremium",
      totalInstallmentAmountPath:
        "premiumReceiptDetailsSection.totalInstallmentAmount",
      runExternalValidatorsOnChange: false,
    });

  const installmentSectionLankaWithToggle = {
    ...installmentSectionLanka,
    disableAllFields: !isInstallmentRequired,
  };

  return [
    {
      key: "placementSlipDeviationsSection",
      config: [
        {
          key: "placementSlipDeviationsLid",
          name: "placementSlipDeviationsLid",
          type: "segmentedcontrol",
          label: "Any deviations from placement slip",
          rules: {
            required: {
              value: true,
              message: "Placement slip deviation is required",
            },
          },
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: isSubmitForApproval },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
          },
          isProcessRequired: true,
          activityOrder: 1,
        },
      ],
    },
    {
      key: "deviationSection",
      title: "Enter deviations",
      config: [
        {
          key: "deviations",
          name: "deviations",
          type: "text",
          label: "Enter deviations",
          gridColumn: 9,
          componentProps: {
            rows: 4,
            fullWidth: true,
            multiline: true,
            disabled: isSubmitForApproval || !isDeviationRequired,
          },
          apiDependencies: {
            dependentField: "placementSlipDeviations",
          },
          rules: isDeviationRequired
            ? {
                required: {
                  value: true,
                  message: "Deviation is required",
                },
              }
            : {},
          activityOrder: 2,
        },
      ],
      defaultValues: { deviations: "" },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    {
      key: "deviationsAddressedSection",
      config: [
        {
          key: "deviationsAddressedLid",
          name: "deviationsAddressedLid",
          type: "segmentedcontrol",
          label: "Deviation addressed",
          rules: isDeviationRequired
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
            disabled: isSubmitForApproval || !isDeviationRequired,
          },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
            clearFieldsOnChange: ["resolutionLid", "revisedHeldCoverNoteLid"],
          },
          isProcessRequired: true,
          activityOrder: 3,
        },
        {
          key: "resolutionLid",
          name: "resolutionLid",
          type: "select",
          label: "Resolution",
          rules: isDeviationAddressed
            ? {
                value: true,
                message: "Resolution is required",
                required: { value: true, message: "Resolution is required" },
              }
            : {},
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: !isDeviationAddressed },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("RESOLUTION_TYPE")',
          },
          isProcessRequired: true,
          activityOrder: 4,
        },
        {
          key: "revisedHeldCoverNoteLid",
          name: "revisedHeldCoverNoteLid",
          type: "segmentedcontrol",
          label: "Revised held cover note received",
          rules: isDeviationAddressed
            ? {
                required: {
                  value: true,
                  message: "Revised held cover note received is required",
                },
              }
            : {},
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: !isDeviationAddressed },
          apiDependencies: {
            endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
            dependentField: "placementSlipDeviations",
          },
          isProcessRequired: true,
          activityOrder: 5,
        },
      ],
      defaultValues: {
        deviationsAddressedLid: null,
        resolutionLid: null,
        revisedHeldCoverNoteLid: null,
      },
    },
    {
      key: "premiumReceiptDetailsSection",
      title: "Premium receipt details",
      config: [
        {
          key: "acknowledgedBy",
          name: "acknowledgedBy",
          type: "selectFieldByApi",
          label: "Acknowledgement by",
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: !requireFollowups },
          apiDependencies: {
            endPoint: "#endPoints.usersListInEmployee",
            utilityFunction: "#usersListUtilityFunction",
            customParams: {
              searchBy: "firstName",
              sortBy: "firstName",
              sortOrder: "ASC",
            },
          },
          isProcessRequired: true,
          activityOrder: 6,
        },
        {
          key: "receiptDate",
          name: "receiptDate",
          type: "date",
          label: "Receipt Date",
          rules: requireFollowups
            ? { required: { value: true, message: "Receipt date is required" } }
            : {},
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            maxDate: "#dayjs()",
            disabled: !requireFollowups,
          },
          activityOrder: 7,
        },
        {
          key: "receiptNo",
          name: "receiptNo",
          type: "text",
          label: "Receipt no",
          rules: requireFollowups
            ? { required: { value: true, message: "Receipt no is required" } }
            : {},
          gridColumn: 5,
          componentProps: { fullWidth: true, disabled: !requireFollowups },
          activityOrder: 8,
        },
        {
          key: "allDocumentsReceivedDate",
          name: "allDocumentsReceivedDate",
          type: "date",
          label: "All documents received on",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "All documents received date is required",
                },
              }
            : {},
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            maxDate: "#dayjs()",
            disabled: !requireFollowups,
          },
          activityOrder: 9,
        },
        {
          key: "basicPremium",
          name: "basicPremium",
          type: "number",
          isDecimal: true,
          label: "Basic premium",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Basic premium is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
          activityOrder: 10,
        },
        {
          key: "srccAmount",
          name: "srccAmount",
          type: "number",
          isDecimal: true,
          label: "SRCC premium amount",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "SRCC premium amount is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
          activityOrder: 11,
        },
        {
          key: "terrorismCommission",
          name: "terrorismCommission",
          type: "number",
          isDecimal: true,
          label: "TC premium amount",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "TC premium amount is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
          activityOrder: 12,
        },
        {
          key: "netPremium",
          name: "netPremium",
          type: "number",
          isDecimal: true,
          label: "Total Net Premium",
          disabled: true,
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Total Net Premium is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: true,
          },
          activityOrder: 13,
        },
        {
          key: "adminCharges",
          name: "adminCharges",
          type: "number",
          isDecimal: true,
          label: "Admin charges",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Admin charges are required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
          activityOrder: 14,
        },
        {
          key: "other",
          name: "other",
          type: "number",
          isDecimal: true,
          label: "Stamp duty",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Stamp duty is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
          activityOrder: 15,
        },
        {
          key: "cessAmount",
          name: "cessAmount",
          type: "number",
          isDecimal: true,
          label: "cess",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "cess is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
        },
        {
          key: "fee",
          name: "fee",
          type: "number",
          isDecimal: true,
          label: "Policy fee",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Policy fee is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          },
          activityOrder: 16,
        },
        {
          key: "serviceTaxPercentage",
          name: "serviceTaxPercentage",
          type: "number",
          label: "VAT percentage",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "VAT percentage is required",
                },
                min: {
                  value: 0,
                  message: "VAT percentage cannot be negative",
                },
                max: {
                  value: 100,
                  message: "VAT percentage cannot exceed 100",
                },
              }
            : {},
          gridColumn: 5,
          isDecimal: true,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          }),
          activityOrder: 17,
        },
        {
          key: "serviceTaxAmount",
          name: "serviceTaxAmount",
          type: "number",
          isDecimal: true,
          label: "VAT",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "VAT is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disable: !requireFollowups,
          },
          activityOrder: 18,
        },
        {
          key: "totalGrossPremiumIncTaxCharges",
          name: "totalGrossPremiumIncTaxCharges",
          type: "number",
          isDecimal: true,
          label: "Total gross premium including tax & other charges",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message:
                    "Total gross premium including tax & other charges is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          disabled: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: true,
          },
          activityOrder: 20,
        },
        {
          key: "basicPremiumPercentage",
          name: "basicPremiumPercentage",
          type: "number",
          label: "Basic brokerage percentage",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Basic brokerage percentage is required",
                },
                min: {
                  value: 0,
                  message: "Basic brokerage percentage cannot be negative",
                },
                max: {
                  value: 100,
                  message: "Basic brokerage percentage cannot exceed 100",
                },
              }
            : {},
          gridColumn: 5,
          isDecimal: true,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          }),
          activityOrder: 21,
        },
        {
          key: "srccPercentage",
          name: "srccPercentage",
          type: "number",
          label: "SRCC brokerage percentage",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "SRCC brokerage percentage is required",
                },
                min: {
                  value: 0,
                  message: "SRCC brokerage percentage cannot be negative",
                },
                max: {
                  value: 100,
                  message: "SRCC brokerage percentage cannot exceed 100",
                },
              }
            : {},
          gridColumn: 5,
          isDecimal: true,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          }),
          activityOrder: 22,
        },
        {
          key: "terrorismBrokeragePercentage",
          name: "terrorismBrokeragePercentage",
          type: "number",
          label: "TC brokerage percentage",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "TC brokerage percentage is required",
                },
                min: {
                  value: 0,
                  message: "TC brokerage percentage cannot be negative",
                },
                max: {
                  value: 100,
                  message: "TC brokerage percentage cannot exceed 100",
                },
              }
            : {},
          gridColumn: 5,
          isDecimal: true,
          componentProps: withPercentageClamp({
            type: "number",
            fullWidth: true,
            disabled: !requireFollowups,
          }),
          activityOrder: 23,
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
            // disabled: !requireFollowups,
            disabled: true,
          },
          formatNumber: true,
          activityOrder: 24,
        },
        {
          key: "srccBrokerageAmount",
          name: "srccBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "SRCC brokerage amount",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "SRCC brokerage amount is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            // disabled: !requireFollowups,
            disabled: true,
          },
          activityOrder: 25,
        },
        {
          key: "tcBrokerageAmount",
          name: "tcBrokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Terrorism brokerage amount",
          gridColumn: 5,
          componentProps: {
            fullWidth: true,
            // disabled: !requireFollowups,
            disabled: true,
          },
          formatNumber: true,
          activityOrder: 26,
        },

        // {
        //   key: "totalGrossPremiumIncTax",
        //   name: "totalGrossPremiumIncTax",
        //   type: "number",
        //   disabled: true,
        //   label: "Total gross premium including tax",
        //   rules: requireFollowups
        //     ? {
        //         required: {
        //           value: true,
        //           message: "Total gross premium including tax is required",
        //         },
        //       }
        //     : {},
        //   gridColumn: 5,
        //   formatNumber: true,
        //   componentProps: {
        //     type: "number",
        //     fullWidth: true,
        //     disabled: !requireFollowups,
        //   },
        // },

        // {
        //   key: "feePercentage",
        //   name: "feePercentage",
        //   type: "number",
        //   label: "Policy fee percentage",
        //   rules: requireFollowups
        //     ? {
        //         required: {
        //           value: true,
        //           message: "Policy fee percentage is required",
        //         },
        //         min: {
        //           value: 0,
        //           message: "Policy fee percentage cannot be negative",
        //         },
        //         max: {
        //           value: 100,
        //           message: "Policy fee percentage cannot exceed 100",
        //         },
        //       }
        //     : {},
        //   gridColumn: 5,
        //   isDecimal: true,
        //   componentProps: {
        //     type: "number",
        //     fullWidth: true,
        //     disabled: !requireFollowups,
        //   },
        // },

        // {
        //   key: "otherPercentage",
        //   name: "otherPercentage",
        //   type: "number",
        //   label: "Stamp duty percentage",
        //   rules: requireFollowups
        //     ? {
        //         required: {
        //           value: true,
        //           message: "Stamp duty percentage is required",
        //         },
        //         min: {
        //           value: 0,
        //           message: "Stamp duty percentage cannot be negative",
        //         },
        //         max: {
        //           value: 100,
        //           message: "Stamp duty percentage cannot exceed 100",
        //         },
        //       }
        //     : {},
        //   gridColumn: 5,
        //   isDecimal: true,
        //   componentProps: {
        //     type: "number",
        //     fullWidth: true,
        //     disabled: !requireFollowups,
        //   },
        // },

        // {
        //   key: "adminChargesPercentage",
        //   name: "adminChargesPercentage",
        //   type: "number",
        //   label: "Admin charges percentage",
        //   rules: requireFollowups
        //     ? {
        //         required: {
        //           value: true,
        //           message: "Admin charges percentage is required",
        //         },
        //         min: {
        //           value: 0,
        //           message: "Admin charges percentage cannot be negative",
        //         },
        //         max: {
        //           value: 100,
        //           message: "Admin charges percentage cannot exceed 100",
        //         },
        //       }
        //     : {},
        //   gridColumn: 5,
        //   isDecimal: true,
        //   componentProps: {
        //     type: "number",
        //     fullWidth: true,
        //     disabled: !requireFollowups,
        //   },
        // },

        // {
        //   key: "cessPercentage",
        //   name: "cessPercentage",
        //   type: "number",
        //   label: "Cess percentage",
        //   rules: requireFollowups
        //     ? {
        //         required: {
        //           value: true,
        //           message: "Cess percentage is required",
        //         },
        //         min: {
        //           value: 0,
        //           message: "Cess percentage cannot be negative",
        //         },
        //         max: {
        //           value: 100,
        //           message: "Cess percentage cannot exceed 100",
        //         },
        //       }
        //     : {},
        //   gridColumn: 5,
        //   isDecimal: true,
        //   componentProps: {
        //     type: "number",
        //     fullWidth: true,
        //     disabled: !requireFollowups,
        //   },
        // },

        // {
        //   key: "brokeragePercentage",
        //   name: "brokeragePercentage",
        //   type: "number",
        //   label: "Brokerage Percentage",
        //   rules: requireFollowups
        //     ? {
        //         max: {
        //           value: 100,
        //           message: "Brokerage percentage cannot exceed 100",
        //         },
        //         min: {
        //           value: 0,
        //           message: "Brokerage percentage cannot be negative",
        //         },
        //         required: {
        //           value: true,
        //           message: "Brokerage percentage is required",
        //         },
        //       }
        //     : {},
        //   isDecimal: true,
        //   gridColumn: 5,
        //   componentProps: {
        //     type: "number",
        //     fullWidth: true,
        //     disabled: !requireFollowups,
        //   },
        // },
        {
          key: "brokerageAmount",
          name: "brokerageAmount",
          type: "number",
          isDecimal: true,
          label: "Total brokerage Amount",
          rules: requireFollowups
            ? {
                required: {
                  value: true,
                  message: "Brokerage amount is required",
                },
              }
            : {},
          gridColumn: 5,
          formatNumber: true,
          componentProps: {
            type: "number",
            fullWidth: true,
            // disabled: !requireFollowups,
            disabled: true,
          },
          activityOrder: 27,
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
            disabled: !requireFollowups,
          },
          apiDependencies: {
            endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
          },
          activityOrder: 28,
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
              "premiumReceiptDetailsSection.isPremiumInstallmentBased"
            );
            return (
              String(directValue ?? nestedValue) ===
              String(dyamicvalues?.TOGGLE_YES)
            );
          },
          activityOrder: 29,
        },
      ],
      defaultValues: {
        acknowledgedBy: null,
        isPremiumInstallmentBased: dyamicvalues?.TOGGLE_NO ?? null,
        totalInstallmentAmount: null,
      },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    installmentSectionLankaWithToggle,
    {
      key: "premiumReceiptLeadSection",
      title: "Insurer details",
      config: premiumReceiptLeadFieldsLanka,
      defaultValues: {
        ...leadDefaultsLanka,
      },
      containerStyles: {
        gap: "16px",
        display: "flex",
        flexDirection: "column",
      },
    },
    insurerDetailsSectionLankaWithToggle,
    {
      key: "basicCovers",
      title: "Basic covers",
      config: [],
      containerStyles: {
        gap: "24px",
        border: '1px solid "#eaeaea"',
        display: "flex",
        padding: "16px",
        borderRadius: "8px",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
      },
      disableAllFields: !requireFollowups,
      isCoversRequired: true,
      defaultValues: {
        acknowledgedBy: null,
        receiptDate: null,
        receiptNo: "",
        allDocumentsReceivedDate: null,
        brokeragePercentage: null,
        brokerageAmount: null,
      },
    },
    {
      key: "remarksSection",
      config: [
        {
          key: "remarks",
          name: "remarks",
          type: "textarea",
          label: "Remarks",
          gridColumn: 9,
          componentProps: { rows: 3, fullWidth: true, multiline: true },
          activityOrder: 29,
        },
      ],
      defaultValues: { remarks: "" },
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
          componentProps: { isDocumentTypeRequired: true, isDocumentRequired: true, fullWidth: true, companyType: "opportunity" },
          activityOrder: 30,
        },
      ],
      defaultValues: [{ documentId: null, documentTypeLid: null }],
    },
  ];
};

//duplicating the config for sri lankan users

// export const heldCoverNoteConfigLanka = (formValues, dyamicvalues) => {
//   const YES = dyamicvalues?.TOGGLE_YES;
//   const isSubmitForApproval = !!dyamicvalues?.isActivitySubmitForApprovalStatus;

//   const isDeviationRequired =
//     formValues?.placementSlipDeviationsSection?.placementSlipDeviationsLid ===
//     YES;

//   const isDeviationAddressed =
//     formValues?.deviationsAddressedSection?.deviationsAddressedLid === YES;

//   const isRevisedHeldCoverNoteYes =
//     formValues?.deviationsAddressedSection?.revisedHeldCoverNoteLid === YES;

//   const requireFollowups =
//     isDeviationRequired && isDeviationAddressed && isRevisedHeldCoverNoteYes;

//   return [
//     {
//       key: "placementSlipDeviationsSection",
//       config: [
//         {
//           key: "placementSlipDeviationsLid",
//           name: "placementSlipDeviationsLid",
//           type: "segmentedcontrol",
//           label: "Any deviations from placement slip",
//           rules: {
//             required: {
//               value: true,
//               message: "Placement slip deviation is required",
//             },
//           },
//           gridColumn: 5,
//           componentProps: { fullWidth: true, disabled: isSubmitForApproval },
//           apiDependencies: {
//             endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
//           },
//           isProcessRequired: true,
//         },
//       ],
//     },
//     {
//       key: "deviationSection",
//       title: "Enter deviations",
//       config: [
//         {
//           key: "deviations",
//           name: "deviations",
//           type: "text",
//           label: "Enter deviations",
//           gridColumn: 9,
//           componentProps: {
//             rows: 4,
//             fullWidth: true,
//             multiline: true,
//             disabled: isSubmitForApproval || !isDeviationRequired,
//           },
//           apiDependencies: {
//             dependentField: "placementSlipDeviations",
//           },
//           // Required only when "Any deviations" = Yes; else optional
//           rules: isDeviationRequired
//             ? {
//                 required: {
//                   value: true,
//                   message: "Deviation is required",
//                 },
//               }
//             : {},
//         },
//         // {
//         //   key: "button",
//         //   name: "button",
//         //   type: "button",
//         //   label: "Create task for deviation",
//         //   onClick: "createTaskForDeviation",
//         //   gridColumn: 9,
//         //   componentProps: {
//         //     variant: "primary",
//         //     maxWidth: "180px",
//         //     disabled: isSubmitForApproval || !isDeviationRequired,
//         //   },
//         // },
//       ],
//       defaultValues: { deviations: "" },
//       containerStyles: {
//         gap: "16px",
//         display: "flex",
//         flexDirection: "column",
//       },
//     },
//     {
//       key: "deviationsAddressedSection",
//       config: [
//         {
//           key: "deviationsAddressedLid",
//           name: "deviationsAddressedLid",
//           type: "segmentedcontrol",
//           label: "Deviation addressed",
//           rules: isDeviationRequired
//             ? {
//                 required: {
//                   value: true,
//                   message: "Deviation addressed is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           componentProps: {
//             fullWidth: true,
//             // Only enabled when "Any deviations" = Yes
//             disabled: isSubmitForApproval || !isDeviationRequired,
//           },
//           apiDependencies: {
//             endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
//             clearFieldsOnChange: ["resolutionLid", "revisedHeldCoverNoteLid"],
//           },
//           isProcessRequired: true,
//         },
//         {
//           key: "resolutionLid",
//           name: "resolutionLid",
//           type: "select",
//           label: "Resolution",
//           rules: isDeviationAddressed
//             ? {
//                 value: true,
//                 message: "Resolution is required",
//                 required: { value: true, message: "Resolution is required" },
//               }
//             : {},
//           gridColumn: 5,
//           componentProps: { fullWidth: true, disabled: !isDeviationAddressed },
//           apiDependencies: {
//             endPoint: '#endPoints.lookUpByName("RESOLUTION_TYPE")',
//           },
//           isProcessRequired: true,
//         },
//         {
//           key: "revisedHeldCoverNoteLid",
//           name: "revisedHeldCoverNoteLid",
//           type: "segmentedcontrol",
//           label: "Revised held cover note received",
//           rules: isDeviationAddressed
//             ? {
//                 required: {
//                   value: true,
//                   message: "Revised held cover note received is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           componentProps: { fullWidth: true, disabled: !isDeviationAddressed },
//           apiDependencies: {
//             endPoint: '#endPoints.lookUpByName("TOGGLE_TYPE")',
//             dependentField: "placementSlipDeviations",
//           },
//           isProcessRequired: true,
//         },
//       ],
//       defaultValues: {
//         deviationsAddressedLid: null,
//         resolutionLid: null,
//         revisedHeldCoverNoteLid: null,
//       },
//     },
//     {
//       key: "premiumReceiptDetailsSection",
//       title: "Premium receipt details",
//       config: [
//         {
//           key: "acknowledgedBy",
//           name: "acknowledgedBy",
//           type: "selectFieldByApi",
//           label: "Acknowledgement by",
//           gridColumn: 5,
//           componentProps: { fullWidth: true, disabled: !requireFollowups },
//           apiDependencies: {
//             endPoint: "#endPoints.usersListInEmployee",
//             utilityFunction: "#usersListUtilityFunction",
//             customParams: {
//               searchBy: "firstName",
//               sortBy: "firstName",
//               sortOrder: "ASC",
//             },
//           },
//           isProcessRequired: true,
//         },
//         {
//           key: "receiptDate",
//           name: "receiptDate",
//           type: "date",
//           label: "Receipt Date",
//           rules: requireFollowups
//             ? { required: { value: true, message: "Receipt date is required" } }
//             : {},
//           gridColumn: 5,
//           componentProps: {
//             fullWidth: true,
//             maxDate: "#dayjs()",
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "receiptNo",
//           name: "receiptNo",
//           type: "text",
//           label: "Receipt no",
//           rules: requireFollowups
//             ? { required: { value: true, message: "Receipt no is required" } }
//             : {},
//           gridColumn: 5,
//           componentProps: { fullWidth: true, disabled: !requireFollowups },
//         },
//         {
//           key: "allDocumentsReceivedDate",
//           name: "allDocumentsReceivedDate",
//           type: "date",
//           label: "All documents received on",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "All documents received date is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           componentProps: {
//             fullWidth: true,
//             maxDate: "#dayjs()",
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "brokeragePercentage",
//           name: "brokeragePercentage",
//           type: "number",
//           label: "Brokerage Percentage",
//           rules: requireFollowups
//             ? {
//                 max: {
//                   value: 100,
//                   message: "Brokerage percentage cannot exceed 100",
//                 },
//                 min: {
//                   value: 0,
//                   message: "Brokerage percentage cannot be negative",
//                 },
//                 required: {
//                   value: true,
//                   message: "Brokerage percentage is required",
//                 },
//               }
//             : {},
//           isDecimal: true,
//           gridColumn: 5,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "brokerageAmount",
//           name: "brokerageAmount",
//           type: "number",
//           label: "Brokerage amount",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Brokerage amount is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "srccBrokerageAmount",
//           name: "srccBrokerageAmount",
//           type: "number",
//           label: "SRCC brokerage amount",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "SRCC brokerage amount is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "basicPremium",
//           name: "basicPremium",
//           type: "number",
//           label: "Basic premium",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Basic premium is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "basicPremiumPercentage",
//           name: "basicPremiumPercentage",
//           type: "number",
//           label: "Basic brokerage percentage",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Basic brokerage percentage is required",
//                 },
//                 min: {
//                   value: 0,
//                   message: "Basic brokerage percentage cannot be negative",
//                 },
//                 max: {
//                   value: 100,
//                   message: "Basic brokerage percentage cannot exceed 100",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           isDecimal: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "srccAmount",
//           name: "srccAmount",
//           type: "number",
//           label: "SRCC premium amount",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "SRCC premium amount is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "srccPercentage",
//           name: "srccPercentage",
//           type: "number",
//           label: "SRCC brokerage percentage",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "SRCC brokerage percentage is required",
//                 },
//                 min: {
//                   value: 0,
//                   message: "SRCC brokerage percentage cannot be negative",
//                 },
//                 max: {
//                   value: 100,
//                   message: "SRCC brokerage percentage cannot exceed 100",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           isDecimal: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "terrorismCommission",
//           name: "terrorismCommission",
//           type: "number",
//           label: "TC premium amount",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "TC premium amount is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "terrorismCommissionPercentage",
//           name: "terrorismCommissionPercentage",
//           type: "number",
//           label: "TC brokerage percentage",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "TC brokerage percentage is required",
//                 },
//                 min: {
//                   value: 0,
//                   message: "TC brokerage percentage cannot be negative",
//                 },
//                 max: {
//                   value: 100,
//                   message: "TC brokerage percentage cannot exceed 100",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           isDecimal: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "tcBrokerageAmount",
//           name: "tcBrokerageAmount",
//           type: "number",
//           label: "TC brokerage amount",
//           gridColumn: 5,
//           componentProps: {
//             fullWidth: true,
//           },
//           formatNumber: true,
//         },
//         {
//           key: "basicBrokerageAmount",
//           name: "basicBrokerageAmount",
//           type: "number",
//           label: "Basic brokerage amount",
//           gridColumn: 5,
//           componentProps: {
//             fullWidth: true,
//           },
//           formatNumber: true,
//         },
//         {
//           key: "serviceTaxAmount",
//           name: "serviceTaxAmount",
//           type: "number",
//           label: "Tax",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Tax is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "serviceTaxPercentage",
//           name: "serviceTaxPercentage",
//           type: "number",
//           label: "Tax percentage",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Tax percentage is required",
//                 },
//                 min: {
//                   value: 0,
//                   message: "Tax percentage cannot be negative",
//                 },
//                 max: {
//                   value: 100,
//                   message: "Tax percentage cannot exceed 100",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           isDecimal: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "totalNetPremium",
//           name: "totalNetPremium",
//           type: "number",
//           label: "Total Net Premium",
//           disabled: true,
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Total Net Premium is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "totalGrossPremiumIncTax",
//           name: "totalGrossPremiumIncTax",
//           type: "number",
//           disabled: true,
//           label: "Total gross premium including tax",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Total gross premium including tax is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "fee",
//           name: "fee",
//           type: "number",
//           label: "Policy fee",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Policy fee is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "feePercentage",
//           name: "feePercentage",
//           type: "number",
//           label: "Policy fee percentage",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Policy fee percentage is required",
//                 },
//                 min: {
//                   value: 0,
//                   message: "Policy fee percentage cannot be negative",
//                 },
//                 max: {
//                   value: 100,
//                   message: "Policy fee percentage cannot exceed 100",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           isDecimal: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "other",
//           name: "other",
//           type: "number",
//           label: "Stamp duty",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Stamp duty is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "otherPercentage",
//           name: "otherPercentage",
//           type: "number",
//           label: "Stamp duty percentage",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Stamp duty percentage is required",
//                 },
//                 min: {
//                   value: 0,
//                   message: "Stamp duty percentage cannot be negative",
//                 },
//                 max: {
//                   value: 100,
//                   message: "Stamp duty percentage cannot exceed 100",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           isDecimal: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "adminCharges",
//           name: "adminCharges",
//           type: "number",
//           label: "Admin charges",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Admin charges are required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "adminChargesPercentage",
//           name: "adminChargesPercentage",
//           type: "number",
//           label: "Admin charges percentage",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Admin charges percentage is required",
//                 },
//                 min: {
//                   value: 0,
//                   message: "Admin charges percentage cannot be negative",
//                 },
//                 max: {
//                   value: 100,
//                   message: "Admin charges percentage cannot exceed 100",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           isDecimal: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "cessAmount",
//           name: "cessAmount",
//           type: "number",
//           label: "Cess",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Cess is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "cessPercentage",
//           name: "cessPercentage",
//           type: "number",
//           label: "Cess percentage",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message: "Cess percentage is required",
//                 },
//                 min: {
//                   value: 0,
//                   message: "Cess percentage cannot be negative",
//                 },
//                 max: {
//                   value: 100,
//                   message: "Cess percentage cannot exceed 100",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           isDecimal: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//         {
//           key: "totalGrossPremiumIncTaxCharges",
//           name: "totalGrossPremiumIncTaxCharges",
//           type: "number",
//           label: "Total gross premium including tax & other charges",
//           rules: requireFollowups
//             ? {
//                 required: {
//                   value: true,
//                   message:
//                     "Total gross premium including tax & other charges is required",
//                 },
//               }
//             : {},
//           gridColumn: 5,
//           formatNumber: true,
//           disabled: true,
//           componentProps: {
//             type: "number",
//             fullWidth: true,
//             disabled: !requireFollowups,
//           },
//         },
//       ],
//       defaultValues: { acknowledgedBy: null },
//       containerStyles: {
//         gap: "16px",
//         display: "flex",
//         flexDirection: "column",
//       },
//     },
//     {
//       key: "basicCovers",
//       title: "Basic covers",
//       config: [],
//       containerStyles: {
//         gap: "24px",
//         border: '1px solid "#eaeaea"',
//         display: "flex",
//         padding: "16px",
//         borderRadius: "8px",
//         flexDirection: "column",
//         backgroundColor: "#FAFAFA",
//       },
//       disableAllFields: !requireFollowups,
//       isCoversRequired: true,
//       defaultValues: {
//         acknowledgedBy: null,
//         receiptDate: null,
//         receiptNo: "",
//         allDocumentsReceivedDate: null,
//         brokeragePercentage: null,
//         brokerageAmount: null,
//       },
//     },
//     {
//       key: "remarksSection",
//       config: [
//         {
//           key: "remarks",
//           name: "remarks",
//           type: "textarea",
//           label: "Remarks",
//           gridColumn: 9,
//           componentProps: { rows: 3, fullWidth: true, multiline: true },
//         },
//       ],
//       defaultValues: { remarks: "" },
//     },
//     {
//       key: "documents",
//       config: [
//         {
//           key: "documents",
//           name: "documents",
//           type: "documentupload",
//           label: "Documents",
//           companyId: "#${companyId}",
//           gridColumn: 9,
//           componentProps: { fullWidth: true, companyType: "opportunity" },
//         },
//       ],
//       defaultValues: [{ documentId: null, documentTypeLid: null }],
//     },
//   ];
// };
