import { Box, styled, Typography } from "@mui/material";
import { LOST, WON } from "../../../constants";
import Button from "@ui/ui-lib/commonComponents/Button";
export const OpportunityProgressHeaderContainer = styled("div")(
  ({ theme }) => ({
    display: "flex",
    padding: theme.spacing(4),
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(3),
    [theme.breakpoints.down("lg")]: {
      padding: theme.spacing(3),
      gap: theme.spacing(2.5),
    },
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
      padding: theme.spacing(2.5),
      gap: theme.spacing(2),
    },
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(2),
      gap: theme.spacing(1.5),
    },
  })
);

export const CompanySection = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
}));

export const BrokerageSection = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  paddingLeft: theme.spacing(3),
  justifyContent: "center",
  gap: theme.spacing(3),
  borderLeft: `1px solid ${theme.palette.neutral.lightMedium}`,
  [theme.breakpoints.down("md")]: {
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(2),
    borderLeft: "none",
    borderTop: `1px solid ${theme.palette.neutral.lightMedium}`,
    paddingTop: theme.spacing(2),
    width: "100%",
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    paddingLeft: 0,
  },
}));

export const CompanyPrimarySection = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(6),
  alignItems: "center",
  marginBottom: theme.spacing(4),
  flexWrap: "wrap",
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(4),
    marginBottom: theme.spacing(3),
  },
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

export const CompanySecondarySection = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  alignItems: "center",
  flexWrap: "wrap",
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(3),
  },
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
  },
}));

export const OpportunityStepperCompanyName = styled(Typography)(
  ({ theme }) => ({
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizes.xll,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.palette.gradients.purple.text,
    letterSpacing: theme.spacing(0),
    [theme.breakpoints.down("lg")]: {
      fontSize: theme.typography.fontSizes.xl,
    },
    [theme.breakpoints.down("md")]: {
      fontSize: theme.typography.fontSizes.lg,
    },
    [theme.breakpoints.down("sm")]: {
      fontSize: theme.typography.fontSizes.xss,
    },
  })
);

export const PolicyType = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const PriorityTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  letterSpacing: theme.spacing(0),
}));

export const BrokerageSectionBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(2.25),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

export const SpanTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.lightGrey,
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.md,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const CompanyTypeTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.xs,
}));
export const ChipContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  flexWrap: "wrap",
  [theme.breakpoints.down("lg")]: {
    gap: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
  },
}));
export const PolicyTypeTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.lightGrey,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const BrokerageTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.md,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
  },
}));
export const PolicytypeLabelStyles = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.sm,
}));
export const LabelStyles = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.labelColor,
}));
export const ValueStyles = styled("b")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xs,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginLeft: theme.spacing(0.5),
}));

export const OpportunityStatusContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginTop: theme.spacing(1),
}));

export const OpportunityStatusTypography = styled(Typography)<{
  status: string;
}>(({ theme, status }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color:
    status === LOST
      ? theme.palette.error.main
      : status === WON
      ? theme.palette.secondary.main
      : theme.palette.chips.senary,
}));

export const OpportunityStatusAndBrokerageContainer = styled(Box)(
  ({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(3),
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
      alignItems: "flex-start",
      width: "100%",
      gap: theme.spacing(2),
    },
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(1.5),
    },
  })
);

export const EditIcon = styled("img")(({ theme }) => ({
  width: "15px",
  height: "15px",
  cursor: "pointer",
}));

export const ExpiryDateContainer = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const ReOpenButton = styled(Button)(({ theme }) => ({
  "&.reopen-button": {
    height: "unset",
    marginBottom: "-18px",
  },
}));
