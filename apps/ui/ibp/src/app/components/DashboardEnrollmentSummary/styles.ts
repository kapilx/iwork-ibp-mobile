// @ts-nocheck
import { Box, Typography, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";

export const EnrollmentSummaryContainer: any = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasContent",
})<{ hasContent?: boolean }>(({ theme, hasContent }) => ({
  width: "100%",
  borderRadius: theme.spacing(2.5),
  border: "1px solid rgba(39, 114, 199, 0.16)",
  backgroundColor: theme.palette.background.paper,
  height: "calc(100vh - 194px)",
  minHeight: "calc(100vh - 194px)",
  maxHeight: "calc(100vh - 194px)",
  boxShadow: "0px 0px 24px 0px #00000033",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  [theme.breakpoints.down("lg")]: {
    width: "100%",
    height: "auto",
    minHeight: "unset",
    maxHeight: "none",
  },
}));

export const HeaderWrapper: any = styled(Box)(({ theme }) => ({
  background: "linear-gradient(180deg, #F7FBFF 0%, #E7F1FB 100%)",
  padding: theme.spacing(2, 2.5),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "sticky",
  top:0,
  zIndex: 2,
  borderBottom: "1px solid rgba(39, 114, 199, 0.12)",
}));

export const SummaryTitle: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
  margin: 0,
}));

export const AccordionsWrapper: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2.5),
  flex: 1,
  /* Force Visibility for the Scrollbar */
  '&::-webkit-scrollbar': {
    width: "10px",           
    display: "block !important", 
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: "#5c748f", 
    borderRadius: "10px",
    margin: "5px 0",         
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: "#2772C7", 
    borderRadius: "10px",
    border: "2px solid #E1EFFF", 
    '&:hover': {
      backgroundColor: "#1E5AAA", 
    },
  },
  
  "& .MuiAccordion-root": {
    backgroundColor: "transparent",
    boxShadow: "none",
    margin: "0 !important",
    borderBottom: "2px solid transparent",
    borderImage: "repeating-linear-gradient(to right, rgba(200,200,200,0.5) 0 2px, transparent 2px 4px) 1",    "&:before": { display: "none" },
  },
  "& .MuiAccordionSummary-root": {
    padding: theme.spacing(0, 0),
    minHeight: "18px",
    "&.Mui-expanded": {
      minHeight: "18px",
    },
  },
  "& .MuiAccordionSummary-content.Mui-expanded": {
    margin: 0,
    minHeight: "18px",
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    alignSelf: "flex-start",
    marginTop: theme.spacing(2),
    "& .Mui-expanded": {
      // marginTop: theme.spacing(2.5),
    },
  },
  "& .MuiSvgIcon-root": {
    fontWeight: "lighter",
    strokeWidth: 0.5,
  },
  "& .MuiAccordionDetails-root": {
    padding: theme.spacing(0, 0, 2, 0),
  },
}));

export const StyledAccordianWrapperContainer = styled(Box)(({ theme })=>({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
}));

export const EmptyStateWrapper: any = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3.5, 2.5),
  textAlign: "center",
  backgroundColor: theme.palette.background.paper,
}));

export const EmptyStateIllustration: any = styled("img")(({ theme }) => ({
  width: "100%",
  maxWidth: "230px",
  height: "auto",
  display: "block",
  marginBottom: theme.spacing(2),
}));

export const EmptyStateText: any = styled(Typography)(({ theme }) => ({
  maxWidth: "240px",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  lineHeight: 1.35,
  textAlign: "center",
}));

export const AccordionHeaderWrapper: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
  width: "100%",
}));

export const AccordianTotalPremiumText: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
  opacity: 0.6,
}));

export const AccordianAmountContainer: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "102%",
}));

export const AccordionTitle: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
}));

export const AccordionAmount: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
}));

export const AccordionContentWrapper: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const AccordionItemRow: any = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(0.5, 0),
}));

export const AccordionItemLabel: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  fontFamily: theme.typography.fontFamily,
}));

export const AccordionItemValue: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.mediumGrey,
  fontFamily: theme.typography.fontFamily,
}));

export const SummarySectionWrapper: any = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 3, 0, 3),
  // borderTop: "2px dashed #bdbfe7",
}));

export const SummaryRowWrapper: any = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(1, 0),
}));

export const SummaryLabel: any = styled(Typography)<{ bold?: boolean }>(
  ({ theme, bold }) => ({
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: bold
      ? theme.typography.fontWeights.semiBold
      : theme.typography.fontWeights.regular,
    color: bold ? theme.palette.text.tertiary : theme.palette.text.mediumGrey,
    fontFamily: theme.typography.fontFamily,
  }),
);

export const SummaryValue: any = styled(Typography)<{
  bold?: boolean;
  color?: boolean;
}>(({ theme, bold, color }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: bold
    ? theme.typography.fontWeights.semiBold
    : theme.typography.fontWeights.regular,
  color: color
    ? theme.palette.text.tertiary
    : theme.palette.text.mediumGrey,
  fontFamily: theme.typography.fontFamily,
}));

export const StyledDivider: any = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(1.5, 0),
  borderColor: "#00000080",
  borderStyle: "dashed",
}));

export const TotalCoverageLabel: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
}));

export const TotalCoverageValue: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
}));

export const AccordionItemValueOrange: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.deepOrangeColor,
  opacity: 0.6,
  fontFamily: theme.typography.fontFamily,
}));

export const AccordionItemRowWithBorder: any = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(0.5, 0),
  marginTop: theme.spacing(1),
  paddingTop: theme.spacing(1),
  borderTop: "1px solid rgba(0, 0, 0, 0.33)",
}));

export const AccordionItemLabelBold: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  fontFamily: theme.typography.fontFamily,
}));

export const AccordionItemValueBold: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.deepOrangeColor,
  fontFamily: theme.typography.fontFamily,
}));

export const PolicySummaryContainer: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(3),
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
}));

export const PolicySummaryItem: any = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  alignItems: "flex-start",
}));

export const PolicySummaryLabel: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  fontFamily: theme.typography.fontFamily,
}));

export const PolicySummaryValue: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
}));

export const PaymentScheduleWrapper: any = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.25, 3, 2, 3),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(1.5),
}));

export const PaymentScheduleText: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.mediumGrey,
  lineHeight: "20px",
  flex: 1,
}));

export const MonthlyAmountBox: any = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.primary.main,
  whiteSpace: "nowrap",
  width: "115px",
  height: "60px",
  borderRadius: theme.spacing(0.5),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  flexShrink: 0,
}));

export const YourTotalPay: any = styled(Box)(({ theme }) => ({
  borderTop: "1px solid #c8c8c8",
  borderBottom: "1px solid #c8c8c8",
  margin: theme.spacing(0, 3, 0, 3),
  position: "sticky",
  bottom: 0,
  backgroundColor: theme.palette.background.paper,
  zIndex: 1,
}));
