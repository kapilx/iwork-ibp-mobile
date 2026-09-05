import { Box, Button, ButtonBase, Card, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StepperShell = styled(Box)(() => ({
  background: "linear-gradient(180deg, #DCEBFA 0%, #EAF3FD 100%)",
  minHeight: "100vh",
  // paddingTop: theme.spacing(10),
  // paddingBottom: theme.spacing(4),
  paddingBottom: 0,
  display: "flex",
  flexDirection: "column",
}));

export const StepperInner = styled(Box)(() => ({
  maxWidth: "100%",
  margin: 0,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  flex: 1,
}));

export const StepperHeader = styled(Box)(({ theme }) => ({
  background:
    "linear-gradient(94.26deg, #1B5092 0%, #266AB7 36.89%, #1675BC 61.3%, #197087 109.99%)",
  // padding: theme.spacing(9),
  color: theme.palette.common.white,
  boxShadow: "0px 6px 18px rgba(13, 44, 82, 0.18)",
  marginTop: theme.spacing(12.5),
}));

export const StepperHeaderContent = styled(Box)(({theme}) => ({
  width: "100%",
  maxWidth: "1920px",
  margin: "0 auto",
  padding: theme.spacing(5, 9),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  boxSizing: "border-box",
  [theme.breakpoints.up("lg")]: {
    paddingRight: `calc(${theme.spacing(9)} + 410px)`,
  },
  [theme.breakpoints.down("lg")]: {
    padding: theme.spacing(4, 2.5),
  },
}));

export const StepperTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.regular,
  marginBottom: theme.spacing(1),
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.xl,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const StepperSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  opacity: 0.95,
}));

export const StepperTrack = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginTop: theme.spacing(3),
  marginLeft: theme.spacing(-2),
  width: "100%",
  gap: theme.spacing(0.75),
  [theme.breakpoints.between("sm", "md")]: {
    overflowX: "auto",
    overflowY: "visible",
    WebkitOverflowScrolling: "touch",
    "&::-webkit-scrollbar": { display: "none" },
    msOverflowStyle: "none",
    scrollbarWidth: "none",
    paddingBottom: theme.spacing(1),
    justifyContent: "flex-start",
    gap: theme.spacing(0.5),
  },
  "@media (max-width: 768px)": {
    overflowX: "auto",
    overflowY: "visible",
    WebkitOverflowScrolling: "touch",
    "&::-webkit-scrollbar": { display: "none" },
    msOverflowStyle: "none",
    scrollbarWidth: "none",
    paddingBottom: theme.spacing(1),
    justifyContent: "flex-start",
    gap: theme.spacing(0.5),
  },
}));

export const StepItem = styled(Box)(() => ({
  display: "flex",
  alignItems: "flex-start",
  flex: 1,
  minWidth: 0,
  flexShrink: 0,
  "&:last-of-type": {
    flex: "0 0 auto",
  },
}));

export const StepContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minWidth: 118,
  width: 118,
  flexShrink: 0,
  [theme.breakpoints.down("md")]: {
    minWidth: 110,
    width: 110,
  },
  "@media (max-width: 768px)": {
    minWidth: 100,
    width: 100,
  },
}));

export const StepConnector = styled(Box)<{ completed?: boolean }>(
  ({ completed }) => ({
    flex: 1,
    minWidth: 16,
    height: 2,
    marginTop: 26,
    marginLeft: -20,
    marginRight: -20,
    borderRadius: 999,
    background: "linear-gradient(0deg, #E8EEF6, #E8EEF6)",
    flexShrink: 1,
  })
);

export const StepNode = styled(Box)<{ active?: boolean; completed?: boolean }>(
  () => ({
    position: "relative",
    zIndex: 1,
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  })
);

export const StepIconImage = styled("img")(() => ({
  width: 48,
  height: 48,
  display: "block",
}));

export const StepLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  marginTop: theme.spacing(1.25),
  textAlign: "center",
  opacity: 0.95,
  whiteSpace: "normal",
  wordBreak: "break-word",
  maxWidth: 118,
  [theme.breakpoints.down("md")]: {
    maxWidth: 110,
    fontSize: "11px",
  },
  "@media (max-width: 768px)": {
    maxWidth: 100,
    fontSize: "11px",
  },
}));

export const FlowLayout = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 360px",
  gap: theme.spacing(3),
  alignItems: "start",
  marginTop: theme.spacing(4),
  padding: theme.spacing(4, 9),
  paddingRight: theme.spacing(20),
  paddingTop: 0,
  flex: 1,
  maxWidth: "1920px",
  margin: "0 auto",
  width: "100%",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "minmax(0, 1fr)",
  },
}));

