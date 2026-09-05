import { Box, styled, Typography } from "@mui/material";

export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

export const CompanyListingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(7.5, 5),

  ".clickable-cell": {
    cursor: "pointer",
  },
  ".titleContainer": {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  ".searchContainer": {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  ".right-aligned-cell": {
    textAlign: "right",
  },
}));

export const StyledCellPremium = styled("span")(({ theme }) => ({
  flex: "0 0 auto",
  width: "6ch", // space for "(#999)" → 2 brackets + # + 3 digits
  marginLeft: theme.spacing(1.5),
  textAlign: "right",
  whiteSpace: "nowrap",

  // make digits line up perfectly
  fontVariantNumeric: "tabular-nums",
  MozFontFeatureSettings: '"tnum"',
  WebkitFontFeatureSettings: '"tnum"',
  fontFeatureSettings: '"tnum"',
}));

export const CellContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  maxWidth: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
}));

export const PremiumSpan = styled("span")(({ theme }) => ({
  minWidth: 0, // critical for ellipsis in flex
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const CardBackground = styled("div")<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(4.25, 4),
  boxShadow: theme.shadows[12],
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  marginTop: theme.spacing(4),
  ...customStyles,
}));

export const PolicyTableContainer = styled("span")(({ theme }) => ({
  width: "100%",
}));
export const Note = styled("div")(({ theme }) => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  marginTop: theme.spacing(2),
  gap: theme.spacing(2),
}));
export const TableContainer = styled(Box)(({ theme }) => ({
  ".ag-theme-alpine .tat-two-line .ag-header-cell-text, .ag-theme-quartz  .tat-two-line .ag-header-cell-text":
    {
      whiteSpace: "pre-line",
      lineHeight: 1.2,
    },
}));
export const LoaderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "400px",
}));
