import { Card, CardContent, Typography, Box, styled } from "@mui/material";

// Styled components using MUI styled
export const PolicyContacytStyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: "259.25px",
  maxHeight: "160px",
  overflow: "hidden",
  margin: theme.spacing(0),
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxShadow: theme.shadows[11],
  borderRadius: theme.spacing(1),
  background: theme.palette.neutral.veryLight,
  "& .MuiCardContent-root:last-child": {
    paddingBottom: "0px !important",
  },
}));

export const IconWrapper = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(2.5),
  display: "flex",
  alignItems: "center",
  "& img": {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },
  "& .map": {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
}));

export const PolicyCardTagText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  marginTop: theme.spacing(1.5),
  marginBottom: theme.spacing(2.5),
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

export const ContactPolicyCardStyledDivider = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: "#FF7104",
  height: "0.5px",
  width: "100%",
}));
