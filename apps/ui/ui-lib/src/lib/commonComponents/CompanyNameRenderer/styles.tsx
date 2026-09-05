import { alpha, styled } from "@mui/material";

export const CompanyNameRendererContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.4,
}));

export const NameText = styled("div")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const TypeText = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xss,
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.light,
}));

export const ColorCompanyText = styled("div")(({ color }) => {
  const dotColor =
    color === "RED"
      ? "#ff0000"
      : color === "GREEN"
      ? "#008000"
      : color === "AMBER"
      ? "#ffa500"
      : "transparent";
  return {
    width: 9,
    height: 9,
    borderRadius: "50%",
    display: "flex",
    marginTop: 7,
    flexShrink: 0,
    backgroundColor: dotColor,
    boxShadow:
      dotColor === "transparent"
        ? "none"
        : `0 0 0 4px ${alpha(dotColor, 0.2)}`,
  };
});

export const TotalContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2.5),
}));
