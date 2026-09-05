import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const MainContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  minHeight: "220px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
}));

export const ActionsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginTop: theme.spacing(2),
}));

export const ResendLink = styled(Typography)<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    color: disabled ? "#999" : theme.palette.background.DarkBlue,
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "underline",
  })
);

export const ChangeEmailLink = styled(Typography)(({ theme }) => ({
  color: theme.palette.background.DarkBlue,
  cursor: "pointer",
  textDecoration: "underline",
}));

export const ButtonContainer = styled("div")(({ theme }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "center",
}));
