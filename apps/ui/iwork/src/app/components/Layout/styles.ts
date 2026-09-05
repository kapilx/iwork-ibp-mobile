import { Box, styled } from "@mui/material";
import { LoaderOverlay } from "@ui/ui-lib";

export const LayoutContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  height: "100vh",
  backgroundColor: theme.palette.background.default,
  padding: 0,
}));

export const SidebarWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  overflowY: "auto",
}));

interface ContentContainerProps {
  $isLoading?: boolean;
}

export const ContentContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isLoading",
})<ContentContainerProps>(({ theme, $isLoading }) => ({
  flex: 1,
  overflowX: "hidden",
  position: "relative",
  backgroundColor: theme.palette.background.paper,
  marginTop: theme.spacing(13),
  borderTopLeftRadius: theme.shape.borderRadii.normal,
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.secondary.border}`,
  borderTop: `${theme.shape.borderSizes.thin} solid ${theme.palette.secondary.border}`,
  borderTopRightRadius: theme.shape.borderRadii.normal,
  boxShadow: theme.shadows[14],
  minHeight: `calc(100vh - ${theme.spacing(13)})`,
  overflow: $isLoading ? "hidden" : "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
}));

export const RightSidebarWrapper = styled(Box)(({ theme }) => ({
  width: "5px",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  position: "relative",
  "& img": {
    position: "absolute",
    width: "32px",
    height: "32px",
    objectFit: "cover",
    display: "block",
    right: "5px",
  },
}));

export const StyledOutlet = styled(Box)(() => ({
  flex: "1 1 auto",
  width: "100%",
  display: "flex",
  flexDirection: "column",
}));

export const BlockingLoaderOverlay = styled(LoaderOverlay)(({ theme }) => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "all",
  zIndex: theme.zIndex.modal,
}));
