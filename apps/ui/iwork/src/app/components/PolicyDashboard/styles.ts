import { Box, styled, Typography } from "@mui/material";

export const TableHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
}));

export const NewsLinkSection = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(7.5),
  "@media (max-width: 1099px)": {
    flexDirection: "column",
  },
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  "& .clickable-cell": {
    cursor: "pointer",
    color: theme.palette.text.linkBlue,
  },
  "@media (max-width: 1099px)": {
    flexDirection: "column",
  },
}));