export const SummaryDock = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$activeStep",
})<{ $activeStep?: number }>(({ theme, $activeStep = 0 }) => ({
  alignSelf: "start",
  height: "fit-content",
  marginTop: $activeStep === 0 ? "-150px" : "-230px",
  position: "sticky",
  top: theme.spacing(21.25),
  zIndex: 3,
  [theme.breakpoints.down("lg")]: {
    marginTop: 0,
    position: "relative",
    top: "auto",
    zIndex: 1,
  },
}));

export const MainCard = styled(Card, {
  shouldForwardProp: (prop) =>
    prop !== "$activeStep" && prop !== "$transparent",
})<{ $activeStep?: number; $transparent?: boolean }>(
  ({ theme, $activeStep = 0, $transparent = false }) => ({
  borderRadius: theme.spacing(2),
  padding:
    $activeStep === 0 ? theme.spacing(4, 4, 4, 0) : theme.spacing(4),
  boxShadow: $transparent ? "none" : "0px 8px 20px rgba(13, 44, 82, 0.12)",
  border: $transparent ? "none" : undefined,
  background: $transparent ? "transparent" : undefined,
  overflow: "visible",
}));

export const HospitalIntroSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  padding: theme.spacing(3.75, 9, 0),
  maxWidth: "1920px",
  margin: "0 auto",
  width: "100%",
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.down("lg")]: {
    padding: theme.spacing(3, 2, 0),
  },
}));

export const HospitalIntroTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const HospitalIntroDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: "#525252",
}));

export const SummaryCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.spacing(2),
  padding: 0,
  boxShadow: "0px 8px 20px rgba(13, 44, 82, 0.12)",
  height: "calc(100vh - 180px)",
  overflow: "hidden",
  [theme.breakpoints.down("lg")]: {
    height: "auto",
    maxHeight: "none",
  },
}));

export const SummaryTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  marginBottom: theme.spacing(1.5),
}));

export const SummarySection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.3),
}));

export const SummaryBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

export const SummaryBlockTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const SummaryLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.mediumGrey,
}));

export const SummaryValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.linkColor,
}));

export const SummaryInlineRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "145px 1fr",
  gap: theme.spacing(2),
  alignItems: "start",
}));

export const SummaryInlineLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
}));

export const SummaryInlineValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.linkColor,
  wordBreak: "break-word",
}));

export const SummaryFooter = styled(Box)(({ theme }) => ({
  marginTop: "auto",
  position: "sticky",
  bottom: 0,
  zIndex: 1,
  background: "#FFFFFF",
  paddingTop: theme.spacing(2),
  borderTop: "1px solid #E3EAF5",
  padding : "5px 20px"
}));

export const SummaryAmountRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

export const SummaryAmountLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const SummaryAmountValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.linkColor,
}));

export const HospitalSearchSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(10),
}));

export const HospitalSearchLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#1E2861B3",
}));

export const RequiredAsterisk = styled("span")(() => ({
  color: "#E53935",
}));

export const HospitalSearchHelper = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.mediumGrey,
}));

export const HospitalSearchFieldWrapper = styled(Box)(() => ({
  position: "relative",
  width: "100%",
}));

export const HospitalSearchResults = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  borderRadius: theme.spacing(1.5),
  border: "1px solid #D7E2F1",
  boxShadow: "0px 8px 20px rgba(13, 44, 82, 0.08)",
  overflow: "hidden",
}));

export const HospitalSearchResultList = styled(Box)(() => ({
  maxHeight: 280,
  overflowY: "auto",
}));

export const HospitalSearchResultItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.8, 2.2),
  cursor: "pointer",
  borderBottom: "1px solid #E9EEF6",
  transition: "background-color 0.15s ease",
  "&:hover": {
    backgroundColor: "#F4F8FC",
  },
  "&:last-child": {
    borderBottom: "none",
  },
}));

export const HospitalSearchResultName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const HospitalSearchResultMeta = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.mediumGrey,
  marginTop: theme.spacing(0.4),
}));

export const HospitalSearchEmpty = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.mediumGrey,
  padding: theme.spacing(2),
}));

export const HospitalManualAddPanel = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  border: "1px solid #E4EAF3",
  background: "#FFFFFF",
  boxShadow: "0px 4px 12px rgba(13, 44, 82, 0.05)",
  textAlign: "center",
}));

export const HospitalManualAddTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const HospitalManualAddSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.mediumGrey,
}));

export const HospitalManualAddButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.spacing(1),
  textTransform: "none",
  padding: theme.spacing(1.1, 2.5),
  backgroundColor: "#1C67B4",
  color: "#FFFFFF",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#16548F",
    boxShadow: "none",
  },
}));

