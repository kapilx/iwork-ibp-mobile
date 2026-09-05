// Page-local styled components for Biz Done Enhanced's toolbar row. Mirrors
// RO Enhanced's orgScope/styles.ts exactly — everything else (org-hierarchy/
// period-filter styles, table-header toolbar shell, generic filter-drawer
// body/footer styles) lives in ui-lib's OrgFinancialFilter / QuickFilterToolbar
// / FilterDrawer components.

import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

// DynamicForm's grid (column-gap: 60px, width: unset) is tuned for a
// full-width form/drawer, not a slim inline toolbar row — constrain it here
// the same way FilterDrawerBody constrains it for the drawer.
export const ToolbarFieldsWrapper = styled(Box)({
  display: "flex",
  alignItems: "flex-end",
  flexWrap: "nowrap",

  // MUI's Grid applies its own sizing via a double-class "&&" selector
  // (see FormComponent's getGridItemSx), which beats a plain nested selector
  // on specificity — these need !important to actually win.
  "& .MuiGrid-container": {
    display: "flex !important",
    flexWrap: "nowrap !important",
    width: "auto !important",
    columnGap: "12px",
    rowGap: 0,
    margin: "0 !important",
  },
  "& .MuiGrid-item": {
    width: "200px !important",
    maxWidth: "200px !important",
    flex: "none !important",
    padding: "0 !important",
  },
  "& .MuiInputBase-root": {
    minHeight: "34px",
    borderRadius: "8px",
  },
  "& .MuiOutlinedInput-input, & .MuiAutocomplete-input": {
    paddingTop: "5px !important",
    paddingBottom: "5px !important",
    fontSize: "13px",
  },
});
