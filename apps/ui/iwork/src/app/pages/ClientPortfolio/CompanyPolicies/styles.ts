import { Box, styled, Typography } from "@mui/material";

export const SubHeading = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(5),
}));

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "center",
  justifyContent: "space-between",
}));

export const Icons = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const FileIcon = styled("img")(({ theme }) => ({
  width: 18,
  height: 20,
  cursor: "pointer",
}));
