import { Box, Typography, styled } from "@mui/material";

export const PageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(6, 4.5),
  gap: theme.spacing(3),
}));

export const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: "20px",
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

export const CardContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

export const ActionsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 600,
  marginBottom: theme.spacing(1.5),
  color: theme.palette.text.primary,
}));

export const FieldContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
}));

export const CheckboxContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  marginLeft: theme.spacing(4),
  marginTop: theme.spacing(1),
}));

export const PreviewBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2.5),
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.grey[300]}`,
}));

export const PreviewLabel = styled(Typography)(({ theme }) => ({
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: theme.spacing(1),
}));

export const PreviewValue = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 500,
  color: theme.palette.text.primary,
  fontFamily: "monospace",
}));
