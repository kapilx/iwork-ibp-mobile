import { Box, Typography, styled } from "@mui/material";

export const ILearnContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),
  gap: theme.spacing(4),
  height: "100%",
}));

export const PageHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const PageHeaderWithAction = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  width: "100%",
}));

export const AddDocumentLink = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.button.secondary,
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
}));

export const PageTitle = styled(Typography)(({ theme }) => ({
  margin: 0,
}));

export const PageDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

export const DocumentsWrapper = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(3),
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
}));

export const LoaderWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  padding: theme.spacing(6),
}));
