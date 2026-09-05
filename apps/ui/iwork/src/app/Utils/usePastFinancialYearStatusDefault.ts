import { useEffect } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { getCurrentFinancialYearDefault } from "@ui/ui-lib";
import { ACTIVE } from "../constants";

/**
 * Opportunity-listing rule: when the user selects a financial year earlier than
 * the current one, default the status ("state") filter to Active so closed/old
 * outcomes are not surfaced by default for past years — but only when the user
 * has not already picked a status, so a manual selection is never overwritten.
 * Switching to the current (or a future) FY leaves the status untouched.
 * Frontend-only default — the listing pages own `formMethods` and pass it to the
 * shared SmartSearch, so this stays scoped to opportunities.
 */
export const usePastFinancialYearStatusDefault = (
  formMethods?: UseFormReturn<FieldValues>
): void => {
  useEffect(() => {
    if (!formMethods) return;

    const subscription = formMethods.watch((values, { name }) => {
      if (name !== "financialYear") return;

      const financialYear = values.financialYear as
        | { value?: string }
        | undefined;
      if (!financialYear?.value) return;

      const selectedStartYear = Number.parseInt(financialYear.value, 10);
      const currentStartYear = Number.parseInt(
        getCurrentFinancialYearDefault().value,
        10
      );
      if (Number.isNaN(selectedStartYear) || Number.isNaN(currentStartYear)) {
        return;
      }

      const currentState = values.state;
      const stateIsEmpty =
        currentState == null ||
        currentState === "" ||
        (Array.isArray(currentState) && currentState.length === 0);

      if (selectedStartYear < currentStartYear && stateIsEmpty) {
        // state is an array of plain value strings (see MultiSelect); mirror the
        // shape a manual "Active" selection produces.
        formMethods.setValue("state", [ACTIVE]);
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethods]);
};
