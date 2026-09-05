// Page-local styled components for RO Enhanced. Everything else (org-
// hierarchy/period-filter styles, table-header toolbar shell, generic
// filter-drawer body/footer styles) lives in ui-lib's OrgFinancialFilter /
// QuickFilterToolbar / FilterDrawer components. The "Owner view" toggle is
// now a real segmentedcontrol field (same component as the Insurer branch
// toggle), so no custom tab styling is needed here anymore.

import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

// DynamicForm's grid (column-gap: 60px, width: unset) is tuned for a
// full-width form/drawer, not a slim inline toolbar row — constrain it here
// the same way FilterDrawerBody constrains it for the drawer.
export const ToolbarFieldsWrapper = styled(Box)`
  display: flex;
  align-items: flex-end;
  flex-wrap: nowrap;

  /* MUI's Grid applies its own sizing via a double-class "&&" selector
     (see FormComponent's getGridItemSx), which beats a plain nested selector
     on specificity — these need !important to actually win. */
  & .MuiGrid-container {
    display: flex !important;
    flex-wrap: nowrap !important;
    width: auto !important;
    column-gap: 12px;
    row-gap: 0;
    margin: 0 !important;
  }
  & .MuiGrid-item {
    width: 200px !important;
    max-width: 200px !important;
    flex: none !important;
    padding: 0 !important;
  }
  & .MuiInputBase-root {
    min-height: 34px;
    border-radius: 8px;
  }
  & .MuiOutlinedInput-input,
  & .MuiAutocomplete-input {
    padding-top: 5px !important;
    padding-bottom: 5px !important;
    font-size: 13px;
  }
`;
