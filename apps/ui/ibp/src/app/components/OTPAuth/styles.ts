import { styled } from "@mui/material";
import { Box, Typography } from "@mui/material";
import { ibpTheme as theme } from "@ui/ui-lib";

export const ButtonContainer = styled("div")(({ theme }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "center",
  marginTop: theme.spacing(4),
  // marginBottom: theme.spacing(5.25),
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  minHeight: "220px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
}));

export const VerifyButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "end",
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

export const ResendOTPContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(4.5),
  gap: theme.spacing(1.5),
}));

export const ResendText = styled(Typography)(({ theme }) => ({
  color: "#666",
  fontSize: "14px",
}));

export const ResendLink = styled(Typography)<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    color: disabled ? "#999" : theme.palette.background.DarkBlue,
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "underline",
    fontSize: "14px",
  })
);
export const ResendChangeNumberLink = styled(Typography)<{
  disabled?: boolean;
}>(({ theme, disabled }) => ({
  color: disabled ? "#999" : theme.palette.background.DarkBlue,
  cursor: disabled ? "not-allowed" : "pointer",
  textDecoration: "underline",
  fontSize: "14px",
  marginLeft: theme.spacing(4),
}));
