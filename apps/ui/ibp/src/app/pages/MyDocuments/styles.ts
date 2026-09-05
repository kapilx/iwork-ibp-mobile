import { Box, Typography, Button, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import BottomIllustrationImage from "../../assets/pngs/no-claims-background-image.png";

// ─── Banner ───────────────────────────────────────────────────────────────────

export const BannerWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  background: "linear-gradient(135deg, #093F84 0%, #1A6BB5 100%)",
  padding: theme.spacing(20, 6, 6),
  marginBottom: theme.spacing(0),
  "@media (max-width: 768px)": {
    padding: theme.spacing(14, 2.5, 4),
  },
}));

export const BannerDocumentHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#FFFFFF",
  marginBottom: theme.spacing(1),
}));

export const BannerDocumentSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: "rgba(255, 255, 255, 0.8)",
}));

export const BannerSearchBar = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2.5),
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(5),
}));

export const PageRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  backgroundColor: theme.palette.background.default,
}));

export const MyDocumentsContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "showBottomIllustration",
})<{ showBottomIllustration?: boolean }>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  padding: theme.spacing(5, 6, 22.5),
  backgroundColor: theme.palette.background.default,
  border: "0px",
  width: "93%",
  maxWidth: "1920px",
  margin: "0 auto",
  boxSizing: "border-box",
  "@media (max-width: 768px)": {
    padding: theme.spacing(3, 1.5, 10),
    gap: theme.spacing(3),
  },
}));

export const BottomIllustration = styled("div")(() => ({
  width: "100%",
  minHeight: "300px",
  backgroundImage: `url(${BottomIllustrationImage})`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center top",
  backgroundSize: "min(720px, 78%) auto",
  pointerEvents: "none",
  marginTop:"20px"
}));
export const DocumentSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
}));
export const DocumentHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(2.5),
}));
export const HeadingBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const HeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: theme.spacing(22.5),
}));

export const FiltersRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(1.5, 0),
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

export const ToolbarGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ToolbarChip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.75, 1.5),
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.secondary,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const TableWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  height: "62vh",
}));

export const NameCellContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const TabsSection = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  padding: theme.spacing(1.5, 2),
  border: `1px solid ${theme.palette.divider}`,
  height: "80vh",
}));
export const SubTabsSection = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1.5, 2),
  marginTop: theme.spacing(2),
}));
export const CustomTabsNoDataBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.primary,
  width: "100%",
  height: "calc(100vh - 370px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  "& img": {
    maxWidth: "565px",
  },
}));

export const CustomTabsNoDataText = styled("div")(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginTop: theme.spacing(5),
}));

export const PolicyCardsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  padding: 0,
  width : "100%",
}));

export const PolicyCardsGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(9),
  flexWrap: "wrap",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    gap: theme.spacing(3),
  },
}));

export const ModalHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(3),
  width: "100%",
  padding: theme.spacing(2, 3),
}));

export const ModalTitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  flex: 1,
}));

export const ModalTitleContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const ModalHeadingIcon = styled("img")(({ theme }) => ({
  width: theme.spacing(6),
  height: theme.spacing(6),
  flexShrink: 0,
}));

export const ModalTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

export const ModalMetadataRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4),
}));

export const ModalMetadataItem = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.secondary,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ModalMetadataLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: "#696565",
  fontWeight: 400,
}));

export const ModalMetadataValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  fontWeight: 500,
}));

export const ModalContentWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: 0,
  width: "100%",
  backgroundColor: "#F6F6F6",
}));

export const ModalFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  rowGap: theme.spacing(1.5),
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  width: "100%",
  boxSizing: "border-box",
  "@media (max-width: 600px)": {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

export const ModalFooterLeftSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  "@media (max-width: 600px)": {
    width: "100%",
    justifyContent: "space-between",
  },
}));

export const ModalFooterRightSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  "@media (max-width: 600px)": {
    width: "100%",
    justifyContent: "flex-end",
  },
}));

