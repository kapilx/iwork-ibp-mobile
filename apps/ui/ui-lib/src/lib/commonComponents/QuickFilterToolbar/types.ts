import React from "react";

export interface AppliedFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface AppliedFilterGroup {
  key: string;
  label: string;
  chips: AppliedFilterChip[];
}

export interface AppliedFiltersConfig {
  groups: AppliedFilterGroup[];
  onClearAll: () => void;
  clearAllLabel?: string;
}

export interface QuickFilterToolbarConfig {
  // Quick-search fields rendered inline in the table header (e.g. company,
  // owner) — entirely page-defined, typically a DynamicForm with
  // selectFieldByApi fields bound to the page's own form methods.
  quickFieldsContent?: React.ReactNode;
  // The additional-filters form, rendered with a `close` callback so Apply can
  // shut the drawer after committing. Content is entirely page-defined.
  renderFilterContent?: (close: () => void) => React.ReactNode;
  filterButtonAriaLabel?: string;
  filterButtonTestId?: string;
  drawerTitle?: string;
  drawerWidth?: string;
  appliedFilters?: AppliedFiltersConfig;
}
