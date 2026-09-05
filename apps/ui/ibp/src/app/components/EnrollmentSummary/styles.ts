import { Box, styled, Typography } from "@mui/material";
import zIndex from "@mui/material/styles/zIndex";

export const ViewSummaryContainer = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(15),
}));
export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  // minHeight: "92vh",
  width: "100%",
  flexDirection: "column",
  backgroundColor: theme.palette.background.paper,
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(6),
  padding: theme.spacing(10),
  paddingTop: theme.spacing(7.5),
  paddingBottom: theme.spacing(11.5),
  borderRadius: "16px",
  margin: "40px auto",
  boxShadow: `0px -20px 54px 0px ${theme.palette.background.DarkOrange}`,
  maxWidth: "946px",
}));

export const BannerContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const BannerBox = styled(Box)(({ theme }) => ({
  display: "flex",
  background: `linear-gradient(14.2deg, ${theme.palette.gradients.lightYellow.start} -22.62%, ${theme.palette.gradients.lightYellow.medium} 80.13%), ${theme.palette.gradients.lightYellow.end}`,
  position: "relative",
  overflow: "hidden",
  borderRadius: theme.spacing(4),
  gap: theme.spacing(10),
  padding: theme.spacing(6, 4),
  boxShadow: `0px 16px 24px 0px ${theme.palette.background.lightOrange}`,
  minHeight: "117px",
}));

export const BannerBackGround = styled("img")(({ theme }) => ({
  position: "absolute",
  bottom: "-4px",
  left: "-4px",
  width: "101%",
  opacity: 0.4,
}));

export const CommonBannerContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(10),
}));

export const SubBannerContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  // zIndex: zIndex.drawer + 1,
}));

export const BannerMainBackground = styled("img")(({ theme }) => ({
  position: "absolute",
  left: "80px",
  bottom: 0,
  opacity: 0.4,
  width: "75%",
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(7.5),
  height: "100%",
}));

export const CommonSummaryContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));
export const SummaryHeading = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xl,
  fontFamily: theme.typography.fontFamily,
  margin: "0px",
}));
export const Holder = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  gap: theme.spacing(7.5),
}));

export const ValueHolder = styled(Box)(({ theme }) => ({
  width: "67%",
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(12),
}));

export const CommonHolder = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  minWidth: theme.spacing(30),
}));

export const SubSummaryContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${theme.palette.neutral.light}`,
  borderRadius: theme.spacing(4),
  padding: theme.spacing(7.5, 5, 5.5, 5),
}));

export const MembersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  width: "78%",
  marginLeft: "auto",
  gap: theme.spacing(3),
  flexWrap: "wrap",
}));

export const SubMembersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  height: "100%",
  width: "100%",
  gap: theme.spacing(5),
}));

export const HeaderTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xll,
  fontFamily: theme.typography.fontFamily,
  marginBottom: theme.spacing(4),
}));

export const BannerTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  fontFamily: theme.typography.fontFamily,
}));

export const StyledSpan = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.border.secondary,
  marginLeft: theme.spacing(3),
  cursor: "pointer !important",
  position: "relative",
  zIndex: 1,
  userSelect: "none",
  display: "inline-block",
  "&:hover": {
    color: theme.palette.primary.main,
    cursor: "pointer !important",
  },
}));

export const BannerLabelTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  fontFamily: theme.typography.fontFamily,
}));

export const BannerNumberTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.xll,
  fontFamily: theme.typography.fontFamily,
}));

export const PlanTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.ternary,
  width: "20%",
}));

export const CommonLabelTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.fadeGrey,
}));

export const CommonNumberTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xl,
  lineHeight: theme.spacing(6),
  fontFamily: theme.typography.fontFamily,
}));

export const VerticalDivider = styled(Box)(({ theme }) => ({
  width: "1px",
  height: "95%",
  backgroundColor: theme.palette.text.ternary,
  marginLeft: theme.spacing(4),
  margintRight: theme.spacing(4),
}));

export const HoriZontalDivider = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "1px",
  backgroundColor: theme.palette.border.gray,
  marginTop: theme.spacing(5),
  marginBottom: theme.spacing(5),
}));

export const SubBannerWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(12.5),
}));

export const ChipsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2.5),
}));

export const BannerContainerDetails = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2.5, 5),
}));

export const SummaryPlans = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const DeclarationSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.border.gray}`,
  paddingBottom: theme.spacing(4),
  marginRight: "auto",
}));

export const DeclarationTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xl,
  fontFamily: theme.typography.fontFamily,
}));

export const DeclarationContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const DeclarationPoint = styled("label")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "flex-start",
}));

export const DeclarationCheckbox = styled("input")(({ theme }) => ({
  appearance: "none",
  width: "17px",
  height: "17px",
  minWidth: "17px",
  minHeight: "17px",
  margin: theme.spacing(0),
  marginTop: theme.spacing(1),
  border: `1px solid ${theme.palette.text.LightDark}`,
  borderRadius: "2px",
  cursor: "pointer",
  position: "relative",
  backgroundColor: "transparent",
  flexShrink: 0,

  "&:checked": {
    backgroundColor: "transparent",

    "&::after": {
      content: '""',
      position: "absolute",
      left: "5px",
      top: "1px",
      width: "5px",
      height: "10px",
      border: `solid ${theme.palette.text.primary}`,
      borderWidth: "0 2px 2px 0",
      transform: "rotate(45deg)",
    },
  },
}));

export const DeclarationPointLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.LightDark,
  lineHeight: "24px",
}));
