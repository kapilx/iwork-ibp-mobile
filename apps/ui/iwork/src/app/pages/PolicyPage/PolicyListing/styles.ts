import { Box, Button, Typography, styled } from "@mui/material";

export const PolicyListingContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 4.5),
  height: "calc(100vh - 60px)",
  "& .clickable-cell": {
    cursor: "pointer",
    color: "#1976d2",
    textDecoration: "underline",
  },
}));

export const HeaderWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(4),
}));

export const AddButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
}));

export const Title = styled(Typography)(({ theme }) => ({
  ...theme.typography.h1,
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
