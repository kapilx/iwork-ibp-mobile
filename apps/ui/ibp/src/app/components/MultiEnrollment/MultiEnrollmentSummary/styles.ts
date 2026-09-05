import { Box, styled, Typography } from "@mui/material";
import { flexWrap, justifyContent } from "@mui/system";

export const PolicyPeriodText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.regular,
  color: "#222",
  marginBottom: theme.spacing(2),
  "& strong": {
    fontWeight: theme.typography.fontWeights.semiBold,
  },
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const ViewSummaryContainer = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(13.25),
  paddingBottom: theme.spacing(20),
  width: "100%",
  "@media (min-width: 360px) and (max-width: 420px)": {
    paddingBottom: theme.spacing(30),
  },
}));
export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  flexDirection: "column",
  backgroundColor: theme.palette.background.default,
  alignItems: "center",
  gap: theme.spacing(6),
  // padding: theme.spacing(10),
  // paddingTop: theme.spacing(7.5),
  paddingBottom: theme.spacing(6),
  borderRadius: "16px",
  // margin: "40px auto",
  // boxShadow: `0px -20px 54px 0px ${theme.palette.background.DarkOrange}`,
  // maxWidth: "1920px",
  // margin: "0 auto",
}));

export const BannerContainer = styled(Box)(() => ({
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

export const BannerBackGround = styled("img")(() => ({
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

export const SubBannerContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
}));

export const BannerMainBackground = styled("img")(() => ({
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
  gap: theme.spacing(5),
  height: "100%",
}));

export const SelectedPlansWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  [theme.breakpoints.between("sm", "md")]: {
    padding: theme.spacing(0, 3),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 2),
  },
}));

export const SummarySectionsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

const sectionBorderColor: Record<string, string> = {
  compulsory: "#EC6C27",
  optional: "#E9C945",
  flex: "#27A62C",
};

export const SummarySectionContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded" && prop !== "sectionType",
})<{ isExpanded?: boolean; sectionType: "compulsory" | "optional" | "flex" }>(
  ({ isExpanded, sectionType }) => ({
    boxShadow: "0px 8px 24px 0px rgba(38, 38, 38, 0.14)",
    borderRadius: "12px",
    borderStyle: "solid",
    borderColor: sectionBorderColor[sectionType] ?? "#E9C945",
    borderWidth: isExpanded ? "4px 2px 2px 2px" : "1px",
    background: "#FFF",
    transition: "border-width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  }),
);

export const SummarySectionAccordionWrapper = styled(Box)(({ theme }) => ({
  borderRadius: "12px !important",
  padding: theme.spacing(7.5, 5),
  backgroundColor: theme.palette.background.paper,
  boxShadow: "none",
  [theme.breakpoints.between("sm", "md")]: {
    padding: theme.spacing(5, 3),
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(3, 2),
  },
}));

export const SummarySectionAccordionHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded?: boolean }>(({ theme, isExpanded }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  paddingBottom: isExpanded ? theme.spacing(4) : 0,
  transition: "padding-bottom 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
}));

export const SummarySectionHeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3.5),
}));

const sectionIconBackground: Record<string, string> = {
  compulsory: "#F9F4EF",
  optional: "#F9F4EF",
  flex: "#E8F7E8",
};

export const SummarySectionIconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "sectionType",
})<{ sectionType?: "compulsory" | "optional" | "flex" }>(({ sectionType }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "56px",
  height: "56px",
  borderRadius: "14px",
  background: sectionIconBackground[sectionType ?? "optional"] ?? "#F9F4EF",
  flexShrink: 0,
}));

export const SummarySectionIcon = styled("img")({
  width: "24px",
  height: "24px",
});

export const SummarySectionText = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const SummarySectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: "#333",
  fontSize: "28px",
  [theme.breakpoints.down("md")]: {
    fontSize: "22px",
  },
  "@media (max-width: 768px)": {
    fontSize: "18px",
  },
}));

export const SummarySectionSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.tertiary,
  fontSize: theme.typography.fontSizes.md,
}));

export const SummarySectionArrow = styled("img", {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{ expanded?: boolean }>(({ expanded }) => ({
  width: "20px",
  height: "20px",
  transition: "transform 0.3s",
  transform: expanded ? "rotate(-180deg)" : "rotate(0deg)",
}));

export const SummarySectionAccordionContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded?: boolean }>(({ theme, isExpanded }) => ({
  display: "grid",
  gridTemplateRows: isExpanded ? "1fr" : "0fr",
  transition: "grid-template-rows 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",
  "& > div": {
    overflow: "hidden",
    minHeight: 0,
  },
}));

export const SummarySectionAccordionContentInner = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded?: boolean }>(({ theme, isExpanded }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  minHeight: 0,
  opacity: isExpanded ? 1 : 0,
  transition: "opacity 0.5s ease-in-out",
}));

export const CommonSummaryContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(7),
}));
export const SummaryHeading = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xl,
  fontFamily: theme.typography.fontFamily,
  margin: "0px",
  color: theme.palette.text.LightDark,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
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
  gap: theme.spacing(6),
}));

