import React from "react";
import { prefferredInsurersListUtilityFunction } from "@ui/ui-lib";
import { parseNumericInput } from "../../Constants/autoPopulateFields";

// Created once at module load (stable reference) so the insurer total-brokerage
// field does not allocate a new element + style object on every render.
const INSURER_TOTAL_BROKERAGE_HELPER = React.createElement(
  "span",
  {
    style: {
      fontSize: "11px",
      fontStyle: "italic",
      color: "#8c8c8c",
    },
  },
  "Fee is excluded while matching"
);

type InsurerSectionOptions = {
  formValues?: Record<string, any>;
  dynamicValues?: Record<string, any>;
  leadSectionKey?: string;
  detailsSectionKey?: string;
  showLeadFieldsOnlyForMultiple?: boolean;
  sectionTitle?: string;
  basePremiumPath?: string;
  brokerageAmountPath?: string;
  totalBrokerageAmountPath?: string;
  runExternalValidatorsOnChange?: boolean;
  additionalCommissions?: Array<{
    percentageKey: string;
    amountKey: string;
    label: string;
    policyAmountPath?: string;
    premiumBasePath?: string;
    showField?: any;
    sharePercentageKey?: string;
    shareAmountKey?: string;
    shareLabel?: string;
  }>;
  leadFieldKeys?: {
    policyPlacedType?: string;
    leadInsurer?: string;
    leadPays?: string;
  };
};

export const preferredInsurerEndpointExpression =
  "#(opportunityId ? endPoints.preferredInsurersByOpportunityId(Number(opportunityId)) : endPoints.insurersList)";

const buildInsurerAmountValidators = (
  fieldKey: string,
  shouldEnforceEquality: boolean,
  policyAmount: number | null,
  policyAmountPath?: string,
  label: string = "Brokerage Amount",
  policyFeePath?: string,
  policyFeeAmount: number | null = null
) => [
  {
    validate: (values: Record<string, any>, context: any) => {
      const rows = Array.isArray(values?.retArray) ? values.retArray : [];

      const clearAllErrors = () => {
        rows.forEach((_, idx) => {
          if (context.hasRowError(idx, fieldKey)) {
            context.clearRowError(idx, fieldKey);
          }
        });
      };

      const resolvePolicyBrokerageAmount = (): number | null => {
        if (policyAmountPath && typeof context.watchExternal === "function") {
          const watchedValue = parseNumericInput(
            context.watchExternal(policyAmountPath)
          );
          if (watchedValue !== null) {
            return watchedValue;
          }
        }
        return policyAmount;
      };

      const resolvedPolicyBrokerageAmount = resolvePolicyBrokerageAmount();

      // Fee is part of the policy total brokerage but is NOT distributed across
      // insurers, so it must be excluded when matching insurer brokerage sums.
      const resolvePolicyFeeAmount = (): number => {
        if (policyFeePath && typeof context.watchExternal === "function") {
          const watchedFee = parseNumericInput(
            context.watchExternal(policyFeePath)
          );
          if (watchedFee !== null) {
            return watchedFee;
          }
        }
        return policyFeeAmount ?? 0;
      };

      const comparisonTarget =
        resolvedPolicyBrokerageAmount === null
          ? null
          : resolvedPolicyBrokerageAmount - resolvePolicyFeeAmount();

      if (!shouldEnforceEquality || comparisonTarget === null) {
        clearAllErrors();
        return;
      }

      let hasMissing = false;
      rows.forEach((row, idx) => {
        if (parseNumericInput(row?.[fieldKey]) === null) {
          hasMissing = true;
          if (!context.hasRowError(idx, fieldKey)) {
            context.setRowError(idx, fieldKey, `${label} is required`);
          }
        }
      });
      if (hasMissing) {
        return;
      }

      const hasAllBrokerageValues = rows.every(
        (row) => parseNumericInput(row?.[fieldKey]) !== null
      );
      if (!hasAllBrokerageValues) {
        clearAllErrors();
        return;
      }

      const totalBrokerage = rows.reduce((sum, row) => {
        const amount = parseNumericInput(row?.[fieldKey]);
        if (amount === null) {
          return sum;
        }
        return sum + amount;
      }, 0);

      const hasMismatch =
        rows.length > 0 &&
        Math.abs(totalBrokerage - comparisonTarget) > 1;

      if (!hasMismatch) {
        clearAllErrors();
        return;
      }

      rows.forEach((_, idx) => {
        if (!context.hasRowError(idx, fieldKey)) {
          context.setRowError(
            idx,
            fieldKey,
            `Sum of insurer ${label.toLowerCase()} must equal policy ${label.toLowerCase()}.`
          );
        }
      });
    },
  },
];

