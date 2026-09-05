import { Box, styled, Typography } from "@mui/material";

// Styled Container
export const InsurerTableStyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(4, 0),

  ".clickable-cell": {
    cursor: "pointer",
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
  },
  ".titleContainer": {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  ".searchContainer": {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  ".right-aligned-cell": {
    textAlign: "right",
  },
}));

// Styled Title
export const StyledTitle = styled(Typography)(() => ({
  marginBottom: "16px",
  fontWeight: "bold",
  fontSize: "18px",
  color: "#333",
}));

export const KPICardContainer = styled(Box)`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
`;
export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));
