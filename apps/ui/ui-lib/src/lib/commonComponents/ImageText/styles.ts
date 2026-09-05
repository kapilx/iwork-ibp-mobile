import { styled } from "@mui/material";

export const ImageTextSectionImageIcon = styled("img")<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  width: theme.spacing(7),
  height: theme.spacing(7),
  ...customStyles,
}));

export const ImageTextSectionImageContainer = styled("div")<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  ...customStyles,
}));

export const ImageTextSectionTitle = styled("h3")<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  margin: theme.spacing(0),
  color: theme.palette.primary.main,
  ...customStyles,
}));