const roundToFourDecimals = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num)) return null;
  return Math.round(num * 10000) / 10000;
};

export const buildInsurerSectionConfigs = (
  options: InsurerSectionOptions = {}
) => {
  const shouldShowBrokerageFields = () => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const storedUser = window.sessionStorage.getItem("user");
      if (!storedUser) {
        return false;
      }
      const parsedUser = JSON.parse(storedUser);

      const organisationKey = parsedUser?.organisationKey;
      if (organisationKey === "iirm_srilanka") {
        return false;
      }
      return true;
    } catch (_error) {
      return false;
    }
  };

  const {
    formValues = {},
    dynamicValues = {},
    leadSectionKey = "feeDetails",
    detailsSectionKey = "insurerDetails",
    showLeadFieldsOnlyForMultiple = false,
    sectionTitle = "Insurers share % and Brokerage % details",
    leadFieldKeys = {},
    basePremiumPath = "policyDetails.basicPremium",
    brokerageAmountPath = "policyDetails.brokerageAmount",
    totalBrokerageAmountPath,
    additionalCommissions = [],
  } = options;

  const leadSectionValues = formValues?.[leadSectionKey] ?? {};
  const policyPlacedFieldKey =
    leadFieldKeys.policyPlacedType ?? "policyPlacedTypeLid";
  const leadInsurerFieldKey = leadFieldKeys.leadInsurer ?? "leadInsurerId";
  const leadPaysFieldKey =
    leadFieldKeys.leadPays ?? "isLeadInsurerPayCommission";

  const getValueAtPath = (source: Record<string, any>, path: string) =>
    path.split(".").reduce((acc, key) => {
      if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
        return acc[key];
      }
      return undefined;
    }, source as any);

  const policyBasicPremium = parseNumericInput(
    getValueAtPath(formValues, basePremiumPath)
  );

  const insurerDetailsValue = formValues?.[detailsSectionKey];
  const insurerRows = Array.isArray(insurerDetailsValue)
    ? insurerDetailsValue
    : Array.isArray(insurerDetailsValue?.retArray)
    ? insurerDetailsValue.retArray
    : [];
  const firstInsurerRow = insurerRows[0] ?? null;
  const hasPrefilledMultipleRows = insurerRows.length > 1;

  const leadInsurerSelectionValue = leadSectionValues?.[leadInsurerFieldKey];
  const prefilledInsurerId =
    firstInsurerRow?.insurerId ?? formValues?.selectFinalisedQuote?.insurerId;
  const hasLeadInsurerSelected = Boolean(
    leadInsurerSelectionValue ?? prefilledInsurerId
  );
  const shouldDisableInsurerDetails = !hasLeadInsurerSelected;
  const justSelectedLeadInsurer =
    Boolean(leadInsurerSelectionValue) && !prefilledInsurerId;

  const hasExplicitPolicyPlacedType =
    leadSectionValues?.[policyPlacedFieldKey] !== undefined &&
    leadSectionValues?.[policyPlacedFieldKey] !== null &&
    leadSectionValues?.[policyPlacedFieldKey] !== "";

  const hasMultipleInsurerRows = insurerRows.length > 1;

  let inferredDefaultPolicyPlacedType: string | number | undefined;

  if (hasExplicitPolicyPlacedType) {
    inferredDefaultPolicyPlacedType = leadSectionValues[policyPlacedFieldKey];
  } else if (hasMultipleInsurerRows) {
    inferredDefaultPolicyPlacedType =
      dynamicValues?.POLICY_PLACED_TYPE_MULTIPLE_INSURER;
  } else if (insurerRows.length === 1) {
    inferredDefaultPolicyPlacedType =
      dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;
  } else if (insurerRows.length === 0) {
    inferredDefaultPolicyPlacedType =
      dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;
  }

  const policyPlacedType = hasExplicitPolicyPlacedType
    ? leadSectionValues[policyPlacedFieldKey]
    : inferredDefaultPolicyPlacedType ??
      dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;

  const isSingleInsurerPolicy =
    policyPlacedType === dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;

  const shouldDisableInsurerNameField =
    shouldDisableInsurerDetails || isSingleInsurerPolicy;
  const insurerNameDisabledByIndex = (idx: number) => {
    if (shouldDisableInsurerNameField) {
      return true;
    }
    return idx === 0;
  };

  const policyPlacedTypePath = `${leadSectionKey}.${policyPlacedFieldKey}`;

  const insurerListEndpoint = "#endPoints.insurersList";

  const dynamicInsurerEndpoint = isSingleInsurerPolicy
    ? preferredInsurerEndpointExpression
    : insurerListEndpoint;

  const policyBrokerageAmount = parseNumericInput(
    getValueAtPath(formValues, brokerageAmountPath)
  );
  const shouldEnforceBrokerageEquality = policyBrokerageAmount !== null;
  const commissionConfigs = [
    {
      percentageKey: "brokeragePercentage",
      amountKey: "brokerageAmount",
      label: "Brokerage amount",
      policyAmountPath: brokerageAmountPath,
      premiumBasePath: basePremiumPath,
      showField: shouldShowBrokerageFields,
      sharePercentageKey: "sharePercentage",
      shareAmountKey: "shareAmount",
      shareLabel: "Premium",
    },
    ...additionalCommissions,
  ].map((commission) => ({
    ...commission,
    // Commissions without their own split ride on the premium share pair.
    sharePercentageKey: commission.sharePercentageKey ?? "sharePercentage",
    shareAmountKey: commission.shareAmountKey ?? "shareAmount",
    shareLabel: commission.shareLabel ?? "Premium",
  }));

  const ownsShareFields = (commission: { shareAmountKey: string }) =>
    commission.shareAmountKey !== "shareAmount";

  // A share split must add up to exactly 100 across the insurer rows.
  const shareTotalValidator =
    (fieldKey: string, label: string) =>
    (_value: any, formValues: any) => {
      const rows = Array.isArray(formValues?.retArray)
        ? formValues.retArray
        : [];
      const total = rows.reduce(
        (sum: number, curr: any) => sum + Number(curr?.[fieldKey] || 0),
        0
      );

      if (total > 100) {
        return `Total ${label} share percentage cannot exceed 100`;
      }
      return total === 100 || `Total ${label} share percentage must be 100`;
    };

  const showCondition = showLeadFieldsOnlyForMultiple
    ? "#isMultipleInsurerPolicy"
    : undefined;

  const leadFields = [
    {
      key: policyPlacedFieldKey,
      name: policyPlacedFieldKey,
      type: "segmentedcontrol",
      label: "Policy Placed Type",
      rules: {
        required: {
          value: true,
          message: "Policy placed type is required",
        },
      },
      gridColumn: 5,
      componentProps: {
        fullWidth: true,
      },
      apiDependencies: {
        endPoint: "#endPoints.lookUpByName(`POLICY_PLACED_TYPE`)",
        clearFieldsOnChange: [leadInsurerFieldKey, leadPaysFieldKey],
      },
    },
    {
      key: leadInsurerFieldKey,
      name: leadInsurerFieldKey,
      type: "selectFieldByApi",
      label: "Select Lead Insurer",
      rules: {
        required: {
          value: true,
          message: "Service Lead insurer is required",
        },
      },
      gridColumn: 5,
      componentProps: {
        fullWidth: true,
        disabled: true,
      },
      apiDependencies: {
        endPoint: "#endPoints.insurersList",
        utilityFunction: "#insurerListUtilityFunction",
        populateFields: [
          {
            targetSection: detailsSectionKey,
            targetIndex: 0,
            fieldMappings: {
              insurerId: leadInsurerFieldKey,
            },
          },
        ],
      },
      // ...(showCondition ? { showField: showCondition } : {}),
    },
    {
      key: leadPaysFieldKey,
      name: leadPaysFieldKey,
      type: "segmentedcontrol",
      label: "Only Lead Insurer Pays Brokerage",
      rules: {
        required: {
          value: true,
          message: "This field is required",
        },
      },
      gridColumn: 5,
      componentProps: {
        fullWidth: true,
      },
      apiDependencies: {
        endPoint: "#endPoints.lookUpByName(`TOGGLE_TYPE`)",
      },
      // ...(showCondition ? { showField: showCondition } : {}),
    },
  ];

  const shareBaseCandidatePaths = Array.from(
    new Set(
      [
        basePremiumPath,
        "policyDetails.basicPremium",
        "policyDetails.totalPremium",
        "policyDetails.netPremium",
        "policyDetails.shareAmount",
        "selectFinalisedQuote.basicPremium",
        "selectFinalisedQuote.totalPremium",
        "selectFinalisedQuote.netPremium",
        `${leadSectionKey}.shareAmount`,
      ].filter(Boolean)
    )
  );

  const resolveShareBase = (context: {
    watchExternal?: (path: string) => any;
    formValues?: Record<string, any>;
  }) => {
    if (typeof context.watchExternal === "function") {
      for (const candidatePath of shareBaseCandidatePaths) {
        const candidateValue = parseNumericInput(
          context.watchExternal(candidatePath as string)
        );
        if (candidateValue !== null) {
          return candidateValue;
        }
      }
    }

    const firstRowShareAmount = parseNumericInput(
      context.formValues?.retArray?.[0]?.shareAmount
    );
    return firstRowShareAmount;
  };

  const isActiveField = (fieldName: string, index?: number) => {
    if (typeof document === "undefined") return false;
    const activeElement = document.activeElement as HTMLElement | null;
    const activeName = activeElement?.getAttribute("name");
    if (!activeName) return false;
    if (index === undefined || index === null) {
      return activeName.endsWith(`.${fieldName}`) || activeName === fieldName;
    }
    return activeName === `retArray.${index}.${fieldName}`;
  };

  // calculate() only receives the fields named in watchFields, so any rule that
  // needs the rest of the row must read it from context.sectionValues.
  const rowValues = (values: Record<string, any>, context: any) =>
    context?.sectionValues ?? values ?? {};

  // Amount a commission is charged on for one insurer row: its own share amount,
  // recomputed from its premium and share percentage when not yet filled in.
  const resolveCommissionBase = (
    values: Record<string, any>,
    context: any,
    commission: {
      sharePercentageKey: string;
      shareAmountKey: string;
    },
    commissionBasePath: string
  ) => {
    const row = rowValues(values, context);
    const shareAmount = parseNumericInput(row?.[commission.shareAmountKey]);
    if (shareAmount !== null) {
      return shareAmount;
    }

    const premium = parseNumericInput(
      context?.watchExternal?.(commissionBasePath)
    );
    const sharePct = parseNumericInput(row?.[commission.sharePercentageKey]);
    if (premium === null || sharePct === null) {
      return null;
    }
    return Number(((premium * sharePct) / 100).toFixed(4));
  };

  const insurerDetailsSection = {
    key: detailsSectionKey,
    title: sectionTitle,
    showAddButton: "#isMultipleInsurerPolicy",
    hideRemoveFirst: true,
    enforceSingleRowWhenAddDisabled: !hasPrefilledMultipleRows,
    config: [
      {
        key: "isLeadInsurer",
        name: "isLeadInsurer",
        type: "segmentedcontrol",
        label: "Insurer type",
        rules: {
          required: {
            value: true,
            message: "Insurer type selection is required",
          },
        },
        gridColumn: 5,
        componentProps: {
          required: true,
          fullWidth: true,
          disabled: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.lookUpByName(`INSURER_PARTICIPATION_TYPE`)",
        },
        showField: "#isMultipleInsurerPolicy",
      },
      {
        key: "insurerId",
        name: "insurerId",
        type: "selectFieldByApi",
        label: "Insurer name",
        rules: {
          required: "Insurer name is required.",
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          preventDuplicateSelections: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurersList",
          utilityFunction: "#insurerListUtilityFunction",
          clearFieldsOnChange: [
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
          ],
        },
      },
      {
        key: "insurerLocationId",
        name: "insurerLocationId",
        type: "select",
        label: "Location",
        rules: {
          required: {
            value: true,
            message: "Location is required.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerLocationListUtilityFunction",
          clearFieldsOnChange: ["insurerBranchId", "insurerContactId"],
        },
      },
      {
        key: "insurerBranchId",
        name: "insurerBranchId",
        type: "select",
        label: "Branch (BranchType-Code-Address1)",
        rules: {
          required: {
            value: true,
            message: "Branch is required.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerLocationAddressUtilityFunction",
          clearFieldsOnChange: ["insurerContactId"],
          utilityDependent: "insurerLocationId",
        },
      },
      {
        key: "insurerContactId",
        name: "insurerContactId",
        type: "select",
        label: "Contact",
        rules: {
          required: {
            value: true,
            message: "Insurer contact is required.",
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
        },
        apiDependencies: {
          endPoint: "#endPoints.insurerById",
          dependentField: "insurerId",
          utilityFunction: "#insurerBranchContactUtilityFunction",
          utilityDependent: "insurerBranchId",
        },
      },
      {
        key: "sharePercentage",
        name: "sharePercentage",
        type: "number",
        label: "Premium share percentage",
        rules: {
          required: {
            value: true,
            message: "Premium share percentage is required",
          },
          validate: shareTotalValidator("sharePercentage", "premium"),
        },
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
        },
        isDecimal: true,
      },
      {
        key: "shareAmount",
        name: "shareAmount",
        type: "number",
        label: "Premium share amount",
        gridColumn: 5,
        componentProps: {
          type: "number",
          fullWidth: true,
          disabled: true,
        },
        formatNumber: true,
      },
      ...commissionConfigs.flatMap((commission) => [
        ...(ownsShareFields(commission)
          ? [
              {
                key: commission.sharePercentageKey,
                name: commission.sharePercentageKey,
                type: "number",
                label: `${commission.shareLabel} share percentage`,
                rules: {
                  validate: shareTotalValidator(
                    commission.sharePercentageKey,
                    commission.shareLabel.toLowerCase()
                  ),
                },
                gridColumn: 5,
                componentProps: {
                  type: "number",
                  fullWidth: true,
                },
                isDecimal: true,
                showField: commission.showField ?? shouldShowBrokerageFields,
              },
              {
                key: commission.shareAmountKey,
                name: commission.shareAmountKey,
                type: "number",
                label: `${commission.shareLabel} share amount`,
                gridColumn: 5,
                componentProps: {
                  type: "number",
                  fullWidth: true,
                  disabled: true,
                },
                formatNumber: true,
                showField: commission.showField ?? shouldShowBrokerageFields,
              },
            ]
          : []),
        {
          key: commission.percentageKey,
          name: commission.percentageKey,
          type: "number",
          label: `${commission.label.replace(/amount/i, "").trim()} percentage`,
          gridColumn: 5,
          componentProps: {
            type: "number",
            fullWidth: true,
            disabled: true,
          },
          isDecimal: true,
          showField: commission.showField ?? shouldShowBrokerageFields,
        },
        {
          key: commission.amountKey,
          name: commission.amountKey,
          type: "number",
          label: commission.label,
          rules: {
            required: {
              value: true,
              message: `${commission.label} is required`,
            },
          },
          gridColumn: 5,
          formatNumber: true,
          isDecimal: true,
          componentProps: {
            type: "number",
            fullWidth: true,
          },
          showField: commission.showField ?? shouldShowBrokerageFields,
        },
      ]),
      {
        key: "totalBrokerageAmount",
        name: "totalBrokerageAmount",
        type: "number",
        label: "Total brokerage amount",
        helperText: () => INSURER_TOTAL_BROKERAGE_HELPER,
        gridColumn: 5,
        formatNumber: true,
        componentProps: {
          type: "number",
          fullWidth: true,
          disabled: true,
        },
        showField: () => {
          if (typeof window === "undefined") return false;
          try {
            const storedUser = window.sessionStorage.getItem("user");
            if (!storedUser) return false;
            const parsed = JSON.parse(storedUser);
            return parsed?.organisationKey !== "iirm_srilanka";
          } catch (_err) {
            return false;
          }
        },
      },
    ].map((field) => {
      if (field.key === "isLeadInsurer") {
        return field;
      }
      const disabled =
        field.key === "insurerId"
          ? shouldDisableInsurerNameField
          : shouldDisableInsurerDetails;
      return {
        ...field,
        componentProps: {
          ...(field.componentProps || {}),
          disabled,
          ...(field.key === "insurerId"
            ? {
                disabledByIndex: insurerNameDisabledByIndex,
              }
            : {}),
        },
      };
    }),
    dynamicCalculatedFields: [
      {
        watchFields: ["sharePercentage"],
        setField: "sharePercentage",
        externalWatchFields: [policyPlacedTypePath],
        calculate: (values: Record<string, any>, context: any) => {
          const rawShareValue = values?.sharePercentage;
          const shareValue = parseNumericInput(rawShareValue);

          if (
            rawShareValue !== null &&
            rawShareValue !== undefined &&
            rawShareValue !== ""
          ) {
            const strValue = String(rawShareValue);
            const decimalPart = strValue.split(".")[1];

            if (decimalPart && decimalPart.length > 4) {
              return roundToFourDecimals(rawShareValue);
            }
          }

          const policyPlacedTypeValue =
            context.watchExternal?.(policyPlacedTypePath);

          if (!policyPlacedTypeValue) {
            return undefined;
          }

          const isSingle =
            policyPlacedTypeValue ===
            dynamicValues?.POLICY_PLACED_TYPE_SINGLE_INSURER;
          const rowCount = Array.isArray(context?.formValues?.retArray)
            ? context.formValues.retArray.length
            : 0;

          if (isSingle) {
            // Only force 100 in true single-row mode; avoid initial-load races
            // where policy-placed is temporarily single while multiple rows exist.
            if (shareValue === null && rowCount <= 1) {
              return 100;
            }
            return undefined;
          }

          // Multiple-insurer policy: do not auto-clear 100 or override user input
          return undefined;
        },
      },
      {
        watchFields: ["sharePercentage"],
        setField: "shareAmount",
        externalWatchFields: [basePremiumPath],
        calculate: (values: Record<string, any>, context: any) => {
          const basePremium = resolveShareBase(context);
          const sharePct = parseNumericInput(values?.sharePercentage);
          if (basePremium === null || sharePct === null) {
            return "";
          }
          return Number(((basePremium * sharePct) / 100).toFixed(4));
        },
      },
      ...commissionConfigs.flatMap((commission) => {
        const commissionBasePath =
          commission.premiumBasePath && commission.premiumBasePath.length > 0
            ? commission.premiumBasePath
            : basePremiumPath;

        const hasMeaningfulDelta = (
          currentValue: number | null,
          nextValue: number
        ) => {
          if (currentValue === null) return true;
          return Math.abs(currentValue - nextValue) >= 0.01;
        };

        return [
          // Own share pair: prefill the percentage from the premium share until the
          // user overrides it, and keep its amount derived from its own premium.
          ...(ownsShareFields(commission)
            ? [
                {
                  watchFields: [
                    "sharePercentage",
                    commission.sharePercentageKey,
                  ],
                  setField: commission.sharePercentageKey,
                  calculate: (values: Record<string, any>, context: any) => {
                    const own =
                      rowValues(values, context)?.[
                        commission.sharePercentageKey
                      ];
                    if (own !== null && own !== undefined) {
                      return undefined;
                    }
                    return (
                      parseNumericInput(rowValues(values, context)?.sharePercentage) ??
                      ""
                    );
                  },
                },
                {
                  watchFields: [
                    commission.sharePercentageKey,
                    "sharePercentage",
                  ],
                  setField: commission.shareAmountKey,
                  externalWatchFields: [commissionBasePath],
                  calculate: (values: Record<string, any>, context: any) => {
                    const premium = parseNumericInput(
                      context?.watchExternal?.(commissionBasePath)
                    );
                    const sharePct = parseNumericInput(
                      rowValues(values, context)?.[
                        commission.sharePercentageKey
                      ]
                    );
                    if (premium === null || sharePct === null) {
                      return "";
                    }
                    return Number(((premium * sharePct) / 100).toFixed(4));
                  },
                },
              ]
            : []),
          {
            watchFields: [
              commission.percentageKey,
              commission.shareAmountKey,
              commission.sharePercentageKey,
            ],
            setField: commission.amountKey,
            externalWatchFields: [commissionBasePath],
            calculate: (values: Record<string, any>, context: any) => {
              const percentage = parseNumericInput(
                values?.[commission.percentageKey]
              );
              const amount = parseNumericInput(values?.[commission.amountKey]);
              const isEditingPercentage = isActiveField(
                commission.percentageKey,
                context?.index
              );
              const isEditingAmount = isActiveField(
                commission.amountKey,
                context?.index
              );

              if (isEditingAmount) {
                return undefined;
              }

              if (
                !isEditingPercentage &&
                !isEditingAmount &&
                percentage !== null &&
                amount !== null
              ) {
                return undefined;
              }

              if (percentage === null) {
                return isEditingPercentage ? "" : undefined;
              }

              const commissionBase = resolveCommissionBase(
                values,
                context,
                commission,
                commissionBasePath
              );
              if (commissionBase === null) {
                return "";
              }

              const computed = Number(
                ((commissionBase * percentage) / 100).toFixed(4)
              );
              const currentAmount = parseNumericInput(
                values?.[commission.amountKey]
              );
              if (
                !Number.isFinite(computed) ||
                !hasMeaningfulDelta(currentAmount, computed)
              ) {
                return undefined;
              }
              return computed;
            },
          },
          {
            watchFields: [commission.amountKey],
            setField: commission.amountKey,
            calculate: (values: Record<string, any>) => {
              const rawValue = values?.[commission.amountKey];

              if (
                rawValue === null ||
                rawValue === undefined ||
                rawValue === ""
              ) {
                return undefined;
              }

              const strValue = String(rawValue);
              const decimalPart = strValue.split(".")[1];

              if (decimalPart && decimalPart.length > 4) {
                return roundToFourDecimals(rawValue);
              }

              return undefined;
            },
          },
          {
            watchFields: [
              commission.amountKey,
              commission.shareAmountKey,
              commission.sharePercentageKey,
            ],
            setField: commission.percentageKey,
            externalWatchFields: [commissionBasePath],
            calculate: (values: Record<string, any>, context: any) => {
              const amount = parseNumericInput(values?.[commission.amountKey]);
              const percentage = parseNumericInput(
                values?.[commission.percentageKey]
              );
              const isEditingAmount = isActiveField(
                commission.amountKey,
                context?.index
              );
              const isEditingPercentage = isActiveField(
                commission.percentageKey,
                context?.index
              );

              if (isEditingPercentage) {
                return undefined;
              }

              if (
                !isEditingAmount &&
                !isEditingPercentage &&
                amount !== null &&
                percentage !== null
              ) {
                return undefined;
              }

              if (amount === null) {
                return isEditingAmount ? "" : undefined;
              }
              const commissionBase = resolveCommissionBase(
                values,
                context,
                commission,
                commissionBasePath
              );
              if (commissionBase === null) {
                return "";
              }
              if (commissionBase === 0) {
                return undefined;
              }
              const computed = Number(
                ((amount / commissionBase) * 100).toFixed(4)
              );
              const currentPercentage = parseNumericInput(
                values?.[commission.percentageKey]
              );
              if (
                !Number.isFinite(computed) ||
                !hasMeaningfulDelta(currentPercentage, computed)
              ) {
                return undefined;
              }
              return computed;
            },
          },
        ];
      }),
      ...(shouldShowBrokerageFields() && totalBrokerageAmountPath
        ? [
            {
              watchFields: ["brokerageAmount", "terrorismBrokerageAmount"],
              setField: "totalBrokerageAmount",
              calculate: (values: Record<string, any>) => {
                const brokerageAmount = parseNumericInput(
                  values?.brokerageAmount
                );
                const terrorismBrokerageAmount = parseNumericInput(
                  values?.terrorismBrokerageAmount
                );

                if (
                  brokerageAmount === null &&
                  terrorismBrokerageAmount === null
                ) {
                  return "";
                }

                const total =
                  (brokerageAmount || 0) + (terrorismBrokerageAmount || 0);
                return Number(total.toFixed(4));
              },
            },
          ]
        : []),
    ],
    externalValidators: [
      ...(shouldShowBrokerageFields() && totalBrokerageAmountPath
        ? buildInsurerAmountValidators(
            "totalBrokerageAmount",
            !!totalBrokerageAmountPath,
            parseNumericInput(
              getValueAtPath(formValues, totalBrokerageAmountPath || "")
            ),
            totalBrokerageAmountPath,
            "Total brokerage amount",
            totalBrokerageAmountPath?.replace(/\.totalBrokerageAmount$/, ".fee"),
            parseNumericInput(
              getValueAtPath(
                formValues,
                totalBrokerageAmountPath?.replace(
                  /\.totalBrokerageAmount$/,
                  ".fee"
                ) || ""
              )
            )
          )
        : shouldShowBrokerageFields()
        ? buildInsurerAmountValidators(
            "brokerageAmount",
            shouldEnforceBrokerageEquality,
            policyBrokerageAmount,
            brokerageAmountPath,
            "Brokerage amount"
          )
        : []),
      ...commissionConfigs
        .filter((commission) => {
          if (commission.amountKey === "brokerageAmount") return false;
          if (commission.amountKey === "terrorismBrokerageAmount") return false;
          if (typeof commission.showField === "function") {
            return !!commission.showField();
          }
          return commission.showField === undefined
            ? true
            : !!commission.showField;
        })
        .flatMap((commission) =>
          buildInsurerAmountValidators(
            commission.amountKey,
            true,
            parseNumericInput(
              getValueAtPath(formValues, commission.policyAmountPath || "")
            ),
            commission.policyAmountPath,
            commission.label
          )
        ),
    ].filter(Boolean),
    runExternalValidatorsOnChange:
      options.runExternalValidatorsOnChange ?? false,
    isMultiple: true,
    defaultValues: [
      {
        insurerId: null,
        insurerBranchId: null,
        insurerContactId: null,
        insurerLocationId: null,
        sharePercentage: null,
        shareAmount: null,
        brokeragePercentage: null,
        brokerageAmount: null,
        totalBrokerageAmount: null,
        ...commissionConfigs.reduce((acc, commission) => {
          acc[commission.percentageKey] = null;
          acc[commission.amountKey] = null;
          acc[commission.sharePercentageKey] = null;
          acc[commission.shareAmountKey] = null;
          return acc;
        }, {} as Record<string, any>),
        isLeadInsurer: isSingleInsurerPolicy
          ? dynamicValues?.INSURER_PARTICIPATION_TYPE_LEAD
          : dynamicValues?.INSURER_PARTICIPATION_TYPE_CO,
      },
    ],
  };

  const leadDefaults: Record<string, any> = {
    [leadPaysFieldKey]: dynamicValues?.TOGGLE_YES ?? null,
  };

  if (
    !hasExplicitPolicyPlacedType &&
    inferredDefaultPolicyPlacedType !== undefined
  ) {
    leadDefaults[policyPlacedFieldKey] = inferredDefaultPolicyPlacedType;
  }
  return {
    leadFields,
    leadDefaults,
    insurerDetailsSection,
  };
};
