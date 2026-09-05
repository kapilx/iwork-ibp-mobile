import { useEffect, useState } from "react";
import {
  UseFormReturn,
  FieldValues,
  DeepPartial,
  DefaultValues,
} from "react-hook-form";
import { updateUserDefaultConfig } from "../redux";
import { buildColumnSettingsPayload } from "./useTableController";

interface UseFormWatcherProps<T extends FieldValues> {
  formMethods: UseFormReturn<T>;
  setSearchTerm: (searchTerm: string) => void;
  searchFieldName: keyof T;
  searchDefaultValues?: { [key: string]: string } | undefined;
  /**
   * When provided together with `dispatch`, Reset also persists a filter
   * preference (the same backend call "Save View" makes) instead of only
   * clearing local form state. Callers that omit these keep the previous,
   * persistence-free behavior.
   */
  entityKey?: string;
  columnOrder?: any[];
  dispatch?: (action: any) => void;
  /**
   * What gets persisted on Reset — defaults to `searchDefaultValues`. Pass
   * this separately when `searchDefaultValues` can resolve to a transient,
   * contextual value (e.g. `prefilledFilterValues` from a drill-down link's
   * `location.state`) that resets the form correctly but must never be
   * written back as the entity's saved default — pass the true system
   * default here instead in that case.
   */
  persistDefaultValues?: { [key: string]: string } | undefined;
}

// Utility to remove empty array values
const filterEmptyMultiselects = (values: any) => {
  if (!values || typeof values !== "object") return values;

  const filteredValues = { ...values };
  Object.keys(filteredValues).forEach((key) => {
    const value = filteredValues[key];
    if (Array.isArray(value) && value.length === 0) {
      delete filteredValues[key];
    }
  });
  return filteredValues;
};

const useFormWatcher = <T extends FieldValues>({
  formMethods,
  setSearchTerm,
  searchFieldName,
  searchDefaultValues = {},
  entityKey,
  columnOrder,
  dispatch,
  persistDefaultValues = searchDefaultValues,
}: UseFormWatcherProps<T>) => {
  const [selectedValues, setSelectedValues] = useState<
    { [key: string]: string } | undefined
  >(searchDefaultValues);

  useEffect(() => {
    if (!formMethods) return;

    const subscription = formMethods.watch((values: DeepPartial<T>) => {
      const filteredValues = filterEmptyMultiselects(values);

      setSelectedValues(filteredValues);

      const searchValue =
        (filteredValues[searchFieldName as keyof DeepPartial<T>] as string) ||
        "";
      setSearchTerm(searchValue);
    });

    return () => subscription.unsubscribe();
  }, [formMethods, setSearchTerm, searchFieldName]);

  const handleReset = () => {
    if (formMethods && searchDefaultValues) {
      formMethods.reset(searchDefaultValues as DefaultValues<T>); // Reset form fields to default values
      setSearchTerm(""); // Clear the search term
    }
    if (dispatch && entityKey) {
      dispatch(
        updateUserDefaultConfig({
          entityKey,
          selectedFilterValues: persistDefaultValues,
          columns: buildColumnSettingsPayload(columnOrder),
        }) as any
      );
    }
  };

  return { selectedValues, handleReset };
};

export default useFormWatcher;
