import { getCountrySpecificConfig } from "../pages/OpportunityActivities/Constants/countryConfigUtils";

export type PercentageAmountUpdate = {
  [percentageField: string]: number | "";
  [amountField: string]: number | "";
};

export interface CalculatePercentageAmountUpdateOptions {
  skipCountryCheck?: boolean;
  preferPercentageInput?: boolean;
  allowReverseWhenAmountChanged?: boolean;
  changedField?: "percentage" | "amount" | "base";
  skipInitialIfBothProvided?: boolean;
}

export const calculatePercentageAmountUpdate = (
  base: number,
  percentage: number,
  amount: number,
  prevBase: number,
  prevPercentage: number,
  prevAmount: number,
  percentageField: string,
  amountField: string,
  options?: CalculatePercentageAmountUpdateOptions
): PercentageAmountUpdate | null => {
  const shouldSkipCalculation = options?.skipCountryCheck
    ? false
    : getCountrySpecificConfig(false, {
        "Sri Lanka": true,
      });

  if (shouldSkipCalculation) {
    return null;
  }

  const isBaseValid = !isNaN(base) && base > 0;
  const wasBaseValid = !isNaN(prevBase) && prevBase > 0;
  const baseChanged = base !== prevBase;
  const percentageChanged = percentage !== prevPercentage;
  const amountChanged = amount !== prevAmount;

  const skipInitialIfBothProvided = options?.skipInitialIfBothProvided !== false;
  if (
    skipInitialIfBothProvided &&
    prevPercentage === 0 &&
    prevAmount === 0 &&
    percentage > 0 &&
    amount > 0
  ) {
    return null;
  }

  if (!isBaseValid) {
    if (
      wasBaseValid &&
      baseChanged &&
      ((prevPercentage && prevPercentage !== 0) ||
        (prevAmount && prevAmount !== 0))
    ) {
      return { [percentageField]: "", [amountField]: "" };
    }
    return null;
  }

  if (options?.changedField === "percentage") {
    if (!(percentage > 0)) {
      return { [amountField]: "" };
    }
    const newAmount = Number(((base * percentage) / 100).toFixed(4));
    if (newAmount !== amount) {
      return { [amountField]: newAmount };
    }
    return null;
  }

  if (options?.changedField === "amount") {
    if (!(amount > 0)) {
      return { [percentageField]: "" };
    }
    if (options?.preferPercentageInput && percentage > 0) {
      const allowReverse =
        options?.allowReverseWhenAmountChanged && !baseChanged;
      if (!allowReverse) {
        return null;
      }
    }
    const newPercentage = Number(((amount / base) * 100).toFixed(4));
    if (newPercentage !== percentage) {
      return { [percentageField]: newPercentage };
    }
    return null;
  }

  if (percentageChanged) {
    if (!(percentage > 0)) {
      return { [amountField]: "" };
    }
    const newAmount = Number(((base * percentage) / 100).toFixed(4));
    if (newAmount !== amount) {
      return { [amountField]: newAmount };
    }
    return null;
  }

  if (amountChanged) {
    if (!(amount > 0)) {
      return { [percentageField]: "" };
    }
    if (options?.preferPercentageInput && percentage > 0) {
      const allowReverse =
        options?.allowReverseWhenAmountChanged && !baseChanged;
      if (!allowReverse) {
        return null;
      }
    }
    const newPercentage = Number(((amount / base) * 100).toFixed(4));
    if (newPercentage !== percentage) {
      return { [percentageField]: newPercentage };
    }
    return null;
  }

  if (baseChanged) {
    if (percentage > 0) {
      const newAmount = Number(((base * percentage) / 100).toFixed(4));
      if (newAmount !== amount) {
        return { [amountField]: newAmount };
      }
    } else if (amount > 0) {
      const newPercentage = Number(((amount / base) * 100).toFixed(4));
      if (newPercentage !== percentage) {
        return { [percentageField]: newPercentage };
      }
    }
  }

  return null;
};