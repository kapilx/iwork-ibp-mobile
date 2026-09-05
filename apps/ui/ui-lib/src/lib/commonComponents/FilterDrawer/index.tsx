import React from "react";
import { UseFormReturn } from "react-hook-form";
import Button from "../Button";
import DynamicForm from "../FormComponent";
import { FormFieldConfig } from "../FormComponent/types";
import { FilterDrawerBody, FilterDrawerFooter, ResetLink } from "./styles";

export interface FilterDrawerProps {
  formConfig: FormFieldConfig[];
  defaultValues?: any;
  existingMethods?: UseFormReturn<any>;
  onReset: () => void;
  onApply: () => void;
  resetLabel?: string;
  applyLabel?: string;
  resetTestId?: string;
  applyTestId?: string;
  // Page-specific content rendered above the form fields (e.g. a view-by
  // toggle) — every page's additional filters can differ here.
  extraContent?: React.ReactNode;
}

// Generic additional-filters drawer body: page-specific extra content (if
// any), a formConfig-driven field list, and a pinned Reset + Apply footer.
const FilterDrawer: React.FC<FilterDrawerProps> = ({
  formConfig,
  defaultValues,
  existingMethods,
  onReset,
  onApply,
  resetLabel = "Reset",
  applyLabel = "Apply",
  resetTestId = "filter-drawer-reset",
  applyTestId = "filter-drawer-apply",
  extraContent,
}) => (
  <>
    <FilterDrawerBody>
      {extraContent}
      <DynamicForm
        formConfig={formConfig}
        defaultValues={defaultValues}
        existingMethods={existingMethods}
        externalMethods={existingMethods}
        enableSmartSearch
        renderOnlyFields
      />
    </FilterDrawerBody>
    <FilterDrawerFooter>
      <ResetLink onClick={onReset} data-testid={resetTestId}>
        {resetLabel}
      </ResetLink>
      <Button
        variantType="primary"
        sizeType="small"
        label={applyLabel}
        onClick={onApply}
        data-testid={applyTestId}
      />
    </FilterDrawerFooter>
  </>
);

export default FilterDrawer;
