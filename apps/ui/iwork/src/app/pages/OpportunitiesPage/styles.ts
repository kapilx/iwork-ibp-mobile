import { Box, Button, styled } from "@mui/material";

export const OpportunitiesPageStyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const TableWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));
export const ButtonWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const ButtonStyles = styled(Button)(({ theme }) => ({
  width: "180px",
  height: "40px",
  backgroundColor: theme.palette.primary.main, // Primary button color
  color: theme.palette.primary.contrastText, // Ensures text is readable
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  fontWeight: 600, // Makes text bold
  textTransform: "none", // Keeps text in normal case

  "&:hover": {
    backgroundColor: theme.palette.primary.dark, // Darker shade on hover
    boxShadow: theme.shadows[4], // Stronger shadow effect
  },

  "&:active": {
    backgroundColor: theme.palette.primary.light, // Lighter shade when clicked
    boxShadow: theme.shadows[1],
  },

  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
    boxShadow: "none",
  },
}));

export const BackButton = styled(Button)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  color: theme.palette.primary.main,
  backgroundColor: "transparent",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
