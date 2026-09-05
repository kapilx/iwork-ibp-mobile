import { Box, Typography, styled } from "@mui/material";

export const CardContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#fff",
  border: "1px solid #E0E0E0",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2.5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
  width: "100%",
  maxWidth: "600px",
  fontFamily: theme.typography.fontFamily,
}));

export const FileInfoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
}));

export const FileContentWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2.5),
  flex: 1,
}));

export const FileTextContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  flex: 1,
}));

export const FileIconWrapper = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: "8px",
  backgroundColor: "#EEF3FF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}));

export const FileName = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
}));

export const MetaInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  color: theme.palette.text.primary,
  fontSize: "0.875rem",
  fontWeight: theme.typography.fontWeights.light,
}));

export const Content = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  color: theme.palette.text.primary,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
}));

export const MetaLabel = styled("span")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.light,
}));

export const MetaValue = styled("span")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const DividerLine = styled("div")(({ theme }) => ({
  borderBottom: "1px solid #E0E0E0",
  marginTop: theme.spacing(1),
}));

export const FooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: theme.spacing(1),
}));

export const ChipContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const TotalCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.light,
}));

export const TotalValue = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  marginLeft: theme.spacing(0.5),
}));

export const ErrorButton = styled(Box)(({ theme }) => ({
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.medium,
  marginLeft: theme.spacing(0.5),
  borderRadius: "15px",
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0.5, 2),
  gap: theme.spacing(0.5),
  border: `1px solid black`,
}));

export const ErrorIcon = styled("img")(({ theme }) => ({
  width: 16,
  height: 16,
}));
