import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const WorkInProgressContainer = styled(Box)<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "center",
  marginTop: theme.spacing(11),
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  padding: theme.spacing(0, 3),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 2),
    marginTop: theme.spacing(6),
  },
  ...customStyles,
}));

export const WorkInProgressImage = styled("img")({
  height: "auto",
  width: "100%",
  maxWidth: "320px",
});

export const WorkInProgressTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.grey,
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(2),
}));

export const WorkInProgressText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.sm,
  maxWidth: "551px",
  width: "100%",
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "20px",
  textAlign: "center",
  color: theme.palette.neutral.mediumDark,
  wordBreak: "break-word",
}));
