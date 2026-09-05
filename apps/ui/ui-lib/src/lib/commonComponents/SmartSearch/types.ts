import { UseFormReturn } from "react-hook-form";
import { FormFieldConfig } from "../FormComponent/types";

export interface SearchResult {
  id: number;
  name: string;
  type: string;
  description: string;
}

export interface SmartSearchProps<
  T extends SearchFormValues = SearchFormValues
> {
  searchFormConfig: FormFieldConfig[];
  searchFormMethods?: (methods: UseFormReturn<T>) => void;
  searchDefaultValues?: SearchFormValues;
  isEditMode?: boolean;
  selectedValues?: { [key: string]: string } | undefined;
  onValuesChange?: (values: SearchFormValues) => void;
  onReset?: () => void;
  onSaveView?: () => void;
  saveViewLoading?: boolean;
  formMethods?: UseFormReturn<T>;
  searchFieldName: string;
  placeholder?: string;
  enableSmartSearch?: boolean;
  enableManualSearch?: boolean;
  disableSearch?: boolean;
  onRunFilters?: () => void; // New prop
  hideSearch?: boolean;
  runThePeriodFilterByDefault?: boolean;
  disableAllFields?: boolean;
  title?: string | null;
  expandFilters?: boolean;
  onExpandFiltersChange?: (expanded: boolean) => void;
  sharedFormMethods?: UseFormReturn<any>; // shared form instance for syncing
  collapseOnRun?: boolean; // Collapse the filter panel after Run. Defaults to true.
}

export interface SearchFormValues {
  search?: string;
  searchType?: string;
  searchCategory?: string;
  CompanyId?: string;
  contactName?: string;
  phoneNumber?: string;
  email?: string;
  [key: string]: string | undefined;
}
