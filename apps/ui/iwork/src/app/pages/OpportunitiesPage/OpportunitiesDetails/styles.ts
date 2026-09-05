import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Button } from "@ui/ui-lib";

// Outer container
export const Container = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),

  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
  ".clickable-cell": {
    cursor: "pointer",
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
}));
export const Buttons = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));
export const EditButton = styled(Button)(({ theme }) => ({
  minWidth: "72px",
  gap: theme.spacing(1),
}));

export const ItemContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: `${theme.spacing(1)} !important`,
}));

export const LoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "300px",
}));

export const OpportunitiesDetailsStyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5, 0),
}));
