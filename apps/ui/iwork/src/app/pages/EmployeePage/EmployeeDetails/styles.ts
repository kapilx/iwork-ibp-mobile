import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ButtonStyles = styled(Button)(({ theme }) => ({
  width: "160px",
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

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(5),
  "& .edit-button": {
    minWidth: "72px",
    gap: theme.spacing(1),
  },
}));

export const EmployeeContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),

  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
}));

export const EmployeeDetailsSectionTitle = styled("h3")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.primary.main,
}));
