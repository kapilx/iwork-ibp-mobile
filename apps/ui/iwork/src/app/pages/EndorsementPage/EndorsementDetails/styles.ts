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
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(3),
  boxShadow: theme.shadows[7],
  top: theme.spacing(4), // leaves room for any fixed headers / breadcrumbs
  maxHeight: `calc(100vh - ${theme.spacing(8)})`,
  overflowY: "auto",
  paddingRight: theme.spacing(0),
  background: theme.palette.background.paper,
  // Smooth scrollbars on Webkit
  "::-webkit-scrollbar": { width: 8 },
  "::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.action.hover,
    borderRadius: 8,
  },
}));

export const StepperColumnWrapper = styled(Box)(({ theme }) => ({
  position: "sticky",
  height: "fit-content",
  width: "380px",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  top: "20px",
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

export const LoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  minHeight: "600px",
  backgroundColor: theme.palette.background.paper,
}));

export const NestedStepperLoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  minWidth: "280px",
  minHeight: "472px",
  backgroundColor: theme.palette.background.paper,
}));

export const InstructionsTitle = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: "bold",
  color: theme.palette.primary.main,
  padding: theme.spacing(5, 0, 0, 5),
}));

export const InstructionsList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingLeft: theme.spacing(5),
  paddingRight: theme.spacing(5),
  paddingBottom: theme.spacing(3),
  margin: 0,
  listStyle: "none",
}));

export const InstructionItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "start",
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.primary.main,
  fontWeight: theme.typography.fontWeights.medium,
  gap: theme.spacing(1.5),
}));

export const InstructionDot = styled(Box)(({ theme }) => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: theme.palette.text.primary,
  flexShrink: 0,
  marginTop: "10px",
}));
