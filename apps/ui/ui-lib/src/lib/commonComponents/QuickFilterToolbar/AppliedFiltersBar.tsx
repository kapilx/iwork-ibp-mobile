import React, { Fragment } from "react";
import { AppliedFilterChip, AppliedFiltersConfig } from "./types";
import {
  AppliedFiltersRow,
  AppliedFiltersLabel,
  FilterGroupHead,
  FilterGroupLabel,
  FilterGroupDivider,
  FilterChip,
  FilterChipRemove,
  ClearAllLink,
} from "./styles";

const Chip: React.FC<{ chip: AppliedFilterChip }> = ({ chip }) => (
  <FilterChip>
    {chip.label}
    <FilterChipRemove
      type="button"
      aria-label={`Remove ${chip.label}`}
      onClick={chip.onRemove}
    >
      ×
    </FilterChipRemove>
  </FilterChip>
);

// Opt-in row rendered by Table below its header when
// quickFilters.appliedFilters is provided. Purely presentational — groups,
// chip text and remove/clear handlers are all computed by the page (see
// buildAppliedFilterGroups).
const AppliedFiltersBar: React.FC<AppliedFiltersConfig> = ({
  groups,
  onClearAll,
  clearAllLabel = "Clear all",
}) => {
  if (!groups.length) return null;

  return (
    <AppliedFiltersRow>
      <AppliedFiltersLabel>Applied filters:</AppliedFiltersLabel>
      {groups.map((group, index) => {
        const [firstChip, ...restChips] = group.chips;
        return (
          <Fragment key={group.key}>
            {index > 0 && <FilterGroupDivider>|</FilterGroupDivider>}
            <FilterGroupHead>
              <FilterGroupLabel>{group.label}</FilterGroupLabel>
              <Chip chip={firstChip} />
            </FilterGroupHead>
            {restChips.map((chip) => (
              <Chip key={chip.id} chip={chip} />
            ))}
          </Fragment>
        );
      })}
      <ClearAllLink type="button" onClick={onClearAll}>
        {clearAllLabel}
      </ClearAllLink>
    </AppliedFiltersRow>
  );
};

export default AppliedFiltersBar;
