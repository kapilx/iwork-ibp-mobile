import { theme } from "@insurance-wellness-hub/ui-lib";
import { Box, Card, styled, Typography } from "@mui/material";

export const CardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  flexDirection: "row",
  // gap: theme.spacing(7.5),
  justifyContent: "space-between",
  "@media (max-width: 1099px)": {
    flexDirection: "column",
    gap: theme.spacing(3),
  },
}));

export const StyledCard = styled(Card)(({ bgGradient, theme }) => ({
  width: "49%",
  height: "305px",
  borderRadius: "4px",
  position: "relative",
  overflow: "hidden",
  background: bgGradient,
  padding: theme.spacing(5, 3.5, 5.5, 7.5),
  boxShadow: `0px 2px 4px 0px ${theme.palette.neutral.dark}26`,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(9),
  "@media (max-width: 1099px)": {
    width: "100%",
  },
  "@media (max-width: 767px)": {
    height: "auto",
    minHeight: "305px",
    padding: theme.spacing(4, 3),
  },
}));

export const BackgroundImage = styled("img")(({ theme }) => ({
  position: "absolute",
  right: 0,
  bottom: 0,
  height: "100%",
  pointerEvents: "none",
  zIndex: 0,
  opacity: 1,
}));

export const CardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const TitleSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  zIndex: 1,
  justifyContent: "space-between",
  width: "100%",
  "@media (max-width: 767px)": {
    flexWrap: "wrap",
  },
}));

export const StatGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  marginTop: theme.spacing(3),
  "@media (max-width: 767px)": {
    flexWrap: "wrap",
    flexDirection: "column",
  },
}));

export const StatItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 10),
  paddingLeft: theme.spacing(0),
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  // gap: theme.spacing(1.5),
  "&:not(:first-child)": {
    borderLeft: `1px solid ${theme.palette.text.grey}`,
    paddingLeft: theme.spacing(10),
  },
  "@media (max-width: 767px)": {
    padding: theme.spacing(2, 0),
    "&:not(:first-child)": {
      borderLeft: "none",
      borderTop: `1px solid ${theme.palette.text.grey}`,
      paddingLeft: theme.spacing(0),
      paddingTop: theme.spacing(2),
    },
  },
}));

export const UploadLink = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  color: theme.palette.button.secondary,
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  zIndex: 1,
  opacity: 2,
}));

export const GroupTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.md,
}));

export const StatsCount = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.xll,
}));

export const StatsLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
}));

export const WarningBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginTop: theme.spacing(1),
  gap: theme.spacing(1.5),
  maxWidth: "230px",
}));

export const WarningText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const StatsCountContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(0.5),
  "@media (max-width: 767px)": {
    alignItems: "flex-start",
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.lg,
}));
export const ViewDetailsSection = styled(Typography)(({ theme }) => ({
  color: theme.palette.button.secondary,
}));
