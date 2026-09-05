import { Box, Card, CardContent, styled, Typography } from "@mui/material";

interface StyledCardProps {
  backgroundColor?: string;
  textColor?: string;
  isMultipleCards?: boolean;
}

export const KPIContainer = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(8)} ${0}`,
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: theme.spacing(6.5),
  width: "100%",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
}));

export const KpiStyledCard = styled(Card)<StyledCardProps>(
  ({ theme, backgroundColor, textColor, isMultipleCards = true }) => ({
    width: "100%",
    minHeight: "170px",
    transition: "transform 0.2s, box-shadow 0.2s",
    backgroundColor: `${backgroundColor}`,
    color: textColor,
    borderRadius: theme.shape.borderRadii.medium,
    ...(isMultipleCards && {
      "&:hover": {
        transform: "scale(1.05)",
      },
    }),
  })
);

export const KPIContent = styled(CardContent)(({ theme }) => ({
  textAlign: "left",
}));

export const CardCount = styled(Typography)(({ theme }) => ({
  width: "fit-content",
  // A comma-grouped number is one unbreakable token to the line-breaker, so a
  // long value (e.g. a fixed-unit "22,22,58,00,456.8L") would otherwise run
  // straight past the card edge. Cap the width and allow a mid-number break.
  maxWidth: "100%",
  overflowWrap: "anywhere",
  cursor: "default",
  // Reveal the exact value only while the cursor is on the number itself.
  "&:hover ~ .kpi-exact": { visibility: "visible", opacity: 0.85 },
  fontSize: theme.typography.fontSizes.xxxl,
  fontWeight: theme.typography.fontWeights.bold,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xxl,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const CardTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
}));

// Exact value, shown in-card instead of a hover tooltip. Monospace +
// tabular-nums so the digit groups line up; the decimal part is visually
// demoted so a grouping comma can't be misread as the decimal point.
export const ExactValue = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  letterSpacing: "0.02em",
  wordBreak: "break-all",
  visibility: "hidden",
  opacity: 0,
  transition: "opacity 0.15s",
}));

export const ExactDecimals = styled("span")({
  fontWeight: 400,
  opacity: 0.8,
});
