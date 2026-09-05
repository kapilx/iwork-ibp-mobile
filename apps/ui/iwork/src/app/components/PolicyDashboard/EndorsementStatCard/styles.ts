import { styled } from "@mui/material/styles";
import { Box, Card, Typography } from "@mui/material";

export const CardsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  // justifyContent: "space-between",
  gap: theme.spacing(7.5),
}));

export const CardContainer = styled(Card)(({ theme }) => ({
  padding: theme.spacing(5) + " " + theme.spacing(5),
  minWidth: 329,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  borderRadius: theme.spacing(2),
  minHeight: 250,
  justifyContent: "space-between",
  boxShadow: `0px 2px 4px 0px ${theme.palette.neutral.dark}26`,
  width: "31.5%",
  "@media (max-width: 1099px)": {
    width: "100%",
  },
}));

export const TitleSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
}));

export const IconImage = styled("img")({
  width: 24,
  height: 24,
});

export const TopStatsWrapper = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: theme.spacing(5),
  "@media (max-width: 430px)": {
    gridTemplateColumns: "1fr",
  },
}));

export const StatBox = styled(Box)({
  textAlign: "left",
});

export const TopStatsHeadingText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
}));

export const TopStatsSubHeadingText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
}));

export const ActionsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const ActionItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  cursor: "pointer",
}));

export const ActionLabelText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.button.secondary,
}));

export const CardTopContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));
