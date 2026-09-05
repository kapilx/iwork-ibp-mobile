
// Re-exports base shared tokens from the central HRPortal design system.
export {
  SectionCard,
  SectionTitle,
  StyledTable,
  StyledTh,
  StyledTd,
  StatusBadge,
  SearchBox,
  ActionButton,
  TabBar,
  TabItem,
  KPIGrid,
  KPICard,
  KPILabel,
  KPIValue,
  PrimaryButton,
} from "../HRPortal/styles";

import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

// ─── Shared section header (used by CDAccountsTable and CDTransactionsTable) ──
export const CDSectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1.75, 2.5),
  borderBottom: `1px solid ${theme.palette.neutral.tableBorder}`,
}));

export const CDSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.neutral.mediumDark,
}));


