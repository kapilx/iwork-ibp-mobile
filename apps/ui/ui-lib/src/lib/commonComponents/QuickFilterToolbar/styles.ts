import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const TableSearchRow = styled(Box)`
  display: flex;
  /* Bottom-align so the filter button lines up with the search inputs
     themselves, not the labels sitting above them. */
  align-items: flex-end;
  gap: 12px;
  /* Table's HeaderContainer is justify-content:space-between across
     title / this row / the action buttons — pull this row toward the action
     buttons instead of floating with even space on both sides, so the filter
     button sits just left of Save view (owner, then company, to its left in
     turn). margin-right keeps a visible gap to Save view instead of the two
     touching. */
  margin-left: auto;
  margin-right: 16px;
`;

export const ToolbarIconButton = styled("button")`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: #1a1a1a;
`;

export const FilterDrawerColumn = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

// ---- Applied filters chip row (opt-in, rendered by Table) -----------------

export const AppliedFiltersRow = styled(Box)`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 10px;
  column-gap: 10px;
  margin-top: -4px;
  margin-bottom: 16px;
  font-size: 13px;
`;

export const AppliedFiltersLabel = styled("span")`
  color: #5a5a5a;
`;

export const FilterGroupHead = styled(Box)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const FilterGroupLabel = styled("span")`
  color: #5a5a5a;
  white-space: nowrap;
`;

export const FilterGroupDivider = styled("span")`
  color: #c7c7c7;
`;

export const FilterChip = styled("span")`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eef0f4;
  color: #1a1a1a;
  border-radius: 999px;
  padding: 4px 8px 4px 12px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
`;

export const FilterChipRemove = styled("button")`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: none;
  color: #5a5a5a;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;

  &:hover {
    background: #d8dbe2;
    color: #1a1a1a;
  }
`;

export const ClearAllLink = styled("button")`
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: #3b6ff5;
`;
