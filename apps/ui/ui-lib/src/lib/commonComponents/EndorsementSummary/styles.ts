import { Box, styled, Typography } from "@mui/material";

export const MainContainer = styled(Box)<{ styling?: React.CSSProperties }>(
  ({ theme, styling }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(6),
    padding: theme.spacing(5),
    boxShadow: theme.shadows[7],
    borderRadius: theme.spacing(3),
    borderLeft: `4px solid ${
      styling?.borderColor || theme.palette.primary.main
    }`,
    width: "100%",
    maxWidth: "860px",
    ...styling,
  })
);

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  // Use CSS grid for consistent card sizing and cleaner wrapping
  display: "grid",
  width: "100%",
  gap: theme.spacing(2),
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  alignItems: "stretch",
}));

export const CardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  padding: theme.spacing(4),
  flexDirection: "column",
  gap: theme.spacing(1),
  backgroundColor: theme.palette.background.tableHeader,
  borderRadius: theme.spacing(3),
}));

export const CardLabelTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.labelColor,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const CardValueTypography = styled(Typography)<{ valueColor: string }>(
  ({ theme, valueColor }) => ({
    fontSize: theme.typography.fontSizes.lg,
    color: valueColor || theme.palette.text.primary,
    fontWeight: theme.typography.fontWeights.semiBold,
  })
);

export const IconContainer = styled("img")(({ theme }) => ({
  width: "20px",
  height: "20px",
}));

export const TitleTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const WarningIconImg = styled('img')(({ theme }) => ({
  marginLeft: theme.spacing(1),
  verticalAlign: 'middle',
  width: 20,
  height: 20,
  cursor: 'pointer',
}));