export const HospitalMatchesLabel = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(2, 2.2),
  borderBottom: "1px solid #E9EEF6",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const HospitalSelectionCard = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.spacing(3),
  border: "1px solid #5BA6FF",
  background:
    "linear-gradient(180deg, rgba(242, 248, 255, 0.98) 0%, rgba(235, 244, 255, 0.98) 100%)",
  boxShadow: "0px 10px 18px rgba(13, 44, 82, 0.08)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: theme.spacing(2),
  alignItems: "center",
}));

export const HospitalSelectionCardGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(2),
  padding: theme.spacing(4, 8),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const HospitalSelectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.mediumGrey,
}));

export const HospitalSelectionValue = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  wordBreak: "break-word",
}));

export const HospitalManualFieldGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const HospitalManualActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(2),
}));

export const ClaimTypeHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  marginBottom: theme.spacing(2),
}));

export const ClaimTypeGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(2),
  padding: theme.spacing(0, 1.5),
  justifyItems: "start",
  // marginBottom: theme.spacing(5),
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    padding: 0,
    justifyItems: "stretch",
  },
}));

export const ClaimTypeCard = styled(ButtonBase)<{ selected?: boolean }>(
  ({ theme, selected }) => ({
    width: "92%",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    minHeight: 96,
    borderRadius: theme.spacing(2),
    border: selected ? "1px solid #1C67B4" : "1px solid #D7E2F1",
    background: selected
      ? "linear-gradient(92.02deg, #FFFFFF 59.73%, #B5DAF8 174.34%)"
      : theme.palette.common.white,
    boxShadow: selected
      ? "0px 6px 10px 0px #0000001A"
      : "0px 4px 10px rgba(13, 44, 82, 0.08)",
    textTransform: "none",
    color: theme.palette.text.primary,
    textAlign: "left",
    cursor: "pointer",
    justifySelf: "start",
    [theme.breakpoints.down("md")]: {
      width: "100%",
    },
    "&:hover": {
      background: selected
        ? "linear-gradient(92.02deg, #FFFFFF 59.73%, #B5DAF8 174.34%)"
        : theme.palette.background.paper,
    },
  })
);

export const PolicyDetailsBlock = styled(Box)(() => ({
  marginBottom: 0,
}));

export const PolicyDetailsSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "20px",
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#222222",
}));

export const PolicySectionSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  marginBottom: "16px",
  fontSize: "14px",
  fontWeight: theme.typography.fontWeights.regular,
  color: "#525252",
}));

export const PolicyDetailsCardsGrid = styled(Box)<{
  cardType?: "policy" | "intimateFor";
  policyCount?: number;
}>(({ theme, cardType, policyCount = 0 }) => ({
  display: "grid",
  gridTemplateColumns:
    cardType === "policy"
      ? policyCount <= 1
        ? "1fr"
        : policyCount === 2
        ? "repeat(2, minmax(0, 1fr))"
        : "repeat(3, minmax(0, 1fr))"
      : "1fr",
  gap: "16px",
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns:
      cardType === "policy"
        ? policyCount <= 1
          ? "1fr"
          : "repeat(2, minmax(0, 1fr))"
        : "1fr",
  },
  [theme.breakpoints.down(768)]: {
    gridTemplateColumns: "1fr",
  },
}));

export const SelectableDetailsCard = styled(ButtonBase)<{
  selected?: boolean;
  layoutType?: "default" | "row" | "policyRow";
}>(({ theme, selected, layoutType }) => ({
  width: "100%",
  borderRadius:
    layoutType === "row" || layoutType === "policyRow"
      ? "12px"
      : theme.spacing(2),
  border: selected ? "1.5px solid #1C67B4" : "1px solid #E5E5E5",
  background: selected
    ? "linear-gradient(92.02deg, #FFFFFF 59.73%, #DDEEFF 174.34%)"
    : theme.palette.common.white,
  boxShadow:
    layoutType === "row"
      ? "0px 5px 10px 0px #0000001A"
      : "0px 6px 12px rgba(13, 44, 82, 0.08)",
  padding:
    layoutType === "row"
      ? "25px"
      : layoutType === "policyRow"
      ? "24px"
      : "24px",
  textAlign: "left",
  alignItems:
    layoutType === "row" || layoutType === "policyRow" ? "center" : "stretch",
  justifyContent:
    layoutType === "row" || layoutType === "policyRow"
      ? "flex-start"
      : "space-between",
  display: "flex",
  flexDirection:
    layoutType === "row" || layoutType === "policyRow" ? "row" : "column",
  height: layoutType === "default" ? 205 : "auto",
  gap:
    layoutType === "row"
      ? "25px"
      : layoutType === "policyRow"
      ? "25px"
      : 0,
  transition: "all 0.15s ease",
  "&:hover": {
    borderColor: "#1C67B4",
    background: "linear-gradient(92.02deg, #FFFFFF 59.73%, #E6F2FF 174.34%)",
  },
  [theme.breakpoints.down(768)]: {
    height: "auto",
    minHeight: layoutType === "default" ? 205 : "auto",
  },
}));

