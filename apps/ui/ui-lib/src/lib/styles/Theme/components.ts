import { Components } from "@mui/material";
import { border } from "./border";
import { colors } from "./colors";
import shadows from "./shadows";
import { textSizes } from "./typography";

export const components: Components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        borderRadius: border.radius.medium,
        padding: "8px 16px",
        fontWeight: 600,
      },
      contained: {
        boxShadow: "none",
        "&:hover": { boxShadow: "none" },
      },
    },
    defaultProps: { disableElevation: true },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: border.radius.large,
        boxShadow: shadows[1],
      },
    },
  },
  MuiTypography: {
    styleOverrides: {
      h1: {
        fontSize: textSizes.fontSizes.xll,
        fontWeight: textSizes.fontWeights.semiBold,
        color: colors.text.grey,
      },
      h3: {
        fontSize: textSizes.fontSizes.lg,
        fontWeight: textSizes.fontWeights.medium,
        color: colors.primary.main,
      },
      h4: {
        fontSize: textSizes.fontSizes.xl,
        fontWeight: textSizes.fontWeights.bold,
        color: colors.text.grey,
      },
      h5: {
        fontSize: textSizes.fontSizes.md,
        fontWeight: textSizes.fontWeights.semiBold,
        color: colors.neutral.dark,
      },
    },
  },
  MuiCollapse: {
    styleOverrides: {
      root: {
        transition: "none !important",
      },
    },
  },
};
