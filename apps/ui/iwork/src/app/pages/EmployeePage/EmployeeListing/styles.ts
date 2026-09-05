import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  styled,
} from "@mui/material";

export const EmployeeListingWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(2),
  // AG Grid container styling
  "& .ag-root-wrapper": {
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
  },
  "& .ag-header-cell": {
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
  },
}));

export const EmployeeListingGridContainer = styled("div")(({ theme }) => ({
  width: "100%",
  height: "calc(100vh - 160px)", // Adjust based on your layout
  position: "relative",
}));

// AG Grid specific styled components
export const ActionsCell = styled("div")(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(0.75, 0, 0.25, 0),
  borderRadius: theme.shape.borderRadius,
  zIndex: 1,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
}));

export const ActionIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  transition: "all 0.2s",
  padding: theme.spacing(0.5),
  "&:hover": {
    transform: "scale(1.2)",
    backgroundColor: "transparent",
  },
}));

export const EditIconButton = styled(ActionIconButton)(({ theme }) => ({
  "&:hover": {
    color: theme.palette.neutral.dark,
  },
}));

export const DeleteIconButton = styled(ActionIconButton)({
  "&:hover": {
    color: "red",
  },
});

// AG Grid header alignment
export const RightAlignedHeader = styled("div")({
  "& .ag-header-cell-label": {
    justifyContent: "flex-end",
    paddingRight: "16px",
  },
});
export const EmployeeListingStyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: theme.spacing(4),

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
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

export const LoaderOverlay = styled("div")(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(255, 255, 255, 0.7)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
  gap: theme.spacing(2),
}));
