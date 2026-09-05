import { Button } from "@ui/ui-lib";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const PolicyDocumentCardContainer = styled(Box)(({ theme }) => ({
  borderRadius: "12px",
  backgroundColor: theme.palette.background.paper,
  border: "1px solid #CACBCC",
  width: "300px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  flexShrink: 0,
  gap:"10px",
}));

export const PolicyDocumentCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  padding: theme.spacing(2.5, 2.5, 0),
}));

export const PolicyDocumentIcon = styled("img")(() => ({
  flexShrink: 0,
  width: "45px",
  height: "45px",
  objectFit: "contain",
  borderRadius: "8px",
  padding: "6px",
  backgroundColor: "#FFFFFF",
  boxShadow: "0px 2px 8px rgba(16, 24, 40, 0.12)",
}));

export const CardTitleBlock = styled(Box)(() => ({
  flex: 1,
  overflow: "hidden",
  minWidth: 0,
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.LightDark,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "150px",
}));

export const SubtitleText = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.tertiary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "150px",
  marginTop: "2px",
}));

export const CardThumbnail = styled(Box, {
  shouldForwardProp: (prop) => prop !== "gradient",
})<{ gradient?: string }>(({ gradient }) => ({
  width: "100%",
  height: "120px",
  marginTop: "12px",
  background: gradient ?? "linear-gradient(135deg, #E8D5C0 0%, #C9A882 100%)",
  flexShrink: 0,
}));

export const PolicyDocumentMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  padding: theme.spacing(1.5, 2.5, 0),
}));

export const DateContainer = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.grayGradient,
  flexShrink: 0,
}));

export const DateText = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.LightDark,
}));

export const PolicyDocumentFileNameRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1.5, 2.5, 0),
  minWidth: 0,
}));

export const FileNameText = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.LightDark,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
}));

export const CardActionRow = styled(Box)(() => ({
  display: "flex",
  alignItems: "stretch",
  gap: 0,
  padding: 0,
  marginTop: "auto",
  borderTop: "1px solid #EAECF0",
}));

export const CardActionLink = styled("button", {
  shouldForwardProp: (prop) => prop !== "$disabled",
})<{ $disabled?: boolean }>(({ $disabled }) => ({
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  background: "none",
  border: "none",
  cursor: $disabled ? "not-allowed" : "pointer",
  padding: "14px 0",
  fontSize: "12px",
  fontWeight: 500,
  color: $disabled ? "#BDBDBD" : "#093F84",
  opacity: $disabled ? 0.5 : 1,
  "&:not(:last-of-type)": {
    borderRight: "1px solid #EAECF0",
  },
  "&:hover": {
    textDecoration: $disabled ? "none" : "underline",
  },
}));

// kept for backward compat (ECardPage uses it)
export const PolicyDocumentActionButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "$isAvailable",
})<{ $isAvailable: boolean }>(({ theme, $isAvailable }) => ({
  marginTop: "auto",
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.25),
  fontWeight: 400,
  backgroundColor: $isAvailable
    ? theme.palette.text.secondary
    : theme.palette.action.disabledBackground,
  border: $isAvailable
    ? `1px solid #093F84`
    : `1px solid ${theme.palette.action.disabledBackground}`,
  color: $isAvailable ? "#093F84" : theme.palette.text.disabled,
  "&:hover": {
    backgroundColor: $isAvailable
      ? "#093F84"
      : theme.palette.action.disabledBackground,
    color: $isAvailable
      ? theme.palette.text.secondary
      : theme.palette.action.disabledBackground,
  },
  "&.Mui-disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,
  },
}));

