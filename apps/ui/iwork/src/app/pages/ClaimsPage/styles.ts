import { Box, styled, Typography } from "@mui/material";

export const EndorsementProcessContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  marginTop: theme.spacing(4),
  // Allow the left side (process wrapper) to scroll while keeping stepper visible
  alignItems: "flex-start",
}));

export const RenderEndorsementRequestComponent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const NestedStepperWrapper = styled(Box)(({ theme }) => ({
  height: "fit-content",
  width: "380px",
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(3),
  boxShadow: theme.shadows[7],
  position: "sticky",
  top: theme.spacing(4), // leaves room for any fixed headers / breadcrumbs
  maxHeight: `calc(100vh - ${theme.spacing(8)})`,
  overflowY: "auto",
  background: theme.palette.background.paper,
  // Smooth scrollbars on Webkit
  "::-webkit-scrollbar": { width: 8 },
  "::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.action.hover,
    borderRadius: 8,
  },
}));

export const SubContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const SubContentTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightBold,
  fontSize: theme.typography.fontSizes.xl,
}));

export const SubContentCardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  marginTop: theme.spacing(4),
  gap: theme.spacing(4),
}));

export const BreadCrumbWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  marginBottom: theme.spacing(5),
}));

export const TitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "center",
  marginBottom: theme.spacing(7),
  marginTop: theme.spacing(1),
}));

export const EndorsementDocTitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "center",
  marginTop: theme.spacing(1),
}));

export const TitleTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightBold,
  fontSize: theme.typography.fontSizes.xl,
}));

export const TitleIconContainer = styled("img")(({ theme }) => ({
  height: 20,
  width: 20,
}));

export const SubTitleTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightMedium,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.disabled,
}));

export const TitleAndSubTitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(10),
  marginTop: theme.spacing(1),
}));

export const SelectDocumentsToSendToClientContainer = styled(Box)(
  ({ theme }) => ({
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
  })
);

export const CardsHolderContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  width: "100%",
  height: "fit-content",
  gap: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

export const ContentHolder = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const LabelTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.lg,
  color: theme.palette.text.disabled,
}));

export const ValueTypography = styled(Typography)<{
  styling?: React.CSSProperties;
}>(({ theme, styling }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xll,
  color: styling?.color || styling?.borderColor || theme.palette.text.primary,
}));

// export const LoaderContainer = styled(Box)(({ theme }) => ({
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   width: "100%",
//   minHeight: "600px",
//   backgroundColor: theme.palette.background.paper,
// }));

// Refresh status + button wrapper (replaces inline styles)
export const RefreshWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  marginTop: theme.spacing(2),
}));

export const RefreshControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const RefreshStatusText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#c57e1cff",
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

export const RefreshHeaderTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
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
}));

export const LoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  flex: 1,
  minHeight: 200, // fallback height when parent has no height yet
  padding: theme.spacing(4),
  "& > *": {
    flexShrink: 0,
  },
}));

export const ClaimsDataContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: theme.spacing(5),
  maxWidth: "860px",
  marginTop: theme.spacing(4),
}));

export const ClaimsCardWrapper = styled(Box)<{
  borderColor?: string;
}>(({ theme, borderColor }) => ({
  borderColor: borderColor || theme.palette.divider,
  height: "110px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));
