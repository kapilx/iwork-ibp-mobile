import { withPercentageClamp } from "@ui/ui-lib/utils";
import { parseNumericInput } from "../../Constants/autoPopulateFields";

type InstallmentSectionOptions = {
  formValues?: Record<string, any>;
  isInstallmentRequired?: boolean;
  sectionKey?: string;
  sectionTitle?: string;
  grossPremiumPath?: string;
  totalInstallmentAmountPath?: string;
  policyFromDate?: string | Date | null;
  policyToDate?: string | Date | null;
  runExternalValidatorsOnChange?: boolean;
  dynamicValues?: Record<string, any>;
};

export const buildInstallmentSectionConfigs = (
  options: InstallmentSectionOptions = {}
) => {
  const {
    formValues = {},
    isInstallmentRequired = false,
    sectionKey = "installmentDetails",
    sectionTitle = "Installment",
    grossPremiumPath = "policyDetails.grossPremium",
    totalInstallmentAmountPath,
    policyFromDate,
    policyToDate,
    runExternalValidatorsOnChange = false,
  } = options;

  const getValueAtPath = (source: Record<string, any>, path: string) =>
    path.split(".").reduce((acc, key) => {
      if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
        return acc[key];
      }
      return undefined;
    }, source as any);

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

  const baseGrossPremium = parseNumericInput(
    getValueAtPath(formValues, grossPremiumPath)
  );
  const baseTotalInstallmentAmount = totalInstallmentAmountPath
    ? parseNumericInput(getValueAtPath(formValues, totalInstallmentAmountPath))
    : null;
  const resolveInstallmentBase = (context: any): number | null => {
    if (totalInstallmentAmountPath) {
      const watchedTotal = parseNumericInput(
        context.watchExternal?.(totalInstallmentAmountPath)
      );
      if (watchedTotal !== null) {
        return watchedTotal;
      }
      if (baseTotalInstallmentAmount !== null) {
        return baseTotalInstallmentAmount;
      }
    }
    const watchedGross = parseNumericInput(
      context.watchExternal?.(grossPremiumPath)
    );
    return watchedGross ?? baseGrossPremium;
  };
  const effectiveSectionTitle = sectionTitle;
  const requiredSuffix = isInstallmentRequired ? "*" : "";
  const prefilledInstallmentRows = (() => {
    const value = formValues?.[sectionKey];
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === "object" && Array.isArray(value.retArray)) {
      return value.retArray;
    }
    return [];
  })();
  const hasPrefilledMultipleRows = prefilledInstallmentRows.length > 1;

  const installmentSection = {
    key: sectionKey,
    title: effectiveSectionTitle,
    config: [
      {
        key: "installmentDate",
        name: "installmentDate",
        type: "date",
        label: `Installment date${requiredSuffix}`,
        rules: {
          validate: (value: any) => {
            const isRequired = Boolean(isInstallmentRequired);
            if (isRequired && (value === null || value === undefined || value === "")) {
              return "Installment date is required";
            }
            return true;
          },
        },
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          // minDate: policyFromDate
          //   ? `#dayjs("${policyFromDate}")`
          //   : `#dayjs("2026-04-01")`,
           minDate: `#dayjs("2026-04-01")`,
          // maxDate: policyToDate ? `#dayjs("${policyToDate}")` : undefined,
        },
      },
      {
        key: "installmentPercentage",
        name: "installmentPercentage",
        type: "number",
        label: `Installment %${requiredSuffix}`,
        rules: {
          validate: (value: any, values: any) => {
            const isRequired = Boolean(isInstallmentRequired);
            if (isRequired && (value === null || value === undefined || value === "")) {
              return "Installment percentage is required";
            }
            
            if (isRequired && values?.retArray) {
              const rows = Array.isArray(values.retArray) ? values.retArray : [];
              const total = rows.reduce(
                (sum: number, curr: any) => sum + Number(curr?.installmentPercentage || 0),
                0
              );
              if (total > 100) {
                return "Total installment percentage cannot exceed 100";
              }
            }
            return true;
          },
        },
        gridColumn: 5,
        isDecimal: true,
        componentProps: withPercentageClamp({
          type: "number",
          fullWidth: true,
        }),
      },
       {
        key: "installmentNetAmount",
        name: "installmentNetAmount",
        type: "number",
        label: `Installment amount${requiredSuffix}`,
        gridColumn: 5,
        isDecimal: true,
        formatNumber: true,
        rules: {
          validate: (value: any) => {
            const isRequired = Boolean(isInstallmentRequired);
            if (isRequired && (value === null || value === undefined || value === "")) {
              return "Installment amount is required";
            }
            return true;
          },
        },
        componentProps: {
          fullWidth: true,
        },
      },
    ],
    isMultiple: true,
    disableAllFields: !isInstallmentRequired,
    showAddButton: isInstallmentRequired || hasPrefilledMultipleRows,
    enforceSingleRowWhenAddDisabled: !hasPrefilledMultipleRows,
    defaultValues: [
      {
        installmentDate: null,
        installmentNetAmount: null,
        installmentSequence: null,
        installmentPercentage: null,
      },
    ],
    containerStyles: {
      gap: "8px",
      display: "flex",
      flexDirection: "column",
    },
    dynamicCalculatedFields: [
      {
        watchFields: ["installmentDate"],
        setField: "installmentSequence",
        calculate: (_values: Record<string, any>, context: any) => {
          const rowIndex =
            typeof context?.index === "number" ? context.index : null;
          if (rowIndex === null) {
            return undefined;
          }
          return rowIndex + 1;
        },
      },
      {
        watchFields: ["installmentPercentage"],
        setField: "installmentNetAmount",
        externalWatchFields: [grossPremiumPath],
        calculate: (values: Record<string, any>, context: any) => {
          const percentage = parseNumericInput(values?.installmentPercentage);
          const isEditingPercentage = isActiveField(
            "installmentPercentage",
            context?.index
          );
          const isEditingNet = isActiveField(
            "installmentNetAmount",
            context?.index
          );
          if (!isEditingPercentage || isEditingNet) {
            return undefined;
          }
          if (percentage === null) {
            return "";
          }
          const baseAmount = resolveInstallmentBase(context);
          if (baseAmount === null) {
            return "";
          }
          return Number(((baseAmount * percentage) / 100).toFixed(4));
        },
      },
      {
        watchFields: ["installmentNetAmount"],
        setField: "installmentPercentage",
        externalWatchFields: [grossPremiumPath],
        calculate: (values: Record<string, any>, context: any) => {
          const netAmount = parseNumericInput(values?.installmentNetAmount);
          const isEditingNet = isActiveField(
            "installmentNetAmount",
            context?.index
          );
          const isEditingPercentage = isActiveField(
            "installmentPercentage",
            context?.index
          );
          if (!isEditingNet || isEditingPercentage) {
            return undefined;
          }
          if (netAmount === null) {
            return "";
          }
          const baseAmount = resolveInstallmentBase(context);
          if (baseAmount === null || baseAmount === 0) {
            return undefined;
          }
          return Number(((netAmount / baseAmount) * 100).toFixed(4));
        },
      },
    ],
    externalValidators: [
      ...(totalInstallmentAmountPath
        ? [
            {
              validate: (values: Record<string, any>, context: any) => {
                if (!isInstallmentRequired) {
                  return;
                }
                const rows = Array.isArray(values?.retArray)
                  ? values.retArray
                  : [];
                const fieldKey = "installmentNetAmount";

                const clearAllErrors = () => {
                  rows.forEach((_, idx) => {
                    if (context.hasRowError(idx, fieldKey)) {
                      context.clearRowError(idx, fieldKey);
                    }
                  });
                };

                const resolveTotalInstallment = (): number | null => {
                  if (
                    totalInstallmentAmountPath &&
                    typeof context.watchExternal === "function"
                  ) {
                    const watchedValue = parseNumericInput(
                      context.watchExternal(totalInstallmentAmountPath)
                    );
                    if (watchedValue !== null) {
                      return watchedValue;
                    }
                  }
                  return baseTotalInstallmentAmount;
                };

                const resolvedTotal = resolveTotalInstallment();
                if (resolvedTotal === null) {
                  clearAllErrors();
                  return;
                }

                let hasMissing = false;
                rows.forEach((row, idx) => {
                  if (parseNumericInput(row?.[fieldKey]) === null) {
                    hasMissing = true;
                    if (!context.hasRowError(idx, fieldKey)) {
                      context.setRowError(
                        idx,
                        fieldKey,
                        "Installment amount is required"
                      );
                    }
                  }
                });
                if (hasMissing) {
                  return;
                }

                const totalNet = rows.reduce((sum, row) => {
                  const amount = parseNumericInput(row?.[fieldKey]);
                  if (amount === null) {
                    return sum;
                  }
                  return sum + amount;
                }, 0);

                const hasMismatch =
                  rows.length > 0 && Math.abs(totalNet - resolvedTotal) > 1;

                if (!hasMismatch) {
                  clearAllErrors();
                  return;
                }

                rows.forEach((_, idx) => {
                  if (!context.hasRowError(idx, fieldKey)) {
                    context.setRowError(
                      idx,
                      fieldKey,
                      "Sum of installment amount must equal total installment amount."
                    );
                  }
                });
              },
            },
          ]
        : []),
    ],
    runExternalValidatorsOnChange,
  };

  return {
    installmentSection,
  };
};
