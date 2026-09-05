import { Opacity } from "@mui/icons-material";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export const BenefitsSectionContainer = styled(Box)(({ theme }) => ({
  // padding: theme.spacing(4),
  maxWidth: "1920px",
  margin: "0 auto",
  width: "100%",
  [theme.breakpoints.up("xl")]: {
    maxWidth: "1600px",
    // padding: theme.spacing(4, 6),
  },
}));

export const StyledAccordion = styled(Accordion, {
  shouldForwardProp: (prop) => prop !== "$sectionType",
})<{ $sectionType?: "compulsory-benefits" | "optional-benefits" | string }>(
  ({ theme, $sectionType }) => ({
  borderRadius: "12px !important",
  padding: theme.spacing(7.5, 3, 1, 3),
  border:
    $sectionType === "compulsory-benefits"
      ? "1px solid #EC6C27"
      : $sectionType === "optional-benefits"
        ? "1px solid #E9C945"
        : $sectionType === "flex-benefits"
          ? "1px solid #27A62C"
          : "1px solid #CACBCC",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "none",
  marginBottom: theme.spacing(8),
  transition: "margin 0.3s ease-in-out, border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1), border-width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:before": {
    display: "none",
  },
  "&.Mui-expanded": {
    ...($sectionType === "compulsory-benefits" && {
      borderStyle: "solid",
      borderColor: "#EC6C27",
      borderWidth: "4px 2px 2px 2px",
    }),
    ...($sectionType === "optional-benefits" && {
      borderStyle: "solid",
      borderColor: "#E9C945",
      borderWidth: "4px 2px 2px 2px",
    }),
    ...($sectionType === "flex-benefits" && {
      borderStyle: "solid",
      borderColor: "#27A62C",
      borderWidth: "4px 2px 2px 2px",
    }),
    margin: `0 0 ${theme.spacing(8)} 0`,
    overflow: "visible",
  },
  "& .MuiCollapse-root": {
    transition: "height 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important",
  },
  "& .MuiCollapse-wrapper": {
    transition: "height 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important",
  },
  "& .MuiCollapse-wrapperInner": {
    transition: "height 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important",
  },
  [theme.breakpoints.between("sm", "lg")]: {
    padding: theme.spacing(4, 2, 1, 2),
    marginBottom: theme.spacing(5),
    "&.Mui-expanded": {
      margin: `0 0 ${theme.spacing(5)} 0`,
    },
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3, 1.5, 1, 1.5),
    marginBottom: theme.spacing(3),
    "&.Mui-expanded": {
      margin: `0 0 ${theme.spacing(3)} 0`,
    },
  },
}));

export const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  // padding: theme.spacing(4, 0, 4, 0),
  // padding: theme.spacing(0, 6.75),
  // borderBottom: `1px solid ${theme.palette.neutral.tableBorder}`,
  marginBottom: theme.spacing(6.5),
  borderRadius: "8px",
  "&.Mui-expanded": {
  },
  "& .MuiAccordionSummary-content": {
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(4),
    "&.Mui-expanded": {
      margin: 0,
    },
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    transition: "none",
    transform: "none !important",
  },
}));

export const ShieldIconWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 60,
  height: 60,
  borderRadius: 12,
  "& svg": {
    fontSize: theme.typography.fontSizes.xxl,
    color: theme.palette.secondary.main,
  },
}));

export const AccordionHeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(40),
  [theme.breakpoints.between("sm", "lg")]: {
    gap: theme.spacing(8),
    flexWrap: "wrap",
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(3),
    flexDirection: "column",
  },
}));
export const AccordionHeaderContentBenifitsSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: 28,
  fontWeight: 600,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
  [theme.breakpoints.between("sm", "lg")]: {
    fontSize: 22,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: 18,
  },
}));

export const SectionSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
}));

export const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  paddingBottom: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  borderRadius: "8px",
  border: "1px solid #FFFFFF",
  opacity: 0,
  transform: "translateY(-10px)",
  transition: "opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  ".Mui-expanded &": {
    opacity: 1,
    transform: "translateY(0)",
  },
}));

