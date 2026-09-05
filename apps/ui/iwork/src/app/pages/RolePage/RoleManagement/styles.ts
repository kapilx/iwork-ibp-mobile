import { Box, styled, Typography } from "@mui/material";

export const PageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(7.5, 5),

  ".clickable-cell": {
    cursor: "pointer",
  },
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

export const AclTable = styled(Box)(({ theme }) => ({
  width: "100%",
  borderCollapse: "collapse",
  marginTop: theme.spacing(4),
  "& th, & td": {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
  },
  "& th": {
    backgroundColor: theme.palette.grey[100],
  },
}));

export const FormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));
