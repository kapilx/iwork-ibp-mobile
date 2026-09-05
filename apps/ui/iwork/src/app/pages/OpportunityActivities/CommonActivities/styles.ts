import { Box, LinearProgress, styled, Typography } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const CommonActivitiesMainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const ActivitiesButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(2),
  justifyContent: "flex-end",
  marginTop: theme.spacing(6),
}));

export const StyledMandateText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.light,
}));

export const MandateLabelContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const LoaderContainer = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export const ValidationButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "12px",
  width: "100%",
  maxWidth: "860px",
  marginBottom: "16px",
}));
export const ValidateButton = styled(Button)(({ theme }) => ({
  width: "100%",
  minWidth: "220px",
}));

export const StyledRfpDataCollectionContainer = styled(Box)(({ theme }) => ({
  flexDirection: "column",
  display: "flex",
  "& .MuiGrid-root": {
    minWidth: "300px",
    maxWidth: "unset",
  },
}));

export const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  width: "575px",
  margin: theme.spacing(2, 0),
}));

export const ExportPDFButton = styled(Button)(({ theme }) => ({
  width: "100%",
  maxWidth: "220px",
}));

export const CommonTableContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

export const TasksTableTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  marginLeft: theme.spacing(1),
}));

export const TasksContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

export const QuotationModalContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 0),
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
}));

export const PolicyDocDiffHelperText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "matched",
})<{ matched: boolean }>(({ theme, matched }) => ({
  fontSize: "0.75rem",
  fontWeight: 500,
  fontStyle: "normal",
  marginTop: theme.spacing(0.5),
  color: matched ? theme.palette.success.main : theme.palette.error.main,
}));

export const HandoverBox = styled(Box)(({ theme }) => ({
  margin: "0 auto",
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3, 4),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.neutral.tableHeader,
  border: `1px solid ${theme.palette.neutral.tableBorder}`,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
}));