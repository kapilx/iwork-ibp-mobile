import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const PageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 1000,
}));

export const ActionsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

// kept for potential reuse
export const AssignRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: `${theme.spacing(1)} 0`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-child": { borderBottom: "none" },
}));

export const RecordName = styled(Typography)({
  flex: 1,
  fontSize: "0.875rem",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const SectionTitle = styled(Typography)(() => ({
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
}));
