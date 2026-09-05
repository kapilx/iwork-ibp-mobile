import { styled, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";

export const AccordionWrapper = styled(Accordion)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.neutral.light}`,
  overflow: "hidden",
  transition: "all 0.3s ease-in-out",
  boxShadow: "none",
  "&:before": {
    display: "none",
  },
  ".MuiAccordionSummary-root.Mui-expanded":{
    background : theme.palette.text.secondary,
      borderBottom: `1px solid ${theme.palette.neutral.light}`,

  },
  ".MuiAccordionSummary-root ":{
    background : theme.palette.text.secondary,
  }
}));

export const AccordionSummaryStyled = styled(AccordionSummary)(({ theme }) => ({
  "& .MuiAccordionSummary-content": {
    margin: 0,
  },
  "& .MuiAccordionSummary-content.Mui-expanded": {
    margin: 0,
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    transition: "transform 0.3s ease-in-out",
  },
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(180deg)",
  },
}));

export const AccordionDetailsStyled = styled(AccordionDetails)(({ theme }) => ({
  padding: 0,
  
  transition: "all 0.3s ease-in-out",
}));

export const QuestionTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
}));

export const AnswerTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.labelColor,
}));
