import { Box, styled, Typography } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const QuoteComparisonPageMainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  padding: theme.spacing(3),
}));

export const PageHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(5),
}));

export const TitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  lineHeight: "100%",
}));

export const HeaderTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
}));

export const CommonButton = styled(Button)(({ theme }) => ({
  gap: theme.spacing(1),
}));

export const ButtonTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: theme.spacing(4),
}));

export const CommonTableContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(5),
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(4),
  border: `1px solid ${theme.palette.neutral.tableBorder}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[7],
  overflow: "visible",
  "& .ag-row.qcr-section-row .ag-cell": {
    backgroundColor: `${theme.palette.background.tableHeaderHover} !important`,
    color: `${theme.palette.text.primary} !important`,
    fontWeight: "700 !important",
    borderRight: "none !important",
    borderBottom: `1px solid ${theme.palette.neutral.tableBorder} !important`,
    lineHeight: "30px !important",
  },
  "& .ag-row.qcr-section-spacer-row .ag-cell": {
    backgroundColor: `${theme.palette.background.tableHeaderHover} !important`,
    borderBottom: `1px solid ${theme.palette.neutral.tableBorder} !important`,
    borderRight: "none !important",
  },
  "& .ag-row.qcr-section-row .ag-cell.qcr-section-cell": {
    fontSize: theme.typography.fontSizes.md,
    color: `${theme.palette.text.primary} !important`,
    whiteSpace: "normal !important",
  },
}));

export const CoverDetailsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
}));

export const WaiverDetailsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
}));

export const CommonQuoteComparisonTypography = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semiBold,
    lineHeight: theme.spacing(5),
    marginBottom: theme.spacing(2.5),
  })
);

// Styled components for cost rendering
export const MainCostContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  height: "100%",
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  lineHeight: 1.2,
  gap: theme.spacing(0),
}));

export const MainCostText = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: theme.typography.fontSizes.sm,
  transform: "translateY(-5px)",
}));

export const SubCostContainer = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xss,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  color: theme.palette.text.labelColor,
}));

export const SubCostText = styled("div")(({ theme }) => ({
  lineHeight: "14px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

// HighlightDiffSpan styled component for diff highlighting
export const HighlightDiffSpan = styled("span", {
  shouldForwardProp: (prop) => prop !== "isDifferent",
})<{
  isDifferent?: boolean;
}>(({ isDifferent, theme }) => ({
  color: isDifferent ? "#FF7104" : theme.palette.text.primary,
  backgroundColor: "transparent",
  // padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
}));

export const HighlightedMainCostText = styled(MainCostText)(({ theme }) => ({
  color: "#FF7104",
  backgroundColor: "transparent",
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  transform: "translateY(-5px)",
}));

export const LoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  minHeight: "300px",
  backgroundColor: theme.palette.background.paper,
}));
