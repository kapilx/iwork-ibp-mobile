import { Box, styled, Typography } from "@mui/material";
import { ibpTheme as theme } from "@ui/ui-lib";
import CommonButton from "../Button";

export const FooterContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "100%",
  boxShadow: theme.shadows[18],
  justifySelf: "anchor-center",
  marginLeft: "auto",
  marginRight: "auto",
  padding: theme.spacing(5),
  paddingRight: theme.spacing(3.75),
  paddingLeft: theme.spacing(3.75),
  marginTop: theme.spacing(34),
  border: `1px solid ${theme.palette.border.secondary}`,
  borderRadius: theme.spacing(4),
  height: "calc(100vh - 100px)",
  overflow: "auto",
  alignItems: "flex-start",
  background: "white",
  zIndex: 1,

  // Hide scrollbars correctly in Emotion
  "&::-webkit-scrollbar": {
    display: "none",
  },
  msOverflowStyle: "none",
  scrollbarWidth: "none",
}));

export const LabelValueHolder = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  columnGap: theme.spacing(2),
}));

export const LabelValueContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(6),
}));

export const ButtonContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(3),
  alignItems: "center",
  "@media (min-width: 360px) and (max-width: 768px)": {
    width: "100%",
    gap: theme.spacing(1.5),
    flexWrap: "wrap",
  },
}));

export const FooterNumberTypography = styled(Typography)(() => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xl,
}));

export const FooterLabelTypography = styled(Typography)(() => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.LightDark,
}));

export const StyledRightContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  width: "390px",
  maxWidth: "390px",
  minWidth: "390px",
  flexShrink: 0,
  marginRight: 0,
  position: "sticky",
  top: "75px",
  right: "30px",
  alignSelf: "flex-start",
  maxHeight: "calc(100vh - 230px)",
  marginBottom: "20px",
  borderRadius: theme.spacing(3),
  "@media (max-width: 1200px)": {
    width: "100%",
    maxWidth: "100%",
    minWidth: "100%",
    position: "relative",
    top: "auto",
    maxHeight: "none",
    right: "0",
  },
  // Reserve space for the collapsed Quick Links rail (48px) on small screens
  "@media (max-width: 599px)": {
    paddingRight: "52px",
  },
  "@media (max-width: 360px)": {
    paddingRight: "52px",
  },
}));

export const StyledImage = styled("img")(({ theme }) => ({
  width: "100%",
  maxWidth: "100px",
  height: "121px",
  marginTop: theme.spacing(-12.5),
}));

export const FooterBanner = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(4),
  width: "100%",
  padding: `${theme.spacing(3.75)} ${theme.spacing(3)} ${theme.spacing(3.75)} ${theme.spacing(8)} !important`,
  paddingLeft: theme.spacing(0),
  boxShadow: "0px 0px 20px 0px #0000002E",
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  "@media (min-width: 360px) and (max-width: 768px)": {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(1.5),
    padding: `${theme.spacing(2)} ${theme.spacing(2)} !important`,
    borderRadius: 0,
    boxShadow: "none",
  },
}));

export const FooterBannerLeft = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flex: 1,
}));

export const FooterBannerLeftContent = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
}));

export const FooterBannerLeftContentTitle = styled(Box)(({ theme }) => ({
  margin: 0,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.lg,
  "@media (min-width: 360px) and (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const FooterBannerLeftContentSubtitle = styled(Box)(({ theme }) => ({
  margin: 0,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.lg,
  "@media (min-width: 360px) and (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const ContinueButton = styled(CommonButton)(({ theme }) => ({
  background: "#093F84 !important",
  borderRadius: theme.spacing(1.5),
  minWidth: "187px",
  "&.Mui-disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  "@media (min-width: 360px) and (max-width: 768px)": {
    minWidth: "unset",
    flex: "1 1 auto",
    fontSize: "13px",
  },
}));

export const CancleCommonButton = styled(CommonButton)(({ theme }) => ({
  color: "#093F84 !important",
  border: `1px solid #093F84`,
  borderRadius: theme.spacing(1.5),
  "@media (min-width: 360px) and (max-width: 768px)": {
    minWidth: "unset",
    flex: "1 1 auto",
    fontSize: "13px",
  },
}));
