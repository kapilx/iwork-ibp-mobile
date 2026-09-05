import { Paper, styled } from "@mui/material";

export const MessageOverlayStyledPaper = styled(Paper)(({ theme }) => ({
  // Adjust height based on your layout
  overflowY: "auto",
  padding: theme.spacing(2),
  backgroundColor: `${theme.palette.background.covers} !important`,
}));
