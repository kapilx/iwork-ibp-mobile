import { styled } from "@mui/material";
import Box from "@mui/material/Box";

export const ManageQuotesListingContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "18px 24px",
  "& .clickable-cell": {
    cursor: "pointer",
    color: "#1976d2",
    textDecoration: "underline",
  },
});
