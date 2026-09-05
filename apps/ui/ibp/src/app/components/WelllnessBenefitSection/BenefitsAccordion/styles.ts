import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const Accordions = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(7.5),
  padding: theme.spacing(10, 17, 11.25, 17),
  maxWidth: "1366px",
  width: "100%",
  margin: "0 auto",
}));
export const EnrollBottomSection = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(7, 3.5, 0, 3.5),
  justifyContent: "space-between",
  alignItems: "center",
}));
export const EnrollBottomTextContainer = styled(Box)(({ theme }) => ({
  maxWidth: "508px",
}));
export const BottomText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  letterSpacing: theme.spacing(0),
  lineHeight: theme.spacing(4),
  color: theme.palette.text.LightDark,
}));
export const AccordionMainContainer = styled("div")<{ containerStyles?: any }>(
  ({ theme, containerStyles }) => ({
    padding: theme.spacing(5, 5, 7.5, 5),
    borderRadius: theme.spacing(3),
    boxShadow: `0px 4px 14px 0px ${theme.palette.border.greyVariant}`,
    border: `1px solid ${theme.palette.border.lightGrey}`,
    ...containerStyles,
  })
);
export const EnrollmentButtonContainer = styled(Box)<{
  singleButton?: boolean;
}>(({ theme, singleButton }) => ({
  display: "flex",
  gap: theme.spacing(7.5),
  width: "100%",
  // maxWidth: "423px",
  justifyContent: "flex-end",
}));
export const AccordionContainer = styled("div")<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    display: "flex",
    justifyContent: "space-between",
    cursor: disabled ? "default" : "pointer",
  })
);

export const AccordionContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const AccordionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const AccordionDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const AccordionIconWrapper = styled("div")<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    display: "flex",
    alignItems: "flex-start",
    cursor: disabled ? "default" : "pointer",
  })
);

export const AccordionIcon = styled("img")(({ theme }) => ({
  marginRight: theme.spacing(2),
  marginTop: theme.spacing(0.5),
}));

export const AccordionChildWrapper = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(5),
  borderRadius: theme.shape.borderRadii.semiRounded,
  display: "flex",
  flexDirection: "column",
}));

export const AccordionChildContent = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}));

export const AccordionChildDetails = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
  maxWidth: "73%",
}));

export const AccordionChildTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const AccordionChildDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const AccordionChildEnrolledButton = styled("button")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  background: theme.palette.text.green,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  color: theme.palette.text.secondary,
  borderRadius: "20px",
  padding: theme.spacing(2.5),
}));

export const AccordionChildIcon = styled("img")(({ theme }) => ({}));

export const AccordionShowSummary = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.Deeporange,
  marginLeft: "auto",
  cursor: "pointer",
}));

export const AccordionChildCalendar = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
}));

export const AccordionChildContainer = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4.5),
  flexDirection: "column",
  padding: theme.spacing(10.5, 3.5, 1, 3.5),
}));
