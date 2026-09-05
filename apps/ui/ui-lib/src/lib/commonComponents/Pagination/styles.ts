import { Pagination, styled } from "@mui/material";

export const StyledPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-root": {
    borderRadius: theme.shape.borderRadii.small, // makes buttons square
  },
  "& .MuiPaginationItem-page": {
    backgroundColor: theme.palette.neutral.veryLight,
    color: theme.palette.text.primary,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.light,
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.neutral.veryLight,
      fontWeight: theme.typography.fontWeights.regular,
      borderRadius: theme.shape.borderRadii.small,
      "&:hover": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.neutral.veryLight,
        fontWeight: theme.typography.fontWeights.regular,
      },
    },
  },
  "& .MuiPaginationItem-previous, & .MuiPaginationItem-next": {
    backgroundColor: "transparent",
  },
}));

export const StyledPaginationIcon = styled("img")(({ theme }) => ({
  transform: "rotate(180deg)",
}));
