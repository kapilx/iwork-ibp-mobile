import { Box, styled, Typography } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: theme.spacing(5),
  margin: theme.spacing(5),
  marginLeft: theme.spacing(0),
  border: "1px solid rgb(234, 234, 234)",
  boxShadow: "rgba(0, 0, 0, 0.2) 0px 0px 4px 0px",
  borderRadius: theme.shape.borderRadii.medium,
  gap: "60px",
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(5),
  marginTop: theme.spacing(0),
  marginRight: theme.spacing(5),
}));
export const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

export const PolicySpecificNotice = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  fontWeight: theme.typography.fontWeightMedium,
  backgroundColor: "#e3f2fd",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #bbdefb",
}));
export const BackButtonContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5, 5, 0, 5),
  color: theme.palette.secondary.selected,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
}));

export const MainCDBalanceContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5, 5, 0, 5),
}));
