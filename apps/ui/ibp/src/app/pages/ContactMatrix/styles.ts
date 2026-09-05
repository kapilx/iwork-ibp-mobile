import { Box, styled, Typography } from "@mui/material";
import CommonAccordion from "../../common/CommonAccordion";
import { theme } from "node_modules/@insurance-wellness-hub/ui-lib/src/lib/styles/Theme";

type SectionHeaderProps = {
  bgColor?: string;
  textColor?: string;
};

export const ContactMatrixContainer = styled("div")(({ theme }) => ({  minHeight: "100vh",
  width: "100%",
  maxWidth: 1366,
  margin: "0 auto",
  marginTop: 55,
}));
export const CustomerCareAccordain = styled(CommonAccordion)(({ theme }) => ({
  borderColor: theme.palette.border.main,
  "&.Mui-expanded": {
    backgroundColor: theme.palette.background.paper,
  },
}));

export const PageHeader = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(4),
  padding: theme.spacing(3, 0, 6, 0),
}));

export const SupportTimingRow = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: "16px",
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const CustomerCareIcon = styled("div")(({ theme }) => ({
  width: theme.spacing(3),
  height: theme.spacing(3),
  borderRadius: theme.shape.borderRadii.circle,
  backgroundColor: theme.palette.gradients.primaryButton.start,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.text.secondary,
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.bold,
}));

export const PageTitle = styled("h1")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  margin: 0,
}));

export const CloseButton = styled("button")(({ theme }) => ({
  marginLeft: "auto",
  background: "none",
  border: "none",
  fontSize: theme.typography.fontSizes.xl,
  color: theme.palette.text.mediumGrey,
  cursor: "pointer",
  padding: theme.spacing(0.5),
  "&:hover": {
    color: theme.palette.text.tertiary,
  },
}));

export const PolicyInfo = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.covers,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadii.medium,
  marginBottom: theme.spacing(3),
}));

export const PolicyTitle = styled("h2")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  margin: 0,
}));

export const PolicyNumber = styled("p")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.tertiary,
  margin: 0,
}));

export const AccordionContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

export const ContactAccordionWrapper = styled("div")(({ theme }) => ({
}));

export const EmptyState = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

export const AccordionQuestion = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(4.5, 0, 7.5, 0),
}));

export const AccordionAnswer = styled("div")(({ theme }) => ({

}));

export const PolicyIcon = styled("img")(({ theme }) => ({
  width: 40,
  height: 40,
  marginRight: theme.spacing(6),
}));

export const ContactSection = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(4),
}));

export const ContactCard = styled("div")(({ theme }) => ({
  flex: "0 0 45%",
  minWidth: 0,
}));

export const ContactTitle = styled("h3")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  margin: 0,
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

export const ContactDivider = styled("div")(({ theme }) => ({
  borderBottom: `2px solid ${theme.palette.background.DarkBlue}`,
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

export const ContactField = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
}));

export const ContactLabel = styled("label")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.tertiary,
  fontWeight: theme.typography.fontWeights.regular,
  display: "block",
  marginBottom: theme.spacing(0.5),
  opacity: 0.6,
}));

export const ContactValue = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  color: theme.palette.text.tertiary,
  fontWeight: theme.typography.fontWeights.regular,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  cursor: "default",
}));

export const SectionBlock = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(10),
}));

export const SectionHeader = styled("div")<SectionHeaderProps>(
  ({ theme, bgColor, textColor }) => ({
    backgroundColor: bgColor ?? "transparent",
    color: textColor ?? theme.palette.text.tertiary,
    fontWeight: theme.typography.fontWeights.semiBold,
    fontSize: theme.typography.fontSizes.sm,
    letterSpacing: "0.5px",
    borderRadius: theme.shape.borderRadii.small,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  })
);
export const SectionHeaderTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.xll,
  color: theme.palette.text.tertiary,
  borderBottom: `2px solid ${theme.palette.background.DarkBlue}`,
  width: "100%",
  paddingBottom: theme.spacing(2.5),
  marginBottom: theme.spacing(4),
}));

export const TpaLogo = styled("img")(({ theme }) => ({
  maxWidth: "100px",
  maxHeight: "50px",
  marginLeft: "10px",
  objectFit: "contain",
}));
