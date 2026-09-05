import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { theme } from "@ui/ui-lib";
import PofileIcon from "../../../assets/svgs/profile-icon.svg";

export const PolicyStepperWrapper = styled("div")({
  // border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.light}`,
  borderRadius: theme.shape.borderRadii.normal,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  backgroundColor: theme.palette.background.purple,
  padding: theme.spacing(5),
  gap: theme.spacing(3),
});

export const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  // padding: theme.spacing(2, 4),
  gap: theme.spacing(2.5),
});
export const PolicyProgressStepperContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(5),
  "& .edit-button": {
    minWidth: "72px",
    gap: theme.spacing(1),
  },
}));

export const StepsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

export const StepItem = styled(Box)<{ active?: boolean; completed?: boolean }>(
  ({ theme, active, completed }) => ({
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    gap: theme.spacing(1),
    fontWeight:
      active || completed
        ? theme.typography.fontWeights.semiBold
        : theme.typography.fontWeights.regular,
    fontSize: theme.typography.fontSizes.sm,
    color: completed
      ? theme.palette.background.completedProgressColor
      : active
      ? theme.palette.chips.senary
      : theme.palette.text.primary,
  })
);

export const StepIcon = styled("img")({
  width: 16,
  height: 16,
});

export const NextIcon = styled("img")({
  width: 24,
  height: 24,
});

export const PolicyName = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.gradients.purple.text,
  letterSpacing: theme.spacing(0),
}));

export const PolicycrmLeadStyleMap: Record<
  string,
  {
    backgroundColor?: string;
    color?: string;
    dotColor?: string;
    imageSrc?: string;
  }
> = {
  default: { backgroundColor: "#FFF9E5", color: "black", imageSrc: PofileIcon },
};

export const PolicyStepperCompanyName = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const CompanyNameTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.lightGrey,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const CompanyNameLabelStyles = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.sm,
}));

export const ContainerForStepper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
}));

export const PolicyPrimarySection = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(6),
  alignItems: "center",
  // marginBottom: theme.spacing(4),
}));
