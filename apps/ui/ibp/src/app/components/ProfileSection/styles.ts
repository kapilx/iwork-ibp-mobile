import { Box, Button, IconButton, styled, Typography } from "@mui/material";

export const ProfileContainer = styled(Box)(({ theme }) => ({
  display: "flex", 
  flexDirection: "column", 
  gap: theme.spacing(5)
}));

export const ProfileSectionContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  padding: theme.spacing(8, 6, 8, 8),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(11.5),
  width: "100%",
  boxShadow: "0px 10px 24px 0px #0000001A",
  borderRadius: theme.spacing(3),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4, 4, 6, 4),
    gap: theme.spacing(6),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
    gap: theme.spacing(4),
    borderRadius: theme.spacing(2),
  },
}));

export const DependentsSectionContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  padding: theme.spacing(8, 6, 8, 6),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(11.5),
  width: "100%",
  boxShadow: "0px 10px 24px 0px #0000001A",
  borderRadius: theme.spacing(3),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4),
    gap: theme.spacing(6),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
    gap: theme.spacing(4),
    borderRadius: theme.spacing(2),
  },
}))

export const ProfileHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: theme.spacing(2),
  },
}));

export const ProfileHeaderLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const ProfileHeaderActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  flexWrap: "wrap",
  marginLeft: "auto",
  marginRight:"35px",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    justifyContent: "flex-end",
  },
}));

export const ProfileAvatar = styled(Box)(({ theme }) => ({
  width: 46,
  height: 46,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid #5C5C5C",
  color: theme.palette.text.tertiary,
  backgroundColor: theme.palette.common.white,
  "& svg": {
    fontSize: 28,
  },
}));

export const ProfileTitleBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const ProfileNameRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const BackButton = styled(IconButton)(() => ({
  padding: 8,
  color: "#093F84",
  "&:hover": {
    backgroundColor: "transparent",
  },
}));

export const ProfileName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.tertiary,
  lineHeight: "100%",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
}));

export const ProfileRole = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: `${theme.palette.text.tertiary}99`,
  [theme.breakpoints.down("md")]: {
    fontSize: "15px",
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "14px",
  },
}));

export const ChangePasswordButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.azurBlue,
  borderRadius: theme.shape.borderRadii.small,
  padding: theme.spacing(0.8, 2),
  boxShadow: "none",
  backgroundColor: theme.palette.common.white,
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    boxShadow: "none",
  },
  [theme.breakpoints.down("md")]: {
    fontSize: "13px",
    padding: theme.spacing(0.6, 1.5),
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "12px",
    padding: theme.spacing(0.5, 1.2),
    width: "100%",
  },
}));

export const LogoutButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.error.main,
  borderRadius: theme.shape.borderRadii.small,
  padding: theme.spacing(0.8, 2),
  boxShadow: "none",
  backgroundColor: theme.palette.common.white,
  border: `1px solid ${theme.palette.error.main}`,
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: "transparent",
    boxShadow: "none",
  },
  [theme.breakpoints.down("md")]: {
    fontSize: "13px",
    padding: theme.spacing(0.6, 1.5),
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "12px",
    padding: theme.spacing(0.5, 1.2),
  },
}));

export const ProfileMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingRight: theme.spacing(12),
  [theme.breakpoints.between("sm", "lg")]: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    paddingRight: 0,
    gap: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    paddingRight: 0,
    gap: theme.spacing(3, 2),
  },
  [theme.breakpoints.down("xs")]: {
    gridTemplateColumns: "1fr",
  },
  // 360–420px: single column
  "@media (max-width: 520px)": {
    gridTemplateColumns: "1fr",
    gap: theme.spacing(4),
  },
}));

export const ProfileMetaItem = styled(Box)(({ theme }) => ({
  display: "flex",
  columnGap: theme.spacing(4.5),
  alignItems: "center",
  [theme.breakpoints.down("lg")]: {
    columnGap: theme.spacing(3),
  },
  [theme.breakpoints.down("md")]: {
    columnGap: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    columnGap: theme.spacing(1.5),
  },
}));

export const ProfileIcon = styled("img")(({ theme }) => ({
  width: 46,
  height: 46,
  borderRadius: theme.shape.borderRadii.small,
  display: "block",
  backgroundColor: theme.palette.common.white,
  boxSizing: "border-box",
  flexShrink: 0,
  [theme.breakpoints.down("md")]: {
    width: 34,
    height: 38,
  },
  [theme.breakpoints.down("sm")]: {
    width: 30,
    height: 34,
  },
}));

export const ProfileMetaLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: `${theme.palette.text.tertiary}99`,
  gridColumn: "2 / -1",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  [theme.breakpoints.down("md")]: {
    fontSize: "13px",
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "12px",
  },
  "@media (max-width: 420px)": {
    whiteSpace: "normal",
  },
}));

export const ProfileMetaValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  gridColumn: "2 / -1",
  wordBreak: "break-word",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.md,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.sm,
  },
  "@media (max-width: 420px)": {
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
}));

export const DependantsSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  // overflowX: "auto",
}));

export const DependantsSectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(2.5),
  borderBottom: `3px solid ${theme.palette.border.pistachio}`,
}));

export const DependantsSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.md,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const AddDependentActionButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  borderRadius: theme.shape.borderRadii.small,
  padding: theme.spacing(0.8, 2),
  boxShadow: "none",
}));

export const DependentsFormWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(8),
  display: "flex",
  flexDirection: "column",
  // minHeight: "340px",
}));

export const DependentsFormActions = styled(Box)(({ theme }) => ({
  marginTop: "auto",
  paddingTop: theme.spacing(2.5),
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(1.5),
}));

export const DependentsEmptyText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(3),
  fontSize: theme.typography.fontSizes.sm,
  color: `${theme.palette.text.tertiary}B3`,
}));

export const DependantsTableWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  overflowX: "auto",
}));

export const DependantsTableHeader = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "3fr 2fr 2fr 2fr 1fr",
  gap: theme.spacing(2),
  padding: theme.spacing(5, 0, 2),
  borderBottom: "1px solid #0000001A",
  minWidth: "480px",
}));

export const DependantsTableHeaderCell = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  opacity: 0.7,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

export const DependantsTableRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "3fr 2fr 2fr 2fr 1fr",
  gap: theme.spacing(2),
  padding: theme.spacing(3, 0),
  alignItems: "center",
  borderBottom: `1px solid ${theme.palette.divider}`,
  minWidth: "480px",
  "&:last-child": {
    borderBottom: "none",
  },
}));

export const DependantsTableCell = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

export const DependantsActionButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  "& img": {
    width: 24,
    height: 24,
  },
  // borderRadius: theme.shape.borderRadii.small,
  // border: 1px solid ${theme.palette.border.lightGrey},
  // padding: theme.spacing(0.6),
  "&.Mui-disabled": {
    opacity: 0.4,
    cursor: "not-allowed",
    pointerEvents: "auto", // keeps cursor visible even when disabled
    "& img": {
      filter: "grayscale(100%)",
    },
  },
}));

export const DependantsActionsGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));