export const BenefitsGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
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
    fontSize: theme.typography.fontSizes.xxxl,
    color: theme.palette.text.lightGrey,
  },
}));
export const PolicySummaryExpandIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: "50%",
  transition: "all 0.2s ease-in-out",
  "& svg": {
    fontSize: theme.typography.fontSizes.xxxl,
    color: theme.palette.text.lightGrey,
  },
}));

export const PolicyPeriodBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: theme.spacing(1.5, 3),
  // backgroundColor: theme.palette.background.paper,
  // border: "1.5px solid transparent",
  borderRadius: "24px",
  width: "fit-content",
  marginBottom: theme.spacing(4),
  // background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box, linear-gradient(100.91deg, #1F79D4 21.94%, #3EA0F1 71.2%) border-box`,
}));

export const PolicyPeriodText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const PeriodPoliciesContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const QuickAccessSection = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3, 0),
  justifyContent: "space-between",
  overflow: "hidden",
  "@media (min-width: 360px) and (max-width: 700px)": {
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: theme.spacing(2),
  },
}));

export const QuickAccessCard = styled(Box)<{ variant?: string; disabled?: boolean }>(
  ({ theme, variant, disabled }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(3, 2),
    borderRadius: "12px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    border: "2px solid transparent",
    flex: "1 1 0",
    minWidth: "0",
    width: "100%",
    boxShadow: "0px 5px 10px 0px #2626262E",
    opacity: disabled ? 0.5 : 1,
    "@media (min-width: 360px) and (max-width: 700px)": {
      flex: "0 0 calc(33.33% - 6px)",
      maxWidth: "calc(33.33% - 6px)",
      padding: theme.spacing(2, 1),
      gap: theme.spacing(1),
    },
    ...(variant === "hospital" && {
      backgroundColor: "#EFF9EF",
    }),
    ...(variant === "documents" && {
      backgroundColor: "#EEF6FD",
    }),
    ...(variant === "ecard" && {
      backgroundColor: "#EFFBFC",
    }),
    ...(variant === "policy" && {
      backgroundColor: "#FAF4DF;",
    }),
    ...(variant === "chat" && {
      backgroundColor: "#FEF3EC",
    }),
    ...(variant === "life-event" && {
      backgroundColor: "#FAF4FF",
    }),
    ...(!disabled && {
      "&:hover": {
        boxShadow: "0px 5px 10px 0px #2626262E",
        ...(variant === "ecard" && {
          border: "1px solid #60D9E3",
        }),
        ...(variant === "hospital" && {
          border: "1px solid #7AD37D",
        }),
        ...(variant === "policy" && {
          border: "1px solid #E7C642",
        }),
        ...(variant === "documents" && {
          border: "1px solid #308EE4",
        }),
        ...(variant === "chat" && {
          border: "1px solid #E86118",
        }),
        ...(variant === "life-event" && {
          border: "1px solid #A33DEC",
        }),
      },
    }),
  })
);

export const QuickAccessIcon = styled("img")(({ theme }) => ({
  width: "48px",
  height: "48px",
  "@media (min-width: 360px) and (max-width: 700px)": {
    width: "32px",
    height: "32px",
  },
}));

export const QuickAccessTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  textAlign: "center",
  "@media (min-width: 360px) and (max-width: 700px)": {
    fontSize: "11px",
  },
}));

export const ClaimSummaryCard = styled(Box)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(4),
}));

export const ClaimSummaryHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(5),
  "@media (max-width: 768px)": {
    marginBottom: theme.spacing(3),
    gap: theme.spacing(1.5),
  },
}));

export const ClaimSummaryIconWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 60,
  height: 60,
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
}));

export const ClaimSummaryTitle = styled(Typography)(({ theme }) => ({
  fontSize: 28,
  fontWeight: 600,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
  [theme.breakpoints.down("md")]: {
    fontSize: 22,
  },
  "@media (max-width: 768px)": {
    fontSize: 18,
  },
}));