export const ZoomButton = styled(Button)(() => ({
  color: "#2E2E2E",
  borderColor: "#E1E1E1",
  textTransform: "none",
  fontWeight: 400,
  "&:hover": {
    borderColor: "#E1E1E1",
    backgroundColor: "rgba(225, 225, 225, 0.1)",
  },
  "&.Mui-disabled": {
    color: "rgba(46, 46, 46, 0.5)",
    borderColor: "#E1E1E1",
  },
}));

export const DownloadButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#093F84",
  color: "#FFFFFF",
  fontWeight: 400,
  paddingLeft: theme.spacing(6),
  paddingRight: theme.spacing(6),
  borderRadius: theme.spacing(1.5),
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#072d5f",
  },
  "@media (max-width: 600px)": {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
}));

// ─── My Documents – search, filters, sections ────────────────────────────────

export const SearchBarContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5, 2.5),
  gap: theme.spacing(1.5),
  width: "100%",
  boxSizing: "border-box",
}));

export const FilterBarRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 0),
}));

export const FilterGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const ViewToggleBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ViewToggleText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ theme, active }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: active
    ? theme.typography.fontWeights.semiBold
    : theme.typography.fontWeights.regular,
  color: active ? theme.palette.text.primary : theme.palette.text.secondary,
  cursor: "pointer",
  userSelect: "none",
}));

// Section card (wraps section header + cards grid)
export const SectionCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(4, 5),
}));

export const SectionHeaderRow = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
}));

export const SectionTitleText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  '@media (max-width: 420px) and (min-width: 360px)': {
    fontSize: '16px',
  },
}));

export const SectionTitleGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.25),
}));

export const SectionIcon = styled("img")(() => ({
  width: "24px",
  height: "24px",
  objectFit: "contain",
  flexShrink: 0,
}));

export const SectionCountBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "22px",
  height: "22px",
  padding: theme.spacing(0, 0.75),
  borderRadius: "11px",
  backgroundColor: "#EEF2FF",
  color: "#093F84",
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const SelectAllButton = styled(Button)(({ theme }) => ({
  color: "#093F84",
  backgroundColor: "transparent",
  border: "none",
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  textTransform: "none",
  padding: theme.spacing(0.5, 0),
  minWidth: "auto",
  "&:hover": {
    backgroundColor: "transparent",
    textDecoration: "underline",
  },
}));

export const DownloadAllButton = styled(Button)(({ theme }) => ({
  color: "#093F84",
  backgroundColor: "transparent",
  border: "none",
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  textTransform: "none",
  padding: theme.spacing(0.5, 0),
  minWidth: "auto",
  "&:hover": {
    backgroundColor: "transparent",
    textDecoration: "underline",
  },
  "&.Mui-disabled": {
    color: theme.palette.text.disabled,
  },
}));

// List view table wrappers
export const ListTableWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  overflow: "hidden",
}));

export const ListTableRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isHeader",
})<{ isHeader?: boolean }>(({ theme, isHeader }) => ({
  display: "grid",
  gridTemplateColumns: "40px 2fr 1.2fr 1.4fr 1.2fr 1.2fr 1.4fr",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: isHeader ? theme.palette.grey[50] : theme.palette.background.paper,
  "&:last-child": { borderBottom: "none" },
  gap: theme.spacing(1),
}));

export const ListCellText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isHeader",
})<{ isHeader?: boolean }>(({ theme, isHeader }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: isHeader
    ? theme.typography.fontWeights.medium
    : theme.typography.fontWeights.regular,
  color: isHeader ? theme.palette.text.secondary : theme.palette.text.primary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const ListActionButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#093F84",
  textTransform: "none",
  padding: theme.spacing(0.25, 0),
  minWidth: "auto",
  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
  "&.Mui-disabled": { color: theme.palette.text.disabled },
}));

export const PersonalDocumentsPromptRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 0, 0),
  cursor: "pointer",
}));

export const PersonalDocumentsInlineTrigger = styled(Button)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.background.buttonbackground,
  padding: 0,
  minWidth: "auto",
  border: "none",
  backgroundColor: "transparent",
  // textDecoration: "underline",
  textUnderlineOffset: "0.15em",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: "transparent",
    textDecorationThickness: "2px",
    textDecoration: "underline",
  },
}));

export const PersonalDocumentsPromptContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

export const PersonalDocumentsPromptTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.primary.main,
}));

export const PersonalDocumentsPromptSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.tertiary,
}));

export const PersonalDocumentsPromptArrow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{ expanded?: boolean }>(({ theme, expanded }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.primary.main,
  transition: "transform 0.2s ease",
  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
}));

export const PersonalDocumentsSectionCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  padding: theme.spacing(3,5),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
}));

export const PersonalDocumentsSectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.75),
}));

export const PersonalDocumentsSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const PersonalDocumentsSectionDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.tertiary,
}));

export const PersonalDocumentsUploadGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 7fr) minmax(0, 3fr)",
  gap: theme.spacing(2.5),
  alignItems: "stretch",
  "@media (max-width: 900px)": {
    gridTemplateColumns: "1fr",
  },
}));

const personalDocumentTileBase = (theme: any) => ({
  minHeight: "150px",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: theme.spacing(1.5),
  transition: "background-color 0.2s ease, border-color 0.2s ease",
});

export const PersonalDocumentsDropzone = styled(Box)(({ theme }) => ({
  ...personalDocumentTileBase(theme),
  border: `2px dashed #62B1FF`,
  background: "linear-gradient(92.02deg, #FFFFFF 59.73%, #B5DAF8 174.34%)",
  cursor: "pointer",
  "&:hover": {
    border: `2px dashed #62B1FF`,
    background: "linear-gradient(92.02deg, #FFFFFF 59.73%, #B5DAF8 174.34%)",
  },
}));

export const PersonalDocumentsDropzoneIcon = styled(Box)(({ theme }) => ({
  width: theme.spacing(7),
  height: theme.spacing(7),
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(201, 230, 14, 0.08)",
  color: theme.palette.primary.main,
  flexShrink: 0,
}));

export const PersonalDocumentsDropzoneTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const PersonalDocumentsDropzoneSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.tertiary,
}));

export const PersonalDocumentsHiddenInput = styled("input")(() => ({
  display: "none",
}));

export const PersonalDocumentsSelectedList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.25),
  width: "70%",
}));

export const PersonalDocumentsSelectedItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(1.5),
  background: "linear-gradient(92.02deg, #FFFFFF 59.73%, #B5DAF8 174.34%)",
  border: "1px solid #62B1FF",
}));

export const PersonalDocumentsSelectedItemInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  minWidth: 0,
}));

export const PersonalDocumentsSelectedItemName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const PersonalDocumentsSelectedItemMeta = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.tertiary,
}));

export const PersonalDocumentsRemoveButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.error.main,
  "&:hover": {
    backgroundColor: "rgba(211, 47, 47, 0.08)",
  },
}));

export const PersonalDocumentsActionRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const PersonalDocumentsUploadButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#093F84",
  color: theme.palette.common.white,
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.medium,
  padding: theme.spacing(1.25, 3),
  borderRadius: theme.spacing(1.5),
  marginRight: theme.spacing(10),
  "&:hover": {
    backgroundColor: "#072d5f",
  },
  "&.Mui-disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,
  },
}));

export const PersonalDocumentsUploadedList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.25),
}));

export const PersonalDocumentsUploadedItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  padding: theme.spacing(1.75, 2),
  borderRadius: theme.spacing(1.5),
  backgroundColor: "#EAF4FF",
  border: `1px solid ${theme.palette.primary.light}`,
  minHeight: theme.spacing(10),
}));

export const PersonalDocumentsUploadedMeta = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

export const PersonalDocumentsUploadedFileIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: theme.spacing(5),
  height: theme.spacing(5),
  borderRadius: theme.spacing(1.25),
  backgroundColor: theme.palette.common.white,
  color: theme.palette.primary.main,
  flexShrink: 0,
}));

export const PersonalDocumentsUploadedDownload = styled(Button)(({ theme }) => ({
  textTransform: "none",
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.medium,
  minWidth: "auto",
  padding: theme.spacing(0.5, 0),
  "&:hover": {
    backgroundColor: "transparent",
    textDecoration: "underline",
  },
}));
