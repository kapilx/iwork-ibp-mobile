import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Button } from "@ui/ui-lib";

export const ButtonContainersBox = styled(Box)({
  display: "flex",
  gap: "16px", // Equivalent to gap: 2 (assuming theme spacing(2) = 8px)
  marginTop: "16px", // Equivalent to mt: 2
  padding: "16px", // Equivalent to p: 2
  justifyContent: "flex-end",
});

export const FormStyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));


export const OpportunitiesFormStyledContainer = styled(Box)(({ theme }) => ({
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
  minWidth: "fit-content",
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
}));

export const StyledCancelButton = styled(Button)(({ theme }) => ({
  textDecoration: "none",
  "&:hover": {
    textDecoration: "none",
  },
}));

export const StyledNestedDynamicFormContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "1254px",
  margin: "0 auto",
}));
