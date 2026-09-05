import { styled, Typography, Box, Pagination } from "@mui/material";

export const HospitalCardsContainer = styled(Box)(({ theme }) => ({
  paddingBottom: theme.spacing(3),
  marginTop: theme.spacing(11.75),
  "@media (min-width: 769px) and (max-width: 1024px)": {
    marginTop: theme.spacing(6),
  },
  "@media (max-width: 768px)": {
    marginTop: theme.spacing(4),
  },
}));
export const CardsContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(0, 20.25),
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  minHeight: "300px",
  "@media (min-width: 769px) and (max-width: 1024px)": {
    padding: theme.spacing(0, 4),
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(0, 2),
    minHeight: "unset",
  },
}));

export const ResultsContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(370px, 1fr))",
  columnGap: theme.spacing(5),
  rowGap: theme.spacing(7.5),
  justifyContent: "flex-start",
  width: "100%",
  maxWidth: "none",
  margin: "0",
  "@media (max-width: 768px)": {
    gridTemplateColumns: "repeat(auto-fill, minmax(100%, 1fr))",
    rowGap: theme.spacing(4),
  },
}));

export const StyledPagination = styled(Pagination)(({ theme }) => ({}));

export const PaginationStack = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  paddingLeft: theme.spacing(6),
  paddingRight: theme.spacing(12.5),
}));

export const PaginationInfo = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSize.xss,
}));

export const PaginationButton = styled("button")<{
  selected?: boolean;
  disabled?: boolean;
  itemType?: "page" | "previous" | "next" | "start-ellipsis" | "end-ellipsis";
}>(({ theme, selected, disabled, itemType }) => ({
  minWidth: itemType === "page" ? "40px" : "auto",
  height: "40px",
  margin: "0 4px",
  padding: itemType === "previous" || itemType === "next" ? "8px 16px" : "8px",
  borderRadius: "8px",
  border:
    itemType === "start-ellipsis" || itemType === "end-ellipsis"
      ? "none"
      : `1px solid ${theme.palette.text.orangeButtonText}`,
  backgroundColor: selected
    ? theme.palette.text.orangeButtonText
    : theme.palette.background.paper,
  color: selected
    ? theme.palette.background.paper
    : theme.palette.text.orangeButtonText,
  fontWeight: theme.typography.fontWeights.medium,
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.3 : 1,
  "&:hover:not(:disabled)": {
    backgroundColor: selected
      ? theme.palette.text.deepOrangeColor
      : theme.palette.text.whiteShade,
    borderColor: theme.palette.text.orangeButtonText,
    color: selected ? theme.palette.text.paper : theme.palette.text.primary,
  },
}));

export const NoResultsText = styled(Typography)(({ theme }) => ({
  textAlign: "center",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  width: "100%",
}));

export const Loader = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "350px",
}));