export const PolicyCardHeader = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}));

export const PolicyCardIcon = styled(Box)<{ selected?: boolean }>(
  ({ selected }) => ({
    color: selected ? "#1C67B4" : "#8C97A8",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": {
      width: "24px",
      height: "24px",
    },
  })
);

export const PolicyTypeIconContainer = styled(Box)(() => ({
  width: "50px",
  height: "40px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const PolicyTypeIconImage = styled("img")(() => ({
  width: "100%",
  height: "100%",
  objectFit: "contain",
}));

export const PolicyCardBody = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
}));

export const PolicyRowBody = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

export const PolicyCardTitle = styled(Typography)(({ theme }) => ({
  fontSize: "18px",
  fontWeight: theme.typography.fontWeights.medium,
  color: "#222222",
}));

export const PolicyCardDescription = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontSize: "14px",
  fontWeight: theme.typography.fontWeights.regular,
  color: "#525252",
}));

export const DependentRowDetails = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: theme.spacing(2),
  width: "100%",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const DependentInfoBlock = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
}));

export const DependentInfoLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: "#222222",
  opacity: 0.6,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.sm,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const DependentInfoValue = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.4),
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#222222",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "unset",
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const ClaimTypeCardIcon = styled(Box)<{ selected?: boolean }>(() => ({
  borderRadius: 12,
  // background: ,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  img: {
    width: 60,
    height: 60,
  },
}));

export const StyledDiagnosisContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  padding: theme.spacing(3.75, 9, 0),
  paddingBottom: theme.spacing(4),
  maxWidth: "1920px",
  margin: "0 auto",
  width: "100%",
  [theme.breakpoints.down("lg")]: {
    padding: theme.spacing(3, 2, 0),
  },
}));

export const DiagnosisHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const DiagnosisSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: "#525252",
}));

export const ClaimTypeCardContent = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  minWidth: 0,
  gap: 16,
}));

export const ClaimTypeCardCopy = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 16,
  minWidth: 0,
}));

export const ClaimTypeCardText = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
}));

export const ClaimTypeCardRadio = styled(Box)<{ selected?: boolean }>(
  ({ selected }) => ({
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: `1.5px solid ${selected ? "#1C67B4" : "#8F96A3"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "#fff",
    "&::after": selected
      ? {
          content: '""',
          display: "block",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#1C67B4",
        }
      : {},
  })
);

export const ClaimTypeCardLabel = styled(Typography)<{ selected?: boolean }>(
  ({ theme, selected }) => ({
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    textAlign: "left",
    color: selected ? theme.palette.text.tertiary : theme.palette.text.tertiary,
  })
);

export const ClaimTypeCardDescription = styled(Typography)<{
  selected?: boolean;
}>(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.tertiary,
  textAlign: "left",
}));

export const FooterBar = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  marginTop: "auto",
  width: "100%",
  boxSizing: "border-box",
  background: "#FFFFFF",
  borderRadius: 0,
  padding: theme.spacing(2, 2.5),
  boxShadow: "0px 6px 18px rgba(13, 44, 82, 0.10)",
  position: "sticky",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 10,
}));

export const FooterBarContent = styled(Box)(() => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const FooterSpacer = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
}));

export const FooterActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const FooterButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  textTransform: "none",
  padding: theme.spacing(1.2, 2.5),
  fontWeight: theme.typography.fontWeights.medium,
  "&.MuiButton-outlined": {
    borderColor: "#093F84",
    color: "#093F84",
    backgroundColor: "#FFFFFF",
  },
  "&.MuiButton-contained": {
    backgroundColor: "#093F84",
    color: "#FFFFFF",
    boxShadow: "none",
  },
  "&.MuiButton-contained:hover": {
    backgroundColor: "#072F63",
    boxShadow: "none",
  },
  "&.MuiButton-outlined:hover": {
    borderColor: "#093F84",
    color: "#093F84",
    backgroundColor: "#FFFFFF",
  },
  "&.Mui-disabled": {
    opacity: 0.6,
  },
}));
