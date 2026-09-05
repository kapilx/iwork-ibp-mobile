import { Box, styled, Typography } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
  width: "100%",
  minHeight: "92vh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.paper,
  justifyContent: "space-between",
  gap: theme.spacing(10),
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  position: "relative",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(7),
  marginTop: theme.spacing(15),
  // marginLeft: "auto",
  // marginRight: "auto",
  // maxWidth: "1366px",
}));

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const SubHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const CardsContainer = styled(Box)(({ theme }) => ({
  height: "100%",
  width: "100%",
  display: "flex",
  gap: theme.spacing(6),
  flexWrap: "wrap",
}));

export const CheckBoxContainer = styled(Box)(({ theme }) => ({
  display: "flex",
}));

export const FooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginLeft: theme.spacing(10),
  marginRight: theme.spacing(10),
  padding: theme.spacing(5, 7.5, 5, 7.5),
  border: `1px solid ${theme.palette.border.secondary}`,
  borderBottom: "none",
  borderTopLeftRadius: theme.spacing(4),
  borderTopRightRadius: theme.spacing(4),
  alignItems: "center",
}));

export const LabelValueHolder = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const LabelValueContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(15),
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
}));

export const BackGroundImg = styled("img")(({ theme }) => ({
  position: "absolute",
  bottom: "-41%",
  left: 0,
  zIndex: 0,
}));

export const HeaderTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xll,
}));

export const SubHeaderTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.md,
}));

export const StyledSpan = styled("span")(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xll,
  color: theme.palette.text.ternary,
}));

export const FooterNumberTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xl,
}));

export const FooterLabelTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.labelColor,
}));
