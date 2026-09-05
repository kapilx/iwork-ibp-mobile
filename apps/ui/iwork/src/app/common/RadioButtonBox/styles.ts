import { Box, Typography, Radio } from "@mui/material";
import { styled } from "@mui/material/styles";

export const OptionCardContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "selected" && prop !== "warning",
})<{ selected: boolean; warning?: boolean }>(
  ({ theme, selected, warning }) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.5),
    flex: 1,
    minWidth: "300px",
    padding: theme.spacing(2),
    border: `2px solid ${
      warning
        ? theme.palette.warning.main
        : selected
        ? theme.palette.secondary.selected
        : theme.palette.divider
    }`,
    backgroundColor: warning
      ? theme.palette.background.yellowVariant
      : selected
      ? theme.palette.background.blueVariant
      : theme.palette.background.paper,
    borderRadius: theme.spacing(3),
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: warning
        ? theme.palette.warning.main
        : theme.palette.secondary.selected,
    },
  })
);

export const StyledRadio = styled(Radio)(({ theme }) => ({
  padding: 0,
  color: theme.palette.grey[400],
  fontSize: theme.typography.fontSizes.lg,
  "&.Mui-checked": {
    color: theme.palette.secondary.selected,
  },
}));

export const TextWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const Heading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  lineHeight: 1.5,
}));

export const Subheading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: 1.5,
}));
