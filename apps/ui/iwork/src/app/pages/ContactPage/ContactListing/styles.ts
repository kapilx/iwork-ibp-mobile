import { Box, styled, Typography } from "@mui/material";

export const ContactListingStyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 4.5),
  ".clickable-cell": {
    cursor: "pointer",
  },
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));
