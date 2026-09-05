import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const LoginPageContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: "#f5f5f5",
  display: "flex",
  flexDirection: "column",
}));

export const LoginHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 4),
  backgroundColor: "white",
  borderBottom: "1px solid #e0e0e0",
  zIndex: 10,
}));

export const LoginLogo = styled("img")(({ theme }) => ({
  height: "40px",
  cursor: "pointer",
  objectFit: "contain",
}));