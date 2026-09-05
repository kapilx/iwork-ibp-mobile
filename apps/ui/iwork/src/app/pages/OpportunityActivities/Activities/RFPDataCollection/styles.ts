// InsuranceDetails.styles.ts
import { Box, Divider, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

// Outer container
export const InsuranceContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.8,
}));

// Row for each field
export const DetailRow = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.main,
  fontSize: theme.typography.fontSizes.sm,
}));

// Label text
export const Label = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

// Value text
export const RFPDataCollectionValue = styled("span")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const WaiverCoverDetails = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(4),
}));

export const AssetsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(7),
}));

export const RFPDataCollectionMainContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const CoverDetailsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const CommonTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  lineHeight: theme.spacing(5),
  marginBottom: theme.spacing(2),
}));

export const BasicCoverTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xss,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  lineHeight: theme.spacing(5),
  marginBottom: theme.spacing(5),
}));

export const WaiversTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  lineHeight: theme.spacing(5),
  marginBottom: theme.spacing(3),
}));

export const RfpDivider = styled(Divider)(({ theme }) => ({
  paddingTop: theme.spacing(1.2),
  paddingBottom: theme.spacing(1.2),
}));

export const ButtonWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  justifyContent: "flex-end",
  marginTop: theme.spacing(3),
}));

export const CoverDetailsSpacing = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));
