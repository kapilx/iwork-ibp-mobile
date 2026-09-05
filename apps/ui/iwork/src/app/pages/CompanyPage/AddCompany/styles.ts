import { Box, Typography, styled } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const AddCompanyStyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  height: "100vh", // Full viewport height
  padding: theme.spacing(4),
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: theme.spacing(3),
  color: theme.palette.text.primary,
}));

export const StyledPageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5),
}));
export const StyledCrumbContainer = styled(Box)(({ theme }) => ({
  margin: "0 auto",
  maxWidth: "1254px",
}));

export const StyledPrevButton = styled(Button)(({ theme }) => ({
  minWidth: "fit-content",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));
export const StyledNextButton = styled(Button)(({ theme }) => ({
  minWidth: "100px",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));

export const StyledCancelButton = styled(Button)(({ theme }) => ({
  textDecoration: "none",
  "&:hover": {
    textDecoration: "none",
  },
}));
