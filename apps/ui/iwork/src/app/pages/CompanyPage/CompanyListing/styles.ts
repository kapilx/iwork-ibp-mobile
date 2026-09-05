import { Box, styled, Typography } from "@mui/material";
import { text } from "stream/consumers";

export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

export const CompanyListingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(7.5, 5),
  gap: theme.spacing(2.5),
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
