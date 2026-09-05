import { Box, IconButton, styled, Typography } from "@mui/material";

export const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isPadding" && prop !== "hasTopHeader",
})<{ isPadding?: boolean; hasTopHeader?: boolean }>(
  ({ theme, isPadding = true, hasTopHeader = false }) => ({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: theme.palette.background.default,
    padding: isPadding ? theme.spacing(4, 15.5) : 0,
    gap: theme.spacing(5),
    paddingTop: isPadding && !hasTopHeader ? theme.spacing(12) : theme.spacing(3),
    marginTop: isPadding && !hasTopHeader ? theme.spacing(4) : 0,
    width: "100%",

    [theme.breakpoints.up("sm")]: {
      padding: isPadding ? theme.spacing(4, 4) : 0,
      paddingTop: isPadding && !hasTopHeader ? theme.spacing(15.5) : theme.spacing(3),
      marginTop: isPadding && !hasTopHeader ? theme.spacing(6) : 0,
    },
    [theme.breakpoints.up("md")]: {
      padding: isPadding ? theme.spacing(4, 15.5) : 0,
      paddingTop: isPadding && !hasTopHeader ? theme.spacing(12) : theme.spacing(3),
      marginTop: isPadding && !hasTopHeader ? theme.spacing(8) : 0,
    },
    [theme.breakpoints.up("lg")]: {
      padding: isPadding ? theme.spacing(5, 10) : 0,
      paddingTop: isPadding && !hasTopHeader ? theme.spacing(20) : theme.spacing(3),
      maxWidth: "1920px",
      margin: isPadding && !hasTopHeader ? "0 auto" : 0,
    },
  })
);

export const FaqPageOuter = styled(Box)({
  paddingTop: "54px",
  display: "flex",
  flexDirection: "column",
  width: "100%",
});

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "start",
  gap: theme.spacing(3),
  width: "100%",
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(3),
  width: "100%",
}));

export const AccordionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(0),
  borderRadius: theme.spacing(1),
  width: "100%",
  minWidth: "320px", // minimum for mobile
  maxWidth: "100%",
  

}));

export const HeaderTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xxl,
  textAlign: "start",
  color: theme.palette.text.primary,
}));
export const SubHeaderTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  textAlign: "start",
  color: theme.palette.text.primary,
}));
export const TitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3.75),
}));

export const BackArrowButton = styled(IconButton)({
  color: "#093F84",
  padding: 0,
  flexShrink: 0,
  "&:hover": {
    backgroundColor: "transparent",
  },
});
export const TitleSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "start",
  gap: theme.spacing(1),
}));
export const ChipsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
  justifyContent: "flex-start",
  alignItems: "center",
  width: "100%",
  // minWidth: "320px",
  
  // // Responsive width based on screen size
  // [theme.breakpoints.up('sm')]: {
  //   minWidth: "600px",
  // },
  // [theme.breakpoints.up('md')]: {
  //   minWidth: "800px",
  // },
  // [theme.breakpoints.up('lg')]: {
  //   minWidth: "1200px",
  // },
}));
export const NoDataMessage = styled("div")(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(6),
  color: theme.palette.text.secondary,
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
}));
export const ChipsWrapperContainer = styled("div")(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "start",
  gap: theme.spacing(3),
}));

export const FaqPageHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "20px 24px",
  borderBottom: "1px solid #E8E8E8",
  background: "#FFF",
  width: "100%",
}));

export const FaqPageTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: "24px",
  fontWeight: 600,
}));

export const FaqBackArrowButton = styled(IconButton)({
  color: "#093F84",
  padding: 0,
  "&:hover": {
    backgroundColor: "transparent",
  },
});
