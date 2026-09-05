import { Box, styled, Typography } from "@mui/material";

export const InsurerContactPageStyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
}));

export const TableWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  paddingLeft: theme.spacing(4),
  paddingTop: theme.spacing(7),
}));

export const StyledCustomTabs = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));
