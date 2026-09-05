import { withPercentageClamp } from "@ui/ui-lib";

export const makePolicyHardCopyChangeSets = ({
  requireFields,
  isInstallmentRequired,
  organisationKey,
}: {
  requireFields: any;
  isInstallmentRequired: boolean;
  organisationKey: string;
}) => {
  const { hasAnyDeviation, isDeviationRequired, isDeviationAddressed } =
    requireFields;
  const organisationBasedConfig = {
    iirm_srilanka: {
      removedFields: [
        {
          section: "deviationSection",
          activityOrders: [8, 13], // 8, 10, 11, 12, 16,
          // sumInsured(8), fee(10), terrorismCommissionPercentage(11),
          // terrorismCommission(12), totalPremium(16)
        },
      ],

      replacedFields: [
        {
          section: "deviationSection",
          fields: [
            {
              key: "basicPremium",
              name: "basicPremium",
              label: isDeviationRequired ? "Basic premium *" : "Basic premium",
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
                  if (isDeviationRequired && !value) {
                    return "Basic premium is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Basic premium must be a positive numeric value",
                },
              },
              apiDependencies: {
                dependentField: "anyDeviationsFromPremiumAndBrokerage",
              },
              disabled: !isDeviationRequired,
              activityOrder: 8,
            },
            {
              key: "terrorism",
              name: "terrorism",
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
                  if (isDeviationRequired && !value) {
                    return "TC premium amount is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "TC premium amount must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 10,
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
                  if (isDeviationRequired && !value) {
                    return "Stamp duty is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Stamp duty must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 13,
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
                  if (isDeviationRequired && !value) {
                    return "Policy fee is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Policy fee must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 15,
            },
            {
              key: "gstPercentage",
              name: "gstPercentage",
              label: isDeviationRequired
                ? "VAT percentage *"
                : "VAT percentage",
              type: "number",
              isDecimal: true,
              gridColumn: 5,
              componentProps: withPercentageClamp({
                fullWidth: true,
                type: "number",
              }),
              rules: {
                validate: (value) => {
                  if (isDeviationRequired && !value) {
                    return "VAT percentage is required";
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
              activityOrder: 16,
            },
            {
              key: "gstAmount",
              name: "gstAmount",
              label: isDeviationRequired ? "VAT amount *" : "VAT amount",
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
                  if (isDeviationRequired && !value) {
                    return "VAT amount is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "VAT amount must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 17,
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
                  if (isDeviationRequired && !value) {
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
              activityOrder: 26,
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
              activityOrder: 27,
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
              activityOrder: 28,
            },
          ],
        },
        {
          section: "installmentSummarySection",
          fields: [
            {
              key: "totalInstallmentAmount",
              name: "totalInstallmentAmount",
              type: "number",
              isDecimal: true,
              label: "Total Installment Amount(Total net premium + Stamp duty)",
              gridColumn: 5,
              formatNumber: true,
              componentProps: {
                fullWidth: true,
                disabled: true,
              },
              showField: () => isInstallmentRequired,
              disabled: !isDeviationRequired,
            },
          ],
        },
        {
          section: "remarks",
          fields: [
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
          section: "documents",
          fields: [
            {
              key: "documents",
              name: "documents",
              type: "documentupload",
              label: "Documents",
              companyId: "#${companyId}",
              gridColumn: 9,
              componentProps: {
                fullWidth: true,
                companyType: "opportunity",
              },
              activityOrder: 30,
            },
          ],
        },
      ],

      newlyAddedFields: [
        {
          section: "deviationSection",
          fields: [
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
                  if (isDeviationRequired && !value) {
                    return "SRCC premium amount is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message:
                    "SRCC premium amount must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 9,
            },
            {
              key: "netPremium",
              name: "netPremium",
              label: isDeviationRequired
                ? "Total net premium*"
                : "Total net premium",
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
                  if (isDeviationRequired && !value) {
                    return "Total net premium is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Total net premium must be a positive numeric value",
                },
              },
              activityOrder: 11,
            },
            {
              key: "adminCharges",
              name: "adminCharges",
              label: isDeviationRequired ? "Admin charges*" : "Admin charges",
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
                  if (isDeviationRequired && !value) {
                    return "Admin charges is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Admin charges must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 12,
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
                  if (isDeviationRequired && !value) {
                    return "cess amount is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "cess amount must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 14,
            },
            {
              key: "grossPremium",
              name: "grossPremium",
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
                  if (isDeviationRequired && !value) {
                    return "Total gross premium including tax & other charges is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message:
                    "Total gross premium including tax & other charges must be a positive numeric value",
                },
              },
              activityOrder: 18,
            },
            {
              key: "basicBrokeragePercentage",
              name: "basicBrokeragePercentage",
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
                  if (isDeviationRequired && !value) {
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
                  if (isDeviationRequired && !value) {
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
                  if (isDeviationRequired && !value) {
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
                  if (isDeviationRequired && !value) {
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
              disable: true,
              activityOrder: 24,
            },
          ],
        },
      ],
    },
    iirm_kenya: {
      removedFields: [],
      replacedFields: [
        {
          section: "deviationSection",
          fields: [
            {
              key: "other",
              name: "other",
              label: isDeviationRequired ? "Stamp duty*" : "Stamp duty",
              type: "number",
              formatNumber: true,
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              rules: {
                validate: (value) => {
                  if (isDeviationRequired && !value) {
                    return "Stamp duty is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Stamp duty must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 16,
            },
            {
              key: "gstPercentage",
              name: "gstPercentage",
              label: isDeviationRequired
                ? "Levies percentage *"
                : "Levies percentage",
              type: "number",
              isDecimal: true,
              gridColumn: 5,
              componentProps: withPercentageClamp({
                fullWidth: true,
                type: "number",
              }),
              rules: {
                validate: (value) => {
                  if (isDeviationRequired && !value) {
                    return "Levies percentage is required";
                  }
                  return true;
                },
                min: {
                  value: 0,
                  message: "Levies percentage cannot be negative",
                },
                max: {
                  value: 100,
                  message: "Levies percentage cannot exceed 100",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 13,
            },
            {
              key: "gstAmount",
              name: "gstAmount",
              label: isDeviationRequired ? "Levies amount *" : "Levies amount",
              type: "number",
              formatNumber: true,
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              rules: {
                validate: (value) => {
                  if (isDeviationRequired && !value) {
                    return "Levies amount is required";
                  }
                  return true;
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Levies amount must be a positive numeric value",
                },
              },
              disabled: !isDeviationRequired,
              activityOrder: 14,
            },
          ],
        },
      ],
      newlyAddedFields: [],
    },
    // iirm_kenya: {
    //   removedFields: [],
    //   replacedFields: [
    //     {
    //       section: "deviationSection",
    //       fields: [
    //         {
    //           key: "other",
    //           name: "other",
    //           label: isDeviationRequired ? "Stamp duty*" : "Stamp duty",
    //           type: "number",
    //           formatNumber: true,
    //           gridColumn: 5,
    //           componentProps: {
    //             fullWidth: true,
    //             type: "number",
    //           },
    //           rules: {
    //             validate: (value) => {
    //               if (isDeviationRequired && !value) {
    //                 return "Stamp duty is required";
    //               }
    //               return true;
    //             },
    //             pattern: {
    //               value: "REGEX_PATTERNS.NUMERIC",
    //               message: "Stamp duty must be a positive numeric value",
    //             },
    //           },
    //           disabled: !isDeviationRequired,
    //           activityOrder: 16,
    //         },
    //         {
    //           key: "gstPercentage",
    //           name: "gstPercentage",
    //           label: isDeviationRequired
    //             ? "Levies percentage *"
    //             : "Levies percentage",
    //           type: "number",
    //           isDecimal: true,
    //           gridColumn: 5,
    //           componentProps: withPercentageClamp({
    //             fullWidth: true,
    //             type: "number",
    //           }),
    //           rules: {
    //             validate: (value) => {
    //               if (isDeviationRequired && !value) {
    //                 return "Levies percentage is required";
    //               }
    //               return true;
    //             },
    //             min: {
    //               value: 0,
    //               message: "Levies percentage cannot be negative",
    //             },
    //             max: {
    //               value: 100,
    //               message: "Levies percentage cannot exceed 100",
    //             },
    //           },
    //           disabled: !isDeviationRequired,
    //           activityOrder: 13,
    //         },
    //         {
    //           key: "gstAmount",
    //           name: "gstAmount",
    //           label: isDeviationRequired ? "Levies amount *" : "Levies amount",
    //           type: "number",
    //           formatNumber: true,
    //           gridColumn: 5,
    //           componentProps: {
    //             fullWidth: true,
    //             type: "number",
    //           },
    //           rules: {
    //             validate: (value) => {
    //               if (isDeviationRequired && !value) {
    //                 return "Levies amount is required";
    //               }
    //               return true;
    //             },
    //             pattern: {
    //               value: "REGEX_PATTERNS.NUMERIC",
    //               message: "Levies amount must be a positive numeric value",
    //             },
    //           },
    //           disabled: !isDeviationRequired,
    //           activityOrder: 14,
    //         },
    //       ],
    //     },
    //   ],
    //   newlyAddedFields: [],
    // },
    iirm_india: {
      removedFields: [],
      replacedFields: [],
      newlyAddedFields: [],
    },
  };
  const { removedFields, replacedFields, newlyAddedFields } =
    organisationBasedConfig[organisationKey] || {
      removedFields: [],
      replacedFields: [],
      newlyAddedFields: [],
    };
  return { removedFields, replacedFields, newlyAddedFields };
};
