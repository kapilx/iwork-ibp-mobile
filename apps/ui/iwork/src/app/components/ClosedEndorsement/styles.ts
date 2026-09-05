import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import Button from "@ui/ui-lib/commonComponents/Button";

export const Container = styled(Box)<{ theme: any }>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  height: "calc(100vh - 80px)",
  justifyContent: "space-between",
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  width: 200,
  marginLeft: "auto",
  marginRight: "10px",
}));

export const StyledAckButton = styled(Button)(({ theme }) => ({
  width: "auto",
  minWidth: "60px",
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  whiteSpace: "nowrap",
}));

export const FileName = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.linkBlue,
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const ButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
}));
