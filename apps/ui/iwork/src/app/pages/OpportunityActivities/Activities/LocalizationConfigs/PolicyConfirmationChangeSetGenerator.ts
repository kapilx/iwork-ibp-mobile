import { REGEX_PATTERNS, withPercentageClamp } from "@ui/ui-lib";
export function makePolicyConfirmationChangeSets({
  requireFields,
  isInstallmentRequired,
  organisationKey,
}: {
  requireFields: any;
  isInstallmentRequired: boolean;
  organisationKey: string;
}) {
  const { isDeviationRequired, isPolicyRectified } = requireFields;

  const organisationBasedConfig = {
    iirm_srilanka: {
      removedFields: [
        {
          section: "policyDataRectifiedSection",
          activityOrders: [5, 12, 13, 14], // sumInsured was removed
        },
      ],

      replacedFields: [
        {
          section: "policyDataRectifiedSection",
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "Basic premium must be a positive numeric value",
                },
              },
              apiDependencies: {
                dependentField: "anyDeviationsFromPremiumAndBrokerage",
              },
              disabled: !isPolicyRectified,
              activityOrder: 5,
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "TC premium amount must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 7,
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
              disabled: !isPolicyRectified,
              activityOrder: 18,
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "Policy fee must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 12,
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
              disabled: !isPolicyRectified,
              activityOrder: 13,
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "VAT amount must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 14,
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "Stamp duty must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 10,
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
                  if (isPolicyRectified && !value) {
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
              disabled: !isPolicyRectified,
              isProcessRequired: true,
              activityOrder: 22,
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
              disabled: !isPolicyRectified,
              isProcessRequired: true,
              activityOrder: 20,
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
                placeholder: "Enter Text here...",
              },
              activityOrder: 23,
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
              activityOrder: 24,
            },
          ],
        },
      ],
      newlyAddedFields: [
        {
          section: "policyDataRectifiedSection",
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message:
                    "SRCC premium amount must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 6,
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
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              disabled: true,
              rules: {
                validate: (value) => {
                  if (isDeviationRequired && !value) {
                    return "Total net premium is required";
                  }
                  return true;
                },
                pattern: {
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "Total net premium must be a positive numeric value",
                },
              },
              activityOrder: 8,
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "Admin charges must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 9,
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "cess amount must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 11,
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
              disabled: true,
              gridColumn: 5,
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message:
                    "Total gross premium including tax & other charges must be a positive numeric value",
                },
              },
              activityOrder: 15,
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
              disabled: !isPolicyRectified,
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
              disabled: true,
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
                  if (isPolicyRectified && !value) {
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
              disabled: true,
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
          section: "policyDataRectifiedSection",
          fields: [
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
              disabled: !isPolicyRectified,
              activityOrder: 10,
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "Levies amount must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 11,
            },
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
                  value: REGEX_PATTERNS.NUMERIC,
                  message: "Stamp duty must be a positive numeric value",
                },
              },
              disabled: !isPolicyRectified,
              activityOrder: 13,
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
}
