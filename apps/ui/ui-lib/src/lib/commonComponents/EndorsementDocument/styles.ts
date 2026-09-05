import { Box, styled, Typography } from "@mui/material";

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),
  boxShadow: theme.shadows[7],
  borderRadius: theme.spacing(3),
  borderLeft: `4px solid ${theme.palette.button.secondary}`,
  maxWidth: "860px",
  gap: theme.spacing(3),
}));

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const MainHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const HeaderTitleTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.bold,
}));

export const TitleTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.bold,
}));

export const SubtitleTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.disabled,
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: `1px solid ${theme.palette.neutral.light}`,
  padding: theme.spacing(4),
  borderRadius: theme.spacing(3),
  marginTop: theme.spacing(3),
  backgroundColor: theme.palette.background.light,
}));

export const FileNameAndIconHolder = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const FileNameAndUploadedOnContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const DownLoadIconHolder = styled("img")<{
  enableDownloadIcon?: boolean;
}>(({ theme, enableDownloadIcon }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "transform 0.2s",
  "&:hover": {
    transform: "scale(1.2)",
  },
  height: "24px",
  width: "24px",
  opacity: enableDownloadIcon ? 1 : 0.3,
  pointerEvents: enableDownloadIcon ? "auto" : "none",
  margin: '0px 8px',
}));

export const DocumentIconContainer = styled("img")(({ theme }) => ({
  height: "18px",
  width: "18px",
}));

export const RefreshContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginRight: theme.spacing(2.5),
  gap: theme.spacing(1.5),
  boxShadow: theme.shadows[7],
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

export const RefreshStatusText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#c57e1cff",
}));

export const RefreshControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const RefreshSpinner = styled("img")(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
  width: 18,
  height: 18,
  animation: "spin 1.8s linear infinite",
  "@keyframes spin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(-360deg)" },
  },
}));
