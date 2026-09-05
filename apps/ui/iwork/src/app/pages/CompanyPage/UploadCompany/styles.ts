import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Link,
  styled,
  Typography,
} from "@mui/material";
import { CardBackground, Button } from "@ui/ui-lib";

export const UploadContainer = styled(Box)(({ theme }) => ({
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
}));

export const StyledCardBackground = styled(CardBackground)(({ theme }) => ({
  width: "100%",
  maxWidth: "1072px",
  padding: theme.spacing(5),
}));

export const AccordionImage = styled("img")(({ theme }) => ({
  marginRight: theme.spacing(2.5),
  width: "20px",
  height: "20px",
}));

export const AccordionHeaderContainer = styled("div")({
  display: "flex",
  alignItems: "center",
  width: "100%",
});

export const SelectedValue = styled("span")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.sm,
  fontFamily: theme.typography.fontFamily,
}));

export const StyledLinkButton = styled(Link)(({ theme }) => ({
  color: theme.palette.button.secondary,
  marginLeft: theme.spacing(1),
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.sm,
  textDecoration: "none",
}));

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
  border: "none",
  borderBottom: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  boxShadow: "none !important",
  backgroundColor: `${theme.palette.background.paper} !important`,
  width: "100%",
  paperShadow: "none !important",

  "&.Mui-expanded": {
    margin: `${theme.spacing(2)} 0`,
    boxShadow: "none !important",
  },

  "&.Mui-disabled": {
    color: "#AAAAAA !important",
  },

  "&:before": {
    display: "none",
  },

  "&:last-child": {
    borderBottom: "none",
    marginBottom: 0,
  },
}));

// Styled Accordion Summary
export const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  fontWeight: theme.typography.fontWeights.medium,
  cursor: "pointer",

  "&.Mui-expanded": {
    minHeight: "unset",
    margin: 0,
    padding: 0,
    marginBottom: theme.spacing(4),
  },

  "& .MuiAccordionSummary-content": {
    margin: 0,
    alignItems: "center",
    display: "flex",
    "&.Mui-expanded": {
      margin: 0,
    },
  },
  "&.MuiAccordionSummary-root": {
    padding: " 0 !important",
  },
}));

// Styled Accordion Details
export const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: 0,
  paddingBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  maxHeight: "270px",
  overflowY: "scroll",
}));

export const AccordionContainer = styled(Box)(({ theme }) => ({
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.accordionBorder}`,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

export const ProceedButton = styled(Button)(({ theme }) => ({
  minWidth: "92px",
  height: "32px",
  borderRadius: theme.shape.borderRadii.medium,
}));

export const UploadCompanyButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(4),
  gap: theme.spacing(6),
  alignItems: "center",
}));

export const AccordionTitle = styled(Typography)(({ theme }) => ({
  marginRight: theme.spacing(1),
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.sm,
}));
