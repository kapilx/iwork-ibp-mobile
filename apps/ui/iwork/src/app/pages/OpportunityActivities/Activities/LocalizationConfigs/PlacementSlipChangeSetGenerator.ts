import { withPercentageClamp } from "@ui/ui-lib";

export const makePlacementSlipGenerationChangeSets = ({
  isInstallmentRequired,
  organisationKey,
}: {
  isInstallmentRequired: boolean;
  organisationKey: string;
}) => {
  const organisationBasedConfig = {
    iirm_srilanka: {
      removedFields: [
        {
          section: "policyDetails",
          activityOrders: [6, 12],
        },
        {
          section: "policyDetails",
          activityOrders: [11],
        },
      ],

      replacedFields: [
        {
          section: "policyDetails",
          fields: [
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
              componentProps: { fullWidth: true },
              activityOrder: 4,
            },
            {
              key: "terrorism",
              name: "terrorism",
              label: "TC premium amount",
              type: "number",
              isDecimal: true,
              formatNumber: true,
              gridColumn: 5,
              componentProps: { fullWidth: true, type: "number" },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
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
              key: "netPremium",
              name: "netPremium",
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
              componentProps: { fullWidth: true },
              activityOrder: 7,
            },

            {
              key: "other",
              name: "other",
              type: "number",
              isDecimal: true,
              label: "Stamp duty",
              formatNumber: true,
              gridColumn: 5,
              componentProps: { fullWidth: true, type: "number" },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
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
              key: "fee",
              name: "fee",
              type: "number",
              isDecimal: true,
              label: "Policy fee",
              formatNumber: true,
              gridColumn: 5,
              componentProps: { fullWidth: true, type: "number" },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Policy fee must be a positive numeric value",
                },
                required: {
                  value: true,
                  message: "Policy fee is required",
                },
              },
              activityOrder: 11,
            },

            {
              key: "gstPercentage",
              name: "gstPercentage",
              type: "number",
              label: "VAT percentage",
              rules: {
                required: {
                  value: true,
                  message: "VAT percentage is required",
                },
                max: {
                  value: 100,
                  message: "VAT percentage cannot exceed 100",
                },
                min: {
                  value: 0,
                  message: "VAT percentage cannot be negative",
                },
              },
              isDecimal: true,
              gridColumn: 5,
              componentProps: withPercentageClamp({
                fullWidth: true,
                type: "number",
              }),
              activityOrder: 12,
            },

            {
              key: "gstAmount",
              name: "gstAmount",
              type: "number",
              isDecimal: true,
              label: "VAT amount",
              rules: {
                required: {
                  value: true,
                  message: "VAT amount is required",
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "VAT amount must be a positive numeric value",
                },
              },
              gridColumn: 5,
              formatNumber: true,
              componentProps: { fullWidth: true, type: "number" },
              activityOrder: 13,
            },
            {
              key: "terrorismBrokeragePercentage",
              name: "terrorismBrokeragePercentage",
              type: "number",
              label: "TC brokerage percentage",
              isDecimal: true,
              gridColumn: 5,
              componentProps: withPercentageClamp({
                fullWidth: true,
                type: "number",
              }),
              rules: {
                max: {
                  value: 100,
                  message: "TC brokerage percentage cannot exceed 100",
                },
                min: {
                  value: 0,
                  message: "TC brokerage percentage cannot be negative",
                },
                required: {
                  value: true,
                  message: "TC brokerage percentage is required",
                },
              },
              activityOrder: 17,
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
              componentProps: { type: "number", fullWidth: true },
              disabled: true,
              activityOrder: 21,
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
              componentProps: { required: true, fullWidth: true },
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
              label: "Total Installment Amount(Total net premium + Stamp duty)",
              gridColumn: 5,
              formatNumber: true,
              componentProps: {
                fullWidth: true,
                disabled: true,
              },
              showField: () => isInstallmentRequired,
              activityOrder: 23,
            },
          ],
        },
      ],

      newlyAddedFields: [
        {
          section: "policyDetails",
          fields: [
            {
              key: "srccAmount",
              name: "srccAmount",
              label: "SRCC premium amount",
              type: "number",
              isDecimal: true,
              formatNumber: true,
              gridColumn: 5,
              componentProps: { fullWidth: true, type: "number" },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message:
                    "SRCC premium amount must be a positive numeric value",
                },
                required: {
                  value: true,
                  message: "SRCC premium amount is required",
                },
              },
              activityOrder: 5,
            },

            {
              key: "adminCharges",
              name: "adminCharges",
              label: "Admin charges",
              type: "number",
              isDecimal: true,
              formatNumber: true,
              gridColumn: 5,
              componentProps: { fullWidth: true, type: "number" },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Admin charges must be a positive numeric value",
                },
                required: {
                  value: true,
                  message: "Admin charges is required",
                },
              },
              activityOrder: 8,
            },

            {
              key: "cessAmount",
              name: "cessAmount",
              label: "cess",
              type: "number",
              isDecimal: true,
              formatNumber: true,
              gridColumn: 5,
              componentProps: { fullWidth: true, type: "number" },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
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
              key: "grossPremium",
              name: "grossPremium",
              label: "Total gross premium including tax & other charges",
              type: "number",
              isDecimal: true,
              formatNumber: true,
              gridColumn: 5,
              componentProps: { fullWidth: true, type: "number" },
              disabled: true,
              rules: {
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
              key: "basicBrokerageAmount",
              name: "basicBrokerageAmount",
              type: "number",
              isDecimal: true,
              label: "Basic brokerage amount",
              gridColumn: 5,
              componentProps: { fullWidth: true },
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
              componentProps: { type: "number", fullWidth: true },
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
              componentProps: { fullWidth: true },
              formatNumber: true,
              disable: true,
              activityOrder: 20,
            },
          ],
        },
      ],
    },
    iirm_kenya: {
      removedFields: [],
      replacedFields: [
        {
          section: "policyDetails",
          fields: [
            {
              key: "other",
              name: "other",
              type: "number",
              label: "Stamp duty",
              formatNumber: true,
              gridColumn: 5,
              componentProps: { fullWidth: true, type: "number" },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Stamp duty must be a positive numeric value",
                },
                required: {
                  value: true,
                  message: "Stamp duty is required",
                },
              },
              activityOrder: 12,
            },
            {
              key: "gstPercentage",
              name: "gstPercentage",
              type: "number",
              label: "Levies percentage",
              rules: {
                required: {
                  value: true,
                  message: "Levies percentage is required",
                },
                max: {
                  value: 100,
                  message: "Levies percentage cannot exceed 100",
                },
                min: {
                  value: 0,
                  message: "Levies percentage cannot be negative",
                },
              },
              isDecimal: true,
              gridColumn: 5,
              componentProps: withPercentageClamp({
                fullWidth: true,
                type: "number",
              }),
              activityOrder: 9,
            },
            {
              key: "gstAmount",
              name: "gstAmount",
              type: "number",
              label: "Levies amount",
              rules: {
                required: {
                  value: true,
                  message: "Levies amount is required",
                },
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Levies amount must be a positive numeric value",
                },
              },
              gridColumn: 5,
              formatNumber: true,
              componentProps: { fullWidth: true, type: "number" },
              activityOrder: 10,
            },
            {
              key: "fee",
              name: "fee",
              type: "number",
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
              activityOrder: 11,
            },
            {
              key: "grossPremium",
              name: "grossPremium",
              type: "number",
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
              activityOrder: 12,
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
