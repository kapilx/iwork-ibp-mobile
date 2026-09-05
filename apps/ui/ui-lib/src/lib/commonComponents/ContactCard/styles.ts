import { Card, CardContent, Typography, Box, styled } from "@mui/material";

// Styled components using MUI styled
export const ContactStyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: "259.25px",
  maxHeight: "142px",
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

export const CardImage = styled("img")(({ theme }) => ({
  position: "absolute",
  top: 0,
  right: 0,
  zIndex: 0,
}));

export const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  zIndex: 1,
}));

export const ContactName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.button.secondary,
  fontWeight: 400,
  marginBottom: theme.spacing(5),
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  cursor: "pointer",
}));

export const ContactPosition = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.neutral.lightMedium,
  display: "flex",
  alignItems: "center",
}));

export const CompanyName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.neutral.lightMedium,
  marginLeft: theme.spacing(3),
  "&::before": {
    position: "absolute",
    content: "''",
    width: "4px",
    height: "4px",
    backgroundColor: theme.palette.neutral.lightMedium,
    borderRadius: theme.shape.borderRadii.circle,
    top: "40%",
    left: "-7px",
  },
}));

export const ContactInfoItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1),
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.primary,
}));

export const ContactCardIconWrapper = styled(Box)(({ theme }) => ({
  marginRight: theme.spacing(2.5),
  display: "flex",
  alignItems: "center",
}));

export const InfoText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

export const TagText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

export const StyledDivider = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  height: "0.5px",
  width: "100%",
}));

export const CardFooter = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const NoContactCard = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: theme.palette.neutral.veryLight,
  borderRadius: theme.spacing(2),
}));
