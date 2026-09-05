import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const ToolbarFieldsWrapper = styled(Box)(() => ({
  display: "flex",
  alignItems: "flex-end",
  flexWrap: "nowrap",
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
}));
