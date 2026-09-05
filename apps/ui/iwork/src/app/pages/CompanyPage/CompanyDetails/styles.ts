import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CardBackground } from "@ui/ui-lib";

// Outer container
export const CompanyDetailsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),

  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
  ".clickable-cell": {
    cursor: "pointer",
  },
  ".lead-crm-label": {
    fontWeight: theme.typography.fontWeights.bold,
    fontSize: theme.typography.fontSizes.xss,
  },
  ".sentiment-label": {
    fontWeight: theme.typography.fontWeights.semiBold,
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  "& .edit-button": {
    minWidth: "72px",
    gap: theme.spacing(1),
  },
  [theme.breakpoints.down("md")]: {
    flexWrap: "wrap",
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
  },
}));

export const OverviewCardBackground = styled(CardBackground)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(5, 4),
  boxShadow: theme.shadows[12],
}));

export const CardGridBackground = styled(CardBackground)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(4, 4),
  boxShadow: theme.shadows[12],
}));

export const TopRightButtonWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  width: "100%",
  marginTop: theme.spacing(5),
}));

export const CompanyDetailsNoDataBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.primary,
  width: "100%",
  height: "calc(100vh - 418px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  "& img": {
    maxWidth: "565px",
  },
}));

export const OpportunityTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.bold,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

export const TitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(5),
  width: "100%",
  [theme.breakpoints.down("md")]: {
    flexWrap: "wrap",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
  },
}));

export const OpportunityContainer = styled(CardBackground)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(4, 4),
  boxShadow: theme.shadows[12],
  ".clickable-cell": {
    cursor: "pointer",
    color: "#1976d2 !important",
    textDecoration: "underline",
  },
}));
