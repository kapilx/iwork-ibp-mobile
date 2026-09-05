import { styled } from "@mui/material";

export const CardBackground = styled("div")<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(4.25, 4),
  boxShadow: theme.shadows[12],
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  // marginTop: theme.spacing(4),
  ...customStyles,
}));
