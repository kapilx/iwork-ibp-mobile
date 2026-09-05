import { Box, styled } from "@mui/material";

export const StyledPolicyTypeContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  minHeight: 400,
  padding: theme.spacing(2),
}));

export const StyledPolicyTypeLayout = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 74%) minmax(260px, 26%)",
  gap: theme.spacing(2),
  alignItems: "start",
  minHeight: 400,
  [`@media (max-width:${theme.breakpoints.values.md}px)`]: {
    gridTemplateColumns: "1fr",
  },
}));

export const StyledChartPane = styled(Box)({
  minWidth: 0,
});

export const StyledRightPane = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

export const StyledPieChartWrapper = styled(Box)({
  width: "100%",
  height: 400,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
});

export const StyledHoverCard = styled(Box)(({ theme }) => ({
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.text.neutralwhite}`,
  borderRadius: theme.shape.borderRadii.medium,
  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.cardGradientEnd} 100%)`,
  padding: theme.spacing(2),
  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
  minHeight: 180,
}));

export const StyledHoverTitle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
}));

export const StyledHoverEyebrow = styled(Box)(({ theme }) => ({
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: theme.palette.text.lightGrey,
  marginBottom: theme.spacing(0.5),
}));

export const StyledHoverName = styled(Box)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 800,
  lineHeight: 1.2,
  color: theme.palette.text.darkNavy,
}));

export const StyledHoverPercent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.75, 1.25),
  borderRadius: 999,
  background: `linear-gradient(135deg, ${theme.palette.background.lightBlueActive} 0%, ${theme.palette.background.tabsSelected} 100%)`,
  color: theme.palette.text.darkNavy,
  fontSize: "14px",
  fontWeight: 800,
  whiteSpace: "nowrap",
}));

export const StyledHoverGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1.5),
  borderTop: `${theme.shape.borderSizes.thin} solid ${theme.palette.text.neutralwhite}`,
}));

export const StyledHoverLabel = styled(Box)(({ theme }) => ({
  color: theme.palette.text.lightGrey,
  fontSize: "13px",
  fontWeight: 600,
}));

export const StyledHoverValue = styled(Box)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: "13px",
  fontWeight: 800,
  textAlign: "right",
}));

export const StyledNoData = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "400px",
  fontSize: "16px",
  color: theme.palette.text.mediumGrey,
  fontWeight: 500,
}));

export const StyledLegendCard = styled(Box)(({ theme }) => ({
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.text.neutralwhite}`,
  borderRadius: theme.shape.borderRadii.medium,
  background: theme.palette.background.paper,
  padding: theme.spacing(1.5),
  maxHeight: 215,
  overflowY: "auto",
}));

export const StyledLegendList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const StyledLegendItem = styled(Box)<{ $active?: boolean }>(
  ({ theme, $active }) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    cursor: "pointer",
    borderRadius: theme.shape.borderRadii.small,
    padding: theme.spacing(0.75, 1),
    transition: "background-color 140ms ease, border-color 140ms ease",
    backgroundColor: $active
      ? theme.palette.background.lightBlueHover
      : "transparent",
    border: `${theme.shape.borderSizes.thin} solid ${
      $active ? theme.palette.background.lightBlueActive : "transparent"
    }`,
  })
);

export const StyledLegendDot = styled(Box)<{ $color: string; $active?: boolean }>(
  ({ $color, $active }) => ({
    width: $active ? 12 : 10,
    height: $active ? 12 : 10,
    borderRadius: 999,
    backgroundColor: $color,
    flexShrink: 0,
    boxShadow: $active ? `0 0 0 2px rgba(255,255,255,0.9)` : "none",
    transition: "width 120ms ease, height 120ms ease, box-shadow 120ms ease",
  })
);

export const StyledLegendText = styled(Box)<{ $active?: boolean }>(
  ({ theme, $active }) => ({
    color: $active ? theme.palette.text.darkNavy : theme.palette.text.mediumGrey,
    fontSize: "13px",
    fontWeight: $active ? 700 : 600,
    lineHeight: 1.2,
    overflowWrap: "anywhere",
    transition: "color 140ms ease, font-weight 140ms ease",
  })
);
