import { styled } from "@mui/material/styles";
import { Button, DialogActions, DialogContent, DialogTitle, Box, Typography } from "@mui/material";

export const TermsDialogTitle = styled(DialogTitle)(() => ({
  fontWeight: 700,
  color: "#0369a1",
  paddingLeft: "10px",
  paddingRight: "10px",
}));

export const TermsDialogContent = styled(DialogContent)(({ theme }) => ({
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  paddingBottom: theme.spacing(2),
}));

export const TermsNoticeText = styled(Typography)(() => ({
  color: "#666",
  marginBottom: 16,
}));

export const TermsParagraphText = styled(Typography)(() => ({
  marginBottom: 16,
  color: "#333",
  lineHeight: 1.75,
}));

export const TermsSectionTitle = styled(Typography)(() => ({
  textTransform: "uppercase",
  fontWeight: 700,
  marginBottom: 8,
  color: "#0369a1",
}));

export const TermsContentScroll = styled(Box)(() => ({
  maxHeight: 420,
  overflowY: "auto",
  paddingRight: 8,
  "& *": {
    height: "auto !important",
    maxHeight: "none !important",
  },
}));

export const TermsDialogActions = styled(DialogActions)(() => ({
  justifyContent: "flex-end",
  gap: 12,
  paddingLeft: 24,
  paddingRight: 24,
  paddingBottom: 24,
  paddingTop: 0,
}));

export const TermsButton = styled(Button)(() => ({
  minWidth: 120,
  padding: "6px 16px",
  fontSize: "0.8125rem",
}));

export const DeclineButton = styled(TermsButton)(() => ({
  borderColor: "#d32f2f",
  color: "#d32f2f",
}));

export const AcceptButton = styled(TermsButton)(() => ({
  backgroundColor: "#0369a1",
  color: "#fff",
  "&:hover": {
    backgroundColor: "#025a96",
  },
}));
