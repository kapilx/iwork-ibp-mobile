import { Box, styled, Typography } from "@mui/material";

// Styled Container
export const InsurerContactListingStyledContainer = styled(Box)(
  ({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: theme.spacing(4),

    ".clickable-cell": {
      cursor: "pointer",
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
  })
);

export const KPICardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "10px",
  marginBottom: theme.spacing(4),
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));
