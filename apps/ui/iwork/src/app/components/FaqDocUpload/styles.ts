import { Box, styled, Typography, Button, Stack } from "@mui/material";

export const ModalHeadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

export const ModalMainHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const ModalSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.lightGrey,
}));

export const FormStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

export const FileInfoBox = styled(Box)(({ theme }) => ({
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  padding: theme.spacing(2),
  backgroundColor: "#f8f9fa",
  marginTop: theme.spacing(2),
}));

export const FileInfoTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));

export const FileInfoRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const FileName = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const FileDetailsStack = styled(Stack)(({ theme }) => ({
  flexDirection: "column",
  alignItems: "flex-end",
}));

export const FileSize = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const FileId = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(6),
}));

export const StyledCancelButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.primary.main,
}));

export const StyledUploadButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
  },
}));
