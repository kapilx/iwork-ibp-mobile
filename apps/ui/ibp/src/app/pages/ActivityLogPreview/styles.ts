import { Box, Button, IconButton, Typography, styled } from "@mui/material";

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
  background: "#FFF",
}));

export const PreviewTitleGroup = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

export const PreviewTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: "24px",
  fontWeight: 600,
  [theme.breakpoints.up("md")]: {
    fontSize: "28px",
  },
  "@media(min-width:360px) and (max-width:768px)": {
    fontSize: "16px",
  },
}));

export const PreviewBody = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const CenteredState = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
});

export const LoadingState = styled(CenteredState)({
  gap: "12px",
});

export const HtmlPreviewFrame = styled("iframe")({
  flex: 1,
  width: "100%",
  border: "0",
  backgroundColor: "#FFFFFF",
});

export const BackArrowButton = styled(IconButton)({
  color: "#093F84",
  padding: 0,
  "&:hover": {
    backgroundColor: "transparent",
  },
});

export const DownloadPreviewButton = styled(Button)({
  textTransform: "none",
  borderRadius: "8px",
  border: "1px solid #093F84",
  color: "#093F84",
  fontWeight: 500,
});
