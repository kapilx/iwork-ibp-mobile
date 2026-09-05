import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const FilterDrawerBody = styled(Box)`
  flex: 1;
  overflow-y: auto;
  /* Comfortable padding around the fields (incl. horizontal). */
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* extra content ↔ the fields grid */

  /* DynamicForm renders the fields in a MUI <Grid container spacing={2}>, whose
     built-in margins made the row gap too large. Neutralise that and set the
     inter-field vertical spacing to a controlled 25px. */
  & .MuiGrid-container {
    margin: 0 !important;
    width: 100% !important;
    row-gap: 25px;
  }
  & .MuiGrid-item {
    padding: 0 !important;
    max-width: 100% !important;
    flex-basis: 100% !important;
  }

  /* Compact the fields — smaller height, label and text. */
  & .MuiInputBase-root {
    min-height: 34px;
    border-radius: 8px;
  }
  & .MuiOutlinedInput-input,
  & .MuiSelect-select,
  & .MuiAutocomplete-input {
    padding-top: 5px !important;
    padding-bottom: 5px !important;
    font-size: 13px;
  }
  & .MuiInputLabel-root,
  & .MuiFormLabel-root,
  & label {
    font-size: 13px;
  }
`;

export const FilterDrawerFooter = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Padding around Reset / Apply so they aren't flush to the drawer edges. */
  padding: 16px;
  border-top: 1px solid #eef0f4;
`;

export const ResetLink = styled("button")`
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #3b6ff5;
  padding: 8px 4px;
`;
