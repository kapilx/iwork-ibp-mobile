import { Box, styled, Typography } from "@mui/material";

export const ReleaseNotesContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "calc(100vh - 65px)",
  padding: theme.spacing(6),
  display: "flex",
  gap: theme.spacing(6),
  flexDirection: "column",
}));

export const ReleaseNoteStyledTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.bold,
  fontFamily: theme.typography.fontFamily,
}));

export const MarkDownContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  marginLeft: theme.spacing(4),
}));
