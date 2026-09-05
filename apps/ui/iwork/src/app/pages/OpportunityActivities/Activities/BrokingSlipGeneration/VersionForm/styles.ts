import { Box, styled, Typography } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const VersionFormMainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const SlipGenerationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const SlipGenerationTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.primary,
  lineHeight: theme.spacing(5),
}));

export const VersionFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const MainCoverDetailsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(5),
  gap: theme.spacing(2),
  boxShadow: theme.shadows[7],
  marginBottom: theme.spacing(5),
  backgroundColor: theme.palette.background.paper,
  width: "100%",
  maxWidth: "1254px",
  alignSelf: "stretch",
  flexGrow: 0,
  marginTop: theme.spacing(2),
}));

export const CommonDynamicFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const CoverDetailsAndWaiverContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: theme.spacing(6),
}));

export const VersionFormButton = styled(Button)(({ theme }) => ({
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "center",
  margin: theme.spacing(2, 0),
  maxWidth: "180px",
}));

export const SlipGenerationHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(5),
}));

export const ChipTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xss,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: theme.spacing(5),
  marginBottom: theme.spacing(0.7),
}));

export const IconsContainerWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginBottom: theme.spacing(5),
  marginTop: theme.spacing(2),
}));

export const IconsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const IconAndTextButtonWrapper = styled("button")(({ theme }) => ({
  backgroundColor: theme.palette.neutral.veryLight,
  border: "none",
  color: theme.palette.gradients.primaryButton.start,
  display: "flex",
  cursor: "pointer",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadii.small,
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.6,
    color: theme.palette.text.disabled,
    pointerEvents: "none",
  },
}));