export const CommonHolder = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  minWidth: theme.spacing(30),
}));

export const PolicyPlanContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.neutral.light}`,
  borderRadius: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

export const SubSummaryContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(7.5, 5, 5.5, 5),
  [theme.breakpoints.between("sm", "md")]: {
    padding: theme.spacing(5, 3, 4, 3),
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(3, 2, 3, 2),
  },
}));

export const MembersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  width: "78%",
  marginLeft: "auto",
  gap: theme.spacing(3),
  flexWrap: "wrap",
  marginTop: theme.spacing(4),
}));

export const SubMembersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  width: "100%",
  gap: theme.spacing(3),
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "#FFF",
  padding: theme.spacing(3),
  zIndex: 1000,
  boxShadow: "0px -2px 10px 0px rgba(0, 0, 0, 0.08)",
  "& > div": {
    maxWidth: "1920px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(3),
    "@media (max-width: 768px)": {
      gap: theme.spacing(2),
    },
    "@media (min-width: 360px) and (max-width: 420px)": {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "auto auto",
      gap: theme.spacing(1.5),
      padding: 0,
      "& > *:last-child": {
        gridColumn: "1 / -1",
        width: "100%",
      },
    },
  },
}));

export const HeaderTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xl,
  fontFamily: theme.typography.fontFamily,
  marginBottom: theme.spacing(4),
  color: theme.palette.text.LightDark,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const BannerTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.neutral.dark,
}));

export const StyledSpan = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.Deeporange,
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
  color: theme.palette.neutral.dark,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
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
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
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

export const SummaryPlans = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
}));

export const DeclarationSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
  marginTop: theme.spacing(3),
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  [theme.breakpoints.between("sm", "md")]: {
    padding: theme.spacing(0, 3),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 2),
  },
  "@media (max-width: 420px)": {
    padding: theme.spacing(0, 1.5),
    gap: theme.spacing(2),
  },
}));

export const DeclarationTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.md,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(1),
}));

export const DeclarationHelperText = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  fontFamily: theme.typography.fontFamily,
  fontStyle: "italic",
  color: theme.palette.text.grey,
  marginLeft: theme.spacing(0.5),
}));

export const DeclarationContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
}));

export const DeclarationPoint = styled("label")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  alignItems: "flex-start",
  cursor: "pointer",
  width: "100%",
  minWidth: 0,
}));

export const DeclarationCheckbox = styled("input")(({ theme }) => ({
  appearance: "none",
  width: "20px",
  height: "20px",
  minWidth: "20px",
  minHeight: "20px",
  margin: theme.spacing(0),
  marginTop: "2px",
  border: `1px solid ${theme.palette.text.tertiary}`,
  borderRadius: "4px",
  cursor: "pointer",
  position: "relative",
  backgroundColor: "transparent",
  flexShrink: 0,
  transition: "all 0.2s ease",

  "&:checked": {
    backgroundColor: theme.palette.background.buttonbackground,

    "&::after": {
      content: '""',
      position: "absolute",
      left: "6px",
      top: "2px",
      width: "5px",
      height: "10px",
      border: "solid white",
      borderWidth: "0 2px 2px 0",
      transform: "rotate(45deg)",
    },
  },

  "&:hover": {
    borderColor: theme.palette.primary.dark,
  },
}));

export const DeclarationPointLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.LightDark,
  lineHeight: "22px",
  wordBreak: "break-word",
  overflowWrap: "break-word",
  minWidth: 0,
  flex: 1,
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.sm,
    lineHeight: "20px",
  },
  "@media (max-width: 420px)": {
    fontSize: "13px",
    lineHeight: "19px",
  },
}));


export const SummaryContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const PlanCard = styled(Box)<{ borderGradient?: string }>(
  ({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(4, 5),
    gap: theme.spacing(4),
    backgroundColor: theme.palette.common.white,
    boxShadow: "0 5px 10px 0 rgba(38, 38, 38, 0.08)",
    borderRadius: theme.spacing(3),
    border: "1px solid #ECECEC",
  }),
);

export const Separator = styled("img")(({ theme }) => ({
    height: "34px",
    margin: theme.spacing(0, 5.5),
}));

export const StyledPolicyCardWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  width: "100%",
}));
export const PolicyHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2.5),
}));

export const PolicyIcon = styled(Box)<{ gradient?: string }>(
  ({ theme, gradient }) => ({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.palette.common.black,
    flexShrink: 0,
    background:
      gradient || "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)",
  }),
);

export const PolicyTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: "26px",
  lineHeight: 1.2,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.primary,
  [theme.breakpoints.down("md")]: {
    fontSize: "22px",
  },
  "@media (max-width: 768px)": {
    fontSize: "18px",
  },
}));

export const PlanInfoSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const PlanInfoGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 0,
  marginBottom: theme.spacing(0),
  flexWrap: "wrap",
}));

export const InfoColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  flex: "0 0 auto",
  minWidth: "120px",
}));

export const InfoValue = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.lg,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.tertiary,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.md,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const InfoLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  order: -1,
}));

export const MembersCoveredSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const MembersLabel = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));
