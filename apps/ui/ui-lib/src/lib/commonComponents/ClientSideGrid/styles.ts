import { Box, styled } from "@mui/material";

export const ClientSideGridContainer = styled("div")(({ theme }) => ({
  width: "100%",
  "& .ag-header": {
    borderRadius: `${theme.shape.borderRadii.semiRounded} ${theme.shape.borderRadii.semiRounded} 0 0`,
  },
  "& .ag-theme-alpine": {
    border: "none !important",
    "--ag-row-hover-color": "transparent",
    fontFamily: theme.typography.fontFamily, // Override ag-grid fontFamily
  },
  ".ag-root-wrapper": {
    border: "none !important",
  },
  "& .ag-row-even, & .ag-row-odd": {
    backgroundColor: "white !important",
  },
  "& .ag-row": {
    transition: "background-color 0.3s ease, border-bottom 0.2s ease",
  },
  "& .ag-header-cell-text": {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semiBold,
    color: theme.palette.neutral.dark,
    fontFamily: theme.typography.fontFamily,
  },
  "& .ag-cell": {
    fontFamily: theme.typography.fontFamily, // Override ag-grid fontFamily
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
