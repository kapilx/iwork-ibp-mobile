import { styled } from "@mui/material/styles";

export const TimePickerContainer = styled("div")(({ theme }) => ({
  position: "relative",
  width: "80%",
  fontFamily: theme.typography.fontFamily,
  backgroundColor: "transparent",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

export const InputWrapper = styled("div")(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
}));

export const StyledInput = styled("input")(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(2, 7, 2, 3), // 8px 32px 8px 10px
  fontSize: theme.typography.fontSizes.md,
  border: "none",
  outline: "none",
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  backgroundColor: theme.palette.background.paper,
}));

export const Dropdown = styled("div")(({ theme }) => ({
  position: "absolute",
  top: "100%",
  left: 0,
  maxHeight: 200,
  overflowY: "auto",
  width: "100%",
  fontSize: theme.typography.fontSizes.xss,
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  zIndex: 1000,
  boxShadow: theme.shadows[4],
}));

export const DropdownOption = styled("div")(({ theme }) => ({
  padding: theme.spacing(2, 3), // 8px 10px
  cursor: "pointer",
  color: theme.palette.text.primary,
  "&.selected, &:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const HelperText = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.secondary,
  paddingLeft: theme.spacing(1.5),
}));