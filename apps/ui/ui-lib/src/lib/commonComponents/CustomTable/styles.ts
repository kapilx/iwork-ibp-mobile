import { Box, FormControl, Select, styled } from "@mui/material";

export const CustomTableWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  fontFamily: theme.typography.fontFamily,
}));

export const CustomTableGridContainer = styled("div")(({ theme }) => ({
  width: "100%",
  "& .ag-header": {
    borderRadius: `${theme.shape.borderRadii.semiRounded} ${theme.shape.borderRadii.semiRounded} 0 0`,
  },
  "& .ag-theme-alpine": {
    fontFamily: theme.typography.fontFamily, // Override ag-grid fontFamily
  },
  "& .ag-header-cell-text": {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.neutral.dark,
  },
  "& .ag-cell": {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.text.primary,
    padding: `${theme.spacing(2.5, 3)}`,
    paddingRight: `${theme.spacing(5.7)} `,
    paddingLeft: `${theme.spacing(4.6)} `,
  },
  "& .right-aligned-cell": {
    textAlign: "right",
  },
  "& .ag-header-cell.right-aligned-header": {
    justifyContent: "flex-end",
  },

  "& .ag-header-cell.right-aligned-header .ag-header-cell-label": {
    justifyContent: "flex-end",
    display: "flex",
    width: "100%",
  },
}));

export const CustomTableStyledSelect = styled(Select)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  border: "none",
  boxShadow: "none",
  ".MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  padding: "0px",
  "& .MuiSelect-icon": {
    right: 0,
  },
  "& .MuiInputBase-input": {
    padding: 0,
    paddingLeft: theme.spacing(1),
    paddingRight: `${theme.spacing(6)} !important`,
  },
}));

export const CustomTabsStyledFormControl = styled(FormControl)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
}));

export const CustomTableStyledBox = styled(Box)(({ theme }) => ({
  fontWeight: 300,
  fontSize: theme.typography.fontSizes.sm,
}));
