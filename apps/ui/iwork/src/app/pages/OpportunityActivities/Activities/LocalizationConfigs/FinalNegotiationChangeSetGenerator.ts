import {
  prefferredInsurersListUtilityFunction,
  withPercentageClamp,
} from "@ui/ui-lib";
import { preferredInsurerEndpointExpression } from "../ActivitiesConfigs/sharedInsurerConfig";

export function makeFinalNegotiationChangeSets(organisationKey: string) {
  const organisationBasedConfig = {
    iirm_srilanka: {
      // Fields that need to be completely removed from Sri Lanka config
      removedFields: [
        {
          section: "selectFinalisedQuote",
          activityOrders: [23],
        },
      ],

      // Fields that exist in both but need modifications (rules changes, label changes, etc.)
      replacedFields: [
        {
          section: "insurerParticipants",
          fields: [
            {
              key: "insurerId",
              name: "insurerId",
              type: "selectFieldByApi",
              label: "Insurer Participants",
              // Rules removed (was required in India version)
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
              },
              apiDependencies: {
                endPoint: "#endPoints.insurersList",
                utilityFunction: "#insurerListUtilityFunction",
                clearFieldsOnChange: ["insurerContactPerson"],
              },
              activityOrder: 9,
            },
            {
              key: "insurerContactPerson",
              name: "insurerContactPerson",
              type: "multiselect",
              label: "Insurer Contact Person",
              // Rules removed (was required in India version)
              gridColumn: 5,
              apiDependencies: {
                endPoint: "#endPoints.insurerContactList",
                dependentField: "insurerId",
                utilityFunction: "#insurerContactPersonUtilityFunction",
              },
              activityOrder: 10,
            },
          ],
        },
        {
          section: "selectFinalisedQuote",
          fields: [
            {
              key: "basicPremium",
              name: "basicPremium",
              label: "Basic premium",
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
                    "Basic premium amount must be a positive numeric value",
                },
                required: {
                  value: true,
                  message: "Basic premium amount is required",
                },
              },
              activityOrder: 20, // Changed from 20 to 20 (same position, but different context)
            },
            {
              key: "terrorism",
              name: "terrorism",
              type: "number",
              isDecimal: true,
              label: "TC premium amount", // Changed from "Terrorism"
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
              },
              formatNumber: true,
              activityOrder: 22, // Changed from 21 to 22
            },
            {
              key: "netPremium",
              name: "netPremium",
              type: "number",
              isDecimal: true,
              label: "Total net premium", // Changed from "Net premium"
              gridColumn: 5,
              formatNumber: true,
              componentProps: {
                fullWidth: true,
              },
              disabled: true, // Added disabled property
              activityOrder: 23, // Changed from 22 to 23
            },
            {
              key: "totalBrokerageAmount",
              name: "totalBrokerageAmount",
              type: "number",
              isDecimal: true,
              label: "Total brokerage amount", // Changed from "Brokerage Amount"
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
              },
              formatNumber: true,
              // Rules removed (was required in India version)
              activityOrder: 37, // Changed from 24 to 37
            },
          ],
        },
      ],

      // New fields added only in Sri Lanka config
      newlyAddedFields: [
        {
          section: "selectFinalisedQuote",
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
              activityOrder: 21,
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
              activityOrder: 24,
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
              activityOrder: 25,
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
              activityOrder: 26,
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
              activityOrder: 27,
            },
            {
              key: "gstPercentage",
              name: "gstPercentage",
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
              activityOrder: 28,
            },
            {
              key: "gstAmount",
              name: "gstAmount",
              label: "VAT amount",
              type: "number",
              isDecimal: true,
              formatNumber: true,
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
                type: "number",
              },
              // disabled: true,
              rules: {
                pattern: {
                  value: "REGEX_PATTERNS.NUMERIC",
                  message: "VAT amount must be a positive numeric value",
                },
                required: {
                  value: true,
                  message: "VAT amount is required",
                },
              },
              activityOrder: 29,
            },
            {
              key: "grossPremium",
              name: "grossPremium",
              label: "Total gross premium including tax & other charges",
              type: "number",
              isDecimal: true,
              disabled: true,
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
              activityOrder: 30,
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
              activityOrder: 31,
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
              activityOrder: 32,
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
              activityOrder: 33,
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
              activityOrder: 34,
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
              disabled: true,
              activityOrder: 35,
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
              activityOrder: 36,
            },
          ],
        },
        {
          section: "policyDetails",
          fields: [
            {
              key: "isLeadInsurerPayCommissionLid",
              name: "isLeadInsurerPayCommissionLid",
              type: "segmentedcontrol",
              label: "Only lead insurer pays brokerage",
              rules: {
                required: true,
              },
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
              },
              apiDependencies: {
                endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
              },
              // Activity order will be determined by buildInsurerSectionConfigs
            },
          ],
        },
      ],
    },
    iirm_kenya: {
      removedFields: [],
      replacedFields: [
        {
          section: "selectFinalisedQuote",
          fields: [
            {
              key: "basicBrokeragePercentage",
              name: "basicBrokeragePercentage",
              type: "number",
              label: "Basic brokerage percentage",
              rules: {
                max: {
                  value: 100,
                  message:
                    "Basic brokerage percentage cannot be more than 100%",
                },
                min: {
                  value: 0,
                  message: "Basic brokerage percentage cannot be less than 0%",
                },
                required: {
                  value: true,
                  message: "Basic brokerage percentage is required",
                },
              },
              isDecimal: true,
              gridColumn: 5,
              componentProps: withPercentageClamp({
                fullWidth: true,
              }),
              activityOrder: 28,
            },
            {
              key: "terrorismBrokeragePercentage",
              name: "terrorismBrokeragePercentage",
              label: "Terrorism brokerage percentage",
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
                  message: "Terrorism brokerage percentage cannot be negative",
                },
                max: {
                  value: 100,
                  message: "Terrorism brokerage percentage cannot exceed 100",
                },
                required: {
                  value: true,
                  message: "Terrorism brokerage percentage is required",
                },
              },
              activityOrder: 29,
            },
            {
              key: "basicBrokerageAmount",
              name: "basicBrokerageAmount",
              type: "number",
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
              activityOrder: 30,
            },
            {
              key: "tcBrokerageAmount",
              name: "tcBrokerageAmount",
              type: "number",
              label: "Terrorism brokerage amount",
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
              },
              formatNumber: true,
              disabled: true,
              activityOrder: 31,
            },
            {
              key: "totalBrokerageAmount",
              name: "totalBrokerageAmount",
              type: "number",
              label: "Total brokerage amount",
              gridColumn: 5,
              componentProps: {
                fullWidth: true,
              },
              formatNumber: true,
              activityOrder: 32,
            },
          ],
        },
      ],
      newlyAddedFields: [
        {
          section: "selectFinalisedQuote",
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
              activityOrder: 27,
            },
            {
              key: "gstPercentage",
              name: "gstPercentage",
              label: "Levies percentage",
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
              activityOrder: 25,
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
              // disabled: true,
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
              activityOrder: 26,
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
}
