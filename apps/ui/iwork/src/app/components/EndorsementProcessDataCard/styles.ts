import { Box, styled, Typography } from "@mui/material";

export const MainContainer = styled(Box)<{
  styling: React.ComponentProps<any>["style"];
}>(({ theme, styling }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  width: styling?.width || "100%",
  padding: theme.spacing(5),
  borderRadius: theme.spacing(3),
  borderLeft: `4px solid ${styling.borderColor}`,
  boxShadow: theme.shadows[7],
  maxWidth: "860px",
  height: styling?.height || "fit-content",
  ...styling,
}));

export const TitleTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  width: "100%",
}));
