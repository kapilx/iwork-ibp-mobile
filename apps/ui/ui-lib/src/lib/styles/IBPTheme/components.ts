import { Components } from "@mui/material";
import { border } from "./border";
import { colors } from "./colors";
import shadows from "./shadows";
import { textSizes } from "./typography";

export const components: Components = {
  MuiCssBaseline: {
    styleOverrides: `
      *, *::before, *::after {
        font-family: 'Figtree', sans-serif !important;
      }
    `,
  },
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
      // h1/h2/h3/h4 shrink on mobile — these are page/section titles, the
      // "oversized headings consuming too much vertical space" the app was
      // missing a consistent rule for. h5/h6/body/button/caption previously
      // had no override at all for h2/h6/body1/body2/button/caption, so they
      // silently fell back to MUI's default Roboto scale (e.g. default h2 is
      // 3.75rem/60px) instead of the Figtree/IBP scale used everywhere else.
      h1: ({ theme }) => ({
        fontSize: textSizes.fontSizes.xll,
        fontWeight: textSizes.fontWeights.semiBold,
        color: colors.text.grey,
        [theme.breakpoints.down(768)]: { fontSize: textSizes.fontSizes.xl },
      }),
      h2: ({ theme }) => ({
        fontSize: textSizes.fontSizes.xxl,
        fontWeight: textSizes.fontWeights.semiBold,
        color: colors.text.grey,
        [theme.breakpoints.down(768)]: { fontSize: textSizes.fontSizes.xll },
      }),
      h3: ({ theme }) => ({
        fontSize: textSizes.fontSizes.lg,
        fontWeight: textSizes.fontWeights.medium,
        color: colors.primary.main,
        [theme.breakpoints.down(768)]: { fontSize: textSizes.fontSizes.md },
      }),
      h4: ({ theme }) => ({
        fontSize: textSizes.fontSizes.xl,
        fontWeight: textSizes.fontWeights.bold,
        color: colors.text.grey,
        [theme.breakpoints.down(768)]: { fontSize: textSizes.fontSizes.lg },
      }),
      h5: {
        fontSize: textSizes.fontSizes.md,
        fontWeight: textSizes.fontWeights.semiBold,
        color: colors.neutral.dark,
      },
      h6: {
        fontSize: textSizes.fontSizes.sm,
        fontWeight: textSizes.fontWeights.semiBold,
        color: colors.neutral.dark,
      },
      body1: {
        fontSize: textSizes.fontSizes.md,
        fontWeight: textSizes.fontWeights.regular,
        color: colors.text.primary,
      },
      body2: {
        fontSize: textSizes.fontSizes.sm,
        fontWeight: textSizes.fontWeights.regular,
        color: colors.text.grey,
      },
      button: {
        fontSize: textSizes.fontSizes.sm,
        fontWeight: textSizes.fontWeights.semiBold,
      },
      caption: {
        fontSize: textSizes.fontSizes.xs,
        fontWeight: textSizes.fontWeights.regular,
        color: colors.neutral.lightMedium,
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
