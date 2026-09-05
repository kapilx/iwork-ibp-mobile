import { styled } from "@mui/material/styles";
import { Box, ButtonBase, Typography } from "@mui/material";

export const ActivityLogContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(5),
  boxShadow: "0px 5px 10px 0px #2626261A",
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.common.white,
  padding: theme.spacing(8, 6),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4),
    borderRadius: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3, 2),
    borderRadius: theme.spacing(2),
  },
}));

export const ActivityLogHeader = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  marginBottom: theme.spacing(6),
  borderBottom: `3px solid ${theme.palette.border.pistachio}`,
  paddingBottom: theme.spacing(2),

  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.md,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
    marginBottom: theme.spacing(4),
  },
}));

export const ActivityList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
    padding: `0 ${theme.spacing(1)}`,
  },
}));

export const ActivityItem = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4),
  position: "relative",
  transition: "background-color 0.2s ease",
    padding: theme.spacing(4.75, 0, 4.75, 8.25),
  "&:hover": {
    backgroundColor: theme.palette.background.azurBlue,
  },
  "&:hover .download-button": {
    opacity: 1,
    visibility: "visible",
  },
  "&:hover .preview-button": {
    opacity: 1,
    visibility: "visible",
  },
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(3),
    padding: theme.spacing(2.5),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2.5),
    padding: theme.spacing(2),
    flexWrap: "wrap",
  },
}));

export const DateLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.fadeGrey,
  minWidth: "90px",
  alignSelf: "center",
  lineHeight: "100%",
  [theme.breakpoints.down("md")]: {
    minWidth: "80px",
    fontSize: theme.typography.fontSizes.xs,
  },
  [theme.breakpoints.down("sm")]: {
    minWidth: "70px",
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const IconWrapper = styled(Box)(({ theme }) => ({
  width: "46px",
  height: "46px",
  borderRadius: "50%",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0px 4px 14px 0 #00000017",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  "& svg": {
    width: "24px",
    height: "24px",
  },
  [theme.breakpoints.down("sm")]: {
    width: "36px",
    height: "36px",
    "& svg": {
      width: "20px",
      height: "20px",
    },
  },
}));

export const ActivityContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  // minWidth: 0,
  paddingRight: theme.spacing(30),
  [theme.breakpoints.down("md")]: {
    paddingRight: theme.spacing(25),
  },
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1.5),
    paddingRight: "0",
  },
}));

export const ActivityTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
  lineHeight: "100%",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.sm,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const ActivityDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.fadeGrey,
  lineHeight: "100%",
  wordBreak: "break-word",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const DownloadButton = styled(Box)(({ theme }) => ({
  position: "absolute",
  right: "2%",
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  cursor: "pointer",
  color: theme.palette.text.lightBlue,
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  opacity: 0,
  visibility: "hidden",
  transition: "opacity 0.2s ease, visibility 0.2s ease",
  "&:hover": {
    textDecoration: "underline",
  },
  "& img": {
    width: "16px",
    height: "16px",
  },
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.sm,
    gap: theme.spacing(1),
    "& img": {
      width: "14px",
      height: "14px",
    },
  },
  [theme.breakpoints.down("sm")]: {
    position: "static",
    transform: "none",
    marginTop: theme.spacing(2),
    marginLeft: "auto",
    fontSize: theme.typography.fontSizes.xss,
  },
}));

export const ActivityActions = styled(Box)(({ theme }) => ({
  position: "absolute",
  right: "2%",
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    position: "static",
    transform: "none",
    width: "100%",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
  },
}));

export const PreviewButton = styled(ButtonBase)(({ theme }) => ({
  // width: "40px",
  // height: "40px",
  // borderRadius: "50%",
  // border: `1px solid ${theme.palette.primary.main}`,
  // backgroundColor: theme.palette.common.white,
  cursor: "pointer",
  opacity: 0,
  visibility: "hidden",
  transition:
    "opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
  "& img": {
    width: "30px",
    height: "30px",
  },
  "&:hover": {
    transform: "scale(1.06)",
    backgroundColor: "transparent",
    transition:
    "opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
  },
  [theme.breakpoints.down("sm")]: {
    opacity: 1,
    visibility: "visible",
    width: "34px",
    height: "34px",
    "& img": {
      width: "16px",
      height: "16px",
    },
  },
}));

export const PreviewDialogHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 3, 0),
}));

export const PreviewDialogTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
}));

export const PreviewDialogSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
}));

export const PreviewDialogBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  padding: theme.spacing(3),
}));

export const PreviewLoadingState = styled(Box)(({ theme }) => ({
  minHeight: "260px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const HtmlPreviewFrame = styled("iframe")(({ theme }) => ({
  width: "100%",
  minHeight: "70vh",
  border: `1px solid ${theme.palette.border.lightGray}`,
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.common.white,
}));

export const PreviewSection = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.lightGray}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2.5),
  backgroundColor: theme.palette.background.paper,
}));

export const PreviewSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  marginBottom: theme.spacing(1.5),
}));

export const PreviewPolicyList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

export const PreviewPolicyItem = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 0),
  borderBottom: `1px solid ${theme.palette.border.lightGray}`,
  "&:last-child": {
    borderBottom: "none",
    paddingBottom: 0,
  },
}));

export const PreviewPolicyName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
}));

export const PreviewPolicyMeta = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.fadeGrey,
  textAlign: "right",
}));

export const PreviewMetaGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(120px, 160px) 1fr",
  gap: theme.spacing(1.5, 2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const PreviewMetaLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
}));

export const PreviewMetaValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.fadeGrey,
  wordBreak: "break-word",
}));
