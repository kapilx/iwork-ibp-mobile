import { Box, Chip, styled } from "@mui/material";

export const DotStyles = styled(Box)<{ dotColor?: string }>(
  ({ theme, dotColor }) => {
    const color = dotColor ?? theme.palette.text.primary;
    return {
      width: 16,
      height: 16,
      borderRadius: theme.shape.borderRadii.circle,
      flexShrink: 0,
      backgroundColor: color,
    };
  }
);

export const ChipLabelContainer = styled(Box)<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  minWidth: "75px",
  ...customStyles,
}));

export const ChipLabelVariableContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1), // Use theme spacing for consistency
}));

export const defaultChipStyles = (theme) => ({
  backgroundColor: theme.palette.background.deepOrange,
  color: theme.pallette.neutral.dark,
  dotColor: "transparent",
  height: 24,
  fontWeight: theme.typography.fontWeights.regular,
  borderRadius: theme.shape.borderRadii.large,
  px: 1.5,
});

export const ImageStyles = styled("img")(({ theme }) => ({
  width: "16px",
  height: "16px",
}));
export const StyledChip = styled(Chip)<{
  backgroundcolor?: string;
  textcolor?: string;
  padding?: string;
  maxWidth?: string;
  bordercolor?: string;
  isClickable?: boolean;
}>(
  ({
    backgroundcolor,
    textcolor,
    padding,
    maxWidth,
    bordercolor,
    isClickable,
    theme,
  }) => ({
    backgroundColor: backgroundcolor || theme.palette.background.paper,
    color: textcolor || theme.palette.text.primary,
    padding: padding,
    maxWidth: maxWidth,
    border: `1px solid ${bordercolor || "transparent"}`,
    transition: "all 0.2s ease",

    ...(isClickable && {
      "&.MuiChip-clickable:hover": {
        backgroundColor: backgroundcolor || theme.palette.background.paper, // keep same or change slightly
        color: textcolor || theme.palette.text.primary,
        borderColor: bordercolor,
      },
      "&.MuiChip-clickable:focus-visible": {
        backgroundColor: backgroundcolor || theme.palette.background.paper,
      },
    }),
  })
);
