import { Box, Button, styled } from "@mui/material";
import { CardBackground } from "@ui/ui-lib/index";
import Button from "@ui/ui-lib/commonComponents/Button";

export const StyledClaimValue = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxll,
  fontWeight: "bold",
  color: theme.palette.secondary.selected,
}));

export const StyledClaimHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const StyledClaimsValueBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: theme.spacing(2),
}));

export const StyledClaimValueBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

export const StyledTotalValueTxt = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.grey,
  marginTop: theme.spacing(1),
}));

export const StyledClaimsNoteTxt = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.priorityHigh,
  marginTop: theme.spacing(0.5),
}));

export const StyledDollarTxt = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  color: theme.palette.secondary.selected,
}));

export const StyledClaimsKpis = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
}));

export const StyledKpiCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  width: "100%",
}));

export const StyledKpiValue = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: "bold",
  color: theme.palette.text.primary,
  marginTop: theme.spacing(1),
}));

export const StyledKpiTxt = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.grey,
  marginTop: theme.spacing(0.5),
}));

export const StyledKpiPercentage = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.success.main,
  marginTop: theme.spacing(0.5),
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  marginLeft: "auto",
}));

export const StyledImg = styled("img")(({ theme }) => ({
  opacity: "0.5",
}));

export const StyledCardTitle = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: 700,
  color: theme.palette.text.grey,
}));

// New styled components for loading, error, and no data states
export const StyledLoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "200px",
}));

export const StyledErrorContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "200px",
}));

export const StyledNoDataContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "height",
})<{ height?: string | number }>(({ height = "200px" }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height,
}));

export const StyledClaimValueImage = styled("img")(({ theme }) => ({
  opacity: "0.8",
}));
