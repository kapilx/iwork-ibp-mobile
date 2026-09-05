import { withPercentageClamp } from "@ui/ui-lib";

export const makeHeldCoverNoteChangeSets = ({
  requireFollowups,
  isInstallmentRequired,
  organisationKey,
}: {
  requireFollowups: boolean;
  isInstallmentRequired: boolean;
  organisationKey: string;
}) => {
  const organisationBasedConfig = {
    iirm_srilanka: {
      removedFields: [
        {
          section: "premiumReceiptDetailsSection",
          activityOrders: [15, 23], // 10, 18, 19 sumInsured(10), totalPremium(18), brokeragePercentage(19)
        },
      ],

      replacedFields: [
        {
          section: "premiumReceiptDetailsSection",
          fields: [
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
              key: "terrorism",
              name: "terrorism",
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
              activityOrder: 17,
            },
            {
              key: "gstPercentage",
              name: "gstPercentage",
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
              activityOrder: 18,
            },
            {
              key: "gstAmount",
              name: "gstAmount",
              type: "number",
              isDecimal: true,
              label: "VAT amount",
              rules: requireFollowups
                ? {
                    required: {
                      value: true,
                      message: "VAT amount is required",
                    },
                  }
                : {},
              gridColumn: 5,
              formatNumber: true,
              componentProps: {
                type: "number",
                fullWidth: true,
                disabled: !requireFollowups,
              }, // fixed
              activityOrder: 19,
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
              key: "totalBrokerageAmount",
              name: "totalBrokerageAmount",
              type: "number",
              isDecimal: true,
              label: "Total brokerage Amount",
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
                disabled: !requireFollowups,
              },
              activityOrder: 27,
            },
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
              activityOrder: 29,
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
          ],
        },
        {
          section: "remarksSection",
          fields: [
            {
              key: "remarks",
              name: "remarks",
              type: "textarea",
              label: "Remarks",
              gridColumn: 9,
              componentProps: { rows: 3, fullWidth: true, multiline: true },
              activityOrder: 28, // moved from 21
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
              componentProps: { fullWidth: true, companyType: "opportunity" },
              activityOrder: 29, // moved from 22
            },
          ],
        },
      ],

      newlyAddedFields: [
        {
          section: "premiumReceiptDetailsSection",
          fields: [
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
              key: "netPremium",
              name: "netPremium",
              type: "number",
              isDecimal: true,
              label: "Total net premium",
              disabled: true,
              rules: requireFollowups
                ? {
                    required: {
                      value: true,
                      message: "Total net premium is required",
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
              key: "cessAmount",
              name: "cessAmount",
              type: "number",
              isDecimal: true,
              label: "cess",
              rules: requireFollowups
                ? {
                    required: {
                      value: true,
                      message: "cess amount is required",
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
              key: "grossPremium",
              name: "grossPremium",
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
                disabled: !requireFollowups,
              },
              activityOrder: 20,
            },
            {
              key: "basicBrokeragePercentage",
              name: "basicBrokeragePercentage",
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
              key: "basicBrokerageAmount",
              name: "basicBrokerageAmount",
              type: "number",
              isDecimal: true,
              label: "Basic brokerage amount",
              gridColumn: 5,
              componentProps: { fullWidth: true, disabled: true }, // fixed
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
                disabled: true,
              }, // fixed
              activityOrder: 25,
            },
            {
              key: "tcBrokerageAmount",
              name: "tcBrokerageAmount",
              type: "number",
              isDecimal: true,
              label: "TC brokerage amount",
              gridColumn: 5,
              componentProps: { fullWidth: true, disabled: true }, // fixed
              formatNumber: true,
              activityOrder: 26,
            },
          ],
        },
      ],
    },
    iirm_kenya: {
      removedFields: [],
      replacedFields: [
        {
          section: "premiumReceiptDetailsSection",
          fields: [
            {
              key: "other",
              name: "other",
              type: "number",
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
              activityOrder: 17,
            },
            {
              key: "gstPercentage",
              name: "gstPercentage",
              type: "number",
              label: "Levies percentage",
              rules: requireFollowups
                ? {
                    required: {
                      value: true,
                      message: "Levies percentage is required",
                    },
                    min: {
                      value: 0,
                      message: "Levies percentage cannot be negative",
                    },
                    max: {
                      value: 100,
                      message: "Levies percentage cannot exceed 100",
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
              activityOrder: 15,
            },
            {
              key: "gstAmount",
              name: "gstAmount",
              type: "number",
              label: "Levies amount",
              rules: requireFollowups
                ? {
                    required: {
                      value: true,
                      message: "Levies amount is required",
                    },
                  }
                : {},
              gridColumn: 5,
              formatNumber: true,
              componentProps: {
                type: "number",
                fullWidth: true,
                disabled: !requireFollowups,
              }, // fixed
              activityOrder: 16,
            },
          ],
        },
      ],
      newlyAddedFields: [],
    },
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
