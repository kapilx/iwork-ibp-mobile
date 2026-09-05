import { Box, styled } from "@mui/material";

export const StyledServiceScoreContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  minHeight: 420,
  padding: theme.spacing(3),
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  borderRadius: theme.shape.borderRadii.medium,
  boxShadow: theme.shadows[1],
  boxSizing: "border-box",
}));

export const StyledServiceScoreFilterRow = styled(Box)(({ theme }) => ({
  maxWidth: 320,
  marginBottom: theme.spacing(1),
}));

export const StyledNoData = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "320px",
  fontSize: "14px",
  color: theme.palette.text.mediumGrey,
  fontWeight: 500,
  textAlign: "center",
}));
