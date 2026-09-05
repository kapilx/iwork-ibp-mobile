import { Button } from "@ui/ui-lib";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export const FAQContainer = styled(Box)(({ theme }) => ({
  // padding: theme.spacing(2),
  maxWidth: "1920px",
  margin: "0 auto",
  width: "100%",
  [theme.breakpoints.up("xl")]: {
    maxWidth: "1600px",
    padding: theme.spacing(4, 6),
  },
  [theme.breakpoints.down("md")]: {
    // padding: theme.spacing(2),
  },
}));

export const FAQHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  padding: theme.spacing(0, 1, 0, 1.5), 
}));

export const FAQHeaderLeftSideContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3.75),
  marginBottom: theme.spacing(4),
}));

export const FAQIconWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 48,
  height: 48,
  borderRadius: theme.spacing(1.5),
  // backgroundColor: theme.palette.background.lightBlue,
  "& svg": {
    fontSize: theme.typography.fontSizes.xxl,
    color: theme.palette.button.secondary,
  },
}));

export const FAQHeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
}));

export const FAQTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
  [theme.breakpoints.between("sm", "lg")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
}));

export const FAQSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
  // textAlign: "center",
}));

export const StyledFAQAccordion = styled(Accordion)(({ theme }) => ({
  padding: theme.spacing(0, 0),
  borderBottom: `1px solid ${theme.palette.border.accordianListBorder}`,
  backgroundColor: theme.palette.background.paper,
  // boxShadow: "none",
  transition: "all 0.3s ease-in-out",
  overflow: "hidden",
  boxShadow: "0px 5px 10px 0px #2626261A",
  "&:before": {
    display: "none",
  },
  "&.first-accordion": {
    borderTopLeftRadius: "12px !important",
    borderTopRightRadius: "12px !important",
  },
  "&.last-accordion": {
    borderBottom: "none",
    borderBottomLeftRadius: "12px !important",
    borderBottomRightRadius: "12px !important",
  },
  "&.Mui-expanded": {
    margin: 0,
    // boxShadow: "0px 4px 16px rgba(59, 130, 246, 0.15)",
    // marginTop: theme.spacing(6),
    // marginBottom: theme.spacing(6),
  },
}));

export const StyledFAQAccordionSummary = styled(AccordionSummary)(
  ({ theme }) => ({
    backgroundColor: theme.palette.common.white,
    padding: theme.spacing(6.5, 8),
    minHeight: 64,
    borderRadius: "12px !important",
    "&.Mui-expanded": {
    padding: theme.spacing(6.5, 8),
    paddingBottom: theme.spacing(0),
      minHeight: 64,
      // borderBottom: `1px solid ${theme.palette.neutral.tableBorder}`,
      marginBottom: theme.spacing(5),
    },
    "& .MuiAccordionSummary-content": {
      margin: 0,
      display: "flex",
      flexDirection: "column",
      "&.Mui-expanded": {
        margin: 0,
      },
    },
    "& .MuiAccordionSummary-expandIconWrapper": {
      transition: "none",
      transform: "none !important",
    },
  }),
);

export const QuestionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
}));
export const QuestionSubTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
  marginTop: theme.spacing(1),
}));

export const StyledFAQAccordionDetails = styled(AccordionDetails)(
  ({ theme }) => ({
    padding: theme.spacing(6.5, 8),
    paddingTop: 0,
  }),
);

export const AnswerText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.mediumGrey,
  fontFamily: theme.typography.fontFamily,
  lineHeight: 1.6,
  
  // HTML content styling
  "& p": {
    margin: theme.spacing(1, 0),
    lineHeight: 1.6,
  },
  "& ul, & ol": {
    marginLeft: theme.spacing(3),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
  },
  "& li": {
    marginBottom: theme.spacing(0.5),
    lineHeight: 1.6,
  },
  "& strong, & b": {
    fontWeight: theme.typography.fontWeights.semiBold,
    color: theme.palette.text.primary,
  },
  "& em, & i": {
    fontStyle: "italic",
  },
  "& u": {
    textDecoration: "underline",
  },
  "& a": {
    color: theme.palette.button.secondary || "#1976d2",
    textDecoration: "underline",
    "&:hover": {
      textDecoration: "none",
      color: theme.palette.primary.dark,
    },
  },
  
  // Create scrollable wrapper for tables
  "& table": {
    display: "block",
    width: "100%",
    overflowX: "auto",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    border: `1px solid ${theme.palette.divider || "#e0e0e0"}`,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    backgroundColor: theme.palette.background.paper,
    
    // Custom scrollbar styling
    "&::-webkit-scrollbar": {
      height: "10px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.palette.action.hover || "#f5f5f5",
      borderBottomLeftRadius: theme.spacing(1.5),
      borderBottomRightRadius: theme.spacing(1.5),
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.action.selected || "#c0c0c0",
    },
  },
  
  // Table inner structure
  "& tbody, & thead": {
    display: "table",
    width: "100%",
    tableLayout: "auto",
  },
  // Table inner structure
  "& tbody, & thead": {
    display: "table",
    width: "100%",
    tableLayout: "auto",
  },
  
  "& td": {
    padding: theme.spacing(2.5, 3),
    fontSize: theme.typography.fontSizes.sm,
    color: `${theme.palette.text.primary} !important`,
    borderBottom: `1px solid ${theme.palette.divider || "#e0e0e0"}`,
    borderRight: `1px solid ${theme.palette.divider || "#e0e0e0"}`,
    verticalAlign: "top",
    minWidth: "120px",
    "&:last-child": {
      borderRight: "none",
    },
  },
}));

export const ExpandIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: "50%",
  transition: "all 0.2s ease-in-out",
  "& svg": {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.palette.text.lightGrey,
  },
}));
export const ButtonContainer = styled(Button)(({ theme }) => ({
  gap: theme.spacing(2.25),
  color: "#215DAA",
  "& svg": {
    width:"20px",
    height:"20px",
  },
}));
