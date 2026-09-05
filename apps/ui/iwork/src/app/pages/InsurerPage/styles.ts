import { Box, Button, styled, Typography } from "@mui/material";

export const InsurerPageStyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(6, 4.5),
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
  justifyContent: "end",
  alignItems: "center",
  gap: theme.spacing(5),
}));

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
export const TitleContainer = styled(Typography)(({ theme }) => ({
  // paddingLeft: theme.spacing(4),
  // paddingTop: theme.spacing(7),
}));
export const StyledCustomTabs = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));
