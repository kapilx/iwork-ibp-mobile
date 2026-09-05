import { styled, Typography } from "@mui/material";
import Button from "../Button";

export const StyledButton = styled(Button)<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  width: "auto",
  minWidth: "60px",
  padding: theme.spacing(1, 4),
  gap: theme.spacing(1),
  ...customStyles,
}));

export const ButtonText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
}));
