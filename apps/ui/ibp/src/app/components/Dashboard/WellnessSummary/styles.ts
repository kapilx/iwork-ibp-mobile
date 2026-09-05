import { Box, styled } from "@mui/material";

export const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(0, 18.75, 10),
  width: "100%",
  maxWidth: "1366px",
  margin: "0 auto",
}));

export const StyledHeading = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: 600,
  marginBottom: theme.spacing(4),
  color: theme.palette.text.LightDark,
}));

export const StyledSummaryCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(9, 8, 10, 8),
  border: `1px solid ${theme.palette.border.main}`,
  borderRadius: theme.spacing(4),
  background: theme.palette.background.paper
}));

export const StyledCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(3),
}));

export const Styledsummary = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  columnGap: theme.spacing(10),
}));

export const StyledSummaryContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
}));

export const StyledsummaryValue = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  color: theme.palette.neutral.dark,
  fontWeight: 500,
  lineHeight: "100%"
}));

export const SyledSummaryLabel = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.LightDark,
  marginTop: theme.spacing(1),
}));

export const StyledPointsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  rowGap: theme.spacing(5),
  marginTop: theme.spacing(8)
}));

export const StyledPointCard = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(4, 5),
  border: `1px solid ${theme.palette.border.main}`,
  borderRadius: theme.spacing(2),
}));

export const StyledPointContent = styled(Box)(({ theme }) => ({
  display: "flex",
  columnGap: theme.spacing(10),
}));

export const StyledPointLabel = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
  minWidth: "200px",
  fontWeight: theme.typography.fontWeights.regular,
}));

export const StyledPointdate = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
  fontWeight: theme.typography.fontWeights.regular,
  minWidth: "100px",
}));

export const StyledPointTime = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
  ontWeight: theme.typography.fontWeights.regular,
}));

export const StyledStatusContainer = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.green,
  border: `1px solid ${theme.palette.border.green}`,
  borderRadius: theme.spacing(20),
  padding: theme.spacing(1, 2),
}));