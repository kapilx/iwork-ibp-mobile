import { Box, styled } from "@mui/material";

export const StyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
}));

export const ActionRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

export const ParamRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "center",
  flexWrap: "wrap",
}));

export const LoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  minHeight: "300px",
  backgroundColor: theme.palette.background.paper,
}));