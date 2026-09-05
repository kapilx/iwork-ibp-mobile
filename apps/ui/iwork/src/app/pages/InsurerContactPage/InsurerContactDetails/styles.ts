import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

// Outer container
export const InsurerContactDetailsContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),

  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
}));

export const InsurerContactDetailsNoDataText = styled(Typography)(
  ({ theme }) => ({
    textAlign: "center",
    color: theme.palette.text.secondary,
  })
);
export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(5),
  "& .edit-button": {
    minWidth: "72px",
    gap: theme.spacing(1),
  },
}));
