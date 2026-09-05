import { Box, Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: theme.shape.borderRadius * 2,
    animation: `${fadeIn} 0.3s ease-out`,
  },
}));
export const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

export const DialogContentStyledBox = styled(Box)(({ theme }) => ({
  paddingY: theme.spacing(1),
}));

export const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  display: "flex",
  justifyContent: "flex-end",
}));

export const DialogStyledButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.grey[400],
  color: theme.palette.text.primary,
  "&:hover": {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const fadeIn = `@keyframes fadeIn {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }`;
