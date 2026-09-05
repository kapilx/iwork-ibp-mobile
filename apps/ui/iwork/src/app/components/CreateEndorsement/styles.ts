import { Box, styled, Typography } from "@mui/material";

interface LinkTypographyProps {
  disable?: boolean;
}

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(4, 0),
  flexDirection: "column",
  justifyContent: "space-between",
  // height: "calc(100vh - 60px)",
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  gap: theme.spacing(6),
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(6),
  gap: theme.spacing(5),
}));

export const LogoLabelContainer = styled(Box)<LinkTypographyProps>(
  ({ theme, disable }) => ({
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
    cursor: disable ? "not-allowed" : "pointer",
    opacity: disable ? 0.5 : 1,
  })
);

export const LabelTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
}));

export const LinkTypography = styled(Typography)<LinkTypographyProps>(
  ({ theme, disable }) => ({
    fontWeight: theme.typography.fontWeights.medium,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.palette.button.secondary,
  })
);

export const Styledspan = styled("span")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.md,
}));
