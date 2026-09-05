import { styled } from "@mui/material/styles";

export const FileUploadPageContainer = styled("div")(({ theme }) => ({
  width: "100%",
  padding: `${theme.spacing(35)} 0px`,
  backgroundColor: "#FFF7F0",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
}));

export const FileUploadContainer = styled("div")(({ theme }) => ({
  width: "44.6%",
}));

export const FileUploadPageHeader = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.bold,
  marginBottom: theme.spacing(7),
  color: theme.palette.primary.main,
}));

export const FileUploadInputLabelContainer = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.neutral.dark,
}));

export const SeparatorContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  textAlign: "center",
  margin: `${theme.spacing(2)} 0px`,
}));

export const Line = styled("div")(({ theme }) => ({
  flex: 1,
  height: "1px",
  backgroundColor: theme.palette.neutral.divider,
}));

export const OrText = styled("span")(({ theme }) => ({
  padding: `0px ${theme.spacing(2)}`,
  fontStyle: "italic",
  color: theme.palette.neutral.dark,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  whiteSpace: "nowrap",
}));
