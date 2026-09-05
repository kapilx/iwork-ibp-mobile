import { Box, styled, Typography } from "@mui/material";

export const FileName = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.linkBlue,
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const DisplayDocsStyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 4.5),
  ".clickable-cell": {
    cursor: "pointer",
  },
}));

export const DocumentInfo = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 0),
  alignItems: "center",
}));

export const BulkDownloadButtonContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  display: "flex",
  gap: theme.spacing(1),
  flexDirection: "row",
  justifyContent: "space-between",
  minHeight: "40px",
  alignItems: "center",
}));

export const DocumentDownloadContainer = styled(Box)(() => ({
  wordBreak: "break-word",
  overflowWrap: "break-word",
}));
