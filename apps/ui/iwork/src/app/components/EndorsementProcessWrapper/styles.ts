import { Box, styled, Typography } from "@mui/material";

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),
  gap: theme.spacing(2),
  width: "100%",
  height: "100%",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[7],
}));

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(4),
}));

export const HolderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
}));

export const FooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(2),
  marginTop: "auto",
  width: "100%",
  background: theme.palette.background.paper,
}));

export const TitleTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightBold,
  fontSize: theme.typography.fontSizes.xl,
}));

export const SubtitleTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.disabled,
}));

export const RightButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const RightHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ClaimIdContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginRight: theme.spacing(2),
}));

export const ClaimIdLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  fontWeight: 600,
}));

export const ClaimIdValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  fontWeight: 500,
}));
