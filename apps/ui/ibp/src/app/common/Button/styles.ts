import { Button, styled } from "@mui/material";

export const StyledButton = styled(Button)(({ theme, variant }) => ({
  padding: theme.spacing(2),
  fontSize: theme.typography.fontSizes.md,
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  borderRadius: "8px",
  width: "auto",
  minWidth: "120px",
  whiteSpace: "nowrap",
  paddingLeft: theme.spacing(4),
  paddingRight: theme.spacing(4),
  ...(variant === "gradient" && {
    background: "#093F84",
    color: "#FFFFFF !important",
    border: "none",
    borderRadius: "6px",
    "&:hover": {
      background: "#093F84",
      opacity: 0.9,
    },
    "&.Mui-disabled": {
      background: theme.palette.button.disabled,
      color: theme.palette.text.disabled,
    },
  }),
  ...(variant === "gradient-outlined" && {
    background: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    color: "#093F84 !important",
    position: "relative",
    isolation: "isolate",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: "6px",
      padding: "1px",
      background: "#093F84",
      WebkitMask:
        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
      pointerEvents: "none",
    },
    "&:hover": {
      background: "rgba(9, 63, 132, 0.05)",
    },
    "&.Mui-disabled": {
      color: `${theme.palette.text.disabled} !important`,
      "&::before": {
        background: theme.palette.button.disabled,
      },
    },
  }),
  ...(variant === "link" && {
    backgroundColor: "transparent !important",
    color: theme.palette.border.secondary,
    textDecoration: "underline",
    border: "none",
    borderRadius: "0px",
    padding: "0 !important",
    minWidth: "auto",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "transparent !important",
      textDecoration: "underline",
      color: theme.palette.text.Deeporange,
    },
    "&:focus": {
      backgroundColor: "transparent !important",
    },
    "&.Mui-disabled": {
      color: theme.palette.text.disabled,
      textDecoration: "none",
    },
  }),
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.sm,
    padding: variant === "link" ? "0 !important" : theme.spacing(1.5),
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xxs,
    padding: variant === "link" ? "0 !important" : theme.spacing(0),
  },
}));