export const ClaimSummaryTableWrapper = styled(Box)(({ theme }) => ({
  "& > div": {
    padding: 0,
    border: "none",
    boxShadow: "none",
  },
  "& [data-testid='pagination-entries-info']": {
    display: "none",
  },
  "& [data-testid='pagination-pages-info']": {
    display: "none",
  },
  "& .MuiPagination-root": {
    display: "none",
  },
  "& .MuiFormControl-root": {
    display: "none",
  },
  "& .PaginationContainer, & .pagination-container": {
    display: "none",
  },
  "& .ag-root-wrapper-body": {
    minHeight: "unset",
  },
  "& .ag-center-cols-clipper": {
    minHeight: "unset",
  },
  "& .ag-center-cols-container": {
    minHeight: "unset",
  },
  "& .ag-body-viewport": {
    minHeight: "unset",
    height: "auto",
  },
  "& .ag-body-vertical-scroll": {
    display: "none",
  },
  "& .ag-overlay-no-rows-center": {
    display: "none",
  },
  "& .ag-root-wrapper": {
    border: "none",
    borderRadius: "4px",
  },
  "& .ag-header": {
    backgroundColor: "#FFFFFF !important",
    minHeight: "65px",
  },

  "& .ag-header-cell-text": {
    fontWeight: 400,
    fontSize: 14,
    color: "#222222",
    opacity:"0.6",
  },
  "& .claim-summary-header-right .ag-header-cell-text": {
    width: "100%",
    display: "block",
  

},  "& .ag-row": {
    background: "linear-gradient(180deg, #F1F1F1 0%, #F9F9F9 100%)",
  },
    "& .ag-header-cell-resize": {
    width: 0,
  },
  "& .ag-cell": {
    fontWeight: 400,
    fontSize: 18,
    color: "#222222",
    borderRight: "1px solid #FFFFFF",
    borderBottom: "1px solid #FFFFFF",
  },
  "& .ag-cell:last-of-type": {
    borderRight: "none",
  },
  "& .ag-row:last-child .ag-cell": {
    borderBottom: "none",
  },
  "& .ag-cell-focus": {
    outline: "none",
    border: "none",
  },
  "& .ag-row-focus .ag-cell": {
    outline: "none",
  },
  "& .ag-row-selected .ag-cell": {
    border: "1px solid #FFFFFF",
  },
  "& .ag-row-hover .ag-cell": {
    background: "linear-gradient(180deg, #F1F1F1 0%, #F9F9F9 100%)",
  },
  "& .claim-number-link": {
    display: "inline-block",
    width: "100%",
    cursor: "pointer",
    color: "#1F79D4",
    textDecoration: "none",
  },
  "& .claim-number-link:hover": {
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
}));

export const TooltipContainer = styled(Box)(({ theme }) => ({
  padding: '12px 16px 12px 0',
  maxWidth: '400px',
}));

export const TooltipHeader = styled(Box)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 600,
  marginBottom: '12px',
  color: '#ffffff',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  paddingBottom: '8px',
}));

export const TooltipPolicyItem = styled(Box)<{ isLast?: boolean }>(({ theme, isLast }) => ({
  marginBottom: isLast ? '0' : '12px',
  padding: '8px 0',
  borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
}));

export const TooltipPolicyName = styled(Box)(({ theme }) => ({
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '4px',
  color: '#ffffff',
}));

export const TooltipPolicyDate = styled(Box)(({ theme }) => ({
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.85)',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}));

export const ContributionWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(10),
  marginTop: theme.spacing(1),
  transition: "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(6),
  },
  "@media (max-width: 768px)": {
    gap: theme.spacing(4),
    flexWrap: "wrap",
  },
}));

export const ContributionText = styled(Typography)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  gap: theme.spacing(3),
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.xs,
    gap: theme.spacing(2),
  },
}));

export const ContributionAmount = styled(Box)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const AccordionTitleRow = styled(Box)(({ theme }) => ({
  // gap: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));
