export const makeEnterQuoteChangeSets = (organisationKey: string) => {
  const organisationBasedConfig = {
    iirm_srilanka: {
      removedFields: [
        {
          section: "quoteDetails",
          activityOrders: [7], // brokeragePercent
        },
      ],

      replacedFields: [
        {
          section: "quoteDetails",
          fields: [
            {
              key: "basicPremium",
              name: "basicPremium",
              label: "Basic premium", // Changed from "Basic Premium"
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
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Basic premium must be a positive numeric value", // Changed message
                },
                required: {
                  value: true,
                  message: "Basic premium is required", // Changed message
                },
              },
              activityOrder: 4,
            },
            {
              key: "terrorism",
              name: "terrorism",
              label: "TC premium amount", // Changed from "Terrorism"
              type: "number",
              isDecimal: true,
              formatNumber: true, // Added formatNumber
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              // rules removed in version 2
              activityOrder: 6, // Changed from 5
            },
            {
              key: "netPremium",
              name: "netPremium",
              label: "Total net premium", // Changed from "Net Premium"
              type: "number",
              isDecimal: true,
              formatNumber: true,
              gridColumn: 5,
              disabled:true,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Total net premium must be a positive numeric value",
                },
              },
              activityOrder: 7, // Changed from 6
            },
            {
              key: "gstPercentage",
              name: "gstPercentage",
              label: "GST percentage",
              type: "number",
              isDecimal: true,
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
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
              label: "GST amount",
              type: "number",
              formatNumber: true,
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "GST amount must be a positive numeric value",
                },
                required: {
                  value: true,
                  message: "GST amount is required",
                },
              },
              activityOrder: 10,
            },
          ],
        },
      ],

      newlyAddedFields: [
        {
          section: "quoteDetails",
          fields: [
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
              componentProps: {
                fullWidth: true,
                type: "number",
              },
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
              key: "fee",
              name: "fee",
              label: "Policy fee",
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
              key: "grossPremium",
              name: "grossPremium",
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
                  value: "REGEX_PATTERNS.NUMERIC",
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
              componentProps: {
                fullWidth: true,
                type: "number",
              },
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
              componentProps: {
                fullWidth: true,
                type: "number",
              },
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
              componentProps: {
                fullWidth: true,
                type: "number",
              },
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
              key: "totalBrokerageAmount",
              name: "totalBrokerageAmount",
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
          ],
        },
      ],
    },
    iirm_kenya: {
      removedFields: [],
      replacedFields: [
        {
          section: "quoteDetails",
          fields: [
            {
              key: "gstPercentage",
              name: "gstPercentage",
              label: "Levies percentage",
              type: "number",
              isDecimal: true,
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              rules: {
                min: {
                  value: 0,
                  message: "Levies percentage cannot be negative",
                },
                max: {
                  value: 100,
                  message: "Levies percentage cannot exceed 100",
                },
                required: {
                  value: true,
                  message: "Levies percentage is required",
                },
              },
              activityOrder: 9,
            },
            {
              key: "gstAmount",
              name: "gstAmount",
              label: "Levies amount",
              type: "number",
              formatNumber: true,
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "Levies amount must be a positive numeric value",
                },
                required: {
                  value: true,
                  message: "Levies amount is required",
                },
              },
              activityOrder: 10,
            },
          ],
        },
      ],
      newlyAddedFields: [
        {
          section: "quoteDetails",
          fields: [
            {
              key: "other",
              name: "other",
              label: "Stamp duty",
              type: "number",
              formatNumber: true,
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
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
              activityOrder: 11,
            },
          ],
        },
      ],
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
