import { theme } from "@ui/ui-lib";
import { Box, styled, Typography } from "@mui/material";

export const TableContainer = styled(Box)(({ theme }) => ({
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(3),
  width: "100%",
  boxShadow: theme.shadows[1],
}));

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  // flex-end instead of center: identical for single-line headers (every
  // existing consumer), but keeps the action buttons aligned with the actual
  // inputs (not the labels above them) when headerSearchSlot is a taller,
  // labeled field group (e.g. RO Enhanced's company/owner toolbar).
  alignItems: "flex-end",
  marginBottom: theme.spacing(8),

  [theme.breakpoints.down(1200)]: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(2),
  },
}));

export const RefreshButtonContainer = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ActionButtonsContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(4),

  [theme.breakpoints.down(1200)]: {
    flexWrap: "wrap",
  },
}));

export const SubTitle = styled(Typography)(() => ({
  marginTop: theme.spacing(1),
}));

export const SelectionSummaryContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.lightBlue,
  borderRadius: theme.shape.borderRadii.medium,
  marginBottom: theme.spacing(6),
  gap: theme.spacing(4),
}));

export const SelectionSummaryText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.black,
  fontWeight: 500,
}));

export const SelectionSummaryActions = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));
