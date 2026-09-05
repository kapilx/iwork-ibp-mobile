import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { flex, flexDirection } from "@mui/system";
import { CardBackground, colors } from "@ui/ui-lib";
import { styledDrawer } from "../../TaskMeetingNotesPage/TaskMeetingNotesForm/styles";

// Outer container
export const PolicyDetailsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5, 5, 0, 5),

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
export const TableContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5, 0),

  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
  ".clickable-cell": {
    cursor: "pointer",
    color: "#1976d2",
    textDecoration: "underline",
    "& span": {
      color: "#1976d2",
      cursor: "pointer",
      textDecoration: "underline",
    },
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

export const LoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "500px",
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  gap: theme.spacing(2),
  "& .edit-button": {
    minWidth: "72px",
  },
  [theme.breakpoints.down("md")]: {
    flexWrap: "wrap",
  },
}));
export const ButtonWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  "& .edit-button": {
    minWidth: "72px",
  },
  [theme.breakpoints.down("sm")]: {
    justifyContent: "left",
    gap: theme.spacing(1),
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
  boxShadow: "none",
  border: "none",
}));

export const TopRightButtonWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  width: "100%",
  marginTop: theme.spacing(5),
}));

export const PolicyDetailsNoDataBox = styled(Box)(({ theme }) => ({
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

export const priorityStyleMap = {
  active: {
    backgroundColor: "#FFFFFF",
    color: colors.text.primary,
    dotColor: "#4CBF23",
  },
};

export const StyledFormBox = styled("div")(({ theme }) => ({
  width: "100%",
  paddingTop: theme.spacing(6),
  display: "flex",
  flexDirection: "column",
  gap: "24px",
}));

export const PolicyDetailsSectionTitle = styled("h3")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  margin: theme.spacing(0),
  color: theme.palette.chips.senary,
  //theme.palette.background.deepOrange,
}));

export const ActivatePolicyButtonWrapper = styled("div")(({ theme }) => ({
  position: "relative",
  display: "inline-flex",
  width: "fit-content",
}));
export const UnderReviewStyles = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const ActivationModalContent = styled("div")(({ theme }) => ({
  padding: theme.spacing(2, 0),
}));

export const FinancialInfoTitle = styled(PolicyDetailsSectionTitle)(() => ({
  padding: "16px 16px 4px",
}));

export const FinancialInfoSection = styled("div")<{ last?: boolean }>(({ last }) => ({
  padding: last ? "8px 16px 16px" : "8px 16px",
}));

export const FinancialInfoSubTitle = styled(PolicyDetailsSectionTitle)(() => ({
  marginBottom: 8,
}));

export const FinancialInfoTableHeader = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
}));

export const FinancialInfoSearchWrapper = styled("div")(() => ({
  width: 320,
}));

export const DocumentUploadContainer =styled("div")(()=>({
  display:"flex",
  flexDirection:"column",
  padding:"10px",
}))
