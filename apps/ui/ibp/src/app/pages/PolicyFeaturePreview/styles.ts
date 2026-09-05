import { Button } from "@ui/ui-lib";
import { Box, IconButton, Typography, styled } from "@mui/material";

export const PageWrapper = styled(Box)(() => ({
  width: "100%",
  backgroundColor: "#F5F6F8",
  height: "100vh",
  paddingTop: "54px",
  boxSizing: "border-box",
  overflow: "hidden",
}));

export const PreviewCard = styled(Box)({
  width: "100%",
  height: "100%",
  margin: "0 auto",
  backgroundColor: "#EBF6FF",
  boxShadow: "0px 4px 20px rgba(18, 40, 76, 0.12)",
  border: "1px solid #E8E8E8",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const PreviewHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 16px",
  borderBottom: "1px solid #E8E8E8",
  background: "#FFF"
}));

export const PreviewTitleGroup = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

export const PreviewIcon = styled("img")({
  width: "56px",
  height: "56px",
});

export const PreviewTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: "24px",
  fontWeight: 600,
  [theme.breakpoints.up("md")]: {
    fontSize: "28px",
  },
}));

export const PreviewBody = styled(Box)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  // padding: "16px",
  // [theme.breakpoints.up("md")]: {
  //   padding: "24px",
  // },
}));

export const CenteredState = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
});

export const EmptyState = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
});

export const EmptyStateMessage = styled(Box)({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "24px",
  boxSizing: "border-box",
});

export const EmptyStateActions = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
  padding: "20px 24px",
  backgroundColor: "#FFF",
  borderTop: "1px solid #E8E8E8",
});

export const LoadingState = styled(CenteredState)({
  gap: "12px",
});

export const DocumentPreviewWrapper = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const BackArrowButton = styled(IconButton)({
  color: "#093F84",
  padding: 0,
  "&:hover": {
    backgroundColor: "transparent",
  },
});
export const ViewButton = styled(Button)({
  backgroundColor: "#093F84",
  color: "#FFF",
});
